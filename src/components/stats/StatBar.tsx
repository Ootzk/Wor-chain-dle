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
      <h4 className="text-base font-normal leading-6 text-gray-900">
        {title}
      </h4>
      <div className="mt-0.5 text-center text-xl font-normal leading-6 text-gray-900">
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
    <div className="grid grid-cols-2 gap-3">
      <SummaryItem
        title={t('statsAchievements')}
        value={`${unlockedAchievements}/${ACHIEVEMENTS.length}`}
      />
      <SummaryItem title={t('bestStreak')} value={gameStats.bestStreak} />
    </div>
  )
}
