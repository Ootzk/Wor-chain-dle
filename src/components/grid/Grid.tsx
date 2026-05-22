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
import { cycleGridViewMode, GridViewMode } from '../../lib/gridViewMode'

type Props = {
  guesses: string[][]
  currentGuess: string[]
  solution: string
  isGameComplete?: boolean
  showViewModeToggle?: boolean
  viewMode: GridViewMode
  availableViewModes?: GridViewMode[]
  onChangeViewMode?: (mode: GridViewMode) => void
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
  showViewModeToggle = false,
  viewMode,
  availableViewModes,
  onChangeViewMode,
  cellEffects,
  rowEffects,
  cosmeticOverrides,
}: Props) => {
  const elements: React.ReactNode[] = []
  const hideLetters = viewMode === 'spoilerFree'
  const effectiveAvailableViewModes =
    availableViewModes ?? (showViewModeToggle ? ['reveal', 'spoilerFree'] : [])
  const shouldShowViewModeToggle =
    showViewModeToggle && effectiveAvailableViewModes.length > 1
  const handleToggleViewMode = () => {
    const nextMode = cycleGridViewMode(viewMode, effectiveAvailableViewModes)

    if (onChangeViewMode) {
      onChangeViewMode(nextMode)
    }
  }
  const getViewModeButtonClasses = () => {
    if (viewMode === 'live') return 'text-lime-600 hover:text-lime-700'
    if (viewMode === 'spoilerFree') {
      return 'text-gray-400 hover:text-gray-500'
    }
    return 'text-black hover:text-gray-700'
  }
  const getViewModeIcon = () => {
    if (viewMode === 'live') {
      return <StatusOnlineIcon className="h-6 w-6" />
    }
    if (viewMode === 'spoilerFree') {
      return <EyeOffIcon className="h-6 w-6" />
    }
    return <EyeIcon className="h-6 w-6" />
  }
  const getRowCellEffects = (rowIndex: number) =>
    Array.from({ length: CONFIG.wordLength }).reduce<
      Record<number, GridCellEffect>
    >((effects, _, colIndex) => {
      const effect = cellEffects?.[getGridCellKey({ rowIndex, colIndex })]
      if (effect) {
        effects[colIndex] =
          viewMode === 'live'
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
        {i === CONFIG.tries - 1 && shouldShowViewModeToggle && (
          <button
            type="button"
            aria-label="Change grid view mode"
            className={`absolute left-[calc(50%+9.5rem)] top-1/2 h-6 w-6 -translate-y-1/2 transition-colors ${getViewModeButtonClasses()}`}
            onClick={handleToggleViewMode}
          >
            {getViewModeIcon()}
          </button>
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
