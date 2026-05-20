import { useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  getAchievementModes,
  getAchievementsWithStatus,
  markAchievementsSeen,
  AchievementCategory,
} from '../../lib/achievements'
import { loadDailyResultHistory } from '../../lib/dailyResults'
import { loadStats } from '../../lib/stats'
import { getRewardsForAchievement } from '../../lib/cosmetics'
import { CosmeticPreview } from '../cosmetics/CosmeticPreview'
import { GAME_MODE_LABELS, GameMode } from '../../lib/gameMode'
import { getRewardMetadataLabel } from '../../lib/rewardMetadata'

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  milestone: '\uD83C\uDFAF',
  guess: '\uD83C\uDFB2',
  streak: '\uD83D\uDD25',
  event: '\uD83E\uDDE9',
  collection: '\uD83D\uDDC4\uFE0F',
  performance: '\uD83D\uDCCA',
}

const MODE_BADGE_CLASSES: Record<GameMode, string> = {
  daily: 'bg-gray-50 text-gray-500 border-gray-200',
  practice: 'bg-purple-50 text-purple-600 border-purple-100',
  custom: 'bg-green-50 text-green-600 border-green-100',
  event: 'bg-sky-50 text-sky-600 border-sky-100',
}

// Keep the existing "All" badge meaning stable for the shipped core modes.
const ALL_MODES: GameMode[] = ['daily', 'practice', 'custom']
const ALL_MODE_BADGE_CLASS = 'bg-yellow-50 text-yellow-700 border-yellow-200'

const getModeBadgeItems = (
  modes: GameMode[]
): Array<{ id: string; label: string; className: string }> => {
  const includesAllModes = ALL_MODES.every((mode) => modes.includes(mode))

  if (includesAllModes) {
    return [
      {
        id: 'all',
        label: 'All',
        className: ALL_MODE_BADGE_CLASS,
      },
    ]
  }

  return modes.map((mode) => ({
    id: mode,
    label: GAME_MODE_LABELS[mode],
    className: MODE_BADGE_CLASSES[mode],
  }))
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

const AchievementDescription = ({
  achievementId,
  descriptionKey,
  onOpenDeadEndHelp,
}: {
  achievementId: string
  descriptionKey: string
  onOpenDeadEndHelp?: () => void
}) => {
  const { t } = useTranslation()

  if (achievementId !== 'dead_end_tail' || !onOpenDeadEndHelp) {
    return <>{t(descriptionKey)}</>
  }

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

export const AchievementList = ({
  scrollToId,
  onOpenDeadEndHelp,
}: {
  scrollToId?: string
  onOpenDeadEndHelp?: () => void
}) => {
  const { t } = useTranslation()
  const stats = loadStats()
  const dailyHistory = loadDailyResultHistory()
  const achievements = getAchievementsWithStatus(stats, dailyHistory)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      markAchievementsSeen()
    }
  }, [])

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
    <div ref={scrollRef} className="h-full overflow-y-auto space-y-2 pr-1">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          data-achievement-id={achievement.id}
          className={`rounded-lg p-3 transition-colors ${
            scrollToId === achievement.id
              ? 'border-2 border-indigo-500 shadow-md bg-indigo-50'
              : achievement.unlocked
              ? 'border border-green-400 bg-green-50'
              : 'border border-gray-200'
          }`}
        >
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
                      <span
                        key={badge.id}
                        className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    )
                  )}
                </span>
                <span>
                  <AchievementDescription
                    achievementId={achievement.id}
                    descriptionKey={achievement.descriptionKey}
                    onOpenDeadEndHelp={onOpenDeadEndHelp}
                  />
                </span>
              </p>
              {(() => {
                const rewards = getRewardsForAchievement(achievement.id)
                if (rewards.length === 0) return null
                return (
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
                )
              })()}
            </div>
            <div className="flex-shrink-0">
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
      ))}
    </div>
  )
}
