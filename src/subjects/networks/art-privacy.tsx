import type { CSSProperties } from 'react'
import { registerArt, type ArtProps } from '../../ui/pick/art'
import { ANIMALS, TRIOS } from './content/privacy'
import { LABELS } from './content/labels'

// The locked-message scene (docs/specs/networks.md, game 8): sender → box → recipient, and who sees the box on the way.
// The box never shows what is written inside, even when open. The scene sentence above says it in words.

const row: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }
const who: CSSProperties = { display: 'grid', justifyItems: 'center', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }
const big: CSSProperties = { fontSize: 36, lineHeight: 1 }

function NetPrivacy(p: ArtProps) {
  const trio = TRIOS.find(t => t.id === p.trio)
  if (!trio) return null
  const [s, r, o] = [ANIMALS[trio.sender]!, ANIMALS[trio.recipient]!, ANIMALS[trio.observer]!]
  const locked = p.locked === true
  return (
    <div role="img" aria-label={LABELS.privacyScene(locked, r.name)} style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
      <div style={row}>
        <span style={who}><span style={big}>{s.emoji}</span>{s.name}</span>
        <span aria-hidden="true" style={{ fontSize: 20 }}>⬅️</span>
        <span style={{ ...who, padding: '8px 12px', borderRadius: 14, background: 'var(--sand)', border: '3px solid var(--owl)' }}>
          <span style={big}>{locked ? '🔒' : '📂'}</span>
          <span>{LABELS.privacyTo(r.name)}</span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 20 }}>⬅️</span>
        <span style={who}><span style={big}>{r.emoji}{locked ? '🔑' : ''}</span>{r.name}</span>
      </div>
      <div style={{ ...who, flexDirection: 'row', display: 'flex', gap: 6 }}><span style={{ fontSize: 30 }}>👀</span>{o.emoji} {o.name}</div>
    </div>
  )
}

export const PRIVACY_ART = { 'net-privacy': NetPrivacy }
export const registerPrivacyArt = () => registerArt(PRIVACY_ART)
