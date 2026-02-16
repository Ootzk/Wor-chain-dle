import { Cell } from './Cell'
import { CONFIG } from '../../constants/config'

type Props = {
  chainTopIndex?: number
  chainBottomIndex?: number
}

export const EmptyRow = ({ chainTopIndex, chainBottomIndex }: Props) => {
  const emptyCells = Array.from(Array(CONFIG.wordLength))

  return (
    <div className="flex justify-center mb-1">
      {emptyCells.map((_, i) => (
        <Cell
          key={i}
          chainTop={i === chainTopIndex}
          chainBottom={i === chainBottomIndex}
        />
      ))}
    </div>
  )
}
