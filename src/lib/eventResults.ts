import { CONFIG } from '../constants/config'
import { DailyEndReason } from './dailyResults'
import type { CompletedPlayStats, TileCounts } from './playStats'

const STORAGE_KEY = 'eventResults'

export type EventEndReason =
  | DailyEndReason
  | 'timeout'
  | 'enter_limit'
  | 'ai_win'

export type EventResult = {
  dateKey: string
  solution?: string
  won: boolean
  guessCount: number
  endReason: EventEndReason
  tileCounts?: TileCounts
  playStats?: CompletedPlayStats
}

export type EventResults = Record<string, EventResult>
export type EventResultsByVersion = Record<string, EventResults>

const isTileCounts = (value: unknown): value is TileCounts => {
  if (!value || typeof value !== 'object') return false
  const counts = value as Partial<TileCounts>
  return (
    typeof counts.correct === 'number' &&
    typeof counts.present === 'number' &&
    typeof counts.absent === 'number' &&
    typeof counts.unrevealed === 'number'
  )
}

const normalizeEndReason = (
  value: unknown,
  won: boolean
): EventEndReason => {
  if (typeof value === 'string') return value as EventEndReason
  return won ? 'win' : 'unknown'
}

const normalizeEventResult = (
  dateKey: string,
  result: Partial<EventResult>
): EventResult => {
  const won = result.won ?? false
  const guessCount =
    typeof result.guessCount === 'number' ? result.guessCount : CONFIG.tries
  const playStats = result.playStats
  const tileCounts = isTileCounts(result.tileCounts)
    ? result.tileCounts
    : isTileCounts(playStats?.tileCounts)
    ? playStats?.tileCounts
    : undefined

  return {
    dateKey: result.dateKey ?? dateKey,
    solution: result.solution ?? playStats?.solution,
    won,
    guessCount,
    endReason: normalizeEndReason(result.endReason, won),
    tileCounts,
    playStats: playStats as CompletedPlayStats | undefined,
  }
}

export const loadEventResultsByVersion = (): EventResultsByVersion => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}

  const parsed = JSON.parse(raw) as Record<
    string,
    Record<string, Partial<EventResult>>
  >

  return Object.fromEntries(
    Object.entries(parsed).map(([version, results]) => [
      version,
      Object.fromEntries(
        Object.entries(results).map(([dateKey, result]) => [
          dateKey,
          normalizeEventResult(dateKey, result),
        ])
      ),
    ])
  )
}

export const loadEventResults = (version: string): EventResults =>
  loadEventResultsByVersion()[version] ?? {}

export const saveEventResult = (
  version: string,
  result: EventResult
): void => {
  const resultsByVersion = loadEventResultsByVersion()
  const versionResults = resultsByVersion[version] ?? {}
  const normalized = normalizeEventResult(result.dateKey, result)

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...resultsByVersion,
      [version]: {
        ...versionResults,
        [normalized.dateKey]: normalized,
      },
    })
  )
}

export const getEventDetailStatsHistory = (
  results: EventResults
): Record<string, CompletedPlayStats> =>
  Object.fromEntries(
    Object.entries(results)
      .filter(([, result]) => result.playStats)
      .map(([dateKey, result]) => [dateKey, result.playStats!])
  )
