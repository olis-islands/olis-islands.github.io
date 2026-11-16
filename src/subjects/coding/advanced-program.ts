import type { Board, Cell, Dir } from './types'
import type {
  Action, AdvancedCard, AdvancedProgram, AdvancedRun, AdvancedState, BalanceItem, Block, ConditionScenario,
  EventScenario, Facing, SearchScenario,
} from './advanced-types'

export const MAX_MAIN_CARDS = 10
export const MAX_CALLS = 4
export const MAX_OPERATIONS = 40
const FACINGS: readonly Facing[] = ['up', 'right', 'down', 'left']
const DELTA: Readonly<Record<Dir, Cell>> = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] }

/** A quarter turn is relative to the character, not the board. */
export function turn(facing: Facing, direction: 'left' | 'right'): Facing {
  const offset = direction === 'right' ? 1 : 3
  return FACINGS[(FACINGS.indexOf(facing) + offset) % FACINGS.length]!
}

function validBoard(board: Board): boolean {
  if (!board.rows.length || !board.rows[0]?.length) return false
  const width = board.rows[0].length
  const text = board.rows.join('')
  return board.rows.every(row => row.length === width && /^[.#SG]+$/.test(row))
    && [...text].filter(c => c === 'S').length === 1 && [...text].filter(c => c === 'G').length === 1
}

function findCell(board: Board, marker: 'S' | 'G'): Cell {
  const row = board.rows.findIndex(line => line.includes(marker))
  return [row, board.rows[row]!.indexOf(marker)]
}

function same(a: Cell, b: Cell): boolean {
  return a[0] === b[0] && a[1] === b[1]
}

interface Operation { action: Action; card: number; blockStep?: number }

/** Validate before running so an incomplete program never becomes a scored attempt. */
export function runAdvanced(board: Board, initialFacing: Facing, program: AdvancedProgram, block?: Block): AdvancedRun {
  if (!validBoard(board) || !FACINGS.includes(initialFacing)) return { kind: 'invalid', reason: 'board' }
  if (!program.length || program.length > MAX_MAIN_CARDS) return { kind: 'invalid', reason: 'program' }
  const actions: readonly AdvancedCard[] = ['forward', 'left', 'right', 'call']
  if (program.some(card => !actions.includes(card))) return { kind: 'invalid', reason: 'program' }
  const calls = program.filter(card => card === 'call').length
  if (calls > MAX_CALLS) return { kind: 'invalid', reason: 'limit' }
  if (calls && (!block || block.length < 2 || block.length > 3
    || block.some(action => action !== 'forward' && action !== 'left' && action !== 'right'))) {
    return { kind: 'invalid', reason: 'block' }
  }
  const operations: Operation[] = program.flatMap((card, index) => card === 'call'
    ? block!.map((action, blockStep) => ({ action, card: index, blockStep }))
    : [{ action: card, card: index }])
  if (operations.length > MAX_OPERATIONS) return { kind: 'invalid', reason: 'limit' }

  const goal = findCell(board, 'G')
  let cell = findCell(board, 'S')
  let facing = initialFacing
  const trace: AdvancedState[] = [{ cell, facing }]
  for (const op of operations) {
    if (op.action === 'forward') {
      const step = DELTA[facing]
      const next: Cell = [cell[0] + step[0], cell[1] + step[1]]
      if (next[0] < 0 || next[0] >= board.rows.length || next[1] < 0
        || next[1] >= board.rows[0]!.length || board.rows[next[0]]![next[1]] === '#') {
        return { kind: 'blocked', trace, reachedGoal: false, stoppedAt: op.card }
      }
      cell = next
    } else facing = turn(facing, op.action)
    trace.push({ cell, facing, card: op.card, ...(op.blockStep === undefined ? {} : { blockStep: op.blockStep }) })
  }
  return { kind: 'complete', trace, reachedGoal: same(cell, goal) }
}

/** A shortcut question is incomplete until its definition is called at least twice. */
export function runShortcut(board: Board, initialFacing: Facing, program: AdvancedProgram, block?: Block): AdvancedRun {
  if (program.filter(card => card === 'call').length < 2) return { kind: 'invalid', reason: 'program' }
  return runAdvanced(board, initialFacing, program, block)
}

export function triggerEvent(scenario: EventScenario) {
  return scenario.events[scenario.trigger]?.action
}

export function conditionAction(scenario: ConditionScenario, state: 0 | 1) {
  return scenario.actions[state === scenario.trueState ? 0 : 1]
}

export function traceCounter(start: number, changes: readonly (1 | -1)[]): number[] | null {
  if (!Number.isInteger(start) || start < 0 || start > 9) return null
  const trace = [start]
  for (const change of changes) {
    const next = trace.at(-1)! + change
    if (next < 0 || next > 9) return null
    trace.push(next)
  }
  return trace
}

const BINARY_WEIGHTS = [8, 4, 2, 1] as const

export function binaryValue(lights: readonly boolean[]): number | null {
  if (lights.length !== BINARY_WEIGHTS.length) return null
  return lights.reduce((sum, isOn, index) => sum + (isOn ? BINARY_WEIGHTS[index]! : 0), 0)
}

export function binaryLights(value: number): boolean[] | null {
  if (!Number.isInteger(value) || value < 0 || value > 15) return null
  return BINARY_WEIGHTS.map(weight => (value & weight) !== 0)
}

export function compareBalance(a: BalanceItem, b: BalanceItem): -1 | 0 | 1 {
  return a.weight < b.weight ? -1 : a.weight > b.weight ? 1 : 0
}

export interface BalanceComparison { lighter: string; heavier: string }

export function uniqueBalanceOrder(items: readonly BalanceItem[], comparisons: readonly BalanceComparison[]): string[] | null {
  const ids = items.map(item => item.id)
  if (new Set(ids).size !== ids.length) return null
  const edges = new Map(ids.map(id => [id, new Set<string>()]))
  const degree = new Map(ids.map(id => [id, 0]))
  for (const { lighter, heavier } of comparisons) {
    if (!edges.has(lighter) || !edges.has(heavier) || lighter === heavier || edges.get(lighter)!.has(heavier)) continue
    edges.get(lighter)!.add(heavier)
    degree.set(heavier, degree.get(heavier)! + 1)
  }
  const order: string[] = []
  while (order.length < ids.length) {
    const next = ids.filter(id => degree.get(id) === 0 && !order.includes(id))
    if (next.length !== 1) return null
    const id = next[0]!
    order.push(id)
    for (const heavier of edges.get(id)!) degree.set(heavier, degree.get(heavier)! - 1)
  }
  return order
}

export function searchCandidates(scenario: SearchScenario): number[] {
  if (!scenario.values.length || new Set(scenario.revealed).size !== scenario.revealed.length
    || scenario.revealed.some(index => !Number.isInteger(index) || index < 0 || index >= scenario.values.length)) return []
  let first = 0
  let last = scenario.values.length - 1
  for (const index of scenario.revealed) {
    const value = scenario.values[index]!
    if (value === scenario.target) return []
    if (value < scenario.target) first = Math.max(first, index + 1)
    else last = Math.min(last, index - 1)
  }
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, offset) => first + offset)
    .filter(index => !scenario.revealed.includes(index))
}

export function searchMidpoint(scenario: SearchScenario): number | null {
  const candidates = searchCandidates(scenario)
  if (!candidates.length || candidates.length % 2 === 0) return null
  return candidates[Math.floor(candidates.length / 2)]!
}
