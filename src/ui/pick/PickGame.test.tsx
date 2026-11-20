import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { PickGame } from './PickGame'
import type { PickQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'x.q': 'Pick one', 'x.circle': 'עִגּוּל', 'x.3': 'שָׁלוֹשׁ', 'x.5': 'חָמֵשׁ' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const art = (id: string, n: string): PickQ['options'][number] => ({ id, kind: 'art', art: { name: 'none' }, say: ['x.circle', n] })

it('names a drawing option said in parts by all its parts, and counts each try once', async () => {
  const onAttempt = vi.fn()
  const q: PickQ = { itemKey: 'k', answer: 'a', say: 'x.q', instruction: 'x.q', prompt: {}, options: [art('a', 'x.3'), art('b', 'x.5')] }
  render(<PickGame question={q} aid={false} onAttempt={onAttempt} />)
  const wrong = screen.getByRole('button', { name: 'עִגּוּל חָמֵשׁ' })
  await userEvent.click(wrong)
  expect(wrong).toBeDisabled()
  await userEvent.click(screen.getByRole('button', { name: 'עִגּוּל שָׁלוֹשׁ' }))
  expect(onAttempt.mock.calls).toEqual([[false], [true]])
})
