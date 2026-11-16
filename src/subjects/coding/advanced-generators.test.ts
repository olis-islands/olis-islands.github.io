import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import { runAdvanced } from './advanced-program'
import { advancedPhrases } from './advanced-phrases'
import { BALANCE_SCENARIOS, CONDITION_SCENARIOS, COUNTER_SCENARIOS, EVENT_SCENARIOS, SEARCH_SCENARIOS } from './content/advanced-scenarios'
import { FACING_BOARDS, FUNCTION_BOARDS } from './content/advanced-boards'
import { BINARY_TARGETS } from './content/advanced-puzzles'
import {
  balanceAccepts, balanceQuestion, binaryAccepts, binaryQuestion, conditionAccepts, conditionQuestion, counterAccepts,
  counterQuestion, eventAccepts, eventQuestion, facingAccepts, facingQuestion, functionAccepts, functionQuestion,
  searchAccepts, searchQuestion,
} from './advanced-generators'
import { binaryLights, searchMidpoint, traceCounter, triggerEvent } from './advanced-program'

const context = (seed: number, avoid: string[] = [], review?: string) => ({ rng: seeded(seed), avoid: new Set(avoid), review })

describe('facing game content and generator', () => {
  it('has a reachable solution for each distinct board', () => {
    expect(FACING_BOARDS).toHaveLength(12)
    expect(new Set(FACING_BOARDS.map(item => item.id)).size).toBe(FACING_BOARDS.length)
    expect(new Set(FACING_BOARDS.map(item => item.facing))).toEqual(new Set(['up', 'right', 'down', 'left']))
    expect(FACING_BOARDS.every(item => [...item.board.rows.join('')].filter(cell => cell === '#').length <= 3)).toBe(true)
    for (const item of FACING_BOARDS) {
      const result = runAdvanced(item.board, item.facing, item.solution)
      expect(result.kind).toBe('complete')
      if (result.kind === 'complete') expect(result.reachedGoal).toBe(true)
    }
  })

  it('generates only facing questions and honors review and avoid keys', () => {
    for (let seed = 0; seed < 200; seed++) {
      const question = facingQuestion(context(seed), FACING_BOARDS)
      expect(facingAccepts(question.itemKey)).toBe(true)
      expect(FACING_BOARDS.some(item => question.itemKey === `facing:${item.id}`)).toBe(true)
      expect(advancedPhrases['code.q.facing']).toBeTruthy()
      expect(advancedPhrases['code.hint.facing']).toBeTruthy()
    }
    const reviewed = facingQuestion(context(7, ['facing:facing03'], 'facing:facing03'), FACING_BOARDS)
    expect(reviewed.itemKey).toBe('facing:facing03')
    const fresh = facingQuestion(context(7, ['facing:facing03']), FACING_BOARDS)
    expect(fresh.itemKey).not.toBe('facing:facing03')
  })

  it('generates valid reviewed questions for every approved mechanic', () => {
    for (let seed = 0; seed < 200; seed++) {
      const event = eventQuestion(context(seed), EVENT_SCENARIOS)
      expect(eventAccepts(event.itemKey)).toBe(true)
      expect(event.answer).toBe(triggerEvent(event.scenario)?.id)
      expect(advancedPhrases['code.q.event']).toBeTruthy()

      const condition = conditionQuestion(context(seed), CONDITION_SCENARIOS)
      expect(conditionAccepts(condition.itemKey)).toBe(true)
      expect(advancedPhrases['code.q.condition']).toBeTruthy()

      const counter = counterQuestion(context(seed), COUNTER_SCENARIOS)
      expect(counterAccepts(counter.itemKey)).toBe(true)
      expect(counter.options).toContain(counter.answer)
      expect(new Set(counter.options).size).toBe(3)
      expect(counter.answer).toBe(traceCounter(counter.scenario.start, counter.scenario.changes)?.at(-1))

      const fn = functionQuestion(context(seed), FUNCTION_BOARDS)
      expect(functionAccepts(fn.itemKey)).toBe(true)
      expect(fn.mode).toBe('function')

      const binary = binaryQuestion(context(seed), BINARY_TARGETS)
      expect(binaryAccepts(binary.itemKey)).toBe(true)
      expect(binaryLights(binary.target)).not.toBeNull()

      const balance = balanceQuestion(context(seed), BALANCE_SCENARIOS)
      expect(balanceAccepts(balance.itemKey)).toBe(true)

      const search = searchQuestion(context(seed), SEARCH_SCENARIOS)
      expect(searchAccepts(search.itemKey)).toBe(true)
      expect(search.answer).toBe(searchMidpoint(search.scenario))
    }

    expect(eventQuestion(context(4, ['event:event2'], 'event:event2'), EVENT_SCENARIOS).itemKey).toBe('event:event2')
    expect(conditionQuestion(context(4, [], 'condition:condition3'), CONDITION_SCENARIOS).itemKey).toBe('condition:condition3')
    expect(counterQuestion(context(4, [], 'variable:counter4'), COUNTER_SCENARIOS).itemKey).toBe('variable:counter4')
    expect(binaryQuestion(context(4, [], 'binary:0'), [0, 1]).target).toBe(0)
    expect(balanceQuestion(context(4, [], 'sort:balance2'), BALANCE_SCENARIOS).itemKey).toBe('sort:balance2')
    expect(searchQuestion(context(4, [], 'search:search4'), SEARCH_SCENARIOS).itemKey).toBe('search:search4')
    expect(eventAccepts('condition:condition1')).toBe(false)
  })
})
