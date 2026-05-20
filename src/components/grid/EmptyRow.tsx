import { Cell } from './Cell'
import { CONFIG } from '../../constants/config'
import { CosmeticOverrides } from '../../lib/cosmetics'

type Props = {
  chainTopIndex?: number
  chainBottomIndex?: number
  cosmeticOverrides?: CosmeticOverrides
}

export const EmptyRow = ({
  chainTopIndex,
  chainBottomIndex,
  cosmeticOverrides,
}: Props) => {
  const emptyCells = Array.from(Array(CONFIG.wordLength))

  return (
    <div className="flex justify-center mb-1">
      {emptyCells.map((_, i) => (
        <Cell
          key={i}
          chainTop={i === chainTopIndex}
          chainBottom={i === chainBottomIndex}
          cosmeticOverrides={cosmeticOverrides}
        />
      ))}
    </div>
  )
}
