import { fireEvent, render } from '@testing-library/react'
import { Grid } from './Grid'

const winningGuess = ['c', 'r', 'a', 'n', 'e']

const getRow = (container: HTMLElement, rowIndex: number) => {
  const elementIndex = rowIndex * 2 + 1
  const row = container.querySelector(`.pb-6 > div:nth-child(${elementIndex})`)

  if (!row) {
    throw new Error(`Expected row ${rowIndex} to exist`)
  }

  return row
}

test('hides the next row chain letter after game completion', () => {
  const { container, rerender } = render(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      isGameComplete={false}
      viewMode="reveal"
    />
  )

  expect(getRow(container, 1)).toHaveTextContent('e')

  rerender(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      isGameComplete
      viewMode="reveal"
    />
  )

  expect(getRow(container, 0)).toHaveTextContent('crane')
  expect(getRow(container, 1)).not.toHaveTextContent('e')
})

test('hides board letters without removing them from the layout', () => {
  const { container } = render(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      viewMode="spoilerFree"
    />
  )

  expect(getRow(container, 0)).toHaveTextContent('crane')
  expect(
    getRow(container, 0).querySelectorAll('span.text-transparent')
  ).toHaveLength(5)
})

test('shows a cursor on the active transparent-letter cell', () => {
  const { container } = render(
    <Grid
      guesses={[]}
      currentGuess={['c', 'r']}
      solution="crane"
      viewMode="spoilerFree"
    />
  )

  expect(getRow(container, 0)).toHaveTextContent('cr')
  expect(
    getRow(container, 0).querySelectorAll('span.text-transparent')
  ).toHaveLength(2)
  expect(
    getRow(container, 0).querySelectorAll(
      '[data-testid="transparent-letter-cursor"]'
    )
  ).toHaveLength(1)
})

test('shows the view mode toggle beside the final row', () => {
  const onChangeViewMode = jest.fn()
  const { getByLabelText } = render(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      isGameComplete
      viewMode="reveal"
      showViewModeToggle
      onChangeViewMode={onChangeViewMode}
    />
  )

  fireEvent.click(getByLabelText('Change grid view mode'))

  expect(onChangeViewMode).toHaveBeenCalledWith('spoilerFree')
})

test('cycles through configured grid view modes', () => {
  const onChangeViewMode = jest.fn()
  const { getByLabelText } = render(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      isGameComplete
      viewMode="live"
      availableViewModes={['live', 'spoilerFree', 'reveal']}
      showViewModeToggle
      onChangeViewMode={onChangeViewMode}
    />
  )

  fireEvent.click(getByLabelText('Change grid view mode'))

  expect(onChangeViewMode).toHaveBeenCalledWith('spoilerFree')
})

test('live view applies cell effects while reveal view restores cells', () => {
  const cellEffects = {
    '0:0': {
      actor: '🐇',
      hideLetter: true,
      hideStatus: true,
    },
  }
  const { container, rerender } = render(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      viewMode="live"
      cellEffects={cellEffects}
    />
  )

  expect(
    container.querySelectorAll('[data-testid="pacman-actor"]')
  ).toHaveLength(1)
  expect(
    getRow(container, 0).querySelectorAll('span.text-transparent')
  ).toHaveLength(1)

  rerender(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      viewMode="reveal"
      cellEffects={cellEffects}
    />
  )

  expect(
    container.querySelectorAll('[data-testid="pacman-actor"]')
  ).toHaveLength(0)
  expect(
    getRow(container, 0).querySelectorAll('span.text-transparent')
  ).toHaveLength(0)
})
