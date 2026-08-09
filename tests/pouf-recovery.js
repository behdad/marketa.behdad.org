#!/usr/bin/env node
// The nesting-pouf reveal is stable physical state, restored without replaying its reactions.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null,systems:{"office-poufs":{state:3}}};',
  'if(!sessionStorage.getItem("pouf-seeded")){sessionStorage.setItem("pouf-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],sounds:0,steps:{}};',
  'function snap(){var p=document.getElementById("office-nesting-poufs");return {medium:p.classList.contains("state-medium"),small:p.classList.contains("state-small"),reveal:p.classList.contains("state-reveal"),state:window.__captureCheckpointSystems()["office-poufs"]};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' ["playSwishSound","playKnockboxThumpSound"].forEach(function(k){window[k]=function(){report.sounds++;};});',
  ' var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn");if(button)button.click();',
  ' setTimeout(function(){try{',
  '  var poufs=document.getElementById("office-nesting-poufs");',
  '  report.steps.restored=snap();report.steps.restoreSounds=report.sounds;',
  '  report.steps.persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems["office-poufs"];',
  '  var saves=0;window.__checkpointChanged=function(){saves++;};poufs.dispatchEvent(new MouseEvent("click",{bubbles:true}));',
  '  report.steps.mutated=snap();report.steps.saves=saves;',
  '  window.__restoreCheckpointSystems({"office-poufs":{state:99}},"afterStage");report.steps.malformed=snap();',
  '  window.__resetCheckpointSystems();report.steps.reset=snap();',
  ' }catch(e){window.__errs.push("inner: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},500);',
  '}catch(e){window.__errs.push("outer: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html checkpoint nesting poufs:");
var r = lib.runPageSync("loft-day.html", HARNESS, 2400, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps, a = s.restored, m = s.mutated, v = s.malformed, z = s.reset;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(a && a.reveal && !a.medium && !a.small && a.state.state === 3,
  "Continue restores the revealed medals and sock", a);
check(s.restoreSounds === 0,
  "restore settles directly without swishes, thumps, or click reactions", s.restoreSounds);
check(s.persisted && s.persisted.state === 3,
  "the post-Continue checkpoint recaptures the compact pouf row", s.persisted);
check(m && !m.medium && !m.small && !m.reveal && m.state.state === 0 && s.saves === 1,
  "the next pouf interaction nests the set and schedules one checkpoint", { mutated: m, saves: s.saves });
check(v && !v.medium && !v.small && !v.reveal && v.state.state === 0,
  "a malformed pouf row settles to the fresh nested state", v);
check(z && !z.medium && !z.small && !z.reveal && z.state.state === 0,
  "registry reset returns the poufs to their authored nesting", z);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
