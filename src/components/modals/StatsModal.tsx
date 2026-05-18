import { useState, useEffect } from 'react'
import Countdown from 'react-countdown'
import { StatBar } from '../stats/StatBar'
import { Histogram } from '../stats/Histogram'
import { Calendar } from '../calendar/Calendar'
import { GameStats } from '../../lib/localStorage'
import {
  PlayStats,
  PlayStatsSummary,
  getCurrentPlayDurationMs,
  getFirstInputDelayMs,
  getTotalLongPauseMs,
  getTotalDeletePresses,
  getTotalEnterPresses,
  hasPlayStatsActivity,
} from '../../lib/playStats'
import { shareStatus, shareCustomStatus } from '../../lib/share'
import { encodeCustomPuzzle } from '../../lib/customPuzzle'
import { tomorrow } from '../../lib/words'
import { BaseModal } from './BaseModal'
import { ClipboardListIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { GameMode } from '../../lib/gameMode'
import { ShareOptionsRow } from '../stats/ShareOptionsRow'
import { PlayStatsPanel } from '../stats/PlayStatsPanel'
import { CONFIG } from '../../constants/config'
import { Cell } from '../grid/Cell'
import { CharStatus } from '../../lib/statuses'
import {
  getAchievementsUnlockedTodayCount,
  hasNewAchievementsUnlockedToday,
} from '../../lib/achievements'

type Props = {
  isOpen: boolean
  handleClose: () => void
  guesses: string[][]
  gameStats: GameStats
  isGameLost: boolean
  isGameWon: boolean
  handleShare: () => void
  handleCalendarShare: () => void
  mode: GameMode
  solution: string
  questioner?: string
  excludeUrl: boolean
  onToggleExcludeUrl: () => void
  weekStartsOnMonday: boolean
  onToggleWeekStartsOnMonday: () => void
  onOpenCosmetics: () => void
  initialTab?: 'today' | 'calendar' | 'stats'
  isUppercase: boolean
  playStats: PlayStats
  playStatsSummary: PlayStatsSummary
}

const formatSecondsValue = (ms: number) => String(Math.round(ms / 1000))
const formatAverageSecondsValue = (ms: number) => (ms / 1000).toFixed(1)
const EMPTY_VALUE = '-'

type GuessBreakdownRow = {
  row: string
  totalMs?: number
  guessMs?: number
  pauseMs?: number
  totalValue?: string
  guessValue?: string
  pauseValue?: string
  enterPresses?: number
  deletePresses?: number
  enterValue?: string
  deleteValue?: string
  isSummary?: boolean
}

const TodayMetric = ({
  label,
  value,
  cellStatus,
  title,
  tone = 'default',
}: {
  label: string
  value: string
  cellStatus?: CharStatus
  title?: string
  tone?: 'default' | 'success' | 'pending' | 'muted'
}) => {
  const valueClass = {
    default: 'text-gray-900',
    success: 'text-green-600',
    pending: 'text-purple-600',
    muted: 'text-gray-400',
  }[tone]

  return (
    <div className="m-1 min-w-0 text-center">
      {cellStatus ? (
        <div className="flex justify-center" title={title}>
          <Cell value={value} status={cellStatus} />
        </div>
      ) : (
        <div className="flex h-14 items-center justify-center">
          <div className={`min-w-0 text-2xl font-bold ${valueClass}`}>
            {value}
          </div>
        </div>
      )}
      <div className="text-[10px] leading-3">{label}</div>
    </div>
  )
}

export const StatsModal = ({
  isOpen,
  handleClose,
  guesses,
  gameStats,
  isGameLost,
  isGameWon,
  handleShare,
  handleCalendarShare,
  mode,
  solution,
  questioner,
  excludeUrl,
  onToggleExcludeUrl,
  weekStartsOnMonday,
  onToggleWeekStartsOnMonday,
  onOpenCosmetics,
  initialTab,
  isUppercase,
  playStats,
  playStatsSummary,
}: Props) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'stats'>(
    'today'
  )
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [isBreakdownInfoOpen, setIsBreakdownInfoOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'today')
      setIsBreakdownInfoOpen(false)
    }
  }, [isOpen, initialTab])

  useEffect(() => {
    if (!isOpen || playStats.completedAt || !hasPlayStatsActivity(playStats)) {
      return
    }
    setNowMs(Date.now())
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [isOpen, playStats])

  if (mode === 'practice') {
    return (
      <BaseModal
        title={t('records')}
        icon={<ClipboardListIcon />}
        isOpen={isOpen}
        handleClose={handleClose}
      >
        {(isGameLost || isGameWon) && (
          <div className="mt-5 sm:mt-6 flex justify-center">
            <button
              type="button"
              className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => window.location.reload()}
            >
              {t('playAgain')}
            </button>
          </div>
        )}
      </BaseModal>
    )
  }

  if (mode === 'custom') {
    const copyGameUrl = () => {
      const code = encodeCustomPuzzle(solution, questioner!)
      const url = `${window.location.origin}${window.location.pathname}#/custom/${code}`
      navigator.clipboard.writeText(url)
      handleShare()
    }

    return (
      <BaseModal
        title={t('records')}
        icon={<ClipboardListIcon />}
        isOpen={isOpen}
        handleClose={handleClose}
      >
        {questioner && (
          <p className="text-sm text-gray-500 text-center mb-4">
            {t('customPuzzleBy', { name: questioner })}
          </p>
        )}
        {(isGameLost || isGameWon) && (
          <div className="mt-5 sm:mt-6 space-y-2">
            <button
              type="button"
              className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => {
                shareCustomStatus(
                  guesses,
                  isGameLost,
                  solution,
                  questioner!,
                  excludeUrl
                )
                handleShare()
              }}
            >
              {t('shareResult')}
            </button>
            <button
              type="button"
              className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
              onClick={copyGameUrl}
            >
              {t('shareGameUrl')}
            </button>
          </div>
        )}
      </BaseModal>
    )
  }

  const completedToday = isGameWon || isGameLost
  const todayResultChar = isGameWon ? 'w' : isGameLost ? 'l' : '-'
  const todayResult = isUppercase
    ? todayResultChar.toUpperCase()
    : todayResultChar
  const todayResultTitle = isGameWon
    ? t('playStatsResultWin')
    : isGameLost
    ? t('playStatsResultLose')
    : t('playStatsResultYet')
  const todayResultStatus: CharStatus = isGameWon
    ? 'correct'
    : isGameLost
    ? 'present'
    : 'absent'
  const playDurationValue = hasPlayStatsActivity(playStats)
    ? formatSecondsValue(getCurrentPlayDurationMs(playStats, nowMs))
    : EMPTY_VALUE
  const firstInputDelayMs = playStats.firstInputAt
    ? getFirstInputDelayMs(playStats)
    : undefined
  const unlockedTodayCount = getAchievementsUnlockedTodayCount()
  const hasNewAchievementsToday = hasNewAchievementsUnlockedToday()
  const activeGuessIndex = playStats.guessStats.findIndex(
    (guess) => !guess.completedAt
  )
  const getGuessDurationMs = (index: number) => {
    const guess = playStats.guessStats[index]
    if (!guess) return undefined

    const offsetMs = index === 0 ? firstInputDelayMs ?? 0 : 0
    if (guess.durationMs !== undefined) {
      return Math.max(0, guess.durationMs - offsetMs)
    }

    if (index !== activeGuessIndex || !hasPlayStatsActivity(playStats)) {
      return undefined
    }

    if (index === 0 && !playStats.firstInputAt) {
      return undefined
    }

    const startMs =
      index === 0 ? playStats.firstInputAt || guess.startedAt : guess.startedAt
    return Math.max(0, nowMs - startMs)
  }
  const formatOptionalSecondsValue = (ms?: number) =>
    ms === undefined ? EMPTY_VALUE : formatSecondsValue(ms)
  const average = (values: number[]) => {
    if (values.length === 0) return undefined
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }
  const formatAverageMs = (values: (number | undefined)[]) => {
    const numericValues = values.filter(
      (value): value is number => value !== undefined
    )
    const value = average(numericValues)
    return value === undefined ? EMPTY_VALUE : formatAverageSecondsValue(value)
  }
  const formatAverageCount = (values: (number | undefined)[]) => {
    const numericValues = values.filter(
      (value): value is number => value !== undefined
    )
    const value = average(numericValues)
    return value === undefined ? EMPTY_VALUE : value.toFixed(1)
  }
  const sumOptional = (values: (number | undefined)[]) => {
    const numericValues = values.filter(
      (value): value is number => value !== undefined
    )
    if (numericValues.length === 0) return undefined
    return numericValues.reduce((sum, value) => sum + value, 0)
  }
  const guessBreakdownBaseRows: GuessBreakdownRow[] = [
    {
      row: t('playStatsBreakdownBefore'),
      totalMs: firstInputDelayMs,
      guessMs: undefined,
      pauseMs: undefined,
      enterPresses: undefined,
      deletePresses: undefined,
    },
    ...Array.from({ length: CONFIG.tries }, (_, index) => {
      const guess = playStats.guessStats[index]
      const hasGuessActivity =
        !!guess &&
        (guess.completedAt !== undefined ||
          guess.enterPresses > 0 ||
          guess.deletePresses > 0 ||
          guess.longPauseCount > 0 ||
          (index === activeGuessIndex && !!playStats.firstInputAt))
      const totalMs = hasGuessActivity ? getGuessDurationMs(index) : undefined
      const pauseMs = hasGuessActivity ? guess.totalLongPauseMs : undefined
      return {
        row: String(index + 1),
        totalMs,
        guessMs:
          totalMs === undefined || pauseMs === undefined
            ? undefined
            : Math.max(0, totalMs - pauseMs),
        pauseMs,
        enterPresses: hasGuessActivity ? guess.enterPresses : undefined,
        deletePresses: hasGuessActivity ? guess.deletePresses : undefined,
      }
    }),
  ]
  const guessBreakdownGuessRows = guessBreakdownBaseRows.slice(1)
  const guessBreakdownRows: GuessBreakdownRow[] = [
    ...guessBreakdownBaseRows,
    {
      row: t('playStatsBreakdownSum'),
      totalMs: hasPlayStatsActivity(playStats)
        ? getCurrentPlayDurationMs(playStats, nowMs)
        : undefined,
      pauseMs: getTotalLongPauseMs(playStats),
      guessMs: sumOptional(guessBreakdownGuessRows.map((row) => row.guessMs)),
      enterPresses: getTotalEnterPresses(playStats),
      deletePresses: getTotalDeletePresses(playStats),
      isSummary: true,
    },
    {
      row: t('playStatsBreakdownAvgGuess'),
      totalValue: EMPTY_VALUE,
      guessValue: formatAverageMs(
        guessBreakdownGuessRows.map((row) => row.guessMs)
      ),
      pauseValue: formatAverageMs(
        guessBreakdownGuessRows.map((row) => row.pauseMs)
      ),
      enterValue: formatAverageCount(
        guessBreakdownGuessRows.map((row) => row.enterPresses)
      ),
      deleteValue: formatAverageCount(
        guessBreakdownGuessRows.map((row) => row.deletePresses)
      ),
      isSummary: true,
    },
  ]

  // Daily mode — Today + Calendar + Stats
  const tabs = [
    { id: 'today' as const, label: t('today') },
    { id: 'calendar' as const, label: t('calendar') },
    { id: 'stats' as const, label: t('statsShort') },
  ]

  return (
    <BaseModal
      title={t('records')}
      icon={<ClipboardListIcon />}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="h-[26rem]">
        {activeTab === 'today' && (
          <div className="relative flex h-full flex-col pb-20">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="mb-2 grid grid-cols-5 gap-y-2">
                <TodayMetric
                  label={t('playStatsResult')}
                  value={todayResult}
                  cellStatus={todayResultStatus}
                  title={todayResultTitle}
                />
                <TodayMetric
                  label={t('playStatsGuessCount')}
                  value={`${guesses.length}/${CONFIG.tries}`}
                />
                <TodayMetric
                  label={t('playStatsDurationSeconds')}
                  value={playDurationValue}
                />
                <TodayMetric
                  label={t('playStatsUnlockedToday')}
                  value={String(unlockedTodayCount)}
                />
                <TodayMetric
                  label={t('playStatsStreak')}
                  value={String(gameStats.currentStreak)}
                />
              </div>

              <div className="relative">
                {isBreakdownInfoOpen && (
                  <div className="absolute left-2 right-2 top-8 z-20 rounded border border-gray-200 bg-white p-3 text-left text-xs shadow-lg">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-semibold text-gray-900">
                        {t('playStatsBreakdownInfoTitle')}
                      </div>
                      <button
                        type="button"
                        className="font-semibold text-gray-400 hover:text-gray-700"
                        onClick={() => setIsBreakdownInfoOpen(false)}
                        aria-label={t('playStatsBreakdownInfoClose')}
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-2 text-gray-600">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {t('playStatsBreakdownInfoRowLabel')}
                        </p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>{t('playStatsBreakdownInfoRows')}</li>
                          <li>{t('playStatsBreakdownInfoBefore')}</li>
                          <li>{t('playStatsBreakdownInfoSummary')}</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-green-700">
                          {t('playStatsBreakdownDurationSeconds')}
                        </p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>{t('playStatsBreakdownInfoTotal')}</li>
                          <li>{t('playStatsBreakdownInfoGuess')}</li>
                          <li>{t('playStatsBreakdownInfoPause')}</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700">
                          {t('playStatsBreakdownAction')}
                        </p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>{t('playStatsBreakdownInfoEnter')}</li>
                          <li>{t('playStatsBreakdownInfoDelete')}</li>
                          <li className="text-purple-600">
                            {t('playStatsBreakdownInfoHint')}
                          </li>
                        </ul>
                      </div>
                      <p className="border-t border-gray-100 pt-2 text-[11px] text-gray-400">
                        {t('playStatsBreakdownInfoPrivacy')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="overflow-hidden rounded border border-gray-100 text-[11px] leading-4">
                  <table className="w-full table-fixed border-collapse">
                    <colgroup>
                      <col className="w-16" />
                      <col />
                      <col />
                      <col />
                      <col />
                      <col />
                    </colgroup>
                    <thead className="font-semibold text-gray-500">
                      <tr>
                        <th className="border-b border-slate-500 bg-slate-400 px-1.5 py-0.5 text-center text-white">
                          <button
                            type="button"
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
                            onClick={() =>
                              setIsBreakdownInfoOpen(!isBreakdownInfoOpen)
                            }
                            aria-label={t('playStatsBreakdownInfoTitle')}
                          >
                            ℹ️
                          </button>
                        </th>
                        <th
                          colSpan={3}
                          className="border-b border-l border-green-600 bg-green-500 px-1.5 py-0.5 text-center text-white"
                        >
                          {t('playStatsBreakdownDurationSeconds')}
                        </th>
                        <th
                          colSpan={2}
                          className="border-b border-l border-purple-600 bg-purple-500 px-1.5 py-0.5 text-center text-white"
                        >
                          {t('playStatsBreakdownAction')}
                          {playStats.assistFlags.enterValidationHint
                            ? ' ⚠️'
                            : ''}
                        </th>
                      </tr>
                      <tr>
                        <th className="bg-slate-400 px-1.5 py-0.5 text-center text-white">
                          {t('playStatsBreakdownRow')}
                        </th>
                        <th className="border-l border-green-600 bg-green-500 px-1.5 py-0.5 text-center text-white">
                          {t('playStatsBreakdownTotal')}
                        </th>
                        <th className="border-l border-green-600 bg-green-500 px-1.5 py-0.5 text-center text-white">
                          {t('playStatsBreakdownGuess')}
                        </th>
                        <th className="border-l border-green-600 bg-green-500 px-1.5 py-0.5 text-center text-white">
                          {t('playStatsBreakdownPause')}
                        </th>
                        <th className="border-l border-purple-600 bg-purple-500 px-1.5 py-0.5 text-center text-white">
                          {t('playStatsBreakdownEnter')}
                        </th>
                        <th className="border-l border-purple-600 bg-purple-500 px-1.5 py-0.5 text-center text-white">
                          {t('playStatsBreakdownDelete')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {guessBreakdownRows.map((row) => (
                        <tr
                          key={row.row}
                          className={`border-t ${
                            row.isSummary
                              ? 'border-gray-200 bg-gray-100 font-semibold'
                              : 'border-gray-100'
                          }`}
                        >
                          <td className="px-1.5 py-0.5 text-gray-500">
                            {row.row}
                          </td>
                          <td
                            className={`border-l px-1.5 py-0.5 text-right text-gray-900 ${
                              row.isSummary
                                ? 'border-gray-200'
                                : 'border-gray-100'
                            }`}
                          >
                            {row.totalValue ??
                              formatOptionalSecondsValue(row.totalMs)}
                          </td>
                          <td
                            className={`border-l px-1.5 py-0.5 text-right text-gray-900 ${
                              row.isSummary
                                ? 'border-gray-200'
                                : 'border-gray-100'
                            }`}
                          >
                            {row.guessValue ??
                              formatOptionalSecondsValue(row.guessMs)}
                          </td>
                          <td
                            className={`border-l px-1.5 py-0.5 text-right text-gray-900 ${
                              row.isSummary
                                ? 'border-gray-200'
                                : 'border-gray-100'
                            }`}
                          >
                            {row.pauseValue ??
                              formatOptionalSecondsValue(row.pauseMs)}
                          </td>
                          <td
                            className={`border-l px-1.5 py-0.5 text-right text-gray-900 ${
                              row.isSummary
                                ? 'border-gray-200'
                                : 'border-gray-100'
                            }`}
                          >
                            {row.enterValue ??
                              (row.enterPresses === undefined
                                ? EMPTY_VALUE
                                : row.enterPresses)}
                          </td>
                          <td
                            className={`border-l px-1.5 py-0.5 text-right text-gray-900 ${
                              row.isSummary
                                ? 'border-gray-200'
                                : 'border-gray-100'
                            }`}
                          >
                            {row.deleteValue ??
                              (row.deletePresses === undefined
                                ? EMPTY_VALUE
                                : row.deletePresses)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {completedToday ? (
              <div className="absolute bottom-0 left-0 grid w-full grid-cols-2 gap-3">
                <div>
                  <h5>{t('newWordCountdown')}</h5>
                  <Countdown
                    className="text-lg font-medium text-gray-900"
                    date={tomorrow}
                    daysInHours={true}
                  />
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                    onClick={() => {
                      shareStatus(guesses, isGameLost, solution, excludeUrl)
                      handleShare()
                    }}
                  >
                    {t('share')}
                  </button>
                  <ShareOptionsRow
                    excludeUrl={excludeUrl}
                    onToggleExcludeUrl={onToggleExcludeUrl}
                    onOpenCosmetics={onOpenCosmetics}
                    hasNewRewards={hasNewAchievementsToday}
                  />
                </div>
              </div>
            ) : (
              <div />
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <StatBar gameStats={gameStats} />
              {gameStats.totalGames > 0 && (
                <>
                  <h4 className="text-lg leading-6 font-medium text-gray-900">
                    {t('guessDistribution')}
                  </h4>
                  <Histogram gameStats={gameStats} />
                </>
              )}
              <PlayStatsPanel current={null} summary={playStatsSummary} />
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <Calendar
            gameStats={gameStats}
            handleShare={handleCalendarShare}
            weekStartsOnMonday={weekStartsOnMonday}
            onToggleWeekStartsOnMonday={onToggleWeekStartsOnMonday}
            excludeUrl={excludeUrl}
            onToggleExcludeUrl={onToggleExcludeUrl}
            onOpenCosmetics={onOpenCosmetics}
          />
        )}
      </div>
    </BaseModal>
  )
}
