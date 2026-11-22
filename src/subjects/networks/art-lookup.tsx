import type { CSSProperties } from 'react'
import { registerArt, type ArtProps } from '../../ui/pick/art'
import { LABELS } from './content/labels'
import { PLACE_ADDRESS } from './content/lookup'
import { placeKindPhrase, placeNounPhrase } from './ids'
import { phrases } from './phrases'

// The address book for the name-lookup game (docs/specs/networks.md, game 6). A real table, so a screen reader can
// read it row by row. Colors are theme tokens only.

const cell: CSSProperties = { padding: '8px 14px', borderBlockEnd: '2px solid var(--line)', fontSize: 22 }

function NetBook(p: ArtProps) {
  const rows = String(p.rows ?? '').split('|').filter(id => id in PLACE_ADDRESS)
  return (
    <table style={{ borderCollapse: 'collapse', background: 'var(--card)', border: '3px solid var(--net)', borderRadius: 12, color: 'var(--ink)' }}>
      <caption style={{ fontWeight: 800, fontSize: 20, paddingBlockEnd: 6 }}>📖 {LABELS.book}</caption>
      <thead>
        <tr><th style={{ ...cell, textAlign: 'start' }}>{LABELS.bookName}</th><th style={cell}>{LABELS.bookAddress}</th></tr>
      </thead>
      <tbody>
        {rows.map(id => {
          const [noun, kind] = id.split('-')
          return (
            <tr key={id}>
              <td className="he-text" style={{ ...cell, fontSize: 24 }}>{`${phrases[placeNounPhrase(noun!)]} ${phrases[placeKindPhrase(kind!)]}`}</td>
              <td className="digi" dir="ltr" style={{ ...cell, fontWeight: 800, textAlign: 'center' }}>{PLACE_ADDRESS[id]}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export const LOOKUP_ART = { 'net-book': NetBook }
export const registerLookupArt = () => registerArt(LOOKUP_ART)
