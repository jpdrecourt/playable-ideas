# possibles — mechanism spec

A tree of symbols, written by hand, is read aloud on a fixed lattice of one
symbol per cell. Each node is a motif, spelled by its path from the root, and
carries an integer count, the weight of the branch into it. Two separate verbs
write the tree: one makes a branch exist and otherwise only navigates, the
other raises or lowers a count, and a count lowered to zero cuts the branch and
everything under it. A reader stands on a node, draws one child with
probability proportional to `count^γ`, `γ = 1 − 2·bias`, emits its symbol and
stands on it; at a leaf it returns to the root and draws again inside the same
cell. One of the five symbols is a rest, drawn like the others and emitting
nothing.

This document is the toy's logic in a medium an agent can port from: another
language, another audio framework, hardware. It is written for an agent, not
for a reader, so it is exact before it is readable. It carries the claim, the
state, the rule, the parameters with their shipped values, the measurements a
port is checked against, and the line between what must survive and what is
incidental. Everything about how this page shows the mechanism, sounds it, or
schedules it in a browser stays out: the code holds that, and an agent that
needs it reads the code.

The tree is the dictionary of Incremental Parsing as Assayag and Dubnov use it
for machine improvisation (§1), with its learning half removed.

**Licence: CC0.** Copy it, port it, sell it, no attribution required.
Attribution is nonetheless welcome: this page lives in the Playable Papers
repository — <https://github.com/jpdrecourt/playable-papers> — and its author at
[noisewrangler.art](https://noisewrangler.art).

---

## 1. The claim

**Whether a continuation exists and how much it matters are two separate
decisions, and an instrument that gives each its own verb, with the machine as
the only speaker, yields motif and return from a hand that never places an
event in time.**

Sources:

- Gérard Assayag and Shlomo Dubnov, "Using Factor Oracles for Machine
  Improvisation", *Soft Computing* 8(9), 2004, pp. 604–610,
  doi:10.1007/s00500-004-0385-4. Section 1, "Modeling musical sequences":
  Incremental Parsing "builds a dictionary of distinct motifs", held as a tree
  in which "every node is associated with a string, whose characters appear as
  labels on the arcs that lead from the root to that node"; a generation step
  draws the next symbol from "a conditional probability distribution P
  associated to the node".
- Jacob Ziv and Abraham Lempel, "Compression of Individual Sequences via
  Variable-Rate Coding", *IEEE Transactions on Information Theory* 24(5), 1978,
  pp. 530–536, doi:10.1109/TIT.1978.1055934. The parse Incremental Parsing
  comes from, cited as such by Assayag and Dubnov.
- Jean-Philippe Drecourt, "Programming a music performance instrument for a
  wandering mind and clumsy hands", SMC 2026 (accepted). §3.1: "the machine
  is the mediator between the human and the loudspeaker". §3.2 and §5.2:
  independent triggering makes motif "structurally impossible", and a Markov
  chain's parameters grow with the square of the voices. §5.5 leaves motif
  under second-order control as the open problem this toy answers.

Departures from Assayag and Dubnov, one each:

- **No learning.** The tree is grown by a hand, not parsed from a
  performance, and structure and weight have separate verbs.
- **Counts are the distribution.** The node's distribution is its children's
  counts, raised to `γ`.
- **A walk, not a suffix search.** The paper conditions each step on the
  longest suffix of everything generated so far. The reader here descends from
  the node it stands on, and at a leaf returns to the empty context, the root.
- **The bias exponent** `γ` has no counterpart in the paper.
- **A rest is a symbol** of the alphabet.

## 2. The state

Symbols are integers `0 … 4`: kick 0, snare 1, cowbell 2, crash 3, rest 4.
Only `4` is silent.

| quantity | type | range | initial | written by |
|---|---|---|---|---|
| `root` | node | the empty motif | no children | the verbs |
| node `.symbol` | integer | 0 – 4 | at creation | never after |
| node `.parent` | node or null | | at creation | never after, a cut included |
| node `.count` | integer | ≥ 1 in the tree | 1 at creation | BUMP, DROP |
| node `.children` | ordered map symbol → node | ≤ 5 entries | empty | PLANT, DROP |
| `finger` | node | in the tree | `root` | the hand, the verbs |
| `reader` | node | in the tree | `root` | the walk, a cut, FORGET |
| `bias` | real | −1 – +1 | preset | the hand |
| `rnd` | uniform on [0,1) | | | the walk |

The root's count is 0 and is never read. A symbol appears at most once among a
node's children. **The children's order is insertion order**: the order of
PLANT calls, or of the array in a loaded file. It changes no probability, but
the walk subtracts weights in that order, so a port that wants §5's per-seed
rows must keep it.

`reader` survives a stop and a start; the walk resumes where it stood.
Nothing in the tree is cached: the walk reads counts, children and `bias` live
on every cell.

`rnd` is any uniform generator; this page uses the platform's own, unseeded,
and nothing of the mechanism depends on a seed. §5's per-seed rows use
mulberry32, the 32-bit state `a` initialised to the seed, arithmetic modulo 2³²:

```
a += 0x6D2B79F5;  t = imul(a ^ a>>>15, 1 | a);  t = (t + imul(t ^ t>>>7, 61 | t)) ^ t
return (t ^ t>>>14) / 2^32                      # unsigned
```

## 3. The rule

### 3.1 Structure

```
PLANT(node, s) -> node
    if s in node.children: return node.children[s]     # navigation, no count moves
    c = new node(symbol s, parent node, count 1, no children)
    node.children[s] = c                               # appended last
    return c

WRITE(s):   finger = PLANT(finger, s)
POINT(n):   finger = n                                 # any node in the tree
HOME:       finger = root
```

A run of WRITEs spells a path downward and creates every prefix not already
there. Writing a path that exists changes nothing in the tree.

### 3.2 Weight

```
BUMP(node)
    if node.parent is null: return                     # the root has no weight
    node.count += 1

DROP(node) -> (at, pruned)
    if node.parent is null: return (root, none)
    node.count -= 1
    if node.count > 0: return (node, none)
    p = node.parent
    remove node.symbol from p.children                 # the CUT
    return (p, node)

LIGHTER:  (at, pruned) = DROP(finger);  finger = at
          if pruned and reader is pruned or below it: reader = root
```

The cut unlinks one entry. The pruned subtree keeps its parent pointers, so
"is `x` at or below `pruned`" is a walk up from `x`; the same walk cannot tell
whether `x` is still in the tree. The finger lands on the cut node's parent,
the reader, when inside the cut, on the root.

```
FORGET:   root = new empty root;  finger = root;  reader = root
```

### 3.3 The walk

```
GAMMA(bias) = 1 − 2·clamp(bias, −1, +1)               # a non-number is 0; NaN stays NaN

DESCEND(node, bias) -> child | none
    items = node.children in order
    if items is empty: return none                     # a leaf
    g = GAMMA(bias)
    w[i] = items[i].count ^ g
    total = Σ w
    u = rnd()                                          # one draw per descent, always
    if not (total > 0): return items[min(len−1, floor(u·len))]
    r = u · total
    for i in order: r −= w[i];  if r <= 0: return items[i]
    return items[len−1]                                # the float tail

CELL()                                                 # once per lattice cell
    if root has no children: return nothing            # the empty tree: a silent cell
    seam = (reader is root)
    c = DESCEND(reader, bias)
    if c is none:                                      # reader is on a leaf
        reader = root;  seam = true
        c = DESCEND(root, bias)                        # INSIDE THIS CELL
    emit c.symbol, seam                                # 4 emits silence
    reader = c
```

**Invariants.** With a non-empty tree every cell emits exactly one symbol; no
cell is spent on the return to the root. Every descent draws exactly one
`rnd()`, a node with a single child included. After any verb every count in
the tree is ≥ 1. PLANT on an existing branch, POINT and HOME change no count
and no structure. Each child's probability at a node is
`count^γ / Σ siblings' count^γ`, so `bias` changes the odds at every node at
once and changes nothing in the tree.

**Bias, read off the law.** 0 is faithful, the counts as written; +0.5 even;
+1 contrary, the reciprocals; −1 cubes the counts. Bias has a centre and `γ` has none.

**Edge cases.**
- The empty tree: CELL emits nothing and draws nothing. A port keeps the
  lattice running.
- A cut while the reader stands inside it: reader to the root, so the next
  cell begins a phrase.
- DROP or BUMP on the root: no effect. DROP on a count above 1: the count
  falls and the finger stays.
- A bias that is not a number type (absent, a string) is read as 0. NaN is
  a number: the clamp returns NaN, `γ` is NaN, every weight is NaN, `total >
  0` fails and the uniform fallback picks. No control produces NaN.
- `total > 0` otherwise fails only for a count below 1, which no verb makes.
  This page's loader takes a file's counts as written, a missing count as 1;
  a count of 0 gives `0^γ` of 0, 1 or infinity. A port must not copy that
  loader: it clamps every loaded count to at least 1.
- The float tail: with `γ ∉ {0, 1}` the weights are not exact, `r` can stay
  above 0 after the last subtraction, and the last item is the answer. A port
  that throws there fails in use.
- A tree whose leaves all sit at depth `d` phrases every `d` cells exactly.

**Why PLANT does not count.** A learning parse counts every pass over a known
branch, which is how one repetition there both creates and weights. Here that
would make retyping a path a way of weighting it. A port that gives PLANT the
parse's count-on-visit lets one verb do both jobs: write the shipped groove
path once more and the 6 : 1 branch after `kick rest snare rest` becomes
7 : 1. The claim is gone.

**The wrong variant: the leaf costs a cell.** This CELL looks equivalent:

```
    c = DESCEND(reader, bias)
    if c is none: reader = root; return nothing        # WRONG, not a seam
```

The empty cell is not a seam; the next cell descends from the root and is.

Every share of the tree's own choices survives it, so a check of branch
frequencies passes. It inserts one empty cell per phrase. On the shipped tree,
whose phrases are all 8 cells, every phrase becomes 9: one cell in 9 is a gap
no rest wrote, the seams walk through all eight positions of the bar instead
of sitting on its first cell, and the rest share at `bias = 0` falls from
0.321 to 0.286. §5.3 catches it at once. Silence comes from rests in the
tree, never from the walk.

## 4. Parameters and the shipped preset

| symbol | meaning | range | taper | shipped value |
|---|---|---|---|---|
| the tree | the material | any shape, counts ≥ 1 | | "groove and fill", below |
| `bias` | lean of the draw, `γ = 1 − 2·bias` | −1 – +1, step 0.01 | linear in bias | 0 |
| tempo | one cell per eighth note | 40 – 240 BPM | linear | 120 BPM: 250 ms a cell, 8 cells a 4/4 bar |

The tree, children in stored order, `symbol:count`, indented by depth:

```
kick:1
  rest:1
    snare:1
      rest:1                    # node A, depth 4
        kick:6                  # node B, depth 5
          kick:4
            snare:1
              rest:1
          cowbell:2
            snare:1
              cowbell:1
        snare:1
          snare:1
            snare:1
              crash:1
```

Fifteen motifs and three leaves, all at depth 8, so three phrases, each one
bar:

| phrase | cells | rests |
|---|---|---|
| groove | kick rest snare rest kick kick snare rest | 3 |
| cowbell fill | kick rest snare rest kick cowbell snare cowbell | 2 |
| crash fill | kick rest snare rest snare snare snare crash | 2 |

The tempo, the eighth note as the cell and the tree were chosen by reasoning,
not by listening. The law counts cells, so tempo moves no proportion.

## 5. What the rule does, measured

The rule of §3 run alone on the shipped tree, from `reader = root`, one CELL
per step.

**Conventions.**
- A run's seed replaces the page's generator; each run is one fresh stream on
  a freshly loaded tree. A port seeds its own generator however it likes;
  integers 1 to 30 will do.
- A **descent** is one call of DESCEND that returns a child. A cell's descent
  is **from** the node the reader stood on before it, or from the root on a
  seam.
- A **branch frequency** at node X is the number of descents from X that chose
  that child over the number of descents from X. Node A is
  `kick rest snare rest`, node B is A's kick child.
- A **seam** is a cell whose descent is from the root; a **phrase** runs from a
  seam to the cell before the next seam, and the open stretch after the last
  seam is excluded. A **phrase share** is the phrase's count over all phrases.
- The **rest share** is the cells emitting symbol 4 over all cells.

**The printed rows** are mulberry32 at the stated seed. **The bands** are
generator-independent: seeds 1 to 30 under mulberry32 and splitmix64, 60 runs
per condition. **A band bounds every run, not the mean**: each run's value
lies within it. It was set at about twice the half-range observed, half the
gap between the smallest and largest run. Any uniform generator must land
inside them.

### 5.1 The law on one node

A root with four children, counts 1, 2, 3, 4, inserted in that order. 100 000
descents per run, which may be direct calls of DESCEND(root).

| bias | γ | law, count 1 · 2 · 3 · 4 | largest deviation, 60 runs |
|---|---|---|---|
| −1 | 3 | .0100 · .0800 · .2700 · .6400 | .0035 |
| −0.5 | 2 | .0333 · .1333 · .3000 · .5333 | .0035 |
| 0 | 1 | .1000 · .2000 · .3000 · .4000 | .0039 |
| +0.5 | 0 | .2500 · .2500 · .2500 · .2500 | .0036 |
| +1 | −1 | .4800 · .2400 · .1600 · .1200 | .0034 |

Band: in every run, every frequency within 0.007 of the law. The largest
deviation over the 60 runs is 0.0039.

### 5.2 Faithful, even, contrary on the shipped tree

20 000 cells per run. The law predicts, at A, kick `6^γ/(6^γ+1)`, and at B,
kick `4^γ/(4^γ+2^γ)`; the phrase shares are the products along each path; the
rest share is `(2 + P(groove))/8`.

| bias | | A → kick | B → kick | groove | cowbell fill | crash fill | rest share |
|---|---|---|---|---|---|---|---|
| −1 | law | .9954 | .8889 | .8848 | .1106 | .0046 | .3606 |
| | 60-run mean | .9956 | .8898 | .8859 | .1097 | .0044 | .3607 |
| | band | ± .008 | ± .03 | ± .03 | ± .03 | ± .008 | ± .004 |
| 0 | law | .8571 | .6667 | .5714 | .2857 | .1429 | .3214 |
| | 60-run mean | .8586 | .6696 | .5749 | .2837 | .1414 | .3219 |
| | band | ± .03 | ± .055 | ± .055 | ± .045 | ± .03 | ± .007 |
| +0.5 | law | .5000 | .5000 | .2500 | .2500 | .5000 | .2813 |
| | 60-run mean | .4996 | .5034 | .2515 | .2481 | .5004 | .2814 |
| | band | ± .055 | ± .05 | ± .045 | ± .03 | ± .055 | ± .006 |
| +1 | law | .1429 | .3333 | .0476 | .0952 | .8571 | .2560 |
| | 60-run mean | .1437 | .3345 | .0481 | .0957 | .8563 | .2560 |
| | band | ± .035 | ± .10 | ± .02 | ± .03 | ± .035 | ± .003 |

Every band is centred on the law and bounds each run's deviation from it.
B's is widest at +1: B is reached only on A's kick branch, about 360 times a
run.

Mulberry32 seed 7 at bias 0, the first 24 cells, `r` for rest:

```
K r S r K K S r  K r S r K K S r  K r S r K C S C
```

### 5.3 The lattice

At every bias of §5.2, every run: 2 499 complete phrases in 20 000 cells, each
exactly 8 cells; every seam on a cell index ≡ 0 mod 8; every cell emits a
symbol. Exact, independent of the stream.

Under the wrong variant of §3.3, 20 000 cells, bias 0, every phrase is 9
cells:

| quantity | law | measured, 60 runs | band, every run |
|---|---|---|---|
| empty cells share | 1/9 = .1111 | .1111, every run | ± .001 |
| seams on cell ≡ 0 mod 8 | 1/8 = .1250 | .1251, every run | ± .002 |
| rest share | 8/9 × .3214 = .2857 | mean .2862, half-range .0033 | ± .007 |

A port inside the §5.2 bands and wrong here has added a cell at the seam.

### 5.4 The verbs, exact

On a freshly loaded shipped tree each. The **stored tree** is the nested
JSON of `[symbol, count, children]` in child order, root count excluded. The
first three checks draw nothing:

- HOME, then WRITE `kick rest snare rest kick kick snare rest`: the stored
  tree is byte-identical before and after, the finger on the groove's leaf.
- POINT at B's cowbell child, count 2; LIGHTER: count 1, no cut, 15 motifs.
  LIGHTER again: the cut; 12 motifs, the finger on B, the cut node's parent
  still B. The menu at B is then kick alone.
- BUMP and DROP on the root: no change.
- Live reading, which draws: reader at the root, bias 0, any seed. Run 8
  cells; the reader stands on a depth-8 leaf, since every phrase is 8 cells.
  PLANT(reader, cowbell), then run one cell: it emits cowbell, not a seam,
  descending from that leaf. Checked at mulberry32 seeds 1, 7, 99.

## 6. What must survive, and what is incidental

The mechanism. A port that changes any item has built a different instrument:

1. **Structure and weight are separate verbs.** PLANT on an existing branch
   navigates and moves no count; a new branch starts at 1.
2. **Weight lives on the branch**, which is the child node; the root has none.
3. **At zero the branch is cut with its whole subtree.** Not clamped at zero,
   not hidden, not kept at a floor; the reader standing inside goes to the
   root.
4. **The hand makes no sound.** No verb emits a symbol; the walk is the only
   speaker.
5. **The walk is a descent from where the reader stands**, and a leaf ends a
   phrase: back to the root and down again **inside the same cell**, so the
   lattice never gaps and a tree with leaves at one depth phrases at one
   period.
6. **The tree is read live** on every cell; nothing is compiled or copied.
7. **The rest is one of the symbols**, in the same menus, emitting nothing.
   Silence written by the grammar is not silence left by a gate.
8. **The law is `count^γ`, `γ = 1 − 2·bias`, bias in −1 … +1**, so that 0 is
   faithful, +0.5 even and +1 contrary. Another lean answers another question.
9. **The tree is the score and the walk is a performance of it.** The walk is
   not reproduced; a port may seed it, and nothing else changes.

Incidental. A port that reproduces these has misread the spec:

- The four sounds, their palette, and that symbols are sounds at all; the
  walk is indifferent to what a symbol does when emitted.
- The alphabet's size and its numbering, beyond one symbol being the rest.
  The numbering matters only to read this page's saved trees.
- The cell as an eighth note, the tempo range and the default tempo.
- The shipped tree and its counts.
- The generator and its lack of a seed; the children's insertion order, which
  matters only to reproduce §5's per-seed rows.
- The reader surviving a stop, and the root's count of 0 in the file.
- The finger, POINT and HOME as gestures; how a cut is confirmed; persistence
  and FORGET.
- Everything the page draws.
