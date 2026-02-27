import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { isWordInWordList } from '../../lib/words'
import { encodeCustomPuzzle } from '../../lib/customPuzzle'
import { CONFIG } from '../../constants/config'

const emptyLetters = () => Array.from({ length: CONFIG.wordLength }, () => '')

export const CreatePuzzlePage = () => {
  const { t } = useTranslation()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const cellRefs = useRef<(HTMLInputElement | null)[]>([])
  const [questioner, setQuestioner] = useState('')
  const [letters, setLetters] = useState<string[]>(emptyLetters)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

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
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          () => setCopied(true),
          () => fallbackCopy(url)
        )
      } else {
        fallbackCopy(url)
      }
    } catch {
      fallbackCopy(url)
    }
  }, [questioner, isFilled, getWord, t])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCellFocused = cellRefs.current.some(
        (ref) => ref === document.activeElement
      )

      if (e.key === 'Enter') {
        e.preventDefault()
        if (document.activeElement === nameInputRef.current) {
          cellRefs.current[0]?.focus()
        } else {
          handleCreate()
        }
        return
      }

      if (
        document.activeElement === nameInputRef.current ||
        isCellFocused
      )
        return

      if (e.key === 'Backspace') {
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
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        setLetters((prev) => {
          const first = prev.indexOf('')
          if (first === -1) return prev
          const next = [...prev]
          next[first] = e.key
          return next
        })
        setCopied(false)
        setError('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCreate])

  const updateCell = (i: number, ch: string) => {
    setLetters((prev) => {
      const next = [...prev]
      next[i] = ch
      return next
    })
    setCopied(false)
    setError('')
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none sm:text-sm border px-3 py-2"
            placeholder={t('createPuzzleNamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('createPuzzleWordLabel')}
          </label>
          <div className="flex justify-center">
            {letters.map((letter, i) => (
              <input
                key={i}
                ref={(el) => {
                  cellRefs.current[i] = el
                }}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="off"
                maxLength={1}
                value={letter}
                onChange={(e) => {
                  const ch = e.target.value
                    .replace(/[^a-zA-Z]/g, '')
                    .slice(-1)
                  if (!ch) return
                  updateCell(i, ch)
                  if (i < CONFIG.wordLength - 1) {
                    cellRefs.current[i + 1]?.focus()
                  } else {
                    cellRefs.current[i]?.blur()
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace') {
                    e.preventDefault()
                    if (letter) {
                      updateCell(i, '')
                    } else if (i > 0) {
                      updateCell(i - 1, '')
                      cellRefs.current[i - 1]?.focus()
                    }
                  } else if (e.key === 'ArrowLeft' && i > 0) {
                    cellRefs.current[i - 1]?.focus()
                  } else if (
                    e.key === 'ArrowRight' &&
                    i < CONFIG.wordLength - 1
                  ) {
                    cellRefs.current[i + 1]?.focus()
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
                onFocus={(e) => e.target.select()}
                className={classnames(
                  'w-14 h-14 border-solid border-2 flex items-center justify-center mx-0.5 text-lg font-bold rounded text-center uppercase outline-none',
                  {
                    'bg-green-500 text-white border-green-500':
                      copied && letter,
                    'bg-white border-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500':
                      !copied && letter,
                    'bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500':
                      !letter,
                  }
                )}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className={classnames(
            'w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm',
            {
              'bg-red-600 hover:bg-red-700 focus:ring-red-500': error,
              'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500':
                !error,
            }
          )}
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
