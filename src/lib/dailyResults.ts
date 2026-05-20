import { Temporal } from 'temporal-polyfill'
import { CONFIG } from '../constants/config'
import {
  DailyHistory,
  DayResult,
  dateToKey,
  getDailyHistoryStartDate,
  loadDailyHistory,
} from './dailyHistory'
import type { CompletedPlayStats, TileCounts } from './playStats'

const STORAGE_KEY = 'dailyResults'
const LEGACY_DAILY_PLAY_STATS_KEY = 'dailyPlayStats'

export type DailyEndReason = 'win' | 'guess_limit' | 'dead_end' | 'unknown'

/**
 * Canonical per-date Daily result.
 *
 * `gameStats` remains the aggregate, pre-calendar-compatible source for total
 * wins/losses and streaks. `dailyResults` is the source for date-level records,
 * calendar rendering, loss reasons, detail stats, and tile counts.
 */
export type DailyResult = {
  dateKey: string
  solution?: string
  won: boolean
  guessCount: number
  endReason: DailyEndReason
  tileCounts?: TileCounts
  playStats?: CompletedPlayStats
}

export type DailyResults = Record<string, DailyResult>

type LegacyDailyDetailStatsHistory = Record<string, Partial<CompletedPlayStats>>

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

const normalizeEndReason = (value: unknown, won: boolean): DailyEndReason => {
  if (value === 'win') return 'win'
  if (value === 'guess_limit') return 'guess_limit'
  if (value === 'dead_end') return 'dead_end'
  if (value === 'unknown') return 'unknown'
  return won ? 'win' : 'unknown'
}

const normalizeDailyResult = (
  dateKey: string,
  result: Partial<DailyResult>
): DailyResult => {
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

const readStoredDailyResults = (): DailyResults => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}

  const parsed = JSON.parse(raw) as Record<string, Partial<DailyResult>>
  return Object.fromEntries(
    Object.entries(parsed).map(([dateKey, result]) => [
      dateKey,
      normalizeDailyResult(dateKey, result),
    ])
  )
}

const readLegacyDailyDetailStats = (): LegacyDailyDetailStatsHistory => {
  const raw = localStorage.getItem(LEGACY_DAILY_PLAY_STATS_KEY)
  return raw ? (JSON.parse(raw) as LegacyDailyDetailStatsHistory) : {}
}

const createResultFromHistory = (
  dateKey: string,
  result: DayResult
): DailyResult => ({
  dateKey,
  won: result.won,
  guessCount: result.guessCount,
  endReason: result.won ? 'win' : 'unknown',
})

const createResultFromDetailStats = (
  dateKey: string,
  stats: Partial<CompletedPlayStats>
): DailyResult => {
  const won = stats.won ?? false
  return normalizeDailyResult(dateKey, {
    dateKey,
    solution: stats.solution,
    won,
    guessCount:
      typeof stats.guessCount === 'number' ? stats.guessCount : CONFIG.tries,
    endReason: won ? 'win' : 'unknown',
    tileCounts: stats.tileCounts,
    playStats: stats as CompletedPlayStats,
  })
}

export const loadDailyResults = (): DailyResults => {
  const stored = readStoredDailyResults()
  const legacyHistory = loadDailyHistory()
  const legacyDetailStats = readLegacyDailyDetailStats()
  const migrated: DailyResults = {}

  for (const [dateKey, result] of Object.entries(legacyHistory)) {
    migrated[dateKey] = createResultFromHistory(dateKey, result)
  }

  for (const [dateKey, stats] of Object.entries(legacyDetailStats)) {
    migrated[dateKey] = {
      ...migrated[dateKey],
      ...createResultFromDetailStats(dateKey, stats),
    }
  }

  const results = {
    ...migrated,
    ...stored,
  }

  if (
    Object.keys(migrated).length > 0 &&
    Object.keys(stored).length < Object.keys(results).length
  ) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
  }

  return results
}

export const loadDailyResult = (
  dateKey: string,
  solution?: string
): DailyResult | null => {
  const result = loadDailyResults()[dateKey] ?? null
  if (!result) return null
  if (solution && result.solution && result.solution !== solution) return null
  return result
}

export const saveDailyResult = (result: DailyResult): void => {
  const results = loadDailyResults()
  const normalized = normalizeDailyResult(result.dateKey, result)
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...results,
      [normalized.dateKey]: normalized,
    })
  )
}

export const getMonthDailyResults = (
  year: number,
  month: number
): (DailyResult | null)[] => {
  const results = loadDailyResults()
  const firstDay = Temporal.PlainDate.from({
    year,
    month: month + 1,
    day: 1,
  })

  return Array.from({ length: firstDay.daysInMonth }, (_, dayIndex) => {
    const dateKey = dateToKey(firstDay.with({ day: dayIndex + 1 }))
    return results[dateKey] ?? null
  })
}

export const toDailyHistory = (results: DailyResults): DailyHistory =>
  Object.fromEntries(
    Object.entries(results).map(([dateKey, result]) => [
      dateKey,
      {
        won: result.won,
        guessCount: result.guessCount,
      },
    ])
  )

export const loadDailyResultHistory = (): DailyHistory =>
  toDailyHistory(loadDailyResults())

export const getDailyResultsStartDate = (): string | null =>
  getDailyHistoryStartDate()
