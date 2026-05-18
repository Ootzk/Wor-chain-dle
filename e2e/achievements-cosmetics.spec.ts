import {
  test,
  expect,
  waitForGameReady,
  screenshot,
} from './fixtures/game.fixture'

test.describe('Achievements & Cosmetics', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto('/')
    await waitForGameReady(gamePage)
  })

  test('achievements tab shows in rewards modal', async ({ gamePage }) => {
    // Open rewards modal (icon index 2 in daily mode)
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()
    await expect(
      gamePage.getByRole('heading', { name: 'Rewards' })
    ).toBeVisible()

    // Should show achievement cards
    await expect(gamePage.locator('text=Getting Started')).toBeVisible()
    await expect(
      gamePage.locator('[data-achievement-id="play_10"]')
    ).toContainText('Daily')
    await expect(gamePage.locator('text=Complete 10 games')).toBeVisible()
    await screenshot(gamePage, '01-achievements-tab')

    // Progress bar container should be visible
    await expect(
      gamePage.locator('div.bg-gray-200.rounded-full').first()
    ).toBeVisible()
    await screenshot(gamePage, '02-achievements-progress')
  })

  test('achievements show unlocked state with pre-set data', async ({
    gamePage,
  }) => {
    // Set up achievement state with play_10 unlocked
    await gamePage.evaluate(() => {
      localStorage.setItem(
        'achievementState',
        JSON.stringify({
          version: 1,
          unlocked: { play_10: { unlockedAt: Date.now() } },
          retroCompleted: true,
        })
      )
    })
    await gamePage.reload()
    await waitForGameReady(gamePage)

    // Open rewards
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()

    // Getting Started should have green border (unlocked)
    const card = gamePage.locator('[data-achievement-id="play_10"]')
    await expect(card).toHaveClass(/border-green-400/)
    await screenshot(gamePage, '01-achievement-unlocked')
  })

  test('retroactive unlock on first load', async ({ gamePage }) => {
    // Set up stats that satisfy play_10 and streak_3
    await gamePage.evaluate(() => {
      localStorage.setItem(
        'gameStats',
        JSON.stringify({
          winDistribution: [0, 0, 0, 0, 0, 0],
          gamesFailed: 0,
          currentStreak: 3,
          bestStreak: 3,
          totalGames: 10,
          successRate: 100,
        })
      )
      localStorage.removeItem('achievementState')
    })
    await gamePage.reload()
    await waitForGameReady(gamePage)

    // Check achievementState was set via retro unlock
    const state = await gamePage.evaluate(() =>
      JSON.parse(localStorage.getItem('achievementState') || '{}')
    )
    expect(state.retroCompleted).toBe(true)
    expect(state.unlocked.play_10).toBeTruthy()
    expect(state.unlocked.streak_3).toBeTruthy()

    // Open rewards to verify visually
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()

    const play10 = gamePage.locator('[data-achievement-id="play_10"]')
    await expect(play10).toHaveClass(/border-green-400/)
    const streak3 = gamePage.locator('[data-achievement-id="streak_3"]')
    await expect(streak3).toHaveClass(/border-green-400/)
    await screenshot(gamePage, '01-retro-unlock')
  })

  test('cosmetics section in rewards modal', async ({ gamePage }) => {
    // Open rewards (icon index 2 in daily mode)
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()
    await expect(gamePage.locator('text=Rewards')).toBeVisible()
    await gamePage.locator('button', { hasText: 'Cosmetics' }).click()

    // Sample grid should be visible
    await expect(gamePage.locator('text=Share Emoji')).toBeVisible()
    await expect(gamePage.locator('text=Share Badge')).toBeVisible()
    await expect(gamePage.locator('text=Cell Font')).toBeVisible()
    await expect(gamePage.locator('text=Chain Style')).toBeVisible()
    await screenshot(gamePage, '01-rewards-cosmetics')
  })

  test('share emoji cosmetic changes share output', async ({ gamePage }) => {
    // Equip circle emoji
    await gamePage.evaluate(() => {
      localStorage.setItem(
        'cosmeticState',
        JSON.stringify({
          equipped: {
            shareEmoji: 'emoji_circle',
            cellFont: 'font_default',
            cellColor: 'color_default',
            chainStyle: 'chain_default',
            chainColor: 'chaincolor_black',
            endMessage: 'msg_classic',
          },
        })
      )
    })
    await gamePage.reload()
    await waitForGameReady(gamePage)

    // Open rewards to verify sample view uses circle emoji
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()
    await gamePage.locator('button', { hasText: 'Cosmetics' }).click()

    // Share preview should contain circle emoji
    const sharePreview = gamePage.locator('pre')
    await expect(sharePreview).toContainText('\uD83D\uDFE2') // 🟢
    await screenshot(gamePage, '01-circle-emoji-preview')
  })

  test('cosmetic picker popup opens and selects', async ({ gamePage }) => {
    // Unlock play_10 so emoji_circle is available
    await gamePage.evaluate(() => {
      localStorage.setItem(
        'achievementState',
        JSON.stringify({
          version: 1,
          unlocked: { play_10: { unlockedAt: Date.now() } },
          retroCompleted: true,
        })
      )
    })
    await gamePage.reload()
    await waitForGameReady(gamePage)

    // Open rewards
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()
    await gamePage.locator('button', { hasText: 'Cosmetics' }).click()

    // Click Share Emoji picker button (first cosmetic picker)
    await gamePage.locator('button:has-text("Square")').click()

    // Popup should show options (z-[60] is the cosmetic picker overlay)
    const popup = gamePage.locator('.z-\\[60\\]')
    await expect(popup).toBeVisible()
    await expect(popup.locator('text=Circle')).toBeVisible()
    await screenshot(gamePage, '01-emoji-picker-popup')

    // Select Circle
    await popup.locator('text=Circle').click()

    // Preview should update
    const sharePreview = gamePage.locator('pre')
    await expect(sharePreview).toContainText('\uD83D\uDFE2') // 🟢
    await screenshot(gamePage, '02-circle-selected')
  })

  test('locked cosmetic shows lock icon', async ({ gamePage }) => {
    // Open rewards
    await gamePage.locator('svg.h-6.w-6.cursor-pointer').nth(2).click()
    await gamePage.locator('button', { hasText: 'Cosmetics' }).click()

    // Click Share Emoji picker
    await gamePage.locator('button:has-text("Square")').click()

    // Circle and Heart should show lock (not unlocked)
    await expect(gamePage.locator('text=\uD83D\uDD12').first()).toBeVisible()
    await screenshot(gamePage, '01-locked-cosmetics')
  })
})
