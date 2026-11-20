import type { GenContext } from '../../core/engine/types'
import { pick, shuffle } from '../../core/engine/random'
import type { PickOption } from '../../ui/pick/types'
import { NUMBERS, SHAPES } from './content/addresses'
import { N, addressId, addressPhrase } from './ids'
import type { Address, DeliveryQ, Shape } from './types'

// Pure question generators (docs/specs/networks.md). Use ctx.rng only.

const SHAPE_IDS: readonly Shape[] = SHAPES.map(s => s.id)
const ALL_ADDRESSES: readonly Address[] = SHAPE_IDS.flatMap(shape => NUMBERS.map(n => ({ shape, n })))

const DELIVERY = 'networks.delivery:'
export const deliveryKey = (a: Address) => `${DELIVERY}${addressId(a)}`

export function parseDeliveryKey(key: string): Address | undefined {
  if (!key.startsWith(DELIVERY)) return undefined
  return ALL_ADDRESSES.find(a => deliveryKey(a) === key)
}

export const deliveryAccepts = (key: string) => parseDeliveryKey(key) !== undefined

/**
 * How the two wrong computers differ from the address: same shape (s), same number (n) or both different (x).
 * Never one "s" and one "n": then the answer is the only computer that shares a part with both others, and a child
 * could find it without reading the envelope.
 */
export const DELIVERY_PATTERNS = ['ss', 'nn', 'sx', 'nx'] as const

function wrongAddresses(rng: () => number, a: Address, pattern: (typeof DELIVERY_PATTERNS)[number]): Address[] {
  const otherShapes = shuffle(rng, SHAPE_IDS.filter(s => s !== a.shape))
  const otherNumbers = shuffle(rng, NUMBERS.filter(n => n !== a.n))
  switch (pattern) {
    case 'ss': return [{ shape: a.shape, n: otherNumbers[0]! }, { shape: a.shape, n: otherNumbers[1]! }]
    case 'nn': return [{ shape: otherShapes[0]!, n: a.n }, { shape: otherShapes[1]!, n: a.n }]
    case 'sx': return [{ shape: a.shape, n: otherNumbers[0]! }, { shape: pick(rng, otherShapes), n: pick(rng, otherNumbers) }]
    case 'nx': return [{ shape: otherShapes[0]!, n: a.n }, { shape: pick(rng, otherShapes), n: pick(rng, otherNumbers) }]
  }
}

const computer = (a: Address): PickOption => ({
  id: addressId(a), kind: 'art', art: { name: 'net-computer', props: { shape: a.shape, n: a.n } }, say: [...addressPhrase(a)],
})

/** Grade 1: an envelope shows an address; pick the one computer of three with exactly that address. */
export function deliveryQuestion(ctx: GenContext): DeliveryQ {
  const review = ctx.review ? parseDeliveryKey(ctx.review) : undefined
  const fresh = ALL_ADDRESSES.filter(a => !ctx.avoid.has(deliveryKey(a)))
  const target = review ?? pick(ctx.rng, fresh.length ? fresh : ALL_ADDRESSES)
  const wrong = wrongAddresses(ctx.rng, target, pick(ctx.rng, DELIVERY_PATTERNS))
  return {
    itemKey: deliveryKey(target),
    answer: addressId(target),
    say: [N.delivery, N.address, ...addressPhrase(target)],
    instruction: N.delivery,
    hint: N.hintAddress,
    prompt: { art: [{ name: 'net-envelope', props: { shape: target.shape, n: target.n } }], artSize: 140 },
    options: shuffle(ctx.rng, [target, ...wrong].map(computer)),
  }
}

/** Parents' page label (D18): plain Hebrew, no nikud. */
const PLAIN_SHAPE: Record<Shape, string> = { circle: 'עיגול', triangle: 'משולש', square: 'ריבוע', star: 'כוכב' }
export function describeDelivery(key: string): string | undefined {
  const a = parseDeliveryKey(key)
  return a ? `הכתובת ${PLAIN_SHAPE[a.shape]} ${a.n}` : undefined
}
