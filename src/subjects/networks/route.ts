import type { BridgeState, RouteBoard, RouteNode } from './types'

// Route board logic (docs/specs/networks.md, game 2). The crossroads links to the three choices A, B, C; bridges link
// choices to middle stops X, Y, Z, the stops to each other, and the stops to the computer D. Paths never go back
// through the crossroads, and choices are never linked to each other, so each choice is judged on its own.

export const ROUTE_EDGES = ['AX', 'AY', 'BX', 'BY', 'BZ', 'CY', 'CZ', 'XY', 'YZ', 'XD', 'YD', 'ZD'] as const
export const CHOICES = ['A', 'B', 'C'] as const

/** Can the message get from `start` to the computer? `passClosed`: as if every closed bridge were open. */
export function reaches(bridges: readonly BridgeState[], start: RouteNode, passClosed = false): boolean {
  const usable = ROUTE_EDGES.filter((_, i) => bridges[i] === 'open' || (passClosed && bridges[i] === 'closed'))
  const seen = new Set<RouteNode>([start])
  const queue: RouteNode[] = [start]
  while (queue.length) {
    const at = queue.shift()!
    if (at === 'D') return true
    for (const e of usable) {
      const [a, b] = [e[0] as RouteNode, e[1] as RouteNode]
      const next = a === at ? b : b === at ? a : undefined
      if (next && !seen.has(next)) { seen.add(next); queue.push(next) }
    }
  }
  return false
}

/** The choices that reach the computer through open bridges. */
export const goodChoices = (board: Pick<RouteBoard, 'bridges'>) => CHOICES.filter(c => reaches(board.bridges, c))

/**
 * A board teaches when exactly one choice gets through, every choice has at least one bridge (no bare dead ends), and at
 * least one wrong choice would get through if a closed bridge were open (so "closed" matters, not only dead ends).
 */
export function isTeachingBoard(board: Pick<RouteBoard, 'bridges'>): boolean {
  if (goodChoices(board).length !== 1) return false
  for (const c of CHOICES) if (!ROUTE_EDGES.some((e, i) => e.includes(c) && board.bridges[i] !== 'none')) return false
  return CHOICES.some(c => !reaches(board.bridges, c) && reaches(board.bridges, c, true))
}
