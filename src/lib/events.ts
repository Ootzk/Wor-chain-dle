import { Temporal } from 'temporal-polyfill'
import { CONFIG } from '../constants/config'
import { WORDS } from '../constants/wordlist'

export type EventModeKind = 'standard' | 'hardcore' | 'ai'

export type EventDefinition = {
  id: string
  version: string
  titleKey: string
  descriptionKey: string
  modeKind: EventModeKind
  themeKey: string
  answerSeed: string
  loseReasons: EventLoseReasonDefinition[]
}

export type EventLoseReasonDefinition = {
  id: string
  icon: string
  titleKey: string
  infoKey: string
  colorClass: string
  isUnknown?: boolean
}

export type EventWordOfDay = {
  solution: string
  solutionIndex: number
}

const ACTIVE_EVENT: EventDefinition = {
  id: 'v1.7.0-event',
  version: 'v1.7.0',
  titleKey: 'eventModeTitle',
  descriptionKey: 'eventModeDesc',
  modeKind: 'standard',
  themeKey: 'eventThemeSummerGarden',
  answerSeed: 'v1.7.0-event',
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
      id: 'unknown',
      icon: '❓',
      titleKey: 'loseReasonUnknown',
      infoKey: 'loseReasonUnknownInfoBody',
      colorClass: 'bg-gray-400 text-gray-50',
      isUnknown: true,
    },
  ],
}

const hashSeed = (seed: string) =>
  seed.split('').reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0
  }, 0)

export const getActiveEvent = (): EventDefinition => ACTIVE_EVENT

export const getKnownEvents = (): EventDefinition[] => [ACTIVE_EVENT]

export const getEventByVersion = (version: string): EventDefinition | null =>
  getKnownEvents().find((event) => event.version === version) ?? null

export const getEventWordOfDay = (
  event: EventDefinition = ACTIVE_EVENT,
  date: Temporal.PlainDate = Temporal.Now.plainDateISO()
): EventWordOfDay => {
  const epoch = Temporal.PlainDate.from(CONFIG.startDate)
  const dayIndex = date.since(epoch).days
  const seedOffset = hashSeed(event.answerSeed)
  const solutionIndex = (dayIndex + seedOffset) % WORDS.length

  return {
    solution: WORDS[solutionIndex],
    solutionIndex,
  }
}
