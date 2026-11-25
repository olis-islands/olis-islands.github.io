import type { PhraseMap } from '../../core/engine/types'
import { NUMBER_NAMES, SHAPES } from './content/addresses'
import { PLACE_KINDS, PLACE_NOUNS, TOPICS } from './content/lookup'
import { N, numberPhrase, placeKindPhrase, placeNounPhrase, rulePhrase, shapePhrase, topicPhrase } from './ids'

export const phrases: PhraseMap = {
  [N.delivery]: 'לְאֵיזֶה מַחְשֵׁב הַהוֹדָעָה צְרִיכָה לְהַגִּיעַ?',
  [N.hintAddress]: 'הַכְּתֹבֶת עַל הַמַּעֲטָפָה הִיא צוּרָה וּמִסְפָּר. חַפְּשׂוּ מַחְשֵׁב עִם אוֹתָהּ צוּרָה וְאוֹתוֹ מִסְפָּר.',
  [N.address]: 'הַכְּתֹבֶת הִיא',
  [N.packets]: 'הַהוֹדָעָה הִגִּיעָה בַּחֲבִילוֹת. סַדְּרוּ אוֹתָן לְפִי הַמִּסְפָּרִים, מִמִּסְפָּר אַחַת.',
  [N.packet]: 'חֲבִילָה',
  [N.retry3]: 'הַמַּחְשֵׁב חִכָּה לְשָׁלוֹשׁ חֲבִילוֹת. אֵיזוֹ חֲבִילָה לֹא הִגִּיעָה? בַּקְּשׁוּ אוֹתָהּ שׁוּב.',
  [N.retry4]: 'הַמַּחְשֵׁב חִכָּה לְאַרְבַּע חֲבִילוֹת. אֵיזוֹ חֲבִילָה לֹא הִגִּיעָה? בַּקְּשׁוּ אוֹתָהּ שׁוּב.',
  [N.hintRetry]: 'הַשְׁווּ אֶת הַשּׁוּרָה הָעֶלְיוֹנָה לַשּׁוּרָה הַתַּחְתּוֹנָה: אֵיזֶה מִסְפָּר יֵשׁ לְמַעְלָה, וְאֵין לְמַטָּה?',
  [N.firewall]: 'הַחֲבִילָה הַזֹּאת נִכְנֶסֶת אוֹ נֶעֱצֶרֶת?',
  [N.hintFirewall]: 'הַכְּלָל בּוֹדֵק רַק דָּבָר אֶחָד: מִי הַשּׁוֹלֵחַ, אוֹ מִי הַמְּקַבֵּל. קִרְאוּ בַּכְּלָל מָה הוּא בּוֹדֵק, וּבְדְקוּ אֶת זֶה עַל הַחֲבִילָה.',
  [N.allow]: 'נִכְנֶסֶת',
  [N.block]: 'נֶעֱצֶרֶת',
  [N.dns]: 'הַמַּחְשֵׁב צָרִיךְ אֶת הַכְּתֹבֶת שֶׁל',
  [N.dnsFind]: 'חַפְּשׂוּ אוֹתָהּ בְּסֵפֶר הַכְּתֹבוֹת.',
  [N.hintDns]: 'מִצְאוּ בַּסֵּפֶר אֶת הַשּׁוּרָה שֶׁיֵּשׁ בָּהּ אֶת הַשֵּׁם הַמָּלֵא, שְׁתֵּי הַמִּלִּים, וְקִרְאוּ אֶת הַמִּסְפָּר שֶׁלְּיָדוֹ.',
  [N.web]: 'הַמַּחְשֵׁב בִּקֵּשׁ מֵהַסִּפְרִיָּה:',
  [N.webAnswer]: 'אֵלֶּה הַדַּפִּים שֶׁיֵּשׁ בַּסִּפְרִיָּה. מָה הִיא עוֹנָה?',
  [N.pageAbout]: 'דַּף עַל',
  [N.notFound]: 'הַדַּף לֹא נִמְצָא',
  [N.hintWeb]: 'הַשְׁווּ אֶת הַבַּקָּשָׁה לְכָל דַּף שֶׁיֵּשׁ בַּסִּפְרִיָּה. אִם אֵין דַּף שֶׁמַּתְאִים בְּדִיּוּק, הַסִּפְרִיָּה עוֹנָה שֶׁהַדַּף לֹא נִמְצָא.',
  [N.sender]: 'שׁוֹלֵחַ',
  [N.receiver]: 'מְקַבֵּל',
  [rulePhrase('allowTo')]: 'הַשַּׁעַר מַכְנִיס רַק חֲבִילוֹת שֶׁהַמְּקַבֵּל שֶׁלָּהֶן הוּא',
  [rulePhrase('allowFrom')]: 'הַשַּׁעַר מַכְנִיס רַק חֲבִילוֹת שֶׁהַשּׁוֹלֵחַ שֶׁלָּהֶן הוּא',
  [rulePhrase('blockTo')]: 'הַשַּׁעַר עוֹצֵר רַק חֲבִילוֹת שֶׁהַמְּקַבֵּל שֶׁלָּהֶן הוּא',
  [rulePhrase('blockFrom')]: 'הַשַּׁעַר עוֹצֵר רַק חֲבִילוֹת שֶׁהַשּׁוֹלֵחַ שֶׁלָּהֶן הוּא',
  ...Object.fromEntries(SHAPES.map(s => [shapePhrase(s.id), s.name])),
  ...Object.fromEntries(NUMBER_NAMES.map((name, i) => [numberPhrase(i + 1), name])),
  ...Object.fromEntries(PLACE_NOUNS.map(w => [placeNounPhrase(w.id), w.he])),
  ...Object.fromEntries(PLACE_KINDS.map(w => [placeKindPhrase(w.id), w.he])),
  ...Object.fromEntries(TOPICS.map(t => [topicPhrase(t.id), t.he])),
}
