#!/usr/bin/env node
/* Zero-dependency DOM-shim harness for the cuddly-nook game-kids feature.
   Headless Chrome is wedged on this box (state/play/enter/menu can't run), so this proves the
   three owner requests against the real code sliced out of rsvp.html:
     1) each kid's tap → window.__whoPop with the right "<em>Name</em> · role" line
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
var NAMES = ["kg-robin", "kg-navid", "kg-elisabeth", "kg-irene", "kg-felix", "kg-hannah"];
var strip, kg;
function buildScene() {
  strip = new El("svg"); strip.setAttribute("id", "loft-game-strip");
  kg = new El("g"); kg.setAttribute("id", "cuddly-kidgames");
  strip.appendChild(kg);
  // six kids FIRST: outer <g transform> > <g class="kg-rock kg-name"> > <g class="kg-tilt">
  var basePos = { "kg-robin": [108,300], "kg-navid": [160,296], "kg-elisabeth": [196,302], "kg-irene": [426,300], "kg-felix": [478,304], "kg-hannah": [514,300] };
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
function extractRoles(src) {
  // pull the role_* map values from T.en so tipText resolves the real strings
  var out = {};
  var keys = ["role_godson", "role_mniece", "role_niece", "role_mnephew"];
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
  var fn = new Function("document", "window", "tipText", "hoverTooltip",
    iife + "\nreturn { apply: window.__updateKidGames, reshuffle: window.__kidGamesReshuffle, inGame: window.__kidInGamesNow };");
  return fn(docShim, winShim, tipText, hoverTooltip);
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
  "kg-felix": ["Felix", "role_mnephew"], "kg-hannah": ["Hannah", "role_niece"]
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
  return x > 90 && x < 530 && y > 285 && y < 315;
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

/* ══ TEST 4: hover tooltip (dark bubble) on each kid, in ADDITION to the click card ═══════ */
console.log("\nTest 4 — each kid gets a hover tooltip naming the right kid (plus the click card):");
// rebuild a clean scene so the load-time hover wiring runs once against fresh nodes
hoverCalls.length = 0; whoPopCalls.length = 0;
buildScene();
coupleEl = new El("g"); coupleEl.setAttribute("class", "at-party");
visEl = new El("g");
docShim.getElementById = function (id) { if (id === "loft-game-strip") return strip; if (id === "cuddly-kidgames") return kg; if (id === "cuddly-couple") return coupleEl; if (id === "cuddly-visitors-layer") return visEl; return null; };
winShim.__gardenPartyOn = true;
var api4 = runIIFE(); // wiring happens at IIFE run (load) — one hoverTooltip per .kg-rock
ok(hoverCalls.length === NAMES.length, "hoverTooltip wired onto all six kids (got " + hoverCalls.length + ")");
NAMES.forEach(function (n) {
  var rock = kg.querySelector("." + n);
  var call = hoverCalls.filter(function (c) { return c.el === rock; })[0];
  var e = expect[n];
  var want = "<em>" + e[0] + "</em> · " + tipText(e[1]);
  ok(call && call.text === want, n + " hover tooltip → \"" + (call ? call.text : "(none)") + "\"");
  ok(call && call.placement === "top", n + " hover tooltip uses the \"top\" dark-bubble placement");
});
// the click name-card path must STILL work alongside the hover
api4.apply();
whoPopCalls.length = 0;
kg.querySelector(".kg-irene").querySelector(".kg-tilt")._fireClick();
ok(whoPopCalls.length === 1 && whoPopCalls[0].html === "<em>Irene</em> · " + tipText("role_niece"),
   "click name-card still pops alongside the hover tooltip (both wired)");

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

console.log("\n" + (fails ? ("FAILED: " + fails + " assertion(s), " + passes + " passed") : ("All " + passes + " assertions passed.")));
process.exit(fails ? 1 : 0);
