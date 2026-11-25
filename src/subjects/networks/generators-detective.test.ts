import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import { EVIDENCE, STAGES } from './content/detective'
import { DETECTIVE_ITEMS, STAGE_IDS, describeDetective, detectiveAccepts, detectiveKey, detectiveQuestion, parseDetectiveKey } from './generators-detective'
import { phrases } from './phrases'

const ctx = (seed: number, avoid: Iterable<string> = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })

describe('detective', () => {
  it('every stage has two working results and three failing ones, all distinct', () => {
    const all = STAGES.flatMap(s => [...EVIDENCE[s.id].ok, ...EVIDENCE[s.id].fail])
    expect(new Set(all).size).toBe(all.length)
    for (const s of STAGES) {
      expect(EVIDENCE[s.id].ok).toHaveLength(2)
      expect(EVIDENCE[s.id].fail).toHaveLength(3)
    }
  })

  it('over 600 seeds: exactly one stage fails, it is the answer, every check has a result, phrases exist', () => {
    for (let seed = 0; seed < 600; seed++) {
      const q = detectiveQuestion(ctx(seed))
      const item = parseDetectiveKey(q.itemKey)!
      expect(q.answer).toBe(item.fault)
      expect(Object.keys(q.evidence).sort()).toEqual([...STAGE_IDS].sort())
      const failing = STAGE_IDS.filter(s => q.evidence[s].includes('.fail.'))
      expect(failing).toEqual([item.fault])
      for (const s of STAGE_IDS) expect(q.evidence[s].startsWith(`networks.evidence.${s}.`), s).toBe(true)
      for (const id of [q.instruction, q.hint, ...Object.values(q.evidence), 'networks.q.detectiveAnswer']) expect(phrases[id], id).toBeTruthy()
    }
  })

  it('each stage fails about equally often; avoid, review, the domain and own keys only', () => {
    const by = Object.fromEntries(STAGE_IDS.map(s => [s, 0]))
    for (let seed = 0; seed < 1200; seed++) by[detectiveQuestion(ctx(seed)).answer]!++
    for (const n of Object.values(by)) expect(n).toBeGreaterThan(250)
    const seen = new Set<string>()
    for (let i = 0; i < DETECTIVE_ITEMS.length; i++) {
      const q = detectiveQuestion(ctx(i, seen))
      expect(seen.has(q.itemKey)).toBe(false)
      seen.add(q.itemKey)
    }
    expect(seen.size).toBe(12)
    for (const item of DETECTIVE_ITEMS) {
      const key = detectiveKey(item)
      expect(detectiveAccepts(key)).toBe(true)
      const q = detectiveQuestion(ctx(5, [], key))
      expect(q.itemKey).toBe(key)
      expect(q.answer).toBe(item.fault)
      expect(describeDetective(key)).toMatch(/^תקלה ב/)
    }
    for (const key of ['networks.diagnose:lookup:3', 'networks.diagnose:dns:0', 'networks.web:fish:has']) expect(detectiveAccepts(key), key).toBe(false)
  })
})
