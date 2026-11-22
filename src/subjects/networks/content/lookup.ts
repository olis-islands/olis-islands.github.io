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

/** Each place's simulated address: fixed, so a due review asks the same address again. Two digits, all distinct. */
export const PLACE_ADDRESS: Readonly<Record<string, number>> = {
  'library-moon': 14, 'library-sun': 41, 'library-stars': 27, 'library-sea': 63,
  'tower-moon': 36, 'tower-sun': 18, 'tower-stars': 72, 'tower-sea': 45,
  'garden-moon': 52, 'garden-sun': 25, 'garden-stars': 81, 'garden-sea': 39,
  'shop-moon': 67, 'shop-sun': 76, 'shop-stars': 58, 'shop-sea': 93,
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
