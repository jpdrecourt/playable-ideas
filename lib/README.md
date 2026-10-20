# lab/lib — shared browser-audio utilities

The common ground of the lab toys: sound, time, and view. Triggering logic (grid
sequencers, Markov walks, phrase engines, free schedulers) always stays toy-side —
the library never decides *when* something fires, only *what happens* when it does
and *how it looks*.

**Charter caveat:** unlike everything else in `lab/`, this directory IS maintained —
existing toys depend on it. Keep changes additive: new voices, new options, new
helpers. Don't change the meaning of an existing call.

Classic scripts, no modules — a toy has to keep working when it is opened
straight off a disk, where module imports are CORS-blocked. Everything lives
under `window.Lab`. Include order (a toy at `toys/<name>/index.html` reaches
the lib at `../../lib/`):

```html
<link rel="stylesheet" href="../../lib/lab.css">
...
<script src="../../lib/audio.js"></script>
<script src="../../lib/clock.js"></script>
<script src="../../lib/voices.js"></script>
<script src="../../lib/samples.js"></script>   <!-- only if the toy loads audio files -->
<script src="../../lib/roll.js"></script>
<script src="../../lib/ui.js"></script>
<script src="../../lib/shell.js"></script>     <!-- after ui.js: start() reports through Lab.ui.status -->
<script src="../../lib/page.js"></script>      <!-- after ui.js and shell.js: it composes both -->
<script src="../../lib/midi.js"></script>      <!-- only if the toy has a MIDI enhancement -->
<script src="../../lib/state.js"></script>
```

`audio.js` stands alone; `clock.js`, `voices.js`, `roll.js`, `samples.js` each need `audio.js`;
`roll.js` auto-subscribes to `voices.js` when present but also works on manual
`push()` alone. `ui.js` depends only on `lab.css` markup conventions —
audio-independent except `masterFx`, which drives `Lab.audio`, and `rack`, whose
standard columns drive `Lab.voices`. `shell.js` needs `lab.css` and `Lab.ui`,
plus `Lab.audio` for `start()` / `arm()`. `page.js` needs both of those and
`Lab.midi` only if a page asks for the badge. `midi.js` stands alone and does
nothing at all where the browser has no Web MIDI.

## audio.js — context + master chain

One persistent AudioContext (created once, never closed) feeding
masterGain → waveshaper drive → glue compressor → [dry + small convolver reverb] →
limiter (−3 dB / 20:1) → destination, plus a shared 0.5 s looping white-noise
buffer. The glue and the shared room keep separately synthesized voices from
sounding dissociated; reverb mix defaults to 0. Glue is one 0..1 amount `g` mapped
to threshold `−30·g` dB and ratio `1+3·g` (0 = transparent, 1 = heavy; the default
0.65 ≈ −19.5 dB / 3:1).

- `Lab.audio.init()` — create everything (idempotent).
- `Lab.audio.ctx` / `.master` / `.noise` — the context, the gain node voices connect
  into (pre-drive), the noise buffer.
- `Lab.audio.resume()` — init + resume; call from a user-gesture handler.
- `Lab.audio.setMaster(v)` (0..1), `Lab.audio.setDrive(amount)` (0..1),
  `Lab.audio.setGlue(amount)` (0..1), `Lab.audio.setReverb(mix)` (0..1 wet gain;
  all callable before `init()`).
- `Lab.audio.fadeOut(sec)` / `fadeIn(sec)` — transport stop/start as a master fade.
  This is how a stop silences events already scheduled inside the lookahead window
  without closing the context.

## clock.js — lookahead scheduling, two levels

- `Lab.clock.createScheduler(fill)` → `{ start(), stop(), running }`. A 25 ms
  setInterval; each wake calls `fill(horizon)` with
  `horizon = ctx.currentTime + 0.15`. `fill` schedules whatever it wants at absolute
  timestamps — this is the free-scheduler level (phrase engines, Poisson processes).
  While the tab is **hidden** the horizon widens to 1.6 s and narrows again on
  return: background timers are throttled to about a second, which starves a
  150 ms horizon and is heard as the audio dropping out on a tab switch. The
  cost is a longer committed future while hidden, which is why it narrows the
  moment the tab is back — a stop is then a master fade over 150 ms of
  in-flight events rather than 1.6 s of them.
- `Lab.clock.createTicker({ periodSec, onTick })` →
  `{ start(startTime?), stop(), running, tickIndex }`. The common tick-walker:
  calls `onTick(n, t, period)` for every tick inside the horizon. `periodSec` is a
  FUNCTION read live once per tick, so tempo sliders alter only ticks not yet
  scheduled — no phase jump. Derived sub-events must be computed from the tick's own
  timestamp `t` (`t + p/2`, `t + offset`), never accumulated separately.

## voices.js — palette + registry + event bus

- `Lab.voices.define(spec)` with
  `{ id, name, color, kind: 'synth'|'render'|'sample', synth?, render?, duration?, sustained?, defaults? }`
  (`sustained:true` = the roll draws this voice at its true duration instead of one
  grid cell — for bowed/drone-like voices):
  - `kind:'synth'` — `synth(ctx, t, semi, dest, stopAt, srcs)` builds timbre-only
    sources into `dest` (no amplitude tail; push started sources into `srcs` so
    voice stealing can cut them). The library wraps it in the ONE shared envelope:
    3 ms attack, exponential decay over `decay` seconds, then pan → master.
  - `kind:'render'` — `render(offlineCtx, out, prng)` builds into an
    OfflineAudioContext of `duration` seconds; rendered ONCE (deterministic — the
    prng is seeded from the voice id), cached as an AudioBuffer. Playback repitches
    via playbackRate; envelope is baked, so no decay shaping.
  - `kind:'sample'` — no synth/render: the voice plays whatever buffer
    `Lab.voices.setSample(id, buffer)` gives it (`Lab.samples` decodes the files),
    repitched via playbackRate under a 2 ms fade-in that declicks an editor's hard
    cut. `setSample(id, null)` empties it again; a voice with no buffer is silent —
    `play` returns `false`, so a toy can run its lanes empty-handed.
  - `defaults`: `{ gain, decay, semi, pan, steal }`.
- `Lab.voices.play(id, when, opts)` — opts
  `{ gain, semi, decay, pan, steal, shade, hold, holdFrac }` over the voice
  defaults. `steal:true` = monophonic per voice id with a 3 ms declick fade:
  the most recent hit that itself asked to be stealable gives way, and a hit
  spawned without `steal` is never in that chain. `steal:'all'` cuts **every**
  voice of that id still sounding, however each was spawned — the whole stack
  goes, for a voice whose new sound clears the present rather than replacing
  its own last hit.
  Returns `true` if it played. Emits `{ time, id, gain, semi, dur, shade, cut }`
  on the bus. `attack` (seconds) softens the envelope's front — synth (default
  0.003) and sample (0.002) voices, not render ones, whose envelope is baked
  into the buffer. `shade` (default 1) is visual-only: the roll block's weight,
  independent of `gain` — a way to mark an event as structurally lighter
  without touching the audio. `hold` (seconds) / `holdFrac` (0..1, fraction of
  the file's own *playing* length — post-repitch, so it scales with the semi
  offset) cut a sample voice short at that point with a 10 ms release instead
  of playing to the end; `holdFrac` wins if both are given. `cut` on the
  emitted event is `true` when a hold actually shortened the hit.
- **Per-voice bus.** Every hit ends
  `env → the hit's own panner → [BUS: StereoPanner → Gain] → Lab.audio.master`.
  The bus belongs to the voice *id*, not the hit, so one fader is the final gate
  on everything that voice sounds however it was triggered. Buses are built on a
  voice's first sound and open at `{ gain: 1, mute: false, pan: 0 }`, so a toy
  that never touches a strip hears what it would with no bus at all.
  - `Lab.voices.setStrip(id, partial)` — `{ gain: 0..1.5, mute: bool, pan: -1..1 }`,
    applied over ~8 ms so a move under a sustaining voice doesn't click. Callable
    **before** `Lab.audio.init()`: the values are held and land when the node is
    first built. Mute is the bus gain going to 0 and nothing else, so unmute
    returns to wherever the fader stands.
  - `Lab.voices.getStrip(id)` → a copy of that strip.
  - `Lab.voices.stripState()` → `{ id: {gain, mute, pan} }` for a save snapshot.
  - `Lab.voices.bus(id)` → the strip's GainNode (built on demand; null before
    `init()`) — for a toy that wants to tap or meter a voice.
- `Lab.voices.subscribe(fn)` — the event bus (the roll listens here).
- `Lab.voices.ensureRendered()` — async; renders all defined render voices. Call
  from the start-button handler before render voices are needed; `play` on an
  unrendered voice returns `false`, it never throws.
- `Lab.voices.get(id)`, `Lab.voices.all()`.

Built-in palette (toys `define` more, additively):

- synth: `kick`, `snare`, `clap`, `hat`, `tom`, `rim`, `cowbell`, `crash`,
  `ride`, `clave`, `shaker`, `pluck`, `acid`. `hat`, `crash`, `ride` and
  `cowbell` are all the same
  six-square metallic bank behind different filters and envelopes, which is
  what makes them sound like one kit; `semi` scales the bank, so the metallic
  family transposes natively.

  `crash` carries a **−12 dB trim inside the voice**, and where it lives is
  the point: `play`'s `gain` *overrides* `defaults.gain` rather than
  multiplying it, and a toy may take `synth` alone and wrap its own envelope
  round it, so a trim in the defaults would reach neither of those callers.
  The figure is an ear's. Rendered alone the voice is only about 5 dB hot
  against the rest of the kit; what it is trimmed for is a 0.9 s wash landing
  on a fast grid, where each hit is still sounding under the next three.
- render: `click`, `tick`, `knock`, `ping`, `thump`, `hum` (`hum` is
  `sustained`), each with its own identity colour.

Also in this file:

- `Lab.prng.create(seed)` → `{ next(), float(a,b), int(a,b), poisson(lambda), seed }`
  (mulberry32); `Lab.prng.newSeed()`.
- `Lab.patterns.euclid(onsets, steps, rotation?)` → sorted step indices.

## samples.js — files as buffers

Decoding and browser-side persistence for `kind:'sample'` voices. Audio arrives
three ways — embedded in the page, fetched from a URL, or dropped by the visitor
— and all three go through one decode, so all three are peak-normalized alike.
Every failure path is silent (null, or a no-op), the same spirit as the state.js
autosave.

- `Lab.samples.decodeBase64(str)` → Promise&lt;AudioBuffer|null&gt; — **SHIPPED
  material, and the way to ship it.** The audio's bytes as base64, out of a
  generated classic `<script>` the page already loaded, with no request made at
  all. This is what makes material survive clone-and-double-click: `fetch` is
  refused at a `file://` origin and a classic script tag is not, so a toy that
  fetches its samples plays synthesized stand-ins for everyone who opens it off
  a disk — silently, since the failure looks exactly like "no samples yet". Call
  it **unconditionally**, never behind a protocol check: one path on every
  protocol beats a tested one and an untested one. Resolves **null** on a string
  the browser cannot decode.
- `Lab.samples.load(url)` → Promise&lt;AudioBuffer|null&gt; — a URL beside the
  page. Resolves **null** on every failure: a 404, an undecodable format, or the
  fetch a disk-opened page refuses outright — which is why this is the wrong
  tool for material a toy ships, and the right one for audio that genuinely
  lives on a server. A toy that keeps synthesized fallbacks stays playable in
  all of those cases.
- `Lab.samples.decode(file)` → Promise&lt;AudioBuffer&gt;, peak-normalized to 0.9 so
  a toy's gain knobs mean the same thing whatever the file was mastered at. Rejects
  on a file the browser can't decode; works before the first gesture (a suspended
  context decodes fine).
- `Lab.samples.peek(key)` → `{ name }` or null — **what is stored, without
  waking the audio.** `restore` decodes and decoding calls `Lab.audio.init`, so
  a page restoring a persisted sample at load builds its AudioContext there,
  which GROUNDING forbids. `take(key)` → `{ name, decode() }` hands back the
  record with the decode behind a call the page makes once a gesture has
  happened: show the name on the lane, decode at the first press.
- `Lab.samples.store(key, file)` / `restore(key)` → `{ name, buffer }` or null /
  `clear(key)` — IndexedDB (`lab-samples`), string keys, one record per key. The
  FILE is what's stored, not the decoded buffer: decoding is cheap and the context's
  sample rate can differ between sessions. Namespace the key by toy
  (`'my-toy:lane1'`). Works from `file://` in Chrome.

Pair it with `Lab.state` by keeping only the *filename* in the toy's params (display
state) and letting IndexedDB hold the audio — a state file stays small and portable,
and arrives on another machine with its sample lanes empty.

## roll.js — grid piano roll

`Lab.roll.attach(canvas, options)` → `{ start(), stop(), push(ev), setOptions(partial),
queued, maxQueued }`.
Auto-subscribes to the `Lab.voices` bus; `push({ time, id, gain, semi, dur })` for
anything else. Scrolling, now-anchored right edge; lane per voice id (color edge +
label); block opacity from gain; rAF loop; devicePixelRatio-aware. Blocks are one
grid cell wide (readable, non-overlapping); `sustained` voices draw at `dur`; an
event with `cut: true` draws clipped to about half its cell — the block's own
mark that the hit was shortened, distinct from `shade` and `gain`.

Options (functions are read live each frame):

- `laneIds` — ordered lane list; default: every voice that has played.
- `lanes` — `{ id: {color, name, mark} }`: **a lane that is not a voice.** Colour
  and name otherwise come from `Lab.voices.get(id)` and nothing else, so a lane
  with no voice behind it — a REST, which is a thing a machine can say and not a
  thing it can play — drew grey, was labelled with its raw id and took the same
  mark as a hit. `mark: 'tick'` is a thin centred line the width of the cell:
  what a silence looks like when it has to look like something.

  **The queue is bounded where it is FILLED** (`maxQueued`, 4096), not only
  pruned where it is drained. `draw` runs on `requestAnimationFrame`, which
  stops in a hidden tab while the scheduler filling the queue does not, so a
  page left open in a background tab grew one entry per event. The oldest go:
  what a returning visitor wants is the stretch of time they came back to.
  `queued` reads the count, because a bound nobody can read is a bound nobody
  can check.
- `labels` — default `true`. `false` draws no lane names at all, for a page that
  names its lanes in a gutter of its own beside the canvas: a name drawn inside
  sits under the oldest blocks. The colour edge stays, and no space is reserved
  for names in either case, since they are drawn over the lane's left end.
- `gridSec` — FUNCTION: the cell duration.
- `origin`, `originIndex` — grid anchor: cell edges sit at `origin + k*gridSec` and
  the cell at `origin` has index `originIndex` (keeps the accent/strong hierarchy
  phased to the toy's tick numbering). Point them at your ticker's latest tick so
  the grid stays honest across tempo changes.
- `accentEvery`, `strongEvery` — heavier gridline every N cells, heaviest every N.
- `pxPerSec` (default 90), `windowSec` (default 8).
- `pitchLanes` — `{ id: { semiMin, semiMax } }`: events of that voice place
  vertically within their lane by `semi`, higher pitch higher.
- `laneCells` — `{ id: N }` (integer ≥ 1): that lane's cell = N × `gridSec`, so a
  voice living on a coarser clock is quantized and sized against its own grid.
- `laneCycleCells` — `{ id: N }` (integer or function, read live): that lane's
  pattern-cycle length in grid cells. Draws a bolder line confined to the lane's
  own strip wherever ITS index wraps back to 0 — lanes of different lengths carry
  their pattern-start marks apart and back together, instead of one shared downbeat.

Draw order: blocks, then gridlines over them, then deviation triangles on top — a
block exactly on its line must not hide the line, or perfect alignment reads as
off-grid.

Display model: each event snaps to its NEAREST grid cell and is drawn cell-aligned;
if it's off-grid beyond ~1 ms it gets a triangle at its onset edge — base on the
cell boundary, apex at the hit's actual time, so inside the block = LATE, outside =
AHEAD (apex capped at half a cell). Microtiming is only human-readable relative to
something; the grid is the something.

`Lab.roll.quantize(t, origin, gridSec)` → `{ cell, snapped, dev }` is exposed for
toys/tests; ties snap to the earlier cell so a held `+gridSec/2` offset reads LATE.

## state.js — toy state save/restore

`Lab.state` — autosave + file save/load, built on RESTORE-BEFORE-BUILD: restore the
snapshot into `params` first, build the controls after (bench factories take their
initial value from params), so no UI syncing exists anywhere.

```js
const saved = Lab.state.restore('my-toy');            // top of the script
if (saved && saved.params) Lab.state.merge(params, saved.params);
// ... build UI from params; masterFx(saved ? saved.fx : {}) ...
Lab.state.attach({ key: 'my-toy', collect: () => ({ params, fx: Lab.audio.getState() }) });
transport.insertBefore(Lab.state.buttons(), spacer);  // Save ⤓ / Load ⤒
```

- `merge(params, saved)` — **`params` is the schema.** Objects merge, scalars and
  arrays replace, and a key `params` does not hold is dropped at every depth, so a
  snapshot from an earlier shape of the page cannot plant a key that `collect`
  then writes back forever. A dictionary declared empty therefore restores
  nothing: fill `params.strips` with one `{ gain, mute, pan }` per rack row key
  before merging. An array's contents are not looked at — a page normalises what
  it indexes into blind. Checked by `node lib/state.check.js`.

- `attach({key, collect, everyMs?})` → `{ save(), stop() }` — polls every 1 s by
  default and writes `localStorage['lab:<key>']` when the snapshot changed.
  Keep the handle: the poll is otherwise a permanent background write loop with
  no way out, which is not a thing to leave running on a public page.
- `restore(key)` → saved object or null.
- `open(key, url?)` → Promise of **what the page opens on**, and it never
  rejects: the `localStorage` session if there is one (a returning visitor
  keeps what they did), otherwise the toy's shipped default fetched from `url`
  (`'default.json'`, beside the page), otherwise `null` — the page's factory
  parameters, which is the bare instrument. The default is checked with
  `whyNot` like a loaded file: one naming another toy is refused and the
  refusal is said on the status line. A default that cannot be read — a
  `file://` origin refusing the fetch, a 404, a body that is not JSON —
  resolves `null` and says so once, as a warning (`default.json could not be
  read — opening on the bare page`), because a fallback that says nothing is
  how the `file://` defect in `GROUNDING.md` survived. The fetch revalidates
  (`cache: 'no-cache'`): a default that changes on deploy is exactly the file
  a warm cache holds. Checked by `node lib/state.check.js`.

  A page opening on its default wraps its whole script in the callback, and
  the `restore` line becomes the callback's parameter:

  ```js
  Lab.state.open('my-toy').then(function (saved) {
  // The page body is NOT re-indented under this wrap: a one-change re-indent
  // of a long script destroys the history of every line in it.
  if (saved && saved.params) Lab.state.merge(params, saved.params);
  // ... the whole page, built from here ...
  });
  ```
- `buttons()` — Save ⤓ (showSaveFilePicker, download fallback) / Load ⤒ (writes
  localStorage, reloads the page — the restore path does the rest).
- **A saved file names its toy**: Save writes `"toy": "<key>"` first, and Load
  refuses a file that names another toy, saying which on the status line
  (`whyNot(parsed, key)` → the sentence, or null). Every toy's file is the same
  shape from outside and `merge` drops what a page does not hold, so another
  toy's file would otherwise load as a tempo over an empty instrument. A file
  with no `toy` is taken on trust. A `default.json` carries the tag like any
  saved file. Checked by `node lib/state.check.js`.
- Keep `def:` on controls as FACTORY defaults, not restored values — double-click
  must reset to the toy's design, not to the last session.
- `Lab.audio.getState()` → `{master, drive, glue, reverb}` for the fx half.

## lab.css + ui.js — the standard bench

The shared look and controls, extracted from somitsu-grid (with the rotary knob
visuals from somitsu-circles). A few hours of lab bench so every new toy starts
playable and consistent instead of re-inventing sliders.

**The design brief is `../DESIGN.md`.** It owns the surface: how a page is
laid out, what a control owes a hand, when a toy may have a surface of its own,
the interaction grammar, the visual rule and the one named breakpoint. This
file owns the components — what a factory takes and what it returns — and says
nothing about placement that `DESIGN.md` has not already said. Where the two
disagree, `DESIGN.md` wins and the difference is reported.

**The reference page is `toys/motif-memory/`.** It is a *picture* of
`DESIGN.md`, not its source: a new toy matches it and deviates only where its
own mechanism forces it, and where the page and the brief differ, the brief
wins. New toys are built from `toys/_template/`, which is the brief laid out.

Page skeleton (`lab.css` classes): `.wrap` > `h1` + `.sub` blurb + `.bar`
rows + `.lane` rows (+ `.muted`; optional fixed-width `.lc` cluster with
`.lc-r1`/`.lc-r2` before a `canvas.tl`) + `canvas.tl` + `.hint` footer with
`kbd`/`code`. A `.rackwrap` > `.rack` > `.rrow` block (`Lab.ui.rack`) is a row
per voice and carries its own panel per row, so it goes straight into `.wrap`
rather than inside a `.bar`. `#status` renders as a fixed toast.

**Bar layout:** a published page does not assemble its bars by hand —
`Lab.page` builds the master strip and the session bar in the order
`DESIGN.md` sets, and a toy declares their contents. What is left to a toy is
grouping *inside* a bar: clusters of related dials (`.ctl`-wrapped gates,
knobs) separated by `.sep`, one cluster per concern. A lab toolbar that is not
a published page still builds `.bar` rows itself, and the classes above are
what it uses.

`Lab.ui` factories — all return a DOM element with a `.set(v)` method for
external sync, and all fire `onChange(v)` on every change *including once at
creation* (so building the UI also applies its initial values — UI and engine
can never start disagreeing):

- `Lab.ui.knob({label, min, max, step, value, def, fmt, onChange, fine?, hint?})` —
  rotary knob (`.knob-wrap`): tiny uppercase label, pointer −135°..+135°,
  `.val` readout via `fmt`. A full-range drag is 130 px for a mouse and twice
  that for a finger (read from the pressing pointer's `pointerType`), and `fine`
  multiplies either. Reachable by
  **Tab** and turned by the **arrows** (Page / Home / End too, Shift for a tenth
  of the range), `role="slider"` with the aria value pair — the same keyboard
  `dial` has, because a published page has no control a keyboard cannot reach,
  and `rack` builds its own gain knobs where no toy could patch them. `.face` is
  the round element itself.
- `Lab.ui.dial({label, min, max, value, step?, taper?, fmt, onInput?, fine?, color?, hint?})`
  — **the touch-first rotary**, and the one to reach for on a page a stranger
  will meet: a 56 px face (64 on a coarse pointer), name above and value below,
  `role="slider"` with arrow / Page / Home / End keys, and `taper:'log'` for
  anything spanning decades. A full-range vertical drag is 160 px for a mouse
  and 320 px for a finger, about 5 cm on a phone, so a short swipe does not
  throw half the range; `fine` multiplies either. `knob` remains the dense bench control for a lab
  toolbar; the two are not interchangeable and neither replaces the other.

  Three differences from `knob` that are design, not detail:

  - **`onInput`, not `onChange`, and it never fires at creation.** A dial
    belongs to a surface pointing at state that lives elsewhere, so the traffic
    runs the other way: the engine is read into the dial with `.show(v)`, which
    renders and calls nothing back. A control that fired on creation or on
    every refresh would write the value it was only meant to display, and two
    dials mirroring one parameter would drive each other.
  - **`.retarget({label, min, max, step, taper, fmt, hint}, value)`** points the
    same element at a different parameter — new name, new range, new taper, new
    readout — and displays the new target's stored value. The element survives,
    so keyboard focus and any binding held against it survive. `p` replaces the
    scale rather than patching it: an omitted `step` or `taper` means continuous
    and linear, not "keep the last parameter's".
  - **Position is the authoritative quantity**, 0..1 across the throw; the value
    is what the position means. Hence `.setPos(n)` / `.pos`, which is what a
    0..127 MIDI CC and a taper both want.

  **`readOnly: true`** (and `.setReadOnly(v)`) is the fourth difference and the
  one a rack needs: a dial built as a VIEW of state living elsewhere still moved
  under a drag and reported the move to nobody, which is a control that moves,
  changes its readout and produces nothing. Read-only is inert to drag and key,
  out of the tab order, `aria-readonly` with no `aria-disabled`, at full ink,
  and wearing a face that reads as a GAUGE — a dashed ring, no hover. It is not
  `setDisabled`, which dims to 45% and says disabled: both wrong for a live
  readout nobody may touch and everybody must read. It swallows no key, and
  `.show(v)` still writes it.

  Also `.setLabel(name)`, `.setDisabled(bool)`, `.value`, `.face` (the round
  element itself, for a per-instance `--dial-hue`).
- `Lab.ui.miniRange({label, min, max, step, value, def, fmt, onChange, onDefault?, val?, hint?})` —
  the compact labeled range (`.km`); `val:true` adds a visible readout.
  `onDefault` is the dial's gesture on a slider: a clean double press with no
  travel, reported rather than answered, for a surface where "default" belongs
  to the thing addressed and not to the control. Omit it and the double press
  resets to `def`, as before. `.show(v)` is the display-only twin of `.set(v)` —
  it renders and calls nothing back, which is what a mini-range needs to be a
  view of state living elsewhere.
- `Lab.ui.gate({value, def=1, onChange, left?, right?, width?, hint?, label?})` — the Bernoulli
  probability bar; pass the toy's own `def` when the resting probability isn't 1.
  The ends read **low** and **high** unless the toy passes its own `left` /
  `right`. Each word and the percentage sit on a black chip, so the fill edge
  never splits one black-and-white. The default 104 px is the narrowest bar
  where those chips and a centred `100%` sit apart, so a narrower `width` wants
  shorter ends.
  Reachable by **Tab** and moved by the **arrows** (Page / Home / End too, Shift
  for a tenth), `role="slider"` with the aria value pair — the same keyboard
  `knob` and `dial` answer, because a hand learns the grammar once. `label`
  names it for a screen reader, and `Lab.ui.inline` supplies that name when it
  is the wrapper carrying it.

  `hint` (all three) is the parameter's one-line explanation, carried on the
  wrapper so the hover explains the dial wherever the pointer lands. The
  tooltip never repeats a value that is already visible — knobs and gates
  show theirs beside the control, so their tooltip is the hint alone; only
  the mini-range leads its tooltip with the live value, because without
  `val:true` it has no other readout. **Every factory writes `hint` to both
  `data-hint` and `title`**, so one line serves a lab toolbar's native tooltip
  and a published page's `Lab.shell.hints` layer without a toy copying it
  across — and a native tooltip renders on no touch screen at all, so a hint
  carried only in `title` is a hint half the visitors cannot reach. A rack of
  eight voices builds its own gain, pan and mute controls, which no toy can
  reach in to patch.
- `Lab.ui.dot({text, title, on, onToggle, kind})` — 20 px square toggle;
  `kind: 'm'` mute-amber, `'s'` solo-green, omit for neutral.
- `Lab.ui.confirm({text, armed?, hint?, onConfirm, onArm?, holdMs?})` — **the
  two-press destructive button.** Arms on one press and acts on the second,
  wearing `armed` on its own face (amber, `button.armed`): the arming state IS
  the confirmation, rather than a dialog nobody reads. Both faces' text is
  supplied, because "clear" and "clear — sure?" are the toy's words about the
  toy's own irreversible act — and either may be a **function of the moment**,
  for a chip whose resting face is a live name. `onConfirm` runs BEFORE the
  repaint, so the face the button falls back to is the one the act left behind. `onArm` may return `false` to refuse the arming
  outright, for the press that has nothing to destroy. Returns the button with
  `.disarm()` and `.armed`. **Disarmed by any write in between** — `Lab.page`
  does that for a confirm it lays out in the session bar, treating a press, an
  operating key or an input anywhere in the armed region as a write. It listens
  on CAPTURE, or the rack's declining cells would stop the event before it
  arrived, and the control most likely to be touched between the two presses
  would be the one that could not disarm. It watches a confirm **wherever it was
  laid out** — the session bar, the stage, the globals, the controls, and inside
  any panel among them — because where a confirm sits is not part of the rule
  that a write disarms it; `page.watchConfirm(el)` adds one built later. A press
  on the confirm itself is not a write, or a confirm inside the armed region
  would disarm itself on its own second press. Call `.disarm()` by hand only for
  a write from somewhere the armed region does not cover: a MIDI message, a file
  load, a timer. `holdMs` (default 5000)
  disarms it on its own, because a button left armed across a coffee break is
  a button whose next press is a surprise.
- `Lab.ui.panel({title?, note?, hint?, label?, className?})` → `section.blk`
  with an `h2.blk-head`: **the collection's one shape for a titled box holding
  one thing.** `title` is the bold half, `note` the sentence after the dash.
  Content goes straight into the returned section, which also carries `.head`
  and `.setHead(title, note)`, which takes **Nodes as well as strings** — a head
  carrying a swatch, a witness mark or an italicised name had to be assembled by
  appending to `.head`, so the one call that builds the shape was the one call
  such a head skipped. Two toys invented this independently before it
  lived here — virtualisation's `.panel-head`, markov's `.blkhead` — and both
  keep their own names; everything new takes this one.
- `Lab.ui.ctl(labelText, el, hint?)` — the `.ctl` label-above-control wrapper
  for bars; `hint` puts the same explanation over the label.
- `Lab.ui.inline(labelText, el, hint?)` — the `.ictl` label-BESIDE-control
  wrapper: the row-wise sibling of `ctl`, carrying the same tiny `.kl` label a
  knob keeps next to its dial. For naming a control that has none of its own (a
  gate, a `.dot`) so it reads as a sibling of the knob beside it rather than as
  an anonymous bar. Forwards `.set(v)` to the control it wraps, and hands the
  label to that control as an accessible name where it has a role and none of
  its own — the name is the point of the wrapper, and a screen reader should
  get it too.
- `Lab.ui.status(msg, warn?)` — fixed toast, 3.2 s auto-clear (auto-creates
  `#status` if the page has none).
- `Lab.ui.masterFx(opts?)` — **the standard master box**: four knobs — MASTER
  (def 0.9), DRIVE (0), GLUE (0.65), REVERB (0.15) — wired to
  `Lab.audio.setMaster/setDrive/setGlue/setReverb`, each carrying its standard
  hint. `opts` overrides initial values (dbl-click still returns to the
  standard defaults); creation applies them to `Lab.audio`. Returns a DocumentFragment to drop into a `.bar`
  (`.knobs` holds the four wrappers, addressable before insertion).
- `Lab.ui.rack({rows, columns, state?, onStrip?, onRow?, onRename?, labelWidth?})`
  — **the per-voice row rack**: one row per sound source, one ordered column
  list for the whole rack, so the columns line up down the page whatever each
  row happens to fill. **A mixer is a rack whose columns are only strings** —
  that is the whole idea.

  ```js
  Lab.ui.rack({
    rows: ['kick', 'knock', 'hum'],            // or [{key, voice, name?, color?}]
    columns: [
      'name', 'mute', 'gain', 'pan',           // STANDARD — the library owns these
      { key: 'density', width: '150px',
        cell: c => Lab.ui.inline('density', Lab.ui.gate({ … }), hint) },
      { key: 'pad', width: 'minmax(0,1fr)' }   // no cell() — a pure spacer track
    ],
    state: params.strips,
    onStrip: (key, strip) => { params.strips[key] = strip; }
  });
  ```

  **Rows** — a string is shorthand for `{key: id, voice: id}`. A row with no
  `voice` renders nothing in `mute`/`gain`/`pan`; the tracks stay, the cells are
  empty, the rows still line up.

  **Standard columns** write to that voice's bus via `Lab.voices.setStrip`,
  which makes `rack` the second audio-touching factory here:

  | key | cell | default width |
  |---|---|---|
  | `name` | `.rname` swatch + name; `{key:'name', edit:true}` gives an `input.vname` firing `onRename` | `auto` |
  | `mute` | `.dot` `M`; also toggles `.muted` on the row | `20px` |
  | `gain` | knob 0..1.5, def 1, `%`, labelled **`level`** | `auto` |
  | `pan` | mini-range −1..1, def 0, `L/C/R` | `128px` |

  **Toy columns** are `{key, label?, width?, align?, span?, cell(ctx)}` with
  `ctx = {key, voice, index, spec}`. `cell()` returning `null` is an empty cell;
  a column with no `cell()` and a non-standard key is a spacer track. A toy
  column may be *named* `mute` or `gain` without being the standard one — supply
  a `cell` and you own the semantics.

  **Labels.** A rack cell that has no label of its own gets one from
  `Lab.ui.inline`; there is no header row. `labelWidth:'fit'` (the default)
  counts characters across every `.kl` in the rack and sets `--rack-kl`, so
  knobs and gates sharing a column align on their **faces** rather than on their
  label text. Pass a CSS length to fix it, or `false` to switch the rule off.
  `mute` is deliberately unlabelled — `M` in a 20 px square is a glyph the bench
  has already taught.

  **Captions.** A column carrying `caption` (plus optional `captionSpan` and
  `captionHint`) puts a heading row above the rack, each label placed on the
  component's own **named track lines** so it stays locked to its column
  however the rows below it are filled. `caption` is a string, a **Node** or a
  function of `{key, group}` — a heading of bare names asks a visitor to match a
  hue against a row label before they can play, and a swatch is a node.

  **A row may open a GROUP**: `{key, …, group: {caption: {colKey: …},
  captionHint: {…}}}` puts a second caption row immediately above that row,
  overriding the column captions it names and keeping the rest. A rack of two
  matrices whose columns mean different sounds in each needs a heading per
  group, not one for the whole rack. A Node used in a second caption row is
  **cloned** — one element cannot be in two places — so pass a function where
  you want two live nodes. `.caption` is the first row, `.captionGroups` the
  rest. It is for the case a cell cannot
  cover — the columns meaning something no single cell says, a category grid,
  a unit. Leave it off and there is no row at all, which is right for a mixer,
  where every cell names itself. The row is `.rrow.rcap`, reachable as
  `.caption`.

  A captioned rack is also announced as a **table**: the caption cells become
  `columnheader`s, the rows become `row`s and the cells `cell`s, and `label`
  gives the table its name. Without a caption the roles are not applied at all
  and the rack stays the plain div grid it has always been — a `columnheader`
  needs a table to be the header of, and a rack with no captions is a list of
  voices rather than a grid of columns that mean something.

  **A column given as a string** must be one of the four standard keys. A
  string the component does not know **throws**, naming them — `level`, the
  word `DESIGN.md` uses for the column whose key is `gain`, used to become a
  silent spacer track and ship a rack with no level control. A spacer is an
  object with a key and no `cell()`.

  **Declining the arm.** `decline: true` (or
  `{says(kind, name), wrap(reason), sentence(kind, name), answer(text), block?}`)
  makes the standard `mute`/`gain`/`pan` cells **answer a cold hand** —
  declining in silence is the broken-page reading — and, unless `block: false`,
  puts them outside the start gesture through `Lab.shell.declineArm`. The
  answer fires only for a key that OPERATES the control
  (`Lab.shell.isArmKey`), never for Tab, which only travels.

  **A confirm built inside a cell is collected** as `.cellConfirms`, which
  `Lab.page` routes through `watchConfirm`: a `cell()` result is in none of the
  lists the composition sweeps, so such a chip used to ask by hand.

  **The cell context carries `dim`** — `cell(ctx)` runs before the row is
  registered, so `ctx.dim(true)` is held and applied the moment the row exists.

  **A column may declare that it ASKS for sound**: `{key, cell, asks}`, where
  `asks` is `true` or — like `decline` — **a function of the cell's context**,
  because whether a cell asks for sound is a fact about its ROW. A rack whose
  last row is a label rather than a voice has one cell in that column that plays
  nothing, and a plain flag would make an arm root of it: a press on a label
  would start the audio and sound nothing, the broken-page reading with the
  marks reversed.

  It is the opposite of declining and it needs its own mark: a name button that
  plays its voice is the one thing in the instrument that DOES start it, and
  without one the composition's blanket cold-hand answer paints "the instrument
  is stopped" over an instrument the press has just started. Every cell that
  asks is marked `data-pp-asks` and collected as `.asksCells`, which `Lab.page`
  routes through `page.asksCell`.

  **A toy's own column may decline too**: `{key, cell, decline}`, where
  `decline` is a reason — a string, or a function of the cell's context. A
  function returns **`false`** for a row that does not decline: that cell is
  then unmarked and the page's region answer covers it. An **empty reason is a
  build error** naming the row and the column, because a marked cell is skipped
  by the region answer, so an empty one leaves a press with nothing at all —
  the failure the machinery exists to prevent, reached from the other side. A rack
  whose level is a console law over the toy's own output gain cannot use the
  standard column at all, and was writing the block, the key filter, the
  delivery and the quiet-once-started by hand for every cell it built. It works
  **with or without a rack-level `decline`**: a bench page using `rack` outside
  the composition gets the block, the mark and an answer in the status toast,
  because a column that asks to decline and is silently ignored ships a level
  that arms the audio and says nothing.

  **One sentence, one owner per half.** `says` returns the REASON; `wrap` adds
  the remedy, which is where the gesture phrase lives. `sentence(kind, name,
  reason)` is the way out for a toy that wants the whole string, and it takes
  the gesture phrase with it — two copies of one clause is how they drift. It
  covers **every** column, a toy's own as well as the standard ones: honouring
  it on one kind and not the other gives one rack two sentence shapes, which is
  the same drift one level down. The reason is passed through, so a toy owning
  the sentence still has its own words inside it.

  `.declineTexts` is every answer the rack can produce, as
  `[label, () => text]` pairs — what `Lab.page` measures when it reserves the
  space they are painted into.

  The two are separate duties. The answer is always owed. The **block** is
  worth its cost only where an unlock is listening: on a page with a transport
  the instrument is not an arm root, so stopping the gesture there defends
  against nothing while swallowing every window-level key a focused cell sees.
  `Lab.page` sets `block` accordingly — on for an arm page, off for a transport
  page — and routes the answer into the start line. Either way the cell is
  marked `data-pp-decline`.

  The whole option is **off by default**, because a bench page whose rack is not
  inside an armed region wants neither half.

  **A dial cell lies down**: `.rack .dial-wrap` is a row — label · face ·
  readout on one line, or eight rows become eight cards. The three numbers a
  toy varies are custom properties on `.rack`: `--rack-dial` (36px),
  `--rack-dial-label` (7.5ch), `--rack-dial-val` (6ch). The label and the
  readout keep FIXED widths with the face between them, which is what aligns
  the faces down a column and what stops a readout growing a character from
  shifting every column after it mid-drag.

  **Returns** the `.rack` element with `.set(key, partial)`, `.row(key)`,
  `.cell(key, colKey)`, `.dim(key, on)` and `.caption`. `onStrip` fires once
  per row at build carrying the whole strip, then on every change. Drop it in a
  `div.rackwrap` so a narrow screen scrolls instead of reflowing — column
  alignment *is* the component. Track lines are named (`gain-start`,
  `rate-end`, …), so a toy can place its own decoration across a range of
  columns without the rack owning the concept.

  It does **not** do two-row lanes, spanning annotation bands, vertical strips,
  solo, or a shared ruler row. Canvas-native rows should never migrate to it.

### The two gains and the two mutes

The most dangerous thing on this bench: **the same knob labelled `vol` and the
same dot labelled `M` mean two different things depending on what they are wired
to**, and nothing in the UI distinguishes them.

| | acts on | when it bites |
|---|---|---|
| **strip gain / mute** (`Lab.voices.setStrip`) | the voice's output **bus** | immediately, over an 8 ms ramp, **including tails already ringing** |
| **event gain / generator mute** (a `play({gain})` multiplier, or `if (mute) return` in the scheduler) | the **scheduler** | only hits scheduled *after* the move; a ringing tail is untouched, and a muted voice schedules nothing at all — so **nothing draws on the roll either** |

`rack`'s standard `gain`/`mute` columns are the **bus** kind. A toy that wants
the generator kind supplies its own column with the same key and its own `cell`,
and calls `rack.dim(key, on)` to grey the row without touching the bus — that is
exactly what `rack.dim` is for.

## shell.js — the page frame a public toy wears

The bench above is a workshop. `Lab.shell` is what a stranger meets: the things
every published page needs and no toy should hand-write again.

The head carries one obligation of the same kind: the collection's icon lives in
`lib/icon` and every page links it with the five tags `toys/_template/` carries,
so a toy never draws its own.

- `Lab.shell.frame({title, shows, spec?, repo?, site?, licence?, invite?, home?, mount?})`
  → `{h1, sub, invite|null, footer}`. Inserts the nameplate at the top of the mount
  (default `.wrap`) and the footer at the end, and sets `document.title`.

  `shows` is a string **or a Node** — pass a fragment where the blurb leans on
  one italicised word, rather than rewriting the element the shell made.

  **The nameplate is the reference page's**: an `h1` and a `p.sub`, direct
  children of `.wrap`, under `lab.css`'s own two selectors and with no shell
  class of their own — which is to say the exact markup
  `toys/motif-memory/` hand-writes. The spec link reads **spec for builders ↗**,
  so a phone visitor knows before the tap that it opens a technical document,
  and carries a hint. It rides inside the `h1`,
  a baseline flex row, so it costs the line nothing where title and link fit
  side by side (on a phone a long title sends the link whole to a second line); a scratch copy of the
  reference page wearing the shell lands `h1`, `.sub` and the first `.bar` on
  the same pixels as the page itself.

  **The footer** is one quiet line in the `.hint` register the reference page
  already ends on: all toys · spec · source · site · licence. **All toys** links
  back to the toy list, `../../` from a toy page; `home:` points it elsewhere and
  `home: false` drops it. The **invitation** exists
  only when the toy passes `invite:` a non-empty string, and `invite` is null
  otherwise. The library has no invitation text of its own: the front page
  tells a phone visitor once that the toys are built for a large screen. It
  shows below the teaser width, and on a page with a teaser the composition
  moves it from the head to the teaser's foot.
- `Lab.shell.share({text, url?, label?, hint?})` → `{el}`. A bench
  button labelled **Share** that hands the page's link to the phone's share
  sheet (`navigator.share` with `document.title`, `text` and the url, where it
  exists and `canShare` agrees). Where there is no sheet it copies the link
  (`navigator.clipboard.writeText`) and the toast says `link copied`; where
  neither exists the toast carries the URL itself. A share the visitor closes
  (an `AbortError`) is silent; any other rejected share falls through to the
  copy. `url` defaults to `location.origin + location.pathname` — no query,
  no hash, no state in the link, and nothing collected. The button carries its
  own `data-hint`. `Lab.page` places it at the foot of a declared teaser
  (`teaser.share`); a page without one may place it itself.
- `Lab.shell.feedback({endpoint?})` → `{el, field, send}`. **One text field
  to the maker**: a `form.pp-feedback` holding a three-row textarea
  (`field`), a hidden honeypot and a **Send** button. **The page sends
  nothing unless the visitor presses Send, and then nothing but the message
  and the page's own URL**, posted as JSON `{message, page}` to `endpoint`,
  which defaults to the collection's one Formspree form, `FEEDBACK_ENDPOINT`
  at the top of the share and feedback section of `shell.js`
  (`https://formspree.io/f/mwlvdvyy`). The guard stays for a site that copies
  the component: an endpoint still holding the `FORM_ID` placeholder warns
  once at build, and a Send says `not wired yet` instead of fetching. An empty field sends
  nothing and takes the caret back; a filled honeypot (`_gotcha`, off-screen
  rather than `display:none`, which bots skip) looks like a success and sends
  nothing. In flight the button reads `Sending…` and the field is read-only;
  a success clears it and toasts `sent, thank you`, anything else toasts
  `not sent; try again later` and keeps the text. Ctrl+Enter or Cmd+Enter in
  the field sends. **The field keeps its keys**: a key typed in it stops at
  the form, so no window-level shortcut a toy binds hears it, whether or not
  that toy checks for a text field. `send()` is the Send press without a
  press. `Lab.page` places it on every page; `feedback: false` drops it.
- `Lab.shell.start({button, onStart, onStop, labels?})` → `{el, running, blocked, press(), stop()}`.
  The **audio start gesture**, Ciechanowski-style: no modal "click to begin",
  the first press on the instrument is the unlock, so the toy's own transport
  button is what you pass. What it adds is the CHECK — `resume()` returns a
  promise, and a rejected or still-suspended context is indistinguishable from
  playback with the volume down, so the button says "tap again" and the toast
  says why. It also claims `navigator.audioSession.type = 'playback'` where
  that exists (without it, an iPhone with its ring switch off is silent with no
  explanation, which is the single most common "doesn't work on my phone"),
  and it watches for a later `statechange` — an interruption otherwise leaves a
  transport reading *playing* over silence. It constructs the context inside
  the handler and never at load.
- `Lab.shell.arm({root, onStart, onBlocked?})` → `{armed, disarm(), add(root)}`.
  `add` takes a root after construction, for a control built later than the
  gesture — a rack cell that asks for sound on a page whose instrument is not
  itself a root. The same
  gesture for a page with **no transport**: the first `pointerdown` anywhere
  inside `root` — one element, or an **array** of them, because the armed
  region is not always one box: the stage and the rack are contiguous, and the
  globals that ask voices for sound sit up in the master strip among controls
  that must not arm — unlocks the audio, and it is the same press that grabs the knob
  it landed on. A **key that operates something** (Enter, Space, an arrow, Page,
  Home/End — not Tab, which only travels) and a **click** count as the same
  gesture, because a pointer is not the only hand a bench control answers to:
  every dial here is focusable and arrow-driven, and a page telling a visitor
  to tab to a dial and turn it must not then meet that with silence. All three
  are user activation, which is what `resume()` needs; `pointerdown` is the
  commonest shape of it, never the requirement.
- `Lab.shell.isArmKey(e)` — is this a key that OPERATES a control (Enter,
  Space, an arrow, Page, Home/End) rather than one that only travels (Tab)?
  Exported because everything reasoning about "did this hand try to play the
  control" has to reason about the same set: a declining control that answers
  on every keydown answers on Tab, and hijacks the start line once per row for
  the one navigation Tab exists for.
- `Lab.shell.declineArm(el)` — for a control that sits INSIDE the armed region
  and must not start the audio: an output level, a mute, anything that is not a
  voice. It stops every event `arm` listens for — and **only** those: a keydown
  that is not an arming key travels on, or the control becomes a hole in the
  page's keyboard and a toy's own window-level keys die while it holds focus.
  At that element, on the bubble, so the control still works and `hints` still
  answers. It marks the element `data-pp-decline`, so anything reasoning about
  the page can tell a declining control from a playing one. Use it rather
  than stopping `pointerdown` by hand: an opt-out that names the events itself
  falls behind the moment `arm` grows another one, silently, on the one control
  that was supposed to stay quiet. **Or the moment a CONTROL grows one**: every
  bench control is now keyboard-operable, so a hand-rolled
  `stopPropagation` on `pointerdown` alone stops being an opt-out — the arrow
  keys walk straight past it and start the audio from a fader. Declining is half of what such a control
  owes a hand; the other half is an ANSWER naming one that does start it, or a
  visitor gets a knob that moves, a readout that changes, no sound, and the
  same instruction still on screen. Nothing is swallowed or `preventDefault`ed — an instrument whose
  controls are all live before the sound exists must not spend a first click on
  nothing. It listens on the **bubble** phase, so `hints` still stops the gesture
  at capture and inspecting a control never starts the audio. Same check as
  `start()`: `claimPlayback`, `init`, `await resume()`, then `ctx.state ===
  'running'` — on failure it stays armed and calls `onBlocked`, because a second
  press is a second user gesture and on iOS that is routinely what it takes.
  `onStart` runs once; a later interruption re-arms, so the next touch picks the
  audio back up.
- `Lab.shell.hints({mount?, label?})` → `{el, set(on), refresh(), on}`. A "?"
  toggle, then **tap anything to read what it does**: one bubble at a time,
  clamped to the viewport, sourced from `data-hint` attributes. Revealing every
  hint at once was tried and is unreadable — thirty overlapping bubbles at
  phone width, half of them off the edge. One at a time also buys what no
  tooltip can on touch: while the mode is on, a press on a hinted control is
  swallowed — the press, the **release**, the click and the **right press**
  alike. A control whose gesture completes on the `pointerup` (any tap that has
  to tell itself from a drag or a hold) otherwise acted while the bubble
  explaining it was on screen, and a control whose second gesture is a context
  menu (a cell that clears on a right press) was the one route left past the
  layer. So a visitor can ask what Play does before pressing Play. Hover
  shows the same bubble for a mouse, and every hint is mirrored into `title`.
  `show(el)` puts the bubble on a control nobody pressed — what a key standing
  for a press needs — and `hide()` takes it away.

  **Put `data-hint` on controls, not `title`.** Native tooltips do not render
  on touch devices at all, so a hint carried only there is a hint half the
  visitors cannot reach.
- `Lab.shell.env` — `.coarse`, `.small`, `.midi`, `.reducedMotion`, `.teaser`,
  `.teaserQuery`. Capability queries, not device sniffing. `.teaser` is **the
  collection's one named breakpoint**, read live from `lab.css`'s `--teaser`
  rather than copied: prose that names a position ("the dial below the rack")
  asks here, and `.small` is `matchMedia(.teaserQuery)`.

  `lab.css` declares `--teaser` once, uses no other width of its own, and
  carries two literals of the number, side by side at its foot: the `@media`
  block and its negation (the phone's rules, then `pp-phone`'s hiding above
  the width), which exist because a media query cannot read a custom property
  and CSS has no "else" for one. `shell.js`
  carries a second, as the documented fallback for a page whose stylesheet did
  not load. Beyond the library, `toys/vagalume/` and `toys/virtualisation/`
  each still hard-code `720` in a media query of their own — a drift for their
  next round, not something the library can fix from here, and the reason this
  paragraph counts rather than claims.

## page.js — the composition a toy declares

`Lab.shell` is the edges of a published page; `Lab.page` is what goes between
them, which is the **order**. A toy declares its master strip, its stage, its
rack, its globals, its session controls, its text and its keys; it does not lay
them out and it does not choose the order, because the order is the
collection's (`../DESIGN.md`, "The page, top to bottom"):

> nameplate → master strip → start line → **instrument** → session bar →
> standing text → keys → feedback → footer

`Lab.page.build(decl)` builds all of it and returns the regions. New toys start
from `toys/_template/`, which is a complete page with no mechanism built this
way; read it beside this section.

```js
const page = Lab.page.build({
  title, shows, spec, repo, site, licence, invite,   // → Lab.shell.frame
  mount: '.wrap',

  master: {} | false,          // masterFx opts, or no master chain
  bpm: Element | { el?, says?, sentence?, min, max, def, value, hint, onChange,
       control?: 'dial', taper? } | false,   // any control, any unit
  transport: { onStart, onStop, labels?, hint? } | false,   // false ⇒ arm; binds Space
  controls: [Element | {el, says?, sentence?}],   // SHAPE — they decline
  globals: [Element],          // toy-global buttons that ASK — they arm
  midi: { onEnable } | false,  // the badge, absent where Web MIDI is not
  hints: true,
  status: () => 'walking · 12/81 cells set',   // or true, or false

  start: {
    gesture: 'Tap a cell of the matrix',      // the phrase every answer ends on
    state: () => 'nothing' | 'stuck' | 'shut' | null,
    words: { notStarted, nothing, stuck, shut, running, blocked },  // ALL FIVE
    everyMs: 200, signpostMs: 6000, keyboardNote: true,
    instrumentSays: '…',        // a transport page's whole-instrument REASON
    instrumentSentence: '…'     // …or the whole string, remedy included
  },

  instrument: 'rack' | 'stage',               // which of the two comes first
  stage: [Element | [Element, …]],        // an inner array is a ROW
  stageMin: '460px',                      // where a row stacks (default 420px)
  rack: { rows, columns, state, onStrip, declineWords? } | false,
  session: [Element],
  text: [{ head, body }] | string | false,   // false lays out no block at all
  paint: [fn],                               // run on every repaint of the page
  writeKeys: ['Escape', {key:'KeyA', el: writeBtn | (() => el)}] | (e => bool),
  keys: '<kbd>?</kbd> …',
  onStart: () => {},                          // after the arm confirms audio

  feedback: { endpoint? } | false,            // the field before the footer; on by default

  teaser: {                                   // the phone mode — see below
    controls: [Element | { el, hint? }],      // one or two, built by the toy
    stage: true | false | [Element, …],       // which stage members the phone keeps
    gesture: 'Press a walker',
    words: { notStarted?, nothing?, stuck?, shut?, running? },
    invite: '…',
    share: { text: '…', url? } | false,
    text: false | '…' | [{ head, body }]      // the phone's standing text; default none
  }
});
```

**Five things it owns**, and the reason each is here rather than in a toy:

- **The repaint.** `page.onPaint(fn)`, or a `paint` list in the declaration.
  **A rack cell that is a VIEW is repainted by the page, not by the toy's frame
  loop**: the page's poll already stops when the tab is hidden and restarts when
  it is back, and a readout that joined a `requestAnimationFrame` loop instead
  either keeps running unseen or freezes with whatever else is in that loop.
  Subscribers run outside the signpost guard — a signpost holds the sentence,
  not the instrument — and one that throws is reported once and keeps its place.
- **The stage.** A member of `stage` that is an ARRAY is a **row**: its members
  sit side by side where there is room for all of them at `stageMin`, and stack,
  still drawn alike, where there is not. The crossover is a width the toy states
  in its spec, not a query it writes, and the library also cancels the
  `.blk + .blk` flow margin that would otherwise push the second panel down its
  own gutter.
- **The armed region.** The stage and the rack are inside it; the master strip
  is outside it *except* the globals, because asking eight voices for sound IS
  asking for sound. That is why `arm` takes an array of roots — and why a page
  with a **transport** still arms the globals box, so a global pressed from cold
  presses Play first and then acts. `controls` is the other master-strip slot,
  for a toy-global control that only shapes the page: it stays outside the arm
  and answers a cold hand, exactly as the master chain does. Pass an element, or
  `{el, says}` for its own sentence.
- **The start line.** One computed state — *not started · nothing built ·
  stuck · shut · running* — worded by the toy, painted only when its text
  changes (it is `role="status"`, and a status rewritten five times a second is
  announced five times a second), and interruptible by a signpost that holds
  for a few seconds. `notStarted` is the library's; the other four are the
  toy's report on its own material, and `state()` is asked only once the audio
  is up. Return `null` for "running, nothing to say". **Every one of the five
  needs a line** or the build throws — pass `""` for a state the page has
  nothing to say in, *except* `running`, which **may not be empty**: while the
  instrument runs the line is never blank (`DESIGN.md`, "The start line"), and
  an empty one leaves a reserved blank band above the stage for the whole of a
  visit. The bar's readout is not a substitute; it reports, it does not invite.
  A name outside the five paints `running` and warns once.
- **The cold-hand answer.** Every control that declines the gesture says so in
  its own words and names one that gives it — the rack's standard cells, a toy
  column carrying `decline`, the master chain, the pulse slot (whose sentence is
  composed from the CONTROL'S OWN LABEL, since the slot no longer builds the
  control: a page whose pulse is a period in seconds hands it a dial reading
  `tempo`, and a fixed "that is bpm" would name a control that is not on the
  page — the one thing an answer must never do) and `controls` (whose `says`
  is the REASON, with the remedy appended, and whose `sentence` is the way out
  for a page owning the whole string). Its opposite is
  **`page.asksCell(el)`** — for a control inside the instrument that asks for
  sound: it is marked so the region's answer leaves it alone, and on a transport
  page it joins the arm the globals use, so the press that asks is the press
  that presses Play. Anything
  else in the instrument goes through **`page.declineCell(el, reason)`**, which
  is the same four lines: block where an unlock is listening, mark the element,
  answer a press and an operating key, and stay quiet afterwards. `reason` is
  the reason alone; the remedy is appended from the one clause every answer
  ends on, full stop included. `page.answer(text)` is the raw call, and it goes
  silent once the page has EVER started: guarding on "is it running" instead
  means a Stop press wakes the whole layer and a fader the visitor has used all
  session introduces itself again.
- **The keyboard start.** Every page has one and the start line names it. The region is a tab stop on a TRANSPORT page too, so a canvas stage has somewhere to put focus. On an
  arm page the instrument region is a tab stop that answers Enter — which is
  what `arm` already listens for; on a transport page Play is a button and
  already is one. The clause is appended to the `notStarted` words; pass
  `start.keyboardNote: false` to word it yourself.
- **Space is the transport** on a page that declares one; the composition binds
  it at the window, so a toy does not. It stands aside wherever Space already
  means something: a text field or contenteditable, Play's own button (which
  presses itself natively, so Play with focus toggles once), or a key a control
  has already `preventDefault`ed. Any other button, link or element with a
  button-like role keeps Space only when the keyboard focused it. A mouse or
  touch press leaves focus there too, and after clicking reseed the visitor's
  Space plays and stops, as the footer says, instead of reseeding again. The
  page tracks how focus arrived (the last press or key before it) rather than
  reading `:focus-visible`, which Chrome turns on at the keydown itself. On
  sliders, which answer the arrows, it stays the transport. It prevents the
  page scroll, ignores auto-repeat and modified presses, and in hint mode
  raises Play's bubble instead of pressing it. A page without a transport binds
  nothing. The footer's `keys` line says `Space play or stop` and leaves the
  focused-button rule to this page.
- **The owned-names check** warns when a page's own `<style>` defines one of
  the short list of class names `lab.css` holds (`.bar`, `.dot`, …) rather
  than restyling it. A compound that puts the class in a state is a restyle
  and stays quiet: a pseudo-class (`.dot:hover`), an attribute, or a state
  class the library toggles (`on`, `off`, `muted`, `armed`, `ro`), so
  `.dot.mem.on` passes. The class alone (`.dot {`, `.trail .bar`) or beside
  only plain classes (`.tsl.bar`, the case that produced the check) is a
  collision and is named with its rule. It runs
  only on a builder's host: a `file:` page, localhost, 127.0.0.1, [::1], or
  any host with `?dev` in the query. The public host stays quiet, because the
  toys ship as the files they are written in and there is no build step to
  strip it.
- **The write keys.** `writeKeys` says which of a page's own keys are writes, so
  a confirm is disarmed by one. The composition counts a press, an operating key
  or an input inside the armed region; a toy's window-level letter keys are none
  of the three, because a key that writes by calling `.click()` on a button
  fires no `pointerdown` and `A` is not an arming key — so a cut armed on one
  branch survived the key that moved the finger. Only the page knows which of
  its keys write, so the page says. An entry carrying `el` also says **which
  control the key stands for**: in hint mode that key is swallowed and the
  control's own bubble is shown, because the layer answers `pointerdown` and
  such a key fires none, so it acted while the same button under a finger would
  have been explained. `el` may be a **function**, read when the key fires: the
  controls a key stands for are often built after the page and rebuilt when the
  material changes. A plain entry disarms and nothing more. The confirm's own
  key stays exempt exactly as its own press is. A key typed into a text field
  (a textarea, a text input, a select, a contenteditable) is typing and never
  a write key.

  **And `el` is what the key's exemption is read off, never the focus.** A
  confirm is not disarmed by a press on itself, or a confirm sitting inside the
  armed region would disarm itself on its own second press and re-arm instead of
  acting — and for a pointer that exemption is simply the button under the
  finger. A window-level key has no such target: its `e.target` is whatever
  holds FOCUS, and arming a confirm with a pointer is precisely what leaves
  focus on that confirm, so the exemption caught the one control the key was
  meant to clear. A keyed entry stands for a press on its own `el` and that is
  what may be exempt; a plain entry stands for no control and exempts nothing.
  The sequence this turns on: arm a confirm by pointer, move with a write key,
  press the confirm's key — the write must have disarmed it, or the second press
  destroys something the first never named. An entry whose `el` is not an
  element is named at build, because it costs both halves silently — no bubble,
  and an exemption falling back to nothing — and the way to get one is ordinary:
  naming a control the page has not built yet, which is what happens when it is
  made inside a rack's `cell()` and declared in the same call that builds the
  rack. Build such a control before `Lab.page.build` and pass it here.
- **The class check.** `lab.css` owns `.bar`, `.blk`, `.hint`, `.val` and a
  dozen other ordinary words, and a toy that INVENTS one for a thing of its own
  inherits the library's rule silently — a background, a border, a padding and a
  margin that look like the toy's own CSS being wrong. The composition reads the
  page's inline stylesheets at build and names the class. It checks only the
  words a toy is likely to invent; restyling a library *component* is a
  different act and is not checked. The full list is at the top of `lab.css`.
- **The build guard.** A stale `lib/*.js` behind a warm cache used to give a
  blank page — the toy's script threw at its first statement and `.wrap` stayed
  empty. `Lab.page` checks what it is about to call, writes one line saying to
  hard-reload, and throws naming the missing pieces. `Lab.page.missing()` and
  `Lab.page.staleNotice(mount, names)` are the same check by hand. A page should
  ALSO carry the inline guard `toys/_template/` carries, for the case where
  `page.js` is itself the stale file.

### The teaser — the phone mode, declared

`DESIGN.md` gives a phone a **teaser**: the smallest thing that is still this
toy. It is a **mode of the same page, not a second site**: below the teaser
width (`--teaser`) the page is the teaser, above it the desktop page, and the
same engine runs under both. A toy declares it; the composition does the rest.

- **The region.** `.pp-teaser` sits right after the start line, before the
  instrument: the teaser's own Play on a transport page, a "?" toggle, then the
  declared `controls`. Its **foot**, `.pp-teaser-foot`, sits after the
  instrument and holds the invitation and the share button. Both exist in the
  DOM at every width; `lab.css` shows them only under `--teaser`, in the one
  `@media` block that may name the number.
- **The desk.** The master strip, the rack, the session bar, the standing
  text, the keys line and every stage member not kept are marked `pp-desk`, which `lab.css` hides under
  `--teaser` (with `!important`, because a stage member is often styled by id in
  the toy's own block). The nameplate, the start line, the feedback field and
  the footer are both pages'; the standing text is the desk's, and the phone has its own
  (`teaser.text`, below). **Nothing moves on resize**: the mode is CSS over one
  DOM, so the engine never learns the width changed. The kept stage members stay
  on the stage — one node cannot be both in a box the desktop hides and on the
  desktop page — which is why the foot is a separate element placed after them:
  the phone reads controls, then what they move, then the invitation. With
  nothing kept, the stage and the instrument are desk too. A page with **no**
  teaser marks nothing: below the teaser width it is the desktop page, whole.
- **The phone's own.** `pp-phone` is the inverse mark, for a toy's element that
  only the phone shows (a bar beside the roll that the desktop reads in its
  rack). `lab.css` hides it above `--teaser`, with `!important` for the same
  reason, and leaves it alone below, so it takes the toy's own `display` there.
  The library marks nothing with it; it is the toy's to place.
- **Everything in `controls` arms.** On an arm page the box is another root of
  the arm; on a transport page it joins the arm the globals use, so a control
  pressed from cold presses Play first and then acts. On the phone those one or
  two controls are the whole hand, and an instrument whose only control declines
  is a broken page. Play and "?" sit in the region's head, outside the arm: Play
  IS the transport (it clicks the real button, so the page's one transport does
  everything it does for a hand on it, and it mirrors that button's label and
  state at once), and "?" drives the same hint layer as the master strip's,
  which is desk-only. A write in the teaser disarms a confirm like a write in the
  instrument.
- **The start line reads the teaser's words while small.** `gesture` and
  `words` override the page's own under `Lab.shell.env.small`, read at every
  paint; a state the teaser omits keeps the page's word, and `words.running`,
  if given, may not be empty. Undeclared, the gesture is "Press Play" on a
  transport page and the first named teaser control on an arm page — never the
  desktop's phrase, which names a control the phone does not show. The
  keyboard clause on an arm page becomes "tab to a control". The fit sweep
  measures the teaser's words, the blocked sentence and (on a transport page
  that keeps a stage member) the instrument's answer **at 390 px**, the phone the
  collection designs a teaser for, and names any that overflow the reserve.
- **The touch floor binds inside it**: a dial's face, a button's height, a
  gate, a dot and a slider are at least 44 px, a button is as wide as the
  column, the gaps are a thumb apart, labels are visible. The region fits 390 px
  with no horizontal overflow.
- **The invitation** is `teaser.invite`, else the page's `invite`; with
  neither there is none. **The share
  button** is `Lab.shell.share(teaser.share)`; `share: false` drops it.
- **The phone's standing text** is `teaser.text`. The page's own standing
  text describes the desk — the rack, the strips, the session bar — so with a
  teaser declared it is desk-only. `false`, the default, gives the phone none.
  A string or `[{head, body}]` builds a second block in the same style, placed
  where the desktop one sits and shown only under the teaser width. It names
  only what the phone shows.
- **Build checks** (console warnings, not refusals): more than two controls; no
  control, no Play and no kept stage, so nothing on the phone can start the
  audio; a control with no `data-hint`; a control that declines the gesture; a
  kept element that is not on the stage.

A teaser control is a **second control writing the same parameter** its
desktop control writes. The toy keeps the two readouts honest with `show()`
both ways; the composition does not try to know which desktop control a teaser
control stands for.

`page.teaser` is `{ el, head, controls, play, hint, foot, invite, share,
text, small }` (`small` reads whether the page is in its teaser mode now), or
`null` without a teaser.

**The feedback field** (`Lab.shell.feedback`) sits after the keys line and
before the footer, at every width and outside the armed region, so a press
or a key in it never starts the audio. It is a bare block, not a titled
panel. `page.feedback` is the component's `{el, field, send}`, or `null`
under `feedback: false`; an object passed as `feedback` is the component's
options.

**Returns** `{ wrap, bar, barSpacer, startLine, instrumentEl, stage, rack,
rackWrap, globals, controls, session, textEl, setText, keysEl, feedback, statusEl,
setStatus, footer, h1, sub, hints, midi, bpmKnob, masterKnobs, arm | transport,
teaser, started, everStarted, stop(), paint(), signpost(text, ms, warn),
answer(text), declineCell(el, reason), state(), disarmConfirms() }`.

`statusEl` is the **persistent readout** in the master strip — markov's
"walking · 12/81 cells set" — and not `Lab.ui.status`, which is a transient
toast on `document.body`. Pass `status` a function and the page's own poll
paints it; pass `true` and write it with `page.setStatus(text)`.

The poll stops while the tab is hidden and repaints the moment it is back;
`page.stop()` ends it for good.

## midi.js — Web MIDI as a progressive enhancement

Forty lines of status-byte parsing instead of a dependency. No WebKit browser
ships Web MIDI and none is expected to, so `Lab.midi.available` is false on an
iPhone and a page must be complete without it — which is what makes the "best
on desktop" invitation honest rather than apologetic.

- `Lab.midi.enable()` → Promise&lt;`{ok, inputs}` | `{ok:false, reason}`&gt;.
  Call it from a user gesture: Chrome prompts for permission even without
  sysex.
- `Lab.midi.onCC(fn)` — `fn({type:'cc', ch, cc, value})`, channels 1-based.
  Control Change only.
- `Lab.midi.onMsg(fn)` — the same subscription **including notes**:
  `fn({type:'cc'|'note', ch, cc|note, value, on?})`. A note-on at velocity 0 is
  delivered as a note-off, because every controller means it that way. Reach
  for this where the gesture is a PRESS and the device decides whether it sends
  a note or a CC; `onCC` is the narrower one for a knob.
- `Lab.midi.learn(fn)` — arms the next incoming CC as a binding, calls
  `fn({ch, cc})` once, and returns a **cancel** function. The learning move is
  consumed as a binding, never delivered as a value.
- `Lab.midi.learnMsg(fn)` — the same arming, open to a note as well as a CC.
  A release never binds: learning on note-off would bind the moment the finger
  came up and never see the press it was aimed at.
- `Lab.midi.sendCC(ch, cc, value)` — to every output.
- `Lab.midi.onDevices(fn)`, `.available`, `.state`, `.inputs`, `.outputs`.

Values are 7-bit absolute, so a hardware knob's position is taken at face
value and a pot whose position disagrees will jump the parameter. That is the
same pickup problem the screen controls have, and it is left visible rather
than solved. What a page CAN do is speak: send the new value out on every
rebind, and a controller with LED rings or motorised faders follows.

## Minimal bench sketch

Not how a published toy starts — that is `toys/_template/`, a complete page
with no mechanism, laid out by `Lab.page`. This is the smallest thing that
makes a sound on the bench, for trying a scheduler out before it has a page.

```html
<link rel="stylesheet" href="../lib/lab.css">
...
<div class="wrap">
  <h1>my-toy</h1>
  <p class="sub">What the experiment is.</p>
  <div class="bar" id="bar">
    <button id="play" class="pri">▶ Play</button>
    <!-- Lab.ui.ctl / masterFx land here -->
    <span class="spacer"></span>
  </div>
  <canvas id="viz" class="tl"></canvas>
</div>

<script src="../lib/audio.js"></script>
<script src="../lib/clock.js"></script>
<script src="../lib/voices.js"></script>
<script src="../lib/roll.js"></script>
<script src="../lib/ui.js"></script>
<script>
"use strict";
const params = { period: 120, density: 1 };  // controls write here, read live

const ticker = Lab.clock.createTicker({
  periodSec: () => params.period / 1000,
  onTick: (n, t, p) => {                       // TOY-SIDE triggering logic
    if (n % 4 === 0) Lab.voices.play('kick', t);
    if (Math.random() < params.density)
      Lab.voices.play('hat', t + p / 2, { gain: 0.4 });
  }
});

const roll = Lab.roll.attach(document.getElementById('viz'), {
  gridSec: () => params.period / 1000
});

const bar = document.getElementById('bar'), spacer = document.querySelector('#bar .spacer');
bar.insertBefore(Lab.ui.ctl('density',
  Lab.ui.gate({ value: 1, onChange: v => params.density = v })), spacer);
bar.insertBefore(Lab.ui.masterFx(), spacer);   // master / drive / glue / reverb

document.getElementById('play').addEventListener('click', async () => {
  Lab.audio.init();
  Lab.audio.resume();
  await Lab.voices.ensureRendered();  // only needed if render voices are used
  Lab.audio.fadeIn(0.03);
  ticker.start();
  roll.start();
});
// stop: ticker.stop(); Lab.audio.fadeOut(0.05);  — context stays alive
</script>
```
