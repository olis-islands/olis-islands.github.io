import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import { registerGatesArt } from './art-gates'
import { ALLOW, BLOCK, GATE_ITEMS, RULE_KINDS, describeFirewall, firewallAccepts, firewallKey, firewallQuestion, isTricky, parseFirewallKey, passes } from './generators-gates'
import { phrases } from './phrases'

registerGatesArt()

const ctx = (seed: number, avoid: Iterable<string> = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])

describe('firewall rules', () => {
  it('allow lets in only matching packets, block stops only matching packets, and only the named field counts', () => {
    expect(passes({ kind: 'allowTo', shape: 'star' }, { from: 'circle', to: 'star' })).toBe(true)
    expect(passes({ kind: 'allowTo', shape: 'star' }, { from: 'star', to: 'circle' })).toBe(false)
    expect(passes({ kind: 'allowFrom', shape: 'star' }, { from: 'star', to: 'circle' })).toBe(true)
    expect(passes({ kind: 'blockFrom', shape: 'star' }, { from: 'circle', to: 'star' })).toBe(true)
    expect(passes({ kind: 'blockFrom', shape: 'star' }, { from: 'star', to: 'circle' })).toBe(false)
    expect(passes({ kind: 'blockTo', shape: 'star' }, { from: 'square', to: 'triangle' })).toBe(true)
  })
})

describe('firewall rule texts', () => {
  it('every rule says "רַק", names the field it checks and uses the right verb', () => {
    for (const kind of RULE_KINDS) {
      const text = phrases[`networks.rule.${kind}`]!
      expect(text, kind).toContain(' רַק ')
      expect(text, kind).toContain(kind.endsWith('To') ? 'הַמְּקַבֵּל' : 'הַשּׁוֹלֵחַ')
      expect(text, kind).toContain(kind.startsWith('allow') ? 'מַכְנִיס' : 'עוֹצֵר')
    }
  })
})

describe('firewall', () => {
  it('over 600 seeds: the answer follows the shown rule, the options are allow and block, every phrase exists', () => {
    for (let seed = 0; seed < 600; seed++) {
      const q = firewallQuestion(ctx(seed))
      const item = parseFirewallKey(q.itemKey)!
      expect(item.packet.from).not.toBe(item.packet.to)
      expect(q.answer).toBe(passes(item.rule, item.packet) ? ALLOW : BLOCK)
      expect(q.options.map(o => o.id)).toEqual([ALLOW, BLOCK])
      expect(q.prompt.sentence!.text).toBe(ids(q.prompt.sentence!.say).map(id => phrases[id]).join(' '))
      for (const id of [...ids(q.say), q.instruction, ...ids(q.hint), ...ids(q.prompt.sentence!.say), ...q.options.flatMap(o => ('say' in o ? ids(o.say) : []))]) {
        expect(phrases[id], id).toBeTruthy()
      }
    }
  })

  it('no shortcut: for every kind of rule both outcomes come up about equally, and tricky packets are common', () => {
    const by = new Map(RULE_KINDS.map(k => [k, { allow: 0, all: 0 }]))
    let tricky = 0
    for (let seed = 0; seed < 2000; seed++) {
      const q = firewallQuestion(ctx(seed))
      const item = parseFirewallKey(q.itemKey)!
      const c = by.get(item.rule.kind)!
      c.all++
      if (q.answer === ALLOW) c.allow++
      if (isTricky(item)) tricky++
    }
    for (const [kind, c] of by) {
      expect(c.all, kind).toBeGreaterThan(400)
      expect(c.allow / c.all, kind).toBeGreaterThan(0.42)
      expect(c.allow / c.all, kind).toBeLessThan(0.58)
    }
    // Tricky packets exist only when the answer is the opposite of the rule's verb (half the cases); half of those are tricky.
    expect(tricky).toBeGreaterThan(350)
  })

  it('avoids asked keys, honors review, and accepts only its own keys', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const q = firewallQuestion(ctx(i, seen))
      expect(seen.has(q.itemKey)).toBe(false)
      seen.add(q.itemKey)
    }
    for (const item of GATE_ITEMS) {
      const key = firewallKey(item)
      expect(firewallAccepts(key)).toBe(true)
      expect(firewallQuestion(ctx(2, [], key)).itemKey).toBe(key)
      expect(describeFirewall(key)).toMatch(/^שער ש.+; חבילה מ.+ אל .+$/)
    }
    expect(GATE_ITEMS).toHaveLength(192)
    for (const key of ['networks.firewall:allowTo-star:star-star', 'networks.firewall:open-star:circle-star', 'networks.delivery:star-3']) {
      expect(firewallAccepts(key), key).toBe(false)
    }
  })

  it('the packet drawing names its sender and receiver, in theme colors only', () => {
    const q = firewallQuestion(ctx(5))
    const item = parseFirewallKey(q.itemKey)!
    const html = renderToStaticMarkup(createElement(ArtView, { art: q.prompt.art![1]!, size: 120 }))
    expect(html).toContain(`${phrases['networks.ui.sender']}: ${phrases[`networks.shape.${item.packet.from}`]}.`)
    expect(html).toContain(`${phrases['networks.ui.receiver']}: ${phrases[`networks.shape.${item.packet.to}`]}.`)
    expect(html).not.toMatch(/#[0-9a-f]{3,6}\b/i)
    const gate = renderToStaticMarkup(createElement(ArtView, { art: q.prompt.art![0]!, size: 120 }))
    expect(gate).toContain('aria-hidden="true"')
    expect(gate).toContain(phrases[item.rule.kind.endsWith('To') ? 'networks.ui.receiver' : 'networks.ui.sender'])
  })
})
