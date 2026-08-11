#!/usr/bin/env node
// Focused recovery-cover ownership for the autonomous nighttime cricket chirps.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-60000,progress:{room:"kitchen",maxUnlocked:1,solvedRooms:["kitchen"],seenRooms:["kitchen"],phase2:false,party:false,daylight:false,bbq:false},puzzle:{},phone:null,album:null,systems:{}};',
  'if(!sessionStorage.getItem("checkpoint-crickets-seeded")){sessionStorage.setItem("checkpoint-crickets-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:window.__errs,steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' window.__balconyStorm=false;',
  ' var gate=document.getElementById("loft-recovery-gate");if(!gate)throw new Error("missing recovery gate");',
  ' var chirp=window.__playCricketChirp();report.steps.started={state:window.__cricketAmbienceState(),live:!!(chirp&&chirp.active),gain:chirp&&chirp.master.gain.value};',
  ' window.__refreshRoomAmbience();report.steps.covered={state:window.__cricketAmbienceState(),live:!!(chirp&&chirp.active),gain:chirp&&chirp.master.gain.value,covered:window.__roomAmbienceCovered()};',
  ' await sleep(3400);report.steps.waited=window.__cricketAmbienceState();',
  ' gate.querySelector(".loft-recovery-btn.primary").click();await sleep(650);',
  ' report.steps.continued={gate:!!document.getElementById("loft-recovery-gate"),room:window.__currentStageName,state:window.__cricketAmbienceState(),covered:window.__roomAmbienceCovered()};',
  ' var resumed=window.__playCricketChirp();report.steps.resumed={state:window.__cricketAmbienceState(),live:!!(resumed&&resumed.active)};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},250);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("loft-day.html checkpoint cricket ambience:");
var report = lib.runPageSync("loft-day.html", HARNESS, 5200, {
  forceMotion: true,
  patchRaf: true,
  seedRandom: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required",
  urlSuffix: "?date=2027-02-14&time=22:30"
});

check(!!report, "harness produced a report", report);
if (!report) process.exit(1);
check(report.errors.length === 0, "no uncaught page errors", report.errors);
var steps = report.steps;
check(steps.started && steps.started.live && steps.started.state.active > 0,
  "the probe starts with a live nighttime cricket chirp", steps.started);
check(steps.covered && steps.covered.covered && !steps.covered.live &&
  steps.covered.gain === 0 && steps.covered.state.active === 0 && !steps.covered.state.allowed,
  "the recovery ambience refresh immediately silences and retires an in-flight chirp", steps.covered);
check(steps.waited && steps.waited.active === 0 && !steps.waited.allowed,
  "autonomous cricket ticks stay silent while the recovery choice remains open", steps.waited);
check(steps.continued && !steps.continued.gate && steps.continued.room === "kitchen" &&
  !steps.continued.covered && steps.continued.state.allowed,
  "Continue removes the cover only after restored nighttime play is ready", steps.continued);
check(steps.resumed && steps.resumed.live && steps.resumed.state.active > 0 && steps.resumed.state.allowed,
  "fresh cricket chirps are eligible again after Continue", steps.resumed);

console.log("");
if (failures) {
  console.log(failures + " checkpoint cricket assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Checkpoint cricket assertions passed.");
