import { CharStatus } from '../../lib/statuses'
import classnames from 'classnames'

type Props = {
  value?: string
  status?: CharStatus
  isLocked?: boolean
}

export const Cell = ({ value, status, isLocked }: Props) => {
  const classes = classnames(
    'w-14 h-14 border-solid border-2 flex items-center justify-center mx-0.5 text-lg font-bold rounded',
    {
      'bg-white border-slate-200': !status && !isLocked,
      'border-black': value && !status && !isLocked,
      'bg-slate-100 border-slate-400': isLocked && !status,
      'bg-slate-400 text-white border-slate-400': status === 'absent',
      'bg-green-500 text-white border-green-500': status === 'correct',
      'bg-purple-500 text-white border-purple-500': status === 'present',
      'cell-animation': !!value,
    }
  )

  return <div className={classes}>{value}</div>
}
