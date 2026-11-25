import { expect, test } from '@playwright/test'
import { createProfile } from './helpers'

// Phones and tablets keep sound blocked until the first tap. The first screen has a speaker button, and the first tap
// anywhere unlocks sound silently; nothing covers the app. Chromium's own autoplay rule applies here (the other specs
// switch it off).

test.use({ launchOptions: { args: ['--autoplay-policy=document-user-activation-required'] } })

// Records what actually starts playing: Web Audio buffers longer than the unlock blip, and <audio> sources.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    const played: string[] = []
    const contexts: AudioContext[] = []
    Object.assign(window, { __ctx: contexts })
    const Ctx = window.AudioContext
    window.AudioContext = class extends Ctx { constructor(o?: AudioContextOptions) { super(o); contexts.push(this) } }
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

const state = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __ctx: AudioContext[] }).__ctx[0]?.state)

test('the first screen has a speaker button; sound waits for the tap and the tap is answered by Oli', async ({ page }) => {
  await page.goto('/')
  const speaker = page.getByRole('button', { name: 'לחצו כדי לשמוע את אולי' })
  await expect(speaker).toBeVisible()
  await expect(page.getByLabel('שם')).toBeVisible() // nothing covers the sign-up form
  expect(await played(page)).toEqual([])
  await speaker.click()
  await expect.poll(() => played(page)).toContainEqual(expect.stringMatching(/^(buffer|media):/))
})

test('the speaker button works by keyboard', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'לחצו כדי לשמוע את אולי' }).focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => played(page)).toContainEqual(expect.stringMatching(/^(buffer|media):/))
})

test('a first tap anywhere unlocks sound without a covering screen', async ({ page, browser }) => {
  await createProfile(page)
  // A fresh browser context keeps the profile (copied IndexedDB) but has had no tap yet.
  const state0 = await page.context().storageState({ indexedDB: true })
  const ctx = await browser.newContext({ storageState: state0 })
  await ctx.addInitScript(() => {
    const contexts: AudioContext[] = []
    Object.assign(window, { __ctx: contexts })
    const Ctx = window.AudioContext
    window.AudioContext = class extends Ctx { constructor(o?: AudioContextOptions) { super(o); contexts.push(this) } }
  })
  const tab = await ctx.newPage()
  await tab.goto('/')
  await expect(tab.getByRole('button', { name: /אִי הַשָּׁעוֹן/ })).toBeVisible()
  expect(await state(tab)).not.toBe('running')
  await tab.mouse.click(5, 5)
  await expect.poll(() => state(tab)).toBe('running')
  await ctx.close()
})
