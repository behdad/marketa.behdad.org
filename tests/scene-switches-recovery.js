#!/usr/bin/env node
// Manual scene switches round-trip after their larger presentation owners, without replaying clicks.
"use strict";

var lib = require("./lib");

var BITS = "101001011010010110100101101";
var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var row={balconyLights:false,gardenBlind:true,officeWindows:"' + BITS + '",officeTreeLights:false};',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"office",maxUnlocked:4,phase2:true,party:true,daylight:false,bbq:false},puzzle:{},phone:null,album:null,systems:{"scene-switches":row}};',
  'if(!sessionStorage.getItem("scene-switches-seeded")){sessionStorage.setItem("scene-switches-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],sounds:0,steps:{}};',
  'function snap(){var windows=Array.prototype.slice.call(document.querySelectorAll("#office-buildings .office-window"));return {balconyLights:!document.getElementById("balcony-lights").classList.contains("off"),gardenBlind:document.getElementById("garden-blind").classList.contains("raised"),officeWindows:windows.map(function(el){return el.classList.contains("lit")?"1":"0";}).join(""),officeWindowCount:windows.length,officeTreeLights:!document.getElementById("office-tree").classList.contains("lights-off"),treeSway:document.getElementById("office-tree-sway").classList.contains("sway"),treeFlash:document.getElementById("office-tree-star").classList.contains("star-flash")};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' ["playLaptopClickSound","playSwishSound","playDryClickSound"].forEach(function(k){window[k]=function(){report.sounds++;};});',
  ' var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn");if(button)button.click();',
  ' setTimeout(function(){try{',
  '  report.steps.restored=snap();report.steps.restoreSounds=report.sounds;',
  '  report.steps.persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems["scene-switches"];',
  '  window.__restoreCheckpointSystems({"scene-switches":{balconyLights:"no",gardenBlind:1,officeWindows:"1111111111111111111111111111",officeTreeLights:null}},"afterStage");',
  '  report.steps.validated=snap();',
  '  window.__resetCheckpointSystems();report.steps.reset=snap();',
  '  var saves=0;window.__checkpointChanged=function(){saves++;};',
  '  document.getElementById("balcony-lights").dispatchEvent(new MouseEvent("click",{bubbles:true}));',
  '  document.getElementById("garden-blind").dispatchEvent(new MouseEvent("click",{bubbles:true}));',
  '  document.querySelector("#office-buildings .office-window").dispatchEvent(new MouseEvent("click",{bubbles:true}));',
  '  document.getElementById("office-tree-pot-hit").dispatchEvent(new MouseEvent("click",{bubbles:true}));',
  '  report.steps.mutated=snap();report.steps.saves=saves;',
  ' }catch(e){window.__errs.push("inner: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},500);',
  '}catch(e){window.__errs.push("outer: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html checkpoint scene switches:");
var r = lib.runPageSync("loft-day.html", HARNESS, 2600, {
  patchRaf: true,
  urlSuffix: "?date=2026-12-20"
});
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps, a = s.restored, v = s.validated, z = s.reset, m = s.mutated;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(a && !a.balconyLights && a.gardenBlind && a.officeWindows === BITS && a.officeWindowCount === BITS.length &&
  !a.officeTreeLights, "Continue restores every ordered switch after party and day/night owners", a);
check(a && !a.treeSway && !a.treeFlash && s.restoreSounds === 0,
  "restore settles directly without click sounds or tree reactions", { restored: a, sounds: s.restoreSounds });
check(s.persisted && s.persisted.balconyLights === false && s.persisted.gardenBlind === true &&
  s.persisted.officeWindows === BITS && s.persisted.officeTreeLights === false,
  "the post-Continue checkpoint recaptures the compact switch row", s.persisted);
check(v && v.balconyLights && !v.gardenBlind && /^0{27}$/.test(v.officeWindows) && v.officeTreeLights,
  "malformed booleans and an oversized window bitset fall back to bounded fresh defaults", v);
check(z && z.balconyLights && !z.gardenBlind && /^0{27}$/.test(z.officeWindows) && z.officeTreeLights,
  "registry reset returns every switch to its authored fresh default", z);
check(m && !m.balconyLights && m.gardenBlind && /^1(?:0){26}$/.test(m.officeWindows) && !m.officeTreeLights &&
  s.saves === 4, "each manual switch mutation schedules a checkpoint", { mutated: m, saves: s.saves });

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
