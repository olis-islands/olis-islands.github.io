import {
  applyRound, applySprint, emptyProgress, markKnown,
  type Progress, type RoundSummary, type SprintSummary,
} from './progress'

// Progress is the replay of an append-only event log (docs/specs/accounts-sync.md, D27): two devices that hold the
// same events show the same progress, whatever order the events arrived in.

export type PlayPayload = { round: RoundSummary } | { sprint: SprintSummary }

export type ProgressEvent =
  | { id: string; kind: 'play'; at: number; payload: PlayPayload }
  | { id: string; kind: 'known'; at: number; payload: { skillId: string; known: boolean } }
  | { id: string; kind: 'reset'; at: number }

/** Total order: stored time, then ID. Every device sorts the same way. */
export const compareEvents = (a: ProgressEvent, b: ProgressEvent) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

/** Progress computed from the log, and which reset it starts after (its ID, '' if none). */
export interface Folded {
  progress: Progress
  resetId: string
}

/**
 * Replays `events` in order from empty progress. A `reset` clears everything before it.
 * Stickers and mastery never disappear: what `prior` (the cache from the last replay) had earned stays, unless a
 * newer reset made that earlier progress void. Events with a repeated ID count once.
 */
export function fold(events: readonly ProgressEvent[], prior?: Folded): Folded {
  const seen = new Set<string>()
  const sorted = events.filter(e => !seen.has(e.id) && seen.add(e.id)).sort(compareEvents)
  let progress = emptyProgress()
  let resetId = ''
  for (const e of sorted) {
    if (e.kind === 'reset') { progress = emptyProgress(); resetId = e.id }
    else if (e.kind === 'known') progress = markKnown(progress, e.payload.skillId, e.payload.known)
    else if ('round' in e.payload) progress = applyRound(progress, { ...e.payload.round, at: e.at }).progress
    else progress = applySprint(progress, { ...e.payload.sprint, at: e.at }).progress
  }
  return { progress: prior && prior.resetId === resetId ? keepEarned(progress, prior.progress) : progress, resetId }
}

function keepEarned(now: Progress, earlier: Progress): Progress {
  const stickers = [...new Set([...now.stickers, ...earlier.stickers])]
  const skills = { ...now.skills }
  for (const [id, was] of Object.entries(earlier.skills)) {
    if (was.mastered && !skills[id]?.mastered) {
      skills[id] = { rounds: [], bestStars: 0, ...skills[id], mastered: true }
    }
  }
  return { ...now, stickers, skills }
}
