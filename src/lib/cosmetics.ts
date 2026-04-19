// --- Type Definitions ---

export type CosmeticCategory = 'shareEmoji' // 향후 'font' | 'cellColor' | 'chain' | 'endMessage' 추가

export type ShareEmojiSet = {
  correct: string
  present: string
  absent: string
}

export type CosmeticOption = {
  id: string
  category: CosmeticCategory
  titleKey: string
  requiresAchievement?: string
}

type CosmeticState = {
  equipped: Record<CosmeticCategory, string>
}

// --- Share Emoji Options ---

const SHARE_EMOJI_SETS: Record<string, ShareEmojiSet> = {
  emoji_default: {
    correct: '\uD83D\uDFE9',
    present: '\uD83D\uDFEA',
    absent: '\u2B1C',
  },
  emoji_circle: {
    correct: '\uD83D\uDFE2',
    present: '\uD83D\uDFE3',
    absent: '\u26AA',
  },
  emoji_heart: {
    correct: '\uD83D\uDC9A',
    present: '\uD83D\uDC9C',
    absent: '\uD83E\uDD0D',
  },
}

export const COSMETIC_OPTIONS: CosmeticOption[] = [
  {
    id: 'emoji_default',
    category: 'shareEmoji',
    titleKey: 'cosmetic_emoji_default',
  },
  {
    id: 'emoji_circle',
    category: 'shareEmoji',
    titleKey: 'cosmetic_emoji_circle',
    requiresAchievement: 'play_10',
  },
  {
    id: 'emoji_heart',
    category: 'shareEmoji',
    titleKey: 'cosmetic_emoji_heart',
    requiresAchievement: 'streak_3',
  },
]

// --- localStorage ---

const STORAGE_KEY = 'cosmeticState'

const defaultState: CosmeticState = {
  equipped: {
    shareEmoji: 'emoji_default',
  },
}

export const loadCosmeticState = (): CosmeticState => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data
    ? { ...defaultState, ...(JSON.parse(data) as Partial<CosmeticState>) }
    : { ...defaultState }
}

export const saveCosmeticState = (state: CosmeticState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const equipCosmetic = (
  category: CosmeticCategory,
  optionId: string
): void => {
  const state = loadCosmeticState()
  state.equipped[category] = optionId
  saveCosmeticState(state)
}

// --- Getters ---

export const getEquippedShareEmoji = (): ShareEmojiSet => {
  const state = loadCosmeticState()
  const optionId = state.equipped.shareEmoji
  return SHARE_EMOJI_SETS[optionId] ?? SHARE_EMOJI_SETS['emoji_default']
}

export const getShareEmojiSet = (optionId: string): ShareEmojiSet => {
  return SHARE_EMOJI_SETS[optionId] ?? SHARE_EMOJI_SETS['emoji_default']
}
