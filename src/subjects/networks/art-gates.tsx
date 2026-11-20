import type { CSSProperties } from 'react'
import { registerArt, type ArtProps } from '../../ui/pick/art'
import { ShapeMark } from './art'
import { SHAPES } from './content/addresses'
import { N, shapePhrase } from './ids'
import { phrases } from './phrases'
import type { Shape } from './types'

// The gate and the packet (docs/specs/networks.md, game 5). Colors are theme tokens only.

const asShape = (v: ArtProps[string] | undefined): Shape | undefined => SHAPES.find(s => s.id === v)?.id

const card: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'auto auto', alignItems: 'center', gap: '8px 12px', padding: '12px 18px',
  borderRadius: 16, background: 'var(--sand)', border: '3px solid var(--owl)', color: 'var(--ink)',
}
const fieldName: CSSProperties = { fontWeight: 700, fontSize: 20 }

function Mark({ shape }: { shape: Shape }) {
  return <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><ShapeMark shape={shape} cx={20} cy={21} r={14} /></svg>
}

function NetPacket(p: ArtProps) {
  const from = asShape(p.from)
  const to = asShape(p.to)
  if (!from || !to) return null
  const label = `📦 ${phrases[N.sender]}: ${phrases[shapePhrase(from)]}. ${phrases[N.receiver]}: ${phrases[shapePhrase(to)]}.`
  return (
    <div role="img" aria-label={label} style={card}>
      <span aria-hidden="true" style={{ gridColumn: '1 / -1', fontSize: 34, textAlign: 'center', lineHeight: 1 }}>📦</span>
      <span aria-hidden="true" style={fieldName}>{phrases[N.sender]}:</span>
      <Mark shape={from} />
      <span aria-hidden="true" style={fieldName}>{phrases[N.receiver]}:</span>
      <Mark shape={to} />
    </div>
  )
}

/** The gate's rule as a picture: the field it checks and the shape. The rule sentence above says it in words. */
function NetGate(p: ArtProps) {
  const shape = asShape(p.shape)
  const kind = typeof p.kind === 'string' ? p.kind : ''
  if (!shape) return null
  return (
    <div aria-hidden="true" style={{ ...card, background: 'var(--card)', border: '3px solid var(--net)' }}>
      <span style={{ gridColumn: '1 / -1', fontSize: 34, textAlign: 'center', lineHeight: 1 }}>🚪</span>
      <span style={fieldName}>{phrases[kind.endsWith('To') ? N.receiver : N.sender]}:</span>
      <Mark shape={shape} />
    </div>
  )
}

export const GATES_ART = { 'net-packet': NetPacket, 'net-gate': NetGate }
export const registerGatesArt = () => registerArt(GATES_ART)
