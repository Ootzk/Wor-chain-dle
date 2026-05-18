import { useTranslation } from 'react-i18next'
import { GameStats } from '../../lib/localStorage'

type Props = {
  gameStats: GameStats
}

const formatPercent = (value: number, total: number) =>
  total > 0 ? Math.round((100 * value) / total) : 0

export const WinLossBar = ({ gameStats }: Props) => {
  const { t } = useTranslation()
  const wins = gameStats.totalGames - gameStats.gamesFailed
  const losses = gameStats.gamesFailed
  const winPercent = formatPercent(wins, gameStats.totalGames)
  const lossPercent = 100 - winPercent

  return (
    <div className="my-1 text-sm">
      <div className="flex h-7 overflow-hidden rounded-full bg-gray-100">
        {gameStats.totalGames <= 0 ? (
          <div className="h-full w-full rounded-full bg-gray-200" />
        ) : (
          <>
            {wins > 0 && (
              <div
                className={`flex items-center justify-center bg-green-500 px-2 text-xs font-semibold text-green-50 ${
                  losses > 0 ? 'rounded-l-full' : 'rounded-full'
                }`}
                style={{ flexBasis: `${winPercent}%` }}
                title={`${t('playStatsResultWin')}: ${wins} (${winPercent}%)`}
              >
                {winPercent >= 18 ? `${winPercent}%` : ''}
              </div>
            )}
            {losses > 0 && (
              <div
                className={`flex items-center justify-center bg-purple-500 px-2 text-xs font-semibold text-purple-50 ${
                  wins > 0 ? 'rounded-r-full' : 'rounded-full'
                }`}
                style={{ flexBasis: `${lossPercent}%` }}
                title={`${t('playStatsResultLose')}: ${losses} (${lossPercent}%)`}
              >
                {lossPercent >= 18 ? `${lossPercent}%` : ''}
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] leading-3">
        <span className="font-medium text-green-600">
          {t('playStatsResultWin')} {wins}
        </span>
        <span className="font-medium text-gray-500">
          {t('statsTotal')} {gameStats.totalGames}
        </span>
        <span className="font-medium text-purple-600">
          {t('playStatsResultLose')} {losses}
        </span>
      </div>
    </div>
  )
}
