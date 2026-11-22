import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import { registerLookupArt } from './art-lookup'
import { PLACE_ADDRESS, TOPICS } from './content/lookup'
import {
  NOT_FOUND, PLACES, WEB_ITEMS, addressOf, describeDns, describeWeb, dnsAccepts, dnsKey, dnsQuestion, parseDnsKey, parseWebKey, placeText,
  webAccepts, webKey, webQuestion,
} from './generators-lookup'
import { phrases } from './phrases'
import type { Place } from './types'

registerLookupArt()

const ctx = (seed: number, avoid: Iterable<string> = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
const rowsOf = (props: Readonly<Record<string, unknown>> | undefined) => String(props?.rows).split('|').map(id => {
  const [noun, kind] = id.split('-')
  return { noun: noun!, kind: kind! } as Place
})

describe('address book', () => {
  it('every place has its own two-digit address', () => {
    const values = Object.values(PLACE_ADDRESS)
    expect(Object.keys(PLACE_ADDRESS).sort()).toEqual(PLACES.map(p => `${p.noun}-${p.kind}`).sort())
    expect(new Set(values).size).toBe(values.length)
    for (const v of values) expect(v).toBeGreaterThanOrEqual(10)
  })
})

describe('name lookup', () => {
  it('over 500 seeds: the place is in the book once, the answer is its address, wrong options share one word with it', () => {
    for (let seed = 0; seed < 500; seed++) {
      const q = dnsQuestion(ctx(seed))
      const target = parseDnsKey(q.itemKey)!
      const rows = rowsOf(q.prompt.art![0]!.props)
      expect(rows).toHaveLength(4)
      expect(new Set(rows.map(r => `${r.noun}-${r.kind}`)).size).toBe(4)
      expect(rows.filter(r => r.noun === target.noun && r.kind === target.kind)).toHaveLength(1)
      expect(q.answer).toBe(`${addressOf(target)}`)
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options.map(o => o.id)).size).toBe(3)
      expect(q.options.map(o => o.id)).toContain(q.answer)
      for (const o of q.options) {
        if (o.id === q.answer) continue
        const row = rows.find(r => `${addressOf(r)}` === o.id)!
        expect(row, o.id).toBeDefined()
        // Exactly one of the two words matches the requested name.
        expect(Number(row.noun === target.noun) + Number(row.kind === target.kind)).toBe(1)
      }
      expect(q.prompt.sentence!.text).toBe(placeText(target))
      for (const id of [...ids(q.say), q.instruction, ...ids(q.hint), ...ids(q.prompt.sentence!.say)]) expect(phrases[id], id).toBeTruthy()
    }
  })

  it('the answer lands in every position; avoid, review and the full domain', () => {
    const at = [0, 0, 0]
    for (let seed = 0; seed < 900; seed++) {
      const q = dnsQuestion(ctx(seed))
      at[q.options.findIndex(o => o.id === q.answer)]!++
    }
    for (const n of at) expect(n).toBeGreaterThan(220)
    const seen = new Set<string>()
    for (let i = 0; i < PLACES.length; i++) {
      const q = dnsQuestion(ctx(i, seen))
      expect(seen.has(q.itemKey)).toBe(false)
      seen.add(q.itemKey)
    }
    expect(seen.size).toBe(16)
    for (const p of PLACES) {
      expect(dnsAccepts(dnsKey(p))).toBe(true)
      const q = dnsQuestion(ctx(4, [], dnsKey(p)))
      expect(q.itemKey).toBe(dnsKey(p))
      expect(q.answer).toBe(`${addressOf(p)}`)
      expect(describeDns(dnsKey(p))).toMatch(/^הכתובת של \S+ \S+$/)
    }
    for (const key of ['networks.dns:library-mars', 'networks.web:turtles:has', 'library-moon']) expect(dnsAccepts(key), key).toBe(false)
  })

  it('draws the book as a table with every row and address, in theme colors only', () => {
    const q = dnsQuestion(ctx(3))
    const html = renderToStaticMarkup(createElement(ArtView, { art: q.prompt.art![0]!, size: 120 }))
    expect(html).toContain('<table')
    for (const r of rowsOf(q.prompt.art![0]!.props)) {
      expect(html).toContain(placeText(r))
      expect(html).toContain(`>${addressOf(r)}<`)
    }
    expect(html).not.toMatch(/#[0-9a-f]{3,6}\b/i)
  })
})

describe('web request', () => {
  it('over 600 seeds: one answer, look-alikes always offered, "not found" only when nothing matches', () => {
    let has = 0
    for (let seed = 0; seed < 600; seed++) {
      const q = webQuestion(ctx(seed))
      const item = parseWebKey(q.itemKey)!
      const topic = TOPICS.find(t => t.id === item.topic)!
      const pages = q.options.filter(o => o.id !== NOT_FOUND).map(o => o.id)
      expect(q.options).toHaveLength(4)
      expect(q.options.at(-1)!.id).toBe(NOT_FOUND)
      expect(new Set(pages).size).toBe(3)
      expect(pages.includes(topic.id)).toBe(item.has)
      expect(q.answer).toBe(item.has ? topic.id : NOT_FOUND)
      const lookAlikes = TOPICS.filter(t => t.family === topic.family && t.id !== topic.id).map(t => t.id)
      expect(pages.filter(p => lookAlikes.includes(p))).toHaveLength(item.has ? 1 : 2)
      if (item.has) has++
      for (const id of [...ids(q.say), q.instruction, ...ids(q.hint), ...ids(q.prompt.sentence!.say), ...q.options.flatMap(o => ('say' in o ? ids(o.say) : []))]) {
        expect(phrases[id], id).toBeTruthy()
      }
    }
    expect(has / 600).toBeGreaterThan(0.58)
    expect(has / 600).toBeLessThan(0.75)
  })

  it('avoid, review, the full domain and parents\' labels', () => {
    const seen = new Set<string>()
    for (let i = 0; i < WEB_ITEMS.length; i++) {
      const q = webQuestion(ctx(i, seen))
      expect(seen.has(q.itemKey)).toBe(false)
      seen.add(q.itemKey)
    }
    expect(seen.size).toBe(24)
    for (const w of WEB_ITEMS) {
      expect(webAccepts(webKey(w))).toBe(true)
      const q = webQuestion(ctx(9, [], webKey(w)))
      expect(q.itemKey).toBe(webKey(w))
      expect(describeWeb(webKey(w))).toMatch(/^בקשה לדף על .+ \((יש|אין) בספרייה\)$/)
    }
    for (const key of ['networks.web:dragons:has', 'networks.web:turtles:maybe', 'networks.dns:library-moon']) expect(webAccepts(key), key).toBe(false)
  })
})
