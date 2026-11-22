import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import { firewallHelp } from './content/help'
import { GATE_ITEMS, firewallKey, firewallQuestion, passes } from './generators-gates'
import { island } from './index'

const NIKUD = /[֑-ֽֿ-ׇ]/

describe('Oli help (D25)', () => {
  it('only the firewall game has help, for now', () => {
    for (const skill of island.skills) for (const game of skill.games) expect(!!game.help, game.id).toBe(game.id === 'firewall')
  })

  it('firewall help depends only on the rule, never on the packet or its outcome', () => {
    for (const item of GATE_ITEMS) {
      const sameRule = GATE_ITEMS.filter(i => i.rule.kind === item.rule.kind && i.rule.shape === item.rule.shape)
      // Both outcomes occur for every rule, and all of them get the same help.
      expect(new Set(sameRule.map(i => passes(i.rule, i.packet))).size).toBe(2)
      const help = firewallHelp({ itemKey: firewallKey(item) })
      for (const other of sameRule) expect(firewallHelp({ itemKey: firewallKey(other) })).toEqual(help)
    }
  })

  it('the clue names the field the rule checks, and "רַק" matches allow or block', () => {
    for (const item of GATE_ITEMS) {
      const help = firewallHelp({ itemKey: firewallKey(item) })
      const clue = help.find(e => e.question === 'אֶפְשָׁר רֶמֶז?')!.answer
      expect(clue).toContain(item.rule.kind.endsWith('To') ? 'בודק רק את המקבל' : 'בודק רק את השולח')
      const only = help.find(e => e.question.includes('"רַק"'))!.answer
      expect(only).toContain(item.rule.kind.startsWith('allow') ? 'מכניס רק' : 'עוצר רק')
    }
  })

  it('questions keep nikud, answers have none, and generated questions get help', () => {
    for (let seed = 0; seed < 200; seed++) {
      const help = firewallHelp(firewallQuestion({ rng: seeded(seed), avoid: new Set() }))
      expect(help).toHaveLength(5)
      for (const entry of help) {
        expect(entry.question).toMatch(NIKUD)
        expect(entry.answer).not.toMatch(NIKUD)
      }
    }
    expect(firewallHelp({ itemKey: 'networks.delivery:star-3' })).toEqual([])
  })
})
