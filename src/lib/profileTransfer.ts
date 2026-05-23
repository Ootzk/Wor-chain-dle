import { PATCH_NOTES_VERSION } from '../constants/config'
import { ACHIEVEMENTS } from './achievements'
import {
  createDefaultAchievementTrackingState,
  loadAchievementProgress,
} from './achievementProgress'
import type { AchievementTrackingState } from './achievementProgress'
import { COSMETIC_OPTIONS, loadCosmeticState } from './cosmetics'
import type { CosmeticCategory } from './cosmetics'
import { DailyResult, DailyResults, loadDailyResults } from './dailyResults'
import {
  EventResultsByVersion,
  loadEventResultsByVersion,
} from './eventResults'
import { GameStats, loadSettings, Settings } from './localStorage'
import { loadStats } from './stats'

const PROFILE_PREFIX = 'WCD1:'
const SCHEMA_VERSION = 1

const STORAGE_KEYS = {
  dailyResults: 'dailyResults',
  dailyHistoryStartDate: 'dailyHistoryStartDate',
  eventResults: 'eventResults',
  gameStats: 'gameStats',
  customGameStats: 'customGameStats',
  achievementState: 'achievementState',
  achievementProgress: 'achievementProgress',
  cosmeticState: 'cosmeticState',
  settings: 'settings',
} as const

type PublicAchievementState = {
  version?: number | string
  unlocked: Record<string, { unlockedAt: number }>
  retroCompleted?: boolean
  lastSeenAt?: number
}

type PublicCosmeticState = {
  equipped: Partial<Record<CosmeticCategory, string>>
}

export type ExportedProfileData = {
  dailyResults?: DailyResults
  dailyHistoryStartDate?: string
  eventResults?: EventResultsByVersion
  gameStats?: GameStats
  customGameStats?: GameStats
  achievementState?: PublicAchievementState
  achievementProgress?: AchievementTrackingState
  cosmeticState?: PublicCosmeticState
  settings?: Settings
}

export type ExportedProfile = {
  schemaVersion: typeof SCHEMA_VERSION
  appVersion: string
  exportedAt: string
  data: ExportedProfileData
}

export type ProfileImportOptions = {
  includeSettings?: boolean
  includeCosmetics?: boolean
}

export type ProfileImportPreview = {
  appVersion: string
  exportedAt: string
  dailyResults: number
  eventResults: number
  achievements: number
  hasSettings: boolean
  hasCosmetics: boolean
}

export type ProfileImportResult = ProfileImportPreview & {
  backup: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isDateKey = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

const textToBase64Url = (text: string): string =>
  btoa(unescape(encodeURIComponent(text)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

const base64UrlToText = (encoded: string): string => {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return decodeURIComponent(escape(atob(padded)))
}

export const encodeProfile = (profile: ExportedProfile): string =>
  `${PROFILE_PREFIX}${textToBase64Url(JSON.stringify(profile))}`

export const decodeProfile = (value: string): ExportedProfile => {
  const trimmed = value.trim()
  if (!trimmed.startsWith(PROFILE_PREFIX)) {
    throw new Error('profileImportInvalidPrefix')
  }

  const parsed = JSON.parse(
    base64UrlToText(trimmed.slice(PROFILE_PREFIX.length))
  )
  return normalizeProfile(parsed)
}

const normalizeGameStats = (value: unknown): GameStats | undefined => {
  if (!isObject(value)) return undefined
  const winDistribution = value.winDistribution
  if (
    !Array.isArray(winDistribution) ||
    winDistribution.length !== 6 ||
    !winDistribution.every(isNumber)
  ) {
    return undefined
  }

  return {
    winDistribution,
    gamesFailed: isNumber(value.gamesFailed) ? value.gamesFailed : 0,
    currentStreak: isNumber(value.currentStreak) ? value.currentStreak : 0,
    bestStreak: isNumber(value.bestStreak) ? value.bestStreak : 0,
    totalGames: isNumber(value.totalGames) ? value.totalGames : 0,
    successRate: isNumber(value.successRate) ? value.successRate : 0,
  }
}

const normalizeDailyResult = (
  dateKey: string,
  value: unknown
): DailyResult | undefined => {
  if (!isObject(value)) return undefined
  if (typeof value.won !== 'boolean') return undefined

  return {
    ...(value as Partial<DailyResult>),
    dateKey,
    won: value.won,
    guessCount: isNumber(value.guessCount) ? value.guessCount : 6,
    endReason:
      typeof value.endReason === 'string'
        ? (value.endReason as DailyResult['endReason'])
        : value.won
        ? 'win'
        : 'unknown',
  }
}

const normalizeDailyResults = (value: unknown): DailyResults | undefined => {
  if (!isObject(value)) return undefined
  const entries = Object.entries(value)
    .filter(([dateKey]) => isDateKey(dateKey))
    .map(([dateKey, result]) => [
      dateKey,
      normalizeDailyResult(dateKey, result),
    ])
    .filter((entry): entry is [string, DailyResult] => !!entry[1])

  return Object.fromEntries(entries)
}

const normalizeEventResults = (
  value: unknown
): EventResultsByVersion | undefined => {
  if (!isObject(value)) return undefined

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, results]) => isObject(results))
      .map(([version, results]) => [
        version,
        normalizeDailyResults(results) ?? {},
      ])
  ) as EventResultsByVersion
}

const knownAchievementIds = new Set(
  ACHIEVEMENTS.map((achievement) => achievement.id)
)

const normalizeAchievementState = (
  value: unknown
): PublicAchievementState | undefined => {
  if (!isObject(value) || !isObject(value.unlocked)) return undefined

  return {
    version:
      typeof value.version === 'string' || isNumber(value.version)
        ? value.version
        : undefined,
    retroCompleted:
      typeof value.retroCompleted === 'boolean'
        ? value.retroCompleted
        : undefined,
    lastSeenAt: isNumber(value.lastSeenAt) ? value.lastSeenAt : undefined,
    unlocked: Object.fromEntries(
      Object.entries(value.unlocked)
        .filter(([achievementId, unlock]) => {
          return (
            knownAchievementIds.has(achievementId) &&
            isObject(unlock) &&
            isNumber(unlock.unlockedAt)
          )
        })
        .map(([achievementId, unlock]) => [
          achievementId,
          { unlockedAt: (unlock as { unlockedAt: number }).unlockedAt },
        ])
    ),
  }
}

const normalizeAchievementProgress = (
  value: unknown
): AchievementTrackingState | undefined => {
  if (!isObject(value)) return undefined
  const defaults = createDefaultAchievementTrackingState()
  const parsed = value as Partial<AchievementTrackingState>

  return {
    modes: {
      daily: { ...defaults.modes.daily, ...parsed.modes?.daily },
      practice: { ...defaults.modes.practice, ...parsed.modes?.practice },
      custom: { ...defaults.modes.custom, ...parsed.modes?.custom },
      event: { ...defaults.modes.event, ...parsed.modes?.event },
    },
    versions: isObject(parsed.versions) ? parsed.versions : {},
    collectibles: isObject(parsed.collectibles) ? parsed.collectibles : {},
    words: isObject(parsed.words) ? parsed.words : {},
  }
}

const validCosmeticIdsByCategory = COSMETIC_OPTIONS.reduce<
  Record<CosmeticCategory, Set<string>>
>(
  (acc, option) => {
    acc[option.category].add(option.id)
    return acc
  },
  {
    shareEmoji: new Set(),
    shareBadge: new Set(),
    cellFont: new Set(),
    cellColor: new Set(),
    chainStyle: new Set(),
    chainColor: new Set(),
    endMessage: new Set(),
  }
)

const normalizeCosmeticState = (
  value: unknown
): PublicCosmeticState | undefined => {
  if (!isObject(value) || !isObject(value.equipped)) return undefined
  const equipped: PublicCosmeticState['equipped'] = {}

  Object.entries(validCosmeticIdsByCategory).forEach(([category, ids]) => {
    const optionId = (value.equipped as Record<string, unknown>)[category]
    if (typeof optionId === 'string' && ids.has(optionId)) {
      equipped[category as CosmeticCategory] = optionId
    }
  })

  return { equipped }
}

const normalizeSettings = (value: unknown): Settings | undefined => {
  if (!isObject(value)) return undefined
  const defaults = loadSettings()

  return {
    isUppercase:
      typeof value.isUppercase === 'boolean'
        ? value.isUppercase
        : defaults.isUppercase,
    isDarkMode:
      typeof value.isDarkMode === 'boolean'
        ? value.isDarkMode
        : defaults.isDarkMode,
    weekStartsOnMonday:
      typeof value.weekStartsOnMonday === 'boolean'
        ? value.weekStartsOnMonday
        : defaults.weekStartsOnMonday,
    excludeUrl:
      typeof value.excludeUrl === 'boolean'
        ? value.excludeUrl
        : defaults.excludeUrl,
    enterValidationHint:
      typeof value.enterValidationHint === 'boolean'
        ? value.enterValidationHint
        : defaults.enterValidationHint,
    controllerEnabled:
      typeof value.controllerEnabled === 'boolean'
        ? value.controllerEnabled
        : defaults.controllerEnabled,
  }
}

const normalizeProfile = (value: unknown): ExportedProfile => {
  if (!isObject(value) || value.schemaVersion !== SCHEMA_VERSION) {
    throw new Error('profileImportUnsupportedSchema')
  }
  if (!isObject(value.data)) {
    throw new Error('profileImportInvalidData')
  }

  const data = value.data
  return {
    schemaVersion: SCHEMA_VERSION,
    appVersion:
      typeof value.appVersion === 'string' ? value.appVersion : 'unknown',
    exportedAt:
      typeof value.exportedAt === 'string'
        ? value.exportedAt
        : new Date().toISOString(),
    data: {
      dailyResults: normalizeDailyResults(data.dailyResults),
      dailyHistoryStartDate: isDateKey(data.dailyHistoryStartDate)
        ? data.dailyHistoryStartDate
        : undefined,
      eventResults: normalizeEventResults(data.eventResults),
      gameStats: normalizeGameStats(data.gameStats),
      customGameStats: normalizeGameStats(data.customGameStats),
      achievementState: normalizeAchievementState(data.achievementState),
      achievementProgress: normalizeAchievementProgress(
        data.achievementProgress
      ),
      cosmeticState: normalizeCosmeticState(data.cosmeticState),
      settings: normalizeSettings(data.settings),
    },
  }
}

const readJson = <T>(key: string): T | undefined => {
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T) : undefined
}

export const createProfileExport = (): ExportedProfile => ({
  schemaVersion: SCHEMA_VERSION,
  appVersion: PATCH_NOTES_VERSION,
  exportedAt: new Date().toISOString(),
  data: {
    dailyResults: loadDailyResults(),
    dailyHistoryStartDate:
      localStorage.getItem(STORAGE_KEYS.dailyHistoryStartDate) ?? undefined,
    eventResults: loadEventResultsByVersion(),
    gameStats: loadStats(),
    customGameStats: loadStats(STORAGE_KEYS.customGameStats),
    achievementState: normalizeAchievementState(
      readJson(STORAGE_KEYS.achievementState)
    ),
    achievementProgress: loadAchievementProgress(),
    cosmeticState: loadCosmeticState(),
    settings: loadSettings(),
  },
})

export const createProfileExportString = (): string =>
  encodeProfile(createProfileExport())

export const getProfileImportPreview = (
  profileString: string
): ProfileImportPreview => {
  const profile = decodeProfile(profileString)
  const eventResults = profile.data.eventResults ?? {}

  return {
    appVersion: profile.appVersion,
    exportedAt: profile.exportedAt,
    dailyResults: Object.keys(profile.data.dailyResults ?? {}).length,
    eventResults: Object.values(eventResults).reduce(
      (sum, results) => sum + Object.keys(results).length,
      0
    ),
    achievements: Object.keys(profile.data.achievementState?.unlocked ?? {})
      .length,
    hasSettings: !!profile.data.settings,
    hasCosmetics: !!profile.data.cosmeticState,
  }
}

const writeJson = (key: string, value: unknown): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

const chooseRicherStats = (
  current: GameStats | undefined,
  incoming: GameStats | undefined
): GameStats | undefined => {
  if (!incoming) return current
  if (!current) return incoming
  return incoming.totalGames > current.totalGames ? incoming : current
}

const mergeAchievementState = (
  current: PublicAchievementState | undefined,
  incoming: PublicAchievementState | undefined
): PublicAchievementState | undefined => {
  if (!incoming) return current
  if (!current) return incoming

  return {
    version: current.version ?? incoming.version,
    retroCompleted: !!current.retroCompleted || !!incoming.retroCompleted,
    lastSeenAt: Math.max(current.lastSeenAt ?? 0, incoming.lastSeenAt ?? 0),
    unlocked: {
      ...current.unlocked,
      ...Object.fromEntries(
        Object.entries(incoming.unlocked).map(([achievementId, unlock]) => [
          achievementId,
          {
            unlockedAt: Math.min(
              current.unlocked[achievementId]?.unlockedAt ?? unlock.unlockedAt,
              unlock.unlockedAt
            ),
          },
        ])
      ),
    },
  }
}

const maxRecordValues = <T extends Record<string, { [key: string]: number }>>(
  current: T,
  incoming: T
): T => {
  const merged = { ...current }
  Object.entries(incoming).forEach(([key, value]) => {
    const currentValue = merged[key] ?? {}
    merged[key as keyof T] = Object.fromEntries(
      Array.from(
        new Set([...Object.keys(currentValue), ...Object.keys(value)])
      ).map((subKey) => [
        subKey,
        Math.max(currentValue[subKey] ?? 0, value[subKey] ?? 0),
      ])
    ) as T[keyof T]
  })
  return merged
}

const mergeAchievementProgress = (
  current: AchievementTrackingState,
  incoming?: AchievementTrackingState
): AchievementTrackingState => {
  if (!incoming) return current

  return {
    modes: {
      daily: {
        gamesCompleted: Math.max(
          current.modes.daily.gamesCompleted,
          incoming.modes.daily.gamesCompleted
        ),
        gamesWon: Math.max(
          current.modes.daily.gamesWon,
          incoming.modes.daily.gamesWon
        ),
      },
      practice: {
        gamesCompleted: Math.max(
          current.modes.practice.gamesCompleted,
          incoming.modes.practice.gamesCompleted
        ),
        gamesWon: Math.max(
          current.modes.practice.gamesWon,
          incoming.modes.practice.gamesWon
        ),
      },
      custom: {
        gamesCompleted: Math.max(
          current.modes.custom.gamesCompleted,
          incoming.modes.custom.gamesCompleted
        ),
        gamesWon: Math.max(
          current.modes.custom.gamesWon,
          incoming.modes.custom.gamesWon
        ),
      },
      event: {
        gamesCompleted: Math.max(
          current.modes.event.gamesCompleted,
          incoming.modes.event.gamesCompleted
        ),
        gamesWon: Math.max(
          current.modes.event.gamesWon,
          incoming.modes.event.gamesWon
        ),
      },
    },
    versions: maxRecordValues(current.versions, incoming.versions),
    collectibles: maxRecordValues(current.collectibles, incoming.collectibles),
    words: maxRecordValues(current.words, incoming.words),
  }
}

export const importProfile = (
  profileString: string,
  options: ProfileImportOptions = {}
): ProfileImportResult => {
  const profile = decodeProfile(profileString)
  const backup = createProfileExportString()
  const includeSettings = options.includeSettings ?? true
  const includeCosmetics = options.includeCosmetics ?? true

  if (profile.data.dailyResults) {
    writeJson(STORAGE_KEYS.dailyResults, {
      ...loadDailyResults(),
      ...profile.data.dailyResults,
    })
  }

  if (profile.data.dailyHistoryStartDate) {
    const currentStart = localStorage.getItem(
      STORAGE_KEYS.dailyHistoryStartDate
    )
    localStorage.setItem(
      STORAGE_KEYS.dailyHistoryStartDate,
      currentStart && currentStart < profile.data.dailyHistoryStartDate
        ? currentStart
        : profile.data.dailyHistoryStartDate
    )
  }

  if (profile.data.eventResults) {
    const current = loadEventResultsByVersion()
    const merged = { ...current }
    Object.entries(profile.data.eventResults).forEach(([version, results]) => {
      merged[version] = {
        ...(merged[version] ?? {}),
        ...results,
      }
    })
    writeJson(STORAGE_KEYS.eventResults, merged)
  }

  writeJson(
    STORAGE_KEYS.gameStats,
    chooseRicherStats(loadStats(), profile.data.gameStats)
  )
  writeJson(
    STORAGE_KEYS.customGameStats,
    chooseRicherStats(
      loadStats(STORAGE_KEYS.customGameStats),
      profile.data.customGameStats
    )
  )

  const achievementState = mergeAchievementState(
    normalizeAchievementState(readJson(STORAGE_KEYS.achievementState)),
    profile.data.achievementState
  )
  if (achievementState) {
    writeJson(STORAGE_KEYS.achievementState, achievementState)
  }

  writeJson(
    STORAGE_KEYS.achievementProgress,
    mergeAchievementProgress(
      loadAchievementProgress(),
      profile.data.achievementProgress
    )
  )

  if (includeCosmetics && profile.data.cosmeticState) {
    writeJson(STORAGE_KEYS.cosmeticState, {
      equipped: {
        ...loadCosmeticState().equipped,
        ...profile.data.cosmeticState.equipped,
      },
    })
  }

  if (includeSettings && profile.data.settings) {
    writeJson(STORAGE_KEYS.settings, profile.data.settings)
  }

  return {
    ...getProfileImportPreview(profileString),
    backup,
  }
}
