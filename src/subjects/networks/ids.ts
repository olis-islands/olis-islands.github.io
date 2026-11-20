import type { Address, Shape } from './types'

// Phrase-ID contract of the networks island (docs/specs/networks.md). Reserved prefixes:
// networks.q.* (instructions), networks.hint.*, networks.ui.*, networks.example.*, networks.explain.*.
//
// Exports by task:
//   T0 (planner)   types.ts, ids.ts, phrases.ts, index.ts
//   delivery slice content/addresses.ts SHAPES, NUMBERS · generators.ts deliveryQuestion, deliveryAccepts · art.tsx
//   T2 packets     generators-packets.ts packetsQuestion, retryQuestion (+ accepts, describe) · art-packets.tsx
// Text that is only read by screen readers, never spoken, lives in content/labels.ts (nothing to record).

export const N = {
  delivery: 'networks.q.delivery', //    "לְאֵיזֶה מַחְשֵׁב הַהוֹדָעָה צְרִיכָה לְהַגִּיעַ?"
  hintAddress: 'networks.hint.address', // "הַכְּתֹבֶת … צוּרָה וּמִסְפָּר …"
  address: 'networks.ui.address', //     "הַכְּתֹבֶת הִיא", followed by a shape and a number
  packets: 'networks.q.packets', //      "הַהוֹדָעָה הִגִּיעָה בַּחֲבִילוֹת …"
  packet: 'networks.ui.packet', //       "חֲבִילָה", followed by a number
  retry3: 'networks.q.retry3', //        "הַמַּחְשֵׁב חִכָּה לְשָׁלוֹשׁ חֲבִילוֹת …"
  retry4: 'networks.q.retry4', //        "… לְאַרְבַּע חֲבִילוֹת …"
  hintRetry: 'networks.hint.retry', //   "… אֵיזֶה מִסְפָּר חָסֵר …"
} as const

/** A shape's name ("עִגּוּל"); the same text as the thinking island's shapes, so one recording serves both. */
export const shapePhrase = (shape: Shape) => `networks.shape.${shape}`
/** A number 1–9 in its feminine counting form ("שָׁלוֹשׁ"), the same text as the math island's numbers. */
export const numberPhrase = (n: number) => `networks.n.${n}`
/** An address said aloud: shape, then number. */
export const addressPhrase = (a: Address) => [shapePhrase(a.shape), numberPhrase(a.n)] as const
/** Stable id of an address, used as option id and inside item keys: "circle-3". */
export const addressId = (a: Address) => `${a.shape}-${a.n}`
