import { GameMode } from './gameMode'

export type ModeAchievementProgress = {
  gamesCompleted: number
  gamesWon: number
}

export type VersionAchievementProgress = {
  gamesCompleted: number
}

export type AchievementTrackingState = {
  modes: Record<GameMode, ModeAchievementProgress>
  versions: Record<string, VersionAchievementProgress>
  collectibles: Record<string, Record<string, number>>
}

const STORAGE_KEY = 'achievementProgress'

export const createDefaultAchievementTrackingState =
  (): AchievementTrackingState => ({
    modes: {
      daily: { gamesCompleted: 0, gamesWon: 0 },
      practice: { gamesCompleted: 0, gamesWon: 0 },
      custom: { gamesCompleted: 0, gamesWon: 0 },
      event: { gamesCompleted: 0, gamesWon: 0 },
    },
    versions: {},
    collectibles: {},
  })

export const loadAchievementProgress = (): AchievementTrackingState => {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return createDefaultAchievementTrackingState()

  const parsed = JSON.parse(data) as Partial<AchievementTrackingState>
  const defaults = createDefaultAchievementTrackingState()
  return {
    modes: {
      daily: { ...defaults.modes.daily, ...parsed.modes?.daily },
      practice: { ...defaults.modes.practice, ...parsed.modes?.practice },
      custom: { ...defaults.modes.custom, ...parsed.modes?.custom },
      event: { ...defaults.modes.event, ...parsed.modes?.event },
    },
    versions: parsed.versions ?? {},
    collectibles: parsed.collectibles ?? {},
  }
}

export const saveAchievementProgress = (
  progress: AchievementTrackingState
): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export const recordCompletedGameProgress = ({
  mode,
  appVersion,
  won,
}: {
  mode: GameMode
  appVersion: string
  won: boolean
}): AchievementTrackingState => {
  const progress = loadAchievementProgress()
  progress.modes[mode].gamesCompleted += 1
  if (won) {
    progress.modes[mode].gamesWon += 1
  }

  const versionProgress = progress.versions[appVersion] ?? {
    gamesCompleted: 0,
  }
  versionProgress.gamesCompleted += 1
  progress.versions[appVersion] = versionProgress

  saveAchievementProgress(progress)
  return progress
}

export const recordCollectibleProgress = ({
  collectionId,
  itemIds,
}: {
  collectionId: string
  itemIds: string[]
}): AchievementTrackingState => {
  const progress = loadAchievementProgress()
  const collection = progress.collectibles[collectionId] ?? {}

  itemIds.forEach((itemId) => {
    collection[itemId] = (collection[itemId] ?? 0) + 1
  })

  progress.collectibles[collectionId] = collection
  saveAchievementProgress(progress)
  return progress
}
