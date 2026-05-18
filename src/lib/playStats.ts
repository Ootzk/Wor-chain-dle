import { GameMode } from './gameMode'
import { CONFIG } from '../constants/config'

const currentPlayStatsKey = 'currentPlayStats'
const dailyPlayStatsKey = 'dailyPlayStats'
const longPauseThresholdMs = 5 * 60 * 1000

export type EnterAttemptKind = 'incomplete' | 'invalid' | 'valid'

export type AssistFlags = {
  enterValidationHint: boolean
}

export type GuessStats = {
  startedAt: number
  completedAt?: number
  durationMs?: number
  enterPresses: number
  incompleteEnterPresses: number
  invalidEnterPresses: number
  validEnterPresses: number
  deletePresses: number
  deletePressesByFilledLength: number[]
  longPauseCount: number
  totalLongPauseMs: number
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
  guessStats: GuessStats[]
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

const createGuessStats = (startedAt: number): GuessStats => ({
  startedAt,
  enterPresses: 0,
  incompleteEnterPresses: 0,
  invalidEnterPresses: 0,
  validEnterPresses: 0,
  deletePresses: 0,
  deletePressesByFilledLength: emptyDeleteDistribution(),
  longPauseCount: 0,
  totalLongPauseMs: 0,
})

const normalizeDeleteDistribution = (values?: number[]) => {
  const normalized = emptyDeleteDistribution()
  values?.slice(0, normalized.length).forEach((value, index) => {
    normalized[index] = value
  })
  return normalized
}

const normalizeGuessStats = (guess: Partial<GuessStats>): GuessStats => {
  const startedAt = guess.startedAt ?? 0
  return {
    startedAt,
    completedAt: guess.completedAt,
    durationMs:
      guess.durationMs ??
      (guess.completedAt
        ? Math.max(0, guess.completedAt - startedAt)
        : undefined),
    enterPresses: guess.enterPresses ?? 0,
    incompleteEnterPresses: guess.incompleteEnterPresses ?? 0,
    invalidEnterPresses: guess.invalidEnterPresses ?? 0,
    validEnterPresses: guess.validEnterPresses ?? 0,
    deletePresses: guess.deletePresses ?? 0,
    deletePressesByFilledLength: normalizeDeleteDistribution(
      guess.deletePressesByFilledLength
    ),
    longPauseCount: guess.longPauseCount ?? 0,
    totalLongPauseMs: guess.totalLongPauseMs ?? 0,
  }
}

const normalizePlayStats = <T extends PlayStats>(stats: T): T => ({
  ...stats,
  guessStats: stats.guessStats?.map(normalizeGuessStats) || [],
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
  guessStats: [createGuessStats(now)],
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
  const { pause, guessStats } = updateLastActivity(stats, now, (guess) => guess)
  return {
    ...stats,
    guessStats,
    firstInputAt: stats.firstInputAt || now,
    lastActivityAt: now,
    longestPauseMs: Math.max(stats.longestPauseMs, pause),
  }
}

const activeGuessIndex = (stats: PlayStats) => {
  const guessStats = stats.guessStats || []
  const openIndex = guessStats.findIndex((guess) => !guess.completedAt)
  return openIndex >= 0 ? openIndex : guessStats.length
}

const updateActiveGuess = (
  stats: PlayStats,
  now: number,
  pause: number,
  updater: (guess: GuessStats) => GuessStats
) => {
  const guessStats = [...(stats.guessStats || [])]
  const index = activeGuessIndex(stats)
  let currentGuess = normalizeGuessStats(
    guessStats[index] || createGuessStats(now)
  )
  if (pause >= longPauseThresholdMs) {
    currentGuess = {
      ...currentGuess,
      longPauseCount: currentGuess.longPauseCount + 1,
      totalLongPauseMs: currentGuess.totalLongPauseMs + pause,
    }
  }
  guessStats[index] = updater(currentGuess)
  return guessStats
}

const updateLastActivity = (
  stats: PlayStats,
  now: number,
  updater: (guess: GuessStats) => GuessStats
) => {
  const pause = Math.max(0, now - stats.lastActivityAt)
  return {
    pause,
    guessStats: updateActiveGuess(stats, now, pause, updater),
  }
}

export const recordEnterAttempt = (
  stats: PlayStats,
  kind: EnterAttemptKind,
  now = nowMs()
): PlayStats => {
  const { pause, guessStats } = updateLastActivity(stats, now, (guess) => {
    const next = {
      ...guess,
      enterPresses: guess.enterPresses + 1,
    }

    if (kind === 'incomplete') {
      return {
        ...next,
        incompleteEnterPresses: next.incompleteEnterPresses + 1,
      }
    }

    if (kind === 'invalid') {
      return {
        ...next,
        invalidEnterPresses: next.invalidEnterPresses + 1,
      }
    }

    return {
      ...next,
      completedAt: now,
      durationMs: Math.max(0, now - next.startedAt),
      validEnterPresses: next.validEnterPresses + 1,
    }
  })

  return {
    ...stats,
    guessStats,
    lastActivityAt: now,
    longestPauseMs: Math.max(stats.longestPauseMs, pause),
  }
}

export const startNextGuess = (
  stats: PlayStats,
  now = stats.lastActivityAt
): PlayStats => {
  const guessStats = [...(stats.guessStats || [])]
  if (
    guessStats.length < CONFIG.tries &&
    guessStats.every((guess) => guess.completedAt)
  ) {
    guessStats.push(createGuessStats(now))
  }
  return {
    ...stats,
    guessStats,
  }
}

export const recordDeletePress = (
  stats: PlayStats,
  filledLength: number,
  now = nowMs()
): PlayStats => {
  const filledIndex = Math.max(0, Math.min(filledLength, CONFIG.wordLength))
  const { pause, guessStats } = updateLastActivity(stats, now, (guess) => {
    const deletePressesByFilledLength = normalizeDeleteDistribution(
      guess.deletePressesByFilledLength
    )
    deletePressesByFilledLength[filledIndex] += 1

    return {
      ...guess,
      deletePresses: guess.deletePresses + 1,
      deletePressesByFilledLength,
    }
  })

  return {
    ...stats,
    guessStats,
    lastActivityAt: now,
    longestPauseMs: Math.max(stats.longestPauseMs, pause),
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

export const getGuessDurationsMs = (stats?: PlayStats | null) => {
  return (
    stats?.guessStats
      ?.map((guess) => guess.durationMs)
      .filter((duration): duration is number => duration !== undefined) || []
  )
}

export const getAverageGuessTimeMs = (stats?: PlayStats | null) => {
  const guessDurations = getGuessDurationsMs(stats)
  if (guessDurations.length === 0) return 0
  return Math.round(
    guessDurations.reduce((sum, value) => sum + value, 0) /
      guessDurations.length
  )
}

export const getTotalEnterPresses = (stats?: PlayStats | null) => {
  if (!stats) return 0
  return stats.guessStats.reduce((sum, guess) => sum + guess.enterPresses, 0)
}

export const getIncompleteEnterPresses = (stats?: PlayStats | null) => {
  if (!stats) return 0
  return stats.guessStats.reduce(
    (sum, guess) => sum + guess.incompleteEnterPresses,
    0
  )
}

export const getInvalidEnterPresses = (stats?: PlayStats | null) => {
  if (!stats) return 0
  return stats.guessStats.reduce(
    (sum, guess) => sum + guess.invalidEnterPresses,
    0
  )
}

export const getValidSubmissions = (stats?: PlayStats | null) => {
  if (!stats) return 0
  return stats.guessStats.reduce(
    (sum, guess) => sum + guess.validEnterPresses,
    0
  )
}

export const getDeletePressesByFilledLength = (stats?: PlayStats | null) => {
  const distribution = emptyDeleteDistribution()
  if (!stats) return distribution

  stats.guessStats.forEach((guess) => {
    normalizeDeleteDistribution(guess.deletePressesByFilledLength).forEach(
      (value, index) => {
        distribution[index] += value
      }
    )
  })

  return distribution
}

export const getTotalDeletePresses = (stats?: PlayStats | null) => {
  if (!stats) return 0
  return stats.guessStats.reduce((sum, guess) => sum + guess.deletePresses, 0)
}

export const getLongPauseCount = (stats?: PlayStats | null) => {
  if (!stats) return 0
  return stats.guessStats.reduce((sum, guess) => sum + guess.longPauseCount, 0)
}

export const getTotalLongPauseMs = (stats?: PlayStats | null) => {
  if (!stats) return 0
  return stats.guessStats.reduce(
    (sum, guess) => sum + guess.totalLongPauseMs,
    0
  )
}

export const hasPlayStatsActivity = (stats?: PlayStats | null) => {
  if (!stats) return false
  return (
    !!stats.firstInputAt ||
    getTotalEnterPresses(stats) > 0 ||
    getTotalDeletePresses(stats) > 0
  )
}

export const getSubmitAccuracy = (stats?: PlayStats | null) => {
  const totalEnterPresses = getTotalEnterPresses(stats)
  if (totalEnterPresses === 0) return 0
  return Math.round((100 * getValidSubmissions(stats)) / totalEnterPresses)
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
    getDeletePressesByFilledLength(game).forEach((value, index) => {
      deletePressesByFilledLength[index] += value
    })
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
      Math.round((10 * sum(games.map(getTotalEnterPresses))) / games.length) /
      10,
    totalIncompleteEnterPresses: sum(games.map(getIncompleteEnterPresses)),
    totalInvalidEnterPresses: sum(games.map(getInvalidEnterPresses)),
    totalDeletePresses: sum(games.map(getTotalDeletePresses)),
    totalEmptyDeletePresses: deletePressesByFilledLength[0],
    totalFullGuessDeletePresses: deletePressesByFilledLength[CONFIG.wordLength],
    deletePressesByFilledLength,
    totalEnterPresses: sum(games.map(getTotalEnterPresses)),
  }
}
