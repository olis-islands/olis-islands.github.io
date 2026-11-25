import type { PhraseMap, PhraseRef } from '../engine/types'
import { recordingRevision, recordings } from './recordings'

// All playback goes through this module (docs/DECISIONS.md D3).
// A recording at src/audio/he/<phraseId>.<ext> wins (shared by phrases with the same text); otherwise Web Speech reads it.

const phraseFiles = import.meta.glob(['/src/subjects/*/phrases.ts', '/src/app/phrases.ts'], {
  eager: true, import: 'phrases',
}) as Record<string, PhraseMap>

/** Phrase ID → recording URL. */
export { recordings }

// English phrases are declared separately (`englishPhrases`) and always spoken by an en-US voice (DECISIONS D17).
// Whole modules, not `import: 'englishPhrases'`: most islands don't export it, and a named glob import fails the build.
const phraseModules = import.meta.glob('/src/subjects/*/phrases.ts', { eager: true }) as Record<string, { englishPhrases?: PhraseMap }>
const english: PhraseMap = Object.assign({}, ...Object.values(phraseModules).map(m => m.englishPhrases ?? {}))

/** Every phrase declared in the app, by ID (Hebrew and English). */
export const phrases: PhraseMap = Object.assign({}, ...Object.values(phraseFiles), english)

/** Phrases spoken in English. They are never recorded (the browser voice is used), so the studio leaves them out. */
export const englishIds: ReadonlySet<string> = new Set(Object.keys(english))

/**
 * Hebrew phrases with the same text share one recording, so a word used by several islands ("בֵּיצָה") is recorded once.
 * Each phrase maps to its text's recorded ID: the first recorded ID in sort order, else the first ID.
 */
export function sharedRecordingIds(map: PhraseMap, recorded: ReadonlySet<string>, english: ReadonlySet<string>): ReadonlyMap<string, string> {
  const owner = new Map<string, string>()
  for (const id of Object.keys(map).sort()) {
    if (english.has(id)) continue
    const cur = owner.get(map[id]!)
    if (cur === undefined || (!recorded.has(cur) && recorded.has(id))) owner.set(map[id]!, id)
  }
  return new Map(Object.keys(map).map(id => [id, english.has(id) ? id : owner.get(map[id]!)!]))
}

let shared = sharedRecordingIds(phrases, new Set(recordings.keys()), englishIds)
let sharedRevision = recordingRevision()

/** The phrase ID whose recording plays for `id` (itself, or the phrase with the same text that owns the recording). */
export const recordingId = (id: string) => {
  const revision = recordingRevision()
  if (revision !== sharedRevision) {
    shared = sharedRecordingIds(phrases, new Set(recordings.keys()), englishIds)
    sharedRevision = revision
  }
  return shared.get(id) ?? id
}

const recordingOf = (id: string) => recordings.get(recordingId(id))

type Lang = 'he-IL' | 'en-US'
const langOf = (id: string): Lang => (englishIds.has(id) || id.startsWith('raw-en:') ? 'en-US' : 'he-IL')

/** Text-only English phrase for runtime content that has no ID (e.g. a word built from tiles). */
export const rawEn = (text: string) => `raw-en:${text}`

/** Text-only phrase for runtime content that has no ID (e.g. a child's name). */
export const raw = (text: string) => `raw:${text}`

const textOf = (id: string) => (id.startsWith('raw:') ? id.slice(4) : id.startsWith('raw-en:') ? id.slice(7) : (phrases[id] ?? id))

let token = 0

// One <audio> element for every recording that does not go through Web Audio. iOS lets an element play outside a tap
// only after a tap has started it once, so the unlock tap primes this element and it is reused, never replaced.
let mediaEl: HTMLAudioElement | null = null
const media = () => (mediaEl ??= new Audio())
/** Settles the playback in progress on the shared element, so a stopped `say` does not hang its caller. */
let endMedia: (() => void) | null = null

export function stop() {
  token++
  mediaEl?.pause()
  endMedia?.()
  endMedia = null
  try { source?.stop() } catch { /* already ended */ }
  source = null
  try { speechSynthesis.cancel() } catch { /* no speech support */ }
}

function voiceFor(lang: Lang): SpeechSynthesisVoice | undefined {
  const prefix = lang.slice(0, 2)
  try { return speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(prefix)) } catch { return undefined }
}
const hebrewVoice = () => voiceFor('he-IL')

export const hasHebrewVoice = () => !!hebrewVoice()

function speakText(text: string, lang: Lang = 'he-IL'): Promise<void> {
  return new Promise(resolve => {
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      // English for learners is read a little slower than Hebrew instructions.
      u.rate = lang === 'en-US' ? 0.8 : 0.9
      const voice = voiceFor(lang)
      if (voice) u.voice = voice
      u.onend = u.onerror = () => resolve()
      speechSynthesis.speak(u)
    } catch { resolve() }
  })
}

/** Plays a file on the shared element. Resolves true when it played to the end, false when it could not play. */
function playUrl(url: string, rate = 1, onTime?: (a: HTMLAudioElement) => void): Promise<boolean> {
  return new Promise(resolve => {
    let timer: ReturnType<typeof setInterval> | undefined
    const done = (played: boolean) => {
      clearInterval(timer)
      if (endMedia === finish) endMedia = null
      resolve(played)
    }
    const finish = () => done(true)
    endMedia = finish
    try {
      const a = media()
      a.onended = finish
      a.onerror = () => done(false)
      a.src = url
      a.playbackRate = rate
      if (onTime) timer = setInterval(() => onTime(a), TICK_MS)
      Promise.resolve(a.play()).catch(() => done(false))
    } catch { done(false) }
  })
}

/* ---------- recordings played through Web Audio, without the silence the studio captured ---------- */

let ctx: AudioContext | null = null
const audioCtx = () => (ctx ??= (playThroughSilentSwitch(), new AudioContext()))

/**
 * iOS (Safari, and Chrome, which is WebKit there) treats web sound as "ambient" by default and mutes it while the phone
 * is on silent. "playback" makes it play like a video does. Needs no tap; other browsers have no Audio Session API.
 */
function playThroughSilentSwitch() {
  try {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session && session.type !== 'playback') session.type = 'playback'
  } catch { /* no Audio Session API */ }
}

/* ---------- autoplay unlock: phones and tablets stay silent until the first tap ---------- */

/** True while the browser still blocks sound (no tap yet, or the system suspended audio again in the background). */
export function audioLocked(): boolean {
  try { return audioCtx().state !== 'running' } catch { return false }
}

/** Calls `cb` whenever the audio engine starts or stops running. Returns an unsubscribe function. */
export function onAudioLockChange(cb: () => void): () => void {
  try {
    const c = audioCtx()
    c.addEventListener('statechange', cb)
    return () => c.removeEventListener('statechange', cb)
  } catch { return () => {} }
}

/** The last instruction asked for while sound was blocked: said after the child's first tap, so it is not lost. */
let deferred: PhraseRef | null = null

/** 12 ms of silence: playing it inside the tap unlocks the shared <audio> element on iOS. */
const SILENCE = 'data:audio/wav;base64,UklGRogAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWQAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA'

/**
 * Every call that a phone allows only during a tap, issued synchronously: iOS (Safari and Chrome, both WebKit) forgets
 * the tap at the first `await`, so nothing here waits for anything.
 */
function primeInTap() {
  playThroughSilentSwitch()
  try {
    const c = audioCtx()
    void c.resume().catch(() => {})
    const s = c.createBufferSource()
    s.buffer = c.createBuffer(1, 1, 22050)
    s.connect(c.destination)
    s.start(0)
  } catch { /* audio unavailable */ }
  try {
    const a = media()
    if (!a.src || a.paused) {
      a.onended = a.onerror = null
      a.src = SILENCE
      Promise.resolve(a.play()).catch(() => {})
    }
  } catch { /* no media element */ }
  try {
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    speechSynthesis.speak(u)
  } catch { /* no speech support */ }
}

/**
 * Must run inside a tap or click. Unlocks sound, then says what was waiting — or, when nothing was, `greeting`, so the
 * child who tapped "hear Oli" always hears Oli.
 */
export function unlockAudio(greeting?: PhraseRef): void {
  const next = deferred ?? greeting
  deferred = null
  if (next) void speak(next, true)
  else primeInTap()
}

const BLOCK_S = 0.01
/** Blocks in a row that must be loud: a single click of the record button is not speech. */
const SUSTAIN = 3

/**
 * Start and end (seconds) of the audible part. A take runs from pressing record to pressing stop, so it opens and
 * closes with silence — joined parts ("חָמֵשׁ" + "וָחֵצִי") would have a pause between them.
 */
export function audibleRange(samples: Float32Array, rate: number, pad = 0.05): [number, number] {
  const block = Math.max(1, Math.round(rate * BLOCK_S))
  const rms: number[] = []
  for (let i = 0; i < samples.length; i += block) {
    const end = Math.min(samples.length, i + block)
    let sum = 0
    for (let j = i; j < end; j++) sum += samples[j]! ** 2
    rms.push(Math.sqrt(sum / (end - i)))
  }
  const duration = samples.length / rate
  const floor = rms.reduce((m, v) => Math.max(m, v), 0) * 0.1
  const loud = (i: number) => rms.slice(i, i + SUSTAIN).every(v => v > floor) && i + SUSTAIN <= rms.length
  let first = 0
  while (first < rms.length && !loud(first)) first++
  if (floor === 0 || first === rms.length) return [0, duration]
  let last = rms.length - SUSTAIN
  while (last > first && !loud(last)) last--
  const blockS = block / rate
  return [Math.max(0, first * blockS - pad), Math.min(duration, (last + SUSTAIN) * blockS + pad)]
}

interface Clip { buffer: AudioBuffer; from: number; to: number }
const clips = new Map<string, Promise<Clip | null>>()

/** Decoded once per URL; null when this browser can't decode it (then the shared <audio> element plays it). */
function loadClip(url: string): Promise<Clip | null> {
  let clip = clips.get(url)
  if (!clip) {
    clip = fetch(url).then(r => r.arrayBuffer()).then(data => audioCtx().decodeAudioData(data)).then(buffer => {
      const [from, to] = audibleRange(buffer.getChannelData(0), buffer.sampleRate)
      return { buffer, from, to }
    }).catch(() => null)
    clips.set(url, clip)
  }
  return clip
}

let source: AudioBufferSourceNode | null = null
const RESUME_WAIT_MS = 300

/** Web Audio when it can decode and run; else the <audio> element; else the browser voice reads the phrase's text. */
async function playRecording(url: string, id: string): Promise<void> {
  const clip = await loadClip(url)
  const c = clip && audioCtx()
  // Bounded: iOS can leave an "interrupted" context's resume() pending for good, and the phrase must not hang on it.
  if (c && c.state !== 'running') await Promise.race([c.resume().catch(() => {}), new Promise(r => setTimeout(r, RESUME_WAIT_MS))])
  if (!clip || !c || c.state !== 'running') {
    const mine = token
    if (!(await playUrl(url)) && mine === token) await speakText(textOf(id), langOf(id))
    return
  }
  return new Promise(resolve => {
    const s = c.createBufferSource()
    s.buffer = clip.buffer
    s.connect(c.destination)
    s.onended = () => resolve()
    source = s
    s.start(0, clip.from, clip.to - clip.from)
  })
}

/** Speak a phrase or a sequence. Interrupts anything already playing. */
export function say(ref: PhraseRef): Promise<void> {
  // A browser without the User Activation API (iOS before 16.4) counts as "not in a tap": the call cannot unlock it.
  return speak(ref, globalThis.navigator?.userActivation?.isActive ?? false)
}

async function speak(ref: PhraseRef, inTap: boolean): Promise<void> {
  const locked = audioLocked()
  // Blocked and not inside a tap (e.g. an automatic instruction after a reload): keep it for the unlock tap.
  if (locked && !inTap) { deferred = ref; return }
  deferred = null
  stop()
  // After stop(), whose speech cancel would otherwise cut the priming utterance.
  if (locked) primeInTap()
  const mine = token
  const ids = typeof ref === 'string' ? [ref] : ref
  // Decode every recorded part up front, so parts follow each other without a loading gap.
  for (const id of ids) { const url = recordingOf(id); if (url) void loadClip(url) }
  // Consecutive unrecorded parts in the same language are read as one utterance so TTS keeps natural intonation.
  let pending: string[] = []
  let pendingLang: Lang = 'he-IL'
  const flush = async () => {
    if (pending.length) await speakText(pending.join(' '), pendingLang)
    pending = []
  }
  for (const id of ids) {
    if (mine !== token) return
    const url = recordingOf(id)
    if (url) {
      await flush()
      if (mine !== token) return
      await playRecording(url, id)
    } else {
      const lang = langOf(id)
      if (lang !== pendingLang) { await flush(); if (mine !== token) return; pendingLang = lang }
      pending.push(textOf(id))
    }
  }
  if (mine === token) await flush()
}

/* ---------- narration with word highlighting (read-along books) ---------- */

const NIKUD = /[֑-ׇ]/g
const TTS_MS_PER_LETTER = 90
const TICK_MS = 50

/** Fraction of the phrase at which each word starts, weighted by letter count (nikud ignored). */
export function wordStarts(text: string): number[] {
  const weights = text.split(/\s+/).filter(Boolean).map(w => w.replace(NIKUD, '').length + 1)
  const total = weights.reduce((a, b) => a + b, 0)
  let acc = 0
  return weights.map(w => { const start = acc / total; acc += w; return start })
}

/** Index of the word being spoken at `fraction` (0–1) of the phrase. */
export const wordAt = (starts: readonly number[], fraction: number) =>
  Math.max(0, starts.findLastIndex(s => s <= fraction))

/** Character offset → word index, for Web Speech boundary events. */
export function wordAtChar(text: string, charIndex: number): number {
  const wordStartChars = [...text.matchAll(/\S+/g)].map(m => m.index)
  return Math.max(0, wordStartChars.findLastIndex(start => start <= charIndex))
}

/**
 * Read a phrase aloud and report which word is being spoken. With a recording, word times are estimated in
 * proportion to word length; with TTS, boundary events are used when the voice sends them.
 * `rate` < 1 reads slower. Interrupted by `stop()` or any other playback.
 */
export async function narrate(id: string, onWord: (index: number) => void, rate = 1): Promise<void> {
  stop()
  const mine = token
  const text = textOf(id)
  const starts = wordStarts(text)
  let last = -1
  const report = (i: number) => {
    if (mine === token && i !== last) onWord((last = i))
  }
  report(0)
  const url = recordingOf(id)
  if (url) {
    await playUrl(url, rate, a => { if (a.duration) report(wordAt(starts, a.currentTime / a.duration)) })
  } else {
    await new Promise<void>(resolve => {
      try {
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'he-IL'
        u.rate = 0.9 * rate
        const voice = hebrewVoice()
        if (voice) u.voice = voice
        // Estimate by time until the voice proves it sends word boundaries.
        let boundaries = false
        const t0 = Date.now()
        const estimate = (TTS_MS_PER_LETTER * text.replace(NIKUD, '').length) / rate
        const timer = setInterval(() => { if (!boundaries) report(wordAt(starts, Math.min(1, (Date.now() - t0) / estimate))) }, TICK_MS)
        u.onboundary = e => { if (e.name === 'word') { boundaries = true; report(wordAtChar(text, e.charIndex)) } }
        u.onend = u.onerror = () => { clearInterval(timer); resolve() }
        speechSynthesis.speak(u)
      } catch { resolve() }
    })
  }
  report(starts.length - 1)
}

/* ---------- sound effects (synthesized, ported from the prototype) ---------- */

function tone(freq: number, duration = 0.15, delay = 0) {
  try {
    const ctx = audioCtx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = freq
    g.gain.value = 0.12
    o.connect(g)
    g.connect(ctx.destination)
    const start = ctx.currentTime + delay
    o.start(start)
    o.stop(start + duration)
  } catch { /* audio unavailable */ }
}

export const sfx = {
  good: () => { tone(660); tone(880, 0.2, 0.12) },
  oops: () => tone(220, 0.25),
  tick: () => tone(1200, 0.03),
  win: () => { tone(660); tone(880, 0.2, 0.12); tone(1040, 0.25, 0.3) },
}
