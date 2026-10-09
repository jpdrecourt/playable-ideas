# markov — mechanism spec

Two walkers step through four states each on a sixteenth-note lattice. Each
walker owns sixteen weights saying how often each of its states may follow each
other state; a rest is one of the four. Nothing else exists. The page opens
on an example pair of matrices, and one control empties them for a visitor to
build their own.

This document is the toy's other medium. It carries the mechanism, its
parameters, its audio graph and its timing, at the level a reader needs to
rebuild the instrument somewhere else — another language, another audio
framework, hardware. Where a choice is arbitrary this file says so.

The mechanism is the trigger of **Chaos Conductor**, ported:
`src/lib/markov/MarkovStateMachine.{h,cpp}` (the state machine) and
`src/plugins/markov_trigger/PluginProcessor.cpp` (the per-opportunity path that
drives it). §3 states the step rule so that this page can be rebuilt without
those files.

**Licence: CC0.** Copy it, port it, sell it, no attribution required.
Attribution is nonetheless welcome: this page lives in the Playable Papers
repository — `REPOSITORY URL TO BE SET BEFORE PUBLISHING` — and its author at
[noisewrangler.art](https://noisewrangler.art).

---

## 1. The claim

**A first-order chain gives every state exactly one future, and a chain is
monophonic.**

Those are the two halves, and everything on this page is a consequence of one
or the other.

**One future.** The chain's memory is its current state, so what may follow is
a function of that state alone: each state owns one distribution over
successors, consulted afresh every time the walk arrives there. What that buys
is real. Lean kick toward hat, hat toward snare, snare back toward kick, and
the walk acquires a local logic — every step answers the one before it, so the
output has a *style*. Two bars of it are unmistakably the same instrument
playing, and no two bars are the same bar.

What it cannot hold is a **figure that uses a state twice**. Take four steps
anyone could hum — kick, hat, kick, snare, coming round again. The kick must
lead to the hat on its first appearance and to the snare on its second, and
there is nowhere to put that difference: the kick's row is one set of odds.
Give it both weights and the chain chooses between them at random on every
pass, so the figure dissolves the moment it is asked to repeat. No assignment
of weights fixes this. It is not a shortage of weights, it is the shape of the
model.

The escape is degenerate and worth naming: a matrix with exactly one non-zero
weight per row does repeat, because each state then determines its successor —
but the cycle can only be as long as the number of distinct states in it, and a
state can appear at most once. Even with the chance taken all the way out,
kick, hat, kick, snare is not expressible. The representation, not the
randomness, is the limit.

**Monophonic.** A walker is in exactly one state at a time, so it sounds at
most one thing per cell. Polyphony is therefore not a richer chain, it is
*another chain*, and the two share nothing: not a state, not a weight, not a
random stream. This page runs two of them. Sixteen weights each, thirty-two in
all, and each remembers one step. The counting argument of the SMC26 paper
(§3.2) is exactly this: the parameters grow with the voices and buy no
structure across them. §5.5 of that paper puts the consequence as "nouns but no
verbs" — material without temporal structure.

**One honest qualification.** In the Conductor the matrix is played, live: a
performer moves weights while the instrument sounds, and the phrase — where
there is one — comes from their hands on the matrix, not from the chain. The
chain supplies material that rewards being steered. This page shows the chain
alone, with the performer's hands taken out of the loop, which is why the
shortfall is so plain here and is not a verdict on the instrument.

## 2. The state space

Two walkers, four states each. State 0 of a walker is its **rest**; states 1–3
are sounds.

| walker | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| 1 | rest | kick | snare | hat |
| 2 | rest | tom | rim | cowbell |

The rest is not a fourth sound and the surface never treats it as one: it wears
a plain grey where the sounds have identity colours, and its strip has no level
and no mute, because there is nothing to level. It is a state like any other to
the chain, and that is the point — silence is composed by the same mechanism as
sound.

The six sounds are the library palette used unchanged, with the library's own
trims and colours, so a rhythm found here can be rebuilt in another toy of the
collection: the kick here is the kick there. Nothing is recorded and the page
carries no audio.

**Why these six.** They are audibly unlike one another within a walker and
across the pair, and none of them has a long tail or a pitch. A crash lasts
most of a bar and smears the cell it was drawn on; a plucked note invites the
ear to hear melody where the page is arguing about order. Both would blur the
figure the toy wants heard.

## 3. The step rule

A walker's matrix `W` is 4×4 of non-negative weights: row = the state now,
column = the state that may follow. On the surface a weight is a whole number
0..4, because a finger sets it in steps; nothing in the rule requires that.

```
DRAW-NEXT (W, current) -> state
    sum = Σ_c W[current][c]
    if sum <= 0:  return current          # empty row: the draw is idempotent
    r   = uniform(0, sum)
    cum = 0
    for c in 0..3:
        cum += W[current][c]
        if r <= cum: return c
    return current                        # cum fell short of r: stay
```

Both tails matter to a port, and both say the same thing: **the chain stays
where it is.** The empty-row branch is what makes the machine *idempotent* on a
dead row instead of throwing or picking arbitrarily. The second is the
floating-point case where the accumulated sum lands a hair under the draw, and
it stays put for the same reason — reaching back for the last non-zero column
would advance the walk on an arithmetic accident, and a walk that moves because
of rounding is a walk two ports will not agree on. Whole weights sum exactly
and never reach that branch; fractional weights, which nothing in this rule
forbids, can. Neither is reachable often; both are what make two ports of this
agree.

**A weight is a relative frequency, not a probability.** A row is normalised by
its own sum, so raising one weight lowers every sibling's share without
touching their numbers. This is why the surface can be integer steps and still
express any ratio a player wants.

### 3.1 Structure: how closely the walk reads the matrices

One dial, `structure` `s` in 0..1, decides how the draw reads a row. At
**`s = 1` the draw is `DRAW-NEXT` above, exactly** — the plain chain. Below 1
the row is read through a blend **in probability space**:

```
DRAW-BLENDED (W, current, s) -> state
    sum = Σ_c W[current][c]
    for c in 0..3:
        p_ex[c] = W[current][c] / sum           if sum > 0
                = (c == current ? 1 : 0)        if sum = 0   # an empty row means stay
        p[c]    = (1 - s) · 1/4  +  s · p_ex[c]
    r = uniform(0, 1);  cum = 0
    for c in 0..3:
        cum += p[c]
        if r <= cum: return c
    return current                              # float dust at the top: stay
```

At `s = 0` every state follows every state with a quarter chance — a uniform,
memoryless draw — and since the uniform share reaches every state, **below 1
no row is a dead end** and no walker is ever stuck.

Why probability space and not the weights: the example's rows carry different
totals (one to five), so blending the weights would keep a heavy row's shape at
mid-dial while flattening a light one early, and the middle of the dial would
mean something different on every row. Normalised first, every row is the same
distance from uniform at the same `s`.

**The dial is a lens, not a write.** The matrices hold what the hand wrote and
the rack shows exactly that; only the draw changes. Turning the dial back to 1
gives back the plain chain on the same weights.

## 4. The lattice

The lattice is a sixteenth-note grid at a stated bpm, and every cell is a step
for every walker.

```
cell = 60 / bpm / 4

ON-CELL (t, walker)                         # t = the cell's own timestamp
    if s == 1 and rowSum(walker.state) <= 0:  # 1. a dead end: no advance,
        return STUCK                          #    no emission (only at s = 1)

    next = (s == 1) ? DRAW-NEXT(walker.W, walker.state)            # 2. one step
                    : DRAW-BLENDED(walker.W, walker.state, s)
    walker.state = next

    if next == 0:                           # 3. a rest was drawn
        return REST

    play(walker.sound[next], t)             # 4. what the walk draws, sounds
    return HIT(next)
```

Three things in that order are load-bearing.

**A dead end is silent, not repeated.** The state machine's own `advance()`
returns the current state on an empty row — it stays put. A caller that then
sounded the returned state would fire the same sound on every cell for as long
as the row stayed empty. The trigger guards instead: empty row, nothing happens
at all.

This is not an edge case, it is how a walker **stops and starts**. An empty
matrix is four dead ends: both walkers stand on their rest, and the first
weight in a rest row is what starts that walker. Empty a walker's rest row and
it stops the next time it lands there. It follows that the surface owes a
sentence naming where a walk is standing and what to do about it (§8): a
stopped chain and a running chain nobody can hear are indistinguishable from
outside.

**A rest is a state and nothing more.** The cell on which state 0 is drawn is
silent, and the next cell draws from the rest's own row. A long silence is
therefore a heavy rest→rest weight, and its length is geometric: weight 3 on
rest→rest against weight 1 on rest→kick gives silences averaging about four
cells and occasionally reaching twenty. There is no rest-length parameter,
because the chain already has one and it is called a weight.

**What sounds is what the walk draws.** There is no gate at the voice's door
and no per-walker probability. A composed event is a sounded event, which is
why the trail below can be read as the walk itself rather than as a sample of
it.

**Each walker owns its random stream.** Two walkers drawing from one generator
would make walker 1's sequence depend on how many draws walker 2 had made, so
adding a weight to walker 2 would change walker 1's walk — the opposite of the
claim. Both streams are derived from one seed, so a reseed moves the whole
performance and a saved seed replays it.

## 5. Parameters

| control | range | default | notes |
|---|---|---|---|
| walker 1's matrix | 16 cells, 0..4 steps each | the example: rest → rest 1, rest → kick 1; eleven more weights (`default.json`) | tap adds a step, a tap past full clears, a long press (420 ms) clears from any level |
| walker 2's matrix | 16 cells, 0..4 steps each | the example: rest → rim 1; seven more weights (`default.json`) | the same |
| bpm | 40..200 | 86, the example's (factory 100) | one cell is a sixteenth |
| structure | 0..1, step 0.01 | 1 | how closely the walk reads the matrices: 0 a uniform draw, 1 the matrices as written (§3.1). A lens on the draw; the matrices are not touched |
| seed | — | random per session | drives both walkers' streams; `reseed` swaps the walks and leaves the matrices |
| level, mute | per sound | unity, open | the library rack, writing the voice's own bus |

There is **no parameter beyond the matrices and how they are read**. No
density, no rest length, no rest variance, no rate, no per-walker anything.
The master strip carries the master chain, the tempo and the structure dial,
and nothing else. Whatever is not the chain is not on this page, and §9 says
what went and why.

**Why the page opens on an example.** A Markov matrix is daunting to someone
who has never met one: sixteen empty cells per walker say nothing about what
they are for. The page therefore opens on a pair somebody built — `default.json`
beside the page, JP's matrices of 2026-10-05 — so the first touch is followed
by a walk worth hearing, and the visitor learns what a matrix *does* before
being asked to write one. The argument still lands from the inside, and the way
there is one control: **`clear`** empties both matrices, both walkers stand on
their rest, and the first weight in a rest row starts that walker. That empty
start is where the discovery lives — a figure you are trying to write will not
go in.

The opening material is resolved in a fixed order: a returning visitor's own
session, else the example, else the factory parameters, which are the empty
matrices at 100 bpm. A page opened straight off a disk cannot fetch the
example, so it opens empty and says so once on the status line. The tempo is
material here, so the example's 86 bpm travels with the matrices and the
factory tempo is not rewritten to it.

**Why the weight cap is 4.** A cell is set by touch, so the weight is a count
of taps and the count has to stay short enough that a visitor will make it.
Four steps against a row of a dozen or so total weight is enough ratio to
express "usually this, sometimes that, rarely the other". A port with a drag
gesture could use a continuous weight and change nothing in §3.

**State persists.** Both matrices, the tempo, the seed, the mixer strips and
the master chain autosave to the browser and come back on reload; Save and Load
write the same snapshot as a file. Thirty-two numbers set one at a time is the
most expensive thing on the page to lose.

**Nothing reopens sounding, and nothing has to be zeroed to keep that true.**
The audio context is constructed inside the visitor's first press and never at
load, so a restored page is silent until a hand asks for sound — and then it
resumes the grammar it was left with, which is what a restored matrix is for.
A page whose gate is a saved parameter has to force that parameter back to
zero; a page whose gate is the start gesture does not.

Two consequences the surface carries. The page opens on the example only
**once**, so no standing line may state what a matrix holds as though it were
a fact about the page — the lines that say so are driven by the matrices. And
the instrument needs a way back to nothing, which is what `clear` is for;
clearing is the single irreversible act here, so it asks twice.

## 6. Audio graph

Every sounding event is one call into the shared voice library, which owns the
whole chain: `synth → 3 ms attack / exponential decay → the voice's pan → the
voice's bus (level, mute) → master`, and the master is the standard one
(gain → waveshaper drive → glue compressor → dry + small room → limiter).

There is nothing between the chain and the voice. This toy shapes no timbre and
adds no effect: the mechanism under study is *when and what*, and a page that
also invented a synthesis layer would put two unfamiliar things in front of a
visitor at once.

**No pan column.** One walker plays three sounds and the two walkers are
already separated by their timbres, so spreading them across the image would
decorate a distinction the ear has. The rack's columns are the level, the mute
and the sixteen weights, which is what this instrument is.

**Polyphony is capped by the model, not by a limiter.** Each walker fires at
most one sound per cell, so no voice is re-struck faster than one cell — 150 ms
at the default tempo, 75 ms at the top of the range — and two walkers can
collide on a cell, which is the sound of two chains sharing a lattice. Where a
port offers several sounds per cell, or a much longer voice, a per-voice cap
becomes necessary.

**The voice mode is Cloud** — hits layer freely, except where the library's own
voice defaults ask for stealing (the kick does). The instrument offers two
others and this page has neither; see §9, because a port that has them will
hear the same walk phrased differently, and that is a genuine difference rather
than an implementation detail.

## 7. Timing

The house lookahead scheduler: a coarse 25 ms timer schedules every cell inside
a horizon of `now + 0.15 s` at absolute audio-clock timestamps, and the cell
duration is read live at each tick so a tempo change alters only cells not yet
scheduled. Timer jitter never reaches the audio. **One ticker drives both
walkers**: they share the lattice and nothing else.

Three behaviours a port must keep:

- **Widen the horizon when the page is hidden** (to ~1.6 s) and narrow it on
  return. Background timer throttling is around a second and starves a 150 ms
  horizon, which is heard as the audio stopping on a tab switch.
- **Walk a cell already in the past, and sound none of it.** If the page was
  hidden long enough to outrun even the widened horizon, a backlog scheduled at
  past timestamps sounds the instant it is scheduled — one clump on return. The
  chains still step through those cells, because the walk not stopping is the
  claim; only the audio is dropped.
- **Release the display against the audio clock, not the scheduler.** Events
  are composed up to a horizon ahead of the sound, so the trail and the lit
  strip are queued with their timestamps and shown when the audio clock reaches
  them. Drawn at scheduling time, the walk is seen an eighth of a second before
  it is heard.

That release queue needs a bottom. It is drained on animation frames, which do
not run in a hidden tab while the walks do, so a page left open in a background
tab would otherwise grow one entry per cell for as long as it is there. Oldest
entries are dropped, because what a returning visitor wants is the walk they
came back to.

## 8. The surface

The layout is incidental; these properties are not.

**The rack is the instrument, and the matrices are in it.** A weight is a
playable parameter, so it is a rack cell. There are eight strips, in state
order, each walker's group opened by its rest:

```
rest · kick · snare · hat        rest · tom · rim · cowbell
```

Every strip reads the same way: name, then mute and level, then four cells
saying what may follow this state — next is the rest, next is the group's first
sound, next its second, next its third. A rest's strip is the standard shape
with its mixer cells empty, so the columns line up and anything a rest grows
later is one more column rather than a different kind of row.

**The four "next" columns mean different sounds in each group**, so each group
is headed by its own caption row of swatches. Without it the columns would be
four anonymous positions, and matching a column against a row label eight times
is asking a visitor to learn a palette before they can play.

**A cell is a weight, and its fill is the value.** Tap adds a step; a tap past
full clears, so the whole range is reachable by tapping alone; a long press
clears from any level, which is the shortcut rather than the only way. A press
that travels is a scroll and writes nothing. A cell wears the colour of the
state it points **at**, because that is what the weight buys, so a column that
is often set shows as a stripe of one hue.

**Targets.** A weight cell is wider than the 44 px floor and shorter than it,
which is what fits eight strips of the standard shape on one screen. A mis-tap
is reversible in one gesture: tapping again cycles the weight round to zero.

**The current state of each walker is lit on its own strip.** That is what
makes a dead end visible as a light that has stopped moving, and it is where a
visitor looks to see which row they are editing.

**The trail is time, which a strip cannot hold.** Two lanes, one per walker,
the last two bars of that walker's states as thirty-two discrete slots. A hit
is a block in the drawn sound's colour, a rest is a low dash, a dead end is a
warn tick. Repetition, or its absence, is a property of a span rather than of a
moment, and the trail is where the visitor sees a cycle hold and then dissolve.
Since there is no gate, what the trail draws is both what was composed and what
was heard.

**The lane wears its walker's colour and the marks wear their sound's.** The
walker hue names the lane and ties it to its group in the rack; the marks have
to keep the sounds' own colours or the cycle the toy exists to show cannot be
read off the strip.

**A dead end is reported in words, and every line about silence agrees.** A
chain standing on an empty row and a chain nobody can hear look and sound
exactly alike — nothing. The one thing a visitor cannot deduce from silence is
which of the two they have, so the surface says it, naming what the walkers are
standing on and what to do about it. After `clear` that same line is the
instruction for the empty start. A mechanism with a silent absorbing state owes
its user this sentence.

It owes something further, which is easy to miss because each line is correct
on its own: **the surface has one account of the silence and gives it
everywhere**. A page whose status line reads "stuck on rest" while its
instruction reads "raise the level to hear it" has told the visitor two
different things about the same moment, and the one it put at the top is the
one they will act on. So the state is computed once and every line is a view of
it, in a strict order of urgency: not started, then nothing built, then stuck,
then shut, then running.

**Reseed is an argument, not a utility.** One press gives the same matrices
different walks, with the sounds, the tempo and every weight untouched. For a
visitor who believes they have written a figure it is the fastest available
disproof, and it states the general fact — what a matrix holds is a grammar,
and a grammar is not a pattern.

**The start gesture.** No modal "click to begin" and no transport button: the
first press anywhere on the instrument unlocks the audio and is the same press
that lands on the cell it was aimed at. There is no play button because a walk
has no beginning: it runs from the first touch, and after `clear` the matrices
are silent, so a control reading "play" would start nothing. The unlock checks: a rejected or
still-suspended context is indistinguishable from playback with the volume
down, and the gesture stays armed for a second press. Every control is reachable
by Tab, the instrument is itself a tab stop that answers Enter, and the start
line names that route.

The master chain and the tempo sit outside the armed region on purpose —
setting an output level is not asking for sound — and so do the level and the
mute inside the rack. A hand that lands on one of those is answered by name
rather than ignored, and the answer names a control that does start the
instrument.

**Say it in the visitor's language.** "A first-order transition matrix over a
four-state alphabet" is four unexplained terms; "a row is the state playing
now, and the cells along it are what may follow" is the same fact. The thesis
leads — thirty-two numbers for two walkers, and each remembers one step — and
the conclusion waits until the end of the page, where a visitor arrives having
already tried to write a figure and failed.

**Widths.** Desktop first: one column throughout, and the rack scrolls
horizontally rather than reflowing, because the columns lining up down the page
is what the rack is. Below the collection's teaser width the page is the
teaser.

**The structure dial on the desktop.** It sits in the master strip beside the
tempo. It shapes the walk and does not ask for sound, so it declines the start
gesture and answers a cold hand by name. It is on the desktop as well as the
phone because its value persists: a desktop page without it could play a
blended chain with nothing on screen saying so.

**The teaser.** A phone shows one dial, `structure`, and the trail; the rack,
the tempo, the master chain and the session bar are the desktop's. The dial is
a twin of the desktop one — two controls writing one parameter, each showing
the other's writes — and touched from cold it starts the audio and the walk.
The phone opens at 1, the example as JP wrote it.

Why one dial from a uniform walk to the example is the smallest thing that is
still this toy: the collection's phone pages each run between randomness and
the structure their mechanism affords, and this mechanism's structure is a
grammar. At 0 there is none — every state a quarter chance. At 1 there is the
example's, and the walk has a style. Between them the grammar loosens
continuously, and at no setting does a phrase appear: kick, hat, kick, snare
needs two steps of memory and each chain has one, which is §1's claim heard
from the other side. The dial is a **lens and not a write**, so the example
survives every turn of it and the desktop's rack keeps showing what the hand
wrote. The trail is kept because it is passive and it is where the grammar is
seen dissolving. The phone's start line names the dial, never a cell, since no
cell is on the phone; below 1 nothing can be empty or stuck, so the phone's
`nothing` and `stuck` lines exist only at 1 and say to turn the dial down.

**What the middle of the dial does to the rests**, measured on the example
(exact stationary shares of the blended chain): walker 1's rest→rest odds fall
from ½ at 1 to ¼ at 0, so its silences shorten from two cells on average to
1.33, and its share of rests falls from 0.38 to 0.25. Walker 2's rest row
holds only rest → rim, so its rest→rest odds *rise* from 0 to ¼ as the dial
falls: its silences lengthen from one cell to 1.33, and its share of rests
stays near a quarter throughout (0.25 at 1, 0.27 at ½, 0.25 at 0). The two
walkers meet the uniform draw from opposite sides.

## 9. What is left out, and why

Everything that is not the chain is off this page, and the list is longer than
the page: **no density gate** at the voice's door, **no rest length and no rest
variance**, **no rate divider**, **no breath**, **no presets**, **no per-walker
control of any kind**. A gate makes the trail a sample of the walk rather than
the walk; a rest length is a parameter for something the chain already does
with a weight; rate and breath are statements about the meter rather than about
the chain. This is further from the Conductor than a page with those dials
would be, by design: the claim is about what a first-order chain can and cannot
hold, and every dial beside it is an argument about something else.

**Voice Mode.** The instrument has one voice-level switch deciding what a new
sound does to what is already sounding: **Patience**, where a sound claims its
length and the metronome waits for it; **Chop**, where a new sound cuts
everything that voice is sounding with a short declick; and **Cloud**, where
sounds simply layer. This page is Cloud, and only because that is what the
shared voice library does — not by a choice made here. The omission has teeth:
Chop and Patience change how a walk is *phrased* without changing a single
weight, so two ports of these matrices can sound genuinely unalike. A port that
has any of the three should say which.

**More than two walkers.** Two is what carries the second half of the claim:
one is not polyphony and three is the same fact a third time at fifty per cent
more screen. The parameter count is *per walker*, and that a third costs
another sixteen is better stated by the pair than shown by filling the page.

**The performer's hands.** In the Conductor the matrix is edited live, and that
editing is where phrase-scale structure actually comes from. This page keeps
both matrices editable while they play — there is no mode boundary — but it
makes no attempt to show a performance of a matrix, and a visitor who only
listens will hear the chain at its most limited.

**Motifs.** `MotifTypes.h` in the source repository is the answer the
instrument's author reached for next: a sliding window recording the last eight
events, stored motifs, and a small Markov chain selecting between them — a
second-order structure over phrases rather than over sounds. It is the sequel
to this page's argument and deliberately not on it.

## 10. What must survive a port

Keep, or it is a different instrument:

1. The chain is **first-order over a flat state space**. One step of memory, no
   history, no counter — so every state carries exactly one distribution over
   successors. Everything the page claims follows from this.
2. **The rest is a state**, drawn from the same matrix as the sounds, with no
   length of its own. A long silence is a heavy rest→rest weight and its length
   is geometric. Silence placed by the grammar is not the same object as
   silence left by a gate, and an instrument with only the second one cannot
   punctuate.
3. **A weight is a relative frequency within its row**, normalised by the row's
   own sum.
4. **An all-zero row is a dead end** at `structure` 1: the machine stays, the
   trigger emits nothing. Not a re-fire, not a uniform draw, not an error.
5. **The empty instrument is stopped**, and the first weight in a rest row
   starts that walker. Whatever the page opens on, the empty matrices must be
   one action away, because writing a matrix from nothing is where the
   argument lands.
6. **What the walk draws is what sounds.** No gate, no probability between the
   chain and the voice. A port that adds one has changed what the display can
   be trusted to mean.
7. **There are two walkers and they share nothing** — no state, no weight, no
   random stream. Only the lattice. A weight added to one must not alter the
   other's walk, and a visitor must be able to hear that they are not
   coordinated.
8. **Every weight is directly editable while it plays.** No mode, no page, no
   menu. The count being uncomfortable is the argument; hiding it behind
   navigation answers the argument instead of making it.
9. **Some view shows a span of each walk**, not only the present state.
10. **The walks are re-rollable without touching the matrices.** Without that,
    a visitor has no way to tell a grammar from a pattern, and the page's
    central claim rests on their patience instead of on one press.
11. **The sounds are audibly unlike one another**, within a walker and between
    the two. What the trail shows as repetition has to be hearable as
    repetition, and what it shows as two independent lanes has to be hearable
    as two.
12. **The structure blend is in probability space** (§3.1): each row is
    normalised before it is mixed with the uniform row, an empty row reads as
    "stay", `s = 1` is the plain chain exactly, and the dial reads the
    matrices without writing them.

Incidental — change freely:

- The palette, the synthesis, the whole master chain, the colours.
- The lattice's subdivision (a sixteenth here; an eighth is the same engine),
  the tempo range, and the default tempo.
- The weight cap and the gesture that sets it. Integer steps under a tap are
  one answer; a drag and a continuous weight is another, and §3 is unchanged.
- Persistence, and therefore the `clear` control that persistence makes
  necessary. The opening example — the material, not the fact that one exists
  and that `clear` leaves it.
- The number of states per walker. Four is small enough that a visitor can hold
  one matrix in their head, which is what makes the failure of the figure
  legible rather than merely reported. What is not incidental is that the rest
  is one state among them.
- The trail's two-bar span, and the presence of a mixer at all.

**Guesses, not ear values.** Every number below was chosen by reasoning and has
not been heard against a listening pass: the two walker hues (`#8f86d8` and
`#d2789e`), the trail's two-bar span, the 420 ms long press and its 9 px travel
tolerance, the weight cap of 4, the factory tempo of 100 bpm, and the
structure dial's default of 1 and its 0.01 step. The blend law is the lead's;
how its middle sounds waits for JP's ear. The example's matrices and its
86 bpm are JP's.
