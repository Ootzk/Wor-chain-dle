import { GameMode } from './gameMode'
import { CONFIG } from '../constants/config'

const currentPlayStatsKey = 'currentPlayStats'
const dailyPlayStatsKey = 'dailyPlayStats'

export type EnterAttemptKind = 'incomplete' | 'invalid' | 'valid'

export type AssistFlags = {
  enterValidationHint: boolean
}

export type PlayStats = {
  mode: GameMode
  dateKey?: string
  solution: string
  startedAt: number
  completedAt?: number
  firstInputAt?: number
  lastActivityAt: number
  longestPauseMs: number
  incompleteEnterPresses: number
  invalidEnterPresses: number
  deletePresses: number
  deletePressesByFilledLength: number[]
  validSubmissions: number
  totalEnterPresses: number
  guessDurationsMs: number[]
  assistFlags: AssistFlags
  won?: boolean
  guessCount?: number
}

export type CompletedPlayStats = PlayStats & {
  completedAt: number
  won: boolean
  guessCount: number
}

export type DailyPlayStatsHistory = Record<string, CompletedPlayStats>

export type PlayStatsSummary = {
  totalGames: number
  averageDurationMs: number
  averageFirstInputDelayMs: number
  averageGuessTimeMs: number
  averageSubmitAccuracy: number
  averageEnterPresses: number
  totalIncompleteEnterPresses: number
  totalInvalidEnterPresses: number
  totalDeletePresses: number
  totalEmptyDeletePresses: number
  totalFullGuessDeletePresses: number
  deletePressesByFilledLength: number[]
  totalEnterPresses: number
}

type StoredCurrentPlayStats = {
  dateKey?: string
  solution: string
  stats: PlayStats
}

const nowMs = () => Math.round(performance.timeOrigin + performance.now())

const emptyDeleteDistribution = () => Array(CONFIG.wordLength + 1).fill(0)

const normalizeDeleteDistribution = (values?: number[]) => {
  const normalized = emptyDeleteDistribution()
  values?.slice(0, normalized.length).forEach((value, index) => {
    normalized[index] = value
  })
  return normalized
}

const normalizePlayStats = <T extends PlayStats>(stats: T): T => ({
  ...stats,
  deletePresses: stats.deletePresses ?? 0,
  deletePressesByFilledLength: normalizeDeleteDistribution(
    stats.deletePressesByFilledLength
  ),
})

export const createPlayStats = ({
  mode,
  solution,
  dateKey,
  enterValidationHint,
  now = nowMs(),
}: {
  mode: GameMode
  solution: string
  dateKey?: string
  enterValidationHint: boolean
  now?: number
}): PlayStats => ({
  mode,
  solution,
  dateKey,
  startedAt: now,
  lastActivityAt: now,
  longestPauseMs: 0,
  incompleteEnterPresses: 0,
  invalidEnterPresses: 0,
  deletePresses: 0,
  deletePressesByFilledLength: emptyDeleteDistribution(),
  validSubmissions: 0,
  totalEnterPresses: 0,
  guessDurationsMs: [],
  assistFlags: {
    enterValidationHint,
  },
})

export const loadCurrentPlayStats = ({
  mode,
  solution,
  dateKey,
  enterValidationHint,
  now = nowMs(),
}: {
  mode: GameMode
  solution: string
  dateKey?: string
  enterValidationHint: boolean
  now?: number
}): PlayStats => {
  if (mode !== 'daily') {
    return createPlayStats({
      mode,
      solution,
      dateKey,
      enterValidationHint,
      now,
    })
  }

  const stored = localStorage.getItem(currentPlayStatsKey)
  if (stored) {
    const parsed = JSON.parse(stored) as StoredCurrentPlayStats
    if (
      parsed.solution === solution &&
      parsed.dateKey === dateKey &&
      !parsed.stats.completedAt
    ) {
      return normalizePlayStats(parsed.stats)
    }
  }

  return createPlayStats({
    mode,
    solution,
    dateKey,
    enterValidationHint,
    now,
  })
}

export const saveCurrentPlayStats = (stats: PlayStats) => {
  if (stats.mode !== 'daily' || !stats.dateKey || stats.completedAt) return
  const stored: StoredCurrentPlayStats = {
    dateKey: stats.dateKey,
    solution: stats.solution,
    stats,
  }
  localStorage.setItem(currentPlayStatsKey, JSON.stringify(stored))
}

export const clearCurrentPlayStats = () => {
  localStorage.removeItem(currentPlayStatsKey)
}

export const recordInputActivity = (
  stats: PlayStats,
  now = nowMs()
): PlayStats => {
  const pause = Math.max(0, now - stats.lastActivityAt)
  return {
    ...stats,
    firstInputAt: stats.firstInputAt || now,
    lastActivityAt: now,
    longestPauseMs: Math.max(stats.longestPauseMs, pause),
  }
}

export const recordEnterAttempt = (
  stats: PlayStats,
  kind: EnterAttemptKind,
  now = nowMs()
): PlayStats => {
  const pause = Math.max(0, now - stats.lastActivityAt)
  const base = {
    ...stats,
    lastActivityAt: now,
    longestPauseMs: Math.max(stats.longestPauseMs, pause),
    totalEnterPresses: stats.totalEnterPresses + 1,
  }

  if (kind === 'incomplete') {
    return {
      ...base,
      incompleteEnterPresses: base.incompleteEnterPresses + 1,
    }
  }

  if (kind === 'invalid') {
    return {
      ...base,
      invalidEnterPresses: base.invalidEnterPresses + 1,
    }
  }

  return {
    ...base,
    validSubmissions: base.validSubmissions + 1,
    guessDurationsMs: [...base.guessDurationsMs, pause],
  }
}

export const recordDeletePress = (
  stats: PlayStats,
  filledLength: number,
  now = nowMs()
): PlayStats => {
  const pause = Math.max(0, now - stats.lastActivityAt)
  const index = Math.max(0, Math.min(filledLength, CONFIG.wordLength))
  const deletePressesByFilledLength = normalizeDeleteDistribution(
    stats.deletePressesByFilledLength
  )
  deletePressesByFilledLength[index] += 1

  return {
    ...stats,
    lastActivityAt: now,
    longestPauseMs: Math.max(stats.longestPauseMs, pause),
    deletePresses: stats.deletePresses + 1,
    deletePressesByFilledLength,
  }
}

export const completePlayStats = ({
  stats,
  won,
  guessCount,
  now = nowMs(),
}: {
  stats: PlayStats
  won: boolean
  guessCount: number
  now?: number
}): CompletedPlayStats => ({
  ...stats,
  completedAt: now,
  lastActivityAt: now,
  won,
  guessCount,
})

export const loadDailyPlayStatsHistory = (): DailyPlayStatsHistory => {
  const history = localStorage.getItem(dailyPlayStatsKey)
  return history ? (JSON.parse(history) as DailyPlayStatsHistory) : {}
}

export const loadDailyPlayStats = (
  dateKey: string,
  solution?: string
): CompletedPlayStats | null => {
  const stats = loadDailyPlayStatsHistory()[dateKey] ?? null
  if (!stats) return null
  if (solution && stats.solution !== solution) return null
  return normalizePlayStats(stats)
}

export const saveDailyPlayStats = (
  dateKey: string,
  stats: CompletedPlayStats
) => {
  const history = loadDailyPlayStatsHistory()
  localStorage.setItem(
    dailyPlayStatsKey,
    JSON.stringify({
      ...history,
      [dateKey]: stats,
    })
  )
  clearCurrentPlayStats()
}

export const getPlayDurationMs = (stats?: PlayStats | null) => {
  if (!stats?.completedAt) return 0
  return Math.max(0, stats.completedAt - stats.startedAt)
}

export const getFirstInputDelayMs = (stats?: PlayStats | null) => {
  if (!stats?.firstInputAt) return 0
  return Math.max(0, stats.firstInputAt - stats.startedAt)
}

export const getAverageGuessTimeMs = (stats?: PlayStats | null) => {
  if (!stats || stats.guessDurationsMs.length === 0) return 0
  return Math.round(
    stats.guessDurationsMs.reduce((sum, value) => sum + value, 0) /
      stats.guessDurationsMs.length
  )
}

export const getSubmitAccuracy = (stats?: PlayStats | null) => {
  if (!stats || stats.totalEnterPresses === 0) return 0
  return Math.round((100 * stats.validSubmissions) / stats.totalEnterPresses)
}

export const summarizePlayStats = (
  history: DailyPlayStatsHistory
): PlayStatsSummary => {
  const games = Object.values(history)
  if (games.length === 0) {
    return {
      totalGames: 0,
      averageDurationMs: 0,
      averageFirstInputDelayMs: 0,
      averageGuessTimeMs: 0,
      averageSubmitAccuracy: 0,
      averageEnterPresses: 0,
      totalIncompleteEnterPresses: 0,
      totalInvalidEnterPresses: 0,
      totalDeletePresses: 0,
      totalEmptyDeletePresses: 0,
      totalFullGuessDeletePresses: 0,
      deletePressesByFilledLength: emptyDeleteDistribution(),
      totalEnterPresses: 0,
    }
  }

  const sum = (values: number[]) =>
    values.reduce((total, value) => total + value, 0)
  const deletePressesByFilledLength = emptyDeleteDistribution()
  games.forEach((game) => {
    normalizeDeleteDistribution(game.deletePressesByFilledLength).forEach(
      (value, index) => {
        deletePressesByFilledLength[index] += value
      }
    )
  })

  return {
    totalGames: games.length,
    averageDurationMs: Math.round(
      sum(games.map(getPlayDurationMs)) / games.length
    ),
    averageFirstInputDelayMs: Math.round(
      sum(games.map(getFirstInputDelayMs)) / games.length
    ),
    averageGuessTimeMs: Math.round(
      sum(games.map(getAverageGuessTimeMs)) / games.length
    ),
    averageSubmitAccuracy: Math.round(
      sum(games.map(getSubmitAccuracy)) / games.length
    ),
    averageEnterPresses:
      Math.round(
        (10 * sum(games.map((game) => game.totalEnterPresses))) / games.length
      ) / 10,
    totalIncompleteEnterPresses: sum(
      games.map((game) => game.incompleteEnterPresses)
    ),
    totalInvalidEnterPresses: sum(
      games.map((game) => game.invalidEnterPresses)
    ),
    totalDeletePresses: sum(games.map((game) => game.deletePresses)),
    totalEmptyDeletePresses: deletePressesByFilledLength[0],
    totalFullGuessDeletePresses: deletePressesByFilledLength[CONFIG.wordLength],
    deletePressesByFilledLength,
    totalEnterPresses: sum(games.map((game) => game.totalEnterPresses)),
  }
}
