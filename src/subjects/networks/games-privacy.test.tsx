import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { PrivacyGame } from './games-privacy'
import type { PrivacyQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'q': 'Who?', 'after': 'Keep your password.', 'networks.ui.gotIt': 'הֵבַנְתִּי', 'a': 'A', 'b': 'B' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(() => { cleanup(); vi.clearAllMocks() })

const question = (after?: string): PrivacyQ => ({
  itemKey: 'k', answer: 'a', say: 'q', instruction: 'q', prompt: {},
  options: [{ id: 'a', kind: 'text', label: 'A' }, { id: 'b', kind: 'text', label: 'B' }], after,
})

it('with a safety line: a miss counts at once; the right answer waits for "got it", then counts once', async () => {
  const user = userEvent.setup()
  const onAttempt = vi.fn()
  render(<PrivacyGame question={question('after')} aid={false} onAttempt={onAttempt} />)
  await user.click(screen.getByRole('button', { name: 'B' }))
  expect(onAttempt.mock.calls).toEqual([[false]])
  await user.click(screen.getByRole('button', { name: 'A' }))
  expect(onAttempt.mock.calls).toEqual([[false]])
  expect(screen.getByRole('status')).toHaveTextContent('Keep your password.')
  expect(say).toHaveBeenCalledWith('after')
  const gotIt = screen.getByRole('button', { name: 'הֵבַנְתִּי' })
  expect(gotIt).toHaveFocus()
  await user.keyboard('{Enter}')
  await user.click(gotIt)
  expect(onAttempt.mock.calls).toEqual([[false], [true]])
})

it('without a safety line: the right answer counts at once and no line appears', async () => {
  const user = userEvent.setup()
  const onAttempt = vi.fn()
  render(<PrivacyGame question={question()} aid={false} onAttempt={onAttempt} />)
  await user.click(screen.getByRole('button', { name: 'A' }))
  expect(onAttempt.mock.calls).toEqual([[true]])
  expect(screen.queryByRole('button', { name: 'הֵבַנְתִּי' })).toBeNull()
})
