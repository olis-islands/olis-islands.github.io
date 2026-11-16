import { expect, test } from '@playwright/test'
import { createProfile } from './helpers'

for (const width of [320, 390, 1280]) {
  test(`island groups form a usable circle at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 860 })
    await createProfile(page)
    await page.mouse.move(0, 0)
    await page.addStyleTag({ content: '.island { transition: none !important; }' })
    await page.evaluate(() => document.fonts.ready)

    for (const [index, count] of [4, 3].entries()) {
      const islands = page.locator('.map').nth(index).getByRole('button')
      await expect(islands).toHaveCount(count)
      const boxes = await islands.evaluateAll(elements => elements.map(element => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { x, y, width, height }
      }))
      const [top, right, left, bottom] = boxes
      expect(top!.y + top!.height).toBeLessThan(right!.y)
      expect(top!.y + top!.height).toBeLessThan(left!.y)
      expect(Math.abs(right!.y - left!.y)).toBeLessThan(1)
      expect(right!.x + right!.width <= left!.x || left!.x + left!.width <= right!.x).toBe(true)
      expect(top!.x + top!.width / 2).toBeGreaterThan(Math.min(right!.x, left!.x))
      expect(top!.x + top!.width / 2).toBeLessThan(Math.max(right!.x + right!.width, left!.x + left!.width))
      if (bottom) expect(bottom.y).toBeGreaterThan(Math.max(right!.y + right!.height, left!.y + left!.height))
      for (const box of boxes) {
        expect(box.width).toBeGreaterThanOrEqual(64)
        expect(box.height).toBeGreaterThanOrEqual(64)
      }
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    const clock = page.getByRole('button', { name: /אִי הַשָּׁעוֹן/ })
    await clock.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/island\/clock$/)
  })
}
