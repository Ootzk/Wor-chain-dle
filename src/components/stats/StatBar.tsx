import { GameStats } from '../../lib/localStorage'
import { useTranslation } from 'react-i18next'
import { ACHIEVEMENTS, loadAchievementState } from '../../lib/achievements'
import {
  filterRewardsByMetadata,
  RewardMetadataFilter,
} from '../../lib/rewardMetadata'

type Props = {
  gameStats: GameStats
  averageWinGuesses: string
  achievementMetadataFilter?: RewardMetadataFilter
}

const SummaryItem = ({
  title,
  value,
  caption,
}: {
  title: string
  value: string | number
  caption?: string
}) => {
  return (
    <div className="min-w-0 py-1 text-center">
      <div className="flex h-8 items-center justify-center">
        <div className="min-w-0 whitespace-nowrap text-xl font-bold leading-none text-gray-900 sm:text-2xl">
          {value}
        </div>
      </div>
      <div className="mt-1 text-[10px] leading-3 text-gray-500">{title}</div>
      {caption && (
        <div className="text-[10px] leading-3 text-gray-400">{caption}</div>
      )}
    </div>
  )
}

const EMPTY_VALUE = '-'

export const StatBar = ({
  gameStats,
  averageWinGuesses,
  achievementMetadataFilter,
}: Props) => {
  const { t } = useTranslation()
  const achievementState = loadAchievementState()
  const achievementScope = achievementMetadataFilter
    ? filterRewardsByMetadata(ACHIEVEMENTS, achievementMetadataFilter)
    : ACHIEVEMENTS
  const unlockedAchievements = achievementScope.filter(
    (achievement) => achievementState.unlocked[achievement.id]
  ).length
  const wins = gameStats.totalGames - gameStats.gamesFailed
  const successRate =
    gameStats.totalGames > 0
      ? `${Math.round((100 * wins) / gameStats.totalGames)}%`
      : EMPTY_VALUE

  return (
    <div className="mt-2 grid grid-cols-5 gap-y-2">
      <SummaryItem title={t('totalTries')} value={gameStats.totalGames} />
      <SummaryItem title={t('successRate')} value={successRate} />
      <SummaryItem
        title={t('statsAverageGuesses')}
        caption={t('statsWinsOnly')}
        value={
          averageWinGuesses === EMPTY_VALUE
            ? EMPTY_VALUE
            : `${averageWinGuesses}/6`
        }
      />
      <SummaryItem
        title={t('statsAchievements')}
        value={`${unlockedAchievements}/${achievementScope.length}`}
      />
      <SummaryItem title={t('bestStreak')} value={gameStats.bestStreak} />
    </div>
  )
}
