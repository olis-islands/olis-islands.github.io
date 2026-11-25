import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import { registerRouteArt } from './art-route'
import { describeRoute, parseRouteKey, routeAccepts, routeKey, routeQuestion } from './generators-route'
import { phrases } from './phrases'
import { CHOICES, ROUTE_EDGES, goodChoices, isTeachingBoard, reaches } from './route'
import type { BridgeState } from './types'

registerRouteArt()

const ctx = (seed: number, avoid: Iterable<string> = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const board = (open: string[], closed: string[] = []): BridgeState[] =>
  ROUTE_EDGES.map(e => (open.includes(e) ? 'open' : closed.includes(e) ? 'closed' : 'none'))

describe('route board logic', () => {
  it('follows open bridges only, through middle stops, never back through the crossroads', () => {
    const b = board(['AX', 'XY', 'YD', 'BZ'], ['CZ', 'ZD'])
    expect(reaches(b, 'A')).toBe(true) // A → 1 → 2 → computer
    expect(reaches(b, 'B')).toBe(false) // B → 3, and 3's bridge to the computer is closed
    expect(reaches(b, 'B', true)).toBe(true)
    expect(reaches(b, 'C')).toBe(false)
    expect(goodChoices({ bridges: b })).toEqual(['A'])
    expect(isTeachingBoard({ bridges: b })).toBe(true)
    // Two ways through, a choice with no bridge, or no closed bridge that matters: not a teaching board.
    expect(isTeachingBoard({ bridges: board(['AX', 'XD', 'BY', 'YD', 'CZ']) })).toBe(false)
    expect(isTeachingBoard({ bridges: board(['AX', 'XD', 'BY'], ['YD']) })).toBe(false)
    expect(isTeachingBoard({ bridges: board(['AX', 'XD', 'BY', 'CZ']) })).toBe(false)
  })
})

describe('route', () => {
  it('over 500 seeds: exactly one choice gets through, it is the answer, a closed bridge always matters', () => {
    for (let seed = 0; seed < 500; seed++) {
      const q = routeQuestion(ctx(seed))
      const b = parseRouteKey(q.itemKey)!
      expect(b).toBeDefined()
      expect(isTeachingBoard(b)).toBe(true)
      const good = goodChoices(b)
      expect(good).toHaveLength(1)
      expect(q.answer).toBe(b.names[good[0]!])
      expect(q.options.map(o => o.id).sort()).toEqual(CHOICES.map(c => b.names[c]).sort())
      for (const id of [q.instruction, ...[q.say, q.hint].flat(), ...q.options.flatMap(o => ('say' in o && o.say ? [o.say].flat() : []))]) {
        expect(phrases[id as string], String(id)).toBeTruthy()
      }
    }
  })

  it('the way through starts at each of A, B, C and lands in each option slot about equally often', () => {
    const from = { A: 0, B: 0, C: 0 }
    const slot = [0, 0, 0]
    for (let seed = 0; seed < 900; seed++) {
      const q = routeQuestion(ctx(seed))
      from[goodChoices(parseRouteKey(q.itemKey)!)[0]!]++
      slot[q.options.findIndex(o => o.id === q.answer)]!++
    }
    for (const n of [...Object.values(from), ...slot]) expect(n).toBeGreaterThan(220)
  })

  it('avoids asked boards, a due review redraws the same board, and only valid boards are accepted', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const q = routeQuestion(ctx(i, seen))
      expect(seen.has(q.itemKey)).toBe(false)
      seen.add(q.itemKey)
    }
    for (const key of seen) {
      expect(routeAccepts(key)).toBe(true)
      const q = routeQuestion(ctx(99, [], key))
      expect(q.itemKey).toBe(key)
      expect(describeRoute(key)).toBe('מפת גשרים: לבחור לאן לשלוח את ההודעה')
    }
    const two = { bridges: board(['AX', 'XD', 'BY', 'YD', 'CZ']), names: { A: 'circle', B: 'star', C: 'square' } as const }
    for (const key of [routeKey(two), 'networks.route:000000000000:circle-star-square', 'networks.route:111111111111:circle-circle-star', 'networks.dns:library-moon']) {
      expect(routeAccepts(key), key).toBe(false)
    }
  })

  it('the map describes every bridge for screen readers and draws closed bridges dashed, in theme colors only', () => {
    const q = routeQuestion(ctx(11))
    const b = parseRouteKey(q.itemKey)!
    const html = renderToStaticMarkup(createElement(ArtView, { art: q.prompt.art![0]!, size: 320 }))
    const present = b.bridges.filter(s => s !== 'none').length
    expect(html.match(/גֶּשֶׁר בֵּין [^.]+: (פָּתוּחַ|סָגוּר)\./g)).toHaveLength(present)
    // Stops are named in words; only bridges that exist are listed (the description says the rest do not exist).
    expect(html).not.toMatch(/(בֵּין|וּבֵין) [123]:?/)
    expect(html.match(/סָגוּר/g)?.length ?? 0).toBe(b.bridges.filter(s => s === 'closed').length)
    expect(html.match(/stroke-dasharray/g)?.length ?? 0).toBe(b.bridges.filter(s => s === 'closed').length)
    expect(html).not.toMatch(/#[0-9a-f]{3,6}\b/i)
    for (const o of q.options) {
      if (o.kind !== 'art') throw new Error('choice expected')
      expect(renderToStaticMarkup(createElement(ArtView, { art: o.art, size: 96 }))).toContain('aria-hidden="true"')
    }
  })
})
