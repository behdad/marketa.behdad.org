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
  ' var initialParking=parking();S("initial",{visible:visibleRooms(),gardenVisibility:getComputedStyle(garden).visibility,state:garden.classList.contains("perf-state-probe")&&garden.style.getPropertyValue("--perf-state")==="kept",paused:initialParking.reduce(function(n,x){return n+x.paused_css_animations;},0),currentPaused:(initialParking.filter(function(x){return x.room==="kitchen";})[0]||{}).paused_css_animations||0});',
  ' window.__secondRound=true;if(window.__refreshStageAnimationParking)window.__refreshStageAnimationParking();await sleep(80);S("phase2",{paused:parking().reduce(function(n,x){return n+x.paused_css_animations;},0)});',
  ' window.goToStage("balcony");S("crossing",{visible:visibleRooms()});await sleep(920);S("balcony",{visible:visibleRooms(),state:garden.classList.contains("perf-state-probe")&&garden.style.getPropertyValue("--perf-state")==="kept"});',
  ' window.goToStage("office");await sleep(920);var mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");if(window.__monitorZoomIn)window.__monitorZoomIn();await sleep(40);S("zoomed",{zoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed"),origin:document.getElementById("loft-game-strip").style.transformOrigin});',
  ' window.goToStage("kitchen");var strip=document.getElementById("loft-game-strip");S("zoom_handoff",{zoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed"),origin:strip.style.transformOrigin,transform:strip.style.transform});await sleep(920);S("settled",{visible:visibleRooms(),monitorSaver:window.__monitorSaverLoopRunning&&window.__monitorSaverLoopRunning(),laptopSaver:window.__laptopSaverLoopRunning&&window.__laptopSaverLoopRunning(),eq:window.__monitorEqLoopRunning&&window.__monitorEqLoopRunning(),headphones:window.__headphoneBeatLoopRunning&&window.__headphoneBeatLoopRunning()});',
  ' window.goToStage("garden");document.getElementById("garden-guitar").dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(80);S("instrument_garden",window.__instrumentVisualLoopState());',
  ' window.goToStage("office");await sleep(80);S("instrument_parked",window.__instrumentVisualLoopState());',
  ' window.goToStage("garden");await sleep(80);S("instrument_return",window.__instrumentVisualLoopState());document.getElementById("guitar-song-audio").pause();',
  ' window.trip("shrooms");await sleep(80);S("bloom_garden",window.__tripBloomLoopRunning());window.goToStage("office");await sleep(80);S("bloom_parked",window.__tripBloomLoopRunning());window.goToStage("garden");await sleep(80);S("bloom_return",window.__tripBloomLoopRunning());',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html scene performance:");
var r = lib.runPageSync("rsvp.html", HARNESS, 6000, { patchRaf: true, forceMotion: true, chromeFlags: "--autoplay-policy=no-user-gesture-required" });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.initial.visible.join("|") === "kitchen" && s.initial.gardenVisibility === "hidden", "only the current room paints at rest", s.initial);
check(s.initial.state && s.initial.paused > 0 && s.initial.currentPaused === 0, "hidden rooms preserve SVG state and pause their CSS timelines from the opening frame", s.initial);
check(s.phase2.paused > 0, "phase two keeps parked CSS timelines paused", s.phase2);
check(s.crossing.visible.join("|") === "kitchen|garden|cuddly|office|balcony", "a direct kitchen-to-balcony pan keeps every traversed room visible", s.crossing);
check(s.balcony.visible.join("|") === "balcony" && s.balcony.state, "the settled pan reparks other rooms without resetting their state", s.balcony);
check(s.zoomed.zoomed && !!s.zoomed.origin, "monitor zoom owns the strip before room navigation", s.zoomed);
check(!s.zoom_handoff.zoomed && !s.zoom_handoff.origin && s.zoom_handoff.transform === "translateX(0%)", "room navigation collapses zoom before taking over the strip transform", s.zoom_handoff);
check(s.settled.visible.join("|") === "kitchen" && !s.settled.monitorSaver && !s.settled.laptopSaver && !s.settled.eq && !s.settled.headphones, "office-only visual loops are stopped off-room", s.settled);
check(s.instrument_garden.notes && s.instrument_garden.strings === 1, "garden instrument visuals run beside their playing instrument", s.instrument_garden);
check(!s.instrument_parked.notes && s.instrument_parked.strings === 0, "garden instrument timers and rAF stop in a parked room", s.instrument_parked);
check(s.instrument_return.notes && s.instrument_return.strings === 1, "garden instrument visuals resume from live audio state on return", s.instrument_return);
check(s.bloom_garden && !s.bloom_parked && s.bloom_return, "garden trip fractals pause off-room and resume without rebuilding", { garden: s.bloom_garden, parked: s.bloom_parked, returned: s.bloom_return });

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
