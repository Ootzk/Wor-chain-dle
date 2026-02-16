import { CompletedRow } from './CompletedRow'
import { CurrentRow } from './CurrentRow'
import { EmptyRow } from './EmptyRow'
import { ChainBridge } from './ChainBridge'
import { CONFIG } from '../../constants/config'
import React from 'react'

type Props = {
  guesses: string[][]
  currentGuess: string[]
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

export const Grid = ({ guesses, currentGuess }: Props) => {
  const elements: React.ReactNode[] = []

  for (let i = 0; i < CONFIG.tries; i++) {
    const { chainTopIndex, chainBottomIndex } = getChainPositions(i)

    if (i < guesses.length) {
      elements.push(
        <CompletedRow
          key={`row-${i}`}
          guess={guesses[i]}
          chainTopIndex={chainTopIndex}
          chainBottomIndex={chainBottomIndex}
        />
      )
    } else if (i === guesses.length) {
      elements.push(
        <CurrentRow
          key={`row-${i}`}
          guess={currentGuess}
          guesses={guesses}
          chainTopIndex={chainTopIndex}
          chainBottomIndex={chainBottomIndex}
        />
      )
    } else {
      elements.push(
        <EmptyRow
          key={`row-${i}`}
          chainTopIndex={chainTopIndex}
          chainBottomIndex={chainBottomIndex}
        />
      )
    }

    if (i < CONFIG.tries - 1) {
      elements.push(
        <ChainBridge
          key={`bridge-${i}`}
          chainIndex={getBridgeChainIndex(i)}
        />
      )
    }
  }

  return <div className="pb-6">{elements}</div>
}
