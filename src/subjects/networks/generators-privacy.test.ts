import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import { registerPrivacyArt } from './art-privacy'
import { ANIMALS, TRIOS } from './content/privacy'
import { PRIVACY_ITEMS, describePrivacy, parsePrivacyKey, privacyAccepts, privacyKey, privacyQuestion } from './generators-privacy'
import { phrases } from './phrases'

registerPrivacyArt()

const ctx = (seed: number, avoid: Iterable<string> = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])

describe('locked message', () => {
  it('over 600 seeds: one right answer per kind, distinct options, the safety line only after "who can open", phrases exist', () => {
    for (let seed = 0; seed < 600; seed++) {
      const q = privacyQuestion(ctx(seed))
      const item = parsePrivacyKey(q.itemKey)!
      const trio = TRIOS.find(t => t.id === item.trio)!
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options.map(o => o.id)).size).toBe(4)
      expect(q.options.map(o => o.id)).toContain(q.answer)
      if (item.kind === 'opens') {
        expect(q.answer).toBe(trio.recipient)
        expect(q.options.map(o => o.id)).toContain(trio.observer)
        expect(q.after).toBe('networks.explain.password')
      } else {
        expect(q.answer).toBe(item.kind === 'locked' ? 'networks.ui.knowsTo' : 'networks.ui.knowsBoth')
        expect(q.after).toBeUndefined()
        // The open box has no lock, so its hint never talks about one.
        expect(q.hint).toBe(item.kind === 'open' ? 'networks.hint.privacyOpen' : 'networks.hint.privacySee')
      }
      for (const id of [...ids(q.say), q.instruction, ...ids(q.hint), ...ids(q.after), ...q.options.flatMap(o => ('say' in o ? ids(o.say) : []))]) {
        expect(phrases[id], id).toBeTruthy()
      }
    }
  })

  it('the scene never shows or says what is written in the message', () => {
    for (const item of PRIVACY_ITEMS) {
      const q = privacyQuestion(ctx(1, [], privacyKey(item)))
      const html = renderToStaticMarkup(createElement(ArtView, { art: q.prompt.art![0]!, size: 120 }))
      const trio = TRIOS.find(t => t.id === item.trio)!
      expect(html).toContain(ANIMALS[trio.recipient]!.name)
      expect(html).toContain(item.kind === 'open' ? '📦🔓' : '📦🔒')
      expect(html.includes('🔑')).toBe(item.kind !== 'open')
      expect(html).not.toMatch(/#[0-9a-f]{3,6}\b/i)
      // The scene sentence says who sends to whom and who sees; nothing about the message's words.
      expect(q.prompt.sentence!.text).not.toMatch(/כָּתוּב בַּהוֹדָעָה|כָּתוּב בָּהּ/)
    }
  })

  it('kinds and answer positions are balanced; avoid, review, the domain and own keys only', () => {
    const kinds = { locked: 0, open: 0, opens: 0 }
    const slot = [0, 0, 0, 0]
    for (let seed = 0; seed < 1200; seed++) {
      const q = privacyQuestion(ctx(seed))
      kinds[parsePrivacyKey(q.itemKey)!.kind]++
      slot[q.options.findIndex(o => o.id === q.answer)]!++
    }
    for (const n of Object.values(kinds)) expect(n).toBeGreaterThan(330)
    for (const n of slot) expect(n).toBeGreaterThan(220)
    const seen = new Set<string>()
    for (let i = 0; i < PRIVACY_ITEMS.length; i++) {
      const q = privacyQuestion(ctx(i, seen))
      expect(seen.has(q.itemKey)).toBe(false)
      seen.add(q.itemKey)
    }
    expect(seen.size).toBe(12)
    for (const item of PRIVACY_ITEMS) {
      expect(privacyAccepts(privacyKey(item))).toBe(true)
      expect(privacyQuestion(ctx(3, [], privacyKey(item))).itemKey).toBe(privacyKey(item))
      expect(describePrivacy(privacyKey(item))).toBeTruthy()
    }
    for (const key of ['networks.privacy:peek:t1', 'networks.privacy:locked:t9', 'networks.web:fish:has']) expect(privacyAccepts(key), key).toBe(false)
  })
})
