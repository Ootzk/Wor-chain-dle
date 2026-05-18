import { CompletedRow } from './CompletedRow'
import { CurrentRow } from './CurrentRow'
import { EmptyRow } from './EmptyRow'
import { ChainBridge } from './ChainBridge'
import { CONFIG } from '../../constants/config'
import React from 'react'
import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline'

type Props = {
  guesses: string[][]
  currentGuess: string[]
  solution: string
  isGameComplete?: boolean
  hideLetters?: boolean
  showHideLettersToggle?: boolean
  onToggleHideLetters?: () => void
}

function getChainPositions(rowIndex: number) {
  const chainTopIndex =
    rowIndex > 0
      ? (rowIndex - 1) % 2 === 0
        ? CONFIG.wordLength - 1
        : 0
      : undefined
  const chainBottomIndex =
    rowIndex < CONFIG.tries - 1
      ? rowIndex % 2 === 0
        ? CONFIG.wordLength - 1
        : 0
      : undefined
  return { chainTopIndex, chainBottomIndex }
}

function getBridgeChainIndex(rowIndex: number) {
  return rowIndex % 2 === 0 ? CONFIG.wordLength - 1 : 0
}

export const Grid = ({
  guesses,
  currentGuess,
  solution,
  isGameComplete = false,
  hideLetters = false,
  showHideLettersToggle = false,
  onToggleHideLetters,
}: Props) => {
  const elements: React.ReactNode[] = []

  for (let i = 0; i < CONFIG.tries; i++) {
    const { chainTopIndex, chainBottomIndex } = getChainPositions(i)
    let row: React.ReactNode

    if (i < guesses.length) {
      row = (
        <CompletedRow
          guess={guesses[i]}
          solution={solution}
          chainTopIndex={chainTopIndex}
          chainBottomIndex={chainBottomIndex}
          hideLetters={hideLetters}
        />
      )
    } else if (i === guesses.length && !isGameComplete) {
      row = (
        <CurrentRow
          guess={currentGuess}
          guesses={guesses}
          solution={solution}
          chainTopIndex={chainTopIndex}
          chainBottomIndex={chainBottomIndex}
          hideLetters={hideLetters}
        />
      )
    } else {
      row = (
        <EmptyRow
          chainTopIndex={chainTopIndex}
          chainBottomIndex={chainBottomIndex}
        />
      )
    }

    elements.push(
      <div key={`row-${i}`} className="relative mx-auto w-80">
        {row}
        {i === CONFIG.tries - 1 &&
          showHideLettersToggle &&
          onToggleHideLetters && (
            <button
              type="button"
              aria-label="Toggle transparent letters"
              className={`absolute left-[calc(50%+9.5rem)] top-1/2 h-6 w-6 -translate-y-1/2 transition-colors ${
                hideLetters ? 'text-gray-400 hover:text-gray-500' : 'text-black'
              }`}
              onClick={onToggleHideLetters}
            >
              {hideLetters ? (
                <EyeOffIcon className="h-6 w-6" />
              ) : (
                <EyeIcon className="h-6 w-6" />
              )}
            </button>
          )}
      </div>
    )

    if (i < CONFIG.tries - 1) {
      elements.push(
        <ChainBridge key={`bridge-${i}`} chainIndex={getBridgeChainIndex(i)} />
      )
    }
  }

  return <div className="pb-6">{elements}</div>
}
