import {
  test,
  expect,
  customPuzzlePath,
  typeWord,
  submitWord,
  getRowCells,
  waitForGameReady,
  screenshot,
} from './fixtures/game.fixture'

test.describe('Game Flow', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto(customPuzzlePath('crane'))
    await waitForGameReady(gamePage)
  })

  test('win by typing correct word', async ({ gamePage }) => {
    await screenshot(gamePage, '01-initial-board')
    await submitWord(gamePage, 'crane')

    // All 5 cells in row 0 should be green
    const cells = getRowCells(gamePage, 0)
    for (let i = 0; i < 5; i++) {
      await expect(cells.nth(i)).toHaveClass(/bg-green-500/)
    }
    await screenshot(gamePage, '02-all-green-cells')

    // Success alert appears
    await expect(
      gamePage.locator('.bg-green-200')
    ).toBeVisible({ timeout: 3000 })
    await screenshot(gamePage, '03-success-alert')

    // Stats modal opens after alert
    await expect(
      gamePage.getByRole('heading', { name: 'Records' })
    ).toBeVisible({ timeout: 5000 })
    await screenshot(gamePage, '04-stats-modal-after-win')
  })

  test('not enough letters alert', async ({ gamePage }) => {
    await typeWord(gamePage, 'cra')
    await screenshot(gamePage, '01-three-letters-typed')
    await gamePage.keyboard.press('Enter')

    await expect(
      gamePage.locator('text=Not enough letters')
    ).toBeVisible({ timeout: 3000 })
    await screenshot(gamePage, '02-not-enough-letters-alert')
  })

  test('word not found alert', async ({ gamePage }) => {
    await typeWord(gamePage, 'zzzzz')
    await screenshot(gamePage, '01-invalid-word-typed')
    await gamePage.keyboard.press('Enter')

    await expect(
      gamePage.locator('text=Word not found')
    ).toBeVisible({ timeout: 3000 })
    await screenshot(gamePage, '02-word-not-found-alert')
  })

  test('cell colors reflect guess accuracy', async ({ gamePage }) => {
    // Solution is "crane" (c-r-a-n-e)
    // Guess "trace": t=absent, r=correct, a=correct, c=present, e=correct
    await submitWord(gamePage, 'trace')

    const cells = getRowCells(gamePage, 0)
    // t is NOT in "crane" → absent (slate)
    await expect(cells.nth(0)).toHaveClass(/bg-slate-400/)
    // r is at position 1 in "crane" → correct (green)
    await expect(cells.nth(1)).toHaveClass(/bg-green-500/)
    // a is at position 2 in "crane" → correct (green)
    await expect(cells.nth(2)).toHaveClass(/bg-green-500/)
    // c is in "crane" at position 0, not position 3 → present (purple)
    await expect(cells.nth(3)).toHaveClass(/bg-purple-500/)
    // e is at position 4 in "crane" → correct (green)
    await expect(cells.nth(4)).toHaveClass(/bg-green-500/)

    await screenshot(gamePage, '01-cell-colors-trace-vs-crane')
  })

  test('lose after 6 wrong guesses shows solution', async ({ gamePage }) => {
    // Solution: "crane". Need 6 wrong guesses that respect chain rules.
    // Guess 1: "stale" (no chain constraint)
    await submitWord(gamePage, 'stale')
    await screenshot(gamePage, '01-guess1-stale')
    // Guess 2: chains from 'e' (last of guess 1) at last position → type 4 chars
    // Full guess needs to end with 'e': type "blaz" → "blaze"
    await submitWord(gamePage, 'blaz')
    await screenshot(gamePage, '02-guess2-blaze')
    // Guess 3: chains from 'b' (first of guess 2) at first position → type 4 chars
    // Full guess starts with 'b': type "oost" → "boost"
    await submitWord(gamePage, 'oost')
    await screenshot(gamePage, '03-guess3-boost')
    // Guess 4: chains from 't' (last of guess 3) at last position → type 4 chars
    // Full guess ends with 't': type "firs" → "first"
    await submitWord(gamePage, 'firs')
    await screenshot(gamePage, '04-guess4-first')
    // Guess 5: chains from 'f' (first of guess 4) at first position → type 4 chars
    // Full guess starts with 'f': type "lood" → "flood"
    await submitWord(gamePage, 'lood')
    await screenshot(gamePage, '05-guess5-flood')

    // After guess 5, check for dead end or guess 6
    // Guess 6: chains from 'd' (last of guess 5) at last position → type 4 chars
    // Full guess ends with 'd': type "moun" → "mound"
    await submitWord(gamePage, 'moun')
    await screenshot(gamePage, '06-guess6-mound')

    // Solution alert should appear
    await expect(
      gamePage.locator('text=The word was crane')
    ).toBeVisible({ timeout: 3000 })
    await screenshot(gamePage, '07-solution-revealed')

    // Stats modal opens
    await expect(
      gamePage.getByRole('heading', { name: 'Records' })
    ).toBeVisible({ timeout: 5000 })
    await screenshot(gamePage, '08-stats-modal-after-loss')
  })

  test('game state persists on reload in daily mode', async ({ gamePage }) => {
    // Switch to daily mode
    await gamePage.goto('/')
    await waitForGameReady(gamePage)

    // Type and submit a guess
    await submitWord(gamePage, 'stale')

    // Verify the guess is shown
    const cells = getRowCells(gamePage, 0)
    await expect(cells.nth(0)).toHaveClass(/bg-(green|purple|slate)-/)
    await screenshot(gamePage, '01-guess-before-reload')

    // Reload
    await gamePage.reload()
    await waitForGameReady(gamePage)

    // The guess should still be visible
    const cellsAfter = getRowCells(gamePage, 0)
    await expect(cellsAfter.nth(0)).toHaveClass(/bg-(green|purple|slate)-/)
    await screenshot(gamePage, '02-guess-after-reload')
  })
})
