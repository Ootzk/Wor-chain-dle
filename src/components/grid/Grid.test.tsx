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
    />
  )

  expect(getRow(container, 1)).toHaveTextContent('e')

  rerender(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      isGameComplete
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
      hideLetters
    />
  )

  expect(getRow(container, 0)).toHaveTextContent('crane')
  expect(
    getRow(container, 0).querySelectorAll('span.text-transparent')
  ).toHaveLength(5)
})

test('shows a cursor on the active transparent-letter cell', () => {
  const { container } = render(
    <Grid guesses={[]} currentGuess={['c', 'r']} solution="crane" hideLetters />
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

test('shows the transparent-letter toggle beside the final row', () => {
  const onToggleHideLetters = jest.fn()
  const { getByLabelText } = render(
    <Grid
      guesses={[winningGuess]}
      currentGuess={[]}
      solution="crane"
      isGameComplete
      showHideLettersToggle
      onToggleHideLetters={onToggleHideLetters}
    />
  )

  fireEvent.click(getByLabelText('Toggle transparent letters'))

  expect(onToggleHideLetters).toHaveBeenCalledTimes(1)
})
