const gameStateKey = 'gameState'

type StoredGameState = {
  guesses: string[][]
  solution: string
}

export const saveGameStateToLocalStorage = (gameState: StoredGameState) => {
  localStorage.setItem(gameStateKey, JSON.stringify(gameState))
}

export const loadGameStateFromLocalStorage = () => {
  const state = localStorage.getItem(gameStateKey)
  return state ? (JSON.parse(state) as StoredGameState) : null
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
  shareWithUrl: boolean
}

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(settingsKey, JSON.stringify(settings))
}

export const loadSettings = (): Settings => {
  const settings = localStorage.getItem(settingsKey)
  return settings
    ? { isUppercase: false, weekStartsOnMonday: false, shareWithUrl: true, ...(JSON.parse(settings) as Partial<Settings>) }
    : { isUppercase: false, weekStartsOnMonday: false, shareWithUrl: true }
}

const seenPatchNotesVersionKey = 'seenPatchNotesVersion'

export const loadSeenPatchNotesVersion = (): string | null => {
  return localStorage.getItem(seenPatchNotesVersionKey)
}

export const saveSeenPatchNotesVersion = (version: string) => {
  localStorage.setItem(seenPatchNotesVersionKey, version)
}
