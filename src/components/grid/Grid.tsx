import { CompletedRow } from './CompletedRow'
import { CurrentRow } from './CurrentRow'
import { EmptyRow } from './EmptyRow'
import { ChainBridge } from './ChainBridge'
import { CONFIG } from '../../constants/config'
import React from 'react'
import { EyeIcon, EyeOffIcon, StatusOnlineIcon } from '@heroicons/react/outline'
import { CosmeticOverrides } from '../../lib/cosmetics'
import {
  getGridCellKey,
  GridCellEffect,
  GridCellEffects,
  GridRowEffects,
} from '../../lib/gridEffects'
import { GridViewOptions } from '../../lib/gridViewOptions'

type Props = {
  guesses: string[][]
  currentGuess: string[]
  solution: string
  isGameComplete?: boolean
  viewOptions: GridViewOptions
  showLettersToggle?: boolean
  showLiveEffectsToggle?: boolean
  onChangeViewOptions?: (options: GridViewOptions) => void
  cellEffects?: GridCellEffects
  rowEffects?: GridRowEffects
  cosmeticOverrides?: CosmeticOverrides
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
  viewOptions,
  showLettersToggle = false,
  showLiveEffectsToggle = false,
  onChangeViewOptions,
  cellEffects,
  rowEffects,
  cosmeticOverrides,
}: Props) => {
  const elements: React.ReactNode[] = []
  const hideLetters = viewOptions.lettersHidden
  const hasViewControls = showLettersToggle || showLiveEffectsToggle
  const handleToggleLetters = () => {
    onChangeViewOptions?.({
      ...viewOptions,
      lettersHidden: !viewOptions.lettersHidden,
    })
  }
  const handleToggleLiveEffects = () => {
    onChangeViewOptions?.({
      ...viewOptions,
      liveEffectsEnabled: !viewOptions.liveEffectsEnabled,
    })
  }
  const getRowCellEffects = (rowIndex: number) =>
    Array.from({ length: CONFIG.wordLength }).reduce<
      Record<number, GridCellEffect>
    >((effects, _, colIndex) => {
      const effect = cellEffects?.[getGridCellKey({ rowIndex, colIndex })]
      if (effect) {
        effects[colIndex] = viewOptions.liveEffectsEnabled
          ? effect
          : {
              ...effect,
              actor: undefined,
              hideLetter: false,
              hideStatus: false,
            }
      }
      return effects
    }, {})

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
          cellEffects={getRowCellEffects(i)}
          cosmeticOverrides={cosmeticOverrides}
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
          cellEffects={getRowCellEffects(i)}
          cosmeticOverrides={cosmeticOverrides}
        />
      )
    } else {
      row = (
        <EmptyRow
          chainTopIndex={chainTopIndex}
          chainBottomIndex={chainBottomIndex}
          cellEffects={getRowCellEffects(i)}
          cosmeticOverrides={cosmeticOverrides}
        />
      )
    }

    elements.push(
      <div key={`row-${i}`} className="relative mx-auto w-80">
        {rowEffects?.[i]?.prefix && (
          <span
            aria-hidden="true"
            data-testid="row-prefix-effect"
            className="absolute right-[calc(100%+0.25rem)] top-1/2 -translate-y-1/2 text-lg leading-none"
          >
            {rowEffects[i].prefix}
          </span>
        )}
        {row}
        {i === CONFIG.tries - 1 && hasViewControls && (
          <div className="absolute left-[calc(50%+9.5rem)] top-1/2 flex -translate-y-1/2 flex-col gap-1">
            {showLettersToggle && (
              <button
                type="button"
                aria-label="Toggle letters"
                className={`h-6 w-6 transition-colors ${
                  viewOptions.lettersHidden
                    ? 'text-gray-400 hover:text-gray-500'
                    : 'text-black hover:text-gray-700'
                }`}
                onClick={handleToggleLetters}
              >
                {viewOptions.lettersHidden ? (
                  <EyeOffIcon className="h-6 w-6" />
                ) : (
                  <EyeIcon className="h-6 w-6" />
                )}
              </button>
            )}
            {showLiveEffectsToggle && (
              <button
                type="button"
                aria-label="Toggle live effects"
                className={`h-6 w-6 transition-colors ${
                  viewOptions.liveEffectsEnabled
                    ? 'text-lime-600 hover:text-lime-700'
                    : 'text-gray-400 hover:text-gray-500'
                }`}
                onClick={handleToggleLiveEffects}
              >
                <StatusOnlineIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        )}
      </div>
    )

    if (i < CONFIG.tries - 1) {
      elements.push(
        <ChainBridge
          key={`bridge-${i}`}
          chainIndex={getBridgeChainIndex(i)}
          cosmeticOverrides={cosmeticOverrides}
        />
      )
    }
  }

  return <div className="pb-6">{elements}</div>
}
