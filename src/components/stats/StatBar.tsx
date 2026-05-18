import { GameStats } from '../../lib/localStorage'
import { useTranslation } from 'react-i18next'
import { ACHIEVEMENTS, loadAchievementState } from '../../lib/achievements'

type Props = {
  gameStats: GameStats
}

const StatItem = ({
  label,
  value,
  subValue,
  note,
}: {
  label: string
  value: string | number
  subValue?: string
  note?: string
}) => {
  return (
    <div className="m-1 min-w-0 flex-1 text-center">
      <div className="flex h-12 flex-col items-center justify-center">
        <div className="text-2xl font-bold leading-7 text-gray-900">
          {value}
        </div>
        {subValue && (
          <div className="text-xs font-bold leading-3 text-gray-900">
            {subValue}
          </div>
        )}
      </div>
      <div className="min-h-[1.5rem] text-[10px] leading-3">
        <div>{label}</div>
        {note && <div className="text-gray-400">{note}</div>}
      </div>
    </div>
  )
}

export const StatBar = ({ gameStats }: Props) => {
  const { t } = useTranslation()
  const wins = gameStats.totalGames - gameStats.gamesFailed
  const averageGuesses =
    wins > 0
      ? (
          gameStats.winDistribution.reduce(
            (sum, value, index) => sum + value * (index + 1),
            0
          ) / wins
        ).toFixed(1)
      : '-'
  const achievementState = loadAchievementState()
  const unlockedAchievements = ACHIEVEMENTS.filter(
    (achievement) => achievementState.unlocked[achievement.id]
  ).length

  return (
    <div className="my-2 grid grid-cols-4 gap-y-2">
      <StatItem
        label={t('statsRecord')}
        value={`${wins}/${gameStats.totalGames}`}
        subValue={`${gameStats.successRate}%`}
      />
      <StatItem
        label={t('statsAverageGuesses')}
        value={`${averageGuesses}/6`}
        note={t('statsWinsOnly')}
      />
      <StatItem
        label={t('statsAchievements')}
        value={`${unlockedAchievements}/${ACHIEVEMENTS.length}`}
      />
      <StatItem label={t('bestStreak')} value={gameStats.bestStreak} />
    </div>
  )
}
