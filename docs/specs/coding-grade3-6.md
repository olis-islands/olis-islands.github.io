# Spec: Coding island expansion, grades 3–6

- **Status: DRAFT — discussion only.** The user has not supplied their ideas or approved this design.
- **Stage:** 8b, extending `docs/specs/coding.md` and the existing `coding` island, not a new island.
- **Gate:** discuss and revise this draft with the user; obtain explicit approval before T0 or any game
  implementation. The roadmap also calls for the Oli-help pilot and Stage 8a user play-test first.
- **Relies on:** D2, D3, D6, D7, D19 and D23; `docs/RESEARCH.md` § Computer science, elementary.
  Everything below is a proposal, including grades, names, mechanics, scope and tasks.

## Goal

Offer children in grades 3–6 short, playful ways to predict, build, test and repair algorithms, building
on the Stage 8a arrow and repeat games. Use familiar visual instructions, gradual challenge and original
art; do not require typing code. The goal is understanding, not a speed test.

## Curriculum basis and limits

The ministry's [elementary computer-science and robotics page](https://pop.education.gov.il/tchumey_daat/computer-science-software-engineering-cyber/elementary/pedagogy-of/software-cyber-engineering-elementary/)
labels its [June 2021 curriculum](https://meyda.education.gov.il/files/CSIT/Elemetray-June2021-Ver2.pdf)
**grades 4–6**. PDF page 2 lists grade 4 algorithms, movement, events, loops and conditions; grade 5
variables and condition combinations; grade 6 expanded loops and modular blocks. PDF pp.19, 29, 42–51,
59–68 and 121–128 provide detail (printed page numbers are one lower). Grade 3 below is a proposed
bridge, not a verified ministry grade-3 requirement. The grade labels are app recommendations, not
claims that the ministry mandates this exact sequence.

Binary, sorting, searching and shortest-path challenges were named as future ideas in the original spec
or roadmap; the checked curriculum does **not establish them as named requirements**. Treat them as
optional enrichment until separately sourced and approved. Do not copy curriculum exercises or product assets.

## Proposed skills

Titles below are English design labels, **not final child-facing text**. IDs, stickers and dependencies
are placeholders for discussion. Soft locks apply (D19): prerequisites guide recommendations, not access.

| ID | Proposed title | Grade | Requires | Sticker | Game | Basis |
|---|---|---:|---|---|---|---|
| `code.facing` | Facing and turns | 3 | `code.arrows` | 🧭 | Compass delivery | App bridge; grade 4 movement: PDF pp.20–29 |
| `code.events` | When something happens | 4 | `code.facing` | 🔔 | Signal station | Grade 4 events: PDF pp.19, 26–29 |
| `code.conditions` | Choose by a condition | 4 | `code.facing` | 🌤️ | Weather workshop | Grade 4 if / if-else: PDF pp.42–51 |
| `code.variables` | Values that change | 5 | `code.conditions` | 🎒 | Treasure counter | Grade 5 variables: PDF pp.59–68 |
| `code.functions` | Reusable blocks | 6 | `code.repeat` | 🧩 | Shortcut studio | Grade 6 modular blocks: PDF pp.121–128 |
| `code.binary` | Lights and numbers | 6 | — | 💡 | Signal lights | Optional enrichment; source not established |
| `code.sort` | Order by comparison | 6 | — | ⚖️ | Balance shelf | Optional enrichment; source not established |
| `code.search` | Narrow a search | 6 | `code.sort` | 🔎 | Mystery shelf | Optional enrichment; source not established |

Possible shortest-path exploration is a separate open choice, not an additional committed skill.
These skills need not all ship; user ideas may replace or change any of them.

## Proposed games and acceptance rules

All rounds default to six questions unless the final spec chooses otherwise. Instructions and hints have
replayable phrase IDs; missing recordings fall back to the existing Hebrew voice. On a miss, report
`onAttempt(false)`, keep the problem available, give gentle feedback and allow another try. After two
consecutive misses, show a clue without exposing the answer. Correct submissions call `onAttempt(true)`
once. Everything supports mouse, touch and keyboard; clickable controls are named buttons, targets at
least 64px. Respect reduced motion, RTL, dark mode and 390px. Boards and program strips are LTR.

| Game | See, hear, do; correct result | Typical misunderstanding / aid | `itemKey`; review |
|---|---|---|---|
| Compass delivery | A facing marker, goal and blocks for forward, left and right. Build, run and edit; any program that ends at the goal without a collision is correct. | Confuse board-left with Oli's left. Aid marks current facing, not the route. | `facing:<board-id>`; yes |
| Signal station | Select which one of 2–3 short actions runs for a shown button or signal. Correct when the action attached to that event is chosen. | Mix up signal and action. Aid highlights the incoming signal. | `event:<scenario-id>`; yes |
| Weather workshop | A condition and two branches; select or build a response to each of two visible weather states. Correct only if both states produce their specified safe outcomes. | Always run one branch or reverse the condition. Aid identifies the condition being tested. | `condition:<scenario-id>`; yes |
| Treasure counter | See a starting count and 2–4 collect/use actions; choose the final count or repair one update. Correct when it matches the full trace; no negative totals. | Treat change as replacement or forget the starting value. Aid shows the first update. | `variable:<scenario-id>`; yes |
| Shortcut studio | Define one reusable sequence of 2–3 moves and call it in a path. Run to the goal; any valid solution using the block at least twice succeeds. | Confuse defining a block with running it. Aid highlights calls as they execute. | `function:<board-id>`; yes |
| Signal lights | Four on/off place cards worth 1, 2, 4 and 8; represent a target 0–15. Correct when the sum of lit cards equals the target. | Count lit cards instead of their values. Aid labels card values; do not reveal the combination. | `binary:<target>`; yes |
| Balance shelf | Compare up to five distinct weighted objects on a balance and order them from lightest to heaviest. Correct when the full order matches their weights. | Infer weight from appearance or compare without transitivity. Aid reminds the child how the balance moves. | `sort:<scenario-id>`; yes |
| Mystery shelf | Search 7 boxes known to contain distinct numbers in ascending order, with contents hidden until selected. A selected box reveals its number and higher/lower feedback; correct on finding the shown target. A comparison-count challenge is optional, not needed to pass. | Discard the wrong half. Aid marks the still-possible range after a clue only when at least two boxes remain; otherwise give a general reminder. | `search:<scenario-id>`; yes |

All item keys identify stable content, not answer positions; generators must honor `avoid` and `review`.
An accepted review key regenerates the same underlying fact or scenario. Distractors must be distinct,
plausible and never also correct. Do not reward just tapping through without applying the skill.

## Experience and technical considerations

- Reuse `PickGame`, `OrderGame`, existing audio and board artwork where suitable. `ProgramGame` and
  `program.ts` currently support absolute arrow moves and fixed repeat cards, not facing, branches,
  state, events or callable blocks. Any new interpreter and editor are **proposals**, not existing APIs.
- If approved, keep the old `run` semantics and saved item keys compatible. A separate bounded interpreter
  can model position, facing, counter, condition and calls. Clearly define stopping, collision and goal
  semantics, cap steps/call depth, and test that the displayed trace and verdict agree. No unbounded loops.
- Avoid revealing a target through accessibility labels, art, hints or sounds. Use original artwork and
  full Hebrew nikud. Events and scenarios are local and deterministic; no network, accounts or sharing.
- A single successful example is insufficient to validate a condition: test both stated states. For
  functions, test each call in its actual context and allow equivalent correct programs, unless a
  specific requirement is visible to the child.

## Phrases and content

Final Hebrew titles, instructions, hints, feedback and accessible names are **not yet written or approved**.
Reserve `code.q.*`, `code.hint.*` and `code.ui.*` IDs, checking existing IDs before assigning them.
Record a single instruction for each approved mechanic and short reusable labels; browser TTS remains a
fallback (D3). Recording count is **unknown until scope and content are approved**, not a commitment.
Full Hebrew grammar, gender and nikud review, including the Academy audit when applicable, is required.

Proposed original data: `content/advanced-boards.ts` (facing and reusable-block boards),
`content/advanced-scenarios.ts` (events, conditions and counters), and
`content/advanced-puzzles.ts` (binary, sorting and searching). Use stable IDs and at least 12
reviewed items per approved scenario-based mechanic; the binary exercise may use the complete 0–15
domain. Explicitly document any smaller domain and why. Every board must be solvable through its UI.

## Acceptance criteria — to finalize with the user

- Pure simulator tests: turn/facing in all orientations, boundary/wall behavior, event triggers,
  true/false branches, counter transitions, definition versus repeated calls, execution caps, and
  trace/verdict agreement. Existing Stage 8a tests and behavior must remain unchanged.
- Each generator: at least 200 seeds or the full finite domain; reachable answers, no duplicate or
  alternative correct distractors, phrase IDs exist, `avoid` and `review` honored. Exhaust binary
  0–15; prove sorted ordering, search range updates and scenario/board solvability.
- Component tests: keyboard and touch-equivalent button actions, run/edit/retry, accessible names,
  one success report, no answer leakage, and reduced-motion behavior.
- `e2e/coding-advanced.spec.ts`: full real-UI rounds for each approved mechanic; include a wrong attempt,
  hint, keyboard-only run, reload and existing Stage 8a regression. Review every child-facing item.
- Run `npm run check` and `npm run e2e` twice; inspect every new screen/state at 1280×860 and 390px in
  light and dark mode, plus reduced motion. Check studio lists all new phrases. User play-test remains
  the final acceptance gate.

## Proposed task split — not authorization to build

File ownership is tentative and must be reconfirmed after scope and contracts are approved. Parallel
tasks never share files. Shared core/UI needs, if any, are planner-owned and must be defined and tested
in T0 before builders begin; no dependencies on unmerged wiring.

| Task | Owner | Exact files | Inputs / dependencies |
|---|---|---|---|
| T0 | Planner | `src/subjects/coding/advanced-types.ts`, `src/subjects/coding/advanced-ids.ts`, `src/subjects/coding/advanced-program.ts`, `src/subjects/coding/advanced-program.test.ts` | Approved spec, 8a play-test; define contracts and bounded simulator first |
| T1 | Content | `src/subjects/coding/content/advanced-boards.ts`, `src/subjects/coding/content/advanced-scenarios.ts`, `src/subjects/coding/content/advanced-puzzles.ts`, `src/subjects/coding/advanced-phrases.ts`, `src/subjects/coding/advanced-content.test.ts` | T0 contracts; original reviewed content and phrase map |
| T2 | Builder | `src/subjects/coding/advanced-generators.ts`, `src/subjects/coding/advanced-generators.test.ts`, `src/subjects/coding/advanced-art.tsx` | T0 contracts; consume T1 data through fixed interfaces |
| T3 | Builder | `src/subjects/coding/games-advanced.tsx`, `src/subjects/coding/games-advanced.test.tsx`, `src/subjects/coding/advanced.css` | T0 contracts and simulator; no imports from unmerged T1/T2 |
| T4 | Planner + reviewer | `src/subjects/coding/index.ts`, `src/subjects/coding/phrases.ts`, `e2e/coding-advanced.spec.ts`, `CLAUDE.md`, `docs/ROADMAP.md`, `docs/specs/coding-grade3-6.md` | T1–T3 merged and checked; integration, full review, E2E and screenshots |

If shared contracts need `src/core/**` or `src/ui/**`, specify the exact files and tests in a revised
T0 before approval; update architecture when changed. T1–T3 run at most three at once in isolated
worktrees, from the T0 base. Their briefs must use `docs/FEATURE-GUIDE.md`.

## Out of scope in this proposal

Text programming languages, online sharing, network calls and user-generated uploads. Timers, external
services, complex robot hardware and changes to existing 8a content are not proposed. No extension of
Oli help is assumed; the existing clock pilot remains separate.

## Open decisions for the user

1. What are your game ideas, themes or learning goals? Which proposed games should change or disappear?
2. One grade at a time or a combined 3–6 release? Is grade 3 a gentle bridge or should it start later?
3. Mostly Oli on grids, varied worlds, or a mixture? Should children create freely or solve short puzzles?
4. Include binary, sorting, searching or shortest paths as optional enrichment, or defer them?
5. Are visual blocks without typed code right for all grades? What instruction/recording burden is acceptable?
6. Should functions stay in grade 6 as the ministry's modular-block sequence suggests, or appear earlier as
   an app-specific introduction?

No answer is presumed. Revise this draft, verify curriculum claims and request explicit approval before
implementation; a draft PR is not spec approval.
