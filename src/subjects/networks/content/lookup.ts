// Name lookup (DNS) and web request content (docs/specs/networks.md, games 6 and 7). Invented places and page
// topics only: no real services, domains or addresses.

/** A place name is a noun in construct form plus a descriptor: "סִפְרִיַּת" + "הַיָּרֵחַ". `plain`: no nikud, for parents. */
export interface Word { id: string; he: string; plain: string }

export const PLACE_NOUNS: readonly Word[] = [
  { id: 'library', he: 'סִפְרִיַּת', plain: 'ספריית' },
  { id: 'tower', he: 'מִגְדַּל', plain: 'מגדל' },
  { id: 'garden', he: 'גַּן', plain: 'גן' },
  { id: 'shop', he: 'חֲנוּת', plain: 'חנות' },
]

export const PLACE_KINDS: readonly Word[] = [
  { id: 'moon', he: 'הַיָּרֵחַ', plain: 'הירח' },
  { id: 'sun', he: 'הַשֶּׁמֶשׁ', plain: 'השמש' },
  { id: 'stars', he: 'הַכּוֹכָבִים', plain: 'הכוכבים' },
  { id: 'sea', he: 'הַיָּם', plain: 'הים' },
]

/**
 * Each place's simulated address (a simplified two-digit number): fixed, so a due review asks the same address again.
 * All distinct, and none is another's digit reversal (14 and 41), which would test digit order instead of lookup.
 */
export const PLACE_ADDRESS: Readonly<Record<string, number>> = {
  'library-moon': 12, 'library-sun': 13, 'library-stars': 15, 'library-sea': 16,
  'tower-moon': 17, 'tower-sun': 19, 'tower-stars': 23, 'tower-sea': 24,
  'garden-moon': 26, 'garden-sun': 28, 'garden-stars': 29, 'garden-sea': 34,
  'shop-moon': 35, 'shop-sun': 37, 'shop-stars': 38, 'shop-sea': 47,
}

/** Page topics, in families of three look-alikes, so a near miss is plausible. Each follows "דַּף עַל". */
export interface Topic extends Word { emoji: string; family: string }
export const TOPICS: readonly Topic[] = [
  { id: 'turtles', he: 'צָבִים', plain: 'צבים', emoji: '🐢', family: 'animals' },
  { id: 'fish', he: 'דָּגִים', plain: 'דגים', emoji: '🐠', family: 'animals' },
  { id: 'frogs', he: 'צְפַרְדְּעִים', plain: 'צפרדעים', emoji: '🐸', family: 'animals' },
  { id: 'planets', he: 'כּוֹכְבֵי לֶכֶת', plain: 'כוכבי לכת', emoji: '🪐', family: 'space' },
  { id: 'rockets', he: 'רָקֵטוֹת', plain: 'רקטות', emoji: '🚀', family: 'space' },
  { id: 'moon', he: 'הַיָּרֵחַ', plain: 'הירח', emoji: '🌙', family: 'space' },
  { id: 'cakes', he: 'עוּגוֹת', plain: 'עוגות', emoji: '🍰', family: 'food' },
  { id: 'pizza', he: 'פִּיצָה', plain: 'פיצה', emoji: '🍕', family: 'food' },
  { id: 'icecream', he: 'גְּלִידָה', plain: 'גלידה', emoji: '🍦', family: 'food' },
  { id: 'volcanoes', he: 'הָרֵי גַּעַשׁ', plain: 'הרי געש', emoji: '🌋', family: 'nature' },
  { id: 'forests', he: 'יְעָרוֹת', plain: 'יערות', emoji: '🌲', family: 'nature' },
  { id: 'sea', he: 'הַיָּם', plain: 'הים', emoji: '🌊', family: 'nature' },
]
