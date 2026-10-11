# Current (live, 2026-10-11)

## front
### sub
Browser audio toys, each built around one mechanism, each with a spec an agent can rebuild it from.
### what-is
none
### blurb motif-memory
Memory is a state of a voice, not a structure beside the ensemble.
### blurb markov
A first-order chain gives every state exactly one future — a local grammar, and no phrase.
### blurb statistical-feedback
Dice have no memory, and the ear hears the difference.
### blurb possibles
Existing and mattering are different questions, and an instrument can let you answer them one at a time.

## motif-memory
### shows
Five voices on one pulse — throw a voice's MEM switch and the two bars it just played become its score, then ride *fidelity* between that memory and pure generation.
### meta.description
Five stochastic voices on one pulse, each carrying a rolling record of the last two bars it played. Throw a voice's MEM switch and that record becomes its score; fidelity rides between the memory and pure generation.
### og.description
A voice remembers the last two bars it played. One knob rides between that memory and fresh invention, at the same density throughout — so the crossing can hide.
### text
none
### teaser.text
none
### share
Five random voices; one button makes each remember what it just played, one knob lets it forget. The whole rack wants a desktop.
### start.notStarted
press ▶ Play, or the Space bar, and the five voices start on one pulse.
### start.nothing
every voice's density gate is shut, so the pulse is running with nothing on it — open one and that voice takes its chances again.
### start.stuck
""
### start.shut
it is running and nothing reaches you: every voice is muted, or the master level is at zero.
### start.running
throw a voice's MEM switch and the two bars it has just played become its score. Then turn that voice's fidelity down.
### teaser.notStarted
press ▶ Play and the five voices start on one pulse.
### teaser.nothing
every density is at zero, so the pulse runs empty; the desktop page can open them.
### teaser.shut
running, but muted or the master is at zero — only the desktop page can change that.
### teaser.running
press memory and each voice keeps the two bars it has just played. Then ride fidelity down.

## markov
### shows
Two chains, four states each, and thirty-two weights between them. Each chain remembers exactly one step: build one and hear what that can hold.
### meta.description
Two chains, four states each, thirty-two weights in all — and each chain remembers exactly one step. Build them by hand and hear what one step of memory can hold, and what it cannot.
### og.description
Thirty-two numbers for two walkers, and each remembers one step. Build the chains by hand and listen for the figure coming apart.
### text
**Start.** The page opens on an example: two matrices somebody built. Touch the rack or the trail and both walkers start. <b>clear</b>, below, empties both — then each walker stands on its rest, a rest with no weights goes nowhere, and a tap on a cell in a rest strip (the first strip of either group) starts that walker on the next beat.

**A strip is a state.** After its level and its mute come four cells: what may follow this state, one per state of that walker, in the order the group's caption names. The fill is the weight, and a weight is a share of its own row rather than a probability — raising one lowers every sibling's share without touching their numbers. Tap to add a step, tap past full or hold to clear. The lit strip is where that walker is standing now.

**Thirty-two numbers, and each chain remembers one step.** That is the whole model. Lean kick toward hat, hat toward snare, snare back toward kick, and the walk acquires a local logic — every step answers the one before it, so the output has a style and no two bars are the same bar.

**What it cannot hold.** A figure that uses a sound twice. Kick, hat, kick, snare: the kick has to lead to the hat on its first appearance and to the snare on its second, and there is nowhere to put that difference, because the kick's row is one set of odds. Give it both and the chain chooses at random on every pass. No assignment of weights fixes it — it is the shape of the model, not a shortage of numbers. And a chain is monophonic, so the second walker is not a richer chain but another one, sharing no state, no weight and no random stream: sixteen more numbers, and nothing across the two.
### teaser.text
**From a grammar to dice.** At 1 the two chains read the example exactly: each sound leads to the next by the odds written for it, so the walk has a style. At 0 every next state is a quarter chance, and it is noise. In between the grammar loosens, but no setting holds a phrase: kick, hat, kick, snare needs a memory of two steps, and each chain remembers one.
### share
Two chains of four states; each remembers exactly one step. Try the whole matrix on a desktop.
### start.notStarted.weightsSet
the matrices hold weights. Touch the rack or the trail and the walkers start; a tap on a cell adds a step.
### start.notStarted.empty
tap a cell in a rest row: that is the first weight, and it starts the audio and the chain at once.
### start.nothing
both chains are standing on their rest, and a rest with no weights goes nowhere. Tap a cell in a rest row to say what may follow a silence.
### start.stuck
walker 1 is standing on {A} and walker 2 on {B}, and neither row has a weight, so nothing can move. Give one of those rows a cell.
### start.shut
it is running and nothing reaches you: every sound is muted in the rack, or the master level in the bar above is at zero.
### start.running.both
both chains are walking. Add a weight to change what may follow a row, and press reseed to hear that a matrix holds a grammar.
### start.running.one
{ON} is walking and {OFF} is standing still. Tap a cell in its rest row to hear two chains that share nothing.
### teaser.notStarted
turn structure: 1 is the example's grammar, 0 a uniform draw.
### teaser.nothing
both matrices are empty, so at 1 nothing can move. Turn structure down.
### teaser.stuck
both walkers stand on rows with no weights, so at 1 nothing moves. Turn structure down.
### teaser.shut
it is running and nothing reaches you: it is muted, or at zero, on the desktop page.
### teaser.running.high
turn structure down and the grammar dissolves into a uniform draw.
### teaser.running.low
turn structure up: a grammar arrives, but kick, hat, kick, snare never will.

## statistical-feedback
### shows
Dice have no memory, and the ear hears the difference. Six voices and a silence share one pulse by keeping books: every option carries a running debt of attention, playing charges it, and the next turn goes to whoever is furthest behind. The ledger is on the screen. Turn it off and the same weights become dice.
### meta.description
Dice have no memory. Six voices and a silence share one pulse by keeping books: every option carries a running debt of attention, playing charges it, and the next turn goes to whoever is furthest behind. The ledger is on screen; turn it off and the same weights become dice.
### og.description
Charles Ames' statistical feedback, playable. Choice with a ledger: variety with balance, where weighted dice give you clumps and droughts and a fair rotation gives you a machine.
### text
**Press Play.** One option is chosen per pulse — six voices and a silence, which is an option like any other. Nothing here rolls dice for each voice in turn; instead every option keeps a <b>ledger</b>, the bar beside its name, and the next turn goes to whoever the books say is furthest behind. Playing charges you; while you wait, everyone sinks a little. The seven bars always sum to zero, so one can only rise by the others falling — that is the see-saw, and it is the whole law.

**Turn memory off** and selection stops reading the books, though the books go on being kept: the same weights become plain dice, the stream clumps and droughts, and you can watch the starved voices sink further and further left. Turn it back on and they are paid at once — a burst of exactly the voices that were owed. That payoff is the argument in one gesture.

**Weight is share.** Turn one down and it comes round less; turn it to zero and the voice leaves the game, its row dims and <i>its ledger freezes where it stood</i>. Bring the weight back and it re-enters carrying the debt it went away with — there is no removal rule and no forgetting, only a weight of zero. The level beside it is a different question: how loud, not how often.

**Stress is cost, not odds.** The eight bars scale what a turn is charged, so a voice taken on a heavy step pays more and stays away longer. Nothing is sequenced, and yet the heavy steps fill with the heavy voices and the light steps level out: the metre is something the ledger produces. Drag along the row to draw a different shape.

**Tap a name** to play that voice now, off the grid — and it is charged to the books exactly as a turn would be, so hammering a voice really does buy its silence afterwards.

**Heterogeneity** is a regularity control and nothing else: at 0 each option comes round as regularly as the pool allows; at 2 the turns arrive unpredictably, nearly dice. The proportions are held exactly all the way across — what changes is <i>when</i> each option comes round, and the rare voices loosen far more than the common ones.
### teaser.text
**Dice with a ledger.** Six voices and a silence share one pulse, and each turn goes to whoever is furthest behind its fair share. Heterogeneity loosens how closely that ledger is read: at 0 each voice comes round as regularly as its share allows, and turned up the same shares arrive like dice. The record shows every turn; a gap in a column is silence taking its own.
### share
Six voices share one pulse by keeping books. One knob loosens how closely they read them. The ledger itself wants a desktop.
### start.notStarted
press ▶ Play, or the Space bar, and one option is chosen on every turn.
### start.nothing
nothing carries any weight, so nobody can be chosen — turn a voice's weight up, or open silence.
### start.stuck
""
### start.shut
it is running and nothing reaches you: every voice is muted, at weight zero, or the master level is at zero.
### start.running
turn memory off and watch the debts walk apart, then turn it back on — the starved voices are all paid at once.
### teaser.notStarted
press ▶ Play, and one of six voices or a silence takes every turn.
### teaser.nothing
nothing carries any weight, so nobody can be chosen; the weights are on the desktop page.
### teaser.shut
it is running and nothing reaches you: it is muted or at zero on the desktop page.
### teaser.running
turn heterogeneity up and hear the same shares lose their grain.

## possibles
### shows
You write the tree of what can follow what — branches and weights, two separate verbs — and a machine walks it aloud without stopping. Nothing you do makes a sound.
### meta.description
Write the tree of what can follow what — branches and weights, five symbols, two verbs — and a machine walks it aloud without stopping. Nothing you do makes a sound.
### og.description
You write the field of possibles; the machine is the only speaker. Existing and mattering are two different verbs here.
### text
**Start.** Press <b>▶ Play</b> — the machine walks whatever the tree holds, and on an empty tree that is silence. Then press <b>write</b> on a few strips in a row: <i>kick, snare, kick, rest</i> writes that motif and every prefix of it, and the machine has it on the next cell.

**Two verbs, and keeping them apart is the point.** A <b>write</b> makes a branch <i>exist</i> under the finger and steps into it; walking a path you already wrote only walks it, and says nothing about how likely it is. <b>heavier</b> and <b>lighter</b> are the other verb — how much a branch <i>matters</i>. Existing and mattering are different questions, and the tree lets you answer them one at a time. At zero the branch is cut away, and everything under it goes with it, which is why that press asks twice.

**Reading the tree.** The root is the empty motif at the left and depth runs rightward, so the tree grows as its motifs get longer. A square's size is the weight <i>you wrote</i>; an edge's thickness is the odds the machine would give that branch <i>right now</i>. Turn <b>bias</b> and every square stays put while every edge moves — that is the difference between what a tree contains and what it is likely to say. The white ring is the machine, with its menu lit around it; the dashed amber square is your finger.

**The machine is the only speaker.** There is no way to strike a drum here. Placing sounds in time is first-order work and lives elsewhere; this is the order above it, the field of possibles. So a figure you want at a particular moment is exactly what you cannot have — and the <b>rest</b> is one of the five symbols, so a silence is something the tree says rather than a gap between the things it says.
### teaser.text
**The machine is the only speaker.** A hand wrote a tree of what may follow what — kick, snare, cowbell, crash and a rest — and pressing <b>▶ Play</b> sets the machine walking it, one symbol per eighth note. Nothing you touch makes a sound: <b>bias</b> only leans how it chooses, so turn it left and the weights win and the figure sharpens, turn it right and the light branches win and it dissolves. The trace above is the last four bars it said.
### share
A hand wrote this motif tree; the machine walks it. One knob leans it from faithful to contrary. Write your own on a desktop.
### start.notStarted
press ▶ Play to start the machine, then write branches with the strips' write buttons.
### start.nothing
the tree is empty, so the machine is walking nothing. Press write on a strip — kick, say — and that branch exists under the finger.
### start.stuck
""
### start.shut
it is running and nothing reaches you: every symbol is muted in the strips, or the master level in the bar above is at zero.
### start.running
press a strip's write to make that symbol follow the finger, then heavier to have the machine take that branch more often.
### teaser.notStarted
press ▶ Play and the machine starts walking the tree.
### teaser.nothing
the tree is empty, and the phone cannot write one — the desktop page can.
### teaser.shut
running, but muted or the master is at zero — only the desktop page can change that.
### teaser.running
turn bias and listen: left, the figure sharpens; right, it dissolves.

## notes
Transcribed from the live pages (toys/*/index.html and index.html) at the line ranges in BRIEF.md §7, JS string concatenations joined. motif-memory's `shows` is a DOM fragment; the italic marks its `<em>`.
