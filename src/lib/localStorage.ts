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

export const saveStatsToLocalStorage = (gameStats: GameStats) => {
  localStorage.setItem(gameStatKey, JSON.stringify(gameStats))
}

export const loadStatsFromLocalStorage = () => {
  const stats = localStorage.getItem(gameStatKey)
  return stats ? (JSON.parse(stats) as GameStats) : null
}

const settingsKey = 'settings'

export type Settings = {
  isUppercase: boolean
}

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(settingsKey, JSON.stringify(settings))
}

export const loadSettings = (): Settings => {
  const settings = localStorage.getItem(settingsKey)
  return settings ? (JSON.parse(settings) as Settings) : { isUppercase: false }
}
