import { RELEASE_METADATA } from './releaseMetadata'

export type CalendarMilestoneKind =
  | 'birthday'
  | 'calendar_epoch'
  | 'release'
  | 'data'

export type CalendarMilestone = {
  id: string
  date: string
  icon: string
  titleKey: string
  descriptionKey: string
  kind: CalendarMilestoneKind
  version?: string
}

const toVersionLabel = (version: string): string =>
  version.startsWith('v') ? version : `v${version}`

const releaseMilestones = (): CalendarMilestone[] =>
  Object.values(RELEASE_METADATA)
    .filter((metadata) => !!metadata.releasedAt)
    .map((metadata) => ({
      id: `release-${metadata.version}`,
      date: metadata.releasedAt as string,
      icon: '🚀',
      titleKey: 'calendarMilestoneReleaseTitle',
      descriptionKey: 'calendarMilestoneReleaseDesc',
      kind: 'release',
      version: toVersionLabel(metadata.version),
    }))

const calendarReleaseMilestones = (): CalendarMilestone[] => {
  const releasedAt = RELEASE_METADATA['1.3.0']?.releasedAt
  if (!releasedAt) return []

  return [
    {
      id: 'calendar-feature-release',
      date: releasedAt,
      icon: '📅',
      titleKey: 'calendarMilestoneCalendarTitle',
      descriptionKey: 'calendarMilestoneCalendarDesc',
      kind: 'data',
      version: 'v1.3.0',
    },
  ]
}

const detailStatsMilestones = (): CalendarMilestone[] => {
  const releasedAt = RELEASE_METADATA['1.7.0']?.releasedAt
  if (!releasedAt) return []

  return [
    {
      id: 'detail-stats-release',
      date: releasedAt,
      icon: '📊',
      titleKey: 'calendarMilestoneDetailStatsTitle',
      descriptionKey: 'calendarMilestoneDetailStatsDesc',
      kind: 'data',
      version: 'v1.7.0',
    },
  ]
}

export const getCalendarMilestones = ({
  year,
  calendarStartDate,
}: {
  year: number
  calendarStartDate?: string | null
}): CalendarMilestone[] => {
  const milestones: CalendarMilestone[] = [
    {
      id: `birthday-${year}`,
      date: `${year}-02-16`,
      icon: '🎂',
      titleKey: 'calendarMilestoneBirthdayTitle',
      descriptionKey: 'calendarMilestoneBirthdayDesc',
      kind: 'birthday',
    },
    ...releaseMilestones(),
    ...calendarReleaseMilestones(),
    ...detailStatsMilestones(),
  ]

  if (calendarStartDate) {
    milestones.push({
      id: 'calendar-tracking-start',
      date: calendarStartDate,
      icon: '📅',
      titleKey: 'calendarMilestoneTrackingStartTitle',
      descriptionKey: 'calendarMilestoneTrackingStartDesc',
      kind: 'calendar_epoch',
    })
  }

  return milestones
}
