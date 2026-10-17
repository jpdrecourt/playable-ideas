"use strict";
/* ============================================================
   Lab.page — the composition a toy DECLARES and the library lays out.

   Why this is `Lab.page` and not `Lab.shell.page` or `Lab.ui.page`:
   `Lab.ui` makes controls, one element at a time, and knows nothing
   about where they go. `Lab.shell` makes the things a stranger meets
   at the edges of a page — the nameplate, the footer, the start
   gesture, the hint layer — and is deliberately agnostic about what
   sits between them. What was missing is the thing between them: the
   ORDER. That is not a control and not a frame, it is the page, and a
   toy calls it once. Hence the name, and hence its own file rather
   than a third export on either of the others.

   A toy DECLARES its master strip, its stage, its rack, its globals,
   its session controls, its text and its keys. It does not lay them
   out, and it does not decide the order — the order is the collection's
   (DESIGN.md, "The page, top to bottom"):

     nameplate → master strip → start line → [stage | rack] →
     session bar → standing text → keys → footer

   with one flag, `instrument`, saying which of the stage and the rack
   comes first: what the hands play comes before what the eyes read.

   Four things the library owns here that seven toys would otherwise
   own seven times over:

   THE ARMED REGION. The stage and the rack are inside it; the master
   strip is outside it except the global buttons that ask voices for
   sound, which is why `arm` takes two roots — and why a page with a
   TRANSPORT still arms the globals box, so that a global pressed from
   cold presses the transport first and then acts.

   THE START LINE. One computed state — not started · nothing built ·
   stuck · shut · running — worded by the toy, painted only when its
   text changes, and interruptible by a signpost that holds for a few
   seconds. Lifted from markov's, where it was invented.

   THE COLD-HAND ANSWER. Every control that declines the gesture says
   so in its own words and names one that gives it. It speaks only
   before the page has EVER started — not "while the transport is
   stopped", or a fader the visitor has been using all session
   introduces itself the moment they press Stop.

   THE KEYBOARD START. Every page has one, and the start line names it:
   on an arm page the instrument region is a tab stop that answers
   Enter, and on a transport page Play is a button and already is one.

   Depends on lab.css, Lab.ui and Lab.shell; on Lab.audio through
   them; on Lab.midi only if a page asks for the badge.
   ============================================================ */
window.Lab = window.Lab || {};

Lab.page = (function () {

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  const words = v => (typeof v === 'function' ? v() : v);

  /* The five states, in the order a page passes through them. `notStarted`
     is the library's own — it knows whether the audio is up and whether the
     transport is running, and no toy should have to. The other four are the
     toy's report on its own material, because nothing here knows what
     "nothing built" means for a matrix, a pattern or a lattice. */
  const STATES = ['notStarted', 'nothing', 'stuck', 'shut', 'running'];

  /* ---- the sentences the library writes, and why they are short ----
     Every one of these ends up in the start line, whose height is reserved for
     two lines and must not change: the longest text the line ever carries is
     the one that sets whether a press shifts the page under the hand. These
     used to run to three lines at 1200 px with an ordinary gesture phrase —
     the master answer at 51.78 px against a 34.5 px reserve — and a rack press
     inside the six seconds it was showing met exactly the shift defect A was.
     So they say the one thing they owe and stop. The budget is about 148
     characters at 1200 px INCLUDING the toy's gesture phrase, and `checkFit`
     measures every one of them at build rather than trusting this note. */
  const SAYS = {
    master: name => (name ? 'that is ' + name + ' — the master controls shape what comes ' +
                            'out, not what is playing.'
                          : 'the master controls shape what comes out, not what is playing.'),
    /* Composed from the control's OWN label, because the slot no longer builds
       the control. A page whose pulse is a period in seconds hands the slot a
       dial labelled `tempo` reading 800 ms, and a fixed "that is bpm" then
       names a control that is not on the page — the one thing an answer must
       never do, since its whole job is to point at something the hand can find. */
    pulse: name => (name
      ? 'that is ' + name + ', the pulse. Setting it is not asking for sound.'
      : 'that is the pulse, and setting it is not asking for sound.'),
    /* True of BOTH kinds of thing a toy puts in `controls`: a view toggle and
       a control that shapes the sound. The old default — "it changes the page,
       not the sound" — was written for the first and false for the second, so
       every page whose master-strip controls shaped the sound wrote its own
       sentence rather than take one that lied. What the two share is the only
       thing the answer owes: whatever they change, it is not whether the piece
       is sounding, and the remedy names what is. */
    control: label => 'that is ' + label + ' — it changes the instrument, not whether ' +
                      'it is sounding.',
    mute: name => 'that is ' + name + '’s mute — taking a voice out of the mix is not ' +
                  'asking for sound.',
    gain: name => 'that is ' + name + '’s level — setting a level is not asking for sound.',
    pan: name => 'that is ' + name + '’s pan — placing a voice in the stereo field is not ' +
                 'asking for sound.'
  };

  /* ---- the names lab.css owns ----
     A toy's own stylesheet must not reuse one. The failure is silent and
     cosmetic and looks like the toy's own CSS being wrong: a trail that marked
     every sixteenth slot with class `bar` took the library's panel background,
     border, padding and bottom margin, and in a centre-aligned grid that margin
     lifted every sixteenth slot off the line the other thirty-one sit on. It
     was visible in a screenshot before it was visible in the code.

     So the composition reads the page's OWN stylesheets — the inline `<style>`
     blocks, never `lab.css` itself — and says which name and which rule. It is
     a warning and not a refusal: a toy may have a good reason to restyle a
     library class deliberately, and the check cannot tell that from a
     collision. Naming it is enough, because the collision is invisible and the
     deliberate act is not.

     The check reads a SHORT list, not the whole of what lab.css owns. A toy
     restyling `.rack`, `.rrow` or `.dial-wrap` is adjusting the library's own
     component, which is normal and encouraged, and warning about it would bury
     the one line that matters in five that do not. What it looks for is the
     ordinary English words a toy INVENTS for a thing of its own and does not
     expect to be taken: `bar` for a bar line is the case that produced this. */
  const COLLIDE = 'bar lane blk wrap sub hint val ctl dot km kl'.split(' ');

  function checkOwnedNames() {
    let sheets;
    try { sheets = Array.prototype.slice.call(document.styleSheets); }
    catch (_) { return; }
    const hits = [];
    sheets.forEach(function (ss) {
      if (ss.href) return;                       // a linked sheet is not the toy's
      let rules;
      try { rules = ss.cssRules; } catch (_) { return; }
      for (let i = 0; i < rules.length; i++) {
        const sel = rules[i].selectorText;
        if (!sel) continue;
        COLLIDE.forEach(function (name) {
          // the class as a whole word, not as part of a longer name
          if (new RegExp('\\.' + name + '(?![\\w-])').test(sel) && hits.indexOf(name) === -1) {
            hits.push(name);
          }
        });
      }
    });
    if (hits.length) {
      console.warn('Lab.page: this page’s own stylesheet defines ' +
        hits.map(h => '.' + h).join(', ') + ', which lab.css owns. A toy that reuses ' +
        'one of these inherits the library’s rule silently — a background, a border, ' +
        'a padding and a margin that look like your own CSS being wrong. Prefix your ' +
        'classes, or pick a word the library does not hold: `blin`, not `bar`. ' +
        '(Restyling a library COMPONENT — .rack, .dial-wrap — is not this, and is not ' +
        'checked.)');
    }
  }

  const STALE =
    'This page needs a hard reload (Ctrl+Shift+R): the browser is holding a ' +
    'cached copy of the library that no longer matches it.';

  /* ---- the build guard ----
     A stale `ui.js` behind a warm cache used to give a completely blank page:
     the toy's script threw at its first statement and `.wrap` stayed empty, no
     message, no fallback. That is exactly what a returning visitor gets after a
     deploy, and it is the failure that looks most like the site being gone. So
     the composition checks what it is about to call, and says the one thing
     that fixes it. (The template carries the same line for the case where
     `page.js` ITSELF is the stale file — this function cannot run then.) */
  const NEEDS = [
    ['Lab.audio', () => window.Lab && Lab.audio && Lab.audio.init],
    ['Lab.voices', () => window.Lab && Lab.voices && Lab.voices.play],
    ['Lab.ui.rack', () => window.Lab && Lab.ui && Lab.ui.rack],
    ['Lab.ui.masterFx', () => window.Lab && Lab.ui && Lab.ui.masterFx],
    ['Lab.ui.knob', () => window.Lab && Lab.ui && Lab.ui.knob],
    ['Lab.shell.frame', () => window.Lab && Lab.shell && Lab.shell.frame],
    ['Lab.shell.arm', () => window.Lab && Lab.shell && Lab.shell.arm],
    ['Lab.shell.start', () => window.Lab && Lab.shell && Lab.shell.start],
    ['Lab.shell.hints', () => window.Lab && Lab.shell && Lab.shell.hints],
    ['Lab.shell.isArmKey', () => window.Lab && Lab.shell && Lab.shell.isArmKey]
  ];

  function missing() {
    return NEEDS.filter(n => { try { return !n[1](); } catch (_) { return true; } })
                .map(n => n[0]);
  }

  function staleNotice(mount, names) {
    if (!mount) return;
    const p = el('p', 'hint');
    p.textContent = STALE + (names && names.length ? ' (missing: ' + names.join(', ') + ')' : '');
    mount.textContent = '';
    mount.appendChild(p);
  }

  /* ---- what to call the control that DOES start it ----
     A page may say it itself (`start.gesture`), and it should: "tap a cell of
     the matrix" is a sentence only the toy can write. Failing that, a transport
     page names Play — which is always right — and an arm page reads the first
     named control on the stage, which is better than "touch the instrument"
     and worse than a toy's own words. */
  function firstStageControl(stage) {
    if (!stage) return null;
    const n = stage.querySelector('.dial-label, .kl, button');
    const t = n && (n.textContent || '').trim();
    return t ? t : null;
  }

  function build(decl) {
    decl = decl || {};
    const mount = (typeof decl.mount === 'string')
      ? document.querySelector(decl.mount)
      : (decl.mount || document.querySelector('.wrap') || document.body);

    const gone = missing();
    if (gone.length) {
      staleNotice(mount, gone);
      throw new Error('Lab.page: the library is stale or incomplete — ' + gone.join(', '));
    }

    const page = {};
    const startDecl = decl.start || {};
    const sayWords = startDecl.words || {};

    /* Every one of the five states must have a word. A toy that forgot one used
       to ship a page whose start line was BLANK in that state — most visibly on
       arrival, where `notStarted` is the only sentence a visitor has. The
       library owns the state; it owns no words at all, and rather than invent a
       sentence in the toy's voice it refuses to build. An empty string is a
       legitimate word (the running state is often silent); a missing key is not. */
    const noWords = STATES.filter(s => sayWords[s] === undefined);
    if (noWords.length) {
      throw new Error('Lab.page: start.words is missing ' + noWords.join(', ') +
        '. Every one of ' + STATES.join(' · ') + ' needs a line — pass "" for a ' +
        'state your page has nothing to say in.');
    }

    /* `running` is the exception to "pass an empty string": DESIGN.md's rule is
       that while the instrument runs the line is never blank, and `running`
       says what the hand can do next in the toy's words. An empty one leaves a
       reserved blank band above the stage for the whole of a visit — and on a
       page that arms from the first touch and never stops, that is the whole
       visit. Two toys reached the same reasoning independently ("the readout in
       the bar already says what it is doing"), which is what makes it a rule to
       enforce rather than a note to write down again. */
    if (!words(sayWords.running)) {
      throw new Error('Lab.page: start.words.running is empty. While the instrument ' +
        'runs the start line is never blank (DESIGN.md, "The start line") — it says ' +
        'what the hand can do next, in your words. The bar\'s readout is not a ' +
        'substitute: it reports, it does not invite.');
    }

    /* ---- the teaser, declared ----
       The phone mode of the same page (DESIGN.md, "Desktop first"): below the
       teaser width the desktop regions are hidden by lab.css and a region of
       one or two controls shows instead. CSS over one DOM, so the engine never
       learns the width changed. Its words override the page's while small, and
       the same rule binds them: a `running` given here may not be empty. */
    const teaserDecl = decl.teaser || null;
    const teaserWords = (teaserDecl && teaserDecl.words) || {};
    if (teaserDecl && teaserWords.running !== undefined && !words(teaserWords.running)) {
      throw new Error('Lab.page: teaser.words.running is empty. On the phone too, the ' +
        'start line is never blank while the instrument runs — omit the key to use ' +
        'start.words.running, or say what the thumb can do next.');
    }
    /* Is the page in its teaser mode NOW. Read at every paint, never cached: a
       window dragged across the teaser width changes the answer and nothing
       else. `forceMode` is for the fit sweep, which measures both modes from
       whichever width the page happens to be loaded at. */
    let forceMode = null;
    function small() {
      if (!teaserDecl) return false;
      if (forceMode) return forceMode === 'teaser';
      return Lab.shell.env.small;
    }

    /* ---------- the master strip ----------
       One `.bar`: the transport if the piece has a beginning, the master
       chain, the pulse, the toy's own non-arming controls, and the toy-global
       buttons that arm. Everything else a toy reaches for while it plays goes
       in the session bar below the instrument — four master knobs, a tempo, a
       seed and two file buttons above the instrument are chrome standing
       between a visitor and the first thing worth touching. */
    const bar = el('div', 'bar');
    const spacer = el('span', 'spacer');

    let transportBtn = null;
    if (decl.transport) {
      transportBtn = el('button', 'pri', (decl.transport.labels || {}).play || '▶ Play');
      transportBtn.type = 'button';
      transportBtn.dataset.hint = decl.transport.hint || 'start and stop the piece';
      transportBtn.title = transportBtn.dataset.hint;
      bar.appendChild(transportBtn);
      bar.appendChild(el('span', 'sep'));
    }

    let fx = null;
    if (decl.master !== false) {
      fx = Lab.ui.masterFx(decl.master || {});
      page.masterKnobs = fx.knobs;
      bar.appendChild(fx);
    }

    /* ---- the pulse ----
       The slot is for whatever the piece is measured in, not for a bpm. It
       built a `Lab.ui.knob` — linear, no taper — so a page whose pulse is a
       period in seconds across a decade could not use it at all and put its
       tempo dial in `controls` instead, which is the same place on screen and
       the wrong place in the declaration.

       Three ways in now. A PREBUILT element: the toy makes the control it
       needs and the slot holds it. `control: 'dial'`, with a `taper`: the
       touch-first rotary, which is what a range spanning a decade wants — note
       that a dial reports through `onInput` and never fires at creation, so
       the toy applies its own initial value, which is the dial's whole
       contract. Or, as before, a knob. */
    let bpmKnob = null;
    /* An element, or an options object, or `{el, says}` — the same shape
       `controls` takes, so a page that hands the slot its own control can also
       hand it its own reason. */
    const bpmDecl = (decl.bpm && decl.bpm.nodeType) ? { el: decl.bpm } : decl.bpm;
    if (bpmDecl) {
      const b = bpmDecl;
      if (fx) bar.appendChild(el('span', 'sep'));
      if (b.el) {
        bpmKnob = b.el;
      } else if (b.control === 'dial') {
        bpmKnob = Lab.ui.dial({
          label: b.label || 'bpm', min: b.min, max: b.max, step: b.step, taper: b.taper,
          value: (b.value == null) ? b.def : b.value,
          fmt: b.fmt || (v => String(Math.round(v))),
          hint: b.hint || 'the pulse the piece is measured in',
          onInput: b.onChange || b.onInput || function () {},
          onDefault: b.onDefault
        });
      } else {
        bpmKnob = Lab.ui.knob({
          label: b.label || 'bpm', min: b.min, max: b.max, step: (b.step == null) ? 1 : b.step,
          value: (b.value == null) ? b.def : b.value, def: b.def,
          fmt: b.fmt || (v => String(Math.round(v))),
          hint: b.hint || 'the pulse the piece is measured in',
          onChange: b.onChange || function () {}
        });
      }
      bar.appendChild(bpmKnob);
    }

    /* ---- the master strip's two kinds of toy control ----
       `controls` SHAPE the page and do not ask for sound: a panel toggle, a
       view switch, a units button. They sit outside the armed region with the
       master chain, and like the master chain they answer a cold hand.
       `globals` ASK eight voices for sound, so they are the one thing up here
       that arms — the press that asks has to be the press that starts the
       audio. Two slots, because the master strip holds both kinds and a toy
       that can only declare one ends up inserting the other by hand. */
    const controlsBox = el('span', 'pp-controls');
    const declaredControls = (decl.controls || []).map(c => (c && c.el) ? c : { el: c });
    declaredControls.forEach(c => controlsBox.appendChild(c.el));
    if (declaredControls.length) {
      bar.appendChild(el('span', 'sep'));
      bar.appendChild(controlsBox);
    }

    const globalsBox = el('span', 'pp-globals');
    (decl.globals || []).forEach(g => globalsBox.appendChild(g));
    if ((decl.globals || []).length) {
      bar.appendChild(el('span', 'sep'));
      bar.appendChild(globalsBox);
    }

    bar.appendChild(spacer);

    /* ---- the readout ----
       The persistent line in the bar that says what the instrument is doing —
       markov's "walking · 12/81 cells set". It is NOT `Lab.ui.status`, which is
       a transient toast that lives on `document.body`; the two used to be
       confusable, and a page declaring `status: true` got a span that never
       received a word. Pass a function and the poll paints it; pass `true` and
       write it with `page.setStatus`. */
    let statusEl = null;
    const statusFn = (typeof decl.status === 'function') ? decl.status : null;
    if (decl.status !== false) {
      statusEl = el('span', 'status');
      bar.appendChild(statusEl);
    }
    let statusShown = null;
    function setStatus(text) {
      if (!statusEl) return;
      text = text == null ? '' : String(text);
      if (text === statusShown) return;
      statusShown = text;
      statusEl.textContent = text;
    }

    /* ---- the MIDI badge ----
       Quiet, and absent entirely where the browser has no Web MIDI — which is
       every WebKit browser, and is what makes "best on a desktop" honest
       rather than apologetic. It is furniture, not a mapping UI: the library
       asks for access and reports devices, and what a toy binds is the toy's. */
    let midi = null;
    if (decl.midi && window.Lab && Lab.midi && Lab.midi.available) {
      const box = el('span', 'pp-midi');
      const btn = el('button', null, 'MIDI');
      btn.type = 'button';
      btn.dataset.hint = 'ask the browser for MIDI access';
      btn.title = btn.dataset.hint;
      const stat = el('span', 'pp-midistat', 'not connected');
      box.append(btn, stat);
      btn.addEventListener('click', async function () {
        const r = await Lab.midi.enable();
        if (!r.ok) { stat.textContent = 'refused'; return; }
        const say = n => { stat.textContent = n ? n + ' input' + (n === 1 ? '' : 's') : 'no device'; };
        Lab.midi.onDevices(say);
        say(Lab.midi.inputs);
        if (decl.midi.onEnable) decl.midi.onEnable(r);
      });
      bar.appendChild(box);
      midi = { box: box, button: btn, status: stat };
    }

    let hints = null;
    const hintSlot = el('span', 'pp-hintslot');
    if (decl.hints !== false) bar.appendChild(hintSlot);

    mount.appendChild(bar);

    /* ---------- the start line ----------
       It sits against the instrument it names and not up in the bar with the
       master knobs, which are the nearest turnable thing to any sentence
       placed up there and start nothing. */
    const startLine = el('p', 'pp-start');
    startLine.setAttribute('role', 'status');
    mount.appendChild(startLine);

    /* ---------- the teaser ----------
       Right after the start line and before the instrument: the smallest thing
       that is still this toy, for a phone. It is in the DOM at every width and
       lab.css shows it only under the teaser width, in the one block that may
       name the number; the desktop regions carry `pp-desk` and go the other way.

       Two elements, not one. The region holds the teaser's Play (on a page
       with a transport), its "?" and the declared controls; its FOOT, holding
       the invitation and the share button, sits after the instrument. The
       stage members the phone keeps stay where they are, on the stage — one
       node cannot be both inside a box the desktop hides and on the desktop
       page — so the foot is placed after them, and the phone reads controls,
       then what they move, then the invitation. Nothing moves on resize. */
    const teaserBox = teaserDecl ? el('div', 'pp-teaser') : null;
    const teaserHead = teaserDecl ? el('div', 'pp-teaser-head') : null;
    const teaserCtls = teaserDecl ? el('div', 'pp-teaser-controls') : null;
    const teaserControls = teaserDecl
      ? (teaserDecl.controls || []).map(c => (c && c.el) ? c : { el: c }) : [];
    let teaserPlay = null, teaserHintBtn = null;
    if (teaserDecl) {
      teaserBox.setAttribute('role', 'group');
      teaserBox.setAttribute('aria-label', decl.teaserLabel || 'the instrument, cut for a phone');
      teaserControls.forEach(function (c) {
        if (c.hint) { c.el.dataset.hint = c.hint; c.el.title = c.hint; }
        teaserCtls.appendChild(c.el);
      });
      teaserBox.append(teaserHead, teaserCtls);
      mount.appendChild(teaserBox);
    }

    /* ---------- the instrument: the stage and the rack ----------
       `instrument: 'rack'` puts the rack first, which is the collection's
       default reading — the rack IS the instrument, and what the hands play
       comes before what the eyes read. A toy whose own surface is the thing
       being played says `instrument: 'stage'` and the two swap. */
    const instrument = el('div', 'pp-instrument');
    const stage = el('div', 'pp-stage');
    /* A member of `stage` that is an ARRAY is a row: its members sit side by
       side where there is room and stack where there is not. A toy laying two
       panels beside each other was building the grid itself and then cancelling
       the flow margin `.blk + .blk` leaves on the second one — layout, in a page
       that declares its layout everywhere else. `stageMin` is the width below
       which a row stacks, stated as a token because it is a fact about the
       toy's own content and belongs in its spec, not in a media query. */
    (decl.stage || []).forEach(function (s) {
      if (!Array.isArray(s)) { stage.appendChild(s); return; }
      const row = el('div', 'pp-stagerow');
      if (decl.stageMin) row.style.setProperty('--stage-min', decl.stageMin);
      s.forEach(m => row.appendChild(m));
      stage.appendChild(row);
    });

    let rackEl = null;
    if (decl.rack) {
      const r = decl.rack;
      rackEl = Lab.ui.rack({
        rows: r.rows, columns: r.columns, state: r.state,
        onStrip: r.onStrip, onRow: r.onRow, onRename: r.onRename,
        labelWidth: r.labelWidth, label: r.label,
        decline: {
          /* `says` returns the REASON; `wrap` adds the remedy. One sentence,
             one owner per half: a toy that wrote the whole thing had to repeat
             the gesture phrase the library already holds, and two copies of one
             clause is how they drift. `declineSentence` is the way out for a
             toy that really wants the whole string, and it takes the gesture
             phrase with it. */
          says: r.declineWords || defaultReason,
          sentence: r.declineSentence || null,
          wrap: andStart,
          answer: text => page.answer(text),
          /* Block the gesture only where a gesture can start something. On a
             transport page the instrument is not an arm root, so a cell that
             stopped the keys would be defending against an unlock that is not
             listening — and swallowing every window-level key the toy binds
             while a level holds focus. */
          block: !decl.transport
        }
      });
      const wrap = el('div', 'rackwrap');
      wrap.appendChild(rackEl);
      page.rackWrap = wrap;
    }

    const rackFirst = (decl.instrument !== 'stage');
    if (rackFirst) {
      if (page.rackWrap) instrument.appendChild(page.rackWrap);
      instrument.appendChild(stage);
    } else {
      instrument.appendChild(stage);
      if (page.rackWrap) instrument.appendChild(page.rackWrap);
    }
    mount.appendChild(instrument);

    /* The teaser's foot: the invitation (moved here from the head once the
       frame has built it — the visitor plays first and is invited after) and
       "Send this to myself". Neither asks for sound, so neither arms. */
    let teaserFoot = null, teaserShare = null;
    if (teaserDecl) {
      teaserFoot = el('div', 'pp-teaser-foot');
      if (teaserDecl.share !== false) {
        teaserShare = Lab.shell.share(teaserDecl.share || {});
        teaserFoot.appendChild(teaserShare.el);
      }
      mount.appendChild(teaserFoot);
    }

    /* ---------- the session bar ----------
       What you do TO the instrument rather than with it: clear, reseed, the
       seed, save and load. Below the stage, always, because these are the
       ones that would otherwise be 175 px of chrome above the first thing
       worth touching. */
    let session = null;
    if ((decl.session || []).length) {
      session = el('div', 'bar pp-session');
      decl.session.forEach(s => session.appendChild(s));
      session.appendChild(el('span', 'spacer'));
      mount.appendChild(session);
    }

    /* ---------- standing text and keys ----------
       `text: false` lays out nothing. A page whose few words are its blurb has
       no standing text, and an empty block it cannot decline is the
       composition making a toy carry a region it does not want. */
    const textEl = (decl.text === false) ? null : el('div', 'hint pp-text');
    if (textEl) mount.appendChild(textEl);
    /* The PHONE's standing text, `teaser.text`. The desktop block describes
       the rack, the strips and the session bar, none of which a phone shows,
       so with a teaser declared that block is desk-only, and the phone reads
       either nothing (`false`, the default) or a block of its own, written
       for what the phone does show. It sits where the desktop block sits and
       wears the same style; lab.css shows it only under the teaser width. */
    const teaserTextEl = (teaserDecl && teaserDecl.text) ? el('div', 'hint pp-text pp-teaser-text') : null;
    if (teaserTextEl) mount.appendChild(teaserTextEl);
    let keysEl = null;
    if (decl.keys) {
      keysEl = el('p', 'hint pp-keys');
      keysEl.innerHTML = decl.keys;
      mount.appendChild(keysEl);
    }

    function textHtml(blocks) {
      if (blocks == null) return '';
      if (typeof blocks === 'string') return blocks;
      return (blocks || []).map(b => '<p><b>' + b.head + '</b> ' + b.body + '</p>').join('');
    }
    function setText(blocks) {
      if (!textEl) return;
      textEl.innerHTML = textHtml(blocks);
    }
    if (decl.text !== false) setText(decl.text);
    if (teaserTextEl) teaserTextEl.innerHTML = textHtml(teaserDecl.text);

    /* ---------- the frame ----------
       Last, because it inserts the nameplate at the top of the mount and
       appends the footer at the end of it: everything above had to be in
       place first for the footer to land under it. */
    /* The invitation is the toy's own words: `teaser.invite` first, then the
       page's `invite`. With neither there is none, and the shell renders
       nothing. */
    const inviteWord = (teaserDecl && teaserDecl.invite !== undefined)
      ? teaserDecl.invite : decl.invite;
    const framed = Lab.shell.frame({
      title: decl.title, shows: decl.shows, spec: decl.spec, repo: decl.repo,
      site: decl.site, licence: decl.licence, invite: inviteWord, mount: mount
    });
    if (teaserFoot && framed.invite) teaserFoot.insertBefore(framed.invite, teaserFoot.firstChild);

    if (decl.hints !== false) hints = Lab.shell.hints({ mount: hintSlot });

    /* ---- the teaser's head: Play and "?" ----
       Play on a page with a transport, because the teaser's controls do not
       replace the transport — a piece with a beginning keeps it on the phone
       too. It CLICKS the real button rather than calling `press()`, so the one
       transport the page has does everything it does for a hand on it,
       including watching for an interruption; and it mirrors that button's
       label and state, so the two never disagree.

       "?" because the master strip, where the hint toggle lives, is desk-only,
       and GROUNDING's hints-that-exist-on-touch would otherwise exist
       everywhere except on touch. It drives the same layer. It carries no
       `data-hint` of its own, exactly like the original: a hinted toggle would
       be swallowed by the mode it is there to switch off. */
    if (teaserDecl) {
      if (transportBtn) {
        teaserPlay = el('button', 'pri pp-teaser-play', transportBtn.textContent);
        teaserPlay.type = 'button';
        teaserPlay.dataset.hint = transportBtn.dataset.hint;
        teaserPlay.title = teaserPlay.dataset.hint;
        teaserPlay.addEventListener('click', function () { transportBtn.click(); });
        teaserHead.appendChild(teaserPlay);
      }
      if (hints) {
        teaserHintBtn = el('button', 'pp-hintbtn', hints.el.textContent);
        teaserHintBtn.type = 'button';
        teaserHintBtn.title = hints.el.title;
        teaserHintBtn.setAttribute('aria-label', hints.el.getAttribute('aria-label'));
        teaserHintBtn.addEventListener('click', function () { hints.set(!hints.on); syncTeaser(); });
        teaserHead.appendChild(teaserHintBtn);
      }
    }
    function syncTeaser() {
      if (teaserPlay) {
        if (teaserPlay.textContent !== transportBtn.textContent) {
          teaserPlay.textContent = transportBtn.textContent;
        }
        teaserPlay.classList.toggle('on', transportBtn.classList.contains('on'));
        teaserPlay.setAttribute('aria-pressed', transportBtn.getAttribute('aria-pressed') || 'false');
      }
      if (teaserHintBtn) {
        teaserHintBtn.classList.toggle('on', hints.on);
        teaserHintBtn.setAttribute('aria-pressed', hints.on ? 'true' : 'false');
      }
    }
    /* Immediately, not at the next poll: the real button's label changes in
       the same tick as the press, and a teaser Play reading "▶ Play" for 200 ms
       over a running piece is the two disagreeing. The poll syncs too. */
    if (teaserPlay && window.MutationObserver) {
      new MutationObserver(syncTeaser).observe(transportBtn,
        { childList: true, characterData: true, subtree: true, attributes: true });
    }
    if (hints && teaserHintBtn && window.MutationObserver) {
      new MutationObserver(syncTeaser).observe(hints.el, { attributes: true });
    }

    /* ============================================================
       THE START LINE, PAINTED
       ============================================================ */
    let started = false;      // is the piece running NOW
    let everStarted = false;  // has this page ever started — the answer's guard
    let shownText = null, shownWarn = false, signpostUntil = 0;
    let warnedState = false;

    /* The start line's height is reserved in lab.css and must not change: it
       sits directly above the instrument and swaps text under the hand, so a
       line more or less moves the control the hand is on, between pointerdown
       and click. Text that does not fit the reserved box is the toy's wording
       problem, and it is said out loud — once per offending state, because the
       page repaints five times a second and a warning per paint is a page that
       has broken its own console. */
    const overflowed = {};
    function checkFit(where) {
      if (overflowed[where]) return;
      /* Against the RESERVE, not against the element's own scroll height: the
         reserve is a `min-height`, so text that does not fit grows the box
         rather than overflowing it, and `scrollHeight > clientHeight` is never
         true. What is being asked is "is this box taller than the height every
         other state will hold it at". */
      const reserve = parseFloat(getComputedStyle(startLine).minHeight);
      if (!isFinite(reserve) || !reserve) return;
      if (startLine.getBoundingClientRect().height <= reserve + 0.5) return;
      overflowed[where] = true;
      console.warn('Lab.page: the start line\'s "' + where + '" text is taller than the ' +
        'two lines the line reserves, so the page will shift under the hand when it ' +
        'changes — and a control that moves between pointerdown and click is a control ' +
        'the click misses. Shorten it, or raise --start-lines on .pp-start. Text: ' +
        JSON.stringify(startLine.textContent));
    }

    function paintLine(text, warn, where) {
      text = text || '';
      if (text === shownText && warn === shownWarn) return;
      shownText = text;
      shownWarn = !!warn;
      startLine.className = 'pp-start' + (warn ? ' no' : '');
      startLine.textContent = text;
      checkFit(where || 'signpost');
    }

    function state() {
      if (!started) return 'notStarted';
      const s = startDecl.state ? startDecl.state() : null;
      if (s == null) return 'running';
      if (STATES.indexOf(s) > 0) return s;
      /* Once, not per poll: five times a second in the console is a page that
         has broken its own debugging. `notStarted` lands here too — the library
         owns that state and a toy claiming it is reporting something it cannot
         know. */
      if (!warnedState) {
        warnedState = true;
        console.warn('Lab.page: start.state() returned "' + s + '", which is not one of ' +
          STATES.slice(1).join(' · ') + ' (or null for running). Painting `running`.');
      }
      return 'running';
    }

    /* ---- the keyboard start, and the line naming it ----
       Every published page has one. On a transport page Play is a button and
       already is one; on an arm page the instrument region is a tab stop that
       answers Enter, which is what `arm` already listens for. The clause is
       appended to the `notStarted` words rather than left to each toy, because
       a rule every toy has to remember is a rule half the toys will not. */
    /* On the phone an arm page's keyboard start is the teaser's controls, which
       are an arm root: the instrument region may be hidden there entirely. */
    function keyStart() {
      if (decl.transport) return ' Or tab to Play and press Enter.';
      return small() ? ' Or tab to a control and press Enter.'
                     : ' Or tab to the instrument and press Enter.';
    }

    /* While small, a word the teaser declares wins over the page's own: the
       start line is the one line that must not name a control the phone does
       not show. A state the teaser leaves out keeps the page's word. */
    function stateText(s) {
      const tw = small() ? teaserWords[s] : undefined;
      let text = words(tw !== undefined ? tw : sayWords[s]);
      if (s === 'notStarted' && text && startDecl.keyboardNote !== false) text += keyStart();
      return text;
    }

    /* ---- what else repaints with the page ----
       A rack cell that is a VIEW of engine state has to be redrawn, and the toy
       that has one puts it in its own frame loop — where it keeps running in a
       hidden tab, or freezes with the drawing beside it, depending on which
       loop it joined. The page already owns a repaint that stops when the tab
       is hidden and starts when it is back, so a view cell belongs to that one.
       Subscribers run after the line and the readout, and any that throws is
       reported once rather than killing the poll for the rest. */
    const painters = (decl.paint || []).slice();
    const painterFailed = [];
    function onPaint(fn) { if (typeof fn === 'function') painters.push(fn); return fn; }
    function runPainters() {
      for (let i = 0; i < painters.length; i++) {
        try { painters[i](); }
        catch (err) {
          if (painterFailed.indexOf(i) === -1) {
            painterFailed.push(i);
            console.warn('Lab.page: a paint subscriber threw; it keeps running. ', err);
          }
        }
      }
    }

    function paint() {
      if (Date.now() >= signpostUntil) {
        const s = state();
        paintLine(stateText(s), false, s);
        if (statusFn) setStatus(statusFn());
      }
      /* Outside the signpost guard: a signpost holds the SENTENCE, not the
         instrument. A rack of readouts freezing for six seconds because a
         master knob was touched would be the page stopping to talk. */
      if (teaserDecl) syncTeaser();
      runPainters();
    }

    /* EVERY text the line can ever carry, measured in the real box at the real
       width, before a visitor can meet the one that does not fit.

       The toy's five words are the obvious half. The other half is the half
       that actually overflowed: the answers the LIBRARY writes, out of its own
       templates and the toy's `start.gesture`. Measuring only `words` left the
       one text nobody was asked about at build to announce itself in a console
       nobody is watching, the first time a visitor pressed a master knob — and
       while it showed, the rack sat 17 px lower and the next rack press met the
       same shift under the hand that the reserve exists to prevent.

       So every answer template is filled with every control name it may be
       filled with — each master knob's label, bpm, each declared control, each
       rack row's own name — and measured. It is a few dozen layouts, once. */
    function generatedTexts() {
      const out = [];
      Object.keys(page.masterKnobs || {}).forEach(function (k) {
        const kl = page.masterKnobs[k].querySelector('.kl');
        out.push(['master answer', andStart(SAYS.master(kl && kl.textContent.trim()))]);
      });
      if (bpmKnob) {
        out.push(['pulse answer', (bpmDecl && bpmDecl.sentence)
          ? (typeof bpmDecl.sentence === 'function' ? bpmDecl.sentence() : bpmDecl.sentence)
          : andStart(pulseReason())]);
      }
      declaredControls.forEach(function (c) {
        out.push(['control answer (' + controlLabel(c) + ')', controlSay(c)]);
      });
      /* Every answer the rack can actually put on this line, asked of the rack
         rather than reconstructed from a guess at which columns it has. The
         sweep used to compose `mute`, `gain` and `pan` by name, so a rack whose
         level and mute are its OWN columns — which is any rack whose level is a
         law over the toy's own gain rather than the library's bus — had its
         most-shown sentences measured only by the coincidence of using those
         three words as kind names, and a toy column called anything else was
         not measured at all. */
      if (rackEl && rackEl.declineTexts) {
        rackEl.declineTexts.forEach(function (t) {
          out.push(['rack answer (' + t[0] + ')', t[1]()]);
        });
      }
      if (page.instrumentSays) out.push(['instrument answer', page.instrumentSays()]);
      out.push(['blocked', blockedText()]);
      return out;
    }

    /* ---- and at the narrowest width the desktop page owns ----
       The reserve is a line COUNT, and a line's count depends on its width.
       `.pp-start` is capped at 900 px, so on a wide window every sentence keeps
       the width it was measured at; below the cap the line follows the window,
       and a sentence that fits two lines at 900 px can need three. So the sweep measures each text TWICE — at the page's current
       width, and at the teaser width, which is the narrowest the desktop page
       owns. Below the teaser width a page with a declared teaser paints the
       teaser's words, and those are swept a third time, at the phone (below);
       a page with no teaser is the desktop page there and is not swept again.

       The second pass constrains the element's width directly rather than
       resizing anything, which is the only way to ask the question without
       moving the page under whoever is looking at it.

       The cap is 900 px and the wrap's padding is 13 px at the teaser width, so
       there the line is narrower than the cap and the second pass does narrow
       it: that is what it is for. It skips rather than widening the line,
       because a wider line would pass a text that does not fit. */
    /* THE PHONE the teaser is measured at. Not a breakpoint — the page never
       asks for it in a query — but the width the collection designs a teaser
       for (an ordinary current phone in portrait), and so the width its words
       have to fit. The phone pass also measures at the phone's own type size,
       read from `--start-fs-phone`. */
    const PHONE = 390;

    function checkAllFit() {
      const keepText = startLine.textContent, keepCls = startLine.className;
      const keepWidth = startLine.style.width, keepMax = startLine.style.maxWidth;
      // the desktop's words, whatever width this page was loaded at
      forceMode = 'desk';
      const all = STATES.map(s => [s, stateText(s) || '']).concat(generatedTexts());
      const teaser = Lab.shell.env.teaser;
      // the line's own box at the teaser width: the wrap's padding is the only
      // thing between the viewport and the line, and lab.css states it
      const pad = 13 * 2;
      const narrow = Math.max(120, teaser - pad);

      const pass = function (list, label) {
        list.forEach(function (pair) {
          startLine.className = 'pp-start';
          startLine.textContent = pair[1] || '';
          checkFit(pair[0] + label);
        });
      };
      const at = function (w, fn) {
        startLine.style.maxWidth = w + 'px';
        startLine.style.width = w + 'px';
        fn();
        startLine.style.width = keepWidth;
        startLine.style.maxWidth = keepMax;
      };
      /* A page with a teaser loaded at phone width never shows the desktop
         words at this width, so it does not measure them here; the pass at
         the teaser width below still does. */
      if (!(teaserDecl && Lab.shell.env.small)) pass(all, '');
      if (startLine.getBoundingClientRect().width > narrow || (teaserDecl && Lab.shell.env.small)) {
        at(narrow, () => pass(all, ' at ' + teaser + 'px'));
      }
      /* And the teaser's own words, at the phone, where the line is narrowest
         and the words are the teaser's: every state it may paint there, plus
         the two library sentences a phone can actually raise — the blocked
         audio, and on a transport page the instrument's answer when a kept
         stage member is pressed. The master strip and the rack are hidden
         there, so their answers cannot be asked for and are not measured. */
      if (teaserDecl) {
        forceMode = 'teaser';
        const phone = STATES.map(s => [s, stateText(s) || '']);
        phone.push(['blocked', blockedText()]);
        if (page.instrumentSays && teaserKeepsStage) phone.push(['instrument answer', page.instrumentSays()]);
        const phoneFs = getComputedStyle(startLine).getPropertyValue('--start-fs-phone').trim();
        if (phoneFs) startLine.style.setProperty('--start-fs', phoneFs);
        at(PHONE - pad, () => pass(phone, ' on the teaser at ' + PHONE + 'px'));
        if (phoneFs) startLine.style.removeProperty('--start-fs');
      }
      forceMode = null;
      startLine.textContent = keepText;
      startLine.className = keepCls;
    }

    /* A signpost holds the line for a few seconds and then gives it back. It
       has to CLAIM the line rather than write to it, or the poll erases the
       answer before it has been read. */
    function signpost(text, ms, warn) {
      signpostUntil = Date.now() + (ms == null ? 6000 : ms);
      paintLine(text, warn);
    }

    /* The cold-hand answer, and the reason its guard is `everStarted` and not
       `started`: on a transport page Stop sets `started` false again while the
       context is still running, and a fader the visitor has been using all
       session would suddenly introduce itself and seize the line for six
       seconds. The answer is for a hand that has never heard the instrument. */
    function answer(text) {
      if (everStarted) return;
      signpost(text, startDecl.signpostMs || 6000, false);
    }

    page.paint = paint;
    page.signpost = signpost;
    page.answer = answer;
    page.state = state;
    page.setStatus = setStatus;
    page.onPaint = onPaint;
    page.declineCell = declineCell;

    /* ---- the opposite of declineCell ----
       A control INSIDE the instrument that asks for sound. On an arm page there
       is nothing to do: the instrument is already the arm root and the press is
       the unlock. On a TRANSPORT page the instrument is not a root — only the
       globals are — so this cell has to reach the same unlock they reach, which
       means pressing Play first and then sounding. It is also marked, so the
       region's blanket cold-hand answer leaves it alone: its answer is a sound.

       `Lab.ui.rack`'s `asks: true` on a column routes every cell it builds
       through here, which is how a rack of name buttons declares it once. */
    function asksCell(elm) {
      if (!elm) return elm;
      elm.dataset.ppAsks = '1';
      if (decl.transport) ensureAsksArm().add(elm);
      return elm;
    }
    page.asksCell = asksCell;

    /* Every answer ends the same way: name the control that DOES start it. The
       full stop is added if the reason did not bring one — a toy now owns half
       a sentence, and half a sentence is exactly the thing whose punctuation
       nobody remembers. */
    function andStart(lead) {
      const s = String(lead).trim();
      const stopped = /[.!?…]$/.test(s);
      return s + (stopped ? ' ' : '. ') + gesturePhrase() + ' to start it.';
    }

    /* The REASON half of a standard column's sentence. The remedy is `andStart`
       and lives in exactly one place, which is the point of the split. */
    function defaultReason(kind, name) { return SAYS[kind](name); }

    /* ---- a control anywhere in the instrument may decline ----
       The four lines a toy wrote by hand for every cell it built itself: block
       the gesture where an unlock is listening, mark the element so the region
       answer defers to this one, answer a press and a key that OPERATES the
       control, and go quiet once the page has ever started. `reason` is the
       reason alone — the remedy is appended here, from the same clause every
       other answer ends on. */
    function declineCell(elm, reason) {
      if (!elm) return elm;
      if (decl.transport) elm.dataset.ppDecline = '1';
      else Lab.shell.declineArm(elm);
      const say = () => {
        const r = (typeof reason === 'function') ? reason() : reason;
        if (r) answer(andStart(r));
      };
      elm.addEventListener('pointerdown', say);
      elm.addEventListener('keydown', e => { if (Lab.shell.isArmKey(e)) say(); });
      return elm;
    }

    /* One wording for both start paths, so the sweep has one text to measure
       rather than a transport branch and an arm branch that drift apart. The
       gesture keeps its own case: "press play again" reads like a typo where
       "Press Play again" reads like the button it names. */
    function blockedText() {
      return words(sayWords.blocked) ||
        ('the browser blocked the audio. ' + gesturePhrase() + ' again.');
    }


    let gesturePhraseCache = null;
    function gesturePhrase() {
      /* The teaser's own phrase while small, for the same reason as its words.
         Undeclared, it is Play on a transport page and the first named teaser
         control on an arm page — never the desktop's phrase, which names a
         control on the desk. */
      if (small()) {
        if (teaserDecl.gesture) return teaserDecl.gesture;
        if (decl.transport) return 'Press Play';
        const n = firstStageControl(teaserCtls);
        return n ? ('Touch ' + n) : 'Touch a control';
      }
      if (startDecl.gesture) return startDecl.gesture;
      if (gesturePhraseCache === null) {
        if (decl.transport) gesturePhraseCache = 'Press Play';
        else {
          const n = firstStageControl(stage);
          gesturePhraseCache = n ? ('Touch ' + n) : 'Touch the instrument';
        }
      }
      return gesturePhraseCache;
    }

    /* ---- the master strip answers a cold hand too ----
       It is OUTSIDE the armed region by design, which makes it the one place
       on the page where a real gesture is met with silence on purpose —
       and it is also, on a phone, the first turnable thing under a thumb. So
       it names the control the hand actually landed on and says which one
       does start the instrument. Both toys that have a master strip wrote
       this by hand; it is the same twenty lines each time. */
    function coldAnswer(box, say) {
      if (!box) return;
      const fire = e => answer(say(e));
      box.addEventListener('pointerdown', fire);
      box.addEventListener('keydown', e => { if (Lab.shell.isArmKey(e)) fire(e); });
    }

    /* Whatever this control calls itself, wherever it keeps the name: a knob
       carries it in `.kl`, a dial in `.dial-label`. */
    function labelOf(node) {
      if (!node) return null;
      const n = node.querySelector ? node.querySelector('.kl, .dial-label') : null;
      const t = n && (n.textContent || '').trim();
      return t || null;
    }

    function pulseReason() {
      const own = bpmDecl && bpmDecl.says;
      if (own) return (typeof own === 'function' ? own(labelOf(bpmKnob)) : own);
      return SAYS.pulse(labelOf(bpmKnob));
    }

    function masterSay(kind) {
      return function (e) {
        if (kind === 'bpm') {
          if (bpmDecl && bpmDecl.sentence) {
            return (typeof bpmDecl.sentence === 'function' ? bpmDecl.sentence() : bpmDecl.sentence);
          }
          return andStart(pulseReason());
        }
        const wrap = e.target.closest && e.target.closest('.knob-wrap');
        const kl = wrap && wrap.querySelector('.kl');
        return andStart(SAYS.master(kl && kl.textContent.trim()));
      };
    }
    Object.keys(page.masterKnobs || {}).forEach(k => coldAnswer(page.masterKnobs[k], masterSay('master')));
    if (bpmKnob) coldAnswer(bpmKnob, masterSay('bpm'));

    /* ---- a transport page's instrument answers a cold hand too ----
       On an arm page every control in here IS the start gesture, so silence is
       impossible. On a transport page nothing in the instrument starts
       anything, and the standard cells' answer covers only the standard cells:
       a toy column live from cold — a density gate, a rate knob, a memory
       switch — moves, changes its readout, sounds nothing and says nothing.
       That is finding 2's failure with a different control in the chair.

       Bound on the region and skipped for anything that already answers for
       itself, so the specific sentence wins over the general one. */
    if (decl.transport) {
      /* The REASON from the toy, the remedy from the library — the split every
         other answer takes, and the one this slot did not: `instrumentSays` was
         returned verbatim, so a page that worded it kept a second copy of the
         gesture phrase beside the library's. On a page where nothing in the
         instrument asks for sound this is not decoration: it is the sentence a
         cold hand meets on every control there is. */
      const instrumentSays = function () {
        const whole = words(startDecl.instrumentSentence);
        if (whole) return whole;
        const reason = words(startDecl.instrumentSays);
        return andStart(reason || 'the instrument is stopped, so nothing here sounds yet');
      };
      const regionFire = function (e) {
        /* Skip anything that answers for itself: a control that declines has
           its own sentence, and a control that ASKS has an answer made of
           sound. Painting "the instrument is stopped" over an instrument the
           press has just started is the region telling the visitor the opposite
           of what they can hear. */
        if (e.target.closest && e.target.closest('[data-pp-decline],[data-pp-asks]')) return;
        answer(instrumentSays());
      };
      instrument.addEventListener('pointerdown', regionFire);
      instrument.addEventListener('keydown', function (e) {
        if (Lab.shell.isArmKey(e)) regionFire(e);
      });
      page.instrumentSays = instrumentSays;
    }

    function controlLabel(c) { return (c.el.textContent || '').trim() || 'that control'; }
    /* The same split the rack takes: `says` is the REASON and the composition
       appends the remedy, so the gesture phrase has one reader. `sentence` is
       for a page owning the whole string, and it takes the phrase with it.
       Before this, `says` was returned verbatim, so every page that worded its
       own controls kept a second copy of "Press Play to start it" beside the
       library's — which is the drift the split exists to prevent, one slot
       along from where it was fixed. */
    function controlSay(c) {
      if (c.sentence) return (typeof c.sentence === 'function' ? c.sentence() : c.sentence);
      const reason = c.says
        ? (typeof c.says === 'function' ? c.says() : c.says)
        : SAYS.control(controlLabel(c));
      return andStart(reason);
    }
    declaredControls.forEach(function (c) { coldAnswer(c.el, () => controlSay(c)); });

    /* ---- two presses, disarmed by any write in between ----
       DESIGN.md's rule, and the half `Lab.ui.confirm` cannot do for itself: the
       component knows when it was pressed and not what a write is. The
       composition does — a hand on the armed region is a hand on the
       instrument — so every session control carrying `.disarm()` is disarmed by
       a press, a key or an input anywhere inside it. Over-disarming is the safe
       direction: it can cost a second press, where under-disarming costs the
       visitor's work. A toy that writes from somewhere else calls `.disarm()`
       itself, and `page.disarmConfirms()` is the same call for all of them. */
    /* Every control carrying `.disarm()`, WHEREVER it was laid out. It used to
       be the session bar only, and a page whose destructive act belongs beside
       the thing it destroys — a cut on the branch under the finger — put its
       confirm on the stage, inside the armed region and outside what the
       composition watched. `DESIGN.md` says a confirm is disarmed by any write
       in between, and where it sits is not part of that sentence.
       `page.watchConfirm(el)` adds one built later. */
    const confirms = [];
    function watchConfirm(c) {
      if (c && typeof c.disarm === 'function' && confirms.indexOf(c) === -1) confirms.push(c);
      return c;
    }
    [].concat(decl.session || [], decl.stage || [], decl.globals || [],
              (decl.controls || []).map(c => (c && c.el) ? c.el : c),
              teaserControls.map(c => c.el))
      .forEach(function (item) {
        if (!item) return;
        watchConfirm(item);
        // a confirm dropped inside a panel is still a confirm
        if (item.querySelectorAll) {
          item.querySelectorAll('button').forEach(watchConfirm);
        }
      });
    /* A press on the confirm ITSELF is not a write to what it destroys. Without
       that exception a confirm on the stage — inside the armed region, which is
       the whole reason this now watches more than the session bar — would
       disarm itself on its own second press and re-arm instead of acting. */
    /* `exempt`, when it is given at all, IS the answer: it is the control the
       gesture was on, and `e.target` is not consulted. That distinction is the
       whole of this function's correctness for a KEY.

       A pointer press carries its own target and the exemption is read off it —
       the button under the finger. A window-level write key does not: its
       `e.target` is whatever holds FOCUS, and arming a confirm with a pointer
       is exactly what leaves focus on that confirm. So the fallback exempted
       the one control the key was supposed to clear, and a cut armed on one
       branch survived the key that moved the finger off it — the next press
       then destroying a branch the visitor never armed it on. A `writeKeys`
       entry knows better than the focus does: a keyed entry stands for a press
       on its own `el`, and that is what may be exempt. A plain entry stands for
       no control, so it exempts nothing, which is the safe direction. */
    function disarmConfirms(e, exempt) {
      const src = (exempt !== undefined)
        ? exempt
        : ((e && e.target && e.target.closest) ? e.target.closest('button') : null);
      confirms.forEach(function (c) { if (c !== src) c.disarm(); });
    }
    {
      /* CAPTURE, and that is the whole of why this works: the rack's standard
         cells decline the start gesture by stopping propagation on the bubble,
         so a level moved with a confirm armed would never reach a bubble-phase
         listener here — the one control most likely to be touched between the
         two presses would be the one that could not disarm. Capture also puts
         this after `hints`, which stops the gesture at document capture while
         hint mode is on: inspecting a control is not a write and must not
         disarm. */
      [instrument, globalsBox, teaserCtls].filter(Boolean).forEach(function (root) {
        root.addEventListener('pointerdown', disarmConfirms, true);
        root.addEventListener('input', disarmConfirms, true);
        root.addEventListener('change', disarmConfirms, true);
        root.addEventListener('keydown', e => { if (Lab.shell.isArmKey(e)) disarmConfirms(e); }, true);
      });
    }
    /* ---- a page declares which of its own keys are writes ----
       The composition treats a press, an operating key or an input inside the
       armed region as a write. A toy's WINDOW-level letter keys are none of the
       three: a key that writes by calling `.click()` on a button fires no
       pointerdown, and `A` is not an arming key. So a confirm armed on one
       branch survived the key that moved the finger, and the second press acted
       on a branch the visitor had left.

       Only the page knows which of its keys write — `A` might append a symbol
       or open a help panel — so it says. A list of `key` values, or a predicate
       for a page that reasons about `code`, modifiers or its own mode. The
       confirm's own key stays exempt exactly as its own press is: the exemption
       is in `disarmConfirms`, which skips the button the event came from.

       Document capture, because these keys are heard at the window and the
       armed region never sees them. */
    if (decl.writeKeys) {
      const wk = decl.writeKeys;
      const asFn = (typeof wk === 'function');
      // a plain string is a key that WRITES; an object is a key that stands for
      // a PRESS on a control, which is more than the composition can otherwise
      // know and exactly what hint mode needs
      const entries = asFn ? [] : wk.map(k => (typeof k === 'string') ? { key: k } : k);
      /* An entry that MEANT to name a control and did not is worth saying out
         loud, because the two things it costs are both silent: no bubble in
         hint mode, and an exemption that falls back to nothing. Falling back to
         nothing is safe — it over-disarms — so this warns rather than refuses.
         The shape that produces it is ordinary: naming an element the page has
         not built yet, which is what happens when a control is made inside a
         rack's `cell()` and declared in the same call that builds the rack. */
      entries.forEach(function (k) {
        if (!k || typeof k !== 'object') return;
        if ('el' in k && !(k.el && k.el.nodeType === 1)) {
          console.warn('Lab.page: writeKeys entry "' + (k.key || k.code) + '" carries an `el` ' +
            'that is not an element, so this key raises no hint bubble and exempts no ' +
            'confirm. Build the control before Lab.page.build and pass it here.');
        }
      });
      function entryFor(e) {
        for (let i = 0; i < entries.length; i++) {
          const k = entries[i];
          if (k.key === e.key || k.key === e.code || k.code === e.code) return k;
        }
        return null;
      }
      document.addEventListener('keydown', function (e) {
        const hit = asFn ? (wk(e) ? {} : null) : entryFor(e);
        if (!hit) return;
        /* IN HINT MODE, a key that stands for a press becomes that press. The
           layer answers `pointerdown`, and a key driving a button through
           `.click()` fires none — so the key acted while the same button under
           a finger would have been explained, which is the one thing hint mode
           exists to make impossible. The key is swallowed and the bubble the
           press would have raised is shown instead; nothing is written, so
           nothing is disarmed. A plain entry carries no control, so there is
           nothing to show and no ground to swallow: the page acts, and the
           write disarms as it would from a hand. */
        /* `el` may be a FUNCTION, read when the key fires. The controls a key
           stands for are often built after the page and rebuilt when the
           material changes — ten recall digits standing for ten chips that come
           and go — so a page that had to name an element at build named the
           enclosing panel instead, and hint mode showed the panel's bubble. */
        const target = (typeof hit.el === 'function') ? hit.el(e) : hit.el;
        if (target && hints && hints.on) {
          e.preventDefault();
          e.stopPropagation();
          hints.show(target);
          return;
        }
        /* The exemption is the control this key STANDS FOR, and never the one
           that happens to hold focus — see `disarmConfirms`. A keyed entry
           passes its own `el`; a plain entry passes `null`, which exempts
           nothing. Either way `e.target` is out of it. */
        disarmConfirms(e, target || null);
      }, true);
    }

    page.disarmConfirms = disarmConfirms;
    page.watchConfirm = watchConfirm;

    /* ============================================================
       THE START GESTURE
       ============================================================ */
    function firstStart() { everStarted = true; }

    /* One arm for everything on a transport page that asks for sound: the
       globals in the master strip, and any cell inside the instrument marked
       `asks`. Built on demand, because a page with neither needs none, and
       shared, because two arms racing the same unlock would press Play twice. */
    let asksArm = null;
    function ensureAsksArm() {
      if (asksArm) return asksArm;
      asksArm = Lab.shell.arm({
        root: [globalsBox],
        onBlocked: function () { signpost(blockedText(), 6000, true); },
        onStart: function () { if (page.transport && !page.transport.running) page.transport.press(); }
      });
      page.arm = asksArm;
      return asksArm;
    }

    if (decl.transport) {
      const t = Lab.shell.start({
        button: transportBtn,
        labels: decl.transport.labels,
        onStart: async function () {
          started = true;
          firstStart();
          if (decl.transport.onStart) await decl.transport.onStart();
          paint();
        },
        onStop: function () {
          started = false;
          if (decl.transport.onStop) decl.transport.onStop();
          paint();
        }
      });
      page.transport = t;

      /* A transport page still ARMS THE GLOBALS. A button that asks eight
         voices for sound is asking for sound wherever it sits, and on a page
         with a transport it used to be the one control that did nothing from
         cold and said nothing about it: `arm` was only ever called on the other
         branch. Now the press unlocks the audio, presses Play, and the toy's
         own handler acts on a running instrument. */
      if ((decl.globals || []).length) ensureAsksArm();

      /* A TAB STOP HERE TOO. On an arm page the region is focusable because it
         IS the keyboard start; on a transport page Play is the start, and the
         region was left with no tab stop at all — so a canvas stage had nowhere
         to put focus and a mark on a roll could not be reached by a keyboard.
         One line, and a surface has somewhere to land. */
      instrument.tabIndex = 0;
      instrument.setAttribute('role', 'group');
      instrument.setAttribute('aria-label', decl.instrumentLabel || 'the instrument');
      if (decl.instrumentHint) instrument.dataset.hint = decl.instrumentHint;
    } else {
      /* The instrument region is a TAB STOP, and that is the page's keyboard
         start: `arm` already answers Enter and Space, so a focusable region is
         the whole of it. Without one, a keyboard visitor's only route to the
         audio was whichever global the toy happened to declare — a button the
         template invites the next builder to delete. */
      instrument.tabIndex = 0;
      instrument.setAttribute('role', 'group');
      instrument.setAttribute('aria-label', decl.instrumentLabel ||
        'the instrument — press Enter to start the audio, then Tab to any control');
      instrument.dataset.hint = decl.instrumentHint ||
        'the instrument. The first touch anywhere in here starts the audio.';

      /* Two roots, not one: the instrument, and the globals up in the bar.
         See the note on `arm`. */
      page.arm = Lab.shell.arm({
        root: [instrument, globalsBox],
        onBlocked: function () { signpost(blockedText(), 6000, true); },
        onStart: async function () {
          started = true;
          firstStart();
          signpostUntil = 0;
          if (decl.onStart) await decl.onStart();
          paint();
        }
      });
    }

    /* A rack column declaring `asks` routes every cell it built through the
       same call a toy would make by hand. It runs here, after the start gesture
       exists, because on a transport page an asking cell becomes a root of it. */
    if (rackEl && rackEl.asksCells) rackEl.asksCells.forEach(asksCell);
    // a confirm built inside a cell is in none of the declared lists the
    // write-watch sweeps, so the rack collects them and the page routes them
    if (rackEl && rackEl.cellConfirms) rackEl.cellConfirms.forEach(watchConfirm);

    /* ---- the teaser arms, and the desk is marked ----
       EVERYTHING IN THE TEASER'S CONTROLS ARMS. On the phone those one or two
       controls are the whole hand, and an instrument whose only control
       declines is a broken page. On an arm page the box is another root of the
       arm; on a transport page it joins the arm the globals use, so a control
       pressed from cold presses Play first and then acts. Play and "?" sit in
       the head, outside it: Play IS the transport, and an arm on it would press
       Play twice, once from the unlock and once from the click. */
    if (teaserDecl) {
      if (decl.transport) ensureAsksArm().add(teaserCtls);
      else page.arm.add(teaserCtls);
    }

    /* The desk: the master strip, the rack, the session bar, the standing
       text, the keys line, and every stage member the teaser does not keep.
       The nameplate, the start line and the footer are both pages'; the phone
       has its own standing text (`teaser.text`). Marked
       only when a teaser is declared — without one, the desktop page IS what
       a phone gets, whole. */
    let teaserKeepsStage = false;
    if (teaserDecl) {
      [bar, page.rackWrap, session, textEl, keysEl].forEach(n => { if (n) n.classList.add('pp-desk'); });
      stage.classList.add('pp-teased');
      const ts = teaserDecl.stage;
      const keepList = Array.isArray(ts) ? ts : null;
      const kept = m => ts === true || (keepList && keepList.indexOf(m) !== -1);
      const onStage = [];
      Array.prototype.forEach.call(stage.children, function (child) {
        if (child.classList.contains('pp-stagerow')) {
          let rowKept = false;
          Array.prototype.forEach.call(child.children, function (m) {
            onStage.push(m);
            if (kept(m)) rowKept = true; else m.classList.add('pp-desk');
          });
          if (rowKept) teaserKeepsStage = true; else child.classList.add('pp-desk');
        } else {
          onStage.push(child);
          if (kept(child)) teaserKeepsStage = true; else child.classList.add('pp-desk');
        }
      });
      // nothing kept: the stage, and with the rack gone the whole instrument,
      // would be an empty tab stop on the phone
      if (!teaserKeepsStage) { stage.classList.add('pp-desk'); instrument.classList.add('pp-desk'); }

      /* The rules the slot states, checked where they can be at build. Warnings,
         not refusals: each one is a page that still works on the desktop. */
      const warn = msg => console.warn('Lab.page: teaser — ' + msg);
      if (keepList) keepList.forEach(function (m) {
        if (onStage.indexOf(m) === -1) warn('`stage` keeps an element that is not on the stage; ' +
          'only a declared stage member can be kept.');
      });
      if (teaserControls.length > 2) warn(teaserControls.length + ' controls. The teaser is ' +
        'one or two — the smallest thing that is still this toy.');
      if (!teaserControls.length && !decl.transport && !teaserKeepsStage) warn('no controls, ' +
        'no Play and no kept stage: nothing on the phone can start the audio.');
      teaserControls.forEach(function (c, i) {
        const name = (c.el.textContent || '').trim().slice(0, 24) || ('control ' + (i + 1));
        if (!(c.el.matches && c.el.matches('[data-hint]')) && !c.el.querySelector('[data-hint]')) {
          warn('"' + name + '" carries no data-hint, so the "?" layer has nothing to say about it.');
        }
        if ((c.el.matches && c.el.matches('[data-pp-decline]')) || c.el.querySelector('[data-pp-decline]')) {
          warn('"' + name + '" declines the start gesture. Everything in the teaser arms: ' +
            'on the phone these controls are the whole hand.');
        }
      });
    }

    /* ============================================================
       THE POLL — and why it stops
       rAF stops in a hidden tab and setInterval does not, so a page left
       open in a background tab repaints a line nobody is reading, forever.
       It stops on hide and repaints the moment the tab is back.
       ============================================================ */
    let poll = 0;
    function startPoll() {
      if (poll) return;
      poll = setInterval(paint, startDecl.everyMs || 200);
    }
    function pausePoll() { if (poll) { clearInterval(poll); poll = 0; } }
    function onVisibility() {
      if (document.hidden) pausePoll();
      else { paint(); startPoll(); }
    }
    document.addEventListener('visibilitychange', onVisibility);
    /* `stop()` ends it for good, which means the listener goes too: leaving it
       bound made the next return to the tab start the interval again, so a
       page that had stopped its own poll was one tab switch from running it. */
    function stopPoll() {
      pausePoll();
      document.removeEventListener('visibilitychange', onVisibility);
    }

    page.wrap = mount;
    page.bar = bar;
    page.barSpacer = spacer;
    page.startLine = startLine;
    page.instrumentEl = instrument;
    page.stage = stage;
    page.rack = rackEl;
    page.globals = globalsBox;
    page.controls = controlsBox;
    page.session = session;
    page.textEl = textEl;
    page.setText = setText;
    page.keysEl = keysEl;
    page.statusEl = statusEl;
    page.footer = framed.footer;
    page.h1 = framed.h1;
    page.sub = framed.sub;
    page.hints = hints;
    page.midi = midi;
    page.bpmKnob = bpmKnob;
    page.teaser = teaserDecl ? {
      el: teaserBox, head: teaserHead, controls: teaserCtls, play: teaserPlay,
      hint: teaserHintBtn, foot: teaserFoot, invite: framed.invite, text: teaserTextEl,
      share: teaserShare ? teaserShare.el : null,
      get small() { return small(); }
    } : null;
    page.stop = stopPoll;
    Object.defineProperty(page, 'started', { get: () => started });
    Object.defineProperty(page, 'everStarted', { get: () => everStarted });

    paint();
    checkAllFit();
    checkOwnedNames();
    if (!document.hidden) startPoll();
    return page;
  }

  return { build: build, STATES: STATES, staleNotice: staleNotice, missing: missing };
})();
