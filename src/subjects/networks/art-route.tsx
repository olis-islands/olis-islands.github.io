import { registerArt, type ArtProps } from '../../ui/pick/art'
import { ShapeMark } from './art'
import { SHAPES } from './content/addresses'
import { LABELS } from './content/labels'
import { shapePhrase } from './ids'
import { phrases } from './phrases'
import { ROUTE_EDGES } from './route'
import type { RouteNode, Shape } from './types'

// The route map and its choices (docs/specs/networks.md, game 2). The crossroads is on the right (reading starts there),
// the computer on the left. A closed bridge is dashed, red and crossed, so color is never the only cue.

type Point = readonly [number, number]
const AT: Record<RouteNode | 'S', Point> = {
  S: [300, 110], A: [225, 40], B: [225, 110], C: [225, 180], X: [140, 40], Y: [140, 110], Z: [140, 180], D: [45, 110],
}
const STOP_NUMBER: Partial<Record<RouteNode, string>> = { X: '1', Y: '2', Z: '3' }

const asShape = (v: unknown): Shape | undefined => SHAPES.find(s => s.id === v)?.id

function NetMap(p: ArtProps) {
  const bridges = [...String(p.bridges ?? '')]
  const names = String(p.names ?? '').split('-').map(asShape)
  if (bridges.length !== ROUTE_EDGES.length || names.length !== 3 || names.some(n => !n)) return null
  const shapeOf: Partial<Record<RouteNode, Shape>> = { A: names[0], B: names[1], C: names[2] }
  const nameOf = (n: RouteNode) => n === 'D' ? LABELS.routeComputer : shapeOf[n] ? phrases[shapePhrase(shapeOf[n]!)]! : STOP_NUMBER[n]!
  const drawn = ROUTE_EDGES.map((e, i) => ({ a: e[0] as RouteNode, b: e[1] as RouteNode, state: bridges[i] })).filter(e => e.state !== '0')
  const label = [LABELS.routeMap, ...drawn.map(e => LABELS.routeBridge(nameOf(e.a), nameOf(e.b), e.state === '1'))].join(' ')
  return (
    <svg width={p.size} viewBox="0 0 340 220" style={{ direction: 'ltr', maxWidth: '100%', height: 'auto' }} role="img" aria-label={label}>
      {(['A', 'B', 'C'] as const).map(c => (
        <line key={c} x1={AT.S[0]} y1={AT.S[1]} x2={AT[c][0]} y2={AT[c][1]} stroke="var(--line)" strokeWidth="6" strokeLinecap="round" />
      ))}
      {drawn.map(({ a, b, state }) => {
        const [x1, y1] = AT[a]
        const [x2, y2] = AT[b]
        const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2]
        return state === '1'
          ? <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
          : (
            <g key={a + b}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--bad)" strokeWidth="4" strokeDasharray="7 7" />
              <circle cx={mx} cy={my} r="10" fill="var(--card)" stroke="var(--bad)" strokeWidth="3" />
              <path d={`M${mx - 5} ${my - 5} L${mx + 5} ${my + 5} M${mx + 5} ${my - 5} L${mx - 5} ${my + 5}`} stroke="var(--bad)" strokeWidth="3" />
            </g>
          )
      })}
      <circle cx={AT.S[0]} cy={AT.S[1]} r="22" fill="var(--sand)" stroke="var(--ink)" strokeWidth="3" />
      <text x={AT.S[0]} y={AT.S[1]} textAnchor="middle" dominantBaseline="central" fontSize="22">✉️</text>
      {(['A', 'B', 'C'] as const).map(c => (
        <g key={c}>
          <circle cx={AT[c][0]} cy={AT[c][1]} r="20" fill="var(--card)" stroke="var(--ink)" strokeWidth="3" />
          <ShapeMark shape={shapeOf[c]!} cx={AT[c][0]} cy={AT[c][1] + 1} r={11} />
        </g>
      ))}
      {(['X', 'Y', 'Z'] as const).map(n => (
        <g key={n}>
          <circle cx={AT[n][0]} cy={AT[n][1]} r="15" fill="var(--bg-sea)" stroke="var(--ink)" strokeWidth="3" />
          <text x={AT[n][0]} y={AT[n][1]} textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="800" fill="var(--ink)">{STOP_NUMBER[n]}</text>
        </g>
      ))}
      <circle cx={AT.D[0]} cy={AT.D[1]} r="26" fill="var(--card)" stroke="var(--net)" strokeWidth="4" />
      <text x={AT.D[0]} y={AT.D[1]} textAnchor="middle" dominantBaseline="central" fontSize="26">🖥️</text>
    </svg>
  )
}

/** A choice next to the crossroads, drawn as on the map. Inside an option button, which carries the name. */
function NetHop(p: ArtProps) {
  const shape = asShape(p.shape)
  if (!shape) return null
  return (
    <svg width={p.size * 0.7} height={p.size * 0.7} viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="26" fill="var(--card)" stroke="var(--ink)" strokeWidth="3" />
      <ShapeMark shape={shape} cx={30} cy={31} r={15} />
    </svg>
  )
}

export const ROUTE_ART = { 'net-map': NetMap, 'net-hop': NetHop }
export const registerRouteArt = () => registerArt(ROUTE_ART)
