import { test, expect, waitForGameReady } from './fixtures/game.fixture'

const SETTINGS_ICON_DAILY = 3

const createProfileBackup = async (
  page: import('@playwright/test').Page,
  profile: object
) =>
  page.evaluate((profileValue) => {
    const text = JSON.stringify(profileValue)
    return `WCD1:${btoa(unescape(encodeURIComponent(text)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')}`
  }, profile)

test.describe('Profile transfer', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Clipboard API requires Chromium'
  )

  test('exports, previews, and imports a profile through Settings', async ({
    gamePage,
  }) => {
    await gamePage
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write'])
    await gamePage.addInitScript(() => {
      localStorage.setItem(
        'dailyResults',
        JSON.stringify({
          '2026-05-31': {
            dateKey: '2026-05-31',
            won: false,
            guessCount: 6,
            endReason: 'guess_limit',
          },
        })
      )
    })
    await gamePage.goto('/')
    await waitForGameReady(gamePage)

    await gamePage
      .locator('svg.h-6.w-6.cursor-pointer')
      .nth(SETTINGS_ICON_DAILY)
      .click()
    await expect(
      gamePage.getByRole('heading', { name: 'Settings' })
    ).toBeVisible()

    await gamePage.getByRole('button', { name: 'Export profile' }).click()
    await expect(
      gamePage.getByText('Profile backup copied to clipboard.')
    ).toBeVisible()
    const exported = await gamePage.evaluate(() =>
      navigator.clipboard.readText()
    )
    expect(exported).toMatch(/^WCD1:/)

    const sourceBackup = await createProfileBackup(gamePage, {
      schemaVersion: 1,
      appVersion: '1.7.0',
      exportedAt: '2026-06-01T00:00:00.000Z',
      data: {
        dailyResults: {
          '2026-06-01': {
            dateKey: '2026-06-01',
            won: true,
            guessCount: 3,
            endReason: 'win',
          },
        },
        eventResults: {
          'v1.7.0': {
            '2026-06-01': {
              dateKey: '2026-06-01',
              won: false,
              guessCount: 1,
              endReason: 'pacman',
            },
          },
        },
        achievementState: {
          version: 'v1.7.0',
          unlocked: {
            play_50: { unlockedAt: 10 },
          },
          retroCompleted: true,
        },
        settings: {
          isUppercase: true,
          isDarkMode: false,
          weekStartsOnMonday: true,
          excludeUrl: true,
          enterValidationHint: false,
          controllerEnabled: true,
        },
      },
    })

    await gamePage.getByLabel('Profile import string').fill(sourceBackup)
    await expect(gamePage.getByText('Import preview')).toBeVisible()
    await expect(gamePage.getByText('Daily records: 1')).toBeVisible()
    await expect(gamePage.getByText('Event records: 1')).toBeVisible()
    await expect(gamePage.getByText('Achievements: 1')).toBeVisible()

    await gamePage.getByRole('button', { name: 'Import profile' }).click()
    await expect(
      gamePage.getByText('Profile imported. Reload to apply everything.')
    ).toBeVisible()

    const importedState = await gamePage.evaluate(() => ({
      dailyResults: JSON.parse(localStorage.getItem('dailyResults') || '{}'),
      eventResults: JSON.parse(localStorage.getItem('eventResults') || '{}'),
      achievementState: JSON.parse(
        localStorage.getItem('achievementState') || '{}'
      ),
      settings: JSON.parse(localStorage.getItem('settings') || '{}'),
    }))
    expect(importedState.dailyResults).toHaveProperty('2026-05-31')
    expect(importedState.dailyResults).toHaveProperty('2026-06-01')
    expect(importedState.eventResults['v1.7.0']).toHaveProperty('2026-06-01')
    expect(importedState.achievementState.unlocked).toHaveProperty('play_50')
    expect(importedState.settings).toMatchObject({
      isUppercase: true,
      weekStartsOnMonday: true,
      excludeUrl: true,
      controllerEnabled: true,
    })
  })
})
