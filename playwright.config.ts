import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  // In CI: fail on a stray test.only, keep an HTML report for failures, and never retry — a flaky test gets fixed (PLAYBOOK).
  forbidOnly: !!process.env.CI,
  // GitHub's runners have 4 cores; the default (half) left two idle.
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173', locale: 'he-IL', ...devices['Desktop Chrome'],
    // A real browser blocks sound until the first tap (the "tap to hear" gate); tests start as if it was already allowed.
    // e2e/audio-gate.spec.ts turns the block back on.
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  webServer: { command: 'npm run build && npm run preview -- --port 4173 --strictPort', port: 4173, reuseExistingServer: true },
})
