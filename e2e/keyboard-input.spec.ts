import {
  test,
  expect,
  customPuzzlePath,
  typeWord,
  getRowCells,
  waitForGameReady,
  screenshot,
} from './fixtures/game.fixture'

test.describe('Keyboard Input', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto(customPuzzlePath('crane'))
    await waitForGameReady(gamePage)
  })

  test('physical keyboard types letters into cells', async ({ gamePage }) => {
    await typeWord(gamePage, 'house')

    const cells = getRowCells(gamePage, 0)
    await expect(cells.nth(0)).toContainText('h')
    await expect(cells.nth(1)).toContainText('o')
    await expect(cells.nth(2)).toContainText('u')
    await expect(cells.nth(3)).toContainText('s')
    await expect(cells.nth(4)).toContainText('e')
    await screenshot(gamePage, '01-physical-keyboard-typed-house')
  })

  test('physical keyboard backspace removes last letter', async ({ gamePage }) => {
    await typeWord(gamePage, 'hou')
    await screenshot(gamePage, '01-before-backspace')
    await gamePage.keyboard.press('Backspace')

    const cells = getRowCells(gamePage, 0)
    await expect(cells.nth(0)).toContainText('h')
    await expect(cells.nth(1)).toContainText('o')
    await expect(cells.nth(2)).toHaveText('')
    await screenshot(gamePage, '02-after-backspace')
  })

  test('physical keyboard enter submits guess', async ({ gamePage }) => {
    await typeWord(gamePage, 'stale')
    await screenshot(gamePage, '01-before-enter')
    await gamePage.keyboard.press('Enter')

    // After submit, row 0 should be completed (cells have status colors)
    const cells = getRowCells(gamePage, 0)
    const firstCell = cells.nth(0)
    await expect(firstCell).toHaveClass(/bg-(green|purple|slate)-/)
    await screenshot(gamePage, '02-after-submit-with-colors')
  })

  test('on-screen keyboard types letters', async ({ gamePage }) => {
    // Click letter buttons on the on-screen keyboard
    for (const ch of 'house') {
      await gamePage.locator(`button:text-is("${ch}")`).click()
    }

    const cells = getRowCells(gamePage, 0)
    await expect(cells.nth(0)).toContainText('h')
    await expect(cells.nth(4)).toContainText('e')
    await screenshot(gamePage, '01-on-screen-keyboard-typed-house')
  })

  test('on-screen Delete removes last letter', async ({ gamePage }) => {
    for (const ch of 'hou') {
      await gamePage.locator(`button:text-is("${ch}")`).click()
    }
    await screenshot(gamePage, '01-before-delete')
    await gamePage.locator('button', { hasText: 'Delete' }).click()

    const cells = getRowCells(gamePage, 0)
    await expect(cells.nth(2)).toHaveText('')
    await screenshot(gamePage, '02-after-delete')
  })

  test('on-screen Enter submits guess', async ({ gamePage }) => {
    for (const ch of 'stale') {
      await gamePage.locator(`button:text-is("${ch}")`).click()
    }
    await screenshot(gamePage, '01-on-screen-before-enter')
    await gamePage.locator('button', { hasText: 'Enter' }).click()

    const cells = getRowCells(gamePage, 0)
    await expect(cells.nth(0)).toHaveClass(/bg-(green|purple|slate)-/)
    await screenshot(gamePage, '02-on-screen-after-submit')
  })

  test('keyboard colors update after guess', async ({ gamePage }) => {
    // "crane" is the solution → all letters correct
    await typeWord(gamePage, 'crane')
    await gamePage.keyboard.press('Enter')

    // The 'c' key should turn green
    const cKey = gamePage.locator('button:text-is("c")')
    await expect(cKey).toHaveClass(/bg-green-500/)
    await screenshot(gamePage, '01-keyboard-keys-turned-green')
  })

  test('input blocked after game won', async ({ gamePage }) => {
    // Win the game
    await typeWord(gamePage, 'crane')
    await gamePage.keyboard.press('Enter')
    await screenshot(gamePage, '01-game-won')

    // Try to type more letters
    await typeWord(gamePage, 'house')

    // Row 1 (second row) should still be empty
    const cells = getRowCells(gamePage, 1)
    await expect(cells.nth(0)).toHaveText('')
    await screenshot(gamePage, '02-input-blocked-after-win')
  })
})
