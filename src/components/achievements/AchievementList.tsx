import { useTranslation } from 'react-i18next'
import {
  getAchievementsWithStatus,
  AchievementCategory,
} from '../../lib/achievements'

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

export const AchievementList = () => {
  const { t } = useTranslation()
  const achievements = getAchievementsWithStatus()

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
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0 w-7 text-center inline-block">
                {CATEGORY_ICONS[achievement.category]}
              </span>
              <span className="text-sm font-semibold truncate text-gray-900">
                {t(achievement.titleKey)}
              </span>
            </div>
            <DifficultyStars difficulty={achievement.difficulty} />
          </div>
          <p className="text-xs mt-1 text-gray-600 text-left">
            {t(achievement.descriptionKey)}
          </p>
        </div>
      ))}
    </div>
  )
}
