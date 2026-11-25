# Roadmap

Work stages, in order. Each stage ends with a demo the user plays and approves.
Status legend: ⬜ not started · 🟡 in progress · ✅ done.
Update this file (and the "Current state" table in `CLAUDE.md`) whenever a stage or task changes status.

## Stage 0 – Foundation ✅

Sequential, done by the planner alone, because it defines the contracts builders depend on.

| Task | Status | Output |
|---|---|---|
| Process docs | ✅ | `CLAUDE.md`, `docs/PLAYBOOK.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `RESEARCH.md`, `specs/TEMPLATE.md`, `.claude/agents/` |
| Move legacy prototype out of the root | ✅ | `legacy/` |
| Tooling: Vite + React + TS strict, ESLint, Vitest, Playwright, PWA | ✅ | config files, `npm run check`, `npm run e2e` |
| Core contracts and round engine | ✅ | `src/core/engine/` |
| Profiles + progress storage (IndexedDB) | ✅ | `src/core/storage/`, `src/core/progress/` |
| Audio: recording by phrase ID with TTS fallback, SFX | ✅ | `src/core/audio/` |
| Adaptive aid + mastery + Leitner review | ✅ | `src/core/adaptive/` |
| Theme tokens, owl mascot, world map, sticker book | ✅ | `src/ui/`, `src/app/screens/` |
| Island self-registration | ✅ | `src/app/islands.ts` |

## Stage 1 – Clock island (MVP) 🟡

| Task | Status |
|---|---|
| Spec `docs/specs/clock.md` | ✅ |
| SVG clock: draggable hands (mouse, touch, keyboard), snapping, visual aids, ghost hands | ✅ |
| `timePhrase` / spoken Hebrew times from 74 building blocks | ✅ |
| 7 skills, 5 games (hands, read, set, match, owl's day) | ✅ |
| Recording studio (dev-only, `#/studio`) | ✅ |
| Unit tests (19) and E2E tests (2) | ✅ |
| User play-test and approval | ⏳ |
| User records the 91 phrases | ⏳ |
| Merge to `main` | ✅ PR #1 |
| Delete `legacy/`, deploy to GitHub Pages | ⏳ needs user approval |

## Stage 2 – Hebrew: letters (kindergarten – 1st grade) ✅ built
Spec approved 2026-10-29: `docs/specs/hebrew-letters.md`. T0 ✅ · T1 content ✅ · T2 generators ✅ · T3 games ✅ (built in parallel) · T4 wiring + E2E + screenshots ✅ · user play-test ⏳ · 324 recordings ⏳.

Letter ↔ picture, opening/closing sound, rhyme and syllables, final letters, same-sound letters,
dagesh pairs, letter tracing with hand-authored SVG stroke paths.

## Stage 2b – Letter tracing ⬜
Print letters first (D13); cursive later. Needs hand-authored stroke paths for 27 forms (no official chart exists).

## Stage 3 – Hebrew: nikud and reading (1st – 2nd grade) ✅ built
Spec approved 2026-10-29: `docs/specs/reading.md`. T0 ✅ · T1 content ✅ (full Hebrew review, 25 findings fixed) · T2 ✅ · T3 ✅ · T4 wiring + E2E + screenshots ✅ · user play-test ⏳ · recordings ⏳.

Configurable vowel order, letter+vowel syllables, blending into words, reading words and sentences
with pictures, dictation by dragging letters.
**Read-along books:** a book is split into pages; each page is recorded in the studio (page-level recording
mode) and words are highlighted while the page is read. Needs a long-recording mode and word timings in the studio.

## Stage 4 – Math: kindergarten – 1st grade ✅ built
Spec approved 2026-11-01 for skills 1–10: `docs/specs/math-k2.md`. T0 ✅ · T1 content ✅ · T2 ✅ · T3a ✅ · T3b ✅ (four in parallel) · T4 wiring + E2E + screenshots ✅ · user play-test ⏳ · recordings ⏳.

## Stage 4b – Math: 2nd grade ✅ built
Spec approved 2026-11-02: `docs/specs/math-grade2.md` (skills 11–17). T0 + T1 ✅ · T2 ✅ · T3 ✅ · T4 wiring + E2E + screenshots ✅ · user play-test ⏳ · recordings ⏳.

## Stage 4c – Thinking island (ages 4–6) ✅ built
Spec approved 2026-11-02: `docs/specs/thinking.md`. T0 ✅ · T1 art ✅ · T2 content ✅ (full review, 26 fixes) · T3 ✅ · T4 ✅ (four in parallel) · T5 wiring + E2E + screenshots ✅ · user play-test ⏳ · recordings ⏳.
Started from the user's son's workbook for ages 4–5. Each idea needs **at least 5–6 examples**, with **original
drawings** suited to the age (SVG illustrations; emoji only where unambiguous). Opens a pre-gan-chova level (age 4).

| Idea | What the child does |
|---|---|
| Odd one out | Find the one that differs — by direction (a figure facing the other way), color, size, shape or kind |
| Symmetry | Match the two halves of a drawing; complete the missing half |
| Patterns | What comes next: AB, AAB, ABC, then growing patterns (●, ●●, ●●●) |
| Identical twin | Find the picture exactly like the sample among very similar ones |
| Spot the difference | Two drawings, find 3–5 differences |
| Shadows | Match an object to its silhouette |
| Sequencing in pictures | Order 3–4 pictures of a process (seed → sprout → flower) |
| Sorting into groups | Fruits / vehicles / animals; then by a rule (color, size) |
| Where is it? | Spatial words: on, under, inside, next to, between (עַל, מִתַּחַת, בְּתוֹךְ, לְיַד, בֵּין) |
| Paths and mazes | Lead a character through a simple maze |
| Memory pairs | Classic turn-two-cards memory game |
| What's missing? | A familiar drawing with a part missing (a chair with three legs) |

## Stage 5 – Math: 3rd – 6th grade 🟡 (D23: 5a grade 3 → 5b → 5c → 5d)
- **5a, grade 3 ✅ built:** spec approved 2026-11-10, `docs/specs/math-grade3.md`. T0 core (sprint rounds, records, numbers to 10,000) ✅ ·
  T1 generators ✅ · T2 games ✅ · T3 art and extensions ✅ · T4 wiring, E2E, screenshots ✅ · user play-test ⏳.
- **5b grade 4 ✅ built and merged** (PR #16): T0 ✅ · T1–T3 ✅ · T4 wiring, E2E, screenshots ✅ · user play-test ⏳.
- **5c grade 5 ✅ built and merged** (PR #17) and **5d grade 6 ✅ built and merged** (PR #18): T0–T4 ✅ · user play-test ⏳.
- **Specs (D24):** specs drafted 2026-11-11 (`math-grade4/5/6.md`), one spec each, from the new curriculum summary in `docs/RESEARCH.md` (fractions start
  in grade 4; decimals in 5; percent, decimal ×/÷ and the mean in 6; ratio is no longer taught).

## Stage 6 – English (mainly 3rd grade and up) ✅ built
Spec approved 2026-11-02: `docs/specs/english.md`. T0 ✅ · T1 content ✅ (full review, 52 findings) · T2 ✅ · T3 wiring + E2E + screenshots ✅ · user play-test ⏳.
Pre-Foundation: listening, ABC, phonics, CVC words; then vocabulary from the ministry's Lexical Bands list.

## Stage 7 – Parents' page ✅ built
Spec approved 2026-11-10: `docs/specs/parents.md`. T0 ✅ · T1 ✅ · T2/T3 practice labels ✅ · T4 E2E + screenshots ✅ · soft locks and "already knows this" (D19) ✅ · user play-test ⏳. Behind a parent gate: per-child summary, island and skill status, what to practise
(from the Leitner queue), settings, deleting or resetting a child, and a backup file for moving to another computer.

## Stage 8a – Coding island: algorithms, kindergarten – 2nd grade ✅ built
Spec approved 2026-11-10: `docs/specs/coding.md`. T0 ✅ · T1 content ✅ (full review, 33 findings) · T2 ✅ · T3 ProgramGame ✅ · T4 wiring + E2E + screenshots ✅ · user play-test ⏳. Story algorithms and finding the bug (unplugged style, kindergarten);
arrow-card programs on a board, debugging and repeat loops (grades 1–2).

## Next priority – Oli's game help 🟡 pilot built

- **Goal:** help children and parents understand what the current game asks and how to use it. Offer a gentle clue for the current exercise without revealing its answer.
- **Experience:** the existing Oli opens one menu with instruction replay and a short, prepared, game-specific FAQ. Questions retain nikud; text-only Hebrew answers omit it. Replay and a simple × close button share a row. No second owl, typing, chat, AI, server, or network calls.
- **Content organization:** each island has one Oli help content file containing entries for its games; do not create a separate help file for each game. The menu shows only the entries relevant to the current game and question.
- **Pilot:** clock-setting games, including hour-only mode. The user approved `docs/specs/oli-help.md`; other clock games, including Oli's day, are outside the pilot.
- **Fairness:** opening or using help does not penalize stars or mastery. Preserve existing automatic aids.
- **Rollout:** user play-tests the pilot; then audit and expand to other games one at a time. The earlier parent-only free-text help idea is deferred.
- **Status:** mapping, spec and approval ✅ · pilot build and verification ✅ · user play-test ⏳ · networks firewall ✅ (owner's choice, 2026-11-22) · other games ⬜.

## Stage 8b – Coding island: grades 3 – 6 ✅ merged
Spec `docs/specs/coding-grade3-6.md` approved 2026-11-16. Eight skills, including binary, sorting and
searching, were merged in PR #20; shortest paths are out. User play-test remains a follow-up.

## Networks island ✅ built (all nine games)
`docs/specs/networks.md`, approved 2026-11-20 (D28): nine offline games for grades 1–6, using international
references as permitted by D26. One PR per game or per two related games.
T0 ✅ · T1d delivery (grade 1) ✅ PR #28 · T2 packets (grade 3) + retry (grade 4) ✅ PR #29 · T3 firewall (grade 4) + Oli's help ✅ PR #30 ·
T4 name lookup + web (grade 5) ✅ PR #32 · T5 route (grade 3) ✅ PR #33 · T6 privacy (grade 6) ✅ PR #34 · T7 detective (grade 6) ✅ built · content review of T1d–T3 ✅ (fixes applied) · user play-test ⏳.

## Future – Suggest another game after five rounds ⬜

After a child has played the same game five times in a row, a pop-up asks whether to switch to another game.
It appears only after the stars of the round are shown. Two big buttons: one goes back to the island, one stays
and plays again. Needs a short spec: where the count lives (per session, not stored), what "in a row" means,
and the spoken phrases (with phrase IDs, so Oli can say it).

## Future – Parent feedback at the end of a session ⬜

Needs design before any building. Questions to settle: when a session ends (leaving a game, closing the app, or a
timeout), where the parent answers (behind the parents' gate, D18), what is asked (a few quick taps, optional), where
the answer is stored (per profile; synced once accounts exist, D27) and how it appears in the usage statistics.
See the stage 9 plan in `docs/specs/accounts-sync.md`.

## Future – Measurement and free quality tools ⬜

Decision needed first: **Google Analytics is not planned** (CLAUDE.md forbids third-party analytics for children, and
its terms bar use on services aimed at children under 13). Usage numbers come from our own events (stage 9, D27).
Free tools to consider, one small task each:
- Accessibility: axe-core inside the Playwright tests (contrast, labels, keyboard); Lighthouse CI on every PR (accessibility, performance, PWA).
- Size and speed: `size-limit` (fails a PR when the bundle grows too much); Web Vitals measured in tests, not sent anywhere.
- Safety: Dependabot (dependency updates) and CodeQL (code scanning), both free on GitHub.
- Look: Playwright screenshot comparison for the first screen and one game per island (light, dark, 390px).
- Errors: a local error log shown on the parents' page; a hosted error service only if it can run without personal data.
- Optional later, self-hosted only: Umami or GoatCounter for page counts, if we ever want numbers from guests (needs the owner's opt-in decision).

## Future – Light/dark theme toggle ⬜

Add a user-facing toggle to choose the light or dark color theme. Both themes already exist and currently follow the device's color-scheme preference; placement and preference behavior need planning before implementation.

From Stage 2 onward the planner writes the spec, the user approves it, and up to three builders work in parallel.
