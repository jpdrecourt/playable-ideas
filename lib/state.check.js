"use strict";
/* The check for Lab.state.merge's rule — the target is the schema.
   Run: node lib/state.check.js   (exits non-zero on a failure) */
const assert = require('assert');
global.window = global;
require('./state.js');
const merge = window.Lab.state.merge;

const strip = () => ({ gain: 1, mute: false, pan: 0 });
const params = () => ({
  bpm: 100, name: null, mx: [[0, 0], [0, 0]],
  strips: { a: strip(), b: strip() },
  open: {}
});

const saved = {
  bpm: 86, name: 'x', mx: [[1, 2], [3, 4]],
  density: 1, w: [1, 2, 3],                          // keys the page retired
  strips: { a: { gain: 0.5, mute: true, pan: 0, solo: true }, kick: strip() },
  open: { anything: 1 }
};

const p = merge(params(), saved);
assert.deepStrictEqual(p, {
  bpm: 86, name: 'x', mx: [[1, 2], [3, 4]],
  strips: { a: { gain: 0.5, mute: true, pan: 0 }, b: strip() },
  open: {}
}, 'unknown keys are dropped at every depth; known ones land');

// what a page writes after restoring holds no key the page does not declare
assert.deepStrictEqual(Object.keys(JSON.parse(JSON.stringify(p))), Object.keys(params()));

// a save that predates a key leaves its default
assert.strictEqual(merge(params(), { mx: [] }).bpm, 100);

// not a snapshot: nothing happens, nothing throws
[null, undefined, 3, 'x'].forEach(v => assert.deepStrictEqual(merge(params(), v), params()));

console.log('Lab.state.merge: ok');

/* A saved file names its toy, and Load refuses another toy's file. */
const whyNot = window.Lab.state.whyNot;
assert.strictEqual(whyNot({ toy: 'markov', params: {} }, 'markov'), null);
assert.strictEqual(whyNot({ params: {} }, 'markov'), null, 'a file with no name is taken on trust');
assert.ok(/possibles.*markov/.test(whyNot({ toy: 'possibles', params: {} }, 'markov')));
[null, 3, 'x', []].forEach(v => assert.strictEqual(whyNot(v, 'markov'), 'not a state file'));

console.log('Lab.state.whyNot: ok');

/* Lab.state.open: session before default, default before null, and every
   failure resolved — never rejected — and said once on the status line.
   Storage, fetch and the status toast are stubbed; nothing here needs a
   browser. */
const open = window.Lab.state.open;
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
let said = [];
window.Lab.ui = { status: (text, warn) => said.push([text, !!warn]) };
let fetched = [];
const respond = (body, status) => () => Promise.resolve({
  ok: (status || 200) < 400, status: status || 200,
  text: () => Promise.resolve(body)
});
const serve = fn => { global.fetch = (url, opts) => { fetched.push(url); return fn(url, opts); }; };
const reset = () => { said = []; fetched = []; Object.keys(store).forEach(k => delete store[k]); };

(async function () {
  const dflt = { toy: 'markov', params: { bpm: 86 } };

  // no session: the default, fetched from beside the page
  reset(); serve(respond(JSON.stringify(dflt)));
  assert.deepStrictEqual(await open('markov'), dflt);
  assert.deepStrictEqual(fetched, ['default.json']);
  assert.deepStrictEqual(said, [], 'a default that loads says nothing');

  // a session wins, and the default is never asked for
  reset(); serve(respond(JSON.stringify(dflt)));
  store['lab:markov'] = JSON.stringify({ params: { bpm: 120 } });
  assert.deepStrictEqual(await open('markov'), { params: { bpm: 120 } });
  assert.deepStrictEqual(fetched, [], 'a session is not shadowed by a fetch');

  // a url of the page's own choosing
  reset(); serve(respond(JSON.stringify(dflt)));
  await open('markov', 'examples/a.json');
  assert.deepStrictEqual(fetched, ['examples/a.json']);

  // a default naming another toy is refused, and the refusal is said
  reset(); serve(respond(JSON.stringify({ toy: 'possibles', params: {} })));
  assert.strictEqual(await open('markov'), null);
  assert.strictEqual(said.length, 1);
  assert.ok(/possibles.*markov/.test(said[0][0]) && said[0][1], 'refused like a loaded file, as a warning');

  // every failure resolves null and says so ONCE: a refused fetch (file://),
  // a 404, a body that is not JSON, a fetch that throws synchronously, no fetch
  const failures = [
    ['refused', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['404', respond('not found', 404)],
    ['bad json', respond('{ nope')],
    ['throws', () => { throw new Error('sync'); }]
  ];
  for (const [what, fn] of failures) {
    reset(); serve(fn);
    assert.strictEqual(await open('markov'), null, what + ' resolves null');
    assert.deepStrictEqual(said, [['default.json could not be read — opening on the bare page', true]],
      what + ' is said once, as a warning');
  }
  reset(); delete global.fetch;
  assert.strictEqual(await open('markov', 'x/y/other.json'), null, 'no fetch at all resolves null');
  assert.deepStrictEqual(said, [['other.json could not be read — opening on the bare page', true]]);

  // a session that is not JSON is no session: the default stands in
  reset(); serve(respond(JSON.stringify(dflt)));
  store['lab:markov'] = '{ broken';
  assert.deepStrictEqual(await open('markov'), dflt);

  console.log('Lab.state.open: ok');
})().catch(e => { console.error(e); process.exit(1); });
