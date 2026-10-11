# Critique, round 2 — the SMC academic

Every sentence of the three revised drafts re-read against the toy's
`spec.md`, the `state:` functions in `toys/*/index.html`, and the paper where
cited. Each round-1 objection was checked against the spec, not against the
writer's `## answers` line. Only unresolved round-1 points and new problems
are numbered, continuing from round 1 (claim from A-c-25, question from
A-q-24, rulesheet from A-r-26). Verdicts as before: **wrong** / **overclaim**
/ **imprecise** / **harmless**.

**The two baseline errors are gone from all three drafts.**

- statistical-feedback `start.nothing`: claim "nothing carries any weight, so
  nobody can be chosen — not even silence. Turn a voice's weight up."; question
  "no voice carries any weight, so nobody can be chosen, silence included.
  Turn a voice's weight up."; rulesheet "nothing carries any weight, so nobody
  can be chosen. Turn a voice's weight up." All three match `AMES.weights`
  (silence's weight is `p/(1−p)·ΣW_voices`, zero when the voices are) and spec
  §2.3. The phone `nothing` lines on all three name only a weight. Correct.
- markov `start.running.one`: claim "{OFF} stands on a row with no weight.
  Give that row a cell"; question "{OFF} stands where no weight leads on. Give
  its lit strip a cell"; rulesheet "{OFF} stands on a strip with no weights.
  Give its lit strip a cell." All three match `walking = … rowSum(i,
  walk[i].state) > 0` (line 341) and spec §8 ("The current state of each
  walker is lit on its own strip"). Correct.

Also gone everywhere: "the ledger / the books off" (every meta and og now says
memory off stops the reading); "never moves / stays as dense" (every amount
line now says "held"); "the example" in standing text; "the light branches
win" on the phone; "has it on the next cell" (now "in the machine's menu").

---

## Draft: claim (`draft-claim.md`)

Round 1: **24 of 24 resolved.** Every fix checked against the spec holds,
including A-c-9's "In the instrument a hand plays the matrices; here they
walk alone" (spec §1, with the Conductor unnamed; still flagged to the
author in the draft's notes, rightly) and A-c-14's "what is written returns"
(true over empty matrices too).

### motif-memory

**A-c-25** · teaser.text · "Fidelity is how much of that it keeps."
`FIDELITY_HINT` (index.html 889): "0 pure generation **with the memory still
held**"; spec §8: "At fidelity 0 the memory turns as a full loop of ghosts …
plainly still at hand, and inaudible." The sentence before this one says the
voice "loops what it just played", so "keeps" reads as "keeps playing", and
at 0 it keeps the score and plays none of it.
Verdict: imprecise — the same two-senses-of-"keeps" fault as A-q-5, which the
question draft took ("how much of that it plays").
Fix: "Fidelity is how much of that it plays."

**A-c-26** · teaser.running · "Turn fidelity down and listen for a seam."
The spec owns "seam" and means something else by it. §3.5: "**At the seam it
can** [collide]. The window is collision-free as a stretch of time and not as
a loop: its last cell and its first were fifteen cells apart when they were
recorded and become neighbours the moment it turns." §8: "**A ghost that
lands on a bar line every second bar, at fidelity 1, is the seam.**" The seam
is the join of the loop — a dropped kick at the turn, present at fidelity 1,
unrelated to the fidelity crossing. (On possibles §8 "seam" is a phrase
boundary — a third meaning in the collection.) The writer's note cites "§7"
for "the bar line at fidelity 1"; §7 is Timing and has no seam.
Verdict: imprecise — a spec term used for a different mechanism; a specialist
who has read §3.5 will listen for the wrong thing (and, on the kick at rate 1,
find it, which refutes nothing about the crossing).
Fix: "press memory: at the next bar each voice loops. Turn fidelity down:
where does memory end?" (85) — or "…and listen for the join." if a noun is
wanted; "join" is not a spec word.

### markov

Nothing. Every layer checked: `shows`, meta, og, the three text blocks, the
teaser block ("the walks follow what a hand wrote"), all seven desktop words
and all six phone words are inside the spec. "dice" is glossed as the uniform
draw where the page has room (text, "style to dice" on the dial's ends).

### statistical-feedback

**A-c-27** · teaser.text · "Turn heterogeneity up and the shares loosen toward
dice; proportions never move, only when each comes round."
Spec §8.5: "**`H` cannot shift a share** … What it changes is regularity";
§4: heterogeneity is "how loosely the ledger is read". "Shares" and
"proportions" are the same quantity, so the sentence says the shares loosen
and then that they never move.
Verdict: imprecise (self-contradicting on the one fact §8.5 exists to state).
Fix: "Turn heterogeneity up and the turns loosen toward dice; the shares never
move, only when each comes round."
(Beside it, "nobody clumps, nobody starves" is harmless but relative: §8.4,
memory ON, `crash`'s longest wait is 66 turns — 16.5 s at the page's 120 bpm —
against 188 for dice. Nobody starves *compared with dice*.)

**A-c-28** · teaser.running · "turn heterogeneity up: the same shares, now in
clumps and droughts, like dice."
Spec §1: "A weighted random stream gives you clumps and droughts" — that is
the description of **memory off**, which the phone cannot reach. §8.5: from
H = 0 to H = 2 the gap CV reaches 0.57–0.70 "against about 0.9 for pure dice";
"`H` sweeps the texture from clockwork … to **most of the way to** dice, with
the proportions nailed at every point." §7 (teaser): "loosens the grain
**toward** pure dice." The ledger is still read at every setting of the
dial, so it still repays: §8.4's droughts (188 turns) do not occur at any H.
Verdict: **overclaim** — the phone line promises the memory-off texture from
a dial that never leaves memory on.
Fix: "turn heterogeneity up: the same shares, less regular, loosening toward
dice." (76)

### possibles

Nothing. "with bias at 0" (running), "dissolves, then inverts" (both phone
lines) and "a hand answers them one at a time" are each inside §4's table
and §1. "You cannot strike a drum here: bias only leans how it chooses" is
§1 and §8 ("Bias is the one thing on this page that changes what the machine
says without writing the tree").

Claim draft: **4 new objections** (1 overclaim: A-c-28; 3 imprecise). No
wrong lines.

---

## Draft: question (`draft-question.md`)

Round 1: **22 of 23 resolved.** A-q-23 is argued rather than fixed and is
re-raised below. "Nobody pressed record." is right (spec §1: "nothing to aim,
nothing to select, nothing to press on the beat"; §10.2: "Capture is not an
action"). "while the law holds the amount of music" is §3.4 exactly ("the
law is exact"; "the expected rate is `d` at every fidelity"). "comes back
where it left" is §3 ("it re-enters carrying that same statistic"). "in the
machine's menu from the next cell" is §4. "the paper's §3.2 counted what a
second step would cost" is the paper's own words ("such as a second-order
Markov chain").

### front

Nothing wrong. `.sub`'s "an instrument with no memory" is the paper's §5.4
("states without memory"); §5.1 adds that "the architecture's only memory is
timbral", which is the kind of memory nobody means here. Harmless. The
possibles blurb "A motif exists. Does it matter yet?" keeps the round-1
caveat (A-q-1: the menu's answer is "yes, weight one"); the writer's answer
— it asks the ear — is fair, and the `running` and text lines now ask "more".

### motif-memory

Nothing. Checked in particular: `shows` "fidelity is how much each replays"
(§4 "how remembered the stream is"; inert while MEM is off, which "replays"
implies correctly); `teaser.running` "press memory: next bar, each voice loops
what it played. Ride fidelity down: still a loop?" (§3.4: at f = 1 "a verbatim
loop"; below 1 "the pointer advances with the clock at every step whatever
the fidelity" — so the honest answer is "yes, a loop you hear less of", which
the question invites); `start.nothing` "nothing to remember" (§3.1 "Only what
sounded is recorded"); "where it stops being heard" everywhere "the memory
went" used to be (A-q-4 taken properly).

### markov

Nothing. The `nothing` line ("Tap a cell in a lit strip: what may follow the
state it marks?") is the most exact of the three drafts, since the lit strip
is where the walker stands whatever history put it there (code 341, spec §8).
"Does it ever hold?" (running.both, text) is the right verb for §1 ("What it
cannot hold"), and "come round" is kept for the phone, where a chance
recurrence is what the ear meets.

### statistical-feedback

Nothing. `shows` "a dial loosens the reading" is §4 ("how loosely the ledger
is read"); `teaser.running` "each plays as often, less predictably. Does it
sound like dice yet?" is §8.5 to the letter ("it makes the rare
unpredictable" with the shares unmoved) and "yet" keeps "toward". The meta's
"One switch stops the reading, and the same weights are dice" is §2.6.

### possibles

**A-q-24** (re-raises A-q-23) · start.running · "Press heavier and listen for
it mattering more."
Spec §3.2 BUMP raises `count`; §4: a branch is drawn with probability
∝ `count^γ`, `γ = 1 − 2·bias`, so past bias +½ a heavier branch is drawn
*less*. The writer's answer — "matters" is the weight, which heavier raises at
any bias — is true of the number and not of the ear: "listen for" makes it a
claim about what is heard, and what is heard past +½ is the opposite.
Verdict: harmless at the default (bias 0, where the page opens), unsupported
on the right half of the dial. The claim and rulesheet drafts both qualify
("with bias at 0" / "at centre").
Fix: "press write on a strip and that branch exists. Do you hear it yet?
Press heavier and, bias at centre, listen for it coming round more." (≈ 125)

Nothing else. `teaser.text` "Bias leans the walk, left toward heavy branches,
right toward the light" is correct across the whole range — it states a
direction, and the share of the heavier branch is monotone in γ — where the
round-1 "the light ones win" was not. `text` block 1 "That motif exists, in
the machine's menu from the next cell" is §4 ("in the menu on the next one").

Question draft: **1 new objection** (harmless). No wrong lines.

---

## Draft: rulesheet (`draft-rulesheet.md`)

Round 1: **25 of 25 resolved** (A-r-25 refused on budget, which I accept: the
subtree cut is the lighter button's hint's job and the line as written is
true). Checked in particular: "Invent." for the fidelity block and "Remember,
then invent." (spec §8: at 0 the memory is "still at hand"); "rate is how far
apart its chances are" (§4); "A first-order chain cannot hold a figure"
(§1); "reads each matrix as written, grammar and all" (no claim about what
the matrix holds); the Ames credit moved to the rule ("whoever is furthest
behind: Ames' fair share", which is the fair-share principle §1 quotes); "Memory
off stops the reading: dice" (§2.6); "evens out, then turns contrary" (§4
table, +½ "even", +1 "contrary"); "with bias at centre" (bias runs −1…+1,
§5, so centre is 0, the faithful setting).

### motif-memory

**A-r-27** · teaser.running · "Turn fidelity down: the loop wanders."
Spec §3.4: "**Fidelity never *moves* an event.** It invents on silent cells
and removes existing ones, and that is the whole of it." "The rolls are fresh
at every step, so a partly remembered stream **breathes** rather than
freezing into a second pattern."
Verdict: imprecise metaphor, harmless on a phone — "wanders" suggests events
drifting off their cells, which is the one thing the law forbids; the spec's
own word for what the ear gets is "breathes".
Fix: "press memory: each voice loops what it just played. Turn fidelity down:
the loop breathes." (85) — or "…the loop frays."

### markov

**A-r-26** (the A-c-12 edge, new on this draft) · start.nothing · "both
walkers stand on their rest, and a rest with no weights goes nowhere. Tap a
cell in a rest strip."
Code: `nothing` fires when `weightsSet() == 0` at structure 1 (line 812);
`walk[i].state = 0` only on `clear` (line 699) or on a draw (414). A matrix
emptied cell by cell under a walker standing on kick leaves it on kick, where
a rest-strip tap moves nothing. The round-1 rulesheet avoided this ("both
matrices are empty. A rest with no weights goes nowhere. Tap a cell in a rest
strip."); the revision introduced the assertion.
Verdict: imprecise, edge case — a regression. The draft's own `running.one`
and `stuck` lines use the lit strip correctly.
Fix: "the matrices are empty, so neither walker can move. Tap a cell in the
strip a walker stands on; after clear, a rest strip." (≈ 112)

Nothing else: "Press reseed: same weights, different walks" is §8 ("the same
matrices different walks, with … every weight untouched"); "1 plays what is
written" and "What is written comes back" state nothing about what the
matrices hold.

### statistical-feedback

Nothing. `shows` is the most exact nameplate of the three ("furthest behind
goes next. One dial loosens it toward dice" — §2, §8.5); "every wait sinks it
a little" is CHARGE's `−A·W[k]/ΣW` (§2); "Choice with a ledger" is §1's own
phrase; "the shares hold, the order loosens toward dice" is §8.5 with
"toward" kept.

### possibles

Nothing. "Nothing else speaks", "that motif is in the machine's menu from the
next cell", "the press to zero cuts the branch", "bias moves no weight:
squares stay, edges move" are §1, §4, §3.2 and §8 respectively.

Rulesheet draft: **2 new objections** (both imprecise, one a regression). No
wrong lines.

---

## answers to the writers' notes

**claim**
- "seam is the spec's own word for the bar line at fidelity 1 (§7)": it is the
  spec's word, in §3.5 and §8, for the *loop's join* — the collision a voice
  over the ring/cell line suffers where cell 15 meets cell 0, drawn as "a
  ghost that lands on a bar line every second bar, at fidelity 1". It is not
  the memory/invention crossing and it does not come from turning fidelity.
  See A-c-26.
- "The two edges said 'at the default'": right on possibles ("with bias at
  0") and right on markov ("what is written returns"). Nothing to add.
- The open author decisions (the instrument line, the possibles phone arguing
  the claim's second half, the og tag): none is a mechanism question; the
  instrument line is spec-true and paper-absent as before.

**question**
- A-q-23's defence ("matters" is the weight, bias is the draw's business):
  answered at A-q-24. The number rises at any bias; what "listen for" promises
  does not.
- Keeping two questions on statistical-feedback (desk: dice from a ledger;
  phone: can the same shares sound like dice): still the honest split; §8.5
  is the phone's warrant and the nameplate's "a dial loosens the reading"
  gives it a gesture without claiming the switch.
- "holds" at the desk, "come round" on the phone: both fine; §1 says "cannot
  hold", and a chance recurrence is what a phone ear would report.
- `.sub` "an instrument with no memory": the paper's §5.4 ("states without
  memory"); fine.

**rulesheet**
- A-r-25 refused on budget: accepted; the sentence is true as written and the
  subtree is in the hint.
- "Phone `running` lines each end on something to hear": the loop "wandering"
  is the one cue that names a mechanism the law forbids (A-r-27); the other
  three are inside the specs.
- "figure on the phone, motif on the desktop" (C-r-20): no mechanism issue;
  §8 of possibles uses both.
- "stress loop" for the panel's on-screen title: correct; the spec's §7.1 calls
  it "the stress loop, eight bars in a titled panel".

**to the author (unchanged from round 1)**
- The markov spec cites "§5.5 of that paper"; the paper has §5.1–§5.4 and the
  phrase is in §5.1 and §5.4.
- The paper's Conductor has a stochastic timer and no matrix; the markov spec
  says the chain is a port of a Conductor trigger. The claim draft's "In the
  instrument a hand plays the matrices" rests on the spec.

---

## verdict

**Round-1 objections resolved:** claim 24 of 24 · question 22 of 23 ·
rulesheet 25 of 25. **New:** claim 4 (one overclaim) · question 1 (harmless)
· rulesheet 2 (one a regression). No draft has a line that is wrong against
the spec; round 1's ten wrong lines are all gone.

**Errors still shared:** none of substance. What remains is per-draft:
- claim: the phone listening cues on two pages promise the wrong thing —
  "a seam" (a spec term for the loop's join) and "clumps and droughts, like
  dice" (the memory-off texture, from a dial that never leaves memory on) —
  and the sf teaser block says the shares loosen and never move in one
  breath; "keeps" is still ambiguous in the motif-memory teaser.
- question: "listen for it mattering more" is unqualified on the bias range.
- rulesheet: markov `nothing` regressed to "stand on their rest"; "the loop
  wanders" names a motion the law forbids.
- harmless and shared, as in round 1: the memory button is one-way in the
  `running` line (release is in the hint); "dice" is a uniform draw on markov
  and weighted dice on statistical-feedback, and each page says which.

**Most accurate, toy by toy, now**
- **motif-memory — question.** Every layer inside the spec; "Nobody pressed
  record", "the law holds the amount", "where it stops being heard", "still a
  loop?" are the most exact sentences any draft has on this page. Rulesheet
  is a close second ("score still held"; only "wanders"). Claim carries "a
  seam" and "keeps".
- **markov — claim and question, level.** Both clean in every layer. Question
  has the best `nothing` line (the lit strip) and the best §3.2 sentence;
  claim has the best `running.one` ("stands on a row with no weight. Give
  that row a cell"). Rulesheet has the one regression.
- **statistical-feedback — rulesheet, narrowly over question.** Rulesheet's
  `shows`, meta, og and text are all exact and its phone lines keep "toward";
  question is equally clean and its phone running line ("each plays as often,
  less predictably") is the most exact statement of §8.5 in any draft. Claim
  has the two phone overclaims.
- **possibles — claim and rulesheet, level.** Both qualify heavier by the
  bias setting and give the whole bias range on the phone. Question's
  `running` is the one unqualified line.
