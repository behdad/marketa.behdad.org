#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Balcony-hangout controller unit test — a pure Node DOM-shim harness.
//
// Headless Chrome is wedged on this box (state/play/enter/menu all SIGTERM), so
// this proves the balconyHangout IIFE's LOGIC without a browser: it slices the
// IIFE source straight out of rsvp.html and runs it against a tiny hand-rolled
// DOM/window that models exactly what the controller touches — #balcony-hangout,
// the eight figures (with their .bh-drink children), #garden-guests' .g-<name>
// presence nodes, the ashtray perch, and the cross-agent hooks (__barCoupleNow,
// __djB, __gardenPartyOn, currentStageName).
//
// It asserts:
//   1. RANDOMIZATION — the shown subset, their L→R order, and their spacing all
//      VARY across repeated activations (fresh roll each genuine show).
//   2. ONE-ROOM RULE — a name .arrived on the garden floor is never shown on the
//      balcony; a name returned by __barCoupleNow() is never shown either.
//   3. __balconySmokerNow() — returns the names actually smoking on the deck
//      (DJ resolved live to Sina/Danesh), and null when nobody's out / hidden.
//   4. DRINKS — some (not all, not always) non-smokers hold a beer or a flute;
//      smokers never do; the fraction with a drink varies across showings.
//   5. TEARDOWN — after hide(), nothing is left shown/stranded (no .on, no drink
//      classes, __balconySmokerNow() null).
//
// Usage: node tests/balcony.js
"use strict";

var fs = require("fs");
var path = require("path");
var assert = require("assert");

var ROOT = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(ROOT, "rsvp.html"), "utf8");

// ── slice the IIFE body out of the file ──────────────────────────────────────
var START = "(function balconyHangout() {";
var si = html.indexOf(START);
assert(si !== -1, "could not find balconyHangout IIFE");
// find its matching close: scan brace depth from the "{" of the function
var open = html.indexOf("{", si);
var depth = 0, i = open, end = -1;
for (; i < html.length; i++) {
  var ch = html[i];
  if (ch === "{") depth++;
  else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
}
assert(end !== -1, "could not match IIFE braces");
var body = html.slice(open + 1, end); // the code between the outer function braces

// sanity: the code under test is really in there (assertFresh spirit — don't test a stale slice)
assert(/__balconySmokerNow/.test(body), "slice missing __balconySmokerNow — wrong region?");
assert(/function layout\(\)/.test(body), "slice missing layout() — wrong region?");
assert(/function placeLane/.test(body), "slice missing placeLane() — wrong region?");

// ── the roster the SVG actually declares (ids + which are smokers) ────────────
// (mirrors the authored #balcony-hangout figures; the harness builds fake nodes for these)
var CROWD = ["bh-patricia-son", "bh-patricia-daughter", "bh-elisabeth"];
var SMOKERS = ["bh-farhang", "bh-alireza", "bh-dj", "bh-behdad", "bh-marketa"];
// figure id → garden .g-<name> key used by the one-room exclusion
var NAME = {
  "bh-patricia-son": "bahareh", "bh-patricia-daughter": "patricia", "bh-elisabeth": "lauren",
  "bh-farhang": "farhang", "bh-alireza": "alireza", "bh-dj": "dj",
  "bh-behdad": "behdad", "bh-marketa": "marketa"
};
var ALL = CROWD.concat(SMOKERS);

// ── a tiny DOM shim ──────────────────────────────────────────────────────────
function ClassList(el) {
  this._ = {};
  this.el = el;
}
ClassList.prototype.add = function () { for (var i = 0; i < arguments.length; i++) this._[arguments[i]] = true; this.el._sync(); };
ClassList.prototype.remove = function () { for (var i = 0; i < arguments.length; i++) delete this._[arguments[i]]; this.el._sync(); };
ClassList.prototype.contains = function (c) { return !!this._[c]; };
ClassList.prototype.toggle = function (c, on) { if (on === undefined) on = !this._[c]; if (on) this._[c] = true; else delete this._[c]; this.el._sync(); return on; };

function El(tag) {
  this.tagName = tag || "g";
  this.children = [];
  this.parentNode = null;
  this.id = "";
  this.style = {};
  this._attrs = {};
  this._listeners = {};
  this.classList = new ClassList(this);
}
El.prototype._sync = function () {
  // keep a className string roughly in sync (some code reads .className rarely)
  this.className = Object.keys(this.classList._).join(" ");
};
El.prototype.setAttribute = function (k, v) { this._attrs[k] = String(v); };
El.prototype.getAttribute = function (k) { return this._attrs[k] === undefined ? null : this._attrs[k]; };
El.prototype.removeAttribute = function (k) { delete this._attrs[k]; };
El.prototype.hasAttribute = function (k) { return this._attrs[k] !== undefined; };
El.prototype.appendChild = function (c) { c.parentNode = this; this.children.push(c); return c; };
El.prototype.addEventListener = function (t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); };
El.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, width: 1, height: 1, right: 1, bottom: 1 }; };
El.prototype._matchesSel = function (sel) {
  // supports ".cls", ".a.b", tag-less only; and ".g-<name>"
  if (sel[0] !== ".") return false;
  var parts = sel.slice(1).split(".");
  for (var i = 0; i < parts.length; i++) if (!this.classList.contains(parts[i])) return false;
  return true;
};
El.prototype.querySelector = function (sel) {
  var found = null;
  (function walk(node) {
    for (var i = 0; i < node.children.length && !found; i++) {
      var c = node.children[i];
      if (c._matchesSel(sel)) { found = c; return; }
      walk(c);
    }
  })(this);
  return found;
};
El.prototype.querySelectorAll = function (sel) {
  var out = [];
  (function walk(node) {
    for (var i = 0; i < node.children.length; i++) {
      var c = node.children[i];
      if (c._matchesSel(sel)) out.push(c);
      walk(c);
    }
  })(this);
  return out;
};

// ── build the fake document ──────────────────────────────────────────────────
var byId = {};
function mk(id, classes) {
  var e = new El("g");
  e.id = id;
  if (classes) classes.forEach(function (c) { e.classList.add(c); });
  if (id) byId[id] = e;
  return e;
}

var hangout = mk("balcony-hangout");
ALL.forEach(function (id) {
  var isSmoker = SMOKERS.indexOf(id) !== -1;
  var fig = mk(id, ["bh-fig"].concat(isSmoker ? ["bh-smoker"] : ["bh-crowd"]));
  if (id === "bh-behdad" || id === "bh-marketa") fig.classList.add("bh-host");
  fig.style.display = ""; // authored: visible until layout hides
  // non-smokers carry the two drink graphics the controller toggles
  if (!isSmoker) {
    var idle = new El("g"); idle.classList.add("bh-idle"); fig.appendChild(idle);
    var beer = new El("g"); beer.classList.add("bh-drink"); beer.classList.add("bh-beer"); idle.appendChild(beer);
    var flute = new El("g"); flute.classList.add("bh-drink"); flute.classList.add("bh-flute"); idle.appendChild(flute);
  }
  hangout.appendChild(fig);
});

// garden guests: one .g-<name> node per name that CAN be on the floor
var guests = mk("garden-guests");
Object.keys(NAME).forEach(function (id) {
  var g = new El("g"); g.classList.add("g-" + NAME[id]); guests.appendChild(g);
});

var perch = mk("balcony-ashtray-perch");
perch.style.opacity = "0";
var perchSmoke = mk("balcony-ashtray-smoke");
var tableAshtray = mk("balcony-ashtray");
var strip = mk("loft-game-strip");

// ── window / document / globals ──────────────────────────────────────────────
var timers = [];
var globalObj = {};
var win = globalObj;
win.matchMedia = function () { return { matches: false, addEventListener: function () {}, removeEventListener: function () {}, addListener: function () {}, removeListener: function () {} }; }; // no reduced motion
win.__gardenPartyOn = false;
win.currentStageName = "kitchen";
win.__djB = false;                 // false → Sina spins? our code: __djB=false → resolveDj marks dj-off-danesh; djName() returns Danesh. Keep consistent below.
win.__barCoupleNow = function () { return win.__barCoupleNowValue || null; };
win.__barCoupleNowValue = null;
win.requestAnimationFrame = function () { return 0; }; // never actually loops in this harness
win.cancelAnimationFrame = function () {};
win.addEventListener = function () {};
win.removeEventListener = function () {};

var doc = {
  hidden: false,
  visibilityState: "visible",
  hasFocus: function () { return true; },
  getElementById: function (id) { return byId[id] || null; },
  querySelector: function (sel) { return guests.querySelector(sel) || hangout.querySelector(sel); },
  addEventListener: function () {},
  createElementNS: function () { return new El("g"); }
};

// stubs for the outer-scope helpers the IIFE references
var spawnCalls = [];
function spawnSteamWisps(target, cx, cy, s, a, b, c, op) { spawnCalls.push({ cx: cx, cy: cy, s: s, op: op }); }
var hoverWired = [];
function hoverTooltip(el, htmlFn) { hoverWired.push({ el: el, htmlFn: htmlFn }); }
function tipText(key) { return "TIP:" + key; }

// ── run the IIFE in a scoped function with our shims bound as locals ──────────
// We wrap the sliced body so that bare identifiers (strip, spawnSteamWisps,
// hoverTooltip, tipText, document, window) resolve to our shims, and `window`
// property assignments land on our win object.
var runner = new Function(
  "window", "document", "strip", "spawnSteamWisps", "hoverTooltip", "tipText",
  "requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "clearTimeout", "getComputedStyle", "matchMedia",
  "(function balconyHangout() {" + body + "})();"
);
runner(
  win, doc, strip, spawnSteamWisps, hoverTooltip, tipText,
  win.requestAnimationFrame, win.cancelAnimationFrame,
  function () { return 0; }, function () {}, // setTimeout/clearTimeout — no ambient timers needed for logic
  function () { return { opacity: "1", display: "" }; },
  win.matchMedia
);

assert(typeof win.__updateBalconyHangout === "function", "__updateBalconyHangout not published");
assert(typeof win.__balconySmokerNow === "function", "__balconySmokerNow not published");
assert(typeof win.__resetBalconyHangout === "function", "__resetBalconyHangout not published");

// ── helpers to drive a fresh appearance ──────────────────────────────────────
function shownIds() {
  return ALL.filter(function (id) {
    var el = byId[id];
    return hangout.classList.contains("on") && el.style.display !== "none";
  });
}
function shownOrderX() {
  // L→R order of shown figures, keyed by their placed feet-x (parsed from transform)
  return shownIds().map(function (id) {
    var t = byId[id].getAttribute("transform") || "";
    var m = /translate\(([-\d.]+),/.exec(t);
    return { id: id, x: m ? parseFloat(m[1]) : NaN };
  }).sort(function (a, b) { return a.x - b.x; });
}
function activate() {
  // simulate arriving on the balcony with the party lit → a genuine fresh show
  win.currentStageName = "balcony";
  win.__gardenPartyOn = true;
  win.__updateBalconyHangout();
}
function leave() {
  win.currentStageName = "kitchen";
  win.__gardenPartyOn = false;
  win.__updateBalconyHangout();
}
function setArrived(name, on) {
  var g = guests.querySelector(".g-" + name);
  if (on) g.classList.add("arrived"); else g.classList.remove("arrived");
}

var failures = [];
function ok(name, cond) { if (cond) console.log("  ✓ " + name); else { console.log("  ✗ " + name); failures.push(name); } }

console.log("balcony-hangout controller (Node DOM-shim):");

// ── 1. RANDOMIZATION varies across activations ───────────────────────────────
(function () {
  win.__barCoupleNowValue = null;
  ["bahareh", "patricia", "lauren", "farhang", "alireza", "behdad", "marketa"].forEach(function (n) { setArrived(n, false); });
  var subsets = {}, orders = {}, gapSets = {};
  var N = 200;
  for (var k = 0; k < N; k++) {
    leave();               // force shownOnce=false so the NEXT show re-rolls
    activate();
    var ids = shownIds().slice().sort();
    subsets[ids.join(",")] = true;
    var ord = shownOrderX().map(function (o) { return o.id; });
    orders[ord.join(">")] = true;
    // spacing signature: rounded gaps between consecutive shown figures
    var xs = shownOrderX().map(function (o) { return o.x; });
    var gaps = [];
    for (var g = 1; g < xs.length; g++) gaps.push(Math.round(xs[g] - xs[g - 1]));
    gapSets[gaps.join(",")] = true;
  }
  ok("shown SUBSET varies across showings (" + Object.keys(subsets).length + " distinct)", Object.keys(subsets).length >= 4);
  ok("L→R ORDER varies across showings (" + Object.keys(orders).length + " distinct)", Object.keys(orders).length >= 4);
  ok("SPACING/distance varies across showings (" + Object.keys(gapSets).length + " distinct)", Object.keys(gapSets).length >= 10);
})();

// ── 2. ONE-ROOM RULE: floor + bar exclusion ──────────────────────────────────
(function () {
  // (a) on the floor → never shown on the balcony
  ["bahareh", "patricia", "lauren", "farhang", "alireza", "behdad", "marketa"].forEach(function (n) { setArrived(n, false); });
  win.__barCoupleNowValue = null;
  setArrived("farhang", true);
  setArrived("bahareh", true);
  var everFarhang = false, everPatriciaSon = false;
  for (var k = 0; k < 120; k++) {
    leave(); activate();
    var ids = shownIds();
    if (ids.indexOf("bh-farhang") !== -1) everFarhang = true;
    if (ids.indexOf("bh-patricia-son") !== -1) everPatriciaSon = true;
  }
  ok("a smoker on the garden floor (Farhang) is NEVER shown on the balcony", !everFarhang);
  ok("a crowd guest on the garden floor (Patricia’s son) is NEVER shown on the balcony", !everPatriciaSon);
  setArrived("farhang", false); setArrived("bahareh", false);

  // (b) at the bar (via __barCoupleNow) → never shown on the balcony
  win.__barCoupleNowValue = ["alireza", "patricia"];
  var everAlireza = false, everPatriciaDaughter = false;
  for (var j = 0; j < 120; j++) {
    leave(); activate();
    var ids2 = shownIds();
    if (ids2.indexOf("bh-alireza") !== -1) everAlireza = true;
    if (ids2.indexOf("bh-patricia-daughter") !== -1) everPatriciaDaughter = true;
  }
  ok("a smoker at the bar (Alireza) is NEVER shown on the balcony", !everAlireza);
  ok("a crowd guest at the bar (Patricia’s daughter) is NEVER shown on the balcony", !everPatriciaDaughter);
  win.__barCoupleNowValue = null;

  // (c) a thrown __barCoupleNow degrades gracefully (no crash, still shows people)
  win.__barCoupleNow = function () { throw new Error("bar not ready"); };
  var crashed = false, showedSomeone = false;
  try { leave(); activate(); showedSomeone = shownIds().length > 0; } catch (e) { crashed = true; }
  ok("a throwing __barCoupleNow() is caught (degrades gracefully)", !crashed && showedSomeone);
  win.__barCoupleNow = function () { return win.__barCoupleNowValue || null; };
})();

// ── 3. __balconySmokerNow() reflects the current smokers ─────────────────────
(function () {
  ["bahareh", "patricia", "lauren", "farhang", "alireza", "behdad", "marketa"].forEach(function (n) { setArrived(n, false); });
  win.__barCoupleNowValue = null;
  leave();
  ok("__balconySmokerNow() is null when hidden", win.__balconySmokerNow() === null);
  activate();
  var who = win.__balconySmokerNow();
  ok("__balconySmokerNow() returns an array while shown", Array.isArray(who) && who.length > 0);
  // every returned name must correspond to a SHOWN smoker (dj → sina/danesh)
  var shownSmokers = shownIds().filter(function (id) { return SMOKERS.indexOf(id) !== -1; });
  var expected = shownSmokers.map(function (id) {
    if (id === "bh-dj") return win.__djB ? "sina" : "danesh";
    return NAME[id];
  }).sort();
  ok("__balconySmokerNow() lists exactly the shown smokers (dj resolved live)",
    JSON.stringify(who.slice().sort()) === JSON.stringify(expected));
  // DJ resolves live: flip __djB and re-show → the dj name flips. The shown smoker subset is
  // random, so re-roll until the DJ figure is actually on the deck before reading its live name.
  win.__djB = true;
  var who2 = null, djFace = null;
  for (var djTry = 0; djTry < 200; djTry++) {
    leave(); activate();
    if (shownIds().indexOf("bh-dj") === -1) continue; // DJ not out this showing → re-roll
    who2 = win.__balconySmokerNow();
    djFace = who2.indexOf("sina") !== -1 ? "sina" : (who2.indexOf("danesh") !== -1 ? "danesh" : null);
    break;
  }
  ok("DJ smoker names the OFF-duty DJ live (±__djB) → " + djFace, djFace === "sina");
  win.__djB = false;
  // the excluded (floor) smoker never appears in the roster either
  setArrived("farhang", true); leave(); activate();
  ok("__balconySmokerNow() omits a smoker who's on the floor", (win.__balconySmokerNow() || []).indexOf("farhang") === -1);
  setArrived("farhang", false);
})();

// ── 4. DRINKS: some non-smokers, not all, varying; smokers never ──────────────
(function () {
  ["bahareh", "patricia", "lauren", "farhang", "alireza", "behdad", "marketa"].forEach(function (n) { setArrived(n, false); });
  win.__barCoupleNowValue = null;
  var drinkFractions = {}, everDrink = false, everNoDrink = false, smokerDrinkSeen = false;
  var N = 300;
  for (var k = 0; k < N; k++) {
    leave(); activate();
    var crowdShown = shownIds().filter(function (id) { return CROWD.indexOf(id) !== -1; });
    var withDrink = 0;
    crowdShown.forEach(function (id) {
      var fig = byId[id];
      var beerOn = fig.querySelector(".bh-beer") && fig.querySelector(".bh-beer").classList.contains("on");
      var fluteOn = fig.querySelector(".bh-flute") && fig.querySelector(".bh-flute").classList.contains("on");
      // never BOTH at once
      if (beerOn && fluteOn) smokerDrinkSeen = true; // reuse flag: a figure with two drinks is a fail
      if (beerOn || fluteOn) { withDrink++; everDrink = true; } else { everNoDrink = true; }
    });
    if (crowdShown.length) drinkFractions[withDrink + "/" + crowdShown.length] = true;
    // smokers must never carry a drink graphic (they have none, but assert nothing sneaks on)
    shownIds().filter(function (id) { return SMOKERS.indexOf(id) !== -1; }).forEach(function (id) {
      var b = byId[id].querySelector(".bh-beer"), f = byId[id].querySelector(".bh-flute");
      if ((b && b.classList.contains("on")) || (f && f.classList.contains("on"))) smokerDrinkSeen = true;
    });
  }
  ok("SOME non-smokers hold a drink (beer or flute) sometimes", everDrink);
  ok("NOT all non-smokers always hold a drink (some are dry)", everNoDrink);
  ok("the drink fraction VARIES across showings (" + Object.keys(drinkFractions).length + " distinct)", Object.keys(drinkFractions).length >= 3);
  ok("no figure ever holds two drinks, and no smoker ever holds one", !smokerDrinkSeen);
})();

// ── 5. TEARDOWN: nothing stranded after hide ─────────────────────────────────
(function () {
  ["bahareh", "patricia", "lauren", "farhang", "alireza", "behdad", "marketa"].forEach(function (n) { setArrived(n, false); });
  win.__barCoupleNowValue = null;
  leave(); activate(); // show, roll a layout (may include drinks)
  win.__resetBalconyHangout(); // the goToStage-leave / global-reset path
  ok("hide() drops the .on class", !hangout.classList.contains("on"));
  ok("hide() clears every held drink (none stranded)", hangout.querySelectorAll(".bh-drink.on").length === 0);
  ok("__balconySmokerNow() is null after teardown", win.__balconySmokerNow() === null);
})();

console.log("");
if (failures.length) {
  console.error("FAILED: " + failures.length + " assertion(s):\n  - " + failures.join("\n  - "));
  process.exit(1);
}
console.log("All balcony-hangout assertions passed.");
