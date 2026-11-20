# Networks island: open decisions for the owner

**Answered 2026-11-20 by the owner: "all yes" — every recommendation below is accepted.** Recorded in the spec and D28.

- **From:** planner, 2026-11-20. **Spec:** `docs/specs/networks.md`.
- **Context:** the owner asked to merge the spec and start building while decisions are taken along the way.
  The first slice (the island on the map and the grade 1 delivery game) is built on the recommendations
  below that it needs (Q2, Q3, Q4). Everything else waits for an answer.
- **How to answer:** reply with the number and "yes" (take the recommendation) or your choice.
  Answers go into the spec; costly ones also get a `docs/DECISIONS.md` entry.

| # | Question | Recommendation | Blocks |
|---|---|---|---|
| 1 | Approve the nine games, their grades (1, 3, 3, 4, 4, 5, 5, 6, 6) and the advanced-group placement? | Yes. Build them in this order: delivery, packets + retry, firewall, DNS + web, route, privacy, detective | Every game after delivery |
| 2 | Island name and icon: "אִי הָרְשָׁתוֹת" with 📡, or "אִי הַשְּׁלִיחִים" (Island of Messengers)? | "אִי הָרְשָׁתוֹת" + 📡: says what the island teaches. Used in the slice; easy to change before release | Final name only |
| 3 | The spec asks for an unscored worked example before each game. The engine has no such step, and Oli's help (D25) is a clock pilot. Options: (a) none for now, rely on the instruction, the hint and the aid; (b) a short demo inside each game on question 1; (c) a core `intro` step shown before question 1 | (a) now. Add (c) only if the play-test shows children do not understand a mechanic. The slice uses (a) | Intro work in every game |
| 4 | Delivery addresses: a shape plus a number 1–9 (e.g. "circle 3"), three computers. The wrong computers share one part of the address, so a child must check both parts | Yes. Built this way in the slice. Generated from all 36 addresses instead of 12 hand-written scenarios | Done if yes |
| 5 | Packets (grade 3): reuse the reading island's `OrderGame` (tap shells into numbered slots), or a new board? | Reuse `OrderGame`, so tap, keyboard and screen reader already work. New board only if a shell picture is needed | Packets game |
| 6 | Detective (grade 6): must the child run all four checks before answering? | Yes, as the spec says. An unchecked guess does not count | Detective game |
| 7 | Privacy (grade 6): include the reminder "don't share passwords; ask a trusted adult"? | Yes, as a separate short line after success, never as a question about real passwords. Wording goes through full content review | Privacy game |
| 8 | Who does the "qualified Hebrew and educational review" before release? | An Opus content reviewer reads every item (as for other islands), then you play-test it. No outside reviewer | Release only |
| 9 | The spec asks for an E2E test that plays offline after the PWA is installed. No other island has one, and it is slow and fragile | Replace it with a test that fails if the game makes any request outside the app's own origin (built in the slice), plus a one-time manual offline check before release | Release only |
| 10 | Voice: record the island's phrases as usual (D3), or leave them to the browser voice? | Record as usual. The slice adds 16 phrases. Numbers and shapes reuse texts already used by other islands. Only 3 texts are new, plus the island name | Recording only |
