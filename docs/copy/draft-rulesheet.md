# Rulesheet

## front
### sub
Four browser audio toys. One mechanism each, one claim each, and a spec to rebuild it from.
### what-is
A playable paper is a claim you can hear and a spec you can rebuild it from.
### blurb motif-memory
A switch keeps a voice's last two bars. A knob blends them with invention.
### blurb markov
Two chains, four states each, one step of memory. Build one and listen.
### blurb statistical-feedback
Six voices share a pulse by keeping books. Turn memory off and hear dice.
### blurb possibles
Write a tree of what can follow what. The machine is the only speaker.

## motif-memory
### shows
Five voices, one pulse. MEM freezes a voice's last two bars as its score. Ride *fidelity* from score to invention.
### meta.description
Five voices on one pulse. Each keeps a rolling record of its last two bars. MEM freezes that record as its score. Fidelity blends score and invention at one density.
### og.description
A browser toy: a voice remembers the two bars it just played, and one knob blends that memory with invention at the same density. Try to hear the crossing.
### text
**Start.** Press ▶ Play. Five voices play on one pulse. Each row is a voice: density is its chance to sound, rate is how often it gets the chance.

**Remember.** Throw a voice's MEM switch. At the next bar line the two bars it just played become its score, and fidelity snaps to 1. A white outline on the timeline is a remembered event.

**Forget.** Turn that voice's fidelity down. At 1 it plays the score. At 0 it invents, score still held. Between, it blends cell by cell at the same density. Memory is a state of a voice, not a recorder beside the ensemble, and the crossing can be made inaudible. Try to hear it.
### teaser.text
**Remember, then forget.** Press ▶ Play. Five voices play on one pulse. Press memory: at the next bar line each voice keeps the two bars it just played, and plays them. Turn fidelity down. The music stays as dense. Where it falls starts to move. Try to hear the crossing.
### share
Five voices. One button makes them remember what they just played. One knob blends it back into invention.
### start.notStarted
press ▶ Play, or Space. Five voices start on one pulse. (55)
### start.nothing
every density is at zero, so the pulse runs empty. Open a voice's density gate and it takes its chances again. (110)
### start.stuck
""
### start.shut
it is running and nothing reaches you. Every voice is muted, or the master level is at zero. (92)
### start.running
throw a voice's MEM switch. At the bar line its last two bars become its score. Then turn its fidelity down. (108)
### teaser.notStarted
press ▶ Play. Five voices start on one pulse. (45)
### teaser.nothing
the pulse is running with nothing on it. The desktop page can open the voices. (78)
### teaser.shut
running, but nothing reaches you. Unmute it on the desktop page. (64)
### teaser.running
press memory. Each voice keeps the two bars it just played. Then turn fidelity down. (84)

## markov
### shows
Two chains, four states each, thirty-two weights in all. Each remembers one step. Build one and hear what that holds.
### meta.description
Two walkers, four states each, on a sixteenth grid. Each owns sixteen weights saying what may follow what, and remembers one step. Build the matrices and hear what that holds.
### og.description
A browser toy. Thirty-two weights, two walkers, one step of memory each. Build a grammar by hand and listen for the figure it cannot repeat.
### text
**Start.** Tap any cell: both walkers start on the example. clear empties both; a tap in a rest strip restarts a walker.

**A strip is a state.** Its four cells are what may follow it. The fill is the weight, a share of the row. Tap to add a step, hold to clear. The lit strip is where it stands. The trail is the last two bars.

**Listen.** Lean kick toward hat, hat toward snare, snare toward kick: the walk has a style. Try kick, hat, kick, snare: the kick's row is one set of odds. A first-order chain cannot repeat a figure that uses a state twice, and the second walker shares nothing (the paper's §3.2). Listen for it.
### teaser.text
**Grammar or dice.** Turn structure. The trail shows two walks. At 1 each walk reads the example's weights as written and has a style. At 0 every next state is a quarter chance. No setting holds kick, hat, kick, snare. Each chain remembers one step.
### share
Two chains of four states, one step of memory each. Build the matrices on a desktop.
### start.notStarted.weightsSet
the matrices hold weights. Tap any cell and both walkers start. (63)
### start.notStarted.empty
tap a cell in a rest strip. That is the first weight, and it starts the chain. (78)
### start.nothing
both matrices are empty. A rest with no weights goes nowhere. Tap a cell in a rest strip. (89)
### start.stuck
walker 1 stands on {A} and walker 2 on {B}. Neither row has a weight. Give one of those rows a cell. (106)
### start.shut
it is running and nothing reaches you. Every sound is muted in the rack, or the master level is at zero. (104)
### start.running.both
both chains are walking. Tap a cell to change what may follow a strip. Press reseed: the style stays, the bars change. (118)
### start.running.one
{ON} is walking and {OFF} is standing still. Tap a cell in its rest strip. The two chains share nothing. (111)
### teaser.notStarted
turn structure. 1 plays the example, 0 is dice. (47)
### teaser.nothing
both matrices are empty, so at 1 nothing can move. Turn structure down. (71)
### teaser.stuck
both walkers stand on rows with no weights, so at 1 nothing moves. Turn structure down. (87)
### teaser.shut
running, but nothing reaches you. Unmute it on the desktop page. (64)
### teaser.running.high
turn structure down. The style dissolves into a quarter chance per step. (72)
### teaser.running.low
turn structure up. A style arrives. Kick, hat, kick, snare never will. (70)

## statistical-feedback
### shows
Six voices and a silence share one pulse by keeping books. The next turn goes to whoever is furthest behind. Turn memory off and the same weights become dice.
### meta.description
Charles Ames' statistical feedback, playable. Six voices and a silence share one pulse by keeping books; each turn goes to whoever is furthest behind. Switch the books off: dice.
### og.description
A browser toy. Six voices share a pulse by keeping books, and the ear hears it. One switch turns the books off and leaves the dice.
### text
**Press ▶ Play.** Six voices and a silence take turns. Each row keeps a ledger, the bar beside its name. Playing charges it; waiting pays it back. The next turn goes to whoever is furthest behind.

**Turn memory off.** Selection stops reading the books. The same weights become dice. Watch the starved voices sink left. Turn it back on: they are paid at once.

**The rest.** weight is how often, level how loud. At weight 0 a voice leaves and its ledger freezes. Drag the stress loop: heavy steps cost more and draw the heavy voices. heterogeneity loosens when a turn comes, never how often. Dice have no memory, and the ear hears the difference (Ames' fair share). Listen for it.
### teaser.text
**Dice with a ledger.** Press ▶ Play. Six voices and a silence share one pulse. Each turn goes to whoever is furthest behind its share. The record shows every turn; a gap is silence. Turn heterogeneity up. The shares hold; the order loosens toward dice.
### share
Six voices take turns by the books, not dice. One knob loosens them. The ledger needs a desktop.
### start.notStarted
press ▶ Play, or Space. One option takes each turn. (51)
### start.nothing
nothing carries any weight, so nobody can be chosen. Turn a voice's weight up, or open silence. (95)
### start.stuck
""
### start.shut
it is running and nothing reaches you. Every voice is muted or at weight zero, or the master level is at zero. (110)
### start.running
turn memory off and watch the debts walk apart. Turn it back on. The starved voices are paid at once. (101)
### teaser.notStarted
press ▶ Play. Six voices and a silence take turns. (50)
### teaser.nothing
nothing carries any weight, so nobody can be chosen. The weights are on the desktop page. (89)
### teaser.shut
running, but nothing reaches you. Unmute it on the desktop page. (64)
### teaser.running
turn heterogeneity up. The shares hold and the grain goes. (58)

## possibles
### shows
Write what can follow what, then weight each branch. A machine walks the tree aloud. Nothing you press sounds.
### meta.description
Five symbols, a tree of what can follow what, a weight per branch. You write the tree; a machine walks it aloud on a steady grid. Writing is not playing.
### og.description
A browser toy. You write which motifs exist and how much each matters, as two separate acts. The machine is the only speaker.
### text
**Start.** Press ▶ Play. The machine walks the tree; empty, it is silent. Press write on a strip: that symbol goes under the finger, the amber square. Write kick, snare, kick, rest in a row and the machine has that motif.

**Read.** Motifs grow rightward from the root. A square's size is the weight you wrote; an edge's thickness is the machine's odds now. The trace is its last four bars.

**Weigh.** heavier and lighter move the weight under the finger; the press to zero cuts the branch. bias moves no weight: squares stay, edges move. Existing and mattering are different questions, and the page lets you answer them one at a time, and nothing you press makes a sound.
### teaser.text
**The machine is the only speaker.** Press ▶ Play. A hand wrote this tree of what can follow what. The machine walks it. The trace shows the last four bars. Turn bias. Left, the weights win and the figure sharpens. Right, it dissolves. Nothing you touch makes a sound.
### share
The machine walks a motif tree written by hand. One knob leans it. Write yours on a desktop.
### start.notStarted
press ▶ Play to start the machine. Then press write on a strip. (63)
### start.nothing
the tree is empty, so the machine walks nothing. Press write on a strip, kick say, and that branch exists under the finger. (123)
### start.stuck
""
### start.shut
it is running and nothing reaches you. Every symbol is muted in the strips, or the master level is at zero. (107)
### start.running
press write on a strip and that symbol follows the finger. Press heavier and the machine takes that branch more often. (118)
### teaser.notStarted
press ▶ Play. The machine starts walking the tree. (50)
### teaser.nothing
the tree is empty. The phone cannot write one; the desktop page can. (68)
### teaser.shut
running, but nothing reaches you. Unmute it on the desktop page. (64)
### teaser.running
turn bias. Left, the figure sharpens. Right, it dissolves. (58)

## notes
- Budget breach, declared: statistical-feedback `shows` is 29 words, the one page allowed up to 30. The claim is a comparison and the memory switch is the comparison, so the nameplate has to say what turning it off does.
- Every other budget holds. Desktop texts are 116 / 120 / 120 / 120 words in three blocks each; teaser texts 49 / 45 / 44 / 48; shares 18 / 16 / 18 / 18.
- State counts: each `(N)` is the measured length of the sentence alone, keyboard clause excluded. With the clause added, every `notStarted` fits: 87 / 77 (motif-memory), 105 and 120 / 84 (markov), 83 / 82 (statistical-feedback), 95 / 82 (possibles) against 145 / 92.
- markov `start.stuck` and `start.running.one` are counted with the longest real names the code inserts (snare and cowbell; walker 1 and walker 2), so 106 and 111 are worst cases. `{ON}` substitutes to "walker 1", so the fragment starts lowercase once rendered.
- motif-memory gets a desktop `text` block, three blocks, 116 words. Reason: the rack has six columns and the page's one gesture is two moves on two different controls in a fixed order (MEM, then fidelity down), and nothing on the screen says the order. A rulesheet exists for exactly that. The phone `teaser.text` is new too; the page had none.
- The claim sits once per toy as the last line of the desktop text, flat. For motif-memory the instruction is "Try to hear it" rather than "Listen for it", because the claim is that there may be nothing to hear.
- Sources: one clause each on markov (the paper's §3.2) and statistical-feedback (Ames' fair share). None on possibles: the budget went to naming write, heavier, lighter, bias, the finger and the trace. The author may want "(after Assayag and Dubnov)" after "Existing and mattering"; it costs four words and the block is at the limit, so something else goes.
- Phone `nothing` and `shut` words never name density, weight, mute or master; they say the desktop page can act. "Unmute it on the desktop page" also covers a master at zero loosely; if that reads as a lie, the fallback is the baseline's "it is muted, or at zero, on the desktop page" (68 chars, fits).
- markov `start.running.both` ("Press reseed: the style stays, the bars change") rests on the reseed hint, "a different roll of the same dice", and spec §1's "no two bars are the same bar". Not a claim beyond the spec, but the author should confirm the wording.
- markov desktop text omits the structure dial (budget); the phone text carries it. statistical-feedback desktop text omits the silence gate and "tap a name" (budget); both remain in hints.
- front: `what-is` is proposed, 17 words; the author decides. Each `og.description` opens "A browser toy." so a share preview says what the link is; drop it if the og:site_name does that job.
- Nouns used, checked against the screens: MEM, density, rate, fidelity, timeline, memory (phone button); walker 1 / walker 2, strip, cell, rest, trail, structure, clear, reseed; ledger (the bar beside the name), weight, level, stress loop, memory switch, heterogeneity, record; write, heavier, lighter, bias, the finger (the amber square), the trace, the root, the tree.
