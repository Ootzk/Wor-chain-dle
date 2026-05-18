import {
  completePlayStats,
  createPlayStats,
  getAverageGuessTimeMs,
  getFirstInputDelayMs,
  getPlayDurationMs,
  getSubmitAccuracy,
  loadDailyPlayStatsHistory,
  loadDailyPlayStats,
  recordDeletePress,
  recordEnterAttempt,
  recordInputActivity,
  saveDailyPlayStats,
  summarizePlayStats,
} from './playStats'

test('records enter attempt categories and derived values', () => {
  let stats = createPlayStats({
    mode: 'daily',
    solution: 'chain',
    dateKey: '2026-05-18',
    enterValidationHint: true,
    now: 1000,
  })

  stats = recordInputActivity(stats, 1500)
  stats = recordDeletePress(stats, 3, 1800)
  stats = recordEnterAttempt(stats, 'incomplete', 2000)
  stats = recordEnterAttempt(stats, 'invalid', 2500)
  stats = recordEnterAttempt(stats, 'valid', 4000)
  const completed = completePlayStats({
    stats,
    won: true,
    guessCount: 1,
    now: 9000,
  })

  expect(completed.incompleteEnterPresses).toBe(1)
  expect(completed.invalidEnterPresses).toBe(1)
  expect(completed.deletePresses).toBe(1)
  expect(completed.deletePressesByFilledLength).toEqual([0, 0, 0, 1, 0, 0])
  expect(completed.validSubmissions).toBe(1)
  expect(completed.totalEnterPresses).toBe(3)
  expect(completed.guessDurationsMs).toEqual([1500])
  expect(completed.longestPauseMs).toBe(1500)
  expect(completed.assistFlags.enterValidationHint).toBe(true)
  expect(getPlayDurationMs(completed)).toBe(8000)
  expect(getFirstInputDelayMs(completed)).toBe(500)
  expect(getAverageGuessTimeMs(completed)).toBe(1500)
  expect(getSubmitAccuracy(completed)).toBe(33)
})

test('saves and summarizes daily play stats', () => {
  localStorage.clear()

  const first = completePlayStats({
    stats: recordEnterAttempt(
      createPlayStats({
        mode: 'daily',
        solution: 'chain',
        dateKey: '2026-05-18',
        enterValidationHint: false,
        now: 1000,
      }),
      'valid',
      2000
    ),
    won: true,
    guessCount: 1,
    now: 5000,
  })

  const second = completePlayStats({
    stats: recordEnterAttempt(
      recordEnterAttempt(
        recordDeletePress(
          createPlayStats({
            mode: 'daily',
            solution: 'crane',
            dateKey: '2026-05-19',
            enterValidationHint: false,
            now: 10000,
          }),
          5,
          10500
        ),
        'invalid',
        11000
      ),
      'valid',
      13000
    ),
    won: true,
    guessCount: 1,
    now: 16000,
  })

  saveDailyPlayStats('2026-05-18', first)
  saveDailyPlayStats('2026-05-19', second)

  const summary = summarizePlayStats(loadDailyPlayStatsHistory())

  expect(summary.totalGames).toBe(2)
  expect(summary.averageDurationMs).toBe(5000)
  expect(summary.averageEnterPresses).toBe(1.5)
  expect(summary.averageSubmitAccuracy).toBe(75)
  expect(summary.totalInvalidEnterPresses).toBe(1)
  expect(summary.totalDeletePresses).toBe(1)
  expect(summary.totalEmptyDeletePresses).toBe(0)
  expect(summary.totalFullGuessDeletePresses).toBe(1)
  expect(summary.deletePressesByFilledLength).toEqual([0, 0, 0, 0, 0, 1])
  expect(summary.totalEnterPresses).toBe(3)
  expect(loadDailyPlayStats('2026-05-18', 'chain')?.completedAt).toBe(5000)
  expect(loadDailyPlayStats('2026-05-18', 'other')).toBeNull()
})

test('normalizes old play stats without delete distribution', () => {
  localStorage.clear()
  localStorage.setItem(
    'dailyPlayStats',
    JSON.stringify({
      '2026-05-18': {
        mode: 'daily',
        solution: 'chain',
        dateKey: '2026-05-18',
        startedAt: 1000,
        completedAt: 5000,
        lastActivityAt: 5000,
        longestPauseMs: 0,
        incompleteEnterPresses: 0,
        invalidEnterPresses: 0,
        deletePresses: 2,
        validSubmissions: 1,
        totalEnterPresses: 1,
        guessDurationsMs: [1000],
        assistFlags: { enterValidationHint: false },
        won: true,
        guessCount: 1,
      },
    })
  )

  const loaded = loadDailyPlayStats('2026-05-18', 'chain')
  expect(loaded?.deletePresses).toBe(2)
  expect(loaded?.deletePressesByFilledLength).toEqual([0, 0, 0, 0, 0, 0])
})
