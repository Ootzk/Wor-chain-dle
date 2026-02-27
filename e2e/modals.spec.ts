import { test, expect, waitForGameReady, screenshot } from './fixtures/game.fixture'
import { test as baseTest } from '@playwright/test'

test.describe('Modals', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto('/')
    await waitForGameReady(gamePage)
  })

  test('info modal opens and closes', async ({ gamePage }) => {
    // Click info icon (InformationCircleIcon)
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(1).click()

    await expect(gamePage.locator('text=How to play')).toBeVisible()
    await expect(gamePage.locator('text=Chain Rule')).toBeVisible()
    await screenshot(gamePage, '01-info-modal-open')

    // Close via X button
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(gamePage.locator('text=How to play')).not.toBeVisible()
    await screenshot(gamePage, '02-info-modal-closed')
  })

  test('stats modal opens and closes', async ({ gamePage }) => {
    // Click stats icon (ChartBarIcon) — 3rd icon in daily mode
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()

    await expect(gamePage.locator('text=Statistics')).toBeVisible()
    await expect(gamePage.locator('text=Total tries')).toBeVisible()
    await expect(gamePage.locator('text=Success rate')).toBeVisible()
    await screenshot(gamePage, '01-stats-modal-open')

    // Close
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(gamePage.locator('text=Statistics')).not.toBeVisible()
  })

  test('settings modal with uppercase toggle', async ({ gamePage }) => {
    // Click settings icon (CogIcon) — 4th icon
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(3).click()

    await expect(gamePage.locator('text=Settings')).toBeVisible()
    await expect(gamePage.locator('text=Uppercase Letters')).toBeVisible()
    await screenshot(gamePage, '01-settings-modal-open')

    // Toggle uppercase on
    const toggle = gamePage.locator('button[role="switch"]')
    await toggle.click()
    await screenshot(gamePage, '02-uppercase-toggle-on')

    // Close settings
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()

    // Grid and keyboard should have uppercase class
    await expect(gamePage.locator('.uppercase')).toBeVisible()
    await screenshot(gamePage, '03-uppercase-applied-to-page')

    // Reopen settings and toggle off
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(3).click()
    await gamePage.locator('button[role="switch"]').click()
    await screenshot(gamePage, '04-uppercase-toggle-off')
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()

    // Uppercase class should be gone
    await expect(gamePage.locator('.uppercase')).not.toBeVisible()
    await screenshot(gamePage, '05-uppercase-removed-from-page')
  })

  test('donate modal opens and closes', async ({ gamePage }) => {
    // Click donate icon (CurrencyDollarIcon) — 5th icon
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(4).click()

    await expect(gamePage.locator('text=Donate')).toBeVisible()

    // KakaoPay tab (default): QR image and payment link button
    await expect(gamePage.locator('img[alt="KakaoPay QR"]')).toBeVisible()
    await expect(gamePage.locator('a:has-text("Pay with KakaoPay")')).toBeVisible()
    await expect(gamePage.locator('a:has-text("Pay with KakaoPay")')).toHaveAttribute(
      'href',
      'https://qr.kakaopay.com/FE0rjwVWj41a00262'
    )
    await screenshot(gamePage, '01-donate-modal-kakaopay')

    // Switch to Toss tab
    await gamePage.locator('button:has-text("Toss")').click()
    await expect(gamePage.locator('img[alt="Toss QR"]')).toBeVisible()
    await expect(gamePage.locator('a:has-text("Pay with Toss")')).toBeVisible()
    await screenshot(gamePage, '02-donate-modal-toss')

    // Close
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(gamePage.locator('text=Donate')).not.toBeVisible()
  })

  test('about modal opens via bottom button', async ({ gamePage }) => {
    await gamePage.locator('button', { hasText: 'About this game' }).click()

    await expect(gamePage.locator('h3:has-text("About")')).toBeVisible()
    await screenshot(gamePage, '01-about-modal-open')

    // Close
    await gamePage.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
  })

  test('modal closes on Escape key', async ({ gamePage }) => {
    // Open info modal
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(1).click()
    await expect(gamePage.locator('text=How to play')).toBeVisible()
    await screenshot(gamePage, '01-modal-open-before-escape')

    // Press Escape to close (HeadlessUI Dialog handles this natively)
    await gamePage.keyboard.press('Escape')
    await expect(gamePage.locator('text=How to play')).not.toBeVisible()
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
    await page.locator('button', { hasText: 'Enter' }).waitFor({ state: 'visible' })

    // PatchNotes modal should be open
    await expect(page.locator("text=What's New")).toBeVisible({ timeout: 5000 })
    const body1 = await page.screenshot()
    await baseTest.info().attach('01-patch-notes-first-visit', { body: body1, contentType: 'image/png' })

    // Close it
    await page.locator('svg.h-6.w-6.cursor-pointer >> nth=-1').click()
    await expect(page.locator("text=What's New")).not.toBeVisible()

    // Reload — should NOT reappear
    await page.reload()
    await page.locator('button', { hasText: 'Enter' }).waitFor({ state: 'visible' })
    await expect(page.locator("text=What's New")).not.toBeVisible()
    const body2 = await page.screenshot()
    await baseTest.info().attach('02-patch-notes-dismissed-after-reload', { body: body2, contentType: 'image/png' })
  })
})
