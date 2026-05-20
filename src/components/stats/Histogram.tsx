import { GameStats } from '../../lib/localStorage'

type Props = {
  gameStats: GameStats
}

export const Histogram = ({ gameStats }: Props) => {
  const distribution = gameStats.winDistribution.map((value, index) => ({
    label: `${index + 1}\uFE0F\u20E3`,
    value,
    variant: 'success' as const,
  }))
  const maxValue = Math.max(...distribution.map((item) => item.value), 1)

  return (
    <div className="relative my-1 text-sm">
      {distribution.map((item) => (
        <div key={item.label} className="my-0.5 flex h-4 items-center">
          <div className="w-6 shrink-0 text-left">{item.label}</div>
          <div className="ml-1 w-full rounded-full">
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
