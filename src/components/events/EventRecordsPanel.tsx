import { Fragment, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Countdown from 'react-countdown'
import { EventDefinition } from '../../lib/events'
import { EventResults } from '../../lib/eventResults'
import { loadAchievementState } from '../../lib/achievements'
import { loadAchievementProgress } from '../../lib/achievementProgress'
import { PlayStats, getTotalGuessTimeMs } from '../../lib/playStats'
import { shareStatus } from '../../lib/share'
import { tomorrow } from '../../lib/words'
import { getLoseReasonIcon } from '../../lib/loseReasons'
import {
  CollectedRowsByCollectible,
  SUMMER_GARDEN_CLOVER_TOTAL_TARGET,
} from '../../lib/eventCollectibles'
import {
  CosmeticOverrides,
  getRewardsForAchievement,
} from '../../lib/cosmetics'
import { Cell } from '../grid/Cell'
import { ShareOptionsRow } from '../stats/ShareOptionsRow'
import { CosmeticPreview } from '../cosmetics/CosmeticPreview'

type Props = {
  event?: EventDefinition | null
  selectedVersion: string
  currentDateKey: string
  results: EventResults
  isCurrentEvent: boolean
  isGameWon: boolean
  isGameLost: boolean
  playStats?: PlayStats
  collectedRows: CollectedRowsByCollectible
  guesses: string[][]
  solution: string
  excludeUrl: boolean
  onToggleExcludeUrl: () => void
  onOpenCosmetics: () => void
  onOpenAchievement: (achievementId: string) => void
  handleShare: () => void
  cosmeticOverrides?: CosmeticOverrides
  hasNewRewards: boolean
}

type EventAchievementProgressItem = {
  id: string
  icon: ReactNode
  label: string
  count: number
  target: number
  clear: boolean
  fillClassName: string
  clearClassName: string
}

const ONE_MINUTE_MS = 60 * 1000
const ONE_MINUTE_TARGET = 7
const EVENT_GAMES_TARGET = 5
const EMPTY_VALUE = '-'
const CLOVER_COLLECTOR_ACHIEVEMENT_ID = 'clover_collector'
const RABBIT_ACHIEVEMENT_ID = 'rabbit_speed'
const GRASSLAND_TRAIL_ACHIEVEMENT_ID = 'grassland_trail'
const GRASS_DIET_ACHIEVEMENT_ID = 'grass_diet'

const EventGroupTitle = ({
  children,
  separated = false,
}: {
  children: string
  separated?: boolean
}) => (
  <div
    className={`flex items-center justify-between gap-2 pb-0.5 text-left text-xs font-bold uppercase tracking-wide text-gray-400 ${
      separated ? 'mt-1 border-t border-gray-200 pt-1.5' : ''
    }`}
  >
    {children}
  </div>
)

const getResultLabel = ({
  t,
  won,
  lost,
  endReason,
  event,
}: {
  t: (key: string) => string
  won: boolean
  lost: boolean
  endReason?: string
  event?: EventDefinition | null
}) => {
  if (won) {
    return {
      icon: '😎',
      label: t('playStatsResultWin'),
      status: 'correct' as const,
    }
  }
  if (lost) {
    return {
      icon: getLoseReasonIcon(endReason, event?.loseReasons),
      label: t('playStatsResultLose'),
      status: 'present' as const,
    }
  }
  return {
    icon: '😶‍🌫️',
    label: t('playStatsResultYet'),
    status: 'absent' as const,
  }
}

const usedWords = (guesses: string[][], words: string[]): boolean => {
  const used = new Set(guesses.map((guess) => guess.join('').toLowerCase()))
  return words.every((word) => used.has(word.toLowerCase()))
}

export const EventRecordsPanel = ({
  event,
  selectedVersion,
  currentDateKey,
  results,
  isCurrentEvent,
  isGameWon,
  isGameLost,
  playStats,
  collectedRows,
  guesses,
  solution,
  excludeUrl,
  onToggleExcludeUrl,
  onOpenCosmetics,
  onOpenAchievement,
  handleShare,
  cosmeticOverrides,
  hasNewRewards,
}: Props) => {
  const { t } = useTranslation()
  const collectible = event?.collectibles?.[0]
  const todayResult = results[currentDateKey]
  const totalEventTries = Object.keys(results).length
  const todayPlayStats = isCurrentEvent ? playStats : todayResult?.playStats
  const todayWon = isCurrentEvent ? isGameWon : todayResult?.won ?? false
  const todayLost = isCurrentEvent ? isGameLost : todayResult
  const todayGuessTimeMs = getTotalGuessTimeMs(todayPlayStats)
  const todayFastWin = todayWon && todayGuessTimeMs <= ONE_MINUTE_MS
  const fastWinCount = Object.values(results).filter(
    (eventResult) =>
      eventResult.won &&
      getTotalGuessTimeMs(eventResult.playStats) <= ONE_MINUTE_MS
  ).length
  const result = getResultLabel({
    t,
    won: todayWon,
    lost: !!todayLost && !todayWon,
    endReason: todayResult?.endReason,
    event,
  })
  const todayCollectedRows =
    collectible && isCurrentEvent ? collectedRows[collectible.id] ?? [] : []
  const todayCloverCount = todayCollectedRows.length
  const todayCloverDisplay =
    todayCloverCount > 0 ? collectible?.emoji.repeat(todayCloverCount) : ''
  const achievementProgress = loadAchievementProgress()
  const achievementState = loadAchievementState()
  const collectionProgress = collectible
    ? achievementProgress.collectibles[collectible.collectionId] ?? {}
    : {}
  const cloverCount = Object.values(collectionProgress).reduce(
    (sum, count) => sum + count,
    0
  )
  const maxProgressTarget = Math.max(
    SUMMER_GARDEN_CLOVER_TOTAL_TARGET,
    ONE_MINUTE_TARGET,
    EVENT_GAMES_TARGET
  )
  const isCloverQuestClear =
    !!achievementState.unlocked[CLOVER_COLLECTOR_ACHIEVEMENT_ID] ||
    cloverCount >= SUMMER_GARDEN_CLOVER_TOTAL_TARGET
  const todayGrassDiet = todayWon && usedWords(guesses, ['green', 'grass'])
  const isGrassDietClear =
    !!achievementState.unlocked[GRASS_DIET_ACHIEVEMENT_ID] || todayGrassDiet
  const grassDietReward = getRewardsForAchievement(GRASS_DIET_ACHIEVEMENT_ID)[0]
  const grasslandTrailReward = getRewardsForAchievement(
    GRASSLAND_TRAIL_ACHIEVEMENT_ID
  )[0]
  const grasslandTrailIcon = grasslandTrailReward ? (
    <CosmeticPreview
      category={grasslandTrailReward.category}
      optionId={grasslandTrailReward.id}
      compact
    />
  ) : (
    '🌿'
  )
  const grassDietIcon = grassDietReward ? (
    <CosmeticPreview
      category={grassDietReward.category}
      optionId={grassDietReward.id}
      compact
    />
  ) : (
    '💚'
  )
  const eventAchievementItems: EventAchievementProgressItem[] = [
    {
      id: CLOVER_COLLECTOR_ACHIEVEMENT_ID,
      icon: collectible?.emoji ?? '🍀',
      label: t('achievement_clover_collector_title'),
      count: cloverCount,
      target: SUMMER_GARDEN_CLOVER_TOTAL_TARGET,
      clear: isCloverQuestClear,
      fillClassName: 'bg-green-500',
      clearClassName: 'bg-green-500',
    },
    {
      id: RABBIT_ACHIEVEMENT_ID,
      icon: '🐇',
      label: t('achievement_rabbit_speed_title'),
      count: fastWinCount,
      target: ONE_MINUTE_TARGET,
      clear: fastWinCount >= ONE_MINUTE_TARGET,
      fillClassName: 'bg-lime-400',
      clearClassName: 'bg-lime-400',
    },
    {
      id: GRASSLAND_TRAIL_ACHIEVEMENT_ID,
      icon: grasslandTrailIcon,
      label: t('achievement_grassland_trail_title'),
      count: totalEventTries,
      target: EVENT_GAMES_TARGET,
      clear:
        !!achievementState.unlocked[GRASSLAND_TRAIL_ACHIEVEMENT_ID] ||
        totalEventTries >= EVENT_GAMES_TARGET,
      fillClassName: 'bg-lime-400',
      clearClassName: 'bg-lime-400',
    },
    {
      id: GRASS_DIET_ACHIEVEMENT_ID,
      icon: grassDietIcon,
      label: t('achievement_grass_diet_title'),
      count: isGrassDietClear ? 1 : 0,
      target: 1,
      clear: isGrassDietClear,
      fillClassName: 'bg-lime-400',
      clearClassName: 'bg-lime-400',
    },
  ]
  const completedCurrentEvent = isCurrentEvent && (isGameWon || isGameLost)

  if (!event || !collectible) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm text-gray-400"
        aria-label="Event records panel"
        data-event-id={event?.id ?? ''}
        data-event-version={selectedVersion}
      >
        {t('eventRecordsEmpty')}
      </div>
    )
  }

  return (
    <div
      className="relative flex h-full flex-col pb-20"
      aria-label="Event records panel"
      data-event-id={event.id}
      data-event-version={selectedVersion}
    >
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <section>
          <EventGroupTitle>{t('statsDashboard')}</EventGroupTitle>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="m-0.5 min-w-0 text-center">
              <div className="flex h-14 items-center justify-center">
                <Cell value={result.icon} status={result.status} />
              </div>
              <div className="text-[10px] leading-3 text-gray-900">
                {t('playStatsResult')}
              </div>
            </div>
            <div className="m-0.5 min-w-0 text-center">
              <div className="flex h-14 items-center justify-center">
                <div className="min-w-0 whitespace-nowrap text-xl font-bold text-gray-900 sm:text-2xl">
                  {totalEventTries}
                </div>
              </div>
              <div className="text-[10px] leading-3 text-gray-900">
                {t('totalTries')}
              </div>
            </div>
            <div className="m-0.5 min-w-0 text-center">
              <div className="flex h-14 items-center justify-center">
                <div className="min-w-0 whitespace-nowrap text-xl font-bold text-gray-900 sm:text-2xl">
                  {todayPlayStats
                    ? String(Math.round(todayGuessTimeMs / 1000))
                    : EMPTY_VALUE}
                </div>
              </div>
              <div className="text-[10px] leading-3 text-gray-900">
                {t('eventGuessTimeSeconds')}
              </div>
            </div>
          </div>
        </section>

        <section>
          <EventGroupTitle separated>{t('eventAchievements')}</EventGroupTitle>
          <ul className="mt-1 space-y-0.5 text-left text-[10px] leading-[0.875rem] text-gray-500">
            <li className="flex items-start gap-1.5">
              <span className="w-5 flex-shrink-0 text-center leading-4">
                {collectible.emoji}
              </span>
              <span className="min-w-0">
                <button
                  type="button"
                  className="font-medium text-indigo-600 underline focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={() =>
                    onOpenAchievement(CLOVER_COLLECTOR_ACHIEVEMENT_ID)
                  }
                >
                  {t('achievement_clover_collector_title')}
                </button>
                <span>: {t('eventMissionCloverCollectorHelp')}</span>
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-5 flex-shrink-0 text-center leading-4">
                🐇
              </span>
              <span className="min-w-0">
                <button
                  type="button"
                  className="font-medium text-indigo-600 underline focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={() => onOpenAchievement(RABBIT_ACHIEVEMENT_ID)}
                >
                  {t('achievement_rabbit_speed_title')}
                </button>
                <span>: {t('eventMissionRabbitDashHelp')}</span>
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="flex w-5 flex-shrink-0 justify-center leading-4">
                {grasslandTrailIcon}
              </span>
              <span className="min-w-0">
                <button
                  type="button"
                  className="font-medium text-indigo-600 underline focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={() =>
                    onOpenAchievement(GRASSLAND_TRAIL_ACHIEVEMENT_ID)
                  }
                >
                  {t('achievement_grassland_trail_title')}
                </button>
                <span>: {t('eventMissionGrasslandTrailHelp')}</span>
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="flex w-5 flex-shrink-0 justify-center leading-4">
                {grassDietIcon}
              </span>
              <span className="min-w-0">
                <button
                  type="button"
                  className="font-medium text-indigo-600 underline focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={() => onOpenAchievement(GRASS_DIET_ACHIEVEMENT_ID)}
                >
                  {t('achievement_grass_diet_title')}
                </button>
                <span>: {t('eventMissionGrassDietHelp')}</span>
              </span>
            </li>
          </ul>
        </section>

        <section>
          <EventGroupTitle separated>{t('today')}</EventGroupTitle>
          <div className="mt-1.5 grid grid-cols-4 items-stretch text-center">
            <div className="flex min-w-0 flex-col items-center justify-center">
              <div className="h-6 max-w-full truncate text-lg font-bold leading-6 text-gray-900">
                {todayCloverDisplay}
              </div>
            </div>
            <div className="flex min-w-0 flex-col items-center justify-center border-l border-gray-200">
              <div className="h-6 text-lg leading-6">
                {todayFastWin ? '🐇' : ''}
              </div>
            </div>
            <div className="flex min-w-0 flex-col items-center justify-center border-l border-gray-200">
              <div className="flex h-6 items-center justify-center text-lg leading-6">
                {completedCurrentEvent ? grasslandTrailIcon : ''}
              </div>
            </div>
            <div className="flex min-w-0 flex-col items-center justify-center border-l border-gray-200">
              <div className="flex h-6 items-center justify-center text-lg leading-6">
                {todayGrassDiet ? grassDietIcon : ''}
              </div>
            </div>
          </div>
        </section>

        <section>
          <EventGroupTitle separated>
            {t('eventSeasonProgress')}
          </EventGroupTitle>
          <div className="grid grid-cols-[1.25rem_minmax(5.5rem,1fr)_minmax(0,1fr)_3.125rem_2.75rem] gap-x-1.5 gap-y-0.5 pt-0.5">
            {eventAchievementItems.map((achievement) => {
              const targetWidth = (achievement.target / maxProgressTarget) * 100
              const progress = Math.min(
                1,
                achievement.count / achievement.target
              )

              return (
                <Fragment key={achievement.id}>
                  <div className="flex items-center justify-center leading-none">
                    {achievement.icon}
                  </div>
                  <div className="min-w-0 truncate text-left text-xs font-medium text-gray-900">
                    {achievement.label}
                  </div>
                  <div className="flex h-4 min-w-0 items-center">
                    <div
                      className="relative h-2.5 rounded-full bg-gray-200"
                      style={{ width: `${targetWidth}%` }}
                    >
                      <div
                        className={`h-2.5 rounded-full ${achievement.fillClassName}`}
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    {achievement.clear && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none text-white ${achievement.clearClassName}`}
                      >
                        CLEAR!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end text-xs font-semibold text-gray-700">
                    {achievement.count}/{achievement.target}
                  </div>
                </Fragment>
              )
            })}
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
            disabled={!completedCurrentEvent}
            className={`w-full rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm ${
              completedCurrentEvent
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
                event.shareContextLabel
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
