# Critique, round 1 — the SMC academic

Every unit of the three drafts read against the toy's `spec.md` (the ceiling),
the `state:` functions in `toys/*/index.html` (what a state word actually
names), and the paper where the copy cites it. Objections are numbered
`A-c-N` (claim), `A-q-N` (question), `A-r-N` (rulesheet). Each gives the
layer, the sentence, the spec or paper or code line, a verdict — **wrong** /
**overclaim** / **imprecise** / **harmless** (unsupported but harmless) — and
a corrected sentence inside the style and the budget. Things I checked and
found supported are not listed unless a writer asked about them (those are in
"answers to the writers' notes").

Two facts from the code that several objections rest on, so they are stated
once:

- **statistical-feedback, silence at an empty pool.** `AMES.weights`
  (`index.html` 241–251): `out[voiceW.length] = (q > 0) ? (q / (1 - q)) * sv : 0`,
  where `sv` is the sum of the voice weights. Spec §2.3:
  `W_silence = p / (1 - p) · ΣW_voices`. With every voice at 0, silence's
  weight is 0 at any setting of the silence control. The `nothing` state
  (`!(sumW > 0)`) therefore cannot be left by opening silence.
- **markov, where a stalled walker stands.** `walking = i => !structured() ||
  rowSum(i, walk[i].state) > 0` (line 341). A walker is stalled on *whatever
  state it stands on* when that row is empty; `walk[i].state` is reset to the
  rest only by `clear` (line 699) or by a draw. Spec §4: "Empty a walker's
  rest row and it stops the next time it lands there" — the rest is one case,
  not the case. The `stuck` word already names the state (`stName`); the
  `running.one` word in all three drafts assumes it is the rest.

---

## Draft: claim (`draft-claim.md`)

### front

**A-c-1** · blurb motif-memory · "Memory is a state of a voice, and crossing
into it can be inaudible."
Spec §1: "the crossing into it **can be made** inaudible … This one only
announces itself if the performer makes it." §3.4: at f = 0 the accent channel
leaves "a small reliable signature … The crossing at f = 0 is not
information-theoretically clean."
Verdict: imprecise. The spec's claim is conditional on the hand; "can be
inaudible" drops the condition.
Fix: "Memory is a state of a voice, and the crossing can be made inaudible."

### motif-memory

**A-c-2** · meta.description · "a knob rides it back to invention without
changing how much it plays."
Spec §3.4: "with density left where it was at capture the expected rate is
`d` at every fidelity." §3.5: "it is the one way the conservation of amount
fails to reach the ear" — for the kick at rate 1, density 0.5, "events the law
wants that never sound" are 1.8 % at f = 1 and 33 % at f = 0.
Verdict: overclaim by degree. §1 lets the copy say the amount is *held*
(the law's claim); "without changing how much it plays" is an ear-level
absolute that §3.5 measures false for the kick at its opening rate.
Fix: "…and a knob rides it back to invention while the amount of music is
held."

**A-c-3** · text, block 2 · "Leave density alone and the amount of music never
moves; only where it falls does."
Same lines. Verdict: imprecise ("never").
Fix: "Leave density where it was and the law holds the amount of music;
fidelity moves only where it falls."

**A-c-4** · teaser.text · "Press memory and every voice keeps the two bars it
just played."
Spec §8 (teaser): the memory button "Pressed before anything has played …
starts the piece … so it lands at the end of the first bar with that bar in
it." §3.2: "A memory claimed at the very first bar line of a run has only one
whole bar behind it."
Verdict: imprecise, edge case (memory as the first press keeps one bar).
Harmless on a phone; noted because every draft has it (also `teaser.running`).
Fix (if wanted): "Press memory and every voice keeps what it just played, up
to two bars."

**A-c-5** · start.notStarted · "five voices start guessing on one pulse."
Spec §3.1: "it rolls its density"; §5: "the visitor hears the random before the
motif." The spec never says "guess"; a guess has a target.
Verdict: imprecise metaphor, harmless.
Fix: "press ▶ Play, or the Space bar, and five voices roll their chances on one
pulse."

**A-c-6** · teaser.running (and start.running) · "press memory and every voice
keeps its last two bars."
Spec §8: "One press is one direction for the whole set: it claims every voice
unless every voice already wants its memory, and then it lets them all go."
The `running` word is shown in both halves of that toggle.
Verdict: harmless (true until all five hold; the hint carries the other
direction). No change required; the author should know the line is one-way.

### markov

**A-c-7** · og.description · "a dial from grammar to dice."
Spec §3.1: "At `s = 0` every state follows every state with a quarter chance —
a uniform, memoryless draw."
Verdict: harmless, but "dice" here means a fair four-sided die and on
statistical-feedback it means *weighted* dice ("plain weighted dice", §2.6).
Fix: none needed; the cop should decide whether one word may mean two things
across two pages.

**A-c-8** · text, block 3 · "Sixteen weights each, none across them: the
paper's §3.2, counted."
Paper §3.2: "A model encoding inter-event dependencies, such as a second-order
Markov chain, would require controlling a number of parameters that grows with
the square of the number of samplers." Spec §1: "The counting argument of the
SMC26 paper (§3.2) is exactly this: the parameters grow with the voices and
buy no structure across them."
Verdict: imprecise. The paper counts what dependency *across* samplers would
cost (the square); the toy's thirty-two is two independent chains, i.e. the
paper's "each fires in its own void" with one step of memory inside each.
"counted" is defensible through the spec's gloss, but a reader with the paper
open will look for the square and find a sum.
Fix: "Sixteen weights each and none across them — the independence the
paper's §3.2 pays for, made audible."

**A-c-9** · text, block 3 · "In the Conductor a hand plays the matrix — here
it is alone."
Spec §1: "In the Conductor the matrix is played, live" — supported. But the
paper's Conductor (§3) has "a stochastic timer" whose parameters are "density
and period of events", and §3.2 says "There is no cross-correlation between
sound events"; the spec's own header says the chain is a port of
`src/lib/markov/MarkovStateMachine` in the instrument's source, which the
submitted paper does not describe.
Verdict: supported by the spec, unsupported by the paper. Not wrong; flagged
because this line sends the desk reader to the paper for a matrix that is not
in it.
Fix (author to decide): "In the instrument a hand would play the matrix live;
here it walks alone." — or keep, and let the spec's header carry the
reconciliation.

**A-c-10** · teaser.text · "At 1 the chains read the example as written"
Spec §5: "The page opens on the example only **once**, so no standing line may
state what a matrix holds as though it were a fact about the page." §5: "a
returning visitor's own session" wins over the example; the phone reads the
same persisted session.
Verdict: overclaim (standing text asserting the matrices hold the example).
Fix: "At 1 the chains read the matrices as written and every step answers the
last."

**A-c-11** · start.notStarted.weightsSet · "Touch the rack or the trail and
both walkers start."
Spec §4: "the first weight in a rest row is what starts that walker." A matrix
with weights elsewhere and an empty rest row starts one walker, and the page
then shows `running.one`.
Verdict: imprecise (true of the example, not of "the matrices hold weights").
Fix: "the matrices hold weights. Touch the rack or the trail and the walkers
start."

**A-c-12** · start.nothing · "both chains stand on their rest, and a rest with
no weights goes nowhere."
Code: `nothing` fires when `weightsSet() == 0` at structure 1 (line 812);
`walk[i].state = 0` only on `clear` (699) or a draw (414). A matrix emptied
cell by cell under a walker standing on kick leaves it on kick, and a rest-row
tap then moves nothing.
Verdict: imprecise, edge case; also in the baseline.
Fix: "the matrices are empty, so neither walker can move. Tap a cell in the
row its lit strip marks — after clear, a rest row."

**A-c-13** · start.running.one · "{ON} is walking and {OFF} is standing still.
Tap a cell in its rest row to hear two chains that share nothing."
Code, line 341 (above): the stalled walker stands on whatever state has the
empty row. Spec §8: "The current state of each walker is lit on its own strip.
That is what makes a dead end visible."
Verdict: **wrong** whenever {OFF} stands on a sound (the rest-row tap does
nothing and the sentence stays). Shared by all three drafts and the baseline.
Fix: "{ON} is walking and {OFF} stands on a row with no weight. Give its lit
strip a cell, and hear two chains that share nothing." (≤ 118 with the longest
names.) Better still, have the code insert the state as `stuck` does.

**A-c-14** · teaser.running.low · "turn structure up: a style arrives, and
kick, hat, kick, snare never will."
Spec §3.1: "below 1 no row is a dead end and no walker is ever stuck" — so
`running.low` is also shown over *empty* matrices, where turning up to 1 gives
`nothing`, not a style.
Verdict: imprecise, edge case (the standing-line rule again); harmless on the
opening example.
Fix: "turn structure up and the walk reads its matrices; kick, hat, kick,
snare never arrives."

### statistical-feedback

**A-c-15** · shows · "Six voices share one pulse by keeping books"
Spec, first line: "Six voices **and a silence** share one pulse." §1: "Silence
is a citizen, not a gap. It has a weight, it takes turns, it keeps a ledger."
Verdict: imprecise — one of the four things §1 says the page "is built to make
audible" is dropped from the nameplate. (Also `share`: "Six voices, one
ledger".)
Fix: "Dice have no memory, and the ear hears the difference. Six voices and a
silence share one pulse by keeping books: turn memory off and hear the weights
as dice." (30 words.)

**A-c-16** · meta.description · "Turn the ledger off and the same weights
become dice."
Spec §2.6: "**The books are kept identically either way.** The toggle decides
only whether selection *reads* them, and that asymmetry is the experiment."
§9.6: "The memory toggle updates the books without reading them … skipping the
charge while it is off deletes the toy."
Verdict: **wrong**. The ledger is never off; that it keeps running while
unread is the whole argument of the page.
Fix: "Turn memory off and the same weights become dice."

**A-c-17** · og.description · "a ledger of attention, and one switch that
turns it into dice."
Same lines; "it" is the ledger.
Verdict: imprecise.
Fix: "…a ledger of attention, and one switch that stops selection reading it:
dice."

**A-c-18** · text, block 1 · "That is Charles Ames' fair share, and it is the
whole law."
Spec §1 quotes Ames' fair-share principle; §2 says "That is the whole law"
after SELECT *and* CHARGE, and SELECT carries the stress offset `A/W` and the
scatter `H·U/W` (§2.2).
Verdict: harmless; "furthest behind" stands in for "lowest value" and the two
extra terms are the hints' business.
Fix: none required.

**A-c-19** · start.notStarted · "one option takes every turn: six voices, or
the silence."
Spec §5: "One selection per tick." Read cold, "one option takes every turn" is
a monopoly.
Verdict: imprecise.
Fix: "press ▶ Play, or the Space bar, and every turn goes to one option: six
voices and a silence." (89)

**A-c-20** · start.nothing · "turn a voice's weight up, or open silence."
Spec §2.3 and code (see the head of this file): with every voice at 0,
silence's weight is 0 at any `p`.
Verdict: **wrong** — the second remedy does nothing and the state line stays.
Shared by all three drafts and the baseline.
Fix: "nothing carries any weight, so nobody can be chosen — not even silence.
Turn a voice's weight up." (97)

**A-c-21** · share · "Six voices, one ledger"
Spec §2: a statistic `S[m]` per option — seven ledgers; §7 "One centre-zero
bar per option."
Verdict: harmless ("the ledger" as the display is the spec's own usage in §7).

### possibles

**A-c-22** · shows · "write makes a branch exist, heavier makes it matter"
Spec §3.1: "a new branch starts at count 1 because it exists, once"; §1:
"weight, which decides **how much** it matters."
Verdict: imprecise — a branch matters from the moment it exists (weight 1,
in the menu); heavier makes it matter *more*.
Fix: "Existing and mattering are different questions: write makes a branch
exist, heavier decides how much it matters, and only the machine speaks."
(22 words, over by two — or drop "only": "and the machine alone speaks.")

**A-c-23** · teaser.text and teaser.running · "turn bias left and the heavy
branches win, right and the light ones do."
Spec §4 table: bias +½, γ = 0, "even: every weight becomes 1"; +1, γ = −1,
"contrary: … what carries least is preferred." The light branches win only
past +½; from 0 to +½ the heavy still lead, less.
Verdict: imprecise (the baseline's own wording); harmless on a phone.
Fix: "turn bias left and the heavy branches win; right, they even out, then
the light ones win." (teaser.running: 86)

**A-c-24** · start.running · "press heavier and the machine takes that branch
more often."
Spec §4: the draw is `count^γ`, `γ = 1 − 2·bias`; past bias +½, γ < 0 and a
heavier branch is taken *less* often.
Verdict: imprecise (true at the default bias 0 and anywhere ≤ +½).
Fix: "press heavier and, bias at 0, the machine takes that branch more
often." — or leave; the edge is a contrary-bias desk experiment.

Claim draft: **24 objections** (3 wrong: A-c-13, A-c-16, A-c-20).

---

## Draft: question (`draft-question.md`)

### front

**A-q-1** · blurb possibles · "Does a motif that exists already matter?"
Spec §3.1: a new branch "starts at count 1 because it exists, once"; §4: every
child is in the menu with weight `count^γ`.
Verdict: harmless as a question — but the mechanism's answer is "yes, with
weight one", so the room may answer it in a word.
Fix (optional): "Does a motif that exists matter more?" is the question heavier
actually tests.

### motif-memory

**A-q-2** · text, block 1 head · "Nobody is recording."
Spec §1: "recording is continuous and invisible"; §2: "Each carries a rolling
record of the last two bars it played"; §10.2: "Capture is not an action.
Recording is continuous and invisible."
Verdict: **wrong** as a sentence of fact — every voice is recording all the
time. What is absent is a recorder beside the ensemble and an act of capture.
Fix: "Nobody presses record." (The body that follows then reads correctly.)

**A-q-3** · text, block 2 · "while the amount of music holds."
Spec §3.5 (see A-c-2).
Verdict: imprecise by degree.
Fix: "while the law holds the amount of music."

**A-q-4** · text, block 2 · "Where did the memory go, and did you hear it
leave?"
Spec §8: "At fidelity 0 the memory turns as a full loop of ghosts under a
stream of inventions: plainly still at hand, and inaudible." §3.3: the memory
"is gone" only on release of MEM.
Verdict: imprecise metaphor — at f = 0 the memory has not gone anywhere; the
knob stops it being heard.
Fix: "Where did the memory stop being heard — and did you hear it stop?"

**A-q-5** · teaser.text · "Fidelity is how much of that it keeps: ride it down
and the voice invents again"
`FIDELITY_HINT`: "0 pure generation **with the memory still held**"; spec §8
as above. The previous sentence used "keeps" for *holds the two bars*; this
one uses it for *plays them*.
Verdict: imprecise (two senses of "keeps" in consecutive sentences, and the
second contradicts the hint).
Fix: "Fidelity is how much of that it plays: ride it down and the voice invents
again, with the amount of music held."

**A-q-6** · teaser.text · "at the same amount of music"
§3.5; see A-c-2. Verdict: imprecise by degree. Folded into the A-q-5 fix.

**A-q-7** · teaser.text, teaser.running · "each of the five voices keeps the
two bars it just played" — first-press edge, as A-c-4. Harmless.

### markov

**A-q-8** · meta.description · "A first-order Markov chain: two walkers, four
states each"
Spec §1: "Polyphony is therefore not a richer chain, it is *another chain* …
This page runs two of them."
Verdict: imprecise (one chain named, two run).
Fix: "Two first-order Markov chains: four states each, thirty-two weights, one
step of memory apiece. Build a style, then ask it for a phrase. A playable
paper."

**A-q-9** · og.description · "Two chains, four states, thirty-two weights."
Spec §2: "Two walkers, four states each."
Verdict: imprecise (reads as four in all).
Fix: "Two chains, four states each, thirty-two weights."

**A-q-10** · start.notStarted.weightsSet · "both walkers start" — as A-c-11.
Fix: "the walkers start."

**A-q-11** · start.nothing · "both chains stand on their rest" — as A-c-12.

**A-q-12** · start.running.one · "Tap a cell in its rest row: do two chains
share anything?" — **wrong** in the non-rest case, as A-c-13.
Fix: "{ON} is walking and {OFF} stands on a row with no weight. Give its lit
strip a cell: do two chains share anything?"

**A-q-13** · teaser.running.low · "a style arrives" — edge, as A-c-14.

**A-q-14** · start.running.both · "then ask for kick, hat, kick, snare. Does it
ever come round?"
Spec §1: "Give it both weights and the chain chooses between them at random on
every pass, so the figure dissolves the moment it is asked to repeat."
Verdict: harmless as a question, but the honest answer is "now and then, by
chance, and never reliably" — a listener who hears it once has not refuted
the page.
Fix (optional): "Does it ever hold?"

### statistical-feedback

**A-q-15** · meta.description · "One switch turns the ledger into dice."
Spec §2.6 (see A-c-16).
Verdict: imprecise bordering on wrong — the ledger is not turned into
anything; selection stops reading it. The draft's own og line has it right
("one switch stops reading them").
Fix: "One switch stops selection reading the ledger: dice."

**A-q-16** · text, block 3 · "A weight at zero leaves the game, ledger frozen,
and comes back owing."
Spec §3: "it re-enters carrying that same statistic." `S` is "turns taken,
less turns owed" (§2.1): a voice parked while *ahead* comes back ahead.
Verdict: imprecise (the writer's own doubt is correct).
Fix: "A weight at zero leaves the game, ledger frozen, and comes back where it
left."

**A-q-17** · text, block 3 · "Did you write the metre, or did the ledger?"
Spec §2.5: "What that produces is a metrical hierarchy nobody wrote down … The
metre lives entirely in the shape of `A`."
Verdict: harmless and supported — the stress shape is the hand's, which voice
lands on which step is the ledger's; the question is fair.

**A-q-18** · teaser.text · "When does it stop sounding like a machine?"
Spec §8.6: "`H = 0` with flat stress, `p = 0` and six equal weights gives a
strict rotation of period 6 … Loosen any one of those and periodicity is
gone." §7 (teaser): "At 0 the stream is not clockwork … the stream has no
period up to 4 000 ticks."
Verdict: imprecise — at 0 on the opening pool it is already not a machine in
the §1 sense (a rotation); the spec's word for H = 0 is "regular".
Fix: "When does it stop sounding regular?"

**A-q-19** · start.nothing · "or open silence." — **wrong**, as A-c-20.

### possibles

**A-q-20** · text, block 1 · "That motif exists; the machine has it on the
next cell."
Spec §4: "The tree is read live. A branch written between two cells is in the
**menu** on the next one." The reader must be standing at the node the branch
hangs from — at the root, after a phrase ends — before it can be drawn.
Verdict: imprecise ("has it" reads as "plays it next"); the phrase is the
baseline's.
Fix: "That motif exists, and it is in the machine's menu from the next cell."
(The writer's timing question: the lookahead is 150 ms and a cell is 250 ms
at 120 bpm, §7, so at worst the cell after next.)

**A-q-21** · text, block 2 · "Write a branch, listen for it, press heavier.
When did it start to count?"
Spec §3.1: "a new branch starts at count 1 because it exists, once."
Verdict: imprecise — it counted from the write.
Fix: "Write a branch, listen for it, press heavier. How much did it count
before you pressed?"

**A-q-22** · start.running · "Press heavier and listen for when it starts to
matter."
Same line. Verdict: imprecise.
Fix: "press write on a strip and that branch exists. Is it heard yet? Press
heavier and listen for it mattering more." (113)

**A-q-23** · start.running, text block 2 · heavier → "more" — the contrary-bias
caveat of A-c-24; harmless at the default.

Question draft: **23 objections** (3 wrong: A-q-2, A-q-12, A-q-19).

---

## Draft: rulesheet (`draft-rulesheet.md`)

### front

**A-r-1** · blurb statistical-feedback · "Six voices share a pulse by keeping
books."
Spec: "Six voices and a silence." Verdict: harmless at 14 words; the og and
share drop it too, so the toy's seventh citizen never reaches a share preview.
Fix (og): "Six voices and a silence share a pulse by keeping books…"

### motif-memory

**A-r-2** · text, block 3 head "Forget." and teaser.text head "Remember, then
forget."
Spec §8: at fidelity 0 the memory is "plainly still at hand, and inaudible";
`FIDELITY_HINT`: "0 pure generation with the memory still held"; §3.3: the
memory "is gone" only when MEM is released. The block's own body says "score
still held", which its head contradicts. The author's share text uses
"forget" for this knob, so the word is his; the spec never gives it to
fidelity.
Verdict: imprecise metaphor — it names a mechanism (forgetting) the knob does
not have; MEM off is what forgets.
Fix: heads "Invent." and "Remember, then invent." — the body already says the
rest.

**A-r-3** · text, block 1 · "rate is how often it gets the chance."
Spec §4: rate is "grid cells between this voice's opportunities" — a higher
rate is *fewer* chances.
Verdict: imprecise direction; harmless.
Fix: "rate is how far apart its chances are."

**A-r-4** · teaser.text · "The music stays as dense."
§3.5; see A-c-2. Verdict: imprecise by degree.
Fix: "The amount of music is held."

**A-r-5** · teaser.shut, on all four pages · "running, but nothing reaches
you. Unmute it on the desktop page."
Code, every page: `shut` is every voice muted **or** `fx.master <= 0`.
Verdict: imprecise (the writer's own flag is right: for a master at zero
"unmute" is the wrong instruction).
Fix: the baseline's "it is muted, or at zero, on the desktop page." (68)

**A-r-6** · teaser.text · "Press memory: at the next bar line each voice keeps
the two bars it just played" — first-bar edge, as A-c-4. Harmless.

### markov

**A-r-7** · text, block 1 · "Tap any cell: both walkers start on the example."
Spec §5: "no standing line may state what a matrix holds as though it were a
fact about the page." §8: "Tap adds a step" — the tap that starts the page
also writes into it. §4: "both" is conditional on the rest rows.
Verdict: overclaim (the example, in standing text) and imprecise (the start
gesture edits, unsaid).
Fix: "Touch the rack or the trail and the walkers start on whatever the
matrices hold; the page opens on an example. A tap on a cell also adds a
step."

**A-r-8** · text, block 1 · "a tap in a rest strip restarts a walker."
Code line 341: only a walker standing on its rest.
Verdict: imprecise.
Fix: "after clear, a tap in a rest strip starts that walker."

**A-r-9** · text, block 3 · "A first-order chain cannot repeat a figure that
uses a state twice"
Spec §1: "What it cannot **hold** is a figure that uses a state twice … the
chain chooses between them at random on every pass." By chance it repeats the
figure now and then.
Verdict: imprecise (repeat ≠ hold; a listener who hears it twice has a
counter-example to the sentence as written).
Fix: "A first-order chain cannot hold a figure that uses a state twice."

**A-r-10** · teaser.text · "At 1 each walk reads the example's weights as
written"
Standing-line rule, as A-c-10. Verdict: overclaim.
Fix: "At 1 each walk reads its matrix as written and has a style."

**A-r-11** · start.notStarted.weightsSet · "Tap any cell and both walkers
start."
As A-r-7 and A-c-11: the tap writes a step, and "both" is conditional.
Fix: "the matrices hold weights. Touch the rack or the trail and the walkers
start." (78)

**A-r-12** · start.running.one · "Tap a cell in its rest strip. The two chains
share nothing." — **wrong** in the non-rest case, as A-c-13.
Fix: "{ON} is walking and {OFF} stands on a row with no weight. Give its lit
strip a cell. The two chains share nothing."

**A-r-13** · teaser.notStarted · "1 plays the example, 0 is dice."
The phone reads the same persisted session as the desktop (spec §5); after a
desktop edit "the example" is false on the phone too.
Verdict: imprecise. Fix: "turn structure. 1 plays the matrices as written, 0
is dice." (56)

**A-r-14** · teaser.running.low · "A style arrives." — edge, as A-c-14.

**A-r-15** · teaser.shut — covered by A-r-5.

### statistical-feedback

**A-r-16** · meta.description · "Switch the books off: dice."
Spec §2.6, §9.6 (see A-c-16).
Verdict: **wrong** — the books are never off.
Fix: "Switch memory off: dice."

**A-r-17** · og.description · "One switch turns the books off and leaves the
dice."
Same. Verdict: **wrong**.
Fix: "One switch stops selection reading the books and leaves the dice."

**A-r-18** · text, block 3 · "Dice have no memory, and the ear hears the
difference (Ames' fair share)."
Spec §1: the aphorism is the toy's claim (the author's); Ames' is "the
resources falling most behind their fair share of usage receive first
consideration going forward". The parenthesis hangs the author's line on
Ames.
Verdict: misattribution by placement.
Fix: move the credit to block 1 — "The next turn goes to whoever is furthest
behind: Ames' fair share." — and leave the aphorism bare.

**A-r-19** · text, block 3 · "weight is how often, level how loud."
Spec §2.5: "**The weight is a share of charge, not a share of turns**"; §8.3:
crash takes 6.64 % of turns on 4.31 % of weight. The spec's own §5 says "the
weight is how often" in passing.
Verdict: imprecise, but the spec's own shorthand; harmless beside "stress is
cost".
Fix (optional): "weight is its share, level how loud."

**A-r-20** · start.nothing · "or open silence." — **wrong**, as A-c-20.

**A-r-21** · teaser.text head · "Dice with a ledger."
Spec §9.2: "Selection is 'lowest value wins', not a sampled distribution. The
randomness enters as a perturbation of a comparison, never as odds." §1:
"Statistical feedback is the third thing: choice with a ledger."
Verdict: harmless (it is the baseline's head), but the spec's own phrase is
more exact.
Fix: "Choice with a ledger."

**A-r-22** · share · "Six voices take turns by the books, not dice. One knob
loosens them."
Spec §4: heterogeneity is "how loosely the ledger is read". "them" is the
voices or the books. Verdict: harmless.
Fix: "One knob loosens how closely they read them."

### possibles

**A-r-23** · teaser.text and teaser.running · "Right, it dissolves."
Spec §4 table: +½ even, +1 "contrary: … what carries least is preferred."
Past +½ the figure does not dissolve, it inverts.
Verdict: imprecise at the far right (the baseline's wording).
Fix: "Right, it evens out, then turns contrary." (teaser.running: "turn bias.
Left, the figure sharpens. Right, it evens out, then inverts." 66)

**A-r-24** · start.running · "Press heavier and the machine takes that branch
more often." — contrary-bias caveat, as A-c-24.

**A-r-25** · text, block 3 · "the press to zero cuts the branch."
Spec §3.2: "At zero the branch is cut away, **and everything under it goes
with it**."
Verdict: harmless; the subtree is the part a hand regrets.
Fix: "the press to zero cuts the branch and everything under it."

Rulesheet draft: **25 objections** (4 wrong: A-r-12, A-r-16, A-r-17, A-r-20).

---

## answers to the writers' notes

**claim**
- "Make five random voices remember" (og): supported — the phone button
  "throws every voice's MEM switch at once" (§8). On the desktop one dot is one
  voice; the og is read off a phone preview, so the plural is fair.
- "nothing to hit on the beat": fine; §1 says "nothing to press on the beat".
- "amount of music never moves": the condition you name (density left at
  capture) is §3.4's; the thing you did not name is §3.5 — monophony loses up
  to a third of the law's events for the kick at rate 1, and the spec calls
  that "the one way the conservation of amount fails to reach the ear". Say
  "held", not "never moves" (A-c-2, A-c-3). "listen for the crossing" is the
  right register for the f = 0 accent leak.
- "the ear hears the difference" on the phone: your handling is right — §8.5
  reaches "most of the way to dice" with the ledger still read, and your
  teaser says "toward dice".
- "a style arrives" (running.low): the spec's word, yes, but see A-c-14 — the
  line is shown over empty matrices too.
- sf `shows` at 28 words with "keeping books" and "turn memory off": the
  right two phrases; the thing it lost is the silence (A-c-15).

**question**
- (1) "the machine has it on the next cell": the phrase is the spec's (§4,
  "in the menu on the next one") and the baseline's. It is true of the *menu*,
  not of the sound — the branch is drawn only when the reader next stands at
  the node it hangs from. Timing is not the problem (150 ms lookahead against
  a 250 ms cell). Say "in the machine's menu from the next cell" (A-q-20).
- (2) "kick, hat, kick, snare" while walker 1's strips run kick, snare, hat:
  no issue. The figure is §1's own, and the argument needs only that a state
  recurs; strip order is a layout fact.
- (3) "comes back owing": take your own safer wording (A-q-16). `S` is signed;
  "the debt it went away with" in §3 is the case the spec chose to describe,
  not the only one.
- The phone's narrower question on sf ("can the same shares sound like
  dice?") is the honest one and §8.5 is its warrant; keep the split.
- "A playable paper." / "One of four playable papers." tags: not a mechanism
  matter. Nothing in them claims anything.
- "Questions with a possible no": on markov the "no" can be a "yes" by chance
  (A-q-14); on possibles the "already matter" question has a one-word answer
  (A-q-1). Neither is an error; both are things the author should expect to be
  answered from the floor.

**rulesheet**
- "Unmute it on the desktop page": yes, it reads as a lie for a master at
  zero, on all four pages; take the fallback (A-r-5).
- "Press reseed: the style stays, the bars change": supported. §8: "Reseed is
  an argument, not a utility. One press gives the same matrices different
  walks, with the sounds, the tempo and every weight untouched"; §1: "no two
  bars are the same bar".
- "(after Assayag and Dubnov)" after "Existing and mattering": if added, keep
  "after" — the two-verb split is the page's claim about their model, not
  their claim (spec preamble: "the two come apart into separate verbs — which
  is the whole of what this page adds to the model"). Never write "factor
  oracle": the cited paper's title is about oracles, the model here is
  Incremental Parsing, and no draft has made that slip.
- sf `shows` at 29 words: the most accurate nameplate of the three on that
  toy. Keep it.
- "A browser toy." in each og: no mechanism claim; the cop's call.
- Your nouns list is checked against the code and is right.

**to the author, not the writers**
- The markov spec's §1 cites "§5.5 of that paper" for "nouns but no verbs".
  The submitted paper has §5.1–§5.4; the phrase is in §5.1 and §5.4. The
  drafts say "§5" and are right; the spec should be corrected before SMC.
- The paper's Conductor (§3, §3.2) has a stochastic timer and no inter-event
  dependency; the markov spec's header says the chain is a port of a Conductor
  trigger. A line like "In the Conductor a hand plays the matrix" (claim) is
  spec-true and paper-absent (A-c-9). Decide which the room is to believe.

---

## verdict

**Errors all three drafts share**
1. statistical-feedback `start.nothing`: "or open silence" — **wrong**; with
   every voice at zero silence's weight is zero at any setting (§2.3; code
   241–251). Inherited from the baseline. (A-c-20, A-q-19, A-r-20.)
2. markov `start.running.one`: "tap a cell in its rest row" — **wrong** when
   the stalled walker stands on a sound; the remedy is the row its lit strip
   marks (code 341). Inherited from the baseline. (A-c-13, A-q-12, A-r-12.)
3. "memory off" written as "the ledger / the books off" somewhere in the
   meta or og of every draft — the ledger is never off, and that is the
   experiment (§2.6). Claim meta+og, question meta, rulesheet meta+og.
4. motif-memory's amount of music stated as an absolute ("never moves", "the
   same amount", "stays as dense") where §3.5 measures the ear-level
   conservation failing for the kick at rate 1. Say "held".
5. markov standing lines that assume the opening example: "both walkers
   start", "a style arrives", and — in claim and rulesheet — "the example"
   in `teaser.text`, against §5's rule that no standing line states what a
   matrix holds.
6. possibles' heavier → "more often" and bias-right → "light branches win /
   dissolves", both true only on the left half of the bias range (§4 table).
   Harmless at the default; wrong past +½.
7. Minor and shared: memory as the first press on the phone keeps one bar,
   not two (§3.2, §8); "dice" means a uniform draw on markov and weighted
   dice on statistical-feedback.

**Most accurate, toy by toy**
- **motif-memory — claim.** Fewest and lightest objections; nothing wrong.
  Rulesheet is the most literal about the mechanism ("freezes", "snaps to 1",
  "score still held") and would lead if its "Forget." heads were changed.
  Question has the one factual error on this page ("Nobody is recording").
- **markov — question.** Its `teaser.text` ("the written grammar") and
  `teaser.notStarted` avoid the example trap, and its §3.2 sentence is the
  only one of the three that states what the paper actually counts. It needs
  "chains" plural in the meta and og. Rulesheet carries the example in
  standing text twice and "cannot repeat"; claim carries it once.
- **statistical-feedback — question, narrowly.** Its og ("one switch stops
  reading them") is the most exact sentence about the memory switch in any
  draft; its meta still has "turns the ledger into dice". Rulesheet has the
  most accurate `shows` of the three but two wrong lines in meta/og and a
  misplaced Ames credit. All three share the silence error and all three but
  the rulesheet's `shows` drop the silence from the nameplate somewhere.
- **possibles — rulesheet.** It names the controls as the code names them
  and never says a branch "starts to matter". Claim's `shows` has "heavier
  makes it matter"; question's text and `running` both have "starts to
  count / matter". All three share the bias-right and heavier-at-contrary
  edges.

**Counts.** claim 24 (3 wrong) · question 23 (3 wrong) · rulesheet 25
(4 wrong). The differences are small; the shared list above matters more than
the ranking, and items 1 and 2 are in the baseline pages today.
