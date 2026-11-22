import type { GenContext } from '../../core/engine/types'
import { pick, shuffle } from '../../core/engine/random'
import type { PickOption } from '../../ui/pick/types'
import { ANIMALS, TRIOS } from './content/privacy'
import { N, animalPhrase, scenePhrase } from './ids'
import { phrases } from './phrases'
import type { PrivacyKind, PrivacyQ } from './types'

// Locked message (grade 6), docs/specs/networks.md game 8. Pure; ctx.rng only.

export const PRIVACY_KINDS: readonly PrivacyKind[] = ['locked', 'open', 'opens']
export interface PrivacyItem { kind: PrivacyKind; trio: string }

const PRIVACY = 'networks.privacy:'
export const privacyKey = (i: PrivacyItem) => `${PRIVACY}${i.kind}:${i.trio}`
export const PRIVACY_ITEMS: readonly PrivacyItem[] = PRIVACY_KINDS.flatMap(kind => TRIOS.map(t => ({ kind, trio: t.id })))
export function parsePrivacyKey(key: string): PrivacyItem | undefined {
  return key.startsWith(PRIVACY) ? PRIVACY_ITEMS.find(i => privacyKey(i) === key) : undefined
}
export const privacyAccepts = (key: string) => parsePrivacyKey(key) !== undefined

const text = (id: string): PickOption => ({ id, kind: 'text', label: phrases[id]!, say: id })
/** What the one who sees the box can know: a lock hides what is inside, not where the box goes. */
const KNOWS = [N.optTo, N.optContent, N.optBoth, N.optNothing] as const

export function privacyQuestion(ctx: GenContext): PrivacyQ {
  const fresh = PRIVACY_ITEMS.filter(i => !ctx.avoid.has(privacyKey(i)))
  const pool = fresh.length ? fresh : PRIVACY_ITEMS
  // Kind first, so the three kinds come up equally often.
  const kind = pick(ctx.rng, PRIVACY_KINDS)
  const item = parsePrivacyKey(ctx.review ?? '') ?? pick(ctx.rng, pool.filter(i => i.kind === kind).length ? pool.filter(i => i.kind === kind) : pool)
  const trio = TRIOS.find(t => t.id === item.trio)!
  const scene = scenePhrase(trio.id, item.kind === 'open' ? 'open' : 'locked')
  const art = { name: 'net-privacy', props: { trio: trio.id, locked: item.kind !== 'open' } }
  if (item.kind === 'opens') {
    const who = (id: string): PickOption => ({ id, kind: 'picture', emoji: ANIMALS[id]!.emoji, caption: phrases[animalPhrase(id)]!, say: animalPhrase(id) })
    return {
      itemKey: privacyKey(item),
      answer: trio.recipient,
      say: [scene, N.privacyOpens],
      instruction: N.privacyOpens,
      hint: N.hintPrivacyOpens,
      prompt: { sentence: { text: phrases[scene]!, say: scene }, art: [art] },
      options: shuffle(ctx.rng, [
        who(trio.recipient), who(trio.observer),
        { id: N.optEveryone, kind: 'picture', emoji: '👥', caption: phrases[N.optEveryone]!, say: N.optEveryone },
        { id: N.optNoOne, kind: 'picture', emoji: '🚫', caption: phrases[N.optNoOne]!, say: N.optNoOne },
      ]),
      after: N.password,
    }
  }
  return {
    itemKey: privacyKey(item),
    answer: item.kind === 'locked' ? N.optTo : N.optBoth,
    say: [scene, N.privacySee],
    instruction: N.privacySee,
    hint: item.kind === 'open' ? N.hintPrivacyOpen : N.hintPrivacySee,
    prompt: { sentence: { text: phrases[scene]!, say: scene }, art: [art] },
    options: shuffle(ctx.rng, KNOWS.map(text)),
  }
}

/** Parents' page label (D18): plain Hebrew, no nikud. */
const PLAIN: Record<PrivacyKind, string> = {
  locked: 'מה רואים בקופסה נעולה', open: 'מה רואים בקופסה פתוחה', opens: 'מי יכול לפתוח קופסה נעולה',
}
export const describePrivacy = (key: string) => { const i = parsePrivacyKey(key); return i ? PLAIN[i.kind] : undefined }
