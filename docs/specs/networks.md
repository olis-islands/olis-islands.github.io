# Spec: Networks island

- **Status:** Approved by user on 2026-11-20 ("all yes" to the ten open decisions, D28). Built game by game;
  see the task table.
- **Stage:** New advanced island, not an expansion of the coding island.
- **Relies on:** D2, D3, D7, D14, D19, D26, D28; `docs/RESEARCH.md` § Networks education.
- **Working name:** Networks Island, also described as the Island of Messengers. Final Hebrew names and
  nikud need content review; English labels below are design labels, not child-facing text.

## Goal and scope

Give children from grade 1 to 6 an understandable picture of how devices exchange information. Oli
delivers messages between device islands, discovers how messages can be divided and reassembled, looks up
a name, requests a page, follows a security rule and investigates a failure. The child learns by making
small decisions on a picture, not by typing commands or learning professional networking vocabulary.

This is a **proposed** nine-skill scope and progression. It follows the user's request to adapt an
adult networking topic outline, not the adult exercises themselves. All activity is simulated locally:
there are no actual messages, connections, websites, accounts, network tools or traffic captures.
The map uses the existing **advanced** group; the island is discoverable in the usual way.

## Curriculum basis and limits

The user explicitly accepted international sources for this island (D26). These sources inform the
design; they do not establish an Israeli ministry requirement or mandate these particular games:

- [CSTA K–12 Computer Science Standards (2017)](https://csteachers.org/wp-content/uploads/2025/03/2017-csta-k12-computer-science-standards-al.pdf):
  1A-NI-04 covers passwords in K–2; **1B-NI-04**, grades 3–5, models information split into packets,
  sent through multiple devices and reassembled; 1B-NI-05 addresses protecting personal information.
  **2-NI-04**, grades 6–8, models the role of protocols. Our routing, DNS, HTTP, firewall, encryption
  and troubleshooting puzzles are age-adjusted enrichment, not claims that those exact topics or
  grade placements are prescribed by these standards.
- [England's computing programme of study](https://www.gov.uk/government/publications/national-curriculum-in-england-computing-programmes-of-study/national-curriculum-in-england-computing-programmes-of-study):
  key stage 2 includes networks and the web as a service; key stages 1 and 2 include safe use. The
  numbered grades in the table are **app recommendations**, not an equivalence asserted by that page.
- [CS Unplugged topics](https://www.csunplugged.org/en/topics/) lists error detection for ages 5–10.
  It does not by itself establish the specific missing-packet lesson or its grade. We have not reviewed
  its lesson text or licence and will not copy its activities, text or artwork.
- The reviewed [Israeli elementary computer-science programme](https://meyda.education.gov.il/files/CSIT/Elemetray-June2021-Ver2.pdf)
  did not establish a requirement for network mechanics. Israeli digital-safety material exists, but
  its grade mapping was not verified. Do not market the island as an Israeli curriculum requirement.

Technical background, not child-facing content: [DNS](https://www.cloudflare.com/learning/dns/what-is-dns/),
[HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview) and the user's topic outline.
References are for research and educators only: no external links appear in the child experience.
All game content, drawings and examples must be original.

## Skills

Grades, IDs, stickers and dependencies are working design proposals. `requires` contains full skill IDs;
under D19 they guide recommendations and do **not** prevent a child from playing. No pre-K or kindergarten
network skill is proposed in this first island.

| ID | Design title | Grade | Requires | Sticker | Game |
|---|---|---:|---|---|---|
| `networks.delivery` | Deliver a message | 1 | — | ✉️ | delivery |
| `networks.route` | The crossroads | 3 | `networks.delivery` | 🧭 | route |
| `networks.packets` | Put the pieces together | 3 | `networks.delivery` | 📦 | packets |
| `networks.retry` | Find a missing piece | 4 | `networks.packets` | 🔁 | retry |
| `networks.firewall` | The gate's rules | 4 | `networks.delivery` | 🚪 | firewall |
| `networks.dns` | The name lighthouse | 5 | `networks.delivery` | 🔎 | dns |
| `networks.web` | Ask the library | 5 | `networks.dns` | 📚 | web |
| `networks.privacy` | A locked message | 6 | `networks.delivery` | 🔒 | privacy |
| `networks.diagnose` | Network detective | 6 | `networks.route`, `networks.retry`, `networks.firewall`, `networks.dns`, `networks.web` | 🔧 | diagnose |

The age progression is a recommendation, not a prerequisite chain enforced by the engine. A grade 1
child sees pictures and short spoken instructions; older skills introduce technical names gradually.
Final titles, terms, icons and phrasing require full Hebrew-language and educational review.

## Shared experience and scoring

- Each skill has one game, with **six questions per round** using the existing default.
- **Worked example: deferred** (owner's answer to question 3). No game has an unscored worked example,
  and none is promised. Children rely on the instruction, the hint and the engine's aid. If the
  play-test shows that a mechanic is not understood, a core "intro" step is planned then, with its own
  phrase IDs (`networks.example.*` stays reserved).
- Every question has one replayable Hebrew instruction and an optional general hint, both phrase IDs.
  A pick submits immediately. For boards with an explicit submit button, incomplete work cannot be
  submitted or count as a miss. Packet ordering instead scores each attempted placement as described
  below. Exploration, lookup, replay and hints are unscored.
- A wrong submitted answer calls `onAttempt(false)` once, leaves the question available and provides
  gentle shared feedback; a wrong pick remains visible and disabled. A wrong board remains editable.
  Correct completion calls `onAttempt(true)` exactly once. The existing engine controls the aid after
  repeated misses. Hints explain a rule or point to relevant evidence, never identify the answer.
- There are no timers, lives, punishments or real user-created messages. Completed progress uses the
  existing store; reloading an unfinished round starts a new round rather than promising to restore it.
- Every game uses stable, namespaced `itemKey`s and implements `accepts`. A due key regenerates the same
  underlying scenario and answer, not necessarily the same option order. Use `ctx.rng`; honor `avoid`
  while unused keys exist. A key is accepted only by its own game.

## Games

Examples below specify mechanics, not final Hebrew copy. In each, choices must be distinct and plausible,
with exactly one correct answer unless an alternate correct answer is explicitly allowed.

### 1. Delivery (`delivery`)

- **See/hear/do:** A sender, a destination label and three device houses with distinct labels. The child
  picks the destination house; the instruction can be replayed. Grade 1 uses small numbers and matching
  shapes, not IP notation.
- **Correct:** The selected house has the destination label. Example: destination 3, houses 1, 3 and 5.
  All labels remain visible; randomize position. A non-answer cue or illustration must not mark the
  correct house.
- **Aid/misconception:** Re-read the destination and suggest comparing labels; do not highlight the
  destination. Avoid implying every real device has one permanent, globally unique address.
- **Key/review:** `networks.delivery:<scenario-id>`; yes. Use `PickGame` if the prompt can show the sender,
  destination and options accessibly; otherwise use the island's board component.
- **As built (slice T1d, pending open question 4):** the address is a shape (circle, triangle, square or star,
  each always in its own color) and a number 1–9, generated from all 36 addresses rather than 12 written
  scenarios; key `networks.delivery:<shape>-<n>`. `PickGame` shows the envelope as a named drawing and three
  computers, named by their address. The two wrong computers share the shape, the number, or nothing with the
  address, but never one the shape and the other the number: then the right computer would be the only one
  sharing a part with both others, and a child could pick it without reading the envelope (tested). The spoken
  instruction ends with the address, so a child who cannot yet read the digits still hears it. No sender
  drawing: it added nothing to the decision.

### 2. Crossroads (`route`)

- **See/hear/do:** A small map shows a message at a crossroads, a destination, three adjacent next-hop
  buttons and open or closed bridges. The child picks a next hop that can reach the destination.
- **Correct:** The chosen adjacent hop reaches the destination through open connections. Author boards
  with **exactly one** such hop; the rest lead to a dead end or blocked bridge. Do not require the
  shortest route. Example: A reaches the destination; B is blocked; C is a dead end.
- **Aid/misconception:** Ask the child to trace open bridges from each choice. A router forwards a packet
  to a next hop; it does not necessarily see the whole path. This puzzle's complete map is a teaching
  aid, not a claim about a real router's knowledge.
- **Key/review:** `networks.route:<board-id>`; yes. Use an island board if shared pick art cannot convey the graph.

### 3. Packet shells (`packets`)

- **See/hear/do:** The receiver gets three or four numbered shells in an arrival order. Tap
  each shell in sequence into numbered slots; an optional drag must have an equivalent tap and keyboard
  path. A picture is assembled after completion, not visible beforehand as an answer cue.
- **Correct:** All shells are placed in number order. Example: arrival 3, 1, 2 becomes 1, 2, 3.
  Some authored items already arrive in order; some do not. An incorrect placement is a single miss,
  leaves the correct prior placements intact and allows retry; no separate submit is needed.
- **Aid/misconception:** Explain that the labels help the receiver order the pieces, not which shell to
  choose. This is a simplified model of ordered delivery: some information is divided into pieces;
  packets may take different routes or arrive out of order, but neither happens invariably.
- **Key/review:** `networks.packets:<scenario-id>`; yes. Reuse `OrderGame` only if its tile identity,
  accessible labels and optional speech represent shells without leaking the solution; otherwise use
  the island board component. Do not assume its current question type already supports this content.
- **As built (T2):** the child-facing word is "packet" (חֲבִילָה), not shell: a real, everyday word that is
  introduced here. `OrderGame` (D28) with numbered slots stacked from the top; each tile reads "חֲבִילָה 3"
  and the tray keeps the arrival order. 3 or 4 packets, all 30 arrival orders, about one in six already in
  order. Key `networks.packets:<arrival digits>`. No picture is assembled after completion: `OrderGame`
  has no such step and Q5 kept the shared component. **No hint, on purpose:** `OrderGame` has none, and the
  numbered slots already show where each packet goes; a wrong packet only shakes and stays in the tray.

### 4. Missing shell (`retry`)

- **See/hear/do:** A receiver expects numbered shells 1–3 or 1–4, with exactly one absent. The child
  picks which number to request again from three distinct options.
- **Correct:** The chosen number is the missing one. Example: expected 1–3, received 1 and 3 → request 2.
  On success show the missing piece arriving; the child never sends a real request.
- **Aid/misconception:** Explain comparing expected and received labels; do not point to the missing
  number. Retransmission is a model of *some* reliable protocols, not a guarantee of all traffic.
- **Key/review:** `networks.retry:<scenario-id>`; yes; prefer `PickGame`.
- **As built (T2):** `PickGame`. The drawing shows two LTR rows, "should have arrived" above "arrived"; the
  hint compares the top row with the bottom row, which is true wherever the missing number is. The rows: the numbers that should arrive (1…3 or 1…4)
  and the packets that arrived, in arrival order, without a gap that would mark the missing place. Options are
  three numbers in ascending order: the missing one and two that did arrive. All 30 items; key
  `networks.retry:<total>:<missing>:<arrival digits>`. The arriving-packet animation is not built.

### 5. Gate rules (`firewall`)

- **See/hear/do:** Show one explicit rule and a packet with visible attributes; choose allow or block.
  Use simple source, destination or service labels, never message content or a real address.
- **Correct:** The choice follows the displayed rule. Example: allow packets for the blue library;
  a packet addressed to the blue library is allowed, one for the orange library is blocked. Across
  the content set both outcomes occur; color is accompanied by a shape and spoken label.
- **Aid/misconception:** Re-read the rule and the packet's relevant label without saying the outcome.
  A firewall is not perfect protection, and this one-rule model does not describe every firewall.
- **Key/review:** `networks.firewall:<scenario-id>`; yes; prefer `PickGame`.
- **As built (T3):** `PickGame`. The places are the four colored shapes. A packet card shows its sender (שׁוֹלֵחַ)
  and receiver (מְקַבֵּל), never the same. The rule is one readable, spoken sentence ending in a shape, with a
  small card showing the field it checks and that shape: let in only packets to/from a shape, or stop packets
  to/from a shape. Options are always "נִכְנֶסֶת" ✅ then "נֶעֱצֶרֶת" ⛔. The generator picks the rule kind first and
  then the outcome, so every kind lets the packet in half of the time and the wording never predicts the
  answer. In about half of the possible cases the rule's shape sits in the field the rule does not check, which
  catches a child who only looks for the shape. All 192 items; key
  `networks.firewall:<kind>-<shape>:<from>-<to>`.
  The block rules say "רַק" ("הַשַּׁעַר עוֹצֵר רַק חֲבִילוֹת …"), like the allow rules, so it is clear that every
  other packet goes in (content review).
  **Help: Oli's FAQ, engine unchanged.** The engine turns the spoken aid on after two misses in a row and a
  correct answer resets the count, so with two options `networks.hint.firewall` is never heard. On the owner's
  decision (2026-11-22) the game keeps two options and gets Oli's help instead (see "Oli help" below).

### 6. Name lighthouse (`dns`)

- **See/hear/do:** A local illustrated directory pairs three invented service names with distinct
  address labels. The child is given one service name and picks its address from three choices.
  Opening the directory is unscored; all information needed is accessible without reading alone.
- **Correct:** The chosen address is the one paired with that service. Example: Moon Library → 14;
  choose 14, not 12 or 16. The directory is deliberately visible as evidence, not an answer highlight.
- **Aid/misconception:** Suggest following the requested name's row. The lighthouse represents a
  simplified lookup; real DNS is distributed and may use cached answers, not one universal book.
  Never show real domains, IP addresses, links or user-entered names.
- **Key/review:** `networks.dns:<scenario-id>`; yes; use the island board when the directory is needed.
- **As built (T4):** `PickGame`, no island board. The "lighthouse" became an address book (סֵפֶר הַכְּתֹבוֹת), a real
  table read row by row. Sixteen invented places: a noun (סִפְרִיַּת, מִגְדַּל, גַּן, חֲנוּת) plus a descriptor (הַיָּרֵחַ,
  הַשֶּׁמֶשׁ, הַכּוֹכָבִים, הַיָּם), each with a fixed two-digit address, so a due review asks the same address. The book
  has four rows: the place, one with the same first word, one with the same second word, and one unrelated. The
  three options are the addresses of the first three, so matching one word only picks a wrong one. Key
  `networks.dns:<noun>-<kind>`. Real DNS is distributed and cached; the game says nothing about that. The address is a
  simplified two-digit number, and no address is another's digit reversal (14 and 41), so the game tests lookup,
  not digit order (content review).

### 7. Ask the library (`web`)

- **See/hear/do:** The device asks for one of three illustrated pages. The child picks the response
  from the library: a page matching the request, or an explicitly shown unavailable response.
  The scenario states which pages the library has, so there is one supported answer.
- **Correct:** If the requested page is available, pick that page; if it is explicitly unavailable,
  pick the unavailable response. Example: request the star page and the library has it → star page.
  Do not suggest every request succeeds or that an unavailable response is the same as no response.
- **Aid/misconception:** Compare the request with the library's visible catalogue. HTTP is modelled
  as a request and response, not as the internet itself; a website can comprise many resources.
- **Key/review:** `networks.web:<scenario-id>`; yes; prefer `PickGame` where the catalogue is representable.
- **As built (T4):** `PickGame`. The request is a readable, spoken line ("דַּף עַל צָבִים"). The options are the
  library's three pages (picture and caption) and "הַדַּף לֹא נִמְצָא" 📭, always last. Twelve topics in four families
  of three look-alikes. The library always offers the request's look-alikes, so the answer needs an exact match,
  and "not found" is right only when nothing matches (about one request in three). Spoken in order: the request,
  then "אֵלֶּה הַדַּפִּים שֶׁיֵּשׁ בַּסִּפְרִיָּה. מָה הִיא עוֹנָה?", which is also shown over the options. 24 items; key
  `networks.web:<topic>:has|missing`.

### 8. Locked message (`privacy`)

- **See/hear/do:** An illustrated sender sends a fictional locked box to one recipient; an unrelated
  observer sees the box. Pick which picture describes what the observer can read: the closed box's
  contents are hidden; destination labels may still be visible.
- **Correct:** Pick the picture where the observer cannot read the contents. Use a closed box whose
  contents are not visible in accessible names, sound, art or preview. After success an explanation
  may demonstrate opening with the recipient's key.
- **Aid/misconception:** Explain that the lock hides the contents, not the destination. Encryption
  alone does not guarantee a trustworthy site, anonymity or complete safety. Separately remind the
  child not to share passwords and to ask a trusted adult for help; never ask for an actual password.
- **Key/review:** `networks.privacy:<scenario-id>`; yes; prefer `PickGame`. This is a simplified privacy
  metaphor, not a description of TLS certificates or real key exchange.

### 9. Network detective (`diagnose`)

- **See/hear/do:** An illustrated local simulation has four check buttons: name lookup, route, gate and
  library response. Each check reports its **authored status** in text, icon and sound. Exploration
  is unscored; after checking, the child chooses which stage needs attention from four options.
- **Correct:** Exactly one stage is faulty and the other three checks provide sufficient independent
  evidence of normal status. Example: lookup fails; route, gate and library checks each pass. The
  answer is lookup. Require all four checks before enabling the answer; do not count an incomplete
  investigation as an attempt. A wrong submitted choice is one miss and remains visible but disabled.
- **Aid/misconception:** Explain that the child should compare the four results, not guess from the
  order of the checks. The independent test results are a puzzle abstraction: a real end-to-end
  failure can have multiple causes and does not always make every other stage independently testable.
- **Key/review:** `networks.diagnose:<scenario-id>`; yes; use an island board with button-based inspection.

## Oli help (D25)

Owner's decision, 2026-11-22: the networks games get Oli's help in the clock-pilot pattern (`docs/specs/oli-help.md`),
starting with the firewall. D25 planned the clock pilot's play-test before any expansion; the owner chose to expand
now. No core or UI change: the island sets `help` on the game, and `PlayScreen` already shows the menu.

- One help file for the island: `src/subjects/networks/content/help.ts`, entries by game. Offline and text only:
  answers are never spoken or recorded. The same menu replays the spoken instruction. Questions keep nikud;
  answers have none. Opening help never counts as an attempt and never changes stars, mastery or the aid.
- **Firewall** (built): how to play; who is the sender and who is the receiver; what the gate does (it also names
  "חומת אש" as the real-world term, simplified); what "רַק" means for this rule (allow or block); and a clue naming
  the one field this rule checks. Help depends only on the rule, never on the packet or the outcome (tested).
- **Delivery, packets, retry, name lookup and web: follow-up**, one game at a time after the firewall help is play-tested, as D25
  intends. Each needs about three entries in the same file.

## Technical and accessibility constraints

- T0 defines question/content types, ID helpers and stable exports (the worked example is deferred). `Question`, `GameProps`, `defineGame`, `PickGame`, audio and the round engine remain the
  source of truth. No new dependency and no changes to shared contracts without planner review.
- Planner T0 creates the `comingSoon` skeleton with `id: 'networks'`, `tier: 'advanced'`, an unused
  order, a light/dark theme token and `app.island.networks` matching its final Hebrew title. The new
  advanced group grows from three to four islands; the existing four-island circular layout must
  remain usable. Planner owns and tests shared theme and app-phrase changes.
- Draw original device, bridge, shell, lighthouse, library, gate and lock art as needed. Do not use
  imagery from the cited sources. Register reusable drawings using the existing art system when
  appropriate; do not present network diagrams as real data or leak answers through art.
- Mouse, touch and keyboard must perform every scored and unscored action. Buttons are native, named
  and at least 64px; do not rely on dragging, color, sound or animation. Include visible focus, polite
  status announcements and accessible descriptions of visible graph connections, labels and check
  results. Never announce hidden content or a correct choice not otherwise visible.
- Hebrew UI is RTL with reviewed nikud; numerical labels and sequences are explicitly LTR and their
  starting direction is clear. Test at 320px and 390px, desktop, both themes and reduced motion.
  In reduced motion replace moving boats/packets with an equivalent static result and announcement.
- **Offline means simulation:** generators and interactions never use `fetch`, WebSocket, DNS, external
  images, embedded pages, analytics, real packets or network APIs. Existing PWA installation/caching
  behavior is unchanged; do not claim first load works without the app already being available offline.

## Phrases and content

After approval, T1 authors final reviewed Hebrew instructions, general hints, accessible labels,
explanations and the map name. Reserve `networks.q.*`, `networks.hint.*`, `networks.ui.*`,
`networks.example.*` and `networks.explain.*`; compose short reusable phrase IDs where natural. The map hover name also needs
`app.island.networks` in the planner-owned app phrases. Existing recorded audio wins and Hebrew TTS
is the fallback (D3); verify all island phrases are exported for studio discovery. Recording count is
unknown until wording is reviewed. Never require audio alone to understand a board.

Proposed original data in `content/scenarios.ts`: stable IDs, game kind, public labels and illustrations,
expected answer or graph, and associated phrase IDs. Author **at least 12 independently reviewed
scenarios per game**; each game's six-question round can then avoid repeated item keys. Vary correct
positions, missing numbers, allowed/blocked outcomes, order of packets and detective failure stages.
No actual personal data, real service names, real passwords or copyrighted exercises.

## Acceptance criteria

- Content review covers **every** scenario, explanation, phrase, accessible label and illustration:
  accurate age-appropriate Hebrew and nikud; unique correct answers; plausible distractors; no hidden
  answers in sound, art or accessibility; no unsafe security claims. A qualified Hebrew/educational
  review is required before release.
- Pure tests cover graph reachability and exactly one correct next hop, packet order including already
  ordered inputs, all missing positions, both firewall outcomes, consistent DNS pairs, available and
  unavailable web replies, privacy boundaries, and all four detective faults. Exercise ≥200 seeds per
  generator or exhaust the complete domain. Verify 12 unique keys per game, `avoid`, stable accepted
  review, unique options, reachable answers and all referenced phrase IDs.
- Component tests cover all attempt boundaries, unscored investigation, retry after
  errors, keyboard-only and touch-equivalent actions, focus and announcements, no answer leakage,
  and reduced motion. Prove incomplete explicit-submit boards and unchecked investigations cannot score,
  while each wrong packet placement counts exactly once.
- `e2e/networks.spec.ts` plays a complete six-question round of **each** game through the real UI.
  Include a wrong answer and hint, keyboard-only ordering and investigation, saved progress after reload,
  and map navigation. Exercise every detector fault with focused tests. Verify the app can play the
  island offline after the PWA is installed/cached and that game logic makes no external network
  requests. Ordinary same-origin app assets and recordings may load through the existing audio/PWA
  infrastructure; test them separately from simulated network traffic.
- Extend `e2e/map.spec.ts` to cover four islands in each group at 320, 390 and 1280px: no overlap,
  all targets ≥64px and keyboard access. Inspect each new game and relevant states at 1280×860 and
  390px in both themes, including reduced motion. Verify all phrases appear in `#/studio`.
- Run `npm run check` and `npm run e2e` twice, review the complete diff and content, then obtain the
  user's play-test approval. No claim of completion until those gates pass.

## Implementation tasks

T0 is committed; every later task builds on its contracts (`types.ts`, `ids.ts`) and never imports a sibling
task's unmerged files. Each game is one vertical slice: content, generator, tests, art and wiring together,
because a game's files are its own. Tasks in the same row group can run in parallel; their files never overlap.
Shared files (`index.ts`, `phrases.ts`, `ids.ts`, `types.ts`) are edited only by the planner, when a slice is merged.

| Task | Owner | Exact files | Depends on | Status |
|---|---|---|---|---|
| T0 | Planner | `src/subjects/networks/{types,ids,phrases,index}.ts`, `src/app/phrases.ts` (`app.island.networks`), `src/ui/theme.css` (`--net`), `src/ui/pick/PickGame.tsx` + `PickGame.test.tsx` (a drawing option said in parts is named by all its parts), `src/app/islands.test.ts`, `e2e/map.spec.ts` (four advanced islands) | — | ✅ |
| T1d | Planner | `content/addresses.ts`, `generators.ts`, `generators.test.ts`, `art.tsx`, `e2e/networks.spec.ts` | T0 | ✅ built, awaiting content review and play-test |
| T2 | Planner | `content/labels.ts`, `generators-packets.ts` + test, `art-packets.tsx` (packets and retry) | T0 | ✅ built, awaiting content review and play-test |
| T3 | Planner | `generators-gates.ts` + test, `art-gates.tsx`, `content/help.ts` + `help.test.ts` (firewall and its Oli help) | T0 | ✅ built, content reviewed, awaiting play-test |
| T4 | Planner | `content/lookup.ts`, `generators-lookup.ts` + test, `art-lookup.tsx` (DNS and web) | T0 | ✅ built, awaiting content review and play-test |
| T5 | Builder | `content/routes.ts`, `route.ts` (graph logic) + test, `RouteBoard.tsx` + test, `route.css` | T0 | ⬜ |
| T6 | Builder | `content/privacy.ts`, `generators-privacy.ts` + test, `art-privacy.tsx` | T0 | ⬜ |
| T7 | Builder | `content/detective.ts`, `DetectiveBoard.tsx` + test, `detective.css` | T0 | ⬜ |
| Tn | Planner + reviewer | `index.ts`, `phrases.ts`, `ids.ts`, `e2e/networks.spec.ts`, full content review, screenshots, docs | each of T2–T7, merged one at a time | per slice |

Builders request new phrase IDs or types in `docs/requests/`; the planner adds them to the shared files.
Content for each slice gets the full content review (FEATURE-GUIDE §5) before it is wired.

**Terms to check with a teacher before release** (content review): חֲבִילָה (packet), מְקַבֵּל (receiver; the formal
term is נִמְעָן) and שׁוֹלֵחַ (sender); "סֵפֶר כְּתֹבוֹת" or "פִּנְקַס כְּתֹבוֹת"; "דַּף" or "עַמּוּד"; the wording of "הַדַּף לֹא
נִמְצָא" for a 404. **Check with the Academy:** the pointed spelling כְּתֹבֶת / כְּתֹבוֹת (haser), used everywhere here.

## Out of scope

Actual network access, user-to-user communication, real addresses or browsing; OSI/TCP-IP layer
memorization, subnetting, real ports, DNS record types and caching mechanics, TCP handshakes, TLS
certificates, VPN/IPsec/SASE, proxy implementation, packet capture and command-line tools. A TCP/UDP
comparison is a possible future extension, not part of this draft. No new Oli-help rollout is assumed.

## Decisions awaiting approval

The owner answered all ten questions in `docs/requests/2026-11-20-networks-open-decisions.md` on 2026-11-20:
"all yes", taking every recommendation.

| # | Topic | Answer |
|---|---|---|
| 1 | Nine games, grades, advanced placement | Yes: nine games, grades 1, 3, 3, 4, 4, 5, 5, 6, 6, advanced group; build order delivery, packets + retry, firewall, DNS + web, route, privacy, detective (D28) |
| 2 | Island name and icon | "אִי הָרְשָׁתוֹת" with 📡 |
| 3 | Unscored worked example | Deferred: no worked example for now; add a core intro step only if the play-test shows a need |
| 4 | Delivery addresses (shape + number) | Yes: shape + number, three computers, generated from all 36 addresses |
| 5 | Packets: reuse `OrderGame` | Reuse `OrderGame`; a new board only if a picture is needed |
| 6 | Detective: all four checks first | Yes: all four checks before answering |
| 7 | Privacy: password reminder | Yes: a separate line after success, flagged for content review |
| 8 | Who does the release content review | Opus content-review agent reads every item, then the owner play-tests |
| 9 | Offline E2E test | Test "no request outside the app" plus one manual offline check before release |
| 10 | Recorded voice (D3) | Record as usual (D3) |
