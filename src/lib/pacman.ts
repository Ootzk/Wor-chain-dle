import { CONFIG } from '../constants/config'
import { getChainInfo } from './chain'
import {
  getGridCellKey,
  GridCell,
  GridCellEffect,
  GridCellEffects,
} from './gridEffects'
import { CharStatus, getGuessStatuses } from './statuses'

export type PacmanCell = GridCell
export type PacmanCellEffect = GridCellEffect
export type PacmanCellEffects = GridCellEffects

export type PacmanConfig = {
  actor: string
  stepMsByStatus: PacmanStepMsByStatus
  effect: 'hide-letter' | 'hide-letter-and-status'
}

export type PacmanStepMsByStatus = Record<CharStatus, number> & {
  default: number
}

export const getPacmanPath = (
  rows = CONFIG.tries,
  columns = CONFIG.wordLength
): PacmanCell[] =>
  Array.from({ length: rows }).flatMap((_, rowIndex) => {
    const colIndexes = Array.from({ length: columns }, (_, colIndex) =>
      rowIndex % 2 === 0 ? colIndex : columns - 1 - colIndex
    )
    return colIndexes.map((colIndex) => ({ rowIndex, colIndex }))
  })

export const getVisibleRowValues = ({
  rowIndex,
  guesses,
  currentGuess,
}: {
  rowIndex: number
  guesses: string[][]
  currentGuess: string[]
}): (string | undefined)[] => {
  if (rowIndex < guesses.length) return guesses[rowIndex]
  if (rowIndex > guesses.length) return []

  const chainInfo = getChainInfo(guesses)
  if (!chainInfo) return currentGuess

  if (chainInfo.position === 'first') {
    return [chainInfo.letter, ...currentGuess]
  }

  const values = [...currentGuess]
  values[CONFIG.wordLength - 1] = chainInfo.letter
  return values
}

export const isPacmanCellRevealed = ({
  cell,
  guesses,
}: {
  cell: PacmanCell
  guesses: string[][]
}) => {
  const guess = guesses[cell.rowIndex]
  return !!guess?.[cell.colIndex]
}

export const getPacmanCellStatus = ({
  cell,
  guesses,
  solution,
}: {
  cell: PacmanCell
  guesses: string[][]
  solution: string
}): CharStatus | undefined => {
  const guess = guesses[cell.rowIndex]
  if (!guess) return undefined
  return getGuessStatuses(guess, solution)[cell.colIndex]
}

export const getPacmanStepMs = ({
  cell,
  guesses,
  solution,
  stepMsByStatus,
}: {
  cell?: PacmanCell
  guesses: string[][]
  solution: string
  stepMsByStatus: PacmanStepMsByStatus
}) => {
  if (!cell) return stepMsByStatus.default

  const status = getPacmanCellStatus({ cell, guesses, solution })
  return status ? stepMsByStatus[status] : stepMsByStatus.default
}

export const getPacmanCellEffects = ({
  path,
  pathIndex,
  actor,
  effect = 'hide-letter',
}: {
  path: PacmanCell[]
  pathIndex: number
  actor: string
  effect?: PacmanConfig['effect']
}): PacmanCellEffects => {
  if (pathIndex < 0) return {}

  return Object.fromEntries(
    path.slice(0, pathIndex + 1).map((cell, index) => [
      getGridCellKey(cell),
      {
        hideLetter: true,
        hideStatus: effect === 'hide-letter-and-status' ? true : undefined,
        actor: index === pathIndex ? actor : undefined,
      },
    ])
  )
}
