const gameStateKey = 'gameState'

type StoredGameState = {
  guesses: string[][]
  solution: string
}

type StoredEventGameState = StoredGameState & {
  version: string
  dateKey: string
}

export const saveGameStateToLocalStorage = (gameState: StoredGameState) => {
  localStorage.setItem(gameStateKey, JSON.stringify(gameState))
}

export const loadGameStateFromLocalStorage = () => {
  const state = localStorage.getItem(gameStateKey)
  return state ? (JSON.parse(state) as StoredGameState) : null
}

const eventGameStateKey = 'eventGameState'

export const saveEventGameStateToLocalStorage = (
  gameState: StoredEventGameState
) => {
  localStorage.setItem(eventGameStateKey, JSON.stringify(gameState))
}

export const loadEventGameStateFromLocalStorage = () => {
  const state = localStorage.getItem(eventGameStateKey)
  return state ? (JSON.parse(state) as StoredEventGameState) : null
}

const gameStatKey = 'gameStats'

export type GameStats = {
  winDistribution: number[]
  gamesFailed: number
  currentStreak: number
  bestStreak: number
  totalGames: number
  successRate: number
}

export const saveStatsToLocalStorage = (
  gameStats: GameStats,
  key: string = gameStatKey
) => {
  localStorage.setItem(key, JSON.stringify(gameStats))
}

export const loadStatsFromLocalStorage = (key: string = gameStatKey) => {
  const stats = localStorage.getItem(key)
  return stats ? (JSON.parse(stats) as GameStats) : null
}

const settingsKey = 'settings'

export type Settings = {
  isUppercase: boolean
  weekStartsOnMonday: boolean
  excludeUrl: boolean
  enterValidationHint: boolean
}

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(settingsKey, JSON.stringify(settings))
}

export const loadSettings = (): Settings => {
  const settings = localStorage.getItem(settingsKey)
  const defaults = {
    isUppercase: false,
    weekStartsOnMonday: false,
    excludeUrl: false,
    enterValidationHint: false,
  }
  return settings
    ? { ...defaults, ...(JSON.parse(settings) as Partial<Settings>) }
    : defaults
}

const seenPatchNotesVersionKey = 'seenPatchNotesVersion'

export const loadSeenPatchNotesVersion = (): string | null => {
  return localStorage.getItem(seenPatchNotesVersionKey)
}

export const saveSeenPatchNotesVersion = (version: string) => {
  localStorage.setItem(seenPatchNotesVersionKey, version)
}
