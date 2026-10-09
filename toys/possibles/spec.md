# possibles — mechanism spec

You never place an event in time, and nothing you do makes a sound. You write,
by hand, a tree of what can follow what — five symbols, a branch per
continuation, a weight on each branch — and a machine walks that tree aloud on
a steady grid. The machine is the only speaker. What you shape is the field of
possibles: which motifs exist, and how much weight each branch carries.

This document is the toy's other medium. It carries the mechanism, its
parameters, its audio graph and its timing, at the level a reader needs to
rebuild the instrument somewhere else — another language, another audio
framework, hardware. Where a choice is arbitrary this file says so.

The model is **Incremental Parsing**, after Gérard Assayag and Shlomo Dubnov,
*Using Factor Oracles for Machine Improvisation*, Soft Computing 8(9):604–610,
2004 (DOI 10.1007/s00500-004-0385-4). A dictionary of motifs held as a tree:
each node a motif, each path from the root spelling it, each node's count the
weight on that continuation. The paper grows the tree by parsing a performance,
where structure and weight both fall out of the same repetitions. Here a hand
grows it, and the two come apart into separate verbs — which is the whole of
what this page adds to the model, and §1 is the claim that makes.

**Licence: CC0.** Copy it, port it, sell it, no attribution required.
Attribution is nonetheless welcome: this page lives in the Playable Papers
repository — `REPOSITORY URL TO BE SET BEFORE PUBLISHING` — and its author at
[noisewrangler.art](https://noisewrangler.art).

---

## 1. The claim

**Existing and mattering are different questions, and an instrument can let you
answer them one at a time.**

Placing sounds in time is first-order work and lives elsewhere. This is the
order above it: the field of possibles. Two verbs, kept apart —

- **structure**, which makes a continuation *exist*, and
- **weight**, which decides how much it *matters* —

and the page is the argument that keeping them apart is worth the second verb.
In the paper they are one act: a performance repeats itself, and the repetition
both creates a motif and raises its count. Take the performance away and you
find you were doing two things.

The second half follows from the first and is what a hand feels within seconds:
**writing is not playing.** There is no way to strike a drum on this page. The
keys and the write buttons put symbols into the tree, silently; the machine is
the only speaker, so everything you hear is the field talking back. A visitor
who wants a particular figure at a particular moment cannot have it, and that
refusal is the claim rather than a missing feature.

## 2. The state space

**Five symbols**, and a symbol is the whole event — no pitch, no level, no
duration:

| symbol | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| name | kick | snare | cowbell | crash | rest |

The **rest is one of the five**, so silence is something the tree can say
rather than a gap between the things it says. It has no sound and no level; it
is a state like any other to the walk.

The integers are the tree's alphabet and are what persistence stores, so a port
that renumbers them cannot read a saved tree. See §5.

**The tree.** One node per motif. The root is the empty motif and carries no
weight, being nobody's continuation. Every other node holds:

```
node = { symbol : 0..4
         parent : node | null
         count  : integer >= 1     -- the weight on the branch INTO this node
         children : map symbol -> node }
```

The path from the root to a node spells that node's motif. Weight lives on the
branch, which is to say on the child, because a branch is a continuation and a
continuation is what a weight is about.

Two positions are held beside the tree and are not part of it:

- **the finger** — the node the hand writes from. Drawn as a square.
- **the reader** — the node the machine is standing on. Drawn as a ring, with
  the menu it is looking at lit around it.

Neither is saved; both open at the root.

## 3. The two verbs

### 3.1 Structure

```
PLANT (node, symbol) -> node
    if node.children has symbol:  return node.children[symbol]   -- pure navigation
    child = new node(symbol, parent = node, count = 1)
    node.children[symbol] = child
    return child
```

The hand's gesture is `finger = PLANT(finger, symbol)`: make the branch exist
under the finger and step into it. A run of symbols therefore writes a whole
path downward — `A S A G` writes that motif and every prefix of it.

**Walking a path you already wrote says nothing about how likely it is.** That
is the branch marked *pure navigation* above, and it is the rule rather than an
optimisation: a new branch starts at count 1 because it exists, once, and
re-typing it must not be a way of weighting it by accident. Weight has its own
verb.

The finger is moved directly by pointing at a node, and returns to the root on
a gesture of its own.

### 3.2 Weight

```
BUMP (node)                      -- heavier
    if node.parent:  node.count += 1

DROP (node) -> { at, pruned }    -- lighter
    if not node.parent:  return { at = root, pruned = none }
    node.count -= 1
    if node.count > 0:  return { at = node, pruned = none }
    parent = node.parent
    remove symbol(node) from parent.children
    return { at = parent, pruned = node }
```

Both act on the branch under the finger. The root has no weight to edit.

**At zero the branch is cut away, and everything under it goes with it** — a
continuation nothing can choose is not a continuation, and neither is anything
that could only be reached through it. The cut is by unlinking alone: the
subtree stays whole and still points up at where it hung, which is what lets a
caller ask whether a node it was holding is inside what just fell off. Both the
finger and the reader are re-seated at a surviving ancestor when they were
standing in the cut.

This is the one irreversible act on the page, and §8 says what the surface owes
it.

## 4. The walk, and the bias law

The machine stands on a node, draws one of its children, speaks that symbol,
and stands on the child.

```
GAMMA (bias) = 1 - 2 * clamp(bias, -1, +1)

MENU (node, bias) -> list
    for each child c of node:
        emit { symbol = c.symbol, weight = c.count ^ GAMMA(bias) }

DESCEND (node, bias, rng) -> child | none
    items = MENU(node, bias)
    if items is empty:  return none                 -- a leaf: the motif ends
    total = sum of weights
    if total <= 0:  return a uniform choice          -- degenerate; see below
    r = rng() * total
    for each item:  r -= item.weight; if r <= 0: return item
    return the last item                             -- the floating-point tail

ON-CELL (t)
    if root has no children:  return                -- an empty tree runs silent
    pick = DESCEND(reader, bias, rng)
    if pick is none:                                -- a leaf
        reader = root                               -- home, and down again
        pick = DESCEND(reader, bias, rng)           -- INSIDE THE SAME CELL
        if pick is none: return                     -- the tree is a single leaf
    play(pick.symbol) at t                          -- a rest plays nothing
    reader = pick.child
```

Four things in that order are load-bearing.

**A leaf costs no time.** Reaching a leaf the machine goes home to the root and
descends again *inside the same cell*, so the crossing is free and the grid
never gaps. **One root-to-leaf walk is one phrase**, and the phrases run on end
to end without pause. The machine never stops; breath is a rest written into a
branch.

**The tree is read live.** A branch written between two cells is in the menu on
the next one. There is no compilation step and no copy of the tree anywhere.

**A rest is a symbol that plays nothing**, not a skipped cell. The walk
advances through it exactly as through a sound.

**The bias law.** A branch is drawn with probability proportional to
`count^γ`, where **γ = 1 − 2·bias** and bias runs −1…+1:

| bias | γ | what the draw does |
|---|---|---|
| −1 | 3 | sharpened: weights cubed, the heavy branch all but certain |
| 0 | 1 | faithful: the counts exactly as written |
| +½ | 0 | even: every weight becomes 1 |
| +1 | −1 | contrary: the weights reciprocated, what carries least is preferred |

The surface shows **bias** rather than γ because bias is the thing with a
centre. Measured against the law on a node whose four branches carry counts
1·2·3·4, 400 000 draws per setting, the largest deviation from `count^γ`
normalised is 0.0021 at bias −½ and 0.0007 at +½ — the draw is the law and not
an approximation of it.

Two branches in `DESCEND` look like defensive noise and are the rule. The
**empty menu** is a leaf: the branch simply ends, which is a fact about the
structure rather than a failed match, and the caller decides what it means —
here, the seam between two phrases. The **floating-point tail** returns the
last item where the accumulated subtraction lands short of the draw; with
γ ≠ 1 the weights are irrational and the sum is not exact, so this branch is
genuinely reachable and a port that throws there will throw in front of a
visitor. The `total <= 0` guard is for a port whose weights can underflow to
zero at γ = 3; it cannot be reached from this surface, where counts are small
integers.

**The walk is not reproducible and is not meant to be.** The draw takes the
platform's own generator; there is no seed and no reseed control. The tree is
the score and it persists; the walk is a performance of it and does not. A port
that wants a replayable walk seeds its own generator and changes nothing else
in this section.

## 5. Parameters

| control | range | default | notes |
|---|---|---|---|
| the tree | any shape, counts ≥ 1 | "groove and fill", from `default.json` | the material; written by hand, persists |
| bpm | 40..240 | 120 | one symbol per **8th note**, so a cell is `30 / bpm` seconds |
| bias | −1.00 .. +1.00, step 0.01 | 0.00 | the only bipolar control here; §4 |
| level, mute | per symbol | unity, open | the library rack, writing the voice's own bus |

There is **no parameter beyond those**. No density, no gate, no rest length, no
per-symbol probability, no swing: everything the machine does about *when* is
the grid, and everything it does about *what* is the tree.

**The arrival state.** The page opens on a written tree — "groove and fill",
the `default.json` beside the page — with the machine stopped and the audio
context not yet built. One discovery stands between arrival and the first
sound: Play, which the start line names. A returning visitor's own session
comes before the file. The tree is material and lives in the file only, so a
page that cannot read it (opened off a disk, where the fetch is refused) says
so once and opens on the empty tree.

The empty tree is where writing is learnt, and **forget** is the way to it.
Play on an empty tree runs the grid silent — which is the mechanism and is said
in words on the start line rather than left to be discovered as a fault.

**A hand-built tree is a score, so it outlives the page.** The tree, the tempo,
the bias, the mixer strips and the master chain autosave to the browser and
come back on reload; Save and Load write the same snapshot as a file. The tree
is stored as nested `{ s: symbol, k: count, c: [children] }` with the root
carrying symbol `null`, plus the event count; parent and depth are not stored,
because where a node sits already says them.

**Nothing reopens sounding, and nothing has to be zeroed to keep that true.**
The audio context is constructed inside the visitor's first press and never at
load, so a restored page is silent until a hand asks — and then it speaks the
tree it was left with, which is what a restored score is for. A page whose gate
is a saved parameter has to force that parameter back to zero; a page whose
gate is the transport does not.

Persistence obliges a way back to nothing, which is what **forget** is for. It
empties the tree and leaves the transport running: the machine goes on walking
a tree that has nothing in it, which is the honest picture of what just
happened.

## 6. Audio graph

Every sounding symbol is one call into the shared voice library, which owns the
whole chain: `synth → 3 ms attack / exponential decay → the voice's pan → the
voice's bus (level, mute) → master`, and the master is the standard one
(gain → waveshaper drive → glue compressor → dry + small room → limiter).

Four of the five symbols have a voice — **kick, snare, cowbell, crash**, the
library palette unchanged, with the library's own trims and colours, so a
rhythm found here can be rebuilt in another toy of the collection: the kick
here is the kick there. The rest has none. Nothing is recorded and the page
carries no audio files.

There is nothing between the tree and the voice. This toy shapes no timbre and
adds no effect: the mechanism under study is *what may follow what*, and a page
that also invented a synthesis layer would put two unfamiliar things in front
of a visitor at once.

**The crash steals its own voice.** At this toy's tempo a 0.9 s cymbal is still
sounding when the next one arrives, and a stack of them washes the tree's
rhythm away, so a new crash cuts the one before it. Every other symbol layers
freely. Nothing else is capped: the machine speaks at most one symbol per cell,
so no voice is re-struck faster than one cell — 250 ms at the default tempo,
125 ms at the top of the range.

**Every level here is a guess until an ear pass.** No event gain is set, so
each voice sounds at its own library default, and the crash carries the
library's −12 dB in-voice trim. The choice of these four sounds, and the
crash's stealing, were reasoned and not heard: nobody has listened to this
palette against a fast tree and ruled on it.

## 7. Timing

The house lookahead scheduler: a coarse 25 ms timer schedules every cell inside
a horizon of `now + 0.15 s` at absolute audio-clock timestamps, and the cell
duration is read live at each tick so a tempo change alters only cells not yet
scheduled. Timer jitter never reaches the audio.

Three behaviours a port must keep:

- **Widen the horizon when the page is hidden** (to ~1.6 s) and narrow it on
  return. Background timer throttling is around a second and starves a 150 ms
  horizon, which is heard as the audio stopping on a tab switch.
- **Walk a cell already in the past, and sound none of it.** If the page was
  hidden long enough to outrun even the widened horizon, a backlog scheduled at
  past timestamps would sound as one clump on return. The walk still steps
  through those cells — the machine not stopping is the claim; only the audio
  is dropped.
- **Release the display against the audio clock, not the scheduler.** Symbols
  are composed up to a horizon ahead of the sound, so the trace and the
  machine's ring are queued with their timestamps and shown when the audio
  clock reaches them. Drawn at scheduling time, the walk is seen an eighth of a
  second before it is heard.

That release queue needs a bottom. It is drained on animation frames, which do
not run in a hidden tab while the walk does, so it is **bounded where it is
filled** — at the scheduler — and the oldest entries go, because what a
returning visitor wants is the walk they came back to.

Stopping is a master fade rather than a silence: cells already inside the
lookahead are faded out instead of played, so the release queue is dropped with
them and the trace never claims a symbol nobody heard.

## 8. The surface

The layout is incidental; these properties are not.

**The tree is the instrument and comes first**, because it is a relation
*across* the five symbols and no strip can hold it. The root is the empty motif
at the left and depth runs rightward, so the tree grows to the right as its
motifs get longer. A square's size is the weight on that continuation, in the
colour of the symbol that ends it (grey for a rest) — that is what was
written. An **edge**'s thickness and brightness are the odds the machine would
give that branch *right now*, under the live bias and against its siblings —
that is how it currently leans. The two are drawn together on purpose: turning
bias leaves every square where it is and moves every edge, which is the whole
difference between what a tree contains and what it is likely to say.

**The white ring is the machine and the amber square is the finger.** The ring
is released against the audio clock, so it is where the ear is and not where
the scheduler has got to. Beside the tree stand **heavier** and **lighter**,
acting on the branch under the finger, and a line naming that branch, its
weight and how many ways it can go on — because a weight the hand is about to
move has to be readable before it moves.

**A strip per symbol.** Name, mute, level, and **write**: make this symbol's
branch exist under the finger and step into it, which is the keyboard's gesture
put on a strip. The rest's strip carries a real write button and empty mixer
cells, so the columns line up and there is nothing to level. The five write
buttons are the whole authoring vocabulary, and the keys are their twins.

**Nothing in the instrument asks for sound.** Not a write button, not heavier,
not lighter, not the tree. That is the claim made physical, and the page says
so rather than leaving a visitor to conclude it is broken: a press anywhere in
the instrument before the machine has ever run is answered by name.

**The cut asks twice.** Lowering a weight is ordinary and acts on the first
press; the press that would take a weight to zero — and with it a whole
subtree — arms instead, and a second press cuts. Any other write disarms it.
Two presses for an ordinary lightening would teach pressing twice by reflex,
which is why only the destructive press asks.

**The trace is the last four bars of what the machine said**, as discrete
slots rather than as scrolling time: the machine speaks exactly one symbol per
cell, so a slot per cell is what the stream is. A block is a symbol in its own
colour, a low dash is a rest, and a brighter left edge is a phrase seam — the
cell on which the walk went home to the root and started again. The seam is the
one thing about the walk that cannot be heard directly and is the page's own
claim about phrases, so it is drawn.

Off the left edge is gone for good: **the trace forgets and the tree does
not**, which is what lets a motif come round again long after it scrolled away.

**A dead page and a silent page look alike, so the surface says which.** One
computed state, in a strict order of urgency — not started, then nothing
written, then shut — and every line on the page is a view of it. A stopped
machine, an empty tree and a muted mixer are three different silences and are
named as three.

**Keyboard.** Every control is a tab stop and answers the arrows. The tree is
one tab stop and the arrows walk it: right descends to a branch, left climbs to
the parent, up and down step among siblings, Home and Escape go to the root.
That is how a keyboard reaches a node, since a canvas has no children to focus.

**Widths.** Desktop first: one column throughout, and the rack scrolls
horizontally rather than reflowing, because the columns lining up down the page
is what a rack is. Nothing overflows at any width.

**The teaser.** Below the collection's teaser width the page is its phone mode:
the same engine and the same tree, with the tree panel, the rack, the master
strip and the session bar put away. The phone keeps the play button — the piece
has a beginning — and the trace, and gets one control: **bias**, a second dial
on the same parameter as the desktop's, each showing the other's writes. Bias
is the one thing on this page that changes what the machine says without
writing the tree, which is why it is the whole of the phone. The tree panel
goes because its finger, heavier and lighter are writes, and nothing on the
phone writes. Under the trace the page invites the visitor to the desktop and
offers to send the link to themselves, and one paragraph of its own names
only Play, bias and the trace; the desktop's standing text, which teaches
writing, is not shown there.

## 9. What is left out, and why

**The learning half of the model.** The paper's tree is grown by *parsing* a
performance: a finger walks down while it recognises and plants a leaf the
moment it does not, so structure and weight both fall out of the same
repetitions. Nothing on this page listens, so that verb is not on the surface —
and the page is the argument for what taking it away reveals. The mechanism
keeps the operation, because a listening mode is the obvious sequel and it is
exactly what one would need.

**Any way to strike a drum.** There is no audition button, no per-symbol
preview, no metronome click. A page that let you hear a symbol on demand would
answer "what does this sound like" and quietly retract the claim that the
machine is the only speaker.

**Order beyond one branch.** A node's menu is a flat set of continuations; the
tree carries context only through depth, so a motif's tail cannot be made to
depend on anything but the path that reached it. That is the model's shape and
not a shortage of controls.

**A seed.** §4. The tree is the reproducible thing.

**Depth limits, pruning by age, forgetting.** The tree only grows and only a
hand shrinks it. A listening mode would need a policy here; a hand does not.

## 10. What must survive a port

Keep, or it is a different instrument:

1. **Structure and weight are separate verbs.** Planting an existing branch is
   pure navigation and moves no weight. Everything the page claims follows from
   this one.
2. **Weight lives on the branch**, which is to say on the child; the root has
   none, being nobody's continuation.
3. **A branch at zero is cut, with everything under it.** Not clamped, not
   hidden, not left at zero — a continuation nothing can choose is not a
   continuation.
4. **Nothing the hand does makes a sound.** No audition, no strike. The machine
   is the only speaker.
5. **The walk is a descent, not a search**, and a leaf is the end of a phrase
   rather than an error: home to the root and down again **inside the same
   cell**, so the crossing costs no time and the grid never gaps.
6. **The tree is read live**, so a branch written between two cells is in the
   menu on the next one.
7. **A rest is one of the symbols**, drawn from the same menu as the sounds and
   playing nothing. Silence composed by the grammar is not the same object as
   silence left by a gate.
8. **The bias law is `count^γ` with `γ = 1 − 2·bias`**, centred so that 0 is
   faithful, +½ is even and +1 is contrary. A port that leans the draw some
   other way is answering a different question.
9. **The tree persists and the walk does not.**
10. **Some view shows both what the tree holds and how the machine leans on
    it**, and turning the lean must visibly move the second without touching
    the first.

Incidental — change freely:

- The palette, the synthesis, the whole master chain, the colours.
- The lattice's subdivision (an 8th here; a 16th is the same engine), the tempo
  range, and the default tempo.
- The alphabet's size. Five is small enough that a visitor can hold the
  vocabulary in their head. What is not incidental is that one of them is the
  rest.
- The trace's four-bar span, and the presence of a mixer at all.
- Persistence, and therefore the `forget` control that persistence makes
  necessary.
- Whether the cut asks twice or is undone some other way. That the destructive
  act is answerable at all is not incidental; the gesture is.

**Guesses, not ear values.** Every number below was chosen by reasoning and has
not been heard against a listening pass: the four sounds and their library
default levels, the crash's stealing, the default tempo of 120 bpm, the 8th
note as the cell, and the trace's four-bar span.
