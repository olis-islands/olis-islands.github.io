import type { PickQ } from '../../ui/pick/types'
import type { OrderQ } from '../reading/types'

// Content shapes and question types for the networks island (docs/specs/networks.md, T0).

export type Shape = 'circle' | 'triangle' | 'square' | 'star'

/** A simulated address: a shape (the "street", always drawn with its own color) and a number 1–9. */
export interface Address {
  shape: Shape
  n: number
}

/** Delivery: the envelope shows an address; the answer is the id (`addressId`) of the computer with that address. */
export type DeliveryQ = PickQ

/** Packets: numbered packets arrive in some order (the tray order); the answer is their ids from 1 up. */
export type PacketsQ = OrderQ

/** Retry: the computer waited for packets 1…total and one is missing; the answer is the missing number as text. */
export type RetryQ = PickQ

/** A firewall rule: let in only packets whose receiver/sender is `shape` (allow…), or stop them (block…). */
export type RuleKind = 'allowTo' | 'allowFrom' | 'blockTo' | 'blockFrom'
export interface GateRule { kind: RuleKind; shape: Shape }
/** A packet's visible labels: who sent it and who should receive it (never the same computer). */
export interface Packet { from: Shape; to: Shape }

/** Firewall: one rule and one packet; the answer is 'allow' or 'block'. */
export type FirewallQ = PickQ
