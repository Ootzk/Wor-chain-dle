import { Temporal } from 'temporal-polyfill'
import { CONFIG } from '../constants/config'
import { WORDS } from '../constants/wordlist'
import { CosmeticOverrideConfig } from './cosmetics'
import { EventCollectibleConfig } from './eventCollectibles'
import { PacmanConfig } from './pacman'

export type EventModeKind = 'standard' | 'pacman' | 'hardcore' | 'ai'

export type EventDefinition = {
  id: string
  version: string
  titleKey: string
  descriptionKey: string
  shareContextLabel: string
  modeKind: EventModeKind
  themeKey: string
  answerSeed: string
  loseReasons: EventLoseReasonDefinition[]
  cosmeticOverrides?: CosmeticOverrideConfig
  settingOverrides?: EventSettingOverrides
  pacman?: PacmanConfig
  collectibles?: EventCollectibleConfig[]
}

export type EventLoseReasonDefinition = {
  id: string
  icon: string
  titleKey: string
  infoKey: string
  colorClass: string
  isUnknown?: boolean
}

export type EventSettingOverrides = Partial<{
  isUppercase: boolean
  excludeUrl: boolean
  enterValidationHint: boolean
  lettersHidden: boolean
}>

export type EventWordOfDay = {
  solution: string
  solutionIndex: number
}

const eventWordPermutations = new Map<string, number[]>()

const SUMMER_GARDEN_EVENT: EventDefinition = {
  id: 'v1.7.0-event',
  version: 'v1.7.0',
  titleKey: 'eventModeTitle',
  descriptionKey: 'eventModeDesc',
  shareContextLabel: 'Event: Summer Garden',
  modeKind: 'pacman',
  themeKey: 'eventThemeSummerGarden',
  answerSeed: 'v1.7.0-event',
  pacman: {
    actor: '🐇',
    stepMsByStatus: {
      correct: 3000,
      present: 2000,
      absent: 1500,
      default: 1500,
    },
    effect: 'hide-letter',
  },
  collectibles: [
    {
      id: 'clover',
      collectionId: 'v1.7.0-summer-garden-clover',
      emoji: '🍀',
      targetRows: [1, 2, 3, 4],
      collectStatus: 'correct',
      autoCollectRemainingOnWin: true,
    },
  ],
  cosmeticOverrides: {
    shareBadge: [
      'badge_apple',
      'badge_grape',
      'badge_milk',
      'badge_azure',
      'badge_clover',
    ],
    chainColor: 'chaincolor_azure',
  },
  loseReasons: [
    {
      id: 'guess_limit',
      icon: '❌',
      titleKey: 'loseReasonOutOfGuesses',
      infoKey: 'loseReasonGuessLimitInfo',
      colorClass: 'bg-purple-500 text-purple-50',
    },
    {
      id: 'dead_end',
      icon: '🦎',
      titleKey: 'loseReasonDeadEnd',
      infoKey: 'loseReasonDeadEndInfo',
      colorClass: 'bg-purple-500 text-purple-50',
    },
    {
      id: 'pacman',
      icon: '🐇',
      titleKey: 'loseReasonPacman',
      infoKey: 'loseReasonPacmanInfo',
      colorClass: 'bg-purple-500 text-purple-50',
    },
    {
      id: 'unknown',
      icon: '❓',
      titleKey: 'loseReasonUnknown',
      infoKey: 'loseReasonUnknownInfoBody',
      colorClass: 'bg-gray-400 text-gray-50',
      isUnknown: true,
    },
  ],
}

const ACTIVE_EVENT_VERSION = 'v1.7.0'

const KNOWN_EVENTS: EventDefinition[] = [SUMMER_GARDEN_EVENT]

const hashSeed = (seed: string) =>
  seed.split('').reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0
  }, 0)

const createSeededRandom = (seed: number) => {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const getEventWordPermutation = (answerSeed: string): number[] => {
  const cached = eventWordPermutations.get(answerSeed)
  if (cached) return cached

  const random = createSeededRandom(hashSeed(answerSeed))
  const permutation = Array.from({ length: WORDS.length }, (_, index) => index)

  for (let i = permutation.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const current = permutation[i]
    permutation[i] = permutation[j]
    permutation[j] = current
  }

  eventWordPermutations.set(answerSeed, permutation)
  return permutation
}

export const getKnownEvents = (): EventDefinition[] => KNOWN_EVENTS

export const getActiveEvent = (): EventDefinition =>
  getEventByVersion(ACTIVE_EVENT_VERSION) ?? KNOWN_EVENTS[0]

export const getEventByVersion = (version: string): EventDefinition | null =>
  getKnownEvents().find((event) => event.version === version) ?? null

export const getEventWordOfDay = (
  event: EventDefinition = getActiveEvent(),
  date: Temporal.PlainDate = Temporal.Now.plainDateISO()
): EventWordOfDay => {
  const epoch = Temporal.PlainDate.from(CONFIG.startDate)
  const dayIndex = date.since(epoch).days
  const permutation = getEventWordPermutation(event.answerSeed)
  const permutationIndex =
    ((dayIndex % permutation.length) + permutation.length) % permutation.length
  const solutionIndex = permutation[permutationIndex]

  return {
    solution: WORDS[solutionIndex],
    solutionIndex,
  }
}
