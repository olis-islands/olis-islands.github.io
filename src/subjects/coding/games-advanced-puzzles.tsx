import { useEffect, useRef, useState } from 'react'
import { phrases, say } from '../../core/audio/audio'
import type { GameProps, PhraseRef } from '../../core/engine/types'
import { binaryValue, compareBalance, searchCandidates, uniqueBalanceOrder } from './advanced-program'
import { advancedPhrases } from './advanced-phrases'
import type { BalanceComparison } from './advanced-program'
import type { BalanceQ, BinaryQ, ConditionQ, CounterQ, EventQ, SearchQ } from './advanced-types'
import './advanced.css'

const phraseText = (ref: PhraseRef | undefined): string => {
  if (!ref) return ''
  return typeof ref === 'string' ? phrases[ref] ?? '' : ref.map(id => phrases[id] ?? '').join('')
}

function useHint(aid: boolean, hint: PhraseRef | undefined) {
  const hinted = useRef(false)
  useEffect(() => {
    if (aid && hint && !hinted.current) {
      hinted.current = true
      void say(hint)
    }
  }, [aid, hint])
}

function Status({ text }: { text: string }) {
  return <p className="av-status" role="status" aria-live="polite">{text}</p>
}

export function EventGame({ question, aid, onAttempt }: GameProps<EventQ>) {
  const { scenario } = question
  const triggered = scenario.events[scenario.trigger]!
  const options = [...scenario.events.map(event => event.action), ...scenario.distractors]
  const [wrong, setWrong] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState('')
  useHint(aid, question.hint)

  const choose = (id: string) => {
    if (solved || wrong.includes(id)) return
    const correct = id === question.answer
    if (correct) {
      setSolved(true)
      setFeedback(advancedPhrases['code.fb.advanced.goal']!)
    } else {
      setWrong(current => [...current, id])
      setFeedback(advancedPhrases['code.fb.event.tryAgain']!)
    }
    onAttempt(correct)
  }

  return (
    <div className="av-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <section className="av-card" aria-label={phraseText(triggered.label)}>
        <p className="av-caption">{phrases['code.ui.eventMap']}</p>
        {scenario.events.map((event, index) => (
          <div className={`av-pair${index === scenario.trigger ? ' av-active' : ''}`} key={event.action.id}>
            <span>{phraseText(event.label)}</span><span aria-hidden="true">→</span><span>{phraseText(event.action.label)}</span>
          </div>
        ))}
        <p className="av-trigger">{phrases['code.ui.triggeredEvent']}: <strong>{phraseText(triggered.label)}</strong></p>
      </section>
      <div className="av-options" role="group" aria-label={phrases['code.ui.chooseAction']}>
        {options.map(action => (
          <button key={action.id} type="button" className={`av-choice${wrong.includes(action.id) ? ' av-wrong' : ''}`}
            disabled={solved || wrong.includes(action.id)} onClick={() => choose(action.id)}>
            <span aria-hidden="true">{action.icon}</span><span>{phraseText(action.label)}</span>
          </button>
        ))}
      </div>
      <Status text={feedback} />
    </div>
  )
}

export function ConditionGame({ question, aid, onAttempt }: GameProps<ConditionQ>) {
  const { scenario } = question
  const [branches, setBranches] = useState<[string | null, string | null]>([null, null])
  const [tested, setTested] = useState<Set<number>>(new Set())
  const [feedback, setFeedback] = useState('')
  const [solved, setSolved] = useState(false)
  useHint(aid, question.hint)

  const test = (state: 0 | 1) => {
    setTested(current => new Set(current).add(state))
    const truth = state === scenario.trueState
    const action = branches[truth ? 0 : 1]
    setFeedback(action
      ? `${phraseText(scenario.states[state])}: ${phraseText(scenario.actions.find(candidate => candidate.id === action)?.label)}`
      : advancedPhrases['code.ui.chooseAction']!)
  }
  const submit = () => {
    if (solved || branches.some(action => !action) || tested.size !== 2) return
    const correct = branches[0] === scenario.actions[0].id && branches[1] === scenario.actions[1].id
    setSolved(correct)
    setFeedback(advancedPhrases[correct ? 'code.fb.advanced.goal' : 'code.fb.condition.tryAgain']!)
    onAttempt(correct)
  }

  return (
    <div className="av-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <section className="av-card">
        <p className="av-caption">{phrases['code.ui.condition']}: <strong>{phraseText(scenario.condition)}</strong></p>
        {([0, 1] as const).map(branch => (
          <div className="av-branch" key={branch}>
            <p>{advancedPhrases[branch === 0 ? 'code.ui.true' : 'code.ui.false']}</p>
            <div className="av-options">
              {scenario.actions.map(action => (
                <button key={action.id} type="button" className={`av-choice${branches[branch] === action.id ? ' av-selected' : ''}`}
                  disabled={solved} onClick={() => setBranches(current => current.map((value, index) => index === branch ? action.id : value) as [string | null, string | null])}>
                  <span aria-hidden="true">{action.icon}</span><span>{phraseText(action.label)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
      <div className="av-options" role="group" aria-label={phrases['code.ui.test']}>
        {scenario.states.map((state, index) => (
          <button key={index} className="pill av-button" type="button" onClick={() => test(index as 0 | 1)}>
            {phrases['code.ui.test']}: {phraseText(state)}{tested.has(index) ? ' ✓' : ''}
          </button>
        ))}
      </div>
      <button className="cta av-button" type="button" disabled={solved || branches.some(action => !action) || tested.size !== 2} onClick={submit}>
        {advancedPhrases['code.ui.submit']}
      </button>
      <Status text={feedback} />
    </div>
  )
}

export function CounterGame({ question, aid, onAttempt }: GameProps<CounterQ>) {
  const [wrong, setWrong] = useState<number[]>([])
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState('')
  useHint(aid, question.hint)

  const choose = (value: number) => {
    if (solved || wrong.includes(value)) return
    const correct = value === question.answer
    if (correct) {
      setSolved(true)
      setFeedback(advancedPhrases['code.fb.advanced.goal']!)
    } else {
      setWrong(current => [...current, value])
      setFeedback(advancedPhrases['code.fb.counter.tryAgain']!)
    }
    onAttempt(correct)
  }

  return (
    <div className="av-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <section className="av-card">
        <p className="av-caption">{phrases['code.ui.startCount']}: <strong className="av-number">{question.scenario.start}</strong></p>
        <div className="av-changes" dir="ltr">
          {question.scenario.changes.map((change, index) => (
            <span className="av-change" key={index}>{change > 0 ? '+1' : '−1'}<small>{advancedPhrases[change > 0 ? 'code.ui.collect' : 'code.ui.use']}</small></span>
          ))}
        </div>
        {solved && <p className="av-trace">{question.scenario.start} → {question.scenario.changes.map((_, index) =>
          question.scenario.start + question.scenario.changes.slice(0, index + 1).reduce((sum, change) => sum + change, 0),
        ).join(' → ')}</p>}
      </section>
      <div className="av-options" role="group" aria-label={phrases['code.ui.chooseCount']}>
        {question.options.map(value => (
          <button key={value} type="button" className={`av-choice av-number${wrong.includes(value) ? ' av-wrong' : ''}`}
            disabled={solved || wrong.includes(value)} onClick={() => choose(value)}>{value}</button>
        ))}
      </div>
      <Status text={feedback} />
    </div>
  )
}

export function BinaryGame({ question, aid, onAttempt }: GameProps<BinaryQ>) {
  const [lights, setLights] = useState([false, false, false, false])
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState('')
  const weights = [8, 4, 2, 1]
  useHint(aid, question.hint)

  const submit = () => {
    if (solved) return
    const correct = binaryValue(lights) === question.target
    if (correct) {
      setSolved(true)
      setFeedback(advancedPhrases['code.fb.advanced.goal']!)
    } else setFeedback(advancedPhrases['code.fb.binary.tryAgain']!)
    onAttempt(correct)
  }

  return (
    <div className="av-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <p className="av-target">{phrases['code.ui.target']}: <strong>{question.target}</strong></p>
      <div className="av-bits" dir="ltr" role="group" aria-label={phrases['code.ui.binaryLights']}>
        {weights.map((weight, index) => (
          <button key={weight} type="button" className={`av-bit${lights[index] ? ' av-lit' : ''}`} aria-pressed={lights[index]}
            aria-label={`${weight}, ${advancedPhrases[lights[index] ? 'code.ui.on' : 'code.ui.off'] ?? ''}`}
            disabled={solved} onClick={() => setLights(current => current.map((value, bit) => bit === index ? !value : value))}>
            <span>{weight}</span><span>{advancedPhrases[lights[index] ? 'code.ui.on' : 'code.ui.off']}</span>
          </button>
        ))}
      </div>
      <button className="cta av-button" type="button" disabled={solved} onClick={submit}>{advancedPhrases['code.ui.submit']}</button>
      <Status text={feedback} />
    </div>
  )
}

export function BalanceGame({ question, aid, onAttempt }: GameProps<BalanceQ>) {
  const { items } = question.scenario
  const [pair, setPair] = useState<string[]>([])
  const [comparisons, setComparisons] = useState<BalanceComparison[]>([])
  const [order, setOrder] = useState(items.map(item => item.id))
  const [feedback, setFeedback] = useState('')
  const [solved, setSolved] = useState(false)
  const byId = new Map(items.map(item => [item.id, item]))
  const proven = uniqueBalanceOrder(items, comparisons)
  useHint(aid, question.hint)

  const selectForCompare = (id: string) => setPair(current => current.includes(id)
    ? current.filter(selected => selected !== id)
    : current.length === 2 ? [id] : [...current, id])
  const compare = () => {
    if (pair.length !== 2) return
    const [first, second] = pair.map(id => byId.get(id)!)
    const result = compareBalance(first!, second!)
    const lighter = result < 0 ? first!.id : second!.id
    const heavier = result < 0 ? second!.id : first!.id
    setComparisons(current => [...current, { lighter, heavier }])
    setFeedback(`${phraseText(byId.get(lighter)!.label)} — ${advancedPhrases['code.ui.lighter'] ?? ''} — ${phraseText(byId.get(heavier)!.label)}`)
    setPair([])
  }
  const move = (index: number, offset: -1 | 1) => {
    const next = index + offset
    if (next < 0 || next >= order.length) return
    setOrder(current => current.map((id, at) => at === index ? current[next]! : at === next ? current[index]! : id))
  }
  const submit = () => {
    if (solved || !proven) return
    const correct = order.every((id, index) => id === proven[index])
    if (correct) {
      setSolved(true)
      setFeedback(advancedPhrases['code.fb.advanced.goal']!)
    } else setFeedback(advancedPhrases['code.fb.balance.tryAgain']!)
    onAttempt(correct)
  }

  return (
    <div className="av-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <p className="av-caption">{advancedPhrases['code.ui.selectPair']}</p>
      <div className="av-options">
        {items.map(item => (
          <button key={item.id} type="button" className={`av-choice${pair.includes(item.id) ? ' av-selected' : ''}`}
            aria-pressed={pair.includes(item.id)} disabled={solved} onClick={() => selectForCompare(item.id)}>
            <span aria-hidden="true">{item.icon}</span><span>{phraseText(item.label)}</span>
          </button>
        ))}
      </div>
      <button className="pill av-button" type="button" disabled={pair.length !== 2 || solved} onClick={compare}>{advancedPhrases['code.ui.compare']} ⚖️</button>
      <ol className="av-order" aria-label={phrases['code.ui.sortOrder'] ?? ''}>
        {order.map((id, index) => {
          const item = byId.get(id)!
          return (
            <li key={id} className="av-order-item">
              <span>{item.icon} {phraseText(item.label)}</span>
              <button type="button" className="pill" disabled={solved || index === 0} aria-label={`${phraseText(item.label)}, ${advancedPhrases['code.ui.moveUp'] ?? ''}`}
                onClick={() => move(index, -1)}>↑</button>
              <button type="button" className="pill" disabled={solved || index === order.length - 1} aria-label={`${phraseText(item.label)}, ${advancedPhrases['code.ui.moveDown'] ?? ''}`}
                onClick={() => move(index, 1)}>↓</button>
            </li>
          )
        })}
      </ol>
      <button className="cta av-button" type="button" disabled={solved || !proven} onClick={submit}>{advancedPhrases['code.ui.submit']}</button>
      <Status text={feedback || (proven ? advancedPhrases['code.ui.orderProven'] ?? '' : '')} />
    </div>
  )
}

export function SearchGame({ question, aid, onAttempt }: GameProps<SearchQ>) {
  const { scenario } = question
  const candidates = searchCandidates(scenario)
  const [wrong, setWrong] = useState<number[]>([])
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState('')
  useHint(aid, question.hint)

  const choose = (index: number) => {
    if (solved || wrong.includes(index)) return
    const correct = index === question.answer
    if (correct) {
      setSolved(true)
      setFeedback(advancedPhrases['code.fb.advanced.goal']!)
    } else {
      setWrong(current => [...current, index])
      setFeedback(advancedPhrases['code.fb.search.tryAgain']!)
    }
    onAttempt(correct)
  }

  return (
    <div className="av-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <p className="av-target">{advancedPhrases['code.ui.target']}: <strong>{scenario.target}</strong></p>
      <div className="av-boxes" dir="ltr" role="group" aria-label={advancedPhrases['code.ui.searchBoxes'] ?? ''}>
        {scenario.values.map((value, index) => {
          const revealed = scenario.revealed.includes(index)
          return (
            <button key={index} className={`av-box${wrong.includes(index) ? ' av-wrong' : ''}${candidates.includes(index) ? ' av-candidate' : ''}`}
              type="button" disabled={solved || wrong.includes(index)} onClick={() => choose(index)}
              aria-label={`${advancedPhrases['code.ui.box']} ${index + 1}: ${revealed ? value : advancedPhrases['code.ui.hidden']}`}>
              <span>{index + 1}</span><strong>{revealed ? value : '?'}</strong>
            </button>
          )
        })}
      </div>
      <Status text={feedback} />
    </div>
  )
}
