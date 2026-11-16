import { shuffle } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import { ADV } from './advanced-ids'
import type {
  AdvancedProgramQ, BalanceQ, BalanceScenario, BinaryQ, ConditionQ, ConditionScenario, CounterQ, CounterScenario,
  EventQ, EventScenario, FacingItem, FunctionItem, SearchQ, SearchScenario,
} from './advanced-types'
import { binaryLights, searchMidpoint, traceCounter } from './advanced-program'

const key = (item: FacingItem) => `facing:${item.id}`
export const facingAccepts = (itemKey: string) => itemKey.startsWith('facing:')

function choose<T>(ctx: GenContext, items: readonly T[], itemKey: (item: T) => string): T {
  const review = items.find(item => itemKey(item) === ctx.review)
  const unseen = shuffle(ctx.rng, items.filter(item => itemKey(item) !== ctx.review && !ctx.avoid.has(itemKey(item))))
  const remaining = shuffle(ctx.rng, items.filter(item => itemKey(item) !== ctx.review && ctx.avoid.has(itemKey(item))))
  const item = review ?? unseen[0] ?? remaining[0]
  if (item === undefined) throw new Error('no valid scenario to ask')
  return item
}

export function facingQuestion(ctx: GenContext, items: readonly FacingItem[]): AdvancedProgramQ {
  const item = choose(ctx, items, key)
  return {
    itemKey: key(item),
    answer: null,
    say: ADV.facing,
    instruction: ADV.facing,
    hint: ADV.hintFacing,
    level: { board: item.board, facing: item.facing },
    mode: 'facing',
  }
}

const eventKey = (item: EventScenario) => `event:${item.id}`
export const eventAccepts = (itemKey: string) => itemKey.startsWith('event:')

export function eventQuestion(ctx: GenContext, items: readonly EventScenario[]): EventQ {
  const scenario = choose(ctx, items, eventKey)
  const triggered = scenario.events[scenario.trigger]
  if (!triggered || scenario.events.length < 2) throw new Error(`invalid event scenario: ${scenario.id}`)
  return {
    itemKey: eventKey(scenario),
    answer: triggered.action.id,
    say: ADV.event,
    instruction: ADV.event,
    hint: ADV.hintEvent,
    scenario,
  }
}

const conditionKey = (item: ConditionScenario) => `condition:${item.id}`
export const conditionAccepts = (itemKey: string) => itemKey.startsWith('condition:')

export function conditionQuestion(ctx: GenContext, items: readonly ConditionScenario[]): ConditionQ {
  const scenario = choose(ctx, items, conditionKey)
  return {
    itemKey: conditionKey(scenario),
    answer: null,
    say: ADV.condition,
    instruction: ADV.condition,
    hint: ADV.hintCondition,
    scenario,
  }
}

const counterKey = (item: CounterScenario) => `variable:${item.id}`
export const counterAccepts = (itemKey: string) => itemKey.startsWith('variable:')

export function counterQuestion(ctx: GenContext, items: readonly CounterScenario[]): CounterQ {
  const scenario = choose(ctx, items, counterKey)
  const trace = traceCounter(scenario.start, scenario.changes)
  if (!trace || scenario.changes.length < 2 || scenario.changes.length > 4) throw new Error(`invalid counter scenario: ${scenario.id}`)
  const answer = trace.at(-1)!
  const distractors = shuffle(ctx.rng, [answer - 2, answer - 1, answer + 1, answer + 2].filter(value => value >= 0 && value <= 9 && value !== answer)).slice(0, 2)
  const options = shuffle(ctx.rng, [answer, ...distractors])
  if (new Set(options).size !== 3) throw new Error(`counter options are not distinct: ${scenario.id}`)
  return {
    itemKey: counterKey(scenario),
    answer,
    say: ADV.counter,
    instruction: ADV.counter,
    hint: ADV.hintCounter,
    scenario,
    options,
  }
}

const functionKey = (item: FunctionItem) => `function:${item.id}`
export const functionAccepts = (itemKey: string) => itemKey.startsWith('function:')

export function functionQuestion(ctx: GenContext, items: readonly FunctionItem[]): AdvancedProgramQ {
  const item = choose(ctx, items, functionKey)
  return {
    itemKey: functionKey(item),
    answer: null,
    say: ADV.function,
    instruction: ADV.function,
    hint: ADV.hintFunction,
    level: { board: item.board, facing: item.facing },
    mode: 'function',
  }
}

export const binaryAccepts = (itemKey: string) => itemKey.startsWith('binary:')

export function binaryQuestion(ctx: GenContext, values: readonly number[]): BinaryQ {
  const target = choose(ctx, values, value => `binary:${value}`)
  if (!binaryLights(target)) throw new Error(`invalid binary target: ${target}`)
  return {
    itemKey: `binary:${target}`,
    answer: null,
    say: ADV.binary,
    instruction: ADV.binary,
    hint: ADV.hintBinary,
    target,
  }
}

const balanceKey = (item: BalanceScenario) => `sort:${item.id}`
export const balanceAccepts = (itemKey: string) => itemKey.startsWith('sort:')

export function balanceQuestion(ctx: GenContext, items: readonly BalanceScenario[]): BalanceQ {
  const scenario = choose(ctx, items, balanceKey)
  if (scenario.items.length < 3 || scenario.items.length > 5
    || new Set(scenario.items.map(item => item.weight)).size !== scenario.items.length) {
    throw new Error(`invalid balance scenario: ${scenario.id}`)
  }
  return {
    itemKey: balanceKey(scenario),
    answer: null,
    say: ADV.balance,
    instruction: ADV.balance,
    hint: ADV.hintBalance,
    scenario,
  }
}

const searchKey = (item: SearchScenario) => `search:${item.id}`
export const searchAccepts = (itemKey: string) => itemKey.startsWith('search:')

export function searchQuestion(ctx: GenContext, items: readonly SearchScenario[]): SearchQ {
  const scenario = choose(ctx, items, searchKey)
  const answer = searchMidpoint(scenario)
  if (answer === null || !scenario.values.includes(scenario.target)) throw new Error(`invalid search scenario: ${scenario.id}`)
  return {
    itemKey: searchKey(scenario),
    answer,
    say: ADV.search,
    instruction: ADV.search,
    hint: ADV.hintSearch,
    scenario,
  }
}
