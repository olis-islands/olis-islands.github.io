import { describe, expect, it } from 'vitest'
import { phrases } from '../core/audio/audio'
import { islandPhrase, islands } from './islands'

describe('island names on the map', () => {
  it('every island has a spoken name, the same text as its title (one shared recording)', () => {
    for (const island of islands) {
      const said = phrases[islandPhrase(island.id)]
      expect(said, island.id).toBeTruthy()
      if (island.id !== 'english') expect(said, island.id).toBe(island.title)
    }
  })
  it('groups the map into a base tier (clock, numbers, letters, thinking) and an advanced tier for the rest', () => {
    const byId = (id: string) => islands.find(i => i.id === id)?.tier
    for (const id of ['clock', 'math', 'hebrew', 'thinking']) expect(byId(id), id).toBe('base')
    for (const id of ['reading', 'english', 'coding']) expect(byId(id), id).toBe('advanced')
  })
})

describe('names inside an island', () => {
  it('no skill has the same name as a game in another skill (a child looking for "לוּחַ הַכֶּפֶל" must find one place)', () => {
    for (const island of islands) {
      for (const skill of island.skills) {
        const elsewhere = island.skills.filter(s => s !== skill).flatMap(s => s.games.map(g => g.title))
        expect(elsewhere.includes(skill.title), `${island.id}: ${skill.title}`).toBe(false)
      }
    }
  })
})
