#!/usr/bin/env node
// Focused scene-performance contracts: parked SVG state, party animation pausing,
// direct multi-room pans, and device-zoom ownership of the shared strip transform.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function parking(){return window.__stageParkingState?window.__stageParkingState():[];}',
  'function visibleRooms(){return parking().filter(function(x){return !x.parked;}).map(function(x){return x.room;});}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' var garden=document.getElementById("stage-garden");garden.classList.add("perf-state-probe");garden.style.setProperty("--perf-state","kept");',
  ' S("initial",{visible:visibleRooms(),gardenVisibility:getComputedStyle(garden).visibility,state:garden.classList.contains("perf-state-probe")&&garden.style.getPropertyValue("--perf-state")==="kept",paused:parking().reduce(function(n,x){return n+x.paused_css_animations;},0)});',
  ' window.__secondRound=true;if(window.__refreshStageAnimationParking)window.__refreshStageAnimationParking();await sleep(80);S("phase2",{paused:parking().reduce(function(n,x){return n+x.paused_css_animations;},0)});',
  ' window.goToStage("balcony");S("crossing",{visible:visibleRooms()});await sleep(920);S("balcony",{visible:visibleRooms(),state:garden.classList.contains("perf-state-probe")&&garden.style.getPropertyValue("--perf-state")==="kept"});',
  ' window.goToStage("office");await sleep(920);var mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");if(window.__monitorZoomIn)window.__monitorZoomIn();await sleep(40);S("zoomed",{zoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed"),origin:document.getElementById("loft-game-strip").style.transformOrigin});',
  ' window.goToStage("kitchen");var strip=document.getElementById("loft-game-strip");S("zoom_handoff",{zoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed"),origin:strip.style.transformOrigin,transform:strip.style.transform});await sleep(920);S("settled",{visible:visibleRooms(),monitorSaver:window.__monitorSaverLoopRunning&&window.__monitorSaverLoopRunning(),laptopSaver:window.__laptopSaverLoopRunning&&window.__laptopSaverLoopRunning(),eq:window.__monitorEqLoopRunning&&window.__monitorEqLoopRunning(),headphones:window.__headphoneBeatLoopRunning&&window.__headphoneBeatLoopRunning()});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html scene performance:");
var r = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true, forceMotion: true });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.initial.visible.join("|") === "kitchen" && s.initial.gardenVisibility === "hidden", "only the current room paints at rest", s.initial);
check(s.initial.state && s.initial.paused === 0, "phase-one hiding preserves SVG class/style state without animation-enumeration overhead", s.initial);
check(s.phase2.paused > 0, "phase two pauses CSS timelines in parked rooms", s.phase2);
check(s.crossing.visible.join("|") === "kitchen|garden|cuddly|office|balcony", "a direct kitchen-to-balcony pan keeps every traversed room visible", s.crossing);
check(s.balcony.visible.join("|") === "balcony" && s.balcony.state, "the settled pan reparks other rooms without resetting their state", s.balcony);
check(s.zoomed.zoomed && !!s.zoomed.origin, "monitor zoom owns the strip before room navigation", s.zoomed);
check(!s.zoom_handoff.zoomed && !s.zoom_handoff.origin && s.zoom_handoff.transform === "translateX(0%)", "room navigation collapses zoom before taking over the strip transform", s.zoom_handoff);
check(s.settled.visible.join("|") === "kitchen" && !s.settled.monitorSaver && !s.settled.laptopSaver && !s.settled.eq && !s.settled.headphones, "office-only visual loops are stopped off-room", s.settled);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
