import { Cell } from './Cell'
import { CONFIG } from '../../constants/config'
import { getChainInfo } from '../../lib/chain'

type Props = {
  guess: string[]
  guesses: string[][]
}

export const CurrentRow = ({ guess, guesses }: Props) => {
  const chainInfo = getChainInfo(guesses)

  if (!chainInfo) {
    // First guess: no chain
    const emptyCells = Array.from(Array(CONFIG.wordLength - guess.length))
    return (
      <div className="flex justify-center mb-1">
        {guess.map((letter, i) => (
          <Cell key={i} value={letter} />
        ))}
        {emptyCells.map((_, i) => (
          <Cell key={guess.length + i} />
        ))}
      </div>
    )
  }

  if (chainInfo.position === 'first') {
    // Left chain: [locked] [typed...] [empties...]
    const emptyCells = Array.from(
      Array(Math.max(0, CONFIG.wordLength - 1 - guess.length))
    )
    return (
      <div className="flex justify-center mb-1">
        <Cell value={chainInfo.letter} isLocked />
        {guess.map((letter, i) => (
          <Cell key={i} value={letter} />
        ))}
        {emptyCells.map((_, i) => (
          <Cell key={guess.length + i} />
        ))}
      </div>
    )
  }

  // Right chain: [typed...] [empties...] [locked]
  const emptyCells = Array.from(
    Array(Math.max(0, CONFIG.wordLength - 1 - guess.length))
  )
  return (
    <div className="flex justify-center mb-1">
      {guess.map((letter, i) => (
        <Cell key={i} value={letter} />
      ))}
      {emptyCells.map((_, i) => (
        <Cell key={guess.length + i} />
      ))}
      <Cell value={chainInfo.letter} isLocked />
    </div>
  )
}
