import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAchievementsWithStatus,
  markAchievementsSeen,
  AchievementCategory,
} from '../../lib/achievements'
import { loadDailyHistory } from '../../lib/dailyHistory'
import { loadStats } from '../../lib/stats'
import { getRewardsForAchievement } from '../../lib/cosmetics'
import { CosmeticPreview } from '../cosmetics/CosmeticPreview'

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  milestone: '\uD83C\uDFAF',
  guess: '\uD83C\uDFB2',
  streak: '\uD83D\uDD25',
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

export const AchievementList = () => {
  const { t } = useTranslation()
  const stats = loadStats()
  const dailyHistory = loadDailyHistory()
  const achievements = getAchievementsWithStatus(stats, dailyHistory)

  useEffect(() => {
    return () => {
      markAchievementsSeen()
    }
  }, [])

  return (
    <div className="h-full overflow-y-auto space-y-2 pr-1">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className={`rounded-lg border p-3 ${
            achievement.unlocked
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200'
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
                {t(achievement.descriptionKey)}
              </p>
              {(() => {
                const rewards = getRewardsForAchievement(achievement.id)
                if (rewards.length === 0) return null
                return (
                  <div className="mt-1 space-y-0.5">
                    {rewards.map((r) => (
                      <div key={r.id} className="flex items-center gap-1.5 text-xs text-gray-500">
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
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
