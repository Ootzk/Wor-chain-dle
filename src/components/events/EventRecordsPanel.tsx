import { useTranslation } from 'react-i18next'
import Countdown from 'react-countdown'
import { EventDefinition } from '../../lib/events'
import { EventResults } from '../../lib/eventResults'
import { PlayStats, getTotalGuessTimeMs } from '../../lib/playStats'
import { shareStatus } from '../../lib/share'
import { tomorrow } from '../../lib/words'
import { getLoseReasonIcon } from '../../lib/loseReasons'
import {
  CosmeticOverrides,
  getRewardsForAchievement,
} from '../../lib/cosmetics'
import {
  CollectedRowsByCollectible,
  formatCollectibleDashboardCount,
} from '../../lib/eventCollectibles'
import { Cell } from '../grid/Cell'
import { ShareOptionsRow } from '../stats/ShareOptionsRow'
import { AchievementList } from '../achievements/AchievementList'
import { CosmeticPreview } from '../cosmetics/CosmeticPreview'
import { SUMMER_GARDEN_DASHBOARD_ACHIEVEMENT_IDS } from './summerGardenAchievements'

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
  handleShare: () => void
  cosmeticOverrides?: CosmeticOverrides
  hasNewRewards: boolean
}

const EMPTY_VALUE = '-'
const ONE_MINUTE_MS = 60 * 1000
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
  const todayCollectedRows =
    collectible && isCurrentEvent ? collectedRows[collectible.id] ?? [] : []
  const todayCloverBonus = todayWon ? 1 : 0
  const todayCloverDisplay = formatCollectibleDashboardCount({
    emoji: collectible?.emoji ?? '🍀',
    count: todayCollectedRows.length,
    winBonusCount: todayCloverBonus,
  })
  const completedCurrentEvent = isCurrentEvent && (isGameWon || isGameLost)
  const grasslandTrailReward = getRewardsForAchievement('grassland_trail')[0]
  const grassDietReward = getRewardsForAchievement('grass_diet')[0]
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
  const todayGrassDiet = todayWon && usedWords(guesses, ['green', 'grass'])
  const result = getResultLabel({
    t,
    won: todayWon,
    lost: !!todayLost && !todayWon,
    endReason: todayResult?.endReason,
    event,
  })

  if (!event) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm text-gray-400"
        aria-label="Event records panel"
        data-event-id=""
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
          <div className="mt-3 grid grid-cols-4 items-stretch border-t border-gray-100 pt-3 text-center">
            <div className="flex min-w-0 flex-col items-center justify-start px-1">
              <div className="flex h-8 max-w-full items-center justify-center truncate text-lg font-bold leading-8 text-gray-900">
                {todayCloverDisplay}
              </div>
              <div className="mt-1.5 min-h-[1.5rem] max-w-full text-[10px] leading-3 text-gray-500">
                {t('eventTodayClovers')}
              </div>
            </div>
            <div className="flex min-w-0 flex-col items-center justify-start border-l border-gray-200 px-1">
              <div className="flex h-8 items-center justify-center text-lg leading-8">
                {todayFastWin ? '🐇' : EMPTY_VALUE}
              </div>
              <div className="mt-1.5 min-h-[1.5rem] max-w-full text-[10px] leading-3 text-gray-500">
                {t('eventTodayOneMinute')}
              </div>
            </div>
            <div className="flex min-w-0 flex-col items-center justify-start border-l border-gray-200 px-1">
              <div className="flex h-8 items-center justify-center text-lg leading-8">
                {completedCurrentEvent ? grasslandTrailIcon : EMPTY_VALUE}
              </div>
              <div className="mt-1.5 min-h-[1.5rem] max-w-full text-[10px] leading-3 text-gray-500">
                {t('eventTodayComplete')}
              </div>
            </div>
            <div className="flex min-w-0 flex-col items-center justify-start border-l border-gray-200 px-1">
              <div className="flex h-8 items-center justify-center text-lg leading-8">
                {todayGrassDiet ? grassDietIcon : EMPTY_VALUE}
              </div>
              <div className="mt-1.5 min-h-[1.5rem] max-w-full text-[10px] leading-3 text-gray-500">
                {t('eventTodayGrass')}
              </div>
            </div>
          </div>
        </section>

        <section>
          <EventGroupTitle separated>{t('eventAchievements')}</EventGroupTitle>
          <AchievementList
            achievementIds={SUMMER_GARDEN_DASHBOARD_ACHIEVEMENT_IDS}
            sortAchievementIds={SUMMER_GARDEN_DASHBOARD_ACHIEVEMENT_IDS}
            mode="event"
            embedded
            markSeenOnUnmount={false}
            onOpenEventRecords={() => undefined}
          />
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
