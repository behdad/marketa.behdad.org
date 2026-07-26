#!/usr/bin/env node
// Monitor saver rotation + shared bitmap-loop lifecycle.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.goToStage("office");await sleep(920);',
  ' var mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");mon.classList.remove("show-saver","saver-pipes");',
  ' window.__startMonitorSaver();await sleep(260);var julia=window.__monitorSaverState();',
  ' S("julia",{kind:julia.kind,painted:julia.painted,running:julia.running,pipesClass:mon.classList.contains("saver-pipes")});',
  ' window.__wakeMonitorSaver();window.__startMonitorSaver();await sleep(1150);var pipes=window.__monitorSaverState();',
  ' S("pipes",{kind:pipes.kind,painted:pipes.painted,running:pipes.running,segments:pipes.segments,pipesClass:mon.classList.contains("saver-pipes")});',
  ' window.__wakeMonitorSaver();window.__startMonitorSaver();await sleep(420);var flower=window.__monitorSaverState();',
  ' S("flower",{kind:flower.kind,painted:flower.painted,running:flower.running,backend:flower.backend,flowerClass:mon.classList.contains("saver-flower")});',
  ' window.goToStage("garden");await sleep(80);S("parked",{running:window.__monitorSaverLoopRunning(),state:window.__monitorSaverState()});',
  '}',
  '})();</script>'
].join("\n");

var REDUCED_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>window.addEventListener("load",function(){setTimeout(function(){',
  'window.goToStage("office");var mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");',
  'window.__startMonitorSaver("flower");document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,state:window.__monitorSaverState()});',
  '},350);});</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  \u2713 " + message);
  else {
    failures++;
    console.log("  \u2717 " + message);
    if (detail) console.log("      " + JSON.stringify(detail));
  }
}

console.log("rsvp.html monitor screensavers:");
var r = lib.runPageSync("rsvp.html", HARNESS, 4000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true
});
check(r && r.errors.length === 0, "both savers run without uncaught errors", r && r.errors);
check(r && r.steps.julia.kind === "julia" && r.steps.julia.painted &&
  r.steps.julia.running && !r.steps.julia.pipesClass,
  "first idle cycle paints Julia through its selected SVG image", r && r.steps.julia);
check(r && r.steps.pipes.kind === "pipes" && r.steps.pipes.painted &&
  r.steps.pipes.running && r.steps.pipes.segments >= 5 &&
  r.steps.pipes.pipesClass,
  "next idle cycle grows Pipes and selects its SVG image", r && r.steps.pipes);
check(r && r.steps.flower.kind === "flower" && r.steps.flower.painted &&
  r.steps.flower.running && /^(webgl|canvas)$/.test(r.steps.flower.backend || "") &&
  r.steps.flower.flowerClass,
  "third idle cycle paints Flower Box through WebGL or its fallback", r && r.steps.flower);
check(r && !r.steps.parked.running,
  "the shared saver loop stops when the office is parked", r && r.steps.parked);
var reduced = lib.runPageSync("rsvp.html", REDUCED_HARNESS, 1200, {
  patchRaf: true,
  forceReduce: true,
  seedRandom: true
});
check(reduced && reduced.errors.length === 0 && reduced.state.kind === "flower" &&
  reduced.state.painted && !reduced.state.running &&
  /^(webgl|canvas)$/.test(reduced.state.backend || ""),
  "reduced motion gets a complete static Flower Box frame without a live loop",
  reduced && reduced.state);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
