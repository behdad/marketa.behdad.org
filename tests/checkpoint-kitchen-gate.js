#!/usr/bin/env node
// Automatic recovery begins after the player completes the Kitchen or deliberately leaves it.
// A tap-only or mid-espresso visit that remains in Kitchen still returns as a fresh entry.
"use strict";

var lib = require("./lib");

var WRITE_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[]};',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' window.__clearLoftCheckpoint();window.__endAttract();',
  ' report.before={solved:window.__solvedRooms(),tapSaved:window.__saveLoftCheckpoint(),tapStored:!!localStorage.getItem("loftCheckpoint:v1")};',
  ' window.__setKitchenCoffeeState({step:"ground",rounds:0});report.before.midSaved=window.__saveLoftCheckpoint();report.before.midStored=!!localStorage.getItem("loftCheckpoint:v1");',
  ' window.__checkpointChanged();await new Promise(function(resolve){setTimeout(resolve,450);});report.before.debounced=!!localStorage.getItem("loftCheckpoint:v1");',
  ' window.__goToStage("garden");await new Promise(function(resolve){setTimeout(resolve,40);});var gardenSaved=window.__saveLoftCheckpoint(),gardenRaw=localStorage.getItem("loftCheckpoint:v1"),garden=gardenRaw&&JSON.parse(gardenRaw);report.garden={saved:gardenSaved,room:garden&&garden.progress.room,solved:garden&&garden.progress.solvedRooms};window.__clearLoftCheckpoint();window.__goToStage("kitchen");await new Promise(function(resolve){setTimeout(resolve,40);});',
  ' window.__openBathroomRoom();await new Promise(function(resolve){setTimeout(resolve,40);});var leftSaved=window.__saveLoftCheckpoint(),leftRaw=localStorage.getItem("loftCheckpoint:v1"),left=leftRaw&&JSON.parse(leftRaw);report.left={saved:leftSaved,room:left&&left.progress.room,lowerRoom:left&&left.progress.lowerRoom,solved:left&&left.progress.solvedRooms};window.__clearLoftCheckpoint();window.__closeBathroomRoom();',
  ' window.__finishSolveAdvance("kitchen","garden");await new Promise(function(resolve){setTimeout(resolve,500);});',
  ' var raw=localStorage.getItem("loftCheckpoint:v1"),saved=raw&&JSON.parse(raw);report.after={stored:!!raw,room:saved&&saved.progress.room,max:saved&&saved.progress.maxUnlocked,solved:saved&&saved.progress.solvedRooms};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},100);});',
  '})();</script>'
].join("\n");

var LEFT_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"kitchen",lowerRoom:"bathroom",maxUnlocked:0,solvedRooms:[],phase2:false,party:false,daylight:true,bbq:false},puzzle:{kitchen:{powered:true,warmed:true}},phone:null,album:null,systems:{}};',
  'if(!sessionStorage.getItem("checkpoint-kitchen-left-seeded")){sessionStorage.setItem("checkpoint-kitchen-left-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'window.addEventListener("load",function(){setTimeout(function(){var loaded=window.__loadLoftCheckpoint();document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,gate:!!document.getElementById("loft-recovery-gate"),intro:!!document.getElementById("click-me-overlay"),loaded:loaded&&loaded.progress});},120);});',
  '})();</script>'
].join("\n");

var INVALID_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"kitchen",maxUnlocked:0,solvedRooms:[],phase2:false,party:false,daylight:true,bbq:false},puzzle:{kitchen:{powered:true,warmed:true}},phone:null,album:null,systems:{}};',
  'if(!sessionStorage.getItem("checkpoint-kitchen-gate-seeded")){sessionStorage.setItem("checkpoint-kitchen-gate-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'window.addEventListener("load",function(){setTimeout(function(){document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,gate:!!document.getElementById("loft-recovery-gate"),intro:!!document.getElementById("click-me-overlay"),stored:!!localStorage.getItem("loftCheckpoint:v1"),loaded:window.__loadLoftCheckpoint()});},120);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html Kitchen checkpoint gate:");
var write = lib.runPageSync("loft-day.html", WRITE_HARNESS, 1800, { patchRaf: true });
var invalid = lib.runPageSync("loft-day.html", INVALID_HARNESS, 1000, { patchRaf: true });
var left = lib.runPageSync("loft-day.html", LEFT_HARNESS, 1000, { patchRaf: true });

check(write && write.errors.length === 0, "checkpoint write harness has no uncaught errors", write && write.errors);
check(write && write.before && !write.before.solved.length && !write.before.tapSaved &&
  !write.before.tapStored && !write.before.midSaved && !write.before.midStored && !write.before.debounced,
  "tap-only and mid-Kitchen play creates no automatic or explicit checkpoint", write && write.before);
check(write && write.garden && write.garden.saved && write.garden.room === "garden" &&
  write.garden.solved.length === 0,
  "leaving unsolved Kitchen for Garden arms Continue without pretending Kitchen was solved", write && write.garden);
check(write && write.left && write.left.saved && write.left.room === "kitchen" &&
  write.left.lowerRoom === "bathroom" && write.left.solved.length === 0,
  "entering the Bathroom arms a checkpoint without pretending Kitchen was solved", write && write.left);
check(write && write.after && write.after.stored && write.after.room === "garden" &&
  write.after.max === 1 && write.after.solved.join(",") === "kitchen",
  "solving the Kitchen immediately starts checkpointing at the Garden frontier", write && write.after);
check(invalid && invalid.errors.length === 0, "pre-Kitchen recovery harness has no uncaught errors", invalid && invalid.errors);
check(invalid && !invalid.gate && invalid.intro && !invalid.stored && invalid.loaded === null,
  "an existing pre-Kitchen save is cleared and returns to fresh CLICK ME entry", invalid);
check(left && left.errors.length === 0 && left.gate && !left.intro && left.loaded &&
  left.loaded.room === "kitchen" && left.loaded.lowerRoom === "bathroom" && !left.loaded.solvedRooms.length,
  "a save made after leaving Kitchen still presents Continue", left);

console.log("");
if (failures) {
  console.log(failures + " Kitchen checkpoint assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Kitchen checkpoint assertions passed.");
