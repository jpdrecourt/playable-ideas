# statistical-feedback — mechanism spec

A pool of options shares one pulse and one option takes each turn. Every
option holds a statistic: turns taken, less the turns its weight entitled it
to, each turn scaled by the stress of its step. The option whose statistic,
offset by the stress and a weighted random scatter, is lowest takes the turn
and pays for it, and the payment is credited to every live option in
proportion to its weight. Silence is one of the options, with a weight derived
live from a probability, so the share of silent turns ignores the rest of the
pool.

This document is the toy's logic in a medium an agent can port from: another
language, another audio framework, hardware. It is written for an agent, not
for a reader, so it is exact before it is readable. It carries the claim, the
state, the rule, the parameters with their shipped values, the measurements a
port is checked against, and the line between what must survive and what is
incidental. Everything about how this page shows the mechanism, sounds it, or
schedules it in a browser stays out: the code holds that, and an agent that
needs it reads the code.

The mechanism is a variant of Charles Ames' statistical feedback (§1).

**Licence: CC0.** Copy it, port it, sell it, no attribution required.
Attribution is nonetheless welcome: this page lives in the Playable Papers
repository — <https://github.com/jpdrecourt/playable-papers> — and its author at
[noisewrangler.art](https://noisewrangler.art).

---

## 1. The claim

**A weighted choice that keeps a ledger holds every option to its weight over
any stretch while its order stays unpredictable, and when the cost of a turn
varies with the step, the ledger alone puts heavy options on the strong steps.**

Sources:

- Charles Ames, "Statistics and Compositional Balance", *Perspectives of New
  Music* 28(1), 1990, pp. 80–111, doi:10.2307/833345. Ames' account of
  statistical feedback.
- Charles Ames, "Statistical Feedback", tutorial, <https://charlesames.net/feedback/>:
  "the resources falling most behind their fair share of usage receive first
  consideration going forward". Heterogeneity there is a small random value
  added to each balance before the comparison.
- Larry Polansky, Alex Barnett and Michael Winter, "A few more words about
  James Tenney: dissonant counterpoint and statistical feedback", *Journal of
  Mathematics and Music* 5(2), 2011, pp. 63–82, doi:10.1080/17459737.2011.614732.

Departures from Ames' tutorial formulation, one each:

- **Stress.** A per-step stress `A` scales the charge and enters the
  comparison as `A/W`; the tutorial has no such term.
- **Silence is an option** with a weight, turns and a statistic; the tutorial
  pools only sounding resources.
- **Live renormalisation.** Silence's weight is recomputed every turn from a
  probability `p` and the current sum of the voice weights.
- **A debt in turns.** The statistic is in turns, not a share of usage, so a
  debt does not shrink as the run grows.
- **Weighted scatter.** The random term is divided by the option's weight.

## 2. The state

Options are indexed `m = 0 … M−1`; the last, `M−1`, is silence, the others
voices. The shipped pool has six voices, `M = 7`.

| quantity | type | range | initial | written by |
|---|---|---|---|---|
| `S[m]` | per option | unbounded, in practice ±3 | 0 | the rule only |
| `w[i]` | per voice | 0 – 4 | preset | the hand |
| `p` | scalar | 0 – 0.95 | preset | the hand |
| `H` | scalar | 0 – 2 | preset | the hand |
| `A[0..L−1]` | `L = 8` | 0.05 – 1 | preset | the hand |
| `n` | integer | 0 … | 0 at every start of the pulse | the clock |
| `A_last` | scalar | as `A` | 1 | each turn |
| `rnd` | uniform on [0,1) | | seed `0xA3E5` | the rule |

Every real quantity is float64. `S` survives a stop; only an explicit reset
zeroes it. `n` restarts at 0 on every start, so the first turn reads `A[0]`,
and it advances on every tick, an empty pool included. The random stream is
never reseeded. The option weights `W[m]` are derived, rebuilt from `w` and
`p` before every turn and every invocation; nothing is cached.

`rnd` is any uniform generator. This implementation's is mulberry32, the
32-bit state `a` initialised to the seed, all arithmetic modulo 2³²:

```
a += 0x6D2B79F5;  t = imul(a ^ a>>>15, 1 | a);  t = (t + imul(t ^ t>>>7, 61 | t)) ^ t
return (t ^ t>>>14) / 2^32                      # unsigned
```

Its only role is to reproduce §5's per-seed rows to the digit.

## 3. The rule

```
WEIGHTS(w, p) -> W, ΣW                         # before every turn and invocation
    W[i] = w[i] if w[i] is finite and > 0 else 0          for each voice i
    Wv   = Σ_i W[i]
    q    = clamp(p, 0, 0.95)                    # non-finite p is 0
    W[M-1] = q/(1-q) · Wv  if q > 0 else 0
    ΣW   = Σ W[m] over W[m] > 0

SELECT(S, W, A, H) -> m*
    best = -1; bestV = +inf
    for m = 0 … M-1 in index order:
        if not (W[m] > 0): continue             # out of the pool, draws nothing
        U = 2·rnd() - 1                         # fresh per live option per turn
        v = S[m] + (A + H·U) / W[m]
        if v < bestV - 1e-9: bestV = v; best = m
    return best

CHARGE(S, m, W, ΣW, A)
    if m < 0 or not (W[m] > 0) or not (ΣW > 0): return
    S[m] += A
    S[k] -= A · W[k] / ΣW                       for every k with W[k] > 0

TURN(n)                                         # every tick; n += 1 afterwards
    A = A[n mod L];  A_last = A                 # mod taken non-negative
    W, ΣW = WEIGHTS(w, p)
    if not (ΣW > 0): return -1                  # empty pool: no choice, no charge, no draw
    m* = SELECT(S, W, A, H)
    CHARGE(S, m*, W, ΣW, A)
    return m*                                   # M-1 is a silent turn

INVOKE(i)                                       # a selection made from outside
    W, ΣW = WEIGHTS(w, p)
    if W[i] > 0: CHARGE(S, i, W, ΣW, A_last)    # no draw, n unchanged
```

**Invariants.** `W[M−1]/ΣW = q` whenever `Wv > 0`, for any pool. The
decrements of CHARGE sum to `A`, so `ΣS` over all options, frozen ones
included, stays 0 to float noise and does not accumulate.

**Edge cases.**
- Every voice at 0 gives `Wv = 0`, so silence's weight is 0 whatever `p` is.
  Silence never plays alone; the pool is empty and TURN returns −1.
- `p = 0` puts silence out of the pool exactly as a voice at weight 0.
- **Weight 0** removes an option from both loops: it is never selected, gets
  no credit, and **its statistic freezes**. `ΣS` over the live options is then
  not 0, which is correct: the parked debt is still owed. Nothing decays or
  redistributes it. Back above 0, it re-enters with the debt it left with.
- An invocation at `W[i] = 0` touches nothing. Ten invocations do exactly
  what one does, ten times.
- `rnd()` is drawn for every live option on every turn, `H = 0` included. At
  `H = 0` the selections do not depend on the stream at all.
- **Ties go to the lower index** within `1e-9`. At `H = 0` with equal weights
  every option is exactly level at the end of each round, and a bare `<`
  breaks the tie on float residue, which differs between engines. With any
  `H > 0` the epsilon never fires.

**What the two terms of `v` do.** `A/W[m]` does nothing at constant `A`: a
fixed per-option offset shifts where that option's statistic sits and leaves
the dynamics alone. When `A` varies it lifts light options far on strong
steps and heavy ones barely; that is the whole source of the metre (§5.4).
`H·U/W[m]` scatters light options further than heavy ones; it moves the
regularity of each option's turns and no share (§5.6).

**Why the update alone pins the shares.** At equilibrium each `S[m]` has zero
mean drift. With `f[m](n)` the probability that `m` takes a turn on a step of
stress `A[n]`, over one stress cycle:

```
Σ_n f[m](n) · A[n]  =  (W[m] / ΣW) · Σ_n A[n]
```

The weight fixes each option's **share of the stress spent, not of the turns
taken**. Under flat stress the two coincide and `f[m] = W[m]/ΣW`. No
selection rule enters the derivation: any rule that keeps `S` bounded lands on
the same shares, and the selection rule chooses only the order. Under varying
stress light options are pushed onto cheap steps and take more turns than
their weight (§5.3). Skipping the charge, or charging only some turns, loses
the shares.

**The wrong variant: the W² trap.** This update looks like the same law and
passes the zero-sum check:

```
S[m*] += A / W[m*]                          # WRONG
S[k]  -= (A / ΣW) · (W[k] / W[m*])   ∀k
```

`ΣS` stays 0 forever, and the drift calculation gives `f[m] ∝ W[m]²`. On the
§5 pool, `H = 1`, flat `A = 0.5`, seed 7, 20 000 turns: click (W 3.0) takes
35.44% for an intended 25.86%, crash (W 0.5) 0.99% for 4.31%, and silence at
`p = 0.25` takes 33.1%. A porter is drawn to it because `1/W` belongs on the
selection line and putting it on the update looks consistent. The division
normalises a comparison; the update is an accounting entry and stays in turns.
§5.1 catches it within a thousand turns. **Zero-sum is necessary and nowhere
near sufficient.**

## 4. Parameters and the shipped preset

| symbol | meaning | range | taper | shipped value |
|---|---|---|---|---|
| `w` | voice weights: kick, knock, cowbell, click, pluck, crash | 0 – 4 | linear | 1.6, 1.5, 2.0, 3.0, 1.0, 0.5 |
| `p` | probability of a silent turn | 0 – 0.95, step 0.01 | linear | 0.34 |
| `H` | heterogeneity | 0 – 2, step 0.01 | linear | 0 |
| `A` | stress pattern, `L = 8` | 0.05 – 1 each | linear | 1, .25, .5, .25, .7, .25, .5, .25 |
| tempo | one turn per eighth note | 40 – 300 BPM | linear | 120 BPM: 250 ms a turn, a 4/4 bar per cycle |
| seed | of `rnd` | fixed | | `0xA3E5` |

The law counts turns; tempo moves no proportion. `H = 0` is shipped by design:
weighted randomness read off the books, loosened toward dice as `H` rises.
The weights are spread six to one so the proportion law is heard at once,
with the rarest on the most distinctive voice. Both were set by ear. A
preset's `p` is rounded to 0.01 on load.

## 5. What the rule does, measured

The core of §3 run alone. Unless stated, the pool is the **measurement pool**,
not the preset: weights 3.0, 2.0, 1.5, 1.0, 0.7, 0.5 in index order (click,
cowbell, knock, pluck, kick, crash), silence at index 6, `p = 0.25`.

**Conventions.**
- A run's seed replaces the shipped seed; each run is one fresh stream from
  `S = 0`, `n = 0`.
- **DICE** is the reference: an independent run from `S = 0` at the same seed,
  one `rnd()` per turn, any weighted draw over `W`, the books charged by
  CHARGE as usual. The boundary convention of the draw does not matter at
  these tolerances.
- **Share**, unqualified, is the option's turns over all turns. **Share of
  charge** is `Σ A` over the option's turns over `Σ A` over all turns.
- A **gap** is the index difference between consecutive turns of one option;
  the open stretches before its first turn and after its last are excluded.
  **CV** is the population standard deviation of the gaps over their mean.
- `|S|` is sampled after every charge, as the maximum over all options.
- "Every option" includes silence. "The voices ordered by weight" excludes it
  and means strictly decreasing as the weight decreases.

**The printed rows** are this implementation under mulberry32 at the stated
seed, so a port with the same generator can match them to the digit. **The
bands** are generator-independent. Unless a section says otherwise they are
set over seeds 1 to 30 under two generators, mulberry32 and splitmix64, 60
runs per condition, at about twice the half-range of what those runs gave.
Any uniform generator must land inside them.

### 5.1 Proportionality

20 000 turns, `H = 1`, flat `A = 0.5`, seed 7.

| | click | cowbell | knock | pluck | kick | crash | silence |
|---|---|---|---|---|---|---|---|
| `W/ΣW` | 25.86% | 17.24% | 12.93% | 8.62% | 6.03% | 4.31% | 25.00% |
| share | 25.86% | 17.24% | 12.93% | 8.62% | 6.04% | 4.32% | 25.00% |

Band: every share within 0.05 points of `W/ΣW`; the 60 runs deviate by at
most 0.010. `max |ΣS| < 1e-9`.

### 5.2 Silence holds against the pool

20 000 turns each, `H = 1`, flat `A = 0.5`, seed 4242. Share of silent turns:

| voice weights | p = 0.10 | p = 0.25 | p = 0.60 |
|---|---|---|---|
| the measurement pool | 10.00% | 25.00% | 59.99% |
| `3.0, 1.0, 0.5` | 10.00% | 25.00% | 59.99% |
| `4, .05, .05, .05, 4, .05` | 9.95% | 24.95% | 59.94% |

Band, for any seed: within 0.0015 of `p` in every cell. Over seeds 1 to 30
under both generators, 60 runs per cell, the deviation is at most 0.0006.

### 5.3 Turns against charge

20 000 turns, `H = 1`, shipped stress pattern, seed 7, with the mean of
mulberry32 seeds 1 to 30 beneath.

| | click | cowbell | knock | pluck | kick | crash | silence |
|---|---|---|---|---|---|---|---|
| `W/ΣW` | 25.86% | 17.24% | 12.93% | 8.62% | 6.03% | 4.31% | 25.00% |
| share, seed 7 | 22.57% | 16.89% | 13.53% | 10.28% | 8.27% | 6.64% | 21.82% |
| share, 30-seed mean | 22.36% | 16.75% | 13.62% | 10.43% | 8.31% | 6.63% | 21.91% |
| share of charge, seed 7 | 25.86% | 17.24% | 12.93% | 8.62% | 6.04% | 4.31% | 25.00% |

Band: share of charge within 0.05 points of `W/ΣW`, observed at most 0.010.
Share of turns within 1.0 point of the mean row; the largest half-range over
the 60 runs is 0.48, on silence and click.

### 5.4 The metre

Same run as §5.3. Each cell is the option's share of the turns on steps of
that stress.

| A | click | cowbell | knock | pluck | kick | crash | silence |
|---|---|---|---|---|---|---|---|
| 1.00, step 0 | 34.2% | 16.4% | 11.3% | 4.2% | 1.0% | 0.0% | 32.8% |
| 0.70, step 4 | 27.8% | 18.7% | 12.8% | 7.8% | 3.5% | 1.1% | 28.3% |
| 0.50, steps 2, 6 | 24.7% | 18.7% | 13.2% | 9.3% | 7.0% | 4.3% | 23.0% |
| 0.25, odd steps | 17.3% | 15.7% | 14.4% | 12.9% | 11.9% | 10.9% | 16.9% |

Of the 2 500 downbeats, click takes 856 and crash 1. Under flat stress every
row is §5.1. Band: each cell within 5 points of the seed-7 row printed
above; the 60 runs depart from it by at most 3.2. The downbeat row's voices
are ordered by weight; crash takes at most 15 downbeats, against an observed 8.

### 5.5 The drought against dice

20 000 turns, `H = 1`, shipped stress. Longest gap of crash:

| seed | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| law | 66 | 53 | 66 | 65 | 55 |
| DICE | 188 | 165 | 159 | 183 | 147 |

Over the 60 runs crash's longest gap is 53 to 75 under the law, and DICE's is
at least 1.89 times the law's at the same seed. Every option's CV is 0.624 to
0.736 under the law and 0.838 to 1.046 under DICE, and DICE's exceeds the
law's for every option in every run. Band: crash's law gap at
most 90; DICE's at least 1.5 times the law's; law CV within 0.58 to 0.78;
DICE CV above 0.80 and above the law's for the same option and seed.

### 5.6 Heterogeneity moves the grain, never the shares

20 000 turns, flat `A = 0.5`, `H` swept. Every share stays within 0.05 points
of `W/ΣW` at every `H`; the 60 runs deviate by at most 0.020. Gap CV, the
`H = 0` column exact and the others the mean of mulberry32 seeds 1 to 30:

| option | H = 0 | 0.5 | 1 | 1.5 | 2 |
|---|---|---|---|---|---|
| click, W 3.0 | 0.229 | 0.347 | 0.457 | 0.526 | 0.574 |
| cowbell | 0.140 | 0.346 | 0.473 | 0.549 | 0.596 |
| knock | 0.088 | 0.360 | 0.486 | 0.561 | 0.612 |
| pluck | 0.201 | 0.373 | 0.501 | 0.575 | 0.627 |
| kick | 0.078 | 0.383 | 0.513 | 0.588 | 0.643 |
| crash, W 0.5 | 0.032 | 0.387 | 0.521 | 0.599 | 0.657 |

Seed 31337 gives crash 0.388, 0.537, 0.615, 0.695; DICE gives 0.84 to 1.05
in §5.5. `H` takes the light options from near-metronomic toward dice: about
×20 for crash against ×2.5 for click.

Band: the `H = 0` column does not depend on the stream and matches to 0.001.
The other cells within 0.06 of the mean; the largest half-range over the 60
runs is 0.031, and the two generators' means agree to 0.008.

Largest `|S|`: 0.73 at `H = 0`, exact to 0.01. For `H > 0`, the observed
range over the 60 runs and the band, twice its half-range about its centre:

| condition | observed | band |
|---|---|---|
| `H = 0.5` | 0.68 – 0.96 | 0.54 – 1.10 |
| `H = 1` | 1.26 – 1.55 | 1.11 – 1.70 |
| `H = 1.5` | 1.87 – 2.24 | 1.68 – 2.43 |
| `H = 2` | 2.54 – 2.90 | 2.36 – 3.08 |
| `H = 1`, shipped stress | 1.22 – 1.51 | 1.07 – 1.66 |

### 5.7 Dice debt and repayment

**This measurement departs from the DICE convention.** Its DICE stretch is
not an independent run: it continues the law run's books and stream, because
what it measures is the law repaying a debt that dice ran up. Each run:
2 000 law turns, N turns of DICE drawing from the same stream, then law turns
until every `|S| ≤ 1.14`. Shipped stress, `H = 1`, seeds 1 to 30 under both
generators, 60 runs per N.

| N | worst `|S|`, mean | range | band on the mean | turns to return, median | max |
|---|---|---|---|---|---|
| 100 | 3.82 | 1.87 – 8.42 | 2.87 – 4.78 | 21 | 127 |
| 200 | 5.35 | 2.77 – 9.91 | 4.01 – 6.69 | 38 | 183 |
| 400 | 8.02 | 3.85 – 14.51 | 6.02 – 10.03 | 75 | 229 |
| 800 | 11.25 | 6.65 – 20.68 | 8.44 – 14.06 | 113 | 381 |

Under DICE the shares are already the equilibrium ones, so the books lose
their restoring force and walk as `√N`: the mean grows ×2.94 over ×8 in
length, against `√8 = 2.83`. The law repays in a burst of the starved
options. The band on each mean is ±25%; the two generators' 30-run means
differ by at most 6%. Growth from 100 to 800 within ×2.3 to ×3.5.

### 5.8 Invocation buys absence

Shipped stress, `H = 1`. Run 2 000 law turns, then 300 moments, each after a
further 67 law turns, so the first falls after turn 2 067. At each moment the
books and the stream position are copied. On the copy, crash is charged k
times by a direct `CHARGE(S, crash, W, ΣW, 0.25)`, not through INVOKE's
`A_last`. The copy then runs the law, and the count is the number of turns up
to and including crash's next turn. Mean count:

| k | 0 | 1 | 3 | 10 |
|---|---|---|---|---|
| mulberry32, seed 7 | 12.2 | 19.1 | 37.6 | 121.1 |
| 40 runs, seeds 1 to 20, both generators | 11.0 – 13.3 | 17.1 – 19.7 | 36.1 – 39.6 | 119.9 – 123.9 |
| band | 9.9 – 14.5 | 15.8 – 21.0 | 34.3 – 41.4 | 117.9 – 125.9 |

The seed-7 row is rounded from 12.17, 19.13, 37.59, 121.12. With the first
moment at turn 2 000 instead, it reads 12.16, 19.16, 37.56, 121.18. Charged
at `A = 0.5`, each invocation buys about twice the absence.

### 5.9 Clockwork and determinism

- `H = 0`, flat stress, `p = 0`, six equal weights: the rotation
  `0 1 2 3 4 5`, period 6, from the first turn. Exact; the tie rule exists
  for this case.
- `H = 0`, shipped stress, measurement pool: no period up to 400 turns at
  `p = 0`, none up to 800 at `p = 0.25`. The shipped preset at `H = 0`,
  20 000 turns: none up to 4 000. Periods are tested after a 2 000-turn
  warm-up. At `H = 0` these hold for any seed and any generator.
- Same seed, same stream over 5 000 turns. Seeds 7 and 8 differ at turn 0.

## 6. What must survive, and what is incidental

The mechanism. A port that changes any item has built a different instrument:

1. **One statistic per option, a debt in turns:** `+A` to the chosen,
   `−A·W[k]/ΣW` to every live option, on every selection. Not the W² variant.
2. **Lowest value wins**, with the stress offset `A/W` and the scatter
   `H·U/W` both divided by the option's weight. Never sampled odds.
3. **Silence is an option** with a weight, turns and a statistic, its weight
   `p/(1−p)·ΣW_voices` recomputed every turn. "Sometimes nothing happens" has
   lost the claim.
4. **Stress scales the charge and appears in no probability.** The metre of
   §5.4 comes out of the books; no step is reserved for anyone.
5. **Weight 0 removes an option from both loops and freezes its statistic.**
   No decay, no redistribution; it returns with its debt.
6. **An external invocation is a selection charged at the current stress**,
   through the same CHARGE, at current weights.
7. **Every parameter is read live**; none is cached into the statistics.
8. **Ties resolve by index**, never by float residue.
9. **The empty pool chooses and charges nobody.**

Incidental. A port that reproduces these has misread the spec:

- The voices, their sounds and gains, and that options are sounds at all; the
  law is indifferent to what an option does when chosen.
- The number of options, the weight range, `H`'s 0 – 2 scale, the stress
  length 8 and its default shape.
- The silence ceiling 0.95. `W_silence = p·ΣW` with voice weights scaled by
  `1−p` gives the same probabilities and is finite at `p = 1`, at the price of
  the ledger's units moving with `p`.
- The tie epsilon's value, the PRNG and the seed; they matter only to
  reproduce §5's per-seed rows.
- The tempo range, the eighth-note reading of a turn, and the scheduler.
- Restarting the stress pattern at each start and keeping the books across a
  stop. Saving the books with the settings is a valid choice for a port.
- Everything the page draws.
