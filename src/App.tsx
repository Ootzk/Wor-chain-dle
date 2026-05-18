import { InformationCircleIcon } from '@heroicons/react/outline'
import { ClipboardListIcon } from '@heroicons/react/outline'
import { CogIcon } from '@heroicons/react/outline'
import { CurrencyDollarIcon } from '@heroicons/react/outline'
import { SparklesIcon } from '@heroicons/react/outline'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from './components/alerts/Alert'
import { Grid } from './components/grid/Grid'
import { Keyboard } from './components/keyboard/Keyboard'
import { InfoModal, InfoTab } from './components/modals/InfoModal'
import { DonateModal } from './components/modals/DonateModal'
import { PatchNotesModal } from './components/modals/PatchNotesModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { StatsModal } from './components/modals/StatsModal'
import { RewardsModal } from './components/modals/RewardsModal'
import { Temporal } from 'temporal-polyfill'
import { isWordInWordList, isWinningWord } from './lib/words'
import { addStatsForCompletedGame, loadStats } from './lib/stats'
import {
  saveDailyResult,
  initDailyHistoryStartDate,
  loadDailyHistory,
  dateToKey,
} from './lib/dailyHistory'
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

  const [currentGuess, setCurrentGuess] = useState<Array<string>>([])
  const [isGameWon, setIsGameWon] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [infoInitialTab, setInfoInitialTab] = useState<InfoTab>('mode')
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
  const [hideLetters, setHideLetters] = useState(
    () => loadSettings().hideLetters
  )
  const [enterValidationHint, setEnterValidationHint] = useState(
    () => loadSettings().enterValidationHint
  )
  const [resultHideLettersOverride, setResultHideLettersOverride] = useState<
    boolean | undefined
  >(undefined)
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

  useEffect(() => {
    if (isDaily) {
      const today = Temporal.Now.plainDateISO()
      const todayKey = dateToKey(today)
      initDailyHistoryStartDate(todayKey)
      retroUnlockAchievements(stats, loadDailyHistory())
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
      hideLetters,
      enterValidationHint,
    })
  }, [
    isUppercase,
    weekStartsOnMonday,
    excludeUrl,
    hideLetters,
    enterValidationHint,
  ])

  useEffect(() => {
    if (!isGameWon && !isGameLost) {
      setResultHideLettersOverride(undefined)
    }
  }, [isGameWon, isGameLost, mode, solution])

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
  }: {
    nextStats: typeof stats
    completedGuesses: string[][]
    won: boolean
    endReason: AchievementEndReason
    deadEnd?: DeadEndContext
  }) => {
    const achievementProgress = recordCompletedGameProgress({
      mode,
      appVersion: PATCH_NOTES_VERSION,
      won,
    })
    showAchievementAlert(
      evaluateAchievements(nextStats, loadDailyHistory(), {
        mode,
        progress: achievementProgress,
        game: {
          guesses: completedGuesses,
          solution,
          won,
          lost: !won,
          guessCount: completedGuesses.length,
          endReason,
          deadEnd,
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
    }
  }

  const onDelete = () => {
    setCurrentGuess(currentGuess.slice(0, -1))
  }

  const onEnter = () => {
    if (isGameWon || isGameLost) {
      return
    }

    const fullGuess = buildFullGuess(currentGuess, guesses)

    if (fullGuess.length !== CONFIG.wordLength) {
      setIsNotEnoughLetters(true)
      return setTimeout(() => {
        setIsNotEnoughLetters(false)
      }, ALERT_TIME_MS)
    }

    if (!isWordInWordList(fullGuess.join(''))) {
      setIsWordNotFoundAlertOpen(true)
      return setTimeout(() => {
        setIsWordNotFoundAlertOpen(false)
      }, ALERT_TIME_MS)
    }
    const winningWord = isWinningWord(fullGuess.join(''), solution)

    if (guesses.length < CONFIG.tries && !isGameWon) {
      setCurrentGuess([])
      const nextGuesses = [...guesses, fullGuess]
      setGuesses(nextGuesses)

      const todayKey = dateToKey(Temporal.Now.plainDateISO())

      if (winningWord) {
        let nextStats = stats
        if (isDaily) {
          nextStats = addStatsForCompletedGame(stats, guesses.length)
          setStats(nextStats)
          saveDailyResult(todayKey, guesses.length + 1, true)
        }
        evaluateCompletedGameAchievements({
          nextStats,
          completedGuesses: nextGuesses,
          won: true,
          endReason: 'win',
        })
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
          if (isDaily) {
            nextStats = addStatsForCompletedGame(stats, CONFIG.tries)
            setStats(nextStats)
            saveDailyResult(todayKey, CONFIG.tries, false)
          }
          evaluateCompletedGameAchievements({
            nextStats,
            completedGuesses: nextGuesses,
            won: false,
            endReason: 'deadEnd',
            deadEnd,
          })
          setIsGameLost(true)
          return
        }
      }

      if (guesses.length === CONFIG.tries - 1) {
        let nextStats = stats
        if (isDaily) {
          nextStats = addStatsForCompletedGame(stats, guesses.length + 1)
          setStats(nextStats)
          saveDailyResult(todayKey, guesses.length + 1, false)
        }
        evaluateCompletedGameAchievements({
          nextStats,
          completedGuesses: nextGuesses,
          won: false,
          endReason: 'fail',
        })
        setIsGameLost(true)
      }
    }
  }
  const localDateStr = dateToKey(Temporal.Now.plainDateISO())
  const effectiveHideLetters = resultHideLettersOverride ?? hideLetters
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
          hideLetters={effectiveHideLetters}
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
        handleClose={() => setIsInfoModalOpen(false)}
        mode={mode}
        questioner={questioner}
        initialTab={infoInitialTab}
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
        weekStartsOnMonday={weekStartsOnMonday}
        lettersHidden={effectiveHideLetters}
        onToggleLettersHidden={() =>
          setResultHideLettersOverride(!effectiveHideLetters)
        }
      />
      <RewardsModal
        isOpen={isRewardsModalOpen}
        handleClose={() => {
          setIsRewardsModalOpen(false)
          setRewardsInitialTab(undefined)
        }}
        isUppercase={isUppercase}
        excludeUrl={excludeUrl}
        initialTab={rewardsInitialTab}
        onOpenDeadEndHelp={() => {
          setIsRewardsModalOpen(false)
          setInfoInitialTab('howToPlay')
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
        hideLetters={hideLetters}
        onToggleHideLetters={() => setHideLetters(!hideLetters)}
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
