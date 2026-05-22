import { GameStats } from './localStorage'
import {
  DailyHistory,
  getBestMonthlyAttendanceProgress,
  dateToKey,
} from './dailyHistory'
import { getDailyResultsStartDate } from './dailyResults'
import { Temporal } from 'temporal-polyfill'
import { GameMode } from './gameMode'
import {
  AchievementTrackingState,
  loadAchievementProgress,
} from './achievementProgress'
import {
  SUMMER_GARDEN_CLOVER_COLLECTION_ID,
  SUMMER_GARDEN_CLOVER_TOTAL_TARGET,
} from './eventCollectibles'
import { CharStatus, getGuessStatuses } from './statuses'
import {
  matchesRewardMetadata,
  REWARD_METADATA,
  RewardMetadata,
  RewardMetadataFilter,
} from './rewardMetadata'
import {
  CompletedPlayStats,
  DailyDetailStatsHistory,
  TileCounts,
  getTotalGuessTimeMs,
  loadDailyDetailStatsHistory,
} from './playStats'
import { loadEventResults } from './eventResults'

// --- Type Definitions ---

export type AchievementType =
  | 'milestone'
  | 'guess'
  | 'streak'
  | 'challenge'
  | 'collection'
  | 'performance'

export type AchievementEndReason = 'win' | 'fail' | 'deadEnd'

export type DeadEndContext = {
  guessIndex: number
  chainPosition: 'first' | 'last'
  chainLetter: string
  solutionLetter: string
}

export type CompletedGameContext = {
  dateKey?: string
  eventVersion?: string
  guesses: string[][]
  solution: string
  won: boolean
  lost: boolean
  guessCount: number
  endReason: AchievementEndReason
  deadEnd?: DeadEndContext
  tileCounts?: TileCounts
  playStats?: CompletedPlayStats
}

export type AchievementContext = {
  stats: GameStats
  dailyHistory: DailyHistory
  dailyDetailStatsHistory: DailyDetailStatsHistory
  mode: GameMode
  eventVersion?: string
  progress: AchievementTrackingState
  game?: CompletedGameContext
}

export type AchievementProgress = {
  current: number
  target: number
}

export type AchievementDef = {
  id: string
  achievementType: AchievementType
  modes?: GameMode[]
  requiresAchievements?: string[]
  difficulty: number // 1-10, UI에서 별 5개로 매핑 (2당 별 1개)
  metadata?: RewardMetadata
  progress: (ctx: AchievementContext) => AchievementProgress
  titleKey: string
  descriptionKey: string
}

type AchievementUnlock = {
  unlockedAt: number
}

type AchievementStateVersion = number | `v${number}.${number}.${number}`

type AchievementState = {
  version: AchievementStateVersion
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

const tileCountsFromGame = (game: CompletedGameContext): TileCounts => {
  if (game.tileCounts) {
    return game.tileCounts
  }

  const statusCounts = countStatusesForGame(game.guesses, game.solution)
  return {
    ...statusCounts,
    unrevealed: 0,
  }
}

const hasStoredTileCounts = (
  counts: Partial<TileCounts> | undefined
): counts is TileCounts =>
  counts !== undefined &&
  typeof counts.correct === 'number' &&
  typeof counts.present === 'number' &&
  typeof counts.absent === 'number' &&
  typeof counts.unrevealed === 'number'

type TilePatternGame = Pick<CompletedGameContext, 'won' | 'guessCount'>
type TilePatternPredicate = (
  counts: TileCounts,
  game: TilePatternGame
) => boolean

const countCompletedGamesMatchingTilePattern = (
  ctx: AchievementContext,
  predicate: TilePatternPredicate
): number => {
  let count = 0
  const activeGameDateKey = ctx.game?.dateKey

  if (ctx.game && predicate(tileCountsFromGame(ctx.game), ctx.game)) {
    count += 1
  }

  for (const game of Object.values(ctx.dailyDetailStatsHistory)) {
    if (activeGameDateKey && game.dateKey === activeGameDateKey) continue
    if (
      hasStoredTileCounts(game.tileCounts) &&
      predicate(game.tileCounts, game)
    ) {
      count += 1
    }
  }

  return count
}

export const getTilePatternProgress = (
  ctx: AchievementContext,
  predicate: TilePatternPredicate,
  target = 1
): AchievementProgress => {
  const current = countCompletedGamesMatchingTilePattern(ctx, predicate)
  return {
    current: Math.min(current, target),
    target,
  }
}

const SUMMER_GARDEN_VERSION = 'v1.7.0'
const ONE_MINUTE_MS = 60 * 1000
const GARDEN_SET_COMPONENT_ACHIEVEMENTS = [
  'clover_collector',
  'practice_win_10',
  'rabbit_speed',
]

const isFastWin = (result: {
  won: boolean
  playStats?: CompletedPlayStats
}): boolean =>
  result.won &&
  !!result.playStats &&
  getTotalGuessTimeMs(result.playStats) <= ONE_MINUTE_MS

const getSummerGardenFastWinProgress = (
  ctx: AchievementContext
): AchievementProgress => {
  const target = 7
  let current = 0
  const activeDateKey = ctx.mode === 'event' ? ctx.game?.dateKey : undefined

  if (
    ctx.mode === 'event' &&
    ctx.game &&
    ctx.game.eventVersion === SUMMER_GARDEN_VERSION &&
    isFastWin({ won: ctx.game.won, playStats: ctx.game.playStats })
  ) {
    current += 1
  }

  for (const result of Object.values(loadEventResults(SUMMER_GARDEN_VERSION))) {
    if (activeDateKey && result.dateKey === activeDateKey) continue
    if (isFastWin(result)) {
      current += 1
    }
  }

  return {
    current: Math.min(current, target),
    target,
  }
}

const getSummerGardenCompletedGameProgress = (
  ctx: AchievementContext
): AchievementProgress => {
  const target = 5
  let current = 0
  const activeDateKey = ctx.mode === 'event' ? ctx.game?.dateKey : undefined

  if (
    ctx.mode === 'event' &&
    ctx.game &&
    ctx.game.eventVersion === SUMMER_GARDEN_VERSION
  ) {
    current += 1
  }

  for (const result of Object.values(loadEventResults(SUMMER_GARDEN_VERSION))) {
    if (activeDateKey && result.dateKey === activeDateKey) continue
    current += 1
  }

  return {
    current: Math.min(current, target),
    target,
  }
}

const getRequiredAchievementProgress = (
  ids: string[],
  state: Pick<AchievementState, 'unlocked'> = loadAchievementState()
): AchievementProgress => ({
  current: ids.filter((id) => state.unlocked[id]).length,
  target: ids.length,
})

const isGreenGrassEventWin = (game: CompletedGameContext): boolean =>
  game.eventVersion === SUMMER_GARDEN_VERSION &&
  game.won &&
  usedAllWords(game.guesses, ['green', 'grass'])

// --- Achievement Definitions ---

export const ACHIEVEMENTS: AchievementDef[] = [
  // Milestone
  {
    id: 'play_10',
    achievementType: 'milestone',
    modes: ['daily'],
    difficulty: 1,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_play_10_title',
    descriptionKey: 'achievement_play_10_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 10 }),
  },
  {
    id: 'play_50',
    achievementType: 'milestone',
    modes: ['daily'],
    difficulty: 4,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_play_50_title',
    descriptionKey: 'achievement_play_50_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 50 }),
  },
  {
    id: 'play_100',
    achievementType: 'milestone',
    modes: ['daily'],
    difficulty: 6,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_play_100_title',
    descriptionKey: 'achievement_play_100_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 100 }),
  },
  {
    id: 'play_150',
    achievementType: 'milestone',
    modes: ['daily'],
    difficulty: 8,
    metadata: REWARD_METADATA.v1_6_0,
    titleKey: 'achievement_play_150_title',
    descriptionKey: 'achievement_play_150_desc',
    progress: ({ stats }) => ({ current: stats.totalGames, target: 150 }),
  },
  {
    id: 'fail_100',
    achievementType: 'milestone',
    modes: ['daily'],
    difficulty: 8,
    metadata: REWARD_METADATA.v1_6_0,
    titleKey: 'achievement_fail_100_title',
    descriptionKey: 'achievement_fail_100_desc',
    progress: ({ stats }) => ({ current: stats.gamesFailed, target: 100 }),
  },
  {
    id: 'monthly_attendance',
    achievementType: 'milestone',
    modes: ['daily'],
    difficulty: 9,
    metadata: REWARD_METADATA.v1_6_0,
    titleKey: 'achievement_monthly_attendance_title',
    descriptionKey: 'achievement_monthly_attendance_desc',
    progress: ({ dailyHistory }) =>
      getBestMonthlyAttendanceProgress(dailyHistory, {
        startDate: getDailyResultsStartDate(),
      }),
  },
  {
    id: 'played_v1_6_0_5',
    achievementType: 'milestone',
    modes: ['daily', 'practice', 'custom'],
    difficulty: 1,
    metadata: REWARD_METADATA.v1_6_0,
    titleKey: 'achievement_played_v1_6_0_5_title',
    descriptionKey: 'achievement_played_v1_6_0_5_desc',
    progress: ({ progress }) => ({
      current: progress.versions['1.6.0']?.gamesCompleted ?? 0,
      target: 5,
    }),
  },
  {
    id: 'played_v1_7_0_5',
    achievementType: 'milestone',
    modes: ['daily', 'practice', 'custom'],
    difficulty: 1,
    metadata: REWARD_METADATA.v1_7_0,
    titleKey: 'achievement_played_v1_7_0_5_title',
    descriptionKey: 'achievement_played_v1_7_0_5_desc',
    progress: ({ progress }) => ({
      current: progress.versions['1.7.0']?.gamesCompleted ?? 0,
      target: 5,
    }),
  },
  {
    id: 'clover_collector',
    achievementType: 'collection',
    modes: ['event'],
    difficulty: 7,
    metadata: REWARD_METADATA.v1_7_0,
    titleKey: 'achievement_clover_collector_title',
    descriptionKey: 'achievement_clover_collector_desc',
    progress: ({ progress, eventVersion }) => {
      const collection =
        progress.collectibles[SUMMER_GARDEN_CLOVER_COLLECTION_ID] ?? {}
      if (eventVersion && eventVersion !== SUMMER_GARDEN_VERSION) {
        return { current: 0, target: SUMMER_GARDEN_CLOVER_TOTAL_TARGET }
      }
      return {
        current: Object.values(collection).reduce(
          (sum, count) => sum + count,
          0
        ),
        target: SUMMER_GARDEN_CLOVER_TOTAL_TARGET,
      }
    },
  },
  {
    id: 'practice_win_10',
    achievementType: 'milestone',
    modes: ['practice'],
    difficulty: 3,
    metadata: REWARD_METADATA.v1_7_0,
    titleKey: 'achievement_practice_win_10_title',
    descriptionKey: 'achievement_practice_win_10_desc',
    progress: ({ progress }) => ({
      current: progress.modes.practice.gamesWon,
      target: 10,
    }),
  },
  {
    id: 'rabbit_speed',
    achievementType: 'performance',
    modes: ['event'],
    difficulty: 5,
    metadata: REWARD_METADATA.v1_7_0,
    titleKey: 'achievement_rabbit_speed_title',
    descriptionKey: 'achievement_rabbit_speed_desc',
    progress: getSummerGardenFastWinProgress,
  },
  {
    id: 'garden_set',
    achievementType: 'collection',
    modes: ['daily', 'practice', 'custom', 'event'],
    requiresAchievements: GARDEN_SET_COMPONENT_ACHIEVEMENTS,
    difficulty: 7,
    metadata: REWARD_METADATA.v1_7_0,
    titleKey: 'achievement_garden_set_title',
    descriptionKey: 'achievement_garden_set_desc',
    progress: () =>
      getRequiredAchievementProgress(GARDEN_SET_COMPONENT_ACHIEVEMENTS),
  },
  {
    id: 'practice_win_100',
    achievementType: 'milestone',
    modes: ['practice'],
    difficulty: 8,
    metadata: REWARD_METADATA.v1_6_0,
    titleKey: 'achievement_practice_win_100_title',
    descriptionKey: 'achievement_practice_win_100_desc',
    progress: ({ progress }) => ({
      current: progress.modes.practice.gamesWon,
      target: 100,
    }),
  },
  {
    id: 'custom_win_10',
    achievementType: 'milestone',
    modes: ['custom'],
    difficulty: 4,
    metadata: REWARD_METADATA.v1_6_0,
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
    achievementType: 'guess',
    modes: ['daily'],
    difficulty: 10,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_win_in_1_title',
    descriptionKey: 'achievement_win_in_1_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[0], target: 1 }),
  },
  {
    id: 'win_in_2',
    achievementType: 'guess',
    modes: ['daily'],
    difficulty: 9,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_win_in_2_title',
    descriptionKey: 'achievement_win_in_2_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[1], target: 2 }),
  },
  {
    id: 'win_in_3',
    achievementType: 'guess',
    modes: ['daily'],
    difficulty: 7,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_win_in_3_title',
    descriptionKey: 'achievement_win_in_3_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[2], target: 3 }),
  },
  {
    id: 'win_in_4',
    achievementType: 'guess',
    modes: ['daily'],
    difficulty: 6,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_win_in_4_title',
    descriptionKey: 'achievement_win_in_4_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[3], target: 4 }),
  },
  {
    id: 'win_in_5',
    achievementType: 'guess',
    modes: ['daily'],
    difficulty: 4,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_win_in_5_title',
    descriptionKey: 'achievement_win_in_5_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[4], target: 5 }),
  },
  {
    id: 'win_in_6',
    achievementType: 'guess',
    modes: ['daily'],
    difficulty: 3,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_win_in_6_title',
    descriptionKey: 'achievement_win_in_6_desc',
    progress: ({ stats }) => ({ current: stats.winDistribution[5], target: 6 }),
  },
  {
    id: 'win_in_6_20',
    achievementType: 'guess',
    modes: ['daily'],
    difficulty: 6,
    metadata: REWARD_METADATA.v1_7_0,
    titleKey: 'achievement_win_in_6_20_title',
    descriptionKey: 'achievement_win_in_6_20_desc',
    progress: ({ stats }) => ({
      current: stats.winDistribution[5],
      target: 20,
    }),
  },

  // Streak
  {
    id: 'streak_3',
    achievementType: 'streak',
    modes: ['daily'],
    difficulty: 3,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_streak_3_title',
    descriptionKey: 'achievement_streak_3_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 3 }),
  },
  {
    id: 'grassland_trail',
    achievementType: 'milestone',
    modes: ['event'],
    difficulty: 3,
    metadata: REWARD_METADATA.v1_7_0,
    titleKey: 'achievement_grassland_trail_title',
    descriptionKey: 'achievement_grassland_trail_desc',
    progress: getSummerGardenCompletedGameProgress,
  },
  {
    id: 'streak_7',
    achievementType: 'streak',
    modes: ['daily'],
    difficulty: 6,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_streak_7_title',
    descriptionKey: 'achievement_streak_7_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 7 }),
  },
  {
    id: 'streak_14',
    achievementType: 'streak',
    modes: ['daily'],
    difficulty: 8,
    metadata: REWARD_METADATA.v1_6_0,
    titleKey: 'achievement_streak_14_title',
    descriptionKey: 'achievement_streak_14_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 14 }),
  },
  {
    id: 'streak_30',
    achievementType: 'streak',
    modes: ['daily'],
    difficulty: 10,
    metadata: REWARD_METADATA.v1_5_0,
    titleKey: 'achievement_streak_30_title',
    descriptionKey: 'achievement_streak_30_desc',
    progress: ({ stats }) => ({ current: stats.bestStreak, target: 30 }),
  },

  // Event — 특정 게임 상황에서 발생하는 업적
  {
    id: 'dead_end_tail',
    achievementType: 'challenge',
    modes: ['daily'],
    difficulty: 7,
    metadata: REWARD_METADATA.v1_6_0,
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
    achievementType: 'challenge',
    difficulty: 9,
    metadata: REWARD_METADATA.v1_6_0,
    titleKey: 'achievement_bibimbap_balance_title',
    descriptionKey: 'achievement_bibimbap_balance_desc',
    progress: (ctx) =>
      getTilePatternProgress(
        ctx,
        (counts, game) =>
          game.won &&
          game.guessCount === 6 &&
          counts.correct === 10 &&
          counts.present === 10 &&
          counts.absent === 10
      ),
  },
  {
    id: 'yogurt_recipe',
    achievementType: 'challenge',
    difficulty: 6,
    metadata: REWARD_METADATA.v1_6_0,
    titleKey: 'achievement_yogurt_recipe_title',
    descriptionKey: 'achievement_yogurt_recipe_desc',
    progress: ({ game }) => ({
      current:
        game && usedAllWords(game.guesses, ['apple', 'grape', 'milks']) ? 1 : 0,
      target: 1,
    }),
  },
  {
    id: 'no_present_game',
    achievementType: 'performance',
    modes: ['daily'],
    difficulty: 5,
    metadata: REWARD_METADATA.v1_7_0,
    titleKey: 'achievement_no_present_game_title',
    descriptionKey: 'achievement_no_present_game_desc',
    progress: (ctx) =>
      getTilePatternProgress(ctx, (counts) => counts.present === 0),
  },
  {
    id: 'no_correct_game',
    achievementType: 'performance',
    modes: ['daily'],
    difficulty: 6,
    metadata: REWARD_METADATA.v1_7_0,
    titleKey: 'achievement_no_correct_game_title',
    descriptionKey: 'achievement_no_correct_game_desc',
    progress: (ctx) =>
      getTilePatternProgress(ctx, (counts) => counts.correct === 0),
  },
  {
    id: 'grass_diet',
    achievementType: 'challenge',
    modes: ['event'],
    difficulty: 8,
    metadata: REWARD_METADATA.v1_7_0,
    titleKey: 'achievement_grass_diet_title',
    descriptionKey: 'achievement_grass_diet_desc',
    progress: ({ game }) => ({
      current: game && isGreenGrassEventWin(game) ? 1 : 0,
      target: 1,
    }),
  },
]

// --- localStorage ---

const STORAGE_KEY = 'achievementState'
const ACHIEVEMENT_STATE_VERSION = 'v1.7.0'

const createDefaultState = (): AchievementState => ({
  version: ACHIEVEMENT_STATE_VERSION,
  unlocked: {},
  retroCompleted: false,
})

export const loadAchievementState = (): AchievementState => {
  const data = localStorage.getItem(STORAGE_KEY)
  const defaults = createDefaultState()
  if (!data) return defaults

  const parsed = JSON.parse(data) as Partial<AchievementState>
  return {
    ...defaults,
    ...parsed,
    unlocked: { ...(parsed.unlocked ?? {}) },
  }
}

const epochMsToLocalDateKey = (epochMs: number): string =>
  dateToKey(
    Temporal.Instant.fromEpochMilliseconds(epochMs)
      .toZonedDateTimeISO(Temporal.Now.timeZoneId())
      .toPlainDate()
  )

export const getAchievementsUnlockedTodayCount = (
  metadataFilter?: RewardMetadataFilter
): number => {
  const todayKey = dateToKey(Temporal.Now.plainDateISO())
  const state = loadAchievementState()

  return Object.entries(state.unlocked).filter(([achievementId, unlock]) => {
    if (epochMsToLocalDateKey(unlock.unlockedAt) !== todayKey) {
      return false
    }
    if (!metadataFilter) return true
    const achievement = ACHIEVEMENTS.find((def) => def.id === achievementId)
    return matchesRewardMetadata(achievement?.metadata, metadataFilter)
  }).length
}

export const hasNewAchievementsUnlockedToday = (
  metadataFilter?: RewardMetadataFilter
): boolean => {
  const todayKey = dateToKey(Temporal.Now.plainDateISO())
  const state = loadAchievementState()
  const lastSeen = state.lastSeenAt || 0

  return Object.entries(state.unlocked).some(([achievementId, unlock]) => {
    if (
      unlock.unlockedAt <= lastSeen ||
      epochMsToLocalDateKey(unlock.unlockedAt) !== todayKey
    ) {
      return false
    }
    if (!metadataFilter) return true
    const achievement = ACHIEVEMENTS.find((def) => def.id === achievementId)
    return matchesRewardMetadata(achievement?.metadata, metadataFilter)
  })
}

const saveAchievementState = (state: AchievementState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const isAchievementStateCurrent = (state: AchievementState): boolean =>
  state.retroCompleted && state.version === ACHIEVEMENT_STATE_VERSION

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
  eventVersion?: string
  game?: CompletedGameContext
  progress?: AchievementTrackingState
  dailyDetailStatsHistory?: DailyDetailStatsHistory
}

const createAchievementContext = (
  stats: GameStats,
  dailyHistory: DailyHistory,
  options: AchievementEvaluationOptions = {}
): AchievementContext => ({
  stats,
  dailyHistory,
  dailyDetailStatsHistory:
    options.dailyDetailStatsHistory ?? loadDailyDetailStatsHistory(),
  mode: options.mode ?? 'daily',
  eventVersion: options.eventVersion,
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

    const { current, target } = achievement.requiresAchievements?.length
      ? getRequiredAchievementProgress(achievement.requiresAchievements, state)
      : achievement.progress(ctx)
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
  if (isAchievementStateCurrent(state)) {
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
