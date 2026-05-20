import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InformationCircleIcon } from '@heroicons/react/outline'
import { PlayStatsSummary } from '../../lib/playStats'

type Props = {
  summary: PlayStatsSummary
}

type TimeUnit = 's' | 'm' | 'h' | 'd'

const EMPTY_VALUE = '-'
const TIME_UNITS: TimeUnit[] = ['s', 'm', 'h', 'd']
const TIME_UNIT_DIVISOR: Record<TimeUnit, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
}

const formatTotalTime = (ms: number, unit: TimeUnit) => {
  const value = ms / TIME_UNIT_DIVISOR[unit]
  if (unit === 's') return String(Math.round(value))
  if (value >= 100) return String(Math.round(value))
  if (value >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

const formatAverageCount = (value: number) => value.toFixed(1)

const MetricValueLabel = ({
  label,
  value,
  labelClassName,
  className = '',
  children,
}: {
  label: ReactNode
  value: string
  labelClassName?: string
  className?: string
  children?: ReactNode
}) => (
  <div
    className={`flex h-12 min-w-0 flex-col items-center justify-center px-0.5 ${className}`}
  >
    <div className="flex h-7 min-w-0 items-center">
      <div className="min-w-0 whitespace-nowrap text-xl font-bold leading-none text-gray-900 sm:text-2xl">
        {value}
      </div>
    </div>
    <div
      className={`flex min-h-[1.25rem] items-start justify-center gap-0.5 break-words text-[10px] leading-[0.7rem] ${
        labelClassName ?? 'text-gray-900'
      }`}
    >
      <span className="break-words">{label}</span>
      {children}
    </div>
  </div>
)

const Section = ({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) => (
  <section className="border-t border-gray-200 pt-2 first:border-t-0 first:pt-0">
    <div className="flex items-center justify-between gap-2">
      <h4 className="text-base font-normal leading-6 text-gray-900">{title}</h4>
      {action}
    </div>
    <div className="mt-1 space-y-2">{children}</div>
  </section>
)

const SingleMetric = ({
  label,
  value,
  className = '',
  infoTitle,
  infoFormula,
  infoBody,
}: {
  label: ReactNode
  value: string
  className?: string
  infoTitle?: string
  infoFormula?: string
  infoBody?: string
}) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const { t } = useTranslation()
  const hasInfo = !!infoTitle && !!infoFormula && !!infoBody

  return (
    <div className={`relative min-w-0 px-0.5 text-center ${className}`}>
      {hasInfo && isInfoOpen && (
        <div className="absolute bottom-5 left-1/2 z-20 w-44 -translate-x-1/2 rounded border border-gray-200 bg-white p-2 text-left text-xs text-gray-600 shadow-lg">
          <div className="mb-1 flex items-center justify-between">
            <div className="font-semibold text-gray-900">{infoTitle}</div>
            <button
              type="button"
              className="font-semibold text-gray-400 hover:text-gray-700"
              onClick={() => setIsInfoOpen(false)}
              aria-label={t('behaviorFrictionInfoClose')}
            >
              ×
            </button>
          </div>
          <div className="mb-1 rounded bg-gray-50 px-1.5 py-1 font-mono text-[0.65rem] text-gray-900">
            {infoFormula}
          </div>
          <p>{infoBody}</p>
        </div>
      )}
      <div className="h-2" aria-hidden="true" />
      <MetricValueLabel label={label} value={value}>
        {hasInfo && (
          <button
            type="button"
            className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
            onClick={() => setIsInfoOpen(!isInfoOpen)}
            aria-label={infoTitle}
          >
            <InformationCircleIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </MetricValueLabel>
    </div>
  )
}

const GroupMetric = ({
  label,
  items,
  className = '',
}: {
  label: string
  className?: string
  items: Array<{
    label: string
    value: string
    labelClassName?: string
  }>
}) => (
  <div className={`min-w-0 px-0.5 text-center ${className}`}>
    <div className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5">
      <div className="h-1" aria-hidden="true" />
      <div className="grid w-full grid-cols-4">
        {items.map((item, index) => (
          <MetricValueLabel
            key={item.label}
            label={item.label}
            value={item.value}
            labelClassName={item.labelClassName}
            className={index === 0 ? 'border-r border-gray-300' : undefined}
          />
        ))}
      </div>
      <div className="-mt-1 break-words pb-0.5 text-[10px] leading-3">
        {label}
      </div>
    </div>
  </div>
)

export const PlayStatsPanel = ({ summary }: Props) => {
  const { t } = useTranslation()
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('m')
  const hasTrackedGames = summary.totalGames > 0
  const totalValidEnterPresses = Math.max(
    0,
    summary.totalEnterPresses -
      summary.totalInvalidEnterPresses -
      summary.totalIncompleteEnterPresses
  )

  return (
    <div className="space-y-2">
      <p className="text-left text-xs text-gray-500">
        {t('behaviorStatsNote')}
      </p>
      <Section
        title={t('behaviorTotalPlay')}
        action={
          <div className="inline-flex rounded border border-gray-200 text-xs">
            {TIME_UNITS.map((unit) => (
              <button
                key={unit}
                type="button"
                className={`flex h-6 w-6 items-center justify-center leading-none ${
                  timeUnit === unit
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => setTimeUnit(unit)}
              >
                {unit}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-5 gap-y-2">
          <SingleMetric
            label={t('behaviorTrackedGames')}
            value={String(summary.totalGames)}
          />
          <GroupMetric
            className="col-span-4"
            label={t('behaviorTime')}
            items={[
              {
                label: t('behaviorTotalShort'),
                value: hasTrackedGames
                  ? formatTotalTime(summary.totalDurationMs, timeUnit)
                  : EMPTY_VALUE,
              },
              {
                label: t('behaviorGuessShort'),
                value: hasTrackedGames
                  ? formatTotalTime(summary.totalGuessTimeMs, timeUnit)
                  : EMPTY_VALUE,
                labelClassName: 'text-green-500',
              },
              {
                label: t('playStatsFirstInput'),
                value: hasTrackedGames
                  ? formatTotalTime(summary.totalFirstInputDelayMs, timeUnit)
                  : EMPTY_VALUE,
                labelClassName: 'text-gray-500',
              },
              {
                label: t('playStatsBreakdownPause'),
                value: hasTrackedGames
                  ? formatTotalTime(summary.totalLongPauseMs, timeUnit)
                  : EMPTY_VALUE,
                labelClassName: 'text-gray-500',
              },
            ]}
          />
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          <GroupMetric
            className="col-span-4"
            label={t('playStatsBreakdownEnter')}
            items={[
              {
                label: t('behaviorTotalShort'),
                value: String(summary.totalEnterPresses),
              },
              {
                label: t('behaviorSubmitShort'),
                value: String(totalValidEnterPresses),
                labelClassName: 'text-green-500',
              },
              {
                label: t('playStatsInvalidShort'),
                value: String(summary.totalInvalidEnterPresses),
                labelClassName: 'text-purple-500',
              },
              {
                label: t('playStatsIncompleteShort'),
                value: String(summary.totalIncompleteEnterPresses),
                labelClassName: 'text-gray-500',
              },
            ]}
          />
          <SingleMetric
            label={
              <span className="text-purple-500">
                {t('playStatsBreakdownDelete')}
              </span>
            }
            value={String(summary.totalDeletePresses)}
          />
          <SingleMetric
            className="col-span-2"
            label={
              <>
                <span className="text-purple-500">Friction</span>
                <span>/</span>
                <span className="text-green-500">Submit</span>
              </>
            }
            value={
              hasTrackedGames
                ? formatAverageCount(summary.averageFrictionPerSubmit)
                : EMPTY_VALUE
            }
            infoTitle={t('behaviorFrictionPerSubmit')}
            infoFormula={t('behaviorFrictionPerSubmitFormula')}
            infoBody={t('behaviorFrictionPerSubmitInfoBody')}
          />
        </div>
      </Section>
    </div>
  )
}
