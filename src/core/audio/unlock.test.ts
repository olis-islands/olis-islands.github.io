import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

interface Log { spoken: string[]; calls: string[]; media: FakeAudio[] }
interface FakeAudio { src: string; plays: string[] }

/**
 * A phone that blocks sound until the first tap: AudioContext stays suspended, no user activation yet.
 * `calls` records every unlock-relevant call in order, so tests can check what happened before the first `await`.
 */
function blockedBrowser(opts: { resumeHangs?: boolean; decodes?: boolean; mediaPlays?: boolean } = {}): Log {
  const log: Log = { spoken: [], calls: [], media: [] }
  class Ctx extends EventTarget {
    state = 'suspended'
    destination = {}
    currentTime = 0
    resume() {
      log.calls.push('resume')
      if (opts.resumeHangs) return new Promise<void>(() => {})
      this.state = 'running'
      this.dispatchEvent(new Event('statechange'))
      return Promise.resolve()
    }
    createBuffer() { return { getChannelData: () => new Float32Array(100) } }
    createBufferSource() {
      return { connect() {}, stop() {}, buffer: null as unknown, onended: null as (() => void) | null,
        start(this: { onended: (() => void) | null }) { log.calls.push('buffer'); setTimeout(() => this.onended?.(), 0) } }
    }
    decodeAudioData() {
      return opts.decodes ? Promise.resolve({ getChannelData: () => new Float32Array(100), sampleRate: 100, duration: 1 }) : Promise.reject(new Error('EncodingError'))
    }
  }
  class Audio implements FakeAudio {
    src = ''
    paused = true
    plays: string[] = []
    playbackRate = 1
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    constructor() { log.media.push(this) }
    play() {
      log.calls.push('media')
      this.plays.push(this.src)
      if (opts.mediaPlays === false && !this.src.startsWith('data:')) return Promise.reject(new Error('NotSupportedError'))
      this.paused = false
      setTimeout(() => { this.paused = true; this.onended?.() }, 0)
      return Promise.resolve()
    }
    pause() { this.paused = true }
  }
  vi.stubGlobal('AudioContext', Ctx)
  vi.stubGlobal('Audio', Audio)
  vi.stubGlobal('fetch', () => Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }))
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} volume = 1; lang = ''; rate = 1 })
  vi.stubGlobal('speechSynthesis', {
    speak: (u: { text: string; onend?: () => void }) => { log.calls.push('speak'); log.spoken.push(u.text); u.onend?.() },
    cancel() {}, getVoices: () => [],
  })
  vi.stubGlobal('navigator', { userActivation: { isActive: false, hasBeenActive: false }, audioSession: { type: 'auto' } })
  return log
}

const inTap = () => vi.stubGlobal('navigator', { ...navigator, userActivation: { isActive: true, hasBeenActive: true } })

describe('autoplay unlock', () => {
  // The first import transforms every island's phrases; on a cold cache that alone can pass the default test timeout.
  beforeAll(async () => { await import('./audio') }, 60_000)
  beforeEach(() => { vi.resetModules() })
  afterEach(() => { vi.unstubAllGlobals() })

  it('keeps an automatic instruction until the first tap, then says it', async () => {
    const log = blockedBrowser()
    const audio = await import('./audio')
    expect(audio.audioLocked()).toBe(true)
    await audio.say(audio.raw('שלום'))
    expect(log.spoken.filter(t => t.trim())).toEqual([]) // blocked: nothing is said, and nothing is lost
    inTap()
    audio.unlockAudio('app.hello')
    expect(audio.audioLocked()).toBe(false)
    await vi.waitFor(() => expect(log.spoken).toContain('שלום'))
    expect(log.spoken.some(t => t.includes('אוֹלִי'))).toBe(false) // the waiting instruction wins over the greeting
  })

  it('issues every unlock call synchronously inside the tap, before any await (iOS forgets the tap at the first await)', async () => {
    const log = blockedBrowser()
    const audio = await import('./audio')
    inTap()
    audio.unlockAudio()
    expect(log.calls).toEqual(expect.arrayContaining(['resume', 'buffer', 'media', 'speak']))
    expect(log.media).toHaveLength(1)
    expect(log.media[0]!.plays[0]).toMatch(/^data:audio\/wav/)
    expect((navigator as Navigator & { audioSession: { type: string } }).audioSession.type).toBe('playback') // iOS silent switch
  })

  it('says the greeting when nothing was waiting, so the tap on "hear Oli" is always answered', async () => {
    const log = blockedBrowser({ mediaPlays: false })
    const audio = await import('./audio')
    inTap()
    audio.unlockAudio('app.hello')
    await vi.waitFor(() => expect(log.spoken).toContain(audio.phrases['app.hello']))
  })

  it('reads the text with the browser voice when a recording can be neither decoded nor played', async () => {
    const log = blockedBrowser({ decodes: false, mediaPlays: false })
    const audio = await import('./audio')
    inTap()
    await audio.say('app.who')
    expect(log.media[0]!.plays.some(src => src.includes('app.who'))).toBe(true) // tried the <audio> path first
    expect(log.spoken).toContain(audio.phrases['app.who'])
  })

  it('plays an undecodable recording on the primed <audio> element, without the browser voice', async () => {
    const log = blockedBrowser({ decodes: false })
    const audio = await import('./audio')
    inTap()
    await audio.say('app.who')
    expect(log.media).toHaveLength(1) // one element, reused: iOS unlocks elements one by one
    expect(log.media[0]!.plays.at(-1)).toContain('app.who')
    expect(log.spoken).not.toContain(audio.phrases['app.who'])
  })

  it('does not hang when the audio engine never resumes (iOS "interrupted")', async () => {
    const log = blockedBrowser({ resumeHangs: true, decodes: true })
    const audio = await import('./audio')
    inTap()
    await audio.say('app.who')
    expect(log.media[0]!.plays.at(-1)).toContain('app.who')
  })

  it('treats a browser without the User Activation API as not in a tap, so the instruction waits for the gate', async () => {
    const log = blockedBrowser()
    vi.stubGlobal('navigator', {})
    const audio = await import('./audio')
    await audio.say(audio.raw('שלום'))
    expect(log.spoken).toEqual([])
    audio.unlockAudio()
    await vi.waitFor(() => expect(log.spoken).toContain('שלום'))
  })

  it('reports no lock when Web Audio is missing', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const audio = await import('./audio')
    expect(audio.audioLocked()).toBe(false)
  })
})
