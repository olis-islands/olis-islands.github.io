import { expect, test, type Page } from '@playwright/test'
import { atQuestion } from './helpers'

// Full flow: profile → map → clock island → round → stars → reload keeps progress.

async function createProfile(page: Page) {
  await page.goto('/')
  await page.getByLabel('שם').fill('נועה')
  await page.getByRole('button', { name: 'יאללה!' }).click()
  await expect(page.getByRole('button', { name: /אִי הַשָּׁעוֹן/ })).toBeVisible()
}

test('a child can create a profile, play a round, and keep progress after reload', async ({ page }) => {
  await createProfile(page)
  await page.getByRole('button', { name: /אִי הַשָּׁעוֹן/ }).click()
  await page.getByRole('link', { name: /אֵיזֶה מָחוֹג/ }).click()

  // "Which hand?" — read the prompt and click the matching hand, six times.
  for (let i = 0; i < 6; i++) {
    // Wait for the round to reach question i rather than sleeping: fixed delays were flaky under load.
    await expect(page.locator('.dot.done')).toHaveCount(i)
    const prompt = await page.locator('.clock-q').innerText()
    const hand = prompt.includes('הַקָּצָר') ? 'מחוג השעות' : 'מחוג הדקות'
    // Click the tip, as a child would: near the hub the two hands are close together.
    await page.getByRole('button', { name: hand }).locator('circle').click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
  await expect(page.locator('.stars')).toHaveText('⭐ 3')

  await page.reload()
  await expect(page.locator('.stars')).toHaveText('⭐ 3')
})

test('clock hands can be set by dragging and by keyboard', async ({ page }) => {
  await createProfile(page)
  await page.getByRole('button', { name: /אִי הַשָּׁעוֹן/ }).click()
  await page.getByRole('link', { name: /כַּוְּנוּ אֶת הַשָּׁעוֹן/ }).first().click()

  const clock = page.locator('svg.clock')
  const box = (await clock.boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const hour = page.getByRole('slider', { name: 'מחוג השעות' })

  // Set games start at 9:00 with the hands apart. Drag the hour hand to 3 o'clock.
  const tip = (await hour.locator('circle').boundingBox())!
  await page.mouse.move(tip.x + tip.width / 2, tip.y + tip.height / 2)
  await page.mouse.down()
  await page.mouse.move(cx + box.width * 0.2, cy, { steps: 8 })
  await page.mouse.up()
  await expect(hour).toHaveAttribute('aria-valuetext', 'שָׁלוֹשׁ')

  // Keyboard: one step forward.
  await hour.focus()
  await page.keyboard.press('ArrowUp')
  await expect(hour).toHaveAttribute('aria-valuetext', 'אַרְבַּע')
})

test('Oli help preserves a full hour-only round and its stars', async ({ page }) => {
  await createProfile(page)
  await page.goto('/#/play/clock/clock.hands/set')
  const owl = page.getByRole('button', { name: /צְרִיכִים עֶזְרָה/ })
  const hand = page.getByRole('slider', { name: 'מחוג השעות' })
  await expect(hand).toBeVisible()
  for (let i = 0; i < 6; i++) {
    await atQuestion(page, i)
    const target = await page.locator('.clock-target').innerText()
    if (i === 0) {
      const before = await hand.getAttribute('aria-valuetext')
      await owl.click()
      await expect(owl).toHaveAttribute('aria-expanded', 'true')
      await page.getByText('אֵיךְ מְשַׂחֲקִים?').click()
      await expect(page.getByText(/מזיזים את המחוג הקצר לשעה/)).toBeVisible()
      await page.getByText('אֶפְשָׁר רֶמֶז?').click()
      await expect(hand).toHaveAttribute('aria-valuetext', before!)
      await page.getByRole('button', { name: /שִׁמְעוּ שׁוּב/ }).click()
      await page.keyboard.press('Escape')
      await expect(owl).toBeFocused()
      await expect(page.locator('.dot.done')).toHaveCount(0)
      await owl.click()
      await expect(page.getByText('אֵיךְ מְשַׂחֲקִים?').locator('..')).not.toHaveAttribute('open', '')
    } else if (i === 1) {
      await expect(owl).toHaveAttribute('aria-expanded', 'false')
    }
    await hand.focus()
    for (let n = 0; n < 12 && await hand.getAttribute('aria-valuetext') !== target; n++) {
      await page.keyboard.press('ArrowUp')
    }
    await expect(hand).toHaveAttribute('aria-valuetext', target)
    await page.getByRole('button', { name: /בְּדִיקָה/ }).click()
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible()
})

test('clock help matches two-hand games after a miss but does not appear in Oli’s day', async ({ page }) => {
  await createProfile(page)
  await page.goto('/#/play/clock/clock.half/set')
  const hour = page.getByRole('slider', { name: 'מחוג השעות' })
  const minute = page.getByRole('slider', { name: 'מחוג הדקות' })
  await expect(hour).toBeVisible()
  await expect(minute).toBeVisible()
  await page.getByRole('button', { name: /בְּדִיקָה/ }).click()
  await expect(page.locator('.fb')).not.toBeEmpty()
  const before = await hour.getAttribute('aria-valuetext')
  const beforeMinute = await minute.getAttribute('aria-valuetext')
  await page.getByRole('button', { name: /צְרִיכִים עֶזְרָה/ }).click()
  await page.getByText('אֵיךְ מְשַׂחֲקִים?').click()
  await expect(page.getByText(/מזיזים את המחוגים לשעה/)).toBeVisible()
  await page.getByRole('button', { name: 'סְגִירָה' }).click()
  await expect(hour).toHaveAttribute('aria-valuetext', before!)
  await expect(minute).toHaveAttribute('aria-valuetext', beforeMinute!)
  await expect(page.locator('.dot.done')).toHaveCount(0)

  await page.getByRole('button', { name: /בְּדִיקָה/ }).click()
  await expect(page.locator('svg.clock line[stroke-dasharray="4 6"]')).toHaveCount(2)
  await page.getByRole('button', { name: /צְרִיכִים עֶזְרָה/ }).click()
  await page.getByText('אֶפְשָׁר רֶמֶז?').click()
  await expect(page.locator('svg.clock line[stroke-dasharray="4 6"]')).toHaveCount(2)
  await expect(hour).toHaveAttribute('aria-valuetext', before!)

  await page.goto('/#/play/clock/clock.day/day')
  await expect(page.locator('.clock-scene')).toBeVisible()
  await expect(page.getByRole('button', { name: /צְרִיכִים עֶזְרָה/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /לחצו עליי כדי לשמוע שוב/ })).toBeVisible()
})

test.describe('touch help', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 860 } })

  test('opens and closes help by touch', async ({ page }) => {
    await createProfile(page)
    await page.goto('/#/play/clock/clock.hands/set')
    const owl = page.getByRole('button', { name: /צְרִיכִים עֶזְרָה/ })
    await owl.tap()
    await page.getByText('אֶפְשָׁר רֶמֶז?').tap()
    await expect(page.getByText(/הסתכלו על השעה/)).toBeVisible()
    await page.getByRole('button', { name: 'סְגִירָה' }).tap()
    await expect(owl).toHaveAttribute('aria-expanded', 'false')
  })
})
