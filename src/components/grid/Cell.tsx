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
  const effectiveStatus = cellEffect?.hideStatus ? undefined : status
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
      'bg-white border-slate-200': !effectiveStatus && !isLocked && !isChain,
      'border-black':
        (value || cellEffect?.value) &&
        !effectiveStatus &&
        !isLocked &&
        !isChain,
      [`bg-white ${chainColor}`]: isChain && !effectiveStatus && !isLocked,
      [`bg-slate-100 ${chainColor}`]: isLocked && !effectiveStatus && isChain,
      'bg-slate-100 border-black': isLocked && !effectiveStatus && !isChain,
      'bg-slate-400 border-slate-400': effectiveStatus === 'absent' && !isChain,
      [`bg-slate-400 ${chainColor}`]: effectiveStatus === 'absent' && isChain,
      'bg-green-500 border-green-500':
        effectiveStatus === 'correct' && !isChain,
      'bg-purple-500 border-purple-500':
        effectiveStatus === 'present' && !isChain,
      [`bg-green-500 ${chainColor}`]: effectiveStatus === 'correct' && isChain,
      [`bg-purple-500 ${chainColor}`]: effectiveStatus === 'present' && isChain,
      [cosmeticColor || 'text-white']: !!effectiveStatus,
      'border-b-0 rounded-b-none': chainBottom,
      'border-t-0 rounded-t-none': chainTop,
      'cell-animation': !!value,
    }
  )

  const displayValue = value ?? cellEffect?.value
  const shouldHideLetter =
    (hideLetter || cellEffect?.hideLetter) && displayValue

  return (
    <div className={classes}>
      <span className={shouldHideLetter ? 'text-transparent' : undefined}>
        {displayValue}
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
