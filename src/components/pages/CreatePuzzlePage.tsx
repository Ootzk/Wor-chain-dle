import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  InformationCircleIcon,
  CogIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/outline'
import classnames from 'classnames'
import { isWordInWordList } from '../../lib/words'
import { encodeCustomPuzzle } from '../../lib/customPuzzle'
import { loadSettings, saveSettings } from '../../lib/localStorage'
import { Keyboard } from '../keyboard/Keyboard'
import { InfoModal } from '../modals/InfoModal'
import { SettingsModal } from '../modals/SettingsModal'
import { DonateModal } from '../modals/DonateModal'
import { CONFIG } from '../../constants/config'

const emptyLetters = () => Array.from({ length: CONFIG.wordLength }, () => '')

export const CreatePuzzlePage = () => {
  const { t } = useTranslation()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [questioner, setQuestioner] = useState('')
  const [letters, setLetters] = useState<string[]>(emptyLetters)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState('')
  const [isUppercase, setIsUppercase] = useState(() => loadSettings().isUppercase)
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(() => loadSettings().weekStartsOnMonday)
  const [excludeUrl, setExcludeUrl] = useState(() => loadSettings().excludeUrl)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false)


  useEffect(() => {
    saveSettings({ isUppercase, weekStartsOnMonday, excludeUrl })
  }, [isUppercase, weekStartsOnMonday, excludeUrl])

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    setCopied(true)
  }

  const getWord = useCallback(() => letters.join(''), [letters])

  const isFilled = letters.every((l) => l !== '')

  const handleCreate = useCallback(() => {
    setError('')
    setCopied(false)

    if (!questioner.trim()) {
      setError(t('createPuzzleErrorNoName'))
      return
    }
    if (!isFilled) {
      setError(
        t('createPuzzleErrorWordLength', { length: CONFIG.wordLength })
      )
      return
    }
    const word = getWord().toLowerCase()
    if (!isWordInWordList(word)) {
      setError(t('createPuzzleErrorInvalidWord'))
      return
    }

    const code = encodeCustomPuzzle(word, questioner.trim())
    const url = `${window.location.origin}${window.location.pathname}#/custom/${code}`
    const onCopy = () => {
      setCopied(true)
      setCopiedUrl(url)
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(onCopy, () => {
          fallbackCopy(url)
          setCopiedUrl(url)
        })
      } else {
        fallbackCopy(url)
        setCopiedUrl(url)
      }
    } catch {
      fallbackCopy(url)
      setCopiedUrl(url)
    }
  }, [questioner, isFilled, getWord, t])

  const isInputFocused = () =>
    document.activeElement === nameInputRef.current

  const onChar = useCallback(
    (value: string) => {
      if (isInputFocused()) return
      setLetters((prev) => {
        const first = prev.indexOf('')
        if (first === -1) return prev
        const next = [...prev]
        next[first] = value
        return next
      })
      setCopied(false)
      setError('')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const onDelete = useCallback(() => {
    if (isInputFocused()) return
    setLetters((prev) => {
      let last = -1
      for (let j = prev.length - 1; j >= 0; j--) {
        if (prev[j] !== '') {
          last = j
          break
        }
      }
      if (last === -1) return prev
      const next = [...prev]
      next[last] = ''
      return next
    })
    setCopied(false)
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onEnter = useCallback(() => {
    if (document.activeElement === nameInputRef.current) {
      nameInputRef.current?.blur()
      return
    }
    handleCreate()
  }, [handleCreate])

  return (
    <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
      <div className="flex w-80 mx-auto items-center mb-8">
        <div className="grow">
          <h1 className="text-xl font-bold">Wor&#x1F517;dle</h1>
          <p className="text-sm text-green-500">{t('createPuzzle')}</p>
        </div>
        <InformationCircleIcon
          className="h-6 w-6 cursor-pointer"
          onClick={() => setIsInfoModalOpen(true)}
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
        <div className="pb-6 min-h-[24rem]">
          <div className="w-80 mx-auto space-y-6">
            <blockquote className="border-l-4 border-gray-300 pl-4 py-2 text-sm text-gray-500 italic whitespace-pre-line normal-case">
              {t('createPuzzleDescription')}
            </blockquote>

            <div>
              <label className="block text-sm font-medium text-gray-700 normal-case">
                {t('createPuzzleNameLabel')}
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={questioner}
                onChange={(e) => {
                  setQuestioner(e.target.value)
                  setCopied(false)
                  setError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    nameInputRef.current?.blur()
                  }
                }}
                maxLength={10}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none sm:text-sm border px-3 py-2 normal-case"
                placeholder={t('createPuzzleNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 normal-case">
                {t('createPuzzleWordLabel')}
              </label>
              <div className="flex justify-center">
                {letters.map((letter, i) => (
                  <input
                    key={i}
                    type="text"
                    readOnly
                    inputMode="none"
                    tabIndex={-1}
                    value={letter}
                    className={classnames(
                      'w-14 h-14 border-solid border-2 flex items-center justify-center mx-0.5 text-lg font-bold rounded text-center outline-none',
                      {
                        'uppercase': isUppercase,
                        'bg-green-500 text-white border-green-500':
                          copied && letter,
                        'bg-white border-black': !copied && letter,
                        'bg-white border-slate-200': !letter,
                      }
                    )}
                  />
                ))}
              </div>
            </div>

            <div
              className={classnames(
                'w-full rounded-md px-4 py-2 text-base font-medium text-center sm:text-sm normal-case',
                {
                  'bg-purple-100 text-purple-700': error,
                  'bg-green-100 text-green-700': copied,
                  'bg-gray-100 text-gray-500': !error && !copied,
                }
              )}
            >
              {error
                ? error
                : copied
                  ? <>
                      {t('createPuzzleCopied')}{' '}
                      <a
                        href={copiedUrl}
                        className="underline"
                      >
                        ({t('createPuzzleTryIt')})
                      </a>
                    </>
                  : isFilled
                    ? t('createPuzzleReady')
                    : t('createPuzzleHint')}
            </div>
          </div>
        </div>
        <Keyboard
          onChar={onChar}
          onDelete={onDelete}
          onEnter={onEnter}
          guesses={
            copied ? [getWord().toLowerCase().split('')] : []
          }
          solution={copied ? getWord().toLowerCase() : ''}
        />
      </div>

      <InfoModal
        isOpen={isInfoModalOpen}
        handleClose={() => setIsInfoModalOpen(false)}
        mode="create"
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        handleClose={() => setIsSettingsModalOpen(false)}
        isUppercase={isUppercase}
        onToggleUppercase={() => setIsUppercase(!isUppercase)}
        weekStartsOnMonday={weekStartsOnMonday}
        onToggleWeekStart={() => setWeekStartsOnMonday(!weekStartsOnMonday)}
        excludeUrl={excludeUrl}
        onToggleExcludeUrl={() => setExcludeUrl(!excludeUrl)}
      />
      <DonateModal
        isOpen={isDonateModalOpen}
        handleClose={() => setIsDonateModalOpen(false)}
      />

      <div className="mx-auto mt-4 flex items-center justify-center gap-2">
        <Link
          to="/"
          className="flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 select-none"
        >
          {t('daily')}
        </Link>
      </div>
    </div>
  )
}
