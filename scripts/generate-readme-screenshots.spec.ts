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
test.skip(
  () => !process.env.GENERATE_SCREENSHOTS,
  'Set GENERATE_SCREENSHOTS=1 to run'
)

const ASSETS = path.resolve(__dirname, '..', 'assets')
const HYDRO_PATH = `/#/custom/${encodeCustomPuzzle('hydro', 'ootzk')}`
const HYDRO_DATE = new Date('2026-02-20T12:00:00Z') // hydro = WORDS[4], epoch+4

// ── Helpers ──

async function save(page: Page, name: string) {
  await page.screenshot({ path: path.join(ASSETS, `${name}.png`) })
}

async function scrollToTop(page: Page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    document
      .querySelectorAll('[class*="overflow-y-auto"]')
      .forEach((el) => el.scrollTo(0, 0))
  })
}

async function initPage(page: Page) {
  await page.clock.setFixedTime(HYDRO_DATE)
  await page.addInitScript((version) => {
    localStorage.setItem('seenPatchNotesVersion', version)
    localStorage.setItem('i18nextLng', 'en')
    window.addEventListener('keydown', (e) => {
      if (
        e.code === 'Backspace' &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '')
      ) {
        e.preventDefault()
      }
    })
  }, PATCH_NOTES_VERSION)
}

// ── Game Flow Screenshots ──

test('game flow: empty board → win → success', async ({ page }) => {
  await initPage(page)
  await page.goto('/')
  await waitForGameReady(page)

  // 1. Empty board
  await save(page, 'empty-board')

  // 2. Guess 1: SHAKE → ⬜🟪⬜⬜⬜
  await submitWord(page, 'shake')
  await save(page, 'first-guess')

  // 3. Guess 2: LANCE (E locked at last) → ⬜⬜⬜⬜⬜
  await submitWord(page, 'lanc')
  await save(page, 'second-guess')

  // 4. Guess 3: LORES (L locked at first) → ⬜🟪🟪⬜⬜
  await submitWord(page, 'ores')

  // 5. Guess 4: CLIPS (S locked at last) → ⬜⬜⬜⬜⬜
  await submitWord(page, 'clip')

  // 6. Guess 5: CARGO (C locked at first) → ⬜⬜🟪⬜🟩
  await submitWord(page, 'argo')

  // 7. Guess 6: HYDRO (O locked at last) → 🟩🟩🟩🟩🟩
  await submitWord(page, 'hydr')

  // Wait for success alert
  await page
    .locator('.bg-green-200')
    .waitFor({ state: 'visible', timeout: 3000 })
  await page.waitForTimeout(500)
  await save(page, 'success')
})

// ── Daily Statistics Screenshot ──

test('daily statistics modal', async ({ page }) => {
  await initPage(page)

  // Inject fake daily stats + completed game (hydro on 2026-02-20)
  await page.addInitScript(() => {
    const stats = {
      winDistribution: [0, 1, 3, 5, 8, 2],
      gamesFailed: 3,
      currentStreak: 4,
      bestStreak: 8,
      totalGames: 22,
      successRate: 86,
    }
    localStorage.setItem('gameStats', JSON.stringify(stats))
    const gameState = {
      guesses: [['h', 'y', 'd', 'r', 'o']],
      solution: 'hydro',
    }
    localStorage.setItem('gameState', JSON.stringify(gameState))
  })

  await page.goto('/')
  await waitForGameReady(page)

  // Records modal auto-opens (completed game detected)
  await page
    .getByRole('heading', { name: 'Records' })
    .waitFor({ state: 'visible', timeout: 8000 })
  await page.waitForTimeout(500)
  await save(page, 'statistics')
})

// ── Dead End Screenshot ──

test('dead end scenario', async ({ page }) => {
  await initPage(page)
  await page.goto('/')
  await waitForGameReady(page)

  // Guesses 1-3: same as win scenario
  await submitWord(page, 'shake') // 1. SHAKE → chain E right
  await submitWord(page, 'lanc') // 2. LANCE → chain L left
  await submitWord(page, 'ores') // 3. LORES → chain S right

  // Guesses 4-5: diverge to create dead end
  await submitWord(page, 'feat') // 4. FEATS (S locked) → chain F left
  await submitWord(page, 'lint') // 5. FLINT (F locked) → chain T right → T ≠ O → dead end!

  // Wait for dead-end loss alert
  await page
    .locator('text=The word was hydro')
    .waitFor({ state: 'visible', timeout: 3000 })
  await page.waitForTimeout(500)
  await save(page, 'dead-end')
})

// ── Calendar Screenshot (now inside Stats modal tab) ──

test('monthly calendar with history', async ({ page }) => {
  // Use March 12 for a fuller calendar (more history than Feb 20)
  const CALENDAR_DATE = new Date('2026-03-12T12:00:00Z')
  await page.clock.setFixedTime(CALENDAR_DATE)
  await page.addInitScript((version) => {
    localStorage.setItem('seenPatchNotesVersion', version)
    localStorage.setItem('i18nextLng', 'en')
  }, PATCH_NOTES_VERSION)

  // Generate daily history: Feb 16 ~ Mar 11 (fixed dates, not runtime-dependent)
  const history: Record<string, { guessCount: number; won: boolean }> = {}
  const epoch = new Date('2026-02-16T00:00:00Z')
  const end = new Date('2026-03-12T00:00:00Z')
  for (let dt = new Date(epoch); dt < end; dt.setUTCDate(dt.getUTCDate() + 1)) {
    const d = dt.getUTCDate()
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d).padStart(2, '0')}`
    const won = d % 5 !== 0
    history[key] = { guessCount: won ? (d % 4) + 2 : 6, won }
  }

  // Calculate current streak from the end of history
  const sortedKeys = Object.keys(history).sort().reverse()
  let streak = 0
  for (const k of sortedKeys) {
    if (history[k].won) streak++
    else break
  }

  await page.addInitScript(
    ({ h, cs }) => {
      localStorage.setItem('dailyHistory', JSON.stringify(h))
      localStorage.setItem('dailyHistoryStartDate', '2026-02-16')
      const stats = {
        winDistribution: [0, 0, 0, 0, 0, 0],
        gamesFailed: 0,
        currentStreak: cs,
        bestStreak: cs,
        totalGames: Object.keys(h).length,
        successRate: 0,
      }
      localStorage.setItem('gameStats', JSON.stringify(stats))
    },
    { h: history, cs: streak }
  )

  await page.goto('/')
  await waitForGameReady(page)

  // Open Records modal (icon index 1), then click Calendar tab
  await page
    .locator('svg.h-6.w-6.cursor-pointer')
    .nth(1)
    .evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
  await page.getByRole('heading', { name: 'Records' }).waitFor({
    state: 'visible',
  })
  await page.getByRole('button', { name: 'Calendar' }).click()
  await page.waitForTimeout(500)
  await save(page, 'calendar')
})

// ── Modal & Feature Screenshots ──

test('how-to-play modal (English)', async ({ page }) => {
  await initPage(page)
  await page.goto('/')
  await waitForGameReady(page)

  // Click info icon (1st header icon)
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(0).click()
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

  await page.locator('svg.h-6.w-6.cursor-pointer').nth(0).click()
  await page.locator('h3').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  // Click "게임 방법" (How to play) tab
  await page.locator('text=게임 방법').click()
  await page.waitForTimeout(300)
  await save(page, 'how-to-play-kor')
})

test('settings with language selector (Korean)', async ({ page }) => {
  await page.addInitScript((version) => {
    localStorage.setItem('seenPatchNotesVersion', version)
    localStorage.setItem('i18nextLng', 'ko')
  }, PATCH_NOTES_VERSION)
  await page.goto('/')
  await page.locator('button:text-is("q")').waitFor({ state: 'visible' })

  // Open Settings modal (icon index 3)
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(3).click()
  await page.waitForTimeout(500)
  await save(page, 'settings-kor')
})

test('patch notes modal', async ({ page }) => {
  // Do NOT suppress patch notes
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en')
  })
  await page.goto('/')
  await page
    .locator('button', { hasText: 'Enter' })
    .waitFor({ state: 'visible' })
  await page
    .getByRole('heading', { name: "What's New" })
    .waitFor({ state: 'visible', timeout: 5000 })
  await scrollToTop(page)
  await page.waitForTimeout(500)
  await save(page, 'patch-note')
})

test('patch notes history tab', async ({ page }) => {
  await initPage(page)
  await page.goto('/')
  await waitForGameReady(page)

  await page.locator('svg.h-6.w-6.cursor-pointer').nth(0).click()
  await page.locator('text=Information').waitFor({ state: 'visible' })
  await page.locator('text=Patch Notes').click()
  await page.waitForTimeout(500)
  await save(page, 'patch-notes-history')
})

test('practice mode', async ({ page }) => {
  await initPage(page)
  await page.goto('/#/practice')
  await waitForGameReady(page)
  await save(page, 'practice-mode')
})

test('event mode', async ({ page }) => {
  await initPage(page)
  await page.goto('/#/event')
  await waitForGameReady(page)
  await page.getByRole('heading', { name: 'Information' }).waitFor({
    state: 'visible',
  })
  await page.keyboard.press('Escape')
  await page.getByRole('heading', { name: 'Information' }).waitFor({
    state: 'hidden',
  })
  await page.waitForTimeout(500)
  await save(page, 'event-mode')
})

test('event guide', async ({ page }) => {
  await initPage(page)
  await page.goto('/#/event')
  await waitForGameReady(page)

  await page.getByRole('heading', { name: 'Information' }).waitFor({
    state: 'visible',
  })
  await page.getByRole('heading', { name: '🍀🐇 Summer Garden' }).waitFor({
    state: 'visible',
  })
  await scrollToTop(page)
  await page.waitForTimeout(500)
  await save(page, 'event-guide')
})

test('settings modal with all toggles', async ({ page }) => {
  await initPage(page)
  await page.goto('/')
  await waitForGameReady(page)

  // Open settings (Daily mode: icon index 3)
  await page
    .locator('svg.h-6.w-6.cursor-pointer')
    .nth(3)
    .evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
  await page.getByRole('heading', { name: 'Settings' }).waitFor({
    state: 'visible',
  })
  await page.waitForTimeout(300)
  await save(page, 'settings')
})

test('donate modal', async ({ page }) => {
  await initPage(page)
  await page.goto('/')
  await waitForGameReady(page)

  // Click donate icon (Daily mode: icon index 4)
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(4).click()
  await page.locator('h3:has-text("Donate")').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  await save(page, 'donation')
})

// ── Create & Custom Puzzle Screenshots ──

test('create puzzle — copied state', async ({ page }) => {
  await initPage(page)
  await page.goto('/#/create')
  await page
    .locator('button', { hasText: 'Enter' })
    .waitFor({ state: 'visible' })

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

// ── v1.5.0+v1.6.0: Achievements & Cosmetics Screenshots ──

test('achievements tab with unlocked and locked', async ({ page }) => {
  await initPage(page)

  // Inject stats + achievements (some unlocked, some in progress)
  await page.addInitScript(() => {
    const stats = {
      winDistribution: [0, 1, 3, 5, 8, 2],
      gamesFailed: 3,
      currentStreak: 4,
      bestStreak: 8,
      totalGames: 22,
      successRate: 86,
    }
    localStorage.setItem('gameStats', JSON.stringify(stats))
    const now = Date.now()
    localStorage.setItem(
      'achievementState',
      JSON.stringify({
        version: 2,
        unlocked: {
          play_10: { unlockedAt: now },
          win_in_4: { unlockedAt: now },
          win_in_5: { unlockedAt: now },
          win_in_6: { unlockedAt: now },
          streak_3: { unlockedAt: now },
          played_v1_6_0_5: { unlockedAt: now },
          practice_win_100: { unlockedAt: now },
          custom_win_10: { unlockedAt: now },
        },
        retroCompleted: true,
        lastSeenAt: 0,
      })
    )
    localStorage.setItem(
      'achievementProgress',
      JSON.stringify({
        modes: {
          daily: { gamesCompleted: 22, gamesWon: 19 },
          practice: { gamesCompleted: 118, gamesWon: 100 },
          custom: { gamesCompleted: 10, gamesWon: 10 },
        },
        versions: {
          '1.6.0': { gamesCompleted: 5 },
        },
      })
    )
  })

  await page.goto('/')
  await waitForGameReady(page)

  // Open Rewards → Achievements tab
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()
  await page.locator('text=Rewards').waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  await save(page, 'achievements')
})

test('rewards with cosmetics and sample view', async ({ page }) => {
  await initPage(page)

  // Unlock some achievements for cosmetic options
  await page.addInitScript(() => {
    const now = Date.now()
    localStorage.setItem(
      'achievementState',
      JSON.stringify({
        version: 2,
        unlocked: {
          play_10: { unlockedAt: now },
          streak_3: { unlockedAt: now },
          win_in_6: { unlockedAt: now },
          streak_14: { unlockedAt: now },
          bibimbap_balance: { unlockedAt: now },
          yogurt_recipe: { unlockedAt: now },
        },
        retroCompleted: true,
      })
    )
    // Equip v1.6.0 cosmetics to show their effect in the sample/share preview.
    localStorage.setItem(
      'cosmeticState',
      JSON.stringify({
        equipped: {
          shareBadge: 'badge_fire',
          shareEmoji: 'emoji_bibimbap',
          cellFont: 'font_default',
          cellColor: 'color_default',
          chainStyle: 'chain_default',
          chainColor: 'chaincolor_black',
          endMessage: 'msg_classic',
        },
      })
    )
  })

  await page.goto('/')
  await waitForGameReady(page)

  // Open rewards
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()
  await page.locator('text=Rewards').waitFor({ state: 'visible' })
  await page.locator('text=Cosmetics').click()
  await page.waitForTimeout(300)
  await save(page, 'settings-cosmetics')
})

test('cosmetic picker popup', async ({ page }) => {
  await initPage(page)

  await page.addInitScript(() => {
    const now = Date.now()
    localStorage.setItem(
      'achievementState',
      JSON.stringify({
        version: 2,
        unlocked: {
          play_10: { unlockedAt: now },
          streak_3: { unlockedAt: now },
          win_in_3: { unlockedAt: now },
          bibimbap_balance: { unlockedAt: now },
          yogurt_recipe: { unlockedAt: now },
        },
        retroCompleted: true,
      })
    )
  })

  await page.goto('/')
  await waitForGameReady(page)

  // Open rewards → click Share Emoji picker
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()
  await page.locator('text=Rewards').waitFor({ state: 'visible' })
  await page.locator('text=Cosmetics').click()
  await page.locator('text=Share Emoji').locator('..').locator('button').click()
  await page.waitForTimeout(300)
  await save(page, 'cosmetic-picker')
})

test('alert message theme picker', async ({ page }) => {
  await initPage(page)

  await page.addInitScript(() => {
    const now = Date.now()
    localStorage.setItem(
      'achievementState',
      JSON.stringify({
        version: 2,
        unlocked: {
          win_in_6: { unlockedAt: now },
          streak_30: { unlockedAt: now },
        },
        retroCompleted: true,
      })
    )
  })

  await page.goto('/')
  await waitForGameReady(page)

  // Open rewards → click Alert Message picker
  await page.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()
  await page.locator('text=Rewards').waitFor({ state: 'visible' })
  await page.locator('text=Cosmetics').click()
  await page.locator('text=Win Message').locator('..').locator('button').click()
  await page.waitForTimeout(300)
  await save(page, 'alert-message-picker')
})
