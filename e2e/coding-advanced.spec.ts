import { expect, test, type Page } from '@playwright/test'
import { advancedPhrases } from '../src/subjects/coding/advanced-phrases'
import { createProfile, master, atQuestion } from './helpers'

type Facing = 'up' | 'right' | 'down' | 'left'
type State = { row: number; col: number; facing: Facing; actions: number[] }
const FACE: Record<string, Facing> = { '↑': 'up', '→': 'right', '↓': 'down', '←': 'left' }
const DELTA: Readonly<Record<Facing, readonly [number, number]>> = {
  up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1],
}
const turn = (facing: Facing, direction: 'left' | 'right'): Facing => {
  const dirs: readonly Facing[] = ['up', 'right', 'down', 'left']
  return dirs[(dirs.indexOf(facing) + (direction === 'right' ? 1 : 3)) % 4]!
}

async function route(page: Page): Promise<number[]> {
  const layout = await page.locator('.cd-play svg.cd-board').evaluate(svgNode => {
    const svg = svgNode as SVGSVGElement
    const cells = [...svg.querySelectorAll('rect.cd-free, rect.cd-wall')] as SVGRectElement[]
    const cellSize = cells[0]!.width.baseVal.value + 4
    const cols = Math.round(svg.viewBox.baseVal.width / cellSize)
    const rows = cells.length / cols
    const position = (element: Element) => {
      const rect = element.getBoundingClientRect()
      const boardRect = svg.getBoundingClientRect()
      const scale = svg.viewBox.baseVal.width / boardRect.width
      return {
        row: Math.floor((rect.y + rect.height / 2 - boardRect.y) * scale / cellSize),
        col: Math.floor((rect.x + rect.width / 2 - boardRect.x) * scale / cellSize),
      }
    }
    const start = position(svg.querySelector('g')!)
    const goal = position(svg.querySelector('text')!)
    return {
      rows, cols, walls: cells.filter(cell => cell.classList.contains('cd-wall')).map(cell =>
        `${Math.floor(cell.y.baseVal.value / cellSize)},${Math.floor(cell.x.baseVal.value / cellSize)}`,
      ),
      start, goal, facing: document.querySelector('.cd-facing span')?.textContent?.trim() ?? '',
    }
  })
  const facing = FACE[layout.facing]
  if (!facing) throw new Error('Oli has no visible facing marker')
  const queue: State[] = [{ ...layout.start, facing, actions: [] }]
  const walls = new Set(layout.walls)
  const visited = new Set<string>()
  while (queue.length) {
    const current = queue.shift()!
    if (current.row === layout.goal.row && current.col === layout.goal.col) return current.actions
    const key = `${current.row},${current.col},${current.facing}`
    if (visited.has(key)) continue
    visited.add(key)
    queue.push({ ...current, facing: turn(current.facing, 'left'), actions: [...current.actions, 1] })
    queue.push({ ...current, facing: turn(current.facing, 'right'), actions: [...current.actions, 2] })
    const [dr, dc] = DELTA[current.facing]
    const row = current.row + dr
    const col = current.col + dc
    if (row >= 0 && row < layout.rows && col >= 0 && col < layout.cols && !walls.has(`${row},${col}`)) {
      queue.push({ ...current, row, col, actions: [...current.actions, 0] })
    }
  }
  throw new Error('Facing board has no route to its goal')
}

test('facing and turns: a keyboard-built program reaches the goal in a full round', async ({ page }) => {
  await createProfile(page)
  await master(page, ['code.arrows'])
  await page.getByRole('button', { name: /אִי הַתִּכְנוּת/ }).click()
  await page.getByRole('link', { name: /פּוֹנִים וְזוֹזִים/ }).first().click()

  for (let question = 0; question < 6; question++) {
    await atQuestion(page, question)
    const actions = await route(page)
    for (const action of actions) {
      const button = page.locator('.cd-pal').nth(action)
      await button.focus()
      await page.keyboard.press('Enter')
    }
    await page.getByRole('button', { name: advancedPhrases['code.ui.facing.run']! }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('status')).toHaveText(advancedPhrases['code.fb.facing.goal']!, { timeout: 10000 })
  }
  await expect(page.getByText('אלופים! שלושה כוכבים!')).toBeVisible({ timeout: 15000 })
})
