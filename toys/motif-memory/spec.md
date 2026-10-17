# motif-memory — mechanism spec

Stochastic voices share one integer pulse. Each generating voice rolls its
density at its own opportunities and records the last two bars of what
sounded, as cells and gains. A claim freezes that record into a score at the
next bar line; then every cell is settled by a fresh roll: a remembered event
is removed with probability `(1−d)(1−f)`, an empty opportunity filled with
`d(1−f)`, for density `d` and fidelity `f`. At `f = 1` the voice loops the
score, at `f = 0` it is its generator, and the expected amount never changes.
Each voice is monophonic and refuses an event that starts inside its last.

This document is the toy's logic in a medium an agent can port from: another
language, another audio framework, hardware. It is written for an agent, not
for a reader, so it is exact before it is readable. It carries the claim, the
state, the rule, the parameters with their shipped values, the measurements a
port is checked against, and the line between what must survive and what is
incidental. Everything about how this page shows the mechanism, sounds it, or
schedules it in a browser stays out: the code holds that, and an agent that
needs it reads the code.

The mechanism is original to this toy; §1 names the problem it answers.

**Licence: CC0.** Copy it, port it, sell it, no attribution required.
Attribution is nonetheless welcome: this page lives in the Playable Ideas
repository — <https://github.com/jpdrecourt/playable-ideas> — and its author at
[noisewrangler.art](https://noisewrangler.art).

---

## 1. The claim

**A stochastic voice can carry its own recent past without being asked and
cross into it and back out continuously, at an unchanged amount of music, so
that the crossing is heard only if the performer makes it heard.**

Independent stochastic triggering makes motif structurally impossible:
density, frequency and gain are nouns, while remembering a motif is a verb,
one that requires the system to reference its own past. This toy is one
mechanism for that verb.

## 2. The state

Voices are indexed `i = 0 … V−1` in kit order; the shipped kit has `V = 5`.
Time is the tick index `n`, one grid cell per tick. A bar is 8 cells.

| quantity | type | range | initial | written by |
|---|---|---|---|---|
| `n` | integer | 0 … | 0 at every start | the clock |
| `t[n]` | seconds | | `t[0] = 0`, `t[n+1] = t[n] + 60/(2·bpm)` | the clock, bpm read at tick `n` |
| `d[i]` | per voice | 0 – 1 | preset | the hand |
| `r[i]` | per voice | 1, 2, 4, 8, 16 | preset | the hand |
| `f[i]` | per voice | 0 – 1 | preset | the hand; CLAIM sets it to 1 |
| `D[i]` | per voice, seconds | > 0 | the voice's sound length | fixed |
| `mode[i]` | GEN or MEM | | GEN | the rule |
| `want[i]` | bool | | false | the hand |
| `pending[i]` | NONE, MEM, GEN | | NONE | the hand and the rule |
| `current[i]` | list of `(cell 0–7, gain)` | ≤ 8 entries | empty | the rule |
| `window[i]` | list of bars, oldest first | ≤ 2 bars | empty | the rule |
| `score[i]`, `cells[i]` | array of gain or HOLE, its length | 16 cells (8, §3 edge cases) | none, 0 | CLAIM |
| `loopStart[i]` | integer tick | multiple of 8 | 0 | CLAIM |
| `lastStart[i]` | seconds | | −∞ | the rule |
| `rnd` | uniform on [0,1) | | seed 1234567 | the rule |

Every memory quantity is an integer cell index; seconds enter only the
collision test through `t` and `D`. Every start of the pulse resets `n`, all
memory state and `lastStart` to their initial values. Parameters are read
live at every tick; nothing is cached. One stream `rnd` serves every voice and
every draw, and nothing else draws from it. Reseeding replaces the stream
mid-run and changes nothing else.

`rnd` is any uniform generator. This implementation's is mulberry32, the
32-bit state `a` initialised to the seed, arithmetic modulo 2³²:

```
a += 0x6D2B79F5;  t = imul(a ^ a>>>15, 1 | a);  t = (t + imul(t ^ t>>>7, 61 | t)) ^ t
return (t ^ t>>>14) / 2^32                      # unsigned
```

## 3. The rule

```
TICK(n)                                        # n = 0, 1, 2, …
    if n mod 8 == 0: for each voice i in kit order: BARLINE(i, n)
    for each voice i in kit order: PLAY(i, n)

BARLINE(i, n)
    if mode == GEN:
        window.append(current); if len(window) > 2: drop window[0]
        current = []
    if pending == MEM and mode == GEN: CLAIM(i, n)
    elif pending == GEN and mode == MEM:       # release
        mode = GEN; current = []; pending = NONE

CLAIM(i, n)
    B = len(window); cells = 8 · max(1, B)
    score = [HOLE] · cells
    for b, bar in enumerate(window): for (c, g) in bar: score[8b + c] = g
    loopStart = n; mode = MEM; pending = NONE
    f = 1                                      # written to the parameter itself

THROW(i, w)                                    # the hand, at any moment
    want = w
    pending = NONE if w == (mode == MEM) else (MEM if w else GEN)

GAIN() = 0.8 · 10^((−3 + 6·rnd()) / 20)

FREE(i, T) = not (T < lastStart + D)           # equality is free

PLAY(i, n)
    T = t[n]; r = rate; d = density; f = fidelity
    if mode == MEM:
        rel = (n − loopStart) mod cells        # mod taken non-negative
        if score[rel] != HOLE:
            g = score[rel]
            if rnd() < (1−d)(1−f): emit GHOST(g); return       # removed
            mark = SCORE
        else:
            cap = loopStart − cells + rel      # the tick this cell was recorded on
            if cap mod r != 0: return          # never an opportunity: no draw
            if not (rnd() < d(1−f)): return
            g = GAIN(); mark = EXTRA
        if FREE(i, T): lastStart = T; emit mark(g)    # it sounds
        else: emit GHOST(g)                    # refused: owed, silent
        return                                 # an engaged voice records nothing
    if n mod r != 0: return
    if not (rnd() < d): return
    g = GAIN()
    if FREE(i, T): lastStart = T; emit SOUND(g); current.append((n mod 8, g))
```

SOUND, SCORE and EXTRA sound at `t[n]` with gain `g`; GHOST is an event the
memory owed and did not sound. A refused generated event emits nothing.

**Invariants.**
- The window and the score hold only events that sounded, at most one per
  cell, at the gain they sounded at.
- `mode == MEM` implies the window is unchanged since the claim and `current`
  is empty. Release does not clear the window: it resumes rolling from where
  it stood.
- `loopStart` is a multiple of 8, and relative cell 0 plays on the landing
  tick itself, the tick on which the generator would have rolled.
- At `f = 1` the law removes nothing and invents nothing: the emissions are
  the score, cell for cell, on every pass.
- Draw count: one `rnd()` per density opportunity in GEN, plus one for the
  gain when it passes; one per visit of a score cell and one per visit of an
  empty opportunity cell in MEM, plus one for the gain of an invention. The
  draws happen at every `f` and `d`, `f = 1` included.
- Whenever `r` divides `cells`, `cap ≡ n (mod r)`: the empty cells visited are
  exactly the live opportunities.

**Why the law conserves the amount.** Per cell, the law fires a remembered
event with probability `1 − (1−d)(1−f) = f + (1−f)·d`, and an empty
opportunity with probability `(1−f)·d`. Every cell is the score with
probability `f` and a fresh generator roll with probability `1−f`. A window
of own density `ρ` therefore plays at `f·ρ + (1−f)·d`, and since the window is
itself a draw at density `d`, the expected rate is `d` at every `f` (§5.2).
Given the score, passes are independent, so the occupancy's correlation
across one score length is `Var(E[x|s]) / Var(x) = f²·d(1−d) / d(1−d) = f²` (§5.3).

**Edge cases.**
- **Every claim is 16 cells.** The tick-0 bar line runs before any throw can
  be pending, and it pushes the empty `current`, so the window holds an empty
  bar for the time before the run. The first claim of a run lands at tick 8
  at the earliest, and its first half is that empty bar. CLAIM's `max(1, B)`
  and the 8-cell score exist only for a port whose throw can be pending at
  tick 0. There, at `r = 16`, `r` does not divide `cells`: the anchor admits
  one fixed relative cell on every pass or none at all, so `f = 0` does not
  reproduce the generator's opportunities.
- **A rate move while engaged.** Score cells are visited at every rate; only
  empty cells follow the new rate. If the rate has been made coarser since
  the window was recorded, remembered events off the new grid still fire at
  `d` at `f = 0`, so `f = 0` sounds more than the generator would.
- **A density move while engaged** colours the blend: the amount becomes
  `f·ρ + (1−f)·d_new`. At `f = 1` density has no effect.
- **Release** changes the mode only; fidelity stays where it was. Throwing
  back before the bar line cancels the throw.
- **The seam.** A score is collision-free as a stretch of time, not as a
  loop: cells 15 and 0 were 15 cells apart when recorded and are neighbours
  once it turns. When the score holds both, a voice with `D` over one cell
  refuses cell 0 after every sounded cell 15, `f = 1` and the first pass
  included. No other pair of remembered events collides.
- **The voice over the line.** A voice whose `D` exceeds `r` cells refuses
  some consecutive opportunities, in GEN as in MEM, and an invention beside a
  remembered event refuses it or is refused by it.
- **The collision tie.** `t[n] − lastStart = D` exactly is free. The page
  refuses when `T < lastStart + D` on accumulated float seconds, so a tie
  falls on float residue. A port accumulates `t` by the recurrence of §2 and
  treats the voice as free when `T ≥ lastStart + D − 1e-9`. At the shipped values a tie needs
  `hum` at a 10-cell gap, which its rate never gives.

**The wrong variant: the keep-probability trap.** This reads fidelity as the
chance of keeping each remembered event:

```
if score[rel] != HOLE: removed = rnd() < (1 − f)          # WRONG
```

It looks right at both ends of the knob from the score's side: `f = 1` loops,
`f = 0` removes every remembered event. Then `f = 0` is not generation but
its photographic negative: every cell the memory occupies is silent and the
rest fire at `d`. The amount becomes `d·(f + (1−d)(1−f))`, so at `d = 0.5` the
stream plays at 0.50 of the generator at `f = 0` and 0.75 at `f = 0.5`.
§5.2 catches it at once. The removal probability carries the density
because generation fires an occupied cell with probability `d`, not 0.

A second variant, "with probability `f` the score cell, else a generator roll
with a fresh gain", has the law's occupancy exactly and loses the frozen gain
whenever the generator branch fires. A surviving remembered event replays its
frozen gain, which makes it the same event; §5.4 catches the variant.

## 4. Parameters and the shipped preset

| symbol | meaning | range | taper | shipped value |
|---|---|---|---|---|
| `d` | chance of sounding at each opportunity; the sole amount control | 0 – 1 | linear | kick 0.29, knock 0.45, cowbell 0.5, click 0.6, hum 0.14 |
| `r` | cells between a voice's opportunities | 1, 2, 4, 8, 16 | equal travel per step; an outside value snaps to the nearest step in log₂ | kick 1, knock 2, cowbell 4, click 1, hum 8 |
| `f` | fidelity: how remembered the stream is; inert in GEN | 0 – 1 | linear | 1 for every voice |
| `D` | sound length | | | kick 0.28 s, knock 0.09 s, cowbell 0.15 s, click 0.01 s, hum 2.0 s |
| bpm | the pulse; one cell is an eighth note | 40 – 300 | linear | 150: 0.2 s a cell, 1.6 s a bar |
| bar | cells per bar, "a bar" | fixed | | 8: 4/4 read on eighths |
| window | bars kept, "a short past" | fixed | | 2, every voice |
| gain | per event | 0.8 · ±3 dB, uniform in dB | | as GAIN |
| seed | of `rnd` | uint32 | | 1234567 |

Nothing is claimed at the start, so the generator is heard before the memory.
At 150 bpm `D` is kick 1.4 cells, knock 0.45, cowbell 0.75, click 0.05, hum 10:
kick at rate 1 and hum at rate 8 are over the line of §3. Every rate step
divides the bar. Densities, rates and tempo were set by ear; the tapers, the
gain spread and the lengths are reasoned and unheard.

## 5. What the rule does, measured

**Conventions.** The core of §3 runs alone, one voice per run, 150 bpm.
- **The voice.** Click-like: `D = 0.01 s`, which never collides at 150 bpm.
  Kick-like: `D = 0.28 s`.
- **The protocol.** Bar line `k` is tick `8k`. Every throw is made after
  every voice's BARLINE of that tick and before any PLAY, and lands at the
  next bar line; where it falls relative to PLAY changes nothing. The first throw on is
  at bar line 2, so the first claim lands at 3 with bars 1 and 2. A claim
  stays engaged 8 bars: the throw off is made at bar line `L+7` and lands at
  `L+8`. The next throw on is made at `L+9` and lands at `L+10`, with two bars
  generated after the release in the window. 2 000 claims per run, a run of
  20 003 bars.
- **Fidelity** is written to the condition's value right after the landing's
  bookkeeping, before that tick's PLAY, overriding the snap.
- An **engaged bar** is 8 ticks from a landing to its release; a
  **generating bar** is 8 ticks in GEN, the run's first three included.
- An **emission** is a SCORE or EXTRA outcome of the law, before FREE. A
  **sounded** event passed FREE. GHOST is not an emission.
- Every frequency and ratio below is pooled over the run, total over total,
  never a mean of per-claim ratios.
- **Removal frequency** is removals over visits of score cells. **Invention
  frequency** is EXTRA outcomes over visits of empty opportunity cells.
- **Amount ratio** is emissions per engaged bar over `8d/r`. **Sound ratio**
  is sounded events per engaged bar over sounded events per generating bar,
  in the same run. **Lost** is `1 −` sounded over emissions, engaged ticks
  only.
- A **pass** is 16 consecutive engaged ticks starting at the landing or a
  multiple of 16 after it. **Occupancy** `x = 1` on an emission, else 0; the
  **accent** `y` is the emission's gain, else 0. **Recurrence** is the Pearson
  correlation, population moments, of the pairs `(x[n], x[n+16])` with both
  ticks in one engagement, pooled over the run; likewise for accents. A pass
  is **identical** when its occupancy, or its sounded pattern, equals the
  previous pass of the same engagement cell for cell. The sounded pattern is
  binary, sounded or not; gains are ignored. The share's denominator is the
  passes that have a previous pass, 3 per engagement.
- A **seam** is a claimed score holding events at both cell 0 and cell 15,
  counted on the score at landing as a fraction of the claims. Fidelity does
  not enter it.
- **Bands** are set over seeds 1 to 30 under two generators, mulberry32 and
  splitmix64 (state += 0x9E3779B97F4A7C15, the standard mix, top 53 bits over
  2⁵³), 60 runs per condition, at about twice the half-range of what those
  runs gave. Any uniform generator must land inside them. A port checks each
  of its runs individually against each band, not only their mean; 30 seeds
  of its own generator suffice. "Exactly 1" means within 1e-12, the float
  Pearson's residue. Rate 1 unless stated. The seed-7 values
  are mulberry32 under this protocol, for a port with the same generator and
  the same draw order.

### 5.1 The law's frequencies

Click-like voice. Each cell gives the 60-run mean of removal over invention
frequency, against `(1−d)(1−f)` and `d(1−f)`.

| | f = 0 | f = 0.5 | f = 0.85 |
|---|---|---|---|
| d = 0.25 | 0.7499 / 0.2498 | 0.3746 / 0.1253 | 0.1128 / 0.0375 |
| d = 0.5 | 0.4997 / 0.5000 | 0.2497 / 0.2501 | 0.0749 / 0.0752 |
| d = 0.75 | 0.2501 / 0.7499 | 0.1251 / 0.3746 | 0.0375 / 0.1128 |

Seed 7 at `d = 0.5`: 0.4968 / 0.5038, 0.2492 / 0.2516, 0.0760 / 0.0750. Band:
every frequency within 0.015 of its formula; the largest half-range over the
60 runs is 0.0069.

### 5.2 The amount is conserved

Click-like voice. Amount ratio, 60-run mean:

| | f = 0 | f = 0.5 | f = 1 |
|---|---|---|---|
| d = 0.3, r = 1 | 1.0005 | 1.0000 | 0.9985 |
| d = 0.3, r = 4 | 0.9995 | 1.0027 | 1.0011 |
| d = 0.6, r = 1 | 1.0001 | 1.0004 | 0.9987 |
| d = 0.6, r = 4 | 0.9995 | 1.0001 | 0.9993 |

Band: within 0.04 of 1 at `r = 1`, largest half-range 0.018; within 0.09 at
`r = 4`, largest half-range 0.042, at `f = 1` where each claim is one draw of
four opportunities. The keep-probability variant of §3 gives 0.499 at
`f = 0` and 0.750 at `f = 0.5`, `d = 0.5`, outside both bands.

### 5.3 Fidelity 1 and 0 over the run

Click-like voice, 8 engaged bars, 4 passes, per claim.

| | f = 0 | f = 0.5 | f = 0.85 | f = 1 |
|---|---|---|---|---|
| `f²` | 0 | 0.25 | 0.7225 | 1 |
| recurrence, d = 0.25 | 0.0008 | 0.2493 | 0.7216 | 1 |
| recurrence, d = 0.5 | 0.0006 | 0.2504 | 0.7223 | 1 |
| identical passes, d = 0.25 | 0.0005 | 0.0052 | 0.1714 | 1 |
| identical passes, d = 0.5 | 0.0000 | 0.0006 | 0.0915 | 1 |

Band: recurrence within 0.02 of `f²`, largest half-range 0.0092. At `f = 1`
recurrence and identical passes are exactly 1 in every run. Identical passes
at `f = 0.85` within 0.03 of the row's mean, largest half-range 0.014. The
shape recurs and its realisation does not: at `f = 0.85` the correlation is
0.72 while fewer than one pass in five repeats the last.

### 5.4 The gains remember at f = 0

Click-like voice, `d = 0.75`. At `f = 0` the occupancy recurrence is −0.0008,
the generator's, while the accent recurrence is 0.0763, range 0.0665 to
0.0857 over the 60 runs, seed 7 0.0765. The expected value is
`d²·Var(g) / (E[g²] − d·E[g]²) ≈ 0.074`. A surviving remembered event replays
its frozen gain on every pass, and an invention draws a fresh one. Band: accent
recurrence 0.056 to 0.096, occupancy within 0.02 of 0. At `f = 1` both are
exactly 1.

### 5.5 Collisions

Kick-like voice, rate 1, `D = 1.4` cells:

| | f = 1 | f = 0.85 | f = 0.5 | f = 0 |
|---|---|---|---|---|
| lost, d = 0.5 | 0.0208 | 0.1135 | 0.2527 | 0.3332 |
| lost, d = 0.25 | 0.0121 | 0.0674 | 0.1523 | 0.1999 |
| sound ratio, d = 0.5 | 0.9792 | 0.9528 | 0.9335 | 1.0005 |
| sounded passes identical, d = 0.5 | 1 | 0.1968 | 0.0062 | 0.0006 |

Seams: 0.1107 of claims at `d = 0.5`, 0.0388 at `d = 0.25`. At `f = 0` the
voice loses what its generator loses, a third of the rolls at `d = 0.5`, and
sounds exactly the generator's amount. At `f = 1` the only loss is the seam,
on every pass, and the sounded loop repeats exactly. In between, inventions
collide with remembered events and the sounded amount dips by 5 to 7%: this is
the one way the conservation of §5.2 fails to reach the ear. At rate 2, where
two cells are longer than the sound, lost and seams are exactly 0 at every
density and fidelity, measured at `d = 0.5`, `f = 1` and 0. The click-like
voice loses exactly 0 at every density and fidelity, measured likewise.

Band: lost within 0.012 of each cell, largest half-range 0.0052; sound ratio
within 0.025, largest half-range 0.012; seams within 0.035 at `d = 0.5` and
0.025 at `d = 0.25`, half-ranges 0.017 and 0.011. Sounded identical passes
at `d = 0.5` within 0.035 at `f = 0.85`, 0.006 at 0.5 and 0.0015 at 0,
half-ranges 0.017, 0.0027 and 0.0006. The zeros and ones are exact.

## 6. What must survive, and what is incidental

The mechanism. A port that changes any item has built a different instrument:

1. **Cells, not seconds.** The window, the score and the playback position
   are integer cell indices on the one pulse; the score turns on the tick
   index modulo its length. No second clock.
2. **Capture is not an action.** Every generating voice records continuously;
   the switch says keep what was just heard, and it lands on the bar line in
   both directions. Nothing previews or selects the window.
3. **The window holds only what sounded**, at the gains it sounded at, and it
   does not advance while engaged.
4. **The law, exactly:** remove a remembered event with probability
   `(1−d)(1−f)`, fill an empty opportunity with `d(1−f)`, a fresh roll at
   every step, and never move an event. Not the keep-probability variant.
5. **The empty cells follow the recording's opportunities**: an empty cell
   is visited only where `cap mod r = 0`. Remembered cells are always
   visited.
6. **Fidelity snaps to 1 on the claim**, in the parameter itself, so the
   control and the engine cannot disagree. Release leaves fidelity alone and
   keeps the window.
7. **A surviving remembered event keeps its frozen gain.**
8. **Monophonic, earliest commitment wins**, generated and remembered events
   alike, a refused remembered event owed and silent, a refused generated
   event nothing.
9. **One stream** for the density rolls, the gains and the law, and no
   memory survives a restart of the pulse.

Incidental. A port that reproduces these has misread the spec:

- The five voices, their sounds, lengths and gains, the gain law's 0.8 and
  ±3 dB; the law is indifferent to what an event sounds like, except that its
  length decides collisions.
- The eight-cell bar and the two-bar window as numbers rather than as "a bar"
  and "a short past"; the five rate steps; the 40 – 300 bpm range; the PRNG
  and the seed, which matter only to reproduce §5's seed-7 values.
- The empty pre-run bar in the first claim of a run; a port may start its
  window empty, provided it then handles 8-cell scores at rate 16.
- Reseeding mid-run, the transport and the mixer.
- Everything the page draws, the GHOST mark included as a picture; what
  survives is that an owed event is distinguishable from no event.
