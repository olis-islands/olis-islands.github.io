import { defineGame, type IslandDef } from '../../core/engine/types'
import { PickGame } from '../../ui/pick/PickGame'
import { OrderGame } from '../reading/games'
import { registerNetworksArt } from './art'
import { registerPacketsArt } from './art-packets'
import { deliveryAccepts, deliveryQuestion, describeDelivery } from './generators'
import { describePackets, describeRetry, packetsAccepts, packetsQuestion, retryAccepts, retryQuestion } from './generators-packets'
import { phrases } from './phrases'

// Spec: docs/specs/networks.md (approved, D28). Built one game at a time. Packets reuse the reading island's OrderGame (D28).
registerNetworksArt()
registerPacketsArt()

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
    {
      id: 'networks.packets', title: 'מְסַדְּרִים חֲבִילוֹת', grade: 3, requires: ['networks.delivery'], sticker: '📦', describeItem: describePackets,
      games: [defineGame({ id: 'packets', title: 'סַדְּרוּ אֶת הַחֲבִילוֹת', icon: '📦', component: OrderGame, generate: packetsQuestion, accepts: packetsAccepts })],
    },
    {
      id: 'networks.retry', title: 'חֲבִילָה שֶׁהָלְכָה לְאִבּוּד', grade: 4, requires: ['networks.packets'], sticker: '🔁', describeItem: describeRetry,
      games: [defineGame({ id: 'retry', title: 'אֵיזוֹ חֲבִילָה חָסֵרָה?', icon: '🔁', component: PickGame, generate: retryQuestion, accepts: retryAccepts })],
    },
  ],
}
