import { render } from '@testing-library/react'
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
