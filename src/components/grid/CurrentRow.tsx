import { Cell } from './Cell'
import { CONFIG } from '../../constants/config'
import { getChainInfo } from '../../lib/chain'

type Props = {
  guess: string[]
  guesses: string[][]
  chainTopIndex?: number
  chainBottomIndex?: number
}

export const CurrentRow = ({
  guess,
  guesses,
  chainTopIndex,
  chainBottomIndex,
}: Props) => {
  const chainInfo = getChainInfo(guesses)

  // Build full row of cells with column indices
  const cells: { value?: string; isLocked?: boolean }[] = []

  if (!chainInfo) {
    for (let i = 0; i < CONFIG.wordLength; i++) {
      cells.push({ value: guess[i] })
    }
  } else if (chainInfo.position === 'first') {
    cells.push({ value: chainInfo.letter, isLocked: true })
    for (let i = 0; i < CONFIG.wordLength - 1; i++) {
      cells.push({ value: guess[i] })
    }
  } else {
    for (let i = 0; i < CONFIG.wordLength - 1; i++) {
      cells.push({ value: guess[i] })
    }
    cells.push({ value: chainInfo.letter, isLocked: true })
  }

  return (
    <div className="flex justify-center mb-1">
      {cells.map((cell, i) => (
        <Cell
          key={i}
          value={cell.value}
          isLocked={cell.isLocked}
          chainTop={i === chainTopIndex}
          chainBottom={i === chainBottomIndex}
        />
      ))}
    </div>
  )
}
