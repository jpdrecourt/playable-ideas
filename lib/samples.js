"use strict";
/* ============================================================
   Lab.samples — audio files as playable buffers.

   Audio arrives three ways — a dropped file, a URL beside the
   page, or base64 embedded in a script the page already loaded —
   and all three go through one decode, so all three are
   peak-normalized alike: material arrives at whatever level it
   was mastered at, and a toy's gain knobs only mean something if
   every sample starts at the same ceiling.

   Persistence is IndexedDB, not localStorage: the raw file is an
   ArrayBuffer, well past a string quota. What is stored is the
   FILE, not the decoded buffer — decoding is cheap and the
   context's sample rate can differ between sessions. Every
   failure path is silent (no store, null restore, no throw),
   the same spirit as the state.js autosave: a toy that cannot
   persist still plays.
   ============================================================ */
window.Lab = window.Lab || {};

Lab.samples = (function () {
  const DB_NAME = 'lab-samples', STORE = 'samples', PEAK = 0.9;

  function normalize(buf) {
    let peak = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        const a = Math.abs(d[i]);
        if (a > peak) peak = a;
      }
    }
    if (!(peak > 0)) return buf;            // digital silence: nothing to scale
    const g = PEAK / peak;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] *= g;
    }
    return buf;
  }

  /* Decoding never builds the live AudioContext. GROUNDING has the context
     constructed inside a user gesture and never at load, and a page decodes at
     load: shipped material, a restored lane. So a decode uses the live context
     when one already exists and otherwise a one-frame OfflineAudioContext kept
     for nothing but decoding. Its 44.1 kHz rate is the rate the buffer comes
     back at; a buffer source on a 48 kHz context resamples it on playback. */
  let decoder = null;
  function decoderCtx() {
    if (Lab.audio && Lab.audio.ctx) return Lab.audio.ctx;
    if (!decoder) {
      const O = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      decoder = new O(1, 1, 44100);
    }
    return decoder;
  }

  async function decodeArrayBuffer(ab) {
    return normalize(await decoderCtx().decodeAudioData(ab));
  }

  /* ---- trimLead: the sound starts where its onset is ----
     An MP3 carries encoder and decoder padding, about 25 ms of near-silence
     ahead of the first sample, and browsers differ on whether they strip it.
     A buffer whose onset sits 25 ms in plays 25 ms late against the schedule.
     Trimming on the onset itself — the first sample above the peak scaled by
     `thresholdDb` — makes "the sound starts when the schedule says" true
     whatever the decoder did. `preMs` keeps a breath of what came before, so
     the attack is not cut into. Same channels, same rate; the input is
     returned untouched when nothing exceeds the threshold. */
  function trimLead(buf, thresholdDb, preMs) {
    if (thresholdDb == null) thresholdDb = -40;
    if (preMs == null) preMs = 2;
    const nch = buf.numberOfChannels, n = buf.length;
    let peak = 0;
    for (let ch = 0; ch < nch; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
    }
    if (!(peak > 0)) return buf;
    const thr = peak * Math.pow(10, thresholdDb / 20);
    let first = n;
    for (let ch = 0; ch < nch; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < first; i++) if (Math.abs(d[i]) > thr) { first = i; break; }
    }
    if (first >= n) return buf;
    const start = Math.max(0, first - Math.round(preMs / 1000 * buf.sampleRate));
    if (start === 0) return buf;
    const out = new AudioBuffer({ numberOfChannels: nch, length: n - start,
                                  sampleRate: buf.sampleRate });
    for (let ch = 0; ch < nch; ch++)
      out.getChannelData(ch).set(buf.getChannelData(ch).subarray(start));
    return out;
  }

  /* ---- trimTail: the sound ends where it ends ----
     The same padding sits after the sound too, so a buffer's duration (what a
     hit reports as its `dur`, what holdFrac is a fraction of) runs about 25 ms
     past the last thing audible. The buffer is cut `postMs` after the last
     sample above the peak scaled by `thresholdDb`; lower than trimLead's
     threshold, because a tail is a fade and its last audible part is quiet. */
  function trimTail(buf, thresholdDb, postMs) {
    if (thresholdDb == null) thresholdDb = -60;
    if (postMs == null) postMs = 5;
    const nch = buf.numberOfChannels, n = buf.length;
    let peak = 0;
    for (let ch = 0; ch < nch; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
    }
    if (!(peak > 0)) return buf;
    const thr = peak * Math.pow(10, thresholdDb / 20);
    let last = -1;
    for (let ch = 0; ch < nch; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = n - 1; i > last; i--) if (Math.abs(d[i]) > thr) { last = i; break; }
    }
    if (last < 0) return buf;
    const end = Math.min(n, last + 1 + Math.round(postMs / 1000 * buf.sampleRate));
    if (end >= n) return buf;
    const out = new AudioBuffer({ numberOfChannels: nch, length: end, sampleRate: buf.sampleRate });
    for (let ch = 0; ch < nch; ch++)
      out.getChannelData(ch).set(buf.getChannelData(ch).subarray(0, end));
    return out;
  }

  async function decode(file) {
    return decodeArrayBuffer(await file.arrayBuffer());
  }

  // EMBEDDED material: the audio arrives as base64 inside a classic <script>
  // the page already loaded, and no request is made at all. This is the only
  // way shipped material survives clone-and-double-click — `fetch` is refused
  // at a file:// origin, a classic script tag is not — and it is one path on
  // every protocol rather than a tested one and an untested one.
  // Resolves NULL on a string the browser cannot decode, exactly as load()
  // does, so a toy with synthesized fallbacks keeps playing.
  async function decodeBase64(b64) {
    try {
      const bin = atob(b64);
      const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return await decodeArrayBuffer(u.buffer);
    } catch (e) { return null; }
  }

  // Shipped material: a URL beside the page rather than a dropped file.
  // Resolves NULL on every failure — a missing file, a 404, an undecodable
  // format, or the fetch a file:// origin refuses outright. A toy that ships
  // synthesized fallbacks is then playable in every one of those cases, and
  // "no samples yet" needs no separate code path from "opened from disk".
  async function load(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      return await decodeArrayBuffer(await r.arrayBuffer());
    } catch (e) { return null; }
  }

  // Resolves null rather than rejecting: file:// origins refuse IndexedDB in
  // some browsers, and that is a toy without persistence, not a broken toy.
  function openDb() {
    return new Promise(resolve => {
      try {
        const rq = indexedDB.open(DB_NAME, 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore(STORE);
        rq.onsuccess = () => resolve(rq.result);
        rq.onerror = () => resolve(null);
        rq.onblocked = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }

  async function store(key, file) {
    const db = await openDb();
    if (!db) return;
    try {
      const data = await file.arrayBuffer();   // a fresh read: decode() detaches its own
      await new Promise(res => {
        const t = db.transaction(STORE, 'readwrite');
        t.objectStore(STORE).put({ name: file.name, data: data }, key);
        t.oncomplete = res; t.onerror = res; t.onabort = res;
      });
    } catch (e) { /* quota or a dead store: the lane just won't survive a reload */ }
    db.close();
  }

  async function restore(key) {
    const db = await openDb();
    if (!db) return null;
    const rec = await new Promise(res => {
      try {
        const rq = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        rq.onsuccess = () => res(rq.result || null);
        rq.onerror = () => res(null);
      } catch (e) { res(null); }
    });
    db.close();
    if (!rec || !rec.data) return null;
    try { return { name: rec.name, buffer: await decodeArrayBuffer(rec.data) }; }
    catch (e) { return null; }               // a file the browser can no longer decode
  }

  /* ---- what is stored, without decoding it ----
     `restore` decodes the whole file to hand back a buffer. A page that only
     needs to say what a lane holds — its name on the lane at load — has no use
     for the audio yet, and a page that decodes at the first press decodes
     into the context that press built, at its rate, rather than at the
     decoder's 44.1 kHz.

     `peek(key)` → `{name}` or null: the name alone, no context, no decode.
     `take(key)` → `{name, decode()}` or null: the record, with the decode kept
     behind a call the page makes when a gesture has happened. */
  async function record(key) {
    const db = await openDb();
    if (!db) return null;
    const rec = await new Promise(res => {
      try {
        const rq = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        rq.onsuccess = () => res(rq.result || null);
        rq.onerror = () => res(null);
      } catch (e) { res(null); }
    });
    db.close();
    return (rec && rec.data) ? rec : null;
  }

  async function peek(key) {
    const rec = await record(key);
    return rec ? { name: rec.name } : null;
  }

  async function take(key) {
    const rec = await record(key);
    if (!rec) return null;
    return {
      name: rec.name,
      decode: async function () {
        try { return await decodeArrayBuffer(rec.data); }
        catch (e) { return null; }           // a file the browser can no longer decode
      }
    };
  }

  async function clear(key) {
    const db = await openDb();
    if (!db) return;
    try { db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key); }
    catch (e) { /* nothing to delete */ }
    db.close();                              // deferred until the delete completes
  }

  return { decode: decode, decodeBase64: decodeBase64, load: load, trimLead: trimLead, trimTail: trimTail,
           store: store, restore: restore, peek: peek, take: take, clear: clear };
})();
