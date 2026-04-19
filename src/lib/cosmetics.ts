// --- Type Definitions ---

export type CosmeticCategory =
  | 'shareEmoji'
  | 'cellFont'
  | 'cellColor'
  | 'chainStyle'
  | 'endMessage'

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

// --- Cell Font Options ---

export const CELL_FONT_STYLES: Record<string, string> = {
  font_default: '',
  font_pixel: "font-['Press_Start_2P']",
  font_marker: "font-['Permanent_Marker']",
}

// --- Cell Color Options ---

export const CELL_COLOR_STYLES: Record<string, string> = {
  color_default: '',
  color_yellow: 'text-yellow-200',
  color_pink: 'text-pink-200',
}

// --- Chain Style Options ---

export const CHAIN_STYLES: Record<
  string,
  { className: string; height: string }
> = {
  chain_default: { className: 'border-l-2 border-r-2 border-black', height: 'h-1' },
  chain_dashed: { className: 'border-l-2 border-r-2 border-dashed border-black', height: 'h-1' },
  chain_thick: { className: 'border-l-4 border-r-4 border-black', height: 'h-2' },
}

// --- End Message Options ---

export const END_MESSAGE_KEYS: Record<string, string> = {
  msg_default: 'winMessages',
  msg_epic: 'winMessagesEpic',
  msg_chill: 'winMessagesChill',
}

// --- All Options ---

export const COSMETIC_OPTIONS: CosmeticOption[] = [
  // Share Emoji
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

  // Cell Font
  {
    id: 'font_default',
    category: 'cellFont',
    titleKey: 'cosmetic_font_default',
  },
  {
    id: 'font_pixel',
    category: 'cellFont',
    titleKey: 'cosmetic_font_pixel',
    requiresAchievement: 'win_in_4',
  },
  {
    id: 'font_marker',
    category: 'cellFont',
    titleKey: 'cosmetic_font_marker',
    requiresAchievement: 'play_50',
  },

  // Cell Color
  {
    id: 'color_default',
    category: 'cellColor',
    titleKey: 'cosmetic_color_default',
  },
  {
    id: 'color_yellow',
    category: 'cellColor',
    titleKey: 'cosmetic_color_yellow',
    requiresAchievement: 'win_in_3',
  },
  {
    id: 'color_pink',
    category: 'cellColor',
    titleKey: 'cosmetic_color_pink',
    requiresAchievement: 'streak_7',
  },

  // Chain Style
  {
    id: 'chain_default',
    category: 'chainStyle',
    titleKey: 'cosmetic_chain_default',
  },
  {
    id: 'chain_dashed',
    category: 'chainStyle',
    titleKey: 'cosmetic_chain_dashed',
    requiresAchievement: 'win_in_6',
  },
  {
    id: 'chain_thick',
    category: 'chainStyle',
    titleKey: 'cosmetic_chain_thick',
    requiresAchievement: 'play_100',
  },

  // End Message
  {
    id: 'msg_default',
    category: 'endMessage',
    titleKey: 'cosmetic_msg_default',
  },
  {
    id: 'msg_epic',
    category: 'endMessage',
    titleKey: 'cosmetic_msg_epic',
    requiresAchievement: 'win_in_2',
  },
  {
    id: 'msg_chill',
    category: 'endMessage',
    titleKey: 'cosmetic_msg_chill',
    requiresAchievement: 'win_in_5',
  },
]

// --- localStorage ---

const STORAGE_KEY = 'cosmeticState'

const defaultState: CosmeticState = {
  equipped: {
    shareEmoji: 'emoji_default',
    cellFont: 'font_default',
    cellColor: 'color_default',
    chainStyle: 'chain_default',
    endMessage: 'msg_default',
  },
}

export const loadCosmeticState = (): CosmeticState => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data
    ? {
        equipped: {
          ...defaultState.equipped,
          ...(JSON.parse(data) as Partial<CosmeticState>).equipped,
        },
      }
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

export const getEquippedCellFont = (): string => {
  const state = loadCosmeticState()
  return CELL_FONT_STYLES[state.equipped.cellFont] ?? ''
}

export const getEquippedCellColor = (): string => {
  const state = loadCosmeticState()
  return CELL_COLOR_STYLES[state.equipped.cellColor] ?? ''
}

export const getEquippedChainStyle = (): {
  className: string
  height: string
} => {
  const state = loadCosmeticState()
  return (
    CHAIN_STYLES[state.equipped.chainStyle] ?? CHAIN_STYLES['chain_default']
  )
}

export const getEquippedEndMessageKey = (): string => {
  const state = loadCosmeticState()
  return (
    END_MESSAGE_KEYS[state.equipped.endMessage] ??
    END_MESSAGE_KEYS['msg_default']
  )
}
