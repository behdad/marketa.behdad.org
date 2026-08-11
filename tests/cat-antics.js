#!/usr/bin/env node
// Node DOM-shim harness for the loose cat's NAUGHTY ANTICS (zoomies, knock-a-cup,
// bat-yarn, steal-&-scamper) added to rsvp.html's cat behavior IIFE.
//
// Chrome is wedged on this box, so play.js/state.js (which drive real headless
// Chrome) can't run — this proves the antic contract with a minimal DOM shim
// instead: the antic functions are extracted VERBATIM from rsvp.html (between the
// `var anticTimer = null;` and the final `scheduleAntic();` markers) and run against
// stubs for the outer-closure deps they use (walk/pos/baseFeet/currentWalkOffset/
// canJumpNow/finishJump/flickTail/swat wrapper/etc.), so it exercises the REAL code,
// not a re-implementation.
//
// Asserts, per the task's mandatory safety list:
//   1. an antic FIRES under the gate (crickets rule satisfied + cat present).
//   2. a hidden tab is a NO-OP (nothing spawned, no movement, no sound).
//   3. an unfocused tab is a NO-OP (crickets rule: hasFocus() false).
//   4. reduced motion is a NO-OP (canJumpNow gates on it).
//   5. off-room / stowed is a NO-OP.
//   6. a spawned object SELF-CLEANS on animationend — spawn count returns to baseline,
//      nothing strands, and the moved/knocked object is GONE (scene restored).
//   7. the drop-oldest CAP holds under a flood (never more than ANTIC_SPAWN_CAP live).
//   8. movement antics take the busy-lock (jumping=true) and resume via finishJump.
//   9. any SOUND obeys the crickets rule (fires focused, silent hidden/unfocused).
//  10. spawned objects land in the CAT'S OWN parent group (local coords / spawn-in-parent).
//
// Run: node tests/cat-antics.js
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(ROOT, "rsvp.html"), "utf8");

var failures = 0;
function ok(label) { console.log("  ✓ " + label); }
function bad(label, detail) { failures++; console.log("  ✗ " + label); if (detail) console.log("      " + detail); }
function assert(cond, label, detail) { if (cond) ok(label); else bad(label, detail); }

// ── extract the antic block VERBATIM from rsvp.html ──────────────────────────
var startMarker = "  var anticTimer = null;";
var endMarker = "  scheduleJump(); // self-gating loop: acts only while the loose cat";
var si = html.indexOf(startMarker);
var ei = html.indexOf(endMarker);
if (si === -1 || ei === -1) { console.error("could not locate the antic block markers in rsvp.html"); process.exit(1); }
var anticSrc = html.slice(si, ei); // the antic definitions, up to (not incl) the trailing scheduleJump/idleFidget/scheduleAntic starts

// ── minimal DOM shim ─────────────────────────────────────────────────────────
function makeEl(tag) {
  var el = {
    _tag: tag,
    _attrs: {},
    _classes: [],
    _children: [],
    _listeners: {},
    parentNode: null,
    innerHTML: "",
    style: {},
    offsetWidth: 0,
    _animations: [],
    classList: {
      add: function () { for (var i = 0; i < arguments.length; i++) if (el._classes.indexOf(arguments[i]) === -1) el._classes.push(arguments[i]); },
      remove: function () { for (var i = 0; i < arguments.length; i++) { var j = el._classes.indexOf(arguments[i]); if (j !== -1) el._classes.splice(j, 1); } },
      toggle: function (c, force) { var has = el._classes.indexOf(c) !== -1; if (force === undefined) force = !has; if (force && !has) el._classes.push(c); if (!force && has) el._classes.splice(el._classes.indexOf(c), 1); return force; },
      contains: function (c) { return el._classes.indexOf(c) !== -1; }
    },
    setAttribute: function (k, v) { if (k === "class") el._classes = String(v).split(/\s+/).filter(Boolean); else el._attrs[k] = v; },
    getAttribute: function (k) { if (k === "class") return el._classes.join(" "); return k in el._attrs ? el._attrs[k] : null; },
    appendChild: function (c) { c.parentNode = el; el._children.push(c); ALL.push(c); return c; },
    insertBefore: function (c, ref) { c.parentNode = el; var i = ref ? el._children.indexOf(ref) : -1; if (i === -1) el._children.push(c); else el._children.splice(i, 0, c); ALL.push(c); return c; },
    removeChild: function (c) { var i = el._children.indexOf(c); if (i !== -1) el._children.splice(i, 1); c.parentNode = null; var a = ALL.indexOf(c); if (a !== -1) ALL.splice(a, 1); return c; },
    remove: function () { if (el.parentNode) el.parentNode.removeChild(el); },
    getElementsByClassName: function (cls) {
      // live-ish: return an array-like reflecting current descendants with the class,
      // recomputed each access via a getter proxy on .length + index (good enough:
      // the antic code reads live.length and live[0] repeatedly in the while loop).
      function collect() {
        var out = [];
        (function walk(node) {
          node._children.forEach(function (ch) { if (ch._classes.indexOf(cls) !== -1) out.push(ch); walk(ch); });
        })(el);
        return out;
      }
      var arr = collect();
      // proxy so repeated .length / [0] reads reflect removals done inside the loop
      return new Proxy(arr, {
        get: function (t, prop) {
          var fresh = collect();
          if (prop === "length") return fresh.length;
          if (typeof prop === "string" && /^\d+$/.test(prop)) return fresh[Number(prop)];
          return fresh[prop];
        }
      });
    },
    addEventListener: function (type, fn) { (el._listeners[type] = el._listeners[type] || []).push(fn); },
    removeEventListener: function (type, fn) { var l = el._listeners[type]; if (l) { var i = l.indexOf(fn); if (i !== -1) l.splice(i, 1); } },
    dispatchEvent: function (ev) { var l = (el._listeners[ev.type] || []).slice(); l.forEach(function (fn) { fn.call(el, ev); }); return true; },
    animate: function (kf, opts) {
      var anim = { onfinish: null, _cancelled: false, effect: { getComputedTiming: function () { return { duration: (opts && opts.duration) || 0 }; }, setKeyframes: function () {} }, currentTime: 0, cancel: function () { this._cancelled = true; }, _finish: function () { if (!this._cancelled && this.onfinish) this.onfinish(); } };
      el._animations.push(anim);
      return anim;
    },
    // fire the CSS one-shot end for a given animation name (drives self-clean)
    fireAnimEnd: function (animName) { el.dispatchEvent({ type: "animationend", animationName: animName }); }
  };
  ALL.push(el);
  return el;
}

var ALL = [];
var byId = {};
function reg(id, el) { el._attrs.id = id; byId[id] = el; return el; }

// the cat's own nodes + the parent stage group it spawns into
var stage = makeEl("g");
var pos = makeEl("g"); reg("witchy-chest-cat-pos", pos);
pos.setAttribute("transform", "translate(-36,32)"); // a follower-room base offset
stage.appendChild(pos);
var walk = reg("witchy-chest-cat-walk", makeEl("g"));
var pounce = reg("witchy-chest-cat-pounce", makeEl("g"));
var tail = reg("witchy-chest-cat-tail", makeEl("path"));
walk._classes = ["roaming-sm", "out"]; // loose + in a follower room

var soundCalls = 0;

// shared shims the extracted code closes over
global.document = {
  hidden: false,
  _focus: true,
  hasFocus: function () { return this._focus; },
  visibilityState: "visible",
  getElementById: function (id) { return byId[id] || null; },
  createElementNS: function (ns, tag) { return makeEl(tag); },
  getElementsByClassName: function (cls) {
    // document-wide: scan every registered element still attached to the tree
    return ALL.filter(function (el) { return el._classes.indexOf(cls) !== -1 && el.parentNode; });
  },
  addEventListener: function () {},
};
global.window = {
  matchMedia: function (q) { return { matches: (q.indexOf("reduce") !== -1) ? global.__reduced : false }; },
};
global.__reduced = false;
global.getComputedStyle = function (el) { return { transform: "none" }; };
global.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
global.playGlassClinkSound = function () { soundCalls++; };
global.Math_random_real = Math.random;

// ── stubbed outer-closure deps the antic block references ─────────────────────
// (these mirror the real IIFE's contract; the antic code is the code under test)
var jumping = false, isPerchJump = false, isNapJump = false, jumpAnim = null, jumpTimer = null;
var catRoom = "kitchen";
var IDX = { kitchen: 0, garden: 1, cuddly: 2, office: 3, balcony: 4 };
global.window.__currentStageIndex = 0; // matches catRoom so canJumpNow's room check passes
var PERCHES = { kitchen: [{}], garden: [{}], cuddly: [{}], office: [{}], balcony: [{}] };

function reducedMotion() { return !!(global.window.matchMedia && global.window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
function canJumpNow() {
  return walk.classList.contains("out") && !jumping && !reducedMotion() &&
    global.document.visibilityState !== "hidden" &&
    global.window.__currentStageIndex === IDX[catRoom] && !!PERCHES[catRoom];
}
function baseFeet() {
  var m = (pos.getAttribute("transform") || "").match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)/);
  return { x: 636 + (m ? parseFloat(m[1]) : 0), y: 292 + (m ? parseFloat(m[2]) : 0) };
}
function currentWalkOffset() { return { x: 0, y: 0 }; }
function flickTail() { tail.classList.add("flicking"); }
var finishJumpCalls = 0;
function finishJump() { finishJumpCalls++; jumpAnim = null; jumping = false; walk.style.animationPlayState = ""; }

// evaluate the extracted antic block in this scope so it binds to the stubs above.
// It defines doZoomies/doKnockCup/doBatYarn/doStealScamper/fireAntic/canAnticNow/etc.
// and exposes window.__scheduleCatAntic / window.__stopCatAntics. We grab the local
// fns via a trailing return of an object.
var runner = new Function(
  "document", "window", "getComputedStyle", "requestAnimationFrame", "setTimeout", "clearTimeout",
  "playGlassClinkSound", "Math",
  "jumping", "isPerchJump", "isNapJump", "jumpAnim", "jumpTimer", "catRoom", "IDX", "PERCHES",
  "reducedMotion", "canJumpNow", "baseFeet", "currentWalkOffset", "flickTail", "finishJump",
  "walk", "pos",
  "'use strict';\n" +
  // shadow the busy-lock vars so the antic code's assignments are observable here
  "var __state = { get jumping(){return jumping;}, get jumpAnim(){return jumpAnim;} };\n" +
  anticSrc + "\n" +
  "return { doZoomies: doZoomies, doKnockCup: doKnockCup, doBatYarn: doBatYarn, doStealScamper: doStealScamper," +
  " fireAntic: fireAntic, canAnticNow: canAnticNow, anticTick: anticTick, ANTIC_SPAWN_CAP: ANTIC_SPAWN_CAP," +
  " clearStaleAntics: clearStaleAntics," +
  " getJumping: function(){ return jumping; }, getJumpAnim: function(){ return jumpAnim; }, window: window };"
);

// live-binding trick: the antic code assigns to `jumping`/`jumpAnim` (params, local to
// the Function). We read them back through the returned getJumping/getJumpAnim.
var API = runner(
  global.document, global.window, global.getComputedStyle, global.requestAnimationFrame, setTimeout, clearTimeout,
  global.playGlassClinkSound, Math,
  jumping, isPerchJump, isNapJump, jumpAnim, jumpTimer, catRoom, IDX, PERCHES,
  reducedMotion, canJumpNow, baseFeet, currentWalkOffset, flickTail, finishJump,
  walk, pos
);

// helpers to inspect spawned state
function liveCount(cls) { return pos.parentNode.getElementsByClassName(cls).length; }
function spawnedNodes(cls) {
  var out = [];
  (function walkTree(n) { n._children.forEach(function (c) { if (c._classes.indexOf(cls) !== -1) out.push(c); walkTree(c); }); })(pos.parentNode);
  return out;
}
function resetScene() {
  // clear any spawned wraps
  pos.parentNode._children.filter(function (c) { return c !== pos; }).forEach(function (c) { pos.parentNode.removeChild(c); });
  soundCalls = 0; finishJumpCalls = 0; walk._animations = []; pounce._classes = [];
}

console.log("cat naughty antics (Node DOM-shim harness):");

// baseline
assert(liveCount("cat-knock-cup") === 0 && liveCount("cat-yarn") === 0 && liveCount("cat-treat") === 0,
  "baseline: no antic objects spawned");

// 1. knock-cup FIRES under the gate + spawns into the cat's own parent + sound (focused)
resetScene();
API.doKnockCup();
assert(liveCount("cat-knock-cup") === 1, "knock-cup: spawns exactly one cup", "got " + liveCount("cat-knock-cup"));
assert(spawnedNodes("cat-knock-cup")[0].parentNode.parentNode === pos.parentNode,
  "knock-cup: cup spawned into the cat's OWN parent group (spawn-in-parent / local coords)");
assert(pounce._classes.indexOf("swatting") !== -1, "knock-cup: plays the paw-swat one-shot on the pounce wrapper");
assert(soundCalls === 1, "knock-cup: clatter sounds once while focused (crickets rule OK)", "soundCalls=" + soundCalls);
// wrap carries the static position transform; the ANIMATED node has NO transform attr
var cupWrap = spawnedNodes("cat-knock-cup")[0].parentNode;
assert(/translate\(/.test(cupWrap.getAttribute("transform")) && spawnedNodes("cat-knock-cup")[0].getAttribute("transform") === null,
  "knock-cup: position on the WRAPPER, none on the animated node (transform-attr rule)");

// 6. self-clean: fire the topple's animationend → cup gone, scene restored
spawnedNodes("cat-knock-cup")[0].fireAnimEnd("cat-cup-topple");
assert(liveCount("cat-knock-cup") === 0, "knock-cup: self-cleans on animationend (count back to baseline, object restored/gone)");

// 9. sound obeys crickets rule: hidden and unfocused are silent
resetScene(); global.document.hidden = true; soundCalls = 0;
// gate is checked at the driver level; doKnockCup itself re-checks focus for the sound.
// Simulate the driver no-op first:
assert(!API.canAnticNow(), "hidden tab: canAnticNow() is false (driver no-ops)");
API.doKnockCup(); // even if called directly, the sound must stay silent while hidden
assert(soundCalls === 0, "knock-cup: silent while hidden (sound crickets-gated)", "soundCalls=" + soundCalls);
global.document.hidden = false;
resetScene(); global.document._focus = false; soundCalls = 0;
assert(!API.canAnticNow(), "unfocused tab: canAnticNow() is false (driver no-ops)");
API.doKnockCup();
assert(soundCalls === 0, "knock-cup: silent while unfocused (sound crickets-gated)", "soundCalls=" + soundCalls);
global.document._focus = true;

// 7. drop-oldest cap holds under a flood
resetScene();
for (var i = 0; i < 10; i++) API.doKnockCup();
assert(liveCount("cat-knock-cup") <= API.ANTIC_SPAWN_CAP, "knock-cup: drop-oldest cap holds under a flood (<= ANTIC_SPAWN_CAP)", "live=" + liveCount("cat-knock-cup") + " cap=" + API.ANTIC_SPAWN_CAP);

// 2+3. yarn + treat spawn/self-clean the same way
resetScene();
API.doBatYarn();
assert(liveCount("cat-yarn") === 1, "bat-yarn: spawns one dangling yarn");
assert(spawnedNodes("cat-yarn")[0].getAttribute("transform") === null, "bat-yarn: no transform attr on the animated yarn node");
spawnedNodes("cat-yarn")[0].fireAnimEnd("cat-yarn-swing");
assert(liveCount("cat-yarn") === 0, "bat-yarn: self-cleans on animationend");

resetScene();
API.doStealScamper();
assert(liveCount("cat-treat") === 1, "steal-scamper: spawns one stolen treat");
assert(API.getJumping() === true, "steal-scamper: takes the busy-lock (jumping=true) for the scamper");
assert(walk._animations.length === 1, "steal-scamper: drives the walk node (one WAAPI dash)");
// resume via finishJump
walk._animations[0]._finish();
assert(finishJumpCalls === 1, "steal-scamper: resumes the roam via finishJump on the dash's onfinish (onfinish wired)");
spawnedNodes("cat-treat")[0].fireAnimEnd("cat-treat-carry");
assert(liveCount("cat-treat") === 0, "steal-scamper: treat self-cleans on animationend (dropped + gone)");

// 8. zoomies: busy-lock + walk-node dash + finishJump resume, NO spawn
resetScene();
API.doZoomies();
assert(API.getJumping() === true, "zoomies: takes the busy-lock (jumping=true)");
assert(walk._animations.length === 1, "zoomies: one WAAPI dash on the walk node");
assert(liveCount("cat-knock-cup") + liveCount("cat-yarn") + liveCount("cat-treat") === 0, "zoomies: spawns nothing");
walk._animations[0]._finish();
assert(finishJumpCalls === 1, "zoomies: resumes the roam via finishJump (onfinish wired)");

// 4. reduced motion: driver no-op (canAnticNow false)
resetScene(); global.__reduced = true;
assert(!API.canAnticNow(), "reduced motion: canAnticNow() is false (no darting/zoomies)");
global.__reduced = false;

// 5. off-room / not-out: driver no-op
resetScene();
global.window.__currentStageIndex = 3; // cat is in kitchen (0) but viewing office (3)
assert(!API.canAnticNow(), "off-room: canAnticNow() is false (cat not in the viewed room)");
global.window.__currentStageIndex = 0;
walk.classList.remove("out");
assert(!API.canAnticNow(), "stowed (not .out): canAnticNow() is false");
walk.classList.add("out");

// 6b. clear-stale (stow/reset path): a lingering spawned object is dropped outright,
// so nothing strands off-screen waiting on an animationend that a hidden tab won't fire.
resetScene();
API.doKnockCup(); API.doBatYarn(); API.doStealScamper();
assert(liveCount("cat-knock-cup") + liveCount("cat-yarn") + liveCount("cat-treat") === 3, "clear-stale setup: 3 objects live");
API.clearStaleAntics();
assert(liveCount("cat-knock-cup") + liveCount("cat-yarn") + liveCount("cat-treat") === 0, "clear-stale: drops all lingering antic objects (stow/reset teardown)");

// 1b. under the gate the driver fires an antic (spawns or moves)
resetScene();
var before = liveCount("cat-knock-cup") + liveCount("cat-yarn") + liveCount("cat-treat");
API.fireAntic(); // kitchen menu — spawns a cup/yarn/treat or a zoomie
var moved = walk._animations.length > 0;
var spawned = (liveCount("cat-knock-cup") + liveCount("cat-yarn") + liveCount("cat-treat")) > before;
assert(moved || spawned, "gate satisfied: fireAntic() performs an antic (movement or spawn)");

console.log("");
if (failures) { console.log(failures + " antic check(s) failed."); process.exit(1); }
console.log("All cat-antic checks passed.");
