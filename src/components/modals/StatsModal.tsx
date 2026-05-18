import { useState, useEffect } from 'react'
import Countdown from 'react-countdown'
import { StatBar } from '../stats/StatBar'
import { Histogram } from '../stats/Histogram'
import { Calendar } from '../calendar/Calendar'
import { GameStats } from '../../lib/localStorage'
import {
  PlayStats,
  PlayStatsSummary,
  getAverageGuessTimeMs,
  getCurrentPlayDurationMs,
  getDeletePressesByFilledLength,
  getFirstInputDelayMs,
  getIncompleteEnterPresses,
  getInvalidEnterPresses,
  getLongPauseCount,
  getSubmitAccuracy,
  getTotalLongPauseMs,
  getTotalDeletePresses,
  getTotalEnterPresses,
  getValidSubmissions,
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

const formatSeconds = (ms: number) => `${Math.round(ms / 1000)}s`
const EMPTY_VALUE = '-'

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-b border-gray-100 py-1.5 text-sm last:border-b-0">
    <span className="text-gray-500">{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
)

const GuessDetailRow = ({
  label,
  duration,
  enterPresses,
  deletePresses,
  longPauseCount,
  enterLabel,
  deleteLabel,
  pauseLabel,
}: {
  label: string
  duration: string
  enterPresses: number
  deletePresses: number
  longPauseCount: number
  enterLabel: string
  deleteLabel: string
  pauseLabel: string
}) => (
  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 border-b border-gray-100 py-1.5 text-sm last:border-b-0">
    <span className="text-gray-500">{label}</span>
    <span className="font-semibold text-gray-900">{duration}</span>
    <span className="text-xs font-medium text-gray-500">
      {enterLabel} {enterPresses}
    </span>
    <span className="text-xs font-medium text-gray-500">
      {deleteLabel} {deletePresses}
    </span>
    <span className="text-xs font-medium text-gray-500">
      {pauseLabel} {longPauseCount}
    </span>
  </div>
)

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
    <div className="m-1 min-w-0 flex-1 text-center">
      {cellStatus ? (
        <div className="flex justify-center" title={title}>
          <Cell value={value} status={cellStatus} />
        </div>
      ) : (
        <div className="flex h-14 items-center justify-center">
          <div className={`truncate text-3xl font-bold ${valueClass}`}>
            {value}
          </div>
        </div>
      )}
      <div className="text-xs">{label}</div>
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

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab || 'today')
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
  const playDuration = hasPlayStatsActivity(playStats)
    ? formatSeconds(getCurrentPlayDurationMs(playStats, nowMs))
    : EMPTY_VALUE
  const firstInputDelay = playStats.firstInputAt
    ? formatSeconds(getFirstInputDelayMs(playStats))
    : EMPTY_VALUE
  const averageGuessTime =
    getAverageGuessTimeMs(playStats) > 0
      ? formatSeconds(getAverageGuessTimeMs(playStats))
      : EMPTY_VALUE
  const deletePressesByFilledLength = getDeletePressesByFilledLength(playStats)

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
              <div className="flex justify-center my-2">
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
                  label={t('currentStreak')}
                  value={String(gameStats.currentStreak)}
                />
                <TodayMetric
                  label={t('playStatsDuration')}
                  value={playDuration}
                />
              </div>

              <h4 className="mb-2 mt-3 text-sm font-semibold text-gray-900">
                {t('playStatsTitle')}
              </h4>
              <div className="rounded border border-gray-100 px-3 py-2">
                <DetailRow
                  label={t('playStatsDuration')}
                  value={playDuration}
                />
                <DetailRow
                  label={t('playStatsFirstInput')}
                  value={firstInputDelay}
                />
                <DetailRow
                  label={t('playStatsAverageGuess')}
                  value={averageGuessTime}
                />
                <DetailRow
                  label={t('playStatsLongestPause')}
                  value={formatSeconds(playStats.longestPauseMs)}
                />
                <DetailRow
                  label={t('playStatsLongPauses')}
                  value={String(getLongPauseCount(playStats))}
                />
                <DetailRow
                  label={t('playStatsLongPauseTime')}
                  value={formatSeconds(getTotalLongPauseMs(playStats))}
                />
                <DetailRow
                  label={t('playStatsEnterPresses')}
                  value={String(getTotalEnterPresses(playStats))}
                />
                <DetailRow
                  label={t('playStatsIncompleteEnterPresses')}
                  value={String(getIncompleteEnterPresses(playStats))}
                />
                <DetailRow
                  label={t('playStatsInvalidEnterPresses')}
                  value={String(getInvalidEnterPresses(playStats))}
                />
                <DetailRow
                  label={t('playStatsDeletePresses')}
                  value={String(getTotalDeletePresses(playStats))}
                />
                <DetailRow
                  label={t('playStatsEmptyDeletePresses')}
                  value={String(deletePressesByFilledLength[0] || 0)}
                />
                <DetailRow
                  label={t('playStatsFullGuessDeletePresses')}
                  value={String(
                    deletePressesByFilledLength[CONFIG.wordLength] || 0
                  )}
                />
                <DetailRow
                  label={t('playStatsValidSubmissions')}
                  value={String(getValidSubmissions(playStats))}
                />
                <DetailRow
                  label={t('playStatsSubmitAccuracy')}
                  value={`${getSubmitAccuracy(playStats)}%`}
                />
                <DetailRow
                  label={t('playStatsEnterHintAssist')}
                  value={
                    playStats.assistFlags.enterValidationHint
                      ? t('playStatsYes')
                      : t('playStatsNo')
                  }
                />
              </div>
              {playStats.guessStats.length > 0 && (
                <>
                  <h4 className="mb-2 mt-3 text-sm font-semibold text-gray-900">
                    {t('playStatsGuessBreakdown')}
                  </h4>
                  <div className="rounded border border-gray-100 px-3 py-2">
                    {playStats.guessStats.map((guess, index) => (
                      <GuessDetailRow
                        key={index}
                        label={t('playStatsGuessNumber', {
                          count: index + 1,
                        })}
                        duration={
                          guess.durationMs !== undefined
                            ? formatSeconds(guess.durationMs)
                            : EMPTY_VALUE
                        }
                        enterPresses={guess.enterPresses}
                        deletePresses={guess.deletePresses}
                        longPauseCount={guess.longPauseCount}
                        enterLabel={t('playStatsEnterShort')}
                        deleteLabel={t('playStatsDeleteShort')}
                        pauseLabel={t('playStatsPauseShort')}
                      />
                    ))}
                  </div>
                </>
              )}
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
