import type { HelpEntry } from '../../../core/engine/types'
import type { SetQ } from '../generators'

const controls = 'גוררים מחוג עם העכבר או האצבע. במקלדת בוחרים מחוג עם Tab ומזיזים אותו עם החיצים.'
const hands = 'המחוג הקצר מראה שעות, והמחוג הארוך מראה דקות.'

export function setHelp({ hourOnly }: Pick<SetQ, 'hourOnly'>): readonly HelpEntry[] {
  return [
    {
      question: 'אֵיךְ מְשַׂחֲקִים?',
      answer: hourOnly
        ? 'מזיזים את המחוג הקצר לשעה שכתובה למעלה, ולוחצים על בדיקה.'
        : 'מזיזים את המחוגים לשעה שכתובה למעלה, ולוחצים על בדיקה.',
    },
    {
      question: 'אֵיךְ מְזִיזִים אֶת הַמְּחוֹגִים?',
      answer: hourOnly ? `במשחק הזה מזיזים רק את המחוג הקצר. ${controls}` : controls,
    },
    { question: 'מָה מַרְאֶה כָּל מָחוֹג?', answer: hands },
    {
      question: 'אֶפְשָׁר רֶמֶז?',
      answer: hourOnly
        ? 'הסתכלו על השעה שכתובה למעלה וחפשו אותה על השעון. המחוג הקצר מראה שעות.'
        : 'המחוג הקצר מראה שעות, והמחוג הארוך מראה דקות. בדקו כל מחוג בנפרד.',
    },
  ]
}
