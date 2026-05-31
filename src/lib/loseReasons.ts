import { EventLoseReasonDefinition } from './events'

export const DEFAULT_LOSE_REASONS: EventLoseReasonDefinition[] = [
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
]

export const getLoseReasonIcon = (
  endReason?: string,
  reasonDefinitions: EventLoseReasonDefinition[] = DEFAULT_LOSE_REASONS
): string => {
  const reason =
    reasonDefinitions.find((definition) => definition.id === endReason) ??
    reasonDefinitions.find((definition) => definition.isUnknown) ??
    reasonDefinitions.find((definition) => definition.id === 'unknown') ??
    DEFAULT_LOSE_REASONS.find((definition) => definition.id === 'unknown')

  return reason?.icon ?? '❓'
}
