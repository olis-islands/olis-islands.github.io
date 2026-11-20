import type { PhraseMap } from '../../core/engine/types'
import { NUMBER_NAMES, SHAPES } from './content/addresses'
import { N, numberPhrase, shapePhrase } from './ids'

export const phrases: PhraseMap = {
  [N.delivery]: 'לְאֵיזֶה מַחְשֵׁב הַהוֹדָעָה צְרִיכָה לְהַגִּיעַ?',
  [N.hintAddress]: 'הַכְּתֹבֶת עַל הַמַּעֲטָפָה הִיא צוּרָה וּמִסְפָּר. חַפְּשׂוּ מַחְשֵׁב עִם אוֹתָהּ צוּרָה וְאוֹתוֹ מִסְפָּר.',
  [N.address]: 'הַכְּתֹבֶת הִיא',
  ...Object.fromEntries(SHAPES.map(s => [shapePhrase(s.id), s.name])),
  ...Object.fromEntries(NUMBER_NAMES.map((name, i) => [numberPhrase(i + 1), name])),
}
