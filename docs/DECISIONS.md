# Decisions

Short log of decisions that are costly to reverse: architecture, dependencies, core contracts,
pedagogy, privacy. Not every choice belongs here. Newest at the bottom.
To change a decision, add a new entry that says which one it replaces; do not rewrite old entries.

Format: `D<N> · date · who decided` — the decision, then why in one line.

---

**D1 · 2026-10-29 · user** — Rebuild the static prototype as Vite + React + TypeScript PWA, deployed statically.
Why: many games and parallel builders need typed contracts; offline play; no server.

**D2 · 2026-10-29 · user** — Local child profiles (name + avatar) in IndexedDB. No server, accounts, analytics or network calls.
Why: children's privacy and nothing to host.

**D3 · 2026-10-29 · user** — The user records audio. Every phrase has an ID; `say(id)` plays the recording if present, else Web Speech TTS. An internal studio page lists and records phrases.
Why: browser Hebrew TTS is unreliable, especially for letter sounds and syllables.

**D4 · 2026-10-29 · user** — MVP is the clock island: reading an analog clock and dragging hands to set a time.

**D5 · 2026-10-29 · user** — Owl mascot, world map of subject islands, sticker rewards. Computer-first (mouse + keyboard), touch supported.

**D6 · 2026-10-29 · planner** — Content follows the Israeli Ministry of Education curriculum; each spec cites its source.
Clock: gan parts of the day · 1st whole hours · 2nd half/quarter · 3rd to the minute.

**D7 · 2026-10-29 · planner** — Mastery: a skill is mastered after two rounds at ≥80% first-try. Missed items return via a Leitner review queue.

**D8 · 2026-10-29 · user** — Opus planner owns shared code and specs; up to 3 Sonnet builders work in parallel worktrees, each only inside `src/subjects/<island>/`. Islands self-register via `import.meta.glob`, so no shared registry file.

**D9 · 2026-10-29 · user** — All repo text in English. Only child-facing content (Hebrew phrases and words) is in another language, kept in content files.

**D10 · 2026-10-29 · user** — The recording studio (`#/studio`) exists only in dev builds (`npm run dev`), not on the published site.
Why: no server means no real admin login, and recordings must be saved into the repo anyway.

**D11 · 2026-10-29 · planner** — An island may import another island's content, types and game components read-only
(the reading island reuses the letters island's words, `PickGame` and phrases). The owning island stays the only
place they are edited; contract changes go through the planner.
Why: avoids duplicating 190 words with nikud and a tested component; keeps one source of truth.

**D12 · 2026-10-29 · user** — The studio saves recordings through a dev-server endpoint (`scripts/studio-plugin.ts`)
straight into `src/audio/he/`, one file per phrase (a new take replaces the old). Replaces the folder picker / Downloads flow.
Why: recordings were landing in Downloads while the studio showed ✅; this works in every browser and ✅ means a real file.

**D13 · 2026-10-29 · user** — Letter tracing (Stage 2b) starts with print letters (דפוס); cursive (כתב) may follow later.
Why: the user's choice; print matches the letters children see in books and in the app.

**D14 · 2026-11-01 · planner** — `PickGame` and its question types move from the letters island to shared UI
(`src/ui/pick/`), with prompt kinds for counting objects and LTR exercises and number options. Shared classes use the `pk-` prefix.
Why: the letters, reading and numbers islands all use it; shared code belongs to the planner, not to one island.

**D15 · 2026-11-02 · planner** — Drawings are original SVG components registered by name (`registerArt` in
`src/ui/pick/art.tsx`); shared UI draws an `ArtRef` without depending on the island that owns the art. The thinking
island's catalog (`src/subjects/thinking/art/catalog.ts`) fixes names, parts and variation props.
Why: the thinking games need controlled variations (mirrored, recolored, a missing part, silhouettes, halves)
that emoji cannot give, and other islands may reuse the drawings.

**D16 · 2026-11-02 · user** — A pre-kindergarten level (`Grade -1`, טרום חובה, age 4) is added, starting with the thinking island.

**D17 · 2026-11-02 · user** — English is spoken by the browser's en-US voice, not recorded (phrases declared as
`englishPhrases`; `say()` switches voice per part). Isolated English sounds and blends may optionally be recorded in the studio.
English text is shown left to right in Andika (school-print a/g). Instructions on the English island stay in Hebrew.
Why: native-quality English TTS exists on every device and saves ~250 recordings; Hebrew instructions match the other islands.

**D18 · 2026-11-10 · user** — The parents' page (`#/parents`) is for adults: plain Hebrew without nikud, never spoken, no phrase IDs or recordings, so its labels live in `src/app/parents/`. It is entered from the profile picker through a captcha-like gate (a random number in Hebrew words, typed as digits). Backups are local JSON files the parent saves and loads; nothing is sent anywhere (D2).

**D19 · 2026-11-10 · user** — Soft locks. This replaces only D7's unlocking rule; mastery and stickers are unchanged.
- **Every skill is playable.** Mastering a skill no longer unlocks the next one.
- **"Start here":** each island marks a recommended skill, chosen from the child's grade. It is the first skill in path order that is not mastered and whose grade is at least the child's grade minus one.
- **Challenge:** a skill above the child's grade whose prerequisites aren't mastered is tagged "challenge". When the child starts it, Shufi says it is harder but fine to try.
- **Easier step:** after a one-star round, the results screen offers the easier prerequisite.
- **Parents' "already knows this":** a parent can mark a skill mastered from the parents' page. The skill is flagged `byParent`, gives no sticker, and can be undone.

**D20 · 2026-11-10 · user** — Hosting: GitHub Pages, free, at `https://shamaysapir.github.io/GamesForKids/`. A custom domain can be added later without code changes.
- **Config as code:**
  - `.github/workflows/ci-cd.yml` runs lint, types, unit tests and E2E on every PR and push. On `main` it also deploys `dist/`, and only after every check has passed.
  - `scripts/setup-pages.sh` enables Pages for the workflow and sets the repo homepage. It is idempotent, and `CUSTOM_DOMAIN=…` adds a domain.
- **Deploying is merging:** the user merges to `main`, and the merge deploys. This replaces "no deploy without the user's approval" with "no merge to main without the user's approval".
- **The site is public, and so are the studio recordings in `src/audio/he/`.** The studio itself is never built (D10).

**D21 · 2026-11-10 · user** — The app is named **הָאִיִּים שֶׁל אוֹלִי / Oli's Islands**, and the owl mascot is **אוֹלִי (Oli)**. This replaces the mascot name in D5 and the working title "Lomdim Vemsachakim".
- **Nikud:** child-facing text always writes the name with nikud, אוֹלִי, because unpointed אולי reads as "perhaps". The browser tab and the installed-app name use plain letters.
- **Recordings:** the 25 takes that said the old name were removed; they are in git history.
- **What keeps the old name:** the backup file's internal `app` id and the npm package name, so existing backups still restore.

**D22 · 2026-11-10 · user** — The site moved to **https://olis-islands.github.io/**, free and at the root. This replaces D20's address.
- **Where it lives:** the repository was transferred to the GitHub organization `olis-islands` and renamed `olis-islands.github.io`, so Pages serves it at the domain root. The old address `shamaysapir.github.io/GamesForKids` no longer works, because GitHub doesn't redirect Pages sites.
- **What didn't change:** the workflow, the setup script and the relative build. A custom domain can still be added with `CUSTOM_DOMAIN`.

**D23 · 2026-11-10 · user** — Math for grades 3–6 (Stage 5):
- **Built one grade at a time,** each with its own spec and play-test: 5a is grade 3, then 5b, 5c and 5d.
- **Curriculum:** follows the Ministry's new curriculum documents for each grade.
- **Multiplication arena:** an optional timed mode where the child beats their own record. It never shows a negative, has no lives, and missed facts return for review. This is allowed from grade 3 by CLAUDE.md.
- **Recordings:** the user records only the short instructions. Large numbers and word problems are read by the browser voice and replayed with 🔊.
- **Nikud:** child-facing text keeps full nikud in every grade, the same across the app. The curriculum phases nikud out during grade 3, but the user chose to keep it.


**D24 · 2026-11-11 · user** — Math grades 4–6 back to back (refines D23): the three specs (`docs/specs/math-grade4.md`,
`math-grade5.md`, `math-grade6.md`) are written and approved together, then built one grade after another (5b → 5c → 5d)
without waiting for a play-test between them. The user plays them after. Each grade still gets its own branch and merge.

**D25 · 2026-11-15 · user** — Oli's game-help FAQ is offline and text-only, a limited exception to spoken
child-facing instructions. The existing game instruction remains replayable in the same owl's menu. FAQ questions
retain nikud; answers omit it. Replay and a yellow square close button share a row. Each island keeps its games'
help in one content file. The clock-setting pilot is play-tested before expanding.

**D26 · 2026-11-16 · user** — International educational programmes may inform the proposed networks
island even when a topic is not an established Israeli elementary requirement. This is a subject-specific
exception to D6, not a change to the curriculum basis of existing islands. Cite sources and distinguish
proposed enrichment from verified Israeli requirements. The island spec still needs user approval.

**D27 · 2026-11-20 · user** — Parent accounts, sync and usage data. This replaces D2's "no server, accounts, analytics or network calls" and the matching lines in CLAUDE.md and D18; offline play stays.
- **Accounts:** a parent signs in with a verified email code (not a password, not a link). Child profiles belong to that account and progress follows the child across devices. Ownership is the authenticated account ID, never the email text.
- **Guest first:** a new device plays as a guest with nothing uploaded. Signing in is offered from the parents' area; guest children are added to the account only after the parent says yes.
- **Local first:** the device never needs a network to play. Play is stored on the device first and synced later. The server holds the shared copy; no round is promised to survive clearing browser data before it uploads.
- **Backend:** a managed service (Supabase: login, database, row-level security). Only its public key is in the app; no secret key anywhere in the repo or browser. Adding its client library is a new dependency and needs the user's approval.
- **Network calls allowed:** sign-in and sync with that backend, nothing else. Still no third-party analytics, ads, chat or external links.
- **Data kept:** parent email, and per child a nickname, avatar, grade and play events. Usage statistics (active profiles, return rate, games played) are computed on the server from those events. A profile is active if it played at least one round or sprint in the last 7 days, counted once.
- **Before public launch:** consent screen with a stored consent record, a privacy policy, parent export and account deletion, and a legal check for minors' data (Israel's privacy law, and GDPR-style rules for users abroad).
- **Spec:** `docs/specs/accounts-sync.md`.

**D28 · 2026-11-20 · user** — The networks island is approved as specified in `docs/specs/networks.md`: nine offline
simulation games for grades 1, 3, 3, 4, 4, 5, 5, 6, 6 in the advanced map group, named "אִי הָרְשָׁתוֹת". No unscored worked
example for now. Packets reuse the reading island's order mechanic unless a picture is needed. The detective game needs
all four checks before an answer counts. The privacy game ends with a separate "ask a trusted adult" line. Release needs
a full Opus content review, the owner's play-test and one manual offline check.
