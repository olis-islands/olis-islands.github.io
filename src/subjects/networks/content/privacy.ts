// Locked message (grade 6), docs/specs/networks.md game 8. A simplified privacy metaphor: a locked box hides what is
// inside, not where it goes, and only the key holder can open it. Not a description of real encryption or TLS.
// Invented animal characters; no real people, messages or passwords. All text needs content review.

/** A character: emoji, name ("הַצָּב") and its form after "to" ("לַצָּב"). */
export interface Animal { id: string; emoji: string; name: string; to: string }

export const ANIMALS: Readonly<Record<string, Animal>> = {
  fox: { id: 'fox', emoji: '🦊', name: 'הַשּׁוּעָל', to: 'לַשּׁוּעָל' },
  turtle: { id: 'turtle', emoji: '🐢', name: 'הַצָּב', to: 'לַצָּב' },
  raccoon: { id: 'raccoon', emoji: '🦝', name: 'הָרָקוּן', to: 'לָרָקוּן' },
  rabbit: { id: 'rabbit', emoji: '🐰', name: 'הָאַרְנָב', to: 'לָאַרְנָב' },
  hedgehog: { id: 'hedgehog', emoji: '🦔', name: 'הַקִּפּוֹד', to: 'לַקִּפּוֹד' },
  monkey: { id: 'monkey', emoji: '🐒', name: 'הַקּוֹף', to: 'לַקּוֹף' },
  bear: { id: 'bear', emoji: '🐻', name: 'הַדֹּב', to: 'לַדֹּב' },
  elephant: { id: 'elephant', emoji: '🐘', name: 'הַפִּיל', to: 'לַפִּיל' },
  mouse: { id: 'mouse', emoji: '🐭', name: 'הָעַכְבָּר', to: 'לָעַכְבָּר' },
  cat: { id: 'cat', emoji: '🐱', name: 'הֶחָתוּל', to: 'לֶחָתוּל' },
  dog: { id: 'dog', emoji: '🐶', name: 'הַכֶּלֶב', to: 'לַכֶּלֶב' },
  horse: { id: 'horse', emoji: '🐴', name: 'הַסּוּס', to: 'לַסּוּס' },
}

/** Who sends, who receives (and holds the key), who sees the box on the way. */
export interface Trio { id: string; sender: string; recipient: string; observer: string }
export const TRIOS: readonly Trio[] = [
  { id: 't1', sender: 'fox', recipient: 'turtle', observer: 'raccoon' },
  { id: 't2', sender: 'rabbit', recipient: 'hedgehog', observer: 'monkey' },
  { id: 't3', sender: 'bear', recipient: 'elephant', observer: 'mouse' },
  { id: 't4', sender: 'cat', recipient: 'dog', observer: 'horse' },
]
