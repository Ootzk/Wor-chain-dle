import { useTranslation } from 'react-i18next'
import { PlayStatsSummary } from '../../lib/playStats'

type Props = {
  summary: PlayStatsSummary
}

const EMPTY_VALUE = '-'
const formatSeconds = (ms: number) => String(Math.round(ms / 1000))
const formatAverageCount = (value: number) => value.toFixed(1)

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded bg-gray-50 px-2 py-1.5">
    <div className="text-[0.65rem] leading-4 text-gray-500">{label}</div>
    <div className="text-sm font-semibold text-gray-900">{value}</div>
  </div>
)

export const PlayStatsPanel = ({ summary }: Props) => {
  const { t } = useTranslation()
  const hasTrackedGames = summary.totalGames > 0
  const averageDeletePresses = hasTrackedGames
    ? summary.totalDeletePresses / summary.totalGames
    : 0

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">{t('behaviorStatsNote')}</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Metric
          label={t('behaviorTrackedGames')}
          value={String(summary.totalGames)}
        />
        <Metric
          label={t('behaviorGuessTimeSeconds')}
          value={
            hasTrackedGames
              ? formatSeconds(summary.averageGuessTimeMs)
              : EMPTY_VALUE
          }
        />
        <Metric
          label={t('playStatsAverageEnterPresses')}
          value={
            hasTrackedGames
              ? formatAverageCount(summary.averageEnterPresses)
              : EMPTY_VALUE
          }
        />
        <Metric
          label={t('playStatsDeletePresses')}
          value={
            hasTrackedGames
              ? formatAverageCount(averageDeletePresses)
              : EMPTY_VALUE
          }
        />
      </div>
    </div>
  )
}
