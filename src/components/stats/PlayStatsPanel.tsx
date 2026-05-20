import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InformationCircleIcon } from '@heroicons/react/outline'
import { PlayStatsSummary } from '../../lib/playStats'

type Props = {
  summary: PlayStatsSummary
}

const EMPTY_VALUE = '-'
const formatSeconds = (ms: number) => String(Math.round(ms / 1000))
const formatAverageCount = (value: number) => value.toFixed(1)

type TimeUnit = 's' | 'm' | 'h' | 'd'

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

const Metric = ({
  label,
  value,
  description,
  infoTitle,
  infoFormula,
  infoBody,
  compact = false,
}: {
  label: string
  value: string
  description?: string
  infoTitle?: string
  infoFormula?: string
  infoBody?: string
  compact?: boolean
}) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const { t } = useTranslation()
  const hasInfo = !!infoTitle && !!infoFormula && !!infoBody

  return (
    <div
      className={`${
        compact ? 'mx-1 my-0' : 'm-1'
      } relative min-w-0 text-center`}
    >
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
      <div
        className={`flex items-center justify-center ${
          compact ? 'h-12' : 'h-14'
        }`}
      >
        <div className="min-w-0 whitespace-nowrap text-xl font-bold text-gray-900 sm:text-2xl">
          {value}
        </div>
      </div>
      <div className="flex items-center justify-center gap-0.5 truncate text-[10px] leading-3">
        <span className="truncate">{label}</span>
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
      </div>
      {description && (
        <div className="mt-0.5 truncate text-[9px] leading-3 text-gray-500">
          {description}
        </div>
      )}
    </div>
  )
}

const MetricRow = ({
  children,
  columns = 3,
}: {
  children: ReactNode
  columns?: 3 | 5
}) => (
  <div
    className={`grid gap-y-2 ${columns === 5 ? 'grid-cols-5' : 'grid-cols-3'}`}
  >
    {children}
  </div>
)

const Section = ({
  title,
  description,
  compact = false,
  action,
  children,
}: {
  title: string
  description?: string
  compact?: boolean
  action?: ReactNode
  children: ReactNode
}) => (
  <section
    className={`border-t border-gray-200 first:mt-0 first:border-t-0 first:pt-0 ${
      compact ? 'mt-1.5 pt-1.5' : 'mt-2 pt-2'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <h4 className="text-base font-normal leading-6 text-gray-900">{title}</h4>
      {action}
    </div>
    {description && (
      <p className="text-left text-xs text-gray-500">{description}</p>
    )}
    <div className={compact ? 'mt-0.5' : 'mt-1'}>{children}</div>
  </section>
)

export const PlayStatsPanel = ({ summary }: Props) => {
  const { t } = useTranslation()
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('m')
  const hasTrackedGames = summary.totalGames > 0
  const averageDeletePresses = hasTrackedGames
    ? summary.totalDeletePresses / summary.totalGames
    : 0
  const totalValidEnterPresses = Math.max(
    0,
    summary.totalEnterPresses -
      summary.totalInvalidEnterPresses -
      summary.totalIncompleteEnterPresses
  )
  const wrongEnterPresses =
    summary.totalInvalidEnterPresses + summary.totalIncompleteEnterPresses
  const frictionPerSubmit =
    totalValidEnterPresses > 0
      ? (summary.totalDeletePresses + wrongEnterPresses) /
        totalValidEnterPresses
      : 0

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
                    ? 'bg-gray-900 text-white'
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
        <MetricRow columns={5}>
          <Metric
            label={t('behaviorTrackedGames')}
            value={String(summary.totalGames)}
          />
          <Metric
            label={t('behaviorTotalDuration')}
            value={
              hasTrackedGames
                ? formatTotalTime(summary.totalDurationMs, timeUnit)
                : EMPTY_VALUE
            }
          />
          <Metric
            label={t('behaviorTotalGuessTime')}
            value={
              hasTrackedGames
                ? formatTotalTime(summary.totalGuessTimeMs, timeUnit)
                : EMPTY_VALUE
            }
          />
          <Metric
            label={t('playStatsBreakdownEnter')}
            value={String(summary.totalEnterPresses)}
          />
          <Metric
            label={t('playStatsBreakdownDelete')}
            value={String(summary.totalDeletePresses)}
          />
        </MetricRow>
      </Section>
      <Section
        title={t('behaviorPace')}
        description={t('behaviorPerGameAverage')}
        compact
      >
        <MetricRow>
          <Metric
            label={t('playStatsDurationSeconds')}
            value={
              hasTrackedGames
                ? formatSeconds(summary.averageDurationMs)
                : EMPTY_VALUE
            }
            compact
          />
          <Metric
            label={t('playStatsFirstInput')}
            value={
              hasTrackedGames
                ? formatSeconds(summary.averageFirstInputDelayMs)
                : EMPTY_VALUE
            }
            compact
          />
          <Metric
            label={t('behaviorGuessTimeSeconds')}
            value={
              hasTrackedGames
                ? formatSeconds(summary.averageGuessTimeMs)
                : EMPTY_VALUE
            }
            compact
          />
        </MetricRow>
      </Section>
      <Section
        title={t('playStatsBreakdownAction')}
        description={t('behaviorPerGameAverage')}
        compact
      >
        <MetricRow>
          <Metric
            label={t('playStatsBreakdownEnter')}
            value={
              hasTrackedGames
                ? formatAverageCount(summary.averageEnterPresses)
                : EMPTY_VALUE
            }
            compact
          />
          <Metric
            label={t('playStatsDeletePresses')}
            value={
              hasTrackedGames
                ? formatAverageCount(averageDeletePresses)
                : EMPTY_VALUE
            }
            compact
          />
          <Metric
            label={t('behaviorFrictionPerSubmit')}
            value={
              hasTrackedGames
                ? formatAverageCount(frictionPerSubmit)
                : EMPTY_VALUE
            }
            infoTitle={t('behaviorFrictionPerSubmit')}
            infoFormula={t('behaviorFrictionPerSubmitFormula')}
            infoBody={t('behaviorFrictionPerSubmitInfoBody')}
            compact
          />
        </MetricRow>
      </Section>
    </div>
  )
}
