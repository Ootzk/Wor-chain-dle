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
      viewOptions={{ lettersHidden: false, liveEffectsEnabled: false }}
    />
  )

  expect(getRow(container, 1)).toHaveTextContent('e')

  rerender(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      isGameComplete
      viewOptions={{ lettersHidden: false, liveEffectsEnabled: false }}
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
      viewOptions={{ lettersHidden: true, liveEffectsEnabled: false }}
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
      viewOptions={{ lettersHidden: true, liveEffectsEnabled: false }}
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

test('shows the letter toggle beside the final row', () => {
  const onChangeViewOptions = jest.fn()
  const { getByLabelText, getByTestId } = render(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      isGameComplete
      viewOptions={{ lettersHidden: false, liveEffectsEnabled: false }}
      showLettersToggle
      onChangeViewOptions={onChangeViewOptions}
    />
  )

  expect(getByTestId('view-control-placeholder')).toBeInTheDocument()
  fireEvent.click(getByLabelText('Toggle letters'))

  expect(onChangeViewOptions).toHaveBeenCalledWith({
    lettersHidden: true,
    liveEffectsEnabled: false,
  })
})

test('orders live effects above the letter toggle', () => {
  const { container } = render(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      isGameComplete
      viewOptions={{ lettersHidden: false, liveEffectsEnabled: true }}
      showLettersToggle
      showLiveEffectsToggle
    />
  )

  expect(
    Array.from(container.querySelectorAll('button')).map((button) =>
      button.getAttribute('aria-label')
    )
  ).toEqual(['Toggle live effects', 'Toggle letters'])
})

test('shows the live effects toggle beside the final row', () => {
  const onChangeViewOptions = jest.fn()
  const { getByLabelText } = render(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      isGameComplete
      viewOptions={{ lettersHidden: false, liveEffectsEnabled: true }}
      showLiveEffectsToggle
      onChangeViewOptions={onChangeViewOptions}
    />
  )

  fireEvent.click(getByLabelText('Toggle live effects'))

  expect(onChangeViewOptions).toHaveBeenCalledWith({
    lettersHidden: false,
    liveEffectsEnabled: false,
  })
})

test('live effects apply cell effects while disabled effects restore cells', () => {
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
      viewOptions={{ lettersHidden: false, liveEffectsEnabled: true }}
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
      viewOptions={{ lettersHidden: false, liveEffectsEnabled: false }}
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
