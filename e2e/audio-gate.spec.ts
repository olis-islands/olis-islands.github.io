import { expect, test } from '@playwright/test'

// Phones and tablets keep sound blocked until the first tap: a full-screen "tap to hear" must cover the app,
// and one tap must start audio. Chromium's own autoplay rule applies here (the other specs switch it off).

test.use({ launchOptions: { args: ['--autoplay-policy=document-user-activation-required'] } })

// Records what actually starts playing: Web Audio buffers longer than the unlock blip, and <audio> sources.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const played: string[] = []
    Object.assign(window, { __played: played })
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
      if (this.buffer && this.buffer.duration > 0.5) played.push(`buffer:${this.buffer.duration.toFixed(1)}`)
      return start.apply(this, args)
    }
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      if (!this.src.startsWith('data:')) played.push(`media:${this.src}`)
      return play.call(this)
    }
  })
})

const played = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __played: string[] }).__played)

test('sound is blocked until the child taps the speaker, and the tap is answered by Oli', async ({ page }) => {
  await page.goto('/')
  const gate = page.getByRole('button', { name: 'לחצו כדי לשמוע את אולי' })
  await expect(gate).toBeVisible()
  await expect(gate).toBeFocused() // reachable by keyboard
  expect(await played(page)).toEqual([])
  await gate.click()
  await expect(gate).toBeHidden()
  await expect(page.getByLabel('שם')).toBeVisible()
  // The profile screen says nothing by itself; the tap must still be answered with Oli's greeting (a recording).
  await expect.poll(() => played(page)).toContainEqual(expect.stringMatching(/^buffer:/))
})

test('one key press on the gate unlocks sound too', async ({ page }) => {
  await page.goto('/')
  const gate = page.getByRole('button', { name: 'לחצו כדי לשמוע את אולי' })
  await expect(gate).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(gate).toBeHidden()
  await expect.poll(() => played(page)).toContainEqual(expect.stringMatching(/^buffer:/))
})
