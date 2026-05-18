import {
  test,
  expect,
  customPuzzlePath,
  waitForGameReady,
  screenshot,
} from './fixtures/game.fixture'
import { test as baseTest } from '@playwright/test'

test.describe('Modals', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto('/')
    await waitForGameReady(gamePage)
  })

  test('info modal — daily mode tabs', async ({ gamePage }) => {
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(0).click()
    await expect(
      gamePage.getByRole('heading', { name: 'Information' })
    ).toBeVisible()

    // Tab 1: Daily Mode (default)
    await expect(gamePage.locator('text=Daily Mode')).toBeVisible()
    await screenshot(gamePage, '01-daily-tab-mode')

    // Tab 2: How to Play
    await gamePage.locator('button', { hasText: 'How to play' }).click()
    await expect(gamePage.locator('text=Chain Rule')).toBeVisible()
    await screenshot(gamePage, '02-daily-tab-how-to-play')

    // Tab 3: Patch Notes
    await gamePage.locator('button', { hasText: 'Patch Notes' }).click()
    await expect(gamePage.getByText('Patch Notes in Information')).toBeVisible()
    await gamePage.locator('button', { hasText: 'v1.4.0' }).click()
    await expect(gamePage.getByText('Local Timezone Reset')).toBeVisible()
    await screenshot(gamePage, '03-daily-tab-patch-notes')

    // Tab 4: About this game
    await gamePage.locator('button', { hasText: 'About this game' }).click()
    await expect(
      gamePage.locator('text=open source word guessing game')
    ).toBeVisible()
    await screenshot(gamePage, '04-daily-tab-about')

    // Close
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(
      gamePage.getByRole('heading', { name: 'Information' })
    ).not.toBeVisible()
  })

  test('info modal — practice mode tabs', async ({ gamePage }) => {
    await gamePage.goto('/#/practice')
    await waitForGameReady(gamePage)

    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(0).click()
    await expect(
      gamePage.getByRole('heading', { name: 'Information' })
    ).toBeVisible()

    // Tab 1: Practice Mode (default)
    await expect(gamePage.locator('text=Practice Mode')).toBeVisible()
    await screenshot(gamePage, '01-practice-tab-mode')

    // Tab 2: How to Play
    await gamePage.locator('button', { hasText: 'How to play' }).click()
    await expect(gamePage.locator('text=Chain Rule')).toBeVisible()
    await screenshot(gamePage, '02-practice-tab-how-to-play')

    // Tab 3: About this game
    await gamePage.locator('button', { hasText: 'About this game' }).click()
    await expect(
      gamePage.locator('text=open source word guessing game')
    ).toBeVisible()
    await screenshot(gamePage, '03-practice-tab-about')

    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
  })

  test('info modal — custom mode tabs', async ({ gamePage }) => {
    await gamePage.goto(customPuzzlePath('crane', 'Alice'))
    await waitForGameReady(gamePage)

    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(0).click()
    await expect(
      gamePage.getByRole('heading', { name: 'Information' })
    ).toBeVisible()

    // Tab 1: Custom Mode (default) — shows questioner name
    await expect(gamePage.locator('text=Custom Mode')).toBeVisible()
    await expect(gamePage.locator('text=puzzle created by Alice')).toBeVisible()
    await screenshot(gamePage, '01-custom-tab-mode')

    // Tab 2: How to Play
    await gamePage.locator('button', { hasText: 'How to play' }).click()
    await expect(gamePage.locator('text=Chain Rule')).toBeVisible()
    await screenshot(gamePage, '02-custom-tab-how-to-play')

    // Tab 3: About this game
    await gamePage.locator('button', { hasText: 'About this game' }).click()
    await expect(
      gamePage.locator('text=open source word guessing game')
    ).toBeVisible()
    await screenshot(gamePage, '03-custom-tab-about')

    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
  })

  test('info modal — create mode tabs', async ({ gamePage }) => {
    await gamePage.goto('/#/create')
    await gamePage
      .locator('button', { hasText: 'Enter' })
      .waitFor({ state: 'visible' })

    // Create page icons: info(0), rewards(1), settings(2), donate(3)
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(0).click()
    await expect(
      gamePage.getByRole('heading', { name: 'Information' })
    ).toBeVisible()

    // Tab 1: How to Create (default)
    await expect(gamePage.locator('text=How to create')).toBeVisible()
    await screenshot(gamePage, '01-create-tab-mode')

    // Tab 2: How to Play
    await gamePage.locator('button', { hasText: 'How to play' }).click()
    await expect(gamePage.locator('text=Chain Rule')).toBeVisible()
    await screenshot(gamePage, '02-create-tab-how-to-play')

    // Tab 3: About this game
    await gamePage.locator('button', { hasText: 'About this game' }).click()
    await expect(
      gamePage.locator('text=open source word guessing game')
    ).toBeVisible()
    await screenshot(gamePage, '03-create-tab-about')

    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
  })

  test('stats modal opens and closes', async ({ gamePage }) => {
    // Click stats icon (ChartBarIcon) — 2nd icon in daily mode
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(1).click()

    await expect(
      gamePage.getByRole('heading', { name: 'Records' })
    ).toBeVisible()
    await expect(gamePage.locator('text=Total tries')).toBeVisible()
    await expect(gamePage.locator('text=Success rate')).toBeVisible()
    await screenshot(gamePage, '01-stats-modal-open')

    // Close
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(
      gamePage.getByRole('heading', { name: 'Records' })
    ).not.toBeVisible()
  })

  test('dead end achievement help opens the chain rule explanation', async ({
    gamePage,
  }) => {
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()

    await gamePage.locator('button', { hasText: 'dead end' }).click()

    await expect(
      gamePage.getByRole('heading', { name: 'Rewards' })
    ).not.toBeVisible({ timeout: 1000 })
    await expect(
      gamePage.getByRole('heading', { name: 'Information' })
    ).toBeVisible({ timeout: 5000 })
    await expect(gamePage.locator('text=Chain Rule')).toBeVisible()
    await expect(
      gamePage.locator('text=no remaining guess can become the correct word')
    ).toBeVisible()
    await screenshot(gamePage, '01-dead-end-achievement-help')
  })

  test('settings modal with uppercase toggle', async ({ gamePage }) => {
    // Click settings icon (CogIcon) — 4th icon (0:info, 1:stats, 2:rewards, 3:settings)
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(3).click()

    await expect(gamePage.locator('text=Settings')).toBeVisible()
    await expect(gamePage.locator('text=Display in Uppercase')).toBeVisible()
    await screenshot(gamePage, '01-settings-modal-open')

    // Toggle uppercase on (first switch = uppercase)
    const toggle = gamePage.locator('button[role="switch"]').first()
    await toggle.click()
    await screenshot(gamePage, '02-uppercase-toggle-on')

    // Close settings
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()

    // Grid and keyboard should have uppercase class
    await expect(gamePage.locator('div.uppercase').first()).toBeVisible()
    await screenshot(gamePage, '03-uppercase-applied-to-page')

    // Reopen settings and toggle off
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(3).click()
    await gamePage.locator('button[role="switch"]').first().click()
    await screenshot(gamePage, '04-uppercase-toggle-off')
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()

    // Uppercase class should be gone
    await expect(gamePage.locator('div.uppercase').first()).not.toBeVisible()
    await screenshot(gamePage, '05-uppercase-removed-from-page')
  })

  test('uppercase setting persists across page navigation', async ({
    gamePage,
  }) => {
    // Daily: enable uppercase via settings (settings = 4th icon)
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(3).click()
    await gamePage.locator('button[role="switch"]').first().click()
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(gamePage.locator('div.uppercase').first()).toBeVisible()
    await screenshot(gamePage, '01-daily-uppercase-on')

    // Daily → Practice
    await gamePage.locator('a', { hasText: 'Practice' }).click()
    await waitForGameReady(gamePage)
    await expect(gamePage.locator('div.uppercase').first()).toBeVisible()
    await screenshot(gamePage, '02-practice-uppercase-persisted')

    // Practice → Daily
    await gamePage.locator('a', { hasText: 'Daily' }).click()
    await waitForGameReady(gamePage)
    await expect(gamePage.locator('div.uppercase').first()).toBeVisible()
    await screenshot(gamePage, '03-daily-uppercase-still-on')

    // Daily → Create
    await gamePage.locator('a', { hasText: 'Create' }).click()
    await gamePage
      .locator('button', { hasText: 'Enter' })
      .waitFor({ state: 'visible' })
    await expect(gamePage.locator('div.uppercase').first()).toBeVisible()
    await screenshot(gamePage, '04-create-uppercase-persisted')

    // Toggle off on Create page (settings = 3rd icon: info, rewards, settings)
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()
    await gamePage.locator('button[role="switch"]').first().click()
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(gamePage.locator('div.uppercase').first()).not.toBeVisible()
    await screenshot(gamePage, '05-create-uppercase-off')

    // Create → Daily
    await gamePage.locator('a', { hasText: 'Daily' }).click()
    await waitForGameReady(gamePage)
    await expect(gamePage.locator('div.uppercase').first()).not.toBeVisible()
    await screenshot(gamePage, '06-daily-uppercase-off-persisted')

    // Daily → Custom
    await gamePage.goto(customPuzzlePath('crane', 'Alice'))
    await waitForGameReady(gamePage)
    await expect(gamePage.locator('div.uppercase').first()).not.toBeVisible()
    await screenshot(gamePage, '07-custom-uppercase-off-persisted')
  })

  test('donate modal opens and closes', async ({ gamePage }) => {
    // Click donate icon (CurrencyDollarIcon) — 5th icon (0:info, 1:stats, 2:rewards, 3:settings, 4:donate)
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(4).click()

    await expect(gamePage.locator('h3:has-text("Donate")')).toBeVisible()

    // KakaoPay tab (default): QR image and payment link button
    await expect(gamePage.locator('img[alt="KakaoPay QR"]')).toBeVisible()
    await expect(
      gamePage.locator('a:has-text("Donate via KakaoPay")')
    ).toBeVisible()
    await expect(
      gamePage.locator('a:has-text("Donate via KakaoPay")')
    ).toHaveAttribute('href', 'https://qr.kakaopay.com/FE0rjwVWj41a00262')
    await screenshot(gamePage, '01-donate-modal-kakaopay')

    // Switch to Toss tab
    await gamePage.locator('button:has-text("Toss")').click()
    await expect(gamePage.locator('img[alt="Toss QR"]')).toBeVisible()
    await expect(
      gamePage.locator('a:has-text("Donate via Toss")')
    ).toBeVisible()
    await screenshot(gamePage, '02-donate-modal-toss')

    // Switch to GitHub tab
    await gamePage.locator('button:has-text("GitHub")').click()
    await expect(
      gamePage.locator('iframe[title="Sponsor Ootzk"]')
    ).toBeVisible()
    await expect(
      gamePage.locator('a:has-text("Donate via GitHub")')
    ).toBeVisible()
    await expect(
      gamePage.locator('a:has-text("Donate via GitHub")')
    ).toHaveAttribute('href', 'https://github.com/sponsors/Ootzk')
    await screenshot(gamePage, '03-donate-modal-github')

    // Close
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(gamePage.locator('h3:has-text("Donate")')).not.toBeVisible()
  })

  test('language selector in settings modal', async ({ gamePage }) => {
    // Open settings (0:info, 1:stats, 2:rewards, 3:settings)
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(3).click()
    await expect(gamePage.locator('text=Settings')).toBeVisible()

    // Language picker button should be visible with English
    await expect(gamePage.locator('button:has-text("English")')).toBeVisible()
    await screenshot(gamePage, '01-settings-language-picker')

    // Click to open language popup
    await gamePage.locator('button:has-text("English")').click()

    // Popup should show all languages
    await expect(gamePage.locator('text=한국어')).toBeVisible()
    await expect(gamePage.locator('text=日本語')).toBeVisible()
    await screenshot(gamePage, '02-settings-language-popup')

    // Close popup
    await gamePage.keyboard.press('Escape')
  })

  test('modal closes on Escape key', async ({ gamePage }) => {
    // Open info modal
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(0).click()
    await expect(
      gamePage.getByRole('heading', { name: 'Information' })
    ).toBeVisible()
    await screenshot(gamePage, '01-modal-open-before-escape')

    // Press Escape to close (HeadlessUI Dialog handles this natively)
    await gamePage.keyboard.press('Escape')
    await expect(
      gamePage.getByRole('heading', { name: 'Information' })
    ).not.toBeVisible()
    await screenshot(gamePage, '02-modal-closed-after-escape')
  })
})

// PatchNotes modal test — without the gamePage fixture (no localStorage suppression)
baseTest.describe('PatchNotes Modal', () => {
  baseTest('shows on first visit and remembers dismissal', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'en')
      // Do NOT set seenPatchNotesVersion — simulate first visit
    })

    await page.goto('/')
    await page
      .locator('button', { hasText: 'Enter' })
      .waitFor({ state: 'visible' })

    // PatchNotes modal should be open
    const patchNotesTitle = page.getByRole('heading', { name: "What's New" })
    await expect(patchNotesTitle).toBeVisible({ timeout: 5000 })
    const body1 = await page.screenshot()
    await baseTest.info().attach('01-patch-notes-first-visit', {
      body: body1,
      contentType: 'image/png',
    })

    // Close it
    await page.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(patchNotesTitle).not.toBeVisible()

    // Reload — should NOT reappear
    await page.reload()
    await page
      .locator('button', { hasText: 'Enter' })
      .waitFor({ state: 'visible' })
    await expect(patchNotesTitle).not.toBeVisible()
    const body2 = await page.screenshot()
    await baseTest.info().attach('02-patch-notes-dismissed-after-reload', {
      body: body2,
      contentType: 'image/png',
    })
  })
})
