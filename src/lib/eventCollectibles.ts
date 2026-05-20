import { CONFIG } from '../constants/config'
import { getGuessStatuses } from './statuses'
import { getGridCellKey, GridCellEffects, GridRowEffects } from './gridEffects'

export type EventCollectibleConfig = {
  id: string
  collectionId: string
  emoji: string
  targetRows: number[]
  collectStatus: 'correct'
  autoCollectRemainingOnWin: boolean
}

export type EventCollectibleTarget = {
  collectibleId: string
  collectionId: string
  emoji: string
  rowIndex: number
  colIndex: number
}

export type CollectedRowsByCollectible = Record<string, number[]>

const hashSeed = (seed: string) =>
  seed.split('').reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0
  }, 0)

const getTargetColumn = ({
  eventId,
  dateKey,
  collectibleId,
  rowIndex,
}: {
  eventId: string
  dateKey: string
  collectibleId: string
  rowIndex: number
}) =>
  hashSeed(`${eventId}:${dateKey}:${collectibleId}:${rowIndex}`) %
  CONFIG.wordLength

export const getEventCollectibleTargets = ({
  eventId,
  dateKey,
  collectibles,
}: {
  eventId: string
  dateKey: string
  collectibles: EventCollectibleConfig[]
}): EventCollectibleTarget[] =>
  collectibles.flatMap((collectible) =>
    collectible.targetRows.map((rowIndex) => ({
      collectibleId: collectible.id,
      collectionId: collectible.collectionId,
      emoji: collectible.emoji,
      rowIndex,
      colIndex: getTargetColumn({
        eventId,
        dateKey,
        collectibleId: collectible.id,
        rowIndex,
      }),
    }))
  )

const hasCollectedRow = (
  collectedRows: CollectedRowsByCollectible,
  target: EventCollectibleTarget
) => collectedRows[target.collectibleId]?.includes(target.rowIndex) ?? false

export const getCollectibleCellEffects = ({
  targets,
  collectedRows,
  submittedRows,
}: {
  targets: EventCollectibleTarget[]
  collectedRows: CollectedRowsByCollectible
  submittedRows: number
}): GridCellEffects =>
  Object.fromEntries(
    targets
      .filter((target) => target.rowIndex >= submittedRows)
      .filter((target) => !hasCollectedRow(collectedRows, target))
      .map((target) => [
        getGridCellKey(target),
        {
          marker: target.emoji,
        },
      ])
  )

export const getCollectibleRowEffects = ({
  targets,
  collectedRows,
}: {
  targets: EventCollectibleTarget[]
  collectedRows: CollectedRowsByCollectible
}): GridRowEffects =>
  targets.reduce<GridRowEffects>((effects, target) => {
    if (hasCollectedRow(collectedRows, target)) {
      effects[target.rowIndex] = { prefix: target.emoji }
    }
    return effects
  }, {})

export const getCollectibleProgressItemId = (rowIndex: number) =>
  `row_${rowIndex + 1}`

export const collectEventTargetsForSubmission = ({
  config,
  targets,
  submittedRowIndex,
  submittedGuess,
  solution,
  won,
  collectedRows,
}: {
  config: EventCollectibleConfig
  targets: EventCollectibleTarget[]
  submittedRowIndex: number
  submittedGuess: string[]
  solution: string
  won: boolean
  collectedRows: CollectedRowsByCollectible
}): number[] => {
  const previouslyCollected = new Set(collectedRows[config.id] ?? [])
  const collected = new Set<number>()
  const statuses = getGuessStatuses(submittedGuess, solution)

  targets
    .filter((target) => target.collectibleId === config.id)
    .forEach((target) => {
      if (previouslyCollected.has(target.rowIndex)) return

      if (
        target.rowIndex === submittedRowIndex &&
        statuses[target.colIndex] === config.collectStatus
      ) {
        collected.add(target.rowIndex)
      }

      if (
        won &&
        config.autoCollectRemainingOnWin &&
        target.rowIndex > submittedRowIndex
      ) {
        collected.add(target.rowIndex)
      }
    })

  return Array.from(collected).sort((a, b) => a - b)
}

export const mergeCollectedRows = (
  collectedRows: CollectedRowsByCollectible,
  collectibleId: string,
  rowIndexes: number[]
): CollectedRowsByCollectible => {
  if (rowIndexes.length === 0) return collectedRows

  const merged = new Set([
    ...(collectedRows[collectibleId] ?? []),
    ...rowIndexes,
  ])

  return {
    ...collectedRows,
    [collectibleId]: Array.from(merged).sort((a, b) => a - b),
  }
}
