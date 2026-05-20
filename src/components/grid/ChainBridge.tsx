import { CONFIG } from '../../constants/config'
import classnames from 'classnames'
import {
  getEquippedChainStyle,
  getEquippedChainColor,
  CosmeticOverrides,
} from '../../lib/cosmetics'

type Props = {
  chainIndex: number
  cosmeticOverrides?: CosmeticOverrides
}

export const ChainBridge = ({ chainIndex, cosmeticOverrides }: Props) => {
  const cells = Array.from(Array(CONFIG.wordLength))
  const chainStyle = getEquippedChainStyle(cosmeticOverrides)
  const chainColor = getEquippedChainColor(cosmeticOverrides)

  return (
    <div className="flex justify-center -mt-1">
      {cells.map((_, i) => (
        <div
          key={i}
          className={classnames('w-14 mx-0.5', chainStyle.height, {
            [`${chainStyle.className} ${chainColor}`]: i === chainIndex,
          })}
        />
      ))}
    </div>
  )
}
