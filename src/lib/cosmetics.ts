// --- Type Definitions ---

export type CosmeticCategory =
  | 'shareEmoji'
  | 'shareBadge'
  | 'cellFont'
  | 'cellColor'
  | 'chainStyle'
  | 'chainColor'
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
  emoji_bibimbap: {
    correct: '\uD83E\uDD6C',
    present: '\uD83C\uDF46',
    absent: '\uD83C\uDF5A',
  },
  emoji_yogurt: {
    correct: '\uD83C\uDF4F',
    present: '\uD83C\uDF47',
    absent: '\uD83E\uDD5B',
  },
}

// --- Share Badge Options ---

const SHARE_BADGES: Record<string, string> = {
  badge_none: '',
  badge_fire: '\uD83D\uDD25',
  badge_calendar: '\uD83D\uDCC5',
  badge_lizard: '\uD83E\uDD8E',
  badge_six: '6\uFE0F\u20E3',
  badge_skull: '\uD83D\uDC80',
  badge_star: '\u2B50',
  badge_hundred: '\uD83D\uDCAF',
  badge_wrestle: '\uD83E\uDD3C',
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
  color_gold: 'text-yellow-300',
  color_black: 'text-black',
}

// --- Chain Style Options ---

export const CHAIN_STYLES: Record<
  string,
  {
    className: string
    height: string
    borderWidth: string
    borderStyle: string
  }
> = {
  chain_default: {
    className: 'border-l-2 border-r-2',
    height: 'h-1',
    borderWidth: 'border-2',
    borderStyle: 'border-solid',
  },
  chain_dashed: {
    className: 'border-l-2 border-r-2 border-dashed',
    height: 'h-1',
    borderWidth: 'border-2',
    borderStyle: 'border-dashed',
  },
  chain_thick: {
    className: 'border-l-4 border-r-4',
    height: 'h-1',
    borderWidth: 'border-4',
    borderStyle: 'border-solid',
  },
}

// --- Chain Color Options ---

export const CHAIN_COLOR_STYLES: Record<string, string> = {
  chaincolor_black: 'border-black',
  chaincolor_silver: 'border-gray-400',
  chaincolor_gold: 'border-yellow-500',
}

// --- Alert Message Theme Emoji ---

export const MSG_THEME_EMOJI: Record<string, string> = {
  msg_classic: '\uD83D\uDCD6',
  msg_phrase: '\uD83D\uDCAC',
  msg_chill: '\uD83D\uDE0E',
  msg_epic: '\uD83C\uDFC6',
  msg_slang: '\uD83D\uDDEF\uFE0F',
  msg_emoji: '\uD83D\uDE00',
}

// --- Alert Message Options ---

export const ALERT_MESSAGE_KEYS: Record<string, { win: string; loss: string }> =
  {
    msg_classic: { win: 'winMessages_classic', loss: 'lossMessage_classic' },
    msg_phrase: { win: 'winMessages_phrase', loss: 'lossMessage_phrase' },
    msg_chill: { win: 'winMessages_chill', loss: 'lossMessage_chill' },
    msg_epic: { win: 'winMessages_epic', loss: 'lossMessage_epic' },
    msg_slang: { win: 'winMessages_slang', loss: 'lossMessage_slang' },
    msg_emoji: { win: 'winMessages_emoji', loss: 'lossMessage_emoji' },
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
    requiresAchievement: 'win_in_3',
  },
  {
    id: 'emoji_bibimbap',
    category: 'shareEmoji',
    titleKey: 'cosmetic_emoji_bibimbap',
    requiresAchievement: 'bibimbap_balance',
  },
  {
    id: 'emoji_yogurt',
    category: 'shareEmoji',
    titleKey: 'cosmetic_emoji_yogurt',
    requiresAchievement: 'yogurt_recipe',
  },

  // Share Badge
  {
    id: 'badge_none',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_none',
  },
  {
    id: 'badge_fire',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_fire',
    requiresAchievement: 'streak_14',
  },
  {
    id: 'badge_calendar',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_calendar',
    requiresAchievement: 'monthly_attendance',
  },
  {
    id: 'badge_lizard',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_lizard',
    requiresAchievement: 'dead_end_tail',
  },
  {
    id: 'badge_six',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_six',
    requiresAchievement: 'played_v1_6_0_5',
  },
  {
    id: 'badge_skull',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_skull',
    requiresAchievement: 'fail_100',
  },
  {
    id: 'badge_star',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_star',
    requiresAchievement: 'play_150',
  },
  {
    id: 'badge_hundred',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_hundred',
    requiresAchievement: 'practice_win_100',
  },
  {
    id: 'badge_wrestle',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_wrestle',
    requiresAchievement: 'custom_win_10',
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
    id: 'color_gold',
    category: 'cellColor',
    titleKey: 'cosmetic_color_gold',
    requiresAchievement: 'win_in_2',
  },
  {
    id: 'color_black',
    category: 'cellColor',
    titleKey: 'cosmetic_color_black',
    requiresAchievement: 'win_in_5',
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
    requiresAchievement: 'streak_3',
  },
  {
    id: 'chain_thick',
    category: 'chainStyle',
    titleKey: 'cosmetic_chain_thick',
    requiresAchievement: 'streak_7',
  },

  // Chain Color
  {
    id: 'chaincolor_black',
    category: 'chainColor',
    titleKey: 'cosmetic_chaincolor_black',
  },
  {
    id: 'chaincolor_silver',
    category: 'chainColor',
    titleKey: 'cosmetic_chaincolor_silver',
    requiresAchievement: 'play_100',
  },
  {
    id: 'chaincolor_gold',
    category: 'chainColor',
    titleKey: 'cosmetic_chaincolor_gold',
    requiresAchievement: 'win_in_1',
  },

  // Alert Message
  {
    id: 'msg_classic',
    category: 'endMessage',
    titleKey: 'cosmetic_msg_classic',
  },
  {
    id: 'msg_phrase',
    category: 'endMessage',
    titleKey: 'cosmetic_msg_phrase',
    requiresAchievement: 'win_in_6',
  },
  // {
  //   id: 'msg_chill',
  //   category: 'endMessage',
  //   titleKey: 'cosmetic_msg_chill',
  //   requiresAchievement: undefined, // 추후 신규 업적에 배정
  // },
  // {
  //   id: 'msg_epic',
  //   category: 'endMessage',
  //   titleKey: 'cosmetic_msg_epic',
  //   requiresAchievement: undefined, // 추후 신규 업적에 배정
  // },
  // {
  //   id: 'msg_slang',
  //   category: 'endMessage',
  //   titleKey: 'cosmetic_msg_slang',
  //   requiresAchievement: undefined, // 추후 신규 업적에 배정
  // },
  {
    id: 'msg_emoji',
    category: 'endMessage',
    titleKey: 'cosmetic_msg_emoji',
    requiresAchievement: 'streak_30',
  },
]

// --- localStorage ---

const STORAGE_KEY = 'cosmeticState'

const defaultState: CosmeticState = {
  equipped: {
    shareEmoji: 'emoji_default',
    shareBadge: 'badge_none',
    cellFont: 'font_default',
    cellColor: 'color_default',
    chainStyle: 'chain_default',
    chainColor: 'chaincolor_black',
    endMessage: 'msg_classic',
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

export const getEquippedShareBadge = (): string => {
  const state = loadCosmeticState()
  return SHARE_BADGES[state.equipped.shareBadge] ?? SHARE_BADGES['badge_none']
}

export const getShareBadge = (optionId: string): string => {
  return SHARE_BADGES[optionId] ?? SHARE_BADGES['badge_none']
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
  borderWidth: string
  borderStyle: string
} => {
  const state = loadCosmeticState()
  return (
    CHAIN_STYLES[state.equipped.chainStyle] ?? CHAIN_STYLES['chain_default']
  )
}

export const getEquippedChainColor = (): string => {
  const state = loadCosmeticState()
  return (
    CHAIN_COLOR_STYLES[state.equipped.chainColor] ??
    CHAIN_COLOR_STYLES['chaincolor_black']
  )
}

export const getEquippedAlertMessageKeys = (): {
  win: string
  loss: string
} => {
  const state = loadCosmeticState()
  return (
    ALERT_MESSAGE_KEYS[state.equipped.endMessage] ??
    ALERT_MESSAGE_KEYS['msg_classic']
  )
}

export const getRewardsForAchievement = (
  achievementId: string
): CosmeticOption[] => {
  return COSMETIC_OPTIONS.filter((o) => o.requiresAchievement === achievementId)
}
