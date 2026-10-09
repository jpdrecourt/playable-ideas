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

  // The context may still be suspended (no gesture yet) — decoding does not
  // need it running, so a page can restore its samples before the first Play.
  async function decodeArrayBuffer(ab) {
    Lab.audio.init();
    return normalize(await Lab.audio.ctx.decodeAudioData(ab));
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

  /* ---- what is stored, without waking the audio ----
     `restore` decodes, and decoding calls `Lab.audio.init` — so a page that
     restored a persisted sample at load built its AudioContext there, which
     GROUNDING forbids: the context is constructed inside a user gesture and
     never at load. A page can now ask what is stored WITHOUT decoding it, put
     the name on the lane, and decode at the first press.

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

  return { decode: decode, decodeBase64: decodeBase64, load: load,
           store: store, restore: restore, peek: peek, take: take, clear: clear };
})();
