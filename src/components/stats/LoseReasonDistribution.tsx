import { useTranslation } from 'react-i18next'
import { GameStats } from '../../lib/localStorage'

type Props = {
  gameStats: GameStats
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
  onOpenDeadEndHelp,
}: Props) => {
  const { t } = useTranslation()
  const losses = gameStats.gamesFailed

  const distribution: LoseReasonItem[] = [
    {
      icon: '❌',
      title: t('loseReasonOutOfGuesses'),
      value: 0,
      colorClass: 'bg-purple-500 text-purple-50',
    },
    {
      icon: '🦎',
      title: t('loseReasonDeadEnd'),
      value: 0,
      colorClass: 'bg-purple-500 text-purple-50',
    },
    {
      icon: '❓',
      title: t('loseReasonUnknown'),
      value: losses,
      colorClass: 'bg-gray-400 text-gray-50',
    },
  ]
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
