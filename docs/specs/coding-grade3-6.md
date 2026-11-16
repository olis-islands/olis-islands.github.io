# Spec: Coding island expansion, grades 3–6

- **Status: Approved by user on 2026-11-16; implementation in progress.**
- **Stage:** 8b, extending `docs/specs/coding.md` and the existing `coding` island, not a new island.
- **Gate:** the user explicitly authorized starting immediately, without waiting for the Oli-help pilot
  or Stage 8a play-test. Both play-tests remain follow-ups; implementation and verification must meet
  the acceptance criteria before the PR is marked ready.
- **Relies on:** D2, D3, D6, D7, D19 and D23; `docs/RESEARCH.md` § Computer science, elementary.
  The eight mechanics, listed grade progression and visual blocks are approved working scope.
  Final child-facing wording and technical details remain subject to review.
- **Local progress:** T0 has an initial bounded movement simulator and tests, including the minimum
  two calls for shortcut programs. Its shared contracts still need completing and committing before
  builder work can start. T1–T4 and all playable Stage 8b games remain unimplemented.

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

Rechecked 2026-11-16: PDF p.20 explicitly includes movement, turns and event-triggered scripts;
p.26 describes event activation; p.30 covers fixed-count and forever loops; p.42 describes if and
if/else; p.59 introduces variables and permits starting late in grade 4; p.68 combines variables and
conditions; pp.94 and 121 address extended loops and reusable user blocks. The proposal deliberately
uses only finite runs even though the source also discusses forever loops.

Binary, sorting, searching and shortest-path challenges were named as future ideas in the original spec
or roadmap; the checked curriculum does **not establish them as named requirements**. Treat them as
approved app enrichment, not verified ministry requirements. Shortest paths are out of scope.
Do not copy curriculum exercises or product assets.

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

All eight skills are in the approved implementation scope. Shortest-path exploration is out of scope.

### Approved working learning progression

| Grade | First experience | Next challenge | Bridge and boundary |
|---|---|---|---|
| 3 | Predict facing after one quarter-turn and a forward move; show Oli's direction throughout. | Build a short route and repair one turn; reuse the 8a run–watch–edit rhythm. | New relative turns are explicitly distinguished from the 8a absolute arrows. No new reading of code. |
| 4 | Match one event to its action, then trace one true/false condition. | Construct or repair both branches and test the same rule in both states. | Reinforce existing fixed repeats; the draft does not require the curriculum's forever loops. |
| 5 | Trace a visible count from a starting value through one change. | Two to four changes, then a condition based on the count as a later proposed variant. | Explain old and new values in a worked example or after success; use small nonnegative integers. |
| 6 | Define a short named sequence, then call it twice in different positions. | Compare an expanded trace to the reusable version; binary, comparison sorting and search puzzles. | These are bounded introductions; parameters, recursion and nesting are not proposed. Enrichment is not a ministry requirement claim. |

Within each grade, start with a worked example that is demonstrative rather than scored, followed by
predict → build or repair → test and retry. Skills stay
playable under D19 rather than locked by mastery. Do not silently mix new and old arrow conventions.

## Proposed games and acceptance rules

All rounds default to six questions unless the final spec chooses otherwise. Instructions and hints have
replayable phrase IDs; missing recordings fall back to the existing Hebrew voice. On a miss, report
`onAttempt(false)`, keep the problem available, give gentle feedback and allow another try. The shared
engine turns aid on after two consecutive misses and off after five consecutive first-try successes;
it can therefore remain on across questions. A clue must not expose the answer. Correct submissions call
`onAttempt(true)` once. Everything supports mouse, touch and keyboard; clickable controls are named buttons, targets at
least 64px. Respect reduced motion, RTL, dark mode and 390px. Boards and program strips are LTR.

| Game | See, hear, do; correct result | Typical misunderstanding / aid | `itemKey`; review |
|---|---|---|---|
| Compass delivery | A facing marker, goal and blocks for forward, left and right. Build, run and edit; any program that ends at the goal without a collision is correct. | Confuse board-left with Oli's left. Aid marks current facing, not the route. | `facing:<board-id>`; yes |
| Signal station | Select which one of 2–3 short actions runs for a shown button or signal. Correct when the action attached to that event is chosen. | Mix up signal and action. Aid highlights the incoming signal. | `event:<scenario-id>`; yes |
| Weather workshop | A condition and two branches; select or build a response to each of two visible weather states. Correct only if both states produce their specified safe outcomes. | Always run one branch or reverse the condition. Aid identifies the condition being tested. | `condition:<scenario-id>`; yes |
| Treasure counter | See a starting count and 2–4 collect/use actions; choose the final count. Correct when it matches the full trace; no negative totals. | Treat change as replacement or forget the starting value. Aid explains how one change affects the count. | `variable:<scenario-id>`; yes |
| Shortcut studio | Define one reusable sequence of 2–3 moves and call it in a path. Run to the goal; any valid solution using the block at least twice succeeds. | Confuse defining a block with running it. Aid highlights calls as they execute. | `function:<board-id>`; yes |
| Signal lights | Four on/off place cards worth 1, 2, 4 and 8; represent a target 0–15. Correct when the sum of lit cards equals the target. | Count lit cards instead of their values. Aid labels card values; do not reveal the combination. | `binary:<target>`; yes |
| Balance shelf | Compare up to five distinct weighted objects on a balance and order them from lightest to heaviest. Correct when the full order matches their weights. | Infer weight from appearance or compare without transitivity. Aid reminds the child how the balance moves. | `sort:<scenario-id>`; yes |
| Mystery shelf | Given a target, a sorted row of 7 boxes and one or more already-revealed clues, choose the middle box of the still-possible range for the next comparison. Correct when the selected box is that midpoint. | Discard the wrong half or choose an edge. Aid asks which side remains possible, without marking the midpoint. | `search:<scenario-id>`; yes |

All item keys identify stable content, not answer positions; generators must honor `avoid` and `review`.
An accepted review key regenerates the same underlying fact or scenario. Distractors must be distinct,
plausible and never also correct. Do not reward just tapping through without applying the skill.

### Mechanics, examples and attempt boundaries

The examples are original designer examples, not final child-facing text. Each question offers the
stated choices, a replayable instruction and a clear way to submit or revise. An incomplete selection
does not submit and does not count as a miss. On a submitted miss, preserve the child's work; for
pick-one questions keep the chosen wrong option visible and disabled. Exploration actions are not
scored, so a child can learn the mechanic before making a submission.

1. **Compass delivery.** Use 4×4 or 5×5 boards, one start and goal, 0–3 walls, four initial facings
   and a proposed maximum of 10 cards. Palette: forward one cell, turn left 90°, turn right 90°.
   Turning changes facing but not position. Example: facing north, `right, forward` moves one cell
   east. Run the entire strip; success requires the final cell to be the goal and no collision,
   not the shortest path. A wall/edge stops the run, highlights the stopping card, returns to edit
   and counts one miss. A route that passes the goal but ends elsewhere is not a success; the goal
   art must not suggest a win merely because Oli passed it. The aid shows current facing during
   execution. Test every facing and left/right from the character's perspective.
2. **Signal station.** Show 2–3 event → action pairs, one triggered event and 3 action choices.
   Example: bell → wave and button → jump; bell occurs, so wave is correct. Events activate only
   their own action; no action fires before the event. Shuffle distinct choices. A wrong selection
   is one miss; the aid repeats which event occurred, without highlighting the answer.
3. **Weather workshop.** Display a single visible condition and two empty branch slots, plus exactly
   two action cards. The child assigns each card using buttons, then tests both input states before
   submitting. Example: if raining, choose an umbrella; otherwise choose a sun hat. Each test runs
   the **same** completed rule against its selected state; testing is not a scored attempt. Submit
   succeeds only if both outputs match the stated goals. A bad submission is one miss, even if both
   branches are wrong; both remain editable. Do not allow two outputs that are both sensible for a
   state: author a specific goal and review it for ambiguity.
4. **Treasure counter.** Show a starting integer 0–5 and a strip of 2–4 updates of +1 or −1, with
   intermediate values in 0–9. Offer three distinct final numbers. Example: start 2, collect,
   collect, use → 3. Tapping the answer submits; an incorrect number is one miss and is disabled.
   The aid describes how a collect or use changes a count, using an unrelated worked example.
   Before submission or after a miss, show the initial objects and action strip, not a trace or
   intermediate value that can coincide with the answer. After success, objects and count can
   animate together to explain the full trace.
5. **Shortcut studio.** On a 4×4 or 5×5 board, the child defines one named block containing 2–3 of
   the same forward/turn primitives, inserts 2–4 calls into a main strip and runs it. No calls inside
   the definition, recursion, parameters, nested loops or unbounded execution. Example definition
   `forward, right`; two calls mean `forward, right, forward, right` from the current facing.
   Run all calls: success requires no collision, final goal and at least two executed calls.
   Definition alone executes nothing. Any valid definition and strip meeting these visible constraints
   is accepted. A failed run is one miss; both definition and strip stay editable. Prove each board
   has an answer expressible by the editor and that the repeated block is useful to the task.
6. **Signal lights (approved enrichment).** Four independently toggled cards show place values
   left-to-right as 8, 4, 2, 1, plus both on/off labels and shapes. Set a target 0–15, then submit.
   Example: 10 = 8 + 2. Compare the sum with the target; a bad submission is one miss and leaves
   all toggles editable. The all-off representation of zero is valid. The aid explains that each
   lit card contributes its shown value; it does not select cards.
7. **Balance shelf (approved enrichment).** Give 3–5 visually distinct, equal-size objects with
   distinct hidden weights and a two-pan balance. Select two objects to compare; the balance shows
   lighter/heavier with text and a non-color indicator. Comparisons are free exploration. Then place
   all objects in a lightest-to-heaviest row and submit. To prevent a lucky guess from replacing
   comparison, enable submission only when the comparison history logically determines a unique
   complete order; otherwise offer a general prompt to compare more. Example: compare A/B and B/C;
   if A < B < C, A,B,C is provable. A submitted incorrect order is one miss and remains editable.
   The aid explains how to interpret the pans, never the objects' unobserved weights.
8. **Mystery shelf (approved enrichment).** Seven boxes contain distinct ascending values, hidden
   except for authored clues. The target is guaranteed present. Ask for the next *middle* box among
   the remaining possible candidates, not merely a lucky guess of the target. For the initial
   version author only odd candidate counts of 3, 5 or 7, giving one midpoint and allowing `PickGame`
   to represent a unique answer. Example: boxes 1–7 ascending; box 4 is revealed as 16 and the target
   is 23, so the possible range is 5–7 and box 6 is the midpoint. A wrong choice counts once and
   stays visible disabled; aid asks which side of 16 could contain 23. Even-sized ranges and both
   acceptable middle choices are deferred until the answer contract can represent both.

### Input, accessibility and state

- Tab reaches every control in a logical order; Enter/Space activate buttons. A selected item can be
  inserted, removed or moved with labeled buttons, without dragging or pointer gestures. If dragging
  is later added it must have the same keyboard and tap alternative. Do not intercept arrow keys
  while they are needed to navigate controls; avoid the existing `ProgramGame` shortcut collision.
- Give each board an accessible textual description of its dimensions, start, facing, walls and goal,
  plus the current state during a trace. Describe only information visible to a sighted child; never
  announce hidden weights, hidden box values, the correct answer or a target route. Give each card
  a meaningful label and position; use real button roles, not `role=listitem` on a button.
- Display and announce status changes politely, including current branch/counter, comparison result,
  stop reason and retry; do not rely on color, sound or animation. Keep visible focus, sufficient
  contrast and no focus trap. Reduced motion shows the same final state and feedback without a walk.
- Keep keyboard focus usable after editing, running and retrying. All controls, including nested
  block editing and balance placement, have ≥64px targets at 390px. Hebrew is RTL; numbered code
  strips and numeric rows are explicitly LTR, with an indicated first position.
- Games own only per-question state. On reload, the current shell starts a fresh round; do not claim
  it resumes an unfinished program. Saved completed progress and 8a review items must survive reload.
  Drafting, exploration, replay and hints must not themselves call `onAttempt`.

## Experience and technical considerations

- Reuse `PickGame`, `OrderGame`, existing audio and board artwork where suitable. `ProgramGame` and
  `program.ts` currently support absolute arrow moves and fixed repeat cards, not facing, branches,
  state, events or callable blocks. Any new interpreter and editor are **proposals**, not existing APIs.
- Keep the old `run` semantics and saved item keys compatible. A separate bounded interpreter
  can model position, facing, counter, condition and calls. Clearly define stopping, collision and goal
  semantics, cap steps/call depth, and test that the displayed trace and verdict agree. No unbounded loops.
- Suggested advanced execution contract: a pure interpreter takes a board, initial facing and validated
  finite commands and returns ordered trace states, final state and a stop reason. Use at most 10 main
  cards, one 2–3-command definition, 4 calls and 40 primitive operations per run; count turns as
  operations. Reject invalid or over-limit programs before running, without recording an attempt.
  Event and counter puzzles can use small separate pure evaluators rather than forcing all mechanics
  into the board interpreter. Final types must be fixed in T0 before parallel work.
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
`advanced-phrases.ts` is not discovered by the audio glob on its own: T4 must merge its map into the
export of `src/subjects/coding/phrases.ts`, without duplicate IDs, so audio and the studio see it.

Proposed original data: `content/advanced-boards.ts` (facing and reusable-block boards),
`content/advanced-scenarios.ts` (events, conditions and counters), and
`content/advanced-puzzles.ts` (binary, sorting and searching). Use stable IDs and at least 12
reviewed items per approved scenario-based mechanic; the binary exercise may use the complete 0–15
domain. Explicitly document any smaller domain and why. Every board must be solvable through its UI.

## Acceptance criteria — to finalize with the user

- Pure simulator tests: turn/facing in all orientations, boundary/wall behavior, event triggers,
  true/false branches, counter transitions, definition versus repeated calls, execution caps, and
  trace/verdict agreement. Existing Stage 8a tests and behavior must remain unchanged.
- Test the worked examples above, plus goal passed then left, wall after goal, empty/over-limit
  programs, both conditional inputs, all four binary weights and zero, an underdetermined balance
  order, and all target positions in valid search scenarios. An execution cap or incomplete program
  cannot award success or record a miss.
- Each generator: at least 200 seeds or the full finite domain; reachable answers, no duplicate or
  alternative correct distractors, phrase IDs exist, `avoid` and `review` honored. Exhaust binary
  0–15; prove sorted ordering, search range updates and scenario/board solvability.
- Component tests: keyboard and touch-equivalent button actions, run/edit/retry, accessible names,
  one success report, no answer leakage, and reduced-motion behavior. Assert both weather tests are
  unscored and a failed submit counts once; balance comparisons are unscored and insufficient evidence
  cannot submit; search midpoint is unique and never inferred from hidden-value labels.
- `e2e/coding-advanced.spec.ts`: full real-UI rounds for each approved mechanic; include a wrong attempt,
  hint, keyboard-only run, reload and existing Stage 8a regression. Review every child-facing item.
- Run `npm run check` and `npm run e2e` twice; inspect every new screen/state at 1280×860 and 390px in
  light and dark mode, plus reduced motion. Check studio lists all new phrases. User play-test remains
  the final acceptance gate.
- Verify that unfinished-round reload starts cleanly while previously completed 8a progress persists;
  no new code assumes unfinished-round persistence. Verify that new namespaced keys cannot be claimed
  by another game's `accepts`, and review the same stable item after a saved missed round.

## Implementation task split

File ownership is tentative and must be reconfirmed after scope and contracts are approved. Parallel
tasks never share files. Shared core/UI needs, if any, are planner-owned and must be defined and tested
in T0 before builders begin; no dependencies on unmerged wiring.

| Task | Owner | Exact files | Inputs / dependencies |
|---|---|---|---|
| T0 | Planner | `src/subjects/coding/advanced-types.ts`, `src/subjects/coding/advanced-ids.ts`, `src/subjects/coding/advanced-program.ts`, `src/subjects/coding/advanced-program.test.ts` | Approved spec; define contracts and bounded simulator first |
| T1 | Content | `src/subjects/coding/content/advanced-boards.ts`, `src/subjects/coding/content/advanced-scenarios.ts`, `src/subjects/coding/content/advanced-puzzles.ts`, `src/subjects/coding/advanced-phrases.ts`, `src/subjects/coding/advanced-content.test.ts` | T0 contracts; original reviewed content and phrase map |
| T2 | Builder | `src/subjects/coding/advanced-generators.ts`, `src/subjects/coding/advanced-generators.test.ts`, `src/subjects/coding/advanced-art.tsx` | T0 contracts; consume T1 data through fixed interfaces |
| T3 | Builder | `src/subjects/coding/games-advanced.tsx`, `src/subjects/coding/games-advanced.test.tsx`, `src/subjects/coding/advanced.css` | T0 contracts and simulator; no imports from unmerged T1/T2 |
| T4 | Planner + reviewer | `src/subjects/coding/index.ts`, `src/subjects/coding/phrases.ts`, `e2e/coding-advanced.spec.ts`, `CLAUDE.md`, `docs/ROADMAP.md`, `docs/specs/coding-grade3-6.md` | T1–T3 merged and checked; integration, full review, E2E and screenshots |

If shared contracts need `src/core/**` or `src/ui/**`, specify the exact files and tests in a revised
T0 before builders begin; update architecture when changed. T1–T3 run at most three at once in isolated
worktrees, from the T0 base. Their briefs must use `docs/FEATURE-GUIDE.md`.

**Task-specific handoff and checks, still provisional:**

- **T0:** imitate `coding/program.ts`, `coding/types.ts` and `core/engine/types.ts`. Define interfaces
  and exports used by all three tasks, then implement the finite evaluator with the test matrix above;
  run `npm run check` and `npm run build`, commit the shared base.
- **T1:** imitate `coding/content/boards.ts`, `coding/phrases.ts` and `coding/content.test.ts`.
  Deliver original examples through T0 types; test every board's solution, unique scenario IDs,
  nonnegative counters, complete true/false expectations and distinct sortable weights. Perform a
  full language, safety, ambiguity and no-giveaway review, not a sample.
- **T2:** imitate `coding/generators.ts`, `coding/generators.test.ts` and `coding/art.tsx`. Depend on
  T0's content interfaces, not an unmerged T1 module: unit tests use local fixtures. Implement pure
  generators, stable item keys and art; test ≥200 seeds or the complete finite space, distractors,
  accepted review keys and supplied phrase IDs. Do not wire into the live island.
- **T3:** imitate `coding/games-program.tsx`, `coding/games-program.test.tsx`, `ui/pick/PickGame.tsx`
  and `reading/games.tsx`. Depend only on T0 plus existing shared components; use local fixtures.
  Test input modes, every attempt boundary and the accessible/non-revealing states described above.
- **T4:** after T1–T3 are reviewed and merged one at a time, wire skills and phrases, verify studio
  discovery and parent-readable review labels, and run every approved E2E round plus the 8a regression.
  Inspect screenshots and complete the PLAYBOOK self-review. Never import unmerged T1–T3 in live `src/`.
  Builder briefs must name exact files, base commit, references, tests, inputs and required verification
  report; changes to core/UI remain planner-owned.

## Out of scope

Shortest paths, text programming languages, online sharing, network calls and user-generated uploads. Timers, external
services, complex robot hardware and changes to existing 8a content are not proposed. No extension of
Oli help is assumed; the existing clock pilot remains separate.

## User decisions (2026-11-16)

- Implement all eight listed mechanics, including binary, sorting and searching; shortest paths stay out.
- Use the listed grade progression and visual blocks. Begin now; the 8a play-test is a follow-up.
- Keep the PR in draft until implementation and all verification are complete; the user still play-tests
  the finished feature. Final phrase wording and recording count are determined by content review.
