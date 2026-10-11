# SMC26 copy — handoff

Working notes for rewriting the public copy of Playable Papers before the SMC26
talk (Zagreb). Written in a cloud session that could not reach noisewrangler.art
(network policy); the next session should fetch the site first.

## What was decided (with the author)

**Scope — four copy layers, on the front page and all four toys:**

1. Front page: the subtitle under "Playable Papers" and the four one-line blurbs
   (`index.html`, `.sub` and `.toys li`). Possibly one short line saying what a
   "playable paper" is.
2. Toy nameplate line: the `shows:` string in each `toys/*/index.html`
   declaration (rendered as `p.sub`, text only, no HTML unless a node is
   passed), plus the `<meta name="description">` and `og:description` that echo it.
3. Standing text blocks: `text: [{head, body}]` (desktop, HTML allowed in body),
   `teaser.text` (phone), and `teaser.share.text` (share sheet).
4. Start-state sentences: `start.words.{notStarted, nothing, stuck, shut, running}`
   and `teaser.words.*`.

**Out of scope:** per-control `hint:` strings, the `says:` cold-hand answers,
the `keys:` line, audio-blocked diagnostics, the spec.md files.

**Audience and context:** academics and artists in academia. They will meet the
pages (a) on their phones via QR during the talk, and (b) later at a desk, with
the paper. Not projected. So the phone layer must stand alone in ~30 s and the
desktop layer may carry an argument and point to the spec and the paper.

**Three styles to draft, then argue adversarially:**

- **Claim, then one gesture** — the README voice distilled: one aphoristic
  claim, one thing to do with the hand, mechanism withheld up front.
- **Questions the hand answers** — each toy framed as a question
  ("Can one step of memory hold a phrase?"), Socratic.
- **Rulesheet** — imperative, no theory: what is on screen, what to do, what to
  listen for.

**Author's preferences (from their profile):** ask before implementing; options
and trade-offs first; creative initiative stays with them; adversarial /
multi-agent back-and-forth welcome; SI units; artifacts for iteration.

## Method planned

1. Three writer agents, one per style, each writing front page + four toys
   across the four layers, reading each toy's `spec.md` §1 "The claim" and the
   current declaration for ground truth.
2. Two adversarial rounds. Critics: a phone reader with 30 s and no context; an
   SMC academic checking every sentence against the spec (no claim the
   mechanism does not support); a length/consistency cop enforcing the budgets
   below. Writers revise after each round.
3. Deliverable: a side-by-side comparison artifact (page × layer × style) with
   the critics' surviving objections, plus the drafts committed as markdown in
   `docs/copy/`. Implementation into the pages only after the author picks.

## Hard constraints found in the code

- **Start line reserve.** `.pp-start` reserves two lines at 11.5 px, max-width
  80ch; `checkFit` in `lib/page.js` measures every state sentence at desktop
  and at the teaser width (720 px) and the phone (390 px) and warns when a
  sentence needs a third line. Budget: ≤ ~140 characters per state sentence
  INCLUDING the keyboard clause the library appends to `notStarted`
  (" Or tab to Play and press Enter." / " Or tab to the instrument and press
  Enter."). `running` may never be empty, on desktop or phone.
- `start.words.*` and `teaser.words.*` are fragments that start lowercase; the
  library may prefix them. Keep that case.
- `shows` is set via `textContent` (plain string) — no HTML.
- `text` blocks render as `<p><b>head</b> body</p>`; body may contain HTML.
- The phone's words must never name a control the phone does not show (the
  teaser shows Play plus one dial: structure / heterogeneity / bias / memory).
- `document.title` becomes `"<toy> — Playable Papers"` when `shows` exists.

## Current copy — length baseline (words, approximate)

| page | shows | text blocks | teaser.text | share |
|---|---|---|---|---|
| motif-memory | 0 (uses a node; meta ≈ 40) | none (`text:false`) | none | 25 |
| markov | 28 | ≈ 330 | ≈ 80 | 16 |
| statistical-feedback | 55 | ≈ 420 | ≈ 85 | 22 |
| possibles | 30 | ≈ 330 | ≈ 95 | 22 |

Proposed budgets to argue over: shows ≤ 20 words; front-page blurb ≤ 14 words;
teaser.text ≤ 50 words; standing text ≤ 120 words per toy; share ≤ 18 words.

## Voice notes (from README, specs and existing copy; site NOT yet read)

- Aphoristic claims stated as falsifiable: "Dice have no memory, and the ear
  hears the difference"; "either could be wrong".
- Concrete nouns over abstractions: kick, hat, snare; a ledger, a debt, books.
- Long "and" chains; semicolons rare; em-dashes frequent (the author's own
  prose, keep if they like them; the critics should ask).
- Each toy carries one claim; everything else is a consequence.
- The markov spec cites the SMC26 paper (§3.2 counting argument; §5.5 "nouns
  but no verbs"). The talk's vulgarisation is at
  https://noisewrangler.art/articles/wandering-mind/ — unread. Guess: the talk
  is about memory and attention in generative systems (motif-memory = memory as
  a voice state; markov = one step of memory; statistical-feedback = a ledger of
  attention; possibles = the field above placement). Verify against the article.

## First things to do in the new session

1. Fetch https://noisewrangler.art/ and the Wandering Mind article; correct the
   voice notes and the talk guess above.
2. Mark the four layers' exact line numbers per toy (grep `shows:`, `start:`,
   `text: [`, `teaser:` in each `toys/*/index.html`).
3. Launch the three writers, then the critics, as planned.
