"use strict";
/* ============================================================
   Lab.ui — the standard bench controls (pairs with lab.css).

   Factories return DOM elements ready to drop into a .bar or a
   .lane. One interaction grammar everywhere:
     - drag to set (knob: vertical; gate: horizontal along the bar)
     - DOUBLE-CLICK resets to the control's default
     - live readout (a .val span, or the tooltip on mini-ranges)
     - hint: one sentence on what the control does, at most 12
       words and 80 characters, lowercase, no final period; a key
       the toy binds goes in a bracketed tail ("start the piece
       [Space]"), outside the count. Carried on the wrapper so a
       hover explains the dial wherever the pointer lands. The
       tooltip never repeats a value that is already
       visible — only the mini-range keeps its value in the
       tooltip, because without val:true it has no other readout
     - onChange(v) fires on EVERY change, including once at
       creation — so wiring a control also applies its initial
       value and UI/engine state can never disagree.
   Every factory's return value carries .set(v) for external sync
   (it re-renders AND fires onChange; the setters it drives must
   be idempotent, which plain "params.x = v" assignments are).

   Depends only on lab.css markup conventions; audio-independent
   except the two factories that ARE the audio surface — masterFx,
   which drives Lab.audio's master-chain setters, and rack, whose
   STANDARD columns drive Lab.voices' per-voice buses.
   ============================================================ */
window.Lab = window.Lab || {};

Lab.ui = (function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // step-quantize relative to min, then kill float dust (0.30000000000000004)
  function quant(v, min, max, step) {
    let q = Math.round((v - min) / step) * step + min;
    const dec = (String(step).split('.')[1] || '').length;
    return clamp(parseFloat(q.toFixed(dec)), min, max);
  }

  /* shared drag plumbing — Pointer Events with CAPTURE.
     setPointerCapture retargets every later event of this pointer to the
     control, so the finger/mouse may leave it and the drag still tracks
     without any window-level listener. pointercancel is not an edge case on
     touch: the browser fires it whenever it takes the gesture over (a scroll
     takes priority, a system edge-swipe, an incoming call), and a handler
     that only listens for pointerup keeps tracking a finger that is no
     longer there. Non-primary buttons never start a drag — right-click must
     stay available for the page's own menu. */
  /* ---- a finger's throw ----
     A vertical rotary throw sized for a mouse is too short for a thumb: on a
     phone the bipolar bias dial went from 0 to +1, half its range, in one
     short swipe, because a 160 px throw is under 3 cm of glass. A finger
     drag gets twice the travel. On a 390 x 844 px phone, about 60 px to the
     centimetre, the dial's 320 px is about 5 cm, a long single thumb stroke
     that fits the 844 px height with room above and below the face; half the
     range is a comfortable 2.7 cm, and 1 % is 3 px, above the couple of
     pixels a resting thumb wanders. Read per GESTURE from the pointer that
     pressed, not from the device: a touch laptop's mouse keeps the mouse
     throw. Keyboard steps do not pass through here. */
  const TOUCH_THROW = 2;
  const throwScale = e => (e && e.pointerType === 'touch') ? TOUCH_THROW : 1;

  function drag(el, onDown, onMove, onUp) {
    el.addEventListener('pointerdown', e => {
      if (e.button) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      onDown(e);
      const mv = ev => { if (ev.pointerId === e.pointerId) onMove(ev); };
      const end = ev => {
        if (ev && ev.pointerId != null && ev.pointerId !== e.pointerId) return;
        el.removeEventListener('pointermove', mv);
        el.removeEventListener('pointerup', end);
        el.removeEventListener('pointercancel', end);
        try { el.releasePointerCapture(e.pointerId); } catch (_) {}
        if (onUp) onUp(ev);
      };
      el.addEventListener('pointermove', mv);
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
    });
  }

  /* ---- taper — the wire between a control's POSITION and a value ----
     A control's authoritative quantity is its position, 0..1; the taper is
     what that position MEANS. Three shapes, and the choice belongs to the
     parameter rather than to the control:

       (none)      linear.
       'log'       equal ratios per equal travel — the one a frequency wants,
                   and it needs min > 0.
       a NUMBER    a power curve, value = min + span·nᵞ. This is the shape for
                   a range that reaches zero, where log cannot go: γ > 1 gives
                   the bottom of the range most of the travel.

     It is a standalone factory because a taper is not the dial's property: a
     surface that draws a parameter anywhere else — a meter, a map, a fader —
     has to place it on the same curve, and two copies of the arithmetic drift.
     `toN` and `toV` are inverses over [min,max]. */
  function taper(spec) {
    const min = spec.min, max = spec.max, span = max - min;
    const log = (spec.taper === 'log' && min > 0 && max > min);
    const g = (typeof spec.taper === 'number' && spec.taper > 0) ? spec.taper : 0;
    return {
      toN: function (v) {
        if (log) return Math.log(v / min) / Math.log(max / min);
        if (!span) return 0;
        const n = clamp((v - min) / span, 0, 1);
        return g ? Math.pow(n, 1 / g) : n;
      },
      toV: function (n) {
        if (log) return min * Math.pow(max / min, n);
        return min + (g ? Math.pow(clamp(n, 0, 1), g) : n) * span;
      }
    };
  }

  /* ---- rotary knob — continuous params ----
     Vertical pointer-drag: ~130 px of travel = the full range, twice that
     for a finger (opts.fine multiplies the travel, e.g. fine:2 → 260 px).
     Pointer line: −135° (min) .. +135° (max), up at mid.

     REACHABLE BY TAB AND OPERABLE BY THE ARROWS, like `dial`. That is the
     collection's rule for a published page and it costs a lab toolbar nothing:
     the visuals, the drag and the double-click are untouched, and what is added
     is a tab stop, a `slider` role and the same key set the dial answers. It
     matters most where a toy cannot reach in to fix it — `rack` builds its own
     gain knobs, so before this the collection's standard LEVEL control was
     unreachable from a keyboard on every page that had one.               */
  function knob(opts) {
    const min = opts.min, max = opts.max;
    const step = (opts.step == null) ? (max - min) / 100 : opts.step;
    const def = (opts.def == null) ? opts.value : opts.def;
    const fmt = opts.fmt || (v => String(v));
    const throwPx = 130 * (opts.fine || 1);
    const coarse = Math.max(step, (max - min) / 10);   // Page / Shift-arrow
    let val;

    const w = document.createElement('span'); w.className = 'knob-wrap';
    const l = document.createElement('span'); l.className = 'kl'; l.textContent = opts.label || '';
    const k = document.createElement('div'); k.className = 'knob';
    const p = document.createElement('div'); p.className = 'ptr';
    const r = document.createElement('span'); r.className = 'val';
    k.append(p);
    w.append(l, k, r);

    k.setAttribute('role', 'slider');
    k.tabIndex = 0;
    k.setAttribute('aria-valuemin', min);
    k.setAttribute('aria-valuemax', max);
    if (opts.label) k.setAttribute('aria-label', opts.label);

    function render() {
      const n = (val - min) / (max - min);
      p.style.transform = 'translateX(-50%) rotate(' + ((n - 0.5) * 270) + 'deg)';
      r.textContent = fmt(val);
      k.setAttribute('aria-valuenow', val);
      k.setAttribute('aria-valuetext', (opts.label ? opts.label + ' ' : '') + fmt(val));
    }
    function set(v) {
      val = quant(v, min, max, step);
      render();
      if (opts.onChange) opts.onChange(val);
    }

    drag(k,
      e => { k._y0 = e.clientY; k._v0 = val; k._t = throwPx * throwScale(e); },
      e => set(k._v0 + (k._y0 - e.clientY) / k._t * (max - min)));
    k.addEventListener('dblclick', () => set(def));

    k.addEventListener('keydown', e => {
      const s = e.shiftKey ? coarse : step;
      let v = null;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') v = val + s;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') v = val - s;
      else if (e.key === 'PageUp') v = val + coarse;
      else if (e.key === 'PageDown') v = val - coarse;
      else if (e.key === 'Home') v = min;
      else if (e.key === 'End') v = max;
      if (v === null) return;
      e.preventDefault();
      set(v);
    });

    if (opts.hint) { w.dataset.hint = opts.hint; w.title = opts.hint; }
    w.set = set;
    w.face = k;
    set(opts.value);                       // init fires onChange
    return w;
  }

  /* ---- dial — the touch-first, screen-readable rotary ----
     The public-facing sibling of `knob`: same vertical-drag grammar, but
     sized for a finger (≥44 px face), operable from the keyboard, and
     announced as a slider. Use it on a page a stranger will meet; `knob`
     stays the dense bench control for a lab toolbar.

     Its callback is `onInput`, NOT `onChange`, and the difference is the
     point: `onInput` fires only for a *gesture* (drag, key, or an explicit
     `.set` from a MIDI binding), never at creation. A dial belongs to a
     surface that points at state living elsewhere, so the traffic runs the
     other way — the engine is read into the dial with `.show(v)`, which
     renders without calling back. A control that fired on creation, or on
     every display refresh, would write the value it was only supposed to
     display, and two dials mirroring one parameter would drive each other.

     `.setLabel(name)` re-letters the dial in place: this is what makes a
     dial a window onto whatever it currently addresses rather than the
     permanent home of one parameter.

     The dial's authoritative quantity is its POSITION, 0..1, not its
     value: `taper:'log'` then makes a 20 Hz .. 16 kHz range playable
     under a finger instead of spending nine tenths of the travel above
     2 kHz. Drag, keyboard and arc all work in position; the value is
     what the position means.

     `onDefault` is the second gesture: a clean double press, no drag. The
     dial does not know what the default IS — it reports the gesture and the
     owner of the value answers it, which is the only arrangement that works
     on a dial that re-points.

     opts: { label, value, min, max, step?, taper?, fmt, hint, fine?,
             color?, onInput?, onDefault? }                            */
  function dial(opts) {
    // The scale is mutable state, not closure constants: `retarget` points
    // this dial at a different parameter — new name, new range, new taper,
    // new formatting — without replacing the element. A surface that
    // re-points is the whole reason this control exists, and swapping the
    // node instead would drop focus, any MIDI binding, and the identity
    // every other reference holds.
    let min = opts.min, max = opts.max;
    let curve = taper(opts);
    let straight = !opts.taper;                            // linear: a step is a fixed slice of travel
    let step = opts.step;                                  // undefined = continuous
    let fmt = opts.fmt || (v => String(v));
    let stepN = (step && straight) ? step / (max - min) : 0.01;
    const throwPx = 160 * (opts.fine || 1);
    const R = 40, C = 2 * Math.PI * R, SWEEP = 0.75 * C;   // 270° of the circle
    const toN = v => curve.toN(v);
    const toV = n => curve.toV(n);
    const snap = v => (step ? quant(v, min, max, step) : clamp(v, min, max));
    let pos = clamp(toN(clamp(opts.value == null ? min : opts.value, min, max)), 0, 1);
    let val = snap(toV(pos));
    let disabled = false;
    /* READ-ONLY is not disabled, and the difference is the whole point. A dial
       built as a VIEW of state living elsewhere — which `DESIGN.md` says every
       cell displaying state elsewhere must be — still moved under a drag and
       reported the move to nobody: a control that moves, changes its readout
       and produces nothing, which is the failure the decline machinery exists
       to prevent, reached from a third side. The only tool was
       `setDisabled(true)`, which is inert and out of the tab order (both right)
       and also dimmed to 45% and announced `aria-disabled` (both wrong for a
       live readout nobody may touch but everybody must read). */
    let readOnly = !!opts.readOnly;

    const w = document.createElement('div'); w.className = 'dial-wrap';
    const l = document.createElement('div'); l.className = 'dial-label';
    l.textContent = opts.label || '';
    const f = document.createElement('div'); f.className = 'dial';
    f.setAttribute('role', 'slider');
    f.tabIndex = 0;
    const r = document.createElement('div'); r.className = 'dial-val';

    f.innerHTML =
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
        '<circle class="dt" cx="50" cy="50" r="' + R + '" ' +
          'stroke-dasharray="' + SWEEP.toFixed(2) + ' ' + C.toFixed(2) + '" ' +
          'transform="rotate(135 50 50)"/>' +
        '<circle class="da" cx="50" cy="50" r="' + R + '" ' +
          'stroke-dasharray="0 ' + C.toFixed(2) + '" ' +
          'transform="rotate(135 50 50)"/>' +
        '<line class="dp" x1="50" y1="50" x2="50" y2="16"/>' +
      '</svg>';
    const arc = f.querySelector('.da'), ptr = f.querySelector('.dp');
    if (opts.color) f.style.setProperty('--dial-hue', opts.color);
    w.append(l, f, r);

    function render() {
      arc.setAttribute('stroke-dasharray', (pos * SWEEP).toFixed(2) + ' ' + C.toFixed(2));
      ptr.setAttribute('transform', 'rotate(' + ((pos - 0.5) * 270).toFixed(2) + ' 50 50)');
      r.textContent = fmt(val);
      f.setAttribute('aria-valuemin', min);
      f.setAttribute('aria-valuemax', max);
      f.setAttribute('aria-valuenow', val);
      f.setAttribute('aria-valuetext', (opts.label ? opts.label + ' ' : '') + fmt(val));
      if (readOnly) f.setAttribute('aria-readonly', 'true');
      else f.removeAttribute('aria-readonly');
      /* The label is a sibling div, so the slider element itself carries no
         accessible NAME: a screen reader announces a value with nothing to
         attach it to, and a surface of dials reads as a row of anonymous
         sliders. It is written here rather than once at build because
         `setLabel` and `retarget` are what this control exists for — the name
         changes while the element does not, and the announced name has to
         change with it. */
      if (opts.label) f.setAttribute('aria-label', opts.label);
      else f.removeAttribute('aria-label');
    }
    function showN(n) {
      pos = clamp(n, 0, 1);
      val = snap(toV(pos));
      render();
    }
    function setN(n) {
      if (disabled || readOnly) return;
      const before = val;
      showN(n);
      if (val !== before && opts.onInput) opts.onInput(val);
    }
    // display only: the engine writing into the dial
    function show(v) { showN(toN(clamp(v, min, max))); }
    // a gesture: render AND report
    function set(v) { setN(toN(clamp(v, min, max))); }

    /* ---- the double press ----
       A drag is a write and a clean double press is `onDefault` — the gesture
       for "put this back where the thing it addresses says it belongs". It is
       detected here rather than left to the native `dblclick` for two reasons:
       dblclick is a mouse event, and a surface whose whole grammar is a
       pointer drag must answer a double TAP the same way; and the drag has to
       win, so any travel over a few pixels disqualifies the pair. TAP_MS is
       the usual double-click window.

       Never the only path to anything (see the collection's grounding): every
       default a double press reaches is also on a button. */
    const TAP_MS = 340, TAP_SLOP = 4;
    let lastTap = 0, moved = false, x0 = 0, y0 = 0;
    drag(f,
      e => {
        f._y0 = e.clientY; f._n0 = pos; f._t = throwPx * throwScale(e); f.classList.add('grab');
        moved = false; x0 = e.clientX; y0 = e.clientY;
      },
      e => {
        if (Math.abs(e.clientY - y0) > TAP_SLOP || Math.abs(e.clientX - x0) > TAP_SLOP) moved = true;
        setN(f._n0 + (f._y0 - e.clientY) / f._t);
      },
      () => {
        f.classList.remove('grab');
        if (moved || disabled || !opts.onDefault) { lastTap = 0; return; }
        const t = Date.now();
        if (t - lastTap < TAP_MS) { lastTap = 0; opts.onDefault(); }
        else lastTap = t;
      });

    f.addEventListener('keydown', e => {
      // a read-only dial swallows nothing: it is not a control, so the key
      // travels on to whatever else on the page is listening for it
      if (disabled || readOnly) return;
      const s = e.shiftKey ? Math.max(stepN, 0.1) : stepN;
      let n = null;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') n = pos + s;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') n = pos - s;
      else if (e.key === 'PageUp') n = pos + 0.1;
      else if (e.key === 'PageDown') n = pos - 0.1;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = 1;
      if (n === null) return;
      e.preventDefault();
      setN(n);
    });

    function setLabel(name) {
      l.textContent = name || '';
      opts.label = name || '';
      render();
    }

    /* Point the dial at a different parameter.
       p: { label?, min?, max?, step?, taper?, fmt?, hint? }; `value` is the
       new target's stored value. `p` REPLACES the scale rather than patching
       it — an omitted `step` or `taper` means continuous and linear, not
       "keep the last parameter's", which is the difference between a dial
       that points somewhere new and one carrying a previous tenant's habits.
       It DISPLAYS: retargeting never calls onInput, because pointing a knob
       at something is not moving it. */
    function retarget(p, value) {
      p = p || {};
      if (p.min != null) min = p.min;
      if (p.max != null) max = p.max;
      curve = taper({ min: min, max: max, taper: p.taper });
      straight = !p.taper;
      step = p.step;
      stepN = (step && straight) ? step / (max - min) : 0.01;
      if (p.fmt) fmt = p.fmt;
      if (p.label != null) setLabel(p.label);
      if (p.hint != null) { w.dataset.hint = p.hint; w.title = p.hint; }
      show(value == null ? val : value);
    }
    w.show = show;
    w.set = set;
    // position-space twins, for anything that speaks in fractions of a
    // throw rather than in the parameter's own unit — a 0..127 MIDI CC
    // sweeps the whole dial, taper included, which is what a hardware
    // knob's travel means
    w.setPos = setN;
    w.setLabel = setLabel;
    w.retarget = retarget;
    w.face = f;
    /* Inert, out of the tab order, announced read-only, and wearing a face that
       reads as a GAUGE rather than as a greyed-out control: full ink, a dashed
       ring, no hover. `.show(v)` still writes it — that is what it is for. */
    function setReadOnly(v) {
      readOnly = !!v;
      w.classList.toggle('ro', readOnly);
      f.tabIndex = (readOnly || disabled) ? -1 : 0;
      render();
    }
    w.setReadOnly = setReadOnly;
    w.setDisabled = function (v) {
      disabled = !!v;
      w.classList.toggle('off', disabled);
      f.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      f.tabIndex = (disabled || readOnly) ? -1 : 0;
    };
    Object.defineProperty(w, 'value', { get: () => val });
    Object.defineProperty(w, 'pos', { get: () => pos });
    if (opts.hint) { w.dataset.hint = opts.hint; w.title = opts.hint; }
    if (readOnly) setReadOnly(true);
    render();                              // creation DISPLAYS; it never fires
    return w;
  }

  /* ---- mini-range — long-throw linear gestures ----
     The grid's compact labeled slider; the linear slide IS the
     point (performance gestures). opts.val:true adds a visible
     .val readout (default: readout lives in the tooltip).        */
  function miniRange(opts) {
    const def = (opts.def == null) ? opts.value : opts.def;
    const fmt = opts.fmt || (v => String(v));

    const w = document.createElement('span'); w.className = 'km';
    const l = document.createElement('span'); l.className = 'kl'; l.textContent = opts.label || '';
    const r = document.createElement('input'); r.type = 'range'; r.className = 'kn';
    r.min = opts.min; r.max = opts.max; r.step = opts.step; r.value = opts.value;
    const vv = opts.val ? document.createElement('span') : null;
    if (vv) vv.className = 'val';
    w.append(l, r); if (vv) w.append(vv);
    w.input = r;

    function paint(v) {
      // the value stays in this tooltip: without val:true it is the only
      // place a mini-range shows it
      r.title = (opts.hint ? opts.hint + ' · ' : '') +
                (opts.label ? opts.label + ': ' : '') + fmt(v);
      if (vv) vv.textContent = fmt(v);
      r.setAttribute('aria-valuetext', (opts.label ? opts.label + ' ' : '') + fmt(v));
    }
    function fire() {
      const v = parseFloat(r.value);
      paint(v);
      if (opts.onChange) opts.onChange(v);
    }
    r.addEventListener('input', fire);

    /* ---- the double press ----
       `onDefault` is the same gesture, and the same division of labour, as the
       dial's: the control reports the PRESS and whoever owns the value answers
       it. A range that resets itself to a number it was handed at build is
       wrong on any surface where the thing it addresses can change, and wrong
       again where "default" belongs to a sound rather than to a control.

       Without `onDefault` the old behaviour stands — reset to `def`, which is
       what a fixed bench slider wants. Detected on the pointer's own
       down-and-up as well as on `dblclick`, because dblclick is a mouse event
       and a surface whose grammar is a drag must answer a double TAP the same
       way; any travel over a few pixels disqualifies the pair, so the drag
       always wins. */
    const TAP_MS = 340, TAP_SLOP = 4;
    let lastTap = 0, x0 = 0, y0 = 0;
    function dbl() {
      if (opts.onDefault) opts.onDefault();
      else { r.value = def; fire(); }
    }
    w.addEventListener('dblclick', e => { e.stopPropagation(); dbl(); });
    w.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; });
    w.addEventListener('pointerup', e => {
      if (e.pointerType !== 'touch') return;
      if (Math.abs(e.clientX - x0) > TAP_SLOP || Math.abs(e.clientY - y0) > TAP_SLOP) { lastTap = 0; return; }
      const t = Date.now();
      if (t - lastTap < TAP_MS) { lastTap = 0; dbl(); }
      else lastTap = t;
    });

    if (opts.hint) { w.dataset.hint = opts.hint; w.title = opts.hint; }
    w.set = v => { r.value = v; fire(); };
    /* Display only — render the value and call nothing back, the twin of the
       dial's `.show`. It is what a mini-range needs to be a VIEW of state that
       lives elsewhere: `set` re-fires `onChange`, so an engine writing back
       through it would write the value it was only asked to display. */
    w.show = v => { r.value = v; paint(parseFloat(r.value)); };
    fire();                                // init fires onChange
    return w;
  }

  /* ---- Bernoulli gate — the standard PROBABILITY control ----
     Absolute-position horizontal drag over the bar → 0..1.
     Default def is 1 (fully open); pass the toy's own def when
     the resting probability isn't 1.

     Reachable by Tab and moved by the arrows, like `knob` and `dial`. It had
     no keyboard path at all, which on a toy whose density gate is its sole
     rate control meant the one thing worth turning was the one thing a
     keyboard could not reach — and a toy patching that in its own page would
     be hand-rolling a copy of a library control.                 */
  function gate(opts) {
    opts = opts || {};
    const def = (opts.def == null) ? 1 : opts.def;
    let p = (opts.value == null) ? def : opts.value;

    const g = document.createElement('div'); g.className = 'gate';
    if (opts.width) { g.style.width = opts.width + 'px'; g.style.flexBasis = opts.width + 'px'; }
    const fill = document.createElement('div'); fill.className = 'gfill';
    const lk = document.createElement('span'); lk.className = 'gk l';
    // the ends say what the bar measures in words a stranger reads; a toy
    // whose probability has its own words passes `left` and `right`
    lk.textContent = (opts.left == null) ? 'low' : opts.left;
    const rk = document.createElement('span'); rk.className = 'gk r';
    rk.textContent = (opts.right == null) ? 'high' : opts.right;
    const pct = document.createElement('span'); pct.className = 'gpct';
    g.append(fill, lk, rk, pct);
    g.title = opts.hint || 'probability';
    g.dataset.hint = g.title;

    g.setAttribute('role', 'slider');
    g.tabIndex = 0;
    g.setAttribute('aria-valuemin', 0);
    g.setAttribute('aria-valuemax', 1);
    if (opts.label) g.setAttribute('aria-label', opts.label);

    function render() {
      fill.style.width = (p * 100) + '%';
      pct.textContent = Math.round(p * 100) + '%';
      g.setAttribute('aria-valuenow', p);
      g.setAttribute('aria-valuetext', Math.round(p * 100) + '%');
    }
    function set(v) {
      p = clamp(v, 0, 1);
      render();
      if (opts.onChange) opts.onChange(p);
    }
    const fromX = x => {
      const rc = g.getBoundingClientRect();
      set((x - rc.left) / rc.width);
    };
    drag(g, e => fromX(e.clientX), e => fromX(e.clientX));
    g.addEventListener('dblclick', () => set(def));

    // the same key set the other two answer: a hand learns it once
    g.addEventListener('keydown', e => {
      const s = e.shiftKey ? 0.1 : 0.01;
      let v = null;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') v = p + s;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') v = p - s;
      else if (e.key === 'PageUp') v = p + 0.1;
      else if (e.key === 'PageDown') v = p - 0.1;
      else if (e.key === 'Home') v = 0;
      else if (e.key === 'End') v = 1;
      if (v === null) return;
      e.preventDefault();
      set(v);
    });

    g.set = set;
    set(p);                                // init fires onChange
    return g;
  }

  /* ---- dot — 20px square toggle ----
     kind: 'm' mute (amber when on) · 's' solo (green) · omit = neutral */
  function dot(opts) {
    const b = document.createElement('button');
    b.className = 'dot' + (opts.kind ? ' ' + opts.kind : '');
    b.textContent = opts.text || '';
    if (opts.title) { b.dataset.hint = opts.title; b.title = opts.title; }
    let on = !!opts.on;
    const render = () => b.classList.toggle('on', on);
    b.addEventListener('click', () => {
      on = !on; render();
      if (opts.onToggle) opts.onToggle(on);
    });
    b.set = v => { on = !!v; render(); };
    render();
    return b;
  }

  /* ---- confirm — the two-press destructive button ----
     Arm on one press, act on the second, and say on its own face that it is
     waiting: the armed state IS the confirmation, rather than a dialog nobody
     reads. Both faces' text is supplied, because "clear" and "clear — sure?"
     are the toy's words about the toy's own irreversible act.

     Hand-rolled twice before this existed (markov's `clear`, and the same
     shape argued for in the virtualisation reports), which by the collection's
     own charter makes it a library defect rather than a toy's business.

     `disarm()` is the half the library cannot do for itself: "disarmed by any
     write in between" means a write to whatever this button destroys, and only
     the toy knows what that is — markov calls it from `setWeight`. The timeout
     is the other half, and it is here because a button left armed across a
     coffee break is a button whose next press is a surprise.

     `onArm` may return false to refuse the arming outright — for the press
     that has nothing to destroy, where two presses would be theatre.

     opts: { text, armed?, hint?, onConfirm, onArm?, holdMs? }
     Returns the button, carrying .disarm() and .armed.                  */
  function confirm(opts) {
    opts = opts || {};
    /* Both faces are read AT THE MOMENT, not frozen at build. A chip whose
       resting face is a live name — the lane's voice, or the file someone
       dropped on it — could not be this component at all, and the page that
       needed one wrapped a string in an object with a `toString`. Every other
       slot in the collection takes its words as functions; this one does now. */
    const restOf = () => (typeof opts.text === 'function' ? opts.text() : (opts.text || 'clear'));
    const armedOf = () => (typeof opts.armed === 'function' ? opts.armed()
                          : (opts.armed || (restOf() + ' — sure?')));
    const holdMs = (opts.holdMs == null) ? 5000 : opts.holdMs;
    let timer = 0;

    const b = document.createElement('button');
    b.type = 'button';

    function paint() {
      b.textContent = timer ? armedOf() : restOf();
      b.classList.toggle('armed', !!timer);
      b.setAttribute('aria-pressed', timer ? 'true' : 'false');
    }
    function disarm() {
      if (!timer) return;
      clearTimeout(timer);
      timer = 0;
      paint();
    }
    b.addEventListener('click', function () {
      /* `onConfirm` runs BEFORE the repaint, so the face the button falls back
         to is the one the act left behind. Disarming first painted the old
         resting face and left the page to correct it by hand. */
      if (timer) {
        clearTimeout(timer); timer = 0;
        if (opts.onConfirm) opts.onConfirm();
        paint();
        return;
      }
      if (opts.onArm && opts.onArm() === false) return;
      timer = setTimeout(disarm, holdMs);
      paint();
    });

    if (opts.hint) { b.dataset.hint = opts.hint; b.title = opts.hint; }
    b.disarm = disarm;
    Object.defineProperty(b, 'armed', { get: () => !!timer });
    paint();
    return b;
  }

  /* ---- panel — a titled box ----
     `<section class="blk">` with an `h2.blk-head`, which is the collection's
     one shape for "a box with a heading holding one thing". Two toys invented
     it independently under two names (`.panel-head`, `.blkhead`) before it
     lived here; both keep their own name, and everything new takes this one.

     `title` is the bold half and `note` the sentence after the dash, because
     that is the register both inventions arrived at: a label, not a paragraph.
     Content goes straight into the returned section, after the heading.

     opts: { title?, note?, hint?, label?, className? }                  */
  function panel(opts) {
    opts = opts || {};
    const s = document.createElement('section');
    s.className = 'blk' + (opts.className ? ' ' + opts.className : '');
    const h = document.createElement('h2');
    h.className = 'blk-head';
    s.appendChild(h);

    /* `title` and `note` are strings, or NODES. A head that has to carry a
       swatch, a witness mark or an italicised name had to be assembled by
       appending to `.head` and could not go through this function at all — so
       the one call that builds the shape was the one call such a head skipped. */
    function setHead(title, note) {
      h.textContent = '';
      if (title && title.nodeType) h.appendChild(title);
      else if (title) { const b = document.createElement('b'); b.textContent = title; h.appendChild(b); }
      if (note != null && note !== '') {
        if (title) h.appendChild(document.createTextNode(' — '));
        if (note.nodeType) h.appendChild(note);
        else h.appendChild(document.createTextNode(note));
      }
    }
    setHead(opts.title, opts.note);

    if (opts.hint) { h.dataset.hint = opts.hint; h.title = opts.hint; }
    if (opts.label) s.setAttribute('aria-label', opts.label);
    s.head = h;
    s.setHead = setHead;
    return s;
  }

  /* ---- ctl — label-above-control wrapper for transport bars ----
     hint (optional) makes the label a hover surface too: a gate
     carries its own hint, the wrapper carries it over the name.  */
  function ctl(labelText, el, hint) {
    const d = document.createElement('div'); d.className = 'ctl';
    const l = document.createElement('label'); l.textContent = labelText;
    d.append(l, el);
    if (hint) { d.dataset.hint = hint; d.title = hint; }
    return d;
  }

  /* ---- inline — label-BESIDE-control wrapper ----
     The row-wise sibling of ctl, carrying the same tiny .kl label a
     knob keeps next to its dial. Use it to name a control that has
     no label of its own — a gate standing beside a knob reads as its
     sibling only if both wear their names the same way.
     Forwards .set(v) so the wrapper substitutes for the control.   */
  function inline(labelText, el, hint) {
    const w = document.createElement('span'); w.className = 'ictl';
    const l = document.createElement('span'); l.className = 'kl';
    l.textContent = labelText || '';
    w.append(l, el);
    if (hint) { w.dataset.hint = hint; w.title = hint; }
    /* The wrapper carries the name a control has none of its own — which is
       what this factory is FOR — so it hands it to the accessibility tree too.
       A gate named `density` on screen announced as an unnamed slider is a row
       of anonymous sliders to anyone reading it aloud. */
    if (labelText && el.getAttribute && el.getAttribute('role') && !el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', labelText);
    }
    w.set = v => { if (el.set) el.set(v); };
    return w;
  }

  /* ---- status — the fixed toast (#status), 3.2 s auto-clear ---- */
  let statusTimer = null;
  function status(msg, warn) {
    let s = document.getElementById('status');
    if (!s) {
      s = document.createElement('div');
      s.id = 'status'; s.className = 'status';
      document.body.appendChild(s);
    }
    s.innerHTML = msg ? '<span class="' + (warn ? 'no' : 'ok') + '">' + msg + '</span>' : '';
    clearTimeout(statusTimer);
    if (msg) statusTimer = setTimeout(() => { s.innerHTML = ''; }, 3200);
  }

  /* ---- masterFx — THE STANDARD MASTER BOX ----
     Four rotary knobs (master / drive / glue / reverb) wired to
     Lab.audio's master chain. opts overrides INITIAL values only;
     dbl-click always returns to the standard defaults. Creation
     applies the values to Lab.audio (knob init fires onChange),
     so UI and audio always agree. Returns a DocumentFragment —
     drop it straight into a .bar; .knobs keeps the four wrappers
     addressable before insertion.                                */
  function masterFx(opts) {
    opts = opts || {};
    const pc = v => Math.round(v * 100) + '%';
    const frag = document.createDocumentFragment();
    const mk = (label, def, hint, apply, initial) => {
      const k = knob({
        label: label, min: 0, max: 1, step: 0.01,
        value: (initial == null) ? def : initial, def: def,
        fmt: pc, hint: hint, onChange: apply
      });
      frag.appendChild(k);
      return k;
    };
    frag.knobs = {
      master: mk('master', 0.9,  'output level',
        v => Lab.audio.setMaster(v), opts.master),
      drive:  mk('drive',  0,    'waveshaper drive into the glue',
        v => Lab.audio.setDrive(v),  opts.drive),
      glue:   mk('glue',   0.65, 'glue compression (0 transparent, 1 heavy)',
        v => Lab.audio.setGlue(v),   opts.glue),
      reverb: mk('reverb', 0.15, 'shared small-room wet level',
        v => Lab.audio.setReverb(v), opts.reverb)
    };
    return frag;
  }

  /* ---- rack — THE PER-VOICE ROW RACK ----
     One row per sound source, one ordered column list for the whole
     rack, so the columns line up down the page whatever each row
     happens to fill. Standard columns are STRINGS and the library
     owns them, writing straight to that voice's bus
     (Lab.voices.setStrip); anything else is an object the toy
     supplies a cell() for. A mixer is a rack whose columns are only
     strings — that is the whole idea. Like masterFx this factory
     touches audio; every other factory here is inert.

     opts: { rows, columns, state?, onStrip?, onRow?, onRename?,
             labelWidth?, decline? }
       rows       top to bottom. A string is shorthand for
                  { key: id, voice: id }; a row with no `voice` gets
                  no standard strip cells, but its tracks still exist
                  so the rows still line up.
       columns    'name' | 'mute' | 'gain' | 'pan', or
                  { key, label?, width?, align?, span?, cell(ctx)?,
                    caption?, captionSpan?, captionHint? }.
                  cell() returns an Element, or null for an EMPTY
                  cell; a column with no cell() and a non-standard
                  key is a pure SPACER track.
       state      { key: {gain, mute, pan} } initial values.
       onStrip    (key, strip); fires once per row at build carrying
                  the whole strip, then on every change.
       labelWidth 'fit' (default) | a CSS length | false.
       decline    see below — the standard columns' opt-out of the
                  start gesture. Off unless asked for.
       label      an accessible name, used only where the rack has a
                  caption row and is therefore announced as a table.

     A column given as a STRING must be one of the standard four; a
     string the component does not know THROWS, naming them. Anything
     else is an object: with a cell() it is a column, without one it is
     a spacer track.

     CAPTIONS. A column carrying `caption` puts the rack's first row on
     the component's own NAMED TRACK LINES: one label per captioned
     column, locked to that column however the rows below it are filled.
     It is for the case a rack cell cannot cover — the columns meaning
     something no single cell says, a category grid, a unit — and it is
     the one row the component would otherwise refuse to build. Add it
     when the columns need naming; leave it off and there is no row at
     all, which is right for a mixer, where every cell names itself.

     DECLINE. `decline: true` (or an options object) puts the standard
     mute/gain/pan cells OUTSIDE the start gesture through
     Lab.shell.declineArm: a level, a mute and a pan shape the output
     and do not ask for sound, so a page whose armed region contains the
     rack must not start its audio from one. Half a duty, though — the
     other half is an ANSWER, or the visitor gets a control that moves,
     a readout that changes, no sound, and the same instruction still on
     screen. `decline.says(kind, name)` returns that answer and
     `decline.answer(text)` delivers it; with neither, the answer goes
     to the status toast, which is the least a control owes a hand.

     It is OFF by default because declining stops the gesture at the
     cell — including the keys — and a bench page whose rack is not
     inside an armed region has window-level keyboard handlers that
     would stop hearing them. A page laid out by `Lab.page` turns it on.

     Returns the .rack element, carrying .set(key, partial),
     .row(key), .cell(key, colKey), .dim(key, on) and .caption.   */
  const RACK_STD = { name: 1, mute: 1, gain: 1, pan: 1 };
  const RACK_W = { name: 'auto', mute: '20px', gain: 'auto', pan: '128px' };

  function rack(opts) {
    opts = opts || {};
    const rows = (opts.rows || []).map(r => (typeof r === 'string') ? { key: r, voice: r } : r);
    /* A STRING column names one of the standard four and nothing else. A string
       the component does not know used to become a pure spacer track: no cell,
       no control, no warning, and a rack that still rendered and still lined up.
       `DESIGN.md` calls the level column `level` and the component's key is
       `gain`, so that spelling is the one a builder reaches for first — and it
       shipped a rack with no level control, silently. A builder's mistake is
       loud. A spacer is what it always was: an object with a key and no cell. */
    const cols = (opts.columns || []).map(function (c) {
      if (typeof c !== 'string') return c;
      if (RACK_STD[c]) return { key: c };
      throw new Error(
        'Lab.ui.rack: "' + c + '" is not a standard column. The standard columns are ' +
        Object.keys(RACK_STD).join(' · ') + ' — DESIGN.md calls `gain` the level, and ' +
        '`gain` is the key. For a column of your own pass an object with a cell(): ' +
        '{ key: "' + c + '", cell: ctx => … }. For a spacer track pass one without: ' +
        '{ key: "' + c + '", width: "minmax(0,1fr)" }.');
    });
    const init = opts.state || {};
    const el = document.createElement('div');
    el.className = 'rack';
    const built = {};        // rowKey -> { row, cells, strip, push }

    // One track list with NAMED LINES, so a toy can place its own decoration
    // across a range of columns by name without the rack owning the concept.
    const track = [];
    cols.forEach(function (c, i) {
      const names = [];
      if (i > 0) names.push(cols[i - 1].key + '-end');
      names.push(c.key + '-start');
      track.push('[' + names.join(' ') + ']');
      track.push(c.width || RACK_W[c.key] || 'auto');
    });
    if (cols.length) track.push('[' + cols[cols.length - 1].key + '-end]');
    el.style.setProperty('--rack-cols', track.join(' '));

    function dim(key, on) {
      const b = built[key];
      if (b) b.row.classList.toggle('muted', !!on);
    }

    /* The standard columns' opt-out, and the answer that has to come with it.
       `declineArm` is the library's own — an opt-out that named the arming
       events itself would fall behind the moment `arm` grew another one,
       silently, on the one control that was supposed to stay quiet. */
    const declineOpts = (opts.decline === true) ? {} : (opts.decline || null);
    const DECLINE_SAYS = {
      mute: 'taking a voice out of the mix is not asking for sound',
      gain: 'setting an output level is not asking for sound',
      pan: 'placing a voice across the stereo field is not asking for sound'
    };
    /* ---- the four lines a declining control needs, in one place ----
       Block the gesture, mark the element, answer a pointer press, answer a key
       that OPERATES the control. A toy that built its own level cell had to
       write all four by hand; `attachDecline` is what both the standard columns
       and a toy's own column now go through. */
    /* Every answer this rack can put on screen, as the functions that build
       them — so whoever reserves the space they are painted into can measure
       the real texts rather than guess which kinds a rack happens to have. */
    const declineTexts = [];
    const asksCells = [];
    const cellConfirms = [];

    function attachDecline(node, textFn, label) {
      if (!node) return node;
      /* NO rack-level `decline` is not a reason to do nothing. A column that
         declares `decline` has asked for it, and `Lab.ui.rack` is the component
         a bench page uses without the composition — the case its own docs
         describe. Silently ignoring it there ships a level that arms the audio
         and says nothing, which is the failure the whole machinery exists to
         prevent. Without a page to answer into, the answer goes to the toast. */
      const dec = declineOpts || {};
      declineTexts.push([label || 'decline', textFn]);
      /* BLOCKING and ANSWERING are two duties and only one of them is always
         needed. A cell must not reach an unlock — but on a page with a
         transport there is no unlock listening on the instrument at all, and
         stopping the gesture there buys nothing while costing the toy every
         window-level key a focused cell swallows. So the answer is
         unconditional and the block is asked for. The marker goes on either
         way, so anything reasoning about the page can still tell a declining
         control from a playing one. */
      if (dec.block === false) node.dataset.ppDecline = '1';
      else if (window.Lab && Lab.shell && Lab.shell.declineArm) Lab.shell.declineArm(node);
      const say = () => {
        const txt = textFn();
        if (!txt) return;
        if (dec.answer) dec.answer(txt); else status(txt);
      };
      node.addEventListener('pointerdown', say);
      /* Only a key that OPERATES the control, which is the same set `arm`
         listens for and `declineArm` blocks. Answering every keydown answers
         Tab, and tabbing past a rack of eight then seizes the start line eight
         times for the one navigation Tab exists for. */
      node.addEventListener('keydown', function (e) {
        if (window.Lab && Lab.shell && Lab.shell.isArmKey && !Lab.shell.isArmKey(e)) return;
        say();
      });
      return node;
    }

    /* ---- one sentence, one owner per half ----
       `says` returns the REASON this control makes no sound; the page appends
       the remedy through `wrap`, which is the one place the gesture phrase
       lives. A toy that wants the whole sentence uses `sentence` instead and
       the library appends nothing — but then it owns the gesture phrase too,
       and two copies of one clause is how they drift. */
    function closeSentence(kind, name, reason) {
      const d = declineOpts || {};
      /* `sentence` is the toy owning the WHOLE string, and it owns it for every
         column in the rack — a standard one and its own alike. Honouring it on
         one kind and not the other is the same drift the split was introduced
         to prevent, moved one level down: a rack whose standard cells end where
         the toy says they end and whose own cells get the library's clause
         appended is a rack with two sentence shapes. The reason is passed
         through, so a toy that wants its own words inside its own sentence
         still has them. */
      if (d.sentence) return d.sentence(kind, name, reason);
      return d.wrap ? d.wrap(reason) : reason;
    }

    function defaultReason(kind, name) {
      const d = declineOpts || {};
      if (d.says) return d.says(kind, name);
      return name + '’s ' + (kind === 'gain' ? 'level' : kind) + ' — ' + DECLINE_SAYS[kind];
    }

    /* ---- an empty reason is a declaration error, not a silence ----
       A cell marked as declining takes itself OUT of the page's region answer,
       so that its own sentence wins. A reason that is the empty string leaves
       it with no sentence of its own AND outside the region's: one press in the
       instrument gets nothing at all, which is the failure the whole machinery
       exists to prevent, arrived at from the other side.

       A cell that neither asks nor declines is simply not marked, and the way
       to say that is `false` — the same shape `asks` takes. `''` is a reason
       that says nothing, and it is refused by name, at build, where a builder
       is looking. */
    function reasonOrRefuse(raw, label) {
      if (raw === false || raw === null || raw === undefined) return false;
      if (typeof raw !== 'string' || !raw.trim()) {
        throw new Error('Lab.ui.rack: the decline reason for "' + label + '" is empty. ' +
          'A cell marked as declining is skipped by the page’s region answer, so an ' +
          'empty reason leaves a press with nothing at all. Return `false` for a cell ' +
          'that does not decline — it is then unmarked and the region answers for it — ' +
          'and a sentence for one that does.');
      }
      return raw;
    }

    function decline(node, kind, name) {
      if (!declineOpts) return node;      // a plain rack declines nothing
      const label = name + ' ' + kind;
      if (reasonOrRefuse(defaultReason(kind, name), label) === false) return node;
      return attachDecline(node,
        () => closeSentence(kind, name, defaultReason(kind, name)), label);
    }

    function stdCell(c, r, spec, cur, push, strip) {
      if (c.key === 'name') {
        const name = r.name || (spec ? spec.name : r.key);
        const color = r.color || (spec ? spec.color : null);
        if (c.edit) {
          const inp = document.createElement('input');
          inp.className = 'vname';
          inp.value = name;
          inp.addEventListener('change', function () {
            if (opts.onRename) opts.onRename(r.key, inp.value);
          });
          return inp;
        }
        const n = document.createElement('span');
        n.className = 'rname';
        const sw = document.createElement('span');
        sw.className = 'rsw';
        if (color) sw.style.background = color;
        n.append(sw, document.createTextNode(name));
        return n;
      }
      if (!r.voice) return null;          // no voice, no strip — the track stays
      const who = r.name || (spec ? spec.name : r.key);
      if (c.key === 'mute') {
        strip.dot = dot({
          text: 'M', kind: 'm', on: cur.mute, title: 'take this voice out of the mix',
          onToggle: v => { push({ mute: v }); dim(r.key, v); }
        });
        return decline(strip.dot, 'mute', who);
      }
      if (c.key === 'gain') {
        strip.knob = knob({
          /* The KEY is `gain` and the visitor's word is `level`. DESIGN.md
             spells the standard columns "name · mute · level", the charter
             keeps the key, and the library's own cold-hand answer for this
             cell already says "that is kick's level" — so a rack that printed
             `gain` showed a word its own sentence did not use. */
          label: c.label || 'level', min: 0, max: 1.5, step: 0.01, value: cur.gain, def: 1,
          fmt: v => Math.round(v * 100) + '%',
          hint: 'level of everything this voice sounds',
          onChange: v => push({ gain: v })
        });
        return decline(strip.knob, 'gain', who);
      }
      strip.pan = miniRange({
        label: c.label || 'pan', min: -1, max: 1, step: 0.01, value: cur.pan, def: 0,
        fmt: v => (Math.abs(v) < 0.005 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100)),
        hint: 'where this voice sits across the stereo field',
        onChange: v => push({ pan: v })
      });
      return decline(strip.pan, 'pan', who);
    }

    rows.forEach(function (r, rowIndex) {
      const spec = (r.voice && window.Lab && Lab.voices) ? Lab.voices.get(r.voice) : null;
      const s0 = init[r.key] || {};
      const cur = {
        gain: (s0.gain == null) ? 1 : s0.gain,
        mute: !!s0.mute,
        pan: (s0.pan == null) ? 0 : s0.pan
      };
      // The controls fire on creation one after another; holding the strip
      // silent until they are all built keeps that a SINGLE creation fire
      // carrying the whole strip, matching the other factories.
      let building = true;

      function push(partial) {
        if (partial) Object.assign(cur, partial);
        if (building) return;
        if (r.voice && window.Lab && Lab.voices && Lab.voices.setStrip)
          Lab.voices.setStrip(r.voice, cur);
        if (opts.onStrip) opts.onStrip(r.key, { gain: cur.gain, mute: cur.mute, pan: cur.pan });
      }

      /* `cell()` runs before the row is registered, so a dim asked for there
         cannot be applied there — a toy mute column had to dim its arrival rows
         in a loop after the whole page was built. The request is held and
         applied the moment the row exists. */
      let wantDim = null;

      const row = document.createElement('div');
      row.className = 'rrow';
      const strip = { knob: null, dot: null, pan: null };
      const cells = {};

      cols.forEach(function (c, i) {
        let node = null;
        /* `dim` in the context, because `cell()` runs before the rack returns
           and a toy mute column had to dim its arrival rows in a loop after the
           whole page was built. */
        const ctx = { key: r.key, voice: r.voice || null, index: rowIndex, spec: spec,
                      dim: function (on) { wantDim = !!on; } };
        if (c.cell) {
          node = c.cell(ctx);
          /* A TOY's own cell declines through the same path as a standard one.
             A rack whose level is a console law over the toy's own gain — not
             the library's per-voice bus — cannot use the standard column, and
             was writing the block, the key filter, the delivery and the
             quiet-once-started by hand. `decline` on the column is the whole of
             it: a reason, and the page appends the remedy. */
          /* THE OPPOSITE OF DECLINING. A cell that ASKS for sound — a name
             button that plays its voice — is the one thing in the instrument
             that does start it, and on a transport page the region's blanket
             cold-hand answer would paint "the instrument is stopped, so
             nothing here sounds yet" over an instrument that had just
             started. It needs its own mark; wearing `data-pp-decline` to
             escape the answer is a control saying the opposite of what it
             does. `Lab.page` collects these and gives each one the unlock. */
          /* `asks` is a FUNCTION of the cell's context, exactly as `decline`
             is, and for the same reason: whether a cell asks for sound is a
             fact about its ROW, not about its column. A rack whose last row is
             a label rather than a voice — a rest, a silence, a header — has one
             cell in that column that plays nothing, and a plain flag would make
             an arm root of it: a press on a label would start the audio and
             sound nothing, which is the broken-page reading with the marks
             reversed. `true` still means every row, for the rack where it is. */
          /* A confirm built inside a cell is in none of the lists the
             composition sweeps — `session`, `stage`, `globals`, `controls` —
             so every such chip asked for `page.watchConfirm` by hand. The rack
             already collects `asksCells` for the page to route; it collects
             these the same way, and no toy has to know. */
          if (node) {
            if (typeof node.disarm === 'function') cellConfirms.push(node);
            else if (node.querySelectorAll) {
              node.querySelectorAll('button').forEach(function (x) {
                if (typeof x.disarm === 'function') cellConfirms.push(x);
              });
            }
          }
          if (node && c.asks) {
            const wants = (typeof c.asks === 'function') ? c.asks(ctx) : c.asks;
            if (wants) {
              node.dataset.ppAsks = '1';
              asksCells.push(node);
            }
          }
          if (node && c.decline) {
            const r0 = c.decline;
            const who = (r.name || (spec ? spec.name : r.key));
            const raw = (typeof r0 === 'function') ? r0(ctx) : r0;
            if (reasonOrRefuse(raw, who + ' ' + c.key) !== false) {
              attachDecline(node, function () {
                const live = (typeof r0 === 'function') ? r0(ctx) : r0;
                return closeSentence(c.key, who, live);
              }, who + ' ' + c.key);
            }
          }
        } else if (RACK_STD[c.key]) node = stdCell(c, r, spec, cur, push, strip);
        cells[c.key] = node || null;
        if (!node) return;                       // empty cell, or a spacer track
        // Cells are placed BY NAME rather than auto-flowed: an empty cell must
        // leave its own track empty, not shift every later cell one column left.
        const span = Math.max(1, c.span || 1);
        const last = cols[Math.min(cols.length - 1, i + span - 1)];
        node.style.gridColumn = c.key + '-start / ' + last.key + '-end';
        if (c.align) node.style.justifySelf = c.align;
        row.appendChild(node);
      });

      el.appendChild(row);
      built[r.key] = { row: row, cells: cells, strip: strip, push: push };
      if (wantDim !== null) dim(r.key, wantDim);
      if (cur.mute) dim(r.key, true);
      building = false;
      push(null);
      if (opts.onRow) opts.onRow(r.key, row);
    });

    /* The caption row, when the columns carry a meaning no cell states. It is
       a `.rrow` like any other so it inherits the subgrid, and each label is
       placed on the track lines the rack already names, which is what those
       lines are for: a caption stays locked to its column however the rows
       below it are filled, and a column with nothing to say leaves its track
       empty rather than shifting the rest along. */
    /* ---- caption rows, and the groups that open them ----
       A caption cell takes a NODE as well as a string, because a heading of
       bare names asks a visitor to match a hue against a row label before they
       can play, and a swatch is a node. And a ROW may open a GROUP — a rack of
       two matrices whose columns mean different sounds in each needs a heading
       per group, not one for the whole rack. `group.caption` overrides the
       column captions for that group; anything it does not name keeps the
       column's own.

       A node used in a second caption row is CLONED: one element cannot be in
       two places, and a toy that wrote one swatch for two groups would silently
       get one group with a swatch and one without. A function is called per
       row instead, for a toy that wants two live nodes rather than a copy. */
    const capUsed = [];
    function captionNode(value, ctx) {
      if (typeof value === 'function') value = value(ctx);
      if (value == null) return null;
      if (value.nodeType) {
        if (capUsed.indexOf(value) === -1) { capUsed.push(value); return value; }
        return value.cloneNode(true);
      }
      return document.createTextNode(String(value));
    }

    function buildCaption(group) {
      const overrides = (group && group.caption) || null;
      const row = document.createElement('div');
      row.className = 'rrow rcap' + (group ? ' rcap-group' : '');
      row.setAttribute('role', 'row');
      cols.forEach(function (c, i) {
        const raw = (overrides && overrides[c.key] !== undefined) ? overrides[c.key] : c.caption;
        if (raw == null) return;
        const sp = document.createElement('span');
        sp.className = 'rcapl';
        sp.setAttribute('role', 'columnheader');
        const node = captionNode(raw, { key: c.key, group: group || null });
        if (node) sp.appendChild(node);
        const span = Math.max(1, c.captionSpan || c.span || 1);
        const last = cols[Math.min(cols.length - 1, i + span - 1)];
        sp.style.gridColumn = c.key + '-start / ' + last.key + '-end';
        if (span > 1) sp.setAttribute('aria-colspan', String(span));
        const hint = (group && group.captionHint && group.captionHint[c.key]) || c.captionHint;
        if (hint) { sp.dataset.hint = hint; sp.title = hint; }
        row.appendChild(sp);
      });
      return row;
    }

    let capRow = null;
    const capGroups = [];
    const wantsCaption = cols.some(c => c.caption != null) || rows.some(r => r.group);
    if (wantsCaption) {
      if (cols.some(c => c.caption != null)) {
        capRow = buildCaption(null);
        el.insertBefore(capRow, el.firstChild);
      }
      // a group's heading goes immediately above the row that opens it
      rows.forEach(function (r) {
        if (!r.group) return;
        const b = built[r.key];
        if (!b) return;
        const g = buildCaption(r.group);
        el.insertBefore(g, b.row);
        capGroups.push(g);
      });

      /* A `columnheader` needs a table to be the header OF, so the roles go on
         only where a caption row exists — which is to say only where the rack
         has stopped being a list of voices and started being a grid of columns
         that mean something. Without them the caption reads as a ninth voice.
         Racks with no caption keep the plain divs they have always had, which
         is why no page in the collection changes shape today. */
      el.setAttribute('role', 'table');
      if (opts.label) el.setAttribute('aria-label', opts.label);
      /* A cell role is written only where there is no role to destroy. For
         `mute` the cell node IS the button, so `role="cell"` would replace its
         native button role and a screen reader would be told the mute is a
         table cell — no press affordance, no pressed state. `gain` and `pan`
         escape only because their cell happens to be a wrapper. A button stays
         a button, and a row with a cell missing from the tree costs far less
         than a control that has stopped saying what it is. */
      const INTERACTIVE = 'button,input,select,textarea,a[href],[role],[tabindex]';
      rows.forEach(function (r) {
        const b = built[r.key];
        if (!b) return;
        b.row.setAttribute('role', 'row');
        cols.forEach(function (c) {
          const n = b.cells[c.key];
          if (!n || (n.matches && n.matches(INTERACTIVE))) return;
          n.setAttribute('role', 'cell');
        });
      });
    }

    // One label box for the whole rack, so knobs and gates sharing a column
    // align on their FACES rather than on their label text. The bench is
    // monospace, so counting characters is exact and needs no measurement —
    // this runs before the rack is ever in the DOM.
    const lw = (opts.labelWidth === undefined) ? 'fit' : opts.labelWidth;
    if (lw !== false) {
      let w = lw;
      if (lw === 'fit') {
        let max = 0;
        el.querySelectorAll('.kl').forEach(function (k) {
          max = Math.max(max, (k.textContent || '').length);
        });
        w = (max + 0.5) + 'ch';
      }
      el.style.setProperty('--rack-kl', w);
      el.setAttribute('data-kl', '');
    }

    // A knob/mini-range .set() re-fires its own onChange; a dot's does not,
    // so mute is the one that pushes by hand.
    el.set = function (key, partial) {
      const b = built[key];
      if (!b || !partial) return;
      const s = b.strip;
      if (partial.mute != null) {
        if (s.dot) s.dot.set(!!partial.mute);
        b.push({ mute: !!partial.mute });
        dim(key, !!partial.mute);
      }
      if (partial.pan != null) { if (s.pan) s.pan.set(partial.pan); else b.push({ pan: partial.pan }); }
      if (partial.gain != null) { if (s.knob) s.knob.set(partial.gain); else b.push({ gain: partial.gain }); }
    };
    el.row = key => (built[key] ? built[key].row : null);
    el.cell = (key, colKey) => (built[key] ? (built[key].cells[colKey] || null) : null);
    el.dim = dim;
    el.caption = capRow;
    el.captionGroups = capGroups;
    el.declineTexts = declineTexts;
    el.asksCells = asksCells;
    el.cellConfirms = cellConfirms;
    return el;
  }

  return {
    // exported because a page that hand-rolls a control of its own must not
    // hand-roll the pointer plumbing with it: capture, pointercancel and the
    // non-primary-button rule are where a touch surface silently goes wrong
    drag: drag,
    taper: taper,
    knob: knob,
    dial: dial,
    miniRange: miniRange,
    gate: gate,
    dot: dot,
    confirm: confirm,
    panel: panel,
    ctl: ctl,
    inline: inline,
    status: status,
    masterFx: masterFx,
    rack: rack
  };
})();
