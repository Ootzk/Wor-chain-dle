import {
  DailyResult,
  loadDailyResult,
  loadDailyResultHistory,
  loadDailyResults,
  saveDailyResult,
} from './dailyResults'
import {
  completePlayStats,
  createPlayStats,
  recordEnterAttempt,
} from './playStats'

const createCompletedStats = ({
  dateKey,
  solution = 'chain',
  won = true,
  guessCount = 1,
}: {
  dateKey: string
  solution?: string
  won?: boolean
  guessCount?: number
}) =>
  completePlayStats({
    stats: recordEnterAttempt(
      createPlayStats({
        mode: 'daily',
        solution,
        dateKey,
        enterValidationHint: false,
        now: 1000,
      }),
      'valid',
      2000
    ),
    won,
    guessCount,
    tileCounts: {
      correct: won ? 5 : 0,
      present: won ? 0 : 2,
      absent: won ? 0 : 23,
      unrevealed: won ? 25 : 5,
    },
    now: 3000,
  })

describe('daily results', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('migrates legacy daily history into canonical daily results', () => {
    localStorage.setItem(
      'dailyHistory',
      JSON.stringify({
        '2026-05-18': { won: true, guessCount: 3 },
        '2026-05-19': { won: false, guessCount: 6 },
      })
    )

    const results = loadDailyResults()

    expect(results['2026-05-18']).toMatchObject({
      dateKey: '2026-05-18',
      won: true,
      guessCount: 3,
      endReason: 'win',
    })
    expect(results['2026-05-19']).toMatchObject({
      dateKey: '2026-05-19',
      won: false,
      guessCount: 6,
      endReason: 'unknown',
    })
    expect(
      JSON.parse(localStorage.getItem('dailyResults') || '{}')
    ).toHaveProperty('2026-05-18')
  })

  it('migrates legacy daily play stats with tile counts', () => {
    const completed = createCompletedStats({
      dateKey: '2026-05-20',
      won: false,
      guessCount: 5,
    })
    localStorage.setItem(
      'dailyPlayStats',
      JSON.stringify({
        '2026-05-20': completed,
      })
    )

    const result = loadDailyResult('2026-05-20')

    expect(result).toMatchObject({
      dateKey: '2026-05-20',
      solution: 'chain',
      won: false,
      guessCount: 5,
      endReason: 'unknown',
      tileCounts: completed.tileCounts,
    })
    expect(result?.playStats?.completedAt).toBe(3000)
  })

  it('keeps canonical daily results over legacy data for the same date', () => {
    const canonical: DailyResult = {
      dateKey: '2026-05-21',
      solution: 'class',
      won: false,
      guessCount: 5,
      endReason: 'dead_end',
    }
    localStorage.setItem(
      'dailyResults',
      JSON.stringify({
        '2026-05-21': canonical,
      })
    )
    localStorage.setItem(
      'dailyHistory',
      JSON.stringify({
        '2026-05-21': { won: true, guessCount: 2 },
      })
    )

    expect(loadDailyResult('2026-05-21')).toMatchObject(canonical)
  })

  it('saves canonical results and exposes legacy-shaped history for callers', () => {
    saveDailyResult({
      dateKey: '2026-05-22',
      solution: 'blood',
      won: false,
      guessCount: 6,
      endReason: 'guess_limit',
    })

    expect(loadDailyResult('2026-05-22', 'blood')).toMatchObject({
      won: false,
      guessCount: 6,
      endReason: 'guess_limit',
    })
    expect(loadDailyResult('2026-05-22', 'other')).toBeNull()
    expect(loadDailyResultHistory()).toEqual({
      '2026-05-22': { won: false, guessCount: 6 },
    })
  })
})
