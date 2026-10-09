# motif-memory — mechanism spec

Five stochastic voices share one pulse. Each carries a rolling record of the
last two bars it played, kept without being asked for and never audible as a
recording. Throwing a voice's **MEM** switch freezes that record as its score
at the next bar line, and the voice begins playing it. One knob per voice —
**fidelity** — then decides, cell by cell and on a fresh roll every time, how
much of the stream is the frozen score and how much is invention, at an
unchanged amount of music throughout.

This document is the toy's other medium. It carries the mechanism, its
parameters, its audio graph and its timing, at the level a reader needs to
rebuild the instrument somewhere else — another language, another audio
framework, hardware. Where a choice is arbitrary this file says so.

**Licence: CC0.** Copy it, port it, sell it, no attribution required.
Attribution is nonetheless welcome: this page lives in the Playable Papers
repository — `REPOSITORY URL TO BE SET BEFORE PUBLISHING` — and its author at
[noisewrangler.art](https://noisewrangler.art).

---

## 1. The claim

**Memory is a state of a voice, not a structure beside the ensemble**, and the
crossing into it can be made inaudible.

Two things follow, and either could be wrong. The first is that capture need
not be an action: recording is continuous and invisible, so the performer
decides *that* a passage was worth keeping and never *which* window to keep —
there is nothing to aim, nothing to select, nothing to press on the beat. The
second is that the distance between a remembered passage and a freshly
generated one can be a continuum a hand rides rather than a switch, because
the quantity the ear counts — how much music there is — is held fixed across
the whole of it while the quantity the ear recognises — where the music falls
— moves. A crossing that changes both at once announces itself. This one only
announces itself if the performer makes it.

## 2. The state space

```
Voice {
  id, name, colour            # identity; see §6
  density   : 0..1            # chance of sounding at each of its own opportunities
  rate      : 1|2|4|8|16      # grid cells between its opportunities
  fidelity  : 0..1            # how remembered the stream is
  strip     : { gain 0..1.5, mute bool, pan -1..1 }    # the output bus, §6

  mode      : 'gen' | 'mem'   # generating, or playing a claimed memory
  want      : bool            # where the performer has put the switch
  pending   : 'mem' | 'gen' | none   # a throw waiting for the bar line

  current   : list of (cell 0..7, gain)     # the bar being filled
  window    : up to 2 completed bars, oldest first
  score     : array[16] of gain or HOLE     # frozen; a hole is a silent cell
  scoreCells: 16 (or 8 — see §3.2)
  loopStart : integer tick at which the score's cell 0 fell
}

Global { bpm 40..300, seed uint32, master chain (§6) }
```

Every quantity the memory system touches is an **integer cell index**, never a
duration. The window holds cells and gains; the score is an array indexed by
cell; playback position is the ticker's own integer tick index taken modulo
the score's length. Seconds enter only where sound and drawing do. That is why
a voice can cross into its own past with no timing slop at all: there is no
second clock to disagree with the pulse.

A bar is `CELLS_PER_BAR = 8` cells; a cell is an 8th note, so the grid is 4/4
read on 8ths. A window is `WINDOW_BARS = 2` bars — one size, every voice, not
adjustable.

## 3. The rule

### 3.1 The window

While a voice is generating, at every cell where `tick % rate == 0` it rolls
its density. If the roll passes and the collision rule (§3.5) lets the event
through, the voice sounds and the event is appended to `current` as
`(tick mod 8, gain)`.

At every bar line — every tick where `tick % 8 == 0` — a generating voice
pushes `current` onto `window`, drops the oldest bar if `window` now holds
more than two, and empties `current`.

**Only what sounded is recorded.** An event the collision rule refuses is not
in the window, which is what makes a captured window playable: a stretch of
time the voice managed once it can manage again.

An engaged voice records nothing and its window does not advance, so nothing
the audience did not hear can enter it.

### 3.2 Claiming a memory

The switch is thrown whenever the hand reaches it and lands on the next bar
line. Between the two the switch is **armed** and the voice finishes the bar.

At that bar line, in this order:

1. the bar that has just finished joins the window (step §3.1);
2. the window's two bars are flattened into `score`, an array of
   `bars × 8` cells: `score[b*8 + cell] = gain`, holes everywhere else;
3. `mode` becomes `mem`, `loopStart` becomes this tick, and the voice plays
   relative cell 0 **on this same tick** — the one its generator would have
   had its say on;
4. **fidelity snaps to 1**, in the engine and on the knob. Claiming means
   *these two bars* are what the audience should remember, so the claim is
   verbatim by intent whatever the knob was left at.

A memory claimed at the very first bar line of a run has only one whole bar
behind it, so `scoreCells` is 8 rather than 16. Everything below holds for
either length.

Throwing the switch and throwing it back before the bar line cancels the
throw: the voice never left the state it was in and there is nothing to
resolve.

### 3.3 Releasing it

Armed at the throw, landed at the next bar line, and nothing else happens.
The law at fidelity 0 already *is* pure generation, so release changes exactly
two things: the window starts rolling again, and the memory is gone. Riding
fidelity to 0 and then releasing is a crossing with nothing in it to hear.

The window is **not** cleared on release. It resumes rolling from where it
stood, so a re-entry soon after freezes a blend of bars from before and after
the memory played. The voice's past is continuous even when what it plays is
not.

### 3.4 The law

While a voice is engaged the memory's temporal grid is fixed: the pointer
advances with the clock at every step whatever the fidelity, and every step is
settled on its own fresh roll. With `d` = density and `f` = fidelity:

```
STEP (score, rel, rate, d, f)
    if score[rel] is an event:
        removed = random() < (1 - d)(1 - f)
        emit GHOST if removed else SCORE at score[rel]'s gain
    else:
        capTick = loopStart - scoreCells + rel      # where this cell was recorded
        if capTick mod rate ≠ 0: emit NOTHING       # never an opportunity
        emit EXTRA at a fresh gain if random() < d(1 - f) else NOTHING
```

Fidelity never *moves* an event. It invents on silent cells and removes
existing ones, and that is the whole of it.

**The anchor.** A cell the memory occupies is always visited, so the verbatim
loop survives a rate move. An empty cell is visited only where the voice *had*
an opportunity while it was recording — `capTick`, not the live tick. That is
what makes fidelity 0 generation exactly rather than generation-like, and it
holds for any rate against any score length. Asking the live tick instead
would hold only while the rate divides the score; where it does not, the
opportunities walk off the remembered cells pass by pass and the two sets add
up to more chances per bar than the generator ever had.

**Three properties, and they are the instrument.**

- **f = 1** — nothing invented, nothing removed: a verbatim loop.
- **f = 0** — both branches fire with probability `d`, so every cell the voice
  would have had anyway fires at exactly the density. The event train is
  statistically the generator's again.
- **In between** — one window's expected rate is
  `f × (that window's own density) + (1 − f) × d`, and a frozen window is
  itself a `d`-dense draw, so with density left where it was at capture the
  expected rate is `d` at every fidelity. Fidelity redistributes **placement**
  toward the remembered pattern; it does not touch **amount**.

The rolls are fresh at every step, so a partly remembered stream breathes
rather than freezing into a second pattern, and a fidelity move bites at once
rather than at the next pass.

**How much of this is measured.** The recurrence is: in a symbolic port of the
scheduler at 150 bpm, 12 seeded windows per cell, 400 played bars each, the
autocorrelation of the occupancy vector at lag 16 grows nearly linearly in
fidelity — about 0.26, 0.50, 0.73, 0.90, 0.995 at f = 0.5, 0.7, 0.85, 0.95,
1.0 — essentially independently of density, and clears a 400-permutation
shuffled null at every density tested. At f = 0.85 and density 0.5 only 10% of
passes are identical to the pass before them: the shape recurs and the
realisation does not.

**One thing the law claims and the gains do not honour.** At f = 0 the *event
train* is the generator's, but the *accents* are not: a remembered event that
survives replays the gain frozen with it, identically on every pass, while an
invention draws a fresh one. Measured on the accent channel rather than on
occupancy, that leaves a small reliable signature at f = 0 — autocorrelation
0.059 at lag 16 against a 0.04 threshold, significant in 11 of 12 windows, at
density 0.75 and rate 1. The crossing at f = 0 is not
information-theoretically clean. Whether it is audible is a different question
and this measurement does not answer it.

Where the density knob sits relative to the density that was playing at
capture is the one thing that colours the blend: leave it and the amount never
changes; raise it and the remembered pattern thickens with inventions around
it; drop it and the memory thins. At f = 1 density has nothing to act on, by
construction — both probabilities carry the `(1 − f)` factor — so thinning a
memory means easing fidelity slightly off the top.

### 3.5 Collisions, and the one way the amount is not conserved

Each voice is **monophonic and nothing is ever stolen**: an event that would
overlap one already committed to that voice is dropped and the earlier
commitment stands. The check runs over scheduled intervals, not over sounding
voices, because scheduling runs ahead of playback. Remembered and generated
events meet the same rule.

One condition governs everything below it: **a voice whose sound is longer
than the gap between its own opportunities — `rate` cells at the current
bpm — cannot play two opportunities running.** The `kick` rings for 0.28 s
while a cell at 150 bpm is 0.2 s, so at rate 1 — where it opens — it is
already over that line; at 300 bpm rate 2 is. Give a voice a rate that leaves
room for its own tail and none of what follows happens: at rate 4 the kick
refuses nothing at any fidelity.

**Inside a window the memory never collides with itself**, because the window
records only what sounded. **At the seam it can.** The window is
collision-free as a stretch of time and not as a loop: its last cell and its
first were fifteen cells apart when they were recorded and become neighbours
the moment it turns. A voice over the line refuses that one event — at
fidelity 1, where the law is doing nothing at all — and refuses it again on
every pass, for as long as the memory holds.

**Inventions have no protection anywhere.** An invention landing beside a
remembered event either dies or displaces it.

Measured, for a voice with the kick's 0.28 s ring at 150 bpm, **rate 1 and
density 0.5** throughout (200 000 captured windows for the seam figure, 600
windows × 60 passes for the rest):

| | |
|---|---|
| windows holding an event on both cell 0 and cell 15 — the seam | 11.0% |
| events the law wants that never sound, f = 1 | 1.8% |
| f = 0.85 | 11% |
| f = 0.5 | 25% |
| f = 0 | 33% |

The seam thins with the density that recorded the window — 7.5% at density
0.38, 4.1% at 0.25 — and disappears entirely at rate 2, where the gap between
opportunities is longer than the ring: 0%, at every density and every fidelity.
The kick at rate 4 refuses nothing at all.

So about nine windows in ten turn verbatim in the air and the tenth drops one
event on every pass it makes; and a half-remembered stream at rate 1 loses a
quarter of what the law asked for.
None of this is the law drifting — the law is exact and every event fires on
its own cell. It is monophony meeting a grid finer than the voice, and it is
the one way the conservation of amount fails to reach the ear.

Every one of these losses draws as a ghost (§8).

## 4. Parameters

Per voice, all live at every fidelity:

| name | range | default | scale | meaning |
|---|---|---|---|---|
| density | 0..1 | see below | linear | chance of sounding at each of its own opportunities. **The sole rate control**, with MEM on or off. |
| rate | 1, 2, 4, 8, 16 | see below | five steps, equal travel each | grid cells between this voice's opportunities |
| fidelity | 0..1 | 1 | linear | how remembered the stream is; inert while MEM is off |
| level | 0..1.5 | 1 | linear | the voice's output bus |
| pan | −1..1 | 0 | linear | the voice's output bus |
| mute | bool | off | | the voice's output bus |
| MEM | bool | off | | claim the last two bars; lands on the bar line |

Global:

| name | range | default | meaning |
|---|---|---|---|
| bpm | 40..300 | 150 | the shared pulse; one cell is an 8th note |
| seed | uint32 | 1234567 | the event stream, not the palette (§6) |
| master / drive / glue / reverb | 0..1 | 0.9 / 0 / 0.65 / 0.15 | the shared master chain |

Per-voice openings, which are the values of `default.json` (§5): `kick`
density 0.29 rate 1 level 0.75, `knock` 0.45 / 2, `cowbell` 0.5 / 4, `click`
0.6 / 1, `hum` 0.14 / 8. The page's factory table carries the same values, so
reset and the double press land where the page opens, and a page that cannot
read the file plays the same five voices.

**The rate scale is the exponent, not the value.** Its 270° sweep spends equal
travel on each of the five steps; a 1..16 continuum would put half the throw
between 8 and 16. Powers of two are not decoration: every one of them divides
the bar, so a voice's opportunities fall on the bar lines the memory switches
land on and a claimed memory holds a whole number of that voice's own chances.
A rate arriving from outside the vocabulary snaps to the nearest step measured
in **octaves** — on a ratio scale 3 sits nearer 4 than 2.

**Every taper and trim in this section is unheard, and so is every default
but the per-voice openings and the tempo**, which are the state JP left the
page in on 2026-10-05. The rest are reasoned from the mechanism — long voices
get coarse rates and low densities or the texture turns to soup; the kick sits
at 75% because a 54 Hz sine at the same event gain as a click swallows the
rest — and none of them has had an ear pass. Treat every one as a guess.

## 5. The arrival state

A visitor arrives at a page that is **silent and stopped**, with five voices
holding their densities, rates and fidelities, and nothing playing. The page
opens on `default.json` beside it — five voices at 150 bpm, every fidelity at
1, nothing memorised: the visitor hears the random before the motif, on
purpose. A returning visitor's own session comes before the file; a page that
cannot read the file (opened off a disk, where the fetch is refused) says so
once and opens on its factory values, which are the file's. One
discovery stands between arrival and the first sound: the play button, which
the start line names, and which the Space bar duplicates.

**What persists** across a reload, in `localStorage` under the toy's own name:
bpm, seed, every voice's density / rate / fidelity, the mixer strips, and the
master chain. The same snapshot writes and reads as a file.

**What does not:** MEM state and window contents. Every voice loads with no
memory and an empty window, and starting the transport clears them for the
same reason — the tick index restarts at zero and a score frozen against the
old one would mean nothing. A claimed memory belongs to the run it was played
in. Nothing that makes sound reopens above zero; the page never reopens
sounding.

The storage key is the toy's name, so a session saved under an earlier name is
not read and does not come back.

**Reset** is what persistence obliges, and it is a two-press button in the
session bar. It puts the five voices back where they opened — density, rate,
fidelity, level, pan and mute — and lets go of every memory and every window,
so a voice has no past at hand exactly as it has none on arrival. It **keeps**
the seed, the tempo and the master chain: reseed is the control that owns the
seed, and the other two are the session's settings rather than the instrument's
state. It writes the snapshot as it finishes, so the reset is what a reload
finds. Pressing it with nothing to undo refuses to arm and says so.

## 6. Audio graph

Every hit is one event of one voice:

```
source(s) → shared envelope → the hit's panner
          → the voice's BUS: StereoPanner → Gain      # level · mute · pan
          → master gain → waveshaper drive → glue compressor
          → [dry + small convolution reverb] → limiter (−3 dB, 20:1) → out
```

The envelope is the library's one envelope: 3 ms attack, exponential decay
over the voice's `decay` seconds. Render voices carry their envelope baked
into the buffer and are repitched by playback rate instead.

**The bus belongs to the voice's identity, not to the hit**, which is why
level, mute and pan are the final gate on everything that voice sounds,
remembered or generated alike, and why they bite immediately — over an 8 ms
ramp, including on a tail already ringing. That is the opposite of density,
which acts on the *scheduler*: a density move changes only events not yet
scheduled, and a muted voice still schedules and still draws.

The master chain is the library's default: glue compression at 0.65
(≈ −19.5 dB, 3:1) and reverb at 0.15. The toy leaves both where the library
puts them.

**The five sounds**, in kit order — the anchor, then the kit built up from it,
then the sustain that lies underneath:

| id | kind | length | note |
|---|---|---|---|
| `kick` | synth | 0.28 s (envelope decay) | shared drum palette, synthesised per hit |
| `knock` | render | 0.09 s | sits about where a snare would |
| `cowbell` | render | — | the 808 pair of detuned tones, kept mild: triangles rather than squares, a ramped onset rather than a step |
| `click` | render | 0.01 s | |
| `hum` | render | 2.0 s | the only long voice |

Four of the five are rendered once, offline, from a seed derived from their own
name, so each always sounds like itself in this toy and in every other toy on
the same library — and no seed here can change that. `kick` is synthesised per
hit through the one envelope; its length is that envelope's decay. Playback
varies only gain.

Event gain is `0.8 × 10^(u/20)` with `u` drawn uniformly from −3..+3 dB, from
the same stream as everything else. A voice's silence is a density of 0; there
is no arm/disarm switch and no per-voice on/off beyond mute.

## 7. Timing

One lookahead scheduler drives everything. A 25 ms interval wakes and walks
every tick that falls inside the horizon, calling the tick handler with the
tick's own **absolute** timestamp; each event is scheduled at that timestamp.
The horizon is 150 ms while the tab is visible and widens to 1.6 s while it is
hidden, because background timers are throttled to about a second and a 150 ms
horizon starves.

The tick period is read **live** once per tick — `60 / bpm / 2` seconds — so a
tempo move alters only ticks not yet scheduled and there is no phase jump.

Order within a tick, and it matters:

1. if this is a bar line, do the bar-line bookkeeping: advance every generating
   voice's window, land every switch thrown during the bar;
2. per voice, play — an engaged voice puts the law to the memory cell that has
   just arrived, a generating voice rolls its density at its own opportunities.

The whole memory system rides inside that one tick handler. There is no second
scheduler that could be a tick early or a tick late, which is what makes the
crossing seamless.

**The grid's position in seconds is re-anchored on every tick**, from the
ticker's most recent tick and its index, rather than held from a start time.
After a tempo move the true tick positions no longer equal
`start + n × period`, and bar lines drawn against the old anchor would drift
off the grid the engine is actually playing.

Stopping is a 50 ms master fade, not a context close: it silences events
already committed inside the lookahead window. Starting fades in over 30 ms
and sets the first tick 50 ms ahead of the clock.

**Reproducibility.** Every draw the performance makes — the density rolls, the
gain variation, and the law's per-step rolls — comes from one seeded PRNG
(mulberry32). A fresh run from a saved seed replays the same stream. Reseeding
swaps the stream mid-run: the transport keeps running, a frozen score stays
frozen, and the timbres never move.

## 8. The surface

The instrument is the rack: one row per voice, columns aligned down the page,
in kit order. What a voice generates, what it remembers and how it sits in the
mix are the same voice, so they are the same row —

`name · mute · level · pan · density · rate · fidelity · MEM`

— the four standard columns first, then this toy's own, most-reached-for
first. On a narrow window the rack scrolls sideways rather than reflowing:
reading a column down the five voices is the point of it. The page declares no
reflow width of its own above the teaser breakpoint.

**The MEM dot has three looks and two meanings**: dark, no memory held; solid,
this voice has its own past at hand; a pulsing outline, the switch is thrown
and the bar line has not arrived — in either direction. It is the one coloured
control on the page, because what it reports is a fact about events and not a
state of the chrome.

**The timeline is the one thing a rack row cannot hold**, and what it holds is
time: five fixed lanes, one per voice, in the rack's own top-to-bottom order,
scrolling right to left with now at the right edge. It does not line up
vertically with the rack — the rack ends where the roll begins, which puts the
last row directly above the first lane. A lane is identified by the coloured
edge at its left and by the matching swatch beside its voice's name, never by
what happens to sit above it.

An event draws as a rounded bar starting at its onset and running for as long
as that voice sounds, so `hum` reads as a long sustain and `click` as a
sliver. Bars therefore overlap on a fine grid: overlap is a reading of the
sound's *length*, never a second draw of one event and never an event off its
cell.

Three marks, independent, so the combinations read without a legend:

| mark | means |
|---|---|
| fill (opacity follows gain) | it sounded |
| white outline | this voice has a memory engaged |
| dashed | the law invented it; it is not in the frozen score |

Which gives four blocks: filled plain is generated; filled with a solid white
outline is the memory sounding; filled and dashed is an invention sounding;
and an unfilled **ghost** — a faint outline in the voice's own colour, at
exactly the position and width it would have had — is an event that owed the
ear something and stayed silent. A *generated* event the collision rule
refuses draws nothing at all: only a memory owes the ear something it can be
seen to withhold.

A ghost has two causes and wears one mark: the removal roll took it, or the
collision rule refused it. They are told apart by the company they keep — a
refusal always sits within one voice-length of a bar that did sound, a removal
can sit anywhere. Under the conditions in §3.5 the refusals outnumber the
removals several times over, so a lane full of ghosts is a voice at war with
its own tail rather than a memory being thinned. **A ghost that lands on a bar
line every second bar, at fidelity 1, is the seam.**

Riding fidelity down is therefore visible as it happens: solid outlines turn
into ghosts, dashes fill the gaps between them, and — for a voice with room
for its own tail — the count of filled bars holds steady. At fidelity 0 the
memory turns as a full loop of ghosts under a stream of inventions: plainly
still at hand, and inaudible.

Faint **bar lines** run across the whole roll, drawn over the events rather
than under them so a bar sitting exactly on its line does not hide it. They
are where every memory switch lands, which is what makes them the one grid
worth drawing.

The canvas is drawn in CSS pixels into a backing store sized in device pixels,
so the picture is the same at any display density.

**The teaser.** Below the collection's teaser width the page is its phone
mode: the same engine and the same default, with the rack, the master strip
and the session bar put away. The phone keeps the play button — the piece has
a beginning, and the random before the motif is heard only after Play — and
the timeline, and gets two controls of its own:

- **memory** throws every voice's MEM switch at once, exactly as pressing the
  five dots would, so each switch lands on the next bar line. One press is
  one direction for the whole set: it claims every voice unless every voice
  already wants its memory, and then it lets them all go. It wears the dot's
  three looks for the set — solid when all five hold a memory, the pulsing
  outline while any throw waits for its bar line, dark otherwise. Pressed
  before anything has played, it starts the piece and is thrown on the
  second cell of the run, so it lands at the end of the first bar with that
  bar in it rather than freezing the silence before the run.
- **fidelity** is one dial over the five voices: a move writes the same value
  into all five, which the rack's own fidelity knobs show, and the dial reads
  the five's mean, which is that value whenever they agree. Claiming snaps
  every fidelity to 1 and the dial follows.

Nothing else is editable on the phone. Under the timeline the page invites
the visitor to the desktop and offers to send the link to themselves.

## 9. What is left out, and why

- **No way to see the window before claiming it.** Recording is invisible on
  purpose: a preview would turn claiming back into selecting, which is the one
  thing §1 says it is not.
- **No memory length control.** Two bars, every voice. A length knob makes the
  claim a decision with a parameter in it.
- **No transposition, no time-stretch, no reversal of a memory.** The score is
  played at the cells and gains it was recorded at, or it is not that memory.
- **Memories do not survive the transport or a reload.** They are of the run
  they were played in; §5 says why.
- **No polyphony per voice, and no stealing.** Both are in §3.5, and the
  refusals they cause are drawn rather than hidden.
- **The gains leak at fidelity 0** (§3.4). Stated rather than fixed: freezing a
  gain is what makes a remembered event the same event.
- **Reset does not touch the tempo or the master chain.** Both persist and
  neither is the instrument's state; §5 says what reset restores and what it
  keeps.

## 10. What must survive a port

1. **Cells, not seconds.** The window, the score and the playback pointer are
   integer cell indices on the shared grid. A port that stores the window as
   timestamps has built a different instrument.
2. **Capture is not an action.** Recording is continuous and invisible; the
   switch says *keep what I just heard*, and it lands on the bar line in both
   directions.
3. **The window holds only what sounded**, and it does not advance while the
   memory is engaged.
4. **The law, exactly**: invent on a silent cell with probability `d(1 − f)`,
   remove an existing one with probability `(1 − d)(1 − f)`, a fresh roll every
   step, and never move an event.
5. **The anchor**: an empty cell is visited only where the recording voice had
   an opportunity, measured on the capture's own tick, not the live one.
6. **Fidelity snaps to 1 on entry**, through whatever the parameter's single
   owner is, so the control and the engine cannot disagree.
7. **Monophonic, earliest-commitment-wins**, over scheduled intervals rather
   than sounding voices.
8. **One seeded PRNG** for the density rolls, the gain variation and the law,
   and none of it reaching the timbres.
9. **Anything that makes sound opens at zero**, and no memory survives a
   restart.

Incidental, and a port that reproduces it has misread this file: the five
particular sounds and their colours; the eight-cell bar and the two-bar window
as *numbers* rather than as "a bar" and "a short past"; the 40..300 bpm range;
the rack's column order; the piano roll — the timeline is one way to see the
marks in §8 and the marks are the part that matters; every default in §4,
none of which has been heard.
