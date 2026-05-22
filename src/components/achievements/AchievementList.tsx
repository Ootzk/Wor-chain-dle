import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  getAchievementModes,
  getAchievementsWithStatus,
  markAchievementsSeen,
  AchievementCategory,
} from '../../lib/achievements'
import { loadDailyResultHistory } from '../../lib/dailyResults'
import { loadStats } from '../../lib/stats'
import {
  CosmeticCategory,
  CosmeticOption,
  equipCosmetic,
  getRewardsForAchievement,
  loadCosmeticState,
} from '../../lib/cosmetics'
import { CosmeticPreview } from '../cosmetics/CosmeticPreview'
import {
  filterRewardsByMetadata,
  getRewardMetadataLabel,
  RewardMetadataFilter,
} from '../../lib/rewardMetadata'
import { getModeBadgeItems, ModeBadge } from '../modes/ModeBadge'
import { GameMode } from '../../lib/gameMode'

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  milestone: '\uD83C\uDFAF',
  guess: '\uD83C\uDFB2',
  streak: '\uD83D\uDD25',
  event: '\uD83E\uDDE9',
  collection: '\uD83D\uDDC4\uFE0F',
  performance: '\uD83D\uDCCA',
}

const DifficultyStars = ({ difficulty }: { difficulty: number }) => {
  return (
    <span className="text-xs text-yellow-500 whitespace-nowrap">
      {'★'.repeat(difficulty)}
      {'☆'.repeat(10 - difficulty)}
    </span>
  )
}

const ProgressBar = ({
  current,
  target,
}: {
  current: number
  target: number
}) => {
  const percent = Math.min((current / target) * 100, 100)
  return (
    <div className="mt-1">
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-right">
        <span className="text-[0.625rem] text-gray-400">
          {current}/{target}
        </span>
      </div>
    </div>
  )
}

const AchievementEquipButton = ({
  rewards,
  unlocked,
  equipped,
  onEquip,
}: {
  rewards: CosmeticOption[]
  unlocked: boolean
  equipped: Record<CosmeticCategory, string>
  onEquip: (rewards: CosmeticOption[]) => void
}) => {
  const { t } = useTranslation()
  if (rewards.length === 0) return null

  const isEquipped = rewards.every(
    (reward) => equipped[reward.category] === reward.id
  )
  const disabled = !unlocked || isEquipped
  const label = !unlocked ? t('locked') : isEquipped ? t('equipped') : t('equip')

  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex w-8 flex-shrink-0 items-center justify-center border-l text-sm font-semibold transition-colors ${
        !unlocked
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
          : isEquipped
          ? 'cursor-default border-green-300 bg-green-50 text-green-600'
          : 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
      }`}
      onClick={() => onEquip(rewards)}
      title={rewards.map((reward) => t(reward.titleKey)).join(', ')}
      aria-label={label}
    >
      {!unlocked ? (
        '\uD83D\uDD12'
      ) : isEquipped ? (
        '\u2713'
      ) : (
        '\u2795'
      )}
    </button>
  )
}

const AchievementDescription = ({
  achievementId,
  descriptionKey,
  onOpenDeadEndHelp,
  onOpenEventRecords,
}: {
  achievementId: string
  descriptionKey: string
  onOpenDeadEndHelp?: () => void
  onOpenEventRecords?: () => void
}) => {
  const { t } = useTranslation()

  if (achievementId === 'dead_end_tail' && onOpenDeadEndHelp) {
    return (
      <Trans
        i18nKey={descriptionKey}
        components={{
          deadEndLink: (
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-700 underline"
              onClick={onOpenDeadEndHelp}
            />
          ),
        }}
      />
    )
  }

  if (
    [
      'clover_collector',
      'rabbit_speed',
      'grassland_trail',
      'grass_diet',
    ].includes(achievementId)
  ) {
    return (
      <Trans
        i18nKey={descriptionKey}
        components={{
          eventLink: onOpenEventRecords ? (
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-700 underline"
              onClick={onOpenEventRecords}
            />
          ) : (
            <span className="font-medium text-indigo-600 underline" />
          ),
        }}
      />
    )
  }

  return <>{t(descriptionKey)}</>
}

export const AchievementList = ({
  scrollToId,
  onOpenDeadEndHelp,
  onOpenEventRecords,
  metadataFilter,
  achievementIds,
  mode = 'daily',
  embedded = false,
  markSeenOnUnmount = true,
}: {
  scrollToId?: string
  onOpenDeadEndHelp?: () => void
  onOpenEventRecords?: () => void
  metadataFilter?: RewardMetadataFilter
  achievementIds?: string[]
  mode?: GameMode
  embedded?: boolean
  markSeenOnUnmount?: boolean
}) => {
  const { t } = useTranslation()
  const stats = loadStats()
  const dailyHistory = loadDailyResultHistory()
  const achievementsWithMetadata = metadataFilter
    ? filterRewardsByMetadata(
        getAchievementsWithStatus(stats, dailyHistory, mode),
        metadataFilter
      )
    : getAchievementsWithStatus(stats, dailyHistory, mode)
  const achievements = achievementIds
    ? achievementsWithMetadata.filter((achievement) =>
        achievementIds.includes(achievement.id)
      )
    : achievementsWithMetadata
  const scrollRef = useRef<HTMLDivElement>(null)
  const [equipped, setEquipped] = useState(() => loadCosmeticState().equipped)

  const handleEquipRewards = (rewards: CosmeticOption[]) => {
    rewards.forEach((reward) => {
      equipCosmetic(reward.category, reward.id)
    })
    setEquipped(loadCosmeticState().equipped)
  }

  useEffect(() => {
    return () => {
      if (markSeenOnUnmount) {
        markAchievementsSeen()
      }
    }
  }, [markSeenOnUnmount])

  useEffect(() => {
    if (scrollToId && scrollRef.current) {
      const el = scrollRef.current.querySelector(
        `[data-achievement-id="${scrollToId}"]`
      )
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          100
        )
      }
    }
  }, [scrollToId])

  return (
    <div
      ref={scrollRef}
      className={
        embedded ? 'space-y-2 pr-1' : 'h-full overflow-y-auto space-y-2 pr-1'
      }
    >
      {achievements.map((achievement) => {
        const rewards = getRewardsForAchievement(achievement.id)
        return (
          <div
            key={achievement.id}
            data-achievement-id={achievement.id}
            className={`flex min-h-[5.5rem] items-stretch overflow-hidden rounded-lg transition-colors ${
              scrollToId === achievement.id
                ? 'border-2 border-indigo-500 shadow-md bg-indigo-50'
                : achievement.unlocked
                ? 'border border-green-400 bg-green-50'
                : 'border border-gray-200'
            }`}
          >
            <div className="min-w-0 flex-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg flex-shrink-0 w-7 text-center inline-block">
                      {CATEGORY_ICONS[achievement.category]}
                    </span>
                    <span className="text-sm font-semibold truncate text-gray-900">
                      {t(achievement.titleKey)}
                    </span>
                    {achievement.isNew && (
                      <span className="text-[0.625rem] font-bold text-yellow-600 bg-yellow-100 rounded px-1 py-0.5 flex-shrink-0">
                        NEW!
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 text-gray-600 text-left">
                    <span className="inline-flex flex-wrap items-center gap-1 align-middle mr-1">
                      {getModeBadgeItems(getAchievementModes(achievement)).map(
                        (badge) => (
                          <ModeBadge
                            key={badge.id}
                            mode={badge.id}
                            label={badge.label}
                          />
                        )
                      )}
                    </span>
                    <span>
                      <AchievementDescription
                        achievementId={achievement.id}
                        descriptionKey={achievement.descriptionKey}
                        onOpenDeadEndHelp={onOpenDeadEndHelp}
                        onOpenEventRecords={onOpenEventRecords}
                      />
                    </span>
                  </p>
                  {rewards.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {rewards.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-1.5 text-xs text-gray-500"
                        >
                          <span>{t(`${r.category}Label`)}</span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center">
                            <CosmeticPreview
                              category={r.category}
                              optionId={r.id}
                              compact
                            />
                          </span>
                          <span className="text-gray-300">|</span>
                          <span>{t(r.titleKey)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <DifficultyStars difficulty={achievement.difficulty} />
                  <ProgressBar
                    current={achievement.currentProgress.current}
                    target={achievement.currentProgress.target}
                  />
                  {achievement.metadata && (
                    <div className="mt-0.5 text-right text-[0.625rem] text-gray-400">
                      {getRewardMetadataLabel(achievement.metadata)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <AchievementEquipButton
              rewards={rewards}
              unlocked={achievement.unlocked}
              equipped={equipped}
              onEquip={handleEquipRewards}
            />
          </div>
        )
      })}
    </div>
  )
}
