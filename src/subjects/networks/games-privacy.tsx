import { useEffect, useRef, useState } from 'react'
import { phrases, say } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { PickGame } from '../../ui/pick/PickGame'
import { SayButton } from '../../ui/pick/SayButton'
import { N } from './ids'
import type { PrivacyQ } from './types'
import './networks.css'

// Locked message (docs/specs/networks.md, game 8). A pick game; when the question has `after` lines (the password
// safety line, then "a lock is not trust"), a right answer first shows and says them, and the round goes on only after "הֵבַנְתִּי". The play
// screen moves on 1.1 s after a right answer, too soon to read a sentence, so the answer is reported on that click.

export function PrivacyGame({ question, aid, onAttempt }: GameProps<PrivacyQ>) {
  const [after, setAfter] = useState(false)
  const [done, setDone] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (after) button.current?.focus() }, [after])

  const attempt = (correct: boolean) => {
    if (correct && question.after) {
      setAfter(true)
      void say(question.after)
    } else onAttempt(correct)
  }
  const confirm = () => {
    if (done) return
    setDone(true)
    onAttempt(true)
  }

  return (
    <>
      <PickGame question={question} aid={aid} onAttempt={attempt} />
      {after && question.after && (
        <div className="net-after" role="status">
          {question.after.map((id, i) => <p key={id} className="he-text net-after-text">{i === 0 ? '🔐 ' : ''}{phrases[id]}</p>)}
          <div className="net-after-row">
            <SayButton id={question.after} />
            <button ref={button} type="button" className="cta" disabled={done} onClick={confirm}>{phrases[N.gotIt]}</button>
          </div>
        </div>
      )}
    </>
  )
}
