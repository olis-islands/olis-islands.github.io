import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IslandDef } from '../../core/engine/types'
import { say } from '../../core/audio/audio'
import { useStore } from '../../core/storage/store'
import { Mascot } from '../../ui/Mascot'
import { islandPhrase, islands } from '../islands'
import { TopBar } from '../TopBar'
import './map.css'

/** A mouse resting on an island says its name (pre-readers); a passing pointer says nothing. */
const HOVER_SAY_MS = 400

export function MapScreen() {
  const navigate = useNavigate()
  const progress = useStore(s => s.progress)
  const hover = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverEnd = () => { if (hover.current) clearTimeout(hover.current) }
  useEffect(() => hoverEnd, [])

  const renderIsland = (island: IslandDef) => {
    const mastered = island.skills.filter(s => progress.skills[s.id]?.mastered).length
    return (
      <button key={island.id} className={`island${island.comingSoon ? ' soon' : ''}`}
        style={{ ['--c' as string]: `var(${island.color})` }}
        onPointerEnter={e => {
          if (e.pointerType !== 'mouse') return
          hoverEnd()
          hover.current = setTimeout(() => void say(islandPhrase(island.id)), HOVER_SAY_MS)
        }}
        onPointerLeave={hoverEnd}
        onClick={() => { hoverEnd(); if (island.comingSoon) void say('app.soon'); else navigate(`/island/${island.id}`) }}>
        <span className={`island-icon${/[א-ת]/.test(island.icon) ? ' island-letters' : ''}`}>{island.icon}</span>
        <b>{island.title}</b>
        {island.comingSoon
          ? <small>🚧 בקרוב</small>
          : <small>{mastered}/{island.skills.length} 🏅</small>}
      </button>
    )
  }

  const base = islands.filter(i => i.tier === 'base')
  const advanced = islands.filter(i => i.tier === 'advanced')

  return (
    <>
      <TopBar title="הָאִיִּים שֶׁל אוֹלִי" back={null} />
      <Mascot line="app.pickIsland" size={96} />
      <section className="map-group">
        <h2>אִיֵּי הַיְּסוֹד</h2>
        <div className={`map map--${base.length}`}>
          {base.map(renderIsland)}
        </div>
      </section>
      {advanced.length > 0 && (
        <section className="map-group">
          <h2>אִיֵּי הֶמְשֵׁךְ</h2>
          <div className={`map map--${advanced.length}`}>
            {advanced.map(renderIsland)}
          </div>
        </section>
      )}
    </>
  )
}
