import { test, expect, customPuzzlePath, waitForGameReady, screenshot } from './fixtures/game.fixture'

test.describe('Navigation', () => {
  test('daily page renders with date subtitle', async ({ gamePage }) => {
    await gamePage.goto('/')
    await waitForGameReady(gamePage)

    await expect(gamePage.locator('h1')).toContainText('Wor')
    await expect(gamePage.locator('h1')).toContainText('dle')
    // Date in yyyy-mm-dd format
    await expect(gamePage.locator('text=/\\d{4}-\\d{2}-\\d{2}/')).toBeVisible()
    await screenshot(gamePage, '01-daily-page')
  })

  test('practice page shows Practice subtitle', async ({ gamePage }) => {
    await gamePage.goto('/#/practice')
    await waitForGameReady(gamePage)

    await expect(gamePage.locator('text=Practice')).toBeVisible()
    await screenshot(gamePage, '01-practice-page')
  })

  test('navigate from daily to practice via bottom button', async ({ gamePage }) => {
    await gamePage.goto('/')
    await waitForGameReady(gamePage)
    await screenshot(gamePage, '01-daily-before-navigate')

    await gamePage.locator('a', { hasText: 'Practice' }).click()
    await expect(gamePage).toHaveURL(/\/#\/practice/)
    await expect(gamePage.locator('text=Practice')).toBeVisible()
    await screenshot(gamePage, '02-practice-after-navigate')
  })

  test('navigate from practice to daily via bottom button', async ({ gamePage }) => {
    await gamePage.goto('/#/practice')
    await waitForGameReady(gamePage)
    await screenshot(gamePage, '01-practice-before-navigate')

    await gamePage.locator('a', { hasText: 'Daily' }).click()
    await expect(gamePage).toHaveURL(/\/#\/$/)
    await screenshot(gamePage, '02-daily-after-navigate')
  })

  test('create puzzle page renders', async ({ gamePage }) => {
    await gamePage.goto('/#/create')
    await waitForGameReady(gamePage)

    await expect(gamePage.locator('p.text-green-500', { hasText: 'Create' })).toBeVisible()
    await expect(gamePage.locator('input[placeholder="Enter your name"]')).toBeVisible()
    await screenshot(gamePage, '01-create-puzzle-page')
  })

  test('navigate from daily to create via bottom button', async ({ gamePage }) => {
    await gamePage.goto('/')
    await waitForGameReady(gamePage)

    await gamePage.locator('a', { hasText: 'Create' }).click()
    await expect(gamePage).toHaveURL(/\/#\/create/)
    await screenshot(gamePage, '01-create-page-after-navigate')
  })

  test('custom puzzle page shows questioner name', async ({ gamePage }) => {
    await gamePage.goto(customPuzzlePath('crane', 'Alice'))
    await waitForGameReady(gamePage)

    await expect(gamePage.locator('text=Custom')).toBeVisible()
    await expect(gamePage.locator('text=Alice')).toBeVisible()
    await screenshot(gamePage, '01-custom-puzzle-alice')
  })

  test('invalid custom puzzle redirects to daily', async ({ gamePage }) => {
    await gamePage.goto('/#/custom/invalidcode')
    await waitForGameReady(gamePage)

    // Should redirect to daily page
    await expect(gamePage).toHaveURL(/\/#\/$/)
    await screenshot(gamePage, '01-redirected-to-daily')
  })

  test('stats icon visible on daily, hidden on practice', async ({ gamePage }) => {
    // Daily: stats icon visible
    await gamePage.goto('/')
    await waitForGameReady(gamePage)
    const statsIcon = gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2)
    await expect(statsIcon).toBeVisible()
    await screenshot(gamePage, '01-daily-with-stats-icon')

    // Practice: stats icon hidden (only 4 icons instead of 5)
    await gamePage.goto('/#/practice')
    await waitForGameReady(gamePage)
    // In practice mode, ChartBarIcon is not rendered
    // Count cursor-pointer SVG icons in header
    const headerIcons = gamePage.locator('.flex.w-80 svg.cursor-pointer')
    const count = await headerIcons.count()
    // Daily has: translate, info, stats, settings, donate (5)
    // Practice has: translate, info, settings, donate (4)
    expect(count).toBeLessThan(5)
    await screenshot(gamePage, '02-practice-without-stats-icon')
  })
})
