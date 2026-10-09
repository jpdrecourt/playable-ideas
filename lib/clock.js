"use strict";
/* ============================================================
   Lab.clock — lookahead scheduling, two levels.

   createScheduler(fill): a coarse 25 ms JS timer; each wake calls
   fill(horizon) with horizon = ctx.currentTime + 0.15 and fill
   schedules whatever it wants at absolute AudioContext timestamps.
   JS timer slop never reaches the audio: only the *scheduling*
   happens on the timer, the *events* land sample-accurately.

   createTicker: the common tick-walker on top of it. periodSec is
   a FUNCTION read live once per tick, so a tempo slider alters
   only ticks not yet scheduled — no phase jump. onTick(n, t, p)
   receives the tick's own absolute timestamp t; derived sub-events
   must be computed from t (t + p/2, t + offset, ...), never by
   accumulating a separate cursor, so their phase relationship to
   the grid is exact by construction.
   ============================================================ */
window.Lab = window.Lab || {};

Lab.clock = (function () {
  const TICK_MS = 25;
  const LOOKAHEAD_SEC = 0.15;
  // A hidden tab has its timers throttled to ~1 s (worse on mobile), which
  // starves a 150 ms horizon and drops the audio out. Widening the horizon
  // while hidden buys enough scheduled-ahead material to survive the
  // throttle; it costs a longer committed future, which is why the horizon
  // narrows again the moment the tab comes back — a stop then silences
  // through the master fade with only 150 ms already in flight.
  const HIDDEN_LOOKAHEAD_SEC = 1.6;
  const START_DELAY_SEC = 0.1;
  const MIN_PERIOD_SEC = 0.001;  // clamp: a zero/NaN period must not spin or emit non-finite times
  const MAX_PER_WAKE = 10000;

  const hidden = () => (typeof document !== 'undefined' && document.hidden);

  function createScheduler(fill) {
    let timer = null, running = false;
    function wake() {
      const c = Lab.audio.ctx;
      if (!c) return;
      fill(c.currentTime + (hidden() ? HIDDEN_LOOKAHEAD_SEC : LOOKAHEAD_SEC));
    }
    // catch up the instant visibility flips, rather than waiting out the
    // throttled interval that is still pending from the hidden state
    function onVisibility() { if (running) wake(); }
    return {
      start: function () {
        if (running) return;
        running = true;
        wake();  // fill immediately; the interval covers subsequent horizons
        timer = setInterval(wake, TICK_MS);
        document.addEventListener('visibilitychange', onVisibility);
      },
      stop: function () {
        if (!running) return;
        running = false;
        clearInterval(timer);
        timer = null;
        document.removeEventListener('visibilitychange', onVisibility);
      },
      get running() { return running; }
    };
  }

  function createTicker(opts) {
    const periodSec = opts.periodSec, onTick = opts.onTick;
    let tickIndex = 0, nextTickTime = 0;
    const sched = createScheduler(function (horizon) {
      let guard = 0;
      while (nextTickTime < horizon && guard++ < MAX_PER_WAKE) {
        let p = periodSec();
        if (!isFinite(p) || p < MIN_PERIOD_SEC) p = MIN_PERIOD_SEC;
        onTick(tickIndex, nextTickTime, p);
        nextTickTime += p;
        tickIndex++;
      }
    });
    return {
      start: function (startTime) {
        if (sched.running) return;
        tickIndex = 0;
        nextTickTime = (startTime != null && isFinite(startTime))
          ? startTime
          : Lab.audio.ctx.currentTime + START_DELAY_SEC;
        sched.start();
      },
      stop: function () { sched.stop(); },
      get running() { return sched.running; },
      get tickIndex() { return tickIndex; }
    };
  }

  return {
    createScheduler: createScheduler,
    createTicker: createTicker
  };
})();
