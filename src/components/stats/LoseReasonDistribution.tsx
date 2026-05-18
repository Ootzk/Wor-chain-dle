import { useTranslation } from 'react-i18next'
import { GameStats } from '../../lib/localStorage'

type Props = {
  gameStats: GameStats
}

type LoseReasonItem = {
  label: string
  value: number
  colorClass: string
}

export const LoseReasonDistribution = ({ gameStats }: Props) => {
  const { t } = useTranslation()
  const losses = gameStats.gamesFailed

  if (losses <= 0) return null

  const distribution: LoseReasonItem[] = [
    {
      label: t('loseReasonUnknown'),
      value: losses,
      colorClass: 'bg-gray-400 text-gray-50',
    },
  ]
  const maxValue = Math.max(...distribution.map((item) => item.value), 1)

  return (
    <div className="m-2 text-sm">
      {distribution.map((item) => (
        <div key={item.label} className="m-1 flex items-center">
          <div className="w-20 shrink-0 text-xs text-gray-500">
            {item.label}
          </div>
          <div className="ml-2 w-full rounded-full">
            <div
              style={{ width: `${5 + 90 * (item.value / maxValue)}%` }}
              className={`${item.colorClass} rounded-l-full p-0.5 text-center text-xs font-medium`}
            >
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
