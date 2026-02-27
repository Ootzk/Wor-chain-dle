import { test as base, expect, Page } from '@playwright/test'

/** Encode a custom puzzle URL (mirrors src/lib/customPuzzle.ts) */
export function encodeCustomPuzzle(word: string, questioner: string): string {
  const text = `${word}_${questioner}`
  const binary = Array.from(Buffer.from(text, 'utf-8'), (b) =>
    String.fromCharCode(b)
  ).join('')
  let base64 = Buffer.from(binary, 'binary').toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Build a custom puzzle hash path */
export function customPuzzlePath(word: string, questioner = 'test'): string {
  return `/#/custom/${encodeCustomPuzzle(word, questioner)}`
}

type GameFixtures = {
  gamePage: Page
}

/**
 * Extended test with gamePage fixture.
 * - Suppresses PatchNotes modal
 * - Forces English locale
 */
export const test = base.extend<GameFixtures>({
  gamePage: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('seenPatchNotesVersion', '1.1.0')
      localStorage.setItem('i18nextLng', 'en')
      // Prevent Backspace from triggering browser back navigation (Safari/WebKit)
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
    })
    await use(page)
  },
})

export { expect }

/** Type a word using physical keyboard (e.code format) */
export async function typeWord(page: Page, word: string) {
  for (const ch of word) {
    await page.keyboard.press(`Key${ch.toUpperCase()}`)
    // Wait for React to process the state update and re-attach keyup listener
    await page.waitForTimeout(50)
  }
}

/** Submit a word via physical keyboard */
export async function submitWord(page: Page, word: string) {
  await typeWord(page, word)
  await page.keyboard.press('Enter')
  // Wait for React to process the submission
  await page.waitForTimeout(100)
}

/** Get all cell elements in a specific row (0-indexed) */
export function getRowCells(page: Page, rowIndex: number) {
  // Each row is a flex div with 5 cells. Rows and bridges alternate.
  // Row 0 = nth-child(1), Bridge 0 = nth-child(2), Row 1 = nth-child(3), etc.
  const nthChild = rowIndex * 2 + 1
  return page.locator(`.pb-6 > :nth-child(${nthChild}) > div`)
}

/** Wait for the game page to be fully loaded (keyboard visible) */
export async function waitForGameReady(page: Page) {
  await page.locator('button', { hasText: 'Enter' }).waitFor({ state: 'visible' })
}

/** Attach a named screenshot to the test report */
export async function screenshot(page: Page, name: string) {
  // Wait for modal transition animations to complete
  await page.waitForTimeout(300)
  const body = await page.screenshot()
  await test.info().attach(name, { body, contentType: 'image/png' })
}
