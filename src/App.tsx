import { InformationCircleIcon } from '@heroicons/react/outline'
import { ChartBarIcon } from '@heroicons/react/outline'
import { CogIcon } from '@heroicons/react/outline'
import { TranslateIcon } from '@heroicons/react/outline'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from './components/alerts/Alert'
import { Grid } from './components/grid/Grid'
import { Keyboard } from './components/keyboard/Keyboard'
import { AboutModal } from './components/modals/AboutModal'
import { InfoModal } from './components/modals/InfoModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { StatsModal, GameMode } from './components/modals/StatsModal'
import { TranslateModal } from './components/modals/TranslateModal'
import { isWordInWordList, isWinningWord } from './lib/words'
import { addStatsForCompletedGame, loadStats } from './lib/stats'
import {
  loadGameStateFromLocalStorage,
  saveGameStateToLocalStorage,
  loadSettings,
  saveSettings,
} from './lib/localStorage'

import { CONFIG } from './constants/config'
import { getChainInfo, isChainDeadEnd } from './lib/chain'
import { ORTHOGRAPHY_PATTERN } from './lib/tokenizer'
import ReactGA from 'react-ga'
import '@bcgov/bc-sans/css/BCSans.css'
import './i18n'
import { withTranslation, WithTranslation } from 'react-i18next'

const ALERT_TIME_MS = 2000

type AppOwnProps = {
  mode: GameMode
  solution: string
}

const App: React.FC<WithTranslation & AppOwnProps> = ({
  t,
  i18n,
  mode,
  solution,
}) => {
  const isDaily = mode === 'daily'

  const [currentGuess, setCurrentGuess] = useState<Array<string>>([])
  const [isGameWon, setIsGameWon] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
  const [isNotEnoughLetters, setIsNotEnoughLetters] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isI18nModalOpen, setIsI18nModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isUppercase, setIsUppercase] = useState(
    () => loadSettings().isUppercase
  )
  const [isWordNotFoundAlertOpen, setIsWordNotFoundAlertOpen] = useState(false)
  const [isGameLost, setIsGameLost] = useState(false)
  const [successAlert, setSuccessAlert] = useState('')
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
      const now = new Date()
      const yyyy = now.getUTCFullYear()
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(now.getUTCDate()).padStart(2, '0')
      document.title = `Wor\u{1F517}dle ${yyyy}-${mm}-${dd}`
    } else {
      document.title = `Wor\u{1F517}dle Practice`
    }
  }, [isDaily])

  useEffect(() => {
    if (isDaily) {
      saveGameStateToLocalStorage({ guesses, solution })
    }
  }, [guesses, isDaily, solution])

  useEffect(() => {
    saveSettings({ isUppercase })
  }, [isUppercase])

  useEffect(() => {
    if (isGameWon) {
      const WIN_MESSAGES = t('winMessages', { returnObjects: true })
      setSuccessAlert(
        WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]
      )
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
  }, [isGameWon, isGameLost, t])

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

    const chainInfo = getChainInfo(guesses)
    const fullGuess = chainInfo
      ? chainInfo.position === 'first'
        ? [chainInfo.letter, ...currentGuess]
        : [...currentGuess, chainInfo.letter]
      : currentGuess

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
      setGuesses([...guesses, fullGuess])

      if (winningWord) {
        if (isDaily) {
          setStats(addStatsForCompletedGame(stats, guesses.length))
        }
        return setIsGameWon(true)
      }

      if (guesses.length === CONFIG.tries - 2) {
        const newGuesses = [...guesses, fullGuess]
        const solutionChars = solution
          .split(ORTHOGRAPHY_PATTERN)
          .filter((i) => i)
        if (isChainDeadEnd(newGuesses, solutionChars)) {
          if (isDaily) {
            setStats(addStatsForCompletedGame(stats, CONFIG.tries))
          }
          setIsGameLost(true)
          return
        }
      }

      if (guesses.length === CONFIG.tries - 1) {
        if (isDaily) {
          setStats(addStatsForCompletedGame(stats, guesses.length + 1))
        }
        setIsGameLost(true)
      }
    }
  }
  let translateElement = <div></div>
  if (CONFIG.availableLangs.length > 1) {
    translateElement = (
      <TranslateIcon
        className="h-6 w-6 cursor-pointer"
        onClick={() => setIsI18nModalOpen(true)}
      />
    )
  }

  return (
    <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
      <div className="flex w-80 mx-auto items-center mb-8">
        <h1 className="text-xl grow font-bold">
          {isDaily ? (
            <>Wor&#x1F517;dle {new Date().toLocaleDateString('en-CA')}</>
          ) : (
            <>Wor&#x1F517;dle Practice</>
          )}
        </h1>
        {translateElement}
        <InformationCircleIcon
          className="h-6 w-6 cursor-pointer"
          onClick={() => setIsInfoModalOpen(true)}
        />
        {isDaily && (
          <ChartBarIcon
            className="h-6 w-6 cursor-pointer"
            onClick={() => setIsStatsModalOpen(true)}
          />
        )}
        <CogIcon
          className="h-6 w-6 cursor-pointer"
          onClick={() => setIsSettingsModalOpen(true)}
        />
      </div>
      <div className="flex justify-center mb-4">
        <Link
          to={isDaily ? '/practice' : '/'}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          {isDaily ? t('practice') : t('daily')}
        </Link>
      </div>
      <div className={isUppercase ? 'uppercase' : ''}>
        <Grid
          guesses={guesses}
          currentGuess={currentGuess}
          solution={solution}
        />
        <Keyboard
          onChar={onChar}
          onDelete={onDelete}
          onEnter={onEnter}
          guesses={guesses}
          solution={solution}
        />
      </div>
      <TranslateModal
        isOpen={isI18nModalOpen}
        handleClose={() => setIsI18nModalOpen(false)}
      />
      <InfoModal
        isOpen={isInfoModalOpen}
        handleClose={() => setIsInfoModalOpen(false)}
      />
      <StatsModal
        isOpen={isStatsModalOpen}
        handleClose={() => setIsStatsModalOpen(false)}
        guesses={guesses}
        gameStats={stats}
        isGameLost={isGameLost}
        isGameWon={isGameWon}
        handleShare={() => {
          setSuccessAlert(t('gameCopied'))
          return setTimeout(() => setSuccessAlert(''), ALERT_TIME_MS)
        }}
        mode={mode}
        solution={solution}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        handleClose={() => setIsSettingsModalOpen(false)}
        isUppercase={isUppercase}
        onToggleUppercase={() => setIsUppercase(!isUppercase)}
      />
      <AboutModal
        isOpen={isAboutModalOpen}
        handleClose={() => setIsAboutModalOpen(false)}
      />

      <button
        type="button"
        className="mx-auto mt-8 flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 select-none"
        onClick={() => setIsAboutModalOpen(true)}
      >
        {t('about')}
      </button>

      <Alert message={t('notEnoughLetters')} isOpen={isNotEnoughLetters} />
      <Alert message={t('wordNotFound')} isOpen={isWordNotFoundAlertOpen} />
      <Alert message={t('solution', { solution })} isOpen={isGameLost} />
      <Alert
        message={successAlert}
        isOpen={successAlert !== ''}
        variant="success"
      />
    </div>
  )
}

export default withTranslation()(App)
