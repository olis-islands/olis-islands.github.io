import type { GenContext } from '../../core/engine/types'
import { pick, shuffle } from '../../core/engine/random'
import type { PickOption } from '../../ui/pick/types'
import { PLACE_ADDRESS, PLACE_KINDS, PLACE_NOUNS, TOPICS } from './content/lookup'
import { N, placeKindPhrase, placeNounPhrase, topicPhrase } from './ids'
import { phrases } from './phrases'
import type { DnsQ, Place, WebQ } from './types'

// Name lookup (grade 5) and web request (grade 5), docs/specs/networks.md games 6 and 7. Pure; ctx.rng only.

/* ---------- name lookup ---------- */

export const placeId = (p: Place) => `${p.noun}-${p.kind}`
export const PLACES: readonly Place[] = PLACE_NOUNS.flatMap(n => PLACE_KINDS.map(k => ({ noun: n.id, kind: k.id })))
export const addressOf = (p: Place) => PLACE_ADDRESS[placeId(p)]!
const placeSay = (p: Place) => [placeNounPhrase(p.noun), placeKindPhrase(p.kind)]
export const placeText = (p: Place) => placeSay(p).map(id => phrases[id]).join(' ')

const DNS = 'networks.dns:'
export const dnsKey = (p: Place) => `${DNS}${placeId(p)}`
export function parseDnsKey(key: string): Place | undefined {
  return key.startsWith(DNS) ? PLACES.find(p => dnsKey(p) === key) : undefined
}
export const dnsAccepts = (key: string) => parseDnsKey(key) !== undefined

/**
 * The address book has four rows: the place, one with the same first word, one with the same second word, and one
 * unrelated. The options are the addresses of the first three: a child who matches only one word picks a wrong one.
 */
export function dnsQuestion(ctx: GenContext): DnsQ {
  const fresh = PLACES.filter(p => !ctx.avoid.has(dnsKey(p)))
  const target = parseDnsKey(ctx.review ?? '') ?? pick(ctx.rng, fresh.length ? fresh : PLACES)
  const otherNoun = shuffle(ctx.rng, PLACE_NOUNS.filter(n => n.id !== target.noun)).map(n => n.id)
  const otherKind = shuffle(ctx.rng, PLACE_KINDS.filter(k => k.id !== target.kind)).map(k => k.id)
  const sameNoun = { noun: target.noun, kind: otherKind[0]! }
  const sameKind = { noun: otherNoun[0]!, kind: target.kind }
  const unrelated = { noun: otherNoun[1]!, kind: otherKind[1]! }
  const rows = shuffle(ctx.rng, [target, sameNoun, sameKind, unrelated])
  const option = (p: Place): PickOption => ({ id: `${addressOf(p)}`, kind: 'number', label: `${addressOf(p)}` })
  return {
    itemKey: dnsKey(target),
    answer: `${addressOf(target)}`,
    say: [N.dns, ...placeSay(target), N.dnsFind],
    instruction: N.dns,
    hint: N.hintDns,
    prompt: {
      sentence: { text: placeText(target), say: placeSay(target) },
      art: [{ name: 'net-book', props: { rows: rows.map(placeId).join('|') } }],
    },
    options: shuffle(ctx.rng, [target, sameNoun, sameKind].map(option)),
  }
}

/* ---------- web request ---------- */

export const NOT_FOUND = 'not-found'
const WEB = 'networks.web:'
/** `has`: the library has the requested page (answer: that page), or not (answer: "not found"). */
export interface WebItem { topic: string; has: boolean }
export const webKey = (w: WebItem) => `${WEB}${w.topic}:${w.has ? 'has' : 'missing'}`
export const WEB_ITEMS: readonly WebItem[] = TOPICS.flatMap(t => [{ topic: t.id, has: true }, { topic: t.id, has: false }])
export function parseWebKey(key: string): WebItem | undefined {
  return key.startsWith(WEB) ? WEB_ITEMS.find(w => webKey(w) === key) : undefined
}
export const webAccepts = (key: string) => parseWebKey(key) !== undefined

/** Two requests in three are for a page the library has. */
const HAS_SHARE = 2 / 3

/**
 * The library's three pages are the options, with "not found". Its look-alikes (same family as the request) are always
 * among them, so the answer needs an exact match, and "not found" is right only when nothing matches.
 */
export function webQuestion(ctx: GenContext): WebQ {
  const fresh = WEB_ITEMS.filter(w => !ctx.avoid.has(webKey(w)))
  const pool = fresh.length ? fresh : WEB_ITEMS
  const has = ctx.rng() < HAS_SHARE
  const byHas = pool.filter(w => w.has === has)
  const item = parseWebKey(ctx.review ?? '') ?? pick(ctx.rng, byHas.length ? byHas : pool)
  const topic = TOPICS.find(t => t.id === item.topic)!
  const family = shuffle(ctx.rng, TOPICS.filter(t => t.family === topic.family && t.id !== topic.id))
  const other = pick(ctx.rng, TOPICS.filter(t => t.family !== topic.family))
  const pages = item.has ? [topic, family[0]!, other] : [family[0]!, family[1]!, other]
  const page = (t: (typeof TOPICS)[number]): PickOption => ({ id: t.id, kind: 'picture', emoji: t.emoji, caption: phrases[topicPhrase(t.id)]!, say: topicPhrase(t.id) })
  const request = [N.pageAbout, topicPhrase(topic.id)]
  return {
    itemKey: webKey(item),
    answer: item.has ? topic.id : NOT_FOUND,
    say: [N.web, ...request, N.webAnswer],
    instruction: N.web,
    hint: N.hintWeb,
    // The request first, then the question, shown over the options (they are the library's pages).
    prompt: { sentence: { text: request.map(id => phrases[id]).join(' '), say: request }, art: [{ name: 'net-label', props: { phrase: N.webAnswer } }] },
    options: [...shuffle(ctx.rng, pages.map(page)), { id: NOT_FOUND, kind: 'picture', emoji: '📭', caption: phrases[N.notFound]!, say: N.notFound }],
  }
}

/** Parents' page labels (D18): plain Hebrew, no nikud. */
export function describeDns(key: string): string | undefined {
  const p = parseDnsKey(key)
  if (!p) return undefined
  return `הכתובת של ${PLACE_NOUNS.find(n => n.id === p.noun)!.plain} ${PLACE_KINDS.find(k => k.id === p.kind)!.plain}`
}
export function describeWeb(key: string): string | undefined {
  const w = parseWebKey(key)
  return w ? `בקשה לדף על ${TOPICS.find(t => t.id === w.topic)!.plain} (${w.has ? 'יש בספרייה' : 'אין בספרייה'})` : undefined
}
