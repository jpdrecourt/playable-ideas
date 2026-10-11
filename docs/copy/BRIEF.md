# SMC26 copy — the brief

Shared ground truth for the writers and the critics. Read this whole file, then
the sources it points to, before writing a word.

## 1. What this is

Playable Papers (play.noisewrangler.art) is four browser audio toys, each built
around one mechanism, each with a `spec.md` an agent can rebuild it from. They
accompany a talk at SMC26 (Sound and Music Computing, Zagreb) and its paper,
"Building a music performance software for a wandering mind and clumsy hands",
by Jean-Philippe Drecourt (noisewrangler.art).

**The paper** (`$SCRATCH/paper/paper-clean.txt`, the submitted V2; the camera-ready
may differ in detail) is "Building a music performance software for a wandering
mind and clumsy hands". Its frame, in its own words:

- *Fuzziness*: "I am fuzzy: I have average dexterity (i.e. I am a little clumsy)
  and the discipline of rehearsal is beyond the capacity of my wandering mind."
  The Chaos Conductor is "designed around human fuzziness".
- *Second-order control* (§3.1, after von Foerster): "where first-order control
  acts on a system, second-order control acts on the conditions under which the
  system operates." "The performer shapes how sounds behave; the machine decides
  when they actually happen." "Pressing 'Play' is not a performance … the
  performer must act."
- *The second person* (§5.2): a classical instrument is first person ("I pluck a
  soft C#"); Lewis's Voyager is third person ("it listens, decides, and plays");
  the Conductor, like Butch Morris's Conduction, "operates in the second person.
  … I set conditions, delegate execution, shape the probability field from which
  sonic events emerge."
- *The motif trade-off* (§3.2): "Each sampler operates as an independent
  stochastic system. There is no cross-correlation between sound events: each
  fires in its own void. … Music is a temporal art, and one of its central tenets
  is memory. Repeating motifs anchor the listener, create the sense of return,
  give a piece its structure." A model with inter-event dependencies "such as a
  second-order Markov chain, would require controlling a number of parameters
  that grows with the square of the number of samplers."
- *Nouns but no verbs* (§5.1, §5.4): "The performer controls density, frequency,
  gain. These are nouns: states of the system at a given moment. Remembering a
  motif, developing a structure: these are verbs, actions that unfold across
  time and require the system to reference its own past." "The open problem is
  temporal structure. The architecture currently offers nouns but no verbs:
  states without memory. The next stage of the work is … to create motifs
  through inter-event dependency and temporal correlation, while preserving the
  second-order relationship between performer and instrument."

Reviewer 3 singled out "the 'nouns but no verbs' idea, which clearly identifies
the current lack of memory, motif, and temporal structure in the instrument."
The author's own vulgarisation of the paper is the article "An instrument for a
fuzzy human" (`$SCRATCH/site/wandering-mind.txt`).

**So the four toys are the paper's "next stage"**: four experiments on the
missing verbs, each one mechanism, each one falsifiable claim, each playable
by a fuzzy hand (nothing needs timing; a thumb on a phone is enough):

- **motif-memory** — *remember*: memory as a state of a voice (a switch and a
  knob on every voice), not a recorder beside the ensemble; the crossing from
  invention into memory can be made inaudible.
- **markov** — *one step of memory*: what a first-order chain buys (a style)
  and what it cannot hold (a figure that uses a state twice). The paper's §3.2
  made concrete: thirty-two weights for two walkers, and nothing across them.
- **statistical-feedback** — *a ledger of attention*: Charles Ames' fair-share
  selection; dice have no memory and the ear hears the difference.
- **possibles** — *the field above placement*: second-order control made
  literal. You write what can follow what (structure) and how much it matters
  (weight), two separate verbs; the machine is the only speaker.

Do not over-claim the link: the toys are not the Conductor, and the markov spec
itself says the page "shows the chain alone, with the performer's hands taken
out of the loop … not a verdict on the instrument."

## 2. Audience and the two encounters

Academics and artists in academia at SMC26 (Zagreb, 5–7 November 2026). The
paper was accepted for a **5-minute presentation plus a poster session** that
replaces the Q&A. So the pages are met:

- **(a) on a phone, via a QR code** — during the five minutes (one thumb, the
  speaker still talking) or at the poster, with the author beside them and a
  minute or two to spare. The phone layer must stand alone in ~30 seconds and
  get the hand to the one gesture that is the argument.
- **(b) later, at a desk, with the paper** — the desktop layer may carry an
  argument, name the source (Ames; Assayag & Dubnov; the paper's §3.2 / §5)
  and point to the spec.

Not projected; nobody reads these off a screen in the room.

## 3. Scope — the four copy layers, on the front page and the four toys

1. **Front page** (`index.html`): the `.sub` line under the title, and the four
   one-line blurbs in `.toys li` (plain text; the name is the link). Optionally
   one short line saying what a "playable paper" is — propose one, the author
   decides.
2. **Toy nameplate** — the `shows:` string in each `toys/*/index.html`
   declaration (rendered as `p.sub`, 12 px, max-width 96ch, `textContent` so NO
   HTML; motif-memory's is a DOM fragment with *fidelity* in `<em>` and may
   stay a fragment), plus `<meta name="description">` and `og:description`,
   which may differ from `shows` (the og text is what a share preview shows).
3. **Standing text** — desktop `text: [{head, body}]` (renders `<p><b>head</b>
   body</p>`, HTML allowed in body; motif-memory currently has `text: false`
   and you may propose a block for it or keep none); phone `teaser.text`
   (one `{head, body}`; may only mention what the phone shows); and
   `teaser.share.text` (the share sheet's text, goes with the page's URL and
   title; it is read on someone else's phone later).
4. **Start-state sentences** — desktop `start.words.{notStarted, nothing,
   stuck, shut, running}` and phone `teaser.words.{notStarted, nothing, stuck,
   shut, running}`. See the hard constraints.

**Out of scope** (do not draft): per-control `hint:` strings, the `says:` /
`instrumentSays` cold-hand answers, the `keys:` line, audio-blocked
diagnostics, `start.gesture`, the `spec.md` files, the README.

## 4. Hard constraints (from the code, measured)

- **Start line reserve.** `.pp-start` reserves two lines at 11.5 px. The
  library's `checkFit` warns when a sentence needs a third line, at desktop and
  at the phone width (390 px). Measured with ordinary prose on the live pages:
  the line holds **≤ 158 characters on desktop and ≤ 102 on the phone**. Work
  to **≤ 145 desktop / ≤ 92 phone** to leave room for word-wrap.
- Those counts INCLUDE the keyboard clause the library appends to `notStarted`
  (and only to `notStarted`): on transport pages (motif-memory,
  statistical-feedback, possibles) " Or tab to Play and press Enter." (32
  chars, desktop and phone); on markov (an arm page, no Play button) " Or tab
  to the instrument and press Enter." (42 chars, desktop) and " Or tab to a
  control and press Enter." (37 chars, phone). So the body of `notStarted` is
  ≤ ~110 desktop / ≤ ~58 phone on transport pages, ≤ ~100 / ≤ ~53 on markov.
- **`running` may never be empty**, desktop or phone. `stuck` may be `''` on
  pages that have no stuck state (all but markov). A phone key you omit falls
  back to the desktop word, so give every phone state its own word unless the
  desktop word is already phone-safe.
- The words are **fragments starting lowercase**; the library may prefix them
  (the state line shows them as-is today, but keep the case).
- **The phone's words may never name a control the phone does not show.** The
  phone shows: Play (on transport pages) plus ONE dial — motif-memory: a
  `memory` button for all voices and a `fidelity` dial; markov: `structure`;
  statistical-feedback: `heterogeneity`; possibles: `bias` — and a passive
  stage (timeline / trail / record / trace). Where the phone cannot act
  (empty matrices, muted master) the word says the desktop page can.
- **markov's `notStarted`, `stuck` and `running` are functions** with variants
  (weights set or not; which walker walks). Draft every variant.
- `shows` on motif-memory is a Node with `<em>fidelity</em>`; mark the italic
  word with `*fidelity*` in your draft.
- `document.title` becomes `"<toy> — Playable Papers"`.

## 5. Budgets to argue over (the length cop enforces these; a writer who breaks
one must say why in a note)

| layer | budget |
|---|---|
| front `.sub` | ≤ 20 words |
| front "what is a playable paper" line (optional) | ≤ 20 words |
| front blurb per toy | ≤ 14 words |
| `shows` | ≤ 20 words (≤ 30 for the one page whose claim needs it, say which) |
| meta / og description | ≤ 30 words |
| desktop `text` blocks | ≤ 120 words per toy, in 2–4 blocks |
| phone `teaser.text` | ≤ 50 words, one block |
| `share.text` | ≤ 18 words |
| state sentences | the character limits in §4 |

Current lengths for comparison: shows 28 / 55 / 30 words (markov / sf /
possibles); desktop text ≈ 330 / 420 / 330 words; teaser.text ≈ 80 / 85 / 95;
share 16–25.

## 6. Voice (from the README, the specs, the article; the critics may contest)

- Claims stated as falsifiable, aphoristic: "Dice have no memory, and the ear
  hears the difference." "Either could be wrong."
- Concrete nouns over abstractions: kick, hat, snare; a ledger, a debt, books;
  a tree, a branch, a finger.
- Long "and" chains; semicolons rare; em-dashes frequent in the author's prose.
  Keep them if they earn their place; the critics should ask.
- One claim per toy; everything else on the page is a consequence of it.
- British spelling (colour, metre, licence). SI units.
- Never a claim the mechanism does not support. The spec's §1 is the ceiling
  of what may be claimed; the rest of the spec is the floor of what is true.
- The hand before the theory on the phone; the theory may come first on the
  desktop, but one gesture is always named.

## 7. Sources, in reading order

1. This file.
2. `$SCRATCH/site/wandering-mind.txt` — the talk's frame (1 300 words).
3. `toys/<toy>/spec.md` §1 "The claim" for each toy (the first ~60 lines), and
   §2 where the claim leans on a mechanism detail. The markov spec §1 cites the
   paper.
4. The current copy, which is the baseline to beat, at these lines of
   `toys/<toy>/index.html`:
   - motif-memory: shows 1056–1063 (fragment), start.words 1140–1149,
     `text: false` 1217, teaser.words 1234–1242, share 1243–1244.
   - markov: shows 780–781, start.words 819–845, text 870–893, teaser.words
     908–918, share 919–920, teaser.text 923–927.
   - statistical-feedback: shows 1075–1078, start.words 1154–1163, text
     1185–1220, teaser.words 1231–1238, share 1239–1240, teaser.text
     1243–1248.
   - possibles: shows 795–797, start.words 862–871, text 911–935,
     teaser.words 966–973, share 975–976, teaser.text 979–985.
   - front page: `index.html` lines 32–40; meta lines 8 and 12.
5. `$SCRATCH/paper/paper-clean.txt` — the submitted paper (4 600 words). Read
   §3.1, §3.2, §5.1, §5.2 and §5.4 at least. Use it for the frame, never as a
   source of claims about the toys: the specs are the only ceiling there.

`$SCRATCH` = `/tmp/claude-0/-home-user-playable-papers/d8a9352f-2422-57f2-a748-8c2fbbc1c1ae/scratchpad`.

## 8. Draft file format (strict, so the comparison can be assembled by script)

Each writer writes `docs/copy/draft-<style>.md` with exactly these headings,
in this order, each followed by the copy only (no commentary; notes go in the
final `## notes` section). Keep `▶ Play` as written where a Play button is
named. Use straight quotes in the file; the implementation will use the pages'
curly apostrophes.

```
# <style name>

## front
### sub
### what-is            (one line or the word "none")
### blurb motif-memory
### blurb markov
### blurb statistical-feedback
### blurb possibles

## motif-memory
### shows
### meta.description
### og.description
### text               (either "none" or blocks as "**Head.** body" paragraphs, one per block)
### teaser.text        (one "**Head.** body" paragraph)
### share
### start.notStarted
### start.nothing
### start.stuck        (may be "" — write the two characters "" )
### start.shut
### start.running
### teaser.notStarted
### teaser.nothing
### teaser.shut
### teaser.running

## markov
### shows
### meta.description
### og.description
### text
### teaser.text
### share
### start.notStarted.weightsSet
### start.notStarted.empty
### start.nothing
### start.stuck        (use {A} and {B} for the two state names the code inserts)
### start.shut
### start.running.both
### start.running.one  (use {ON} and {OFF} for the walker names)
### teaser.notStarted
### teaser.nothing
### teaser.stuck
### teaser.shut
### teaser.running.high   (structure ≥ 0.5)
### teaser.running.low

## statistical-feedback
(same headings as motif-memory)

## possibles
(same headings as motif-memory)

## notes
(budget breaches and why; choices the author should decide; what you are
unsure the mechanism supports)
```
