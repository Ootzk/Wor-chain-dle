import { Fragment, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { EventDefinition } from '../../lib/events'
import { EventResults } from '../../lib/eventResults'
import { loadAchievementState } from '../../lib/achievements'
import { loadAchievementProgress } from '../../lib/achievementProgress'
import { PlayStats, getTotalGuessTimeMs } from '../../lib/playStats'
import { shareStatus } from '../../lib/share'
import { getLoseReasonIcon } from '../../lib/loseReasons'
import {
  CollectedRowsByCollectible,
  getCollectibleProgressItemId,
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
      separated ? 'mt-1.5 border-t border-gray-200 pt-1.5' : ''
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
  const progressTargets = collectible?.progressTargets ?? {}
  const targetRows = collectible?.targetRows ?? []
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
  const achievementProgress = loadAchievementProgress()
  const achievementState = loadAchievementState()
  const collectionProgress = collectible
    ? achievementProgress.collectibles[collectible.collectionId] ?? {}
    : {}
  const maxTarget = Math.max(1, ...Object.values(progressTargets))
  const progressRows = targetRows.map((rowIndex) => {
    const itemId = getCollectibleProgressItemId(rowIndex)
    const target = progressTargets[itemId] ?? 1
    return {
      id: itemId,
      label: t('eventRowLabel', { row: rowIndex + 1 }),
      count: collectionProgress[itemId] ?? 0,
      target,
      fillClassName: 'bg-green-500',
      clearClassName: 'bg-green-500',
    }
  })
  const oneMinuteProgressRow = {
    id: 'one-minute',
    label: t('eventOneMinute'),
    count: fastWinCount,
    target: ONE_MINUTE_TARGET,
    fillClassName: 'bg-lime-400',
    clearClassName: 'bg-lime-400',
  }
  const eventGamesProgressRow = {
    id: 'games',
    label: t('eventGames'),
    count: totalEventTries,
    target: EVENT_GAMES_TARGET,
    fillClassName: 'bg-lime-400',
    clearClassName: 'bg-lime-400',
  }
  const maxProgressTarget = Math.max(
    maxTarget,
    ONE_MINUTE_TARGET,
    EVENT_GAMES_TARGET,
    ...progressRows.map((row) => row.target)
  )
  const isCloverQuestClear =
    !!achievementState.unlocked[CLOVER_COLLECTOR_ACHIEVEMENT_ID] ||
    progressRows.every((row) => row.count >= row.target)
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
  const eventAchievementLinks: Array<{
    id: string
    icon: ReactNode
    label: string
    clear: boolean
  }> = [
    {
      id: CLOVER_COLLECTOR_ACHIEVEMENT_ID,
      icon: collectible?.emoji ?? '🍀',
      label: t('achievement_clover_collector_title'),
      clear: isCloverQuestClear,
    },
    {
      id: RABBIT_ACHIEVEMENT_ID,
      icon: '🐇',
      label: t('achievement_rabbit_speed_title'),
      clear: fastWinCount >= ONE_MINUTE_TARGET,
    },
    {
      id: GRASSLAND_TRAIL_ACHIEVEMENT_ID,
      icon: grasslandTrailIcon,
      label: t('achievement_grassland_trail_title'),
      clear:
        !!achievementState.unlocked[GRASSLAND_TRAIL_ACHIEVEMENT_ID] ||
        totalEventTries >= EVENT_GAMES_TARGET,
    },
    {
      id: GRASS_DIET_ACHIEVEMENT_ID,
      icon: grassDietIcon,
      label: t('achievement_grass_diet_title'),
      clear: !!achievementState.unlocked[GRASS_DIET_ACHIEVEMENT_ID],
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
      className="h-full overflow-y-auto pr-1"
      aria-label="Event records panel"
      data-event-id={event.id}
      data-event-version={selectedVersion}
    >
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
        <EventGroupTitle separated>{t('eventMission')}</EventGroupTitle>
        <div className="grid grid-cols-5 items-end gap-2 text-center">
          {targetRows.map((rowIndex) => {
            const collected = todayCollectedRows.includes(rowIndex)
            return (
              <div
                key={rowIndex}
                className="flex min-w-0 flex-col items-center justify-center"
              >
                <Cell value={collected ? collectible.emoji : undefined} />
                <div className="mt-0.5 text-[10px] leading-3 text-gray-900">
                  {t('eventRowLabel', { row: rowIndex + 1 })}
                </div>
              </div>
            )
          })}
          <div className="flex min-w-0 flex-col items-center justify-center border-l border-gray-200 pl-2">
            <Cell value={todayFastWin ? '🐇' : undefined} />
            <div className="mt-0.5 text-[10px] leading-3 text-gray-900">
              {t('eventOneMinute')}
            </div>
          </div>
        </div>
      </section>

      <section>
        <EventGroupTitle separated>{t('eventProgress')}</EventGroupTitle>
        <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem_3.5rem] gap-x-1.5 gap-y-2 pt-1.5">
          {[...progressRows, eventGamesProgressRow, oneMinuteProgressRow].map(
            (row) => {
              const targetWidth = (row.target / maxProgressTarget) * 100
              const progress = Math.min(1, row.count / row.target)
              const isClear = row.count >= row.target

              return (
                <Fragment key={row.id}>
                  <div
                    key={`${row.id}-label`}
                    className="flex items-center text-xs font-semibold text-gray-700"
                  >
                    {row.label}
                  </div>
                  <div
                    key={`${row.id}-bar`}
                    className="flex h-4 min-w-0 items-center"
                  >
                    <div
                      className="relative h-2.5 rounded-full bg-gray-200"
                      style={{ width: `${targetWidth}%` }}
                    >
                      <div
                        className={`h-2.5 rounded-full ${row.fillClassName}`}
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  </div>
                  <div
                    key={`${row.id}-clear`}
                    className="flex items-center justify-center"
                  >
                    {isClear && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none text-white ${row.clearClassName}`}
                      >
                        CLEAR!
                      </span>
                    )}
                  </div>
                  <div
                    key={`${row.id}-count`}
                    className="flex items-center justify-end text-xs font-semibold text-gray-700"
                  >
                    {row.count}/{row.target}
                  </div>
                </Fragment>
              )
            }
          )}
        </div>
      </section>
      <section>
        <EventGroupTitle separated>{t('achievements')}</EventGroupTitle>
        <div className="grid grid-cols-2 items-center gap-3 pt-1">
          <div className="min-w-0">
            <div className="space-y-0.5">
              {eventAchievementLinks.map((achievement) => (
                <button
                  key={achievement.id}
                  type="button"
                  className="group grid w-full min-w-0 grid-cols-[1.25rem_minmax(0,1fr)_3.125rem] items-center gap-1.5 text-left text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={() => onOpenAchievement(achievement.id)}
                >
                  <span className="flex items-center justify-center leading-none">
                    {achievement.icon}
                  </span>
                  <span className="min-w-0 truncate text-indigo-600 underline group-hover:text-indigo-700">
                    {achievement.label}
                  </span>
                  <span
                    className={`justify-self-end rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white ${
                      achievement.clear ? '' : 'invisible'
                    }`}
                  >
                    {achievement.clear ? 'CLEAR!' : 'CLEAR!'}
                  </span>
                </button>
              ))}
            </div>
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
      </section>
    </div>
  )
}
