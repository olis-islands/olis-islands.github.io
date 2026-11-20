import { describe, expect, it } from 'vitest'
import { fold, type ProgressEvent } from './events'
import { skillLeitner } from './progress'

const play = (id: string, at: number, firstTry: string[], missed: string[], skillId = 'S'): ProgressEvent => ({
  id, kind: 'play', at,
  payload: { round: { skillId, sticker: '⭐', firstTry, missed, total: firstTry.length + missed.length, at: 0 } },
})
const reset = (id: string, at: number): ProgressEvent => ({ id, kind: 'reset', at })
const known = (id: string, at: number, k: boolean): ProgressEvent => ({ id, kind: 'known', at, payload: { skillId: 'S', known: k } })

const permutations = <T,>(xs: T[]): T[][] =>
  xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map(p => [x, ...p]))

// Minutes after 10:00, in ms.
const t = (m: number) => m * 60_000

describe('fold', () => {
  const base = play('base', t(0), ['a', 'b', 'c', 'd', 'e'], ['x']) // 5/6, א-style item 'x' in box 0
  const A = play('A', t(5), ['x', 'a', 'b', 'c', 'd', 'e'], [])      // 6/6, x right first time
  const B = play('B', t(10), ['a'], ['x', 'b', 'c', 'd', 'e'])       // 1/6, x missed

  it('gives the same progress for the events in any order', () => {
    const events = [base, A, B, known('k', t(7), true), reset('r', t(-5))]
    const want = JSON.stringify(fold(events).progress)
    for (const p of permutations(events)) expect(JSON.stringify(fold(p).progress)).toBe(want)
  })

  it('two offline devices: stars add up, the Leitner box follows the order of play', () => {
    const { progress } = fold([base, B, A])
    expect(progress.totalStars).toBe(3 + 3 + 1)
    expect(progress.skills.S!.bestStars).toBe(3)
    expect(progress.skills.S!.mastered).toBe(true)
    expect(progress.stickers).toEqual(['⭐'])
    expect(skillLeitner(progress, 'S').x).toMatchObject({ box: 0, due: t(10) }) // 0 → 1 (A) → 0 (B)
  })

  it('uses the stored time, not the time inside the round summary', () => {
    const e = play('p', t(3), ['a'], [])
    const { progress } = fold([e])
    expect(skillLeitner(progress, 'S').a!.due).toBeGreaterThan(t(3))
    expect(progress.skills.S!.rounds[0]!.at).toBe(t(3))
  })

  it('a reset erases earlier events on every device and keeps later ones', () => {
    const { progress } = fold([base, A, reset('r', t(7)), B])
    expect(progress.totalStars).toBe(1)
    expect(progress.skills.S!.mastered).toBe(false)
    expect(progress.stickers).toEqual([])
    expect(skillLeitner(progress, 'S').x).toMatchObject({ box: 0, due: t(10) })
  })

  it('counts a repeated event ID once', () => {
    expect(fold([base, base, A, A]).progress).toEqual(fold([base, A]).progress)
  })

  it('"already knows this" and undo are replayed in order with the rounds', () => {
    expect(fold([known('k', t(1), true)]).progress.skills.S!.mastered).toBe(true)
    expect(fold([known('k', t(1), true), known('u', t(2), false)]).progress.skills.S!.mastered).toBe(false)
    expect(fold([known('u', t(1), false), known('k', t(2), true)]).progress.skills.S!.mastered).toBe(true)
  })

  it('keeps only the last 20 rounds per skill', () => {
    const many = Array.from({ length: 25 }, (_, i) => play(`r${i}`, t(i), ['a'], []))
    expect(fold(many).progress.skills.S!.rounds).toHaveLength(20)
  })

  it('stickers and mastery from the last replay are kept when later events bring in poor rounds', () => {
    const good = Array.from({ length: 2 }, (_, i) => play(`g${i}`, t(100 + i), ['a', 'b', 'c', 'd', 'e'], []))
    const first = fold(good)
    expect(first.progress.skills.S!.mastered).toBe(true)
    const poor = Array.from({ length: 25 }, (_, i) => play(`p${i}`, t(101 + i), [], ['a', 'b', 'c', 'd', 'e']))
    const second = fold([...good, ...poor], first)
    expect(second.progress.skills.S!.mastered).toBe(true)
    expect(second.progress.stickers).toEqual(['⭐'])
  })

  it('earned stickers do not come back after a newer reset', () => {
    const first = fold([base, A])
    expect(first.progress.stickers).toEqual(['⭐'])
    const after = fold([base, A, reset('r', t(9))], first)
    expect(after.progress.stickers).toEqual([])
    expect(after.progress.totalStars).toBe(0)
  })

  it('an empty log is empty progress', () => {
    expect(fold([]).progress).toEqual({ skills: {}, leitner: {}, stickers: [], totalStars: 0 })
  })
})
