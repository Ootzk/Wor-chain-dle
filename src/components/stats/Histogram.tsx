import { GameStats } from '../../lib/localStorage'
import { Progress } from './Progress'

type Props = {
  gameStats: GameStats
}

export const Histogram = ({ gameStats }: Props) => {
  const distribution = gameStats.winDistribution.map((value, index) => ({
    label: String(index + 1),
    value,
    variant: 'success' as const,
  }))
  const maxValue = Math.max(...distribution.map((item) => item.value), 1)

  return (
    <div className="columns-1 justify-left m-2 text-sm">
      {distribution.map((item) => (
        <Progress
          key={item.label}
          label={item.label}
          size={90 * (item.value / maxValue)}
          value={String(item.value)}
          variant={item.variant}
        />
      ))}
    </div>
  )
}
