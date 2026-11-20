import { registerArt, type ArtProps } from '../../ui/pick/art'
import { SHAPES } from './content/addresses'
import { N, addressPhrase } from './ids'
import { phrases } from './phrases'
import type { Address, Shape } from './types'

// Original drawings for the networks island (docs/specs/networks.md). Colors are theme tokens only.
// SVG geometry is direction-neutral, so every drawing is LTR inside (digits read left to right).

const asAddress = (p: ArtProps): Address | undefined => {
  const shape = SHAPES.find(s => s.id === p.shape)?.id
  return shape && typeof p.n === 'number' ? { shape, n: p.n } : undefined
}

const fill = (shape: Shape) => `var(${SHAPES.find(s => s.id === shape)!.color})`

/** A shape centred on (cx, cy) with radius r, outlined so a light fill still shows on any background. */
function ShapeMark({ shape, cx, cy, r }: { shape: Shape; cx: number; cy: number; r: number }) {
  const common = { fill: fill(shape), stroke: 'var(--ink)', strokeWidth: 2.5, strokeLinejoin: 'round' as const }
  switch (shape) {
    case 'circle': return <circle cx={cx} cy={cy} r={r} {...common} />
    case 'square': return <rect x={cx - r * 0.9} y={cy - r * 0.9} width={r * 1.8} height={r * 1.8} rx={2} {...common} />
    case 'triangle': return <polygon points={`${cx},${cy - r} ${cx + r * 1.05},${cy + r * 0.8} ${cx - r * 1.05},${cy + r * 0.8}`} {...common} />
    case 'star': {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const rad = i % 2 === 0 ? r * 1.1 : r * 0.48
        const t = -Math.PI / 2 + (i * Math.PI) / 5
        return `${(cx + rad * Math.cos(t)).toFixed(1)},${(cy + rad * Math.sin(t)).toFixed(1)}`
      })
      return <polygon points={pts.join(' ')} {...common} />
    }
  }
}

/** The address as on a label: shape on the left, number on the right. */
function AddressMark({ a, x, y, h }: { a: Address; x: number; y: number; h: number }) {
  return (
    <g>
      <ShapeMark shape={a.shape} cx={x + h * 0.5} cy={y + h * 0.5} r={h * 0.36} />
      <text x={x + h * 1.45} y={y + h * 0.5} dominantBaseline="central" textAnchor="middle" fontSize={h * 0.95} fontWeight={800} fill="var(--ink)">{a.n}</text>
    </g>
  )
}

/** A computer whose screen shows its address. Inside an option button, which carries the name. */
function NetComputer(p: ArtProps) {
  const a = asAddress(p)
  if (!a) return null
  return (
    <svg width={p.size} height={p.size} viewBox="0 0 100 100" style={{ direction: 'ltr' }} aria-hidden="true">
      <rect x="8" y="10" width="84" height="60" rx="8" fill="var(--card)" stroke="var(--ink)" strokeWidth="4" />
      <rect x="15" y="17" width="70" height="46" rx="4" fill="var(--bg-sea)" />
      <AddressMark a={a} x={22} y={22} h={36} />
      <rect x="44" y="70" width="12" height="12" fill="var(--mute)" />
      <rect x="28" y="82" width="44" height="8" rx="4" fill="var(--mute)" />
    </svg>
  )
}

/** The message: an envelope with the address it must reach. Named for screen readers (the prompt has no other text for it). */
function NetEnvelope(p: ArtProps) {
  const a = asAddress(p)
  if (!a) return null
  const label = [N.address, ...addressPhrase(a)].map(id => phrases[id]).join(' ')
  return (
    <svg width={p.size} height={p.size * 0.75} viewBox="0 0 120 90" style={{ direction: 'ltr' }} role="img" aria-label={label}>
      <rect x="6" y="8" width="108" height="74" rx="8" fill="var(--card)" stroke="var(--ink)" strokeWidth="4" />
      <path d="M8 12 L60 40 L112 12" fill="none" stroke="var(--line)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="24" y="42" width="72" height="36" rx="6" fill="var(--bg-sea)" stroke="var(--ink)" strokeWidth="2" />
      <AddressMark a={a} x={35} y={45} h={30} />
    </svg>
  )
}

export const NETWORKS_ART = { 'net-computer': NetComputer, 'net-envelope': NetEnvelope }

export const registerNetworksArt = () => registerArt(NETWORKS_ART)
