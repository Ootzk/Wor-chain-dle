import { GameStats } from './localStorage'
import {
  DailyHistory,
  getDailyHistoryStartDate,
  getBestMonthlyAttendanceProgress,
} from './dailyHistory'
import { GameMode } from './gameMode'
import {
  AchievementTrackingState,
  loadAchievementProgress,
} from './achievementProgress'
import { CharStatus, getGuessStatuses } from './statuses'

// --- Type Definitions ---

export type AchievementCategory = 'milestone' | 'guess' | 'streak' | 'event'

export type AchievementEndReason = 'win' | 'fail' | 'deadEnd'

export type DeadEndContext = {
  guessIndex: number
  chainPosition: 'first' | 'last'
  chainLetter: string
  solutionLetter: string
}

export type CompletedGameContext = {
  guesses: string[][]
  solution: string
  won: boolean
  lost: boolean
  guessCount: number
  endReason: AchievementEndReason
  deadEnd?: DeadEndContext
}

export type AchievementContext = {
  stats: GameStats
  dailyHistory: DailyHistory
  mode: GameMode
  progress: AchievementTrackingState
  game?: CompletedGameContext
}

export type AchievementProgress = {
  current: number
  target: number
}

export type AchievementDef = {
  id: string
  category: AchievementCategory
  modes?: GameMode[]
  difficulty: number // 1-10, UI에서 별 5개로 매핑 (2당 별 1개)
  progress: (ctx: AchievementContext) => AchievementProgress
  titleKey: string
  descriptionKey: string
}

type AchievementUnlock = {
  unlockedAt: number
}

type AchievementState = {
  version: number
  unlocked: Record<string, AchievementUnlock>
  retroCompleted: boolean
  lastSeenAt?: number
}

type StatusCounts = Record<CharStatus, number>

export const countStatusesForGame = (
  guesses: string[][],
  solution: string
): StatusCounts => {
  const counts: StatusCounts = {
    absent: 0,
    present: 0,
    correct: 0,
  }

  for (const guess of guesses) {
    for (const status of getGuessStatuses(guess, solution)) {
      counts[status] += 1
    }
  }

  return counts
}

export const usedAllWords = (guesses: string[][], words: string[]): boolean => {
  const submittedWords = new Set(guesses.map((guess) => guess.join('')))
  return words.every((word) => submittedWords.has(word))
}

// --- Achievement Definitions ---

export const ACHIEVEMENTS: AchievementDef[] = [
  // Milestone
  {
    id: 'play_10',
    category: 'milestone',
    modes: ['daily'],
    difficulty: 1,
    titleKey: 'achievement_play_10_title',
    descriptionKey: 'achievement_play_10_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 10 }),
  },
  {
    id: 'play_50',
    category: 'milestone',
    modes: ['daily'],
    difficulty: 4,
    titleKey: 'achievement_play_50_title',
    descriptionKey: 'achievement_play_50_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 50 }),
  },
  {
    id: 'play_100',
    category: 'milestone',
    modes: ['daily'],
    difficulty: 6,
    titleKey: 'achievement_play_100_title',
    descriptionKey: 'achievement_play_100_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 100 }),
  },
  {
    id: 'play_150',
    category: 'milestone',
    modes: ['daily'],
    difficulty: 8,
    titleKey: 'achievement_play_150_title',
    descriptionKey: 'achievement_play_150_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 150 }),
  },
  {
    id: 'fail_100',
    category: 'milestone',
    modes: ['daily'],
    difficulty: 8,
    titleKey: 'achievement_fail_100_title',
    descriptionKey: 'achievement_fail_100_desc',
    progress: ({ stats }) => ({ current: stats.gamesFailed, target: 100 }),
  },
  {
    id: 'monthly_attendance',
    category: 'milestone',
    modes: ['daily'],
    difficulty: 9,
    titleKey: 'achievement_monthly_attendance_title',
    descriptionKey: 'achievement_monthly_attendance_desc',
    progress: ({ dailyHistory }) =>
      getBestMonthlyAttendanceProgress(dailyHistory, {
        startDate: getDailyHistoryStartDate(),
      }),
  },
  {
    id: 'played_v1_6_0_5',
    category: 'milestone',
    modes: ['daily', 'practice', 'custom'],
    difficulty: 1,
    titleKey: 'achievement_played_v1_6_0_5_title',
    descriptionKey: 'achievement_played_v1_6_0_5_desc',
    progress: ({ progress }) => ({
      current: progress.versions['1.6.0']?.gamesCompleted ?? 0,
      target: 5,
    }),
  },
  {
    id: 'practice_win_100',
    category: 'milestone',
    modes: ['practice'],
    difficulty: 8,
    titleKey: 'achievement_practice_win_100_title',
    descriptionKey: 'achievement_practice_win_100_desc',
    progress: ({ progress }) => ({
      current: progress.modes.practice.gamesWon,
      target: 100,
    }),
  },
  {
    id: 'custom_win_10',
    category: 'milestone',
    modes: ['custom'],
    difficulty: 4,
    titleKey: 'achievement_custom_win_10_title',
    descriptionKey: 'achievement_custom_win_10_desc',
    progress: ({ progress }) => ({
      current: progress.modes.custom.gamesWon,
      target: 10,
    }),
  },

  // Guess — N번째 시도로 N회 승리
  {
    id: 'win_in_1',
    category: 'guess',
    modes: ['daily'],
    difficulty: 10,
    titleKey: 'achievement_win_in_1_title',
    descriptionKey: 'achievement_win_in_1_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[0], target: 1 }),
  },
  {
    id: 'win_in_2',
    category: 'guess',
    modes: ['daily'],
    difficulty: 9,
    titleKey: 'achievement_win_in_2_title',
    descriptionKey: 'achievement_win_in_2_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[1], target: 2 }),
  },
  {
    id: 'win_in_3',
    category: 'guess',
    modes: ['daily'],
    difficulty: 7,
    titleKey: 'achievement_win_in_3_title',
    descriptionKey: 'achievement_win_in_3_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[2], target: 3 }),
  },
  {
    id: 'win_in_4',
    category: 'guess',
    modes: ['daily'],
    difficulty: 6,
    titleKey: 'achievement_win_in_4_title',
    descriptionKey: 'achievement_win_in_4_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[3], target: 4 }),
  },
  {
    id: 'win_in_5',
    category: 'guess',
    modes: ['daily'],
    difficulty: 4,
    titleKey: 'achievement_win_in_5_title',
    descriptionKey: 'achievement_win_in_5_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[4], target: 5 }),
  },
  {
    id: 'win_in_6',
    category: 'guess',
    modes: ['daily'],
    difficulty: 3,
    titleKey: 'achievement_win_in_6_title',
    descriptionKey: 'achievement_win_in_6_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[5], target: 6 }),
  },

  // Streak
  {
    id: 'streak_3',
    category: 'streak',
    modes: ['daily'],
    difficulty: 3,
    titleKey: 'achievement_streak_3_title',
    descriptionKey: 'achievement_streak_3_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 3 }),
  },
  {
    id: 'streak_7',
    category: 'streak',
    modes: ['daily'],
    difficulty: 6,
    titleKey: 'achievement_streak_7_title',
    descriptionKey: 'achievement_streak_7_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 7 }),
  },
  {
    id: 'streak_14',
    category: 'streak',
    modes: ['daily'],
    difficulty: 8,
    titleKey: 'achievement_streak_14_title',
    descriptionKey: 'achievement_streak_14_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 14 }),
  },
  {
    id: 'streak_30',
    category: 'streak',
    modes: ['daily'],
    difficulty: 10,
    titleKey: 'achievement_streak_30_title',
    descriptionKey: 'achievement_streak_30_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 30 }),
  },

  // Event — 특정 게임 상황에서 발생하는 업적
  {
    id: 'dead_end_tail',
    category: 'event',
    modes: ['daily'],
    difficulty: 7,
    titleKey: 'achievement_dead_end_tail_title',
    descriptionKey: 'achievement_dead_end_tail_desc',
    progress: ({ game }) => ({
      current:
        game?.endReason === 'deadEnd' &&
        game.deadEnd?.guessIndex === 5 &&
        game.deadEnd.chainPosition === 'last'
          ? 1
          : 0,
      target: 1,
    }),
  },
  {
    id: 'bibimbap_balance',
    category: 'event',
    difficulty: 9,
    titleKey: 'achievement_bibimbap_balance_title',
    descriptionKey: 'achievement_bibimbap_balance_desc',
    progress: ({ game }) => {
      if (!game?.won || game.guessCount !== 6) {
        return { current: 0, target: 1 }
      }

      const counts = countStatusesForGame(game.guesses, game.solution)
      return {
        current:
          counts.correct === 10 && counts.present === 10 && counts.absent === 10
            ? 1
            : 0,
        target: 1,
      }
    },
  },
  {
    id: 'yogurt_recipe',
    category: 'event',
    difficulty: 6,
    titleKey: 'achievement_yogurt_recipe_title',
    descriptionKey: 'achievement_yogurt_recipe_desc',
    progress: ({ game }) => ({
      current:
        game && usedAllWords(game.guesses, ['apple', 'grape', 'milks']) ? 1 : 0,
      target: 1,
    }),
  },
]

// --- localStorage ---

const STORAGE_KEY = 'achievementState'
const ACHIEVEMENT_STATE_VERSION = 2

const defaultState: AchievementState = {
  version: ACHIEVEMENT_STATE_VERSION,
  unlocked: {},
  retroCompleted: false,
}

export const loadAchievementState = (): AchievementState => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data
    ? { ...defaultState, ...(JSON.parse(data) as Partial<AchievementState>) }
    : { ...defaultState }
}

const saveAchievementState = (state: AchievementState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const DEFAULT_ACHIEVEMENT_MODES: GameMode[] = ['daily']

export const getAchievementModes = (
  achievement: Pick<AchievementDef, 'modes'>
): GameMode[] => achievement.modes ?? DEFAULT_ACHIEVEMENT_MODES

export const isAchievementAvailableInMode = (
  achievement: Pick<AchievementDef, 'modes'>,
  mode: GameMode
): boolean => getAchievementModes(achievement).includes(mode)

export type AchievementEvaluationOptions = {
  mode?: GameMode
  game?: CompletedGameContext
  progress?: AchievementTrackingState
}

const createAchievementContext = (
  stats: GameStats,
  dailyHistory: DailyHistory,
  options: AchievementEvaluationOptions = {}
): AchievementContext => ({
  stats,
  dailyHistory,
  mode: options.mode ?? 'daily',
  progress: options.progress ?? loadAchievementProgress(),
  game: options.game,
})

// --- Engine ---

export const evaluateAchievementDefinitions = (
  definitions: AchievementDef[],
  stats: GameStats,
  dailyHistory: DailyHistory,
  options: AchievementEvaluationOptions = {}
): string[] => {
  const state = loadAchievementState()
  const ctx = createAchievementContext(stats, dailyHistory, options)
  const newlyUnlocked: string[] = []

  for (const achievement of definitions) {
    if (state.unlocked[achievement.id]) continue
    if (!isAchievementAvailableInMode(achievement, ctx.mode)) continue

    const { current, target } = achievement.progress(ctx)
    if (current >= target) {
      state.unlocked[achievement.id] = { unlockedAt: Date.now() }
      newlyUnlocked.push(achievement.id)
    }
  }

  if (newlyUnlocked.length > 0) {
    saveAchievementState(state)
  }

  return newlyUnlocked
}

export const evaluateAchievements = (
  stats: GameStats,
  dailyHistory: DailyHistory,
  options: AchievementEvaluationOptions = {}
): string[] => {
  return evaluateAchievementDefinitions(
    ACHIEVEMENTS,
    stats,
    dailyHistory,
    options
  )
}

export const retroUnlockAchievements = (
  stats: GameStats,
  dailyHistory: DailyHistory
): string[] => {
  const state = loadAchievementState()
  if (state.retroCompleted && state.version >= ACHIEVEMENT_STATE_VERSION) {
    return []
  }

  const newlyUnlocked = evaluateAchievements(stats, dailyHistory, {
    mode: 'daily',
  })

  const updatedState = loadAchievementState()
  updatedState.retroCompleted = true
  updatedState.version = ACHIEVEMENT_STATE_VERSION
  saveAchievementState(updatedState)

  return newlyUnlocked
}

export const markAchievementsSeen = (): void => {
  const state = loadAchievementState()
  state.lastSeenAt = Date.now()
  saveAchievementState(state)
}

export const getAchievementsWithStatus = (
  stats: GameStats,
  dailyHistory: DailyHistory,
  mode: GameMode = 'daily'
): Array<
  AchievementDef & {
    unlocked: boolean
    unlockedAt?: number
    currentProgress: AchievementProgress
    isNew: boolean
  }
> => {
  const state = loadAchievementState()
  const ctx = createAchievementContext(stats, dailyHistory, { mode })
  const lastSeen = state.lastSeenAt || 0
  return ACHIEVEMENTS.map((def) => ({
    ...def,
    unlocked: !!state.unlocked[def.id],
    isNew:
      !!state.unlocked[def.id] && state.unlocked[def.id].unlockedAt > lastSeen,
    unlockedAt: state.unlocked[def.id]?.unlockedAt,
    currentProgress: def.progress(ctx),
  }))
}
