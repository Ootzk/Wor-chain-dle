import { Cell } from './Cell'
import { CONFIG } from '../../constants/config'
import { getChainInfo } from '../../lib/chain'
import { CharStatus, getGuessStatuses } from '../../lib/statuses'

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

  let chainStatus: CharStatus | undefined
  if (chainInfo) {
    const prev = guesses[guesses.length - 1]
    const prevStatuses = getGuessStatuses(prev)
    const chainPos =
      chainInfo.position === 'first' ? 0 : CONFIG.wordLength - 1
    chainStatus = prevStatuses[chainPos]
  }

  // Build full row of cells with column indices
  const cells: { value?: string; isLocked?: boolean; status?: CharStatus }[] =
    []

  if (!chainInfo) {
    for (let i = 0; i < CONFIG.wordLength; i++) {
      cells.push({ value: guess[i] })
    }
  } else if (chainInfo.position === 'first') {
    cells.push({ value: chainInfo.letter, isLocked: true, status: chainStatus })
    for (let i = 0; i < CONFIG.wordLength - 1; i++) {
      cells.push({ value: guess[i] })
    }
  } else {
    for (let i = 0; i < CONFIG.wordLength - 1; i++) {
      cells.push({ value: guess[i] })
    }
    cells.push({ value: chainInfo.letter, isLocked: true, status: chainStatus })
  }

  return (
    <div className="flex justify-center mb-1">
      {cells.map((cell, i) => (
        <Cell
          key={i}
          value={cell.value}
          status={cell.status}
          isLocked={cell.isLocked}
          chainTop={i === chainTopIndex}
          chainBottom={i === chainBottomIndex}
        />
      ))}
    </div>
  )
}
