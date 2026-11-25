import { useEffect, useRef, useState } from 'react'
import { phrases, say } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { SayButton } from '../../ui/pick/SayButton'
import { STAGES } from './content/detective'
import { LABELS } from './content/labels'
import { N, stagePhrase } from './ids'
import type { DetectiveQ, Stage } from './types'
import './networks.css'

// Network detective (docs/specs/networks.md, game 9). Four checks show what each stage found, in words only (no ✅/❌:
// reading the result is the task). The answer buttons count only once all four checks were made; before that they are
// disabled and nothing is scored. A wrong answer is one miss and stays visible but disabled.

export function DetectiveGame({ question, aid, onAttempt }: GameProps<DetectiveQ>) {
  const [checked, setChecked] = useState<Stage[]>([])
  const [wrong, setWrong] = useState<Stage[]>([])
  const [right, setRight] = useState(false)
  const hinted = useRef(false)
  const ready = checked.length === STAGES.length

  useEffect(() => {
    if (aid && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])

  const check = (stage: Stage) => {
    if (!checked.includes(stage)) setChecked(c => [...c, stage])
    void say(question.evidence[stage])
  }
  const choose = (stage: Stage) => {
    if (!ready || right || wrong.includes(stage)) return
    const ok = stage === question.answer
    if (ok) setRight(true)
    else setWrong(w => [...w, stage])
    onAttempt(ok)
  }

  return (
    <div className="nd-stage">
      <p className="he-text nd-q">{phrases[question.instruction]}</p>
      <ul className="nd-checks">
        {STAGES.map(s => (
          <li key={s.id} className="nd-row">
            <button type="button" className="opt nd-check" aria-pressed={checked.includes(s.id)} onClick={() => check(s.id)}>
              <span aria-hidden="true">{s.icon}</span> {LABELS.check} {phrases[stagePhrase(s.id)]}
            </button>
            <p className={`he-text nd-result${checked.includes(s.id) ? '' : ' nd-empty'}`} aria-live="polite">
              {checked.includes(s.id) ? phrases[question.evidence[s.id]] : LABELS.notChecked}
            </p>
          </li>
        ))}
      </ul>
      {aid && (
        <div className="nd-hint"><SayButton id={question.hint} label="💡 🔊" /></div>
      )}
      <p className="he-text nd-q">{ready ? phrases[N.detectiveAnswer] : LABELS.checkFirst}</p>
      <div className="opts nd-answers">
        {STAGES.map(s => {
          const cls = right && s.id === question.answer ? ' ok' : wrong.includes(s.id) ? ' bad' : ''
          return (
            <button key={s.id} type="button" className={`opt nd-answer${cls}`} disabled={!ready || wrong.includes(s.id)} onClick={() => choose(s.id)}>
              <span aria-hidden="true">{s.icon}</span> {phrases[stagePhrase(s.id)]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
