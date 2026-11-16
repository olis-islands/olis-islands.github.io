import { useEffect, useRef, useState } from 'react'
import { phrases, say, sfx } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { BoardView } from './board'
import { MAX_MAIN_CARDS, runAdvanced, runShortcut } from './advanced-program'
import type { Action, AdvancedCard, AdvancedProgramQ, AdvancedRun, AdvancedState, Facing } from './advanced-types'
import { advancedPhrases } from './advanced-phrases'
import { C } from './ids'
import { ARROW } from './program'
import type { Cell } from './types'
import '../../ui/pick/pick.css'
import './coding.css'
import './advanced.css'

const STEP_MS = 400
const BOARD_PX = 320
const ACTIONS: readonly Action[] = ['forward', 'left', 'right']
const FACING_NAMES: Readonly<Record<Facing, string>> = { up: C.up, right: C.right, down: C.down, left: C.left }
const LABELS: Readonly<Record<Action, string>> = {
  forward: 'code.ui.facing.forward',
  left: 'code.ui.facing.left',
  right: 'code.ui.facing.right',
}
const reducedMotion = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Phase = 'edit' | 'run' | 'won'
const startCell = (rows: readonly string[]): Cell => {
  const row = rows.findIndex(line => line.includes('S'))
  return [row, rows[row]!.indexOf('S')]
}

export function AdvancedProgramGame({ question, aid, onAttempt }: GameProps<AdvancedProgramQ>) {
  const { board, facing } = question.level
  const functionMode = question.mode === 'function'
  const [program, setProgram] = useState<AdvancedCard[]>([])
  const [block, setBlock] = useState<Action[]>([])
  const [phase, setPhase] = useState<Phase>('edit')
  const [result, setResult] = useState<AdvancedRun | null>(null)
  const [step, setStep] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [stopCard, setStopCard] = useState<number | null>(null)
  const hinted = useRef(false)
  const reported = useRef(false)
  const trace = result && result.kind !== 'invalid' ? result.trace : []
  const current: AdvancedState = trace[Math.min(step, trace.length - 1)] ?? { cell: startCell(board.rows), facing }
  const faceLabel = phrases[FACING_NAMES[current.facing]] ?? current.facing

  useEffect(() => {
    if (aid && question.hint && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])

  useEffect(() => {
    if (phase !== 'run' || !result || result.kind === 'invalid') return
    const timer = setTimeout(() => {
      if (!reducedMotion() && step + 1 < result.trace.length) {
        setStep(step + 1)
        sfx.tick()
        return
      }
      if (reported.current) return
      reported.current = true
      if (result.kind === 'complete' && result.reachedGoal) {
        setPhase('won')
        setFeedback(advancedPhrases['code.fb.facing.goal']!)
        onAttempt(true)
      } else {
        const blocked = result.kind === 'blocked'
        setStopCard(blocked ? result.stoppedAt ?? null : null)
        setPhase('edit')
        setResult(null)
        setFeedback(advancedPhrases[blocked ? 'code.fb.facing.blocked' : 'code.fb.facing.tryAgain']!)
        onAttempt(false)
      }
    }, reducedMotion() ? 0 : STEP_MS)
    return () => clearTimeout(timer)
  }, [onAttempt, phase, result, step])

  const add = (action: AdvancedCard) => {
    if (phase === 'edit' && program.length < MAX_MAIN_CARDS) {
      setProgram(currentProgram => [...currentProgram, action])
      setFeedback('')
      setStopCard(null)
    }
  }
  const addToBlock = (action: Action) => {
    if (phase === 'edit' && functionMode && block.length < 3) {
      setBlock(currentBlock => [...currentBlock, action])
      setFeedback('')
      setStopCard(null)
    }
  }
  const remove = (index: number) => {
    if (phase !== 'edit') return
    setProgram(currentProgram => currentProgram.filter((_, card) => card !== index))
    setFeedback('')
    setStopCard(null)
  }
  const removeFromBlock = (index: number) => {
    if (phase !== 'edit') return
    setBlock(currentBlock => currentBlock.filter((_, card) => card !== index))
    setFeedback('')
  }
  const run = () => {
    if (phase !== 'edit' || !program.length) return
    const next = functionMode
      ? runShortcut(board, facing, program, block)
      : runAdvanced(board, facing, program)
    if (next.kind === 'invalid') return
    reported.current = false
    setFeedback('')
    setStopCard(null)
    setResult(next)
    setStep(reducedMotion() ? next.trace.length - 1 : 0)
    setPhase('run')
  }
  const calls = program.filter(card => card === 'call').length
  const canRun = phase === 'edit' && program.length > 0 && (!functionMode || (block.length >= 2 && calls >= 2))
  const activeCard = phase === 'run' ? current.card : undefined

  return (
    <div className="cd-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="cd-play" role="group" aria-label={`${phrases[question.instruction] ?? ''}. ${advancedPhrases['code.ui.facing.label']}: ${faceLabel}`}>
        <BoardView board={board} size={BOARD_PX} hero={current.cell} trail={trace.length ? trace.slice(0, step + 1).map(state => state.cell) : undefined}
          label={`${phrases[question.instruction] ?? ''}. ${advancedPhrases['code.ui.facing.label']}: ${faceLabel}`} />
      </div>
      <p className="cd-facing" aria-live="polite">
        <span aria-hidden="true">{ARROW[current.facing]}</span> {advancedPhrases['code.ui.facing.label']}: {faceLabel}
      </p>
      {functionMode && <>
        <p className="cd-label">{advancedPhrases['code.ui.block']}</p>
        <div className="cd-strip" dir="ltr" role="list" aria-label={advancedPhrases['code.ui.block']}>
          <span className="cd-start" aria-hidden="true">🧩</span>
          {Array.from({ length: Math.max(2, block.length) }, (_, index) => {
            const action = block[index]
            if (!action) return <span key={index} className="cd-slot" aria-hidden="true" />
            const currentAction = advancedPhrases[LABELS[action]]!
            return (
              <button key={index} type="button" className={`cd-card${current.blockStep === index && phase === 'run' ? ' run' : ''}`}
                disabled={phase !== 'edit'} aria-label={`${index + 1}. ${currentAction}. ${advancedPhrases['code.ui.facing.remove']}`}
                onClick={() => removeFromBlock(index)}>
                <span className="cd-n" aria-hidden="true">{index + 1}</span>
                <span aria-hidden="true">{action === 'forward' ? '👣' : action === 'left' ? '↶' : '↷'}</span>
              </button>
            )
          })}
        </div>
        <p className="cd-label">{phrases['code.ui.add']}</p>
        <div className="cd-palette" role="group" aria-label={advancedPhrases['code.ui.block']}>
          {ACTIONS.map(action => (
            <button key={action} type="button" className="cd-pal" disabled={phase !== 'edit' || block.length >= 3}
              onClick={() => addToBlock(action)} aria-label={advancedPhrases[LABELS[action]]}>
              <span className="cd-plus" aria-hidden="true">+</span>
              <span aria-hidden="true">{action === 'forward' ? '👣' : action === 'left' ? '↶' : '↷'}</span>
              <span className="cd-pal-text">{advancedPhrases[LABELS[action]]}</span>
            </button>
          ))}
        </div>
      </>}
      <p className="cd-label">{phrases['code.ui.add']}</p>
      <div className="cd-palette" role="group" aria-label={phrases['code.ui.add']}>
        {ACTIONS.map(action => (
          <button key={action} type="button" className="cd-pal" disabled={phase !== 'edit' || program.length >= MAX_MAIN_CARDS}
            onClick={() => add(action)} aria-label={advancedPhrases[LABELS[action]]}>
            <span className="cd-plus" aria-hidden="true">+</span>
            <span aria-hidden="true">{action === 'forward' ? '👣' : action === 'left' ? '↶' : '↷'}</span>
            <span className="cd-pal-text">{advancedPhrases[LABELS[action]]}</span>
          </button>
        ))}
        {functionMode && <button type="button" className="cd-pal" disabled={phase !== 'edit' || program.length >= MAX_MAIN_CARDS}
          onClick={() => add('call')} aria-label={advancedPhrases['code.ui.call']}>
          <span className="cd-plus" aria-hidden="true">+</span><span aria-hidden="true">🧩</span>
          <span className="cd-pal-text">{advancedPhrases['code.ui.call']}</span>
        </button>}
      </div>
      <p className="cd-label">{advancedPhrases['code.ui.facing.program']}</p>
      <div className="cd-strip" dir="ltr" role="list" aria-label={advancedPhrases['code.ui.facing.program']}>
        <span className="cd-start" aria-hidden="true">🦉</span>
        {Array.from({ length: Math.max(program.length, Math.min(4, MAX_MAIN_CARDS)) }, (_, index) => {
          const action = program[index]
          if (!action) return <span key={index} className="cd-slot" aria-hidden="true" />
          const label = action === 'call' ? advancedPhrases['code.ui.call']! : advancedPhrases[LABELS[action]]!
          const icon = action === 'call' ? '🧩' : action === 'forward' ? '👣' : action === 'left' ? '↶' : '↷'
          return (
            <button key={index} type="button" className={`cd-card${stopCard === index ? ' stop' : ''}${activeCard === index ? ' run' : ''}`} disabled={phase !== 'edit'}
              aria-label={`${index + 1}. ${label}. ${advancedPhrases['code.ui.facing.remove']}`}
              onClick={() => remove(index)}>
              <span className="cd-n" aria-hidden="true">{index + 1}</span>
              <span aria-hidden="true">{icon}</span>
            </button>
          )
        })}
      </div>
      <div className="cd-actions">
        <button type="button" className="cta cd-run" disabled={!canRun} onClick={run}
          aria-label={advancedPhrases['code.ui.facing.run']}>
          <span aria-hidden="true">▶</span> {advancedPhrases['code.ui.facing.run']}
        </button>
        <button type="button" className="pill cd-erase" disabled={phase !== 'edit' || !program.length} onClick={() => remove(program.length - 1)}
          aria-label={advancedPhrases['code.ui.facing.remove']}>
          <span aria-hidden="true">⌫</span> {advancedPhrases['code.ui.facing.remove']}
        </button>
      </div>
      <p className="cd-feedback" role="status" aria-live="polite">{feedback}</p>
    </div>
  )
}
