import {
  getPacmanCellEffects,
  getPacmanPath,
  getVisibleRowValues,
  isPacmanCellRevealed,
} from './pacman'

test('builds a snake path across the grid cells', () => {
  expect(getPacmanPath(3, 5)).toEqual([
    { rowIndex: 0, colIndex: 0 },
    { rowIndex: 0, colIndex: 1 },
    { rowIndex: 0, colIndex: 2 },
    { rowIndex: 0, colIndex: 3 },
    { rowIndex: 0, colIndex: 4 },
    { rowIndex: 1, colIndex: 4 },
    { rowIndex: 1, colIndex: 3 },
    { rowIndex: 1, colIndex: 2 },
    { rowIndex: 1, colIndex: 1 },
    { rowIndex: 1, colIndex: 0 },
    { rowIndex: 2, colIndex: 0 },
    { rowIndex: 2, colIndex: 1 },
    { rowIndex: 2, colIndex: 2 },
    { rowIndex: 2, colIndex: 3 },
    { rowIndex: 2, colIndex: 4 },
  ])
})

test('maps current row values with locked chain cells in their visual column', () => {
  expect(
    getVisibleRowValues({
      rowIndex: 1,
      guesses: [['s', 't', 'a', 'l', 'e']],
      currentGuess: ['a', 'b'],
    })
  ).toEqual(['a', 'b', undefined, undefined, 'e'])

  expect(
    getVisibleRowValues({
      rowIndex: 2,
      guesses: [
        ['s', 't', 'a', 'l', 'e'],
        ['e', 'a', 'r', 't', 'h'],
      ],
      currentGuess: ['o'],
    })
  ).toEqual(['e', 'o'])
})

test('detects whether the next pacman cell has been filled', () => {
  const guesses = [['s', 't', 'a', 'l', 'e']]
  const currentGuess = ['a', 'b']

  expect(
    isPacmanCellRevealed({
      cell: { rowIndex: 1, colIndex: 4 },
      guesses,
      currentGuess,
    })
  ).toBe(true)
  expect(
    isPacmanCellRevealed({
      cell: { rowIndex: 1, colIndex: 3 },
      guesses,
      currentGuess,
    })
  ).toBe(false)
})

test('marks eaten cells as hidden and places the actor on the current cell', () => {
  const effects = getPacmanCellEffects({
    path: getPacmanPath(1, 5),
    pathIndex: 2,
    actor: '🐇',
  })

  expect(effects).toEqual({
    '0:0': { hideLetter: true, actor: undefined },
    '0:1': { hideLetter: true, actor: undefined },
    '0:2': { hideLetter: true, actor: '🐇' },
  })
})
