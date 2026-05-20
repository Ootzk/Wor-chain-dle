import {
  test,
  expect,
  getRowCells,
  submitWord,
  waitForGameReady,
} from './fixtures/game.fixture'

test.describe('Event mode', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.clock.setFixedTime(new Date('2026-05-21T03:00:00Z'))
  })

  test('renders the active event with theme cosmetic overrides', async ({
    gamePage,
  }) => {
    await gamePage.addInitScript(() => {
      localStorage.setItem(
        'cosmeticState',
        JSON.stringify({
          equipped: {
            shareBadge: 'badge_fire',
            shareEmoji: 'emoji_default',
            cellFont: 'font_default',
            cellColor: 'color_default',
            chainStyle: 'chain_default',
            chainColor: 'chaincolor_black',
            endMessage: 'msg_classic',
          },
        })
      )
    })

    await gamePage.goto('/#/event')
    await waitForGameReady(gamePage)

    await expect(gamePage.locator('text=Event')).toBeVisible()
    await expect(gamePage.locator('text=Summer Garden')).toBeVisible()
    await expect(gamePage.locator('.border-sky-400').first()).toBeVisible()

    await submitWord(gamePage, 'stale')
    await expect(gamePage.getByTestId('pacman-actor')).toHaveText('🐇')

    const storedChainColor = await gamePage.evaluate(() => {
      const raw = localStorage.getItem('cosmeticState')
      return raw ? JSON.parse(raw).equipped.chainColor : null
    })
    expect(storedChainColor).toBe('chaincolor_black')
  })

  test('persists in-progress event guesses across reloads', async ({
    gamePage,
  }) => {
    await gamePage.goto('/#/event')
    await waitForGameReady(gamePage)

    await submitWord(gamePage, 'stale')

    const eventState = await gamePage.evaluate(() => {
      const raw = localStorage.getItem('eventGameState')
      return raw ? JSON.parse(raw) : null
    })
    expect(eventState).toMatchObject({
      version: 'v1.7.0',
      dateKey: '2026-05-21',
      guesses: [['s', 't', 'a', 'l', 'e']],
    })
    expect(
      await gamePage.evaluate(() => localStorage.getItem('gameState'))
    ).toBe(null)

    await gamePage.reload()
    await waitForGameReady(gamePage)

    const cellsAfterReload = getRowCells(gamePage, 0)
    await expect(cellsAfterReload.nth(0)).toContainText('s')
    await expect(cellsAfterReload.nth(0)).toHaveClass(
      /bg-(green|purple|slate)-/
    )
  })

  test('replaces stale event progress from another event day', async ({
    gamePage,
  }) => {
    await gamePage.addInitScript(() => {
      localStorage.setItem(
        'eventGameState',
        JSON.stringify({
          version: 'v1.7.0',
          dateKey: '2026-05-20',
          solution: 'class',
          guesses: [['c', 'l', 'a', 's', 's']],
        })
      )
    })

    await gamePage.goto('/#/event')
    await waitForGameReady(gamePage)

    const eventState = await gamePage.evaluate(() => {
      const raw = localStorage.getItem('eventGameState')
      return raw ? JSON.parse(raw) : null
    })

    expect(eventState).toMatchObject({
      version: 'v1.7.0',
      dateKey: '2026-05-21',
      guesses: [],
    })
    expect(eventState.solution).not.toBe('class')
  })

  test('shows event records and rewards version controls', async ({
    gamePage,
  }) => {
    await gamePage.goto('/#/event')
    await waitForGameReady(gamePage)

    const headerIcons = gamePage.locator('.flex.w-80 svg.cursor-pointer')

    await headerIcons.nth(1).click()
    await expect(
      gamePage.getByRole('heading', { name: 'Records' })
    ).toBeVisible()
    const recordsDialog = gamePage.getByRole('dialog')
    await expect(
      recordsDialog.getByRole('button', { name: 'Today' })
    ).toHaveClass(/border-indigo-600/)
    await expect(
      recordsDialog.getByRole('button', { name: 'Event' })
    ).toBeVisible()
    await expect(
      recordsDialog.getByRole('button', { name: /v1.7.0/ })
    ).toBeVisible()
    await gamePage.keyboard.press('Escape')
    await expect(
      gamePage.getByRole('heading', { name: 'Records' })
    ).not.toBeVisible()

    await headerIcons.nth(2).click()
    await expect(
      gamePage.getByRole('heading', { name: 'Rewards' })
    ).toBeVisible()
    await expect(gamePage.getByRole('button', { name: /v1.7.0/ })).toBeVisible()
    await expect(
      gamePage.getByRole('button', { name: 'Achievements' })
    ).toBeVisible()
    await expect(
      gamePage.getByRole('button', { name: 'Cosmetics' })
    ).toHaveCount(0)
  })
})
