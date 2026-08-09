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
//   4. DRINKS — optional drinks vary, while named preferences stay correct.
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
assert(/function layout\(preserve\)/.test(body), "slice missing layout(preserve) — wrong region?");
assert(/function placeLane/.test(body), "slice missing placeLane() — wrong region?");

// ── the roster the SVG actually declares (ids + which are smokers) ────────────
// (mirrors the authored #balcony-hangout figures; the harness builds fake nodes for these)
var CROWD = ["bh-bahareh", "bh-patricia", "bh-elisabeth", "bh-mahzad", "bh-jay"];
var SMOKERS = ["bh-farhang", "bh-alireza", "bh-dj", "bh-behdad", "bh-marketa"];
// figure id → garden .g-<name> key used by the one-room exclusion
var NAME = {
  "bh-bahareh": "bahareh", "bh-patricia": "patricia", "bh-elisabeth": "lauren",
  "bh-mahzad": "mahzad", "bh-jay": "jay",
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
  // non-smokers carry beer/wine; the host smokers carry their free-hand Diet Coke can
  if (!isSmoker) {
    var idle = new El("g"); idle.classList.add("bh-idle"); fig.appendChild(idle);
    var beer = new El("g"); beer.classList.add("bh-drink"); beer.classList.add("bh-beer"); idle.appendChild(beer);
    var flute = new El("g"); flute.classList.add("bh-drink"); flute.classList.add("bh-flute"); idle.appendChild(flute);
  } else if (id === "bh-behdad" || id === "bh-marketa") {
    var hostIdle = new El("g"); hostIdle.classList.add("bh-idle"); fig.appendChild(hostIdle);
    var diet = new El("g"); diet.classList.add("bh-drink"); diet.classList.add("bh-diet"); hostIdle.appendChild(diet);
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
win.__partyGuestAttended = function () { return true; }; // current controller admits only arrived party guests
win.__balconySmokingPolicyValue = "all";
win.__balconySmokingPolicy = function () { return win.__balconySmokingPolicyValue; };
win.__partyDrinkPreference = function (name) {
  return ({ jay: "beer", spencer: "beer", bahareh: "wine", madla: "wine", athena: "wine",
    lauren: "wine", marketa: "diet-coke", behdad: "diet-coke", hamid: "any" })[name] || "any";
};
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
function showDirectPersonCard(el, htmlFn) {
  if (win.__whoPop) win.__whoPop(el, typeof htmlFn === "function" ? htmlFn() : htmlFn);
}
// Stand-ins for the page's dict-driven person lines, shaped like the real ones (a wrapped span
// when the key exists, "" when it doesn't). REL deliberately has no dj entry: the DJs are crew
// with no rel_ string, so a card for them must still compose cleanly.
var REL = { farhang: "REL:farhang", bahareh: "REL:bahareh", marketa: "REL:marketa" };
var FUN = { farhang: "FUN:farhang", bahareh: "FUN:bahareh", marketa: "FUN:marketa", sina: "FUN:sina", danesh: "FUN:danesh" };
function relLine(key) { var t = REL[String(key).toLowerCase()]; return t ? '<span class="tip-rel">' + t + "</span>" : ""; }
function funFact(key) { var t = FUN[String(key).toLowerCase()]; return t ? '<span class="tip-fun">' + t + "</span>" : ""; }

// ── run the IIFE in a scoped function with our shims bound as locals ──────────
// We wrap the sliced body so that bare identifiers (strip, spawnSteamWisps,
// hoverTooltip, tipText, document, window) resolve to our shims, and `window`
// property assignments land on our win object.
var runner = new Function(
  "window", "document", "strip", "spawnSteamWisps", "hoverTooltip", "tipText", "relLine", "funFact", "showDirectPersonCard",
  "requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "clearTimeout", "getComputedStyle", "matchMedia",
  "(function balconyHangout() {" + body + "})();"
);
runner(
  win, doc, strip, spawnSteamWisps, hoverTooltip, tipText, relLine, funFact, showDirectPersonCard,
  win.requestAnimationFrame, win.cancelAnimationFrame,
  function () { return 0; }, function () {}, // setTimeout/clearTimeout — no ambient timers needed for logic
  function () { return { opacity: "1", display: "" }; },
  win.matchMedia
);

assert(typeof win.__updateBalconyHangout === "function", "__updateBalconyHangout not published");
assert(typeof win.__balconySmokerNow === "function", "__balconySmokerNow not published");
assert(typeof win.__resetBalconyHangout === "function", "__resetBalconyHangout not published");
assert(typeof win.__balconyHangoutAttendanceChanged === "function", "__balconyHangoutAttendanceChanged not published");

// ── helpers to drive a fresh appearance ──────────────────────────────────────
function shownIds() {
  return ALL.filter(function (id) {
    var el = byId[id];
    return hangout.classList.contains("on") && el.classList.contains("bh-present");
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
  var everFarhang = false, everBahareh = false;
  for (var k = 0; k < 120; k++) {
    leave(); activate();
    var ids = shownIds();
    if (ids.indexOf("bh-farhang") !== -1) everFarhang = true;
    if (ids.indexOf("bh-bahareh") !== -1) everBahareh = true;
  }
  ok("a smoker on the garden floor (Farhang) is NEVER shown on the balcony", !everFarhang);
  ok("a crowd guest on the garden floor (Bahareh) is NEVER shown on the balcony", !everBahareh);
  setArrived("farhang", false); setArrived("bahareh", false);

  // (b) at the bar (via __barCoupleNow) → never shown on the balcony
  win.__barCoupleNowValue = ["alireza", "patricia"];
  var everAlireza = false, everPatricia = false;
  for (var j = 0; j < 120; j++) {
    leave(); activate();
    var ids2 = shownIds();
    if (ids2.indexOf("bh-alireza") !== -1) everAlireza = true;
    if (ids2.indexOf("bh-patricia") !== -1) everPatricia = true;
  }
  ok("a smoker at the bar (Alireza) is NEVER shown on the balcony", !everAlireza);
  ok("a crowd guest at the bar (Patricia) is NEVER shown on the balcony", !everPatricia);
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

// ── 4. FIRE / KID SAFETY: narrow the active smoker roster immediately ────────
(function () {
  win.__barCoupleNowValue = null;
  ["bahareh", "patricia", "lauren", "farhang", "alireza", "behdad", "marketa"].forEach(function (n) { setArrived(n, false); });
  leave(); activate();
  win.__balconySmokingPolicyValue = "dj-only";
  win.__balconyHangoutAttendanceChanged();
  var fireSmokers = shownIds().filter(function (id) { return SMOKERS.indexOf(id) !== -1; });
  ok("a balcony fire leaves only the off-duty DJ smoking",
    fireSmokers.length === 1 && fireSmokers[0] === "bh-dj" &&
    JSON.stringify(win.__balconySmokerNow()) === JSON.stringify([win.__djB ? "sina" : "danesh"]));

  win.__balconySmokingPolicyValue = "none";
  win.__balconyHangoutAttendanceChanged();
  ok("kids playing in the balcony corner clear every smoker",
    shownIds().filter(function (id) { return SMOKERS.indexOf(id) !== -1; }).length === 0 &&
    win.__balconySmokerNow() === null);
  win.__balconySmokingPolicyValue = "all";
  win.__balconyHangoutAttendanceChanged();
})();

// ── 5. DRINKS: optional, but authored preferences never drift ────────────────
(function () {
  ["bahareh", "patricia", "lauren", "farhang", "alireza", "behdad", "marketa"].forEach(function (n) { setArrived(n, false); });
  win.__barCoupleNowValue = null;
  var drinkFractions = {}, everDrink = false, everNoDrink = false, wrongDrink = false;
  var sawBaharehWine = false, sawJayBeer = false, sawHostDiet = false;
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
      if (beerOn && fluteOn) wrongDrink = true;
      if (beerOn || fluteOn) { withDrink++; everDrink = true; } else { everNoDrink = true; }
      if (id === "bh-bahareh" && (beerOn || fluteOn)) {
        if (!fluteOn || !fig.querySelector(".bh-flute").classList.contains("wine")) wrongDrink = true;
        else sawBaharehWine = true;
      }
      if (id === "bh-jay" && (beerOn || fluteOn)) {
        if (!beerOn) wrongDrink = true; else sawJayBeer = true;
      }
    });
    if (crowdShown.length) drinkFractions[withDrink + "/" + crowdShown.length] = true;
    // Markéta and Behdad can use their free hand for Diet Coke; other smokers have no drink.
    shownIds().filter(function (id) { return SMOKERS.indexOf(id) !== -1; }).forEach(function (id) {
      var d = byId[id].querySelector(".bh-diet");
      if (d && d.classList.contains("on")) sawHostDiet = true;
      var b = byId[id].querySelector(".bh-beer"), f = byId[id].querySelector(".bh-flute");
      if ((b && b.classList.contains("on")) || (f && f.classList.contains("on"))) wrongDrink = true;
    });
  }
  ok("SOME non-smokers hold a drink (beer or flute) sometimes", everDrink);
  ok("NOT all non-smokers always hold a drink (some are dry)", everNoDrink);
  ok("the drink fraction VARIES across showings (" + Object.keys(drinkFractions).length + " distinct)", Object.keys(drinkFractions).length >= 3);
  ok("Bahareh's shown drink is wine", sawBaharehWine);
  ok("Jay's shown drink is beer", sawJayBeer);
  ok("Markéta/Behdad can appear with Diet Coke", sawHostDiet);
  ok("no authored preference ever renders as the wrong drink", !wrongDrink);
})();

// ── 6. NAME CARDS: the deck names people as fully as every other room ─────────
// Tapping a figure pops the shared white card (window.__whoPop). It must carry the same
// name · role · relationship · fun-fact the garden/cuddly/bar cast get — not a bare
// "name · role" — and must read the RIGHT key: the roster's `name` is the one-room
// exclusion key (bh-bahareh wears Bahareh), and the DJ slot resolves to whoever's off duty.
(function () {
  ["bahareh", "patricia", "lauren", "farhang", "alireza", "behdad", "marketa"].forEach(function (n) { setArrived(n, false); });
  win.__barCoupleNowValue = null;
  activate();
  var popped = null;
  win.__whoPop = function (el, html) { popped = html; };
  function tapCard(id) {
    popped = null;
    var fns = byId[id]._listeners.click || [];
    fns.forEach(function (fn) { fn({ stopPropagation: function () {} }); });
    return popped;
  }
  var card = tapCard("bh-farhang");
  ok("a deck figure's card carries name · role", /<em>Farhang<\/em> · TIP:role_mc/.test(card || ""), card);
  ok("a deck figure's card carries the relationship line", /tip-rel">REL:farhang/.test(card || ""), card);
  ok("a deck figure's card carries the fun fact", /tip-fun">FUN:farhang/.test(card || ""), card);

  // bh-bahareh wears Bahareh: the visible name and BOTH lookups must be hers, never the slot id
  card = tapCard("bh-bahareh");
  ok("a re-skinned figure shows the face's name, not its slot id", /<em>Bahareh<\/em>/.test(card || ""), card);
  ok("a re-skinned figure looks its lines up by the face's key", /REL:bahareh/.test(card || "") && /FUN:bahareh/.test(card || ""), card);

  // the DJ slot is live: the card names whoever is OFF duty and uses that name as the key
  win.__djB = true; // Danesh spins → Sina's out here
  card = tapCard("bh-dj");
  ok("the DJ card names the off-duty DJ (Sina)", /<em>Sina<\/em> · TIP:role_dj/.test(card || ""), card);
  ok("the DJ card looks its fun fact up by that live name", /FUN:sina/.test(card || ""), card);
  win.__djB = false; // Sina spins → Danesh's out here
  card = tapCard("bh-dj");
  ok("the DJ card follows a booth swap (Danesh)", /<em>Danesh<\/em>/.test(card || "") && /FUN:danesh/.test(card || ""), card);
  // crew have no rel_ string — the card must simply omit that line, not print an empty span
  ok("a person with no relationship string gets no rel line", !/tip-rel/.test(card || ""), card);

  // markéta's key is accent-free ("marketa") while her label keeps the accent
  card = tapCard("bh-marketa");
  ok("an accented label still resolves its lines", /<em>markéta<\/em>/.test(card || "") && /REL:marketa/.test(card || "") && /FUN:marketa/.test(card || ""), card);
  delete win.__whoPop;
})();

// ── 7. TEARDOWN: nothing stranded after hide ─────────────────────────────────
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
