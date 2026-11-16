import { describe, expect, it } from 'vitest'
import {
  binaryLights, binaryValue, compareBalance, conditionAction, searchCandidates, searchMidpoint, traceCounter,
  triggerEvent, uniqueBalanceOrder,
} from './advanced-program'
import type { BalanceItem, ConditionScenario, EventScenario, SearchScenario } from './advanced-types'

describe('advanced mechanics', () => {
  const wave = { id: 'wave', label: 'code.word.wave', icon: '👋' }
  const jump = { id: 'jump', label: 'code.word.jump', icon: '🦘' }

  it('fires only the triggered event and chooses the action for both condition outcomes', () => {
    const event: EventScenario = {
      id: 'event-test',
      events: [{ label: 'code.word.bell', action: wave }, { label: 'code.word.button', action: jump }],
      trigger: 1,
      distractors: [wave],
    }
    const condition: ConditionScenario = {
      id: 'condition-test',
      condition: 'code.word.rain',
      states: ['code.word.rain', 'code.word.sunny'],
      trueState: 0,
      actions: [jump, wave],
    }
    expect(triggerEvent(event)).toEqual(jump)
    expect(conditionAction(condition, 0)).toEqual(jump)
    expect(conditionAction(condition, 1)).toEqual(wave)
  })

  it('traces bounded nonnegative counters and rejects underflow', () => {
    expect(traceCounter(2, [1, 1, -1])).toEqual([2, 3, 4, 3])
    expect(traceCounter(0, [-1])).toBeNull()
    expect(traceCounter(9, [1])).toBeNull()
  })

  it('round-trips every four-light binary target, including zero', () => {
    for (let target = 0; target <= 15; target++) {
      expect(binaryValue(binaryLights(target)!)).toBe(target)
    }
    expect(binaryValue([false, false, false, false])).toBe(0)
    expect(binaryLights(16)).toBeNull()
  })

  it('requires comparison evidence to prove one complete balance order', () => {
    const items: BalanceItem[] = [
      { id: 'a', label: 'a', icon: '🍎', weight: 1 },
      { id: 'b', label: 'b', icon: '🍐', weight: 2 },
      { id: 'c', label: 'c', icon: '🍊', weight: 3 },
    ]
    expect(compareBalance(items[0]!, items[1]!)).toBe(-1)
    expect(uniqueBalanceOrder(items, [{ lighter: 'a', heavier: 'b' }, { lighter: 'b', heavier: 'c' }])).toEqual(['a', 'b', 'c'])
    expect(uniqueBalanceOrder(items, [{ lighter: 'a', heavier: 'b' }])).toBeNull()
    expect(uniqueBalanceOrder(items, [{ lighter: 'a', heavier: 'b' }, { lighter: 'b', heavier: 'a' }])).toBeNull()
  })

  it('asks for a unique odd-sized midpoint across target positions', () => {
    const values = [10, 20, 30, 40, 50, 60, 70]
    for (let targetIndex = 0; targetIndex < values.length; targetIndex++) {
      const revealed = targetIndex === 3 ? [1, 5] : [3]
      const scenario: SearchScenario = { id: `${targetIndex}`, values, target: values[targetIndex]!, revealed }
      const candidates = searchCandidates(scenario)
      expect(candidates.length % 2).toBe(1)
      expect(candidates).toContain(targetIndex)
      expect(searchMidpoint(scenario)).toBe(candidates[Math.floor(candidates.length / 2)])
    }
    expect(searchMidpoint({ id: 'even', values: [1, 2, 3, 4], target: 3, revealed: [0, 3] })).toBeNull()
  })
})
