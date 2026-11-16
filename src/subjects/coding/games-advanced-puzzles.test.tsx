import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { BalanceQ, BinaryQ, ConditionQ, CounterQ, EventQ, SearchQ } from './advanced-types'
import { advancedPhrases } from './advanced-phrases'
import {
  BalanceGame, BinaryGame, ConditionGame, CounterGame, EventGame, SearchGame,
} from './games-advanced-puzzles'

const audioMock = vi.hoisted(() => ({
  phrases: {} as Record<string, string>,
  say: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../core/audio/audio', () => ({
  phrases: audioMock.phrases,
  say: audioMock.say,
}))

beforeAll(() => {
  Object.assign(audioMock.phrases, advancedPhrases, {
    'code.ui.add': 'הוֹסִיפוּ קְלָפִים',
    'code.up': 'לְמַעְלָה',
    'code.down': 'לְמַטָּה',
    'code.left': 'שְׂמֹאלָה',
    'code.right': 'יָמִינָה',
  })
})
afterEach(cleanup)

const eventQuestion: EventQ = {
  itemKey: 'event:test', answer: 'wave', say: 'code.q.event', instruction: 'code.q.event',
  scenario: {
    id: 'test',
    events: [
      { label: 'code.word.bell', action: { id: 'wave', label: 'code.word.wave', icon: '👋' } },
      { label: 'code.word.button', action: { id: 'jump', label: 'code.word.jump', icon: '🦘' } },
    ],
    trigger: 0,
    distractors: [{ id: 'clap', label: 'code.word.clap', icon: '👏' }],
  },
}
const conditionQuestion: ConditionQ = {
  itemKey: 'condition:test', answer: null, say: 'code.q.condition', instruction: 'code.q.condition',
  scenario: {
    id: 'test', condition: 'code.word.rain', states: ['code.word.rainy', 'code.word.sunny'], trueState: 0,
    actions: [
      { id: 'umbrella', label: 'code.word.umbrella', icon: '☂️' },
      { id: 'hat', label: 'code.word.hat', icon: '👒' },
    ],
  },
}
const counterQuestion: CounterQ = {
  itemKey: 'variable:test', answer: 3, say: 'code.q.counter', instruction: 'code.q.counter',
  scenario: { id: 'test', start: 2, changes: [1, 1, -1] },
  options: [2, 3, 4],
}
const binaryQuestion: BinaryQ = {
  itemKey: 'binary:0', answer: null, say: 'code.q.binary', instruction: 'code.q.binary', target: 0,
}
const balanceQuestion: BalanceQ = {
  itemKey: 'sort:test', answer: null, say: 'code.q.balance', instruction: 'code.q.balance',
  scenario: {
    id: 'test',
    items: [
      { id: 'c', label: 'code.item.green', icon: '🍐', weight: 3 },
      { id: 'b', label: 'code.item.blue', icon: '🫐', weight: 2 },
      { id: 'a', label: 'code.item.red', icon: '🍎', weight: 1 },
    ],
  },
}
const searchQuestion: SearchQ = {
  itemKey: 'search:test', answer: 1, say: 'code.q.search', instruction: 'code.q.search',
  scenario: { id: 'test', values: [1, 2, 3, 4, 5, 6, 7], target: 2, revealed: [3] },
}

describe('Stage 8b puzzle games', () => {
  it('marks a wrong event action without ending the question, then accepts the triggered action', () => {
    const onAttempt = vi.fn()
    const { container } = render(<EventGame question={eventQuestion} aid={false} onAttempt={onAttempt} />)
    const actions = container.querySelectorAll('.av-choice')
    fireEvent.click(actions[1]!)
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(actions[1]).toBeDisabled()
    fireEvent.click(actions[0]!)
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
    expect(screen.getByRole('status')).toHaveTextContent(advancedPhrases['code.fb.advanced.goal']!)
  })

  it('tests both condition inputs for free and submits the completed branches once', () => {
    const onAttempt = vi.fn()
    const { container } = render(<ConditionGame question={conditionQuestion} aid={false} onAttempt={onAttempt} />)
    const branches = container.querySelectorAll('.av-branch')
    fireEvent.click(branches[0]!.querySelectorAll('.av-choice')[0]!)
    fireEvent.click(branches[1]!.querySelectorAll('.av-choice')[1]!)
    const tests = container.querySelectorAll('.av-stage > .av-options button')
    fireEvent.click(tests[0]!)
    fireEvent.click(tests[1]!)
    expect(onAttempt).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: advancedPhrases['code.ui.submit']! }))
    expect(onAttempt.mock.calls).toEqual([[true]])
  })

  it('keeps the counter trace hidden until the answer is correct and retains a wrong choice', () => {
    const onAttempt = vi.fn()
    const { container } = render(<CounterGame question={counterQuestion} aid={false} onAttempt={onAttempt} />)
    expect(container.querySelector('.av-trace')).toBeNull()
    const options = container.querySelectorAll('.av-options button')
    fireEvent.click(options[0]!)
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(options[0]).toBeDisabled()
    fireEvent.click(Array.from(options).find(option => option.textContent === '3')!)
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
    expect(container.querySelector('.av-trace')).toHaveTextContent('2 → 3 → 4 → 3')
  })

  it('represents zero with all binary lights off and scores only on submit', () => {
    const onAttempt = vi.fn()
    const { container } = render(<BinaryGame question={binaryQuestion} aid={false} onAttempt={onAttempt} />)
    expect(container.querySelectorAll('.av-bit[aria-pressed="false"]')).toHaveLength(4)
    expect(onAttempt).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: advancedPhrases['code.ui.submit']! }))
    expect(onAttempt.mock.calls).toEqual([[true]])
  })

  it('keeps balance comparisons unscored, blocks an underdetermined submit and accepts a proven order', () => {
    const onAttempt = vi.fn()
    const { container } = render(<BalanceGame question={balanceQuestion} aid={false} onAttempt={onAttempt} />)
    const objectButtons = () => Array.from(container.querySelector('.av-stage > .av-options')!.querySelectorAll('button'))
    const compareButton = container.querySelector('.av-button')!
    const choosePair = (a: string, b: string) => {
      fireEvent.click(objectButtons().find(button => button.textContent?.includes(a))!)
      fireEvent.click(objectButtons().find(button => button.textContent?.includes(b))!)
      fireEvent.click(compareButton)
    }
    const submit = screen.getByRole('button', { name: advancedPhrases['code.ui.submit']! })
    expect(submit).toBeDisabled()
    choosePair('אָדֹם', 'כָּחֹל')
    expect(onAttempt).not.toHaveBeenCalled()
    expect(submit).toBeDisabled()
    choosePair('כָּחֹל', 'יָרֹק')
    expect(submit).toBeEnabled()

    const moveUp = (label: string) => {
      const row = Array.from(container.querySelectorAll('.av-order-item')).find(item => item.textContent?.includes(label))!
      fireEvent.click(row.querySelector('button')!)
    }
    moveUp('אָדֹם')
    moveUp('אָדֹם')
    moveUp('כָּחֹל')
    fireEvent.click(submit)
    expect(onAttempt.mock.calls).toEqual([[true]])
  })

  it('does not expose hidden search values and allows retry after a wrong midpoint', () => {
    const onAttempt = vi.fn()
    const { container } = render(<SearchGame question={searchQuestion} aid={false} onAttempt={onAttempt} />)
    const boxes = container.querySelectorAll('.av-box')
    expect(Array.from(boxes).map(box => box.querySelector('strong')?.textContent)).toEqual(['?', '?', '?', '4', '?', '?', '?'])
    fireEvent.click(boxes[0]!)
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(boxes[0]).toBeDisabled()
    fireEvent.click(boxes[1]!)
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
  })
})
