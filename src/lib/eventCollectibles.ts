import { CONFIG } from '../constants/config'
import { getGuessStatuses } from './statuses'
import { getGridCellKey, GridCellEffects, GridRowEffects } from './gridEffects'

export type EventCollectibleConfig = {
  id: string
  collectionId: string
  emoji: string
  targetRows: number[]
  progressTargets?: Record<string, number>
  winBonusItemId?: string
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

export const SUMMER_GARDEN_CLOVER_COLLECTION_ID = 'v1.7.0-summer-garden-clover'
export const SUMMER_GARDEN_CLOVER_WIN_BONUS_ITEM_ID = 'win_bonus'

export const SUMMER_GARDEN_CLOVER_ROW_TARGETS: Record<string, number> = {
  row_2: 3,
  row_3: 7,
  row_4: 10,
  row_5: 15,
}

export const SUMMER_GARDEN_CLOVER_TOTAL_TARGET = 37

const hashSeed = (seed: string) =>
  seed.split('').reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0
  }, 0)

const getShuffledColumns = ({
  eventId,
  dateKey,
  collectibleId,
}: {
  eventId: string
  dateKey: string
  collectibleId: string
}) => {
  let state = hashSeed(`${eventId}:${dateKey}:${collectibleId}`)
  const columns = Array.from(
    { length: CONFIG.wordLength },
    (_, colIndex) => colIndex
  )

  for (let index = columns.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const swapIndex = state % (index + 1)
    const current = columns[index]
    columns[index] = columns[swapIndex]
    columns[swapIndex] = current
  }

  return columns
}

export const getEventCollectibleTargets = ({
  eventId,
  dateKey,
  collectibles,
}: {
  eventId: string
  dateKey: string
  collectibles: EventCollectibleConfig[]
}): EventCollectibleTarget[] =>
  collectibles.flatMap((collectible) => {
    const columns = getShuffledColumns({
      eventId,
      dateKey,
      collectibleId: collectible.id,
    })

    return collectible.targetRows.map((rowIndex, index) => ({
      collectibleId: collectible.id,
      collectionId: collectible.collectionId,
      emoji: collectible.emoji,
      rowIndex,
      colIndex: columns[index % columns.length],
    }))
  })

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
          value: target.emoji,
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

export const getCollectibleProgressItemIds = ({
  rowIndexes,
  won,
  winBonusItemId,
}: {
  rowIndexes: number[]
  won: boolean
  winBonusItemId?: string
}): string[] => [
  ...rowIndexes.map(getCollectibleProgressItemId),
  ...(won && winBonusItemId ? [winBonusItemId] : []),
]

export const formatCollectibleDashboardCount = ({
  emoji,
  count,
  winBonusCount,
}: {
  emoji: string
  count: number
  winBonusCount: number
}): string => {
  const total = count + winBonusCount

  return `${emoji}${total}${winBonusCount > 0 ? ` (+${winBonusCount})` : ''}`
}

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
