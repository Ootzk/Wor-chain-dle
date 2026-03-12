import { Temporal } from 'temporal-polyfill'
import { test, expect, waitForGameReady, screenshot } from './fixtures/game.fixture'
import { Page } from '@playwright/test'

/** Format a date key as "yyyy-mm-dd" */
const toDateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/** Inject fake dailyHistory into localStorage and reload */
async function injectHistory(
  page: Page,
  entries: { y: number; m: number; d: number; guessCount: number; won: boolean }[]
) {
  const history: Record<string, { guessCount: number; won: boolean }> = {}
  let minKey = ''
  for (const e of entries) {
    const key = toDateKey(e.y, e.m, e.d)
    history[key] = { guessCount: e.guessCount, won: e.won }
    if (!minKey || key < minKey) minKey = key
  }
  await page.evaluate(
    ({ h, sd }) => {
      localStorage.setItem('dailyHistory', JSON.stringify(h))
      localStorage.setItem('dailyHistoryStartDate', sd)
    },
    { h: history, sd: minKey }
  )
  await page.reload()
  await waitForGameReady(page)
}

// Daily mode header icons:
// 0:Info  1:Stats  2:Settings  3:Donate
const STATS_ICON = 1
const SETTINGS_ICON = 2

/** Open the Stats modal and switch to the Calendar tab */
async function openCalendarTab(page: Page) {
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(STATS_ICON).click()
  await page.locator('button', { hasText: 'Calendar' }).click()
}

test.describe('Calendar', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto('/')
    await waitForGameReady(gamePage)
  })

  test('calendar tab opens and shows current month', async ({ gamePage }) => {
    await openCalendarTab(gamePage)

    // Current month label (e.g. "March 2026") — uses local time
    const today = Temporal.Now.plainDateISO()
    const firstOfMonth = today.with({ day: 1 })
    const monthLabel = firstOfMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    await expect(gamePage.locator(`text=${monthLabel}`)).toBeVisible()

    // Weekday header — Sunday start by default
    const weekdayHeaders = gamePage.locator('.w-10.text-center.text-xs.font-medium')
    await expect(weekdayHeaders).toHaveCount(7)
    await expect(weekdayHeaders.first()).toHaveText('Su')
    await expect(weekdayHeaders.last()).toHaveText('Sa')

    // Streak display
    await expect(gamePage.locator('text=🔥')).toBeVisible()

    // Share month button
    await expect(gamePage.locator('button', { hasText: 'Share month' })).toBeVisible()

    await screenshot(gamePage, '01-calendar-tab')

    // Close via Escape
    await gamePage.keyboard.press('Escape')
    await expect(gamePage.getByRole('heading', { name: 'Statistics' })).not.toBeVisible()
  })

  test('displays win and loss indicators', async ({ gamePage }) => {
    const today = Temporal.Now.plainDateISO()
    const y = today.year
    const m = today.month - 1 // 0-indexed for toDateKey

    await injectHistory(gamePage, [
      { y, m, d: 1, guessCount: 3, won: true },
      { y, m, d: 2, guessCount: 1, won: true },
      { y, m, d: 3, guessCount: 6, won: false },
    ])

    await openCalendarTab(gamePage)

    // Green circles (wins) with guess counts
    await expect(gamePage.locator('.bg-green-500')).toHaveCount(2)
    await expect(gamePage.locator('.bg-green-500:has-text("3")')).toBeVisible()
    await expect(gamePage.locator('.bg-green-500:has-text("1")')).toBeVisible()

    // Purple circle (loss)
    await expect(gamePage.locator('.bg-purple-500')).toHaveCount(1)

    await screenshot(gamePage, '01-calendar-indicators')
  })

  test('month navigation', async ({ gamePage }) => {
    await openCalendarTab(gamePage)

    const today = Temporal.Now.plainDateISO()
    const firstOfMonth = today.with({ day: 1 })
    const currentLabel = firstOfMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    await expect(gamePage.locator(`text=${currentLabel}`)).toBeVisible()

    // Today button disabled on current month
    const todayBtn = gamePage.locator('button[title="Today"]')
    await expect(todayBtn).toBeDisabled()

    // Navigate back (ChevronLeftIcon = first h-5 w-5 svg)
    await gamePage.locator('svg.h-5.w-5').first().click()
    await expect(gamePage.locator(`text=${currentLabel}`)).not.toBeVisible()
    await expect(todayBtn).toBeEnabled()
    await screenshot(gamePage, '01-prev-month')

    // Click Today to return
    await todayBtn.click()
    await expect(gamePage.locator(`text=${currentLabel}`)).toBeVisible()
    await expect(todayBtn).toBeDisabled()
    await screenshot(gamePage, '02-back-to-current')
  })

  test('week starts on Monday setting', async ({ gamePage }) => {
    // Open calendar tab — default Sunday start
    await openCalendarTab(gamePage)
    const weekdayHeaders = gamePage.locator('.w-10.text-center.text-xs.font-medium')
    await expect(weekdayHeaders.first()).toHaveText('Su')
    await screenshot(gamePage, '01-sunday-start')
    await gamePage.keyboard.press('Escape')

    // Enable weekStartsOnMonday in settings (2nd toggle)
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(SETTINGS_ICON).click()
    await expect(gamePage.locator('text=Start Week on Monday')).toBeVisible()
    await gamePage.locator('button[role="switch"]').nth(1).click()
    await gamePage.keyboard.press('Escape')

    // Reopen calendar tab — Monday start
    await openCalendarTab(gamePage)
    await expect(weekdayHeaders.first()).toHaveText('Mo')
    await expect(weekdayHeaders.last()).toHaveText('Su')
    await screenshot(gamePage, '02-monday-start')
  })

  test('share button disabled without data, enabled with data', async ({ gamePage }) => {
    await openCalendarTab(gamePage)
    const shareBtn = gamePage.locator('button', { hasText: 'Share month' })

    // No data → disabled
    await expect(shareBtn).toBeDisabled()
    await expect(shareBtn).toHaveClass(/bg-gray-300/)
    await screenshot(gamePage, '01-share-disabled')
    await gamePage.keyboard.press('Escape')

    // Inject data and reopen
    const today = Temporal.Now.plainDateISO()
    await injectHistory(gamePage, [
      { y: today.year, m: today.month - 1, d: 1, guessCount: 4, won: true },
    ])
    await openCalendarTab(gamePage)

    // Data present → enabled
    await expect(shareBtn).toBeEnabled()
    await expect(shareBtn).toHaveClass(/bg-indigo-600/)

    // Click share → success alert
    await shareBtn.click()
    await expect(gamePage.locator('text=Calendar copied to clipboard')).toBeVisible()
    await screenshot(gamePage, '02-share-enabled-and-copied')
  })

  test('stats icon visible in daily, hidden in practice (no calendar tab)', async ({ gamePage }) => {
    // Daily: 4 icons (info, stats, settings, donate)
    await expect(gamePage.locator('svg.h-6.w-6.cursor-pointer')).toHaveCount(4)

    // Practice: 3 icons (no stats)
    await gamePage.goto('/#/practice')
    await waitForGameReady(gamePage)
    await expect(gamePage.locator('svg.h-6.w-6.cursor-pointer')).toHaveCount(3)
    await screenshot(gamePage, '01-no-stats-in-practice')
  })
})
