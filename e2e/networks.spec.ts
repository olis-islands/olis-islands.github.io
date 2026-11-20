import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile, master } from './helpers'
import { phrases } from '../src/subjects/networks/phrases'

// Plays the networks island through the real UI (docs/specs/networks.md). Everything is simulated: the island
// must never reach outside the app's own origin.

const ADDRESS = `${phrases['networks.ui.address']} `

async function open(page: Page, link = /לְאָן הַהוֹדָעָה/, mastered: string[] = []) {
  await createProfile(page)
  if (mastered.length) await master(page, mastered)
  await page.getByRole('button', { name: /אִי הָרְשָׁתוֹת/ }).click()
  await page.getByRole('link', { name: link }).click()
}

/** The computer's name is the address written on the envelope. */
async function target(page: Page) {
  const label = await page.getByRole('img', { name: /^הַכְּתֹבֶת הִיא / }).getAttribute('aria-label')
  return label!.slice(ADDRESS.length)
}

test('delivery: a full round by keyboard, with misses and the hint, keeps its stars after reload, and stays offline', async ({ page, baseURL }) => {
  const outside: string[] = []
  page.on('request', r => { if (new URL(r.url()).origin !== new URL(baseURL!).origin && !r.url().startsWith('data:')) outside.push(r.url()) })
  await open(page)

  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const name = await target(page)
    const options = page.locator('.pk-opt')
    await expect(options).toHaveCount(3)
    if (i === 0) {
      // Both wrong computers: each stays visible but disabled, and the hint appears after two misses.
      for (const opt of await options.all()) {
        if ((await opt.getAttribute('aria-label')) === name) continue
        await opt.click()
        await expect(opt).toBeDisabled()
      }
      await expect(page.locator('.pk-hint')).toBeVisible()
      await expect(page.locator('.pk-opt.ok')).toHaveCount(0)
    }
    await page.getByRole('button', { name, exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.pk-opt.ok')).toHaveCount(1)
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
  const stars = await page.locator('.stars').innerText()
  expect(stars).toMatch(/⭐ [1-3]/)
  await page.reload()
  await expect(page.locator('.stars')).toHaveText(stars)
  expect(outside).toEqual([])
})

const PACKET = `${phrases['networks.ui.packet']} `

test('packets: a full round ordered by keyboard; a wrong packet counts and stays in the tray', async ({ page }) => {
  await open(page, /סַדְּרוּ אֶת הַחֲבִילוֹת/, ['networks.delivery'])
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const tiles = page.locator('.rb-tile')
    await expect(tiles.first()).toBeVisible()
    const count = await tiles.count()
    expect([3, 4]).toContain(count)
    if (i === 0) {
      const wrong = page.getByRole('button', { name: `${PACKET}${count}`, exact: true })
      await wrong.click()
      await expect(wrong).toBeVisible()
      await expect(page.locator('.rb-slot.filled')).toHaveCount(0)
    }
    for (let n = 1; n <= count; n++) {
      await page.getByRole('button', { name: `${PACKET}${n}`, exact: true }).focus()
      await page.keyboard.press('Enter')
      await expect(page.locator('.rb-slot.filled')).toHaveCount(n)
    }
    // The slots read 1, 2, 3… from the top.
    await expect(page.locator('.rb-slot')).toHaveText(Array.from({ length: count }, (_, k) => `${k + 1}${PACKET}${k + 1}`))
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
})

test('retry: a full round, comparing what was expected with what arrived; misses bring the hint', async ({ page }) => {
  await open(page, /אֵיזוֹ חֲבִילָה חָסֵרָה/, ['networks.delivery', 'networks.packets'])
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const label = (await page.getByRole('img', { name: /^הַמַּחְשֵׁב חִכָּה/ }).getAttribute('aria-label'))!
    const total = Number(/1 עַד (\d)/.exec(label)![1])
    const arrived = /הִגִּיעוּ: ([\d, ]+)\./.exec(label)![1]!.split(', ').map(Number)
    const missing = Array.from({ length: total }, (_, k) => k + 1).find(n => !arrived.includes(n))!
    if (i === 0) {
      for (const opt of await page.locator('.pk-opt').all()) {
        if ((await opt.getAttribute('aria-label')) === `${missing}`) continue
        await opt.click()
        await expect(opt).toBeDisabled()
      }
      await expect(page.locator('.pk-hint')).toBeVisible()
    }
    await page.getByRole('button', { name: `${missing}`, exact: true }).click()
    await expect(page.locator('.pk-opt.ok')).toHaveCount(1)
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
})
