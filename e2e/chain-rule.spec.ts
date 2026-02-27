import {
  test,
  expect,
  customPuzzlePath,
  submitWord,
  getRowCells,
  waitForGameReady,
  screenshot,
} from './fixtures/game.fixture'

test.describe('Chain Rule', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto(customPuzzlePath('crane'))
    await waitForGameReady(gamePage)
  })

  test('first guess has no chain constraint (5 editable cells)', async ({ gamePage }) => {
    const cells = getRowCells(gamePage, 0)
    // All 5 cells should be empty and editable (no locked styling)
    for (let i = 0; i < 5; i++) {
      await expect(cells.nth(i)).not.toHaveClass(/bg-slate-100/)
    }
    await screenshot(gamePage, '01-first-row-no-chain')
  })

  test('second row locks last cell with chain letter', async ({ gamePage }) => {
    // Guess 1: "stale" → last letter 'e'
    await submitWord(gamePage, 'stale')
    await screenshot(gamePage, '01-after-first-guess')

    // Row 1 (second row): last cell should show chain letter 'e' with chain visual
    const cells = getRowCells(gamePage, 1)
    const lastCell = cells.nth(4)
    await expect(lastCell).toContainText('e')
    // Chain cell has chainTop styling (border-t-0)
    await expect(lastCell).toHaveClass(/border-t-0/)
    await screenshot(gamePage, '02-second-row-chain-locked-right')
  })

  test('third row locks first cell with chain letter', async ({ gamePage }) => {
    // Guess 1: "stale" → chains 'e' to last pos of guess 2
    await submitWord(gamePage, 'stale')
    // Guess 2: type 4 chars, full guess ends with 'e': "blaze"
    await submitWord(gamePage, 'blaz')
    await screenshot(gamePage, '01-after-two-guesses')

    // Row 2 (third row): first cell should show chain letter 'b' with chain visual
    const cells = getRowCells(gamePage, 2)
    const firstCell = cells.nth(0)
    await expect(firstCell).toContainText('b')
    await expect(firstCell).toHaveClass(/border-t-0/)
    await screenshot(gamePage, '02-third-row-chain-locked-left')
  })

  test('chain alternates right-left-right pattern', async ({ gamePage }) => {
    // Guess 1: "stale" → chain right (e)
    await submitWord(gamePage, 'stale')

    // Row 1: last cell has chain letter (right chain)
    let cells = getRowCells(gamePage, 1)
    await expect(cells.nth(4)).toContainText('e')
    await expect(cells.nth(4)).toHaveClass(/border-t-0/)
    await screenshot(gamePage, '01-chain-right-e')

    // Guess 2: "blaze" → chain left (b)
    await submitWord(gamePage, 'blaz')

    // Row 2: first cell has chain letter (left chain)
    cells = getRowCells(gamePage, 2)
    await expect(cells.nth(0)).toContainText('b')
    await expect(cells.nth(0)).toHaveClass(/border-t-0/)
    await screenshot(gamePage, '02-chain-left-b')

    // Guess 3: "boost" (starts with b) → chain right (t)
    await submitWord(gamePage, 'oost')

    // Row 3: last cell has chain letter (right chain)
    cells = getRowCells(gamePage, 3)
    await expect(cells.nth(4)).toContainText('t')
    await expect(cells.nth(4)).toHaveClass(/border-t-0/)
    await screenshot(gamePage, '03-chain-right-t')
  })

  test('ChainBridge renders between rows', async ({ gamePage }) => {
    await submitWord(gamePage, 'stale')

    // ChainBridge is the element between row 0 and row 1
    // Bridge at index 0: nth-child(2) in the grid container
    const bridge = gamePage.locator('.pb-6 > :nth-child(2)')
    await expect(bridge).toBeVisible()

    // The bridge should have a cell with chain border at the correct index
    // Row 0→1 chains from right (index 4), so the 5th bridge cell has borders
    const bridgeCell = bridge.locator('div').nth(4)
    await expect(bridgeCell).toHaveClass(/border-l-2/)
    await expect(bridgeCell).toHaveClass(/border-r-2/)
    await screenshot(gamePage, '01-chain-bridge-between-rows')
  })

  test('chain letter inherits color from previous guess', async ({ gamePage }) => {
    // Solution: "crane". Guess "stale" → 'e' is correct (position 4)
    // Chain letter 'e' in row 1 should inherit green status
    await submitWord(gamePage, 'stale')

    const cells = getRowCells(gamePage, 1)
    const lastCell = cells.nth(4)
    // 'e' was correct in guess 1 → locked cell should show green
    await expect(lastCell).toHaveClass(/bg-green-500/)
    await screenshot(gamePage, '01-chain-letter-inherits-green')
  })

  test('dead end triggers early loss', async ({ gamePage }) => {
    // Solution: "crane". We need to create a dead end.
    // Guess 1: "stale" → chain 'e' right
    await submitWord(gamePage, 'stale')
    await screenshot(gamePage, '01-dead-end-guess1')
    // Guess 2: "blaze" → chain 'b' left
    await submitWord(gamePage, 'blaz')
    await screenshot(gamePage, '02-dead-end-guess2')
    // Guess 3: "boost" → chain 't' right
    await submitWord(gamePage, 'oost')
    await screenshot(gamePage, '03-dead-end-guess3')
    // Guess 4: "first" → chain 'f' left
    await submitWord(gamePage, 'firs')
    await screenshot(gamePage, '04-dead-end-guess4')
    // Guess 5: "flood" → chain 'd' right
    // After guess 5, chain letter is 'd' at position 4.
    // Solution[4] = 'e'. 'd' !== 'e' → dead end!
    await submitWord(gamePage, 'lood')
    await screenshot(gamePage, '05-dead-end-guess5-triggers-loss')

    // Game should end with loss
    await expect(
      gamePage.locator('text=The word was crane')
    ).toBeVisible({ timeout: 3000 })
    await screenshot(gamePage, '06-dead-end-solution-revealed')
  })
})
