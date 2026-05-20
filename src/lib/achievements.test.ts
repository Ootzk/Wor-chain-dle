import {
  ACHIEVEMENTS,
  AchievementDef,
  countStatusesForGame,
  evaluateAchievementDefinitions,
  evaluateAchievements,
  getAchievementModes,
  getTilePatternProgress,
  loadAchievementState,
  retroUnlockAchievements,
} from './achievements'
import { DailyHistory } from './dailyHistory'
import { GameStats } from './localStorage'
import {
  CHAIN_COLOR_STYLES,
  getRewardsForAchievement,
  getShareBadge,
  getShareEmojiSet,
} from './cosmetics'
import { createDefaultAchievementTrackingState } from './achievementProgress'
import {
  CompletedPlayStats,
  DailyDetailStatsHistory,
  completePlayStats,
  createPlayStats,
  recordEnterAttempt,
} from './playStats'
import { saveEventResult } from './eventResults'

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

const createFastEventWinStats = (
  dateKey: string,
  guessTimeMs: number
): CompletedPlayStats =>
  completePlayStats({
    stats: recordEnterAttempt(
      createPlayStats({
        mode: 'event',
        solution: 'chain',
        dateKey,
        enterValidationHint: false,
        now: 0,
      }),
      'valid',
      guessTimeMs
    ),
    won: true,
    guessCount: 1,
    tileCounts: {
      correct: 5,
      present: 0,
      absent: 0,
      unrevealed: 25,
    },
    now: guessTimeMs,
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
      winDistribution: [0, 0, 0, 0, 0, 20],
      totalGames: 150,
      gamesFailed: 100,
      bestStreak: 14,
    }

    expect(evaluateAchievements(badgeStats, dailyHistory)).toEqual(
      expect.arrayContaining([
        'play_150',
        'fail_100',
        'streak_14',
        'streak_5',
        'win_in_6_20',
      ])
    )
    expect(loadAchievementState().unlocked.play_150).toBeTruthy()
    expect(loadAchievementState().unlocked.fail_100).toBeTruthy()
    expect(loadAchievementState().unlocked.streak_14).toBeTruthy()
    expect(loadAchievementState().unlocked.streak_5).toBeTruthy()
    expect(loadAchievementState().unlocked.win_in_6_20).toBeTruthy()
  })

  it('connects stats-based achievements to share badge rewards', () => {
    expect(getShareBadge('badge_chain')).toBe('\uD83D\uDD17')
    expect(getShareBadge('badge_none')).toBe('\uD83D\uDD17')
    expect(getShareBadge('badge_fire')).toBe('\uD83D\uDD25')
    expect(getShareBadge('badge_calendar')).toBe('\uD83D\uDCC5')
    expect(getShareBadge('badge_lizard')).toBe('\uD83E\uDD8E')
    expect(getShareBadge('badge_six')).toBe('6\uFE0F\u20E3')
    expect(getShareBadge('badge_skull')).toBe('\uD83D\uDC80')
    expect(getShareBadge('badge_star')).toBe('\u2B50')
    expect(getShareBadge('badge_hundred')).toBe('\uD83D\uDCAF')
    expect(getShareBadge('badge_wrestle')).toBe('\uD83E\uDD3C')
    expect(getShareBadge('badge_apple')).toBe('\uD83C\uDF4F')
    expect(getShareBadge('badge_grape')).toBe('\uD83C\uDF47')
    expect(getShareBadge('badge_milk')).toBe('\uD83E\uDD5B')
    expect(getShareBadge('badge_azure')).toBe('\uD83E\uDE75')
    expect(getShareBadge('badge_clover')).toBe('\uD83C\uDF40')
    expect(getShareBadge('badge_hyacinth')).toBe('\uD83E\uDEBB')
    expect(getShareBadge('badge_rabbit')).toBe('\uD83D\uDC07')
    expect(CHAIN_COLOR_STYLES.chaincolor_azure).toBe('border-sky-400')
    expect(getRewardsForAchievement('streak_14').map((r) => r.id)).toContain(
      'badge_fire'
    )
    expect(
      getRewardsForAchievement('monthly_attendance').map((r) => r.id)
    ).toContain('badge_calendar')
    expect(
      getRewardsForAchievement('dead_end_tail').map((r) => r.id)
    ).toContain('badge_lizard')
    expect(
      getRewardsForAchievement('played_v1_6_0_5').map((r) => r.id)
    ).toContain('badge_six')
    expect(getRewardsForAchievement('fail_100').map((r) => r.id)).toContain(
      'badge_skull'
    )
    expect(getRewardsForAchievement('play_150').map((r) => r.id)).toContain(
      'badge_star'
    )
    expect(
      getRewardsForAchievement('practice_win_100').map((r) => r.id)
    ).toContain('badge_hundred')
    expect(
      getRewardsForAchievement('custom_win_10').map((r) => r.id)
    ).toContain('badge_wrestle')
    expect(
      getRewardsForAchievement('no_present_game').map((r) => r.id)
    ).toContain('badge_apple')
    expect(
      getRewardsForAchievement('no_correct_game').map((r) => r.id)
    ).toContain('badge_grape')
    expect(getRewardsForAchievement('win_in_6_20').map((r) => r.id)).toContain(
      'badge_milk'
    )
    expect(
      getRewardsForAchievement('played_v1_7_0_5').map((r) => r.id)
    ).toContain('badge_azure')
    expect(
      getRewardsForAchievement('clover_collector').map((r) => r.id)
    ).toContain('badge_clover')
    expect(
      getRewardsForAchievement('practice_win_10').map((r) => r.id)
    ).toContain('badge_hyacinth')
    expect(getRewardsForAchievement('rabbit_speed').map((r) => r.id)).toContain(
      'badge_rabbit'
    )
    expect(getRewardsForAchievement('streak_5').map((r) => r.id)).toContain(
      'chaincolor_azure'
    )
  })

  it('unlocks the clover badge after meeting every event row target', () => {
    const progress = createDefaultAchievementTrackingState()
    progress.collectibles['v1.7.0-summer-garden-clover'] = {
      row_2: 3,
      row_3: 7,
      row_4: 10,
      row_5: 15,
    }

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'event',
        progress,
      })
    ).toContain('clover_collector')
  })

  it('unlocks the rabbit badge after 7 fast Summer Garden wins', () => {
    for (let day = 1; day <= 6; day += 1) {
      const dateKey = `2026-05-${String(day).padStart(2, '0')}`
      saveEventResult('v1.7.0', {
        dateKey,
        solution: 'chain',
        won: true,
        guessCount: 1,
        endReason: 'win',
        playStats: createFastEventWinStats(dateKey, 45_000),
      })
    }

    const currentStats = createFastEventWinStats('2026-05-07', 60_000)

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'event',
        game: {
          dateKey: '2026-05-07',
          guesses: [['c', 'h', 'a', 'i', 'n']],
          solution: 'chain',
          won: true,
          lost: false,
          guessCount: 1,
          endReason: 'win',
          playStats: currentStats,
        },
      })
    ).toContain('rabbit_speed')
  })

  it('does not let extra clovers in one row replace another row target', () => {
    const progress = createDefaultAchievementTrackingState()
    progress.collectibles['v1.7.0-summer-garden-clover'] = {
      row_2: 20,
      row_3: 20,
      row_4: 20,
      row_5: 14,
    }

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'event',
        progress,
      })
    ).not.toContain('clover_collector')
  })

  it('connects game-event achievements to share emoji rewards', () => {
    expect(getShareEmojiSet('emoji_bibimbap')).toEqual({
      correct: '\uD83E\uDD6C',
      present: '\uD83C\uDF46',
      absent: '\uD83C\uDF5A',
    })
    expect(getShareEmojiSet('emoji_yogurt')).toEqual({
      correct: '\uD83C\uDF4F',
      present: '\uD83C\uDF47',
      absent: '\uD83E\uDD5B',
    })
    expect(
      getRewardsForAchievement('bibimbap_balance').map((r) => r.id)
    ).toContain('emoji_bibimbap')
    expect(
      getRewardsForAchievement('yogurt_recipe').map((r) => r.id)
    ).toContain('emoji_yogurt')
  })

  it('keeps new share badge achievements daily-only', () => {
    for (const id of [
      'play_150',
      'fail_100',
      'streak_14',
      'streak_5',
      'win_in_6_20',
      'no_present_game',
      'no_correct_game',
    ]) {
      const achievement = ACHIEVEMENTS.find((a) => a.id === id)
      expect(achievement).toBeTruthy()
      expect(getAchievementModes(achievement!)).toEqual(['daily'])
    }
  })

  it('keeps new share emoji achievements daily-only', () => {
    for (const id of ['bibimbap_balance', 'yogurt_recipe']) {
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
      winDistribution: [0, 0, 0, 0, 0, 20],
      totalGames: 150,
      gamesFailed: 100,
      bestStreak: 14,
    }

    expect(retroUnlockAchievements(badgeStats, dailyHistory)).toEqual(
      expect.arrayContaining([
        'play_150',
        'fail_100',
        'streak_14',
        'streak_5',
        'win_in_6_20',
      ])
    )
    expect(loadAchievementState().version).toBe('v1.7.0')
    expect(loadAchievementState().retroCompleted).toBe(true)
  })

  it('unlocks monthly attendance from a complete daily history month', () => {
    const completeApril: DailyHistory = {}
    for (let day = 1; day <= 30; day++) {
      completeApril[`2026-04-${String(day).padStart(2, '0')}`] = {
        guessCount: 6,
        won: day % 2 === 0,
      }
    }

    expect(evaluateAchievements(stats, completeApril)).toContain(
      'monthly_attendance'
    )
  })

  it('shows best monthly attendance progress before completion', () => {
    const partialMonth: DailyHistory = {}
    for (let day = 1; day <= 12; day++) {
      partialMonth[`2026-05-${String(day).padStart(2, '0')}`] = {
        guessCount: 6,
        won: true,
      }
    }

    const monthlyAttendance = ACHIEVEMENTS.find(
      (a) => a.id === 'monthly_attendance'
    )

    expect(monthlyAttendance?.progress).toBeTruthy()
    expect(
      monthlyAttendance!.progress({
        stats,
        dailyHistory: partialMonth,
        dailyDetailStatsHistory: {},
        mode: 'daily',
        progress: createDefaultAchievementTrackingState(),
      })
    ).toEqual({ current: 12, target: 31 })
  })

  it('unlocks the tail trap badge from final-letter dead ends', () => {
    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'daily',
        game: {
          guesses: [
            ['a', 'l', 'p', 'h', 'a'],
            ['a', 'p', 'p', 'l', 'e'],
            ['e', 'a', 'g', 'l', 'e'],
            ['e', 'l', 'd', 'e', 'r'],
            ['r', 'o', 'u', 'n', 'd'],
          ],
          solution: 'chain',
          won: false,
          lost: true,
          guessCount: 5,
          endReason: 'deadEnd',
          deadEnd: {
            guessIndex: 5,
            chainPosition: 'last',
            chainLetter: 'd',
            solutionLetter: 'n',
          },
        },
      })
    ).toContain('dead_end_tail')
  })

  it('unlocks version and mode-count badges from tracked progress', () => {
    const progress = createDefaultAchievementTrackingState()
    progress.versions['1.6.0'] = { gamesCompleted: 5 }
    progress.versions['1.7.0'] = { gamesCompleted: 5 }
    progress.modes.practice.gamesWon = 100
    progress.modes.custom.gamesWon = 10

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'practice',
        progress,
      })
    ).toEqual(
      expect.arrayContaining([
        'played_v1_6_0_5',
        'played_v1_7_0_5',
        'practice_win_10',
        'practice_win_100',
      ])
    )

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'custom',
        progress,
      })
    ).toContain('custom_win_10')
  })

  it('unlocks bibimbap from a 6-guess balanced status game', () => {
    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'daily',
        game: {
          guesses: [
            ['u', 'n', 'c', 'u', 't'],
            ['g', 'r', 'u', 'n', 't'],
            ['g', 'e', 'n', 'r', 'e'],
            ['n', 'a', 'i', 'v', 'e'],
            ['n', 'a', 'c', 'r', 'e'],
            ['c', 'r', 'a', 'n', 'e'],
          ],
          solution: 'crane',
          won: true,
          lost: false,
          guessCount: 6,
          endReason: 'win',
        },
      })
    ).toContain('bibimbap_balance')
  })

  it('unlocks bibimbap from stored tile counts in daily detail stats', () => {
    const dailyDetailStatsHistory: DailyDetailStatsHistory = {
      '2026-05-20': {
        mode: 'daily',
        dateKey: '2026-05-20',
        solution: 'crane',
        startedAt: 0,
        completedAt: 1,
        lastActivityAt: 1,
        longestPauseMs: 0,
        guessStats: [],
        assistFlags: { enterValidationHint: false },
        won: true,
        guessCount: 6,
        tileCounts: {
          correct: 10,
          present: 10,
          absent: 10,
          unrevealed: 6,
        },
      },
    }

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'daily',
        dailyDetailStatsHistory,
      })
    ).toContain('bibimbap_balance')
  })

  it('does not unlock bibimbap from stored balanced tiles without a 6-guess win', () => {
    const dailyDetailStatsHistory: DailyDetailStatsHistory = {
      '2026-05-20': {
        mode: 'daily',
        dateKey: '2026-05-20',
        solution: 'crane',
        startedAt: 0,
        completedAt: 1,
        lastActivityAt: 1,
        longestPauseMs: 0,
        guessStats: [],
        assistFlags: { enterValidationHint: false },
        won: false,
        guessCount: 6,
        tileCounts: {
          correct: 10,
          present: 10,
          absent: 10,
          unrevealed: 6,
        },
      },
    }

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'daily',
        dailyDetailStatsHistory,
      })
    ).not.toContain('bibimbap_balance')
  })

  it('unlocks yogurt from using apple grape and milks in one game', () => {
    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'daily',
        game: {
          guesses: [
            ['a', 'p', 'p', 'l', 'e'],
            ['g', 'r', 'a', 'p', 'e'],
            ['m', 'i', 'l', 'k', 's'],
          ],
          solution: 'chain',
          won: false,
          lost: true,
          guessCount: 3,
          endReason: 'fail',
        },
      })
    ).toContain('yogurt_recipe')
  })

  it('unlocks apple from a completed daily game with no present tiles', () => {
    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'daily',
        game: {
          guesses: [
            ['x', 'x', 'x', 'x', 'x'],
            ['c', 'x', 'x', 'x', 'x'],
          ],
          solution: 'chain',
          won: false,
          lost: true,
          guessCount: 2,
          endReason: 'fail',
        },
      })
    ).toContain('no_present_game')
  })

  it('unlocks apple from stored tile counts in daily detail stats', () => {
    const dailyDetailStatsHistory: DailyDetailStatsHistory = {
      '2026-05-20': {
        mode: 'daily',
        dateKey: '2026-05-20',
        solution: 'chain',
        startedAt: 0,
        completedAt: 1,
        lastActivityAt: 1,
        longestPauseMs: 0,
        guessStats: [],
        assistFlags: { enterValidationHint: false },
        won: false,
        guessCount: 5,
        tileCounts: {
          correct: 4,
          present: 0,
          absent: 21,
          unrevealed: 11,
        },
      },
    }

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'daily',
        dailyDetailStatsHistory,
      })
    ).toContain('no_present_game')
  })

  it('unlocks grape from a completed daily game with no correct tiles', () => {
    const guesses = [
      ['h', 'x', 'x', 'x', 'x'],
      ['x', 'c', 'x', 'x', 'x'],
    ]

    expect(countStatusesForGame(guesses, 'chain').correct).toBe(0)

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'daily',
        game: {
          guesses,
          solution: 'chain',
          won: false,
          lost: true,
          guessCount: 2,
          endReason: 'fail',
        },
      })
    ).toContain('no_correct_game')
  })

  it('unlocks grape from stored tile counts in daily detail stats', () => {
    const dailyDetailStatsHistory: DailyDetailStatsHistory = {
      '2026-05-20': {
        mode: 'daily',
        dateKey: '2026-05-20',
        solution: 'chain',
        startedAt: 0,
        completedAt: 1,
        lastActivityAt: 1,
        longestPauseMs: 0,
        guessStats: [],
        assistFlags: { enterValidationHint: false },
        won: false,
        guessCount: 5,
        tileCounts: {
          correct: 0,
          present: 7,
          absent: 18,
          unrevealed: 11,
        },
      },
    }

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'daily',
        dailyDetailStatsHistory,
      })
    ).toContain('no_correct_game')
  })

  it('does not treat legacy detail stats without tile counts as a tile pattern match', () => {
    const legacyDailyDetailStatsHistory = {
      '2026-05-20': {
        mode: 'daily',
        dateKey: '2026-05-20',
        solution: 'chain',
        startedAt: 0,
        completedAt: 1,
        lastActivityAt: 1,
        longestPauseMs: 0,
        guessStats: [],
        assistFlags: { enterValidationHint: false },
        won: false,
        guessCount: 5,
      },
    } as DailyDetailStatsHistory

    expect(
      evaluateAchievements(stats, dailyHistory, {
        mode: 'daily',
        dailyDetailStatsHistory: legacyDailyDetailStatsHistory,
      })
    ).not.toEqual(
      expect.arrayContaining(['no_present_game', 'no_correct_game'])
    )
  })

  it('counts stored tile pattern matches toward multi-game targets', () => {
    const dailyDetailStatsHistory: DailyDetailStatsHistory = {
      '2026-05-19': {
        mode: 'daily',
        dateKey: '2026-05-19',
        solution: 'chain',
        startedAt: 0,
        completedAt: 1,
        lastActivityAt: 1,
        longestPauseMs: 0,
        guessStats: [],
        assistFlags: { enterValidationHint: false },
        won: false,
        guessCount: 5,
        tileCounts: {
          correct: 0,
          present: 4,
          absent: 21,
          unrevealed: 11,
        },
      },
      '2026-05-20': {
        mode: 'daily',
        dateKey: '2026-05-20',
        solution: 'crane',
        startedAt: 0,
        completedAt: 1,
        lastActivityAt: 1,
        longestPauseMs: 0,
        guessStats: [],
        assistFlags: { enterValidationHint: false },
        won: true,
        guessCount: 4,
        tileCounts: {
          correct: 0,
          present: 7,
          absent: 13,
          unrevealed: 16,
        },
      },
    }
    const achievement = createAchievement({
      id: 'two_no_correct_games',
      progress: (ctx) =>
        getTilePatternProgress(ctx, (counts) => counts.correct === 0, 2),
    })

    expect(
      evaluateAchievementDefinitions([achievement], stats, dailyHistory, {
        mode: 'daily',
        dailyDetailStatsHistory,
      })
    ).toContain('two_no_correct_games')
  })
})
