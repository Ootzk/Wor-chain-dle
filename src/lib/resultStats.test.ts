import { summarizeResultsAsGameStats } from './resultStats'

describe('result stats', () => {
  it('summarizes dated results into aggregate game stats', () => {
    const stats = summarizeResultsAsGameStats({
      '2026-05-21': {
        dateKey: '2026-05-21',
        won: true,
        guessCount: 2,
      },
      '2026-05-22': {
        dateKey: '2026-05-22',
        won: false,
        guessCount: 5,
      },
      '2026-05-23': {
        dateKey: '2026-05-23',
        won: true,
        guessCount: 1,
      },
    })

    expect(stats.totalGames).toBe(3)
    expect(stats.gamesFailed).toBe(1)
    expect(stats.successRate).toBe(67)
    expect(stats.winDistribution).toEqual([1, 1, 0, 0, 0, 0])
    expect(stats.currentStreak).toBe(1)
    expect(stats.bestStreak).toBe(1)
  })
})
