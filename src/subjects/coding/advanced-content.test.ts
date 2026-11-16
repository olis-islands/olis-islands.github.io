import { describe, expect, it } from 'vitest'
import { runAdvanced, searchCandidates, searchMidpoint, traceCounter } from './advanced-program'
import { advancedPhrases } from './advanced-phrases'
import { BALANCE_SCENARIOS, CONDITION_SCENARIOS, COUNTER_SCENARIOS, EVENT_SCENARIOS, SEARCH_SCENARIOS } from './content/advanced-scenarios'
import { FACING_BOARDS, FUNCTION_BOARDS } from './content/advanced-boards'
import { BINARY_TARGETS } from './content/advanced-puzzles'
import { runShortcut } from './advanced-program'
import type { PhraseRef } from '../../core/engine/types'

const phraseExists = (ref: PhraseRef) => {
  for (const id of typeof ref === 'string' ? [ref] : ref) expect(advancedPhrases[id], id).toBeTruthy()
}

describe('Stage 8b authored content', () => {
  it('keeps event and condition scenarios distinct, complete and phrase-backed', () => {
    expect(new Set(EVENT_SCENARIOS.map(item => item.id)).size).toBe(EVENT_SCENARIOS.length)
    for (const scenario of EVENT_SCENARIOS) {
      expect(scenario.events).toHaveLength(2)
      expect(scenario.trigger).toBeGreaterThanOrEqual(0)
      expect(scenario.trigger).toBeLessThan(scenario.events.length)
      expect(scenario.distractors).toHaveLength(1)
      const optionIds = [...scenario.events.map(event => event.action.id), ...scenario.distractors.map(action => action.id)]
      expect(new Set(optionIds).size).toBe(3)
      scenario.events.forEach(event => phraseExists(event.label))
      scenario.events.forEach(event => phraseExists(event.action.label))
      scenario.distractors.forEach(action => phraseExists(action.label))
    }
    expect(new Set(CONDITION_SCENARIOS.map(item => item.id)).size).toBe(CONDITION_SCENARIOS.length)
    for (const scenario of CONDITION_SCENARIOS) {
      phraseExists(scenario.condition)
      scenario.states.forEach(phraseExists)
      scenario.actions.forEach(action => phraseExists(action.label))
      expect(scenario.actions[0].id).not.toBe(scenario.actions[1].id)
    }
  })

  it('keeps every counter within bounds with a reachable final value', () => {
    expect(COUNTER_SCENARIOS).toHaveLength(12)
    for (const scenario of COUNTER_SCENARIOS) {
      const trace = traceCounter(scenario.start, scenario.changes)
      expect(trace).not.toBeNull()
      expect(scenario.changes.length).toBeGreaterThanOrEqual(2)
      expect(scenario.changes.length).toBeLessThanOrEqual(4)
      expect(trace!.every(value => value >= 0 && value <= 9)).toBe(true)
    }
  })

  it('proves each shortcut board using at least two calls to its hidden definition', () => {
    expect(FUNCTION_BOARDS).toHaveLength(12)
    for (const item of FUNCTION_BOARDS) {
      const result = runShortcut(item.board, item.facing, item.solution, item.block)
      expect(result.kind, item.id).toBe('complete')
      if (result.kind === 'complete') {
        expect(result.reachedGoal, item.id).toBe(true)
        expect(item.solution.filter(card => card === 'call').length).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('covers all binary values and uses balanced, distinct-weight sort objects', () => {
    expect(BINARY_TARGETS).toEqual(Array.from({ length: 16 }, (_, value) => value))
    expect(BALANCE_SCENARIOS).toHaveLength(12)
    for (const scenario of BALANCE_SCENARIOS) {
      expect(scenario.items.length).toBeGreaterThanOrEqual(3)
      expect(scenario.items.length).toBeLessThanOrEqual(5)
      expect(new Set(scenario.items.map(item => item.weight)).size).toBe(scenario.items.length)
      expect(new Set(scenario.items.map(item => item.id)).size).toBe(scenario.items.length)
      scenario.items.forEach(item => phraseExists(item.label))
    }
    expect(BALANCE_SCENARIOS.every(scenario => scenario.items.some((item, index, items) =>
      index > 0 && item.weight < items[index - 1]!.weight,
    ))).toBe(true)
  })

  it('has a unique, odd candidate range for every search target', () => {
    expect(SEARCH_SCENARIOS).toHaveLength(12)
    for (const scenario of SEARCH_SCENARIOS) {
      const candidates = searchCandidates(scenario)
      expect(candidates.length % 2).toBe(1)
      expect(candidates).toContain(scenario.values.indexOf(scenario.target))
      expect(searchMidpoint(scenario)).not.toBeNull()
    }
  })

  it('preserves a solution path for every facing board', () => {
    for (const item of FACING_BOARDS) {
      const result = runAdvanced(item.board, item.facing, item.solution)
      expect(result.kind).toBe('complete')
      if (result.kind === 'complete') expect(result.reachedGoal).toBe(true)
    }
  })
})
