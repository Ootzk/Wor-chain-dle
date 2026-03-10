import { test as base, expect, Page } from '@playwright/test'
import { PATCH_NOTES_VERSION } from '../src/constants/config'
import { waitForGameReady, screenshot } from './fixtures/game.fixture'

/**
 * Tests for local timezone word reset and dailyHistory migration.
 *
 * Uses Playwright clock.setFixedTime() + timezoneId to control
 * the browser's time and timezone independently.
 */

// Bare test without gamePage fixture — we need custom browser contexts
const test = base

const CALENDAR_ICON = 3

/** Common initScript to suppress patch notes and set English */
function addGameInitScript(page: Page) {
  return page.addInitScript((version) => {
    localStorage.setItem('seenPatchNotesVersion', version)
    localStorage.setItem('i18nextLng', 'en')
    window.addEventListener('keydown', (e) => {
      if (
        e.code === 'Backspace' &&
        !['INPUT', 'TEXTAREA'].includes(
          (document.activeElement?.tagName ?? '')
        )
      ) {
        e.preventDefault()
      }
    })
  }, PATCH_NOTES_VERSION)
}

test.describe('Local Timezone', () => {
  test('subtitle shows local date matching browser timezone', async ({ browser }) => {
    // UTC 2026-03-15T22:00:00Z
    // Tokyo (UTC+9): 2026-03-16 07:00 → subtitle should show 2026-03-16
    // New York (UTC-4 EDT): 2026-03-15 18:00 → subtitle should show 2026-03-15

    const tokyoCtx = await browser.newContext({ timezoneId: 'Asia/Tokyo' })
    const tokyoPage = await tokyoCtx.newPage()
    await addGameInitScript(tokyoPage)
    await tokyoPage.clock.setFixedTime(new Date('2026-03-15T22:00:00Z'))
    await tokyoPage.goto('/')
    await waitForGameReady(tokyoPage)

    const tokyoSubtitle = tokyoPage.locator('p.text-sm.text-gray-500')
    await expect(tokyoSubtitle).toContainText('2026-03-16')
    await screenshot(tokyoPage, '01-tokyo-subtitle')
    await tokyoCtx.close()

    const nyCtx = await browser.newContext({ timezoneId: 'America/New_York' })
    const nyPage = await nyCtx.newPage()
    await addGameInitScript(nyPage)
    await nyPage.clock.setFixedTime(new Date('2026-03-15T22:00:00Z'))
    await nyPage.goto('/')
    await waitForGameReady(nyPage)

    const nySubtitle = nyPage.locator('p.text-sm.text-gray-500')
    await expect(nySubtitle).toContainText('2026-03-15')
    await screenshot(nyPage, '02-newyork-subtitle')
    await nyCtx.close()
  })

  test('same local date in different timezones shows same word', async ({ browser }) => {
    // Both timezones see "2026-06-01" as local date, but at different UTC instants
    // Tokyo: 2026-06-01 12:00 JST = 2026-06-01T03:00:00Z
    // New York: 2026-06-01 12:00 EDT = 2026-06-01T16:00:00Z

    const tokyoCtx = await browser.newContext({ timezoneId: 'Asia/Tokyo' })
    const tokyoPage = await tokyoCtx.newPage()
    await addGameInitScript(tokyoPage)
    await tokyoPage.clock.setFixedTime(new Date('2026-06-01T03:00:00Z'))
    await tokyoPage.goto('/')
    await waitForGameReady(tokyoPage)
    const tokyoTitle = await tokyoPage.title()
    await tokyoCtx.close()

    const nyCtx = await browser.newContext({ timezoneId: 'America/New_York' })
    const nyPage = await nyCtx.newPage()
    await addGameInitScript(nyPage)
    await nyPage.clock.setFixedTime(new Date('2026-06-01T16:00:00Z'))
    await nyPage.goto('/')
    await waitForGameReady(nyPage)
    const nyTitle = await nyPage.title()
    await nyCtx.close()

    // Both should contain 2026-06-01 and have the same title (= same word)
    expect(tokyoTitle).toContain('2026-06-01')
    expect(nyTitle).toContain('2026-06-01')
    expect(tokyoTitle).toBe(nyTitle)
  })

  test('different local dates show different words', async ({ browser }) => {
    // Same UTC instant, but different local dates due to timezone
    // UTC 2026-04-10T23:00:00Z
    // Tokyo (UTC+9): 2026-04-11 08:00
    // Los Angeles (UTC-7 PDT): 2026-04-10 16:00

    const tokyoCtx = await browser.newContext({ timezoneId: 'Asia/Tokyo' })
    const tokyoPage = await tokyoCtx.newPage()
    await addGameInitScript(tokyoPage)
    await tokyoPage.clock.setFixedTime(new Date('2026-04-10T23:00:00Z'))
    await tokyoPage.goto('/')
    await waitForGameReady(tokyoPage)
    const tokyoTitle = await tokyoPage.title()
    await tokyoCtx.close()

    const laCtx = await browser.newContext({ timezoneId: 'America/Los_Angeles' })
    const laPage = await laCtx.newPage()
    await addGameInitScript(laPage)
    await laPage.clock.setFixedTime(new Date('2026-04-10T23:00:00Z'))
    await laPage.goto('/')
    await waitForGameReady(laPage)
    const laTitle = await laPage.title()
    await laCtx.close()

    // Tokyo sees April 11, LA sees April 10 — different words
    expect(tokyoTitle).toContain('2026-04-11')
    expect(laTitle).toContain('2026-04-10')
    expect(tokyoTitle).not.toBe(laTitle)
  })
})

test.describe('Daily History Migration', () => {
  test('legacy integer-key dailyHistory is migrated to date-key format', async ({ browser }) => {
    const ctx = await browser.newContext({ timezoneId: 'Asia/Tokyo' })
    const page = await ctx.newPage()
    await addGameInitScript(page)

    // Inject legacy format: integer solutionIndex keys
    // epoch = 2026-02-16, so index 0 = 2026-02-16, index 1 = 2026-02-17, etc.
    // We set clock to March so these dates are in the past
    await page.addInitScript(() => {
      const legacyHistory: Record<number, { guessCount: number; won: boolean }> = {
        0: { guessCount: 3, won: true },   // 2026-02-16
        1: { guessCount: 5, won: true },   // 2026-02-17
        2: { guessCount: 6, won: false },  // 2026-02-18
      }
      localStorage.setItem('dailyHistory', JSON.stringify(legacyHistory))
      localStorage.setItem('dailyHistoryStartIndex', '0')
    })

    await page.clock.setFixedTime(new Date('2026-03-10T06:00:00Z'))
    await page.goto('/')
    await waitForGameReady(page)

    // Check that migration happened: keys should now be date strings
    const migrated = await page.evaluate(() => {
      const raw = localStorage.getItem('dailyHistory')
      return raw ? JSON.parse(raw) : null
    })

    expect(migrated).not.toBeNull()
    expect(migrated['2026-02-16']).toEqual({ guessCount: 3, won: true })
    expect(migrated['2026-02-17']).toEqual({ guessCount: 5, won: true })
    expect(migrated['2026-02-18']).toEqual({ guessCount: 6, won: false })

    // Integer keys should be gone
    expect(migrated['0']).toBeUndefined()
    expect(migrated['1']).toBeUndefined()
    expect(migrated['2']).toBeUndefined()

    // dailyHistoryStartIndex → dailyHistoryStartDate
    const startDate = await page.evaluate(() =>
      localStorage.getItem('dailyHistoryStartDate')
    )
    expect(startDate).toBe('2026-02-16')

    const legacyStartIndex = await page.evaluate(() =>
      localStorage.getItem('dailyHistoryStartIndex')
    )
    expect(legacyStartIndex).toBeNull()

    await ctx.close()
  })

  test('migrated data displays correctly in calendar', async ({ browser }) => {
    const ctx = await browser.newContext({ timezoneId: 'Asia/Tokyo' })
    const page = await ctx.newPage()
    await addGameInitScript(page)

    // Inject legacy data for March 2026
    // epoch = 2026-02-16, index 13 = 2026-03-01, index 14 = 2026-03-02, index 15 = 2026-03-03
    await page.addInitScript(() => {
      const legacyHistory: Record<number, { guessCount: number; won: boolean }> = {
        13: { guessCount: 2, won: true },  // 2026-03-01
        14: { guessCount: 4, won: true },  // 2026-03-02
        15: { guessCount: 6, won: false }, // 2026-03-03
      }
      localStorage.setItem('dailyHistory', JSON.stringify(legacyHistory))
      localStorage.setItem('dailyHistoryStartIndex', '13')
    })

    await page.clock.setFixedTime(new Date('2026-03-10T06:00:00Z'))
    await page.goto('/')
    await waitForGameReady(page)

    // Open calendar — should show March 2026
    await page.locator('svg.h-6.w-6.cursor-pointer').nth(CALENDAR_ICON).click()
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()

    // Verify win/loss indicators rendered from migrated data
    await expect(page.locator('.bg-green-500')).toHaveCount(2)
    await expect(page.locator('.bg-green-500:has-text("2")')).toBeVisible()
    await expect(page.locator('.bg-green-500:has-text("4")')).toBeVisible()
    await expect(page.locator('.bg-purple-500')).toHaveCount(1)

    await screenshot(page, '01-migrated-calendar')
    await ctx.close()
  })

  test('already-migrated date-key data is not re-migrated', async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await addGameInitScript(page)

    // Inject already-migrated format
    await page.addInitScript(() => {
      const history = {
        '2026-03-01': { guessCount: 3, won: true },
        '2026-03-02': { guessCount: 1, won: true },
      }
      localStorage.setItem('dailyHistory', JSON.stringify(history))
      localStorage.setItem('dailyHistoryStartDate', '2026-03-01')
    })

    await page.clock.setFixedTime(new Date('2026-03-10T12:00:00'))
    await page.goto('/')
    await waitForGameReady(page)

    // Data should remain unchanged
    const data = await page.evaluate(() => {
      const raw = localStorage.getItem('dailyHistory')
      return raw ? JSON.parse(raw) : null
    })

    expect(data['2026-03-01']).toEqual({ guessCount: 3, won: true })
    expect(data['2026-03-02']).toEqual({ guessCount: 1, won: true })
    expect(Object.keys(data)).toHaveLength(2)

    await ctx.close()
  })
})
