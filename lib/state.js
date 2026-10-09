"use strict";
/* ============================================================
   Lab.state — toy state save/restore (pairs with the bench).

   The restore path is RESTORE-BEFORE-BUILD: the toy calls
   restore(key) first, merges the result into its params object,
   and only then builds its controls — bench factories take their
   initial value from params, so no UI syncing is ever needed.
   File-load follows the same path by writing localStorage and
   reloading the page. `open(key)` is the same restore with the
   toy's shipped `default.json` behind it, for a page that opens on
   an example rather than on its bare factory parameters.

   Autosave is a 1 s poll of collect(): a JSON snapshot is written
   to localStorage only when it changed. Cheap, and catches every
   control move without any wiring in the toy.
   ============================================================ */
window.Lab = window.Lab || {};

Lab.state = (function () {
  let cfg = null, lastJson = '', timer = null;
  const lskey = k => 'lab:' + k;

  // Why a parsed file may not be loaded into the toy named `key`, as a
  // sentence for the status line, or null when it may. A saved file names its
  // toy because every toy's file is the same shape from outside, and merge
  // drops the keys a page does not hold: another toy's file would otherwise
  // load without complaint and restore a tempo over an empty instrument. A
  // file with no name predates the tag and is taken on trust.
  function whyNot(o, key) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return 'not a state file';
    if (typeof o.toy === 'string' && o.toy !== key)
      return 'that file is a ' + o.toy + ' state, and this page is ' + key + ' — nothing was loaded';
    return null;
  }

  // { key, collect() -> plain object, everyMs? }
  // Returns a handle with .stop() / .save(): the poll is a permanent
  // background write loop otherwise, and a page that outlives its toy (or a
  // toy that only wants to save on demand) needs a way to end it.
  function attach(options) {
    cfg = options;
    function save() {
      try {
        const j = JSON.stringify(cfg.collect());
        if (j !== lastJson) { lastJson = j; localStorage.setItem(lskey(cfg.key), j); }
      } catch (e) { /* storage unavailable: autosave silently off */ }
    }
    timer = setInterval(save, options.everyMs || 1000);
    return {
      save: save,
      stop: function () { clearInterval(timer); timer = null; }
    };
  }

  function restore(key) {
    try {
      const j = localStorage.getItem(lskey(key));
      return j ? JSON.parse(j) : null;
    } catch (e) { return null; }
  }

  /* What a page opens on, as a Promise that never rejects: the visitor's own
     session if there is one, else the toy's shipped default (a saved file
     beside the page, `default.json` unless told otherwise), else null — and
     null means the page's factory parameters, which is the bare instrument.

     The session wins because a returning visitor keeps what they did; the
     default wins over the factory because a stranger meets the example.

     A default is checked exactly like a loaded file (`whyNot`): one naming
     another toy is refused and the refusal is said. A default that cannot be
     read at all is SAID too, once, on the status line. The commonest reason is
     the page opened off a disk, where the browser refuses `fetch` at a
     `file://` origin, and a fallback that says nothing is how GROUNDING.md's
     `file://` defect survived ("Shipped material must survive clone-and-
     double-click"). `cache: 'no-cache'` revalidates every time, because a
     default that changes on deploy is exactly the file a warm cache holds. */
  function say(text) {
    if (window.Lab && Lab.ui && Lab.ui.status) Lab.ui.status(text, true);
    else if (typeof console !== 'undefined') console.warn('Lab.state: ' + text);
  }

  function open(key, url) {
    url = url || 'default.json';
    const session = restore(key);
    if (session) return Promise.resolve(session);
    const name = String(url).split(/[\\/]/).pop() || String(url);
    const bare = name + ' could not be read — opening on the bare page';
    let p;
    try {
      p = fetch(url, { cache: 'no-cache' });
    } catch (e) {
      p = Promise.reject(e);
    }
    return Promise.resolve(p)
      .then(function (r) {
        if (!r || !r.ok) throw new Error('status ' + (r && r.status));
        return r.text();
      })
      .then(function (text) { return JSON.parse(text); })
      .then(function (o) {
        const no = whyNot(o, key);
        if (no) { say(no); return null; }
        return o;
      }, function () { say(bare); return null; })
      .catch(function () { return null; });
  }

  // Recursive merge of a saved snapshot into a live params object: objects
  // merge, scalars/arrays replace. THE TARGET IS THE SCHEMA, at every depth:
  // a key the target does not hold is dropped, and a key the save predates
  // keeps its default. collect() serialises params whole, so a key let in
  // here from an earlier shape of the page would be written back by the
  // autosave and ride every save and every saved file from then on. It
  // follows that a dictionary declared empty restores nothing: a page fills
  // `strips` with its rack's row keys before it merges.
  function merge(target, src) {
    if (!src || typeof src !== 'object') return target;
    for (const k in src) {
      if (!Object.prototype.hasOwnProperty.call(target, k)) continue;
      const s = src[k], t = target[k];
      if (s && typeof s === 'object' && !Array.isArray(s) &&
          t && typeof t === 'object' && !Array.isArray(t)) merge(t, s);
      else target[k] = s;
    }
    return target;
  }

  async function saveFile() {
    const text = JSON.stringify(Object.assign({ toy: cfg.key }, cfg.collect()), null, 2);
    const name = cfg.key + '-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
    if ('showSaveFilePicker' in window) {
      try {
        const h = await window.showSaveFilePicker({
          suggestedName: name,
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        const w = await h.createWritable(); await w.write(text); await w.close();
        Lab.ui.status('state saved');
        return;
      } catch (e) { if (e.name === 'AbortError') return; /* else fall through */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name; a.click(); URL.revokeObjectURL(a.href);
    Lab.ui.status('state saved → Downloads');
  }

  function loadFile() {
    const f = document.createElement('input');
    f.type = 'file'; f.accept = 'application/json';
    f.onchange = async () => {
      try {
        const o = JSON.parse(await f.files[0].text());
        const no = whyNot(o, cfg.key);
        if (no) { Lab.ui.status(no, true); return; }
        // The poll ends first: the page lives on until the reload lands, and
        // a save in that gap would put the old session back over the file.
        clearInterval(timer); timer = null;
        localStorage.setItem(lskey(cfg.key), JSON.stringify(o));
        location.reload();               // restore-before-build does the rest
      } catch (e) { Lab.ui.status('not a state file', true); }
    };
    f.click();
  }

  // Save ⤓ / Load ⤒ pair for the transport bar.
  function buttons() {
    const w = document.createElement('span');
    w.style.display = 'inline-flex'; w.style.gap = '7px';
    /* `data-hint` and not `title` alone: a native tooltip renders on no touch
       screen at all, so a hint carried only there is a hint half the visitors
       cannot reach — and these two are the pair a toy cannot patch, since it
       never builds them. Load says what it costs, because it does not merge:
       it replaces the session and reloads the page. */
    const hint = (b, text) => { b.dataset.hint = text; b.title = text; };
    const s = document.createElement('button');
    s.textContent = 'Save ⤓';
    hint(s, 'write everything this page is holding to a file you keep');
    s.onclick = saveFile;
    const l = document.createElement('button');
    l.textContent = 'Load ⤒';
    hint(l, 'read a saved file back. It replaces what is on the page now and reloads it, so save first if this session is worth keeping.');
    l.onclick = loadFile;
    w.append(s, l);
    return w;
  }

  return { attach: attach, restore: restore, open: open, merge: merge, whyNot: whyNot,
           buttons: buttons };
})();
