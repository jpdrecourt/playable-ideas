"use strict";
/* ============================================================
   Lab.midi — Web MIDI as a progressive enhancement.

   Forty lines of status-byte parsing instead of a dependency, and
   the whole surface is optional by construction: no WebKit browser
   ships Web MIDI and none is expected to, so every page here has to
   be complete without it. `available` is false on an iPhone and
   nothing else changes.

   Control Change and Note On/Off are interpreted, and the second is
   there for the buttons a controller hides inside its knobs: a
   push-encoder sends a note on press about as often as it sends a
   switch CC, and which one it is belongs to the device rather than
   to the page. `learnMsg` therefore takes whichever arrives —
   `learn` stays CC-only, for a control that is a value.

   CC values are 7-bit absolute
   (0..127): a hardware knob's position is taken at face value, which
   means a pot whose physical position disagrees with the parameter
   will jump it on the first move. That is deliberate and it is the
   same problem the on-screen knobs have when a strip is re-pointed —
   pickup is not solved here, it is shown. What the page CAN do is
   speak: sendCC pushes the new value out on every rebind, so a
   controller with motorised faders or LED rings follows along and a
   plain pot doesn't.

   Chrome 124+ prompts for permission on requestMIDIAccess even
   without sysex, so enable() must be called from a user gesture.
   ============================================================ */
window.Lab = window.Lab || {};

Lab.midi = (function () {
  let access = null, state = 'idle';
  let learnCb = null, learnAny = false;
  const ccSubs = [], msgSubs = [], deviceSubs = [];

  const available = typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess;
  if (!available) state = 'unavailable';

  function inputCount() {
    if (!access) return 0;
    let n = 0;
    access.inputs.forEach(() => n++);
    return n;
  }
  function outputCount() {
    if (!access) return 0;
    let n = 0;
    access.outputs.forEach(() => n++);
    return n;
  }

  function announce() {
    const n = inputCount();
    deviceSubs.forEach(fn => fn(n, outputCount()));
  }

  function onMessage(e) {
    const d = e.data;
    if (!d || d.length < 3) return;
    const status = d[0] & 0xf0, ch = (d[0] & 0x0f) + 1;
    let msg = null;
    if (status === 0xb0) msg = { type: 'cc', ch: ch, cc: d[1], value: d[2] };
    // a note-on at velocity 0 is a note-off, and every controller means it
    else if (status === 0x90) msg = { type: 'note', ch: ch, note: d[1], value: d[2], on: d[2] > 0 };
    else if (status === 0x80) msg = { type: 'note', ch: ch, note: d[1], value: 0, on: false };
    else return;
    // A release is not a binding: learning on note-off would bind the moment
    // the finger came up and never see the press it was aimed at.
    if (learnCb && (learnAny || msg.type === 'cc') && msg.on !== false) {
      const cb = learnCb;
      learnCb = null;
      cb(msg);
      return;                                       // the learning move is not a value
    }
    msgSubs.forEach(fn => fn(msg));
    if (msg.type === 'cc') ccSubs.forEach(fn => fn(msg));
  }

  function wire() {
    access.inputs.forEach(inp => { inp.onmidimessage = onMessage; });
  }

  function enable() {
    if (!available) return Promise.resolve({ ok: false, reason: 'unavailable' });
    if (access) return Promise.resolve({ ok: true, inputs: inputCount() });
    return navigator.requestMIDIAccess({ sysex: false }).then(a => {
      access = a;
      state = 'on';
      wire();
      access.onstatechange = () => { wire(); announce(); };
      announce();
      return { ok: true, inputs: inputCount() };
    }).catch(err => {
      state = 'denied';
      return { ok: false, reason: (err && err.name) || 'denied' };
    });
  }

  // Arms the next incoming CC as a binding. Returns a cancel function —
  // an armed learn with no way out is a trap on a page with no keyboard.
  function learn(cb) {
    learnCb = cb;
    learnAny = false;
    return function cancel() { if (learnCb === cb) learnCb = null; };
  }

  // the same arming, open to a note as well as a CC: for a control whose
  // gesture is a press, the device decides which of the two it sends
  function learnMsg(cb) {
    learnCb = cb;
    learnAny = true;
    return function cancel() { if (learnCb === cb) learnCb = null; };
  }

  function sendCC(ch, cc, value) {
    if (!access) return false;
    const v = Math.max(0, Math.min(127, Math.round(value)));
    const bytes = [0xb0 | ((Math.max(1, Math.min(16, ch)) - 1) & 0x0f), cc & 0x7f, v];
    let sent = false;
    access.outputs.forEach(out => { try { out.send(bytes); sent = true; } catch (_) {} });
    return sent;
  }

  return {
    get available() { return available; },
    get state() { return state; },
    get inputs() { return inputCount(); },
    get outputs() { return outputCount(); },
    enable: enable,
    learn: learn,
    learnMsg: learnMsg,
    sendCC: sendCC,
    onCC: fn => { ccSubs.push(fn); },
    onMsg: fn => { msgSubs.push(fn); },
    onDevices: fn => { deviceSubs.push(fn); if (access) fn(inputCount(), outputCount()); }
  };
})();
