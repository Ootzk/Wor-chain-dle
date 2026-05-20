import {
  getEventDetailStatsHistory,
  loadEventResults,
  loadEventResultsByVersion,
  saveEventResult,
} from './eventResults'
import {
  completePlayStats,
  createPlayStats,
  recordEnterAttempt,
} from './playStats'

const createCompletedStats = (dateKey: string) =>
  completePlayStats({
    stats: recordEnterAttempt(
      createPlayStats({
        mode: 'event',
        solution: 'chain',
        dateKey,
        enterValidationHint: false,
        now: 1000,
      }),
      'valid',
      2000
    ),
    won: true,
    guessCount: 1,
    tileCounts: {
      correct: 5,
      present: 0,
      absent: 0,
      unrevealed: 25,
    },
    now: 3000,
  })

describe('event results', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores event results by version and date', () => {
    saveEventResult('v1.7.0', {
      dateKey: '2026-05-21',
      solution: 'chain',
      won: false,
      guessCount: 5,
      endReason: 'dead_end',
    })
    saveEventResult('v1.8.0', {
      dateKey: '2026-08-01',
      solution: 'ghost',
      won: false,
      guessCount: 6,
      endReason: 'timeout',
    })

    expect(loadEventResults('v1.7.0')['2026-05-21']).toMatchObject({
      solution: 'chain',
      won: false,
      guessCount: 5,
      endReason: 'dead_end',
    })
    expect(loadEventResultsByVersion()['v1.8.0']['2026-08-01']).toMatchObject({
      endReason: 'timeout',
    })
  })

  it('exposes completed play stats for detail summaries', () => {
    const completed = createCompletedStats('2026-05-22')
    saveEventResult('v1.7.0', {
      dateKey: '2026-05-22',
      solution: 'chain',
      won: true,
      guessCount: 1,
      endReason: 'win',
      tileCounts: completed.tileCounts,
      playStats: completed,
    })

    expect(getEventDetailStatsHistory(loadEventResults('v1.7.0'))).toEqual({
      '2026-05-22': completed,
    })
  })
})
