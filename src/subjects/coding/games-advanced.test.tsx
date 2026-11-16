import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { advancedPhrases } from './advanced-phrases'
import { AdvancedProgramGame } from './games-advanced'
import type { AdvancedProgramQ } from './advanced-types'

vi.mock('../../core/audio/audio', () => ({
  phrases: {},
  say: vi.fn(() => Promise.resolve()),
  sfx: { good: vi.fn(), oops: vi.fn(), tick: vi.fn(), win: vi.fn() },
}))

const question: AdvancedProgramQ = {
  itemKey: 'facing:test',
  answer: null,
  say: 'code.q.facing',
  instruction: 'code.q.facing',
  level: { board: { id: 'test', rows: ['....', 'S..G', '....', '....'] }, facing: 'up' },
  mode: 'facing',
}
const palette = (phrase: string) => screen.getByRole('button', { name: phrase })
const advance = (ms: number) => {
  for (let time = 0; time < ms; time += 100) act(() => { vi.advanceTimersByTime(100) })
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('AdvancedProgramGame', () => {
  it('runs a relative turn and forward program to the goal', () => {
    const onAttempt = vi.fn()
    render(<AdvancedProgramGame question={question} aid={false} onAttempt={onAttempt} />)

    fireEvent.click(palette(advancedPhrases['code.ui.facing.right']!))
    fireEvent.click(palette(advancedPhrases['code.ui.facing.forward']!))
    fireEvent.click(palette(advancedPhrases['code.ui.facing.forward']!))
    fireEvent.click(palette(advancedPhrases['code.ui.facing.forward']!))
    fireEvent.click(palette(advancedPhrases['code.ui.facing.run']!))
    expect(onAttempt).not.toHaveBeenCalled()
    advance(2000)

    expect(onAttempt.mock.calls).toEqual([[true]])
    expect(screen.getByRole('status')).toHaveTextContent(advancedPhrases['code.fb.facing.goal']!)
    expect(screen.getByRole('button', { name: advancedPhrases['code.ui.facing.run']! })).toBeDisabled()
  })

  it('reports a blocked attempt and keeps the program editable', () => {
    const onAttempt = vi.fn()
    render(<AdvancedProgramGame question={{
      ...question,
      level: { ...question.level, board: { ...question.level.board, rows: ['S..G', '....', '....', '....'] } },
    }} aid={false} onAttempt={onAttempt} />)

    fireEvent.click(palette(advancedPhrases['code.ui.facing.forward']!))
    fireEvent.click(palette(advancedPhrases['code.ui.facing.run']!))
    advance(400)

    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(screen.getByRole('status')).toHaveTextContent(advancedPhrases['code.fb.facing.blocked']!)
    expect(document.querySelector('.cd-card.stop')).not.toBeNull()
    expect(screen.getAllByRole('button', { name: advancedPhrases['code.ui.facing.remove']! })
      .find(button => button.classList.contains('cd-erase'))).toBeEnabled()
    expect(screen.getByRole('button', { name: advancedPhrases['code.ui.facing.run']! })).toBeEnabled()
  })

  it('shows the final state without walking when reduced motion is enabled', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const onAttempt = vi.fn()
    const { container } = render(<AdvancedProgramGame question={question} aid={false} onAttempt={onAttempt} />)

    fireEvent.click(palette(advancedPhrases['code.ui.facing.right']!))
    for (let move = 0; move < 3; move++) fireEvent.click(palette(advancedPhrases['code.ui.facing.forward']!))
    const start = container.querySelector('.cd-board g')!.getAttribute('transform')
    fireEvent.click(palette(advancedPhrases['code.ui.facing.run']!))
    expect(container.querySelector('.cd-board g')!.getAttribute('transform')).not.toBe(start)
    advance(100)

    expect(onAttempt.mock.calls).toEqual([[true]])
    expect(screen.getByRole('status')).toHaveTextContent(advancedPhrases['code.fb.facing.goal']!)
  })
})
