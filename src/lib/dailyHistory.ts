import { Temporal } from 'temporal-polyfill'
import { CONFIG } from '../constants/config'

export type DayResult = {
  guessCount: number // 1-6 for win, CONFIG.tries for loss
  won: boolean
}

export type DailyHistory = Record<string, DayResult> // key = "yyyy-mm-dd"

const STORAGE_KEY = 'dailyHistory'
const START_DATE_KEY = 'dailyHistoryStartDate'
const LEGACY_START_INDEX_KEY = 'dailyHistoryStartIndex'

export const dateToKey = (date: Temporal.PlainDate): string => date.toString()

export const getDailyHistoryStartDate = (): string | null => {
  return localStorage.getItem(START_DATE_KEY)
}

export const initDailyHistoryStartDate = (dateKey: string): void => {
  if (localStorage.getItem(START_DATE_KEY) === null) {
    localStorage.setItem(START_DATE_KEY, dateKey)
  }
}

export const loadDailyHistory = (): DailyHistory => {
  migrateDailyHistory()
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? (JSON.parse(data) as DailyHistory) : {}
}

export const saveDailyHistory = (history: DailyHistory): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export const saveDailyResult = (
  dateKey: string,
  guessCount: number,
  won: boolean
): void => {
  const history = loadDailyHistory()
  if (history[dateKey]) return // prevent double-write
  history[dateKey] = { guessCount, won }
  saveDailyHistory(history)
}

export const getMonthResults = (
  year: number,
  month: number // 0-indexed
): (DayResult | null)[] => {
  const history = loadDailyHistory()
  const firstDay = Temporal.PlainDate.from({
    year,
    month: month + 1, // Temporal uses 1-indexed months
    day: 1,
  })
  const daysInMonth = firstDay.daysInMonth
  const results: (DayResult | null)[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = firstDay.with({ day })
    const key = dateToKey(date)
    results.push(history[key] ?? null)
  }

  return results
}

// --- Migration: integer-key → date-string-key (one-time) ---

let migrated = false

const migrateDailyHistory = (): void => {
  if (migrated) return
  migrated = true

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return

  const parsed = JSON.parse(raw) as Record<string, DayResult>
  const keys = Object.keys(parsed)
  if (keys.length === 0) return

  // If the first key looks like a date string, already migrated
  if (keys[0].includes('-')) return

  // Legacy format: keys are integer solutionIndex strings
  const epoch = Temporal.PlainDate.from(CONFIG.startDate)
  const newHistory: DailyHistory = {}

  for (const key of keys) {
    const index = parseInt(key, 10)
    const date = epoch.add({ days: index })
    newHistory[dateToKey(date)] = parsed[key]
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))

  // Migrate dailyHistoryStartIndex → dailyHistoryStartDate
  const legacyStartIndex = localStorage.getItem(LEGACY_START_INDEX_KEY)
  if (legacyStartIndex !== null) {
    const startDate = epoch.add({ days: parseInt(legacyStartIndex, 10) })
    localStorage.setItem(START_DATE_KEY, dateToKey(startDate))
    localStorage.removeItem(LEGACY_START_INDEX_KEY)
  }
}
