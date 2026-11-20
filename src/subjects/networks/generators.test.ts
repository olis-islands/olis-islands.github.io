import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import type { PickOption } from '../../ui/pick/types'
import { registerNetworksArt } from './art'
import { NUMBERS, SHAPES } from './content/addresses'
import { deliveryAccepts, deliveryKey, deliveryQuestion, describeDelivery, parseDeliveryKey } from './generators'
import { phrases } from './phrases'
import type { Address } from './types'

registerNetworksArt()

const ctx = (seed: number, avoid: Iterable<string> = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
const toAddress = (o: PickOption): Address => {
  if (o.kind !== 'art') throw new Error(`not a computer: ${o.kind}`)
  return { shape: o.art.props!.shape as Address['shape'], n: o.art.props!.n as number }
}
const ALL = SHAPES.flatMap(s => NUMBERS.map(n => ({ shape: s.id, n })))

describe('delivery', () => {
  it('over 500 seeds: exactly one computer has the address, options are distinct, every phrase exists', () => {
    for (let seed = 0; seed < 500; seed++) {
      const q = deliveryQuestion(ctx(seed))
      const target = parseDeliveryKey(q.itemKey)!
      expect(target).toBeDefined()
      const addrs = q.options.map(toAddress)
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options.map(o => o.id)).size).toBe(3)
      expect(addrs.filter(a => a.shape === target.shape && a.n === target.n)).toHaveLength(1)
      expect(q.options.find(o => o.id === q.answer)).toBeDefined()
      expect(toAddress(q.options.find(o => o.id === q.answer)!)).toEqual(target)
      for (const a of addrs) {
        expect(NUMBERS).toContain(a.n)
        expect(SHAPES.map(s => s.id)).toContain(a.shape)
      }
      for (const id of [...ids(q.say), q.instruction, ...ids(q.hint), ...q.options.flatMap(o => ('say' in o ? ids(o.say) : []))]) {
        expect(phrases[id], id).toBeTruthy()
      }
    }
  })

  it('the answer cannot be found without the envelope: it is never the only computer sharing a part with both others', () => {
    const shares = (a: Address, b: Address) => a.shape === b.shape || a.n === b.n
    for (let seed = 0; seed < 500; seed++) {
      const q = deliveryQuestion(ctx(seed))
      const addrs = q.options.map(toAddress)
      const middle = addrs.filter(a => addrs.every(b => b === a || shares(a, b)))
      const target = parseDeliveryKey(q.itemKey)!
      if (middle.length === 1) expect(middle[0]).not.toEqual(target)
      // Every wrong computer shares at most one part with the address, and at least one wrong computer shares a part.
      const wrong = addrs.filter(a => !(a.shape === target.shape && a.n === target.n))
      expect(wrong.some(a => shares(a, target))).toBe(true)
    }
  })

  it('the answer lands in every position about equally often', () => {
    const at = [0, 0, 0]
    for (let seed = 0; seed < 900; seed++) {
      const q = deliveryQuestion(ctx(seed))
      at[q.options.findIndex(o => o.id === q.answer)]!++
    }
    for (const n of at) expect(n).toBeGreaterThan(220)
  })

  it('avoids item keys already asked while fresh ones remain, and asks every address eventually', () => {
    const seen = new Set<string>()
    for (let i = 0; i < ALL.length; i++) {
      const q = deliveryQuestion(ctx(i, seen))
      expect(seen.has(q.itemKey)).toBe(false)
      seen.add(q.itemKey)
    }
    expect(seen.size).toBe(ALL.length)
    expect(deliveryQuestion(ctx(1, seen)).itemKey).toMatch(/^networks\.delivery:/)
  })

  it('a due review key asks that same address, and only its own keys are accepted', () => {
    for (const a of ALL) {
      const key = deliveryKey(a)
      expect(deliveryAccepts(key)).toBe(true)
      for (let seed = 0; seed < 5; seed++) expect(deliveryQuestion(ctx(seed, [], key)).itemKey).toBe(key)
      expect(describeDelivery(key)).toMatch(/^הכתובת \S+ \d$/)
    }
    for (const key of ['networks.delivery:circle-0', 'networks.delivery:moon-3', 'networks.route:circle-3', 'circle-3', '3:30']) {
      expect(deliveryAccepts(key), key).toBe(false)
    }
  })

  it('draws the envelope with a spoken name and computers silently (their button carries the name)', () => {
    const q = deliveryQuestion(ctx(7))
    const target = parseDeliveryKey(q.itemKey)!
    const envelope = renderToStaticMarkup(createElement(ArtView, { art: q.prompt.art![0]!, size: 140 }))
    const shape = SHAPES.find(s => s.id === target.shape)!
    expect(envelope).toContain(`aria-label="${phrases['networks.ui.address']} ${shape.name} ${phrases[`networks.n.${target.n}`]}"`)
    expect(envelope).toContain(`var(${shape.color})`)
    for (const o of q.options) {
      if (o.kind !== 'art') throw new Error('computer expected')
      const svg = renderToStaticMarkup(createElement(ArtView, { art: o.art, size: 96 }))
      expect(svg).toContain('aria-hidden="true"')
      expect(svg).toContain(`>${toAddress(o).n}<`)
      expect(svg).not.toMatch(/#[0-9a-f]{3,6}\b/i)
    }
  })
})
