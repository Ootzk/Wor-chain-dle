import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { CalendarDay } from './CalendarDay'
import { GameStats } from '../../lib/localStorage'
import {
  DayResult,
  loadDailyHistory,
  dateToSolutionIndex,
  computeStreakFromHistory,
  getMonthResults,
  getDailyHistoryStartIndex,
} from '../../lib/dailyHistory'
import { solutionIndex as todaySolutionIndex } from '../../lib/words'
import { shareCalendar } from '../../lib/share'
import { CONFIG } from '../../constants/config'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

type Props = {
  gameStats: GameStats
  handleShare: () => void
  initialMonth?: { year: number; month: number }
}

export const Calendar = ({ gameStats, handleShare, initialMonth }: Props) => {
  const { t } = useTranslation()
  const now = new Date()
  const currentUTCYear = now.getUTCFullYear()
  const currentUTCMonth = now.getUTCMonth()

  const [year, setYear] = useState(initialMonth?.year ?? currentUTCYear)
  const [month, setMonth] = useState(initialMonth?.month ?? currentUTCMonth)

  const epochDate = new Date(CONFIG.startDate)
  const epochYear = epochDate.getUTCFullYear()
  const epochMonth = epochDate.getUTCMonth()

  const canGoBack =
    year > epochYear || (year === epochYear && month > epochMonth)
  const canGoForward =
    year < currentUTCYear ||
    (year === currentUTCYear && month < currentUTCMonth)

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
  const historyStreak = computeStreakFromHistory(history, todaySolutionIndex)
  const displayStreak = Math.max(historyStreak, gameStats.currentStreak)

  // Build calendar grid
  const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay() // 0=Sun
  const daysInMonth = monthResults.length
  const todayUTCDate = now.getUTCDate()

  const epochSolutionIndex = dateToSolutionIndex(epochDate)
  const historyStartIndex = getDailyHistoryStartIndex()

  type CellData = {
    day: number | null
    result?: DayResult | null
    isToday: boolean
    isFuture: boolean
    isBeforeEpoch: boolean
    isPreRecording: boolean
    isBirthday: boolean
  }

  const cells: CellData[] = []

  // Leading empty cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({
      day: null,
      isToday: false,
      isFuture: false,
      isBeforeEpoch: false,
      isPreRecording: false,
      isBirthday: false,
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
    const isBeforeEpoch = daySolutionIndex < epochSolutionIndex
    const isPreRecording =
      historyStartIndex !== null && daySolutionIndex < historyStartIndex

    cells.push({
      day: d,
      result: monthResults[d - 1],
      isToday,
      isFuture,
      isBeforeEpoch,
      isPreRecording,
      isBirthday: month === 1 && d === 16, // Feb 16 — Wor-chain-dle birthday
    })
  }

  // Trailing empty cells to always fill 6 rows (42 cells)
  while (cells.length < 42) {
    cells.push({
      day: null,
      isToday: false,
      isFuture: false,
      isBeforeEpoch: false,
      isPreRecording: false,
      isBirthday: false,
    })
  }

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long', timeZone: 'UTC' }
  )

  const weekdayKeys = t('weekdays', { returnObjects: true }) as string[]
  const displayWeekdays =
    Array.isArray(weekdayKeys) && weekdayKeys.length === 7
      ? weekdayKeys
      : WEEKDAYS

  const hasAnyData = monthResults.some((r) => r !== null)

  return (
    <div className="flex flex-col items-center">
      {/* Month navigation */}
      <div className="flex items-center justify-between w-full mb-3">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className={`p-1 rounded ${canGoBack ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-30 cursor-default'}`}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-gray-900">
          {monthLabel}
        </span>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className={`p-1 rounded ${canGoForward ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-30 cursor-default'}`}
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
            isPreRecording={cell.isPreRecording}
            isBirthday={cell.isBirthday}
          />
        ))}
      </div>

      {/* Streak */}
      <div className="mt-3 text-lg font-semibold text-gray-900">
        🔥 {displayStreak}
      </div>

      {/* Share button */}
      <button
        type="button"
        disabled={!hasAnyData}
        className={`mt-3 w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm ${hasAnyData ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-gray-300 cursor-default'}`}
        onClick={() => {
          shareCalendar(year, month, history, displayStreak)
          handleShare()
        }}
      >
        {t('shareMonth')}
      </button>
    </div>
  )
}
