import { useState, useEffect } from 'react'
import Countdown from 'react-countdown'
import { StatBar } from '../stats/StatBar'
import { Histogram } from '../stats/Histogram'
import { Calendar } from '../calendar/Calendar'
import { GameStats } from '../../lib/localStorage'
import { PlayStats, PlayStatsSummary } from '../../lib/playStats'
import { shareStatus, shareCustomStatus } from '../../lib/share'
import { encodeCustomPuzzle } from '../../lib/customPuzzle'
import { tomorrow } from '../../lib/words'
import { BaseModal } from './BaseModal'
import { ClipboardListIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { GameMode } from '../../lib/gameMode'
import { ShareOptionsRow } from '../stats/ShareOptionsRow'
import { PlayStatsPanel } from '../stats/PlayStatsPanel'

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
  onToggleExcludeUrl: () => void
  weekStartsOnMonday: boolean
  onToggleWeekStartsOnMonday: () => void
  onOpenCosmetics: () => void
  initialTab?: 'stats' | 'calendar'
  playStats: PlayStats
  playStatsSummary: PlayStatsSummary
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
  onToggleExcludeUrl,
  weekStartsOnMonday,
  onToggleWeekStartsOnMonday,
  onOpenCosmetics,
  initialTab,
  playStats,
  playStatsSummary,
}: Props) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'stats' | 'calendar'>('stats')

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab || 'stats')
  }, [isOpen, initialTab])

  if (mode === 'practice') {
    return (
      <BaseModal
        title={t('records')}
        icon={<ClipboardListIcon />}
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
        icon={<ClipboardListIcon />}
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
      icon={<ClipboardListIcon />}
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
          <div className="relative flex h-full flex-col pb-20">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <StatBar gameStats={gameStats} />
              {gameStats.totalGames > 0 && (
                <>
                  <h4 className="text-lg leading-6 font-medium text-gray-900">
                    {t('guessDistribution')}
                  </h4>
                  <Histogram gameStats={gameStats} />
                </>
              )}
              <PlayStatsPanel current={playStats} summary={playStatsSummary} />
            </div>
            {isGameLost || isGameWon ? (
              <div className="absolute bottom-0 left-0 grid w-full grid-cols-2 gap-3">
                <div>
                  <h5>{t('newWordCountdown')}</h5>
                  <Countdown
                    className="text-lg font-medium text-gray-900"
                    date={tomorrow}
                    daysInHours={true}
                  />
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                    onClick={() => {
                      shareStatus(guesses, isGameLost, solution, excludeUrl)
                      handleShare()
                    }}
                  >
                    {t('share')}
                  </button>
                  <ShareOptionsRow
                    excludeUrl={excludeUrl}
                    onToggleExcludeUrl={onToggleExcludeUrl}
                    onOpenCosmetics={onOpenCosmetics}
                  />
                </div>
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
            onToggleWeekStartsOnMonday={onToggleWeekStartsOnMonday}
            excludeUrl={excludeUrl}
            onToggleExcludeUrl={onToggleExcludeUrl}
            onOpenCosmetics={onOpenCosmetics}
          />
        )}
      </div>
    </BaseModal>
  )
}
