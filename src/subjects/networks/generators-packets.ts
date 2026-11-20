import type { GenContext } from '../../core/engine/types'
import { pick, shuffle } from '../../core/engine/random'
import type { PickOption } from '../../ui/pick/types'
import { N, numberPhrase } from './ids'
import { phrases } from './phrases'
import type { PacketsQ, RetryQ } from './types'

// Packets (grade 3) and retry (grade 4), docs/specs/networks.md games 3 and 4. Pure; ctx.rng only.

/** Every order of 1…n. */
function permutations(n: number): number[][] {
  const go = (rest: number[]): number[][] => rest.length <= 1 ? [rest] : rest.flatMap(x => go(rest.filter(y => y !== x)).map(p => [x, ...p]))
  return go(Array.from({ length: n }, (_, i) => i + 1))
}
const isSorted = (a: readonly number[]) => a.every((x, i) => i === 0 || a[i - 1]! < x)
const TOTALS = [3, 4] as const

/* ---------- packets ---------- */

const PACKETS = 'networks.packets:'
/** Arrival order of the packets, as digits: "312". */
export const packetsKey = (arrival: readonly number[]) => `${PACKETS}${arrival.join('')}`
export const PACKET_ARRIVALS: readonly (readonly number[])[] = TOTALS.flatMap(n => permutations(n))

export function parsePacketsKey(key: string): readonly number[] | undefined {
  return key.startsWith(PACKETS) ? PACKET_ARRIVALS.find(a => packetsKey(a) === key) : undefined
}
export const packetsAccepts = (key: string) => parsePacketsKey(key) !== undefined

/** One packet in six arrives already in order: real packets sometimes do, so the child should not expect a mix-up. */
const IN_ORDER_SHARE = 1 / 6

export function packetsQuestion(ctx: GenContext): PacketsQ {
  const fresh = PACKET_ARRIVALS.filter(a => !ctx.avoid.has(packetsKey(a)))
  const pool = fresh.length ? fresh : PACKET_ARRIVALS
  const sorted = pool.filter(isSorted)
  const mixed = pool.filter(a => !isSorted(a))
  const arrival = parsePacketsKey(ctx.review ?? '')
    ?? (sorted.length && (ctx.rng() < IN_ORDER_SHARE || !mixed.length) ? pick(ctx.rng, sorted) : pick(ctx.rng, mixed))
  const tile = (n: number) => ({ id: `p${n}`, text: `${phrases[N.packet]} ${n}`, say: [N.packet, numberPhrase(n)] })
  return {
    itemKey: packetsKey(arrival),
    answer: [...arrival].sort((a, b) => a - b).map(n => `p${n}`),
    say: N.packets,
    instruction: N.packets,
    layout: 'sentences',
    numbered: true,
    tiles: arrival.map(tile),
  }
}

/* ---------- retry ---------- */

export interface RetryItem { total: number; missing: number; arrival: readonly number[] }

const RETRY = 'networks.retry:'
export const retryKey = (r: RetryItem) => `${RETRY}${r.total}:${r.missing}:${r.arrival.join('')}`
export const RETRY_ITEMS: readonly RetryItem[] = TOTALS.flatMap(total =>
  Array.from({ length: total }, (_, i) => i + 1).flatMap(missing =>
    permutations(total - 1).map(p => ({ total, missing, arrival: p.map(x => (x >= missing ? x + 1 : x)) }))))

export function parseRetryKey(key: string): RetryItem | undefined {
  return key.startsWith(RETRY) ? RETRY_ITEMS.find(r => retryKey(r) === key) : undefined
}
export const retryAccepts = (key: string) => parseRetryKey(key) !== undefined

const numberOption = (n: number): PickOption => ({ id: `${n}`, kind: 'number', label: `${n}`, say: numberPhrase(n) })

/** Packets 1…total were expected; all but one arrived, in some order. Which one should be asked for again? */
export function retryQuestion(ctx: GenContext): RetryQ {
  const fresh = RETRY_ITEMS.filter(r => !ctx.avoid.has(retryKey(r)))
  const item = parseRetryKey(ctx.review ?? '') ?? pick(ctx.rng, fresh.length ? fresh : RETRY_ITEMS)
  // Wrong options are packets that did arrive: the mistake to avoid is asking again for one that is already here.
  const wrong = shuffle(ctx.rng, item.arrival).slice(0, 2)
  const options = [item.missing, ...wrong].sort((a, b) => a - b).map(numberOption)
  const q = item.total === 3 ? N.retry3 : N.retry4
  return {
    itemKey: retryKey(item),
    answer: `${item.missing}`,
    say: q,
    instruction: q,
    hint: N.hintRetry,
    prompt: { art: [{ name: 'net-inbox', props: { total: item.total, arrival: item.arrival.join('') } }] },
    options,
  }
}

/** Parents' page labels (D18): plain Hebrew, no nikud. */
export function describePackets(key: string): string | undefined {
  const a = parsePacketsKey(key)
  return a ? `סידור ${a.length} חבילות שהגיעו בסדר ${a.join(', ')}` : undefined
}
export function describeRetry(key: string): string | undefined {
  const r = parseRetryKey(key)
  return r ? `חבילה ${r.missing} חסרה מתוך ${r.total}` : undefined
}
