import { test, expect } from '@playwright/test'
import { mkdirSync, statSync } from 'fs'
import path from 'path'

test('render thumbnail from real game cells', async ({ page }) => {
  await page.goto('/#/artwork/thumbnail')
  const thumbnail = page.getByTestId('thumbnail')
  await expect(thumbnail).toBeVisible()
  const tiles = thumbnail.locator('.avatar-tile > div')
  await expect(tiles).toHaveCount(4)
  await expect(tiles.nth(0)).toHaveCSS('background-color', 'rgb(168, 85, 247)')
  await expect(tiles.nth(1)).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(tiles.nth(2)).toHaveCSS('background-color', 'rgb(148, 163, 184)')
  await expect(tiles.nth(3)).toHaveCSS('background-color', 'rgb(34, 197, 94)')
  await page.evaluate(() => document.fonts.ready)
  const output = path.resolve(__dirname, '../assets/branding/thumbnail.png')
  mkdirSync(path.dirname(output), { recursive: true })
  await thumbnail.screenshot({ path: output, animations: 'disabled' })
  expect(statSync(output).size).toBeLessThan(1_000_000)
})
