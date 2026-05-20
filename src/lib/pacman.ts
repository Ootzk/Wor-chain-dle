import { CONFIG } from '../constants/config'
import { getChainInfo } from './chain'

export type PacmanCell = {
  rowIndex: number
  colIndex: number
}

export type PacmanCellEffect = {
  actor?: string
  hideLetter?: boolean
}

export type PacmanCellEffects = Record<string, PacmanCellEffect>

export type PacmanConfig = {
  actor: string
  stepMs: number
  effect: 'hide-letter'
}

export const getPacmanCellKey = ({ rowIndex, colIndex }: PacmanCell) =>
  `${rowIndex}:${colIndex}`

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
  currentGuess,
}: {
  cell: PacmanCell
  guesses: string[][]
  currentGuess: string[]
}) => {
  const rowValues = getVisibleRowValues({
    rowIndex: cell.rowIndex,
    guesses,
    currentGuess,
  })
  return !!rowValues[cell.colIndex]
}

export const getPacmanCellEffects = ({
  path,
  pathIndex,
  actor,
}: {
  path: PacmanCell[]
  pathIndex: number
  actor: string
}): PacmanCellEffects => {
  if (pathIndex < 0) return {}

  return Object.fromEntries(
    path.slice(0, pathIndex + 1).map((cell, index) => [
      getPacmanCellKey(cell),
      {
        hideLetter: true,
        actor: index === pathIndex ? actor : undefined,
      },
    ])
  )
}
