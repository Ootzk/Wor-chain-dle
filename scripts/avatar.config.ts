import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: '.',
  testMatch: 'generate-organization-avatar.spec.ts',
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3108',
    viewport: { width: 500, height: 500 },
    deviceScaleFactor: 1,
    browserName: 'chromium',
  },
  webServer: {
    command:
      'env PUBLIC_URL=/ PORT=3108 BROWSER=none REACT_APP_ARTWORK=1 npm start',
    cwd: path.resolve(__dirname, '..'),
    url: 'http://localhost:3108',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
