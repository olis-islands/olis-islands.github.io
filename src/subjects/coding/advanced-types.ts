import type { PhraseRef, Question } from '../../core/engine/types'
import type { Board, Cell, Dir } from './types'

// Stage 8b contract. The original Stage 8a board, direction and simulator types remain unchanged.
export type Facing = Dir
export type Action = 'forward' | 'left' | 'right'
export type AdvancedCard = Action | 'call'
export type AdvancedProgram = readonly AdvancedCard[]
export type Block = readonly Action[]

export interface AdvancedBoard {
  board: Board
  facing: Facing
}

export interface FacingItem extends AdvancedBoard {
  id: string
  solution: readonly Action[]
}

export interface FunctionItem extends AdvancedBoard {
  id: string
  solution: AdvancedProgram
  block: Block
}

/** Source location and resulting state after one primitive command; the first state has no source. */
export interface AdvancedState {
  cell: Cell
  facing: Facing
  card?: number
  blockStep?: number
}

export type AdvancedRun =
  | { kind: 'invalid'; reason: 'board' | 'program' | 'block' | 'limit' }
  | { kind: 'blocked' | 'complete'; trace: readonly AdvancedState[]; reachedGoal: boolean; stoppedAt?: number }

export interface NamedAction {
  id: string
  label: PhraseRef
  icon: string
}

export interface EventScenario {
  id: string
  events: readonly { label: PhraseRef; action: NamedAction }[]
  trigger: number
  distractors: readonly NamedAction[]
}

export interface ConditionScenario {
  id: string
  condition: PhraseRef
  states: readonly [PhraseRef, PhraseRef]
  trueState: 0 | 1
  actions: readonly [NamedAction, NamedAction]
}

export interface CounterScenario {
  id: string
  start: number
  changes: readonly (1 | -1)[]
}

export interface BalanceItem {
  id: string
  label: PhraseRef
  icon: string
  weight: number
}

export interface BalanceScenario {
  id: string
  items: readonly BalanceItem[]
}

export interface SearchScenario {
  id: string
  values: readonly number[]
  target: number
  revealed: readonly number[]
}

export interface AdvancedProgramQ extends Question<null> {
  instruction: string
  hint?: PhraseRef
  level: AdvancedBoard
  mode: 'facing' | 'function'
  block?: Block
}

export interface EventQ extends Question<string> {
  instruction: string
  hint?: PhraseRef
  scenario: EventScenario
}

export interface ConditionQ extends Question<null> {
  instruction: string
  hint?: PhraseRef
  scenario: ConditionScenario
}

export interface CounterQ extends Question<number> {
  instruction: string
  hint?: PhraseRef
  scenario: CounterScenario
  options: readonly number[]
}

export interface BinaryQ extends Question<null> {
  instruction: string
  hint?: PhraseRef
  target: number
}

export interface BalanceQ extends Question<null> {
  instruction: string
  hint?: PhraseRef
  scenario: BalanceScenario
}

export interface SearchQ extends Question<number> {
  instruction: string
  hint?: PhraseRef
  scenario: SearchScenario
}
