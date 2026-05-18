type Props = {
  label: string
  size: number
  value: string
  variant?: 'success' | 'fail'
}

export const Progress = ({
  label,
  size,
  value,
  variant = 'success',
}: Props) => {
  const colorClass =
    variant === 'fail'
      ? 'bg-purple-500 text-purple-50'
      : 'bg-green-500 text-green-50'

  return (
    <div className="flex justify-left m-1">
      <div className="items-center justify-center w-2">{label}</div>
      <div className="rounded-full w-full ml-2">
        <div
          style={{ width: `${5 + size}%` }}
          className={`${colorClass} text-xs font-medium text-center p-0.5 rounded-l-full`}
        >
          {value}
        </div>
      </div>
    </div>
  )
}
