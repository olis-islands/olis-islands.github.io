import { useEffect, useState } from 'react'
import { audioLocked, onAudioLockChange, unlockAudio } from '../core/audio/audio'

/**
 * Unlocks sound behind the scenes: while the browser blocks it, the first tap or key press anywhere primes the audio
 * (and says an instruction that was held back). Nothing covers the screen. Only click, touchend and keydown count:
 * iOS does not treat touchstart or pointerdown as a tap that may start sound.
 */
export function AudioGate() {
  const [locked, setLocked] = useState(audioLocked)

  useEffect(() => {
    const check = () => setLocked(audioLocked())
    const off = onAudioLockChange(check)
    // The system may suspend audio again while the app is in the background.
    document.addEventListener('visibilitychange', check)
    return () => { off(); document.removeEventListener('visibilitychange', check) }
  }, [])

  useEffect(() => {
    if (!locked) return
    const tap = () => { unlockAudio(); setLocked(audioLocked()) }
    const events = ['click', 'touchend', 'keydown'] as const
    for (const e of events) document.addEventListener(e, tap, true)
    return () => { for (const e of events) document.removeEventListener(e, tap, true) }
  }, [locked])

  return null
}
