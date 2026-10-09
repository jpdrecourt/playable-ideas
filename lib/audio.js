"use strict";
/* ============================================================
   Lab.audio — one persistent AudioContext + master chain.

   masterGain -> waveshaper drive -> glue compressor
             -> [dry + convolver reverb (wet mix)] -> limiter
             -> destination
   (the somitsu chain, plus glue). The gentle glue compressor and
   the small shared reverb exist to keep separately-synthesized
   voices from sounding dissociated — they share dynamics and a
   room. Glue amount is one 0..1 control (setGlue) mapped to both
   threshold and ratio; reverb mix defaults to 0 (setReverb to
   taste). The context
   is created once and kept for the page's lifetime: transport stop
   is a master FADE, never a context close — closing would cut
   already-scheduled lookahead events with a click and cost a
   re-init on restart.
   ============================================================ */
window.Lab = window.Lab || {};

Lab.audio = (function () {
  let ctx = null, master = null, shaper = null, limiter = null, noise = null;
  let glue = null, wet = null;
  let level = 0.9;   // target master gain; fadeIn returns to this
  let drive = 0;     // 0..1, applied at init if set before
  let reverb = 0;    // 0..1 wet mix, applied at init if set before
  // glue amount 0..1 → threshold −30·g dB, ratio 1+3·g
  // (0 = transparent, 1 = heavy; 0.65 ≈ the historical fixed −20 dB / 3:1)
  let glueAmt = 0.65;

  function applyDrive(amt) {
    const k = amt * 80, N = 1024, c = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1) * 2 - 1;
      c[i] = amt <= 0 ? x : (1 + k) * x / (1 + k * Math.abs(x));
    }
    shaper.curve = c;
    shaper.oversample = '2x';
  }

  // Small room: stereo exponentially-decaying noise impulse. Enough to give
  // the voices a shared space; not a hall.
  function makeImpulse(seconds) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
      }
    }
    return buf;
  }

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = level;
    shaper = ctx.createWaveShaper();
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -30 * glueAmt;
    glue.knee.value = 12;
    glue.ratio.value = 1 + 3 * glueAmt;
    glue.attack.value = 0.008;
    glue.release.value = 0.25;
    const verb = ctx.createConvolver();
    verb.buffer = makeImpulse(1.4);
    wet = ctx.createGain();
    wet.gain.value = reverb;
    master.connect(shaper);
    shaper.connect(glue);
    glue.connect(limiter);              // dry
    glue.connect(verb);                 // wet send
    verb.connect(wet);
    wet.connect(limiter);
    limiter.connect(ctx.destination);
    applyDrive(drive);
    // shared white-noise buffer; sources LOOP it so long decays never run dry
    const n = Math.floor(ctx.sampleRate * 0.5);
    noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  }

  function resume() {
    init();
    if (ctx.state === 'suspended') return ctx.resume();
    return Promise.resolve();
  }

  function setMaster(v) {
    level = Math.max(0, Math.min(1, v));
    if (ctx) master.gain.setTargetAtTime(level, ctx.currentTime, 0.01);
  }

  function setDrive(amt) {
    drive = Math.max(0, Math.min(1, amt));
    if (shaper) applyDrive(drive);
  }

  function setReverb(mix) {
    reverb = Math.max(0, Math.min(1, mix));
    if (wet) wet.gain.setTargetAtTime(reverb, ctx.currentTime, 0.02);
  }

  function setGlue(amount) {
    glueAmt = Math.max(0, Math.min(1, amount));
    if (glue) {
      const t = ctx.currentTime;
      glue.threshold.setTargetAtTime(-30 * glueAmt, t, 0.03);
      glue.ratio.setTargetAtTime(1 + 3 * glueAmt, t, 0.03);
    }
  }

  // Fades silence (or restore) everything downstream of masterGain,
  // including events already scheduled inside a lookahead window.
  function fadeOut(sec) {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + Math.max(0.005, sec || 0.05));
  }

  function fadeIn(sec) {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(level, t + Math.max(0.005, sec || 0.05));
  }

  // snapshot of the master-chain settings, for Lab.state collect()
  function getState() {
    return { master: level, drive: drive, glue: glueAmt, reverb: reverb };
  }

  return {
    init: init,
    resume: resume,
    getState: getState,
    setMaster: setMaster,
    setDrive: setDrive,
    setGlue: setGlue,
    setReverb: setReverb,
    fadeOut: fadeOut,
    fadeIn: fadeIn,
    get ctx() { return ctx; },
    get master() { return master; },  // voices connect here (pre-drive)
    get noise() { return noise; }
  };
})();
