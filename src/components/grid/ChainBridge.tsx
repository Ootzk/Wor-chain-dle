import { CONFIG } from '../../constants/config'
import classnames from 'classnames'

type Props = {
  chainIndex: number
}

export const ChainBridge = ({ chainIndex }: Props) => {
  const cells = Array.from(Array(CONFIG.wordLength))

  return (
    <div className="flex justify-center -mt-1">
      {cells.map((_, i) => (
        <div
          key={i}
          className={classnames('w-14 h-1 mx-0.5', {
            'border-l-2 border-r-2 border-black': i === chainIndex,
          })}
        />
      ))}
    </div>
  )
}
