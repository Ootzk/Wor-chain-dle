import {
  test,
  expect,
  customPuzzlePath,
  submitWord,
  waitForGameReady,
  screenshot,
} from './fixtures/game.fixture'

// Clipboard read only works reliably on Chromium
test.describe('Share — Exclude URL setting', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Clipboard API requires Chromium'
  )

  const SETTINGS_ICON_DAILY = 2 // 0:info, 1:stats, 2:settings

  /** Grant clipboard permissions and navigate to a custom puzzle */
  async function setupCustomGame(gamePage: import('@playwright/test').Page) {
    await gamePage.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await gamePage.goto(customPuzzlePath('crane'))
    await waitForGameReady(gamePage)
  }

  /** Win the game by typing the correct word, wait for stats modal */
  async function winGame(gamePage: import('@playwright/test').Page) {
    await submitWord(gamePage, 'crane')
    await expect(gamePage.getByRole('heading', { name: 'Records' })).toBeVisible({ timeout: 5000 })
  }

  /** Click the Share button in the stats modal and read clipboard */
  async function clickShareAndReadClipboard(gamePage: import('@playwright/test').Page): Promise<string> {
    await gamePage.getByRole('button', { name: 'Share My Result' }).click()
    await expect(gamePage.locator('text=Game copied to clipboard')).toBeVisible({ timeout: 3000 })
    return gamePage.evaluate(() => navigator.clipboard.readText())
  }

  /** Toggle the Exclude URL setting on/off */
  async function toggleExcludeUrl(gamePage: import('@playwright/test').Page) {
    // Custom mode: 0:info, 1:settings, 2:donate
    const settingsIndex = 1
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(settingsIndex).click()
    await expect(gamePage.locator('text=Settings')).toBeVisible()
    // Exclude URL is the 3rd toggle (0:uppercase, 1:weekStart, 2:excludeUrl)
    await gamePage.locator('button[role="switch"]').nth(2).click()
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(gamePage.locator('text=Settings')).not.toBeVisible()
  }

  test('default (excludeUrl off): shared text includes URL', async ({ gamePage }) => {
    await setupCustomGame(gamePage)
    await winGame(gamePage)
    await screenshot(gamePage, '01-stats-modal-default')

    const clipboard = await clickShareAndReadClipboard(gamePage)
    await screenshot(gamePage, '02-share-copied-default')

    expect(clipboard).toContain('Wor🔗dle Custom/test')
    expect(clipboard).toContain('localhost')
    expect(clipboard).toMatch(/\n\n.*localhost/)
  })

  test('excludeUrl on: shared text does NOT include URL', async ({ gamePage }) => {
    await setupCustomGame(gamePage)

    // Enable Exclude URL before playing
    await toggleExcludeUrl(gamePage)
    await screenshot(gamePage, '01-exclude-url-enabled')

    await winGame(gamePage)
    await screenshot(gamePage, '02-stats-modal-exclude-url')

    const clipboard = await clickShareAndReadClipboard(gamePage)
    await screenshot(gamePage, '03-share-copied-no-url')

    expect(clipboard).toContain('Wor🔗dle Custom/test')
    expect(clipboard).not.toContain('localhost')
  })

  test('setting persists after page reload', async ({ gamePage }) => {
    await gamePage.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await gamePage.goto('/')
    await waitForGameReady(gamePage)

    // Enable Exclude URL on daily page
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(SETTINGS_ICON_DAILY).click()
    await expect(gamePage.locator('text=Settings')).toBeVisible()
    const excludeToggle = gamePage.locator('button[role="switch"]').nth(2)
    await expect(excludeToggle).toHaveAttribute('aria-checked', 'false')
    await excludeToggle.click()
    await expect(excludeToggle).toHaveAttribute('aria-checked', 'true')
    await screenshot(gamePage, '01-exclude-url-toggled-on')
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()

    // Reload
    await gamePage.reload()
    await waitForGameReady(gamePage)

    // Reopen settings — toggle should still be on
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(SETTINGS_ICON_DAILY).click()
    await expect(gamePage.locator('text=Settings')).toBeVisible()
    const toggleAfter = gamePage.locator('button[role="switch"]').nth(2)
    await expect(toggleAfter).toHaveAttribute('aria-checked', 'true')
    await screenshot(gamePage, '02-exclude-url-persisted-after-reload')
  })
})
