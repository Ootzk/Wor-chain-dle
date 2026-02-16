import { CharStatus } from '../../lib/statuses'
import classnames from 'classnames'

type Props = {
  value?: string
  status?: CharStatus
  isLocked?: boolean
  chainTop?: boolean
  chainBottom?: boolean
}

export const Cell = ({
  value,
  status,
  isLocked,
  chainTop,
  chainBottom,
}: Props) => {
  const isChain = chainTop || chainBottom

  const classes = classnames(
    'w-14 h-14 border-solid border-2 flex items-center justify-center mx-0.5 text-lg font-bold rounded',
    {
      'bg-white border-slate-200': !status && !isLocked && !isChain,
      'border-black': value && !status && !isLocked && !isChain,
      'bg-white border-black': isChain && !status && !isLocked,
      'bg-slate-100 border-black': isLocked && !status,
      'bg-slate-400 text-white border-slate-400': status === 'absent' && !isChain,
      'bg-slate-400 text-white border-black': status === 'absent' && isChain,
      'bg-green-500 text-white border-green-500':
        status === 'correct' && !isChain,
      'bg-purple-500 text-white border-purple-500':
        status === 'present' && !isChain,
      'bg-green-500 text-white border-black':
        status === 'correct' && isChain,
      'bg-purple-500 text-white border-black':
        status === 'present' && isChain,
      'border-b-0 rounded-b-none': chainBottom,
      'border-t-0 rounded-t-none': chainTop,
      'cell-animation': !!value,
    }
  )

  return <div className={classes}>{value}</div>
}
