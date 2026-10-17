# markov — mechanism spec

Two walkers share one lattice and nothing else. Each walker holds four states,
state 0 a rest and states 1 to 3 sounds, and a 4×4 matrix of non-negative
weights: the row is the state now, the column the state that may follow. On
every cell each walker draws its next state from its current row, normalised
by the row's own sum, with its own random stream. A dial `s` blends every
normalised row toward uniform in probability space; at `s = 1` the walk reads
the matrices as written, and there an all-zero row is a dead end where the
walker stands, draws nothing and emits nothing.

This document is the toy's logic in a medium an agent can port from: another
language, another audio framework, hardware. It is written for an agent, not
for a reader, so it is exact before it is readable. It carries the claim, the
state, the rule, the parameters with their shipped values, the measurements a
port is checked against, and the line between what must survive and what is
incidental. Everything about how this page shows the mechanism, sounds it, or
schedules it in a browser stays out: the code holds that, and an agent that
needs it reads the code.

The mechanism is the first-order chain that the Chaos Conductor paper names
and declines (§1).

**Licence: CC0.** Copy it, port it, sell it, no attribution required.
Attribution is nonetheless welcome: this page lives in the Playable Ideas
repository — <https://github.com/jpdrecourt/playable-ideas> — and its author at
[noisewrangler.art](https://noisewrangler.art).

---

## 1. The claim

**A first-order chain gives each state one distribution over what follows, so
no weighting holds a figure that uses a state twice: kick, hat, kick, snare
repeats with probability at most one in four per pass under any matrix, and
under the shipped matrices at `s = 1` it never occurs.**

The bound is the shape of the model, not a shortage of weights. One pass of
the figure starting on a kick that follows a snare needs `P(kick→hat)` and
`P(kick→snare)` from the same row, and `x·(1−x) ≤ 1/4`. A row with exactly one
non-zero weight makes the walk deterministic, and the cycle it then plays
visits each state at most once, so the figure stays out of reach even with the
chance taken away. Polyphony is a second chain with its own sixteen weights:
the parameters grow with the walkers and buy no structure across them.

Sources:

- Jean-Philippe Drecourt, "Programming a music performance instrument for a
  wandering mind and clumsy hands", 23rd Sound and Music Computing Conference
  (SMC 2026), accepted, camera-ready version;
  conference: <https://smc26.mbz.hr/>.
  - §3.2 "The motif trade-off": each sampler of the Chaos Conductor fires
    independently, with "no cross-correlation between sound events". "A model
    encoding inter-event dependencies, such as a first-order Markov chain,
    would require controlling a number of parameters that grows with the
    square of the number of samplers", which the author has "not found a way
    to make that controllable in live performance".
  - §5.2 "What the current architecture cannot reach": density, frequency and
    gain are nouns; "remembering a motif, developing a structure" are verbs
    that "require the system to reference its own past".
  - §5.5 "Conclusion": the architecture "offers nouns but no verbs: states
    without memory".

The toy builds the chain the paper declines and shows what it still cannot
reach: a chain does reference its past, by one step, and one step is not a
motif.

## 2. The state

Walkers are indexed `i = 0, 1`; states `k = 0 … 3`, state 0 the rest.

| quantity | type | range | initial | written by |
|---|---|---|---|---|
| `W[i][r][c]` | 2 × 4 × 4 | real ≥ 0; the page holds integers 0 – 4 | preset | the hand |
| `s` | scalar | 0 – 1, step 0.01 | preset | the hand |
| `bpm` | scalar | 40 – 200 | preset | the hand |
| `seed` | uint32 | 1 – 2³²−1 | preset | the hand, by reseed |
| `state[i]` | integer | 0 – 3 | 0 | the rule; clear sets 0 |
| `rnd[i]` | uniform on [0,1) | | derived from `seed` | the rule |

Every real quantity is float64. `state[i]` is not saved: every load starts
both walkers on the rest and both streams at the head of `seed`, so a saved
seed replays the same walk from the start. The matrices, `s`, `bpm` and
`seed` are read live on every step; nothing is cached from them.

**Two streams, one seed.** Each walker owns its stream; a draw by one never
moves the other's. This implementation derives both from a root generator:

```
root = G(seed)
seed[0] = floor(1 + 2147483646 · root())      # walker 0 first
seed[1] = floor(1 + 2147483646 · root())
rnd[i]  = G(seed[i])
```

`G` is mulberry32, the 32-bit state `a` initialised to the seed, all
arithmetic modulo 2³²:

```
a += 0x6D2B79F5;  t = imul(a ^ a>>>15, 1 | a);  t = (t + imul(t ^ t>>>7, 61 | t)) ^ t
return (t ^ t>>>14) / 2^32                      # unsigned
```

The generator and the derivation matter only to reproduce §5.6's rows to the
digit. A port with its own generator keys two independent streams from one
seed however that generator does it best (two spawned children of one seed,
two jump-ahead positions, two hashed sub-seeds), walker 0 on the first; any
such pair satisfies the rule and every §5 band.

## 3. The rule

```
ROWSUM(i, r) = Σ_c W[i][r][c]

DRAW(i, cur, s) -> next                       # one rnd[i]() per call, exactly
    row = W[i][cur];  sum = ROWSUM(i, cur)
    if s >= 1:                                # the plain chain
        if sum <= 0: return cur               # unreachable from STEP; kept total
        r = sum · rnd[i]();  cum = 0
        for c = 0 … 3:
            cum += row[c]
            if r <= cum: return c
        return cur                            # float shortfall: stay
    else:                                     # the blend, in probability space
        r = rnd[i]();  cum = 0
        for c = 0 … 3:
            pe  = row[c]/sum if sum > 0 else (1 if c == cur else 0)
            cum += (1 - s)/4 + s·pe
            if r <= cum: return c
        return cur                            # float shortfall: stay

STEP(i) -> STUCK | REST | HIT(k)              # every lattice cell, each walker
    if s >= 1 and ROWSUM(i, state[i]) <= 0:
        return STUCK                          # no draw, no move, no emission
    state[i] = DRAW(i, state[i], s)
    if state[i] == 0: return REST
    return HIT(state[i])                      # the walker's sound for that state

CELL(n)                                       # one per sixteenth: 60/bpm/4 s
    for i = 0, 1: STEP(i)                     # order irrelevant: streams are separate

RESEED(newSeed)
    seed = newSeed;  re-derive rnd[0], rnd[1] # state[i] and W untouched

CLEAR
    W = all zeros;  state[i] = 0              # streams continue; s untouched
```

**Invariants.**
- Every emitted state is a draw. No gate, density or probability sits between
  STEP and the sound: what the walk draws, sounds, and a rest is silence
  placed by the matrix.
- Exactly one `rnd[i]()` per non-STUCK step, none per STUCK step, for any `s`.
  Walker `i`'s sequence is a function of `W[i]`, `s`, its stream and nothing
  of the other walker.
- For `s < 1` every row of the blended matrix sums to 1 and every entry is at
  least `(1−s)/4 > 0`: no dead end, and the chain is irreducible and
  aperiodic.
- For every row with `sum > 0`, the total-variation distance of the blended
  row from uniform is exactly `s` times that of the normalised row. The dial
  is the same distance on every row.
- The matrices are never written by the rule. `s` is a lens on the draw; back
  at 1 the walk reads exactly what the hand wrote.

**Edge cases.**
- **The dead end at `s = 1`.** An all-zero current row: STEP returns STUCK on
  every cell, consumes no draw, leaves `state[i]`, and emits nothing. It does
  not re-fire the current sound. The walker moves again on the first cell
  after a weight enters that row or `s` drops below 1.
- **The empty instrument.** All weights 0 and both walkers on the rest: both
  STUCK at `s = 1`, which is how the instrument stops. The first weight in a
  rest row starts that walker. A rest row emptied while running stops the
  walker the next time it lands on the rest.
- **An empty row below `s = 1` reads as "stay".** Its blended row is
  `(1−s)/4` everywhere plus `s` on the current state, so the walker dwells
  there a geometric number of cells with mean `4 / (3(1−s))`: 13.3 cells at
  `s = 0.9`, 1.33 at 0.
- **The two thresholds are one.** STEP's dead-end test and DRAW's branch both
  use `s >= 1`. At `s = 1` the weights are compared unnormalised against
  `sum·rnd`; the blended branch at `s = 1` would give the same probabilities
  but is not the path taken, and a port that unifies the two must keep the
  STUCK branch at 1.
- **Both "stay" returns are the rule.** Integer weights accumulate exactly and
  never reach the shortfall; fractional weights and the blend can, by one
  ulp. Returning `cur` there, rather than the last non-zero column, keeps two
  ports from disagreeing on rounding.
- **A draw of exactly 0** returns column 0 even at weight 0 under `r <= cum`.
  This implementation does so; the probability is 2⁻³² per draw and no
  tolerance below sees it. A port may skip zero-weight columns.
- **A weight is a relative frequency.** Raising one weight lowers every
  sibling's share without touching its number.
- **Rest length is geometric** with ratio `q = P(rest→rest)`: mean `1/(1−q)`,
  `P(L ≥ k) = q^(k−1)`. There is no rest-length parameter. Rest 3 against
  kick 1 gives a mean of four cells and a run of twenty with probability
  0.4%.

**The wrong variant: blending the weights.** This looks like the same dial
and passes every check at `s = 0` and `s = 1`:

```
w'[c] = (1 - s)·1 + s·row[c]              # WRONG: a floor of one step per cell
p[c]  = w'[c] / Σ w'
```

The floor is a fixed number of steps, so its pull on a row depends on that
row's total. At `s = 0.5` on the shipped matrices the ratio of each row's
distance from uniform to its written distance is 0.5 on every row under the
rule; under this variant it is 0.33 on walker 0's rest row (total 2), 0.64 on
its kick row (total 7), and 0.20 on walker 1's rest and tom rows (total 1). A
heavy row keeps its shape while a light row goes flat, and the middle of the
dial means something different on every row. Any floor constant fails the
same way. §5.2 catches it. **Normalise each row first, then mix.**

**A second wrong variant: empty reads as uniform.** Setting `pe = 1/4` on an
empty row below 1 makes a dead end vanish at `s = 0.99` into a plain random
step. The rule reads an empty row as "stay", so the dial approaches the dead
end continuously.

## 4. Parameters and the shipped preset

| symbol | meaning | range | taper | shipped value |
|---|---|---|---|---|
| `W[0]` | walker 0: rest, kick, snare, hat | 0 – 4 per cell, integer | linear | below |
| `W[1]` | walker 1: rest, tom, rim, cowbell | 0 – 4 per cell, integer | linear | below |
| `s` | structure | 0 – 1, step 0.01 | linear | 1 |
| `bpm` | one cell per sixteenth | 40 – 200 | linear | 86 |
| seed | root of both streams | uint32 | | 1950012273 |

```
W[0]      → rest kick snare hat        W[1]      → rest tom rim cowbell
rest        1    1    0     0          rest        0    0   1   0
kick        1    1    4     1          tom         1    0   0   0
snare       1    1    1     1          rim         1    0   1   1
hat         3    0    0     1          cowbell     0    1   1   0
```

Rows sum to 2, 7, 4, 4 and 1, 1, 3, 2. Walker 0 holds twelve non-zero
weights, walker 1 seven. `hat→kick` is 0, which is why the figure of §1 cannot
occur at `s = 1`.

The matrices and 86 BPM are the author's, set by ear. The weight cap of 4,
the integer step, `s = 1` at open and its 0.01 step were chosen by reasoning.
Without the preset file the page opens on empty matrices at 100 BPM with a
fresh random seed. A loaded weight is rounded to an integer and clamped to
0 – 4; the rule itself takes any non-negative real.

## 5. What the rule does, measured

The core of §3 run alone, on the shipped matrices unless stated.

**Conventions.**
- A **run** is `N = 100 000` steps per walker from `state = 0`, `s` fixed, the
  run's seed replacing the shipped one. STUCK steps count toward `N` and draw
  nothing; the shipped matrices have no dead end, so no §5.1 – 5.4 run meets
  one.
- **Frequency** of state `k`: the number of steps whose draw is `k`, over `N`.
- **π** is the exact stationary distribution of the blended matrix
  `P_s[r][c] = (1−s)/4 + s·pe[r][c]`, computed, not measured.
- **The figure** is a window of four consecutive draws of walker 0 equal to
  kick, hat, kick, snare; windows slide by one step. **Continuation** is, over
  figure windows starting at `n` with `n + 7 < N`, the share whose next four
  draws are the figure again.
- A **rest run** is a maximal stretch of consecutive rest draws with a sound
  draw on each side; the open stretches at the start and end of the run are
  excluded.
- **TV** of a row is half the sum of `|p[c] − 1/4|`.

**The printed rows** are this implementation under mulberry32 with the §2
derivation. **The bands** are generator-independent: set over seeds 1 to 30
under two generators, mulberry32 and splitmix64 with each walker's stream
keyed separately, 60 runs per condition, at about twice the half-range those
runs gave. Any pair of independent uniform streams must land inside them.

### 5.1 Frequencies against the stationary distribution

| condition | walker | π: rest, 1, 2, 3 |
|---|---|---|
| `s = 1` | 0 | 0.3767, 0.2825, 0.2152, 0.1256 |
| `s = 1` | 1 | 0.2500, 0.0833, 0.5000, 0.1667 |
| `s = 0.5` | 0 | 0.3262, 0.2528, 0.2254, 0.1957 |
| `s = 0.5` | 1 | 0.2724, 0.1716, 0.3694, 0.1866 |
| `s = 0` | both | 0.2500 each |

Band: every frequency within 0.008 of π in every run. The 60 runs per row
deviate by at most 0.0040, and the two generators' means agree to 0.001.

Walker 0's rest share falls from 0.38 to 0.25 as `s` goes from 1 to 0;
walker 1's sits at 0.25, 0.27, 0.25. The walkers meet the uniform draw from
opposite sides.

### 5.2 The dial is the same distance on every row

Exact, from the matrices: at `s = 0.5` the TV of every non-uniform blended row
is half its written TV, on the seven non-uniform rows. Walker 0's snare row
is already uniform and stays so. The identity is exact by construction for
every `s` in 0 – 1, since the blend is affine in `s` about the uniform row;
this implementation checked it at `s` = 0, 0.25, 0.5, 0.75 and 1, and the
blind port at 0.3, 0.5 and 0.77. Band: equal to `s` × written TV to 1e-12.
The weight-blend variant of §3 gives 0.20 to 0.64 here.

### 5.3 The figure

Count of the figure in walker 0's run:

| `s` | expected, `N·π_kick·P(k→h)·P(h→k)·P(k→s)` | 60 runs | band |
|---|---|---|---|
| 1 | 0 | 0 in every run | exactly 0 |
| 0.5 | 254.9 | 219 – 295 | 180 – 330 |
| 0 | 390.6 | 349 – 428 | 310 – 470 |

The figure back to back is a window of eight draws, `n` to `n + 7`, holding
the figure twice; windows slide by one. Its count is 0 at `s = 1`. At
`s = 0.5` and 0 the expectation is 0.6 and 1.5 per run, the 60 runs give at
most 3 and 4, and the band is at most 10.

**The bound.** Walker 0 on the matrix built to hold the figure as well as one
step can: rest row `0 1 0 0`, kick `0 0 1 1`, snare `0 1 0 0`, hat `0 1 0 0`,
`s = 1`. Every figure window is a kick followed by hat or snare at one half
each, so continuation is exactly `1/4`. Measured: 0.240 – 0.256 over the 60
runs. A **back-to-back chain** is a maximal run of figures at `n`, `n + 4`,
`n + 8`, …, counted in figures; the longest per run is 6 to 10.
Band: continuation within 0.02 of 0.25; longest chain at most 14. No matrix
exceeds 1/4.

### 5.4 Rest lengths

| condition | walker | `q = P(rest→rest)` | mean, exact | 60 runs | band |
|---|---|---|---|---|---|
| `s = 1` | 0 | 0.5 | 2.000 | 1.979 – 2.020 | ± 0.04 |
| `s = 1` | 1 | 0 | 1 | 1 in every run | exactly 1 |
| `s = 0.5` | 0 | 0.375 | 1.600 | 1.587 – 1.611 | ± 0.025 |
| `s = 0.5` | 1 | 0.125 | 1.143 | 1.137 – 1.153 | ± 0.016 |
| `s = 0` | both | 0.25 | 1.333 | 1.321 – 1.348 | ± 0.03 |

Share of rest runs of length 1 equals `1 − q`: walker 0 at `s = 1` gives
0.493 – 0.509, band ± 0.016. Longest rest run at `s = 1`, walker 0: 13 to 21
over the 60 runs, band 10 to 30; a maximum of a geometric sample is too noisy
for a tighter one. Walker 0 with its rest row set to `3 1 0 0`, the other rows
as shipped, `s = 1`: mean 3.937 – 4.060 against an exact 4, band ± 0.12.

### 5.5 Dead ends and independence

Exact, and the same at every seed and generator; this implementation ran
them at seed 7 and the blind port at seed 5:

- All matrices zero, `s = 1`, 1 000 cells: STUCK on every cell for both
  walkers, zero draws consumed.
- Walker 0's rest row emptied: walker 0 is STUCK on its first cell, standing
  on the rest, and draws nothing.
- Walker 1's rest→rest set to 4: walker 0's first 5 000 draws at seed 7 are
  identical to the unmodified run.
- Same seed, same two sequences.
- Reseed after any number of steps, at any `s`, leaves `state[i]` as it was:
  the next step draws from that state's row with the new stream. The blind
  port checked it after 37 cells at `s = 1`.

Measured: all matrices zero, `s = 0.99`, a full run per walker, seeds 1 to 30
under both generators. Every cell draws. The quantity is the conditional
stay rate on the rest: among steps that start on the rest, the share whose
draw is the rest again, exactly `(1−s)/4 + s = 0.9925`. It is not the share
of rest draws, which tends to 1/4 since the walker dwells on every empty row
the same way. The 120 walker-runs give 0.9913 – 0.9936; band ± 0.0025.

### 5.6 Per-seed rows

Mulberry32, §2 derivation, shipped matrices, first 32 draws, digits are
states:

| seed | `s` | walker 0 | walker 1 |
|---|---|---|---|
| 1950012273 | 1 | `00000121121230001230123300121301` | `22322020202022322202022231020202` |
| 7 | 1 | `12200121200000000133001300112001` | `22020202202323102223102202020223` |
| 7 | 0.5 | `33200221200112100133001321202001` | `22010201013232022222020202002211` |

## 6. What must survive, and what is incidental

The mechanism. A port that changes any item has built a different instrument:

1. **First order over a flat state space.** One step of memory, no history,
   no counter: each state owns exactly one distribution over successors.
2. **The rest is a state** in the same matrix as the sounds, with no length of
   its own. A long silence is a heavy rest→rest weight, geometric in length.
3. **A weight is a relative frequency**, normalised by its own row's sum.
4. **An all-zero row at `s = 1` is a dead end**: no draw, no move, no
   emission. Not a re-fire, not a uniform draw, not an error. The empty
   instrument is stopped, and the first weight in a rest row starts that
   walker.
5. **What the walk draws is what sounds.** No gate or probability between the
   chain and the output.
6. **Two walkers share the lattice and nothing else**: no state, no weight, no
   stream. A weight in one never moves the other's walk.
7. **The structure blend is in probability space**: normalise, then mix with
   uniform; an empty row reads as "stay"; `s = 1` is the plain chain exactly,
   STUCK included. Not the weight blend.
8. **The dial and the reseed never write the matrices.** Every weight stays
   editable while the walk runs, with no mode boundary.
9. **One draw per walker per moving step**, and the walker's state persists
   across reseed and across edits to its matrix.

Incidental. A port that reproduces these has misread the spec:

- The sounds, which states are which sounds, and that outputs are sounds at
  all.
- Four states per walker, two walkers, the weight cap of 4 and integer
  weights; a continuous weight changes nothing in §3.
- The sixteenth-note lattice, the tempo range and 86 BPM.
- The shipped matrices; a port is checked on them, not bound to them.
- Mulberry32, the root-seed derivation and the seed; they matter only to §5.6.
- The `r <= cum` boundary convention and the draw-of-zero case.
- Persistence, starting each load from the rest at the head of the stream, and
  clear as a control.
- Everything the page draws.
