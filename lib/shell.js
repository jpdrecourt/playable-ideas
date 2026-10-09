"use strict";
/* ============================================================
   Lab.shell — the page frame every Playable Paper wears.

   The things the lab never had and every public page needs:

   frame()  the nameplate, the one-line "what this shows", the link
            to the spec, the licence footer, and the small-screen
            invitation. Seven hand-written headers were seven pages
            that could not be changed together.

   start()  the audio start gesture, done to the Ciechanowski model:
            no modal "click to begin" — the first press on the
            instrument IS the unlock. What the model needs and the
            lab lacked is the CHECK: resume() returns a promise, and
            a rejected or still-suspended context looks exactly like
            playback with the volume down. Nothing else in a browser
            reports "your audio is blocked", so the button says it.

   arm()    the same gesture for a page that has no transport at
            all: the first press anywhere on the instrument unlocks
            the audio, and that same press goes on to do whatever it
            was going to do to the control it landed on.

   share()  "Send this to myself": the page's link to the phone's
            share sheet, or copied where there is none.

   hints()  a documentation layer that exists on touch. A `title=`
            tooltip renders on no phone at all, so a hint carried
            only there is a hint the visitor cannot reach. The "?"
            toggle reveals every control's one-liner in place, and
            hover keeps working for the mouse — enriching, never
            carrying.

   Depends on lab.css for the .pp-* classes and on Lab.audio for
   start() and arm(); frame() and hints() are audio-independent.
   ============================================================ */
window.Lab = window.Lab || {};

Lab.shell = (function () {

  /* ---- environment ----
     Capability, not device sniffing: `coarse` asks whether the primary
     pointer is a finger, `midi` whether the API exists at all (no WebKit
     browser ships Web MIDI, which is why the mobile stance is honest
     rather than apologetic). */
  const mq = q => (window.matchMedia ? window.matchMedia(q).matches : false);

  /* The collection's one named breakpoint — the teaser width — lives in
     lab.css as `--teaser`, and this is how a script reads it instead of
     carrying a second copy. A media query cannot read a custom property, so
     the stylesheet keeps one literal of its own at the foot of the file; a
     SCRIPT is under no such limit, and any prose that names a position ("the
     dial below the rack") asks here rather than hard-coding a number that
     goes quietly wrong the day the breakpoint moves.

     Read live rather than cached: a page may swap stylesheets, and the cost
     is one getComputedStyle on a question nobody asks in a loop. The fallback
     matters — with lab.css missing there is no page to lay out, but a script
     asking for `teaser` still gets a number rather than NaN. */
  function cssPx(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name);
      const n = parseFloat(v);
      return isFinite(n) ? n : fallback;
    } catch (_) { return fallback; }
  }

  const env = {
    get coarse() { return mq('(pointer: coarse)'); },
    get teaser() { return cssPx('--teaser', 720); },
    get teaserQuery() { return '(max-width: ' + env.teaser + 'px)'; },
    get small() { return mq(env.teaserQuery); },
    get midi() { return typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess; },
    get reducedMotion() { return mq('(prefers-reduced-motion: reduce)'); }
  };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---- frame ----
     opts: { title, shows, spec?, repo?, site?, licence?, invite?,
             teaser?, mount? }
     `teaser: true` says the page declares a phone mode, which changes what
     the default invitation says (and `Lab.page` then moves it to the
     teaser's foot).
     Inserts the nameplate at the top of the mount (default `.wrap`) and the
     footer at the end of it. Returns { h1, sub, invite, footer }.

     THE NAMEPLATE IS THE REFERENCE PAGE'S. `h1` and `p.sub`, direct children
     of `.wrap`, wearing lab.css's own rules and no shell class of their own —
     which is to say the exact markup `toys/motif-memory/` hand-writes.
     That page is the picture of the design brief, and a shell that dressed
     its header differently would leave every published toy looking like a
     second design: for a while the shell wrapped these in a `header.pp-head`
     with margins of its own, and the reference page could not wear the shell
     without moving. The spec link rides INSIDE the h1, which is a baseline
     flex row, so it costs the line nothing.

     The footer is the same idea applied to the bottom: one quiet line in the
     `.hint` register the reference page already ends on — spec · source ·
     site · licence — rather than a two-column block in a register nothing
     else on the page uses.                                              */
  const INVITE =
    'This is the desktop page, and it is the whole instrument. A version cut ' +
    'for a phone is not designed yet, so nothing here is missing — there is ' +
    'simply a lot of it, and it will ask a good deal of your thumb. Best met ' +
    'on a desk, ideally with a MIDI controller.';

  /* The invitation for a toy that HAS a teaser, which is a different truth:
     the phone is now shown something cut for it, and what it is invited to is
     the rest. It stands at the teaser's foot, after the controls, so it is
     read by someone who has already played. The dissolution line is the
     collection's (lib/PROMPT.md, the phone rule): random is random, and each
     toy is a way of structuring it. */
  const INVITE_TEASER =
    'Random is random, and everybody knows it; each of these toys gives it a ' +
    'different structure. This is the smallest part of this one — the whole ' +
    'instrument is on a desktop, ideally with a MIDI controller.';

  function frame(opts) {
    opts = opts || {};
    const mount = (typeof opts.mount === 'string')
      ? document.querySelector(opts.mount)
      : (opts.mount || document.querySelector('.wrap') || document.body);

    const h1 = el('h1', null, opts.title || document.title || '');
    if (opts.spec) {
      const a = el('a', 'pp-spec', 'spec ↗');
      a.href = opts.spec;
      a.title = 'the mechanism in prose and pseudocode — enough to rebuild this elsewhere';
      h1.appendChild(a);
    }

    /* `shows` is a string, or a NODE. A blurb that leans on one italicised
       word — the name of the thing the toy is about — had to be rewritten on
       the element after the build, which is a toy reaching into the shell's
       markup to undo a limitation of the shell. Pass a fragment and it is
       simply the sub's content. */
    let sub = null;
    if (opts.shows) {
      sub = el('p', 'sub');
      if (opts.shows.nodeType) sub.appendChild(opts.shows);
      else sub.textContent = opts.shows;
    }

    /* The invitation is not an apology. Without a teaser it says what is true:
       below the teaser width a visitor gets the desktop page, whole, on a small
       screen. With one (`teaser: true`) it invites the phone to the rest of the
       instrument, and `Lab.page` moves it to the teaser's foot. */
    let invite = null;
    if (opts.invite !== false) {
      invite = el('p', 'pp-invite', opts.invite || (opts.teaser ? INVITE_TEASER : INVITE));
    }

    // one quiet line, in the register the reference page ends on
    const footer = el('p', 'hint pp-foot');
    const bits = [];
    if (opts.spec) { const a = el('a', null, 'spec'); a.href = opts.spec; bits.push(a); }
    if (opts.repo) { const a = el('a', null, 'source'); a.href = opts.repo; bits.push(a); }
    if (opts.site) { const a = el('a', null, 'noisewrangler.art'); a.href = opts.site; bits.push(a); }
    bits.push(el('span', null, (opts.licence || 'CC0') + ' — copy it, port it, no attribution required.'));
    bits.forEach(function (b, i) {
      if (i) footer.appendChild(document.createTextNode(' · '));
      footer.appendChild(b);
    });

    const head = document.createDocumentFragment();
    head.appendChild(h1);
    if (sub) head.appendChild(sub);
    if (invite) head.appendChild(invite);
    mount.insertBefore(head, mount.firstChild);
    mount.appendChild(footer);

    if (opts.title) document.title = opts.title + (opts.shows ? ' — Playable Papers' : '');
    return { h1: h1, sub: sub, invite: invite, footer: footer };
  }

  /* ---- share ----
     opts: { text, url?, label?, hint? } → { el }
     "Send this to myself": the phone in a hand at a poster is the wrong
     instrument for the page, and the right one is a desk later. So the button
     hands the page's own link to the phone's share sheet, with one line of the
     toy's text, and the visitor sends it wherever they keep things.

     Three tiers, each the fallback of the one above:
       navigator.share   where it exists and `canShare` (where THAT exists)
                         accepts the data. A rejection named AbortError is the
                         visitor closing the sheet, and is silent; any other
                         rejection falls through to the copy, because a sheet
                         that failed is a sheet that is missing.
       clipboard         `writeText(url)` and a toast saying the link is copied.
       the toast         carrying the URL itself, where neither exists.

     The link is `location.origin + location.pathname` unless a url is given:
     no query, no hash, NO STATE IN THE LINK. Nothing is collected, nothing is
     sent anywhere by the page itself. */
  function share(opts) {
    opts = opts || {};
    const btn = el('button', 'pp-share', opts.label || 'Send this to myself');
    btn.type = 'button';
    btn.dataset.hint = opts.hint ||
      'send yourself the link to this page, to open later on a desktop — through the ' +
      'phone’s share sheet, or copied where there is none';
    btn.title = btn.dataset.hint;

    const link = () => opts.url || (location.origin + location.pathname);

    async function copy(url) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          Lab.ui.status('link copied');
          return;
        }
      } catch (_) { /* refused: the toast below is the last tier */ }
      Lab.ui.status(url);
    }

    btn.addEventListener('click', async function () {
      const url = link();
      const data = { title: document.title, text: opts.text || '', url: url };
      let sheet = typeof navigator.share === 'function';
      if (sheet && typeof navigator.canShare === 'function') {
        try { sheet = navigator.canShare(data); } catch (_) { sheet = false; }
      }
      if (sheet) {
        try { await navigator.share(data); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      await copy(url);
    });
    return { el: btn };
  }

  /* ---- the two things every unlock path needs ----
     Shared by start() and arm(), because a page gets exactly one of
     them and both have to behave identically once the gesture lands. */

  // Safari-only Editor's Draft, and the single most common cause of
  // "it doesn't work on my phone": with the ring switch off, an iOS
  // context defaults to a category that silences Web Audio entirely.
  function claimPlayback() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; }
    catch (_) {}
  }

  // An interruption (a call, another app taking the route) suspends the
  // context under a page that still looks like it is playing, and nothing
  // else in a browser says so. Bound once per context, whoever asks.
  function watchInterruption(isLive, onInterrupted) {
    const ctx = Lab.audio.ctx;
    if (!ctx || ctx._ppWatched) return;
    ctx._ppWatched = true;
    ctx.addEventListener('statechange', function () {
      if (isLive() && ctx.state !== 'running') onInterrupted();
    });
  }

  /* ---- start ----
     opts: { button, onStart, onStop, labels? }
       button   the transport element (required) — Play IS the gesture,
                so the toy's own primary button is what unlocks audio.
       onStart  async-or-not; runs after the context is confirmed running.
       onStop   runs on the second press.

     Returns { el, running, press(), stop(), blocked }.

     The context is constructed inside the handler and never at load: a
     context built before any gesture starts suspended, counts against
     the page in Chrome's autoplay heuristics, and on iOS routinely
     never wakes at all.                                              */
  function start(opts) {
    const btn = opts.button;
    const labels = opts.labels || { play: '▶ Play', stop: '■ Stop', blocked: '▶ Tap again' };
    let running = false, busy = false, blocked = false;

    function paint() {
      btn.textContent = running ? labels.stop : (blocked ? labels.blocked : labels.play);
      btn.classList.toggle('on', running);
      btn.setAttribute('aria-pressed', running ? 'true' : 'false');
      document.body.classList.toggle('pp-playing', running);
      document.body.classList.toggle('pp-blocked', blocked && !running);
    }

    async function go() {
      if (busy) return;
      if (running) {
        running = false;
        paint();
        if (opts.onStop) opts.onStop();
        return;
      }
      busy = true;
      try {
        claimPlayback();
        Lab.audio.init();
        try { await Lab.audio.resume(); } catch (_) { /* state check below is the truth */ }
        const ctx = Lab.audio.ctx;
        if (!ctx || ctx.state !== 'running') {
          blocked = true;
          paint();
          Lab.ui.status('audio is blocked by the browser — tap Play again', true);
          return;
        }
        blocked = false;
        running = true;
        paint();
        if (opts.onStart) await opts.onStart();
      } finally {
        busy = false;
      }
    }

    btn.addEventListener('click', go);
    // after the handler, so the context exists to be watched
    btn.addEventListener('click', () => setTimeout(() => {
      watchInterruption(() => running, () => {
        blocked = true;
        Lab.ui.status('audio was interrupted — press Stop, then Play', true);
      });
    }, 0));

    paint();
    return {
      el: btn,
      get running() { return running; },
      get blocked() { return blocked; },
      press: go,
      stop: function () { if (running) go(); }
    };
  }

  /* Keys that OPERATE a control, as against Tab, which only travels. Module
     scope because `declineArm` below has to answer for exactly the same set:
     an opt-out that lists the arming events itself falls behind the moment
     `arm` grows a new one, silently, on the one control that was supposed to
     stay quiet. */
  const ARM_KEYS = { Enter: 1, ' ': 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1,
                     PageUp: 1, PageDown: 1, Home: 1, End: 1 };

  /* Exported, because everything that reasons about "did this hand try to
     OPERATE the control" has to reason about the same set. A declining control
     that answers on every keydown answers on Tab, and hijacks the start line
     once per row for the one navigation Tab exists for. */
  function isArmKey(e) { return !!(e && ARM_KEYS[e.key]); }

  /* ---- declineArm ----
     For a control that lives INSIDE the armed region and must not start the
     audio: an output level, a mute, anything that is not a voice. It stops
     every event `arm` listens for, at this element, on the bubble — so the
     control still works, `hints` (which listens at capture) still answers, and
     the gesture simply never reaches the unlock.

     It stops propagation and not immediate propagation, so the element's own
     handlers all still run: a dot still toggles, a range still moves.

     Declining is only half of what such a control owes a hand. The other half
     is an ANSWER — a fader dragged from cold that moves, changes its readout,
     produces nothing and leaves the same instruction on screen is
     indistinguishable from a broken page. Say which control does start it. */
  function declineArm(el) {
    const stop = e => e.stopPropagation();
    el.addEventListener('pointerdown', stop);
    /* Only the keys `arm` listens for. Stopping every keydown made this
       control a hole in the page's keyboard: with focus on a mixer cell, a
       toy's window-level `Space` and its digit keys never arrived, so the
       transport key and the five memory keys were dead while a level held
       focus. What this function owes is that the gesture does not reach the
       unlock — a digit was never going to. */
    el.addEventListener('keydown', e => { if (isArmKey(e)) stop(e); });
    el.addEventListener('click', stop);
    // so anything reasoning about the page can tell a declining control from a
    // playing one without knowing which cells the rack built
    el.dataset.ppDecline = '1';
    return el;
  }

  /* ---- arm ----
     The start gesture for a page with no transport to press. The first
     pointerdown anywhere inside `root` unlocks the audio, and it is the
     same press that grabs the knob it landed on — an instrument whose
     every control is live before the sound exists needs the unlock to be
     invisible, not a first click spent on nothing.

     opts: { root, onStart, onBlocked? } → { armed, disarm() }

     `root` may be one element or an ARRAY of them, because the armed region
     is not always one box on the page. The stage and the rack are contiguous
     and can share a wrapper; the toy-global buttons that ask eight voices for
     sound sit up in the master strip, among controls that must NOT arm. Two
     roots says that exactly, where one root plus a wrapper of convenience
     would either arm the master knobs or leave the globals unable to start
     the instrument they are asking to hear.

     Two constraints that look like details and are not:

     BUBBLE phase. hints() stops propagation at CAPTURE on every
     [data-hint] element, so that a visitor can ask what a control does
     without operating it. Listening at capture here would defeat that and
     start the audio from an inspection. Listening on the bubble means hint
     mode correctly swallows the gesture.

     Nothing is preventDefault'd or swallowed. The press that unlocks the
     context is the press that begins the drag, and the drag has to happen. */
  function arm(opts) {
    const roots = (Array.isArray(opts.root) ? opts.root : [opts.root]).filter(Boolean);
    let bound = false, busy = false, started = false;

    async function unlock() {
      if (busy) return;
      busy = true;
      try {
        claimPlayback();
        Lab.audio.init();
        try { await Lab.audio.resume(); } catch (_) { /* the state check below is the truth */ }
        const ctx = Lab.audio.ctx;
        if (!ctx || ctx.state !== 'running') {
          // stay armed: a second press is a second user gesture, and on iOS
          // that is routinely what it takes
          if (opts.onBlocked) opts.onBlocked();
          Lab.ui.status('audio is blocked by the browser — touch a control again', true);
          return;
        }
        unbind();
        watchInterruption(() => true, function () {
          // there is no transport to press, so the recovery is the same
          // gesture as the start: re-arm and let the next touch pick it up.
          bind();
          Lab.ui.status('audio was interrupted — touch a control to pick it up', true);
        });
        if (!started) {
          started = true;
          if (opts.onStart) await opts.onStart();
        }
      } finally {
        busy = false;
      }
    }

    /* ---- what counts as the gesture ----
       A pointer is not the only hand on this page. Every bench control is
       focusable and arrow-driven, and a toy that says "tab to any dial, then
       arrows" while arming on `pointerdown` alone has a keyboard visitor
       turning live controls in silence with no way to find out why — the same
       broken-page reading a mouse visitor gets from an unarmed knob, and
       harder to escape, since the instruction that failed is the page's own.

       So the gesture is a pointer press, a key that OPERATES something
       (Enter, Space, or an arrow — not Tab, which only travels), or a click,
       which is what a button fires however it was reached. All three are user
       activation as far as the browser is concerned, which is what
       `resume()` actually needs; `pointerdown` was never the requirement, only
       the commonest shape of it.

       All three listen on the BUBBLE, so `hints` still stops the gesture at
       capture and inspecting a control never starts the audio. */
    function onKey(e) { if (ARM_KEYS[e.key]) unlock(); }

    function bind() {
      if (bound) return;
      bound = true;
      roots.forEach(function (r) {
        r.addEventListener('pointerdown', unlock);
        r.addEventListener('keydown', onKey);
        r.addEventListener('click', unlock);
      });
    }
    function unbind() {
      if (!bound) return;
      bound = false;
      roots.forEach(function (r) {
        r.removeEventListener('pointerdown', unlock);
        r.removeEventListener('keydown', onKey);
        r.removeEventListener('click', unlock);
      });
    }

    bind();

    /* A root may arrive after the gesture is set up. The case is a cell INSIDE
       the instrument that asks for sound — a name button that plays its voice —
       on a page whose instrument is not itself an arm root because it has a
       transport. The cell has to reach the same unlock the globals reach, and
       it is built by the rack long after `arm` was called. */
    function add(r) {
      if (!r || roots.indexOf(r) !== -1) return;
      roots.push(r);
      if (bound) {
        r.addEventListener('pointerdown', unlock);
        r.addEventListener('keydown', onKey);
        r.addEventListener('click', unlock);
      }
    }

    return { get armed() { return bound; }, disarm: unbind, add: add };
  }

  /* ---- hints ----
     A "?" toggle, then TAP ANYTHING to read what it does. One bubble at a
     time, clamped to the viewport.

     The obvious design — reveal every control's one-liner at once — was
     tried and is unreadable: thirty overlapping bubbles at phone width,
     half of them off the edge. One at a time also buys the thing a tooltip
     could never do on touch, which is to inspect a control WITHOUT
     operating it: while hint mode is on, a press on a hinted control is
     swallowed, so you can ask what Play does before pressing Play.

     Hover shows the same bubble for a mouse, and every hint is mirrored
     into `title` — enriching what already works, never carrying it.
     opts: { mount?, label? } → { el, set(on), refresh(), on }        */
  function hints(opts) {
    opts = opts || {};
    let on = false;
    const btn = el('button', 'pp-hintbtn', opts.label || '?');
    btn.type = 'button';
    btn.title = 'what does this do? — tap here, then tap anything';
    btn.setAttribute('aria-label', 'hint mode: tap here, then tap any control to read what it does');
    btn.setAttribute('aria-pressed', 'false');

    const bub = el('div', 'pp-hintbub');
    bub.hidden = true;
    bub.setAttribute('role', 'status');
    document.body.appendChild(bub);

    function place(target) {
      bub.textContent = target.dataset.hint;
      bub.hidden = false;
      const r = target.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const bw = bub.offsetWidth, bh = bub.offsetHeight;
      const x = Math.max(8, Math.min(r.left + r.width / 2 - bw / 2, vw - bw - 8));
      let y = r.bottom + 8;
      if (y + bh > vh - 8) y = Math.max(8, r.top - bh - 8);
      bub.style.left = x + 'px';
      bub.style.top = y + 'px';
    }
    function hide() { bub.hidden = true; }

    function inspect(e) {
      if (!on) return;
      const t = e.target.closest && e.target.closest('[data-hint]');
      if (!t) { hide(); return; }
      e.preventDefault();
      e.stopPropagation();
      place(t);
    }
    document.addEventListener('pointerdown', inspect, true);
    /* THE RELEASE TOO. Stopping the press and the click and letting the
       pointerup through leaves any control whose gesture completes on the UP —
       which is every tap that has to distinguish itself from a drag or a hold —
       acting while the bubble explaining it is on screen. A visitor asked what
       the control does and was answered by the control doing it, which is the
       one thing hint mode exists to make impossible. Measured on a matrix cell:
       a first press in hint mode set the weight to 1. */
    document.addEventListener('pointerup', e => {
      if (on && e.target.closest && e.target.closest('[data-hint]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    /* And the RIGHT press. A control whose second gesture is a context menu —
       a cell that clears on a right press, the shortcut beside its long press —
       was the one gesture that got past the layer, so a right press while the
       bubble was up cleared the weight the visitor was only asking about. The
       toy that found it asked the hint layer directly, one line per cell.

       `preventDefault` as well as `stopPropagation`, because the browser's own
       menu over a hint bubble is the same interruption by another route. */
    document.addEventListener('contextmenu', e => {
      if (on && e.target.closest && e.target.closest('[data-hint]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    document.addEventListener('click', e => {
      if (on && e.target.closest && e.target.closest('[data-hint]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    document.addEventListener('pointerover', e => {
      if (!on || e.pointerType === 'touch') return;
      const t = e.target.closest && e.target.closest('[data-hint]');
      if (t) place(t); else hide();
    });
    document.addEventListener('keydown', e => { if (on && e.key === 'Escape') set(false); });
    window.addEventListener('scroll', hide, { passive: true });

    function refresh(root) {
      (root || document).querySelectorAll('[data-hint]').forEach(n => {
        if (!n.title) n.title = n.dataset.hint;
      });
    }
    function set(v) {
      on = !!v;
      document.body.classList.toggle('pp-hints', on);
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) { refresh(); Lab.ui.status('tap anything to read what it does'); }
      else hide();
    }
    btn.addEventListener('click', () => set(!on));
    refresh();
    if (opts.mount) opts.mount.appendChild(btn);
    /* `show(el)` puts the bubble on a control nobody pressed. The case is a KEY
       that stands for a press: a key which drives a button by calling `.click()`
       fires no pointerdown, so hint mode — which answers pointerdown — heard
       nothing, and the key acted while its own button, pressed by hand, would
       have been explained. The composition swallows such a key and asks for the
       bubble the press would have raised. */
    return {
      el: btn, set: set, refresh: refresh,
      show: function (target) { if (on && target && target.dataset.hint) place(target); },
      hide: hide,
      get on() { return on; }
    };
  }

  return { frame: frame, share: share, start: start, arm: arm, declineArm: declineArm,
           isArmKey: isArmKey, hints: hints, env: env };
})();
