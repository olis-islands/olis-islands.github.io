import type { GenContext } from '../../core/engine/types'
import { pick, shuffle } from '../../core/engine/random'
import type { PickOption } from '../../ui/pick/types'
import { SHAPES } from './content/addresses'
import { N, shapePhrase } from './ids'
import { CHOICES, ROUTE_EDGES, goodChoices, isTeachingBoard } from './route'
import type { BridgeState, RouteBoard, RouteQ, Shape } from './types'

// Route (grade 3), docs/specs/networks.md game 2: pick the next stop that can still reach the computer. Pure; ctx.rng only.

const CODE: Record<BridgeState, string> = { none: '0', open: '1', closed: '2' }
const STATE: Record<string, BridgeState> = { 0: 'none', 1: 'open', 2: 'closed' }
const SHAPE_IDS: readonly Shape[] = SHAPES.map(s => s.id)

const ROUTE = 'networks.route:'
export const routeKey = (b: RouteBoard) => `${ROUTE}${b.bridges.map(s => CODE[s]).join('')}:${CHOICES.map(c => b.names[c]).join('-')}`

export function parseRouteKey(key: string): RouteBoard | undefined {
  const m = /^networks\.route:([012]{12}):(\w+)-(\w+)-(\w+)$/.exec(key)
  if (!m) return undefined
  const names = [m[2], m[3], m[4]] as Shape[]
  if (names.some(n => !SHAPE_IDS.includes(n)) || new Set(names).size !== 3) return undefined
  const board: RouteBoard = { bridges: [...m[1]!].map(c => STATE[c]!), names: { A: names[0]!, B: names[1]!, C: names[2]! } }
  return isTeachingBoard(board) ? board : undefined
}
export const routeAccepts = (key: string) => parseRouteKey(key) !== undefined

const PRESENT = 0.6
const CLOSED = 0.3

/** A random teaching board whose way through starts at `answer`. Rejection sampling, all from ctx.rng. */
function makeBoard(rng: () => number, answer: (typeof CHOICES)[number], avoid: ReadonlySet<string>): RouteBoard {
  const order = shuffle(rng, SHAPE_IDS).slice(0, 3)
  const names = { A: order[0]!, B: order[1]!, C: order[2]! }
  for (let tries = 0; tries < 2000; tries++) {
    const bridges = ROUTE_EDGES.map((): BridgeState => (rng() < PRESENT ? (rng() < CLOSED ? 'closed' : 'open') : 'none'))
    const board = { bridges, names }
    if (isTeachingBoard(board) && goodChoices(board)[0] === answer && !avoid.has(routeKey(board))) return board
  }
  throw new Error('no route board found')
}

export function routeQuestion(ctx: GenContext): RouteQ {
  const board = parseRouteKey(ctx.review ?? '') ?? makeBoard(ctx.rng, pick(ctx.rng, CHOICES), ctx.avoid)
  const answer = board.names[goodChoices(board)[0]!]
  const option = (c: (typeof CHOICES)[number]): PickOption => ({
    id: board.names[c], kind: 'art', art: { name: 'net-hop', props: { shape: board.names[c] } }, say: shapePhrase(board.names[c]),
  })
  return {
    itemKey: routeKey(board),
    answer,
    say: N.route,
    instruction: N.route,
    hint: N.hintRoute,
    prompt: { art: [{ name: 'net-map', props: { bridges: board.bridges.map(s => CODE[s]).join(''), names: CHOICES.map(c => board.names[c]).join('-') } }], artSize: 440 },
    options: shuffle(ctx.rng, CHOICES.map(option)),
  }
}

/** Parents' page label (D18): plain Hebrew, no nikud. Boards are random, so only a general label. */
export const describeRoute = (key: string) => (parseRouteKey(key) ? 'מפת גשרים: לבחור לאן לשלוח את ההודעה' : undefined)
