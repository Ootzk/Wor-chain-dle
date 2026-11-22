import { test, expect } from '@playwright/test'
import { mkdirSync, readFileSync } from 'fs'
import path from 'path'

test.use({ viewport: { width: 1280, height: 640 } })

test('render social preview from the homepage wordmark', async ({ page }) => {
  await page.goto('/#/artwork/social-preview')
  const artwork = page.getByTestId('social-preview')
  await expect(artwork).toBeVisible()
  const title = artwork.getByRole('heading', { name: 'Wor🔗dle', exact: true })
  await expect(title).toHaveCSS('font-weight', '700')
  await page.evaluate(() => document.fonts.ready)
  const bounds = await title.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(64)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1216)
  expect(bounds!.y).toBeGreaterThanOrEqual(64)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(576)

  const output = path.resolve(
    __dirname,
    '../assets/branding/social-preview.png'
  )
  mkdirSync(path.dirname(output), { recursive: true })
  await artwork.screenshot({ path: output, animations: 'disabled' })
  const png = readFileSync(output)
  expect(png.readUInt32BE(16)).toBe(1280)
  expect(png.readUInt32BE(20)).toBe(640)
  expect(png.length).toBeLessThan(1_000_000)
})
