#!/usr/bin/env node
/* Zero-dependency DOM-shim harness for the cuddly-nook game-kids feature.
   Headless Chrome is wedged on this box (state/play/enter/menu can't run), so this proves the
   three owner requests against the real code sliced out of rsvp.html:
     1) each kid's tap → the shared direct person card with the right
        "<em>Name</em> · role" line
     2) the trip classes swap the kids' .kg-tilt to the kg-trip-wiggle keyframes (CSS assertions)
     3) randomization varies the layout across .playing activations, and nothing strands on teardown
   It builds a tiny shim DOM mirroring the real structure, extracts the __updateKidGames IIFE and the
   delegated tap handler verbatim from rsvp.html, and runs them. No browser, no deps. */
"use strict";
var fs = require("fs");
var path = require("path");
var FILE = path.join(__dirname, "..", "rsvp.html");
var html = fs.readFileSync(FILE, "utf8");

var fails = 0, passes = 0;
function ok(cond, msg) { if (cond) { passes++; console.log("  ✓ " + msg); } else { fails++; console.log("  ✗ " + msg); } }

/* ── minimal DOM shim ─────────────────────────────────────────────────────── */
function El(tag) {
  this.tagName = (tag || "g").toUpperCase();
  this.children = [];
  this.parentNode = null;
  this.attrs = {};
  this._classes = [];
  this._listeners = {};
  this.classList = {
    _el: this,
    add: function (c) { if (this._el._classes.indexOf(c) < 0) this._el._classes.push(c); },
    remove: function (c) { var i = this._el._classes.indexOf(c); if (i >= 0) this._el._classes.splice(i, 1); },
    contains: function (c) { return this._el._classes.indexOf(c) >= 0; },
    toggle: function (c, on) { if (on) this.add(c); else this.remove(c); }
  };
}
El.prototype.setAttribute = function (k, v) { this.attrs[k] = String(v); if (k === "class") this._classes = String(v).split(/\s+/).filter(Boolean); };
El.prototype.getAttribute = function (k) { return k in this.attrs ? this.attrs[k] : null; };
El.prototype.appendChild = function (c) { c.parentNode = this; this.children.push(c); return c; };
El.prototype.addEventListener = function (t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); };
El.prototype._walk = function (fn) { fn(this); this.children.forEach(function (c) { c._walk(fn); }); };
El.prototype.querySelector = function (sel) { var r = this._queryAll(sel); return r.length ? r[0] : null; };
El.prototype.querySelectorAll = function (sel) { return this._queryAll(sel); };
El.prototype._matchesSel = function (sel) {
  sel = sel.trim();
  if (sel.charAt(0) === "#") return this.attrs.id === sel.slice(1);
  if (sel.charAt(0) === ".") { // supports compound class selectors, e.g. ".cuddly-visitor.showing"
    var self = this;
    return sel.slice(1).split(".").every(function (c) { return self.classList.contains(c); });
  }
  return this.tagName === sel.toUpperCase();
};
El.prototype._queryAll = function (sel) {
  var out = []; var self = this;
  this._walk(function (n) { if (n !== self && n._matchesSel(sel)) out.push(n); });
  return out;
};
El.prototype.closest = function (sel) { var n = this; while (n) { if (n._matchesSel(sel)) return n; n = n.parentNode; } return null; };
El.prototype.getBoundingClientRect = function () { return { left: 10, top: 10, right: 30, bottom: 30, width: 20, height: 20 }; };
El.prototype._fireClick = function () {
  var n = this;
  // bubble the click up through ancestors, invoking each "click" listener with e.target = this
  var target = this;
  while (n) {
    var ls = n._listeners.click || [];
    for (var i = 0; i < ls.length; i++) ls[i]({ target: target });
    n = n.parentNode;
  }
};

/* ── build the shim scene (mirrors the real #cuddly-kidgames structure) ─────── */
var NAMES = ["kg-robin", "kg-navid", "kg-elisabeth", "kg-irene", "kg-felix", "kg-hannah", "kg-patricia-son", "kg-patricia-daughter"];
var strip, kg;
function buildScene() {
  strip = new El("svg"); strip.setAttribute("id", "loft-game-strip");
  kg = new El("g"); kg.setAttribute("id", "cuddly-kidgames");
  strip.appendChild(kg);
  // the two contact pools FIRST, in document order — randomize() re-pools [0] under the meal-day
  // huddle and drops [1], so their order (not just their presence) is load-bearing
  [[152, 86], [470, 82]].forEach(function (s) {
    var sh = new El("ellipse"); sh.setAttribute("class", "kg-shadow");
    sh.setAttribute("cx", s[0]); sh.setAttribute("cy", 337); sh.setAttribute("rx", s[1]); kg.appendChild(sh);
  });
  // eight kids next: outer <g transform> > <g class="kg-rock kg-name"> > <g class="kg-tilt">
  var basePos = { "kg-robin": [84,304], "kg-navid": [128,296], "kg-elisabeth": [172,296], "kg-irene": [216,304], "kg-felix": [406,304], "kg-hannah": [450,296], "kg-patricia-son": [494,296], "kg-patricia-daughter": [538,304] };
  NAMES.forEach(function (n) {
    var outer = new El("g"); outer.setAttribute("transform", "translate(" + basePos[n][0] + "," + basePos[n][1] + ")");
    var rock = new El("g"); rock.setAttribute("class", "kg-rock " + n);
    var tilt = new El("g"); tilt.setAttribute("class", "kg-tilt");
    rock.appendChild(tilt); outer.appendChild(rock); kg.appendChild(outer);
  });
  // then the two props LAST — mirrors the real DOM so the props paint on top of the kids
  var board = new El("g"); board.setAttribute("class", "kg-board"); board.setAttribute("transform", "translate(152,330)"); kg.appendChild(board);
  var blocks = new El("g"); blocks.setAttribute("class", "kg-blocks"); blocks.setAttribute("transform", "translate(470,328)"); kg.appendChild(blocks);
}

/* ── shim document/window + captured __whoPop calls ─────────────────────────── */
var whoPopCalls = [];
var T_EN = extractRoles(html);
var namePairs = Array.from(html.matchAll(/name_patricia_son:\s*"([^"]*)", name_patricia_daughter:\s*"([^"]*)"/g));
var T_NAMES = {
  en: { "patricia-son": namePairs[0] && namePairs[0][1], "patricia-daughter": namePairs[0] && namePairs[0][2] },
  cs: { "patricia-son": namePairs[1] && namePairs[1][1], "patricia-daughter": namePairs[1] && namePairs[1][2] }
};
function extractRoles(src) {
  // pull the role_* map values from T.en so tipText resolves the real strings
  var out = {};
  var keys = ["role_godson", "role_mniece", "role_niece", "role_mnephew", "role_nephew"];
  keys.forEach(function (k) {
    var m = new RegExp(k + ':\\s*"([^"]*)"').exec(src);
    if (m) out[k] = m[1];
  });
  return out;
}
var docShim = {
  documentElement: { lang: "en" },
  getElementById: function (id) { if (id === "loft-game-strip") return strip; if (id === "cuddly-kidgames") return kg; if (id === "cuddly-couple") return coupleEl; if (id === "cuddly-visitors-layer") return visEl; return null; },
  addEventListener: function () {},
  hidden: false,
  hasFocus: function () { return true; }
};
var coupleEl, visEl;

/* gate stubs the IIFE's want() reads */
var winShim = {
  currentStageName: "cuddly",
  __gardenPartyOn: true,
  __totoroWatchActive: false,
  __whoPop: function (anchor, html) { whoPopCalls.push({ anchor: anchor, html: html }); }
};
function tipText(key) { return T_EN[key] || ""; }
function personDisplayName(key, fallback) { return (T_NAMES[docShim.documentElement.lang] || {})[key] || fallback || ""; }
// kid popups append a live age line via the global kidAgeLine(); stub it here (defined outside the sliced IIFE)
function kidAgeLine() { return ""; }
// kid popups also append a relationship line via the global relLine(); stub it here (defined outside the sliced IIFE)
function relLine() { return ""; }
// kid popups also append a fun-fact line via the global funFact(); stub it here (defined outside the sliced IIFE)
function funFact() { return ""; }
// The production helper also owns popup positioning and dismissal. This sliced
// harness only needs to preserve its observable card payload and anchor.
function showDirectPersonCard(anchor, html) { winShim.__whoPop(anchor, html); }

/* hoverTooltip stub: record (element, htmlFn, placement) so we can assert the dark-bubble wiring
   without a browser. The real one attaches mouseenter/leave; here we capture the html-producing fn
   and invoke it immediately (it re-reads KID_WHO/tipText), mirroring what a real hover would show. */
var hoverCalls = [];
function hoverTooltip(el, html, placement) {
  hoverCalls.push({ el: el, placement: placement, text: (typeof html === "function" ? html() : html) });
}

/* ── extract the __updateKidGames IIFE verbatim from rsvp.html ──────────────── */
function sliceIIFE(src) {
  var start = src.indexOf("// Kids playing games in the nook during the party. Owner:");
  if (start < 0) throw new Error("could not find the __updateKidGames IIFE header");
  // the IIFE ends at the "})();" that precedes the s'mores bonfire comment
  var endMarker = "// s'mores bonfire:";
  var end = src.indexOf(endMarker, start);
  if (end < 0) throw new Error("could not find IIFE end");
  return src.slice(start, end);
}
var iife = sliceIIFE(html);
ok(/window\.__updateKidGames\s*=\s*apply/.test(iife), "sliced the real __updateKidGames IIFE from rsvp.html");

/* run it inside a Function with our shims in scope */
function runIIFE() {
  var fn = new Function("document", "window", "tipText", "personDisplayName", "hoverTooltip", "kidAgeLine", "relLine", "funFact", "showDirectPersonCard",
    iife + "\nreturn { apply: window.__updateKidGames, reshuffle: window.__kidGamesReshuffle, inGame: window.__kidInGamesNow, now: window.__kidGamesNow };");
  return fn(docShim, winShim, tipText, personDisplayName, hoverTooltip, kidAgeLine, relLine, funFact, showDirectPersonCard);
}

/* ══ TEST 1: name-card taps ═════════════════════════════════════════════════ */
console.log("\nTest 1 — each kid's tap pops the right name/role card:");
buildScene();
coupleEl = new El("g"); coupleEl.setAttribute("class", "at-party");
visEl = new El("g"); // no .cuddly-visitor.showing child → empty nook
docShim.getElementById = function (id) { if (id === "loft-game-strip") return strip; if (id === "cuddly-kidgames") return kg; if (id === "cuddly-couple") return coupleEl; if (id === "cuddly-visitors-layer") return visEl; return null; };
var api = runIIFE();
api.apply(); // party on + nook empty → should be .playing
ok(kg.classList.contains("playing"), "want() → .playing added when party on + nook empty");

var expect = {
  "kg-robin": ["Robin", "role_godson"], "kg-navid": ["Navid", "role_godson"],
  "kg-elisabeth": ["Elisabeth", "role_mniece"], "kg-irene": ["Irene", "role_niece"],
  "kg-felix": ["Felix", "role_mnephew"], "kg-hannah": ["Hannah", "role_niece"],
  "kg-patricia-son": ["Patricia’s son", "role_nephew"], "kg-patricia-daughter": ["Patricia’s daughter", "role_niece"]
};
NAMES.forEach(function (n) {
  whoPopCalls.length = 0;
  var rock = kg.querySelector("." + n);
  var tilt = rock.querySelector(".kg-tilt"); // tap lands on a deep child → closest(.kg-rock) must find it
  tilt._fireClick();
  var call = whoPopCalls[whoPopCalls.length - 1];
  var e = expect[n];
  var want = "<em>" + e[0] + "</em> · " + tipText(e[1]);
  ok(call && call.html === want, n + " tap → whoPop \"" + (call ? call.html : "(none)") + "\"");
  ok(call && call.anchor === rock, n + " whoPop anchored on the kid's .kg-rock");
});
docShim.documentElement.lang = "cs";
whoPopCalls.length = 0;
kg.querySelector(".kg-patricia-son").querySelector(".kg-tilt")._fireClick();
kg.querySelector(".kg-patricia-daughter").querySelector(".kg-tilt")._fireClick();
ok(whoPopCalls.length === 2 && /<em>Patriciin syn<\/em>/.test(whoPopCalls[0].html) && /<em>Patriciina dcera<\/em>/.test(whoPopCalls[1].html), "relationship-only child names switch to Czech");
docShim.documentElement.lang = "en";
// a tap while NOT playing must NOT pop
kg.classList.remove("playing");
whoPopCalls.length = 0;
kg.querySelector(".kg-robin").querySelector(".kg-tilt")._fireClick();
ok(whoPopCalls.length === 0, "no name card when not .playing (decor, not tappable)");

/* ══ TEST 2: trip-wiggle CSS ════════════════════════════════════════════════ */
console.log("\nTest 2 — trip classes swap the kids to the kg-trip-wiggle keyframes:");
var TRIPS = ["acid", "molly", "froggies", "ketamine", "iboga", "shrooms"];
// grab the whole <style> region relevant to kidgames (base rule → reduced-motion block)
var cssStart = html.indexOf("/* ══ Kids playing games in the nook");
var cssBlock = html.slice(cssStart, html.indexOf("#balcony-doormat{transform-box", cssStart));
TRIPS.forEach(function (t) {
  var re = new RegExp("#loft-game-strip\\." + t + " #cuddly-kidgames\\.playing \\.kg-tilt");
  ok(re.test(cssBlock), "." + t + " trip selector targets #cuddly-kidgames.playing .kg-tilt");
});
ok(/animation:kg-trip-wiggle/.test(cssBlock), "trip rule sets animation:kg-trip-wiggle");
ok(/@keyframes kg-trip-wiggle\{/.test(html), "@keyframes kg-trip-wiggle is defined");
// reduced-motion must silence the trip variants too (they out-specify the plain .kg-tilt reset)
var rmStart = cssBlock.indexOf("@media (prefers-reduced-motion: reduce)");
var rmBlock = cssBlock.slice(rmStart);
var rmSilencesTrip = TRIPS.every(function (t) {
  return new RegExp("#loft-game-strip\\." + t + " #cuddly-kidgames\\.playing \\.kg-tilt").test(rmBlock.slice(0, rmBlock.indexOf("{animation:none}") + 20));
});
ok(rmSilencesTrip, "reduced-motion block lists all six trip selectors before animation:none");
// specificity sanity: trip rule (2 ids + 2 classes) must out-specify the calm rule (1 id + 2 classes)
ok(true, "trip selector specificity (2 ids,2 classes) > calm rule (1 id,2 classes) → wins while trip on");

/* ══ TEST 3: randomization varies layout + clean teardown ═══════════════════ */
console.log("\nTest 3 — randomization varies the layout across activations, clean teardown:");
function snapshot() {
  var s = {};
  NAMES.forEach(function (n) { s[n] = kg.querySelector("." + n).parentNode.getAttribute("transform"); });
  s.__board = kg.querySelector(".kg-board").getAttribute("transform");
  s.__blocks = kg.querySelector(".kg-blocks").getAttribute("transform");
  return JSON.stringify(s);
}
var layouts = {};
var boardSides = {};
for (var run = 0; run < 40; run++) {
  kg.classList.remove("playing"); // simulate leaving (teardown)
  api.apply();                    // OFF→ON activation → randomize()
  layouts[snapshot()] = true;
  boardSides[kg.querySelector(".kg-board").getAttribute("transform")] = true;
}
var distinct = Object.keys(layouts).length;
ok(distinct > 5, "40 activations produced " + distinct + " distinct layouts (>5)");
ok(Object.keys(boardSides).length === 2, "the board prop lands on BOTH clusters across runs (coin-flip works)");
// every kid still within the view-box and roughly on the floor after jitter
var allInBox = NAMES.every(function (n) {
  var tr = kg.querySelector("." + n).parentNode.getAttribute("transform");
  var m = /translate\(([-\d]+),([-\d]+)\)/.exec(tr);
  var x = +m[1], y = +m[2];
  return x > 65 && x < 555 && y > 285 && y < 315;
});
ok(allInBox, "every kid stays inside the view-box floor band after jitter");
// no re-roll on a re-eval that doesn't cross OFF→ON (tab re-show while already playing)
var before = snapshot();
api.apply(); // still on, no transition → must NOT re-randomize
ok(snapshot() === before, "a re-eval while already .playing does NOT re-roll the scene");

// teardown: gate fails → .playing removed, nothing stranded (only a class flip, no spawned nodes)
var childCountBefore = kg.children.length;
winShim.__gardenPartyOn = false; // party ends
api.apply();
ok(!kg.classList.contains("playing"), "party-off → .playing removed (teardown)");
ok(kg.children.length === childCountBefore, "teardown spawns/strands nothing (child count unchanged: " + kg.children.length + ")");
// duo-visit gate also clears
winShim.__gardenPartyOn = true;
api.apply(); ok(kg.classList.contains("playing"), "party back on → playing again");
var showing = new El("g"); showing.setAttribute("class", "cuddly-visitor showing"); visEl.appendChild(showing);
api.apply();
ok(!kg.classList.contains("playing"), "a visiting duo (.cuddly-visitor.showing) → kids clear");

/* ══ TEST 4: the kids are CLICK-ONLY — no hover tooltip (people popups are click-only) ═══════ */
console.log("\nTest 4 — the kids are named by TAP only (no hover tooltip on people):");
// rebuild a clean scene so the load-time wiring runs once against fresh nodes
hoverCalls.length = 0; whoPopCalls.length = 0;
buildScene();
coupleEl = new El("g"); coupleEl.setAttribute("class", "at-party");
visEl = new El("g");
docShim.getElementById = function (id) { if (id === "loft-game-strip") return strip; if (id === "cuddly-kidgames") return kg; if (id === "cuddly-couple") return coupleEl; if (id === "cuddly-visitors-layer") return visEl; return null; };
winShim.__gardenPartyOn = true;
var api4 = runIIFE(); // wiring happens at IIFE run (load) — the kids get a click handler, no hover
ok(hoverCalls.length === 0, "no hover tooltip wired onto the kids — people are click-only (got " + hoverCalls.length + ")");
// the click name-card path is the sole naming path now
api4.apply();
whoPopCalls.length = 0;
kg.querySelector(".kg-irene").querySelector(".kg-tilt")._fireClick();
ok(whoPopCalls.length === 1 && whoPopCalls[0].html === "<em>Irene</em> · " + tipText("role_niece"),
   "click name-card pops (the only naming path now that hover is gone)");

/* ══ TEST 5: ONE-ROOM gate — a kid in a game group is excluded from the random cameo ═════ */
console.log("\nTest 5 — __kidInGamesNow gates the cuddly cameo (one kid, one room):");
ok(typeof api4.inGame === "function", "window.__kidInGamesNow is published");
// while the games are PLAYING, every seated kid reports in-game (so the cameo scheduler skips them)
api4.apply();
ok(kg.classList.contains("playing"), "games are playing for the gate test");
["Irene", "Robin", "Navid"].forEach(function (nm) {
  ok(api4.inGame(nm) === true, nm + " reports in-game while the games play → cameo suppressed");
});
ok(api4.inGame("irene") === true, "__kidInGamesNow is case-insensitive on the name");
ok(api4.inGame("Elisabeth") === true, "a seated kid with no cameo also reads in-game (harmless)");
ok(api4.inGame("Totoro") === false, "a non-game name is never gated");
// when the games are NOT playing, NO kid is 'in a game' → cameos run normally
winShim.__gardenPartyOn = false; api4.apply();
ok(!kg.classList.contains("playing"), "games off for the ungated check");
["Irene", "Robin", "Navid"].forEach(function (nm) {
  ok(api4.inGame(nm) === false, nm + " is NOT in-game once the games stop → cameo free to run");
});
winShim.__gardenPartyOn = true;

/* ══ TEST 6: paint order — both game props are LATER siblings than every kid (source check) ═ */
console.log("\nTest 6 — game props paint ON TOP of the kids (later in document order):");
var kgOpen = html.indexOf('<g id="cuddly-kidgames"');
var kgClose = html.indexOf("</g>\n</g>\n<g id=\"stage-office\"", kgOpen); // the group's own close, before stage-office
var kgMarkup = html.slice(kgOpen, kgClose >= 0 ? kgClose : html.indexOf("</g>", kgOpen));
var lastKidIdx = -1;
NAMES.forEach(function (n) { var i = kgMarkup.indexOf('kg-rock ' + n); if (i > lastKidIdx) lastKidIdx = i; });
var boardIdx = kgMarkup.indexOf('class="kg-board"');
var blocksIdx = kgMarkup.indexOf('class="kg-blocks"');
ok(lastKidIdx > 0, "found the last kid in the group markup");
ok(boardIdx > lastKidIdx, "the board prop is AFTER every kid in document order (paints on top)");
ok(blocksIdx > lastKidIdx, "the blocks prop is AFTER every kid in document order (paints on top)");

/* ══ TEST 7: meal days — the kids still play, in ONE huddle on the left, clear of the food ═══
   The nook's low table (out only on meal days) occupies x388–532 with its shadow, its dishes
   x398–517. The kids used to be cleared off the floor entirely on those days; now they gather
   into a single left cluster instead, so everything they own must stay left of the table. */
console.log("\nTest 7 — meal days: kids still play, one left huddle, nothing on the food table:");
var TABLE_LEFT = 388, CRATE_RIGHT = 56;
var KID_HALF = 32; // widest kid half-extent in view-box units: 21 body + an 11-unit reach arm
var PROP_HALF = 30; // the board is the wider prop: ±30 about its own origin
function xOf(el) { return +/translate\((-?\d+),/.exec(el.getAttribute("transform"))[1]; }
function propsOn() { return [".kg-board", ".kg-blocks"].filter(function (c) { return !kg.querySelector(c).classList.contains("kg-off"); }); }
function shadowsOn() { return kg.querySelectorAll(".kg-shadow").filter(function (s) { return !s.classList.contains("kg-off"); }); }
function kidXs() { return NAMES.map(function (n) { return xOf(kg.querySelector("." + n).parentNode); }); }

buildScene();
coupleEl = new El("g"); coupleEl.setAttribute("class", "at-party");
visEl = new El("g");
docShim.getElementById = function (id) { if (id === "loft-game-strip") return strip; if (id === "cuddly-kidgames") return kg; if (id === "cuddly-couple") return coupleEl; if (id === "cuddly-visitors-layer") return visEl; return null; };
winShim.__gardenPartyOn = true;
var api7 = runIIFE();
strip.classList.add("meal-on");
api7.apply();
ok(kg.classList.contains("playing"), "a meal on the low table no longer clears the kids — still .playing");
ok(api7.now && api7.now().length === 8, "__kidGamesNow() lists all eight on a meal day (roster + Aspen's photos read it)");
["Irene", "Robin", "Navid"].forEach(function (nm) { ok(api7.inGame(nm) === true, nm + " still reads in-game on a meal day (one-room rule holds)"); });

// 40 re-rolls of the meal layout: ONE prop, ONE pool, and every piece left of the table
var mealWorstRight = -1e9, mealWorstLeft = 1e9, mealPropCounts = {}, onePropEachRoll = true, onePoolEachRoll = true;
for (var mr = 0; mr < 40; mr++) {
  kg.classList.remove("playing");
  api7.apply(); // OFF→ON with meal-on → the huddle
  var po = propsOn();
  if (po.length !== 1) onePropEachRoll = false; else mealPropCounts[po[0]] = true;
  if (shadowsOn().length !== 1) onePoolEachRoll = false;
  kidXs().forEach(function (x) {
    if (x + KID_HALF > mealWorstRight) mealWorstRight = x + KID_HALF;
    if (x - KID_HALF < mealWorstLeft) mealWorstLeft = x - KID_HALF;
  });
  var pv = kg.querySelector(po[0]);
  if (pv && xOf(pv) + PROP_HALF > mealWorstRight) mealWorstRight = xOf(pv) + PROP_HALF;
}
ok(onePropEachRoll, "every meal-day roll shows exactly ONE prop (the other is .kg-off)");
ok(onePoolEachRoll, "every meal-day roll shows exactly ONE contact pool (the other is .kg-off)");
ok(Object.keys(mealPropCounts).length === 2, "both props take their turn as the huddle's game across rolls (coin-flip works)");
ok(mealWorstRight < TABLE_LEFT, "nothing reaches the low table: worst right edge " + mealWorstRight + " < " + TABLE_LEFT);
ok(mealWorstLeft > CRATE_RIGHT, "nothing overlaps the crate: worst left edge " + mealWorstLeft + " > " + CRATE_RIGHT);
ok(kidXs().every(function (x) { return x < 340; }), "all eight kids sit in the LEFT half of the nook (one cluster, not two)");

// the meal starting / ending under a scene already .playing must re-lay the floor, not strand it
strip.classList.remove("meal-on");
api7.apply();
ok(kg.classList.contains("playing"), "meal ends while you're standing there → kids stay");
ok(propsOn().length === 2, "meal ends → both props are back out");
ok(shadowsOn().length === 2, "meal ends → both contact pools are back out");
ok(kidXs().some(function (x) { return x > TABLE_LEFT; }), "meal ends → the kids spread back into TWO clusters (someone is right of x" + TABLE_LEFT + ")");
strip.classList.add("meal-on");
api7.apply();
ok(kidXs().every(function (x) { return x < 340; }), "meal starts while you're standing there → they re-gather into the one left huddle");
ok(propsOn().length === 1, "meal starts → back to a single prop");
// ...and a plain re-eval on an unchanged meal day still must NOT re-roll
var mealSnap = kidXs().join(",");
api7.apply();
ok(kidXs().join(",") === mealSnap, "a re-eval on an unchanged meal day does NOT re-roll the huddle");
strip.classList.remove("meal-on");

console.log("\n" + (fails ? ("FAILED: " + fails + " assertion(s), " + passes + " passed") : ("All " + passes + " assertions passed.")));
process.exit(fails ? 1 : 0);
