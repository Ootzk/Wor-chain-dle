import { GameStats } from './localStorage'
import { DailyHistory } from './dailyHistory'

// --- Type Definitions ---

export type AchievementCategory = 'milestone' | 'guess' | 'streak'

type AchievementContext = {
  stats: GameStats
  dailyHistory: DailyHistory
}

export type AchievementProgress = {
  current: number
  target: number
}

export type AchievementDef = {
  id: string
  category: AchievementCategory
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

// --- Achievement Definitions ---

export const ACHIEVEMENTS: AchievementDef[] = [
  // Milestone
  {
    id: 'play_10',
    category: 'milestone',
    difficulty: 1,
    titleKey: 'achievement_play_10_title',
    descriptionKey: 'achievement_play_10_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 10 }),
  },
  {
    id: 'play_50',
    category: 'milestone',
    difficulty: 4,
    titleKey: 'achievement_play_50_title',
    descriptionKey: 'achievement_play_50_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 50 }),
  },
  {
    id: 'play_100',
    category: 'milestone',
    difficulty: 6,
    titleKey: 'achievement_play_100_title',
    descriptionKey: 'achievement_play_100_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 100 }),
  },

  // Guess — N번째 시도로 N회 승리
  {
    id: 'win_in_1',
    category: 'guess',
    difficulty: 10,
    titleKey: 'achievement_win_in_1_title',
    descriptionKey: 'achievement_win_in_1_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[0], target: 1 }),
  },
  {
    id: 'win_in_2',
    category: 'guess',
    difficulty: 9,
    titleKey: 'achievement_win_in_2_title',
    descriptionKey: 'achievement_win_in_2_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[1], target: 2 }),
  },
  {
    id: 'win_in_3',
    category: 'guess',
    difficulty: 7,
    titleKey: 'achievement_win_in_3_title',
    descriptionKey: 'achievement_win_in_3_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[2], target: 3 }),
  },
  {
    id: 'win_in_4',
    category: 'guess',
    difficulty: 6,
    titleKey: 'achievement_win_in_4_title',
    descriptionKey: 'achievement_win_in_4_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[3], target: 4 }),
  },
  {
    id: 'win_in_5',
    category: 'guess',
    difficulty: 4,
    titleKey: 'achievement_win_in_5_title',
    descriptionKey: 'achievement_win_in_5_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[4], target: 5 }),
  },
  {
    id: 'win_in_6',
    category: 'guess',
    difficulty: 3,
    titleKey: 'achievement_win_in_6_title',
    descriptionKey: 'achievement_win_in_6_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[5], target: 6 }),
  },

  // Streak
  {
    id: 'streak_3',
    category: 'streak',
    difficulty: 3,
    titleKey: 'achievement_streak_3_title',
    descriptionKey: 'achievement_streak_3_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 3 }),
  },
  {
    id: 'streak_7',
    category: 'streak',
    difficulty: 6,
    titleKey: 'achievement_streak_7_title',
    descriptionKey: 'achievement_streak_7_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 7 }),
  },
  {
    id: 'streak_30',
    category: 'streak',
    difficulty: 10,
    titleKey: 'achievement_streak_30_title',
    descriptionKey: 'achievement_streak_30_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 30 }),
  },
]

// --- localStorage ---

const STORAGE_KEY = 'achievementState'

const defaultState: AchievementState = {
  version: 1,
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

// --- Engine ---

export const evaluateAchievements = (
  stats: GameStats,
  dailyHistory: DailyHistory
): string[] => {
  const state = loadAchievementState()
  const ctx: AchievementContext = { stats, dailyHistory }
  const newlyUnlocked: string[] = []

  for (const achievement of ACHIEVEMENTS) {
    if (state.unlocked[achievement.id]) continue

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

export const retroUnlockAchievements = (
  stats: GameStats,
  dailyHistory: DailyHistory
): string[] => {
  const state = loadAchievementState()
  if (state.retroCompleted) return []

  const newlyUnlocked = evaluateAchievements(stats, dailyHistory)

  const updatedState = loadAchievementState()
  updatedState.retroCompleted = true
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
  dailyHistory: DailyHistory
): Array<
  AchievementDef & {
    unlocked: boolean
    unlockedAt?: number
    currentProgress: AchievementProgress
    isNew: boolean
  }
> => {
  const state = loadAchievementState()
  const ctx: AchievementContext = { stats, dailyHistory }
  const lastSeen = state.lastSeenAt || 0
  return ACHIEVEMENTS.map((def) => ({
    ...def,
    unlocked: !!state.unlocked[def.id],
    isNew:
      !!state.unlocked[def.id] &&
      (state.unlocked[def.id].unlockedAt > lastSeen),
    unlockedAt: state.unlocked[def.id]?.unlockedAt,
    currentProgress: def.progress(ctx),
  }))
}
