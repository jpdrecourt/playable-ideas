# Critique r1 — the length and consistency cop

Read first: `docs/copy/cop/r0-claim.md`, `r0-question.md`, `r0-rulesheet.md`
(the measured half). This file is the human half: the budget breaches and
whether they are justified, a ruling on every phone word the script flagged,
naming within each toy, naming across the four toys, format compliance, and
the keyboard clause. Each item: the rule, the place, the words, the fix.

Rulings on phone words use the three cases from the brief: (a) names a
control the thumb is asked to use — violation; (b) names a thing only to say
the desktop can act — allowed; (c) a concept, not a control — allowed.

Reference facts used below, checked against the pages: the memory switch on
motif-memory is declared `'mem'` and the phone button `'memory'`; rack labels
are CSS-uppercased (`.kl`, `.ctl label`), so MEM and memory are the same word
in two cases. The loudness column is declared `'gain'` and rendered "level".
The markov instrument's own aria label reads "a strip is a state, and the
cells along it are what may follow it"; the state with no voice is named
`rest`; the walkers are `walker 1` / `walker 2`. statistical-feedback's loop
is labelled "the stress loop". possibles' buttons read write / heavier /
lighter; markov's read clear / reseed. The library appends the keyboard
clause as `text += ' Or tab to Play and press Enter.'` (leading space,
capital O), on `notStarted` only.

## claim

**Budgets**

- **C-c-1** (§5, `shows` ≤ 20) statistical-feedback `shows` is 28/20, OVER by
  8. The note names it as the one page given the ≤ 30 allowance and says why
  ("keeping books" and "turn memory off" in one breath). Justified. The other
  three `shows` are 20/20/20, so no second page claims the allowance. No other
  layer is over; mm `text`, possibles `text`, three `teaser.text` and all four
  `share` sit exactly on the line.

**Phone words (script flags)**

- **C-c-2** motif-memory `teaser.nothing`, "density": "every density is at
  zero, so the pulse runs empty; the desktop page can open them." Ruling (b):
  named only to say the desktop can open it. Allowed. Same sentence as live.
- **C-c-3** markov `teaser.stuck`, "row": "both walkers stand on empty rows, so
  at 1 nothing moves. Turn structure down." Ruling (c): the row is the state
  being described; the thumb is sent to structure. Allowed, but the phone shows
  no row, so the reader has no referent (live has the same word). If the author
  wants zero invisible nouns: "both walkers stand where no weight leads on, so
  at 1 nothing moves. Turn structure down."
- **C-c-4** statistical-feedback `teaser.nothing`, "weight": "every weight is
  at zero, so nobody can be chosen; the desktop page can raise one." Ruling
  (b). Allowed.
- **C-c-5** possibles `teaser.nothing`, "write": "the tree is empty, and the
  phone cannot write one — the desktop page can." Ruling (b): the verb is
  there to say only the desktop has it. Allowed.

**Naming within a toy**

- **C-c-6** motif-memory, ensemble vs band. `text` block 1: "not a recorder
  beside the ensemble"; `og`: "not a recorder beside the band". The spec and
  the live front page say ensemble. Fix: og → "beside the ensemble" (same
  count).
- **C-c-7** motif-memory, what the voices do before memory: "start guessing"
  (`start.notStarted`), "invention"/"invents" (`text`, `teaser.text`,
  `running`), and "five random voices" (`meta`, `og`, `share`) where the page
  itself never calls them random. Fix: "five voices start inventing on one
  pulse" (77 chars, +32 = 109) and drop "random" or use it on the page too.
- **C-c-8** motif-memory, `text` block 2: "how much of the stream is score" —
  "stream" is a noun for the voice's output that appears nowhere else on the
  page (elsewhere: "what it plays", "the amount of music"). Fix: "how much of
  what it plays is score".
- **C-c-9** markov, chain vs walker. Things that stand and walk: "both walkers
  start" (`notStarted.weightsSet`), "walker 1 stands on {A}" (`stuck`), "{ON}
  is walking" (= walker 1) — but "both chains stand on their rest" (`nothing`)
  and "both chains are walking" (`running.both`). The page's names are walker
  1 / walker 2; "chain" is the model that holds weights and shares nothing
  (`text` block 3, right). Fix: `nothing` → "both walkers stand on their rest";
  `running.both` → "both walkers are walking".
- **C-c-10** markov, matrix singular vs plural. `share`: "The matrix wants a
  desktop."; `text` block 3: "a hand plays the matrix"; `meta`: "Build a
  matrix" — against "the matrices hold weights", "both matrices are empty"
  (states). There are two. Fix: share → "The matrices want a desktop." (same
  count); text → "the matrices".
- **C-c-11** markov, grammar vs style for the same end of the dial. `og`: "a
  dial from grammar to dice"; `teaser.text` and `teaser.running.high`: "the
  grammar dissolves into dice"; `teaser.running.low`: "a style arrives";
  `shows`/blurb: "buys a style". The note defends grammar = the matrices,
  style = what you hear, but no phone sentence says so, and the phone reader
  meets "grammar" on the way down and "style" on the way up. Fix: one word on
  the two `running` lines — "turn structure down and the style dissolves into
  dice." (54) — keeping "grammar" in `teaser.text` where it is introduced.
- **C-c-12** markov, rest vs silence in one sentence. `start.nothing`: "both
  chains stand on their rest … Tap a cell in a rest row to say what may follow
  a silence." The state is named rest on the page. Live has the same. Fix:
  "what may follow a rest", or keep as the one deliberate gloss — author's
  call, but then it should be the only "silence" on the page (it is).
- **C-c-13** statistical-feedback, six vs seven. "Six voices share one pulse"
  (`shows`), "six voices, a ledger of attention" (`og`), "Six voices, one
  ledger" (`share`) — against "Six voices and a silence" (`meta`, `text`,
  `teaser.text`, `teaser.notStarted`), "six voices, or the silence"
  (`notStarted`), and `text`: "each keep a ledger … the seven bars always sum
  to zero". The share says one ledger; the text says seven. Fix share: "Dice
  have no memory, and the ear hears the difference. Seven ledgers want a
  desktop." (14 words). `shows` is already over budget, so leave the silence
  out there and accept "six voices" as the short form in `shows`/`og`.
- **C-c-14** statistical-feedback, books / ledger / debts. "keeping books"
  (`shows`, `meta`, `text`), "ledger" (`og`, `text`, `share`), "debts"
  (`start.running`: "watch the debts walk apart"). Live mixes the same three.
  Keep two with a rule — the ledger is the thing, keeping books is the
  activity — and lose the third. Fix: `running` → "turn memory off and watch
  the ledgers walk apart, then turn it back on: …" (+2 chars, 112).
- **C-c-15** statistical-feedback, what the switch does. `meta`: "Turn the
  ledger off and the same weights become dice"; `og`: "one switch that turns
  it [the ledger] into dice" — against `text` block 2: "selection stops
  reading the books, though they go on being kept", and the switch's name,
  memory. The ledger is never turned off. Fix: meta → "Turn memory off and the
  same weights become dice." (same count); og → "one switch that stops reading
  it" (same count).
- **C-c-16** statistical-feedback, weight vs share: "the same weights become
  dice" (`shows`, `meta`, `text`) vs "the same shares lose their grain"
  (`teaser.text`, `teaser.running`). Deliberate: weight is the desktop control,
  share is what it buys, and the phone has no weight. Allowed; noted so the
  author decides it once.
- **C-c-17** possibles, three forms of one tag line: "only the machine speaks"
  (`shows`), "a machine that alone speaks" (`og`), "The machine is the only
  speaker" (`text` head, `share`, `teaser.text` head). Fix: og → "A motif tree
  written by hand; the machine is the only speaker." (og stays 30/30 by
  dropping "and a"). `shows` is at 20/20; "only the machine speaks" may stand
  as its compression.
- **C-c-18** possibles, "what can follow what" (`meta`) vs "what follows what"
  (`teaser.text`). Fix: teaser.text → "A hand wrote this tree of what can
  follow what — kick, snare, cowbell, crash, rest. ▶ Play sets the machine
  walking it." (+1 −1 = 50/50).
- **C-c-19** possibles, symbol vs branch for one press of write. `start.running`:
  "press write on a strip and that symbol follows the finger"; `start.nothing`
  and `text`: "that branch exists under the finger". Two nouns, one event.
  Fix: running → "press write on a strip and a branch exists under the finger;
  press heavier and the machine takes it more often." (≈ 112).
- **C-c-20** front vs nameplate, possibles. Blurb: "Whether a motif exists and
  how much it matters are two verbs, not one." Nameplate/og/text: "Existing
  and mattering are different questions". The writer flags it. The other three
  blurbs match their `shows` word for word. Fix if the author wants the match:
  "Whether a motif exists and how much it matters are different questions."
  (12 words).

**Format and the clause**

- **C-c-21** (§8, "**Head.** body") `text` heads that run into the body
  without a full stop: motif-memory "**Memory is a state of a voice,** not a
  recorder…"; statistical-feedback "**Turn memory off** and selection…";
  possibles "**In Assayag and Dubnov's model the two are one act:** a
  performance…". They render fine as `<b>head</b> body`, but the format and
  the other two drafts give the head a full stop. Fix: make the heads stand
  ("**Memory is a state of a voice.** Not a recorder beside the ensemble.") or
  declare the choice in notes.
- **C-c-22** Keyboard clause. Every `notStarted` ends with a full stop, so the
  appended "Or tab to Play and press Enter." reads as a new sentence. But the
  desktop `notStarted` on all three transport pages says "press ▶ Play, or the
  Space bar, and …", giving two keyboard notes in one line (live has it on
  motif-memory and statistical-feedback; claim adds possibles). Fix: drop ", or
  the Space bar" (−18 chars each) and let the library's clause be the keyboard
  note, or declare the doubling as wanted.

## question

**Budgets**

- **C-q-1** No layer over budget; the note's "No budget breached" matches the
  report. markov `og` 30/30 and statistical-feedback `teaser.text` 50/50 are
  on the line.

**Phone words (script flags)**

- **C-q-2** motif-memory `teaser.nothing`, "density": same sentence as C-c-2.
  Ruling (b). Allowed.
- **C-q-3** motif-memory and possibles `teaser.shut`, "master": "running, but
  muted or the master is at zero — only the desktop page can change that."
  Ruling (b): named to say the desktop can. Allowed (verbatim live).
- **C-q-4** markov `teaser.stuck`, "row": "both walkers stand on rows with no
  weights, so at 1 nothing moves. Turn structure down." Ruling (c). Allowed,
  with C-c-3's caveat.
- **C-q-5** statistical-feedback `teaser.nothing`, "weight": "nothing carries
  any weight, so nobody can be chosen; the weights are on the desktop page."
  Ruling (b). Allowed.
- **C-q-6** possibles `teaser.nothing`, "write": same as C-c-5. Ruling (b).
  Allowed.

**Naming within a toy**

- **C-q-7** motif-memory, record / score / memory. `text` block 1 head:
  "**Nobody is recording.**" — two sentences later: "Throw MEM and that record
  becomes its score." The thing nobody is recording is called a record. Also
  "a memory switch on each" (`meta`) vs "MEM switch" (`text`, `running`).
  Fix: "Throw MEM and those two bars become its score"; and one name for the
  switch in meta and text (either "MEM" or "the memory switch").
- **C-q-8** motif-memory, ride vs turn. "Ride *fidelity*" (`shows`), "ride
  fidelity" (`og`), "Ride the knob down" (`text`), "ride it down"
  (`teaser.text`), "ride fidelity down" (`teaser.running`) — but
  `start.running`: "Now turn its fidelity down". Fix: "Now ride its fidelity
  down" (same length).
- **C-q-9** markov, strip vs row. `text` block 1: "A strip is a state; its
  four cells say what may follow it." Everywhere else: "rest row"
  (`notStarted.empty`, `nothing`, `running.one`), "neither row" (`stuck`),
  "rows with no weights" (`teaser.stuck`). The page's label says strip; the
  live states say row. Fix: one word. If strip: "a rest strip" in the four
  states and "neither strip" in stuck (+2 chars each, all inside limits).
- **C-q-10** markov, build a style vs build a grammar. `meta`: "Build a style,
  then ask it for a phrase"; `og`: "Build a grammar, then ask it for kick, hat,
  kick, snare"; `text` head: "**Build a style.**"; `teaser.text` and
  `teaser.notStarted`: "the written grammar". Parallel sentences, different
  nouns. Fix: you build a grammar (the matrices) and hear a style — meta →
  "Build a grammar, then ask it for a phrase."; text head → "**Build a
  grammar.**" (the block's question "Does the walk acquire a logic of its
  own?" then asks about the style).
- **C-q-11** markov, `meta` opens "A first-order Markov chain: two walkers,
  four states each" — one chain, then two walkers, while `shows` says "Two
  chains". Fix: "Two first-order Markov chains, four states each, thirty-two
  weights, one step of memory. Build a grammar, then ask it for a phrase. A
  playable paper." (25/30).
- **C-q-12** markov, dice vs quarter chance on the phone. `teaser.notStarted`:
  "0 is dice"; `teaser.text`: "at 0 every next state is a quarter chance". Two
  names for 0 in the two phone layers that are on screen together. Minor.
  Fix: teaser.text → "at 0 every next state is dice, a quarter chance each"
  (+3 words; the block is 49/50, so cut "only" from "remembers only the state").
- **C-q-13** markov, `notStarted.empty`: "the first weight starts the audio and
  the chain at once" — "the audio" is a word no other layer uses (live has it).
  Fix: "starts the sound and the chain at once", or the rulesheet's "and it
  starts the chain".
- **C-q-14** statistical-feedback, the toy's question changes on the phone.
  Blurb, `shows`, `og`, `share`: "Can the ear tell dice from a ledger?";
  `teaser.text` head: "**Can the same shares sound like dice?**". The note
  explains (the phone cannot turn memory off) and asks the author to decide.
  As consistency it is the one drift in the layer that must stand alone: the
  reader who arrives from the share text meets a different question. Fix if
  one question is wanted: head "**Can the ear tell dice from a ledger?**" with
  the body as it is (it already says the shares never move).
- **C-q-15** statistical-feedback, `text` block 3: "Drag the stress row" — the
  page labels it "the stress loop" (the rulesheet uses that). Fix: "Drag the
  stress loop".
- **C-q-16** statistical-feedback, ledger / books / bars / debts. `shows` has
  both "keeping books" and "a ledger" in one line; `text`: "keeps a ledger, the
  bar beside its name … the seven bars sum to zero … The books are still kept …
  Watch the bars walk apart … ledger frozen"; `start.running`: "Watch the
  debts walk apart"; `share`: "The ledger itself wants a desktop" (singular;
  every option keeps one). Fix: running → "Watch the bars walk apart" (as the
  text says); share → "The ledgers themselves want a desktop." (same count).
- **C-q-17** statistical-feedback, `meta`: "One switch turns the ledger into
  dice." — the `og` has it right ("one switch stops reading them") and the
  `text` says "The books are still kept". Fix: meta → "Charles Ames'
  statistical feedback: six voices and a silence share one pulse by keeping a
  ledger. One switch stops reading it. A playable paper." (24/30).
- **C-q-18** statistical-feedback, claimant / option / voice: "seven claimants"
  (`text` head), "Every option keeps a ledger" (`text`), "one option is chosen"
  (`notStarted`), "Six voices, one knob" (`share`, dropping the silence).
  Minor; "option" is the live word. Fix: "**One pulse, seven options.**" or
  keep "claimants" once as the colour and "option" after.
- **C-q-19** possibles, "a tree of what can follow what" (`shows`, `meta`,
  `og`) vs "a tree of motifs" (`teaser.text`). Fix (49/50): "**Does a motif
  that exists already matter?** A hand wrote a tree of what can follow what;
  the machine walks it, and nothing you touch makes a sound. Turn bias: it
  leans the walk toward heavy or light branches, writing nothing. Which motifs
  did you not know were there?"
- **C-q-20** possibles, "nothing you do makes a sound" (`meta`) vs "nothing you
  touch makes a sound" (`teaser.text`) vs "You struck nothing" (`text`). Fix:
  "nothing you touch makes a sound" in meta too (same count).
- **C-q-21** possibles, `text` block 1: "write on four strips in a row" — "in a
  row" means in sequence, but "row" is this draft's markov word for a state
  (C-q-9). Fix: "write on four strips in turn".

**Format and the clause**

- **C-q-22** Format: every head ends with a full stop; `""` on the three
  stuck; `{A} {B} {ON} {OFF}` present; mm `text` as two blocks; `running`
  non-empty; all fragments lowercase; "▶ Play" with the glyph; no curly
  quotes. Clean, except the "(N)" suffixes (see across).
- **C-q-23** Keyboard clause. All `notStarted` end with a full stop. Desktop
  `notStarted` on motif-memory and statistical-feedback says "or the Space
  bar" (double note, as live); possibles' does not ("press ▶ Play to start the
  machine, then write a branch…"). So the draft's three transport pages do not
  agree with each other. Fix: drop ", or the Space bar" on the two (mm goes
  134 → 116 with the clause, the longest `notStarted` in any draft).

## rulesheet

**Budgets**

- **C-r-1** (§5, `shows` ≤ 20) statistical-feedback `shows` 29/20, OVER by 9.
  Declared in the notes as the one ≤ 30 page with a reason (the memory switch
  is the comparison). Justified.
- **C-r-2** (§5, `text` ≤ 120) statistical-feedback `text` 121/120, OVER by 1,
  NOT declared: the notes say "Desktop texts are 116 / 120 / 120 / 120". The
  writer's counter runs one low throughout (mm 116 vs measured 117;
  teaser.text 49/45/44/48 vs 50/45/45/49), most likely on "(Ames'" or a
  lowercase label at sentence start. Fix: cut one word — "At weight 0 a voice
  leaves; its ledger freezes." — and recount with `wc -w` before r2.

**Phone words (script flags)**

- **C-r-3** markov `teaser.stuck`, "row": same sentence as C-q-4. Ruling (c).
  Allowed; see C-r-11 for the draft's own strip/row split.
- **C-r-4** statistical-feedback `teaser.nothing`, "weight": "nothing carries
  any weight, so nobody can be chosen. The weights are on the desktop page."
  Ruling (b). Allowed.
- **C-r-5** possibles `teaser.nothing`, "write": "the tree is empty. The phone
  cannot write one; the desktop page can." Ruling (b). Allowed.
- **C-r-6** Not flagged, ruled anyway: `teaser.shut` on all four pages,
  "running, but nothing reaches you. Unmute it on the desktop page." —
  "Unmute" names the mute control to say the desktop can: ruling (b), allowed.
  The writer notes it covers a master at zero loosely; that is the academic's
  call. And motif-memory `teaser.nothing`, "The desktop page can open the
  voices." names no control: allowed (but see C-r-10).

**Naming within a toy**

- **C-r-7** motif-memory, ride vs turn. `shows`: "Ride *fidelity* from score
  to invention" — the only "ride"; `text`, `teaser.text`, `start.running`,
  `teaser.running` all "turn … fidelity down". Fix: shows → "Turn *fidelity*
  from score to invention." (same count), or accept one headline verb.
- **C-r-8** motif-memory, what MEM does: "freezes" (`shows`, `meta`), "keeps"
  (blurb: "A switch keeps a voice's last two bars"), "become its score"
  (`text`, `running`). And "keeps" is also the word for what every voice does
  unasked (`meta`: "Each keeps a rolling record"; `teaser.text`: "each voice
  keeps the two bars"). Fix: blurb → "A switch freezes a voice's last two bars.
  A knob blends them with invention." (same count); then keep = always,
  freeze = the switch.
- **C-r-9** motif-memory, record / memory / score. `meta`: "a rolling record
  … freezes that record as its score"; `og`: "blends that memory with
  invention"; `text`: score. "record" is also this draft's name for
  statistical-feedback's stage ("The record shows every turn"). Fix: meta →
  "Five voices on one pulse. Each keeps its last two bars. MEM freezes them as
  its score. Fidelity blends score and invention at one density." (26/30);
  drop "record" from this page so statistical-feedback owns it.
- **C-r-10** motif-memory `teaser.nothing`: "The desktop page can open the
  voices." A voice is not opened; its density gate is (`start.nothing`: "Open
  a voice's density gate"). Fix: "the pulse is running with nothing on it. The
  desktop page can let the voices in." (≈ 80).
- **C-r-11** markov, strip vs row inside one draft. The draft chooses strip
  ("A strip is a state", "a tap in a rest strip", "The lit strip", "rest
  strip" in `notStarted.empty`, `nothing`, `running.one`, "what may follow a
  strip" in `running.both`) but leaves row in `text` block 2 ("a share of the
  row"), `start.stuck` ("Neither row has a weight") and `teaser.stuck` ("rows
  with no weights"). Fix: "a share of the strip"; stuck → "Neither strip has a
  weight. Give one of them a cell." (−4); teaser.stuck → "both walkers stand
  on strips with no weights, so at 1 nothing moves. Turn structure down." (89).
- **C-r-12** markov, grammar / example / style on the phone. `teaser.text`
  head "**Grammar or dice.**", body "At 1 each walk reads the example's weights
  as written and has a style"; `teaser.notStarted` "1 plays the example, 0 is
  dice"; `og` "Build a grammar by hand". The head's word never recurs in its
  body. Fix: body → "At 1 each walk reads the example's grammar as written and
  has a style", or head → "**The example or dice.**".
- **C-r-13** markov, dice vs quarter chance on the phone. `teaser.notStarted`
  "0 is dice"; `teaser.text` "every next state is a quarter chance";
  `teaser.running.high` "dissolves into a quarter chance per step". Fix: one
  word for 0 — running.high → "turn structure down. The style dissolves into
  dice." (46), keeping "quarter chance" in teaser.text as the gloss.
- **C-r-14** markov, chain vs walker. "both walkers start" (`text`,
  `notStarted.weightsSet`), "restarts a walker", "{ON} is walking" — but "both
  chains are walking" (`running.both`), "The two chains share nothing"
  (`running.one`, right: the model). Fix: running.both → "both walkers are
  walking." ("walk" for the trail's line is fine: it is what a walker leaves.)
- **C-r-15** statistical-feedback, books / ledger / debts. "keeping books"
  (blurb, `shows`, `meta`, `og`, `share`), "ledger" (`text`, `teaser.text`,
  `share`), "debts" (`start.running`: "watch the debts walk apart"). Fix as
  C-c-14: ledger the thing, keeping books the activity, running → "watch the
  ledgers walk apart".
- **C-r-16** statistical-feedback, what the switch does. `meta`: "Switch the
  books off: dice."; `og`: "One switch turns the books off and leaves the
  dice." — against `text` block 2: "Turn memory off. Selection stops reading
  the books." and the switch's name. Fix: meta → "Turn memory off: dice."; og →
  "One switch stops reading the books and leaves the dice." (same counts).
- **C-r-17** statistical-feedback, "Six voices share a pulse" (blurb, `og`),
  "Six voices take turns" (`share`) vs "Six voices and a silence share one
  pulse" (`shows`, `meta`, `text`, `teaser.text`, states). The short layers
  drop the silence (acceptable compression) and also change "one pulse" to "a
  pulse", which no other layer on either rack page does. Fix: "one pulse" in
  blurb and og (same count).
- **C-r-18** statistical-feedback, the phone's two words for heterogeneity.
  `teaser.text`: "The shares hold; the order loosens toward dice."
  `teaser.running`: "The shares hold and the grain goes." — "grain" is
  introduced nowhere on the phone. Fix: running → "turn heterogeneity up. The
  shares hold and the order loosens." (60).
- **C-r-19** possibles, symbol vs branch for one press of write. `text`: "that
  symbol goes under the finger, the amber square"; `start.nothing`: "that
  branch exists under the finger"; `start.running`: "that symbol follows the
  finger". Fix: running → "press write on a strip and a branch exists under
  the finger. Press heavier and the machine takes it more often." (≈ 112).
- **C-r-20** possibles, figure vs motif. `teaser.text` and `teaser.running`:
  "the figure sharpens … it dissolves"; `text`, `og`, `share`: motif(s). Live
  has the same split (desktop motif, phone figure). Author's call; if one word:
  "Left, the motifs sharpen. Right, they dissolve."
- **C-r-21** possibles, press vs touch: "Nothing you press sounds" (`shows`),
  "nothing you press makes a sound" (`text`), "Nothing you touch makes a
  sound" (`teaser.text`), "Writing is not playing" (`meta`). A desktop/phone
  split is defensible, but `shows` is read on both. Fix: "touch" everywhere
  (a thumb and a mouse both touch) or "press" everywhere.
- **C-r-22** possibles, `text` block 1: "Write kick, snare, kick, rest in a
  row" — same "row" collision as C-q-21, worse here because the draft's own
  markov and rack pages use "row" for two other things (C-r-24). Fix: "in
  turn" / "one after another".
- **C-r-23** front vs nameplate: the blurbs are mechanics and their words match
  each page (markov "Build one and listen" ↔ shows "Build one and hear what
  that holds"; sf "Turn memory off and hear dice" ↔ shows; possibles blurb =
  og). One drift: mm blurb "keeps" vs shows "freezes" (C-r-8).

**Format and the clause**

- **C-r-24** Format: heads end with full stops; `""`; placeholders; mm `text`
  three blocks; `running` non-empty; lowercase fragments ("{ON}" renders
  "walker 1", noted by the writer); glyph; straight quotes. Clean, except the
  "(N)" suffixes (see across). Body sentences that open with a lowercase
  control name ("weight is how often", "heavier and lighter move", "bias moves
  no weight", "clear empties both") follow the on-screen labels; consistent
  with the live pages, where MEM is the only label kept in capitals.
- **C-r-25** Keyboard clause. All `notStarted` end with a full stop. Desktop
  `notStarted` on motif-memory and statistical-feedback: "press ▶ Play, or
  Space." — with the clause: "press ▶ Play, or Space. Five voices start on one
  pulse. Or tab to Play and press Enter." Double note; possibles' has none, so
  the three transport pages disagree (as in question). "or Space" also differs
  from live's "or the Space bar", harmlessly. Fix: drop ", or Space" on both.

## across the drafts

- **"(N)" suffixes.** All three drafts append a character count to every state
  line (37 per draft). §8 says copy only under the headings; the assembler
  must strip `\s\(\d+\)$` or the writers must move the counts to `## notes`.
  The counts themselves agree with the measurements (writer's N + clause =
  the r0 figure in every case I checked), so they are trustworthy; they are
  just in the wrong place.
- **Format otherwise.** All three: 70 headings in the brief's order, `""` on
  the three stuck, markov variants and `{A} {B} {ON} {OFF}`, motif-memory
  `text` as blocks (none chose "none"), `running` non-empty on every page and
  variant, every fragment lowercase, "▶ Play" always with the glyph, no curly
  quotes, every phone state given its own word. Only claim's run-on heads
  (C-c-21) deviate.
- **Phone words.** Every flagged word in every draft rules (b) or (c); there is
  no (a) violation anywhere. The flags are inherited: all three drafts keep
  the live `nothing`/`shut`/`stuck` phone sentences nearly verbatim, so the
  same five words (density, master, row, weight, write) recur. The one phone
  noun with no on-screen referent is markov's "row"/"rows" in `teaser.stuck`,
  in all three.
- **statistical-feedback is where naming slides, in all three.** (1) The
  share-preview layers (meta/og/share) say the switch turns the ledger/books
  off or into dice, while the desktop text says — correctly — that selection
  stops reading them and the books go on being kept (C-c-15, C-q-17, C-r-16;
  question's og is the one short layer that has it right). (2) books / ledger
  / debts for one thing, with "debts" only ever in `start.running` (C-c-14,
  C-q-16, C-r-15). (3) "Six voices" in the short layers, "six voices and a
  silence" and "seven" in the long ones (C-c-13, C-q-18, C-r-17).
- **markov chain/walker.** "both chains are walking" (`running.both`) against
  "both walkers start" / "walker 1 stands" in all three — inherited from live.
  And every draft uses "row" for a state in at least one place while the page
  says strip: claim consistently row, question and rulesheet split.
- **Three words that mean different things on different pages** (no draft
  escapes): "bar" is a musical bar on motif-memory and markov and a graphic
  bar in sf's text ("the bar beside the name", "the seven bars sum to zero",
  "watch the bars walk apart"); "row" is a rack row (mm, sf), a markov state,
  and "in a row" on possibles; "cell" is a matrix cell on markov, a timeline
  cell on motif-memory (question "Cell by cell", rulesheet "cell by cell") and
  a grid step on possibles (question "on the next cell"). "voice" is a sound
  source only on the two rack pages; markov says sound, possibles says symbol,
  following each page's labels — allowed. The clock is "one pulse" on the rack
  pages and "grid" on the walker pages (rulesheet meta ×2) — allowed, note it.
  The dials are "knob" on three pages and "dial" only on markov, in all three
  drafts (the brief and the library say dial).
- **"the desktop page can …"** is the phone's formula in all three and reads
  the same across the four pages of each draft — good. Rulesheet's "Unmute it
  on the desktop page" is the one phone line that tells the desktop reader a
  specific thing to do when the state has two causes.
- **Keyboard clause.** Every `notStarted` in every draft ends with a full
  stop, so the appended clause is a new sentence. The double keyboard note
  ("or the Space bar" / "or Space" + "Or tab to Play…") is on mm and sf in all
  three (as live); claim adds possibles; question and rulesheet leave
  possibles without it, so their transport pages disagree among themselves.
- **motif-memory desktop `text`** is proposed by all three (3 / 2 / 3 blocks),
  each declared. The sf `shows` allowance is taken by claim (28) and rulesheet
  (29) with reasons; question stays at 19 everywhere.

## verdict

**Cleanest: question.** No budget breach, the front blurbs are the toys' own
nameplate questions almost word for word, every head is formed as §8 asks, the
meta/og tags ("A playable paper." / "One of four playable papers.") are
uniform across the four pages, and its sf `og` is the only short layer in any
draft that says what the switch does correctly. Its drifts are the markov
strip/row split (C-q-9), build-a-style/build-a-grammar (C-q-10), and the
statistical-feedback question that changes on the phone (C-q-14), which the
writer flagged for a decision.

**Rulesheet** is the most disciplined on control names (tap cells, press
buttons, turn dials, throw switches, drag loops; the "Nouns used" list in its
notes is the right instinct) but carries an undeclared one-word breach with a
counter that runs one low (C-r-2), the most row/strip leftovers after choosing
strip (C-r-11), and three names for motif-memory's kept bars (C-r-8, C-r-9).
**Claim** has the most within-toy synonyms: band/ensemble, guessing/inventing,
grammar/style, matrix/matrices, and three forms of the possibles tag line.

**The one systemic problem**, in all three: on statistical-feedback the switch
is named memory, the thing it acts on is the ledger, and the layers a stranger
reads first (meta, og, share) say the switch turns the ledger or the books off
or into dice — which the desktop text on the same page denies ("the books are
still kept; selection stops reading them"). Add the books/ledger/debts triplet
and six-vs-seven, and the page whose claim is a comparison is the page whose
two sides are named least consistently. The fix is one rule, applied in every
layer: the ledger is the thing (seven of them), keeping books is the activity,
memory off stops the reading and nothing else, and "debts" goes.
