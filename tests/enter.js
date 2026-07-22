#!/usr/bin/env node
// Keyboard room-control test: Enter is "do the next thing in this room."
//   - UNSOLVED room  -> Enter presses the next step of that room's solve sequence, so
//     repeated Enter solves the room and moves on (kitchen espresso, garden water/music/
//     candles, cuddly octopus/open-balcony-door/blanket, office call/hang-up/monitor/dismiss/
//     lamps/butterfly).
//   - SOLVED room    -> Enter fires that room's toy toggle: kitchen day/night (kitchen<->bar),
//     garden party, cuddly projector channel, office monitor zoom.
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
  "  function enter(){ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})); }",
  "  function dusk(){var b=document.getElementById('stage-balcony');return !!(b&&b.classList.contains('dusk'));}",
  "  function proj(){var w=document.getElementById('cuddly-wallscreen');return w?(w.getAttribute('class')||''):null;}",
  "  var report={errors:[],reached:{},solvedFinalIdx:null,toggles:{}};",
  "  async function pressUntil(idx,maxPresses,gap){var i=0;for(;i<maxPresses&&window.currentStageIndex===idx;i++){enter();await sleep(gap);}return i;}",
  "  async function run(){",
  // ── Part 1: Enter alone walks every room's solve and reaches the balcony ──
  "    window.goToStage('kitchen');await sleep(300);",
  "    report.reached.kitchen=await pressUntil(0,25,1500);report.after0=window.currentStageIndex;", // espresso: power/warmup/grind/tamp/brew/sip
  "    window.goToStage('garden');var gg=document.getElementById('garden-guitar'),gu=document.getElementById('garden-ukulele'),gc=0,uc=0;if(gg)gg.addEventListener('click',function(){gc++;});if(gu)gu.addEventListener('click',function(){uc++;});enter();await sleep(700);enter();await sleep(700);report.gardenEnterGuitar=(gc===1&&uc===0);report.reached.garden=2+await pressUntil(1,10,700);report.after1=window.currentStageIndex;",
  "    window.goToStage('cuddly');report.reached.cuddly=await pressUntil(2,12,900);report.after2=window.currentStageIndex;",
  "    window.goToStage('office');await sleep(400);report.reached.office=await pressUntil(3,25,1500);await sleep(2500);report.after3=window.currentStageIndex;",
  "    report.solvedFinalIdx=window.currentStageIndex;",
  // ── Part 2: in each now-solved room, Enter fires the toy toggle ──
  "    window.goToStage('kitchen');await sleep(300);var d0=dusk();enter();await sleep(500);report.toggles.kitchenDayNight=(d0!==dusk());",
  "    window.goToStage('garden');await sleep(300);var p0=!!(window.party&&window.party());enter();await sleep(500);report.toggles.gardenParty=(p0!==!!(window.party&&window.party()));",
  "    window.goToStage('cuddly');await sleep(400);var c0=proj();enter();await sleep(600);var c1=proj();enter();await sleep(600);var c2=proj();report.toggles.cuddlyProjector=((c0!==c1)&&(c1!==c2));",
  "    window.goToStage('office');await sleep(400);var zs=[];for(var k=0;k<3;k++){enter();await sleep(500);zs.push(!!(window.__monitorZoomed&&window.__monitorZoomed()));}report.toggles.officeZoom=(zs.indexOf(true)>=0);", // a saver-wake may eat the first press; zoom must appear within 3
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
  if (r.solvedFinalIdx === 4) pass("Enter alone walks every room's solve and reaches the balcony");
  else fail("Enter walks the whole game to the balcony", "stage progression: " + JSON.stringify({ after0: r.after0, after1: r.after1, after2: r.after2, after3: r.after3, reached: r.reached }));
  if (r.gardenEnterGuitar) pass("garden music step: Enter clicks the guitar, not the ukulele");
  else fail("garden music step: Enter clicks the guitar, not the ukulele");
  if (r.toggles.kitchenDayNight) pass("solved kitchen: Enter toggles day/night (kitchen ⇄ bar)");
  else fail("solved kitchen: Enter toggles day/night");
  if (r.toggles.gardenParty) pass("solved garden: Enter toggles the party");
  else fail("solved garden: Enter toggles the party");
  if (r.toggles.cuddlyProjector) pass("solved cuddly: Enter cycles the projector channel");
  else fail("solved cuddly: Enter cycles the projector channel (regression: __cuddlyDoNext must return null once the blanket is done)");
  if (r.toggles.officeZoom) pass("solved office: Enter toggles the monitor zoom");
  else fail("solved office: Enter toggles the monitor zoom");
  if (r.errors.length === 0) pass("no uncaught JS errors across the entire run");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }
