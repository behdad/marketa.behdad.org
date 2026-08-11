#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function visual(){return {sway:document.getElementById("garden-guitar").classList.contains("playing"),loops:window.__instrumentVisualLoopState()};}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' window.__goToStage("garden");',
  ' var guitar=document.getElementById("garden-guitar"),audio=document.getElementById("tumbala-song-audio");',
  ' guitar.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(140);',
  ' window.__TRIP_DURATIONS.shrooms=80;window.__startTrip("shrooms");await sleep(160);',
  ' report.steps.afterTrip={paused:audio.paused,level:window.__songLevel(audio),trip:window.__tripState(),visual:visual()};',
  ' window.__fadeSongTo(audio,0,80);await sleep(180);',
  ' report.steps.silent={paused:audio.paused,level:window.__songLevel(audio),visual:visual()};',
  ' window.__setSongLevel(audio,.15);await sleep(120);',
  ' report.steps.restored={paused:audio.paused,level:window.__songLevel(audio),visual:visual()};',
  ' audio.pause();await sleep(80);report.steps.paused={paused:audio.paused,visual:visual()};',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html instrument audio after a trip:");
var result = lib.runPageSync("rsvp.html", HARNESS, 5000, {
  patchRaf: true,
  forceMotion: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.afterTrip && !s.afterTrip.paused && s.afterTrip.level > 0 &&
  !s.afterTrip.trip.active && s.afterTrip.visual.sway && s.afterTrip.visual.loops.notes && s.afterTrip.visual.loops.strings === 1,
  "a completed magic-box trip leaves the audible guitar and its visuals running", s.afterTrip);
check(s.silent && !s.silent.paused && s.silent.level === 0 &&
  !s.silent.visual.sway && !s.silent.visual.loops.notes && s.silent.visual.loops.strings === 0,
  "a zero-level song settles every guitar visual even before transport pauses", s.silent);
check(s.restored && !s.restored.paused && s.restored.level === .15 &&
  s.restored.visual.sway && s.restored.visual.loops.notes && s.restored.visual.loops.strings === 1,
  "raising the still-playing song restores every guitar visual", s.restored);
check(s.paused && s.paused.paused && !s.paused.visual.sway &&
  !s.paused.visual.loops.notes && s.paused.visual.loops.strings === 0,
  "ordinary pause still settles every guitar visual", s.paused);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
