import type { HelpEntry } from '../../../core/engine/types'
import { parseFirewallKey } from '../generators-gates'
import type { FirewallQ } from '../types'

// Oli's help for the networks island (D25, docs/specs/oli-help.md): one file, entries by game. Text only, never spoken
// or recorded. Questions keep nikud; answers have none. Started with the firewall, whose spoken hint cannot come up
// (two options); other games follow one at a time after the play-test.

const play = 'קוראים את הכלל של השער ומסתכלים על החבילה. אם לפי הכלל החבילה נכנסת, בוחרים "נכנסת". אם לא, בוחרים "נעצרת".'
const fields = 'השולח הוא המחשב ששלח את החבילה. המקבל הוא המחשב שהחבילה צריכה להגיע אליו. על כל חבילה כתובים שניהם.'
const gate = 'השער בודק כל חבילה לפי כלל אחד, ומחליט אם היא נכנסת או נעצרת. גם במחשבים אמיתיים יש שער כזה, וקוראים לו "חומת אש". במשחק הוא פשוט יותר.'

/** Firewall help. Depends only on the rule (which field it checks, allow or block), never on the packet or the answer. */
export function firewallHelp({ itemKey }: Pick<FirewallQ, 'itemKey'>): readonly HelpEntry[] {
  const item = parseFirewallKey(itemKey)
  if (!item) return []
  const receiver = item.rule.kind.endsWith('To')
  const allow = item.rule.kind.startsWith('allow')
  return [
    { question: 'אֵיךְ מְשַׂחֲקִים?', answer: play },
    { question: 'מִי הַשּׁוֹלֵחַ וּמִי הַמְּקַבֵּל?', answer: fields },
    { question: 'מָה הַשַּׁעַר עוֹשֶׂה?', answer: gate },
    {
      question: 'מָה אוֹמֶרֶת הַמִּלָּה "רַק" בַּכְּלָל?',
      answer: allow
        ? 'השער מכניס רק חבילות שמתאימות לכלל. כל חבילה אחרת נעצרת.'
        : 'השער עוצר רק חבילות שמתאימות לכלל. כל חבילה אחרת נכנסת.',
    },
    {
      question: 'אֶפְשָׁר רֶמֶז?',
      answer: receiver
        ? 'הכלל הזה בודק רק את המקבל. מצאו את המקבל על החבילה, ובדקו אם זו הצורה שבכלל. השולח לא משנה כאן.'
        : 'הכלל הזה בודק רק את השולח. מצאו את השולח על החבילה, ובדקו אם זו הצורה שבכלל. המקבל לא משנה כאן.',
    },
  ]
}
