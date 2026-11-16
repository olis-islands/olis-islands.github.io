import { describe, expect, it } from 'vitest'
import { MAX_CALLS, MAX_MAIN_CARDS, MAX_OPERATIONS, runAdvanced, runShortcut, turn } from './advanced-program'
import type { Board, Dir } from './types'

const board: Board = { id: 'test', rows: ['....', '.SG.', '....', '....'] }

describe('advanced program', () => {
  it('turns relative to all four facings', () => {
    const facings: Dir[] = ['up', 'right', 'down', 'left']
    facings.forEach((facing, i) => {
      expect(turn(facing, 'right')).toBe(facings[(i + 1) % 4])
      expect(turn(facing, 'left')).toBe(facings[(i + 3) % 4])
    })

  })

  it('runs a right turn then a forward step, reaching the goal', () => {
    const result = runAdvanced(board, 'up', ['right', 'forward'])
    expect(result.kind).toBe('complete')
    if (result.kind === 'complete') {
      expect(result.reachedGoal).toBe(true)
      expect(result.trace.map(s => [s.cell, s.facing])).toEqual([
        [[1, 1], 'up'], [[1, 1], 'right'], [[1, 2], 'right'],
      ])
    }
  })

  it('does not count passing the goal or hitting an edge after it as a win', () => {
    const passing = runAdvanced(board, 'right', ['forward', 'forward'])
    expect(passing.kind).toBe('complete')
    if (passing.kind === 'complete') expect(passing.reachedGoal).toBe(false)
    const blocked = runAdvanced(board, 'right', ['forward', 'forward', 'forward'])
    expect(blocked.kind).toBe('blocked')
    if (blocked.kind === 'blocked') {
      expect(blocked.reachedGoal).toBe(false)
      expect(blocked.stoppedAt).toBe(2)
    }
  })

  it('executes a reusable block each time it is called', () => {
    const result = runAdvanced(board, 'up', ['call', 'call'], ['forward', 'right'])
    expect(result.kind).toBe('complete')
    if (result.kind === 'complete') {
      expect(result.trace.slice(1).map(s => [s.card, s.blockStep])).toEqual([[0, 0], [0, 1], [1, 0], [1, 1]])
      expect(result.trace.at(-1)?.cell).toEqual([0, 2])
    }
  })

  it('rejects invalid boards, empty programs, missing blocks and excessive sizes before running', () => {
    expect(runAdvanced({ id: 'bad', rows: ['S.', '.'] }, 'up', ['forward'])).toEqual({ kind: 'invalid', reason: 'board' })
    expect(runAdvanced(board, 'up', [])).toEqual({ kind: 'invalid', reason: 'program' })
    expect(runAdvanced(board, 'up', ['call'])).toEqual({ kind: 'invalid', reason: 'block' })
    expect(runAdvanced(board, 'up', Array(MAX_MAIN_CARDS + 1).fill('left'))).toEqual({ kind: 'invalid', reason: 'program' })
    expect(runAdvanced(board, 'up', Array(MAX_CALLS + 1).fill('call'), ['left', 'right'])).toEqual({ kind: 'invalid', reason: 'limit' })
  })

  it('stops at a wall without adding an unreachable cell', () => {
    const result = runAdvanced({ id: 'wall', rows: ['....', '.S#G', '....', '....'] }, 'right', ['forward'])
    expect(result.kind).toBe('blocked')
    if (result.kind === 'blocked') expect(result.trace).toHaveLength(1)
  })

  it('does not count a wall after passing through the goal as a win', () => {
    const result = runAdvanced({ id: 'wall-after-goal', rows: ['....', '.SG#', '....', '....'] }, 'right', ['forward', 'forward'])
    expect(result.kind).toBe('blocked')
    if (result.kind === 'blocked') {
      expect(result.reachedGoal).toBe(false)
      expect(result.stoppedAt).toBe(1)
      expect(result.trace.at(-1)?.cell).toEqual([1, 2])
    }
  })

  it('does not execute a definition until it is called', () => {
    const result = runAdvanced(board, 'right', ['forward'], ['left', 'left'])
    expect(result.kind).toBe('complete')
    if (result.kind === 'complete') {
      expect(result.reachedGoal).toBe(true)
      expect(result.trace).toHaveLength(2)
    }
  })

  it('treats a shortcut with fewer than two calls as incomplete, not a miss', () => {
    const block = ['left', 'right'] as const
    expect(runShortcut(board, 'right', ['forward'], block)).toEqual({ kind: 'invalid', reason: 'program' })
    expect(runShortcut(board, 'right', ['call', 'forward'], block)).toEqual({ kind: 'invalid', reason: 'program' })
    const result = runShortcut(board, 'right', ['call', 'forward', 'call'], block)
    expect(result.kind).toBe('complete')
    if (result.kind === 'complete') expect(result.reachedGoal).toBe(true)
  })

  it('accepts the largest valid strip without exceeding the operation cap', () => {
    const program = [...Array(MAX_CALLS).fill('call'), ...Array(MAX_MAIN_CARDS - MAX_CALLS).fill('left')]
    const result = runShortcut(board, 'up', program, ['left', 'right', 'left'])
    expect(result.kind).toBe('complete')
    if (result.kind === 'complete') expect(result.trace.length - 1).toBeLessThanOrEqual(MAX_OPERATIONS)
  })
})
