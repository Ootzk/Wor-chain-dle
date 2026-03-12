import { useState, useEffect } from 'react'
import Countdown from 'react-countdown'
import { StatBar } from '../stats/StatBar'
import { Histogram } from '../stats/Histogram'
import { Calendar } from '../calendar/Calendar'
import { GameStats } from '../../lib/localStorage'
import { shareStatus, shareCustomStatus } from '../../lib/share'
import { encodeCustomPuzzle } from '../../lib/customPuzzle'
import { tomorrow } from '../../lib/words'
import { BaseModal } from './BaseModal'
import { ChartBarIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'

export type GameMode = 'daily' | 'practice' | 'custom'

type Props = {
  isOpen: boolean
  handleClose: () => void
  guesses: string[][]
  gameStats: GameStats
  isGameLost: boolean
  isGameWon: boolean
  handleShare: () => void
  handleCalendarShare: () => void
  mode: GameMode
  solution: string
  questioner?: string
  excludeUrl: boolean
  weekStartsOnMonday: boolean
}

export const StatsModal = ({
  isOpen,
  handleClose,
  guesses,
  gameStats,
  isGameLost,
  isGameWon,
  handleShare,
  handleCalendarShare,
  mode,
  solution,
  questioner,
  excludeUrl,
  weekStartsOnMonday,
}: Props) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'stats' | 'calendar'>('stats')

  useEffect(() => {
    if (isOpen) setActiveTab('stats')
  }, [isOpen])

  if (mode === 'practice') {
    return (
      <BaseModal
        title={t('records')}
        icon={<ChartBarIcon />}
        isOpen={isOpen}
        handleClose={handleClose}
      >
        {(isGameLost || isGameWon) && (
          <div className="mt-5 sm:mt-6 flex justify-center">
            <button
              type="button"
              className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => window.location.reload()}
            >
              {t('playAgain')}
            </button>
          </div>
        )}
      </BaseModal>
    )
  }

  if (mode === 'custom') {
    const copyGameUrl = () => {
      const code = encodeCustomPuzzle(solution, questioner!)
      const url = `${window.location.origin}${window.location.pathname}#/custom/${code}`
      navigator.clipboard.writeText(url)
      handleShare()
    }

    return (
      <BaseModal
        title={t('records')}
        icon={<ChartBarIcon />}
        isOpen={isOpen}
        handleClose={handleClose}
      >
        {questioner && (
          <p className="text-sm text-gray-500 text-center mb-4">
            {t('customPuzzleBy', { name: questioner })}
          </p>
        )}
        {(isGameLost || isGameWon) && (
          <div className="mt-5 sm:mt-6 space-y-2">
            <button
              type="button"
              className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => {
                shareCustomStatus(
                  guesses,
                  isGameLost,
                  solution,
                  questioner!,
                  excludeUrl
                )
                handleShare()
              }}
            >
              {t('shareResult')}
            </button>
            <button
              type="button"
              className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
              onClick={copyGameUrl}
            >
              {t('shareGameUrl')}
            </button>
          </div>
        )}
      </BaseModal>
    )
  }

  // Daily mode — tabbed UI (Statistics + Calendar)
  const tabs = [
    { id: 'stats' as const, label: t('statistics') },
    { id: 'calendar' as const, label: t('calendar') },
  ]

  return (
    <BaseModal
      title={t('records')}
      icon={<ChartBarIcon />}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="h-[26rem]">
        {activeTab === 'stats' && (
          <div className="flex flex-col justify-between h-full">
            <div>
              <StatBar gameStats={gameStats} />
            </div>
            <div>
              {gameStats.totalGames > 0 && (
                <>
                  <h4 className="text-lg leading-6 font-medium text-gray-900">
                    {t('guessDistribution')}
                  </h4>
                  <Histogram gameStats={gameStats} />
                </>
              )}
            </div>
            {(isGameLost || isGameWon) ? (
              <div className="columns-2">
                <div>
                  <h5>{t('newWordCountdown')}</h5>
                  <Countdown
                    className="text-lg font-medium text-gray-900"
                    date={tomorrow}
                    daysInHours={true}
                  />
                </div>
                <button
                  type="button"
                  className="mt-2 w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  onClick={() => {
                    shareStatus(guesses, isGameLost, solution, excludeUrl)
                    handleShare()
                  }}
                >
                  {t('share')}
                </button>
              </div>
            ) : (
              <div />
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <Calendar
            gameStats={gameStats}
            handleShare={handleCalendarShare}
            weekStartsOnMonday={weekStartsOnMonday}
            excludeUrl={excludeUrl}
          />
        )}
      </div>
    </BaseModal>
  )
}
