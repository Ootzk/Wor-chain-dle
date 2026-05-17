import { CharStatus } from '../../lib/statuses'
import classnames from 'classnames'
import {
  getEquippedCellFont,
  getEquippedCellColor,
  getEquippedChainStyle,
  getEquippedChainColor,
} from '../../lib/cosmetics'

type Props = {
  value?: string
  status?: CharStatus
  isLocked?: boolean
  chainTop?: boolean
  chainBottom?: boolean
  hideLetter?: boolean
  showCursor?: boolean
}

export const Cell = ({
  value,
  status,
  isLocked,
  chainTop,
  chainBottom,
  hideLetter,
  showCursor,
}: Props) => {
  const isChain = chainTop || chainBottom
  const cosmeticFont = getEquippedCellFont()
  const cosmeticColor = getEquippedCellColor()
  const chainStyle = getEquippedChainStyle()
  const chainColor = getEquippedChainColor()
  const chainBorderWidth = isChain
    ? chainStyle.borderWidth || 'border-2'
    : 'border-2'
  const chainBorderStyle = isChain
    ? chainStyle.borderStyle || 'border-solid'
    : 'border-solid'

  const classes = classnames(
    'relative w-14 h-14 flex items-center justify-center mx-0.5 text-lg font-bold rounded',
    chainBorderWidth,
    chainBorderStyle,
    cosmeticFont,
    {
      'bg-white border-slate-200': !status && !isLocked && !isChain,
      'border-black': value && !status && !isLocked && !isChain,
      [`bg-white ${chainColor}`]: isChain && !status && !isLocked,
      [`bg-slate-100 ${chainColor}`]: isLocked && !status && isChain,
      'bg-slate-100 border-black': isLocked && !status && !isChain,
      'bg-slate-400 border-slate-400': status === 'absent' && !isChain,
      [`bg-slate-400 ${chainColor}`]: status === 'absent' && isChain,
      'bg-green-500 border-green-500': status === 'correct' && !isChain,
      'bg-purple-500 border-purple-500': status === 'present' && !isChain,
      [`bg-green-500 ${chainColor}`]: status === 'correct' && isChain,
      [`bg-purple-500 ${chainColor}`]: status === 'present' && isChain,
      [cosmeticColor || 'text-white']: !!status,
      'border-b-0 rounded-b-none': chainBottom,
      'border-t-0 rounded-t-none': chainTop,
      'cell-animation': !!value,
    }
  )

  return (
    <div className={classes}>
      <span className={hideLetter && value ? 'text-transparent' : undefined}>
        {value}
      </span>
      {showCursor && (
        <span
          aria-hidden="true"
          data-testid="transparent-letter-cursor"
          className="absolute h-7 w-0.5 rounded-full bg-slate-900"
        />
      )}
    </div>
  )
}
