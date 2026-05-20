import { Temporal } from 'temporal-polyfill'
import { useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshIcon,
} from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { CalendarDay } from './CalendarDay'
import { GameStats } from '../../lib/localStorage'
import { dateToKey } from '../../lib/dailyHistory'
import {
  getDailyResultsStartDate,
  loadDailyResults,
} from '../../lib/dailyResults'
import { shareCalendar } from '../../lib/share'
import { CONFIG } from '../../constants/config'
import { ShareOptionsRow } from '../stats/ShareOptionsRow'
import { CosmeticOverrides } from '../../lib/cosmetics'

const WEEKDAYS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const WEEKDAYS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

type Props = {
  gameStats: GameStats
  results?: Record<string, { won: boolean; guessCount: number }>
  calendarStartDate?: string | null
  handleShare: () => void
  weekStartsOnMonday: boolean
  onToggleWeekStartsOnMonday: () => void
  excludeUrl: boolean
  onToggleExcludeUrl: () => void
  onOpenCosmetics: () => void
  hasNewRewards?: boolean
  cosmeticOverrides?: CosmeticOverrides
}

const MiniToggle = ({
  checked,
  onClick,
}: {
  checked: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
      checked ? 'bg-green-500' : 'bg-gray-300'
    }`}
    onClick={onClick}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
)

export const Calendar = ({
  gameStats,
  results,
  calendarStartDate,
  handleShare,
  weekStartsOnMonday,
  onToggleWeekStartsOnMonday,
  excludeUrl,
  onToggleExcludeUrl,
  onOpenCosmetics,
  hasNewRewards = false,
  cosmeticOverrides,
}: Props) => {
  const { t } = useTranslation()
  const today = Temporal.Now.plainDateISO()

  const [year, setYear] = useState(today.year)
  const [month, setMonth] = useState(today.month - 1) // 0-indexed for consistency

  const epoch = Temporal.PlainDate.from(CONFIG.startDate)

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

  const storedResults = results ?? loadDailyResults()

  // Build calendar grid
  const firstDay = Temporal.PlainDate.from({
    year,
    month: month + 1,
    day: 1,
  })
  const rawDayOfWeek = firstDay.dayOfWeek // 1=Mon, 7=Sun (ISO)
  const sundayBasedDow = rawDayOfWeek === 7 ? 0 : rawDayOfWeek // 0=Sun
  const firstDayOfWeek = weekStartsOnMonday
    ? (sundayBasedDow + 6) % 7 // Mon=0, Tue=1, ..., Sun=6
    : sundayBasedDow
  const daysInMonth = firstDay.daysInMonth
  const monthResults = Array.from({ length: daysInMonth }, (_, dayIndex) => {
    const dateKey = dateToKey(firstDay.with({ day: dayIndex + 1 }))
    return storedResults[dateKey] ?? null
  })
  const monthlyPlayedCount = monthResults.filter(Boolean).length
  const monthlyWinCount = monthResults.filter((result) => result?.won).length
  const monthlyLossCount = monthlyPlayedCount - monthlyWinCount
  const monthlyAbsenceCount = daysInMonth - monthlyPlayedCount

  const effectiveCalendarStartDate =
    calendarStartDate === undefined
      ? getDailyResultsStartDate()
      : calendarStartDate

  type CellData = {
    day: number | null
    result?: { won: boolean; guessCount: number } | null
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
    const date = firstDay.with({ day: d })
    const key = dateToKey(date)
    const isToday = Temporal.PlainDate.compare(date, today) === 0
    const isFuture = Temporal.PlainDate.compare(date, today) > 0
    const isBeforeEpoch =
      Temporal.PlainDate.compare(date, epoch) < 0 ||
      (effectiveCalendarStartDate !== null && key < effectiveCalendarStartDate)
    const isCalendarEpoch = effectiveCalendarStartDate === key

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

  const monthLabel = `${firstDay.year}-${String(firstDay.month).padStart(
    2,
    '0'
  )}`

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
    <div className="relative flex h-full flex-col items-center pb-20">
      {/* Month navigation */}
      <div className="relative mb-2 flex h-7 w-full items-center justify-center">
        <button
          onClick={goBack}
          type="button"
          className="absolute left-0 p-1 rounded hover:bg-gray-100 cursor-pointer"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="whitespace-nowrap text-center text-base font-semibold text-gray-900">
          {monthLabel}
        </span>
        <div className="absolute right-0 flex items-center gap-1">
          <div
            className="flex items-center gap-1 text-[0.625rem] font-medium text-gray-400"
            title={t('weekStartLabel')}
          >
            <span>{t('mondayStartShortLabel')}</span>
            <MiniToggle
              checked={weekStartsOnMonday}
              onClick={onToggleWeekStartsOnMonday}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setYear(today.year)
              setMonth(today.month - 1)
            }}
            disabled={year === today.year && month === today.month - 1}
            className={`p-1 rounded ${
              year === today.year && month === today.month - 1
                ? 'opacity-30 cursor-default'
                : 'hover:bg-gray-100 cursor-pointer'
            }`}
            title="Today"
          >
            <RefreshIcon className="h-5 w-5" />
          </button>
          <button
            onClick={goForward}
            type="button"
            className="p-1 rounded hover:bg-gray-100 cursor-pointer"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Weekday header + Day grid */}
      <div>
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
      </div>

      {/* Monthly attendance + Share button */}
      <div className="absolute -bottom-2 left-0 grid w-full grid-cols-2 items-center gap-3">
        <div className="flex justify-center pl-8 text-base leading-normal">
          <div className="grid grid-cols-[max-content_auto_auto] gap-x-1">
            <span className="text-right text-green-500">
              {t('calendarSuccess')}
            </span>
            <span className="text-green-500">:</span>
            <span className="text-left tabular-nums text-green-500">
              {monthlyWinCount}
            </span>
            <span className="text-right text-purple-500">
              {t('calendarFailure')}
            </span>
            <span className="text-purple-500">:</span>
            <span className="text-left tabular-nums text-purple-500">
              {monthlyLossCount}
            </span>
            <span className="text-right text-gray-500">
              {t('calendarAbsence')}
            </span>
            <span className="text-gray-500">:</span>
            <span className="text-left tabular-nums text-gray-500">
              {monthlyAbsenceCount}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            disabled={!hasAnyData}
            className={`w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm ${
              hasAnyData
                ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                : 'bg-gray-300 cursor-default'
            }`}
            onClick={() => {
              shareCalendar(
                year,
                month,
                storedResults,
                gameStats.currentStreak,
                weekStartsOnMonday,
                excludeUrl,
                effectiveCalendarStartDate,
                cosmeticOverrides
              )
              handleShare()
            }}
          >
            {t('share')}
          </button>
          <ShareOptionsRow
            excludeUrl={excludeUrl}
            onToggleExcludeUrl={onToggleExcludeUrl}
            onOpenCosmetics={onOpenCosmetics}
            hasNewRewards={hasNewRewards}
          />
        </div>
      </div>
    </div>
  )
}
