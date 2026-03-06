import { CONFIG } from '../constants/config'

export type DayResult = {
  guessCount: number // 1-6 for win, CONFIG.tries for loss
  won: boolean
}

export type DailyHistory = Record<number, DayResult> // key = solutionIndex

const STORAGE_KEY = 'dailyHistory'
const START_INDEX_KEY = 'dailyHistoryStartIndex'

export const getDailyHistoryStartIndex = (): number | null => {
  const stored = localStorage.getItem(START_INDEX_KEY)
  return stored !== null ? parseInt(stored, 10) : null
}

export const initDailyHistoryStartIndex = (currentIndex: number): void => {
  if (localStorage.getItem(START_INDEX_KEY) === null) {
    localStorage.setItem(START_INDEX_KEY, currentIndex.toString())
  }
}

export const loadDailyHistory = (): DailyHistory => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? (JSON.parse(data) as DailyHistory) : {}
}

export const saveDailyHistory = (history: DailyHistory): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export const saveDailyResult = (
  solutionIndex: number,
  guessCount: number,
  won: boolean
): void => {
  const history = loadDailyHistory()
  if (history[solutionIndex]) return // prevent double-write
  history[solutionIndex] = { guessCount, won }
  saveDailyHistory(history)
}

const MS_IN_DAY = 86400000

export const solutionIndexToDate = (index: number): Date => {
  const epochMs = new Date(CONFIG.startDate).valueOf()
  return new Date(epochMs + index * MS_IN_DAY)
}

export const dateToSolutionIndex = (date: Date): number => {
  const epochMs = new Date(CONFIG.startDate).valueOf()
  const dayStart = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  )
  return Math.floor((dayStart - epochMs) / MS_IN_DAY)
}

export const getMonthResults = (
  year: number,
  month: number // 0-indexed
): (DayResult | null)[] => {
  const history = loadDailyHistory()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const results: (DayResult | null)[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month, day))
    const index = dateToSolutionIndex(date)
    results.push(history[index] ?? null)
  }

  return results
}

export const computeStreakFromHistory = (
  history: DailyHistory,
  currentIndex: number
): number => {
  let streak = 0
  let idx = currentIndex
  while (history[idx]?.won) {
    streak++
    idx--
  }
  return streak
}
