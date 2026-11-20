import { create } from 'zustand'
import { del, delMany, get, keys, set, update } from 'idb-keyval'
import type { Grade } from '../engine/types'
import { fold, type Folded, type ProgressEvent } from '../progress/events'
import {
  applyRound, applySprint, emptyProgress,
  type Progress, type RoundOutcome, type RoundSummary, type SprintOutcome, type SprintSummary,
} from '../progress/progress'
import { makeBackup, type Backup } from './backup'

// The only module that touches persistent storage (docs/DECISIONS.md D2, D27).
// Progress is the replay of an append-only event log kept per child (docs/specs/accounts-sync.md).

export interface Profile {
  id: string
  name: string
  avatar: string
  grade: Grade
  /** Speak each instruction automatically (for pre-readers). */
  autoSpeak: boolean
}

interface State {
  loaded: boolean
  profiles: Profile[]
  current: Profile | null
  progress: Progress
  load: () => Promise<void>
  createProfile: (p: Omit<Profile, 'id'>) => Promise<void>
  selectProfile: (id: string | null) => Promise<void>
  recordRound: (r: RoundSummary) => Promise<RoundOutcome>
  /** A timed sprint (D23): Leitner and the game's record only. */
  recordSprint: (r: SprintSummary) => Promise<SprintOutcome>
  updateProfile: (id: string, patch: Partial<Omit<Profile, 'id'>>) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  resetProgress: (id: string) => Promise<void>
  /** A parent's "already knows this" for one child's skill, or undoing it (D19). */
  markKnown: (childId: string, skillId: string, known: boolean) => Promise<void>
  /** Every profile and its progress, for the parent's backup file. */
  exportAll: () => Promise<Backup>
}

/** Bumped when the stored shape changes. Older data is dropped (the beta reset agreed in D27). */
const SCHEMA = 'schema'
const SCHEMA_VERSION = 2
/** A device starts as a guest: nothing leaves it. Signed-in accounts get their own prefix with sync. */
const NS = 'guest'
const PROFILES = `${NS}:profiles`
const logKey = (id: string) => `${NS}:log:${id}`
/** The child who played last, so a reload with several profiles doesn't go back to the picker. */
const LAST = `${NS}:last`

/** One child's events and the progress computed from them, saved together in one write. */
interface Log {
  events: ProgressEvent[]
  folded: Folded
}

async function safeGet<T>(key: string): Promise<T | undefined> {
  try { return await get<T>(key) } catch { return undefined }
}
async function safeSet(key: string, value: unknown) {
  try { await set(key, value) } catch { /* storage unavailable (private mode): play without saving */ }
}

/** Drops data from before the event log: the first start of this version begins empty. */
async function migrate() {
  if ((await safeGet<number>(SCHEMA)) === SCHEMA_VERSION) return
  try {
    const old = (await keys()).filter(k => typeof k === 'string' && (k === 'profiles' || k === 'lastProfile' || k.startsWith('progress:')))
    await delMany(old)
  } catch { /* storage unavailable */ }
  await safeSet(SCHEMA, SCHEMA_VERSION)
}

const loadLog = async (id: string): Promise<Log> => {
  const log = await safeGet<Log>(logKey(id))
  return log ? { events: log.events, folded: log.folded ?? fold(log.events) } : { events: [], folded: fold([]) }
}

/** Events kept in memory when storage is unavailable, so a round still counts until the page closes. */
const memoryLogs = new Map<string, ProgressEvent[]>()

/**
 * Adds one event to a child's log. The event and the progress computed with it are written in a single transaction,
 * so a crash can never leave one without the other. A reset is stamped after the newest event, so it always wins a tie.
 */
async function appendEvent(id: string, event: ProgressEvent): Promise<Folded> {
  const stamp = (events: readonly ProgressEvent[]): ProgressEvent =>
    event.kind === 'reset' ? { ...event, at: Math.max(event.at, ...events.map(e => e.at + 1)) } : event
  let result: Folded = fold([event])
  try {
    await update<Log | undefined>(logKey(id), old => {
      const prior = old?.events ?? []
      const events = [...prior, stamp(prior)]
      result = fold(events, old?.folded)
      return { events, folded: result }
    })
  } catch {
    const prior = memoryLogs.get(id) ?? []
    const events = [...prior, stamp(prior)]
    memoryLogs.set(id, events)
    result = fold(events)
  }
  return result
}

const newId = () => crypto.randomUUID()

export const useStore = create<State>((setState, getState) => ({
  loaded: false,
  profiles: [],
  current: null,
  progress: emptyProgress(),

  async load() {
    await migrate()
    const profiles = (await safeGet<Profile[]>(PROFILES)) ?? []
    setState({ profiles })
    // Select before marking loaded, or routes redirect to the profile picker on reload.
    const last = await safeGet<string>(LAST)
    const pick = profiles.length === 1 ? profiles[0]!.id : profiles.find(p => p.id === last)?.id
    if (pick) await getState().selectProfile(pick)
    setState({ loaded: true })
  },

  async createProfile(p) {
    const profile: Profile = { ...p, id: newId() }
    const profiles = [...getState().profiles, profile]
    setState({ profiles })
    await safeSet(PROFILES, profiles)
    await getState().selectProfile(profile.id)
  },

  async selectProfile(id) {
    const current = getState().profiles.find(p => p.id === id) ?? null
    const progress = current ? (await loadLog(current.id)).folded.progress : emptyProgress()
    setState({ current, progress })
    if (current) await safeSet(LAST, current.id)
  },

  async recordRound(r) {
    const { current, progress } = getState()
    const outcome = applyRound(progress, r)
    if (current) {
      const folded = await appendEvent(current.id, { id: newId(), kind: 'play', at: r.at, payload: { round: r } })
      setState({ progress: folded.progress })
      return { ...outcome, progress: folded.progress }
    }
    setState({ progress: outcome.progress })
    return outcome
  },

  async recordSprint(r) {
    const { current, progress } = getState()
    const outcome = applySprint(progress, r)
    if (current) {
      const folded = await appendEvent(current.id, { id: newId(), kind: 'play', at: r.at, payload: { sprint: r } })
      setState({ progress: folded.progress })
      return { ...outcome, progress: folded.progress }
    }
    setState({ progress: outcome.progress })
    return outcome
  },

  async updateProfile(id, patch) {
    const profiles = getState().profiles.map(p => (p.id === id ? { ...p, ...patch, id } : p))
    const current = getState().current
    setState({ profiles, current: current?.id === id ? profiles.find(p => p.id === id)! : current })
    await safeSet(PROFILES, profiles)
  },

  async deleteProfile(id) {
    const profiles = getState().profiles.filter(p => p.id !== id)
    setState({ profiles })
    await safeSet(PROFILES, profiles)
    memoryLogs.delete(id)
    try { await del(logKey(id)) } catch { /* storage unavailable */ }
    if (getState().current?.id === id) {
      setState({ current: null, progress: emptyProgress() })
      try { await del(LAST) } catch { /* storage unavailable */ }
    }
  },

  async resetProgress(id) {
    const folded = await appendEvent(id, { id: newId(), kind: 'reset', at: Date.now() })
    if (getState().current?.id === id) setState({ progress: folded.progress })
  },

  async markKnown(childId, skillId, known) {
    const folded = await appendEvent(childId, { id: newId(), kind: 'known', at: Date.now(), payload: { skillId, known } })
    if (getState().current?.id === childId) setState({ progress: folded.progress })
  },

  async exportAll() {
    const { profiles } = getState()
    const progress: Record<string, Progress> = {}
    for (const p of profiles) progress[p.id] = (await loadLog(p.id)).folded.progress
    return makeBackup(profiles, progress, Date.now())
  },
}))
