# SMC26 copy — handoff

State of the public-copy rewrite for Playable Papers before the SMC26 talk
(Zagreb, 5–7 November 2026; a 5-minute presentation plus a poster session).
Updated 2026-10-11 after the drafting and critique rounds. The author has not
yet picked; nothing has been implemented into the pages.

## Where things are

- **The comparison page** (pick here): https://claude.ai/artifact/8Trsjw89yoVgeNLQQaySTB
  — page × layer × style, with the current copy as the first column, every
  cell measured (words against budget; state sentences in characters with the
  keyboard clause, and whether they fit the two-line reserve on the real page
  at 1200 px and 390 px), the critics' round-2 objections with each writer's
  answer (a refused one is a surviving objection), the writers' notes, and
  the critics' cross-draft findings and verdicts. Tapping a cell records a
  pick in the browser; "Picks as a note" turns them into markdown to paste
  back. The same page is committed as `docs/copy/compare.html`.
- **The drafts**, final revisions, in the strict format of `BRIEF.md` §8:
  `draft-claim.md`, `draft-question.md`, `draft-rulesheet.md`. Each ends with
  `## notes` (budget breaches, choices for the author) and `## answers` (one
  line per objection ID from both rounds).
- **The baseline**: `baseline.md`, the live copy transcribed into the same
  format.
- **The critiques**: `critique-r1-*.md` and `critique-r2-*.md` for the fair
  copy editor, the phone reader, the SMC academic and the length/consistency
  cop. `directions-r1.md` is what all writers were told after round 1.
- **The measurements**: `cop/r0-*.md`, `r1-*.md`, `r2-*.md` (one per draft per
  round; `r2` is the final state).
- **The tools**, in `docs/copy/tools/`: `measure.js` (Playwright; loads each
  toy from a local server and measures candidate sentences against the start
  line's reserve exactly as `lib/page.js` `checkFit` does), `check.py` (parses
  a draft, counts, flags), `cop.sh` (runs both), `build_compare.py` (builds the
  comparison page). To re-run: serve the repo on 127.0.0.1:8765, then
  `tools/cop.sh docs/copy/draft-claim.md`.
- **The brief**: `BRIEF.md` — scope, the four layers, hard constraints
  (measured), budgets, voice, sources, the draft format, the critics.

## Sources (not in the repo)

- The paper: "Building a music performance software for a wandering mind and
  clumsy hands", the V2 PDF the author emailed on 2026-03-16 (Gmail, thread
  "Wandering mind and clumsy hands"); accepted as SMC2026 paper #98. §3.2 is
  the motif trade-off; "nouns but no verbs" is in §5.1 and §5.4 (the markov
  spec cites a §5.5 that does not exist — fix the spec).
- The talk's vulgarisation: https://noisewrangler.art/articles/wandering-mind/
  ("An instrument for a fuzzy human").
- The Google Doc "Wandering brain and clumsy hands" is an older draft; ignore.

## What the critics concluded (round 2)

- No draft now contradicts a spec. Two errors the live pages carry today were
  found and are fixed in all three drafts: statistical-feedback's `nothing`
  line says "or open silence" (silence's weight is renormalised from the
  voices', so with every voice at zero nothing can be chosen); markov's
  `running.one` line says "tap a cell in its rest row" (the stalled walker
  stands on whatever row is empty). **Fix these on the live pages whatever
  copy is chosen.**
- Every draft's phone layer is usable in 30 seconds on every toy. The
  structural fault of round 1 (the nameplate is read first on the phone and
  is the same string as the desktop's, so it must not name a desktop-only
  control; the listening cue must live in the `running` line because the
  phone's standing text sits below the share button) is gone from all three.
- The editor's verdict per layer: front page — rulesheet; nameplate and meta
  — question; standing text — claim at the desk, rulesheet on the phone,
  claim for the share text; state sentences — rulesheet. Their note to the
  author: choose a style per layer, not per site, and let one hand write the
  state sentences for all four pages.
- Per toy, the phone reader: motif-memory — question; markov — claim;
  statistical-feedback — question (borrow claim's ear line); possibles —
  rulesheet. The academic: motif-memory — question; markov — claim and
  question level; statistical-feedback — rulesheet narrowly; possibles —
  claim and rulesheet level.

## Decisions only the author can make

1. Which draft per layer (or per layer per toy), from the comparison page.
2. motif-memory desktop standing text: all three drafts propose one (the
   page has `text: false` today, deliberately). Keep none, or take one.
3. statistical-feedback on the phone: the question draft keeps two questions
   (nameplate "Can the ear tell dice from a ledger?", phone text "Can the
   same shares sound like dice?") because the phone has no memory switch; the
   cop wants one question. The one refused round-2 objection (C-q-33).
4. markov: "strip" (rulesheet) or "row" (claim, question) for a state's line;
   both drafts are internally consistent. And the desk line "In the
   instrument a hand plays the matrices" (claim): true of the spec, absent
   from the paper, whose Conductor has no matrix.
5. possibles front blurb: claim first or machine first (P-c-18).
6. An og tag line ("A playable paper." / "One of four playable papers." /
   "A browser toy.") or none.
7. The spec corrections above (§5.5 → §5.1/§5.4).

## Implementation, when the picks are in

Each pick maps to a declaration field (brief §3 and §7 give the exact lines
per toy). State sentences go in as fragments starting lowercase; the library
appends the keyboard clause to `notStarted`. motif-memory's `shows` is a DOM
fragment with `<em>fidelity</em>`. Run `tools/cop.sh` on the assembled copy,
then open each page and watch the console for the `checkFit` warning. Keep
the `teaser.words` keys that the phone needs; omit a key only where the
desktop word is phone-safe.
