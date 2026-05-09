import {
  ACHIEVEMENTS,
  AchievementDef,
  evaluateAchievementDefinitions,
  evaluateAchievements,
  getAchievementModes,
  loadAchievementState,
  retroUnlockAchievements,
} from './achievements'
import { DailyHistory } from './dailyHistory'
import { GameStats } from './localStorage'
import { getRewardsForAchievement, getShareBadge } from './cosmetics'

const stats: GameStats = {
  winDistribution: [0, 0, 0, 0, 0, 0],
  gamesFailed: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGames: 0,
  successRate: 0,
}

const dailyHistory: DailyHistory = {}

const alwaysComplete = (): { current: number; target: number } => ({
  current: 1,
  target: 1,
})

const createAchievement = (
  overrides: Partial<AchievementDef>
): AchievementDef => ({
  id: 'test_achievement',
  category: 'milestone',
  difficulty: 1,
  progress: alwaysComplete,
  titleKey: 'test_title',
  descriptionKey: 'test_desc',
  ...overrides,
})

describe('achievement mode availability', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults omitted modes to daily only', () => {
    const achievement = createAchievement({ id: 'daily_default' })

    expect(getAchievementModes(achievement)).toEqual(['daily'])
    expect(
      evaluateAchievementDefinitions([achievement], stats, dailyHistory, {
        mode: 'practice',
      })
    ).toEqual([])
    expect(loadAchievementState().unlocked.daily_default).toBeUndefined()

    expect(
      evaluateAchievementDefinitions([achievement], stats, dailyHistory, {
        mode: 'daily',
      })
    ).toEqual(['daily_default'])
  })

  it('does not unlock daily-only achievements from practice or custom games', () => {
    const achievement = createAchievement({
      id: 'daily_only',
      modes: ['daily'],
    })

    expect(
      evaluateAchievementDefinitions([achievement], stats, dailyHistory, {
        mode: 'practice',
      })
    ).toEqual([])
    expect(
      evaluateAchievementDefinitions([achievement], stats, dailyHistory, {
        mode: 'custom',
      })
    ).toEqual([])
    expect(loadAchievementState().unlocked.daily_only).toBeUndefined()
  })

  it('unlocks achievements in explicitly allowed non-daily modes', () => {
    const achievement = createAchievement({
      id: 'custom_allowed',
      modes: ['custom'],
      progress: ({ game }) => ({
        current: game?.won ? 1 : 0,
        target: 1,
      }),
    })

    expect(
      evaluateAchievementDefinitions([achievement], stats, dailyHistory, {
        mode: 'custom',
        game: {
          guesses: [['c', 'h', 'a', 'i', 'n']],
          solution: 'chain',
          won: true,
          lost: false,
          guessCount: 1,
          endReason: 'win',
        },
      })
    ).toEqual(['custom_allowed'])
    expect(loadAchievementState().unlocked.custom_allowed).toBeTruthy()
  })
})

describe('share badge achievements', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('unlocks stats-based share badge achievements in daily mode', () => {
    const badgeStats: GameStats = {
      ...stats,
      totalGames: 150,
      gamesFailed: 100,
      bestStreak: 14,
    }

    expect(evaluateAchievements(badgeStats, dailyHistory)).toEqual(
      expect.arrayContaining(['play_150', 'fail_100', 'streak_14'])
    )
    expect(loadAchievementState().unlocked.play_150).toBeTruthy()
    expect(loadAchievementState().unlocked.fail_100).toBeTruthy()
    expect(loadAchievementState().unlocked.streak_14).toBeTruthy()
  })

  it('connects stats-based achievements to share badge rewards', () => {
    expect(getShareBadge('badge_fire')).toBe('\uD83D\uDD25')
    expect(getShareBadge('badge_skull')).toBe('\uD83D\uDC80')
    expect(getShareBadge('badge_star')).toBe('\u2B50')
    expect(getRewardsForAchievement('streak_14').map((r) => r.id)).toContain(
      'badge_fire'
    )
    expect(getRewardsForAchievement('fail_100').map((r) => r.id)).toContain(
      'badge_skull'
    )
    expect(getRewardsForAchievement('play_150').map((r) => r.id)).toContain(
      'badge_star'
    )
  })

  it('keeps new share badge achievements daily-only', () => {
    for (const id of ['play_150', 'fail_100', 'streak_14']) {
      const achievement = ACHIEVEMENTS.find((a) => a.id === id)
      expect(achievement).toBeTruthy()
      expect(getAchievementModes(achievement!)).toEqual(['daily'])
    }
  })

  it('runs retro unlock again for older achievement state versions', () => {
    localStorage.setItem(
      'achievementState',
      JSON.stringify({
        version: 1,
        unlocked: {},
        retroCompleted: true,
      })
    )

    const badgeStats: GameStats = {
      ...stats,
      totalGames: 150,
      gamesFailed: 100,
      bestStreak: 14,
    }

    expect(retroUnlockAchievements(badgeStats, dailyHistory)).toEqual(
      expect.arrayContaining(['play_150', 'fail_100', 'streak_14'])
    )
    expect(loadAchievementState().version).toBe(2)
    expect(loadAchievementState().retroCompleted).toBe(true)
  })
})
