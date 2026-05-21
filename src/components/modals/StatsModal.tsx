import { ReactNode, useState, useEffect } from 'react'
import Countdown from 'react-countdown'
import { StatBar } from '../stats/StatBar'
import { Histogram } from '../stats/Histogram'
import { WinLossBar } from '../stats/WinLossBar'
import { LoseReasonDistribution } from '../stats/LoseReasonDistribution'
import { Calendar } from '../calendar/Calendar'
import { GameStats } from '../../lib/localStorage'
import {
  PlayStats,
  DetailStatsSummary,
  getCurrentPlayDurationMs,
  getFirstInputDelayMs,
  getTotalLongPauseMs,
  getTotalDeletePresses,
  getTotalEnterPresses,
  hasPlayStatsActivity,
  countTileStatusesForGame,
  summarizeDetailStats,
} from '../../lib/playStats'
import { shareStatus, shareCustomStatus } from '../../lib/share'
import { encodeCustomPuzzle } from '../../lib/customPuzzle'
import { tomorrow } from '../../lib/words'
import { BaseModal } from './BaseModal'
import {
  ClipboardListIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { GameMode } from '../../lib/gameMode'
import {
  EventDefinition,
  getEventByVersion,
  getKnownEvents,
} from '../../lib/events'
import { EventVersionPicker } from '../events/EventVersionPicker'
import { EventRecordsPanel } from '../events/EventRecordsPanel'
import {
  EventResultsByVersion,
  getEventDetailStatsHistory,
} from '../../lib/eventResults'
import { summarizeResultsAsGameStats } from '../../lib/resultStats'
import { ShareOptionsRow } from '../stats/ShareOptionsRow'
import { DetailStatsPanel } from '../stats/DetailStatsPanel'
import { CONFIG } from '../../constants/config'
import { getLoseReasonIcon } from '../../lib/loseReasons'
import { Cell } from '../grid/Cell'
import { CharStatus } from '../../lib/statuses'
import {
  getAchievementsUnlockedTodayCount,
  hasNewAchievementsUnlockedToday,
} from '../../lib/achievements'
import { DailyResults } from '../../lib/dailyResults'
import { normalizeRewardVersion } from '../../lib/rewardMetadata'
import {
  CosmeticOverrides,
  resolveCosmeticOverrides,
} from '../../lib/cosmetics'
import { CollectedRowsByCollectible } from '../../lib/eventCollectibles'

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
  onOpenAchievement: (achievementId: string) => void
  onOpenDeadEndHelp?: () => void
  initialTab?: RecordsTab
  isUppercase: boolean
  playStats: PlayStats
  detailStatsSummary: DetailStatsSummary
  dailyResults: DailyResults
  eventResultsByVersion: EventResultsByVersion
  event?: EventDefinition
  cosmeticOverrides?: CosmeticOverrides
  currentDateKey?: string
  eventCollectedRows?: CollectedRowsByCollectible
}

type RecordsTab = 'today' | 'calendar' | 'summary' | 'details' | 'event'

const formatSecondsValue = (ms: number) => String(Math.round(ms / 1000))
const EMPTY_VALUE = '-'
type SummaryInfoItem = string | { text: string; children?: SummaryInfoItem[] }

const SummaryGroupTitle = ({
  children,
  action,
  info,
  separated = false,
}: {
  children: ReactNode
  action?: ReactNode
  info?: ReactNode
  separated?: boolean
}) => (
  <div
    className={`flex items-center justify-between gap-2 pb-0.5 text-left text-xs font-bold uppercase tracking-wide text-gray-400 ${
      separated ? 'mt-1.5 border-t border-gray-200 pt-1.5' : ''
    }`}
  >
    <span className="inline-flex items-center gap-1">
      <span>{children}</span>
      {info}
    </span>
    {action}
  </div>
)

const SummaryInfoButton = ({
  title,
  intro,
  items,
  footer,
}: {
  title: string
  intro?: string
  items: SummaryInfoItem[]
  footer?: string
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const renderItems = (list: SummaryInfoItem[], nested = false) => (
    <ul
      className={`list-disc space-y-1 text-left ${
        nested ? 'mt-1 pl-4' : 'pl-4'
      }`}
    >
      {list.map((item, index) => {
        const text = typeof item === 'string' ? item : item.text
        const children = typeof item === 'string' ? undefined : item.children
        return (
          <li key={`${text}-${index}`}>
            <span>{text}</span>
            {children && renderItems(children, true)}
          </li>
        )
      })}
    </ul>
  )

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={title}
      >
        <InformationCircleIcon className="h-3.5 w-3.5" />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-5 z-30 w-72 rounded border border-gray-200 bg-white p-3 text-left text-xs font-normal normal-case leading-4 tracking-normal text-gray-600 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="font-semibold text-gray-900">{title}</div>
            <button
              type="button"
              className="shrink-0 font-semibold text-gray-400 hover:text-gray-700"
              onClick={() => setIsOpen(false)}
              aria-label={t('summaryInfoClose')}
            >
              ×
            </button>
          </div>
          {intro && <p className="mb-2">{intro}</p>}
          {renderItems(items)}
          {footer && (
            <p className="mt-2 border-t border-gray-100 pt-2 text-left text-purple-600">
              {footer}
            </p>
          )}
        </div>
      )}
    </span>
  )
}

const TodayMetric = ({
  label,
  value,
  cellStatus,
  title,
  tone = 'default',
  cosmeticOverrides,
}: {
  label: string
  value: string
  cellStatus?: CharStatus
  title?: string
  tone?: 'default' | 'success' | 'pending' | 'muted'
  cosmeticOverrides?: CosmeticOverrides
}) => {
  const valueClass = {
    default: 'text-gray-900',
    success: 'text-green-600',
    pending: 'text-purple-600',
    muted: 'text-gray-400',
  }[tone]

  return (
    <div className="m-0.5 min-w-0 text-center">
      {cellStatus ? (
        <div className="flex h-14 items-center justify-center" title={title}>
          <Cell
            value={value}
            status={cellStatus}
            cosmeticOverrides={cosmeticOverrides}
          />
        </div>
      ) : (
        <div className="flex h-14 items-center justify-center">
          <div
            className={`min-w-0 whitespace-nowrap text-xl font-bold sm:text-2xl ${valueClass}`}
          >
            {value}
          </div>
        </div>
      )}
      <div className="text-[10px] leading-3">{label}</div>
    </div>
  )
}

const TodayStatMetric = ({
  label,
  value,
  labelClassName = 'text-gray-500',
  className = '',
  relaxed = false,
}: {
  label: ReactNode
  value: string
  labelClassName?: string
  className?: string
  relaxed?: boolean
}) => (
  <div
    className={`flex ${
      relaxed ? 'h-[3.25rem]' : 'h-11'
    } min-w-0 flex-col items-center justify-center px-0.5 text-center ${className}`}
  >
    <div className="flex h-5 min-w-0 items-center">
      <div className="min-w-0 whitespace-nowrap text-xl font-bold leading-none text-gray-900 sm:text-2xl">
        {value}
      </div>
    </div>
    <div
      className={`${
        relaxed ? 'mt-3' : 'mt-0.5'
      } flex min-h-[1.1rem] items-start justify-center gap-0.5 break-words text-[10px] leading-[0.65rem] ${labelClassName}`}
    >
      {label}
    </div>
  </div>
)

const TodayMetricGrid = ({
  items,
  columns = 4,
  separateFirstItem = false,
  relaxed = false,
}: {
  columns?: 4 | 5
  separateFirstItem?: boolean
  relaxed?: boolean
  items: Array<{
    label: ReactNode
    value: string
    labelClassName?: string
  }>
}) => (
  <div className={`min-w-0 px-0.5 text-center ${relaxed ? 'mt-0.5' : ''}`}>
    <div
      className={`grid w-full ${columns === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}
    >
      {items.map((item, index) => (
        <TodayStatMetric
          key={index}
          label={item.label}
          value={item.value}
          labelClassName={item.labelClassName}
          relaxed={relaxed}
          className={
            separateFirstItem && index === 0
              ? 'border-r border-gray-300'
              : undefined
          }
        />
      ))}
    </div>
  </div>
)

const TodayActionMetricGrid = ({
  enterGroupLabel,
  items,
}: {
  enterGroupLabel: string
  items: Array<{
    label: ReactNode
    value: string
    labelClassName?: string
  }>
}) => (
  <div className="min-w-0 px-0.5 text-center">
    <div className="grid grid-cols-4">
      {items.map((item, index) => (
        <TodayStatMetric
          key={index}
          label={index < 2 ? item.label : ''}
          value={item.value}
          labelClassName={item.labelClassName}
          className={
            index === 1 || index === 2 ? 'border-r border-gray-300' : undefined
          }
        />
      ))}
      <div className="col-span-2 -mt-0.5 border-r border-gray-300 text-[10px] leading-3 text-gray-900">
        {enterGroupLabel}
      </div>
      <div className="-mt-0.5 border-r border-gray-300 text-[10px] leading-3 text-gray-900">
        {items[2]?.label}
      </div>
      <div className="-mt-0.5 text-[10px] leading-3 text-gray-900">
        {items[3]?.label}
      </div>
    </div>
  </div>
)

const TodayTileMetric = ({
  count,
  label,
  labelClassName,
  status,
  cosmeticOverrides,
}: {
  count: number
  label: string
  labelClassName: string
  status?: CharStatus
  cosmeticOverrides?: CosmeticOverrides
}) => (
  <div
    className="flex min-w-0 flex-col items-center justify-center"
    aria-label={label}
  >
    <Cell
      value={String(count)}
      status={status}
      cosmeticOverrides={cosmeticOverrides}
    />
    <div
      className={`min-h-[1rem] break-words text-center text-[10px] leading-[0.65rem] ${labelClassName}`}
    >
      {label}
    </div>
  </div>
)

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
  onOpenAchievement,
  onOpenDeadEndHelp,
  initialTab,
  playStats,
  detailStatsSummary,
  dailyResults,
  eventResultsByVersion,
  event,
  cosmeticOverrides,
  currentDateKey = '',
  eventCollectedRows = {},
}: Props) => {
  const { t } = useTranslation()
  const isEventRecords = mode === 'event'
  const [activeTab, setActiveTab] = useState<RecordsTab>('today')
  const [selectedEventVersion, setSelectedEventVersion] = useState(
    () => event?.version ?? ''
  )
  const [selectedEventCosmeticOverrides, setSelectedEventCosmeticOverrides] =
    useState<CosmeticOverrides | undefined>(() => cosmeticOverrides)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || (mode === 'event' ? 'event' : 'today'))
      if (mode === 'event' && event) {
        setSelectedEventVersion(event.version)
        setSelectedEventCosmeticOverrides(cosmeticOverrides)
      }
    }
  }, [isOpen, initialTab, mode, event, cosmeticOverrides])

  useEffect(() => {
    if (!isEventRecords) {
      setSelectedEventCosmeticOverrides(undefined)
      return
    }
    if (event?.version === selectedEventVersion) {
      setSelectedEventCosmeticOverrides(cosmeticOverrides)
      return
    }
    const selectedEvent = getEventByVersion(selectedEventVersion)
    setSelectedEventCosmeticOverrides(
      resolveCosmeticOverrides(selectedEvent?.cosmeticOverrides)
    )
  }, [isEventRecords, selectedEventVersion, event, cosmeticOverrides])

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

  const knownEvents = getKnownEvents()
  const eventVersions = Array.from(
    new Set([
      ...(event ? [event.version] : []),
      ...knownEvents.map((knownEvent) => knownEvent.version),
      ...Object.keys(eventResultsByVersion),
    ])
  ).sort((a, b) => b.localeCompare(a))
  const selectedVersion =
    selectedEventVersion || event?.version || eventVersions[0] || ''
  const selectedEvent =
    getEventByVersion(selectedVersion) ||
    (event?.version === selectedVersion ? event : null)
  const selectedCosmeticOverrides =
    event?.version === selectedVersion
      ? cosmeticOverrides
      : selectedEventCosmeticOverrides
  const activeEventShareContext =
    mode === 'event' && event ? event.shareContextLabel : undefined
  const selectedEventResults = eventResultsByVersion[selectedVersion] ?? {}
  const selectedEventStats = summarizeResultsAsGameStats(selectedEventResults)
  const selectedEventDetailSummary = summarizeDetailStats(
    getEventDetailStatsHistory(selectedEventResults)
  )
  const recordsGameStats = isEventRecords ? selectedEventStats : gameStats
  const recordsDetailStatsSummary = isEventRecords
    ? selectedEventDetailSummary
    : detailStatsSummary
  const achievementMetadataFilter =
    isEventRecords && selectedVersion
      ? { introducedInVersion: normalizeRewardVersion(selectedVersion) }
      : undefined

  const completedToday = isGameWon || isGameLost
  const todayStoredResult = isEventRecords
    ? selectedEventResults[currentDateKey]
    : dailyResults[currentDateKey]
  const todayResult = isGameWon
    ? '😎'
    : isGameLost
    ? getLoseReasonIcon(
        todayStoredResult?.endReason,
        isEventRecords ? selectedEvent?.loseReasons : undefined
      )
    : '😶‍🌫️'
  const todayResultStatus: CharStatus = isGameWon
    ? 'correct'
    : isGameLost
    ? 'present'
    : 'absent'
  const todayResultTitle = isGameWon
    ? t('playStatsResultWin')
    : isGameLost
    ? t('playStatsResultLose')
    : t('playStatsResultYet')
  const currentPlayDurationMs = hasPlayStatsActivity(playStats)
    ? getCurrentPlayDurationMs(playStats, nowMs)
    : undefined
  const playDurationValue =
    currentPlayDurationMs === undefined
      ? EMPTY_VALUE
      : formatSecondsValue(currentPlayDurationMs)
  const firstInputDelayMs = playStats.firstInputAt
    ? getFirstInputDelayMs(playStats)
    : undefined
  const totalLongPauseMs = getTotalLongPauseMs(playStats)
  const totalGuessTimeMs =
    currentPlayDurationMs === undefined || firstInputDelayMs === undefined
      ? undefined
      : Math.max(
          0,
          currentPlayDurationMs - firstInputDelayMs - totalLongPauseMs
        )
  const totalEnterPresses = getTotalEnterPresses(playStats)
  const totalIncompleteEnterPresses = playStats.guessStats.reduce(
    (sum, guess) => sum + guess.incompleteEnterPresses,
    0
  )
  const totalInvalidEnterPresses = playStats.guessStats.reduce(
    (sum, guess) => sum + guess.invalidEnterPresses,
    0
  )
  const totalValidEnterPresses = Math.max(
    0,
    totalEnterPresses - totalIncompleteEnterPresses - totalInvalidEnterPresses
  )
  const totalFailedEnterPresses =
    totalInvalidEnterPresses + totalIncompleteEnterPresses
  const totalDeletePresses = getTotalDeletePresses(playStats)
  const frictionPerSubmit =
    totalValidEnterPresses > 0
      ? (
          (totalDeletePresses +
            totalInvalidEnterPresses +
            totalIncompleteEnterPresses) /
          totalValidEnterPresses
        ).toFixed(1)
      : EMPTY_VALUE
  const todayTileCounts = countTileStatusesForGame(guesses, solution)
  const unlockedTodayCount = getAchievementsUnlockedTodayCount()
  const hasNewAchievementsToday = hasNewAchievementsUnlockedToday()
  const summaryWins = recordsGameStats.totalGames - recordsGameStats.gamesFailed
  const averageWinGuesses =
    summaryWins > 0
      ? (
          recordsGameStats.winDistribution.reduce(
            (sum, value, index) => sum + value * (index + 1),
            0
          ) / summaryWins
        ).toFixed(1)
      : EMPTY_VALUE
  const eventVersionSelect =
    isEventRecords && eventVersions.length > 0 ? (
      <EventVersionPicker
        versions={eventVersions}
        selectedVersion={selectedVersion}
        onChange={setSelectedEventVersion}
        fallbackEvent={event}
      />
    ) : undefined

  // Daily/Event mode — seasonal Event + Today + Calendar + Summary + Details
  const tabs = [
    ...(isEventRecords ? [{ id: 'event' as const, label: t('event') }] : []),
    { id: 'today' as const, label: t('today') },
    { id: 'calendar' as const, label: t('calendar') },
    { id: 'summary' as const, label: t('statsSummary') },
    { id: 'details' as const, label: t('statsDetails') },
  ]

  return (
    <BaseModal
      title={t('records')}
      titleAction={eventVersionSelect}
      icon={<ClipboardListIcon />}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <div className="flex overflow-x-auto border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`shrink-0 px-4 py-2 text-sm font-medium ${
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

      <div className="h-[28rem]">
        {activeTab === 'today' && (
          <div className="relative flex h-full flex-col pb-[4.5625rem]">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <section>
                <SummaryGroupTitle
                  info={
                    <SummaryInfoButton
                      title={t('statsDashboard')}
                      items={[
                        t('todayDashboardInfoResult'),
                        t('todayDashboardInfoGuesses'),
                        t('todayDashboardInfoAchievements'),
                        t('todayDashboardInfoStreak'),
                      ]}
                    />
                  }
                >
                  {t('statsDashboard')}
                </SummaryGroupTitle>
                <div className="mb-1 grid grid-cols-4 gap-y-1">
                  <TodayMetric
                    label={t('playStatsResult')}
                    value={todayResult}
                    cellStatus={todayResultStatus}
                    title={todayResultTitle}
                    cosmeticOverrides={cosmeticOverrides}
                  />
                  <TodayMetric
                    label={t('playStatsGuessCount')}
                    value={`${guesses.length}/${CONFIG.tries}`}
                  />
                  <TodayMetric
                    label={t('playStatsUnlockedToday')}
                    value={String(unlockedTodayCount)}
                  />
                  <TodayMetric
                    label={t('playStatsStreak')}
                    value={
                      completedToday
                        ? `🔥${recordsGameStats.currentStreak}`
                        : String(recordsGameStats.currentStreak)
                    }
                  />
                </div>
              </section>

              <section>
                <SummaryGroupTitle
                  separated
                  info={
                    <SummaryInfoButton
                      title={`${t('detailTime')} (s)`}
                      items={[
                        t('detailTimeInfoDuration'),
                        t('detailTimeInfoGuess'),
                        t('detailTimeInfoFirstInput'),
                        t('detailTimeInfoPause'),
                      ]}
                    />
                  }
                >
                  {t('detailTime')} (s)
                </SummaryGroupTitle>
                <TodayMetricGrid
                  separateFirstItem
                  relaxed
                  items={[
                    {
                      label: t('detailTotalDuration'),
                      value: playDurationValue,
                    },
                    {
                      label: t('detailGuessShort'),
                      value:
                        totalGuessTimeMs === undefined
                          ? EMPTY_VALUE
                          : formatSecondsValue(totalGuessTimeMs),
                      labelClassName: 'text-green-500',
                    },
                    {
                      label: t('playStatsFirstInput'),
                      value:
                        firstInputDelayMs === undefined
                          ? EMPTY_VALUE
                          : formatSecondsValue(firstInputDelayMs),
                      labelClassName: 'text-gray-500',
                    },
                    {
                      label: t('playStatsBreakdownPause'),
                      value: formatSecondsValue(totalLongPauseMs),
                      labelClassName: 'text-gray-500',
                    },
                  ]}
                />
              </section>

              <section>
                <SummaryGroupTitle
                  separated
                  info={
                    <SummaryInfoButton
                      title={t('playStatsBreakdownAction')}
                      intro={t('detailActionInfoIntro')}
                      items={[
                        {
                          text: t('detailActionInfoEnter'),
                          children: [
                            t('detailActionInfoEnterSubmit'),
                            t('detailActionInfoEnterFailed'),
                          ],
                        },
                        t('detailActionInfoDelete'),
                        {
                          text: t('detailActionInfoFriction'),
                          children: [
                            t('detailActionInfoFrictionFormula'),
                            t('detailActionInfoFrictionZeroSubmit'),
                          ],
                        },
                      ]}
                      footer={t('playStatsBreakdownInfoHint')}
                    />
                  }
                >
                  {t('playStatsBreakdownAction')}
                  {playStats.assistFlags.enterValidationHint ? ' ⚠️' : ''}
                </SummaryGroupTitle>
                <TodayActionMetricGrid
                  enterGroupLabel={t('playStatsBreakdownEnter')}
                  items={[
                    {
                      label: t('detailSubmitShort'),
                      value: String(totalValidEnterPresses),
                      labelClassName: 'text-green-500',
                    },
                    {
                      label: t('detailFailedEnterShort'),
                      value: String(totalFailedEnterPresses),
                      labelClassName: 'text-purple-500',
                    },
                    {
                      label: (
                        <span className="text-purple-500">
                          {t('playStatsBreakdownDelete')}
                        </span>
                      ),
                      value: String(totalDeletePresses),
                    },
                    {
                      label: (
                        <>
                          <span className="text-purple-500">
                            {t('detailFrictionShort')}
                          </span>
                          <span>/</span>
                          <span className="text-green-500">
                            {t('detailSubmitShort')}
                          </span>
                        </>
                      ),
                      value: frictionPerSubmit,
                    },
                  ]}
                />
              </section>

              <section>
                <SummaryGroupTitle
                  separated
                  info={
                    <SummaryInfoButton
                      title={t('detailTiles')}
                      items={[
                        t('detailTilesInfoCorrect'),
                        t('detailTilesInfoPresent'),
                        t('detailTilesInfoAbsent'),
                        t('detailTilesInfoUnrevealed'),
                        t('detailTilesInfoDeadEnd'),
                      ]}
                    />
                  }
                >
                  {t('detailTiles')}
                </SummaryGroupTitle>
                <div className="grid grid-cols-4 gap-0.5 px-0.5">
                  <TodayTileMetric
                    label={t('detailTileCorrect')}
                    status="correct"
                    labelClassName="text-green-500"
                    count={todayTileCounts.correct}
                    cosmeticOverrides={cosmeticOverrides}
                  />
                  <TodayTileMetric
                    label={t('detailTilePresent')}
                    status="present"
                    labelClassName="text-purple-500"
                    count={todayTileCounts.present}
                    cosmeticOverrides={cosmeticOverrides}
                  />
                  <TodayTileMetric
                    label={t('detailTileAbsent')}
                    status="absent"
                    labelClassName="text-gray-500"
                    count={todayTileCounts.absent}
                    cosmeticOverrides={cosmeticOverrides}
                  />
                  <TodayTileMetric
                    label={t('detailTileUnrevealed')}
                    labelClassName="text-gray-500"
                    count={todayTileCounts.unrevealed}
                    cosmeticOverrides={cosmeticOverrides}
                  />
                </div>
              </section>
            </div>
            <div className="absolute -bottom-2 left-0 grid w-full grid-cols-2 items-center gap-3">
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
                  disabled={!completedToday}
                  className={`w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm ${
                    completedToday
                      ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                      : 'bg-gray-300 cursor-default'
                  }`}
                  onClick={() => {
                    shareStatus(
                      guesses,
                      isGameLost,
                      solution,
                      excludeUrl,
                      cosmeticOverrides,
                      activeEventShareContext
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
                  hasNewRewards={hasNewAchievementsToday}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <section>
                <SummaryGroupTitle>{t('statsDashboard')}</SummaryGroupTitle>
                <StatBar
                  gameStats={recordsGameStats}
                  averageWinGuesses={averageWinGuesses}
                  achievementMetadataFilter={achievementMetadataFilter}
                />
              </section>
              <section>
                <SummaryGroupTitle separated>
                  {t('statsRecord')}
                </SummaryGroupTitle>
                <WinLossBar gameStats={recordsGameStats} />
              </section>
              <section>
                <SummaryGroupTitle separated>
                  {t('winGuessDistribution')}
                </SummaryGroupTitle>
                <Histogram gameStats={recordsGameStats} />
              </section>
              <section>
                <SummaryGroupTitle
                  separated
                  info={
                    <SummaryInfoButton
                      title={t('loseReasonDistribution')}
                      items={[
                        ...(isEventRecords
                          ? selectedEvent?.loseReasons ??
                            event?.loseReasons ??
                            []
                          : []
                        ).map((reason) => t(reason.infoKey)),
                        ...(!isEventRecords
                          ? [
                              t('loseReasonGuessLimitInfo'),
                              t('loseReasonDeadEndInfo'),
                              t('loseReasonUnknownInfoBody'),
                            ]
                          : []),
                      ]}
                    />
                  }
                >
                  {t('loseReasonDistribution')}
                </SummaryGroupTitle>
                <LoseReasonDistribution
                  gameStats={recordsGameStats}
                  dailyResults={isEventRecords ? undefined : dailyResults}
                  results={isEventRecords ? selectedEventResults : undefined}
                  reasonDefinitions={
                    isEventRecords
                      ? selectedEvent?.loseReasons ?? event?.loseReasons
                      : undefined
                  }
                  onOpenDeadEndHelp={onOpenDeadEndHelp}
                />
              </section>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <DetailStatsPanel
                summary={recordsDetailStatsSummary}
                cosmeticOverrides={selectedCosmeticOverrides}
              />
            </div>
          </div>
        )}

        {activeTab === 'event' && isEventRecords && (
          <EventRecordsPanel
            event={selectedEvent}
            selectedVersion={selectedVersion}
            currentDateKey={currentDateKey}
            results={selectedEventResults}
            isCurrentEvent={event?.version === selectedVersion}
            isGameWon={isGameWon}
            isGameLost={isGameLost}
            playStats={playStats.completedAt ? playStats : undefined}
            collectedRows={eventCollectedRows}
            guesses={guesses}
            solution={solution}
            excludeUrl={excludeUrl}
            onToggleExcludeUrl={onToggleExcludeUrl}
            onOpenCosmetics={onOpenCosmetics}
            onOpenAchievement={onOpenAchievement}
            handleShare={handleShare}
            cosmeticOverrides={selectedCosmeticOverrides}
            hasNewRewards={hasNewAchievementsToday}
          />
        )}

        {activeTab === 'calendar' && (
          <Calendar
            gameStats={recordsGameStats}
            results={isEventRecords ? selectedEventResults : undefined}
            calendarStartDate={isEventRecords ? null : undefined}
            handleShare={handleCalendarShare}
            weekStartsOnMonday={weekStartsOnMonday}
            onToggleWeekStartsOnMonday={onToggleWeekStartsOnMonday}
            excludeUrl={excludeUrl}
            onToggleExcludeUrl={onToggleExcludeUrl}
            onOpenCosmetics={onOpenCosmetics}
            hasNewRewards={hasNewAchievementsToday}
            cosmeticOverrides={
              activeTab === 'calendar'
                ? selectedCosmeticOverrides
                : cosmeticOverrides
            }
            shareContextLabel={
              isEventRecords ? selectedEvent?.shareContextLabel : undefined
            }
          />
        )}
      </div>
    </BaseModal>
  )
}
