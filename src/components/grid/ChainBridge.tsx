import { CONFIG } from '../../constants/config'
import classnames from 'classnames'
import { getEquippedChainStyle } from '../../lib/cosmetics'

type Props = {
  chainIndex: number
}

export const ChainBridge = ({ chainIndex }: Props) => {
  const cells = Array.from(Array(CONFIG.wordLength))
  const chainStyle = getEquippedChainStyle()

  return (
    <div className="flex justify-center -mt-1">
      {cells.map((_, i) => (
        <div
          key={i}
          className={classnames('w-14 mx-0.5', chainStyle.height, {
            [chainStyle.className]: i === chainIndex,
          })}
        />
      ))}
    </div>
  )
}
