# claim

## front
### sub
Four browser audio toys for a wandering mind and clumsy hands: one mechanism, one claim and one spec each.
### what-is
A playable paper is an argument you check with a thumb, and a spec anyone can rebuild it from.
### blurb motif-memory
Memory is a state of a voice; crossing into it can be made inaudible.
### blurb markov
One step of memory buys a style, never kick, hat, kick, snare.
### blurb statistical-feedback
Dice have no memory, and the ear hears the difference.
### blurb possibles
Existing and mattering are different questions, and only the machine speaks.

## motif-memory
### shows
Memory is a state of a voice, and the crossing into it can be made inaudible. Five voices, one pulse.
### meta.description
Five voices invent on one pulse. A switch makes a voice remember its last two bars; a dial takes it back to invention and holds the amount of music.
### og.description
Memory as a state of a voice, not a recorder beside the ensemble. Make five voices remember what they just played, then take them back to invention.
### text
**Memory is a state of a voice,** not a recorder beside the ensemble. Every voice keeps its last two bars, unasked. Throw its MEM switch: at the next bar line they become its score. You decide that a passage was worth keeping, never which window to keep: nothing to hit on the beat.

**Fidelity is the crossing.** The dial sets how much of what a voice plays is score and how much invention. Leave density alone and fidelity holds the amount of music; what moves is where it falls. A crossing that changed both at once would announce itself; this one only if you make it.

**The paper's §5: nouns but no verbs.** This page puts *remember* on every voice.
### teaser.text
**Memory is a state of a voice.** Press memory: at the next bar line every voice loops what it just played, up to two bars. Fidelity is how much of that it plays. Turn it down: fidelity holds the amount of music; what moves is where it falls.
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
throw a voice's MEM switch and its last two bars become its score. Then turn its fidelity down and listen for the crossing.
### teaser.notStarted
press ▶ Play: five voices invent on one pulse.
### teaser.nothing
every density is at zero, so the pulse runs empty; the desktop page can open them.
### teaser.shut
it is running but muted or at zero; only the desktop page can change that.
### teaser.running
press memory: each voice repeats itself. Turn fidelity down and listen for the crossing.

## markov
### shows
One step of memory buys a style, never kick, hat, kick, snare. Two chains, one dial: style to dice.
### meta.description
Two Markov chains, four states each, thirty-two weights, one step of memory apiece. Build the matrices and hear what one step holds and what it cannot.
### og.description
One step of memory buys a style, never kick, hat, kick, snare. Two first-order chains, thirty-two weights, and a dial from style to dice.
### text
**One step of memory buys a style.** Each state owns one row of odds. Lean kick toward hat, hat toward snare, snare back toward kick, and every step answers the last: no two bars are the same bar.

**And never kick, hat, kick, snare.** The kick must lead to the hat first and to the snare second, and its row is one set of odds: nowhere to put the difference. Give it both and the walker picks at random. The model's shape, not a shortage of weights.

**Two chains share nothing.** Sixteen weights each, none across them — the independence the paper's §3.2 settles for, made audible. In the instrument a hand plays the matrices; here nobody does.
### teaser.text
**One step of memory buys a style.** Structure at 1: the walks follow what a hand wrote, and every step answers the last. Turn it down and the style dissolves into dice. No setting holds a phrase: kick, hat, kick, snare needs two steps of memory; each chain has one.
### share
One step of memory: a style, but never kick, hat, kick, snare. The matrices want a desktop.
### start.notStarted.weightsSet
the matrices hold weights. Touch the rack or the trail and the walkers start.
### start.notStarted.empty
the matrices are empty. Tap a cell in a rest row: the first weight starts that walker.
### start.nothing
the matrices are empty, so neither walker can move. Each stands on a lit row; tap a cell in it.
### start.stuck
walker 1 stands on {A} and walker 2 on {B}, and neither row has a weight, so nothing can move. Give one of those rows a cell.
### start.shut
it is running and nothing reaches you: every sound is muted in the rack, or the master level is at zero.
### start.running.both
both walkers are walking. Try to put kick, hat, kick, snare into the cells, and hear that no weights will hold it.
### start.running.one
{ON} is walking and {OFF} stands on a row with no weight. Give that row a cell, and hear two chains that share nothing.
### teaser.notStarted
turn structure: at 1 what a hand wrote, at 0 dice.
### teaser.nothing
both matrices are empty, so at 1 nothing can move. Turn structure down.
### teaser.stuck
both walkers stand where nothing follows, so at 1 nothing moves. Turn structure down.
### teaser.shut
it is running but muted or at zero; only the desktop page can change that.
### teaser.running.high
turn structure down and the style dissolves into dice.
### teaser.running.low
turn structure up: what a hand wrote returns; kick, hat, kick, snare never will.

## statistical-feedback
### shows
Dice have no memory, and the ear hears the difference. Six voices and a silence take turns by the books.
### meta.description
Six voices and a silence share one pulse by keeping books: each turn goes to whoever is furthest behind. Turn memory off and the same weights become dice.
### og.description
Dice have no memory, and the ear hears the difference. Ames' fair-share selection: six voices and a silence, a ledger each, and one switch that stops the reading.
### text
**Dice have no memory, and the ear hears the difference.** Six voices and a silence each keep a ledger, the bar beside the name: turns taken, less turns owed. The next turn goes to whoever is furthest behind, and the seven bars always sum to zero. That is Charles Ames' fair share, and it is the whole law.

**Turn memory off.** Selection stops reading the books, though they go on being kept: the same weights become dice, the stream clumps and droughts, and the starved voices sink further left. Turn it back on and they are paid at once — a burst of exactly the voices that were owed. That payoff is the argument in one gesture.
### teaser.text
**Dice have no memory, and the ear hears the difference.** Six voices and a silence share one pulse, and each turn goes to whoever is furthest behind: nobody clumps, nobody starves. Turn heterogeneity up and the turns loosen toward dice; the shares never move, only when each comes round.
### share
Dice have no memory, and the ear hears the difference. Seven ledgers want a desktop.
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
turn heterogeneity up: the same shares, arriving less regularly, most of the way to dice.

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
**The machine is the only speaker.** A hand wrote a tree of what can follow what, and ▶ Play sets the machine walking it. You cannot strike a drum here: bias only leans how it chooses. Left, the written figure sharpens; right, it dissolves, then the light branches win.
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
press write on a strip and a branch exists under the finger. Press heavier: it weighs more, and at bias 0 the machine takes it more often.
### teaser.notStarted
press ▶ Play and the machine walks the tree aloud.
### teaser.nothing
the tree is empty, and the phone cannot write one — the desktop page can.
### teaser.shut
it is running but muted or at zero; only the desktop page can change that.
### teaser.running
turn bias: left, the figure sharpens; right, it dissolves, then the light branches win.

## notes
- **Character counts** (sentence alone; add the keyboard clause to `notStarted`: +32 on the transport pages, +42 desktop / +37 phone on markov). motif-memory: desktop 58 / 115 / 92 / 123, phone 46 / 82 / 74 / 88. markov: desktop weightsSet 77, empty 86, nothing 95, stuck 131 (with "snare" and "cowbell", the longest names), shut 104, both 114, one 126 (with "walker 2" / "walker 1"); phone 50 / 71 / 85 / 74 / 54 / 80. statistical-feedback: desktop 72 / 97 / 108 / 112, phone 50 / 81 / 74 / 89. possibles: desktop 59 / 131 / 107 / 138, phone 50 / 73 / 74 / 87. Worst with the clause: markov empty 86 + 42 = 128, motif-memory phone 46 + 32 = 78. The tightest lines are statistical-feedback's phone `running` (89) and motif-memory's phone `running` (88); if the wrap check needs room, "most of the way to dice" can become "toward dice" (76) and "repeats itself" can become "loops" (83).
- **Word budgets:** sub 19, what-is 19, blurbs 13 / 12 / 10 / 11; shows 20 / 19 / 19 / 19 (no page takes the 30-word allowance); meta 29 / 26 / 29 / 29; og 27 / 26 / 28 / 30; desktop text 120 / 118 / 118 / 120; teaser.text 48 / 50 / 49 / 49; share 18 / 17 / 15 / 17. `wc -w` counting, so a lone em-dash is a word.
- **One phone `shut` sentence on all four pages:** "it is running but muted or at zero; only the desktop page can change that." (74).
- **One head runs into its body** (C-c-21 allowed this if declared): motif-memory block 1, "**Memory is a state of a voice,** not a recorder beside the ensemble." — E-c-32's own sentence; the head is the claim and the body's first clause is its negative. Every other head ends with a full stop.
- **motif-memory keeps a desktop `text`** (three blocks, 120 words) where the page has `text: false` today; the reasons stand from round 1. The nameplate carries no control, so the `shows` Node has no word to italicise: the declaration becomes a plain string, or the Node stays with no `<em>`. Author's call (E-c-31, C-c-32).
- **The phone screen read as one screen, per toy.** motif-memory: the thing to listen for is *the crossing* on the nameplate ("the crossing into it"), the desk `running` and the phone `running`; "seam" is gone (it is the spec's word for the loop's join, A-c-26). markov: "what a hand wrote" on both phone lines that name the matrices' contents (`notStarted`, `running.low`), "style to dice" on the nameplate, "style dissolves into dice" going down. statistical-feedback: *shares* are what the dial cannot move, *turns* are what loosens (A-c-27); the phone `running` says "most of the way to dice", the spec's own measure (§8.5), not "like dice". possibles: "the figure sharpens; dissolves, then the light branches win" on both phone lines — both halves of the bias range in the ear's words (A-c-23, E-c-42).
- **Naming, settled per page.** motif-memory: the kept bars are the *score* at the desk and *what it just played* / "repeats itself" on the phone; the phone button is *memory*, the desktop switch is MEM, the nameplate names neither; the voices *invent* before memory; *turn* the dial everywhere ("ride" is gone, C-c-28); *fidelity holds the amount of music* (active, E-c-33). markov: *walker* for the thing that stands and moves, *chain* for the model; *row* in every layer, "a lit row" for where a walker stands (the page's own comment calls it that); the second half of the claim is "never kick, hat, kick, snare" in every layer (blurb, nameplate, og, share, text head, `running.low`; C-c-29 — the academic checked "never" in round 2 and passed it); "dice" here is a uniform draw. statistical-feedback: the *ledger* is the thing (seven; "Seven ledgers" in share, "the ledgers" in `running`), *the books* is the activity ("take turns by the books", "keeping books"), memory off *stops the reading* in meta, og and text, no "debts", "six voices and a silence" wherever counted. possibles: one picture for a write, *exists under the finger*; "a tree" on the phone; heavier "weighs more", then the bias condition (E-c-41).
- **The keyboard note.** ", or the Space bar" is gone from every desktop `notStarted`; the library's appended clause is the only keyboard note; the `keys:` line (out of scope) still names Space.
- **Author decisions still open:** whether the markov desk text may say "In the instrument a hand plays the matrices; here nobody does" (A-c-9: spec-true, paper-absent); the possibles front blurb and nameplate, where the phone critic wants the machine first and the claim second (P-c-18) and this draft keeps the claim first with "only the machine speaks" as the ear's clause; whether an og tag line ("A playable paper.") is wanted on every page — this draft still has none; whether the motif-memory phone `running` should carry the bar-line guard ("next bar," +10 chars) at the cost of "repeats itself" (P-c-19 wants it, E-c-33 let it go).

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
- E-c-31: taken — blurb and `shows` as proposed ("crossing into it"; "Five voices, one pulse.")
- E-c-32: taken — block 1 as proposed, comma head declared in notes
- E-c-33: taken — "fidelity holds the amount of music" in `teaser.text`; `running` is the proposed "each voice repeats itself. Turn fidelity down and listen for the crossing." (88)
- E-c-34: taken ("settles for"; "here nobody does")
- E-c-35: taken ("Each stands on a lit row; tap a cell in it.")
- E-c-36: taken, differently — "at 1 what a hand wrote, at 0 dice" (50), so `notStarted` and `running.low` share one phrase (P-c-20)
- E-c-37: taken
- E-c-38: taken ("take turns by the books")
- E-c-39: taken ("stops the reading")
- E-c-40: taken, differently — the participle is there ("arriving"), but the tail is A-c-28's truth, "less regularly, most of the way to dice", not "in clumps and droughts, like dice"
- E-c-41: taken
- E-c-42: taken ("then the light branches win" on both phone lines)
- P-c-18: taken, differently — "Existing and mattering are different questions, and only the machine speaks." (11): the untrue "here you answer them" is gone and the ear gets the last clause, but the claim stays first, as on the other three blurbs; flagged for the author
- P-c-19: taken, differently — "seam" is gone and the cue is "the crossing", the word the nameplate above it defines (C-c-27, E-c-33); the bar-line guard went with it (E-c-33), flagged for the author
- P-c-20: taken ("what a hand wrote returns")
- P-c-21: taken ("Seven ledgers want a desktop.")
- P-c-22: taken ("then the light branches win")
- A-c-25: taken ("how much of that it plays")
- A-c-26: taken, differently — not "where does memory end?" but "listen for the crossing", the page's one word for the mechanism (nameplate, desk text, both `running` lines); "seam" is gone everywhere, and the notes no longer cite §7
- A-c-27: taken ("the turns loosen toward dice; the shares never move, only when each comes round")
- A-c-28: taken ("arriving less regularly, most of the way to dice")
- C-c-23: taken — nothing to fix
- C-c-24: taken — ruled allowed; unchanged
- C-c-25: taken — ruled allowed; unchanged
- C-c-26: taken — ruled allowed; unchanged
- C-c-27: taken ("listen for the crossing" on the phone, 88)
- C-c-28: taken ("Then turn its fidelity down")
- C-c-29: taken — "never kick, hat, kick, snare" in every layer; blurb and og changed to match
- C-c-30: taken ("here nobody does", E-c-34)
- C-c-31: taken ("the turns loosen toward dice; the shares never move", A-c-27)
- C-c-32: taken — recorded; the `<em>` has no word, see notes
