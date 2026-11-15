import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { say } from '../core/audio/audio'
import type { HelpEntry, PhraseRef } from '../core/engine/types'
import { Mascot, type Mood } from './Mascot'
import './oli-help.css'

export function OliHelp({ instruction, entries, mood }: {
  instruction: PhraseRef
  entries: readonly HelpEntry[]
  mood: Mood
}) {
  const [open, setOpen] = useState(false)
  const owl = useRef<HTMLButtonElement>(null)
  const id = useId()
  const close = () => {
    setOpen(false)
    owl.current?.focus()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      close()
    }
  }

  return (
    <div className="oli-help" onKeyDown={onKeyDown}>
      <Mascot mood={mood} size={80} owlRef={owl} text="צְרִיכִים עֶזְרָה? לַחֲצוּ עָלַי"
        action={{ onClick: () => setOpen(value => !value), expanded: open, controls: id }} />
      {open && (
        <section id={id} className="oli-help-panel" aria-label="עֶזְרָה מֵאוֹלִי">
          <div className="oli-help-actions">
            <button type="button" className="oli-help-button" onClick={() => void say(instruction)}>🔊 שִׁמְעוּ שׁוּב</button>
            <button type="button" className="oli-help-close" aria-label="סְגִירָה" onClick={close}>×</button>
          </div>
          {entries.map(entry => (
            <details key={entry.question} className="oli-help-entry">
              <summary>{entry.question}</summary>
              <p>{entry.answer}</p>
            </details>
          ))}
        </section>
      )}
    </div>
  )
}
