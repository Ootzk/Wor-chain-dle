import {
  completePlayStats,
  countTileStatusesForGame,
  createPlayStats,
  getAverageGuessTimeMs,
  getDeletePressesByFilledLength,
  getFirstInputDelayMs,
  getFrictionPerSubmit,
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
  loadDailyDetailStatsHistory,
  loadDailyDetailStats,
  loadCurrentPlayStats,
  recordDeletePress,
  recordEnterAttempt,
  recordInputActivity,
  saveCurrentPlayStats,
  saveDailyDetailStats,
  startNextGuess,
  summarizeDetailStats,
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
  expect(getAverageGuessTimeMs(completed)).toBe(2500)
  expect(getSubmitAccuracy(completed)).toBe(33)
  expect(getFrictionPerSubmit(completed)).toBe(3)
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

test('persists current event play stats separately from daily stats', () => {
  localStorage.clear()

  const dailyStats = recordInputActivity(
    createPlayStats({
      mode: 'daily',
      solution: 'chain',
      dateKey: '2026-05-21',
      enterValidationHint: false,
      now: 1000,
    }),
    1200
  )
  const eventStats = recordInputActivity(
    createPlayStats({
      mode: 'event',
      solution: 'crane',
      dateKey: '2026-05-21',
      enterValidationHint: true,
      now: 2000,
    }),
    2500
  )

  saveCurrentPlayStats(dailyStats)
  saveCurrentPlayStats(eventStats)

  expect(
    loadCurrentPlayStats({
      mode: 'daily',
      solution: 'chain',
      dateKey: '2026-05-21',
      enterValidationHint: false,
      now: 3000,
    }).solution
  ).toBe('chain')
  expect(
    loadCurrentPlayStats({
      mode: 'event',
      solution: 'crane',
      dateKey: '2026-05-21',
      enterValidationHint: false,
      now: 3000,
    }).assistFlags.enterValidationHint
  ).toBe(true)
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
  expect(getAverageGuessTimeMs(stats)).toBe(2000)
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
  expect(getAverageGuessTimeMs(stats)).toBe(500)
})

test('keeps pre-input waiting time out of long pause and guess time', () => {
  let stats = createPlayStats({
    mode: 'daily',
    solution: 'chain',
    dateKey: '2026-05-18',
    enterValidationHint: false,
    now: 1000,
  })

  stats = recordInputActivity(stats, 302000)
  stats = recordEnterAttempt(stats, 'valid', 303000)

  expect(getFirstInputDelayMs(stats)).toBe(301000)
  expect(getLongPauseCount(stats)).toBe(0)
  expect(getTotalLongPauseMs(stats)).toBe(0)
  expect(getAverageGuessTimeMs(stats)).toBe(1000)
})

test('counts evaluated and unrevealed tiles from submitted guesses', () => {
  expect(
    countTileStatusesForGame(
      [
        ['a', 'a', 'a', 'a', 'a'],
        ['a', 'a', 'a', 'a', 'a'],
        ['a', 'a', 'a', 'a', 'a'],
        ['a', 'a', 'a', 'a', 'a'],
        ['a', 'a', 'a', 'a', 'a'],
      ],
      'bbbbb'
    )
  ).toEqual({
    correct: 0,
    present: 0,
    absent: 25,
    unrevealed: 5,
  })
})

test('saves and summarizes daily detail stats', () => {
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
    tileCounts: {
      correct: 5,
      present: 0,
      absent: 0,
      unrevealed: 25,
    },
    now: 5000,
  })

  const second = completePlayStats({
    stats: recordEnterAttempt(
      recordEnterAttempt(
        recordDeletePress(
          startNextGuess(
            recordEnterAttempt(
              createPlayStats({
                mode: 'daily',
                solution: 'crane',
                dateKey: '2026-05-19',
                enterValidationHint: false,
                now: 10000,
              }),
              'valid',
              11000
            ),
            11000
          ),
          5,
          11500
        ),
        'invalid',
        12000
      ),
      'valid',
      15000
    ),
    won: true,
    guessCount: 2,
    tileCounts: {
      correct: 3,
      present: 2,
      absent: 5,
      unrevealed: 20,
    },
    now: 16000,
  })

  saveDailyDetailStats('2026-05-18', first)
  saveDailyDetailStats('2026-05-19', second)

  const summary = summarizeDetailStats(loadDailyDetailStatsHistory())

  expect(summary.totalGames).toBe(2)
  expect(summary.totalDurationMs).toBe(10000)
  expect(summary.totalGuessTimeMs).toBe(6000)
  expect(summary.totalFirstInputDelayMs).toBe(0)
  expect(summary.totalLongPauseMs).toBe(0)
  expect(summary.averageFrictionPerSubmit).toBe(0.7)
  expect(summary.totalInvalidEnterPresses).toBe(1)
  expect(summary.totalDeletePresses).toBe(1)
  expect(summary.totalEnterPresses).toBe(4)
  expect(summary.tileCounts).toEqual({
    correct: 8,
    present: 2,
    absent: 5,
    unrevealed: 45,
  })
  expect(loadDailyDetailStats('2026-05-18', 'chain')?.completedAt).toBe(5000)
  expect(loadDailyDetailStats('2026-05-18', 'other')).toBeNull()
})
