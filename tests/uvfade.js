#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// UV / blacklight on↔off cross-fade unit test — a pure Node DOM-shim harness.
//
// Headless Chrome is wedged on this box (state/play/enter/menu all SIGTERM), so
// this proves the UV-linger IIFE's on↔off fade LOGIC without a browser: it slices
// the IIFE source straight out of rsvp.html and runs it against a tiny hand-rolled
// DOM/window that models exactly what the fade touches — #loft-game-strip, the
// .hunt-viewport, #stage-office (arcade), #kitchen-bar-make, the hearth fire
// nodes, plus a virtual clock so rAF advances deterministically.
//
// It asserts:
//   1. FADE IN  — adding .uv-mode ramps strip.style.filter from ~identity up to
//      the full-UV endpoint (brightness .5 / saturate 2.6 / hue 220 / contrast 1.3)
//      over ~FADE_MS, NOT an instant snap (an intermediate frame is between the two).
//   2. FADE OUT — removing .uv-mode ramps back DOWN and lands on "" (handed to CSS),
//      again over time, with an intermediate frame between full-UV and cleared.
//   3. QUICK OFF→ON — toggling off then straight back on leaves no stuck inline
//      filter (it settles at the UV endpoint, counter-filters consistent).
//   4. SNAP on a trip / device-zoom / balcony mid-fade — hands straight to
//      ""/none (no eased inline filter fighting the CSS filter:none override).
//
// Usage: node tests/uvfade.js
"use strict";

var fs = require("fs");
var path = require("path");
var assert = require("assert");

var ROOT = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(ROOT, "rsvp.html"), "utf8");

// ── slice the anonymous IIFE body out of the file ────────────────────────────
// anchor on the unique FADE_MS token, then walk back to the enclosing (function
var anchor = html.indexOf("var FADE_MS = 1200;");
assert(anchor !== -1, "could not find FADE_MS anchor — wrong region / renamed?");
var si = html.lastIndexOf("(function () {", anchor);
assert(si !== -1, "could not find enclosing IIFE open");
var open = html.indexOf("{", si);
var depth = 0, end = -1;
for (var i = open; i < html.length; i++) {
  var ch = html[i];
  if (ch === "{") depth++;
  else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
}
assert(end !== -1, "could not match IIFE braces");
var body = html.slice(open + 1, end);

// assertFresh: prove the slice really contains the fade under test
assert(/uvLevel/.test(body), "slice missing uvLevel — wrong region?");
assert(/fadeStep/.test(body), "slice missing fadeStep — wrong region?");
assert(/window\.__updateKitchenUvLinger = evaluate/.test(body), "slice missing the evaluate hook — wrong region?");

// ── a tiny DOM shim ──────────────────────────────────────────────────────────
function ClassList(el) { this._ = {}; this.el = el; }
ClassList.prototype.add = function () { for (var i = 0; i < arguments.length; i++) this._[arguments[i]] = true; };
ClassList.prototype.remove = function () { for (var i = 0; i < arguments.length; i++) delete this._[arguments[i]]; };
ClassList.prototype.contains = function (c) { return !!this._[c]; };
ClassList.prototype.toggle = function (c, on) { if (on === undefined) on = !this._[c]; if (on) this._[c] = true; else delete this._[c]; return on; };

function El(tag) {
  this.tagName = tag || "g";
  this.children = [];
  this.id = "";
  this.style = { filter: "" };
  this.classList = new ClassList(this);
}
El.prototype.querySelectorAll = function () { return []; };

var byId = {};
function mk(id, cls) {
  var e = new El("g");
  e.id = id;
  if (cls) cls.forEach(function (c) { e.classList.add(c); });
  if (id) byId[id] = e;
  return e;
}

var strip = mk("loft-game-strip");
var viewport = mk("hunt-viewport"); viewport.classList.add("hunt-viewport");
var office = mk("stage-office");
var make = mk("kitchen-bar-make");
var flame = mk("cuddly-flame-img");

var document = {
  hidden: false,
  getElementById: function (id) { return byId[id] || null; },
  querySelector: function (sel) {
    if (sel === ".hunt-viewport") return viewport;
    return null;
  },
  querySelectorAll: function () { return []; },
  addEventListener: function () {}
};

// ── a virtual clock + synchronous-ish rAF that the harness pumps ─────────────
var clock = 0;
var rafQueue = []; // {id, cb}
var rafSeq = 1;
var window = {
  matchMedia: function () { return { matches: false }; }, // NOT reduced-motion → fades run
  performance: { now: function () { return clock; } },
  requestAnimationFrame: function (cb) { var id = rafSeq++; rafQueue.push({ id: id, cb: cb }); return id; },
  cancelAnimationFrame: function (id) { rafQueue = rafQueue.filter(function (r) { return r.id !== id; }); },
  currentStageName: "kitchen",
  __tripActive: false
};
// setInterval/setTimeout: capture but don't auto-fire (the harness drives evaluate directly)
var timers = [];
function setTimeout(fn, ms) { var t = { fn: fn, at: clock + (ms || 0), cleared: false }; timers.push(t); return t; }
function clearTimeout(t) { if (t) t.cleared = true; }
function setInterval() { return 0; } // the 500ms poll — harness pings evaluate() itself

// advance the virtual clock by dt, firing any due rAF callbacks + timers frame by frame
function advance(dt) {
  var target = clock + dt;
  var STEP = 16;
  while (clock < target) {
    clock = Math.min(target, clock + STEP);
    // fire timers due by now
    timers.slice().forEach(function (t) { if (!t.cleared && clock >= t.at) { t.cleared = true; t.fn(); } });
    // fire the rAF frame
    var q = rafQueue; rafQueue = [];
    q.forEach(function (r) { r.cb(clock); });
  }
}

// ── run the sliced IIFE with the shim in scope ───────────────────────────────
// nowMs() reads the bare global `performance.now()` — shadow Node's real one with the
// virtual clock so the fade advances deterministically under advance()
var performance = window.performance;
// eslint-disable-next-line no-new-func
var runIIFE = new Function(
  "document", "window", "setTimeout", "clearTimeout", "setInterval", "performance",
  "'use strict';\n(function () {\n" + body + "\n})();"
);
runIIFE(document, window, setTimeout, clearTimeout, setInterval, performance);

var evaluate = window.__updateKitchenUvLinger;
assert(typeof evaluate === "function", "__updateKitchenUvLinger not exported");

// ── helpers ──────────────────────────────────────────────────────────────────
function fnum(str, name) { // pull a filter function's numeric arg
  var m = new RegExp(name + "\\(([-0-9.]+)").exec(str || "");
  return m ? parseFloat(m[1]) : null;
}
function brightness(f) { return fnum(f, "brightness"); }
function saturate(f) { return fnum(f, "saturate"); }

var passed = 0;
function ok(cond, msg) { assert(cond, msg); passed++; console.log("  ✓ " + msg); }

console.log("UV on↔off cross-fade:");

// 1. FADE IN — add the class, ping, and watch the filter climb to full UV over time
strip.classList.add("uv-mode");
evaluate();
advance(16); // one frame in
ok(strip.style.filter !== "", "fade-in: an inline filter is set right away (not blank)");
advance(584); // ~halfway through the 1200ms fade
var midInFilter = strip.style.filter;
var midB = brightness(midInFilter);
ok(midB > 0.5 && midB < 1, "fade-in: mid-fade brightness (" + midB.toFixed(3) + ") is between identity (1) and full-UV (0.5) — a real ramp, not a snap");
advance(2000); // well past FADE_MS
ok(Math.abs(brightness(strip.style.filter) - 0.5) < 0.01, "fade-in: settles at full-UV brightness 0.5");
ok(Math.abs(saturate(strip.style.filter) - 2.6) < 0.01, "fade-in: settles at full-UV saturate 2.6");
// counter-filter on the make-glass (kitchen) is the affine inverse → its brightness ≈ 1/0.5 = 2
ok(Math.abs(brightness(make.style.filter) - 2) < 0.02, "fade-in: make-glass counter-filter is the inverse (brightness ~2)");

// 2. FADE OUT — remove the class, ping, and watch it ramp down and clear
strip.classList.remove("uv-mode");
evaluate();
advance(600); // ~halfway through the fade-out
var midOut = strip.style.filter;
var midOutB = brightness(midOut);
ok(midOut !== "" && midOutB > 0.5 && midOutB < 1, "fade-out: mid-fade brightness (" + (midOutB || 0).toFixed(3) + ") is between full-UV and identity — a real ramp down");
advance(2000);
ok(strip.style.filter === "", "fade-out: lands on \"\" — handed back to CSS");
ok(make.style.filter === "", "fade-out: make-glass counter-filter cleared too");

// 3. QUICK OFF→ON — toggle off then straight back on leaves no stuck state
strip.classList.add("uv-mode"); evaluate(); advance(2000); // fully on
strip.classList.remove("uv-mode"); evaluate(); advance(200); // start fading out
strip.classList.add("uv-mode"); evaluate(); advance(2000); // flip back on before it finished
ok(Math.abs(brightness(strip.style.filter) - 0.5) < 0.01, "quick off→on: settles back at full-UV (no stuck partial filter)");

// 4a. SNAP — a trip mid-fade hands straight to CSS (no inline filter fighting filter:none)
strip.classList.remove("uv-mode"); strip.classList.add("uv-mode"); // ensure on
evaluate(); advance(2000);
window.__tripActive = true; evaluate();
ok(strip.style.filter === "", "trip mid-fade: strip.style.filter snapped to \"\" (hands to CSS filter:none)");
ok(make.style.filter === "", "trip: make-glass counter-filter cleared");
window.__tripActive = false;

// 4b. SNAP — device-zoom forces the hand-off
strip.classList.add("uv-mode"); evaluate(); advance(2000);
viewport.classList.add("device-zoomed"); evaluate();
ok(strip.style.filter === "", "device-zoom: strip.style.filter snapped to \"\"");
viewport.classList.remove("device-zoomed");

// 4c. SNAP — dance-freeze forces the hand-off
strip.classList.add("uv-mode"); evaluate(); advance(2000);
strip.classList.add("dance-frozen"); evaluate();
ok(strip.style.filter === "", "dance-freeze: strip.style.filter snapped to \"\"");
strip.classList.remove("dance-frozen");

// 4d. SNAP — arcade forces the hand-off
strip.classList.add("uv-mode"); evaluate(); advance(2000);
office.classList.add("arcade"); evaluate();
ok(strip.style.filter === "", "arcade: strip.style.filter snapped to \"\"");
office.classList.remove("arcade");

// 4e. BALCONY — outside: inline "none" (beats the class filter), never faded
strip.classList.add("uv-mode"); evaluate(); advance(2000);
window.__currentStageName = "balcony"; evaluate();
ok(strip.style.filter === "none", "balcony: strip.style.filter is \"none\" (outside, no blacklight)");
window.__currentStageName = "kitchen"; evaluate(); advance(2000);
ok(Math.abs(brightness(strip.style.filter) - 0.5) < 0.01, "back indoors: UV restored to full");

// 5. REDUCED MOTION — a fresh IIFE with prefers-reduced-motion snaps (no ramp frames)
(function () {
  var rStrip = mk("loft-game-strip"); // re-registers byId so the new IIFE grabs this one
  mk("hunt-viewport"); mk("kitchen-bar-make"); mk("stage-office"); mk("cuddly-flame-img");
  var rWindow = {
    matchMedia: function () { return { matches: true }; }, // reduced motion ON
    performance: { now: function () { return clock; } },
    requestAnimationFrame: function () { return 0; }, // if the fade tried to ramp it'd need this — it must not
    cancelAnimationFrame: function () {},
    currentStageName: "kitchen", __tripActive: false
  };
  var rDoc = {
    hidden: false, getElementById: function (id) { return byId[id] || null; },
    querySelector: function (s) { return s === ".hunt-viewport" ? byId["hunt-viewport"] : null; },
    querySelectorAll: function () { return []; }, addEventListener: function () {}
  };
  var rPerf = rWindow.performance;
  var rRun = new Function("document", "window", "setTimeout", "clearTimeout", "setInterval", "performance",
    "'use strict';\n(function () {\n" + body + "\n})();");
  rRun(rDoc, rWindow, setTimeout, clearTimeout, setInterval, rPerf);
  var rEval = rWindow.__updateKitchenUvLinger;
  rStrip.classList.add("uv-mode"); rEval(); // no advance() — snap should land immediately
  ok(Math.abs(brightness(rStrip.style.filter) - 0.5) < 0.01, "reduced-motion: UV-on snaps straight to full-UV (no fade frames)");
  rStrip.classList.remove("uv-mode"); rEval();
  ok(rStrip.style.filter === "", "reduced-motion: UV-off snaps straight to \"\"");
})();

console.log("\nAll " + passed + " UV-fade assertions passed.");
