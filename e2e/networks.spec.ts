import { expect, test, type Page } from '@playwright/test'
import { atQuestion, createProfile, master } from './helpers'
import { EVIDENCE, STAGES } from '../src/subjects/networks/content/detective'
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

test('name lookup: a full round finding the full name in the address book; two misses bring the hint', async ({ page }) => {
  await open(page, /מָה הַכְּתֹבֶת\?/, ['networks.delivery'])
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const name = (await page.locator('.pk-sentence').innerText()).trim()
    const row = page.locator('table tbody tr').filter({ has: page.getByRole('cell', { name, exact: true }) })
    await expect(row).toHaveCount(1)
    const address = (await row.locator('td').nth(1).innerText()).trim()
    if (i === 0) {
      for (const opt of await page.locator('.pk-opt').all()) {
        if ((await opt.innerText()).trim() === address) continue
        await opt.click()
        await expect(opt).toBeDisabled()
      }
      await expect(page.locator('.pk-hint')).toBeVisible()
    }
    await page.getByRole('button', { name: address, exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.pk-opt.ok')).toHaveCount(1)
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
})

test('web request: a full round answering with the exact page or "not found"; two misses bring the hint', async ({ page }) => {
  await open(page, /מָה הַסִּפְרִיָּה עוֹנָה/, ['networks.delivery', 'networks.dns'])
  const lead = `${phrases['networks.ui.pageAbout']} `
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const topic = (await page.locator('.pk-sentence').innerText()).trim().slice(lead.length)
    const labels = await page.locator('.pk-opt').evaluateAll(els => els.map(e => e.getAttribute('aria-label') ?? ''))
    expect(labels).toHaveLength(4)
    const answer = labels.includes(topic) ? topic : phrases['networks.ui.notFound']!
    if (i === 0) {
      for (const label of labels.filter(l => l !== answer).slice(0, 2)) {
        await page.getByRole('button', { name: label, exact: true }).click()
        await expect(page.getByRole('button', { name: label, exact: true })).toBeDisabled()
      }
      await expect(page.locator('.pk-hint')).toBeVisible()
    }
    await page.getByRole('button', { name: answer, exact: true }).click()
    await expect(page.locator('.pk-opt.ok')).toHaveCount(1)
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
})

test('route: a full round solved from the map’s description; two misses bring the hint', async ({ page }) => {
  await open(page, /לְאָן מִכָּאן/, ['networks.delivery'])
  const computer = 'הַמַּחְשֵׁב'
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const label = (await page.getByRole('img', { name: /^מַפָּה:/ }).getAttribute('aria-label'))!
    const open = [...label.matchAll(/גֶּשֶׁר בֵּין ([^:.]+) וּבֵין ([^:.]+): פָּתוּחַ\./g)].map(m => [m[1]!, m[2]!] as const)
    const gets = (start: string) => {
      const seen = new Set([start])
      const queue = [start]
      while (queue.length) {
        const at = queue.shift()!
        if (at === computer) return true
        for (const [a, b] of open) {
          const next = a === at ? b : b === at ? a : undefined
          if (next && !seen.has(next)) { seen.add(next); queue.push(next) }
        }
      }
      return false
    }
    const labels = await page.locator('.pk-opt').evaluateAll(els => els.map(e => e.getAttribute('aria-label') ?? ''))
    const right = labels.filter(gets)
    expect(right).toHaveLength(1)
    if (i === 0) {
      for (const wrong of labels.filter(l => l !== right[0])) {
        await page.getByRole('button', { name: wrong, exact: true }).click()
        await expect(page.getByRole('button', { name: wrong, exact: true })).toBeDisabled()
      }
      await expect(page.locator('.pk-hint')).toBeVisible()
    }
    await page.getByRole('button', { name: right[0], exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.pk-opt.ok')).toHaveCount(1)
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
})

test('locked message: full rounds; "who can open" shows the safety line and waits for "got it"', async ({ page }) => {
  await open(page, /מִי רוֹאֶה מָה/, ['networks.delivery'])
  const opensQ = phrases['networks.q.privacyOpens']!
  let sawOpens = false
  // A round has about two "who can open" questions; play again (at most 4 rounds) until one has come up.
  for (let round = 0; round < 4 && !sawOpens; round++) {
    if (round > 0) await page.getByRole('button', { name: 'שחקו שוב' }).click()
    for (let i = 0; i < 6; i++) {
      await atQuestion(page, i)
      const instruction = (await page.locator('.pk-q').innerText()).trim()
      let answer: string
      if (instruction === opensQ) {
        const scene = (await page.getByRole('img', { name: /^קֻפְסָה/ }).getAttribute('aria-label'))!
        answer = /הַמַּפְתֵּחַ אֵצֶל (.+)\.$/.exec(scene)![1]!
      } else {
        const open = (await page.locator('.pk-sentence').innerText()).includes('קֻפְסָה פְּתוּחָה')
        answer = phrases[open ? 'networks.ui.knowsBoth' : 'networks.ui.knowsTo']!
      }
      if (round === 0 && i === 0) {
        const labels = await page.locator('.pk-opt').evaluateAll(els => els.map(e => e.getAttribute('aria-label') ?? ''))
        for (const wrong of labels.filter(l => l !== answer).slice(0, 2)) {
          await page.getByRole('button', { name: wrong, exact: true }).click()
          await expect(page.getByRole('button', { name: wrong, exact: true })).toBeDisabled()
        }
        await expect(page.locator('.pk-hint')).toBeVisible()
      }
      await page.getByRole('button', { name: answer, exact: true }).click()
      await expect(page.locator('.pk-opt.ok')).toHaveCount(1)
      if (instruction === opensQ) {
        sawOpens = true
        // The round waits: the safety line is shown, and only "got it" moves on.
        await expect(page.getByRole('status').filter({ hasText: 'סִּיסְמָה' })).toBeVisible()
        await expect(page.locator('.dot.done')).toHaveCount(i)
        await page.getByRole('button', { name: phrases['networks.ui.gotIt']! }).press('Enter')
      }
    }
    await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
  }
  expect(sawOpens).toBe(true)
})

test('detective: a full round; answers wait for all four checks, two misses bring the hint', async ({ page }) => {
  await open(page, /מָה לֹא עוֹבֵד/, ['networks.delivery', 'networks.route', 'networks.retry', 'networks.firewall', 'networks.dns', 'networks.web'])
  const failing = new Set(STAGES.flatMap(s => EVIDENCE[s.id].fail))
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const answers = page.locator('.nd-answer')
    await expect(answers).toHaveCount(4)
    for (const a of await answers.all()) await expect(a).toBeDisabled()
    let fault = ''
    for (const s of STAGES) {
      await page.getByRole('button', { name: `בְּדִיקָה: ${s.name}` }).focus()
      await page.keyboard.press('Enter')
      const row = page.locator('.nd-row').filter({ has: page.getByRole('button', { name: `בְּדִיקָה: ${s.name}` }) })
      const result = (await row.locator('.nd-result').innerText()).trim()
      if (failing.has(result)) fault = s.name
    }
    expect(fault).not.toBe('')
    if (i === 0) {
      for (const s of STAGES.filter(s => s.name !== fault).slice(0, 2)) {
        await page.getByRole('button', { name: s.name, exact: true }).click()
        await expect(page.getByRole('button', { name: s.name, exact: true })).toBeDisabled()
      }
      await expect(page.locator('.nd-hint')).toBeVisible()
    }
    await page.getByRole('button', { name: fault, exact: true }).click()
    await expect(page.locator('.nd-answer.ok')).toHaveCount(1)
  }
  await expect(page.getByRole('button', { name: 'שחקו שוב' })).toBeVisible()
})
