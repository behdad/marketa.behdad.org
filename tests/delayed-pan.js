#!/usr/bin/env node
// A room's delayed solve-completion pan must not pull the player back after they leave.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' S("hook",typeof window.__finishSolveAdvance);',
  ' window.goToStage("office");window.__finishSolveAdvance("kitchen","garden");S("stale",{room:window.currentStageName,unlocked:window.__maxUnlocked()});',
  ' window.goToStage("kitchen");var cup=document.getElementById("kitchen-shotcup");cup.classList.add("filled");cup.dispatchEvent(new MouseEvent("click",{bubbles:true}));window.goToStage("office");await sleep(780);S("espresso",{room:window.currentStageName,unlocked:window.__maxUnlocked()});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html delayed solve navigation:");
var r = lib.runPageSync("rsvp.html", HARNESS, 2500, { patchRaf: true });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.hook === "function", "shared delayed-advance guard is installed", s.hook);
check(s.stale.room === "office" && s.stale.unlocked >= 1, "a stale completion unlocks the destination without moving the player", s.stale);
check(s.espresso.room === "office" && s.espresso.unlocked >= 1, "the real espresso completion cannot pull a player back after they leave", s.espresso);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
