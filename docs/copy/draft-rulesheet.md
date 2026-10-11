# Rulesheet

## front
### sub
Four browser audio toys. One mechanism each, one claim each, and a spec to rebuild it from.
### what-is
A playable paper is a claim you can hear and a spec you can rebuild it from.
### blurb motif-memory
A switch freezes a voice's last two bars. A dial blends them with invention.
### blurb markov
Two chains, one step of memory each. A style, but no phrase.
### blurb statistical-feedback
Six voices and a silence share one pulse by keeping books, not dice.
### blurb possibles
A machine walks a motif tree a hand wrote. Only the machine speaks.

## motif-memory
### shows
Five voices. A voice that remembers loops its last bars as a score; *fidelity* runs from score to invention.
### meta.description
Five voices on one pulse. Each keeps its last two bars. MEM freezes them as its score. Fidelity blends score and invention and holds how much the voice plays.
### og.description
A browser toy. A voice remembers the two bars it just played. One dial blends that score with invention and holds how much it plays. Try to hear the crossing.
### text
**Start.** Press ▶ Play. Five voices play on one pulse. Each row is a voice: **density** is its chance to sound, **rate** is how far apart its chances are.

**Remember.** Throw a voice's **MEM** switch. At the next bar line the two bars it just played become its score, and fidelity snaps to 1. A white outline on the timeline is a remembered event.

**Invent.** Turn that voice's **fidelity** down. At 1 it plays the score. At 0 it invents, score still held. In between it blends cell by cell; the amount of music holds. Memory is a state of a voice, not a recorder beside the ensemble, and the crossing can be made inaudible. Try to hear it.
### teaser.text
**Remember, then invent.** Press ▶ Play. Press memory: at the next bar line each voice loops what it just played, up to two bars, as its score. Turn fidelity down. It holds the amount of music; what moves is where it falls. Try to hear the crossing.
### share
Five voices. One button makes them remember what they just played. One dial blends it back into invention.
### start.notStarted
press ▶ Play. Five voices start on one pulse.
### start.nothing
every density is at zero, so the pulse runs empty. Open a voice's density gate and it takes its chances again.
### start.stuck
""
### start.shut
it is running and nothing reaches you. Every voice is muted, or the master level is at zero.
### start.running
throw a voice's MEM switch. At the bar line its last two bars become its score. Then turn its fidelity down.
### teaser.notStarted
press ▶ Play. Five voices start on one pulse.
### teaser.nothing
nothing is on the pulse: every voice is at zero, and the desktop page can raise them.
### teaser.shut
running, but muted or at zero. Only the desktop page can change that.
### teaser.running
press memory: next bar, each voice loops its score. Turn fidelity down: the loop breathes.
## markov
### shows
Two chains, one step of memory each. One dial runs them from grammar to dice. Hear what one step holds.
### meta.description
Two chains, four states each, on a sixteenth grid. Each owns sixteen weights saying what may follow what, and remembers one step. Build the matrices and hear what that holds.
### og.description
A browser toy. Thirty-two weights, two chains, one step of memory each. Build a grammar by hand and listen for the figure it cannot hold.
### text
**Start.** Touch the rack or the trail and the walkers start; a tap on a cell adds a step. **clear** empties both; then a tap in a rest strip starts that walker.

**A strip is a state.** Its four cells are what may follow it; the fill is its weight. Tap to add a step, hold to clear. The lit strip is where the walker stands; the trail, its last two bars.

**Listen.** Lean kick toward hat and hat toward snare: a style. Try kick, hat, kick, snare: the kick must lead two ways from one set of odds. A first-order chain cannot hold a figure that uses a state twice, and the second chain shares nothing (the paper's §3.2).
### teaser.text
**Grammar or dice.** The trail shows two walks. At 1, structure plays the grammar a hand wrote; at 0 every next state is a quarter chance, dice. Turn it. No setting holds kick, hat, kick, snare: each chain remembers one step.
### share
Two chains, one step of memory each: a style, no phrase. Build the matrices on a desktop.
### start.notStarted.weightsSet
the matrices hold weights. Touch the rack or the trail and the walkers start.
### start.notStarted.empty
tap a cell in a rest strip. That is the first weight, and it starts that walker.
### start.nothing
the matrices are empty, so neither walker can move. Give a lit strip a cell; after clear, that is a rest strip.
### start.stuck
walker 1 stands on {A} and walker 2 on {B}. Neither strip has a weight. Give one of them a cell.
### start.shut
it is running and nothing reaches you. Every sound is muted in the rack, or the master level is at zero.
### start.running.both
both walkers are walking. Tap a cell to change what may follow a strip. Press reseed: same weights, different walks.
### start.running.one
{ON} is walking and {OFF} stands on a strip with no weights. Give its lit strip a cell. The two chains share nothing.
### teaser.notStarted
turn structure: 1 plays the grammar, 0 is dice.
### teaser.nothing
both matrices are empty, so at 1 nothing can move. Turn structure down.
### teaser.stuck
both walkers stand on strips with no weights, so at 1 nothing moves. Turn structure down.
### teaser.shut
running, but muted or at zero. Only the desktop page can change that.
### teaser.running.high
turn structure down and hear the walk dissolve into dice.
### teaser.running.low
turn structure up. The grammar comes back. Kick, hat, kick, snare will not hold.
## statistical-feedback
### shows
Six voices and a silence take turns by the books; the furthest behind goes next. One dial loosens the order.
### meta.description
Charles Ames' statistical feedback, playable. Six voices and a silence share one pulse by keeping books; the furthest behind goes next. Memory off stops the reading: dice.
### og.description
A browser toy. Six voices and a silence share one pulse by keeping books. One switch stops selection reading them, and the same weights become dice.
### text
**Press ▶ Play.** Six voices and a silence take turns. Each row keeps a ledger, the bar beside it. Playing charges it; every wait sinks it a little. The next turn goes to whoever is furthest behind: Ames' fair share.

**Turn memory off.** Selection stops reading the books. The same weights become dice. Watch the starved voices sink left. Turn it on: they are paid at once.

**The other controls.** **weight** is its share, **level** how loud. At weight 0 a voice leaves; its ledger freezes. Drag the stress loop: heavy steps cost more and draw heavy voices. **heterogeneity** loosens when a turn comes, never how often. Dice have no memory, and the ear hears the difference. Listen for it.
### teaser.text
**Choice with a ledger.** Press ▶ Play. Six voices and a silence share one pulse. Each turn goes to whoever is furthest behind its share. The record shows every turn; a gap is silence. Turn heterogeneity up. The shares hold; the order loosens toward dice.
### share
Six voices and a silence take turns by the books, not dice. One dial loosens the order.
### start.notStarted
press ▶ Play. Six voices and a silence take turns.
### start.nothing
nothing carries any weight, so nobody can be chosen. Turn a voice's weight up.
### start.stuck
""
### start.shut
it is running and nothing reaches you. Every voice is muted or at weight zero, or the master level is at zero.
### start.running
turn memory off and watch the ledgers walk apart. Turn it back on. The starved voices are paid at once.
### teaser.notStarted
press ▶ Play. Six voices and a silence take turns.
### teaser.nothing
nothing carries any weight, so nobody can be chosen. The weights are on the desktop page.
### teaser.shut
running, but muted or at zero. Only the desktop page can change that.
### teaser.running
turn heterogeneity up and listen: the shares hold, the order loosens toward dice.

## possibles
### shows
A hand wrote what can follow what and each branch's weight. A machine walks it aloud. Only the machine speaks.
### meta.description
Five symbols, a tree of what can follow what, a weight per branch. You write the tree; a machine walks it aloud on a steady grid. Writing is not playing.
### og.description
A browser toy. A hand writes which motifs exist and how much each matters, as two separate acts. Only the machine speaks.
### text
**Start.** Press ▶ Play. The machine walks the tree; an empty tree is silence. Press **write** on a strip: a branch exists under the finger, the amber square. Write kick, snare, kick, rest: from the next cell the machine may choose that motif.

**Read.** Motifs grow rightward. A square's size is the weight you wrote; an edge's thickness, the machine's odds now. The trace is its last four bars.

**Weigh.** **heavier** and **lighter** move the weight under the finger; the press to zero cuts the branch. **bias** moves no weight: squares stay, edges move. Existing and mattering are different questions, and the page lets you answer them one at a time. You cannot strike a drum here.
### teaser.text
**Only the machine speaks.** Press ▶ Play. A hand wrote a tree of what can follow what; the machine walks it, and the trace shows its last four bars. Turn bias: left, the figure sharpens; right, it evens out, then the light branches win. You cannot strike a drum here.
### share
A machine walks a motif tree a hand wrote. One dial leans it. Write yours on a desktop.
### start.notStarted
press ▶ Play to start the machine. Then press write on a strip.
### start.nothing
the tree is empty, so the machine walks nothing. Press write on the kick strip and that branch exists under the finger.
### start.stuck
""
### start.shut
it is running and nothing reaches you. Every symbol is muted in the strips, or the master level is at zero.
### start.running
press write on a strip and a branch exists under the finger. Press heavier: it weighs more, and at bias 0 the machine takes it more often.
### teaser.notStarted
press ▶ Play. The machine starts walking the tree.
### teaser.nothing
the tree is empty. The phone cannot write one; the desktop page can.
### teaser.shut
running, but muted or at zero. Only the desktop page can change that.
### teaser.running
turn bias. Left, the figure sharpens. Right, it evens out, then the light branches win.
## notes
- No budget breach. The 30-word nameplate allowance is not taken; every `shows` is at or under 20 words and names only what the phone shows. Word counts are `wc -w` (the ▶ glyph counts): desktop texts 120 / 120 / 120 / 117, teaser texts 47 / 41 / 45 / 50, shares 18 / 17 / 17 / 17.
- State-sentence lengths, keyboard clause excluded, longest real names substituted on markov (snare, cowbell; walker 1, walker 2); `notStarted` totals with the clause in brackets. motif-memory: notStarted 45 [77], nothing 110, shut 92, running 108; phone notStarted 45 [77], nothing 85, shut 69, running 90. markov: weightsSet 77 [119], empty 80 [122], nothing 110, stuck 102, shut 104, running.both 116, running.one 124; phone notStarted 47 [84], nothing 71, stuck 89, shut 69, running.high 57, running.low 80. statistical-feedback: notStarted 50 [82], nothing 78, shut 110, running 103; phone notStarted 50 [82], nothing 89, shut 69, running 81. possibles: notStarted 63 [95], nothing 119, shut 107, running 138; phone notStarted 50 [82], nothing 68, shut 69, running 87. Every desktop line is at or under 145 and every phone line at or under 92.
- Naming, markov: the thing that moves is a walker in every state sentence and in the text; "chain" is the model, which is what holds weights, remembers one step and shares nothing, in blurb, shows, meta, og, share, teaser.text and the two claim sentences of the text. A state's line is a strip everywhere, state sentences included, because the rack's own label says "a strip is a state"; "row" is gone from this page (E-r-12 refused in round 1, accepted by the editor, left to the author by the cop). The 1 end of the structure dial is "the grammar" on every phone line (shows, teaser.text head and body, notStarted, running.low); "dice" on this page means the uniform draw and teaser.text glosses it.
- Naming, motif-memory: keep is what every voice does unasked, freeze is what the switch does, score is the kept bars, and on the phone "loops" is the one verb for what a remembering voice does with its score (shows, teaser.text, running). The desktop switch is MEM and appears only in desktop layers; the phone button is memory. The dial is a dial in every layer. "Held" is active everywhere ("holds the amount of music", "the amount of music holds").
- Naming, statistical-feedback: the ledger is the thing, keeping books the activity, memory off stops the reading; "six voices and a silence" wherever a count is given. The stage panel on screen is titled "the stress loop", so the text says stress loop.
- Naming, possibles: the tag line is "Only the machine speaks" in blurb, shows, og and the teaser head; the writer is "a hand" in every phone layer and the og, and "you" only where the reader can write (meta, desktop text). The no-sound sentence is the spec's "You cannot strike a drum here" on desktop and phone, because "nothing you touch makes a sound" was false of ▶ Play. A write "exists under the finger" everywhere. "A motif tree" (blurb, share) and "a tree of what can follow what" (shows, meta, teaser.text) are two descriptions of one thing, not two names. "figure" on the phone and "motif" on the desktop is the live split (C-r-20, the author's call).
- Phone `shut` is one sentence on all four pages: "running, but muted or at zero. Only the desktop page can change that."
- Phone `running` lines each end on something to hear: the loop breathing (the spec's word), the walk dissolving into dice / the grammar coming back, the order loosening toward dice, the figure sharpening or evening out then the light branches winning.
- The claim is the last line of each desktop text; markov's closes on the claim itself; motif-memory keeps "Try to hear it" because the claim is that there may be nothing to hear.
- Sources: one clause each on markov (the paper's §3.2) and statistical-feedback (Ames' fair share, on the rule in block 1). None on possibles; if the author adds one, "after Assayag and Dubnov", and the block has three words of room.
- Still for the author: the `og.description` tag line "A browser toy." on all four (the cop's call); the front `what-is` line (17 words, proposed); markov desktop text names no structure dial and statistical-feedback's names no silence gate (budget; both are in hints); the bias-right phone line now reads "evens out, then the light branches win" (E-r-36), which the academic read in round 1 as true only past +½: as a sequence it is the spec's table, but the academic should see it.

## answers
- E-r-1: taken, differently — "how much the voice plays is held" rather than "without changing", per the shared "held" rule (spec §3.5).
- E-r-2: taken, differently — same "held" wording; "memory" replaced by "score" (C-r-9).
- E-r-3: taken
- E-r-4: taken, differently — the editor's sentence with "the amount of music is held" in place of "stays as dense" (A-r-4).
- E-r-5: taken
- E-r-6: taken — on all four pages.
- E-r-7: taken, differently — "Touch the rack or the trail", bold clear, and the tap's side effect said (A-r-7); "strip" not "row" (see E-r-12).
- E-r-8: taken
- E-r-9: taken, differently — the editor's "lead two ways" sentence, with "cannot hold" (A-r-9) and "Listen for it" dropped.
- E-r-10: taken, differently — the editor's order, with "each matrix as written" instead of "the example" (A-r-10).
- E-r-11: taken
- E-r-12: refused — the rack's on-screen label is "a strip is a state", so the rulesheet says strip; the directions allow either if one is kept, and "row" is now gone from every markov layer (C-r-11).
- E-r-13: taken, differently — the editor's sentence with "strip".
- E-r-14: taken — and made a listening cue (directions rule 2).
- E-r-15: taken, differently — the third sentence went, then the dial came in (P-r-9); 20 words.
- E-r-16: taken, differently — the editor's sentence with "six voices and a silence" (A-r-1, C-r-17).
- E-r-17: taken
- E-r-18: taken, differently — head, bold labels and the Ames credit moved to block 1 as proposed; "stress loop" kept because that is the panel's title on screen.
- E-r-19: taken, differently — "loosens the order" and a dial; the desktop clause went to fit the silence in (A-r-1).
- E-r-20: taken, differently — "the shares hold, the order loosens toward dice", built as a listening cue.
- E-r-21: taken, differently — the nameplate was rebuilt as a phone line (directions rule 1); "touch" for the no-sound sentence everywhere (C-r-21).
- E-r-22: taken, differently — "an empty tree is silence" (budget).
- E-r-23: taken
- E-r-24: taken, differently — the editor's sentence with "the weights win" dropped (P-r-12) and bias-right corrected (A-r-23).
- E-r-25: taken
- E-r-26: taken, differently — "a branch exists under the finger" (C-r-19) plus "with bias at centre" (A-r-24).
- P-r-1: taken, differently — all three blurbs rewritten so none asks for a desktop act; my own wording for markov ("A style, but no phrase.") and sf (keeps "and a silence"); possibles as proposed.
- P-r-2: taken, differently — "Make one remember: what it just played becomes its score" (18 words; "turn", not "ride", per C-r-7; no two-bar claim, per A-r-6).
- P-r-3: taken, differently — the loop is in the line; the bar line stays in teaser.text because the line also needed a listening cue inside 92.
- P-r-4: refused — "where remembering stops" says the memory stops, and it does not (fidelity 0 holds the score); the two sentences before "crossing" define it, as the critic says.
- P-r-5: taken, differently — the dial is named and "build" is gone: "One dial runs them from grammar to dice. Hear what one step holds."
- P-r-6: taken, differently — "1 plays what is written, 0 is dice" (a written grammar at 55 chars put the clause at 92; this is 88).
- P-r-7: taken
- P-r-8: taken, differently — "a style, no phrase" (not "never": by chance the figure can recur, A-r-9).
- P-r-9: taken, differently — the dial is in and the allowance is not: 20 words.
- P-r-10: taken, differently — "the shares hold, the order loosens toward dice" ("everyone plays as often" would be wrong: shares differ).
- P-r-11: taken, differently — "Someone wrote … A machine walks it aloud. Nothing else speaks." (20 words; "only the machine speaks" was 21).
- P-r-12: taken
- A-r-1: taken — blurb, og and share now say "six voices and a silence".
- A-r-2: taken
- A-r-3: taken
- A-r-4: taken
- A-r-5: taken, differently — the directions forbid the baseline sentence; the editor's "running, but muted or at zero. Only the desktop page can change that." says both causes.
- A-r-6: taken — "up to two" in teaser.text; the nameplate no longer says two.
- A-r-7: taken, differently — the tap's side effect is said and "both" is gone; "the page opens on an example" was cut for budget.
- A-r-8: taken
- A-r-9: taken — "hold" in text and og.
- A-r-10: taken, differently — "reads each matrix as written, grammar and all" rather than "has a style", so the line states nothing about what the matrix holds.
- A-r-11: taken
- A-r-12: taken, differently — "stands on a strip with no weights. Give its lit strip a cell." (strip, not row).
- A-r-13: taken, differently — "1 plays what is written" (56 chars put the clause at 93).
- A-r-14: taken, differently — "What is written comes back" in place of "A style arrives".
- A-r-15: taken (as A-r-5).
- A-r-16: taken, differently — "Memory off stops the reading: dice."
- A-r-17: taken, differently — "One switch stops selection reading them, and the same weights become dice."
- A-r-18: taken
- A-r-19: taken
- A-r-20: taken
- A-r-21: taken
- A-r-22: taken, differently — "One dial loosens the order."
- A-r-23: taken — on both phone lines.
- A-r-24: taken — "with bias at centre".
- A-r-25: refused — budget; the lighter button's own hint says "with every motif under it", and the desktop text is at 120.
- C-r-1: taken — allowance withdrawn, 20 words.
- C-r-2: taken — counts are now wc -w and the block is 120.
- C-r-3: taken — strip.
- C-r-4: taken — ruled allowed; unchanged.
- C-r-5: taken — ruled allowed; unchanged.
- C-r-6: taken — the shut line is rewritten.
- C-r-7: taken
- C-r-8: taken
- C-r-9: taken
- C-r-10: taken, differently — the editor's line (E-r-5), which names no gate.
- C-r-11: taken — row is gone from every markov layer.
- C-r-12: taken, differently — the body now says "grammar and all" under the head "Grammar or dice."
- C-r-13: taken
- C-r-14: taken
- C-r-15: taken
- C-r-16: taken, differently — stronger than the proposed swap: "stops the reading" / "stops selection reading them" (A-r-16, A-r-17).
- C-r-17: taken — and the silence is in as well.
- C-r-18: taken, differently — "the shares hold, the order loosens toward dice".
- C-r-19: taken
- C-r-20: refused — figure is what the ear gets on the phone, motif is what the tree holds on the desktop; the live split, and the critic leaves it to the author.
- C-r-21: taken — "touch" everywhere.
- C-r-22: taken — "in a row" is gone.
- C-r-23: taken — blurb now "freezes".
- C-r-24: taken — counts moved to notes; control names opening a sentence in text are bold.
- C-r-25: taken — ", or Space" dropped on both pages.
- E-r-27: taken, differently — the editor's sentence with "loops", so the phone has one verb for the score (C-r-35): "A voice that remembers loops its last bars as a score".
- E-r-28: taken, differently — rebuilt around the facts: "each voice loops what it just played, up to two bars, as its score. Turn fidelity down. It holds the amount of music; what moves is where it falls."
- E-r-29: taken
- E-r-30: taken
- E-r-31: taken, differently — "At 1, structure plays the grammar a hand wrote" (P-r-14 and C-r-33 together).
- E-r-32: taken
- E-r-33: taken
- E-r-34: taken, differently — "a hand" in every phone layer and the og; the tag line is "Only the machine speaks" in every short layer (C-r-36).
- E-r-35: taken
- E-r-36: taken — on both phone lines; flagged for the academic in notes.
- E-r-37: taken
- P-r-13: taken — "press memory: next bar, each voice loops its score. Turn fidelity down: the loop breathes." (90).
- P-r-14: taken, differently — "the grammar a hand wrote", without "grammar and all" (E-r-31).
- P-r-15: taken, differently — the editor's "the light branches win" rather than "the rare branches lead", so the phone and the spec's table agree.
- P-r-16: taken — and on the desktop text too, so the page has one sentence for it, the spec's own.
- A-r-26: taken, differently — "the matrices are empty, so neither walker can move. Give a lit strip a cell; after clear, that is a rest strip." (the lit strip is the page's own marker for where a walker stands, as in stuck and running.one).
- A-r-27: taken — "the loop breathes".
- C-r-26: taken — nothing to fix.
- C-r-27: taken — ruled allowed; "strip" kept, as E-r-12 stands.
- C-r-28: taken — ruled allowed; unchanged.
- C-r-29: taken — ruled allowed; unchanged.
- C-r-30: taken — "dial" in blurb, og and share, each sentence rewritten.
- C-r-31: taken
- C-r-32: taken
- C-r-33: taken — "the grammar" on every phone line.
- C-r-34: taken, differently — the gesture left the nameplate altogether (E-r-27), so neither "one" nor "them" is needed.
- C-r-35: taken, differently — "score" is the noun and "loops" the verb on every phone line, rather than dropping either word.
- C-r-36: taken, differently — one tag line and one writer in every short layer; "a motif tree" beside "a tree of what can follow what" stays, both being descriptions rather than names.
