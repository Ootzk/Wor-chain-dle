import { ReactNode } from 'react'
import classnames from 'classnames'
import { KeyValue } from '../../lib/keyboard'
import { CharStatus } from '../../lib/statuses'

export type KeyVariant = 'incomplete' | 'invalid' | 'valid'

type Props = {
  children?: ReactNode
  value: KeyValue
  width?: number
  status?: CharStatus
  variant?: KeyVariant
  onClick: (value: KeyValue) => void
}

export const Key = ({
  children,
  status,
  variant,
  width = 40,
  value,
  onClick,
}: Props) => {
  const classes = classnames(
    'flex items-center justify-center rounded mx-0.5 text-xs font-bold cursor-pointer select-none',
    {
      'bg-slate-200 hover:bg-slate-300 active:bg-slate-400':
        !status && !variant,
      'bg-slate-400 text-white': status === 'absent',
      'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white':
        status === 'correct',
      'bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white':
        status === 'present',
      'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200 active:bg-slate-300':
        variant === 'incomplete',
      'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 active:bg-purple-300':
        variant === 'invalid',
      'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 active:bg-green-300':
        variant === 'valid',
    }
  )

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick(value)
    event.currentTarget.blur()
  }

  return (
    <button
      style={{ width: `${width}px`, height: '58px' }}
      className={classes}
      onClick={handleClick}
    >
      {children || value}
    </button>
  )
}
