import { InformationCircleIcon } from '@heroicons/react/outline'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GameStats } from '../../lib/localStorage'

type Props = {
  gameStats: GameStats
  onOpenDeadEndHelp?: () => void
}

type LoseReasonItem = {
  label: string
  value: number
  colorClass: string
}

export const LoseReasonDistribution = ({
  gameStats,
  onOpenDeadEndHelp,
}: Props) => {
  const { t } = useTranslation()
  const [isUnknownInfoOpen, setIsUnknownInfoOpen] = useState(false)
  const losses = gameStats.gamesFailed

  const distribution: LoseReasonItem[] = [
    {
      label: t('loseReasonOutOfGuesses'),
      value: 0,
      colorClass: 'bg-purple-500 text-purple-50',
    },
    {
      label: t('loseReasonDeadEnd'),
      value: 0,
      colorClass: 'bg-purple-500 text-purple-50',
    },
    {
      label: t('loseReasonUnknown'),
      value: losses,
      colorClass: 'bg-gray-400 text-gray-50',
    },
  ]
  const maxValue = Math.max(...distribution.map((item) => item.value), 1)

  return (
    <div className="relative my-1 text-sm">
      {isUnknownInfoOpen && (
        <div className="absolute left-2 right-2 bottom-6 z-20 rounded border border-gray-200 bg-white p-3 text-left text-xs text-gray-600 shadow-lg">
          <div className="mb-1 flex items-center justify-between">
            <div className="font-semibold text-gray-900">
              {t('loseReasonUnknownInfoTitle')}
            </div>
            <button
              type="button"
              className="font-semibold text-gray-400 hover:text-gray-700"
              onClick={() => setIsUnknownInfoOpen(false)}
              aria-label={t('loseReasonUnknownInfoClose')}
            >
              ×
            </button>
          </div>
          <p>{t('loseReasonUnknownInfoBody')}</p>
        </div>
      )}
      {distribution.map((item) => (
        <div key={item.label} className="my-0.5 flex items-center">
          <div className="flex w-16 shrink-0 items-center gap-0.5 text-xs text-gray-900">
            {item.label === t('loseReasonDeadEnd') && onOpenDeadEndHelp ? (
              <button
                type="button"
                className="text-left font-medium text-indigo-600 underline hover:text-indigo-700"
                onClick={onOpenDeadEndHelp}
              >
                {item.label}
              </button>
            ) : (
              <span
                className={
                  item.label === t('loseReasonOutOfGuesses')
                    ? 'text-[0.625rem] leading-3'
                    : ''
                }
              >
                {item.label}
              </span>
            )}
            {item.label === t('loseReasonUnknown') && (
              <button
                type="button"
                className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                onClick={() => setIsUnknownInfoOpen(!isUnknownInfoOpen)}
                aria-label={t('loseReasonUnknownInfoTitle')}
              >
                <InformationCircleIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="ml-2 w-full rounded-full">
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
