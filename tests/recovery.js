#!/usr/bin/env node
// A durable checkpoint replaces the opening invitation with a keyboard-accessible
// Continue / Start over gate, and Continue restores the saved game progression.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-120000,progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null};',
  'if(!sessionStorage.getItem("recovery-seeded")){sessionStorage.setItem("recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var gate=document.getElementById("loft-recovery-gate"),buttons=gate&&gate.querySelectorAll(".loft-recovery-btn");S("gate",{shown:!!gate,clickMe:!!document.getElementById("click-me-overlay"),primary:buttons&&buttons[0].classList.contains("selected"),meta:gate&&gate.querySelector(".loft-recovery-meta").textContent});',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));S("right",buttons[1].classList.contains("selected"));',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true}));S("left",buttons[0].classList.contains("selected"));',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));S("continued",{gate:!!document.getElementById("loft-recovery-gate"),room:window.currentStageName,max:window.__maxUnlocked(),phase2:!!window.__secondRound,started:window.__gameStarted()});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},350);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html checkpoint recovery:");
var r = lib.runPageSync("rsvp.html", HARNESS, 1900, { patchRaf: true });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.gate.shown && !s.gate.clickMe && s.gate.primary, "a valid save replaces CLICK ME with Continue selected", s.gate);
check(!!s.gate.meta && s.gate.meta.toLowerCase().indexOf("office") !== -1, "the recovery summary names the saved room", s.gate.meta);
check(s.right && s.left, "arrow keys move between Start over and Continue", { right: s.right, left: s.left });
check(!s.continued.gate && s.continued.room === "office" && s.continued.max === 4 && s.continued.phase2 && s.continued.started, "Enter continues into the restored unlocked game", s.continued);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
