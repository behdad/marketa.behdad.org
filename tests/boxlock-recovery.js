#!/usr/bin/env node
// The magic-box lock's durable open state restores without replaying its unlock one-shot.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"garden",maxUnlocked:4,phase2:true,party:false,daylight:false,bbq:false},puzzle:{},phone:null,album:null,systems:{"magic-box":{unlocked:true}}};',
  'if(!sessionStorage.getItem("boxlock-recovery-seeded")){sessionStorage.setItem("boxlock-recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],sounds:0,steps:{}};',
  'function snap(){var box=document.getElementById("garden-drugsbox"),panel=document.getElementById("garden-boxlock"),shackle=document.getElementById("garden-boxlock-shackle");return {locked:window.__drugsboxLocked(),box:box.classList.contains("unlocked"),panel:panel.classList.contains("unlocked"),showing:panel.classList.contains("showing"),open:shackle.classList.contains("open"),popped:shackle.classList.contains("popped"),transform:getComputedStyle(shackle).transform,miniClosed:getComputedStyle(box.querySelector(".boxlock-mini-shackle-closed")).opacity,miniOpen:getComputedStyle(box.querySelector(".boxlock-mini-shackle-open")).opacity,trip:!!window.__tripActive};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' window.playBoxlockClunkSound=function(){report.sounds++;};',
  ' var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn");if(button)button.click();',
  ' setTimeout(function(){try{',
  '  report.steps.restored=snap();report.steps.persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems["magic-box"];',
  '  window.__resetDrugsbox();report.steps.reset=snap();',
  '  window.__unlockDrugsbox();report.steps.shortcut=snap();',
  '  window.__resetCheckpointSystems();report.steps.registryReset=snap();',
  ' }catch(e){window.__errs.push("inner: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},500);',
  '}catch(e){window.__errs.push("outer: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function openVisual(s) {
  return s && !s.locked && s.box && s.panel && !s.showing && s.open && !s.popped &&
    s.transform !== "none" && s.miniClosed === "0" && s.miniOpen === "1" && !s.trip;
}
function closedVisual(s) {
  return s && s.locked && !s.box && !s.panel && !s.showing && !s.open && !s.popped &&
    s.transform === "none" && s.miniClosed === "1" && s.miniOpen === "0" && !s.trip;
}

console.log("loft-day.html magic-box checkpoint:");
var r = lib.runPageSync("loft-day.html", HARNESS, 2400, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(openVisual(s.restored), "Continue restores the settled open shackle on the close-up and miniature box", s.restored);
check(r.sounds === 0 && !s.restored.trip && !s.restored.popped,
  "Continue does not replay the clunk, pop animation, or a trip", { restored: s.restored, sounds: r.sounds });
check(s.persisted && s.persisted.unlocked === true,
  "the post-Continue checkpoint retains the magic-box unlock", s.persisted);
check(closedVisual(s.reset), "a fresh magic-box reset closes both lock views", s.reset);
check(openVisual(s.shortcut), "a shortcut unlock settles both lock views without a one-shot", s.shortcut);
check(closedVisual(s.registryReset), "checkpoint-registry reset restores the authored locked state", s.registryReset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
