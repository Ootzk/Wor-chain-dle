import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, RefreshIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { CalendarDay } from './CalendarDay'
import { GameStats } from '../../lib/localStorage'
import {
  DayResult,
  loadDailyHistory,
  dateToSolutionIndex,
  solutionIndexToDate,
  getMonthResults,
  getDailyHistoryStartIndex,
} from '../../lib/dailyHistory'
import { shareCalendar } from '../../lib/share'
import { CONFIG } from '../../constants/config'

const WEEKDAYS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const WEEKDAYS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

type Props = {
  gameStats: GameStats
  handleShare: () => void
  initialMonth?: { year: number; month: number }
  weekStartsOnMonday: boolean
}

export const Calendar = ({ gameStats, handleShare, initialMonth, weekStartsOnMonday }: Props) => {
  const { t } = useTranslation()
  const now = new Date()
  const currentUTCYear = now.getUTCFullYear()
  const currentUTCMonth = now.getUTCMonth()

  const [year, setYear] = useState(initialMonth?.year ?? currentUTCYear)
  const [month, setMonth] = useState(initialMonth?.month ?? currentUTCMonth)

  const epochDate = new Date(CONFIG.startDate)

  const canGoBack = true
  const canGoForward = true

  const goBack = () => {
    if (!canGoBack) return
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
  }

  const goForward = () => {
    if (!canGoForward) return
    if (month === 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(month + 1)
    }
  }

  const monthResults = getMonthResults(year, month)
  const history = loadDailyHistory()

  // Build calendar grid
  const rawDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay() // 0=Sun
  const firstDayOfWeek = weekStartsOnMonday
    ? (rawDayOfWeek + 6) % 7 // Mon=0, Tue=1, ..., Sun=6
    : rawDayOfWeek
  const daysInMonth = monthResults.length
  const todayUTCDate = now.getUTCDate()

  const epochSolutionIndex = dateToSolutionIndex(epochDate)
  const historyStartIndex = getDailyHistoryStartIndex()

  const calendarEpochDate = historyStartIndex !== null
    ? solutionIndexToDate(historyStartIndex)
    : null
  const calendarEpochYear = calendarEpochDate?.getUTCFullYear() ?? null
  const calendarEpochMonth = calendarEpochDate?.getUTCMonth() ?? null
  const calendarEpochDay = calendarEpochDate?.getUTCDate() ?? null

  type CellData = {
    day: number | null
    result?: DayResult | null
    isToday: boolean
    isFuture: boolean
    isBeforeEpoch: boolean
    isBirthday: boolean
    isCalendarEpoch: boolean
  }

  const cells: CellData[] = []

  // Leading empty cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({
      day: null,
      isToday: false,
      isFuture: false,
      isBeforeEpoch: false,
      isBirthday: false,
      isCalendarEpoch: false,
    })
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      year === currentUTCYear && month === currentUTCMonth && d === todayUTCDate
    const isFuture =
      year > currentUTCYear ||
      (year === currentUTCYear && month > currentUTCMonth) ||
      (year === currentUTCYear && month === currentUTCMonth && d > todayUTCDate)
    const daySolutionIndex = dateToSolutionIndex(
      new Date(Date.UTC(year, month, d))
    )
    const isBeforeEpoch = daySolutionIndex < epochSolutionIndex ||
      (historyStartIndex !== null && daySolutionIndex < historyStartIndex)
    const isCalendarEpoch =
      year === calendarEpochYear && month === calendarEpochMonth && d === calendarEpochDay

    cells.push({
      day: d,
      result: monthResults[d - 1],
      isToday,
      isFuture,
      isBeforeEpoch,
      isBirthday: month === 1 && d === 16, // Feb 16 — Wor-chain-dle birthday
      isCalendarEpoch,
    })
  }

  // Trailing empty cells to always fill 6 rows (42 cells)
  while (cells.length < 42) {
    cells.push({
      day: null,
      isToday: false,
      isFuture: false,
      isBeforeEpoch: false,
      isBirthday: false,
      isCalendarEpoch: false,
    })
  }

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long', timeZone: 'UTC' }
  )

  const fallbackWeekdays = weekStartsOnMonday ? WEEKDAYS_MON : WEEKDAYS_SUN
  const weekdayKeys = t('weekdays', { returnObjects: true }) as string[]
  const i18nWeekdays =
    Array.isArray(weekdayKeys) && weekdayKeys.length === 7
      ? weekdayKeys
      : fallbackWeekdays
  // i18n weekdays are Sun-first; rotate if Monday start
  const displayWeekdays = weekStartsOnMonday
    ? [...i18nWeekdays.slice(1), i18nWeekdays[0]]
    : i18nWeekdays

  const hasAnyData = cells.some(
    (c) => c.day !== null && !c.isFuture && !c.isBeforeEpoch && c.result != null
  )

  return (
    <div className="flex flex-col items-center">
      {/* Month navigation */}
      <div className="flex items-center w-full mb-3">
        <button
          onClick={goBack}
          className="p-1 rounded hover:bg-gray-100 cursor-pointer"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="flex-1 text-center text-base font-semibold text-gray-900 -mr-7">
          {monthLabel}
        </span>
        <button
          onClick={() => {
            setYear(currentUTCYear)
            setMonth(currentUTCMonth)
          }}
          disabled={year === currentUTCYear && month === currentUTCMonth}
          className={`p-1 rounded ${year === currentUTCYear && month === currentUTCMonth ? 'opacity-30 cursor-default' : 'hover:bg-gray-100 cursor-pointer'}`}
          title="Today"
        >
          <RefreshIcon className="h-5 w-5" />
        </button>
        <button
          onClick={goForward}
          className="p-1 rounded hover:bg-gray-100 cursor-pointer"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {displayWeekdays.map((wd, i) => (
          <div
            key={i}
            className="w-10 text-center text-xs font-medium text-gray-400"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0">
        {cells.map((cell, i) => (
          <CalendarDay
            key={i}
            day={cell.day}
            result={cell.result}
            isToday={cell.isToday}
            isFuture={cell.isFuture}
            isBeforeEpoch={cell.isBeforeEpoch}
            isBirthday={cell.isBirthday}
            isCalendarEpoch={cell.isCalendarEpoch}
          />
        ))}
      </div>

      {/* Streak */}
      <div className="mt-3 text-lg font-semibold text-gray-900">
        🔥 {gameStats.currentStreak}
      </div>

      {/* Share button */}
      <button
        type="button"
        disabled={!hasAnyData}
        className={`mt-3 w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm ${hasAnyData ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-gray-300 cursor-default'}`}
        onClick={() => {
          shareCalendar(year, month, history, gameStats.currentStreak, weekStartsOnMonday)
          handleShare()
        }}
      >
        {t('shareMonth')}
      </button>
    </div>
  )
}
