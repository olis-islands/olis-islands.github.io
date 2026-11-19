import { expect, test } from '@playwright/test'

// Phones and tablets keep sound blocked until the first tap: a full-screen "tap to hear" must cover the app,
// and one tap must start audio. Chromium's own autoplay rule applies here (the other specs switch it off).

test.use({ launchOptions: { args: ['--autoplay-policy=document-user-activation-required'] } })

test('sound is blocked until the child taps the speaker', async ({ page }) => {
  await page.goto('/')
  const gate = page.getByRole('button', { name: 'לחצו כדי לשמוע את אולי' })
  await expect(gate).toBeVisible()
  await expect(gate).toBeFocused() // reachable by keyboard
  await gate.click()
  await expect(gate).toBeHidden()
  await expect(page.getByLabel('שם')).toBeVisible()
})
