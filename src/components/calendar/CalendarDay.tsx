import { CalendarMilestone } from '../../lib/calendarMilestones'

type Props = {
  day: number | null // null for placeholder cells (outside month)
  result?: { won: boolean; guessCount: number } | null
  isToday: boolean
  isFuture: boolean
  isBeforeEpoch: boolean
  milestones?: CalendarMilestone[]
}

export const CalendarDay = ({
  day,
  result,
  isToday,
  isFuture,
  isBeforeEpoch,
  milestones = [],
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

    // Not played
    return <div className="w-7 h-7 rounded-full bg-gray-200" />
  }

  const milestoneIcon =
    milestones.length === 0
      ? null
      : milestones.length === 1
      ? milestones[0].icon
      : '✨'
  const milestoneTitle = milestones
    .map((milestone) =>
      [milestone.version, milestone.id].filter(Boolean).join(' ')
    )
    .join('\n')

  return (
    <div className="relative flex h-12 w-10 flex-col items-center">
      <span
        className={`text-xs leading-tight ${
          inactive ? 'text-gray-300' : 'text-gray-500'
        }`}
      >
        {day}
      </span>
      {milestoneIcon && !isFuture && (
        <span
          className="absolute right-1 top-0 text-[0.625rem] leading-none"
          title={milestoneTitle}
          aria-hidden="true"
        >
          {milestoneIcon}
        </span>
      )}
      <div className={isToday ? 'ring-2 ring-indigo-500 rounded-full' : ''}>
        {renderIndicator()}
      </div>
    </div>
  )
}
