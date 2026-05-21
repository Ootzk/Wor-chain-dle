import { useTranslation } from 'react-i18next'
import { GameStats } from '../../lib/localStorage'
import { DailyResults } from '../../lib/dailyResults'
import { EventLoseReasonDefinition } from '../../lib/events'
import { DEFAULT_LOSE_REASONS } from '../../lib/loseReasons'

type Props = {
  gameStats: GameStats
  dailyResults?: DailyResults
  results?: Record<string, { won: boolean; endReason: string }>
  reasonDefinitions?: EventLoseReasonDefinition[]
  onOpenDeadEndHelp?: () => void
}

type LoseReasonItem = {
  icon: string
  title: string
  value: number
  colorClass: string
}

export const LoseReasonDistribution = ({
  gameStats,
  dailyResults,
  results,
  reasonDefinitions,
  onOpenDeadEndHelp,
}: Props) => {
  const { t } = useTranslation()
  const definitions = reasonDefinitions ?? DEFAULT_LOSE_REASONS
  const resultValues = Object.values(results ?? dailyResults ?? {})
  const initialCounts = Object.fromEntries(
    definitions.map((reason) => [reason.id, 0])
  )
  const unknownDefinition =
    definitions.find((reason) => reason.isUnknown) ??
    definitions.find((reason) => reason.id === 'unknown')
  const reasonCounts = resultValues.reduce<Record<string, number>>(
    (counts, result) => {
      if (result.won) return counts
      if (counts[result.endReason] !== undefined) {
        counts[result.endReason] += 1
      } else if (unknownDefinition) {
        counts[unknownDefinition.id] += 1
      } else {
        counts[result.endReason] = (counts[result.endReason] ?? 0) + 1
      }
      return counts
    },
    initialCounts
  )
  const trackedLosses = Object.values(reasonCounts).reduce(
    (sum, value) => sum + value,
    0
  )
  const legacyUntrackedLosses = Math.max(
    0,
    gameStats.gamesFailed - trackedLosses
  )
  if (unknownDefinition) {
    reasonCounts[unknownDefinition.id] += legacyUntrackedLosses
  }

  const distribution: LoseReasonItem[] = definitions.map((reason) => ({
    icon: reason.icon,
    title: t(reason.titleKey),
    value: reasonCounts[reason.id] ?? 0,
    colorClass: reason.colorClass,
  }))
  const maxValue = Math.max(...distribution.map((item) => item.value), 1)

  return (
    <div className="relative my-1 text-sm">
      {distribution.map((item) => (
        <div key={item.title} className="my-0.5 flex h-4 items-center">
          <div className="flex w-6 shrink-0 items-center justify-start text-xs text-gray-900">
            {item.title === t('loseReasonDeadEnd') && onOpenDeadEndHelp ? (
              <button
                type="button"
                className="text-base leading-4 hover:scale-110 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                onClick={onOpenDeadEndHelp}
                aria-label={item.title}
                title={item.title}
              >
                {item.icon}
              </button>
            ) : (
              <span className="text-base leading-4" title={item.title}>
                {item.icon}
              </span>
            )}
          </div>
          <div className="ml-1 w-full rounded-full">
            <div
              style={{ width: `${5 + 90 * (item.value / maxValue)}%` }}
              className={`${item.colorClass} rounded-l-full px-1 py-0 text-center text-xs font-medium leading-4`}
            >
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
