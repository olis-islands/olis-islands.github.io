import type { GenContext } from '../../core/engine/types'
import { pick } from '../../core/engine/random'
import { EVIDENCE, STAGES } from './content/detective'
import { N, evidencePhrase } from './ids'
import type { DetectiveQ, Stage } from './types'

// Network detective (grade 6), docs/specs/networks.md game 9. Pure; ctx.rng only.

export const STAGE_IDS: readonly Stage[] = STAGES.map(s => s.id)
export interface DetectiveItem { fault: Stage; variant: number }

const DETECTIVE = 'networks.diagnose:'
export const detectiveKey = (i: DetectiveItem) => `${DETECTIVE}${i.fault}:${i.variant}`
/** 4 stages × 3 ways to fail = 12 items. */
export const DETECTIVE_ITEMS: readonly DetectiveItem[] = STAGE_IDS.flatMap(fault => EVIDENCE[fault].fail.map((_, variant) => ({ fault, variant })))
export function parseDetectiveKey(key: string): DetectiveItem | undefined {
  return key.startsWith(DETECTIVE) ? DETECTIVE_ITEMS.find(i => detectiveKey(i) === key) : undefined
}
export const detectiveAccepts = (key: string) => parseDetectiveKey(key) !== undefined

export function detectiveQuestion(ctx: GenContext): DetectiveQ {
  const fresh = DETECTIVE_ITEMS.filter(i => !ctx.avoid.has(detectiveKey(i)))
  const pool = fresh.length ? fresh : DETECTIVE_ITEMS
  // Fault stage first, so each stage is the problem equally often.
  const fault = pick(ctx.rng, STAGE_IDS)
  const ofFault = pool.filter(i => i.fault === fault)
  const item = parseDetectiveKey(ctx.review ?? '') ?? pick(ctx.rng, ofFault.length ? ofFault : pool)
  const evidence = Object.fromEntries(STAGE_IDS.map(s => [s, s === item.fault
    ? evidencePhrase(s, 'fail', item.variant)
    : evidencePhrase(s, 'ok', Math.floor(ctx.rng() * EVIDENCE[s].ok.length))])) as Record<Stage, string>
  return { itemKey: detectiveKey(item), answer: item.fault, say: N.detective, instruction: N.detective, hint: N.hintDetective, evidence }
}

/** Parents' page label (D18): plain Hebrew, no nikud. */
const PLAIN: Record<Stage, string> = { lookup: 'ספר הכתובות', route: 'הדרך', gate: 'השער', library: 'הספרייה' }
export const describeDetective = (key: string) => { const i = parseDetectiveKey(key); return i ? `תקלה ב${PLAIN[i.fault]}` : undefined }
