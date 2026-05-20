import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InformationCircleIcon } from '@heroicons/react/outline'
import { PlayStatsSummary } from '../../lib/playStats'
import { CharStatus } from '../../lib/statuses'
import { Cell } from '../grid/Cell'

type Props = {
  summary: PlayStatsSummary
}

type TimeUnit = 's' | 'm' | 'h' | 'd'
type ViewMode = 'total' | 'average'
type InfoListItem = {
  text: ReactNode
  children?: InfoListItem[]
}

const EMPTY_VALUE = '-'
const TIME_UNITS: TimeUnit[] = ['s', 'm', 'h', 'd']
const TIME_UNIT_LABELS: Record<TimeUnit, string> = {
  s: 'Seconds',
  m: 'Minutes',
  h: 'Hours',
  d: 'Days',
}
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
const formatCount = (value: number, viewMode: ViewMode) =>
  viewMode === 'total' ? String(Math.round(value)) : value.toFixed(1)

const SettingsLikeGroupTitle = ({
  children,
  action,
  info,
  separated = false,
}: {
  children: ReactNode
  action?: ReactNode
  info?: ReactNode
  separated?: boolean
}) => (
  <div
    className={`flex items-center justify-between gap-2 pb-0.5 text-left text-xs font-bold uppercase tracking-wide text-gray-400 ${
      separated ? 'mt-1.5 border-t border-gray-200 pt-1.5' : ''
    }`}
  >
    <span className="inline-flex min-w-0 items-center gap-1">
      <span>{children}</span>
      {info}
    </span>
    {action}
  </div>
)

const InfoBulletList = ({
  items,
  nested = false,
}: {
  items: InfoListItem[]
  nested?: boolean
}) => (
  <ul
    className={`list-disc space-y-1 text-left ${nested ? 'mt-1 pl-4' : 'pl-4'}`}
  >
    {items.map((item, index) => (
      <li key={index}>
        <span>{item.text}</span>
        {item.children && (
          <InfoBulletList items={item.children} nested={true} />
        )}
      </li>
    ))}
  </ul>
)

const GroupInfoButton = ({
  title,
  intro,
  items,
}: {
  title: string
  intro?: string
  items: InfoListItem[]
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={title}
      >
        <InformationCircleIcon className="h-3.5 w-3.5" />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-5 z-30 w-72 rounded border border-gray-200 bg-white p-3 text-left text-xs font-normal normal-case leading-4 tracking-normal text-gray-600 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="font-semibold text-gray-900">{title}</div>
            <button
              type="button"
              className="shrink-0 font-semibold text-gray-400 hover:text-gray-700"
              onClick={() => setIsOpen(false)}
              aria-label={t('behaviorInfoClose')}
            >
              ×
            </button>
          </div>
          {intro && <p className="mb-2">{intro}</p>}
          <InfoBulletList items={items} />
        </div>
      )}
    </span>
  )
}

const TimeUnitControl = ({
  timeUnit,
  onChange,
}: {
  timeUnit: TimeUnit
  onChange: (unit: TimeUnit) => void
}) => (
  <div className="inline-grid grid-cols-4 overflow-hidden rounded border border-gray-200 text-xs normal-case tracking-normal">
    {TIME_UNITS.map((unit) => (
      <button
        key={unit}
        type="button"
        className={`flex h-6 min-w-[3.25rem] items-center justify-center px-1 py-1 leading-none ${
          timeUnit === unit
            ? 'bg-slate-400 text-white'
            : 'bg-white text-gray-500 hover:bg-gray-50'
        }`}
        onClick={() => onChange(unit)}
      >
        {TIME_UNIT_LABELS[unit]}
      </button>
    ))}
  </div>
)

const ViewModeToggle = ({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}) => {
  const { t } = useTranslation()
  const options: Array<{ mode: ViewMode; label: string }> = [
    { mode: 'total', label: t('behaviorViewTotal') },
    { mode: 'average', label: t('behaviorViewAverage') },
  ]

  return (
    <div className="inline-grid grid-cols-2 overflow-hidden rounded border border-gray-200 text-xs normal-case tracking-normal">
      {options.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          className={`h-6 min-w-[4rem] px-1 py-1 leading-none ${
            viewMode === mode
              ? 'bg-slate-400 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => onChange(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

const MetricValueLabel = ({
  label,
  value,
  labelClassName,
  className = '',
  children,
  relaxed = false,
}: {
  label: ReactNode
  value: string
  labelClassName?: string
  className?: string
  children?: ReactNode
  relaxed?: boolean
}) => (
  <div
    className={`flex ${
      relaxed ? 'h-[3.25rem]' : 'h-11'
    } min-w-0 flex-col items-center justify-center px-0.5 ${className}`}
  >
    <div className="flex h-5 min-w-0 items-center">
      <div className="min-w-0 whitespace-nowrap text-xl font-bold leading-none text-gray-900 sm:text-2xl">
        {value}
      </div>
    </div>
    <div
      className={`${
        relaxed ? 'mt-3' : 'mt-0.5'
      } flex min-h-[1.1rem] items-start justify-center gap-0.5 break-words text-[10px] leading-[0.65rem] ${
        labelClassName ?? 'text-gray-900'
      }`}
    >
      <span className="break-words">{label}</span>
      {children}
    </div>
  </div>
)

const SingleMetric = ({
  label,
  value,
  className = '',
  separated = false,
  alignLabelWithBox = false,
}: {
  label: ReactNode
  value: string
  className?: string
  separated?: boolean
  alignLabelWithBox?: boolean
}) =>
  alignLabelWithBox ? (
    <div
      className={`relative min-w-0 px-0.5 text-center ${
        separated ? 'border-r border-gray-300' : ''
      } ${className}`}
    >
      <div className="rounded border border-transparent px-1.5 py-0.5">
        <MetricValueLabel label="" value={value} />
        <div className="mt-0.5 break-words pb-0.5 text-center text-[10px] leading-3 text-gray-900">
          <span className="break-words">{label}</span>
        </div>
      </div>
    </div>
  ) : (
    <div className={`relative min-w-0 px-0.5 text-center ${className}`}>
      <div className="h-0.5" aria-hidden="true" />
      <MetricValueLabel
        label={label}
        value={value}
        className={separated ? 'border-r border-gray-300' : undefined}
      />
    </div>
  )

const MetricGrid = ({
  items,
  className = '',
  separateFirstItem = false,
  relaxed = false,
}: {
  className?: string
  separateFirstItem?: boolean
  relaxed?: boolean
  items: Array<{
    label: string
    value: string
    labelClassName?: string
  }>
}) => (
  <div
    className={`min-w-0 px-0.5 text-center ${
      relaxed ? 'mt-0.5' : ''
    } ${className}`}
  >
    <div className="grid w-full grid-cols-4">
      {items.map((item, index) => (
        <MetricValueLabel
          key={item.label}
          label={item.label}
          value={item.value}
          labelClassName={item.labelClassName}
          relaxed={relaxed}
          className={
            separateFirstItem && index === 0
              ? 'border-r border-gray-300'
              : undefined
          }
        />
      ))}
    </div>
  </div>
)

const BoxedMetricGrid = ({
  label,
  children,
}: {
  label: ReactNode
  children: ReactNode
}) => (
  <div className="min-w-0 px-0.5 text-center">
    <div className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5">
      {children}
      <div className="mt-0.5 break-words pb-0.5 text-[10px] leading-3">
        {label}
      </div>
    </div>
  </div>
)

const TileSample = ({
  count,
  labelClassName,
  label,
  status,
}: {
  count: string
  labelClassName?: string
  label: string
  status?: CharStatus
}) => (
  <div
    className="flex min-w-0 flex-col items-center justify-center"
    aria-label={label}
  >
    <Cell value={String(count)} status={status} />
    <div
      className={`min-h-[1rem] break-words text-center text-[10px] leading-[0.65rem] ${
        labelClassName ?? 'text-gray-900'
      }`}
    >
      {label}
    </div>
  </div>
)

const TileCountsRow = ({
  summary,
  viewMode,
}: {
  summary: PlayStatsSummary
  viewMode: ViewMode
}) => {
  const { t } = useTranslation()
  const hasTrackedGames = summary.totalGames > 0
  const denominator =
    viewMode === 'average' && hasTrackedGames ? summary.totalGames : 1

  return (
    <div className="px-0.5">
      <div className="grid grid-cols-4 gap-0.5">
        <TileSample
          label={t('behaviorTileCorrect')}
          status="correct"
          labelClassName="text-green-500"
          count={formatCount(
            summary.tileCounts.correct / denominator,
            viewMode
          )}
        />
        <TileSample
          label={t('behaviorTilePresent')}
          status="present"
          labelClassName="text-purple-500"
          count={formatCount(
            summary.tileCounts.present / denominator,
            viewMode
          )}
        />
        <TileSample
          label={t('behaviorTileAbsent')}
          status="absent"
          labelClassName="text-gray-500"
          count={formatCount(summary.tileCounts.absent / denominator, viewMode)}
        />
        <TileSample
          label={t('behaviorTileUnrevealed')}
          labelClassName="text-gray-500"
          count={formatCount(
            summary.tileCounts.unrevealed / denominator,
            viewMode
          )}
        />
      </div>
    </div>
  )
}

export const PlayStatsPanel = ({ summary }: Props) => {
  const { t } = useTranslation()
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('m')
  const [viewMode, setViewMode] = useState<ViewMode>('total')
  const hasTrackedGames = summary.totalGames > 0
  const denominator =
    viewMode === 'average' && hasTrackedGames ? summary.totalGames : 1
  const totalValidEnterPresses = Math.max(
    0,
    summary.totalEnterPresses -
      summary.totalInvalidEnterPresses -
      summary.totalIncompleteEnterPresses
  )
  const formatModeCount = (value: number) =>
    formatCount(value / denominator, viewMode)
  const formatModeTime = (value: number) =>
    hasTrackedGames
      ? formatTotalTime(value / denominator, timeUnit)
      : EMPTY_VALUE

  return (
    <div>
      <SettingsLikeGroupTitle
        info={
          <GroupInfoButton
            title={t('statsDashboard')}
            intro={t('behaviorTrackingInfoIntro')}
            items={[
              { text: t('behaviorTrackingInfoTrackedGames') },
              {
                text: t('behaviorTrackingInfoViewMode'),
                children: [
                  { text: t('behaviorTrackingInfoTotal') },
                  { text: t('behaviorTrackingInfoAverage') },
                  { text: t('behaviorTrackingInfoRatio') },
                ],
              },
            ]}
          />
        }
      >
        {t('statsDashboard')}
      </SettingsLikeGroupTitle>
      <div className="flex justify-center">
        <div className="m-0.5 min-w-0 text-center">
          <div className="flex h-14 items-center justify-center">
            <div className="min-w-0 whitespace-nowrap text-xl font-bold text-gray-900 sm:text-2xl">
              {String(summary.totalGames)}
            </div>
          </div>
          <div className="text-[10px] leading-3">
            {t('behaviorTrackedGames')}
          </div>
        </div>
      </div>

      <SettingsLikeGroupTitle
        separated
        info={
          <GroupInfoButton
            title={t('behaviorTime')}
            intro={t('behaviorTimeInfoIntro')}
            items={[
              {
                text: t('behaviorTimeInfoUnit'),
                children: [
                  { text: t('behaviorTimeInfoUnitS') },
                  { text: t('behaviorTimeInfoUnitM') },
                  { text: t('behaviorTimeInfoUnitH') },
                  { text: t('behaviorTimeInfoUnitD') },
                ],
              },
              { text: t('behaviorTimeInfoDuration') },
              { text: t('behaviorTimeInfoGuess') },
              { text: t('behaviorTimeInfoFirstInput') },
              { text: t('behaviorTimeInfoPause') },
            ]}
          />
        }
      >
        {t('behaviorTime')}
      </SettingsLikeGroupTitle>
      <MetricGrid
        separateFirstItem
        relaxed
        items={[
          {
            label: t('behaviorTotalDuration'),
            value: formatModeTime(summary.totalDurationMs),
          },
          {
            label: t('behaviorGuessShort'),
            value: formatModeTime(summary.totalGuessTimeMs),
            labelClassName: 'text-green-500',
          },
          {
            label: t('playStatsFirstInput'),
            value: formatModeTime(summary.totalFirstInputDelayMs),
            labelClassName: 'text-gray-500',
          },
          {
            label: t('playStatsBreakdownPause'),
            value: formatModeTime(summary.totalLongPauseMs),
            labelClassName: 'text-gray-500',
          },
        ]}
      />

      <div>
        <SettingsLikeGroupTitle
          separated
          info={
            <GroupInfoButton
              title={t('behaviorTiles')}
              intro={t('behaviorTilesInfoIntro')}
              items={[
                { text: t('behaviorTilesInfoCorrect') },
                { text: t('behaviorTilesInfoPresent') },
                { text: t('behaviorTilesInfoAbsent') },
                { text: t('behaviorTilesInfoUnrevealed') },
                { text: t('behaviorTilesInfoDeadEnd') },
              ]}
            />
          }
        >
          {t('behaviorTiles')}
        </SettingsLikeGroupTitle>
        <TileCountsRow summary={summary} viewMode={viewMode} />
      </div>

      <div>
        <SettingsLikeGroupTitle
          separated
          info={
            <GroupInfoButton
              title={t('playStatsBreakdownAction')}
              intro={t('behaviorActionInfoIntro')}
              items={[
                {
                  text: t('behaviorActionInfoEnter'),
                  children: [
                    { text: t('behaviorActionInfoEnterTotal') },
                    { text: t('behaviorActionInfoEnterSubmit') },
                    { text: t('behaviorActionInfoEnterInvalid') },
                    { text: t('behaviorActionInfoEnterIncomplete') },
                  ],
                },
                { text: t('behaviorActionInfoDelete') },
                {
                  text: t('behaviorActionInfoFriction'),
                  children: [
                    { text: t('behaviorActionInfoFrictionFormula') },
                    { text: t('behaviorActionInfoWrongEnter') },
                  ],
                },
              ]}
            />
          }
        >
          {t('playStatsBreakdownAction')}
        </SettingsLikeGroupTitle>
        <div className="grid grid-cols-7 gap-y-2">
          <div className="col-span-4">
            <BoxedMetricGrid label={t('playStatsBreakdownEnter')}>
              <MetricGrid
                separateFirstItem
                items={[
                  {
                    label: t('behaviorTotalShort'),
                    value: formatModeCount(summary.totalEnterPresses),
                  },
                  {
                    label: t('behaviorSubmitShort'),
                    value: formatModeCount(totalValidEnterPresses),
                    labelClassName: 'text-green-500',
                  },
                  {
                    label: t('playStatsInvalidShort'),
                    value: formatModeCount(summary.totalInvalidEnterPresses),
                    labelClassName: 'text-purple-500',
                  },
                  {
                    label: t('playStatsIncompleteShort'),
                    value: formatModeCount(summary.totalIncompleteEnterPresses),
                    labelClassName: 'text-purple-500',
                  },
                ]}
              />
            </BoxedMetricGrid>
          </div>
          <SingleMetric
            label={
              <span className="text-purple-500">
                {t('playStatsBreakdownDelete')}
              </span>
            }
            value={formatModeCount(summary.totalDeletePresses)}
            separated
            alignLabelWithBox
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
            alignLabelWithBox
          />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2 border-t border-gray-200 pt-2">
        <div className="shrink-0">
          <TimeUnitControl timeUnit={timeUnit} onChange={setTimeUnit} />
        </div>
        <div className="shrink-0">
          <ViewModeToggle
            viewMode={viewMode}
            onChange={(mode) => setViewMode(mode)}
          />
        </div>
      </div>
    </div>
  )
}
