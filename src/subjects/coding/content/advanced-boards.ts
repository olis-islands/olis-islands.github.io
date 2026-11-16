import type { Board } from '../types'
import type { Action, FacingItem, FunctionItem } from '../advanced-types'

const board = (
  id: string,
  start: readonly [number, number],
  goal: readonly [number, number],
  walls: readonly (readonly [number, number])[] = [],
): Board => ({
  id,
  rows: Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, col) =>
    row === start[0] && col === start[1] ? 'S' : row === goal[0] && col === goal[1] ? 'G'
      : walls.some(([wallRow, wallCol]) => row === wallRow && col === wallCol) ? '#' : '.',
  ).join('')),
})

const straight = (
  id: string,
  start: readonly [number, number],
  goal: readonly [number, number],
  facing: FacingItem['facing'],
  turn?: Action,
  walls?: readonly (readonly [number, number])[],
): FacingItem => ({
  id,
  board: board(id, start, goal, walls),
  facing,
  solution: [...(turn ? [turn] : []), ...Array.from({ length: Math.abs(goal[0] - start[0]) + Math.abs(goal[1] - start[1]) }, () => 'forward' as const)],
})

export const FACING_BOARDS: readonly FacingItem[] = [
  { ...straight('facing01', [1, 0], [1, 3], 'up', 'right'), solution: ['right', 'forward', 'forward', 'forward'] },
  { ...straight('facing02', [3, 2], [0, 2], 'right', 'left', [[0, 0], [2, 0]]), solution: ['left', 'forward', 'forward', 'forward'] },
  { ...straight('facing03', [2, 3], [2, 0], 'down', 'right', [[0, 0]]), solution: ['right', 'forward', 'forward', 'forward'] },
  { ...straight('facing04', [0, 1], [3, 1], 'left', 'left'), solution: ['left', 'forward', 'forward', 'forward'] },
  { ...straight('facing05', [3, 3], [0, 3], 'right', 'left', [[0, 0], [1, 1], [2, 0]]), solution: ['left', 'forward', 'forward', 'forward'] },
  straight('facing06', [0, 0], [0, 3], 'right'),
  straight('facing07', [3, 0], [0, 0], 'up'),
  straight('facing08', [0, 3], [3, 3], 'down'),
  { ...straight('facing09', [2, 0], [2, 3], 'left'), solution: ['right', 'right', 'forward', 'forward', 'forward'] },
  { ...straight('facing10', [3, 2], [0, 2], 'down', undefined, [[0, 0], [1, 0], [2, 0]]), solution: ['right', 'right', 'forward', 'forward', 'forward'] },
  { ...straight('facing11', [1, 3], [1, 0], 'right', undefined, [[0, 0], [2, 2]]), solution: ['left', 'left', 'forward', 'forward', 'forward'] },
  straight('facing12', [3, 1], [1, 1], 'up'),
]

const functionBoard = (id: string, start: readonly [number, number], goal: readonly [number, number], facing: FacingItem['facing']): FunctionItem => ({
  id,
  board: {
    id,
    rows: Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (_, col) =>
      row === start[0] && col === start[1] ? 'S' : row === goal[0] && col === goal[1] ? 'G' : '.',
    ).join('')),
  },
  facing,
  block: ['forward', 'forward'],
  solution: ['call', 'call'],
})

export const FUNCTION_BOARDS: readonly FunctionItem[] = [
  functionBoard('function1', [4, 0], [0, 0], 'up'),
  functionBoard('function2', [0, 4], [4, 4], 'down'),
  functionBoard('function3', [0, 0], [0, 4], 'right'),
  functionBoard('function4', [4, 4], [4, 0], 'left'),
  functionBoard('function5', [4, 1], [0, 1], 'up'),
  functionBoard('function6', [0, 3], [4, 3], 'down'),
  functionBoard('function7', [1, 0], [1, 4], 'right'),
  functionBoard('function8', [3, 4], [3, 0], 'left'),
  functionBoard('function9', [4, 2], [0, 2], 'up'),
  functionBoard('function10', [0, 1], [4, 1], 'down'),
  functionBoard('function11', [2, 0], [2, 4], 'right'),
  functionBoard('function12', [2, 4], [2, 0], 'left'),
]
