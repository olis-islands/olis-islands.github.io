import { useEffect, useRef, useState } from 'react'
import { audioLocked, onAudioLockChange, sfx, unlockAudio } from '../core/audio/audio'
import './audio-gate.css'

/**
 * Full-screen "tap to hear Oli" shown while the browser blocks sound. A child who cannot read yet has no other way to
 * learn that the instructions are waiting: a big speaker and the owl, no text to read.
 */
export function AudioGate() {
  const [locked, setLocked] = useState(audioLocked)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const check = () => setLocked(audioLocked())
    const off = onAudioLockChange(check)
    // The system may suspend audio again while the app is in the background.
    document.addEventListener('visibilitychange', check)
    return () => { off(); document.removeEventListener('visibilitychange', check) }
  }, [])

  // Other screens focus their own fields on load, sometimes after the gate (the "/" to "/profiles" redirect);
  // while the gate is up it takes focus back, so Enter or Space unlocks sound and typing never lands behind it.
  useEffect(() => {
    if (!locked) return
    const grab = () => { if (document.activeElement !== button.current) button.current?.focus() }
    const t = setTimeout(grab, 0)
    document.addEventListener('focusin', grab)
    return () => { clearTimeout(t); document.removeEventListener('focusin', grab) }
  }, [locked])

  if (!locked) return null

  const tap = async () => {
    await unlockAudio()
    setLocked(audioLocked())
    sfx.good()
  }

  return (
    <button ref={button} className="audio-gate" onClick={tap} aria-label="לחצו כדי לשמוע את אולי">
      <span className="audio-gate-owl" aria-hidden="true">🦉</span>
      <span className="audio-gate-speaker" aria-hidden="true">🔊</span>
    </button>
  )
}
