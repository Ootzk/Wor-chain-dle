import { Cell } from './Cell'
import { CONFIG } from '../../constants/config'
import { CosmeticOverrides } from '../../lib/cosmetics'
import { GridCellEffect } from '../../lib/gridEffects'

type Props = {
  chainTopIndex?: number
  chainBottomIndex?: number
  cellEffects?: Record<number, GridCellEffect>
  cosmeticOverrides?: CosmeticOverrides
}

export const EmptyRow = ({
  chainTopIndex,
  chainBottomIndex,
  cellEffects,
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
          cellEffect={cellEffects?.[i]}
          cosmeticOverrides={cosmeticOverrides}
        />
      ))}
    </div>
  )
}
