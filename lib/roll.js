"use strict";
/* ============================================================
   Lab.roll — grid piano roll on a canvas.

   Scrolling, now-anchored right edge; one lane per voice id with
   the voice's color edge and label; event blocks colored by voice,
   opacity by gain, width from dur.

   Grid quantization + deviation marks: each event snaps to its
   NEAREST grid cell and the block is drawn cell-aligned, one cell
   wide (voices defined with sustained:true draw at their true
   duration instead). If the event is off-grid beyond ~1 ms, a
   triangle is drawn at the block's onset: base on the cell
   boundary, apex at the hit's ACTUAL time — inside the block =
   late, outside = early. The rationale: microtiming is only
   human-readable relative to something — the grid is the
   something. Raw-time positioning shows dots; grid + deviation
   marks show a RELATIONSHIP.
   ============================================================ */
window.Lab = window.Lab || {};

Lab.roll = (function () {
  const DEV_EPS_SEC = 0.001;   // below this an event counts as on-grid

  // Nearest-cell quantizer. Ties snap to the EARLIER cell so an event
  // exactly half a cell after the grid reads LATE (a held offset of
  // gridSec/2 must read as a constant late mark, not flip to AHEAD).
  function quantize(t, origin, gridSec) {
    const cell = Math.floor((t - origin) / gridSec + 0.5 - 1e-9);
    const snapped = origin + cell * gridSec;
    return { cell: cell, snapped: snapped, dev: t - snapped };
  }

  function live(v) { return (typeof v === 'function') ? v() : v; }

  function attach(canvas, options) {
    const opts = Object.assign({
      laneIds: null,          // ordered ids; default = every voice that has played
      lanes: null,            // { id: {color, name, mark} } — a lane that is not a voice
      gridSec: function () { return 0.5; },  // FUNCTION, read live: the cell duration
      origin: 0,              // grid anchor time (number or function) — cell edges at origin + k*gridSec
      originIndex: 0,         // cell index at origin (number or function) — keeps accent/strong phase
      accentEvery: 4,         // heavier gridline every N cells
      strongEvery: 16,        // heaviest gridline every N cells
      pxPerSec: 90,
      windowSec: 8,
      pitchLanes: {},         // id -> { semiMin, semiMax }: place vertically by semi
      laneCells: {},          // id -> integer >= 1: this lane's cell = N x gridSec.
                              // Voices live on different clock resolutions (the
                              // ATAXIA two-layer clockwork); each lane is read
                              // against ITS OWN grid, gridSec being the finest.
      laneCycleCells: {}      // id -> integer or function (read live): this lane's
                              // pattern-cycle length in GRID cells. Draws a bolder
                              // line confined to the lane's own strip wherever ITS
                              // index wraps back to 0 — lanes of different lengths
                              // carry their pattern-start marks apart and back
                              // together instead of sharing one global downbeat.
    }, options || {});

    const g2d = canvas.getContext('2d');
    let events = [];
    const seenLanes = [];
    let rafId = null;

    /* THE QUEUE IS BOUNDED WHERE IT IS FILLED. It used to be pruned inside
       `draw()`, which is a `requestAnimationFrame` callback — and rAF does not
       run in a hidden tab while the scheduler that fills this queue does. A
       page left open in a background tab therefore grew one entry per event for
       as long as it was there. Draining and bounding are different jobs and
       only one of them can be trusted to a frame: `draw` still prunes against
       the visible window, because that is what it can measure, and `push`
       refuses to let the array grow past a hard cap whatever the tab is doing.

       The cap drops the OLDEST, because what a returning visitor wants to see
       is the stretch of time they came back to. It is deliberately far above
       any honest window — 4096 events is minutes of a dense lattice — so it is
       a bound and never a display decision. */
    const MAX_EVENTS = 4096;

    function push(ev) {
      if (!ev || !isFinite(ev.time)) return;
      const e = {
        time: ev.time,
        id: ev.id,
        gain: (ev.gain != null && isFinite(ev.gain)) ? ev.gain : 1,
        semi: isFinite(ev.semi) ? ev.semi : 0,
        dur: (ev.dur != null && isFinite(ev.dur)) ? ev.dur : 0.05,
        shade: (ev.shade != null && isFinite(ev.shade)) ? ev.shade : 1,
        cut: !!ev.cut,
        mark: ev.mark || null
      };
      events.push(e);
      if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
      if (seenLanes.indexOf(e.id) === -1) seenLanes.push(e.id);
    }

    if (window.Lab && Lab.voices) Lab.voices.subscribe(push);

    function size() {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round((canvas.clientWidth || 300) * dpr));
      const h = Math.max(1, Math.round((canvas.clientHeight || 100) * dpr));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      return dpr;
    }

    function roundedRect(x, y, w, h, r) {
      const rr = Math.max(0, Math.min(r, w / 2, h / 2));
      g2d.beginPath();
      if (g2d.roundRect) { g2d.roundRect(x, y, w, h, rr); return; }
      g2d.moveTo(x + rr, y);
      g2d.arcTo(x + w, y, x + w, y + h, rr);
      g2d.arcTo(x + w, y + h, x, y + h, rr);
      g2d.arcTo(x, y + h, x, y, rr);
      g2d.arcTo(x, y, x + w, y, rr);
      g2d.closePath();
    }

    /* ---- a lane may declare itself ----
       Colour and name came from `Lab.voices.get(id)` and nothing else, so a
       lane with no voice behind it — a REST, which is a thing a machine can
       say and not a thing it can play — drew grey, was labelled with its raw
       id, and took the same mark as a hit, which is the claim inverted. A
       display of time is not always a display of voices.

       `lanes: { id: {color, name, mark} }` says otherwise, per lane, and the
       voice registry remains the default for every lane that does not. `mark`
       is 'block' (the default) or 'tick' — a thin centred line, which is what
       a silence looks like when it has to look like something. */
    function laneSpec(id) {
      return (opts.lanes && opts.lanes[id]) || null;
    }
    function voiceColor(id) {
      const ls = laneSpec(id);
      if (ls && ls.color) return ls.color;
      const v = (window.Lab && Lab.voices) ? Lab.voices.get(id) : null;
      return v ? v.color : '#8a8a8a';
    }
    function voiceName(id) {
      const ls = laneSpec(id);
      if (ls && ls.name) return ls.name;
      const v = (window.Lab && Lab.voices) ? Lab.voices.get(id) : null;
      return v ? v.name : id;
    }
    function laneMark(id) {
      const ls = laneSpec(id);
      return (ls && ls.mark) || 'block';
    }

    function draw() {
      rafId = requestAnimationFrame(draw);
      const dpr = size();
      const W = canvas.width / dpr, H = canvas.height / dpr;
      g2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      g2d.fillStyle = '#0b0b0e';
      g2d.fillRect(0, 0, W, H);

      const actx = Lab.audio.ctx;
      const now = actx ? actx.currentTime : 0;
      const pps = Math.max(1, live(opts.pxPerSec));
      const windowSec = Math.max(0.5, live(opts.windowSec));

      // prune (keep a margin past the window so wide blocks exit cleanly)
      const cutoff = now - windowSec - 4;
      if (events.length && events[0].time < cutoff) {
        events = events.filter(function (e) { return e.time >= cutoff; });
      }

      let gs = live(opts.gridSec);
      if (!isFinite(gs) || gs < 1e-4) gs = 0;   // no usable grid: skip lines and quantization
      const origin = live(opts.origin) || 0;
      const originIndex = live(opts.originIndex) || 0;

      // Gridlines are drawn AFTER the blocks (see below): a block sitting
      // exactly on its line would otherwise paint the line over, and the eye,
      // seeing only the flanking lines, reads a perfectly-aligned block as
      // off-grid. Faint lines over the blocks keep the alignment visible.
      function drawGrid() {
        if (gs <= 0) return;
        const accentEvery = Math.max(1, live(opts.accentEvery) | 0);
        const strongEvery = Math.max(1, live(opts.strongEvery) | 0);
        const tMin = now - W / pps;
        const k0 = Math.ceil((tMin - origin) / gs);
        const k1 = Math.floor((now - origin) / gs);
        if (k1 - k0 > 4000) return;
        for (let k = k0; k <= k1; k++) {
          const x = W - (now - (origin + k * gs)) * pps;
          const idx = k + originIndex;
          const strong = ((idx % strongEvery) + strongEvery) % strongEvery === 0;
          const accent = !strong && ((idx % accentEvery) + accentEvery) % accentEvery === 0;
          g2d.strokeStyle = strong ? 'rgba(255,255,255,0.20)'
            : accent ? 'rgba(255,255,255,0.10)'
            : 'rgba(255,255,255,0.035)';
          g2d.lineWidth = strong ? 1.5 : 1;
          g2d.beginPath();
          g2d.moveTo(x, 0);
          g2d.lineTo(x, H);
          g2d.stroke();
        }
      }

      // lanes
      const lanes = opts.laneIds || seenLanes;
      if (lanes.length === 0) return;
      const laneH = H / lanes.length;
      const laneIndex = {};
      g2d.lineWidth = 1;
      for (let i = 0; i < lanes.length; i++) {
        laneIndex[lanes[i]] = i;
        const y = i * laneH;
        if (i > 0) {
          g2d.strokeStyle = 'rgba(255,255,255,0.10)';
          g2d.beginPath();
          g2d.moveTo(0, y + 0.5);
          g2d.lineTo(W, y + 0.5);
          g2d.stroke();
        }
        g2d.fillStyle = voiceColor(lanes[i]);
        g2d.fillRect(0, y, 3, laneH);
        g2d.font = '10px monospace';
        g2d.fillStyle = 'rgba(255,255,255,0.3)';
        g2d.fillText(voiceName(lanes[i]), 8, y + 12);
      }

      // event blocks (cell-aligned), then gridlines over them, then the
      // deviation triangles on top of everything
      const marks = [];
      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const li = laneIndex[e.id];
        if (li === undefined) continue;
        const mult = Math.max(1, ((opts.laneCells && opts.laneCells[e.id]) | 0) || 1);
        const cellSec = gs * mult;
        const q = gs > 0 ? quantize(e.time, origin, cellSec) : { snapped: e.time, dev: 0 };
        const x = W - (now - q.snapped) * pps;
        // one lane-cell wide on the grid (short percussive events overlap into
        // mush at true duration); sustained voices keep their real length
        const vspec = (window.Lab && Lab.voices) ? Lab.voices.get(e.id) : null;
        let bw = (gs > 0 && !(vspec && vspec.sustained))
          ? Math.max(2, cellSec * pps - 1.5)
          : Math.max(2, e.dur * pps);
        // a cut event draws clipped — the mark is the machine's decision to
        // shorten, not the acoustic length (which the cell width never showed
        // anyway)
        if (e.cut) bw *= 0.55;
        if (x > W || x + bw < 0) continue;

        const laneY = li * laneH;
        const pad = Math.min(3, laneH * 0.12);
        let by, bh;
        const pl = opts.pitchLanes ? opts.pitchLanes[e.id] : null;
        if (pl) {
          bh = Math.max(3, laneH * 0.22);
          const span = Math.max(1e-6, pl.semiMax - pl.semiMin);
          const frac = Math.max(0, Math.min(1, (e.semi - pl.semiMin) / span));
          by = laneY + pad + (1 - frac) * (laneH - pad * 2 - bh);  // higher pitch = higher
        } else {
          by = laneY + pad;
          bh = Math.max(2, laneH - pad * 2);
        }

        g2d.globalAlpha = (0.35 + 0.65 * Math.max(0, Math.min(1, e.gain))) * e.shade;
        g2d.fillStyle = voiceColor(e.id);
        if ((e.mark || laneMark(e.id)) === 'tick') {
          // a silence is not a short hit: a thin line on the lane's centre,
          // the width of the cell it occupies, so it reads as a place rather
          // than as a sound
          const th = Math.max(1.5, Math.min(3, bh * 0.18));
          roundedRect(x, by + (bh - th) / 2, bw, th, th / 2);
        } else {
          roundedRect(x, by, bw, bh, 3);
        }
        g2d.fill();
        g2d.globalAlpha = 1;

        if (gs > 0 && Math.abs(q.dev) > DEV_EPS_SEC) marks.push({ x: x, by: by, bh: bh, dev: q.dev, cellSec: cellSec });
      }

      drawGrid();

      // per-lane pattern-start marks: each lane cycles at its own length, so
      // "pattern start" is per-lane too — a bolder line confined to that lane's
      // strip wherever ITS index wraps back to 0.
      if (gs > 0 && opts.laneCycleCells) {
        const tMin2 = now - W / pps;
        const k0 = Math.ceil((tMin2 - origin) / gs);
        const k1 = Math.floor((now - origin) / gs);
        if (k1 - k0 <= 4000) {
          g2d.strokeStyle = 'rgba(255,255,255,0.5)';
          g2d.lineWidth = 2;
          for (let i = 0; i < lanes.length; i++) {
            const rawCyc = live(opts.laneCycleCells[lanes[i]]);
            if (!isFinite(rawCyc)) continue;
            const cyc = Math.max(1, Math.floor(rawCyc));
            const laneY = i * laneH;
            for (let k = k0; k <= k1; k++) {
              const idx = k + originIndex;
              if (((idx % cyc) + cyc) % cyc !== 0) continue;
              const x = W - (now - (origin + k * gs)) * pps;
              g2d.beginPath();
              g2d.moveTo(x, laneY);
              g2d.lineTo(x, laneY + laneH);
              g2d.stroke();
            }
          }
        }
      }

      for (let i = 0; i < marks.length; i++) {
        // deviation triangle at the onset: base on the cell boundary, apex
        // at the hit's ACTUAL time — inside the block = late, outside = early
        const m = marks[i];
        const len = Math.max(3, Math.min(Math.abs(m.dev), m.cellSec / 2) * pps);
        const half = Math.min(m.bh * 0.35, 5);
        const my = m.by + m.bh / 2;
        const apexX = m.dev > 0 ? m.x + len : m.x - len;
        g2d.fillStyle = 'rgba(255,255,255,0.9)';
        g2d.beginPath();
        g2d.moveTo(m.x, my - half);
        g2d.lineTo(m.x, my + half);
        g2d.lineTo(apexX, my);
        g2d.closePath();
        g2d.fill();
      }
    }

    return {
      start: function () { if (rafId === null) draw(); },
      stop: function () {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
      },
      push: push,
      setOptions: function (partial) { Object.assign(opts, partial || {}); },
      /* How many events are held. The bound is the point — a queue filled by a
         scheduler and drained by a frame grows in a hidden tab — and a bound
         nobody can read is a bound nobody can check. */
      get queued() { return events.length; },
      get maxQueued() { return MAX_EVENTS; }
    };
  }

  return { attach: attach, quantize: quantize };
})();
