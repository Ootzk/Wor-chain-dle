export type GameMode = 'daily' | 'practice' | 'custom' | 'event'

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  daily: 'Daily',
  practice: 'Practice',
  custom: 'Custom',
  event: 'Event',
}

export const CREATE_MODE_LABEL = 'Create'
