import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: 'e2e', timeout: 60_000, retries: 0, workers: 1, reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', channel: 'chrome', locale: 'es-MX', timezoneId: 'America/Tijuana', serviceWorkers: 'allow' },
  projects: [
    { name: 'movil', use: { ...devices['Pixel 7'], channel: 'chrome' } },
    { name: 'escritorio', use: { viewport: { width: 1280, height: 800 }, channel: 'chrome' }, testMatch: /responsive/ },
  ],
  webServer: { command: 'node scripts/local-server.mjs 4173', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 30_000 },
})
