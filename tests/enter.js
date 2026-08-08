#!/usr/bin/env node
// Keyboard room-control test: Enter is "do the next thing in this room". Escape/Backspace are
// always dismiss/back controls and never advance a solve walker; after the party unlocks phase two,
// Enter launches each room's main activity.
//   - UNSOLVED room  -> Enter presses the next step of that room's solve sequence, so
//     repeated Enter solves the room and moves on (kitchen espresso, garden water/music/
//     candles, cuddly octopus/open-balcony-door/blanket, office call/hang-up/monitor/dismiss/
//     lamps/butterfly).
//   - PHASE TWO      -> Enter starts Flair Catch / toggles the Garden party / starts Octi's Escape /
//     starts Alien Resources / starts Block Party; Escape/Backspace remain pure dismiss gestures.
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
  "  var report={errors:[],introKeys:{},reached:{},solvedFinalIdx:null,phaseTwoActions:{}};",
  "  async function pressUntil(idx,maxPresses,gap){var i=0;for(;i<maxPresses&&window.currentStageIndex===idx;i++){enter();await sleep(gap);}return i;}",
  "  async function run(){",
  "    for (var ik=0,keys=[['Enter','Enter'],['Escape','Escape'],['Backspace','Backspace'],['Space',' ']];ik<keys.length;ik++){if(window.__showHuntIntro)window.__showHuntIntro();await sleep(40);key(keys[ik][1]);await sleep(80);var machine=document.getElementById('kitchen-lamarzocco');report.introKeys[keys[ik][0]]=!document.getElementById('click-me-overlay')&&window.__gameStarted()&&!(machine&&machine.classList.contains('powered-on'));}",
  // ── Part 1: Enter alone walks every room's solve and reaches the balcony ──
  "    window.goToStage('kitchen');await sleep(300);",
  "    report.reached.kitchen=await pressUntil(0,25,1500);report.after0=window.currentStageIndex;", // espresso: power/warmup/grind/tamp/brew/sip
  "    window.goToStage('garden');var gg=document.getElementById('garden-guitar'),gu=document.getElementById('garden-ukulele'),gc=0,uc=0;if(gg)gg.addEventListener('click',function(){gc++;});if(gu)gu.addEventListener('click',function(){uc++;});enter();await sleep(700);enter();await sleep(700);report.gardenEnterGuitar=(gc===1&&uc===0);report.reached.garden=2+await pressUntil(1,10,700);report.after1=window.currentStageIndex;",
  "    window.goToStage('cuddly');report.reached.cuddly=await pressUntil(2,12,900);report.after2=window.currentStageIndex;",
  "    window.goToStage('office');await sleep(400);report.reached.office=await pressUntil(3,25,1500);await sleep(2500);report.after3=window.currentStageIndex;",
  "    report.solvedFinalIdx=window.currentStageIndex;",
  // ── Part 2: phase-two Enter launches each room's main activity; Escape closes it or stays inert ──
  "    if(window.party)window.party(true);await sleep(500);report.phaseTwo=!!window.__secondRound;",
  "    window.goToStage('kitchen');await sleep(300);enter();await sleep(200);report.phaseTwoActions.flairStart=!!(window.__flairState&&window.__flairState().active);key('Escape');await sleep(120);key('Backspace');await sleep(120);report.phaseTwoActions.flairClosed=!!(window.__flairState&&!window.__flairState().active);",
  "    window.goToStage('garden');await sleep(300);var partyBefore=!!(window.party&&window.party());enter();await sleep(200);var pac=window.__pacmanPresentation&&window.__pacmanPresentation();report.phaseTwoActions.partyToggled=partyBefore&&!window.party()&&!!(pac&&!pac.mode);",
  "    window.goToStage('cuddly');await sleep(300);enter();await sleep(120);report.phaseTwoActions.octiStart=!!(window.__octiEscapeState&&window.__octiEscapeState().active);key('Escape');await sleep(120);report.phaseTwoActions.octiClosed=!!(window.__octiEscapeState&&!window.__octiEscapeState().active);",
  "    window.goToStage('office');await sleep(300);enter();await sleep(120);report.phaseTwoActions.invadersStart=!!(window.__arcadeState&&window.__arcadeState().active);key('Escape');await sleep(120);report.phaseTwoActions.invadersClosed=!!(window.__arcadeState&&!window.__arcadeState().active);",
  "    if(window.__monitorZoomIn)window.__monitorZoomIn();await sleep(180);enter();await sleep(120);report.phaseTwoActions.monitorZoomSafe=!!(window.__monitorZoomed&&window.__monitorZoomed())&&!!(window.__arcadeState&&!window.__arcadeState().active);if(window.__monitorZoomOut)window.__monitorZoomOut();await sleep(450);",
  "    if(window.__laptopZoomIn)window.__laptopZoomIn();await sleep(180);enter();await sleep(120);report.phaseTwoActions.laptopZoomSafe=!!(window.__laptopZoomed&&window.__laptopZoomed())&&!!(window.__arcadeState&&!window.__arcadeState().active);if(window.__monitorZoomOut)window.__monitorZoomOut();await sleep(450);",
  "    if(window.phone)window.phone(true);await sleep(180);enter();await sleep(120);report.phaseTwoActions.phoneOpenSafe=!!(window.phone&&window.phone())&&!!(window.__arcadeState&&!window.__arcadeState().active);if(window.phone)window.phone(false);await sleep(180);",
  "    window.goToStage('balcony');await sleep(300);enter();await sleep(120);report.phaseTwoActions.tetrisStart=!!(window.__balconyTetrisState&&window.__balconyTetrisState().active);key('Escape');await sleep(120);report.phaseTwoActions.tetrisClosed=!!(window.__balconyTetrisState&&!window.__balconyTetrisState().active);",
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
  if (r.introKeys.Enter && r.introKeys.Escape && r.introKeys.Backspace && r.introKeys.Space) pass("Enter, Escape, Backspace, and Space dismiss CLICK ME without operating the room");
  else fail("Enter, Escape, Backspace, and Space dismiss CLICK ME without operating the room", JSON.stringify(r.introKeys));
  if (r.solvedFinalIdx === 4) pass("Enter alone walks every room's solve and reaches the balcony");
  else fail("Enter walks the whole game to the balcony", "stage progression: " + JSON.stringify({ after0: r.after0, after1: r.after1, after2: r.after2, after3: r.after3, reached: r.reached }));
  if (r.gardenEnterGuitar) pass("garden music step: Enter clicks the guitar, not the ukulele");
  else fail("garden music step: Enter clicks the guitar, not the ukulele");
  var p2 = r.phaseTwoActions || {};
  if (r.phaseTwo && p2.flairStart && p2.flairClosed && p2.partyToggled &&
      p2.octiStart && p2.octiClosed && p2.invadersStart && p2.invadersClosed &&
      p2.monitorZoomSafe && p2.laptopZoomSafe && p2.phoneOpenSafe &&
      p2.tetrisStart && p2.tetrisClosed)
    pass("phase-two Enter launches each room's main activity without stealing Enter from a zoomed office screen");
  else fail("phase-two room activities follow the Enter mapping", JSON.stringify(p2));
  if (r.errors.length === 0) pass("no uncaught JS errors across the entire run");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }
