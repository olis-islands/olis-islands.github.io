import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile } from './helpers'
import { phrases } from '../src/subjects/networks/phrases'

// Plays the networks island through the real UI (docs/specs/networks.md). Everything is simulated: the island
// must never reach outside the app's own origin.

const ADDRESS = `${phrases['networks.ui.address']} `

async function open(page: Page) {
  await createProfile(page)
  await page.getByRole('button', { name: /אִי הָרְשָׁתוֹת/ }).click()
  await page.getByRole('link', { name: /לְאָן הַהוֹדָעָה/ }).click()
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
