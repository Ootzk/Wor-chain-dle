import { getGuessStatuses } from '../../lib/statuses'
import { Cell } from './Cell'
import { CosmeticOverrides } from '../../lib/cosmetics'

type Props = {
  guess: string[]
  solution: string
  chainTopIndex?: number
  chainBottomIndex?: number
  hideLetters?: boolean
  cosmeticOverrides?: CosmeticOverrides
}

export const CompletedRow = ({
  guess,
  solution,
  chainTopIndex,
  chainBottomIndex,
  hideLetters,
  cosmeticOverrides,
}: Props) => {
  const statuses = getGuessStatuses(guess, solution)

  return (
    <div className="flex justify-center mb-1">
      {guess.map((letter, i) => (
        <Cell
          key={i}
          value={letter}
          status={statuses[i]}
          chainTop={i === chainTopIndex}
          chainBottom={i === chainBottomIndex}
          hideLetter={hideLetters}
          cosmeticOverrides={cosmeticOverrides}
        />
      ))}
    </div>
  )
}
