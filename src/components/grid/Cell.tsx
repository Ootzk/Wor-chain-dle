import { CharStatus } from '../../lib/statuses'
import classnames from 'classnames'
import {
  getEquippedCellFont,
  getEquippedCellColor,
  getEquippedChainStyle,
  getEquippedChainColor,
  CosmeticOverrides,
} from '../../lib/cosmetics'
import { GridCellEffect } from '../../lib/gridEffects'

type Props = {
  value?: string
  status?: CharStatus
  isLocked?: boolean
  chainTop?: boolean
  chainBottom?: boolean
  hideLetter?: boolean
  showCursor?: boolean
  cellEffect?: GridCellEffect
  cosmeticOverrides?: CosmeticOverrides
}

export const Cell = ({
  value,
  status,
  isLocked,
  chainTop,
  chainBottom,
  hideLetter,
  showCursor,
  cellEffect,
  cosmeticOverrides,
}: Props) => {
  const isChain = chainTop || chainBottom
  const cosmeticFont = getEquippedCellFont(cosmeticOverrides)
  const cosmeticColor = getEquippedCellColor(cosmeticOverrides)
  const chainStyle = getEquippedChainStyle(cosmeticOverrides)
  const chainColor = getEquippedChainColor(cosmeticOverrides)
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

  const shouldHideLetter = (hideLetter || cellEffect?.hideLetter) && value

  return (
    <div className={classes}>
      <span className={shouldHideLetter ? 'text-transparent' : undefined}>
        {value}
      </span>
      {cellEffect?.actor && (
        <span
          aria-hidden="true"
          data-testid="pacman-actor"
          className="absolute inset-0 flex items-center justify-center text-2xl leading-none"
        >
          {cellEffect.actor}
        </span>
      )}
      {cellEffect?.marker && !cellEffect.actor && (
        <span
          aria-hidden="true"
          data-testid="cell-marker"
          className="absolute -right-1 -top-1 text-base leading-none drop-shadow-sm"
        >
          {cellEffect.marker}
        </span>
      )}
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
