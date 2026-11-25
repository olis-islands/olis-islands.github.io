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

const FIREWALL_KINDS = ['allowTo', 'allowFrom', 'blockTo', 'blockFrom'] as const
const FIREWALL_SHAPES = ['circle', 'triangle', 'square', 'star'] as const

/** Reads the rule and the packet from the page and returns the right choice's name. */
async function firewallAnswer(page: Page) {
  const shapeOf = (name: string) => FIREWALL_SHAPES.find(s => phrases[`networks.shape.${s}`] === name.trim())!
  const rule = (await page.locator('.pk-sentence').innerText()).trim()
  const kind = FIREWALL_KINDS.find(k => rule.startsWith(phrases[`networks.rule.${k}`]!))!
  const ruleShape = shapeOf(rule.slice(phrases[`networks.rule.${kind}`]!.length))
  const packet = (await page.getByRole('img', { name: new RegExp(`^${phrases['networks.ui.sender']}:`) }).getAttribute('aria-label'))!
  const [, from, to] = /: (.+)\. .+: (.+)\.$/.exec(packet)!
  const value = kind.endsWith('To') ? shapeOf(to!) : shapeOf(from!)
  const goesIn = kind.startsWith('allow') ? value === ruleShape : value !== ruleShape
  return { kind, right: phrases[goesIn ? 'networks.ui.allow' : 'networks.ui.block']!, wrong: phrases[goesIn ? 'networks.ui.block' : 'networks.ui.allow']! }
}

test('firewall: a full round reading the rule and the packet; a wrong choice stays disabled', async ({ page }) => {
  await open(page, /נִכְנֶסֶת אוֹ נֶעֱצֶרֶת/, ['networks.delivery'])
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const { right, wrong } = await firewallAnswer(page)
    if (i === 0) {
      await page.getByRole('button', { name: wrong, exact: true }).click()
      await expect(page.getByRole('button', { name: wrong, exact: true })).toBeDisabled()
    }
    await page.getByRole('button', { name: right, exact: true }).click()
    await expect(page.locator('.pk-opt.ok')).toHaveCount(1)
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
})

test('firewall: Oli’s help opens mid-round, gives a clue about the checked field, and costs nothing', async ({ page }) => {
  await open(page, /נִכְנֶסֶת אוֹ נֶעֱצֶרֶת/, ['networks.delivery'])
  const owl = page.getByRole('button', { name: /צְרִיכִים עֶזְרָה/ })
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const { kind, right } = await firewallAnswer(page)
    if (i === 0) {
      const rule = await page.locator('.pk-sentence').innerText()
      await owl.click()
      await expect(owl).toHaveAttribute('aria-expanded', 'true')
      await page.getByText('אֵיךְ מְשַׂחֲקִים?').click()
      await expect(page.getByText(/קוראים את הכלל של השער/)).toBeVisible()
      await page.getByText('אֶפְשָׁר רֶמֶז?').click()
      await expect(page.getByText(kind.endsWith('To') ? /בודק רק את המקבל/ : /בודק רק את השולח/)).toBeVisible()
      await page.getByRole('button', { name: /שִׁמְעוּ שׁוּב/ }).click()
      await page.keyboard.press('Escape')
      await expect(owl).toBeFocused()
      // Help changes nothing: same question, no attempt, no option marked.
      await expect(page.locator('.pk-sentence')).toHaveText(rule)
      await expect(page.locator('.dot.done')).toHaveCount(0)
      await expect(page.locator('.pk-opt.ok, .pk-opt.bad')).toHaveCount(0)
    }
    await page.getByRole('button', { name: right, exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.pk-opt.ok')).toHaveCount(1)
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})
