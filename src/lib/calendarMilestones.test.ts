import { getCalendarMilestones } from './calendarMilestones'

describe('calendar milestones', () => {
  it('builds release and local tracking markers from metadata', () => {
    const milestones = getCalendarMilestones({
      year: 2026,
      calendarStartDate: '2026-03-06',
    })

    expect(milestones).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'birthday-2026',
          date: '2026-02-16',
        }),
        expect.objectContaining({
          id: 'calendar-tracking-start',
          date: '2026-03-06',
        }),
        expect.objectContaining({
          id: 'release-1.6.0',
          date: '2026-05-10',
          version: 'v1.6.0',
        }),
        expect.objectContaining({
          id: 'calendar-feature-release',
          date: '2026-03-07',
          version: 'v1.3.0',
        }),
        expect.objectContaining({
          id: 'detail-stats-release',
          date: '2026-06-01',
          version: 'v1.7.0',
        }),
      ])
    )
  })
})
