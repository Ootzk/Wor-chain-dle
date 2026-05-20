import { expect, test, waitForGameReady } from './fixtures/game.fixture'
import { PATCH_NOTES_VERSION } from '../src/constants/config'

const STATS_ICON = 1

const legacyPhoneSnapshot = {
  dailyHistory: {
    '2026-03-07': { guessCount: 6, won: true },
    '2026-03-08': { guessCount: 4, won: true },
    '2026-03-09': { guessCount: 6, won: true },
    '2026-03-10': { guessCount: 6, won: true },
    '2026-03-11': { guessCount: 6, won: true },
    '2026-03-12': { guessCount: 6, won: true },
    '2026-03-13': { guessCount: 6, won: false },
    '2026-03-14': { guessCount: 4, won: true },
    '2026-03-15': { guessCount: 6, won: false },
    '2026-03-16': { guessCount: 6, won: false },
    '2026-03-17': { guessCount: 6, won: false },
    '2026-03-18': { guessCount: 5, won: true },
    '2026-03-19': { guessCount: 6, won: true },
    '2026-03-20': { guessCount: 6, won: false },
    '2026-03-21': { guessCount: 5, won: true },
    '2026-03-22': { guessCount: 6, won: false },
    '2026-03-23': { guessCount: 6, won: true },
    '2026-03-24': { guessCount: 5, won: true },
    '2026-03-25': { guessCount: 6, won: false },
    '2026-03-26': { guessCount: 5, won: true },
    '2026-03-27': { guessCount: 5, won: true },
    '2026-03-28': { guessCount: 6, won: false },
    '2026-03-29': { guessCount: 3, won: true },
    '2026-03-30': { guessCount: 6, won: false },
    '2026-03-31': { guessCount: 6, won: true },
    '2026-04-01': { guessCount: 6, won: true },
    '2026-04-02': { guessCount: 6, won: false },
    '2026-04-03': { guessCount: 6, won: true },
    '2026-04-04': { guessCount: 6, won: true },
    '2026-04-05': { guessCount: 6, won: false },
    '2026-04-06': { guessCount: 2, won: true },
    '2026-04-07': { guessCount: 6, won: true },
    '2026-04-08': { guessCount: 6, won: true },
    '2026-04-09': { guessCount: 3, won: true },
    '2026-04-10': { guessCount: 6, won: false },
    '2026-04-11': { guessCount: 5, won: true },
    '2026-04-12': { guessCount: 6, won: true },
    '2026-04-13': { guessCount: 6, won: false },
    '2026-04-14': { guessCount: 6, won: false },
    '2026-04-15': { guessCount: 5, won: true },
    '2026-04-16': { guessCount: 6, won: false },
    '2026-04-17': { guessCount: 6, won: false },
    '2026-04-18': { guessCount: 6, won: true },
    '2026-04-19': { guessCount: 6, won: false },
    '2026-04-20': { guessCount: 1, won: true },
    '2026-04-21': { guessCount: 3, won: true },
    '2026-04-22': { guessCount: 5, won: true },
    '2026-04-23': { guessCount: 6, won: true },
    '2026-04-24': { guessCount: 6, won: false },
    '2026-04-25': { guessCount: 6, won: false },
    '2026-04-26': { guessCount: 5, won: true },
    '2026-04-27': { guessCount: 3, won: true },
    '2026-04-28': { guessCount: 6, won: false },
    '2026-04-29': { guessCount: 6, won: true },
    '2026-04-30': { guessCount: 5, won: true },
    '2026-05-01': { guessCount: 5, won: true },
    '2026-05-02': { guessCount: 6, won: true },
    '2026-05-03': { guessCount: 6, won: false },
    '2026-05-04': { guessCount: 5, won: true },
    '2026-05-05': { guessCount: 6, won: true },
    '2026-05-06': { guessCount: 6, won: true },
    '2026-05-07': { guessCount: 4, won: true },
    '2026-05-08': { guessCount: 5, won: true },
    '2026-05-09': { guessCount: 5, won: true },
    '2026-05-10': { guessCount: 6, won: false },
    '2026-05-11': { guessCount: 6, won: true },
    '2026-05-12': { guessCount: 6, won: false },
    '2026-05-13': { guessCount: 6, won: true },
    '2026-05-14': { guessCount: 5, won: true },
    '2026-05-15': { guessCount: 6, won: false },
    '2026-05-16': { guessCount: 6, won: false },
    '2026-05-17': { guessCount: 6, won: false },
    '2026-05-18': { guessCount: 6, won: false },
    '2026-05-19': { guessCount: 3, won: true },
    '2026-05-20': { guessCount: 6, won: false },
  },
  gameStats: {
    winDistribution: [1, 1, 5, 7, 17, 27],
    gamesFailed: 36,
    currentStreak: 0,
    bestStreak: 7,
    totalGames: 94,
    successRate: 62,
  },
}

test.describe('Daily results migration', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.addInitScript(
      ({ version, snapshot }) => {
        localStorage.setItem('seenPatchNotesVersion', version)
        localStorage.setItem('i18nextLng', 'en')
        localStorage.setItem(
          'dailyHistory',
          JSON.stringify(snapshot.dailyHistory)
        )
        localStorage.setItem('gameStats', JSON.stringify(snapshot.gameStats))
        localStorage.setItem('dailyHistoryStartDate', '2026-03-06')
      },
      { version: PATCH_NOTES_VERSION, snapshot: legacyPhoneSnapshot }
    )
    await gamePage.clock.setFixedTime(new Date('2026-05-21T03:00:00Z'))
    await gamePage.goto('/')
    await waitForGameReady(gamePage)
  })

  test('migrates v1.6.0 date history into dailyResults', async ({
    gamePage,
  }) => {
    const summary = await gamePage.evaluate(() => {
      const dailyResults = JSON.parse(
        localStorage.getItem('dailyResults') || '{}'
      ) as Record<
        string,
        {
          won: boolean
          endReason: string
          playStats?: unknown
          tileCounts?: unknown
        }
      >
      const values = Object.values(dailyResults)
      return {
        total: values.length,
        wins: values.filter((result) => result.endReason === 'win').length,
        unknown: values.filter((result) => result.endReason === 'unknown')
          .length,
        guessLimit: values.filter(
          (result) => result.endReason === 'guess_limit'
        ).length,
        deadEnd: values.filter((result) => result.endReason === 'dead_end')
          .length,
        withBehaviorStats: values.filter((result) => !!result.playStats).length,
        withTileCounts: values.filter((result) => !!result.tileCounts).length,
      }
    })

    expect(summary).toEqual({
      total: 75,
      wins: 47,
      unknown: 28,
      guessLimit: 0,
      deadEnd: 0,
      withBehaviorStats: 0,
      withTileCounts: 0,
    })
  })

  test('uses migrated results for calendar and legacy losses for Unknown reasons', async ({
    gamePage,
  }) => {
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(STATS_ICON).click()

    await gamePage.locator('button', { hasText: 'Calendar' }).click()
    await expect(gamePage.getByText('2026-05', { exact: true })).toBeVisible()
    await expect(gamePage.getByText('Success')).toBeVisible()
    await expect(gamePage.getByText('Failure')).toBeVisible()
    await expect(gamePage.getByText('Absence')).toBeVisible()

    await gamePage.locator('button', { hasText: 'Summary' }).click()
    const loseReasonSection = gamePage.locator('section', {
      hasText: 'Lose Reason Distribution',
    })

    await expect(loseReasonSection).toContainText('0')
    await expect(loseReasonSection).toContainText('36')
  })
})
