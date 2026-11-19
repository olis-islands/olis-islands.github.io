import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A browser that blocks sound until the first tap: AudioContext stays suspended, no user activation yet.
function blockedBrowser() {
  const spoken: string[] = []
  class Ctx extends EventTarget {
    state = 'suspended'
    destination = {}
    async resume() { this.state = 'running'; this.dispatchEvent(new Event('statechange')) }
    createBuffer() { return {} }
    createBufferSource() { return { connect() {}, start() {}, stop() {}, buffer: null } }
  }
  vi.stubGlobal('AudioContext', Ctx)
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} volume = 1 })
  vi.stubGlobal('speechSynthesis', {
    speak: (u: { text: string; onend?: () => void }) => { spoken.push(u.text); u.onend?.() },
    cancel() {}, getVoices: () => [],
  })
  vi.stubGlobal('navigator', { userActivation: { isActive: false, hasBeenActive: false } })
  return spoken
}

describe('autoplay unlock', () => {
  beforeEach(() => { vi.resetModules() })
  afterEach(() => { vi.unstubAllGlobals() })

  it('keeps an automatic instruction until the first tap, then says it', async () => {
    const spoken = blockedBrowser()
    const audio = await import('./audio')
    expect(audio.audioLocked()).toBe(true)
    await audio.say(audio.raw('שלום'))
    expect(spoken).toEqual([]) // blocked: nothing is said, and nothing is lost
    await audio.unlockAudio()
    expect(audio.audioLocked()).toBe(false)
    await vi.waitFor(() => expect(spoken.some(t => t.includes('שלום'))).toBe(true))
  })

  it('does not hold back an instruction asked for inside a tap', async () => {
    const spoken = blockedBrowser()
    vi.stubGlobal('navigator', { userActivation: { isActive: true, hasBeenActive: true } })
    const audio = await import('./audio')
    await audio.say(audio.raw('שלום'))
    expect(spoken.some(t => t.includes('שלום'))).toBe(true)
  })

  it('reports no lock when Web Audio is missing', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const audio = await import('./audio')
    expect(audio.audioLocked()).toBe(false)
  })
})
