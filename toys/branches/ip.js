"use strict";
/* ============================================================
   ip.js — Incremental Parsing (LZ78) over an integer-symbol
   alphabet, after Assayag & Dubnov 2004
   (DOI 10.1007/s00500-004-0385-4).

   Pure: no Lab, no DOM, no timers. The page grows a tree and asks
   it what could come next; everything about sound lives on the
   other side of that line, which is also what makes this file
   testable under node.

   The tree IS the dictionary: every node is a motif, and the path
   from the root spells it. A symbol is the whole event — nothing
   rides along, so what the tree knows about an event is which drum
   it was and what came before it.

   STRUCTURE AND WEIGHT ARE SEPARATE VERBS. `plant` makes a branch
   exist and otherwise just walks it; `bump` and `drop` are the only
   things that move a weight, and a branch dropped to zero is cut
   away with everything under it. `add` is the odd one out and the
   original: the learning half of the model, where a finger walks
   down while it recognises and plants a leaf the moment it doesn't,
   so that structure and weight both fall out of a performance
   repeating itself. Nothing listens at the moment, so `add` is
   unused by the page; it stays because it is half the model, and it
   is exactly what a listening mode will need when one returns.

   READING IS A WALK, NOT A SEARCH. The reader is a second finger
   that stands on a node and descends into one of its children,
   weighted by their counts. `descend` returns null on a leaf: the
   branch simply ends, which is a fact about the structure rather
   than a failed match. The caller decides what that means.

   A HAND-BUILT TREE IS A SCORE, so it outlives the page:
   toJSON/fromJSON carry the whole structure and its weights.
   ============================================================ */

const IP = (function () {

  function create() {

    let root, finger, n;

    function makeNode(symbol, parent) {
      return {
        symbol: symbol,
        parent: parent,
        depth: parent ? parent.depth + 1 : 0,
        children: new Map(),
        count: 0
      };
    }

    function reset() {
      root = makeNode(null, null);
      finger = root;
      n = 0;
    }
    reset();

    /* ---------- growing ---------- */

    // Descend on a symbol the current motif already knows and stay
    // there; on one it doesn't, plant the leaf and go home. The
    // creation IS that motif's first pass, which is why a new node
    // starts at count 1.
    function add(symbol) {
      n++;
      const known = finger.children.get(symbol);
      if (known) {
        known.count++;
        finger = known;
      } else {
        const node = makeNode(symbol, finger);
        node.count = 1;
        finger.children.set(symbol, node);
        finger = root;
      }
      return n;
    }

    // Extend `node` by one symbol and hand back where that lands. On a
    // branch that already exists this is pure navigation — the weight
    // does not move, because structure and weight are separate verbs
    // here: walking a path you already wrote should let you get to the
    // end of it without saying anything about how likely it is. A fresh
    // branch still starts at count 1: it exists, once. The parse finger
    // is untouched.
    function plant(node, symbol) {
      const known = node.children.get(symbol);
      if (known) return known;
      const child = makeNode(symbol, node);
      child.count = 1;
      node.children.set(symbol, child);
      return child;
    }

    /* ---------- weight ----------
       The other verb. Weight lives on the branch, so it is edited on the
       branch — the root has none to edit, being nobody's continuation. */

    function bump(node) {
      if (node && node.parent) node.count++;
      return node;
    }

    // Down one, and at zero the branch is gone: a continuation nothing
    // can choose is not a continuation. Everything under it goes with it,
    // by simply cutting the one link — the subtree is left intact and
    // still pointing up at where it hung, which is what lets a caller ask
    // whether some node it was holding is inside what just fell off.
    function drop(node) {
      if (!node || !node.parent) return { node: node || root, pruned: null };
      node.count--;
      if (node.count > 0) return { node: node, pruned: null };
      const parent = node.parent;
      parent.children.delete(node.symbol);
      return { node: parent, pruned: node };
    }

    /* ---------- generation ---------- */

    // The menu is what the tree says could follow: the children of
    // the node the reader is standing on. `bias` runs −1..+1 and tilts
    // the draw through an exponent on the weights. At 0 the draw is
    // faithful, the weights taken as written; leftward it sharpens them
    // (γ = 3 at −1), exaggerating the heavy branch until the walk is all
    // but decided; rightward it flattens them even at +½ and then turns
    // them over at +1, where what carries least is preferred.

    function gamma(bias) {
      const b = (typeof bias === 'number') ? Math.max(-1, Math.min(1, bias)) : 0;
      return 1 - 2 * b;
    }

    function menu(node, bias) {
      const g = gamma(bias);
      const out = [];
      node.children.forEach(function (c) {
        out.push({ symbol: c.symbol, count: c.count, weight: Math.pow(c.count, g), node: c });
      });
      return out;
    }

    function pickWeighted(items, rng) {
      let total = 0;
      for (let i = 0; i < items.length; i++) total += items[i].weight;
      if (!(total > 0)) return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
      let r = rng() * total;
      for (let i = 0; i < items.length; i++) {
        r -= items[i].weight;
        if (r <= 0) return items[i];
      }
      return items[items.length - 1];
    }

    // One step of the walk. null means the node is a leaf: the motif
    // is over by construction, and the caller is standing on a seam.
    function descend(node, opts) {
      opts = opts || {};
      const rng = (typeof opts.rng === 'function') ? opts.rng : Math.random;
      const items = menu(node, opts.bias);
      if (!items.length) return null;
      const chosen = pickWeighted(items, rng);
      return { symbol: chosen.symbol, child: chosen.node };
    }

    /* ---------- persistence ----------
       Plain nested objects — { s: symbol, k: count, c: [children] },
       the root carrying symbol null — plus the event count, which is
       the one number the shape does not imply. Parent and depth are
       not stored because where a node sits already says them;
       fromJSON relinks them on the way down. */

    function toJSON() {
      function enc(node) {
        const o = { s: node.symbol, k: node.count };
        if (node.children.size) {
          o.c = [];
          node.children.forEach(function (c) { o.c.push(enc(c)); });
        }
        return o;
      }
      return { n: n, root: enc(root) };
    }

    function fromJSON(obj) {
      if (!obj || typeof obj !== 'object') return false;
      const src = obj.root || obj;               // a bare root node is accepted too
      if (!src || typeof src !== 'object') return false;
      reset();
      n = (typeof obj.n === 'number' && obj.n >= 0) ? obj.n : 0;
      root.count = (typeof src.k === 'number') ? src.k : 0;
      (function dec(node, o) {
        const kids = o.c || [];
        for (let i = 0; i < kids.length; i++) {
          const k = kids[i];
          if (!k || typeof k.s !== 'number') continue;
          const child = makeNode(k.s, node);
          // a count below 1 (a hand-written file) would put 0^gamma in the bias law
          child.count = (typeof k.k === 'number' && isFinite(k.k) && k.k >= 1) ? k.k : 1;
          node.children.set(k.s, child);
          dec(child, k);
        }
      })(root, src);
      finger = root;
      return true;
    }

    return {
      add: add,
      plant: plant,
      bump: bump,
      drop: drop,
      descend: descend,
      clear: reset,
      toJSON: toJSON,
      fromJSON: fromJSON,
      size: function () { return n; },
      root: function () { return root; },
      fingerNode: function () { return finger; },
      menu: function (node, bias) { return menu(node || root, bias); }
    };
  }

  return { create: create };
})();

if (typeof window !== 'undefined') window.IP = IP;
if (typeof module !== 'undefined' && module.exports) module.exports = IP;
