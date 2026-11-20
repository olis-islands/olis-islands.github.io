import { defineGame, type IslandDef } from '../../core/engine/types'
import { PickGame } from '../../ui/pick/PickGame'
import { registerNetworksArt } from './art'
import { deliveryAccepts, deliveryQuestion, describeDelivery } from './generators'
import { phrases } from './phrases'

// Spec: docs/specs/networks.md. Built one game at a time; open decisions: docs/requests/2026-11-20-networks-open-decisions.md.
registerNetworksArt()

export const island: IslandDef = {
  id: 'networks',
  order: 8,
  tier: 'advanced',
  title: 'אִי הָרְשָׁתוֹת',
  icon: '📡',
  color: '--net',
  homeTip: 'לשחק יחד "דוור": לכתוב על מעטפה צורה ומספר, להדביק סימנים כאלה על דלתות בבית, ולתת לילד למסור את המכתב לדלת הנכונה',
  phrases,
  skills: [
    {
      id: 'networks.delivery', title: 'מוֹסְרִים הוֹדָעָה', grade: 1, requires: [], sticker: '✉️', describeItem: describeDelivery,
      games: [defineGame({ id: 'delivery', title: 'לְאָן הַהוֹדָעָה?', icon: '✉️', component: PickGame, generate: deliveryQuestion, accepts: deliveryAccepts })],
    },
  ],
}
