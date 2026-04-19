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
  const stars = Math.ceil(difficulty / 2)
  return (
    <span className="text-xs text-yellow-500 whitespace-nowrap">
      {'★'.repeat(stars)}
      {'☆'.repeat(5 - stars)}
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
              ? 'border-indigo-200 bg-indigo-50'
              : 'border-gray-200 bg-gray-50 opacity-50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0">
                {CATEGORY_ICONS[achievement.category]}
              </span>
              <span
                className={`text-sm font-semibold truncate ${
                  achievement.unlocked ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {t(achievement.titleKey)}
              </span>
            </div>
            <DifficultyStars difficulty={achievement.difficulty} />
          </div>
          <p
            className={`text-xs mt-1 ml-8 ${
              achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
            }`}
          >
            {t(achievement.descriptionKey)}
          </p>
          <div className="text-xs mt-1 ml-8">
            {achievement.unlocked ? (
              <span className="text-indigo-600">
                {'\uD83D\uDD13'} {t('unlocked')}
                {achievement.unlockedAt && (
                  <span className="text-gray-400 ml-1">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-gray-400">
                {'\uD83D\uDD12'} {t('locked')}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
