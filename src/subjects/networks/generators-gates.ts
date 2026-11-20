import type { GenContext } from '../../core/engine/types'
import { pick } from '../../core/engine/random'
import type { PickOption } from '../../ui/pick/types'
import { SHAPES } from './content/addresses'
import { N, rulePhrase, shapePhrase } from './ids'
import { phrases } from './phrases'
import type { FirewallQ, GateRule, Packet, RuleKind, Shape } from './types'

// Firewall (grade 4), docs/specs/networks.md game 5. One rule checks one field of the packet. Pure; ctx.rng only.

const SHAPE_IDS: readonly Shape[] = SHAPES.map(s => s.id)
export const RULE_KINDS: readonly RuleKind[] = ['allowTo', 'allowFrom', 'blockTo', 'blockFrom']

const field = (kind: RuleKind): keyof Packet => (kind.endsWith('To') ? 'to' : 'from')

/** Does the packet go in? "allow…" lets in only matching packets; "block…" stops only matching packets. */
export function passes(rule: GateRule, packet: Packet): boolean {
  const match = packet[field(rule.kind)] === rule.shape
  return rule.kind.startsWith('allow') ? match : !match
}

export interface GateItem { rule: GateRule; packet: Packet }

const FIREWALL = 'networks.firewall:'
export const firewallKey = ({ rule, packet }: GateItem) => `${FIREWALL}${rule.kind}-${rule.shape}:${packet.from}-${packet.to}`

const PACKETS: readonly Packet[] = SHAPE_IDS.flatMap(from => SHAPE_IDS.filter(to => to !== from).map(to => ({ from, to })))
export const GATE_ITEMS: readonly GateItem[] = RULE_KINDS.flatMap(kind => SHAPE_IDS.flatMap(shape => PACKETS.map(packet => ({ rule: { kind, shape }, packet }))))

export function parseFirewallKey(key: string): GateItem | undefined {
  return key.startsWith(FIREWALL) ? GATE_ITEMS.find(i => firewallKey(i) === key) : undefined
}
export const firewallAccepts = (key: string) => parseFirewallKey(key) !== undefined

/**
 * A packet is "tricky" when the rule's shape sits in the field the rule does not check (rule about the sender, the shape
 * is the receiver): a child who only looks for the shape gets it wrong. Half of the questions are tricky.
 */
export const isTricky = ({ rule, packet }: GateItem) => packet[field(rule.kind) === 'to' ? 'from' : 'to'] === rule.shape

export const ALLOW = 'allow'
export const BLOCK = 'block'
const OPTIONS: PickOption[] = [
  { id: ALLOW, kind: 'picture', emoji: '✅', caption: phrases[N.allow]!, say: N.allow },
  { id: BLOCK, kind: 'picture', emoji: '⛔', caption: phrases[N.block]!, say: N.block },
]

export function firewallQuestion(ctx: GenContext): FirewallQ {
  const review = parseFirewallKey(ctx.review ?? '')
  let item = review
  if (!item) {
    const fresh = GATE_ITEMS.filter(i => !ctx.avoid.has(firewallKey(i)))
    const pool = fresh.length ? fresh : GATE_ITEMS
    // Kind first, then the outcome: every kind of rule lets the packet in half of the time, so the rule's wording never
    // predicts the answer. Within an outcome, tricky and plain packets equally often (when both exist).
    const kind = pick(ctx.rng, RULE_KINDS)
    const goesIn = ctx.rng() < 0.5
    const tricky = ctx.rng() < 0.5
    const layers = [
      (i: GateItem) => i.rule.kind === kind,
      (i: GateItem) => passes(i.rule, i.packet) === goesIn,
      (i: GateItem) => isTricky(i) === tricky,
    ]
    let candidates = pool
    for (const keep of layers) {
      const next = candidates.filter(keep)
      if (next.length) candidates = next
    }
    item = pick(ctx.rng, candidates)
  }
  const { rule, packet } = item
  const ruleSay = [rulePhrase(rule.kind), shapePhrase(rule.shape)]
  return {
    itemKey: firewallKey(item),
    answer: passes(rule, packet) ? ALLOW : BLOCK,
    say: [...ruleSay, N.firewall],
    instruction: N.firewall,
    hint: N.hintFirewall,
    prompt: {
      sentence: { text: ruleSay.map(id => phrases[id]).join(' '), say: ruleSay },
      art: [{ name: 'net-gate', props: { kind: rule.kind, shape: rule.shape } }, { name: 'net-packet', props: { from: packet.from, to: packet.to } }],
    },
    options: OPTIONS,
  }
}

/** Parents' page label (D18): plain Hebrew, no nikud. */
const PLAIN_SHAPE: Record<Shape, string> = { circle: 'עיגול', triangle: 'משולש', square: 'ריבוע', star: 'כוכב' }
const PLAIN_RULE: Record<RuleKind, string> = {
  allowTo: 'מכניס רק חבילות אל ', allowFrom: 'מכניס רק חבילות מ', blockTo: 'עוצר חבילות אל ', blockFrom: 'עוצר חבילות מ',
}
export function describeFirewall(key: string): string | undefined {
  const i = parseFirewallKey(key)
  return i ? `שער ש${PLAIN_RULE[i.rule.kind]}${PLAIN_SHAPE[i.rule.shape]}; חבילה מ${PLAIN_SHAPE[i.packet.from]} אל ${PLAIN_SHAPE[i.packet.to]}` : undefined
}
