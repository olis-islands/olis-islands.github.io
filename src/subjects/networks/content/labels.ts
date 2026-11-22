// Screen-reader text for drawings: read, never spoken by Oli, so nothing here needs recording.

export const LABELS = {
  /** Retry: "the computer waited for packets 1 to 4", then the packets that arrived. */
  waited: (total: number) => `הַמַּחְשֵׁב חִכָּה לַחֲבִילוֹת מִ־1 עַד ${total}.`,
  arrived: (numbers: readonly number[]) => `הִגִּיעוּ: ${numbers.join(', ')}.`,
  waitedShort: 'הָיוּ צְרִיכוֹת לְהַגִּיעַ:',
  arrivedShort: 'הִגִּיעוּ:',
  /** Route: the map described for screen readers, bridge by bridge. */
  routeMap: 'מַפָּה: הַהוֹדָעָה בַּצֹּמֶת, וּמִמֶּנָּה דְּרָכִים לְשָׁלוֹשׁ צוּרוֹת. הַדְּרָכִים מֵהַצֹּמֶת לַצּוּרוֹת תָּמִיד פְּתוּחוֹת. אֵין גֶּשֶׁר בֵּין שְׁתֵּי תַּחֲנוֹת שֶׁלֹּא הוּזְכְּרוּ.',
  routeStop: (n: string) => `תַּחֲנָה ${n}`,
  routeComputer: 'הַמַּחְשֵׁב',
  routeBridge: (a: string, b: string, open: boolean) => `גֶּשֶׁר בֵּין ${a} וּבֵין ${b}: ${open ? 'פָּתוּחַ' : 'סָגוּר'}.`,
  /** Locked message: the box's label and the scene described for screen readers (the key goes with the recipient). */
  privacyTo: (name: string) => `אֶל: ${name}`,
  privacyScene: (locked: boolean, recipient: string) =>
    locked ? `קֻפְסָה נְעוּלָה בְּמַנְעוּל, וְעָלֶיהָ כָּתוּב אֶל ${recipient}. הַמַּפְתֵּחַ אֵצֶל ${recipient}.` : `קֻפְסָה פְּתוּחָה, וְעָלֶיהָ כָּתוּב אֶל ${recipient}.`,
  /** Detective: the check buttons' prefix and the placeholder before a check. */
  check: 'בְּדִיקָה:',
  notChecked: 'עוֹד לֹא נִבְדַּק',
  checkFirst: 'קֹדֶם בִּדְקוּ אֶת כָּל אַרְבַּעַת הַשְּׁלָבִים.',
  /** Name lookup: the address book's caption and column headings (visible, read by screen readers, not spoken). */
  book: 'סֵפֶר הַכְּתֹבוֹת',
  bookName: 'שֵׁם',
  bookAddress: 'כְּתֹבֶת',
} as const
