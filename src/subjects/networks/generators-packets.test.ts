import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import { registerPacketsArt } from './art-packets'
import {
  PACKET_ARRIVALS, RETRY_ITEMS, describePackets, describeRetry, packetsAccepts, packetsKey, packetsQuestion, parsePacketsKey, parseRetryKey,
  retryAccepts, retryKey, retryQuestion,
} from './generators-packets'
import { phrases } from './phrases'

registerPacketsArt()

const ctx = (seed: number, avoid: Iterable<string> = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
const sorted = (a: readonly number[]) => a.every((x, i) => i === 0 || a[i - 1]! < x)

describe('packets', () => {
  it('over 500 seeds: tiles are packets 1…n in arrival order, the answer orders them from 1, every phrase exists', () => {
    for (let seed = 0; seed < 500; seed++) {
      const q = packetsQuestion(ctx(seed))
      const arrival = parsePacketsKey(q.itemKey)!
      expect(arrival).toBeDefined()
      expect([3, 4]).toContain(q.tiles.length)
      expect(q.tiles.map(t => t.id)).toEqual(arrival.map(n => `p${n}`))
      expect(q.answer).toEqual(q.tiles.map(t => t.id).sort())
      expect(new Set(q.tiles.map(t => t.text)).size).toBe(q.tiles.length)
      expect(q.numbered).toBe(true)
      for (const t of q.tiles) expect(t.text).toBe(`${phrases['networks.ui.packet']} ${t.id.slice(1)}`)
      for (const id of [...ids(q.say), q.instruction, ...q.tiles.flatMap(t => ids(t.say))]) expect(phrases[id], id).toBeTruthy()
    }
  })

  it('some rounds arrive already in order, most arrive mixed', () => {
    let inOrder = 0
    for (let seed = 0; seed < 600; seed++) if (sorted(parsePacketsKey(packetsQuestion(ctx(seed)).itemKey)!)) inOrder++
    expect(inOrder).toBeGreaterThan(50)
    expect(inOrder).toBeLessThan(160)
  })

  it('avoids asked keys while fresh ones remain, covers the whole domain, and honors review', () => {
    const seen = new Set<string>()
    for (let i = 0; i < PACKET_ARRIVALS.length; i++) {
      const q = packetsQuestion(ctx(i, seen))
      expect(seen.has(q.itemKey)).toBe(false)
      seen.add(q.itemKey)
    }
    expect(seen.size).toBe(30)
    for (const a of PACKET_ARRIVALS) {
      const key = packetsKey(a)
      expect(packetsAccepts(key)).toBe(true)
      expect(packetsQuestion(ctx(3, [], key)).itemKey).toBe(key)
      expect(describePackets(key)).toMatch(/^סידור [34] חבילות/)
    }
    for (const key of ['networks.packets:1123', 'networks.packets:5', 'networks.retry:3:1:23', '312']) expect(packetsAccepts(key), key).toBe(false)
  })
})

describe('retry', () => {
  it('over 500 seeds: the missing number is the one option not received, options are distinct and in range', () => {
    for (let seed = 0; seed < 500; seed++) {
      const q = retryQuestion(ctx(seed))
      const item = parseRetryKey(q.itemKey)!
      expect(item.arrival).toHaveLength(item.total - 1)
      expect(item.arrival).not.toContain(item.missing)
      expect(new Set([...item.arrival, item.missing])).toEqual(new Set(Array.from({ length: item.total }, (_, i) => i + 1)))
      expect(q.answer).toBe(`${item.missing}`)
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options.map(o => o.id)).size).toBe(3)
      expect(q.options.map(o => o.id)).toContain(q.answer)
      // Every wrong option is a packet that did arrive: not missing, so not also correct.
      for (const o of q.options) if (o.id !== q.answer) expect(item.arrival).toContain(Number(o.id))
      for (const id of [...ids(q.say), q.instruction, ...ids(q.hint), ...q.options.flatMap(o => ('say' in o ? ids(o.say) : []))]) {
        expect(phrases[id], id).toBeTruthy()
      }
      expect(q.instruction).toBe(item.total === 3 ? 'networks.q.retry3' : 'networks.q.retry4')
    }
  })

  it('every missing position is asked, and the answer is not always in the same option slot', () => {
    const missing = new Set<string>()
    const slot = [0, 0, 0]
    for (let seed = 0; seed < 900; seed++) {
      const q = retryQuestion(ctx(seed))
      const item = parseRetryKey(q.itemKey)!
      missing.add(`${item.total}:${item.missing}`)
      slot[q.options.findIndex(o => o.id === q.answer)]!++
    }
    expect(missing.size).toBe(7)
    for (const n of slot) expect(n).toBeGreaterThan(150)
  })

  it('avoids asked keys, covers the domain, honors review, and draws what arrived without naming the missing one', () => {
    const seen = new Set<string>()
    for (let i = 0; i < RETRY_ITEMS.length; i++) {
      const q = retryQuestion(ctx(i, seen))
      expect(seen.has(q.itemKey)).toBe(false)
      seen.add(q.itemKey)
    }
    expect(seen.size).toBe(30)
    for (const r of RETRY_ITEMS) {
      const key = retryKey(r)
      expect(retryAccepts(key)).toBe(true)
      const q = retryQuestion(ctx(1, [], key))
      expect(q.itemKey).toBe(key)
      expect(describeRetry(key)).toBe(`חבילה ${r.missing} חסרה מתוך ${r.total}`)
      const html = renderToStaticMarkup(createElement(ArtView, { art: q.prompt.art![0]!, size: 120 }))
      expect(html).toContain(`הִגִּיעוּ: ${r.arrival.join(', ')}.`)
      expect(html).not.toMatch(/#[0-9a-f]{3,6}\b/i)
    }
    for (const key of ['networks.retry:3:3:13', 'networks.retry:4:2:124', 'networks.retry:5:1:2345', 'networks.packets:123']) expect(retryAccepts(key), key).toBe(false)
  })
})
