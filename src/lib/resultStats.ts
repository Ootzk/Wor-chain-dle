import { CONFIG } from '../constants/config'
import { GameStats } from './localStorage'

export type ResultStatsEntry = {
  dateKey: string
  won: boolean
  guessCount: number
}

export const createEmptyGameStats = (): GameStats => ({
  winDistribution: [0, 0, 0, 0, 0, 0],
  gamesFailed: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGames: 0,
  successRate: 0,
})

export const summarizeResultsAsGameStats = (
  results: Record<string, ResultStatsEntry>
): GameStats => {
  const stats = createEmptyGameStats()
  let currentStreak = 0

  Object.values(results)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .forEach((result) => {
      stats.totalGames += 1

      if (result.won) {
        const distributionIndex = Math.max(
          0,
          Math.min(CONFIG.tries - 1, result.guessCount - 1)
        )
        stats.winDistribution[distributionIndex] += 1
        currentStreak += 1
        stats.bestStreak = Math.max(stats.bestStreak, currentStreak)
      } else {
        stats.gamesFailed += 1
        currentStreak = 0
      }
    })

  stats.currentStreak = currentStreak
  stats.successRate =
    stats.totalGames > 0
      ? Math.round(
          (100 * (stats.totalGames - stats.gamesFailed)) / stats.totalGames
        )
      : 0

  return stats
}
