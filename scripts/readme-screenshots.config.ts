import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'generate-readme-screenshots.spec.ts',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 526, height: 750 },
    deviceScaleFactor: 2,
    browserName: 'chromium',
  },

  projects: [
    {
      name: 'screenshots',
      use: { browserName: 'chromium' },
    },
  ],

  webServer: {
    command: 'npm run build && npx serve -s build -l 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
