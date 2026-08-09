// tests/officehangout.js — Node DOM-shim harness for the OFFICE HANGOUT GUEST controller.
//
// Chrome is wedged on this box (state/play/enter/menu can't run), so this proves the pure JS
// logic of the officeHangout() IIFE against a hand-rolled minimal DOM/window shim rather than a
// real browser. It EXTRACTS the exact IIFE source from rsvp.html (so it can't drift from the
// shipped code) and evaluates it in a sandbox with just enough DOM to exercise:
//   1) rotation varies the guest group across showings (including Ayushi solo),
//   2) the one-room exclusion holds (skips anyone on the garden floor / at the bar / on the balcony),
//   3) __officeCoupleNow() reports the current couple's member ids (and null when empty),
//   4) drinks roll per showing and respect the actual holder's preference,
//   5) teardown (reset/party-off) strands nothing, while room changes preserve the assignment.
//
// Zero deps, like check.js. Run: node tests/officehangout.js
"use strict";
var fs = require("fs");
var path = require("path");

var html = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");

// ── extract the officeHangout IIFE source verbatim ────────────────────────────────────────
var startMarker = "(function officeHangout() {";
var si = html.indexOf(startMarker);
if (si < 0) { console.error("FAIL: could not find officeHangout() IIFE in rsvp.html"); process.exit(1); }
// walk braces from the IIFE open to its matching close, then swallow the trailing ")();"
var i = si + startMarker.length - 1; // at the '{'
var depth = 0, end = -1;
for (; i < html.length; i++) {
  var ch = html[i];
  if (ch === "{") depth++;
  else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
}
if (end < 0) { console.error("FAIL: could not brace-match the officeHangout IIFE"); process.exit(1); }
var tail = html.slice(end + 1, end + 6); // expect "})();"
var iifeSrc = html.slice(si, end + 1) + tail.slice(0, tail.indexOf(";") + 1);
if (!/\)\(\);$/.test(iifeSrc)) { console.error("FAIL: extracted IIFE didn't end in )();"); process.exit(1); }

// ── minimal DOM shim ──────────────────────────────────────────────────────────────────────
function makeClassList(el) {
  return {
    _s: el._classes,
    contains: function (c) { return el._classes.indexOf(c) !== -1; },
    add: function () { for (var k = 0; k < arguments.length; k++) if (el._classes.indexOf(arguments[k]) === -1) el._classes.push(arguments[k]); },
    remove: function () { for (var k = 0; k < arguments.length; k++) { var j = el._classes.indexOf(arguments[k]); if (j !== -1) el._classes.splice(j, 1); } },
    toggle: function (c, on) { if (on === undefined) on = el._classes.indexOf(c) === -1; if (on) this.add(c); else this.remove(c); return on; }
  };
}
function El(classes) {
  var el = { _classes: (classes || "").split(/\s+/).filter(Boolean), _children: [], _on: {} };
  el.classList = makeClassList(el);
  el.addEventListener = function (t, fn) { (el._on[t] = el._on[t] || []).push(fn); }; // the couples carry a click → name-card handler

  el.querySelector = function (sel) {
    // supports ".cls" over descendants (used: layer.querySelector("." + cls))
    var want = sel.replace(/^\./, "");
    for (var c = 0; c < el._children.length; c++) if (el._children[c]._classes.indexOf(want) !== -1) return el._children[c];
    return null;
  };
  el.querySelectorAll = function (sel) {
    var want = sel.replace(/^\./, ""), out = [];
    function walk(node) {
      for (var i = 0; i < node._children.length; i++) {
        var child = node._children[i];
        if (child._classes.indexOf(want) !== -1) out.push(child);
        walk(child);
      }
    }
    walk(el);
    return out;
  };
  return el;
}

// office-hangout layer with one <g> per couple (class = of-<key>)
var officeLayer = El("");
var COUPLE_CLASSES = ["of-aligoli","of-spencerjay","of-farhanglauren","of-alirezamahzad","of-chinnellrafi","of-hamidathena","of-baharakpayman","of-madlarobert","of-ayushi"];
COUPLE_CLASSES.forEach(function (c) {
  var couple = El("of-couple " + c);
  couple._children.push(El("of-person of-p1"));
  if (c !== "of-ayushi") couple._children.push(El("of-person of-p2"));
  officeLayer._children.push(couple);
});

// garden-guests: each member gets a .g-<name> child so onFloor() can find them
var GUESTS = ["ali","goli","spencer","jay","farhang","lauren","alireza","mahzad","chinnell","rafi","hamid","athena","baharak","payman","madla","robert","ayushi"];
var gardenGuests = El("");
GUESTS.forEach(function (n) { gardenGuests._children.push(El("g-" + n)); });

var DOC_ELS = { "office-hangout": officeLayer, "garden-guests": gardenGuests };

// ── timer shim: manual clock so we can "advance" and fire due timers deterministically ─────
var timers = [], nextId = 1, clock = 0;
function setTimeoutShim(fn, ms) { var t = { id: nextId++, fn: fn, due: clock + (ms || 0) }; timers.push(t); return t.id; }
function clearTimeoutShim(id) { for (var k = 0; k < timers.length; k++) if (timers[k].id === id) { timers.splice(k, 1); return; } }
function advance(ms) {
  var target = clock + ms;
  // fire timers in due order until we pass target (a fired timer may enqueue more)
  for (;;) {
    var soonest = null;
    for (var k = 0; k < timers.length; k++) if (timers[k].due <= target && (!soonest || timers[k].due < soonest.due)) soonest = timers[k];
    if (!soonest) break;
    clock = soonest.due;
    clearTimeoutShim(soonest.id);
    soonest.fn();
  }
  clock = target;
}
function pendingTimers() { return timers.length; }

// ── window/document sandbox ────────────────────────────────────────────────────────────────
var sandbox = {
  __gardenPartyOn: true,
  currentStageName: "office",
  Math: Math,
  Array: Array
};
sandbox.window = sandbox;
var listeners = {};
var documentShim = {
  hidden: false,
  hasFocus: function () { return true; },
  getElementById: function (id) { return DOC_ELS[id] || null; },
  addEventListener: function (t, fn) { (listeners[t] = listeners[t] || []).push(fn); }
};
sandbox.document = documentShim;
sandbox.addEventListener = function (t, fn) { (listeners[t] = listeners[t] || []).push(fn); };
sandbox.setTimeout = setTimeoutShim;
sandbox.clearTimeout = clearTimeoutShim;
sandbox.rosterHoldsOccupants = function () { return false; }; // the extracted controller normally reads the page-global roster gate
sandbox.__partyGuestAttended = function () { return true; }; // every shim couple has already entered this party
sandbox.__partyDrinkPreference = function (name) {
  return ({ jay: "beer", spencer: "beer", bahareh: "wine", madla: "wine", athena: "wine",
    lauren: "wine", ayushi: "cocktail", marketa: "diet-coke", behdad: "diet-coke", hamid: "any" })[name] || "any";
};

// evaluate the extracted IIFE in the sandbox
var vm = require("vm");
vm.createContext(sandbox);
try { vm.runInContext(iifeSrc, sandbox, { filename: "officeHangout-extract.js" }); }
catch (e) { console.error("FAIL: extracted IIFE threw on eval:\n" + (e && e.stack || e)); process.exit(1); }

// ── assertions ─────────────────────────────────────────────────────────────────────────────
var fails = 0, passes = 0;
function ok(cond, msg) { if (cond) { passes++; console.log("  ✓ " + msg); } else { fails++; console.log("  ✗ " + msg); } }

// sanity: the controller published its hooks
ok(typeof sandbox.__updateOfficeHangout === "function", "__updateOfficeHangout published");
ok(typeof sandbox.__resetOfficeHangout === "function", "__resetOfficeHangout published");
ok(typeof sandbox.__officeCoupleNow === "function", "__officeCoupleNow published");
ok(typeof sandbox.officefolks === "function", "officefolks() console hook published");

function presentClass() {
  for (var k = 0; k < officeLayer._children.length; k++) if (officeLayer._children[k]._classes.indexOf("present") !== -1) return officeLayer._children[k]._classes.filter(function (c) { return c !== "of-couple" && c !== "present" && c.indexOf("of-drink") !== 0 && c !== "of-beer" && c !== "of-wine" && c !== "of-cocktail"; })[0];
  return null;
}
function presentEl() { for (var k = 0; k < officeLayer._children.length; k++) if (officeLayer._children[k]._classes.indexOf("present") !== -1) return officeLayer._children[k]; return null; }

// 1) __officeCoupleNow() null when empty
ok(sandbox.__officeCoupleNow() === null, "reports null when the office is empty");

// 2) forced show reports the right members + marks exactly one couple present
var who = sandbox.officefolks("madla");
ok(!!who && who.indexOf("madla") !== -1 && who.indexOf("robert") !== -1, "officefolks('madla') brings Madla+Robert (member lookup): " + JSON.stringify(who));
ok(presentClass() === "of-madlarobert", "exactly the madlarobert couple is .present");
var presentCount = officeLayer._children.filter(function (e) { return e._classes.indexOf("present") !== -1; }).length;
ok(presentCount === 1, "only one couple is present at a time (" + presentCount + ")");
ok(JSON.stringify(sandbox.__officeCoupleNow()) === JSON.stringify(who), "__officeCoupleNow() matches the shown couple");
var travelBuddies = sandbox.officefolks("chinnell");
ok(!!travelBuddies && travelBuddies[0] === "chinnell" && travelBuddies[1] === "rafi" &&
  presentClass() === "of-chinnellrafi", "Chinnell+Rafi participate in forced office visits");
var solo = sandbox.officefolks("ayushi");
ok(JSON.stringify(solo) === '["ayushi"]' && presentClass() === "of-ayushi" &&
  presentEl().querySelectorAll(".of-person").length === 1,
  "Ayushi participates as a solo office appearance");

// 3) unspecified drinks still roll — sample many forced shows, expect beer, wine AND empty,
//    and p1-only / p2-only / both variants to all occur.
var sawBeer = false, sawWine = false, sawEmpty = false, sawP1 = false, sawP2 = false, sawBoth = false;
for (var s = 0; s < 400; s++) {
  sandbox.officefolks("aligoli"); // force same couple so only the drink roll varies
  var el = presentEl();
  var hasBeer = el._classes.indexOf("of-beer") !== -1, hasWine = el._classes.indexOf("of-wine") !== -1;
  var p1only = el._classes.indexOf("of-drink-p1-only") !== -1, p2only = el._classes.indexOf("of-drink-p2-only") !== -1;
  if (hasBeer) sawBeer = true;
  if (hasWine) sawWine = true;
  if (!hasBeer && !hasWine) sawEmpty = true;
  if ((hasBeer || hasWine) && p1only) sawP1 = true;
  if ((hasBeer || hasWine) && p2only) sawP2 = true;
  if ((hasBeer || hasWine) && !p1only && !p2only) sawBoth = true;
}
ok(sawBeer, "drinks roll: beer appears across showings");
ok(sawWine, "drinks roll: wine appears across showings");
ok(sawEmpty, "drinks roll: sometimes empty-handed (just chatting)");
ok(sawP1 && sawP2 && sawBoth, "drinks roll: p1-only, p2-only AND both-hold-a-drink all occur");

// Named preferences follow the actual holder, not merely the enclosing couple.
function preferenceProbe(couple, preferredIndex, expected) {
  var saw = false, wrong = false;
  for (var n = 0; n < 300; n++) {
    sandbox.officefolks(couple);
    var el = presentEl();
    var empty = el._classes.indexOf("of-beer") === -1 && el._classes.indexOf("of-wine") === -1 && el._classes.indexOf("of-cocktail") === -1;
    var preferredHolds = preferredIndex === 0
      ? el._classes.indexOf("of-drink-p2-only") === -1
      : el._classes.indexOf("of-drink-p1-only") === -1;
    if (!empty && preferredHolds) {
      saw = true;
      if (el._classes.indexOf("of-" + expected) === -1) wrong = true;
    }
  }
  ok(saw && !wrong, couple + ": the preferred holder always receives " + expected);
}
preferenceProbe("spencerjay", 0, "beer");
preferenceProbe("spencerjay", 1, "beer");
preferenceProbe("madlarobert", 0, "wine");
preferenceProbe("farhanglauren", 1, "wine");
preferenceProbe("hamidathena", 1, "wine");

var sawHamidCocktail = false;
for (var h = 0; h < 500; h++) {
  sandbox.officefolks("hamidathena");
  var hamidEl = presentEl();
  if (hamidEl._classes.indexOf("of-drink-p1-only") !== -1 && hamidEl._classes.indexOf("of-cocktail") !== -1) {
    sawHamidCocktail = true;
    break;
  }
}
ok(sawHamidCocktail, "Hamid's random anything-pool includes cocktails");

// 4) rotation varies the couple: many autonomous swaps should surface >1 distinct couple.
sandbox.officefolks(false); // clear
sandbox.__updateOfficeHangout(); // arm the autonomous timer
var seen = {};
for (var r = 0; r < 200; r++) {
  advance(60000); // blow past the longest schedule window each step
  var pc = presentClass();
  if (pc) seen[pc] = (seen[pc] || 0) + 1;
}
var distinct = Object.keys(seen).length;
ok(distinct >= 3, "rotation surfaces multiple distinct couples over time (" + distinct + " seen: " + Object.keys(seen).join(",") + ")");

// 5) one-room exclusion: the office excludes the garden floor, BAR, BALCONY and Cuddly.
sandbox.officefolks(false);
// Ali+Goli on the garden floor:
gardenGuests.querySelector(".g-ali").classList.add("arrived");
gardenGuests.querySelector(".g-goli").classList.add("arrived");
// Spencer+Jay at the bar:
sandbox.__barCoupleNow = function () { return ["spencer", "jay"]; };
// Farhang+Lauren on the balcony:
sandbox.__balconyHangoutNow = function () { return [{ key: "farhang" }, { key: "lauren" }]; };
sandbox.__cuddlyVisitorsNow = function () { return [{ key: "ayushi" }]; };
sandbox.__updateOfficeHangout();
var violated = false, sawSomeone = false;
var EXCLUDED = { ali:1, goli:1, spencer:1, jay:1, farhang:1, lauren:1, ayushi:1 };
for (var q = 0; q < 300; q++) {
  advance(60000);
  var m = sandbox.__officeCoupleNow();
  if (m) {
    sawSomeone = true;
    for (var mi = 0; mi < m.length; mi++) if (EXCLUDED[m[mi]]) violated = true;
  }
}
ok(!violated, "one-room rule holds: office never duplicates anyone from the floor, bar, balcony, or nook");
ok(sawSomeone, "one-room rule still lets eligible couples in (didn't just go permanently empty)");

// forcing an eligible-only pick honors exclusion (officefolks(true) skips excluded)
sandbox.officefolks(false);
for (var t2 = 0; t2 < 40; t2++) { var w2 = sandbox.officefolks(true); if (w2) for (var wi = 0; wi < w2.length; wi++) ok.silentViolation = ok.silentViolation || !!EXCLUDED[w2[wi]]; }
ok(!ok.silentViolation, "officefolks(true) only brings eligible couples");

// 6) teardown strands nothing: reset clears the couple + cancels all timers
sandbox.officefolks("madla"); // someone in, a timer armed
ok(sandbox.__officeCoupleNow() !== null && pendingTimers() > 0, "pre-teardown: a couple is present and a timer is armed");
sandbox.__resetOfficeHangout();
ok(sandbox.__officeCoupleNow() === null, "teardown: no couple present after reset");
ok(pendingTimers() === 0, "teardown: no timers left dangling after reset (" + pendingTimers() + ")");
var anyPresent = officeLayer._children.some(function (e) { return e._classes.indexOf("present") !== -1; });
ok(!anyPresent, "teardown: DOM cleared — no .present couple lingers");
// advancing the clock after teardown does nothing (no re-arm while gate could be closed)
sandbox.__gardenPartyOn = false;
sandbox.__updateOfficeHangout();
advance(120000);
ok(sandbox.__officeCoupleNow() === null && pendingTimers() === 0, "party-off teardown stays torn down (no phantom re-arm)");

// Room changes do not alter party attendance: the silent assignment keeps rotating.
sandbox.__gardenPartyOn = true;
sandbox.currentStageName = "office";
sandbox.__updateOfficeHangout();
advance(60000);
sandbox.currentStageName = "kitchen"; // walked away
sandbox.__updateOfficeHangout();
ok(sandbox.__officeCoupleNow() !== null && pendingTimers() === 1,
  "room leave preserves the office assignment and its single rotation timer");

console.log("\n" + (fails ? (fails + " office-hangout check(s) FAILED") : "All office-hangout checks passed (" + passes + ")"));
process.exit(fails ? 1 : 0);
