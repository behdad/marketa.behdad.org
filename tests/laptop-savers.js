#!/usr/bin/env node
// Laptop saver fixed-order rotation + attended lifecycle.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'var focused=true;Object.defineProperty(document,"hasFocus",{configurable:true,value:function(){return focused;}});',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.goToStage("office");await sleep(920);window.resetLaptop();',
  ' var laptop=document.getElementById("office-laptop");laptop.classList.add("open");',
  ' var sequence=[];window.__startLaptopSaver();await sleep(60);sequence.push(window.__laptopSaverState());window.__cycleLaptopSaver();await sleep(60);sequence.push(window.__laptopSaverState());window.__cycleLaptopSaver();await sleep(60);sequence.push(window.__laptopSaverState());S("sequence",sequence);',
  ' var sleepState=sequence.filter(function(x){return x.kind==="sleep";})[0];S("scene",{sleepClass:laptop.classList.contains("saver-sleep"),behdad:document.querySelectorAll("#laptop-saver-zzz-behdad .laptop-saver-z").length,marketa:document.querySelectorAll("#laptop-saver-zzz-marketa .laptop-saver-z").length,people:document.querySelectorAll("#laptop-saver-sleeping-behdad,#laptop-saver-sleeping-marketa").length,sleepState:sleepState});',
  ' window.__startLaptopSaver("caps");await sleep(60);var beforeBlur=window.__laptopSaverState();focused=false;window.dispatchEvent(new Event("blur"));await sleep(20);var blurred=window.__laptopSaverState();focused=true;window.dispatchEvent(new Event("focus"));await sleep(20);var refocused=window.__laptopSaverState();S("focus",{before:beforeBlur,blurred:blurred,refocused:refocused});',
  ' window.__startLaptopSaver("sleep");await sleep(20);window.goToStage("garden");await sleep(20);var parked=window.__laptopSaverState();window.goToStage("office");await sleep(20);var returned=window.__laptopSaverState();S("room",{parked:parked,returned:returned});',
  ' window.resetLaptop();await sleep(20);S("reset",{state:window.__laptopSaverState(),show:laptop.classList.contains("show-saver"),sleep:laptop.classList.contains("saver-sleep")});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
    if (detail) console.log("      " + JSON.stringify(detail));
  }
}

console.log("rsvp.html laptop screensavers:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3500, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true
});
check(r && r.errors.length === 0, "the saver reel runs without uncaught errors", r && r.errors);
var sequence = r && r.steps.sequence || [], order = sequence[0] && sequence[0].order || [];
check(sequence.length === 3 && order.length === 2 &&
  order.slice().sort().join("|") === "caps|sleep" &&
  sequence[0].kind === order[0] && sequence[1].kind === order[1] && sequence[2].kind === order[0] &&
  sequence.every(function (state) { return state.order.join("|") === order.join("|") && state.cycling; }),
  "the once-shuffled order stays fixed across a complete wrap", sequence);
check(order.filter(function (kind) { return kind === "sleep"; }).length * 2 === order.length,
  "the fixed reel gives the sleeping scene half of its equal-duration slots", order);
check(r && r.steps.scene && r.steps.scene.behdad === 3 && r.steps.scene.marketa === 3 &&
  r.steps.scene.people === 2 && r.steps.scene.sleepState && r.steps.scene.sleepState.kind === "sleep",
  "the sleeping saver includes both people and a three-Z trail for each", r && r.steps.scene);
check(r && r.steps.focus && r.steps.focus.before.running && r.steps.focus.before.cycling &&
  !r.steps.focus.blurred.running && !r.steps.focus.blurred.cycling &&
  r.steps.focus.refocused.running && r.steps.focus.refocused.cycling &&
  r.steps.focus.blurred.remaining <= r.steps.focus.before.remaining &&
  r.steps.focus.refocused.remaining <= r.steps.focus.blurred.remaining,
  "blur pauses both the caps frame and the reel timeout, then focus resumes them", r && r.steps.focus);
check(r && r.steps.room && !r.steps.room.parked.running && !r.steps.room.parked.cycling &&
  r.steps.room.parked.kind === "sleep" && !r.steps.room.returned.running &&
  r.steps.room.returned.cycling && r.steps.room.returned.kind === "sleep",
  "leaving the Office parks the reel on its exact scene and returning resumes it", r && r.steps.room);
check(r && r.steps.reset && !r.steps.reset.show && !r.steps.reset.sleep &&
  !r.steps.reset.state.kind && !r.steps.reset.state.running && !r.steps.reset.state.cycling,
  "laptop reset clears the selected saver, frame, and cycle timeout", r && r.steps.reset);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
