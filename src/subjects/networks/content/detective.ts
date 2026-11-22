import type { Stage } from '../types'

// Network detective (grade 6), docs/specs/networks.md game 9. The computer cannot open a page; four checks each report
// evidence in words, as in the earlier games. Exactly one stage fails. Results show no ✅/❌: the child reads each one and
// decides whether it explains the problem. A puzzle abstraction: real failures can have several causes.

export interface StageInfo { id: Stage; icon: string; name: string }
export const STAGES: readonly StageInfo[] = [
  { id: 'lookup', icon: '🔎', name: 'סֵפֶר הַכְּתֹבוֹת' },
  { id: 'route', icon: '🧭', name: 'הַדֶּרֶךְ' },
  { id: 'gate', icon: '🚪', name: 'הַשַּׁעַר' },
  { id: 'library', icon: '📚', name: 'הַסִּפְרִיָּה' },
]

/** What each check finds: two results where the stage works, three where it is the problem. */
export const EVIDENCE: Readonly<Record<Stage, { ok: readonly string[]; fail: readonly string[] }>> = {
  lookup: {
    ok: [
      'סֵפֶר הַכְּתֹבוֹת מָצָא אֶת הַשֵּׁם שֶׁל הַסִּפְרִיָּה, וְנָתַן כְּתֹבֶת.',
      'הַשֵּׁם שֶׁל הַסִּפְרִיָּה כָּתוּב בַּסֵּפֶר, וּלְיָדוֹ כְּתֹבֶת.',
    ],
    fail: [
      'סֵפֶר הַכְּתֹבוֹת לֹא מָצָא אֶת הַשֵּׁם שֶׁל הַסִּפְרִיָּה.',
      'בַּסֵּפֶר אֵין שׁוּרָה עִם הַשֵּׁם שֶׁל הַסִּפְרִיָּה.',
      'בַּסֵּפֶר יֵשׁ רַק שֵׁם דּוֹמֶה, וְלֹא הַשֵּׁם הַמָּלֵא שֶׁל הַסִּפְרִיָּה.',
    ],
  },
  route: {
    ok: [
      'כָּל הַגְּשָׁרִים בַּדֶּרֶךְ לַסִּפְרִיָּה פְּתוּחִים.',
      'יֵשׁ דֶּרֶךְ פְּתוּחָה מֵהַצֹּמֶת עַד הַסִּפְרִיָּה.',
    ],
    fail: [
      'גֶּשֶׁר בַּדֶּרֶךְ לַסִּפְרִיָּה סָגוּר, וְאֵין דֶּרֶךְ אַחֶרֶת.',
      'כָּל הַדְּרָכִים מֵהַצֹּמֶת נִגְמָרוֹת לִפְנֵי הַסִּפְרִיָּה.',
      'הַחֲבִילוֹת נִתְקָעוֹת בְּגֶשֶׁר סָגוּר, וְלֹא מַגִּיעוֹת לַסִּפְרִיָּה.',
    ],
  },
  gate: {
    ok: [
      'הַשַּׁעַר מַכְנִיס אֶת הַחֲבִילוֹת שֶׁל הַמַּחְשֵׁב שֶׁלָּנוּ.',
      'הַשַּׁעַר עוֹצֵר רַק חֲבִילוֹת מִמַּחְשֵׁב אַחֵר, לֹא מֵהַמַּחְשֵׁב שֶׁלָּנוּ.',
    ],
    fail: [
      'הַשַּׁעַר עוֹצֵר אֶת הַחֲבִילוֹת שֶׁל הַמַּחְשֵׁב שֶׁלָּנוּ.',
      'הַשַּׁעַר מַכְנִיס רַק חֲבִילוֹת מִמַּחְשֵׁב אַחֵר, לֹא מֵהַמַּחְשֵׁב שֶׁלָּנוּ.',
      'הַחֲבִילוֹת מַגִּיעוֹת עַד הַשַּׁעַר, וְשָׁם הֵן נֶעֱצָרוֹת.',
    ],
  },
  library: {
    ok: [
      'הַסִּפְרִיָּה קִבְּלָה אֶת הַבַּקָּשָׁה, וְשָׁלְחָה אֶת הַדַּף.',
      'בַּסִּפְרִיָּה יֵשׁ דַּף עַל צָבִים, וְהִיא עוֹנָה לַבַּקָּשׁוֹת.',
    ],
    fail: [
      'הַסִּפְרִיָּה עָנְתָה: הַדַּף לֹא נִמְצָא.',
      'בַּסִּפְרִיָּה אֵין דַּף עַל צָבִים.',
      'הַסִּפְרִיָּה קִבְּלָה אֶת הַבַּקָּשָׁה, אֲבָל לֹא שָׁלְחָה שׁוּם דַּף.',
    ],
  },
}
