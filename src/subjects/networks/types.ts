import type { PickQ } from '../../ui/pick/types'

// Content shapes and question types for the networks island (docs/specs/networks.md, T0).

export type Shape = 'circle' | 'triangle' | 'square' | 'star'

/** A simulated address: a shape (the "street", always drawn with its own color) and a number 1–9. */
export interface Address {
  shape: Shape
  n: number
}

/** Delivery: the envelope shows an address; the answer is the id (`addressId`) of the computer with that address. */
export type DeliveryQ = PickQ
