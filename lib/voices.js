"use strict";
/* ============================================================
   Lab.voices — voice palette + registry + event bus.
   Also: Lab.prng (seeded PRNG) and Lab.patterns (euclid).

   Three voice kinds:

   'synth'  — the somitsu model: the spec's synth() builds
     timbre-only sources (NO amplitude tail) into a dest node; the
     library wraps every synth voice in ONE shared envelope (3 ms
     attack unless a call passes its own, exponential decay over
     `decay` seconds) so a decay control works uniformly across
     all voices.

   'render' — the motif-memory model: the spec's render()
     builds into an OfflineAudioContext ONCE, driven by a seeded
     PRNG (deterministic), and the resulting AudioBuffer is cached
     so an identity always sounds like itself. Playback repitches
     via playbackRate; the envelope is baked, so no decay shaping.

   'sample' — an identity with no sound of its own: a spec with
     no synth/render, holding whatever AudioBuffer setSample()
     hands it (Lab.samples decodes the files). Plays like a
     render voice — repitched by playbackRate, its own envelope
     — under a short fade-in, because a file cut in an editor
     starts wherever it starts, and `hold`/`holdFrac` can cut it
     short with a declick release instead of playing it whole.
     Silent until a buffer is set.

   All three kinds end the same way: hit -> envelope -> the hit's own
   panner -> the voice id's BUS (panner into gain) -> master. The bus
   is what setStrip drives, and it is per identity rather than per
   hit, so one fader gates everything a voice sounds however it was
   triggered.
   ============================================================ */
window.Lab = window.Lab || {};

/* ---------------- Lab.prng ---------------- */

Lab.prng = (function () {
  // mulberry32: small, fast, statistically fine for a musical toy.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function poissonSample(rand, lambda) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
  }

  return {
    create: function (seed) {
      const rawSeed = seed >>> 0;
      const rand = mulberry32(rawSeed);
      return {
        seed: rawSeed,
        next: function () { return rand(); },
        float: function (min, max) { return min + (max - min) * rand(); },
        int: function (min, max) { return Math.floor(min + (max - min + 1) * rand()); },
        poisson: function (lambda) { return poissonSample(rand, lambda); }
      };
    },
    newSeed: function () {
      return ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
    }
  };
})();

/* ---------------- Lab.patterns ---------------- */

Lab.patterns = (function () {
  // E(k,n): k onsets spread as evenly as possible over n steps
  // (onset on step 0). Optional rotation shifts the whole pattern.
  function euclid(onsets, steps, rotation) {
    const n = Math.max(1, steps | 0);
    const k = Math.max(0, Math.min(n, onsets | 0));
    const r = rotation | 0;
    const out = [];
    if (k === 0) return out;
    let prev = -1;
    for (let i = 0; i < n; i++) {
      const cur = Math.floor(i * k / n);
      if (cur !== prev) { out.push((((i + r) % n) + n) % n); prev = cur; }
    }
    out.sort(function (a, b) { return a - b; });
    return out;
  }
  return { euclid: euclid };
})();

/* ---------------- Lab.voices ---------------- */

Lab.voices = (function () {
  const registry = new Map();   // id -> spec
  const buffers = {};           // id -> rendered AudioBuffer (render voices)
  const samples = {};           // id -> loaded AudioBuffer (sample voices)
  const live = {};              // id -> [{ env, srcs, endsAt, mono }] still sounding
  const listeners = [];
  const strips = {};            // id -> { gain, mute, pan } — the desired strip
  const busNodes = {};          // id -> { pan, gain } — built on a voice's first sound

  const ATTACK_SEC = 0.003;
  const SAMPLE_ATTACK = 0.002;  // declick only — a file owns its own attack
  const DECLICK_SEC = 0.003;    // steal fade; lower = more glitch
  const CUT_RELEASE = 0.01;     // a cut is a musical release, wider than a steal's declick
  const STRIP_RAMP = 0.008;     // a fader move under a sustaining voice must not click
  const TAIL_SEC = 0.06;        // room after a printed hit's decay, so nothing is clipped

  function emit(ev) { for (let i = 0; i < listeners.length; i++) listeners[i](ev); }

  function define(spec) {
    registry.set(spec.id, {
      id: spec.id,
      name: spec.name || spec.id,
      color: spec.color || '#999999',
      kind: spec.kind,
      synth: spec.synth || null,
      render: spec.render || null,
      duration: spec.duration || 1,     // render voices: offline buffer length (s)
      sustained: !!spec.sustained,      // roll draws at true duration, not one cell
      defaults: spec.defaults || {}
    });
  }

  // The buffer behind a 'sample' voice; null empties the lane again.
  function setSample(id, buf) { samples[id] = buf || null; }

  function get(id) { return registry.get(id); }
  function all() { return Array.from(registry.values()); }
  function subscribe(fn) { listeners.push(fn); }

  // FNV-1a: a stable per-id seed, so each render voice is deterministic
  // on its own (defining more voices never changes existing timbres).
  function seedFromId(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  async function ensureRendered() {
    Lab.audio.init();
    const sr = Lab.audio.ctx.sampleRate;
    for (const v of registry.values()) {
      if (v.kind !== 'render' || buffers[v.id]) continue;
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const octx = new OAC(1, Math.ceil(v.duration * sr), sr);
      const out = octx.createGain();
      out.gain.value = 1;
      out.connect(octx.destination);
      v.render(octx, out, Lab.prng.create(seedFromId(v.id)));
      buffers[v.id] = await octx.startRendering();
    }
  }

  /* One hit of a voice, printed to a buffer — for a toy that wants a palette
     sound where it can only put a FILE: a sample lane's default, a mark whose
     drawn length is read off a duration, anything measuring the material
     rather than triggering it. The envelope is the same one `play` wraps a
     synth voice in, so the print is the hit and not the raw timbre.

     It needs a live AudioContext even though it renders offline, and not for
     the sample rate: the noise sources every percussive voice reaches for read
     `Lab.audio.noise`, which `init` is what creates. Call this from a gesture,
     or from a path that already has audio — printed too early, a voice comes
     back with its noise missing, and one whose whole excitation is noise
     comes back silent. */
  async function renderToBuffer(id, opts) {
    const v = registry.get(id);
    if (!v || !v.synth) return null;
    Lab.audio.init();
    opts = opts || {};
    const d = v.defaults || {};
    const sr = Lab.audio.ctx.sampleRate;
    const decay = (opts.decay != null) ? opts.decay : ((d.decay != null) ? d.decay : 0.2);
    const gain = (opts.gain != null) ? opts.gain : ((d.gain != null) ? d.gain : 0.8);
    const semi = opts.semi || 0;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const octx = new OAC(1, Math.ceil((ATTACK_SEC + decay + TAIL_SEC) * sr), sr);
    const env = octx.createGain();
    env.connect(octx.destination);
    env.gain.setValueAtTime(0.0001, 0);
    env.gain.exponentialRampToValueAtTime(gain, ATTACK_SEC);
    env.gain.exponentialRampToValueAtTime(0.0001, ATTACK_SEC + decay);
    v.synth(octx, 0, semi, env, ATTACK_SEC + decay + TAIL_SEC, []);
    return octx.startRendering();
  }

  // One voice cut with the tiniest fade that still declicks, then marked
  // finished so nothing tries to cut it a second time.
  function cutVoice(p, when) {
    try { p.env.gain.cancelAndHoldAtTime(when); }        // hold level, then fade
    catch (e) { p.env.gain.cancelScheduledValues(when); } // fallback: older browsers
    p.env.gain.linearRampToValueAtTime(0, when + DECLICK_SEC);
    const off = when + DECLICK_SEC + 0.001;
    for (let i = 0; i < p.srcs.length; i++) {
      try { p.srcs[i].stop(off); } catch (e) { /* already stopped */ }
    }
    p.endsAt = when;
  }

  // Two kinds of steal:
  //   true  — monophonic per voice id (somitsu-circles): the most recent hit
  //     that itself asked to be stealable gives way, and nothing else. A hit
  //     spawned without steal is not in that chain and is never touched.
  //   'all' — every voice of this id still sounding goes, however it was
  //     spawned: a cut that clears the present, not just the last hit.
  function stealVoice(id, when, all) {
    const list = live[id];
    if (!list) return;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (when >= p.endsAt) { list.splice(i, 1); continue; }   // ended on its own
      if (!all && !p.mono) continue;                           // not in the chain
      cutVoice(p, when);
      list.splice(i, 1);
      if (!all) return;
    }
  }

  // Every voice is remembered until it stops sounding, because a steal:'all'
  // has to find hits that never asked to be stealable. Pruning happens on each
  // spawn, so a list holds about as many entries as that id has voices ringing.
  function trackVoice(id, when, rec) {
    const list = live[id] || (live[id] = []);
    for (let i = list.length - 1; i >= 0; i--)
      if (when >= list[i].endsAt) list.splice(i, 1);
    list.push(rec);
  }

  /* ---------- per-voice output bus ----------
     Every hit of a voice id passes through that id's own strip — a
     panner into a gain — on its way to master, so a mixer move is the
     final gate on everything the voice sounds, whatever triggered it.
     A bus is built on the voice's first sound and opens at unity, so a
     toy that never touches a strip hears exactly what it would without
     one. The desired values live in `strips` whether or not the audio
     exists: setStrip is callable from a page's build phase, long before
     a gesture wakes the context, and the values land when the node is
     first built. */

  function stripFor(id) {
    let s = strips[id];
    if (!s) s = strips[id] = { gain: 1, mute: false, pan: 0 };
    return s;
  }

  // Mute is the bus gain going to 0 and nothing else, so the stored gain
  // survives the round trip and unmute returns to where the fader stands.
  function applyStrip(id, immediate) {
    const b = busNodes[id];
    if (!b) return;
    const s = stripFor(id);
    const target = s.mute ? 0 : s.gain;
    if (immediate) {
      b.gain.gain.value = target;
      b.pan.pan.value = s.pan;
      return;
    }
    const t = Lab.audio.ctx.currentTime;
    b.gain.gain.cancelScheduledValues(t);
    b.gain.gain.setValueAtTime(b.gain.gain.value, t);
    b.gain.gain.linearRampToValueAtTime(target, t + STRIP_RAMP);
    b.pan.pan.cancelScheduledValues(t);
    b.pan.pan.setValueAtTime(b.pan.pan.value, t);
    b.pan.pan.linearRampToValueAtTime(s.pan, t + STRIP_RAMP);
  }

  function ensureBus(id) {
    const ctx = Lab.audio.ctx;
    if (!ctx) return null;
    let b = busNodes[id];
    if (!b) {
      b = busNodes[id] = { pan: ctx.createStereoPanner(), gain: ctx.createGain() };
      b.pan.connect(b.gain);
      b.gain.connect(Lab.audio.master);
      applyStrip(id, true);
    }
    return b;
  }

  // Where a hit's own panner connects. play() has already established that
  // the context exists; the fallback is there for nothing to be silent if
  // it somehow hasn't.
  function busIn(id) {
    const b = ensureBus(id);
    return b ? b.pan : Lab.audio.master;
  }

  function bus(id) {
    const b = ensureBus(id);
    return b ? b.gain : null;
  }

  function setStrip(id, partial) {
    if (!partial) return;
    const s = stripFor(id);
    if (partial.gain != null && isFinite(partial.gain)) s.gain = Math.max(0, Math.min(1.5, partial.gain));
    if (partial.mute != null) s.mute = !!partial.mute;
    if (partial.pan != null && isFinite(partial.pan)) s.pan = Math.max(-1, Math.min(1, partial.pan));
    applyStrip(id, false);                  // no-op until the bus exists
  }

  function getStrip(id) {
    const s = stripFor(id);
    return { gain: s.gain, mute: s.mute, pan: s.pan };
  }

  function stripState() {
    const out = {};
    for (const id in strips) out[id] = getStrip(id);
    return out;
  }

  function play(id, when, opts) {
    const v = registry.get(id);
    const ctx = Lab.audio.ctx;
    if (!v || !ctx || !isFinite(when)) return false;
    opts = opts || {};
    const d = v.defaults;
    const gain = (opts.gain != null) ? opts.gain : (d.gain != null ? d.gain : 0.8);
    const semi = isFinite(opts.semi) ? opts.semi : (d.semi || 0);
    const pan = (opts.pan != null) ? opts.pan : (d.pan || 0);
    const stealOpt = (opts.steal != null) ? opts.steal : d.steal;
    const stealAll = (stealOpt === 'all');
    const steal = !!stealOpt;     // any truthy value joins the monophonic chain
    const shade = (opts.shade != null && isFinite(opts.shade)) ? opts.shade : 1;
    if (!(gain > 0) || !isFinite(gain)) return false;

    let dur, wasCut = false;
    if (v.kind === 'sample') {
      const buf = samples[id];
      if (!buf) return false;                 // no file loaded — the lane is silent, not broken
      const attack = (opts.attack != null) ? Math.max(0.001, opts.attack) : SAMPLE_ATTACK;
      if (steal) stealVoice(id, when, stealAll);
      const rate = Math.pow(2, semi / 12);
      const env = ctx.createGain();
      const pn = ctx.createStereoPanner();
      pn.pan.value = pan;
      env.connect(pn);
      pn.connect(busIn(id));
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.playbackRate.value = rate;
      s.connect(env);
      // the file carries its own envelope; the ramp is a declick over an
      // editor's hard cut, not shaping
      env.gain.setValueAtTime(0.0001, when);
      env.gain.linearRampToValueAtTime(gain, when + attack);
      s.start(when);
      dur = buf.duration / rate;
      // holdFrac is relative to the file's own playing length (post-repitch),
      // so the same knob position means the same proportion of material
      // whatever the sample or the semi offset; holdFrac wins if both are given
      const holdSec = (opts.holdFrac != null && isFinite(opts.holdFrac)) ? opts.holdFrac * dur
                    : opts.hold;
      if (holdSec != null && isFinite(holdSec) && holdSec < dur) {
        const h = Math.max(attack, holdSec);
        env.gain.setValueAtTime(gain, when + h);
        env.gain.linearRampToValueAtTime(0, when + h + CUT_RELEASE);
        s.stop(when + h + CUT_RELEASE + 0.001);
        dur = h + CUT_RELEASE;
        wasCut = true;
      }
      trackVoice(id, when, { env: env, srcs: [s], endsAt: when + dur, mono: steal });
    } else if (v.kind === 'render') {
      const buf = buffers[id];
      if (!buf) return false;                 // not rendered yet — call ensureRendered() first
      if (steal) stealVoice(id, when, stealAll);
      const rate = Math.pow(2, semi / 12);
      const env = ctx.createGain();
      env.gain.value = gain;
      const pn = ctx.createStereoPanner();
      pn.pan.value = pan;
      env.connect(pn);
      pn.connect(busIn(id));
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.playbackRate.value = rate;
      s.connect(env);
      s.start(when);
      dur = buf.duration / rate;
      trackVoice(id, when, { env: env, srcs: [s], endsAt: when + dur, mono: steal });
    } else {
      const decay = Math.max(0.01, (opts.decay != null) ? opts.decay : (d.decay != null ? d.decay : 0.2));
      const attack = (opts.attack != null) ? Math.max(0.001, opts.attack) : ATTACK_SEC;
      if (steal) stealVoice(id, when, stealAll);
      const env = ctx.createGain();
      const pn = ctx.createStereoPanner();
      pn.pan.value = pan;
      env.connect(pn);
      pn.connect(busIn(id));
      const stopAt = when + attack + decay + 0.05;
      // the ONE shared envelope: 3 ms attack unless opts.attack softens the
      // front, then exponential decay over `decay`
      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), when + attack);
      env.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
      const srcs = [];
      v.synth(ctx, when, semi, env, stopAt, srcs);
      dur = attack + decay;
      trackVoice(id, when, { env: env, srcs: srcs, endsAt: stopAt, mono: steal });
    }
    emit({ time: when, id: id, gain: gain, semi: semi, dur: dur, shade: shade, cut: wasCut });
    return true;
  }

  /* ---------- built-in palette: somitsu synths ---------- */
  // Timbre-only sources; the shared envelope above owns amplitude.
  // Noise sources loop the shared 0.5 s buffer so long decays never run dry.

  /* Every noise-based voice reads the same half-second buffer, and reading it
     from the same place every time makes a fast hi-hat run sound like one
     sample retriggered rather than like a hat being struck repeatedly. Starting
     each hit at a random offset costs one argument and removes that. */
  function loopNoise(ctx, t, stopAt, srcs) {
    const s = ctx.createBufferSource();
    s.buffer = Lab.audio.noise;
    s.loop = true;
    s.start(t, Math.random() * (Lab.audio.noise ? Lab.audio.noise.duration : 0));
    s.stop(stopAt);
    srcs.push(s);
    return s;
  }

  /* ---------- the internal-envelope discipline ----------
     A synth shapes its OWN components; the shared envelope of `play` is a
     master tail multiplied on top. Two shapes are needed and they mean
     different things.

     `part` is RELATIVE: its decay is a fraction of the hit's own length, so
     the relationship between a voice's components survives being stretched.
     A body at rel 1 follows the master; a shimmer at rel 0.3 dies inside it.
     That difference is what gives a three-second hit an interior instead of a
     plateau, and it is the reason these are not simply fixed times.

     `strike` is ABSOLUTE, and deliberately so: a stick hitting a drum takes
     the same few milliseconds whether the drum then rings for an eighth note
     or for three seconds. Stretching a transient would be a lie about the
     physical event, so transients keep their own clock. Every voice below is
     built from these two — a fixed strike, then one or more relative bodies. */
  function partDur(t, stopAt, rel) {
    return Math.max(0.006, (stopAt - t - 0.05) * rel);
  }
  function part(ctx, t, stopAt, rel, level) {
    const g = ctx.createGain();
    // rel >= 1 RIDES the master: a flat gain, because the shared envelope is
    // already the tail. Decaying here as well would fade the voice twice and
    // leave a stretched hit inaudible long before the master lets go of it.
    if (rel >= 1) { g.gain.value = level; return g; }
    const d = partDur(t, stopAt, rel);
    g.gain.setValueAtTime(Math.max(1e-4, level), t);
    g.gain.exponentialRampToValueAtTime(Math.max(1e-5, level * 0.0016), t + d);
    return g;
  }
  function strike(ctx, t, sec, level) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(1e-4, level), t);
    g.gain.exponentialRampToValueAtTime(1e-5, t + sec);
    return g;
  }

  /* ---------- the six-square metallic bank ----------
     The 808's cymbal circuit: six squares at fixed inharmonic ratios, summed.
     Hat, cymbal, ride and cowbell in that machine are not separate oscillator
     sets — they are this one bank behind different filters and envelopes, and
     building them that way here is what makes them sound like members of one
     kit rather than four unrelated synths. `semi` scales the whole bank, so
     the metallic family transposes natively. */
  const METAL = [205.3, 369.6, 304.4, 522.7, 540.0, 800.0];

  function metalBank(ctx, t, semi, stopAt, srcs, freqs) {
    const sc = Math.pow(2, semi / 12);
    const sum = ctx.createGain();
    sum.gain.value = 1 / Math.sqrt(freqs.length);
    for (let i = 0; i < freqs.length; i++) {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = freqs[i] * sc;
      o.connect(sum);
      o.start(t);
      o.stop(stopAt);
      srcs.push(o);
    }
    return sum;
  }

  function band(ctx, type, freq, q) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q != null) f.Q.value = q;
    return f;
  }

  /* A struck drum: a pitch sweep that lands on the body note, plus the sound
     of the thing that hit it. The sweep is what the ear reads as weight, and
     the beater is what tells it something was STRUCK — without that click a
     kick is a sine, and no amount of decay makes it a drum. Both are absolute:
     a beater does not get slower because the drum rings longer.

     `from`→`to` over `sweepSec` is an exponential glide from the attack
     pitch down to the body note; the kick below runs it 250 down to 48 Hz in
     fifty milliseconds. */
  function struck(from, to, sweepSec, clickHz, clickLevel) {
    return function (ctx, t, semi, dest, stopAt, srcs) {
      const sc = Math.pow(2, semi / 12);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(from * sc, t);
      o.frequency.exponentialRampToValueAtTime(to * sc, t + sweepSec);
      o.connect(dest);
      o.start(t);
      o.stop(stopAt);
      srcs.push(o);

      const g = strike(ctx, t, 0.0018, clickLevel);
      loopNoise(ctx, t, t + 0.02, srcs)
        .connect(band(ctx, 'highpass', clickHz)).connect(g).connect(dest);
    };
  }


  /* hat — the bank through a highpass, in two layers plus a chick. The bright
     layer dies inside the hit and the body follows it, so a closed hat is a
     tick and an open one is a tick that keeps ringing: the same voice, and the
     difference is only how long the master lets it run. A little noise at the
     top of the attack is the pedal-and-shell sound the squares cannot make. */
  function hatSynth(ctx, t, semi, dest, stopAt, srcs) {
    const bank = metalBank(ctx, t, semi, stopAt, srcs, METAL);

    const bright = part(ctx, t, stopAt, 0.22, 1.7);
    bank.connect(band(ctx, 'highpass', 9000)).connect(bright).connect(dest);

    const body = part(ctx, t, stopAt, 1.0, 0.72);
    bank.connect(band(ctx, 'highpass', 6000)).connect(body).connect(dest);

    const chick = strike(ctx, t, 0.006, 0.5);
    loopNoise(ctx, t, t + 0.02, srcs)
      .connect(band(ctx, 'highpass', 7000)).connect(chick).connect(dest);
  }

  /* clap — three fast noise bursts about ten milliseconds apart, then a
     longer tail. The bursts are what make it a clap rather than a short snare,
     and they are ABSOLUTE: several hands arriving at slightly different
     moments is a fixed physical event, not something that scales with how long
     the room rings afterwards. The tail is relative and rides the master, so
     stretching this gives a clap in a bigger room rather than a longer burst. */
  function clapSynth(ctx, t, semi, dest, stopAt, srcs) {
    const sc = Math.pow(2, semi / 12);
    const bp = band(ctx, 'bandpass', 1000 * sc, 1.1);
    bp.connect(dest);
    const hands = [[0, 7.2], [0.010, 6.1], [0.019, 5.0]];
    for (let i = 0; i < hands.length; i++) {
      const at = t + hands[i][0];
      const g = strike(ctx, at, 0.009, hands[i][1]);
      loopNoise(ctx, at, at + 0.04, srcs).connect(g).connect(bp);
    }
    const room = part(ctx, t + 0.026, stopAt, 1.0, 2.4);
    loopNoise(ctx, t + 0.026, stopAt, srcs).connect(room).connect(bp);
  }

  /* rim — a millisecond and a half of noise fired into a very narrow
     resonator. The burst is the stick and the resonator is the block, which is
     why this is a PITCHED crack rather than a filtered tick: `semi` moves the
     resonator, so the voice can be tuned. A narrow band rings for about Q/πf
     seconds — a few milliseconds here — so a quiet tone at the same frequency
     rides the master underneath it, and a stretched rim is a rimshot in a live
     room instead of five milliseconds followed by silence. */
  function rimSynth(ctx, t, semi, dest, stopAt, srcs) {
    const sc = Math.pow(2, semi / 12);
    return woodBlock(ctx, t, sc * 1700, 26, 0.0015, 0.30, dest, stopAt, srcs, 0.34);
  }

  /* clave — the same resonator higher and narrower, and with none of the
     stick noise: a clave is almost pure tone, which is what lets it cut
     through a full bar where the rim would be swallowed. */
  function claveSynth(ctx, t, semi, dest, stopAt, srcs) {
    const sc = Math.pow(2, semi / 12);
    return woodBlock(ctx, t, sc * 2500, 42, 0.0012, 0.36, dest, stopAt, srcs, 0.16);
  }

  function woodBlock(ctx, t, freq, q, burst, tone, dest, stopAt, srcs, click) {
    const bp = band(ctx, 'bandpass', freq, q);
    bp.connect(dest);
    const hit = strike(ctx, t, burst, 28.0);
    loopNoise(ctx, t, t + 0.02, srcs).connect(hit).connect(bp);

    // the tail the resonator itself is too short to give
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(part(ctx, t, stopAt, 1.0, tone)).connect(dest);
    osc.start(t);
    osc.stop(stopAt);
    srcs.push(osc);

    if (click > 0) {
      const g = strike(ctx, t, 0.002, click * 40);
      loopNoise(ctx, t, t + 0.02, srcs)
        .connect(band(ctx, 'highpass', 3000)).connect(g).connect(dest);
    }
  }

  /* snare — two drum tones and a set of wires, and they do not last the same
     length of time. The heads are struck and stop; the snares underneath go on
     rattling, so the noise rides the master and the tones die inside it. That
     is the whole behaviour of the instrument: a snare hit is a thud that turns
     into a hiss, and a version where both fade together is a filtered noise
     burst wearing the name. Two tones rather than one because a drum has a
     head and a shell, and the beating between 180 and 330 Hz is most of what
     makes it sound like a box with skin on it. */
  function snareSynth(ctx, t, semi, dest, stopAt, srcs) {
    const sc = Math.pow(2, semi / 12);
    /* Levelled for the LONG case, not the short one: a relative component is
       brief when the hit is brief but sustains for hundreds of milliseconds
       when it is stretched, and it is loudest while the master is still near
       full. Set by the short hit, this clipped by 11 dB at three seconds. */
    const heads = part(ctx, t, stopAt, 0.10, 0.7);
    heads.connect(dest);
    [[180, 1.0], [330, 0.6]].forEach(function (pair) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = pair[0] * sc;
      const g = ctx.createGain();
      g.gain.value = pair[1];
      o.connect(g).connect(heads);
      o.start(t);
      o.stop(stopAt);
      srcs.push(o);
    });

    const wires = part(ctx, t, stopAt, 1.0, 1.05);
    loopNoise(ctx, t, stopAt, srcs)
      .connect(band(ctx, 'bandpass', 1900 * sc, 0.8)).connect(wires).connect(dest);

    const rimshot = strike(ctx, t, 0.0025, 1.1);
    loopNoise(ctx, t, t + 0.02, srcs)
      .connect(band(ctx, 'highpass', 3500)).connect(rimshot).connect(dest);
  }



  /* cowbell — the same circuit, narrowed to the two squares the 808 uses for
     it. Two decays rather than one: the clank at the front is brief and the
     ring underneath it carries on, which is the difference between a bell
     struck and a bell simply sounding.

     Both bands scale with the bank, and that is what makes this voice
     transposable at all. A fixed filter over a moving source does not move
     pitch: the squares slide their harmonics through a window that stays put,
     so the LEVEL changes and the perceived centre does not. Measured with the
     bands left fixed, a two-octave sweep moved the centroid 1.9 semitones;
     scaled, 17.7. It is also the physical reading — a bigger bell has lower
     partials and a lower body resonance, and it is one bell either way. */
  function cowbellSynth(ctx, t, semi, dest, stopAt, srcs) {
    const sc = Math.pow(2, semi / 12);
    const bank = metalBank(ctx, t, semi, stopAt, srcs, [540.0, 800.0]);

    const clank = part(ctx, t, stopAt, 0.20, 1.25);
    bank.connect(band(ctx, 'bandpass', 3800 * sc, 2.5)).connect(clank).connect(dest);

    const ring = part(ctx, t, stopAt, 1.0, 0.3);
    bank.connect(band(ctx, 'bandpass', 1200 * sc, 1.0)).connect(ring).connect(dest);
  }

  /* crash — the same bank, two paths that behave differently over time: a
     bright strike that is gone almost at once, and a long sizzle that outlives
     it. That split is what a cymbal actually does, and it is what a stretched
     crash needs — without it three seconds of decay is three seconds of the
     same spectrum getting quieter. Noise rides the sizzle, because six squares
     alone read as a buzz rather than as metal.

     It carries a TRIM of −12 dB, and the trim sits inside the voice rather
     than in `defaults.gain` for a reason worth stating: `play`'s `gain`
     OVERRIDES the default instead of multiplying it, and one toy takes the
     timbre function alone and wraps its own envelope around it — a trim in the
     defaults would reach neither. Inside the voice it reaches every path.

     The number is an ear's, not the meter's. Rendered alone against the median
     of the seven voices it shares a kit with, this crash is 1.7 dB hot on peak
     and 4.9 dB hot on energy, which is what a single hit can show. What an ear
     hears is a 0.9 s wash arriving on a sixteenth lattice, where one hit is
     still sounding under the next three, and that accumulation is what is
     being trimmed. Re-derive this from single hits and you will find 5 dB and
     be wrong by seven. */
  const CRASH_TRIM = 0.251;                   // −12 dB
  function crashSynth(ctx, t, semi, dest, stopAt, srcs) {
    const bank = metalBank(ctx, t, semi, stopAt, srcs, METAL);

    const hit = part(ctx, t, stopAt, 0.08, 1.0 * CRASH_TRIM);
    bank.connect(band(ctx, 'bandpass', 7000, 1.2)).connect(hit).connect(dest);

    const sizzle = part(ctx, t, stopAt, 1.0, 0.72 * CRASH_TRIM);
    bank.connect(band(ctx, 'highpass', 5000)).connect(sizzle).connect(dest);

    const air = part(ctx, t, stopAt, 0.8, 0.45 * CRASH_TRIM);
    loopNoise(ctx, t, stopAt, srcs)
      .connect(band(ctx, 'highpass', 6000)).connect(air).connect(dest);
  }

  /* ride — the fourth member of the metallic family, and the one the palette
     was missing: a defined bell ping over a wash that outlasts it. Where the
     crash leads with noise and spreads, the ride leads with a pitched ping and
     stays narrow, which is what lets the two sit in the same bar without
     turning into one another. */
  function rideSynth(ctx, t, semi, dest, stopAt, srcs) {
    const bank = metalBank(ctx, t, semi, stopAt, srcs, METAL);

    const ping = part(ctx, t, stopAt, 0.14, 1.6);
    bank.connect(band(ctx, 'bandpass', 3400, 6)).connect(ping).connect(dest);

    const wash = part(ctx, t, stopAt, 1.0, 0.8);
    bank.connect(band(ctx, 'bandpass', 6500, 1.1)).connect(wash).connect(dest);

    const tip = strike(ctx, t, 0.004, 0.45);
    loopNoise(ctx, t, t + 0.02, srcs)
      .connect(band(ctx, 'highpass', 8000)).connect(tip).connect(dest);
  }

  /* pluck — Karplus-Strong: a burst of noise poured into a delay line the
     length of one period, fed back through a lowpass. The string is the loop,
     not the oscillator, and everything that makes it sound plucked falls out
     of that: the noise burst is the pick, the loop length is the pitch, and
     the lowpass in the feedback is why the high partials die first and a note
     grows mellow as it rings. A triangle wave has none of that — it is the
     same spectrum at the end as at the start, which is exactly the flatness
     this round is for.

     Two things about the loop are Web Audio's doing rather than the
     algorithm's, and both were found by measuring rather than by reading.

     A DelayNode inside a feedback cycle is held to a minimum of one render
     quantum — 128 samples, about 2.9 ms — which caps a plain loop near 345 Hz.
     The way past it is to run whole multiples of the period per loop: same
     pitch, legal loop length, and the only cost is the first repeat arriving a
     few periods late, which is inaudible under a pick.

     And the damping filter cannot go INSIDE the loop. A pure delay-and-gain
     loop is well behaved — measured at feedback 0.94 it falls to −89 dB after
     a second — but putting a biquad in the same cycle makes it diverge, to
     +42 dB at feedback 0.88 and worse above that. So the darkening happens on
     the output tap instead, swept down across the note. A listener hears the
     same thing either way, which is a string growing mellow as it rings; what
     is lost is only that the darkening does not compound per round trip. */
  function pluckSynth(ctx, t, semi, dest, stopAt, srcs) {
    const freq = 220 * Math.pow(2, semi / 12);
    const minDelay = 160 / ctx.sampleRate;               // clear of the quantum
    let period = 1 / freq;
    while (period < minDelay) period *= 2;               // whole periods only

    const d = ctx.createDelay(0.2);
    d.delayTime.value = period;
    const fb = ctx.createGain();
    /* 0.994, found by measurement and not by reasoning. Pushing the loop
       towards lossless to stop it decaying twice — once itself, once under the
       master — makes the voice QUIETER, not longer: near unity the comb puts
       its energy into narrow peaks and cancels between them, so the tap falls
       away even as the loop holds more. At 0.994 the string measures −4 dB at
       the onset and −44 dB after three seconds, which is a real string decay,
       and the master shapes what is left. */
    fb.gain.value = 0.994;
    d.connect(fb).connect(d);                 // delay and gain only: stable

    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.Q.value = 0.4;
    const open = Math.min(11000, freq * 16), shut = Math.max(freq * 4, 300);
    damp.frequency.setValueAtTime(open, t);
    damp.frequency.exponentialRampToValueAtTime(shut, t + partDur(t, stopAt, 0.9));
    // a comb with near-unity feedback puts most of its energy in narrow peaks
    // and cancels between them, so the tap reads far quieter than the loop is
    d.connect(damp).connect(part(ctx, t, stopAt, 1.0, 3.5)).connect(dest);

    // the pick: one period of noise is the classic excitation, and a short
    // one keeps the attack tight at high notes
    const pick = strike(ctx, t, Math.max(0.002, period), 0.9);
    loopNoise(ctx, t, t + Math.max(0.01, period * 2), srcs)
      .connect(band(ctx, 'lowpass', 6000)).connect(pick).connect(d);
  }

  /* shaker — high noise with a soft front. Everything else in this palette is
     struck; a shaker is a handful of beads arriving over a few milliseconds,
     so it has no click at all, and the attack is the whole character. Two
     bands rather than one: the beads up top and the body of the shell under
     them, on different clocks. */
  function shakerSynth(ctx, t, semi, dest, stopAt, srcs) {
    const sc = Math.pow(2, semi / 12);
    const beads = ctx.createGain();
    beads.gain.setValueAtTime(0.0001, t);
    beads.gain.linearRampToValueAtTime(0.85, t + 0.006);  // soft, not struck
    beads.gain.exponentialRampToValueAtTime(0.02, t + Math.max(0.02, partDur(t, stopAt, 0.35)));
    loopNoise(ctx, t, stopAt, srcs)
      .connect(band(ctx, 'highpass', 7000 * sc)).connect(beads).connect(dest);

    const shell = part(ctx, t, stopAt, 1.0, 0.5);
    loopNoise(ctx, t, stopAt, srcs)
      .connect(band(ctx, 'bandpass', 3400 * sc, 1.0)).connect(shell).connect(dest);
  }

  /* acid — the 303: a saw through a resonant lowpass whose cutoff is swept by
     its own envelope, which is the whole instrument. The resonance is what
     makes the sweep audible as a shape rather than as a tone getting brighter,
     and the sweep is relative, so a long note opens slowly and a short one
     barks. Accent lifts the sweep rather than the level — louder AND brighter
     is what an accent does on that machine — and slide is a glide into the
     note, so a line played with it phrases instead of stepping. */
  function acidSynth(ctx, t, semi, dest, stopAt, srcs) {
    const freq = 110 * Math.pow(2, semi / 12);
    const accent = 0.45;                       // fixed here; a toy can fork it
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 12;

    const base = freq * 2.2;
    const top = Math.min(7000, freq * (10 + accent * 26));
    const sweep = Math.max(0.03, partDur(t, stopAt, 0.55));
    lp.frequency.setValueAtTime(top, t);
    lp.frequency.exponentialRampToValueAtTime(base, t + sweep);

    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    // slide: the pitch arrives rather than appearing, which is what makes a
    // 303 line phrase. setTargetAtTime, so it is a glide and not a ramp.
    o.frequency.setValueAtTime(freq * 0.75, t);
    o.frequency.setTargetAtTime(freq, t, 0.012);
    o.connect(lp);
    o.start(t);
    o.stop(stopAt);
    srcs.push(o);

    lp.connect(part(ctx, t, stopAt, 1.0, 0.5)).connect(dest);
  }

  define({ id: 'kick',  name: 'Kick',  color: '#e0a43c', kind: 'synth', synth: struck(250, 48, 0.05, 1200, 0.9),  defaults: { gain: 0.9, decay: 0.28, steal: true } });
  define({ id: 'snare', name: 'Snare', color: '#e8e2d0', kind: 'synth', synth: snareSynth,                  defaults: { gain: 0.8, decay: 0.18 } });
  define({ id: 'clap',  name: 'Clap',  color: '#d4574a', kind: 'synth', synth: clapSynth,                   defaults: { gain: 0.8, decay: 0.18 } });
  define({ id: 'hat',   name: 'Hat',   color: '#9fb8c4', kind: 'synth', synth: hatSynth,                    defaults: { gain: 0.7, decay: 0.06 } });
  define({ id: 'tom',   name: 'Tom',   color: '#7fae6a', kind: 'synth', synth: struck(340, 90, 0.11, 2200, 0.7), defaults: { gain: 0.8, decay: 0.3 } });
  define({ id: 'rim',   name: 'Rim',   color: '#a67c52', kind: 'synth', synth: rimSynth,                    defaults: { gain: 0.8, decay: 0.08 } });
  define({ id: 'clave', name: 'Clave', color: '#c9a227', kind: 'synth', synth: claveSynth,                  defaults: { gain: 0.7, decay: 0.10 } });
  define({ id: 'cowbell', name: 'Cowbell', color: '#5ad1a5', kind: 'synth', synth: cowbellSynth,           defaults: { gain: 0.75, decay: 0.15 } });
  define({ id: 'crash', name: 'Crash', color: '#b8c6ff', kind: 'synth', synth: crashSynth,                 defaults: { gain: 0.6, decay: 0.9 } });
  define({ id: 'ride',  name: 'Ride',  color: '#8fa9d8', kind: 'synth', synth: rideSynth,                  defaults: { gain: 0.55, decay: 0.7 } });
  define({ id: 'pluck', name: 'Pluck', color: '#2fbf9b', kind: 'synth', synth: pluckSynth,                  defaults: { gain: 0.8, decay: 0.5 } });
  define({ id: 'shaker', name: 'Shaker', color: '#c8b48f', kind: 'synth', synth: shakerSynth,                defaults: { gain: 0.6, decay: 0.09 } });
  define({ id: 'acid',  name: 'Acid',  color: '#ff5cf0', kind: 'synth', synth: acidSynth,                   defaults: { gain: 0.55, decay: 0.35, steal: true } });

  /* ---------- built-in palette: motif-memory identities ---------- */
  // Rendered once, offline, from a per-id seed; a given identity always
  // sounds like itself.

  function makeNoiseBuffer(ctx, prng, durationSec) {
    const sr = ctx.sampleRate;
    const len = Math.max(1, Math.round(durationSec * sr));
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = prng.next() * 2 - 1;
    return buf;
  }

  // Leaky-integrated white noise, amplitude-normalized ("brown-ish").
  function makeBrownNoiseBuffer(ctx, prng, durationSec) {
    const sr = ctx.sampleRate;
    const len = Math.max(1, Math.round(durationSec * sr));
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    let acc = 0, peak = 1e-6;
    for (let i = 0; i < len; i++) {
      acc = acc * 0.98 + (prng.next() * 2 - 1) * 0.2;
      data[i] = acc;
      peak = Math.max(peak, Math.abs(acc));
    }
    for (let i = 0; i < len; i++) data[i] /= peak;
    return buf;
  }

  define({
    id: 'click', name: 'Click', color: '#ff4d6d', kind: 'render', duration: 0.01,
    render: function (ctx, out, prng) {
      const burst = prng.float(0.002, 0.005);
      const src = ctx.createBufferSource();
      src.buffer = makeNoiseBuffer(ctx, prng, burst);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 4000;
      hp.Q.value = 0.7;
      const env = ctx.createGain();
      env.gain.setValueAtTime(1, 0);
      env.gain.linearRampToValueAtTime(0.0001, burst);
      src.connect(hp).connect(env).connect(out);
      src.start(0);
    }
  });

  define({
    id: 'tick', name: 'Tick', color: '#ffd23f', kind: 'render', duration: 0.05,
    render: function (ctx, out, prng) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.9, 0);
      env.gain.setTargetAtTime(0.0001, 0.001, 0.008);
      osc.connect(env).connect(out);
      osc.start(0);
      osc.stop(0.05);
    }
  });

  define({
    id: 'knock', name: 'Knock', color: '#5aa8ff', kind: 'render', duration: 0.09,
    render: function (ctx, out, prng) {
      const noiseDur = 0.02;
      const src = ctx.createBufferSource();
      src.buffer = makeNoiseBuffer(ctx, prng, noiseDur);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 900;
      bp.Q.value = 1.5;
      const noiseEnv = ctx.createGain();
      noiseEnv.gain.setValueAtTime(0.8, 0);
      noiseEnv.gain.linearRampToValueAtTime(0.0001, noiseDur);
      src.connect(bp).connect(noiseEnv).connect(out);
      src.start(0);
      const thump = ctx.createOscillator();
      thump.type = 'sine';
      thump.frequency.value = 120;
      const thumpEnv = ctx.createGain();
      thumpEnv.gain.setValueAtTime(0.9, 0);
      thumpEnv.gain.setTargetAtTime(0.0001, 0.005, 0.02);
      thump.connect(thumpEnv).connect(out);
      thump.start(0);
      thump.stop(0.09);
    }
  });

  define({
    id: 'ping', name: 'Ping', color: '#4dd2ff', kind: 'render', duration: 0.45,
    render: function (ctx, out, prng) {
      const total = 0.45;
      const base = 500 + prng.float(-40, 40);
      const ratios = [1.0, 1.9, 3.3, 4.7, 6.1, 7.4];
      const nPartials = 4 + Math.floor(prng.next() * 3); // 4..6
      for (let i = 0; i < nPartials; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = base * ratios[i];
        const decay = total * (0.9 - i * 0.12);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.5 / (i + 1), 0);
        env.gain.exponentialRampToValueAtTime(0.0005, Math.max(0.05, decay));
        osc.connect(env).connect(out);
        osc.start(0);
        osc.stop(total);
      }
    }
  });

  define({
    id: 'thump', name: 'Thump', color: '#ff8c42', kind: 'render', duration: 0.1,
    render: function (ctx, out, prng) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, 0);
      osc.frequency.linearRampToValueAtTime(50, 0.09);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.95, 0);
      env.gain.setTargetAtTime(0.0001, 0.01, 0.025);
      osc.connect(env).connect(out);
      osc.start(0);
      osc.stop(0.1);
    }
  });


  // hum — a low sustained voice whose movement comes from beating rather
  // than from filtering: two triangles a little over a hertz apart drift in
  // and out of phase across the whole two seconds, and a fifth above gives
  // the pair a body. The lowpass is deliberately unresonant — resonance in
  // this register reads as nasal, and this voice is meant to sit under the
  // others rather than in front of them.
  define({
    id: 'hum', name: 'Hum', color: '#9bf25d', kind: 'render', duration: 2.0, sustained: true,
    render: function (ctx, out, prng) {
      const total = 2.0;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, 0);
      env.gain.linearRampToValueAtTime(0.5, total * 0.35);
      env.gain.setValueAtTime(0.5, total * 0.6);
      env.gain.linearRampToValueAtTime(0.0001, total);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      lp.Q.value = 0.7;
      lp.connect(env).connect(out);
      // the two near-unison partials carry most of the level; the jitter is
      // kept under a quarter of a hertz so the beat stays around 1 Hz, slow
      // enough to hear as movement instead of as a tremolo
      [[110, 0.38], [111.4, 0.38], [164.8, 0.24]].forEach(function (p) {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = p[0] + prng.float(-0.25, 0.25);
        const g = ctx.createGain();
        g.gain.value = p[1];
        osc.connect(g).connect(lp);
        osc.start(0);
        osc.stop(total);
      });
    }
  });



  return {
    define: define,
    play: play,
    setSample: setSample,
    subscribe: subscribe,
    ensureRendered: ensureRendered,
    renderToBuffer: renderToBuffer,
    setStrip: setStrip,
    getStrip: getStrip,
    stripState: stripState,
    bus: bus,
    get: get,
    all: all
  };
})();
