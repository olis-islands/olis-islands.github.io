import type { Question } from '../../core/engine/types'
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

/** A place in the address book: a noun and a descriptor id (content/lookup.ts). */
export interface Place { noun: string; kind: string }
/** Name lookup: the answer is the place's address, as text. */
export type DnsQ = PickQ
/** Web request: the answer is the requested page's topic id, or 'not-found'. */
export type WebQ = PickQ

/** Route: a choice (A, B, C, next to the crossroads), a middle stop (X, Y, Z) or the destination computer (D). */
export type RouteNode = 'A' | 'B' | 'C' | 'X' | 'Y' | 'Z' | 'D'
/** A bridge on the map: absent, open or closed. */
export type BridgeState = 'none' | 'open' | 'closed'
/** A route board: the state of every possible bridge (in ROUTE_EDGES order) and the shape that names each choice. */
export interface RouteBoard { bridges: readonly BridgeState[]; names: Readonly<Record<'A' | 'B' | 'C', Shape>> }
/** Route: the answer is the choice's shape id. */
export type RouteQ = PickQ

/** Locked message: what the one who sees the box can know (locked or open box), or who can open a locked box. */
export type PrivacyKind = 'locked' | 'open' | 'opens'
/** `after`: lines shown and said after a right answer, which the child confirms before the round goes on. */
export interface PrivacyQ extends PickQ { after?: readonly string[] }

/** Detective: the four stages a page request goes through. */
export type Stage = 'lookup' | 'route' | 'gate' | 'library'
/**
 * Detective: four checks, each with its evidence phrase (in `evidence`, by stage); the answer is the stage that fails.
 * Answer buttons count only after all four checks were made.
 */
export interface DetectiveQ extends Question<Stage> {
  instruction: string
  hint: string
  evidence: Readonly<Record<Stage, string>>
}
