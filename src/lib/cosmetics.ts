import { REWARD_METADATA, RewardMetadata } from './rewardMetadata'

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
  metadata?: RewardMetadata
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
  badge_chain: '\uD83D\uDD17',
  badge_none: '\uD83D\uDD17',
  badge_fire: '\uD83D\uDD25',
  badge_calendar: '\uD83D\uDCC5',
  badge_lizard: '\uD83E\uDD8E',
  badge_six: '6\uFE0F\u20E3',
  badge_skull: '\uD83D\uDC80',
  badge_star: '\u2B50',
  badge_hundred: '\uD83D\uDCAF',
  badge_wrestle: '\uD83E\uDD3C',
  badge_apple: '\uD83C\uDF4F',
  badge_grape: '\uD83C\uDF47',
  badge_milk: '\uD83E\uDD5B',
  badge_azure: '\uD83E\uDE75',
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
  chaincolor_azure: 'border-sky-400',
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
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'emoji_circle',
    category: 'shareEmoji',
    titleKey: 'cosmetic_emoji_circle',
    requiresAchievement: 'play_10',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'emoji_heart',
    category: 'shareEmoji',
    titleKey: 'cosmetic_emoji_heart',
    requiresAchievement: 'win_in_3',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'emoji_bibimbap',
    category: 'shareEmoji',
    titleKey: 'cosmetic_emoji_bibimbap',
    requiresAchievement: 'bibimbap_balance',
    metadata: REWARD_METADATA.v1_6_0,
  },
  {
    id: 'emoji_yogurt',
    category: 'shareEmoji',
    titleKey: 'cosmetic_emoji_yogurt',
    requiresAchievement: 'yogurt_recipe',
    metadata: REWARD_METADATA.v1_6_0,
  },

  // Share Badge
  {
    id: 'badge_chain',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_chain',
    metadata: REWARD_METADATA.v1_6_0,
  },
  {
    id: 'badge_fire',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_fire',
    requiresAchievement: 'streak_14',
    metadata: REWARD_METADATA.v1_6_0,
  },
  {
    id: 'badge_calendar',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_calendar',
    requiresAchievement: 'monthly_attendance',
    metadata: REWARD_METADATA.v1_6_0,
  },
  {
    id: 'badge_lizard',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_lizard',
    requiresAchievement: 'dead_end_tail',
    metadata: REWARD_METADATA.v1_6_0,
  },
  {
    id: 'badge_six',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_six',
    requiresAchievement: 'played_v1_6_0_5',
    metadata: REWARD_METADATA.v1_6_0,
  },
  {
    id: 'badge_skull',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_skull',
    requiresAchievement: 'fail_100',
    metadata: REWARD_METADATA.v1_6_0,
  },
  {
    id: 'badge_star',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_star',
    requiresAchievement: 'play_150',
    metadata: REWARD_METADATA.v1_6_0,
  },
  {
    id: 'badge_hundred',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_hundred',
    requiresAchievement: 'practice_win_100',
    metadata: REWARD_METADATA.v1_6_0,
  },
  {
    id: 'badge_wrestle',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_wrestle',
    requiresAchievement: 'custom_win_10',
    metadata: REWARD_METADATA.v1_6_0,
  },
  {
    id: 'badge_apple',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_apple',
    requiresAchievement: 'no_present_game',
    metadata: REWARD_METADATA.v1_7_0,
  },
  {
    id: 'badge_grape',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_grape',
    requiresAchievement: 'no_correct_game',
    metadata: REWARD_METADATA.v1_7_0,
  },
  {
    id: 'badge_milk',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_milk',
    requiresAchievement: 'win_in_6_20',
    metadata: REWARD_METADATA.v1_7_0,
  },
  {
    id: 'badge_azure',
    category: 'shareBadge',
    titleKey: 'cosmetic_badge_azure',
    requiresAchievement: 'played_v1_7_0_5',
    metadata: REWARD_METADATA.v1_7_0,
  },

  // Cell Font
  {
    id: 'font_default',
    category: 'cellFont',
    titleKey: 'cosmetic_font_default',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'font_pixel',
    category: 'cellFont',
    titleKey: 'cosmetic_font_pixel',
    requiresAchievement: 'win_in_4',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'font_marker',
    category: 'cellFont',
    titleKey: 'cosmetic_font_marker',
    requiresAchievement: 'play_50',
    metadata: REWARD_METADATA.v1_5_0,
  },

  // Cell Color
  {
    id: 'color_default',
    category: 'cellColor',
    titleKey: 'cosmetic_color_default',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'color_gold',
    category: 'cellColor',
    titleKey: 'cosmetic_color_gold',
    requiresAchievement: 'win_in_2',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'color_black',
    category: 'cellColor',
    titleKey: 'cosmetic_color_black',
    requiresAchievement: 'win_in_5',
    metadata: REWARD_METADATA.v1_5_0,
  },

  // Chain Style
  {
    id: 'chain_default',
    category: 'chainStyle',
    titleKey: 'cosmetic_chain_default',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'chain_dashed',
    category: 'chainStyle',
    titleKey: 'cosmetic_chain_dashed',
    requiresAchievement: 'streak_3',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'chain_thick',
    category: 'chainStyle',
    titleKey: 'cosmetic_chain_thick',
    requiresAchievement: 'streak_7',
    metadata: REWARD_METADATA.v1_5_0,
  },

  // Chain Color
  {
    id: 'chaincolor_black',
    category: 'chainColor',
    titleKey: 'cosmetic_chaincolor_black',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'chaincolor_silver',
    category: 'chainColor',
    titleKey: 'cosmetic_chaincolor_silver',
    requiresAchievement: 'play_100',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'chaincolor_gold',
    category: 'chainColor',
    titleKey: 'cosmetic_chaincolor_gold',
    requiresAchievement: 'win_in_1',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'chaincolor_azure',
    category: 'chainColor',
    titleKey: 'cosmetic_chaincolor_azure',
    requiresAchievement: 'streak_5',
    metadata: REWARD_METADATA.v1_7_0,
  },

  // Alert Message
  {
    id: 'msg_classic',
    category: 'endMessage',
    titleKey: 'cosmetic_msg_classic',
    metadata: REWARD_METADATA.v1_5_0,
  },
  {
    id: 'msg_phrase',
    category: 'endMessage',
    titleKey: 'cosmetic_msg_phrase',
    requiresAchievement: 'win_in_6',
    metadata: REWARD_METADATA.v1_5_0,
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
    metadata: REWARD_METADATA.v1_5_0,
  },
]

// --- localStorage ---

const STORAGE_KEY = 'cosmeticState'

const defaultState: CosmeticState = {
  equipped: {
    shareEmoji: 'emoji_default',
    shareBadge: 'badge_chain',
    cellFont: 'font_default',
    cellColor: 'color_default',
    chainStyle: 'chain_default',
    chainColor: 'chaincolor_black',
    endMessage: 'msg_classic',
  },
}

const legacyOptionIds: Record<string, string> = {
  badge_none: 'badge_chain',
}

const normalizeOptionId = (optionId: string): string =>
  legacyOptionIds[optionId] ?? optionId

const normalizeEquipped = (
  equipped: Partial<Record<CosmeticCategory, string>>
): Record<CosmeticCategory, string> => {
  const merged = {
    ...defaultState.equipped,
    ...equipped,
  }

  return {
    shareEmoji: normalizeOptionId(merged.shareEmoji),
    shareBadge: normalizeOptionId(merged.shareBadge),
    cellFont: normalizeOptionId(merged.cellFont),
    cellColor: normalizeOptionId(merged.cellColor),
    chainStyle: normalizeOptionId(merged.chainStyle),
    chainColor: normalizeOptionId(merged.chainColor),
    endMessage: normalizeOptionId(merged.endMessage),
  }
}

export const loadCosmeticState = (): CosmeticState => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data
    ? {
        equipped: normalizeEquipped(
          (JSON.parse(data) as Partial<CosmeticState>).equipped ?? {}
        ),
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
  return SHARE_BADGES[state.equipped.shareBadge] ?? SHARE_BADGES['badge_chain']
}

export const getShareBadge = (optionId: string): string => {
  return (
    SHARE_BADGES[normalizeOptionId(optionId)] ?? SHARE_BADGES['badge_chain']
  )
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
