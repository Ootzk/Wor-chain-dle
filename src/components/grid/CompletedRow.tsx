import { getGuessStatuses } from '../../lib/statuses'
import { Cell } from './Cell'

type Props = {
  guess: string[]
  chainTopIndex?: number
  chainBottomIndex?: number
}

export const CompletedRow = ({
  guess,
  chainTopIndex,
  chainBottomIndex,
}: Props) => {
  const statuses = getGuessStatuses(guess)

  return (
    <div className="flex justify-center mb-1">
      {guess.map((letter, i) => (
        <Cell
          key={i}
          value={letter}
          status={statuses[i]}
          chainTop={i === chainTopIndex}
          chainBottom={i === chainBottomIndex}
        />
      ))}
    </div>
  )
}
