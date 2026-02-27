import {
  test,
  expect,
  customPuzzlePath,
  getRowCells,
  waitForGameReady,
  screenshot,
} from './fixtures/game.fixture'

// Only run on mobile projects
test.describe('Mobile Responsive', () => {
  test('grid renders within mobile viewport', async ({ gamePage }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile-only')
    await gamePage.goto(customPuzzlePath('crane'))
    await waitForGameReady(gamePage)

    const cells = getRowCells(gamePage, 0)
    for (let i = 0; i < 5; i++) {
      await expect(cells.nth(i)).toBeVisible()
    }

    const gridContainer = gamePage.locator('.pb-6')
    const box = await gridContainer.boundingBox()
    expect(box).toBeTruthy()

    const viewport = gamePage.viewportSize()!
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
    await screenshot(gamePage, '01-mobile-grid-in-viewport')
  })

  test('keyboard renders all keys and is tappable', async ({ gamePage }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile-only')
    await gamePage.goto(customPuzzlePath('crane'))
    await waitForGameReady(gamePage)
    await screenshot(gamePage, '01-mobile-keyboard-initial')

    const letterKeys = 'qwertyuiopasdfghjklzxcvbnm'
    for (const ch of letterKeys) {
      await expect(
        gamePage.locator(`button:text-is("${ch}")`)
      ).toBeVisible()
    }
    await expect(
      gamePage.locator('button', { hasText: 'Enter' })
    ).toBeVisible()
    await expect(
      gamePage.locator('button', { hasText: 'Delete' })
    ).toBeVisible()

    // Tap some keys and verify input
    await gamePage.locator('button:text-is("h")').tap()
    await gamePage.locator('button:text-is("o")').tap()
    await gamePage.locator('button:text-is("u")').tap()
    await gamePage.locator('button:text-is("s")').tap()
    await gamePage.locator('button:text-is("e")').tap()

    const cells = getRowCells(gamePage, 0)
    await expect(cells.nth(0)).toContainText('h')
    await expect(cells.nth(4)).toContainText('e')
    await screenshot(gamePage, '02-mobile-keyboard-after-tap')
  })

  test('modals render within mobile viewport', async ({ gamePage }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile-only')
    await gamePage.goto('/')
    await waitForGameReady(gamePage)

    // Open info modal
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(1).click()
    await expect(gamePage.locator('text=How to play')).toBeVisible()

    // Modal panel should not overflow horizontally
    const modalPanel = gamePage.locator('.inline-block.align-bottom')
    const box = await modalPanel.boundingBox()
    expect(box).toBeTruthy()

    const viewport = gamePage.viewportSize()!
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1)
    await screenshot(gamePage, '01-mobile-modal-within-viewport')
  })

  test('header icons are accessible on mobile', async ({ gamePage }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile-only')
    await gamePage.goto('/')
    await waitForGameReady(gamePage)

    const headerIcons = gamePage.locator('.flex.w-80 svg.cursor-pointer')
    const count = await headerIcons.count()

    for (let i = 0; i < count; i++) {
      const icon = headerIcons.nth(i)
      await expect(icon).toBeVisible()
      const box = await icon.boundingBox()
      expect(box).toBeTruthy()
      expect(box!.width).toBeGreaterThanOrEqual(20)
      expect(box!.height).toBeGreaterThanOrEqual(20)
    }
    await screenshot(gamePage, '01-mobile-header-icons')
  })

  test('bottom navigation buttons are visible and tappable', async ({ gamePage }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile-only')
    await gamePage.goto('/')
    await waitForGameReady(gamePage)

    const practiceLink = gamePage.locator('a', { hasText: 'Practice' })
    const createLink = gamePage.locator('a', { hasText: 'Create' })

    await expect(practiceLink).toBeVisible()
    await expect(createLink).toBeVisible()
    await screenshot(gamePage, '01-mobile-bottom-nav')

    await practiceLink.tap()
    await expect(gamePage).toHaveURL(/\/#\/practice/)
    await screenshot(gamePage, '02-mobile-navigated-to-practice')
  })
})
