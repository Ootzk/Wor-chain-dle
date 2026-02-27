import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Cell } from '../grid/Cell'
import { isWordInWordList } from '../../lib/words'
import { encodeCustomPuzzle } from '../../lib/customPuzzle'
import { CONFIG } from '../../constants/config'

export const CreatePuzzlePage = () => {
  const { t } = useTranslation()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [questioner, setQuestioner] = useState('')
  const [word, setWord] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === nameInputRef.current) return

      if (e.key === 'Backspace') {
        setWord((prev) => prev.slice(0, -1))
        setCopied(false)
        setError('')
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        setWord((prev) =>
          prev.length >= CONFIG.wordLength ? prev : prev + e.key
        )
        setCopied(false)
        setError('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCreate = () => {
    setError('')
    setCopied(false)

    if (!questioner.trim()) {
      setError(t('createPuzzleErrorNoName'))
      return
    }
    if (word.length !== CONFIG.wordLength) {
      setError(
        t('createPuzzleErrorWordLength', { length: CONFIG.wordLength })
      )
      return
    }
    const lowerWord = word.toLowerCase()
    if (!isWordInWordList(lowerWord)) {
      setError(t('createPuzzleErrorInvalidWord'))
      return
    }

    const code = encodeCustomPuzzle(lowerWord, questioner.trim())
    const url = `${window.location.origin}${window.location.pathname}#/custom/${code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
  }

  return (
    <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
      <div className="flex w-80 mx-auto items-center mb-8">
        <div className="grow">
          <h1 className="text-xl font-bold">Wor&#x1F517;dle</h1>
          <p className="text-sm text-gray-500">{t('createPuzzle')}</p>
        </div>
      </div>

      <div className="w-80 mx-auto space-y-6">
        <p className="text-center text-gray-600 text-sm">
          {t('createPuzzleDescription')}
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700">
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
            maxLength={20}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
            placeholder={t('createPuzzleNamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('createPuzzleWordLabel')}
          </label>
          <div className="flex justify-center">
            {Array.from({ length: CONFIG.wordLength }).map((_, i) => (
              <Cell
                key={i}
                value={word[i] || ''}
                status={word[i] ? (copied ? 'correct' : undefined) : undefined}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
            error
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
          }`}
          onClick={handleCreate}
        >
          {error
            ? error
            : copied
              ? t('createPuzzleCopied')
              : t('createPuzzleCopyUrl')}
        </button>
      </div>

      <div className="mx-auto mt-8 flex items-center justify-center gap-2">
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
