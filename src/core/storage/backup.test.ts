import { describe, expect, it } from 'vitest'
import { emptyProgress } from '../progress/progress'
import { makeBackup } from './backup'

describe('backup file', () => {
  it('holds every child and their progress, and survives JSON', () => {
    const noa = { id: 'n1', name: 'נועה', avatar: '🦊', grade: 1 as const, autoSpeak: true }
    const withRecords = { ...emptyProgress(), records: { 'math.table|arena': 23 } }
    const file = makeBackup([noa], { n1: withRecords }, 1000)
    expect(JSON.parse(JSON.stringify(file))).toEqual(file)
  })
})
