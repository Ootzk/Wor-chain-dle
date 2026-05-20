import { InformationCircleIcon } from '@heroicons/react/outline'
import { ClipboardListIcon } from '@heroicons/react/outline'
import { CogIcon } from '@heroicons/react/outline'
import { CurrencyDollarIcon } from '@heroicons/react/outline'
import { SparklesIcon } from '@heroicons/react/outline'
import { useState, useEffect, useMemo, useRef } from 'react'
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
import { ModeBadge } from './components/modes/ModeBadge'
import { Temporal } from 'temporal-polyfill'
import { isWordInWordList, isWinningWord } from './lib/words'
import { addStatsForCompletedGame, loadStats } from './lib/stats'
import { initDailyHistoryStartDate, dateToKey } from './lib/dailyHistory'
import {
  loadGameStateFromLocalStorage,
  loadEventGameStateFromLocalStorage,
  clearEventGameStateFromLocalStorage,
  saveGameStateToLocalStorage,
  saveEventGameStateToLocalStorage,
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
import {
  getEquippedAlertMessageKeys,
  resolveCosmeticOverrides,
} from './lib/cosmetics'
import { GameMode } from './lib/gameMode'
import { EventDefinition } from './lib/events'
import { recordCompletedGameProgress } from './lib/achievementProgress'
import {
  CompletedPlayStats,
  PlayStats,
  clearCurrentPlayStats,
  completePlayStats,
  countTileStatusesForGame,
  hasPlayStatsActivity,
  loadCurrentPlayStats,
  loadDailyDetailStats,
  loadDailyDetailStatsHistory,
  recordDeletePress,
  recordEnterAttempt,
  recordInputActivity,
  saveCurrentPlayStats,
  startNextGuess,
  summarizeDetailStats,
} from './lib/playStats'
import {
  DailyEndReason,
  loadDailyResults,
  loadDailyResultHistory,
  saveDailyResult,
} from './lib/dailyResults'
import {
  loadEventResults,
  loadEventResultsByVersion,
  saveEventResult,
} from './lib/eventResults'
import ReactGA from 'react-ga'
import '@bcgov/bc-sans/css/BCSans.css'
import './i18n'
import { withTranslation, WithTranslation } from 'react-i18next'

const ALERT_TIME_MS = 2000

type AppOwnProps = {
  mode: GameMode
  solution: string
  questioner?: string
  event?: EventDefinition
}

const App: React.FC<WithTranslation & AppOwnProps> = ({
  t,
  i18n,
  mode,
  solution,
  questioner,
  event,
}) => {
  const isDaily = mode === 'daily'
  const isCustom = mode === 'custom'
  const isEvent = mode === 'event'
  const localDateStr = dateToKey(Temporal.Now.plainDateISO())
  const settingOverrides = isEvent ? event?.settingOverrides : undefined
  const cosmeticOverrides = useMemo(
    () =>
      isEvent ? resolveCosmeticOverrides(event?.cosmeticOverrides) : undefined,
    [isEvent, event?.cosmeticOverrides]
  )

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
  const effectiveIsUppercase = settingOverrides?.isUppercase ?? isUppercase
  const effectiveExcludeUrl = settingOverrides?.excludeUrl ?? excludeUrl
  const effectiveEnterValidationHint =
    settingOverrides?.enterValidationHint ?? enterValidationHint
  const effectiveLettersHidden =
    settingOverrides?.lettersHidden ?? lettersHidden
  const canToggleLettersHidden = settingOverrides?.lettersHidden === undefined
  const [isWordNotFoundAlertOpen, setIsWordNotFoundAlertOpen] = useState(false)
  const [isGameLost, setIsGameLost] = useState(false)
  const [successAlert, setSuccessAlert] = useState('')
  const [achievementAlerts, setAchievementAlerts] = useState<string[]>([])
  const applyLoadedGameStatus = (loadedGuesses: string[][]) => {
    const gameWasWon = loadedGuesses
      .map((guess) => guess.join(''))
      .includes(solution)
    if (gameWasWon) {
      setIsGameWon(true)
    }
    if (loadedGuesses.length === CONFIG.tries && !gameWasWon) {
      setIsGameLost(true)
    }
    if (!gameWasWon && loadedGuesses.length === CONFIG.tries - 1) {
      const solutionChars = solution.split(ORTHOGRAPHY_PATTERN).filter((i) => i)
      if (isChainDeadEnd(loadedGuesses, solutionChars)) {
        setIsGameLost(true)
      }
    }
  }
  const [guesses, setGuesses] = useState<string[][]>(() => {
    if (isDaily) {
      const loaded = loadGameStateFromLocalStorage()
      if (loaded?.solution === solution) {
        applyLoadedGameStatus(loaded.guesses)
        return loaded.guesses
      }
    }

    if (isEvent && event) {
      const loaded = loadEventGameStateFromLocalStorage()
      if (
        loaded?.version === event.version &&
        loaded.dateKey === localDateStr &&
        loaded.solution === solution
      ) {
        applyLoadedGameStatus(loaded.guesses)
        return loaded.guesses
      }
      if (loaded) {
        clearEventGameStateFromLocalStorage()
      }
    }

    return []
  })
  const TRACKING_ID = CONFIG.googleAnalytics

  if (TRACKING_ID && process.env.NODE_ENV !== 'test') {
    ReactGA.initialize(TRACKING_ID)
    ReactGA.pageview(window.location.pathname)
  }
  const [stats, setStats] = useState(() => loadStats())
  const [playStats, setPlayStats] = useState<PlayStats>(() => {
    const eventResult =
      isEvent && event ? loadEventResults(event.version)[localDateStr] : null
    const completedEventStats =
      eventResult?.solution === solution ? eventResult.playStats : null

    return (
      (isDaily ? loadDailyDetailStats(localDateStr, solution) : null) ||
      completedEventStats ||
      loadCurrentPlayStats({
        mode,
        solution,
        dateKey: isDaily || isEvent ? localDateStr : undefined,
        enterValidationHint: effectiveEnterValidationHint,
      })
    )
  })
  const [dailyDetailStatsSummary, setDailyDetailStatsSummary] = useState(() =>
    summarizeDetailStats(loadDailyDetailStatsHistory())
  )
  const [dailyResults, setDailyResults] = useState(() => loadDailyResults())
  const [eventResultsByVersion, setEventResultsByVersion] = useState(() =>
    loadEventResultsByVersion()
  )
  const playStatsRef = useRef(playStats)

  const updatePlayStats = (next: PlayStats) => {
    playStatsRef.current = next
    setPlayStats(next)
    if (isDaily || isEvent) {
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
      setDailyDetailStatsSummary(
        summarizeDetailStats(loadDailyDetailStatsHistory())
      )
      clearCurrentPlayStats('daily')
    }
    if (isEvent && event) {
      saveEventResult(event.version, {
        dateKey: localDateStr,
        solution,
        won: completed.won,
        guessCount: completed.guessCount,
        endReason,
        tileCounts: completed.tileCounts,
        playStats: completed,
      })
      setEventResultsByVersion(loadEventResultsByVersion())
      clearCurrentPlayStats('event')
    }
  }

  useEffect(() => {
    if (!isDaily && !isEvent) return

    const clearUnstartedPlayStats = () => {
      if (!hasPlayStatsActivity(playStatsRef.current)) {
        clearCurrentPlayStats(mode)
      }
    }

    window.addEventListener('pagehide', clearUnstartedPlayStats)
    return () => {
      window.removeEventListener('pagehide', clearUnstartedPlayStats)
    }
  }, [isDaily, isEvent, mode])

  useEffect(() => {
    if (isDaily) {
      const today = Temporal.Now.plainDateISO()
      const todayKey = dateToKey(today)
      initDailyHistoryStartDate(todayKey)
      retroUnlockAchievements(stats, loadDailyResultHistory())
      document.title = `Wor\u{1F517}dle Daily | ${todayKey}`
    } else if (isCustom) {
      document.title = `Wor\u{1F517}dle Custom | ${questioner}`
    } else if (isEvent) {
      document.title = `Wor\u{1F517}dle Event`
    } else {
      document.title = `Wor\u{1F517}dle Practice`
    }
  }, [isDaily, isCustom, isEvent, questioner, stats])

  useEffect(() => {
    if (isDaily) {
      saveGameStateToLocalStorage({ guesses, solution })
    }
    if (isEvent && event) {
      saveEventGameStateToLocalStorage({
        version: event.version,
        dateKey: localDateStr,
        guesses,
        solution,
      })
    }
  }, [guesses, isDaily, isEvent, event, localDateStr, solution])

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
    const shouldPersistPlayStats = isDaily || isEvent
    const completedDailyStats = isDaily
      ? loadDailyDetailStats(localDateStr, solution)
      : null
    const eventResult =
      isEvent && event ? loadEventResults(event.version)[localDateStr] : null
    const completedEventStats =
      eventResult?.solution === solution ? eventResult.playStats : null
    const next =
      completedDailyStats ||
      completedEventStats ||
      loadCurrentPlayStats({
        mode,
        solution,
        dateKey: shouldPersistPlayStats ? localDateStr : undefined,
        enterValidationHint: effectiveEnterValidationHint,
      })
    setPlayStats(next)
    playStatsRef.current = next
    if (!shouldPersistPlayStats) {
      clearCurrentPlayStats(mode)
    }
    setDailyDetailStatsSummary(
      summarizeDetailStats(loadDailyDetailStatsHistory())
    )
    setDailyResults(loadDailyResults())
    setEventResultsByVersion(loadEventResultsByVersion())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, solution, localDateStr])

  useEffect(() => {
    if (playStats.completedAt || !effectiveEnterValidationHint) return
    updatePlayStats({
      ...playStats,
      assistFlags: {
        ...playStats.assistFlags,
        enterValidationHint: true,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveEnterValidationHint])

  useEffect(() => {
    const alertKeys = getEquippedAlertMessageKeys(cosmeticOverrides)
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
    if (!effectiveEnterValidationHint || isGameWon || isGameLost) {
      return undefined
    }

    const fullGuess = buildFullGuess(currentGuess, guesses)
    if (fullGuess.length !== CONFIG.wordLength) return 'incomplete'
    if (!isWordInWordList(fullGuess.join(''))) return 'invalid'
    return 'valid'
  })()

  return (
    <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
      <div className="flex h-12 w-80 mx-auto items-center mb-8">
        <div className="grow">
          <h1 className="text-xl font-bold">Wor&#x1F517;dle</h1>
          <p className="relative text-sm text-gray-500">
            {isDaily ? (
              <span className="inline-flex items-center gap-1.5">
                <ModeBadge mode="daily" />
                <span>| {localDateStr}</span>
              </span>
            ) : isCustom ? (
              <span className="inline-flex items-center gap-1.5">
                <ModeBadge mode="custom" />
                <span>| {questioner}</span>
              </span>
            ) : isEvent ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <ModeBadge mode="event" />
                  <span>| {localDateStr}</span>
                </span>
                <span className="absolute left-0 top-full text-sky-500 whitespace-nowrap">
                  {event ? t(event.themeKey) : ''}
                </span>
              </>
            ) : (
              <ModeBadge mode="practice" />
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
        {(isDaily || isEvent) && (
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
      <div className={effectiveIsUppercase ? 'uppercase' : ''}>
        <Grid
          guesses={guesses}
          currentGuess={currentGuess}
          solution={solution}
          isGameComplete={isGameWon || isGameLost}
          hideLetters={effectiveLettersHidden}
          showHideLettersToggle={canToggleLettersHidden}
          onToggleHideLetters={() => setLettersHidden((hidden) => !hidden)}
          cosmeticOverrides={cosmeticOverrides}
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
        event={event}
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
        excludeUrl={effectiveExcludeUrl}
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
        isUppercase={effectiveIsUppercase}
        playStats={playStats}
        detailStatsSummary={dailyDetailStatsSummary}
        dailyResults={dailyResults}
        eventResultsByVersion={eventResultsByVersion}
        event={event}
        cosmeticOverrides={cosmeticOverrides}
      />
      <RewardsModal
        isOpen={isRewardsModalOpen}
        handleClose={() => {
          setIsRewardsModalOpen(false)
          setRewardsInitialTab(undefined)
        }}
        isUppercase={effectiveIsUppercase}
        onToggleUppercase={() => setIsUppercase(!isUppercase)}
        excludeUrl={effectiveExcludeUrl}
        onToggleExcludeUrl={() => setExcludeUrl(!excludeUrl)}
        initialTab={rewardsInitialTab}
        mode={mode}
        event={event}
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
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 select-none"
        >
          <ModeBadge mode={isDaily ? 'practice' : 'daily'} />
        </Link>
        {isDaily && (
          <>
            <Link
              to="/event"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 select-none"
            >
              <ModeBadge mode="event" />
            </Link>
            <Link
              to="/create"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 select-none"
            >
              <ModeBadge mode="create" />
            </Link>
          </>
        )}
      </div>

      <Alert message={t('notEnoughLetters')} isOpen={isNotEnoughLetters} />
      <Alert message={t('wordNotFound')} isOpen={isWordNotFoundAlertOpen} />
      <Alert
        message={t(getEquippedAlertMessageKeys(cosmeticOverrides).loss, {
          solution,
        })}
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
