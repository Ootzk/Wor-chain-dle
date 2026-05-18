import { useTranslation } from 'react-i18next'
import {
  PlayStats,
  PlayStatsSummary,
  getAverageGuessTimeMs,
  getFirstInputDelayMs,
  getPlayDurationMs,
  getSubmitAccuracy,
} from '../../lib/playStats'

type Props = {
  current?: PlayStats | null
  summary: PlayStatsSummary
}

const formatSeconds = (ms: number) => `${Math.round(ms / 1000)}s`

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded bg-gray-50 px-2 py-1.5">
    <div className="text-[0.65rem] leading-4 text-gray-500">{label}</div>
    <div className="text-sm font-semibold text-gray-900">{value}</div>
  </div>
)

export const PlayStatsPanel = ({ current, summary }: Props) => {
  const { t } = useTranslation()
  const showCurrent = current?.completedAt
  const showSummary = summary.totalGames > 0

  if (!showCurrent && !showSummary) return null

  return (
    <div className="mt-3 space-y-2">
      <h4 className="text-sm font-semibold text-gray-900">
        {t('playStatsTitle')}
      </h4>
      {showCurrent && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">
            {t('playStatsThisGame')}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <Metric
              label={t('playStatsDuration')}
              value={formatSeconds(getPlayDurationMs(current))}
            />
            <Metric
              label={t('playStatsEnterPresses')}
              value={String(current.totalEnterPresses)}
            />
            <Metric
              label={t('playStatsSubmitAccuracy')}
              value={`${getSubmitAccuracy(current)}%`}
            />
            <Metric
              label={t('playStatsFirstInput')}
              value={formatSeconds(getFirstInputDelayMs(current))}
            />
            <Metric
              label={t('playStatsAverageGuess')}
              value={formatSeconds(getAverageGuessTimeMs(current))}
            />
            <Metric
              label={t('playStatsLongestPause')}
              value={formatSeconds(current.longestPauseMs)}
            />
          </div>
        </div>
      )}
      {showSummary && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">
            {t('playStatsAllGames')}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <Metric
              label={t('playStatsAverageDuration')}
              value={formatSeconds(summary.averageDurationMs)}
            />
            <Metric
              label={t('playStatsAverageEnterPresses')}
              value={String(summary.averageEnterPresses)}
            />
            <Metric
              label={t('playStatsAverageAccuracy')}
              value={`${summary.averageSubmitAccuracy}%`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
