import {
  getPacmanCellEffects,
  getPacmanPath,
  getPacmanStepMs,
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

test('detects whether the next pacman cell has been submitted', () => {
  const guesses = [['s', 't', 'a', 'l', 'e']]

  expect(
    isPacmanCellRevealed({
      cell: { rowIndex: 0, colIndex: 4 },
      guesses,
    })
  ).toBe(true)
  expect(
    isPacmanCellRevealed({
      cell: { rowIndex: 1, colIndex: 4 },
      guesses,
    })
  ).toBe(false)
})

test('uses status-specific stay times for evaluated cells', () => {
  const stepMsByStatus = {
    correct: 3000,
    present: 2000,
    absent: 1000,
    default: 500,
  }

  expect(
    getPacmanStepMs({
      cell: { rowIndex: 0, colIndex: 0 },
      guesses: [['s', 't', 'a', 'l', 'e']],
      solution: 'spear',
      stepMsByStatus,
    })
  ).toBe(3000)
  expect(
    getPacmanStepMs({
      cell: { rowIndex: 0, colIndex: 2 },
      guesses: [['s', 't', 'a', 'l', 'e']],
      solution: 'spear',
      stepMsByStatus,
    })
  ).toBe(2000)
  expect(
    getPacmanStepMs({
      cell: { rowIndex: 0, colIndex: 1 },
      guesses: [['s', 't', 'a', 'l', 'e']],
      solution: 'spear',
      stepMsByStatus,
    })
  ).toBe(1000)
  expect(
    getPacmanStepMs({
      cell: { rowIndex: 1, colIndex: 4 },
      guesses: [['s', 't', 'a', 'l', 'e']],
      solution: 'spear',
      stepMsByStatus,
    })
  ).toBe(500)
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

test('can hide both letters and evaluated status colors', () => {
  const effects = getPacmanCellEffects({
    path: getPacmanPath(1, 5),
    pathIndex: 1,
    actor: '🐇',
    effect: 'hide-letter-and-status',
  })

  expect(effects).toEqual({
    '0:0': { hideLetter: true, hideStatus: true, actor: undefined },
    '0:1': { hideLetter: true, hideStatus: true, actor: '🐇' },
  })
})
