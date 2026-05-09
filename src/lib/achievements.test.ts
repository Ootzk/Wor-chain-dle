import {
  AchievementDef,
  evaluateAchievementDefinitions,
  getAchievementModes,
  loadAchievementState,
} from './achievements'
import { DailyHistory } from './dailyHistory'
import { GameStats } from './localStorage'

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
