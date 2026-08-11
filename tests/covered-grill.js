#!/usr/bin/env node
// Covered balcony grill: the cover comes off on the first click, then clicks toggle the lid.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'var dust=0,baseWisps;',
  'function grill(){return document.getElementById("balcony-coveredgrill");}',
  'function st(){var q=window.__coveredGrillState(),g=grill();return {uncovered:q.uncovered,open:q.open,uncoveredClass:g.classList.contains("uncovered"),openClass:g.classList.contains("real-lid-open"),opacity:getComputedStyle(g).opacity,animation:getComputedStyle(g).animationName,dust:dust};}',
  'function fire(type,detail){grill().dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,detail:detail||1}));}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' baseWisps=window.__spawnSteamWisps;window.__spawnSteamWisps=function(){dust++;};',
  ' S("initial",st());fire("click");await sleep(340);S("uncovered",st());',
  ' fire("click");await sleep(340);S("lidOpen",st());',
  ' fire("click");await sleep(340);S("lidClosed",st());',
  ' window.__startBBQ("test");var smoker=document.getElementById("balcony-smoker");S("bbq",{cover:st(),smoking:smoker.classList.contains("smoking"),smokerOpen:smoker.classList.contains("open")});',
  ' window.__activateExtinguisher();await sleep(1300);S("reset",st());',
  ' window.__spawnSteamWisps=baseWisps;',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html covered balcony grill:");
var result = lib.runPageSync("rsvp.html", HARNESS, 6500, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.initial && !s.initial.uncovered && !s.initial.open, "the fitted cover and closed real lid are the initial state", s.initial);
check(s.uncovered && s.uncovered.uncovered && s.uncovered.uncoveredClass && !s.uncovered.open &&
      s.uncovered.opacity === "1" && s.uncovered.animation === "none",
  "one click removes the fitted cover", s.uncovered);
check(s.lidOpen && s.lidOpen.uncovered && s.lidOpen.open && s.lidOpen.openClass,
  "an uncovered single click opens the real lid", s.lidOpen);
check(s.lidClosed && s.lidClosed.uncovered && !s.lidClosed.open && !s.lidClosed.openClass,
  "the next uncovered single click closes the real lid", s.lidClosed);
check(s.bbq && s.bbq.cover.uncovered && !s.bbq.cover.open && s.bbq.smoking && s.bbq.smokerOpen,
  "starting the BBQ leaves the uncovered quiet grill closed", s.bbq);
check(s.reset && !s.reset.uncovered && !s.reset.open && !s.reset.uncoveredClass && !s.reset.openClass,
  "full reset restores the fitted cover and closed lid", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
