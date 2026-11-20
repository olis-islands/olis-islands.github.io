import { beforeEach, describe, expect, it, vi } from 'vitest'

// An in-memory stand-in for IndexedDB, so the store's actions can be tested without a browser.
const db = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: async (k: string) => structuredClone(db.get(k)),
  set: async (k: string, v: unknown) => { db.set(k, structuredClone(v)) },
  del: async (k: string) => { db.delete(k) },
  delMany: async (ks: string[]) => { for (const k of ks) db.delete(k) },
  keys: async () => [...db.keys()],
  // One read and one write with nothing in between: the same guarantee as IndexedDB's single transaction.
  update: async (k: string, fn: (old: unknown) => unknown) => { db.set(k, structuredClone(fn(structuredClone(db.get(k))))) },
}))

const { useStore } = await import('./store')

const child = (name: string) => ({ name, avatar: '🦊', grade: 1 as const, autoSpeak: true })
const round = { skillId: 'clock.hours', sticker: '🕐', firstTry: ['3:00'], missed: ['4:30'], total: 2, at: 5 }

beforeEach(() => {
  db.clear()
  useStore.setState({ loaded: false, profiles: [], current: null })
})

describe('store actions for the parents page', () => {
  it('updates a profile, also when it is the current one', async () => {
    await useStore.getState().createProfile(child('נועה'))
    const id = useStore.getState().current!.id
    await useStore.getState().updateProfile(id, { autoSpeak: false, grade: 2 })
    expect(useStore.getState().current).toMatchObject({ autoSpeak: false, grade: 2, id })
    expect(db.get('guest:profiles')).toEqual([expect.objectContaining({ autoSpeak: false, grade: 2 })])
  })

  it('deletes a child with its progress, and resets progress', async () => {
    await useStore.getState().createProfile(child('נועה'))
    const noa = useStore.getState().current!.id
    await useStore.getState().recordRound(round)
    await useStore.getState().createProfile(child('כרמל'))
    const carmel = useStore.getState().current!.id
    await useStore.getState().recordRound(round)
    await useStore.getState().resetProgress(carmel)
    expect(useStore.getState().progress.totalStars).toBe(0)
    await useStore.getState().deleteProfile(noa)
    expect(db.has(`guest:log:${noa}`)).toBe(false)
    expect(useStore.getState().profiles.map(p => p.name)).toEqual(['כרמל'])
  })

  it('remembers the last child across a reload when there are several', async () => {
    await useStore.getState().createProfile(child('נועה'))
    await useStore.getState().createProfile(child('כרמל'))
    useStore.setState({ loaded: false, profiles: [], current: null })
    await useStore.getState().load()
    expect(useStore.getState().current?.name).toBe('כרמל')
  })

  it('exports every child with the progress computed from the log', async () => {
    await useStore.getState().createProfile(child('נועה'))
    await useStore.getState().recordRound(round)
    const id = useStore.getState().current!.id
    const backup = await useStore.getState().exportAll()
    expect(backup.profiles.map(p => p.name)).toEqual(['נועה'])
    expect(backup.progress[id]!.totalStars).toBeGreaterThan(0)
  })

  it('marks a skill known for a child who is not the current one, without a sticker', async () => {
    await useStore.getState().createProfile(child('נועה'))
    const noa = useStore.getState().current!.id
    await useStore.getState().createProfile(child('כרמל'))
    await useStore.getState().markKnown(noa, 'clock.hours', true)
    expect(db.get(`guest:log:${noa}`)).toMatchObject({ folded: { progress: { skills: { 'clock.hours': { mastered: true, byParent: true } }, stickers: [] } } })
    expect(useStore.getState().progress.skills['clock.hours']).toBeUndefined()
  })

  it('keeps a round in the log and brings the progress back after a reload', async () => {
    await useStore.getState().createProfile(child('נועה'))
    const before = (await useStore.getState().recordRound(round)).progress
    const log = db.get(`guest:log:${useStore.getState().current!.id}`) as { events: unknown[]; folded: { progress: unknown } }
    expect(log.events).toHaveLength(1)
    expect(log.folded.progress).toEqual(before)
    useStore.setState({ loaded: false, profiles: [], current: null })
    await useStore.getState().load()
    expect(useStore.getState().progress).toEqual(before)
  })

  it('gives every round its own event ID and a reset wins over earlier events', async () => {
    await useStore.getState().createProfile(child('נועה'))
    const id = useStore.getState().current!.id
    await useStore.getState().recordRound(round)
    await useStore.getState().recordRound(round)
    await useStore.getState().resetProgress(id)
    const events = (db.get(`guest:log:${id}`) as { events: { id: string; at: number; kind: string }[] }).events
    expect(new Set(events.map(e => e.id)).size).toBe(3)
    expect(events[2]!.kind).toBe('reset')
    expect(events[2]!.at).toBeGreaterThan(events[1]!.at)
    expect(useStore.getState().progress.totalStars).toBe(0)
    await useStore.getState().recordRound({ ...round, at: Date.now() + 10_000 })
    expect(useStore.getState().progress.totalStars).toBeGreaterThan(0)
  })

  it('drops data from before the event log on the first start, once', async () => {
    db.set('profiles', [{ id: 'old', name: 'ישן', avatar: '🦊', grade: 1, autoSpeak: true }])
    db.set('progress:old', { skills: {}, leitner: {}, stickers: [], totalStars: 9 })
    db.set('lastProfile', 'old')
    await useStore.getState().load()
    expect(useStore.getState().profiles).toEqual([])
    expect([...db.keys()].filter(k => k === 'profiles' || k === 'lastProfile' || k.startsWith('progress:'))).toEqual([])
    await useStore.getState().createProfile(child('נועה'))
    useStore.setState({ loaded: false, profiles: [], current: null })
    await useStore.getState().load() // the second start keeps what was saved
    expect(useStore.getState().profiles.map(p => p.name)).toEqual(['נועה'])
  })
})
