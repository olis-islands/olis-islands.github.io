# Spec: Oli's game help

- **Status:** Approved by user on 2026-11-15; pilot built and verified, awaiting user play-test.
- **Stage:** Next priority, `docs/ROADMAP.md`.
- **Relies on:** D2, D3, D5, D7, D9, D19, D21, D23 and `docs/specs/clock.md`.

## Goal and scope

Give children and parents a way to ask what a game expects and how to use it. Oli offers a short, prepared FAQ and a gentle clue appropriate to the current exercise. The pilot covers the clock island's `set` game at every skill level, including the hour-only version. It does not cover the separate `day` game, even though it shares `SetGame`.

Help runs offline and uses text only: no AI, free-text questions, chat, server, or network calls. After the pilot is played and reviewed, map confusing interactions in other games with the user and extend help game by game.

## Observed clock-setting interactions

| What may be unclear | What the game actually does |
|---|---|
| What is the goal? | The requested time appears above the clock; set the hands and press Check. |
| Which hand can move? | In the first skill only the short hour hand is movable; at later levels both are movable. |
| How are hands moved? | Drag a movable hand by mouse or touch; with a keyboard, Tab to it and use arrow keys. |
| What do the hands mean? | The short hand shows hours and the long hand shows minutes. |
| Why do the hands move together? | Moving the minute hand past 12 adjusts the hour hand; moving the hour hand does not change minutes. |
| Why does a hand jump? | The minute hand snaps to intervals set by the skill; keyboard arrows use the same interval. |
| What happens after a mistake? | The child can try again. Existing automatic aids appear after repeated misses and may show the target and ghost hands; this pilot does not alter them. |

This is a starting map, not a claim that every point needs a separate FAQ. Review it with the user and test the explanations with children and parents.

## Experience

- On a pilot question, there is still only one Oli. Tapping the existing owl opens a discoverable, closeable menu.
- The menu includes a **replay the instruction** button and a yellow square **×** close button on the same row, distinct from the FAQ questions. Replay uses the existing spoken question and intentionally takes an extra selection in the pilot.
- FAQ questions retain nikud; answers are plain Hebrew without nikud. Answers are text only, not automatically spoken and not added to the recording studio.
- The menu is available before a mistake and after a miss. Opening, reading, and closing it do not change the clock, submit an attempt, advance the question, or affect stars, mastery, adaptive aid, or progress.
- The explanation reflects the active question's hour-only mode. A clue is general enough to help but does not state the target hour, minute, or exact hand positions.
- When the question advances, no answer from the previous question remains open. On closing help, return keyboard focus to a sensible control.
- Outside the pilot, Oli continues to replay the instruction immediately, as today.

## FAQ content

The clock island's content file is the source of the FAQ, including the hour-only variations.

| Question | Answer |
|---|---|
| אֵיךְ מְשַׂחֲקִים? | מזיזים את המחוגים לשעה שכתובה למעלה, ולוחצים על בדיקה. |
| אֵיךְ מְזִיזִים אֶת הַמְּחוֹגִים? | גוררים מחוג עם העכבר או האצבע. במקלדת בוחרים מחוג עם Tab ומזיזים אותו עם החיצים. |
| מָה מַרְאֶה כָּל מָחוֹג? | המחוג הקצר מראה שעות, והמחוג הארוך מראה דקות. |
| אֶפְשָׁר רֶמֶז? | המחוג הקצר מראה שעות, והמחוג הארוך מראה דקות. בדקו כל מחוג בנפרד. |

For hour-only questions, revise the play and movement answers and the clue to refer only to the movable short hand; do not imply that the long hand can be dragged. Keep the general explanation of what both hands mean accurate. Do not insert the target time into a clue; it is already present in the existing question and spoken replay.

## Design and ownership

- The planner owns the shared play screen, mascot integration, any minimal game-help contract, shared menu, and shared styles.
- Each island has one Oli help content file for all its games, not a separate help file per game. For the pilot, keep clock help in `src/subjects/clock/content/help.ts`, organized by game and question variation; add other clock games to that same file as they are covered.
- Select the current game's relevant entries and question-specific variation from its island's help content; do not show help for other games.
- Help availability is explicit for the pilot's `set` game. Do not rely solely on the component type because the out-of-scope `day` game uses the same component.
- Give any help data a typed shape; use the current `SetQ.hourOnly` rather than guessing from the UI or storing child data. Avoid broad fallback answers or unsupported menus.
- Use theme tokens and the existing audio path for instruction replay. Text-only FAQ content is a limited exception to the usual spoken child-instruction rule (D25); existing spoken game instructions are unchanged.
- Help text needs correct Hebrew; FAQ questions retain nikud and answers omit it at the user's request. Keep content in the clock island's content file.

## Acceptance criteria

1. In every `set` skill, Oli opens one accessible menu with instruction replay and the approved FAQ from the clock island's single help content file. Hour-only wording differs where necessary; the `day` game and other games keep their existing behavior.
2. FAQ selection and closing leave the current clock positions and question unchanged. Help before or after a miss does not report an attempt or change stars, mastery, or existing automatic aid.
3. No FAQ clue contains the target hour, minute, or exact solution. Existing question display, replay, and automatic aids remain unchanged.
4. The menu works with keyboard, mouse, and touch, has an accessible name and predictable focus, and works in RTL, dark mode, at 390px and desktop sizes, and with reduced motion.
5. Tests cover hour-only and normal questions, FAQ and clue content, replay, closing and reopening, progress preservation, and an entire clock-setting round. Run `npm run check` and `npm run e2e`; inspect desktop and narrow screenshots in light and dark modes.
6. User reviews and approves the spec before implementation, then play-tests the pilot before expansion.

## Tasks

| Task | Owner | Files | Depends on |
|---|---|---|---|
| Review and approve the FAQ, wording and spec | User + planner | `docs/specs/oli-help.md` | Clock interaction mapping |
| Implement shared menu and explicit pilot integration | Planner | `src/app/`, `src/ui/`, `src/core/` as needed | Approved spec |
| Add the clock island's single help content file and tests | Planner | `src/subjects/clock/content/help.ts`, clock tests | Approved spec |
| Verify full round, accessibility and screenshots | Planner | `e2e/clock.spec.ts` and related tests | Implementation |
| Update status and choose next game with the user | Planner + user | `docs/ROADMAP.md`, `CLAUDE.md` | Verification and play-test |

## Out of scope

Other clock games, timed arenas, other islands, a general chatbot, personal data collection, automatic FAQ speech, changing the existing aid, or showing the solution on request.
