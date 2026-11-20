import type { CSSProperties } from 'react'
import { registerArt, type ArtProps } from '../../ui/pick/art'
import { LABELS } from './content/labels'

// Drawings for the packets games (docs/specs/networks.md, games 3 and 4). Colors are theme tokens only.

const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-start' }
const label: CSSProperties = { fontWeight: 700, fontSize: 20, color: 'var(--mute)', textAlign: 'start' }

function Chip({ n, packet }: { n: number; packet: boolean }) {
  const style: CSSProperties = {
    display: 'inline-grid', placeItems: 'center', width: 46, height: 46, borderRadius: 12, fontSize: 26, fontWeight: 800,
    color: 'var(--ink)', background: packet ? 'var(--sand)' : 'var(--card)',
    border: packet ? '3px solid var(--owl)' : '3px dashed var(--line)',
  }
  return <span style={style}>{n}</span>
}

/** Retry: the numbers the computer waited for, and the packets that arrived in their arrival order (both rows left to right, like numbers). */
function NetInbox(p: ArtProps) {
  const total = typeof p.total === 'number' ? p.total : 0
  const arrival = [...String(p.arrival ?? '')].map(Number)
  const expected = Array.from({ length: total }, (_, i) => i + 1)
  return (
    <div role="img" aria-label={`${LABELS.waited(total)} ${LABELS.arrived(arrival)}`}
      style={{ display: 'grid', gridTemplateColumns: 'auto auto', alignItems: 'center', justifyContent: 'center', gap: '12px 14px' }}>
      <span style={label} aria-hidden="true">{LABELS.waitedShort}</span>
      <span className="digi" dir="ltr" style={row} aria-hidden="true">{expected.map(n => <Chip key={n} n={n} packet={false} />)}</span>
      <span style={label} aria-hidden="true">{LABELS.arrivedShort}</span>
      <span className="digi" dir="ltr" style={row} aria-hidden="true">{arrival.map(n => <Chip key={n} n={n} packet />)}</span>
    </div>
  )
}

export const PACKETS_ART = { 'net-inbox': NetInbox }
export const registerPacketsArt = () => registerArt(PACKETS_ART)
