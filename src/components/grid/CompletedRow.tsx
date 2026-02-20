import { getGuessStatuses } from '../../lib/statuses'
import { Cell } from './Cell'

type Props = {
  guess: string[]
  solution: string
  chainTopIndex?: number
  chainBottomIndex?: number
}

export const CompletedRow = ({
  guess,
  solution,
  chainTopIndex,
  chainBottomIndex,
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
        />
      ))}
    </div>
  )
}
