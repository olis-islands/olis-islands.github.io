import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { say } from '../core/audio/audio'
import { OliHelp } from './OliHelp'

vi.mock('../core/audio/audio', () => ({ phrases: {}, say: vi.fn(() => Promise.resolve()) }))
afterEach(() => { cleanup(); vi.clearAllMocks() })

it('opens one menu, keeps FAQ text silent, replays the instruction, and returns focus on close', async () => {
  const user = userEvent.setup()
  render(<OliHelp instruction={['clock.q.set', 'clock.h.3']} entries={[{ question: 'How?', answer: 'Drag the hand.' }]} mood="idle" />)
  const owl = screen.getByRole('button', { name: /עֶזְרָה/ })
  expect(owl).toHaveAccessibleName('צְרִיכִים עֶזְרָה? לַחֲצוּ עָלַי')
  expect(owl).toHaveAttribute('aria-expanded', 'false')
  await user.click(owl)
  expect(owl).toHaveAttribute('aria-expanded', 'true')
  const replay = screen.getByRole('button', { name: /שִׁמְעוּ שׁוּב/ })
  const close = screen.getByRole('button', { name: 'סְגִירָה' })
  expect(close).toHaveTextContent('×')
  expect(close.parentElement).toBe(replay.parentElement)
  await user.click(screen.getByText('How?'))
  expect(screen.getByText('Drag the hand.')).toBeVisible()
  expect(say).not.toHaveBeenCalled()
  await user.click(replay)
  expect(say).toHaveBeenCalledWith(['clock.q.set', 'clock.h.3'])
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('region')).not.toBeInTheDocument()
  expect(owl).toHaveFocus()
})
