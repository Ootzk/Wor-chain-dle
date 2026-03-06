import { DayResult } from '../../lib/dailyHistory'

type Props = {
  day: number | null // null for placeholder cells (outside month)
  result?: DayResult | null
  isToday: boolean
  isFuture: boolean
  isBeforeEpoch: boolean
  isPreRecording: boolean // before dailyHistory started recording
}

export const CalendarDay = ({
  day,
  result,
  isToday,
  isFuture,
  isBeforeEpoch,
  isPreRecording,
}: Props) => {
  if (day === null) {
    return <div className="w-10 h-12" />
  }

  const inactive = isFuture || isBeforeEpoch

  const renderIndicator = () => {
    if (inactive) return null

    if (result) {
      if (result.won) {
        return (
          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {result.guessCount}
            </span>
          </div>
        )
      }
      // Lost
      return <div className="w-7 h-7 rounded-full bg-purple-500" />
    }

    // No result: distinguish pre-recording vs not played
    if (isPreRecording) {
      return (
        <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center">
          <span className="text-white text-xs font-bold">?</span>
        </div>
      )
    }

    // Not played (after recording started)
    return <div className="w-7 h-7 rounded-full bg-gray-200" />
  }

  return (
    <div className="w-10 h-12 flex flex-col items-center">
      <span
        className={`text-xs leading-tight ${inactive ? 'text-gray-300' : 'text-gray-500'}`}
      >
        {day}
      </span>
      <div className={isToday ? 'ring-2 ring-indigo-500 rounded-full' : ''}>
        {renderIndicator()}
      </div>
    </div>
  )
}
