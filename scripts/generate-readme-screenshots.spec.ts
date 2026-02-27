import { test, Page } from '@playwright/test'
import path from 'path'
import {
  encodeCustomPuzzle,
  typeWord,
  submitWord,
  waitForGameReady,
} from '../e2e/fixtures/game.fixture'
import { PATCH_NOTES_VERSION } from '../src/constants/config'

// Skip unless explicitly opted in via: GENERATE_SCREENSHOTS=1 npm run readme:screenshots
test.skip(() => !process.env.GENERATE_SCREENSHOTS, 'Set GENERATE_SCREENSHOTS=1 to run')

const ASSETS = path.resolve(__dirname, '..', 'assets')
const HYDRO_PATH = `/#/custom/${encodeCustomPuzzle('hydro', 'ootzk')}`

// ── Helpers ──

async function save(page: Page, name: string) {
  await page.screenshot({ path: path.join(ASSETS, `${name}.png`) })
}

async function disguiseAsDaily(page: Page) {
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  await page.evaluate((date) => {
    const el = document.querySelector('p.text-sm.text-gray-500')
    if (el) el.innerHTML = `Daily | ${date}`
  }, today)
}

async function initPage(page: Page) {
  await page.addInitScript((version) => {
    localStorage.setItem('seenPatchNotesVersion', version)
    localStorage.setItem('i18nextLng', 'en')
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
  }, PATCH_NOTES_VERSION)
}

// ── Game Flow Screenshots ──

test('game flow: empty board → win → statistics', async ({ page }) => {
  await initPage(page)
  await page.goto(HYDRO_PATH)
  await waitForGameReady(page)
  await disguiseAsDaily(page)

  // 1. Empty board
  await save(page, 'empty-board')

  // 2. Guess 1: SHAKE → ⬜🟪⬜⬜⬜
  await submitWord(page, 'shake')
  await disguiseAsDaily(page)
  await save(page, 'first-guess')

  // 3. Guess 2: LANCE (E locked at last) → ⬜⬜⬜⬜⬜
  await submitWord(page, 'lanc')
  await disguiseAsDaily(page)
  await save(page, 'second-guess')

  // 4. Guess 3: LORES (L locked at first) → ⬜🟪🟪⬜⬜
  await submitWord(page, 'ores')

  // 5. Guess 4: CLIPS (S locked at last) → ⬜⬜⬜⬜⬜
  await submitWord(page, 'clip')

  // 6. Guess 5: CARGO (C locked at first) → ⬜⬜🟪⬜🟩
  await submitWord(page, 'argo')

  // 7. Guess 6: HYDRO (O locked at last) → 🟩🟩🟩🟩🟩
  await submitWord(page, 'hydr')
  await disguiseAsDaily(page)

  // Wait for success alert
  await page.locator('.bg-green-200').waitFor({ state: 'visible', timeout: 3000 })
  await page.waitForTimeout(500)
  await save(page, 'success')

  // Wait for alert to dismiss and stats modal to open
  await page.locator('text=Statistics').waitFor({ state: 'visible', timeout: 5000 })
  await page.waitForTimeout(500)
  // Hide questioner subtitle ("readme's Wor🔗dle") in stats modal
  await page.evaluate(() => {
    const sub = document.querySelector('.text-sm.text-gray-500.text-center.mb-4')
    if (sub) sub.remove()
  })
  await save(page, 'statistics')
})

// ── Dead End Screenshot ──

test('dead end scenario', async ({ page }) => {
  await initPage(page)
  await page.goto(HYDRO_PATH)
  await waitForGameReady(page)

  // Guesses 1-3: same as win scenario
  await submitWord(page, 'shake') // 1. SHAKE → chain E right
  await submitWord(page, 'lanc')  // 2. LANCE → chain L left
  await submitWord(page, 'ores')  // 3. LORES → chain S right

  // Guesses 4-5: diverge to create dead end
  await submitWord(page, 'feat')  // 4. FEATS (S locked) → chain F left
  await submitWord(page, 'lint')  // 5. FLINT (F locked) → chain T right → T ≠ O → dead end!

  await disguiseAsDaily(page)

  // Wait for dead-end loss alert
  await page.locator('text=The word was hydro').waitFor({ state: 'visible', timeout: 3000 })
  await page.waitForTimeout(500)
  await save(page, 'dead-end')
})

// ── Modal & Feature Screenshots ──

test('how-to-play modal (English)', async ({ page }) => {
  await initPage(page)
  await page.goto('/')
  await waitForGameReady(page)

  // Click info icon (2nd header icon)
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(1).click()
  await page.locator('text=How to play').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  // Click "How to play" tab (default tab is "Daily Mode")
  await page.locator('text=How to play').click()
  await page.waitForTimeout(300)
  await save(page, 'how-to-play')
})

test('how-to-play modal (Korean)', async ({ page }) => {
  await page.addInitScript((version) => {
    localStorage.setItem('seenPatchNotesVersion', version)
    localStorage.setItem('i18nextLng', 'ko')
  }, PATCH_NOTES_VERSION)
  await page.goto('/')
  // Korean Enter = "입력" → use language-agnostic wait
  await page.locator('button:text-is("q")').waitFor({ state: 'visible' })

  await page.locator('svg.h-6.w-6.cursor-pointer').nth(1).click()
  await page.locator('h3').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  // Click "게임 방법" (How to play) tab
  await page.locator('text=게임 방법').click()
  await page.waitForTimeout(300)
  await save(page, 'how-to-play-kor')
})

test('language selector (Korean)', async ({ page }) => {
  await page.addInitScript((version) => {
    localStorage.setItem('seenPatchNotesVersion', version)
    localStorage.setItem('i18nextLng', 'ko')
  }, PATCH_NOTES_VERSION)
  await page.goto('/')
  await page.locator('button:text-is("q")').waitFor({ state: 'visible' })

  // Click translate icon (1st header icon)
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(0).click()
  await page.waitForTimeout(500)
  await save(page, 'language-select-kor')
})

test('patch notes modal', async ({ page }) => {
  // Do NOT suppress patch notes
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en')
  })
  await page.goto('/')
  await page.locator('button', { hasText: 'Enter' }).waitFor({ state: 'visible' })
  await page.locator("text=What's New").waitFor({ state: 'visible', timeout: 5000 })
  await page.waitForTimeout(500)
  await save(page, 'patch-note')
})

test('practice mode', async ({ page }) => {
  await initPage(page)
  await page.goto('/#/practice')
  await waitForGameReady(page)
  await save(page, 'practice-mode')
})

test('uppercase setting', async ({ page }) => {
  await initPage(page)
  await page.goto(HYDRO_PATH)
  await waitForGameReady(page)

  // Type some letters first so uppercase is visible on grid
  await typeWord(page, 'shake')

  // Open settings (4th icon)
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(3).click()
  await page.locator('text=Settings').waitFor({ state: 'visible' })

  // Toggle uppercase on — keep modal open to show toggle + uppercase effect together
  await page.locator('button[role="switch"]').click()
  await page.waitForTimeout(300)

  await disguiseAsDaily(page)
  await save(page, 'uppercase')
})

test('donate modal', async ({ page }) => {
  await initPage(page)
  await page.goto('/')
  await waitForGameReady(page)

  // Click donate icon (5th icon)
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(4).click()
  await page.locator('h3:has-text("Donate")').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  await save(page, 'donation')
})

// ── Create & Custom Puzzle Screenshots ──

test('create puzzle — copied state', async ({ page }) => {
  await initPage(page)
  await page.goto('/#/create')
  await page.locator('button', { hasText: 'Enter' }).waitFor({ state: 'visible' })

  // Enter questioner name
  await page.locator('input[placeholder]').fill('ootzk')
  // Blur name input so keyboard goes to cells
  await page.locator('input[placeholder]').blur()

  // Type word via on-screen keyboard
  await typeWord(page, 'hydro')

  // Press Enter to copy URL
  await page.keyboard.press('Enter')
  await page.locator('.bg-green-100').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  await save(page, 'create-puzzle')
})

test('custom puzzle — playing', async ({ page }) => {
  await initPage(page)
  await page.goto(HYDRO_PATH)
  await waitForGameReady(page)

  // Submit first guess to show chain visualization
  await submitWord(page, 'shake')
  await page.waitForTimeout(300)
  await save(page, 'custom-puzzle')
})
