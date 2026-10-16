# statistical-feedback — mechanism spec

Six voices and a silence share one pulse. Nothing here rolls dice for each of
them in turn: every option keeps a ledger — turns it has taken, less the turns
its weight entitled it to — and the next turn goes to whoever the books say is
furthest behind. The ledger is on the screen, the books always sum to zero,
and one switch decides whether selection reads them at all.

This document is the toy's other medium. It carries the mechanism, its
parameters, its audio graph and its timing at the level a reader needs to
rebuild the instrument somewhere else — another language, another audio
framework, hardware. Where a choice is arbitrary this file says so, and where
something was measured it gives the number.

**Licence: CC0.** Copy it, port it, sell it, no attribution required.
Attribution is nonetheless welcome: this page lives in the Playable Papers
repository — `REPOSITORY URL TO BE SET BEFORE PUBLISHING` — and its author at
[noisewrangler.art](https://noisewrangler.art).

---

## 1. The claim

**Dice have no memory, and the ear hears the difference.**

A weighted random stream gives you clumps and droughts; a fair rotation gives
you a machine. Statistical feedback is the third thing: choice with a ledger.
Charles Ames' fair-share principle — "the resources falling most behind their
fair share of usage receive first consideration going forward"[^ames-tutorial]
— is one line of arithmetic, and out of it come four things this page is
built to make audible rather than argue. Ames' own published account of the
method is "Statistics and Compositional Balance".[^ames-pnm]

- **Variety with balance, and the balance is exact.** Over any long stretch
  each option's share matches its weight to a fraction of a percent (§8.1),
  and it does so while the order stays unpredictable. Neither dice nor a
  rotation can do both. James Tenney's dissonant counterpoint is the same
  bargain struck by hand, and reading it as statistical feedback is
  Polansky, Barnett and Winter's.[^tenney]
- **Metre is something the ledger produces.** Stress scales what a turn
  *costs*, never its odds — so a weight buys a share of the stress spent, not
  of the turns taken, and heavy voices end up on the strong beats while light
  voices pay in many weak-beat turns (§2.5). Measured, `crash` at weight 0.5
  reached the downbeat once in 2 500 of them against `click`'s 856. Nothing is
  sequenced and no step is reserved for anyone.
- **Silence is a citizen, not a gap.** It has a weight, it takes turns, it
  keeps a ledger. Its weight is renormalized live so the *probability* of
  silence stays where you put it however many voices are in the pool (§2.3) —
  so removing a voice changes who plays and not how much space there is.
- **Removal is a weight of zero, and the ledger remembers.** An option at
  weight 0 is out of both loops, so its statistic **freezes**. Bring the
  weight back and it re-enters carrying the debt it went away with. There is
  no removal rule, no redistribution and no forgetting anywhere in this
  design — which is a claim you can check, because the bar stops moving.

## 2. The mechanism

Options are indexed `m`: the six voices, then **silence**. Each carries a
weight `W[m] ≥ 0` (a live control) and a statistic `S[m]` (its debt of
attention). At tick `n`, with stress `A = A[n mod 8]` and heterogeneity `H`:

```
SELECT
    value(m) = S[m] + (A + H·U[m]) / W[m]      U[m] ~ Uniform(-1,1), fresh
                                               per option, per tick
    m* = the option with the LOWEST value      options with W = 0 are out

CHARGE                                         # every tick, whatever selected
    S[m*] += A
    S[k]  -= A · W[k] / ΣW      for every k with W[k] > 0
```

`ΣW` is taken over options with `W > 0`. `S` starts at 0 for everyone. That is
the whole law.

### 2.1 Why the statistic is a debt in turns, and the trap in scaling it

`S[m]` is what Ames' fair-share principle needs it to be: **turns taken, less
turns owed**. One turn is taken (`+A`), and the cost of that turn is shared
out among the options in proportion to their weights (`−A·W[k]/ΣW`), so an
option that has been chosen exactly as often as its weight says sits at 0.

Two properties follow, and both are load-bearing.

**Zero-sum.** The decrements sum to `A·ΣW/ΣW = A`, cancelling the increment
exactly, so `ΣS = 0` forever. Measured over 10 000 ticks with weights moving
under the law and the pool emptying and refilling mid-run, `max |ΣS| =
2.2 × 10⁻¹³` — float noise, and it does not accumulate.

**The update alone pins the long-run shares.** At equilibrium every `S[m]` has
zero drift, so with `f[m]` the selection frequency:

```
f[m]·A  =  A · W[m] / ΣW        →       f[m] = W[m] / ΣW
```

There is no selection rule in that derivation. **Any** rule that keeps `S`
bounded lands on the same frequencies; what the selection rule chooses is the
*order*, not the shares. This is the single most useful fact for a porter, and
§2.6 and §8.5 are its consequences.

**The trap.** The obvious-looking variant — scaling the whole update by the
selected option's weight, `S[m*] += A/W[m*]` with
`S[k] -= (A/ΣW)·(W[k]/W[m*])` — is *also* exactly zero-sum, and it is wrong.
Redo the drift calculation and it gives `f[m] ∝ W[m]²`. Measured on the
shipped weights it is not subtle: `click` (W 3.0) takes 35.4% where its weight
says 25.9%, `crash` (W 0.5) takes 0.99% where its weight says 4.31%, and
silence set to 0.25 arrives at 33.1%. Zero-sum is necessary and nowhere near
sufficient; a port should check §8.1 rather than trust the invariant.

### 2.2 What the two extra terms in `value` actually do

Neither term can move the shares (§2.1). Both shape the order, and they do
different jobs.

**`A/W[m]` is a per-option offset that breathes with the stress.** At a
constant `A` it does nothing at all — a fixed offset per option just shifts
where that option's statistic sits and leaves the dynamics alone. It earns its
place the moment `A` varies: on a hard beat a light option is pushed far up
and a heavy one barely at all, so **strong beats fill with heavy voices and
weak beats level the field** (§2.5). Nothing is sequenced.

**`H·U[m]/W[m]` is a regularity control, and nothing else.** It scatters the
comparison, and scatters a light option further than a heavy one because its
`1/W` is larger. What that buys is measured rather than assumed (§8.5), and it
is not what the shape of the term suggests: across `H = 0 … 2` every option's
share holds to within **0.01 percentage points** — the update pins them and no
selection rule can move them (§2.1). What moves is how predictably each
option's turns arrive, and it moves unevenly. From `H = 0` to `H = 2` the
coefficient of variation of the gaps rises **×2.5** for the heaviest voice and
**×21.6** for the lightest, from a near-metronomic 0.03 to 0.70 — against
about 0.9 for pure dice.

So `H` sweeps the *texture* from clockwork to nearly-dice with the proportions
held exactly throughout. It does not make rare voices more frequent; it makes
them unpredictable.

**Ties are broken by index, within `1e-9`.** This is not a rounding nicety. At
`H = 0` with equal weights every option is exactly level at the end of each
round, and a bare `<` breaks that tie on floating-point residue, which differs
between engines — the clockwork would be a different rotation on a different
browser. With any `H` at all the epsilon never fires.

### 2.3 Silence is normalized live

```
W_silence = p / (1 - p) · ΣW_voices          p = the silence control, 0 .. 0.95
```

so that `W_silence / (W_silence + ΣW_voices) = p` for any number of voices at
any weights. **Silence is a probability that holds**, and that is the point:
take three voices out of the pool, or double one weight, and the amount of
space in the music does not move. Measured across three very different pools
and three settings of `p`, every combination lands within 0.0006 of `p`
(§8.2).

At `p = 0` silence has no weight and is out of the game exactly as a voice at
weight 0 is — including the freeze. The control is clamped just under 1
(**0.95**) because `p/(1-p)` diverges; the last twentieth of the control's
travel is therefore dead, which is the honest cost of this formulation. A port
that dislikes it can reach the identical probabilities with
`W_silence = p·ΣW` and voice weights scaled by `(1-p)`, which is finite at
`p = 1` — at the price of the ledger's units moving with `p`.

### 2.4 Stress scales the charge, not the odds

`A` multiplies what a turn **costs**, and it appears nowhere in a probability.
A voice taken on a heavy step pays more and stays away longer; an offbeat turn
is cheap and can recur straight away. Nothing is scheduled and no step is
reserved for anyone: `A` enters the law twice, once as the charge and once
through §2.2's offset, and that is its entire involvement.

### 2.5 The weight is a share of charge, not a share of turns

This is the least obvious thing about the instrument and the most important,
because it is what makes the metrical claim exact rather than atmospheric.

The equilibrium condition of §2.1, taken over a whole stress cycle rather than
a single tick, is

```
Σ_n f[m](n) · A[n]  =  (W[m] / ΣW) · Σ_n A[n]
```

— the weight fixes each option's share of the **stress spent**, not of the
turns taken. So when the stress varies, the two part company. Light voices,
pushed onto weak steps by §2.2's offset, need *more* turns to pay the same
charge, and heavy voices need fewer. Measured (§8.3), `crash` at W = 0.5 takes
**6.64% of the turns and 4.31% of the charge** — and 4.31% is its weight, to
0.10%.

What that produces is a metrical hierarchy nobody wrote down. Who takes which
step, as a share of that step's turns, over 20 000 ticks at `H = 1`,
`p = 0.25`, shipped stress, seed 7:

| A | click | cowbell | knock | pluck | kick | crash | silence |
|---|---|---|---|---|---|---|---|
| **1.00** (step 0) | 34.2% | 16.4% | 11.3% | 4.2% | 1.0% | **0.0%** | 32.8% |
| 0.70 (step 4) | 27.8% | 18.7% | 12.8% | 7.8% | 3.5% | 1.1% | 28.3% |
| 0.50 (steps 2, 6) | 24.7% | 18.7% | 13.2% | 9.3% | 7.0% | 4.3% | 23.0% |
| 0.25 (the offbeats) | 17.3% | 15.7% | 14.4% | 12.9% | 11.9% | 10.9% | 16.9% |

Read the first row against the last: on the downbeat the field is steeply
ordered by weight, and on the offbeats it is nearly level. In raw counts,
**`crash` reached the A = 1 downbeat once in 2 500 of them, against `click`'s
856.** No rule anywhere forbids a light voice a strong beat; it simply cannot
afford one often.

Under a flat stress pattern all of this collapses — turns and charge are the
same quantity and §8.1's table is the whole story. The metre lives entirely in
the shape of `A`.

### 2.6 Memory ON / OFF — the experiment

```
ON   select by the law above
OFF  select with probability W[m] / ΣW           # plain weighted dice
```

**The books are kept identically either way.** The toggle decides only whether
selection *reads* them, and that asymmetry is the experiment.

While memory is off, dice already realize the equilibrium frequencies, so the
ledger loses its restoring force entirely: `S` becomes an unbiased random walk
and the debts grow as `√n`. Measured, worst debt after an off-stretch:
3.42 at 100 ticks, 8.72 at 800 — a factor of 2.5 over a factor of 8 in
length, which is `√8 = 2.83` inside the noise of single runs. That is why the
bars visibly walk apart while nothing sounds wrong, and why turning memory
back on pays them off in a burst of exactly the starved voices (§8.4).

A port that "optimises" by skipping the charge while memory is off has removed
the experiment, and the page has nothing left to argue.

## 3. Every gesture goes through the same books

| gesture | what it is |
|---|---|
| **tap a voice's name** | it sounds now, off the grid, **and is charged exactly as a turn**: `CHARGE(m, A)` at the most recent tick's stress. At weight 0 it sounds and the books are untouched. From a stopped instrument it starts the pulse first and then sounds, because a hand asking for a voice is a hand asking for sound. |
| **turn a weight to 0** | the option leaves both loops. It cannot be selected, it receives no share of anyone's payment, and **its statistic freezes** at the value it held. |
| **turn the weight back up** | it re-enters carrying that same statistic — so a voice muted while deep in debt comes back and is paid first. |
| **memory off, then on** | §2.6 |

**The tap is the one that answers "what happens when a pooled item is invoked
again".** A gesture from outside enters the same ledger the machine keeps for
itself, so the machine absorbs it rather than ignoring it. Measured on §8's
pool: `crash`'s next turn arrives 11.7 ticks after an arbitrary
moment; after one tap, 17.4; after three, 38.8; after ten, 121.5 — 18 seconds
of deliberate absence at a 150 ms turn, bought by hammering a key for a second
and a half. The
same charge, run ten times, does exactly what running it once does ten times.

The freeze deserves one more sentence because it is easy to get wrong by being
helpful. Nothing redistributes a departing option's debt, and nothing decays
it. `ΣS` therefore stops being 0 over the *live* options while one is
parked — the invariant is over all options including the frozen ones — and
that is correct: the parked option's debt is still owed.

## 4. Parameters

| control | range | what it does |
|---|---|---|
| **weight** `W[m]` | 0 – 4 per voice, defaults 1.6 / 1.5 / 2.0 / 3.0 / 1.0 / 0.5 (kick, knock, cowbell, click, pluck, crash) | that voice's share of the stress the pattern spends. 0 removes it and freezes its ledger. |
| **silence** `p` | 0 – 0.95, default 0.34 | the probability of a silent turn, held constant against the pool (§2.3) |
| **tempo** | 40 – 300 BPM, linear, default 120 | one turn is an **eighth note**, `30 / bpm` seconds — 250 ms at the default — so one cycle of the eight-step stress loop is one bar of 4/4. The law counts turns, not seconds, so this changes no proportion at all. |
| **heterogeneity** `H` | 0 – 2, default 0 | how loosely the ledger is read: 0 as regular as the pool allows, 2 near-dice — with the shares unmoved (§8.5) |
| **stress** `A[0..7]` | 0.05 – 1 each, default `[1, .25, .5, .25, .7, .25, .5, .25]` | the cost of a turn at each step of an 8-step loop |
| **memory** | on / off | whether selection reads the books. They are kept either way. |
| **level** | 0 – 1.5 per voice, default 1 | the voice's output level. A mix control, outside the mechanism: it is how loud, where the weight is how often. |
| **mute** | per voice | that voice's output to zero. It is **still in the pool** — it takes its turns and its ledger goes on moving; what stops is the sound. |

Every one of these is read **live**, at the moment it is used, and none is
cached into the ledger. Moving a weight mid-run is therefore a continuous act
and not a reset — the statistics that exist go on meaning what they meant.

Level and mute are the two that touch no part of the law. They are on the
voice's row because they belong to the voice, and each says which question it
answers when it is touched before the pulse has started. A port may leave them
out entirely; the mechanism does not know they exist.

There is no MIDI, no reseed and no sample loading in this round. The eight-step
stress length is fixed. The PRNG seed is fixed and unexposed: nothing on the
page reveals it, so a random one would buy nobody anything and cost the
ability to reproduce a report of what the instrument did.

**Saved state is the settings, not the books** — the six weights, the stress
shape, tempo, heterogeneity, silence, the memory switch, every voice's level,
mute and pan, and the master chain. The ledger is what *this run* has done, and
restoring a debt against a pool that has changed underneath it would be a
fiction. A saved session carrying a `period` instead of a tempo restores no
tempo and opens at 120 BPM.

**Reset** is what that persistence obliges, and it does two things: it puts
every setting in the list above back where it opened — weights, stress shape,
tempo, heterogeneity, silence, the memory switch, and every level, mute and
pan — and it **clears the books**, so no option is owed anything. It keeps the
master chain, which is the session's setting rather than the instrument's
state, and it does not touch the transport: reset while the pulse is running
and the pulse goes on, from a ledger of zeros. It asks twice, and any write
inside the instrument between the two presses cancels the arming.

**The arrival state.** The page opens **stopped and silent**, with every
setting where the last visit left it and every ledger at zero: settings
persist, the books do not, and nothing that makes sound reopens making it.
There is exactly one discovery between arrival and the first sound, and the
page names it in a line above the instrument: press Play. A first visit opens
on **`default.json`** beside the page (JP's state of 2026-10-09), which is
also the factory: six voices spread six to one, silence at 0.34, 120 BPM,
heterogeneity 0, the shipped stress shape — so the proportion law is audible
on the first press without anything being set up, and reset lands exactly
where the page opened. A returning visitor's own settings win over the file;
a page opened off a disk cannot fetch it, opens on the identical factory
values, and says once that it is opening bare. The file's silence is a thumb
position (0.3410…) and is rounded to the control's step, 0.01, on the way in.

## 5. Sound

Six voices from the collection's shared palette, chosen to be tellable apart
in a fast stream rather than to make a kit — six families rather than six
drums, because at a fast turn a listener gets one event and then the next,
and two members of one family arriving in that window read as a single voice
with a wobble:

| voice | weight | event gain | what it is |
|---|---|---|---|
| `kick` | 1.6 | 0.40 | a sine swept 250 → 48 Hz in 50 ms with a short click on top |
| `knock` | 1.5 | 0.40 | 20 ms of noise through a bandpass at 900 Hz, over a 120 Hz sine thump, 90 ms |
| `cowbell` | 2.0 | 1.00 | the metallic bank narrowed to two squares at 540 and 800 Hz, a brief clank over a ringing body, 150 ms |
| `click` | 3.0 | 1.00 | a 2–5 ms noise burst behind a 4 kHz highpass |
| `pluck` | 1.0 | 1.00 | a Karplus–Strong string, 500 ms |
| `crash` | 0.5 | 0.85 | the metallic bank spread wide over noise, 900 ms |

### 5.1 Choosing the six, and the bar it had to clear

Which six is a measurement as much as a choice, because the toy's whole claim
rests on a listener hearing *which* voice took a turn. The measurement lives in
`tools/palette/` and runs on the repo's own `lib/voices.js`: every voice is
rendered under this toy's envelope in a headless browser, **cut at a 150 ms
turn**, and compared as a log-mel spectrogram (40 bands, 40 Hz to 16 kHz) in
three time slices — the attack (0–20 ms), the body (20–100 ms), and what is
still sounding when the next event lands (100–150 ms). The distance between two
voices is the mean absolute difference in dB across that feature, and a set is
scored by its CLOSEST pair, since a pool is only as separable as its worst
confusion.

**The comparison is run twice, with level and without it.** A scalar gain
shifts every band of the feature equally, so subtracting a voice's own mean
removes level and leaves shape — and a set that separates only because one
voice is louder leans on a distinction any mix can erase. Both readings are
reported; the level-free one is the one that counts.

**This set was chosen for the collection, and it pays for that in
separability.** Kick, knock, cowbell and click are motif-memory's short voices,
so a visitor who walks down the front page hears one palette from one toy to
the next; pluck and crash come from the pool this one replaced. Scored the same
way:

| pool | with level | level-free | closest pair |
|---|---|---|---|
| this six, at the shipped gains | 10.4 dB | 10.0 dB | `kick`–`knock` |
| the pool before it (`hat`, `clave`, `tom`, `pluck`, `acid`, `crash`) | 15.4 dB | 14.4 dB | `acid`–`pluck` / `crash`–`hat` |
| the pool before that (`click`, `tick`, `knock`, `rim`, `thump`, `ping`) | 7.9 dB | 9.1 dB | `rim`–`tick` |

The rule this spec sets for a palette change is that the new pool clears the
previous one's score, and this pool does not: it sits about 4 dB under it on
the reading that counts, and the shortfall holds under every dB floor and slice
boundary tried. `knock` is the bottleneck of every set built on motif-memory's
voices, with `kick` on one side (10.0 dB) and `cowbell` on the other (12.1 dB),
so changing the sixth cannot repair it; only pulling `knock` would. JP kept it
by ear on 2026-10-16, for the shared palette; `knock` against `kick` is the
pair a port should listen for.
`crash` does its job as the most distinctive voice: its nearest neighbour is
20 dB away on both readings, and it is the rarest, so its drought is the one an
ear notices when memory goes off.

The absolute numbers lean on the dB floor (−100 dB here): a short voice is
mostly silence in the later slices, so part of its distance measures how deep
the silence is assumed to be. The floor also makes the score move with the
trims: at gain 1.0 `kick` and `knock` stood 13.7 dB apart, and the 0.40 trim
pushes more of both under the floor and brings them to 10.0. The ordering of
the three pools holds across the sweep.

Tuning the gains to maximise the score is possible and is deliberately not
done: a search over the musical range can lift the heard score while lowering
the level-free one, which is the signature of fitting the scorer rather than
the ear.

**What the trims do is cap the spread of per-hit energy, and nothing finer.**
Measured as ∫x² over one 150 ms turn, each voice rendered under this toy's
envelope at its own event gain:

| kick | knock | pluck | cowbell | click | crash |
|---|---|---|---|---|---|
| −29.0 dB | −30.1 dB | −35.3 dB | −35.4 dB | −36.2 dB | −39.1 dB |

At gain 1.0 `kick` and `knock` sat about 14 dB above the other four; 0.40
brings the six within 10 dB. `crash` is the quietest, 3.8 dB below the median
of the other five, and it carries a −12 dB trim inside the library's own voice
underneath this toy's 0.85. JP's ear ruled on this spread and on the pool on
2026-10-16: it works as it is. This paragraph is here rather than in §8 because §5 is where a port reads the
gains, and a port that took equal energy for the principle would equalise and
believe it had.

A port that changes the palette re-runs `tools/palette/`, and the bar for it is
whatever its own previous pool measured.

The weights are deliberately unequal, spread six to one, so the proportion law
is audible on the first press. Which voice gets which weight is not
arbitrary: **`crash` is the rarest and also the longest and most
distinctive**, so its drought is the one an ear notices, and it is what makes
the memory switch a demonstration rather than a statistic.

**Event gains are fixed and are not the level control.** The table above is the
gain each voice is *played* at — chosen as §5.1 describes, and measured there —
and nothing on the page moves it. The level on a voice's row is the output bus underneath that —
an ordinary mix fader, outside the mechanism (§4). The two knobs on one row are
a real risk of confusion and the page answers it rather than avoiding it: press
either from cold and it says which question it is, *how loud* against *how
often*.

**One selection per tick, and tails may overlap.** There is no busy state and
no voice stealing. At the default 250 ms turn a `crash` rings over the next
three turns and that is correct — a voice that refused a turn would be a second scheduling rule
quietly fighting the first, and the shares would stop matching the weights.

```
per hit:  rendered buffer (or synth) -> shared envelope -> panner
          -> the voice id's bus -> master
shared:   master gain -> soft-clip drive -> glue compressor
          -> [dry + small room] -> limiter (-3 dB, 20:1) -> out
```

The shared master chain is not part of the mechanism and a port may replace it
with anything, including nothing.

## 6. Timing

The law runs inside the collection's lookahead scheduler: a coarse 25 ms timer
asks for every tick up to `now + 150 ms` (widened to about 1.6 s while the page
is hidden, because background timers are throttled to around a second), and
each selection is scheduled at its own absolute audio-clock timestamp. Only
the *scheduling* rides the timer.

The tick period, `30 / bpm`, is read **live, once per tick**, so a move of the
tempo alters only ticks not yet scheduled — no phase jump, and no
accumulated cursor that could disagree with the grid.

**The ledger is released against the audio clock, not drawn when it is
computed.** Every tick queues a copy of the books stamped with its own
timestamp, and the animation frame releases them when `currentTime` reaches
it. Anything else puts the see-saw up to 150 ms ahead of the sound — more than
half a turn at 120 BPM, a whole one from 200 BPM up — and the
mechanism-on-screen would be showing the future. The
running-step marker on the stress row is released the same way, for the same
reason.

**A stop is a master fade**, so ticks already inside the lookahead window are
silenced — but they have been charged, and the books are the books. The
display is flushed on stop so that what is drawn equals what is recorded,
rather than lagging the truth by the width of the window.

**A tap lands at `currentTime`, off the grid deliberately.** The record
quantizes it to the nearest cell and draws a deviation triangle, so a visitor
can see that their gesture was not on the pulse and was counted anyway.

## 7. The surface

The visual design is incidental. These four properties are not.

**The ledger is the mechanism, drawn — not a decoration.** One centre-zero bar
per option, right of the line for credit already spent and left of it for a
debt owed, updated every tick. The see-saw has to read: one bar jumps as its
option pays, and every other bar sinks a little in the same instant, because
zero-sum means one can only rise by the others falling. A brief flash marks
the row that was chosen.

**The scale adapts, slowly and asymmetrically.** It opens at about 0.55 s so a
debt built during a memory-off stretch stays inside the cell, and closes at
about 3.2 s so the bars do not twitch between ticks, with a floor of **1.5**
— the band the law's own steady state occupies (§8.6), so an idle ledger does
not magnify float dust into a full bar.

**Hue means "this option" and nothing else.** The swatch in the rack, the
ledger bar beside it and the lane in the record wear one colour because they
are three views of one option. Every control stays greyscale. Silence is the
one grey row, since it is the citizen with no sound.

**Silence draws nothing, and the empty column is the mark.** The record is one
lane per voice on a grid of one turn — an eighth note — anchored on the ticker's most
recent tick and carrying its tick *numbering*, so the heavy gridline falls
where the stress loop starts. A silent turn leaves a gap in an otherwise
regular column of events — which is what makes "silence is an option" visible
rather than asserted.

### 7.1 Where things are

The page is one rack and two time surfaces, in that order, because the weights
are what the hands play and the rest is what the eyes read.

- **The master strip** carries the transport, the master chain, the
  **tempo** in the collection's pulse slot, and the three controls that shape
  the whole pool rather than one option: **heterogeneity**, **silence** and the
  **memory** switch. None of them asks for sound, so none of them starts the
  instrument; each says so in its own words when it is touched before the
  pulse has begun, and names the transport.
- **The rack** is one row per option, silence included as the grey row:
  **name · mute · level · weight · the ledger bar**. The name is a button —
  pressing it plays that voice and charges the books (§3) — and it is the one
  thing inside the instrument that *does* ask for sound, so from cold it starts
  the pulse first and then sounds. Silence has a name, a weight readout and a
  ledger, and no level, mute or tap: it is the citizen with no sound.
- **The stage**, below the rack, is the two things a row cannot hold, both of
  them time: the **stress loop**, eight bars in a titled panel, and the
  **record**.
- Below that, a session bar with **reset** and save/load, then the standing
  text.

**The keyboard reaches all of it.** Tab walks the transport, the four master
knobs, the tempo, the three pool controls, the hint toggle, then each rack row in column
order — name, mute, level, weight — then the eight stress bars one at a time,
then reset and the file buttons. Every one of those is operated by the arrows
(Page, Home and End too); each stress bar is named for the step it is —
*"step 3"* — inside a group named for the loop, and announces its value as
*"stress 0.50"*, and the arrows move it by 0.05, Page by 0.25, Home and End to
the ends of its range. The transport also answers the **space bar**, except while a
button has focus, where space belongs to that button.

**Targets.** The rack would scroll sideways rather than reflow, because column
alignment is the component; measured, it never has to above the teaser width
(670 px of rack at a 721 px viewport, with room to spare). The stress row is
one continuous pointer surface: a press picks the bar under the finger and a
drag paints the contour across all eight, so there is no dead space between
targets to miss. The strip is 400 px wide at every desktop width, so each bar
is 46.4 px wide and 48 px tall on a fine pointer.

**Widths.** Above the teaser breakpoint the page declares no reflow of its own:
one column at every width. Below it the page is the teaser. Measured, there is
no horizontal overflow of the document or the body at 1440, 1320, 1200, 1000,
900, 800, 760, 721, 720, 700, 620, 560, 480, 390, 380, 360 or 320 px.

**The teaser.** A phone shows **Play** and **heterogeneity**, alone, and the
record; the rack, the tempo, the master chain, the silence and memory controls,
the stress row and the session bar are the desktop's. The heterogeneity dial
is a twin of the desktop one — two controls writing `H`, each showing the
other's writes — and touched from cold it presses Play first and then turns.
The phone opens it where the page opens, at 0: each voice comes round as
regularly as its weight and the stress allow, which is weighted randomness
read off the books. Turning it up loosens the grain toward pure dice while
every share stays exactly where its weight puts it (§8.5). At 0 the stream is
not clockwork: measured on the opening pool at `H = 0` with the shipped
stress, 20 000 ticks, seed 7, the stream has no period up to 4 000 ticks
(§8.6 gives the same finding for the measurement pool) — so the dial runs from *weighted* randomness to
*pure* randomness, which is another way to hear what a motif is. It is the
control, rather than the memory switch, because it is the one whose whole
travel is audible at once on a phone, where the ledger that makes the memory
switch legible is not shown. The stress row writes on a drag, so it is the
desktop's; the record is kept because it is passive. At 390 px the dial's face
is 56 px and Play and the share button are 44 px tall, with no horizontal
overflow.

## 8. What the mechanism actually does

Measurements, so a port can check itself. The core is a dependency-free block
(`AMES BEGIN` … `AMES END` in `index.html`); everything below was produced by
lifting it into a bare script with a seeded mulberry32 and no page around it.
Unless stated, the pool is the weights 3.0 / 2.0 / 1.5 / 1.0 / 0.7 / 0.5
(click, cowbell, knock, pluck, kick, crash) with `p = 0.25`, and seconds are at a
150 ms turn. That is a measurement pool, not the page's opening one (§4).

### 8.1 Proportionality

20 000 ticks, `H = 1`, flat stress `A = 0.5`, seed 7.

| option | W | W/ΣW | measured share | relative error |
|---|---|---|---|---|
| click | 3.0 | 25.86% | 25.86% | 0.01% |
| cowbell | 2.0 | 17.24% | 17.24% | 0.01% |
| knock | 1.5 | 12.93% | 12.93% | 0.01% |
| pluck | 1.0 | 8.62% | 8.62% | 0.01% |
| kick | 0.7 | 6.03% | 6.04% | 0.01% |
| crash | 0.5 | 4.31% | 4.32% | 0.11% |
| **silence** | (p = 0.25) | 25.00% | **25.00%** | 0.0000 absolute |

### 8.2 Silence holds against the pool

20 000 ticks each, `H = 1`, flat stress, seed 4242. Worst deviation over the
nine cells: **0.0006**.

| pool | p = 0.10 | p = 0.25 | p = 0.60 |
|---|---|---|---|
| six voices, the measurement weights | 10.00% | 25.00% | 59.99% |
| three voices `3.0, 1.0, 0.5` | 10.00% | 25.00% | 59.99% |
| six wildly skewed `4, .05, .05, .05, 4, .05` | 9.95% | 24.95% | 59.94% |

### 8.3 Turns against charge

20 000 ticks, `H = 1`, **the shipped stress pattern**, seed 7 — the check
behind §2.5. The weight is a share of *charge* to 0.10%; the share of *turns*
tilts toward the light voices, which take more of them on weaker steps. §2.5
carries the per-step table this one is the summary of.

| option | W/ΣW | share of turns | share of charge |
|---|---|---|---|
| click | 25.86% | 22.56% | 25.86% |
| cowbell | 17.24% | 16.89% | 17.24% |
| knock | 12.93% | 13.53% | 12.93% |
| pluck | 8.62% | 10.28% | 8.62% |
| kick | 6.03% | 8.27% | 6.04% |
| crash | 4.31% | 6.64% | 4.31% |
| silence | 25.00% | 21.82% | 25.00% |

### 8.4 The drought, and the debt

20 000 ticks, `H = 1`, shipped stress, five seeds, memory ON against memory
OFF on the same seeds. Longest gap between plays of `crash` (W = 0.5):

| seed | 1 | 2 | 3 | 4 | 5 | worst |
|---|---|---|---|---|---|---|
| memory **ON** | 66 | 53 | 66 | 65 | 55 | **66** ticks — 9.9 s |
| memory **OFF** | 188 | 165 | 159 | 183 | 147 | **188** ticks — 28.2 s |

Every option, seed 1, with the regularity of its turns beside it (coefficient
of variation of the gaps):

| option | longest gap ON | OFF | gap CV ON | gap CV OFF |
|---|---|---|---|---|
| click | 14 | 29 | 0.63 | 0.85 |
| cowbell | 21 | 42 | 0.66 | 0.91 |
| knock | 25 | 58 | 0.66 | 0.94 |
| pluck | 37 | 88 | 0.67 | 0.94 |
| kick | 44 | 138 | 0.68 | 1.04 |
| crash | 66 | 188 | 0.72 | 0.97 |
| silence | 14 | 31 | 0.64 | 0.88 |

**The books under memory ON sit in a band**: over a 1 000-tick window at
steady state the largest `|S|` averages 0.60 and peaks at 1.14 (§8.6 gives
1.26 over 20 000 ticks — a longer run reaches a little further, and that is
all). An off-stretch walks out of the band, and turning memory back on walks
it home:

| memory off for | worst debt reached | ticks for ON to return it to the band |
|---|---|---|
| 100 ticks | 3.42 | 27 — 4.0 s |
| 200 ticks | 2.69 | 78 — 11.7 s |
| 400 ticks | 4.02 | 73 — 10.9 s |
| 800 ticks | 8.72 | 95 — 14.3 s |

Repayment is fast and roughly flat in the size of the debt, because the law
does not repay gradually — it spends its next several turns on the starved
options and is done. That burst is the toy's argument in one gesture.

### 8.5 Heterogeneity moves the grain, never the shares

20 000 ticks, flat stress, seed 31337. Shares first, and there is nothing to
see, which is the finding:

| option | target | H = 0 | H = 0.5 | H = 1 | H = 1.5 | H = 2 |
|---|---|---|---|---|---|---|
| click | 25.86% | 25.86% | 25.86% | 25.86% | 25.86% | 25.86% |
| cowbell | 17.24% | 17.24% | 17.24% | 17.24% | 17.23% | 17.24% |
| knock | 12.93% | 12.93% | 12.93% | 12.93% | 12.93% | 12.93% |
| pluck | 8.62% | 8.62% | 8.62% | 8.62% | 8.62% | 8.62% |
| kick | 6.03% | 6.03% | 6.04% | 6.04% | 6.04% | 6.04% |
| crash | 4.31% | 4.30% | 4.31% | 4.32% | 4.32% | 4.32% |
| silence | 25.00% | 25.00% | 25.00% | 25.00% | 25.00% | 24.99% |

The largest drift from `H = 1` to `H = 2` anywhere in that table is 0.01
percentage points. **`H` cannot shift a share, and neither can any other
selection rule** (§2.1). What it changes is regularity — and it changes it
unevenly, because the scatter enters as `H·U/W` and a light option's `1/W` is
larger:

| option | H = 0 | H = 0.5 | H = 1 | H = 1.5 | H = 2 | H2 / H0 |
|---|---|---|---|---|---|---|
| click (W 3.0) | 0.229 | 0.346 | 0.458 | 0.533 | 0.571 | ×2.5 |
| cowbell | 0.140 | 0.345 | 0.472 | 0.544 | 0.593 | ×4.2 |
| knock | 0.088 | 0.369 | 0.479 | 0.558 | 0.634 | ×7.2 |
| pluck | 0.201 | 0.372 | 0.503 | 0.569 | 0.635 | ×3.2 |
| kick | 0.078 | 0.388 | 0.519 | 0.603 | 0.640 | ×8.2 |
| crash (W 0.5) | 0.032 | 0.388 | 0.537 | 0.615 | 0.695 | ×21.6 |

For scale, the same measurement with memory **off** — dice — gives 0.85 to
1.04. So `H` sweeps the texture from clockwork (`crash` at 0.03 is a
metronome) to most of the way to dice, with the proportions nailed at every
point. **This is the honest characterization, and it is not the intuitive
one:** heterogeneity does not favour the rare with more turns, it makes the
rare unpredictable.

### 8.6 Clockwork, and where periodicity actually lives

`H = 0` with flat stress, `p = 0` and six equal weights gives a **strict
rotation of period 6** — `0 1 2 3 4 5` repeating, and audibly a machine. That
is the degenerate case the tie rule in §2.2 exists to make reproducible.

Loosen any one of those and periodicity is gone. Still at `H = 0`, with the
shipped stress and the measurement pool's unequal weights, **no period under 400 ticks
exists**; add silence at `p = 0.25` and none under 800. The stream is fully
deterministic and not remotely periodic — the eight-step stress loop and six
incommensurable weights are enough. `H` is not what makes this instrument
unpredictable; it only makes it *irregular*.

Ledger spread, for anyone sizing a display: max `|S|` over 20 000 ticks is
0.73 at `H = 0`, 1.40 at `H = 1`, 2.56 at `H = 2`, and 1.26 under the shipped
stress at `H = 1`.

### 8.7 Determinism

Same seed, same stream: two runs of 5 000 selections are identical. Adjacent
seeds diverge at the first selection.

## 9. What must survive a port

Keep, or it is a different instrument:

1. **A statistic per option, updated on every turn, that is a debt in
   turns** — `+A` to the chosen, `−A·W[k]/ΣW` to everyone. Zero-sum is a
   *consequence* of that shape, not the specification. See the warning below
   before writing this line.
2. **Selection is "lowest value wins", not a sampled distribution.** The
   randomness enters as a perturbation of a comparison, never as odds.
3. **Silence is an option in the pool**, with a weight, a turn and a ledger of
   its own — and its weight is renormalized live so its probability is
   independent of the pool (§2.3). A toy that implements silence as "and
   sometimes nothing happens" has lost the claim.
4. **A weight of 0 removes an option from both loops and freezes its
   statistic.** No decay, no redistribution, no forgetting.
5. **Stress scales the charge and appears in no probability**, so the metre is
   something the ledger produces (§2.5) rather than something anyone
   sequenced.
6. **The memory toggle updates the books without reading them.** This is the
   experiment; skipping the charge while it is off deletes the toy.
7. **An external invocation is charged as a selection**, at the current
   stress, through the same function.
8. **The ledger is visible and released against the audio clock**, showing
   the see-saw at the instant it is heard.
9. **Every parameter is read live and none is cached into the statistics**, so
   a hand on a control is a continuous act rather than a reset.

### The W² trap — read this before writing the update

There is one variant of the update that looks like the same law, passes the
zero-sum check, and is wrong. It divides the whole update by the *selected*
option's weight:

```
S[m*] += A / W[m*]                          # WRONG — do not ship this
S[k]  -= (A / ΣW) · (W[k] / W[m*])   ∀k
```

`ΣS` still stays at 0 to float precision, forever, through every tick. The
selection frequencies come out **proportional to `W²`**:

| option | W | intended share | what this variant gives |
|---|---|---|---|
| click | 3.0 | 25.86% | **35.44%** |
| crash | 0.5 | 4.31% | **0.99%** |
| silence | (p = 0.25) | 25.00% | **33.11%** |

A weight of 3 against a weight of 0.5 becomes 36 : 1 instead of 6 : 1, and the
silence control stops meaning a probability. The weight is no longer a share
of anything.

**A porter will be tempted by it**, and the reason is structural rather than
careless: `1/W[m]` genuinely does belong on the *selection* line, so putting it
on the update line too looks like consistency. It is not. The division by
weight normalizes a *comparison*; the update is an accounting entry and must
stay in the units the accounting is done in.

Two defences. Derive the equilibrium rather than trusting the invariant — set
the drift of every `S[m]` to zero and read off `f[m]` (§2.1 does this in two
lines) — and run §8.1's table, which catches it in the first thousand ticks.
**Zero-sum is necessary and nowhere near sufficient.**

Incidental — change freely:

- The six sounds and their gains entirely, the weight range (0–4), the tempo
  range and the eighth-note reading of a turn, `H`'s 0–2 scale, the silence ceiling of 0.95 and the alternative
  formulation §2.3 offers for it, the fixed seed.
- **The eight-step stress length**, and the default pattern. Any loop length
  works; 8 is a round-1 decision, and §8.6 suggests the *length* matters more
  to the stream's aperiodicity than the shape does.
- The number of options, and whether the pool is voices at all — the law is
  indifferent to what an option does when chosen.
- The tie epsilon's value, provided ties resolve deterministically rather than
  on floating-point residue.
- The whole visual design: the bar geometry, the auto-scale constants, the
  flash, the record's window and colours, the rack layout.
- Saving the ledger along with the settings, if a port wants a document rather
  than a performance.

---

[^ames-tutorial]: Charles Ames, "Statistical Feedback", interactive tutorial,
<https://charlesames.net/feedback/>.

[^ames-pnm]: Charles Ames, "Statistics and Compositional Balance",
*Perspectives of New Music* **28**(1), Winter 1990.

[^tenney]: Larry Polansky, Alex Barnett and Michael Winter, "A Few More Words
About James Tenney: Dissonant Counterpoint and Statistical Feedback",
*Journal of Mathematics and Music* **5**(3), 2011.
