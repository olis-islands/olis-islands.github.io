import type { Shape } from '../types'

// Delivery addresses (docs/specs/networks.md, game 1). Each shape always has its own color, so color is never
// the only cue. Names match the thinking island's shapes letter for letter (shared recordings).

export interface ShapeInfo {
  id: Shape
  name: string
  /** Theme token of the shape's fill. */
  color: string
}

export const SHAPES: readonly ShapeInfo[] = [
  { id: 'circle', name: 'עִגּוּל', color: '--read' },
  { id: 'triangle', name: 'מְשֻׁלָּשׁ', color: '--eng' },
  { id: 'square', name: 'רִבּוּעַ', color: '--num' },
  { id: 'star', name: 'כּוֹכָב', color: '--sun' },
]

/** Feminine counting forms, as the math island says them. */
export const NUMBER_NAMES = ['אַחַת', 'שְׁתַּיִם', 'שָׁלוֹשׁ', 'אַרְבַּע', 'חָמֵשׁ', 'שֵׁשׁ', 'שֶׁבַע', 'שְׁמוֹנֶה', 'תֵּשַׁע'] as const

/** House numbers 1–9: one digit, readable in grade 1. */
export const NUMBERS: readonly number[] = NUMBER_NAMES.map((_, i) => i + 1)
