# Spec: Parent accounts, sync and usage data

- **Status:** Draft, awaiting user approval
- **Stage:** 9 (docs/ROADMAP.md)
- **Relies on:** DECISIONS D27 (replaces D2), D18 (parents' page), D19 (soft locks), D23 (sprints)

## Goal

Before the beta ships, the owner needs real usage numbers (who is active, who returns, which games interest children)
and parents need their child's progress on every device. A parent signs in once; their children's progress is stored
on the device first and synced to a managed backend. Playing never needs a network.

## Decisions already taken (D27 and the design debate)

- Verified email code sign-in; ownership by account ID. Guest first, sign-in offered later.
- Server holds an append-only **event log**; the device shows progress computed from that log.
- Reset erases everything before it on every device (the reset screen says so). Stickers and mastery never disappear.
- Any round or sprint counts toward "active". Beta progress is reset; no migration.

## Data model (server)

| Table | Columns | Notes |
|---|---|---|
| `profiles` | `id`, `owner_id` (default the signed-in account), `nickname`, `avatar`, `grade`, `auto_speak`, `updated_at` | `unique(id, owner_id)`; deleting an account deletes its profiles |
| `events` | `owner_id` (default the account), `id` (made on the device), `seq` (identity), `profile_id`, `kind` (`play`, `known`, `reset`), `at`, `payload` (< 4 KB), `received_at` | primary key `(owner_id, id)`; foreign key `(profile_id, owner_id)` to `profiles` |
| `consents` | `owner_id`, `accepted_at`, `policy_version` | one row per parent |

- A trigger limits an account to 8 profiles and 50,000 events. A future `at` is clamped to `received_at`.
- The `payload` of a `play` event is the existing round or sprint summary (`RoundSummary`, `SprintSummary`); `known` carries `{skillId, known}`.

## Access rules

- Every migration starts by revoking all rights from `anon`, `public` and `authenticated`, and revoking default rights for future tables. Rights are then granted one by one.
- Row-level security is on for every table; every policy is for signed-in users only and compares `owner_id` with the signed-in account.
- `profiles`: select, insert, delete; update only on `nickname`, `avatar`, `grade`, `auto_speak`, `updated_at` (policy checks old and new row).
- `events`: select and insert only. Events cannot be changed or deleted by the app; they disappear only when their profile or account is deleted.
- The app never sends `owner_id`; column-level insert rights exclude it. A profile ID that belongs to someone else fails the foreign key.
- The only function the app calls is `delete_my_account()`. Execute right is removed from everyone except signed-in users.
- The browser holds only the public key. No secret or service key in the repository or the bundle.
- A parent can create false events for their own children. Statistics are therefore not tamper-proof (accepted).

## Device storage and sync

- **One IndexedDB key per profile** holds `{events, progress}` and is written in one transaction: the new event, its "not yet uploaded" mark, and the progress cache are saved together. Keys are namespaced by account (`u:<account>:…`) or `guest`.
- `store.ts` stays the only module that touches storage. Sync code is called from it.
- **Event ID** is made once when the round is played and never changes on retry. The server rejects duplicates.
- **Upload:** after each save and when the device comes back online, in batches of 50. An event is marked uploaded only after the server confirms its ID (a bare "ok" is not enough). Retry with waiting from 2 seconds to 5 minutes. A permanent refusal keeps the event, marks it rejected and shows a count; it is included in the parent's export.
- **Download:** on sign-in, when a profile is opened, when the tab becomes visible, when back online, and a full re-download per profile on sign-in and once a day. Events are paged by `seq`. Sync is eventually consistent, not instant.
- **Cache:** progress is recomputed from the log only when an event arrives that sorts before the newest one; adding the newest event is incremental. No compaction in v1; revisit above 5,000 events per profile.
- The device replaces its own time with the server's stored time once an event is confirmed.

## Merge rule

Sort all events by `(stored time, id)` and replay them with the existing `applyRound`, `applySprint` and `markKnown`. A `reset` event clears the result, so only later events count.

| Field | Rule |
|---|---|
| Stars total | sum of rounds |
| Best stars, sprint records | maximum |
| Leitner box and due time | replayed in order (the box depends on order, so "highest" or "newest snapshot" would be wrong) |
| Mastered, stickers | from the replay, plus everything already earned on this device (only grows) |
| Parent's "already knows this" | replayed in order with rounds |

**Example.** At 10:00 the server has skill S with one 5/6 round, 10 stars, and item א in box 2. Offline device A plays at 10:05 a 6/6 round (3 stars), א right first time. Offline device B plays at 10:10 a 2/6 round (1 star), א missed. After both sync, every device shows: א box 2 → 3 → 0, S mastered with its sticker, 14 stars, best 3.
If a parent resets on device C at 10:07, A's round and the earlier base are erased; only B's remain: 1 star, א box 0, S not mastered.

## Guest mode

- A new device is a guest: profiles and events stay in the `guest` namespace and nothing is uploaded. Guest play does not appear in usage statistics.
- The parents' area offers "save progress on all devices" with sign-in.
- After the first sign-in the parent sees "Add this device's children to your account?". Only on yes are guest children and events uploaded under that account (event IDs stay). Then the guest data is removed from the device. On no it stays local.
- Guest data is never uploaded silently and never to a second account.

## Shared devices and sign-out

- Each account has its own local data and its own waiting uploads. Waiting data is never sent under another account.
- Sign-out with unsynced play offers: "Sync now" (needs internet), "Sign out and keep data on this device" (uploaded only if the same account signs in again), or "Remove from this device" (asks to confirm; this discards waiting events). With nothing waiting, the account's local data is wiped.
- Old unprefixed local data (`profiles`, `progress:*`, `lastProfile`) is deleted on first start of this version (beta reset). The last-used profile is remembered per account.
- Backup import is removed. Export is rebuilt from the event log.
- A signed-in device is treated as signed in while offline, even with an expired token; sync resumes when a refresh succeeds. The app waits for sign-in state to load before reading profiles.
- The service worker never caches the backend's address (especially sign-in responses).

## Usage statistics

Computed on the server from `received_at` (not the device's clock): daily and weekly active profiles (distinct profile, once each); new versus returning; return after 1, 7 and 30 days; rounds started and finished per game and skill; skills with many misses; session length and drop-off, where a session ends after 30 minutes without events. The queries live in `docs/` as SQL and run in the backend's dashboard, never from the app.

## What we promise, and what we don't

- **Promised:** a round is saved on the device together with its upload mark; it uploads once when the device is online and browser data survives; no duplicates; one family cannot read or change another's data (tested).
- **Not promised:** that a round survives clearing browser data, private browsing, the browser removing storage before upload (reduced by asking for persistent storage), or a very long time offline; "Remove from this device"; rounds played offline before a reset made on another device.
- Guests who never sign in give no data. Count how many parents tap the sign-in offer on the device (a local number, uploaded after sign-in).

## Before public launch (owner and lawyer, not code)

1. Privacy policy and consent wording; Israel's privacy law amendment for minors' data, and GDPR-style rules if users are abroad; data retention.
2. Email provider (the backend's built-in sender is far too limited) with a proper sender domain.
3. Region and data residency; a plan that does not pause inactive projects and keeps backups; who monitors it.
4. Account deletion: immediate or with a grace period.

## Acceptance criteria

- Guest play makes no network call. Claiming guest children uploads once; "no" keeps them local; they never reach a second account.
- **Fold tests:** the same events in every order give the same progress; the two-device example above; reset with later events; "already knows this" and undo between rounds; the 20-round window; duplicate IDs; progress computed on the device equals progress computed in server order; stickers never disappear after a late event.
- **Offline tests:** a failure in the middle of saving leaves either both the event and its mark or neither; retry timing; a crash between saving and uploading still uploads later.
- **Access-rule tests** (local backend, two real accounts): account A cannot read, create, change or delete B's profiles or events, including by changing IDs in a request; a forged `owner_id` fails; B's `profile_id` with A's `owner_id` fails; changing `id` or `owner_id` of a profile fails; the owner cannot change or delete an event; anonymous users can do nothing; every public table has row-level security on and no table has stray rights, including future ones; a repeated event ID changes nothing; `delete_my_account` deletes only the caller.
- **E2E:** sign in with a code against the local test inbox; play offline then sync to a second browser; close the tab in the middle of saving; two offline browsers merge to the expected numbers; sign out with waiting data and sign in as another account, nothing is uploaded; the backend's sign-in responses are never cached.
- `npm run check` and `npm run e2e` green; screenshots (desktop and 390px, light and dark) of the sign-in, consent, claim and sign-out screens.

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 | Event types, fold, per-profile log in `store.ts`, guest namespace, tests (offline only, no network) | planner | `src/core/progress/`, `src/core/storage/` | approval |
| T1 | Backend schema, access rules, access-rule tests, SQL for statistics | planner | `supabase/`, `docs/` | approval and dependency approval |
| T2 | Sign-in, sync engine, outbox, service-worker rule | planner | `src/core/sync/`, `vite.config.ts` | T0, T1 |
| T3 | Parents' area: sign-in, consent, claim, sign-out, export, delete account | planner | `src/app/parents/` | T2 |
| T4 | Daily summary email and feedback links | planner | later spec | T2 |

All touch shared code, so the planner does them; builders are not used.

## Out of scope

Daily summary email and feedback links (T4, later spec); live sync between open devices; compaction of old events; backup import; child-facing sign-in; any analytics service other than the backend's own database.
