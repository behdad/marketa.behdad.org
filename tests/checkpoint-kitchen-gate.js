#!/usr/bin/env node
// Automatic recovery begins only after the player completes the Kitchen. A tap-only or
// mid-espresso visit stays a fresh entry on return; the Kitchen solve immediately arms saving.
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
  ' window.__finishSolveAdvance("kitchen","garden");await new Promise(function(resolve){setTimeout(resolve,500);});',
  ' var raw=localStorage.getItem("loftCheckpoint:v1"),saved=raw&&JSON.parse(raw);report.after={stored:!!raw,room:saved&&saved.progress.room,max:saved&&saved.progress.maxUnlocked,solved:saved&&saved.progress.solvedRooms};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},100);});',
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

console.log("rsvp.html Kitchen checkpoint gate:");
var write = lib.runPageSync("rsvp.html", WRITE_HARNESS, 1800, { patchRaf: true, urlSuffix: "#play" });
var invalid = lib.runPageSync("rsvp.html", INVALID_HARNESS, 1000, { patchRaf: true, urlSuffix: "#play" });

check(write && write.errors.length === 0, "checkpoint write harness has no uncaught errors", write && write.errors);
check(write && write.before && !write.before.solved.length && !write.before.tapSaved &&
  !write.before.tapStored && !write.before.midSaved && !write.before.midStored && !write.before.debounced,
  "tap-only and mid-Kitchen play creates no automatic or explicit checkpoint", write && write.before);
check(write && write.after && write.after.stored && write.after.room === "garden" &&
  write.after.max === 1 && write.after.solved.join(",") === "kitchen",
  "solving the Kitchen immediately starts checkpointing at the Garden frontier", write && write.after);
check(invalid && invalid.errors.length === 0, "pre-Kitchen recovery harness has no uncaught errors", invalid && invalid.errors);
check(invalid && !invalid.gate && invalid.intro && !invalid.stored && invalid.loaded === null,
  "an existing pre-Kitchen save is cleared and returns to fresh CLICK ME entry", invalid);

console.log("");
if (failures) {
  console.log(failures + " Kitchen checkpoint assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Kitchen checkpoint assertions passed.");
