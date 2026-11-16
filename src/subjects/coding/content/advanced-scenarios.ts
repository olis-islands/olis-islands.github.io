import type { BalanceScenario, ConditionScenario, EventScenario, NamedAction, SearchScenario } from '../advanced-types'
import type { CounterScenario } from '../advanced-types'

const action = (id: string, icon: string): NamedAction => ({ id, label: `code.word.${id}`, icon })
const ACTIONS = [
  action('wave', '👋'), action('jump', '🦘'), action('clap', '👏'), action('dance', '💃'), action('turn', '🔄'),
] as const
const EVENTS = ['bell', 'button', 'whistle', 'light', 'knock'] as const

export const EVENT_SCENARIOS: readonly EventScenario[] = Array.from({ length: 12 }, (_, index) => {
  const first = index % ACTIONS.length
  const second = (first + 1) % ACTIONS.length
  const trigger = index % 2
  return {
    id: `event${index + 1}`,
    events: [
      { label: `code.word.${EVENTS[index % EVENTS.length]}`, action: ACTIONS[first]! },
      { label: `code.word.${EVENTS[(index + 1) % EVENTS.length]}`, action: ACTIONS[second]! },
    ],
    trigger,
    distractors: [ACTIONS[(second + 1) % ACTIONS.length]!],
  }
})

const CONDITIONS = [
  ['rain', 'rainy', 'sunny', 'umbrella', 'hat'],
  ['cold', 'coldState', 'warm', 'coat', 'fan'],
  ['dark', 'darkState', 'bright', 'lamp', 'sunglasses'],
  ['wind', 'windy', 'calm', 'holdHat', 'walk'],
  ['thirst', 'thirsty', 'notThirsty', 'drink', 'play'],
  ['hunger', 'hungry', 'full', 'eat', 'rest'],
] as const
const ACTION_ICONS: Readonly<Record<string, string>> = {
  umbrella: '☂️', hat: '👒', coat: '🧥', fan: '🪭', lamp: '💡', sunglasses: '🕶️',
  holdHat: '🤠', walk: '🚶', drink: '🥤', play: '⚽', eat: '🥪', rest: '🛏️',
}

export const CONDITION_SCENARIOS: readonly ConditionScenario[] = Array.from({ length: 12 }, (_, index) => {
  const [condition, trueState, falseState, trueAction, falseAction] = CONDITIONS[index % CONDITIONS.length]!
  return {
    id: `condition${index + 1}`,
    condition: `code.word.${condition}`,
    states: [`code.word.${trueState}`, `code.word.${falseState}`],
    trueState: 0,
    actions: [action(trueAction, ACTION_ICONS[trueAction]!), action(falseAction, ACTION_ICONS[falseAction]!)],
  }
})

export const COUNTER_SCENARIOS: readonly CounterScenario[] = [
  { id: 'counter1', start: 2, changes: [1, 1, -1] },
  { id: 'counter2', start: 1, changes: [1, -1, 1] },
  { id: 'counter3', start: 3, changes: [-1, 1, 1, -1] },
  { id: 'counter4', start: 0, changes: [1, 1] },
  { id: 'counter5', start: 4, changes: [-1, -1, 1] },
  { id: 'counter6', start: 2, changes: [1, -1, -1, 1] },
  { id: 'counter7', start: 5, changes: [-1, -1, -1, 1] },
  { id: 'counter8', start: 1, changes: [1, 1, 1, -1] },
  { id: 'counter9', start: 3, changes: [-1, -1, 1] },
  { id: 'counter10', start: 0, changes: [1, 1, 1, 1] },
  { id: 'counter11', start: 4, changes: [-1, 1, -1, 1] },
  { id: 'counter12', start: 2, changes: [1, 1, 1, -1] },
]

const OBJECTS = [
  ['red', '🍎'], ['blue', '🫐'], ['green', '🍐'], ['orange', '🍊'], ['purple', '🍇'],
] as const
const ORDERS = [
  [2, 0, 1], [1, 2, 0], [0, 2, 1, 3], [3, 1, 0, 2], [4, 2, 0, 3, 1], [2, 4, 1, 3, 0],
  [1, 0, 3, 2], [3, 2, 1, 0], [0, 4, 2, 1, 3], [4, 0, 3, 1, 2], [2, 1, 3, 0], [1, 4, 0, 2, 3],
] as const

export const BALANCE_SCENARIOS: readonly BalanceScenario[] = ORDERS.map((order, index) => ({
  id: `balance${index + 1}`,
  items: order.map(objectIndex => {
    const [name, icon] = OBJECTS[objectIndex]!
    return { id: `${name}${index + 1}`, label: `code.item.${name}`, icon, weight: objectIndex + 1 }
  }),
}))

const SEARCH_TARGETS = [0, 1, 2, 3, 4, 5, 6, 1, 2, 4, 5, 3] as const
export const SEARCH_SCENARIOS: readonly SearchScenario[] = SEARCH_TARGETS.map((targetIndex, index) => {
  const values = Array.from({ length: 7 }, (_, box) => (index + 1) * 10 + box * 3)
  return {
    id: `search${index + 1}`,
    values,
    target: values[targetIndex]!,
    revealed: targetIndex === 3 ? [1, 5] : [3],
  }
})
