import { GameStats } from '../../lib/localStorage'
import { useTranslation } from 'react-i18next'
import { ACHIEVEMENTS, loadAchievementState } from '../../lib/achievements'

type Props = {
  gameStats: GameStats
}

const SummaryItem = ({
  title,
  value,
}: {
  title: string
  value: string | number
}) => {
  return (
    <div className="min-w-0">
      <h4 className="text-lg leading-6 font-medium text-gray-900">{title}</h4>
      <div className="mt-1 text-center text-2xl font-bold leading-7 text-gray-900">
        {value}
      </div>
    </div>
  )
}

export const StatBar = ({ gameStats }: Props) => {
  const { t } = useTranslation()
  const achievementState = loadAchievementState()
  const unlockedAchievements = ACHIEVEMENTS.filter(
    (achievement) => achievementState.unlocked[achievement.id]
  ).length

  return (
    <div className="grid grid-cols-2 gap-4">
      <SummaryItem
        title={t('statsAchievements')}
        value={`${unlockedAchievements}/${ACHIEVEMENTS.length}`}
      />
      <SummaryItem title={t('bestStreak')} value={gameStats.bestStreak} />
    </div>
  )
}
