#!/usr/bin/env node
// Keyboard room-control test: Enter is "do the next thing in this room"; an
// unconsumed room-level Escape/Backspace uses the same action during phase one; after the party
// unlocks phase two they remain dismiss/back gestures and never operate a room.
//   - UNSOLVED room  -> Enter presses the next step of that room's solve sequence, so
//     repeated Enter solves the room and moves on (kitchen espresso, garden water/music/
//     candles, cuddly octopus/open-balcony-door/blanket, office call/hang-up/monitor/dismiss/
//     lamps/butterfly).
//   - PHASE TWO      -> all rooms are already unlocked, so Enter stops auto-operating room toys
//     and Escape/Backspace remain pure dismiss/back gestures.
// Drives ONLY the document-level Enter (the capture-phase handler), never per-element clicks,
// so it guards the whole walk + toggle wiring. Same one-shot headless runner as play.js.
//
// Usage: node tests/enter.js
"use strict";

var lib = require("./lib");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  function key(k){ document.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true})); }",
  "  function enter(){ key('Enter'); }",
  "  function dusk(){var b=document.getElementById('stage-balcony');return !!(b&&b.classList.contains('dusk'));}",
  "  function proj(){var w=document.getElementById('cuddly-wallscreen');return w?(w.getAttribute('class')||''):null;}",
  "  var report={errors:[],introKeys:{},reached:{},solvedFinalIdx:null,toggles:{}};",
  "  async function pressUntil(idx,maxPresses,gap){var i=0;for(;i<maxPresses&&window.currentStageIndex===idx;i++){enter();await sleep(gap);}return i;}",
  "  async function run(){",
  "    for (var ik=0,keys=['Enter','Escape','Backspace'];ik<keys.length;ik++){if(window.__showHuntIntro)window.__showHuntIntro();await sleep(40);key(keys[ik]);await sleep(80);var machine=document.getElementById('kitchen-lamarzocco');report.introKeys[keys[ik]]=!document.getElementById('click-me-overlay')&&window.__gameStarted()&&!(machine&&machine.classList.contains('powered-on'));}",
  // ── Part 1: Enter alone walks every room's solve and reaches the balcony ──
  "    window.goToStage('kitchen');await sleep(300);",
  "    report.reached.kitchen=await pressUntil(0,25,1500);report.after0=window.currentStageIndex;", // espresso: power/warmup/grind/tamp/brew/sip
  "    window.goToStage('garden');var gg=document.getElementById('garden-guitar'),gu=document.getElementById('garden-ukulele'),gc=0,uc=0;if(gg)gg.addEventListener('click',function(){gc++;});if(gu)gu.addEventListener('click',function(){uc++;});enter();await sleep(700);enter();await sleep(700);report.gardenEnterGuitar=(gc===1&&uc===0);report.reached.garden=2+await pressUntil(1,10,700);report.after1=window.currentStageIndex;",
  "    window.goToStage('cuddly');report.reached.cuddly=await pressUntil(2,12,900);report.after2=window.currentStageIndex;",
  "    window.goToStage('office');await sleep(400);report.reached.office=await pressUntil(3,25,1500);await sleep(2500);report.after3=window.currentStageIndex;",
  "    report.solvedFinalIdx=window.currentStageIndex;",
  // ── Part 2: after the party unlocks phase two, room-action keys become inert ──
  "    if(window.party)window.party(true);await sleep(500);report.phaseTwo=!!window.__secondRound;",
  "    window.goToStage('kitchen');await sleep(300);var d0=dusk();enter();await sleep(300);var d1=dusk();key('Escape');await sleep(300);var d2=dusk();key('Backspace');await sleep(300);var d3=dusk();report.toggles.kitchenIdle=(d0===d1&&d1===d2&&d2===d3);",
  "    window.goToStage('garden');await sleep(300);var p0=!!(window.party&&window.party());enter();await sleep(300);report.toggles.gardenIdle=(p0===!!(window.party&&window.party()));",
  "    window.goToStage('cuddly');await sleep(300);var c0=proj();enter();await sleep(300);report.toggles.cuddlyIdle=(c0===proj());",
  "    window.goToStage('office');await sleep(300);var z0=!!(window.__monitorZoomed&&window.__monitorZoomed());enter();await sleep(300);report.toggles.officeIdle=(z0===!!(window.__monitorZoomed&&window.__monitorZoomed()));",
  "  }",
  "  window.addEventListener('load',function(){setTimeout(function(){run().catch(function(e){window.__errs.push('harness:'+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(report);});},400);});",
  "})();",
  "</script>"
].join("\n");

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) { failures++; console.log("  ✗ " + msg); if (detail) console.log("      " + String(detail).split("\n").join("\n      ")); }

console.log("rsvp.html keyboard room-control (Enter):");
var r = lib.runPageSync("rsvp.html", HARNESS, 75000, { patchRaf: true });
if (!r) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  if (r.introKeys.Enter && r.introKeys.Escape && r.introKeys.Backspace) pass("Enter, Escape, and Backspace dismiss CLICK ME without operating La Maz");
  else fail("Enter, Escape, and Backspace dismiss CLICK ME without operating La Maz", JSON.stringify(r.introKeys));
  if (r.solvedFinalIdx === 4) pass("Enter alone walks every room's solve and reaches the balcony");
  else fail("Enter walks the whole game to the balcony", "stage progression: " + JSON.stringify({ after0: r.after0, after1: r.after1, after2: r.after2, after3: r.after3, reached: r.reached }));
  if (r.gardenEnterGuitar) pass("garden music step: Enter clicks the guitar, not the ukulele");
  else fail("garden music step: Enter clicks the guitar, not the ukulele");
  if (r.phaseTwo && r.toggles.kitchenIdle && r.toggles.gardenIdle && r.toggles.cuddlyIdle && r.toggles.officeIdle)
    pass("phase-two Enter, Escape, and Backspace do not operate room solves or toys");
  else fail("phase-two room-action keys stay inert", JSON.stringify(r.toggles));
  if (r.errors.length === 0) pass("no uncaught JS errors across the entire run");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }
