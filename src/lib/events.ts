import { Temporal } from 'temporal-polyfill'
import { CONFIG } from '../constants/config'
import { WORDS } from '../constants/wordlist'

export type EventModeKind = 'standard' | 'hardcore' | 'ai'

export type EventDefinition = {
  id: string
  titleKey: string
  descriptionKey: string
  modeKind: EventModeKind
  themeKey: string
  answerSeed: string
}

export type EventWordOfDay = {
  solution: string
  solutionIndex: number
}

const ACTIVE_EVENT: EventDefinition = {
  id: 'v1.7.0-event',
  titleKey: 'eventModeTitle',
  descriptionKey: 'eventModeDesc',
  modeKind: 'standard',
  themeKey: 'eventThemeSummerGarden',
  answerSeed: 'v1.7.0-event',
}

const hashSeed = (seed: string) =>
  seed.split('').reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0
  }, 0)

export const getActiveEvent = (): EventDefinition => ACTIVE_EVENT

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
