import { InformationCircleIcon } from '@heroicons/react/outline'
import { ClipboardListIcon } from '@heroicons/react/outline'
import { CogIcon } from '@heroicons/react/outline'
import { CurrencyDollarIcon } from '@heroicons/react/outline'
import { SparklesIcon } from '@heroicons/react/outline'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from './components/alerts/Alert'
import { Grid } from './components/grid/Grid'
import { Keyboard } from './components/keyboard/Keyboard'
import { InfoModal, InfoSection, InfoTab } from './components/modals/InfoModal'
import { DonateModal } from './components/modals/DonateModal'
import { PatchNotesModal } from './components/modals/PatchNotesModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { StatsModal } from './components/modals/StatsModal'
import { RewardsModal } from './components/modals/RewardsModal'
import { Temporal } from 'temporal-polyfill'
import { isWordInWordList, isWinningWord } from './lib/words'
import { addStatsForCompletedGame, loadStats } from './lib/stats'
import { initDailyHistoryStartDate, dateToKey } from './lib/dailyHistory'
import {
  loadGameStateFromLocalStorage,
  saveGameStateToLocalStorage,
  loadSettings,
  saveSettings,
  loadSeenPatchNotesVersion,
  saveSeenPatchNotesVersion,
} from './lib/localStorage'

import { CONFIG, PATCH_NOTES_VERSION } from './constants/config'
import { buildFullGuess, getChainInfo, isChainDeadEnd } from './lib/chain'
import { ORTHOGRAPHY_PATTERN } from './lib/tokenizer'
import {
  DeadEndContext,
  AchievementEndReason,
  evaluateAchievements,
  retroUnlockAchievements,
  ACHIEVEMENTS,
} from './lib/achievements'
import { getEquippedAlertMessageKeys } from './lib/cosmetics'
import { CREATE_MODE_LABEL, GAME_MODE_LABELS, GameMode } from './lib/gameMode'
import { recordCompletedGameProgress } from './lib/achievementProgress'
import {
  CompletedPlayStats,
  PlayStats,
  clearCurrentPlayStats,
  completePlayStats,
  countTileStatusesForGame,
  hasPlayStatsActivity,
  loadCurrentPlayStats,
  loadDailyPlayStats,
  loadDailyPlayStatsHistory,
  recordDeletePress,
  recordEnterAttempt,
  recordInputActivity,
  saveCurrentPlayStats,
  startNextGuess,
  summarizePlayStats,
} from './lib/playStats'
import {
  DailyEndReason,
  loadDailyResults,
  loadDailyResultHistory,
  saveDailyResult,
} from './lib/dailyResults'
import ReactGA from 'react-ga'
import '@bcgov/bc-sans/css/BCSans.css'
import './i18n'
import { withTranslation, WithTranslation } from 'react-i18next'

const ALERT_TIME_MS = 2000

type AppOwnProps = {
  mode: GameMode
  solution: string
  questioner?: string
}

const App: React.FC<WithTranslation & AppOwnProps> = ({
  t,
  i18n,
  mode,
  solution,
  questioner,
}) => {
  const isDaily = mode === 'daily'
  const isCustom = mode === 'custom'
  const localDateStr = dateToKey(Temporal.Now.plainDateISO())

  const [currentGuess, setCurrentGuess] = useState<Array<string>>([])
  const [isGameWon, setIsGameWon] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [infoInitialTab, setInfoInitialTab] = useState<InfoTab>('mode')
  const [infoInitialSection, setInfoInitialSection] = useState<
    InfoSection | undefined
  >(undefined)
  const [isNotEnoughLetters, setIsNotEnoughLetters] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false)
  const [rewardsInitialTab, setRewardsInitialTab] = useState<
    'achievements' | 'cosmetics' | undefined
  >(undefined)

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false)
  const [isPatchNotesModalOpen, setIsPatchNotesModalOpen] = useState(
    () => loadSeenPatchNotesVersion() !== PATCH_NOTES_VERSION
  )
  const [isUppercase, setIsUppercase] = useState(
    () => loadSettings().isUppercase
  )
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(
    () => loadSettings().weekStartsOnMonday
  )
  const [excludeUrl, setExcludeUrl] = useState(() => loadSettings().excludeUrl)
  const [lettersHidden, setLettersHidden] = useState(false)
  const [enterValidationHint, setEnterValidationHint] = useState(
    () => loadSettings().enterValidationHint
  )
  const [isWordNotFoundAlertOpen, setIsWordNotFoundAlertOpen] = useState(false)
  const [isGameLost, setIsGameLost] = useState(false)
  const [successAlert, setSuccessAlert] = useState('')
  const [achievementAlerts, setAchievementAlerts] = useState<string[]>([])
  const [guesses, setGuesses] = useState<string[][]>(() => {
    if (!isDaily) return []
    const loaded = loadGameStateFromLocalStorage()
    if (loaded?.solution !== solution) {
      return []
    }
    const gameWasWon = loaded.guesses
      .map((guess) => guess.join(''))
      .includes(solution)
    if (gameWasWon) {
      setIsGameWon(true)
    }
    if (loaded.guesses.length === CONFIG.tries && !gameWasWon) {
      setIsGameLost(true)
    }
    if (!gameWasWon && loaded.guesses.length === CONFIG.tries - 1) {
      const solutionChars = solution.split(ORTHOGRAPHY_PATTERN).filter((i) => i)
      if (isChainDeadEnd(loaded.guesses, solutionChars)) {
        setIsGameLost(true)
      }
    }
    return loaded.guesses
  })
  const TRACKING_ID = CONFIG.googleAnalytics

  if (TRACKING_ID && process.env.NODE_ENV !== 'test') {
    ReactGA.initialize(TRACKING_ID)
    ReactGA.pageview(window.location.pathname)
  }
  const [stats, setStats] = useState(() => loadStats())
  const [playStats, setPlayStats] = useState<PlayStats>(() =>
    isDaily
      ? loadDailyPlayStats(localDateStr, solution) ||
        loadCurrentPlayStats({
          mode,
          solution,
          dateKey: localDateStr,
          enterValidationHint: loadSettings().enterValidationHint,
        })
      : loadCurrentPlayStats({
          mode,
          solution,
          enterValidationHint: loadSettings().enterValidationHint,
        })
  )
  const [dailyPlayStatsSummary, setDailyPlayStatsSummary] = useState(() =>
    summarizePlayStats(loadDailyPlayStatsHistory())
  )
  const [dailyResults, setDailyResults] = useState(() => loadDailyResults())
  const playStatsRef = useRef(playStats)

  const updatePlayStats = (next: PlayStats) => {
    playStatsRef.current = next
    setPlayStats(next)
    if (isDaily) {
      saveCurrentPlayStats(next)
    }
  }

  const saveCompletedPlayStats = (
    completed: CompletedPlayStats,
    endReason: DailyEndReason
  ) => {
    playStatsRef.current = completed
    setPlayStats(completed)
    if (isDaily) {
      saveDailyResult({
        dateKey: localDateStr,
        solution,
        won: completed.won,
        guessCount: completed.guessCount,
        endReason,
        tileCounts: completed.tileCounts,
        playStats: completed,
      })
      setDailyResults(loadDailyResults())
      setDailyPlayStatsSummary(summarizePlayStats(loadDailyPlayStatsHistory()))
      clearCurrentPlayStats()
    }
  }

  useEffect(() => {
    if (!isDaily) return

    const clearUnstartedPlayStats = () => {
      if (!hasPlayStatsActivity(playStatsRef.current)) {
        clearCurrentPlayStats()
      }
    }

    window.addEventListener('pagehide', clearUnstartedPlayStats)
    return () => {
      window.removeEventListener('pagehide', clearUnstartedPlayStats)
    }
  }, [isDaily])

  useEffect(() => {
    if (isDaily) {
      const today = Temporal.Now.plainDateISO()
      const todayKey = dateToKey(today)
      initDailyHistoryStartDate(todayKey)
      retroUnlockAchievements(stats, loadDailyResultHistory())
      document.title = `Wor\u{1F517}dle Daily | ${todayKey}`
    } else if (isCustom) {
      document.title = `Wor\u{1F517}dle Custom | ${questioner}`
    } else {
      document.title = `Wor\u{1F517}dle Practice`
    }
  }, [isDaily, isCustom, questioner, stats])

  useEffect(() => {
    if (isDaily) {
      saveGameStateToLocalStorage({ guesses, solution })
    }
  }, [guesses, isDaily, solution])

  useEffect(() => {
    saveSettings({
      isUppercase,
      weekStartsOnMonday,
      excludeUrl,
      enterValidationHint,
    })
  }, [isUppercase, weekStartsOnMonday, excludeUrl, enterValidationHint])

  useEffect(() => {
    if (!isGameWon && !isGameLost) {
      setLettersHidden(false)
    }
  }, [isGameWon, isGameLost, mode, solution])

  useEffect(() => {
    const next = isDaily
      ? loadDailyPlayStats(localDateStr, solution) ||
        loadCurrentPlayStats({
          mode,
          solution,
          dateKey: localDateStr,
          enterValidationHint,
        })
      : loadCurrentPlayStats({
          mode,
          solution,
          enterValidationHint,
        })
    setPlayStats(next)
    playStatsRef.current = next
    if (!isDaily) {
      clearCurrentPlayStats()
    }
    setDailyPlayStatsSummary(summarizePlayStats(loadDailyPlayStatsHistory()))
    setDailyResults(loadDailyResults())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, solution, localDateStr])

  useEffect(() => {
    if (playStats.completedAt || !enterValidationHint) return
    updatePlayStats({
      ...playStats,
      assistFlags: {
        ...playStats.assistFlags,
        enterValidationHint: true,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterValidationHint])

  useEffect(() => {
    const alertKeys = getEquippedAlertMessageKeys()
    if (isGameWon) {
      const WIN_MESSAGES = t(alertKeys.win, { returnObjects: true })
      setSuccessAlert(WIN_MESSAGES[guesses.length - 1] || WIN_MESSAGES[0])
      setTimeout(() => {
        setSuccessAlert('')
        setIsStatsModalOpen(true)
      }, ALERT_TIME_MS)
    }
    if (isGameLost) {
      setTimeout(() => {
        setIsStatsModalOpen(true)
      }, ALERT_TIME_MS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameWon, isGameLost])

  const showAchievementAlert = (newlyUnlocked: string[]) => {
    if (newlyUnlocked.length === 0) return
    const names = newlyUnlocked.map((id) => {
      const a = ACHIEVEMENTS.find((a) => a.id === id)
      return (
        '\uD83C\uDF89 ' +
        t('achievementUnlocked', { name: a ? t(a.titleKey) : id })
      )
    })
    setAchievementAlerts(names)
    setTimeout(() => setAchievementAlerts([]), ALERT_TIME_MS)
  }

  const evaluateCompletedGameAchievements = ({
    nextStats,
    completedGuesses,
    won,
    endReason,
    deadEnd,
    tileCounts,
  }: {
    nextStats: typeof stats
    completedGuesses: string[][]
    won: boolean
    endReason: AchievementEndReason
    deadEnd?: DeadEndContext
    tileCounts?: CompletedPlayStats['tileCounts']
  }) => {
    const achievementProgress = recordCompletedGameProgress({
      mode,
      appVersion: PATCH_NOTES_VERSION,
      won,
    })
    showAchievementAlert(
      evaluateAchievements(nextStats, loadDailyResultHistory(), {
        mode,
        progress: achievementProgress,
        game: {
          dateKey: isDaily ? localDateStr : undefined,
          guesses: completedGuesses,
          solution,
          won,
          lost: !won,
          guessCount: completedGuesses.length,
          endReason,
          deadEnd,
          tileCounts,
        },
      })
    )
  }

  const onChar = (value: string) => {
    const chainInfo = getChainInfo(guesses)
    const maxLength = chainInfo ? CONFIG.wordLength - 1 : CONFIG.wordLength
    if (
      currentGuess.length < maxLength &&
      guesses.length < CONFIG.tries &&
      !isGameWon
    ) {
      let newGuess = currentGuess.concat([value])
      setCurrentGuess(newGuess)
      updatePlayStats(recordInputActivity(playStats))
    }
  }

  const onDelete = () => {
    const filledLength = currentGuess.length
    setCurrentGuess(currentGuess.slice(0, -1))
    if (!isGameWon && !isGameLost) {
      updatePlayStats(recordDeletePress(playStats, filledLength))
    }
  }

  const onEnter = () => {
    if (isGameWon || isGameLost) {
      return
    }

    const fullGuess = buildFullGuess(currentGuess, guesses)

    if (fullGuess.length !== CONFIG.wordLength) {
      updatePlayStats(recordEnterAttempt(playStats, 'incomplete'))
      setIsNotEnoughLetters(true)
      return setTimeout(() => {
        setIsNotEnoughLetters(false)
      }, ALERT_TIME_MS)
    }

    if (!isWordInWordList(fullGuess.join(''))) {
      updatePlayStats(recordEnterAttempt(playStats, 'invalid'))
      setIsWordNotFoundAlertOpen(true)
      return setTimeout(() => {
        setIsWordNotFoundAlertOpen(false)
      }, ALERT_TIME_MS)
    }
    const submittedPlayStats = recordEnterAttempt(playStats, 'valid')
    updatePlayStats(submittedPlayStats)
    const winningWord = isWinningWord(fullGuess.join(''), solution)

    if (guesses.length < CONFIG.tries && !isGameWon) {
      setCurrentGuess([])
      const nextGuesses = [...guesses, fullGuess]
      setGuesses(nextGuesses)

      if (winningWord) {
        const tileCounts = countTileStatusesForGame(nextGuesses, solution)
        let nextStats = stats
        if (isDaily) {
          nextStats = addStatsForCompletedGame(stats, guesses.length)
          setStats(nextStats)
        }
        evaluateCompletedGameAchievements({
          nextStats,
          completedGuesses: nextGuesses,
          won: true,
          endReason: 'win',
          tileCounts,
        })
        saveCompletedPlayStats(
          completePlayStats({
            stats: submittedPlayStats,
            won: true,
            guessCount: nextGuesses.length,
            tileCounts,
          }),
          'win'
        )
        return setIsGameWon(true)
      }

      if (guesses.length === CONFIG.tries - 2) {
        const solutionChars = solution
          .split(ORTHOGRAPHY_PATTERN)
          .filter((i) => i)
        if (isChainDeadEnd(nextGuesses, solutionChars)) {
          const deadEndChainInfo = getChainInfo(nextGuesses)
          const deadEndChainIndex =
            deadEndChainInfo?.position === 'first' ? 0 : CONFIG.wordLength - 1
          const deadEnd = deadEndChainInfo
            ? {
                guessIndex: nextGuesses.length,
                chainPosition: deadEndChainInfo.position,
                chainLetter: deadEndChainInfo.letter,
                solutionLetter: solutionChars[deadEndChainIndex],
              }
            : undefined
          let nextStats = stats
          const tileCounts = countTileStatusesForGame(nextGuesses, solution)
          if (isDaily) {
            nextStats = addStatsForCompletedGame(stats, CONFIG.tries)
            setStats(nextStats)
          }
          evaluateCompletedGameAchievements({
            nextStats,
            completedGuesses: nextGuesses,
            won: false,
            endReason: 'deadEnd',
            deadEnd,
            tileCounts,
          })
          saveCompletedPlayStats(
            completePlayStats({
              stats: submittedPlayStats,
              won: false,
              guessCount: nextGuesses.length,
              tileCounts,
            }),
            'dead_end'
          )
          setIsGameLost(true)
          return
        }
      }

      if (guesses.length === CONFIG.tries - 1) {
        const tileCounts = countTileStatusesForGame(nextGuesses, solution)
        let nextStats = stats
        if (isDaily) {
          nextStats = addStatsForCompletedGame(stats, guesses.length + 1)
          setStats(nextStats)
        }
        evaluateCompletedGameAchievements({
          nextStats,
          completedGuesses: nextGuesses,
          won: false,
          endReason: 'fail',
          tileCounts,
        })
        saveCompletedPlayStats(
          completePlayStats({
            stats: submittedPlayStats,
            won: false,
            guessCount: nextGuesses.length,
            tileCounts,
          }),
          'guess_limit'
        )
        setIsGameLost(true)
        return
      }

      updatePlayStats(startNextGuess(submittedPlayStats))
    }
  }
  const enterHint = (() => {
    if (!enterValidationHint || isGameWon || isGameLost) return undefined

    const fullGuess = buildFullGuess(currentGuess, guesses)
    if (fullGuess.length !== CONFIG.wordLength) return 'incomplete'
    if (!isWordInWordList(fullGuess.join(''))) return 'invalid'
    return 'valid'
  })()

  return (
    <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
      <div className="flex w-80 mx-auto items-center mb-8">
        <div className="grow">
          <h1 className="text-xl font-bold">Wor&#x1F517;dle</h1>
          <p className="text-sm text-gray-500">
            {isDaily ? (
              <>
                {GAME_MODE_LABELS.daily} | {localDateStr}
              </>
            ) : isCustom ? (
              <>
                <span className="text-green-500">
                  {GAME_MODE_LABELS.custom}
                </span>{' '}
                | {questioner}
              </>
            ) : (
              <span className="text-purple-500">
                {GAME_MODE_LABELS.practice}
              </span>
            )}
          </p>
        </div>
        <InformationCircleIcon
          className="h-6 w-6 cursor-pointer"
          onClick={() => {
            setInfoInitialTab('mode')
            setInfoInitialSection(undefined)
            setIsInfoModalOpen(true)
          }}
        />
        {isDaily && (
          <ClipboardListIcon
            className="h-6 w-6 cursor-pointer"
            onClick={() => setIsStatsModalOpen(true)}
          />
        )}
        <SparklesIcon
          className="h-6 w-6 cursor-pointer"
          onClick={() => {
            setRewardsInitialTab('achievements')
            setIsRewardsModalOpen(true)
          }}
        />
        <CogIcon
          className="h-6 w-6 cursor-pointer"
          onClick={() => setIsSettingsModalOpen(true)}
        />
        <CurrencyDollarIcon
          className="h-6 w-6 cursor-pointer"
          onClick={() => setIsDonateModalOpen(true)}
        />
      </div>
      <div className={isUppercase ? 'uppercase' : ''}>
        <Grid
          guesses={guesses}
          currentGuess={currentGuess}
          solution={solution}
          isGameComplete={isGameWon || isGameLost}
          hideLetters={lettersHidden}
          showHideLettersToggle
          onToggleHideLetters={() => setLettersHidden((hidden) => !hidden)}
        />
        <Keyboard
          onChar={onChar}
          onDelete={onDelete}
          onEnter={onEnter}
          guesses={guesses}
          solution={solution}
          enterHint={enterHint}
        />
      </div>
      <InfoModal
        isOpen={isInfoModalOpen}
        handleClose={() => {
          setIsInfoModalOpen(false)
          setInfoInitialSection(undefined)
        }}
        mode={mode}
        questioner={questioner}
        initialTab={infoInitialTab}
        initialSection={infoInitialSection}
      />
      <StatsModal
        isOpen={isStatsModalOpen}
        handleClose={() => {
          setIsStatsModalOpen(false)
        }}
        guesses={guesses}
        gameStats={stats}
        isGameLost={isGameLost}
        isGameWon={isGameWon}
        handleShare={() => {
          setSuccessAlert(t('gameCopied'))
          return setTimeout(() => setSuccessAlert(''), ALERT_TIME_MS)
        }}
        handleCalendarShare={() => {
          setSuccessAlert(t('calendarCopied'))
          return setTimeout(() => setSuccessAlert(''), ALERT_TIME_MS)
        }}
        mode={mode}
        solution={solution}
        questioner={questioner}
        excludeUrl={excludeUrl}
        onToggleExcludeUrl={() => setExcludeUrl(!excludeUrl)}
        weekStartsOnMonday={weekStartsOnMonday}
        onToggleWeekStartsOnMonday={() =>
          setWeekStartsOnMonday(!weekStartsOnMonday)
        }
        onOpenCosmetics={() => {
          setIsStatsModalOpen(false)
          setRewardsInitialTab('cosmetics')
          setTimeout(() => setIsRewardsModalOpen(true), 300)
        }}
        onOpenDeadEndHelp={() => {
          setIsStatsModalOpen(false)
          setInfoInitialTab('howToPlay')
          setInfoInitialSection('deadEnd')
          setTimeout(() => setIsInfoModalOpen(true), 300)
        }}
        isUppercase={isUppercase}
        playStats={playStats}
        playStatsSummary={dailyPlayStatsSummary}
        dailyResults={dailyResults}
      />
      <RewardsModal
        isOpen={isRewardsModalOpen}
        handleClose={() => {
          setIsRewardsModalOpen(false)
          setRewardsInitialTab(undefined)
        }}
        isUppercase={isUppercase}
        onToggleUppercase={() => setIsUppercase(!isUppercase)}
        excludeUrl={excludeUrl}
        onToggleExcludeUrl={() => setExcludeUrl(!excludeUrl)}
        initialTab={rewardsInitialTab}
        onOpenDeadEndHelp={() => {
          setIsRewardsModalOpen(false)
          setInfoInitialTab('howToPlay')
          setInfoInitialSection('deadEnd')
          setTimeout(() => setIsInfoModalOpen(true), 300)
        }}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        handleClose={() => setIsSettingsModalOpen(false)}
        isUppercase={isUppercase}
        onToggleUppercase={() => setIsUppercase(!isUppercase)}
        weekStartsOnMonday={weekStartsOnMonday}
        onToggleWeekStartsOnMonday={() =>
          setWeekStartsOnMonday(!weekStartsOnMonday)
        }
        excludeUrl={excludeUrl}
        onToggleExcludeUrl={() => setExcludeUrl(!excludeUrl)}
        enterValidationHint={enterValidationHint}
        onToggleEnterValidationHint={() =>
          setEnterValidationHint(!enterValidationHint)
        }
      />
      <DonateModal
        isOpen={isDonateModalOpen}
        handleClose={() => setIsDonateModalOpen(false)}
      />
      <PatchNotesModal
        isOpen={isPatchNotesModalOpen}
        handleClose={() => {
          saveSeenPatchNotesVersion(PATCH_NOTES_VERSION)
          setIsPatchNotesModalOpen(false)
        }}
      />
      <div className="mx-auto mt-8 flex items-center justify-center gap-2">
        <Link
          to={isDaily ? '/practice' : '/'}
          className="flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 select-none"
        >
          {isDaily ? GAME_MODE_LABELS.practice : GAME_MODE_LABELS.daily}
        </Link>
        {isDaily && (
          <Link
            to="/create"
            className="flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 select-none"
          >
            {CREATE_MODE_LABEL}
          </Link>
        )}
      </div>

      <Alert message={t('notEnoughLetters')} isOpen={isNotEnoughLetters} />
      <Alert message={t('wordNotFound')} isOpen={isWordNotFoundAlertOpen} />
      <Alert
        message={t(getEquippedAlertMessageKeys().loss, { solution })}
        isOpen={isGameLost}
      />
      <Alert
        message={successAlert}
        isOpen={successAlert !== ''}
        variant="success"
      />
      {achievementAlerts.map((msg, i) => {
        const tops = ['top-32', 'top-44', 'top-56', 'top-68']
        return (
          <Alert
            key={`achievement-${i}`}
            message={msg}
            isOpen={true}
            variant="achievement"
            topClass={tops[i] || tops[tops.length - 1]}
          />
        )
      })}
    </div>
  )
}

export default withTranslation()(App)
