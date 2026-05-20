import {
  completePlayStats,
  createPlayStats,
  getAverageGuessTimeMs,
  getDeletePressesByFilledLength,
  getFirstInputDelayMs,
  getIncompleteEnterPresses,
  getInvalidEnterPresses,
  getLongPauseCount,
  getPlayDurationMs,
  getSubmitAccuracy,
  getTotalLongPauseMs,
  getTotalDeletePresses,
  getTotalEnterPresses,
  getValidSubmissions,
  hasPlayStatsActivity,
  loadDailyPlayStatsHistory,
  loadDailyPlayStats,
  recordDeletePress,
  recordEnterAttempt,
  recordInputActivity,
  saveDailyPlayStats,
  startNextGuess,
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

  expect(getIncompleteEnterPresses(completed)).toBe(1)
  expect(getInvalidEnterPresses(completed)).toBe(1)
  expect(getTotalDeletePresses(completed)).toBe(1)
  expect(getDeletePressesByFilledLength(completed)).toEqual([0, 0, 0, 1, 0, 0])
  expect(getValidSubmissions(completed)).toBe(1)
  expect(getTotalEnterPresses(completed)).toBe(3)
  expect(completed.guessStats[0].durationMs).toBe(3000)
  expect(completed.guessStats[0].enterPresses).toBe(3)
  expect(completed.guessStats[0].deletePresses).toBe(1)
  expect(completed.longestPauseMs).toBe(1500)
  expect(completed.assistFlags.enterValidationHint).toBe(true)
  expect(getPlayDurationMs(completed)).toBe(8000)
  expect(getFirstInputDelayMs(completed)).toBe(500)
  expect(getAverageGuessTimeMs(completed)).toBe(3000)
  expect(getSubmitAccuracy(completed)).toBe(33)
})

test('detects whether play stats have user activity', () => {
  const stats = createPlayStats({
    mode: 'daily',
    solution: 'chain',
    dateKey: '2026-05-18',
    enterValidationHint: false,
    now: 1000,
  })

  expect(hasPlayStatsActivity(stats)).toBe(false)
  expect(hasPlayStatsActivity(recordInputActivity(stats, 1500))).toBe(true)
  expect(
    hasPlayStatsActivity(recordEnterAttempt(stats, 'incomplete', 1500))
  ).toBe(true)
  expect(hasPlayStatsActivity(recordDeletePress(stats, 0, 1500))).toBe(true)
})

test('records each guess duration and input counts separately', () => {
  let stats = createPlayStats({
    mode: 'daily',
    solution: 'chain',
    dateKey: '2026-05-18',
    enterValidationHint: false,
    now: 1000,
  })

  stats = recordDeletePress(stats, 0, 1200)
  stats = recordEnterAttempt(stats, 'valid', 3000)
  stats = startNextGuess(stats, 3000)
  stats = recordInputActivity(stats, 3500)
  stats = recordDeletePress(stats, 5, 4000)
  stats = recordEnterAttempt(stats, 'invalid', 4500)
  stats = recordEnterAttempt(stats, 'valid', 7000)

  expect(stats.guessStats).toHaveLength(2)
  expect(stats.guessStats[0]).toMatchObject({
    durationMs: 2000,
    enterPresses: 1,
    deletePresses: 1,
  })
  expect(stats.guessStats[1]).toMatchObject({
    durationMs: 4000,
    enterPresses: 2,
    invalidEnterPresses: 1,
    deletePresses: 1,
  })
  expect(getAverageGuessTimeMs(stats)).toBe(3000)
  expect(getTotalEnterPresses(stats)).toBe(3)
  expect(getTotalDeletePresses(stats)).toBe(2)
  expect(getDeletePressesByFilledLength(stats)).toEqual([1, 0, 0, 0, 0, 1])
})

test('records long pauses on the active guess and excludes them from guess time', () => {
  let stats = createPlayStats({
    mode: 'daily',
    solution: 'chain',
    dateKey: '2026-05-18',
    enterValidationHint: false,
    now: 1000,
  })

  stats = recordInputActivity(stats, 1500)
  stats = recordEnterAttempt(stats, 'valid', 302000)
  stats = startNextGuess(stats, 302000)
  stats = recordDeletePress(stats, 0, 603000)
  stats = recordEnterAttempt(stats, 'valid', 604000)

  expect(stats.guessStats[0]).toMatchObject({
    durationMs: 301000,
    longPauseCount: 1,
    totalLongPauseMs: 300500,
  })
  expect(stats.guessStats[1]).toMatchObject({
    durationMs: 302000,
    longPauseCount: 1,
    totalLongPauseMs: 301000,
  })
  expect(getLongPauseCount(stats)).toBe(2)
  expect(getTotalLongPauseMs(stats)).toBe(601500)
  expect(getAverageGuessTimeMs(stats)).toBe(750)
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
  expect(summary.totalDurationMs).toBe(10000)
  expect(summary.totalGuessTimeMs).toBe(4000)
  expect(summary.averageDurationMs).toBe(5000)
  expect(summary.averageGuessTimeMs).toBe(2000)
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
