# claim

## front
### sub
Four browser audio toys for a wandering mind and clumsy hands: one mechanism, one claim and one spec each.
### what-is
A playable paper is an argument you check with a thumb, and a spec anyone can rebuild it from.
### blurb motif-memory
Memory is a state of a voice, and the crossing can be made inaudible.
### blurb markov
One step of memory buys a style, and cannot hold kick, hat, kick, snare.
### blurb statistical-feedback
Dice have no memory, and the ear hears the difference.
### blurb possibles
Existing and mattering are different questions; here you answer them one at a time.

## motif-memory
### shows
Memory is a state of a voice: each remembers what it just played, and the crossing can be made inaudible.
### meta.description
Five voices invent on one pulse. A switch makes a voice remember its last two bars; a dial takes it back to invention while the amount of music is held.
### og.description
Memory as a state of a voice, not a recorder beside the ensemble. Make five voices remember what they just played, then take them back to invention.
### text
**Memory is a state of a voice.** Not a recorder beside the ensemble: every voice always keeps its last two bars. Throw its MEM switch and they are its score at the bar line. You decide that a passage was worth keeping, never which window to keep: nothing to hit on the beat.

**Fidelity is the crossing.** The dial sets how much of what a voice plays is score and how much invention. Leave density alone and the amount of music is held; what moves is where it falls. A crossing that changed both at once would announce itself; this one only if you make it.

**The paper's §5: nouns but no verbs.** This page puts *remember* on every voice.
### teaser.text
**Memory is a state of a voice.** Press memory: at the next bar line every voice loops what it just played, up to two bars. Fidelity is how much of that it keeps. Turn it down: the amount of music is held; what moves is where it falls.
### share
Memory is a state of a voice: press one button and five voices remember what they just played.
### start.notStarted
press ▶ Play and five voices start inventing on one pulse.
### start.nothing
every density gate is shut, so the pulse runs with nothing on it — open one and that voice takes its chances again.
### start.stuck
""
### start.shut
it is running and nothing reaches you: every voice is muted, or the master level is at zero.
### start.running
throw a voice's MEM switch and its last two bars become its score. Then ride its fidelity down and listen for the crossing.
### teaser.notStarted
press ▶ Play: five voices invent on one pulse.
### teaser.nothing
every density is at zero, so the pulse runs empty; the desktop page can open them.
### teaser.shut
it is running but muted or at zero; only the desktop page can change that.
### teaser.running
press memory: at the next bar each voice loops. Turn fidelity down and listen for a seam.

## markov
### shows
One step of memory buys a style, never kick, hat, kick, snare. Two chains, one dial: style to dice.
### meta.description
Two Markov chains, four states each, thirty-two weights, one step of memory apiece. Build the matrices and hear what one step holds and what it cannot.
### og.description
One step of memory buys a style and cannot hold kick, hat, kick, snare. Two first-order chains, thirty-two weights, and a dial from style to dice.
### text
**One step of memory buys a style.** Each state owns one row of odds. Lean kick toward hat, hat toward snare, snare back toward kick, and every step answers the last: no two bars are the same bar.

**And never kick, hat, kick, snare.** The kick must lead to the hat first and to the snare second, and its row is one set of odds: nowhere to put the difference. Give it both and the walker picks at random. The model's shape, not a shortage of weights.

**Two chains share nothing.** Sixteen weights each, none across them — the independence the paper's §3.2 pays for, made audible. In the instrument a hand plays the matrices; here they walk alone.
### teaser.text
**One step of memory buys a style.** Structure at 1: the walks follow what a hand wrote, and every step answers the last. Turn it down and the style dissolves into dice. No setting holds a phrase: kick, hat, kick, snare needs two steps of memory; each chain has one.
### share
One step of memory: a style, but never kick, hat, kick, snare. The matrices want a desktop.
### start.notStarted.weightsSet
the matrices hold weights. Touch the rack or the trail and the walkers start.
### start.notStarted.empty
the matrices are empty. Tap a cell in a rest row: the first weight starts that walker.
### start.nothing
the matrices are empty, so neither walker can move. Tap a cell in the row a walker stands on: after clear, a rest row.
### start.stuck
walker 1 stands on {A} and walker 2 on {B}, and neither row has a weight, so nothing can move. Give one of those rows a cell.
### start.shut
it is running and nothing reaches you: every sound is muted in the rack, or the master level is at zero.
### start.running.both
both walkers are walking. Try to put kick, hat, kick, snare into the cells, and hear that no weights will hold it.
### start.running.one
{ON} is walking and {OFF} stands on a row with no weight. Give that row a cell, and hear two chains that share nothing.
### teaser.notStarted
turn structure: at 1 a written style, at 0 dice.
### teaser.nothing
both matrices are empty, so at 1 nothing can move. Turn structure down.
### teaser.stuck
both walkers stand where no weight leads on, so at 1 nothing moves. Turn structure down.
### teaser.shut
it is running but muted or at zero; only the desktop page can change that.
### teaser.running.high
turn structure down and the style dissolves into dice.
### teaser.running.low
turn structure up: what is written returns; kick, hat, kick, snare never will.

## statistical-feedback
### shows
Dice have no memory, and the ear hears the difference. Six voices and a silence keep books on one pulse.
### meta.description
Six voices and a silence share one pulse by keeping books: each turn goes to whoever is furthest behind. Turn memory off and the same weights become dice.
### og.description
Dice have no memory, and the ear hears the difference. Ames' fair-share selection: six voices and a silence, a ledger each, and one switch that stops reading them.
### text
**Dice have no memory, and the ear hears the difference.** Six voices and a silence each keep a ledger, the bar beside the name: turns taken, less turns owed. The next turn goes to whoever is furthest behind, and the seven bars always sum to zero. That is Charles Ames' fair share, and it is the whole law.

**Turn memory off.** Selection stops reading the books, though they go on being kept: the same weights become dice, the stream clumps and droughts, and the starved voices sink further left. Turn it back on and they are paid at once — a burst of exactly the voices that were owed. That payoff is the argument in one gesture.
### teaser.text
**Dice have no memory, and the ear hears the difference.** Six voices and a silence share one pulse, and each turn goes to whoever is furthest behind: nobody clumps, nobody starves. Turn heterogeneity up and the shares loosen toward dice; proportions never move, only when each comes round.
### share
Dice have no memory, and the ear hears the difference. The ledgers themselves want a desktop.
### start.notStarted
press ▶ Play and each turn goes to one of six voices, or to the silence.
### start.nothing
nothing carries any weight, so nobody can be chosen — not even silence. Turn a voice's weight up.
### start.stuck
""
### start.shut
it is running and nothing reaches you: every voice is muted, at weight zero, or the master level is at zero.
### start.running
turn memory off and watch the ledgers walk apart, then turn it back on: the starved voices are all paid at once.
### teaser.notStarted
press ▶ Play: six voices and a silence take turns.
### teaser.nothing
every weight is at zero, so nobody can be chosen; the desktop page can raise one.
### teaser.shut
it is running but muted or at zero; only the desktop page can change that.
### teaser.running
turn heterogeneity up: the same shares, now in clumps and droughts, like dice.

## possibles
### shows
Existing and mattering are different questions, and a hand answers them one at a time. Only the machine speaks.
### meta.description
You write a tree of what can follow what, five symbols and a weight on every branch, and a machine walks it aloud. Nothing you do makes a sound.
### og.description
Existing and mattering are different questions, and an instrument can let you answer them one at a time. A motif tree written by hand; the machine is the only speaker.
### text
**Existing and mattering are different questions.** Press **write** on a strip — kick, say — and a branch exists under the finger; write snare next and the motif kick, snare exists. That is one verb. **heavier** and **lighter** are the other verb: how much a branch matters, and at zero it is cut away.

**In Assayag and Dubnov's model the two are one act.** A performance repeats itself, and the repetition both creates a motif and raises its count. Take the performance away and they come apart.

**The machine is the only speaker.** There is no way to strike a drum; a figure you want at a particular moment is what you cannot have, and that refusal is the claim.
### teaser.text
**The machine is the only speaker.** A hand wrote a tree of what can follow what, and ▶ Play sets the machine walking it. You cannot strike a drum here: bias only leans how it chooses. Left, the written figure sharpens; right, it dissolves, then inverts.
### share
A hand wrote a motif tree; the machine is the only speaker. Write your own on a desktop.
### start.notStarted
press ▶ Play and the machine walks whatever the tree holds.
### start.nothing
the tree is empty, so the machine is walking silence. Press write on a strip — kick, say — and that branch exists under the finger.
### start.stuck
""
### start.shut
it is running and nothing reaches you: every symbol is muted in the strips, or the master level is at zero.
### start.running
press write on a strip and a branch exists under the finger; press heavier and, with bias at 0, the machine takes it more often.
### teaser.notStarted
press ▶ Play and the machine walks the tree aloud.
### teaser.nothing
the tree is empty, and the phone cannot write one — the desktop page can.
### teaser.shut
it is running but muted or at zero; only the desktop page can change that.
### teaser.running
turn bias and listen: left, the figure sharpens; right, it dissolves, then inverts.

## notes
- **Character counts** (sentence alone; add the keyboard clause to `notStarted`: +32 on the transport pages, +42 desktop / +37 phone on markov). motif-memory: desktop 58 / 115 / 92 / 123, phone 46 / 82 / 74 / 89. markov: desktop weightsSet 77, empty 86, nothing 118, stuck 131 (with "snare" and "cowbell", the longest names), shut 104, both 114, one 126 (with "walker 2" / "walker 1"); phone 48 / 71 / 88 / 74 / 54 / 78. statistical-feedback: desktop 72 / 97 / 108 / 112, phone 50 / 81 / 74 / 78. possibles: desktop 59 / 131 / 107 / 128, phone 50 / 73 / 74 / 83. Worst with the clause: markov empty 86 + 42 = 128, motif-memory phone 46 + 32 = 78. The tightest lines are motif-memory's phone `running` (89) and markov's phone `stuck` (88); if the cop's wrap check needs more room, drop "at the next bar" from the first (loses the second-press guard, P-c-6) and "on" from "leads on" in the second.
- **Word budgets:** sub 19, what-is 19, blurbs 13 / 13 / 10 / 14; shows 20 / 19 / 20 / 19 (no page takes the 30-word allowance); meta 30 / 26 / 29 / 29; og 27 / 26 / 28 / 30; desktop text 120 / 119 / 118 / 120; teaser.text 48 / 50 / 48 / 46; share 18 / 17 / 16 / 17. `wc -w` counting, so a lone em-dash is a word.
- **One phone `shut` sentence on all four pages:** "it is running but muted or at zero; only the desktop page can change that." (74). Takes E-c-11's sentence as given.
- **motif-memory keeps a desktop `text`** (three blocks, 120 words) where the page has `text: false` today; the reasons stand from round 1 (the desk reader is the one the claim is argued to, and the sibling pages all have standing text). The nameplate no longer carries *fidelity*, so the `shows` Node loses its `<em>`; if the author wants the italic kept, the `shows` can be the same sentence with no word to italicise, and the page's declaration becomes a plain string.
- **Naming, settled per page.** motif-memory: the kept bars are the *score* everywhere; the phone button is *memory*, the desktop switch is MEM, and the nameplate names neither; what the voices do before memory is *invent* (no more "guessing", no more "random voices"); the dial is a dial. markov: *walker* for the thing that stands and moves, *chain* for the model that holds weights and shares nothing; *row* for a state's line in every layer (the live text's "strip" should follow; "the row a walker stands on" names the lit strip without the word); *style* on every phone line (grammar is gone from the phone); "dice" here is a uniform draw; the matrices are plural everywhere. statistical-feedback: the *ledger* is the thing (seven of them; "the ledgers" in `running` and `share`), *keeping books* is the activity, memory off *stops the reading* in meta, og and text alike, "debts" is gone, and "six voices and a silence" wherever the count is given. possibles: one picture for a write, *exists under the finger*, in `nothing`, `running` and `text`; "a tree", never "this tree", on the phone; the controls are bold in the desktop text and unnamed on the nameplate.
- **The keyboard note.** ", or the Space bar" is dropped from every desktop `notStarted` (C-c-22) so the library's appended clause is the only keyboard note; the `keys:` line (out of scope) still names Space.
- **Two edges said "at the default".** possibles `start.running` says "with bias at 0" because heavier → more often inverts past bias +½ (A-c-24); the phone `running` and `teaser.text` say the whole range ("sharpens; dissolves, then inverts") instead of "the light branches win". markov `running.low` says "what is written returns" rather than "a style arrives" because the line is also shown over empty matrices (A-c-14).
- **The motif-memory listening cue** is "listen for a seam" on the phone and "listen for the crossing" at the desk, where block 2 defines the crossing; "seam" is the spec's own word for the bar line at fidelity 1 (§7) and asks the ear to find a join that the claim says it will not find.
- **Author decisions still open:** whether the markov desktop text may say "In the instrument a hand plays the matrices" (A-c-9: spec-true, paper-absent); whether the possibles phone argues the claim's second half ("only the machine speaks") while the front, nameplate and desk argue the first (unchanged from round 1); whether an og tag line ("A playable paper.") is wanted on every page — this draft still has none.

## answers
- E-c-1: taken
- E-c-2: taken
- E-c-3: taken
- E-c-4: taken, differently — the nameplate now names no control at all (directions rule 1), so "one's MEM switch" is gone rather than reworded
- E-c-5: taken ("takes it back")
- E-c-6: taken — "ensemble" in og and text alike; "band" is gone
- E-c-7: taken ("never which window to keep")
- E-c-8: taken — "what moves is where it falls"; the second "does" is gone, "this one only if you make it" keeps one ellipsis
- E-c-9: taken, differently — "**The paper's §5: nouns but no verbs.** This page puts *remember* on every voice." (the budget would not hold "one verb, *remember*,")
- E-c-10: taken ("start inventing")
- E-c-11: taken, as given, on all four pages
- E-c-12: taken, differently — "One step of memory buys a style, never kick, hat, kick, snare. Two chains, one dial: style to dice." (19; "style", not "grammar", so the phone meets one word, C-c-11; the first sentence is E-c-16's own form, since "and cannot hold" put the line at 21)
- E-c-13: taken ("one step of memory apiece"), with "the matrices" for C-c-10
- E-c-14: taken ("a dial from style to dice")
- E-c-15: taken, differently — "Structure at 1" opens the sentence and "two steps of memory" is restored, but "the example" is replaced by "what a hand wrote" (A-c-10)
- E-c-16: taken, differently — "One step of memory: a style, but never kick, hat, kick, snare. The matrices want a desktop." (17)
- E-c-17: taken
- E-c-18: taken, differently — "Six voices and a silence keep books on one pulse." (the proposed line was 21 words; this is 20; silence restored, no memory switch)
- E-c-19: taken
- E-c-20: taken ("one switch that stops reading them")
- E-c-21: taken ("loosen toward dice: the proportions never move, only when each comes round"), with "nobody clumps, nobody starves" added for P-c-14
- E-c-22: taken, differently — "The ledgers themselves want a desktop." (plural, to match the text's seven; C-c-13)
- E-c-23: taken, differently — "each turn goes to one of six voices, or to the silence" (A-c-19's "every turn goes to one option" kept the ambiguity)
- E-c-24: taken
- E-c-25: taken, differently — P-c-13's "in clumps and droughts, like dice" names what the ear gets; "less predictably" names what it loses
- E-c-26: taken, differently — the nameplate now names no press at all: "a hand answers them one at a time. Only the machine speaks."
- E-c-27: taken
- E-c-28: taken (bold **write**, **heavier**, **lighter**; "the other verb")
- E-c-29: taken ("a tree of what can follow what")
- E-c-30: taken
- P-c-1: taken, differently — E-c-2's "buys a style, and cannot hold kick, hat, kick, snare" (the semicolon list reads as three fragments at 13 px)
- P-c-2: taken, differently — the blurb keeps the claim as E-c-3 words it; "Only the machine speaks" is now the nameplate's last sentence, the first thing the thumb reads after the tap
- P-c-3: taken — kept, as the critic says; "inaudible" stays the working word
- P-c-4: taken, differently — the nameplate names no control; the gesture is in `teaser.running`
- P-c-5: taken — "crossing" is defined in the nameplate itself ("each remembers what it just played, and the crossing can be made inaudible") and the phone running line says "seam"
- P-c-6: taken — "press memory: at the next bar each voice loops. Turn fidelity down and listen for a seam." (89)
- P-c-7: taken — the critic asks for no change; the sentence stays
- P-c-8: taken, differently — the listening cue is in `running` ("listen for a seam") and `teaser.text` leads with the loop and "Fidelity is how much of that it keeps"; the five-word amount line would not fit beside the bar-line guard
- P-c-9: taken, differently — "Two chains, one dial: style to dice." (grammar → style for C-c-11)
- P-c-10: taken ("at 1 a written style, at 0 dice"); the start flinch is left, there is no room for "it starts the sound" inside 53
- P-c-11: taken, differently — "the walks follow what a hand wrote, and every step answers the last"
- P-c-12: taken, differently — the memory switch leaves the nameplate; the dial is not named there either (directions rule 1 and the 20-word budget), it is named in `running`
- P-c-13: taken (compressed to 78)
- P-c-14: taken — "nobody clumps, nobody starves" sits before the dial, and `running` carries "clumps and droughts"
- P-c-15: taken, differently — no control names on the nameplate; "a tree" is in `teaser.text` and `share` rather than the nameplate, which carries the claim
- P-c-16: taken, differently — the baseline's "left, the figure sharpens; right, it dissolves" plus "then inverts", so it is true across the bias range (A-c-23)
- P-c-17: taken ("You cannot strike a drum here: bias only leans how it chooses"; "a tree")
- A-c-1: taken ("can be made inaudible"), in blurb and nameplate
- A-c-2: taken ("while the amount of music is held")
- A-c-3: taken ("Leave density alone and the amount of music is held; what moves is where it falls")
- A-c-4: taken ("up to two bars" in `teaser.text`; `running` says "loops" with no count)
- A-c-5: taken, differently — "start inventing" (E-c-10, C-c-7), the page's own opposite of memory, rather than "roll their chances"
- A-c-6: taken — no change required; the line stays one-way and the hint carries the release
- A-c-7: taken — no fix needed; "dice" is a uniform draw on markov and weighted dice on statistical-feedback, and each page's text says which
- A-c-8: taken ("the independence the paper's §3.2 pays for, made audible")
- A-c-9: taken, differently — "In the instrument a hand plays the matrices; here they walk alone" (the spec's own claim, without "the Conductor"); flagged for the author in notes
- A-c-10: taken ("what a hand wrote", no "example")
- A-c-11: taken ("the walkers start")
- A-c-12: taken ("Tap a cell in the row a walker stands on: after clear, a rest row")
- A-c-13: taken ("{OFF} stands on a row with no weight. Give that row a cell")
- A-c-14: taken ("what is written returns; kick, hat, kick, snare never will")
- A-c-15: taken (silence restored to `shows`; the memory switch moved out of it under directions rule 1)
- A-c-16: taken
- A-c-17: taken ("one switch that stops reading them")
- A-c-18: taken — no change required
- A-c-19: taken, differently — E-c-23's form, "each turn goes to one of six voices, or to the silence"
- A-c-20: taken ("not even silence. Turn a voice's weight up.")
- A-c-21: taken — "The ledgers themselves", plural
- A-c-22: taken, differently — the nameplate no longer says "heavier makes it matter"; the desktop text says "how much a branch matters"
- A-c-23: taken ("dissolves, then inverts" on the phone; the heavy/light picture is gone from the phone)
- A-c-24: taken ("with bias at 0")
- C-c-1: taken, differently — no page takes the 30-word allowance now; statistical-feedback `shows` is 20
- C-c-2: taken — ruled allowed; unchanged
- C-c-3: taken ("stand where no weight leads on")
- C-c-4: taken — ruled allowed; unchanged
- C-c-5: taken — ruled allowed; unchanged
- C-c-6: taken (og → "ensemble")
- C-c-7: taken ("inventing"; "random" dropped from meta, og and share)
- C-c-8: taken ("how much of what a voice plays is score")
- C-c-9: taken ("both walkers are walking"; `nothing` says "neither walker can move")
- C-c-10: taken (matrices plural in share, text and meta)
- C-c-11: taken ("the style dissolves into dice" / "what is written returns"; "grammar" is gone from every phone line, including `teaser.text`)
- C-c-12: taken, differently — the `nothing` sentence was rewritten for A-c-12 and no longer says "silence" at all
- C-c-13: taken — "six voices and a silence" in shows, meta, og and teaser; "the ledgers" plural in share
- C-c-14: taken ("watch the ledgers walk apart"; "debts" is gone)
- C-c-15: taken
- C-c-16: taken — ruled allowed; weight on the desktop, share on the phone, by rule, and flagged in notes for the author
- C-c-17: taken, differently — og says "the machine is the only speaker"; the nameplate's "Only the machine speaks" stays as its compression, as allowed
- C-c-18: taken ("what can follow what")
- C-c-19: taken ("a branch exists under the finger" in `running`)
- C-c-20: taken, differently — the blurb takes E-c-3's "Existing and mattering are different questions; here you answer them one at a time", which the nameplate now echoes
- C-c-21: taken — every head ends in a full stop or a colon-free sentence
- C-c-22: taken — ", or the Space bar" dropped on all three transport pages
