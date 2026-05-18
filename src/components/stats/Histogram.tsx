import { GameStats } from '../../lib/localStorage'
import { useTranslation } from 'react-i18next'

type Props = {
  gameStats: GameStats
}

export const Histogram = ({ gameStats }: Props) => {
  const { t } = useTranslation()
  const distribution = gameStats.winDistribution.map((value, index) => ({
    label: String(index + 1),
    value,
    variant: 'success' as const,
  }))
  const maxValue = Math.max(...distribution.map((item) => item.value), 1)

  return (
    <div className="relative my-1 text-sm">
      <div className="pointer-events-none absolute left-0 top-1/2 w-16 -translate-y-1/2 text-xs text-gray-900">
        {t('playStatsBreakdownGuess')}
      </div>
      {distribution.map((item) => (
        <div key={item.label} className="my-px flex h-4 items-center">
          <div className="w-16 shrink-0 text-right">{item.label}</div>
          <div className="ml-2 w-full rounded-full">
            <div
              style={{ width: `${5 + 90 * (item.value / maxValue)}%` }}
              className="rounded-l-full bg-green-500 px-1 py-0 text-center text-xs font-medium leading-4 text-green-50"
            >
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
