import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { STAGES } from './content/detective'
import { LABELS } from './content/labels'
import { DetectiveGame } from './games-detective'
import { phrases } from './phrases'
import type { DetectiveQ } from './types'

vi.mock('../../core/audio/audio', async () => ({ phrases: (await import('./phrases')).phrases, say: vi.fn(() => Promise.resolve()) }))
afterEach(() => { cleanup(); vi.clearAllMocks() })

const question: DetectiveQ = {
  itemKey: 'networks.diagnose:gate:0', answer: 'gate', say: 'networks.q.detective', instruction: 'networks.q.detective', hint: 'networks.hint.detective',
  evidence: { lookup: 'networks.evidence.lookup.ok.0', route: 'networks.evidence.route.ok.1', gate: 'networks.evidence.gate.fail.0', library: 'networks.evidence.library.ok.0' },
}
const stageName = (id: string) => phrases[`networks.stage.${id}`]!
const checkButton = (id: string) => screen.getByRole('button', { name: `${LABELS.check} ${stageName(id)}` })
const answerButton = (id: string) => screen.getByRole('button', { name: stageName(id) })

it('answers are disabled and unscored until all four checks; then a miss counts once and the right stage once', async () => {
  const user = userEvent.setup()
  const onAttempt = vi.fn()
  render(<DetectiveGame question={question} aid={false} onAttempt={onAttempt} />)
  for (const s of STAGES) expect(answerButton(s.id)).toBeDisabled()
  expect(screen.getByText(LABELS.checkFirst)).toBeInTheDocument()
  for (const s of STAGES.slice(0, 3)) {
    checkButton(s.id).focus()
    await user.keyboard('{Enter}')
  }
  expect(answerButton('gate')).toBeDisabled()
  await user.click(answerButton('gate'))
  expect(onAttempt).not.toHaveBeenCalled()
  await user.click(checkButton('library'))
  expect(say).toHaveBeenCalledWith('networks.evidence.library.ok.0')
  expect(screen.getByText(phrases['networks.evidence.gate.fail.0']!)).toBeInTheDocument()
  expect(screen.getByText(phrases['networks.q.detectiveAnswer']!)).toBeInTheDocument()
  await user.click(answerButton('route'))
  expect(answerButton('route')).toBeDisabled()
  await user.click(answerButton('gate'))
  await user.click(answerButton('lookup'))
  expect(onAttempt.mock.calls).toEqual([[false], [true]])
})

it('results show no ✅ or ❌, and the hint is offered once the aid is on', () => {
  const { rerender } = render(<DetectiveGame question={question} aid={false} onAttempt={vi.fn()} />)
  expect(document.body.textContent).not.toMatch(/[✅❌]/)
  expect(screen.queryByRole('button', { name: '🔊' })).toBeNull()
  rerender(<DetectiveGame question={question} aid onAttempt={vi.fn()} />)
  expect(say).toHaveBeenCalledWith('networks.hint.detective')
  expect(screen.getByRole('button', { name: '🔊' })).toHaveTextContent('💡 🔊')
})
