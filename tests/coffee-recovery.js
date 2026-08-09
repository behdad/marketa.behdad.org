#!/usr/bin/env node
// Coffee checkpoints restore an actionable, visually complete routine step without
// re-running the sound/animation that originally reached it.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-1000,progress:{room:"kitchen",maxUnlocked:1,solvedRooms:["kitchen"],phase2:false,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null,systems:{coffee:{step:"brewed",rounds:1}}};',
  'if(!sessionStorage.getItem("coffee-recovery-seeded")){sessionStorage.setItem("coffee-recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],sounds:0,advances:0,matrix:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' ["playSparkSound","playGrindSound","playBrewSound","playSipSound","playKnockboxThumpSound"].forEach(function(n){window[n]=function(){report.sounds++;};});',
  ' window.__finishSolveAdvance=function(){report.advances++;};',
  ' var gate=document.getElementById("loft-recovery-gate");gate.querySelector(".loft-recovery-btn").click();',
  ' function snap(){var pf=document.getElementById("kitchen-portafilter"),fly=document.getElementById("kitchen-portafilter-fly"),cup=document.getElementById("kitchen-shotcup"),machine=document.getElementById("kitchen-lamarzocco"),grinder=document.getElementById("kitchen-grinder");return {state:window.__captureKitchenCoffeeState(),next:window.__kitchenCoffeeNext(),powered:machine.classList.contains("powered-on"),ready:machine.classList.contains("done"),grinderDone:grinder.classList.contains("done"),grounds:pf.classList.contains("has-grounds"),flat:pf.classList.contains("grounds-flat"),done:pf.classList.contains("done"),spent:pf.classList.contains("spent"),atGrinder:fly.classList.contains("at-grinder"),filled:cup.classList.contains("filled"),transient:machine.classList.contains("warming-up")||grinder.classList.contains("grinding")||pf.classList.contains("brewing")||cup.classList.contains("sipping")||fly.classList.contains("knocking")};}',
  ' report.continued=snap();report.persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems.coffee;',
  ' ["off","ready","ground","tamped","brewed","spent"].forEach(function(step){window.__setKitchenCoffeeState({step:step,rounds:1});report.matrix[step]=snap();});',
  ' report.restoreSounds=report.sounds;report.restoreAdvances=report.advances;',
  ' window.__setKitchenCoffeeState({step:"off"});document.getElementById("kitchen-lamarzocco").dispatchEvent(new MouseEvent("click",{bubbles:true}));report.warmupCapture=window.__captureKitchenCoffeeState();',
  ' window.__setKitchenCoffeeState({step:"ready"});document.getElementById("kitchen-grinder").dispatchEvent(new MouseEvent("click",{bubbles:true}));report.grindCapture=window.__captureKitchenCoffeeState();',
  ' window.__setKitchenCoffeeState({step:"ground"});document.getElementById("kitchen-tamper").dispatchEvent(new MouseEvent("click",{bubbles:true}));report.tampCapture=window.__captureKitchenCoffeeState();',
  ' window.__setKitchenCoffeeState({step:"tamped"});document.getElementById("kitchen-portafilter").dispatchEvent(new MouseEvent("click",{bubbles:true}));report.brewCapture=window.__captureKitchenCoffeeState();',
  ' window.__setKitchenCoffeeState({step:"spent"});document.getElementById("kitchen-knockbox").dispatchEvent(new MouseEvent("click",{bubbles:true}));report.knockCapture=window.__captureKitchenCoffeeState();',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},250);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html coffee checkpoint recovery:");
var r = lib.runPageSync("loft-day.html", HARNESS, 1700, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(r.continued && r.continued.state.step === "brewed" && r.continued.state.rounds === 1 &&
  r.continued.next === "kitchen-shotcup" && r.continued.powered && r.continued.ready &&
  r.continued.grinderDone && r.continued.grounds && r.continued.flat && r.continued.done &&
  r.continued.filled && !r.continued.spent && !r.continued.atGrinder && !r.continued.transient,
  "Continue restores the completed shot as a stable, drinkable visual state", r.continued);
check(r.persisted && r.persisted.step === "brewed" && r.persisted.rounds === 1,
  "the post-Continue checkpoint retains the coffee adapter row", r.persisted);

var expected = {
  off: ["kitchen-lamarzocco", false, false, false, false, false, false],
  ready: ["kitchen-grinder", true, false, false, false, false, false],
  ground: ["kitchen-tamper", true, true, false, false, true, false],
  tamped: ["kitchen-portafilter", true, true, true, false, false, false],
  brewed: ["kitchen-shotcup", true, true, true, true, false, false],
  spent: ["kitchen-knockbox", true, false, false, false, false, true]
};
Object.keys(expected).forEach(function (step) {
  var s = r.matrix[step], e = expected[step];
  check(s && s.state.step === step && s.state.rounds === 1 && s.next === e[0] &&
    s.powered === e[1] && s.grounds === e[2] && s.flat === e[3] && s.filled === e[4] &&
    s.atGrinder === e[5] && s.spent === e[6] && !s.transient,
    step + " restores one internally consistent routine step", s);
});
check(r.restoreSounds === 0 && r.restoreAdvances === 0,
  "restoring every stable step is silent and never advances the solve", { sounds: r.restoreSounds, advances: r.restoreAdvances });
check(r.warmupCapture.step === "off" && r.grindCapture.step === "ready" &&
  r.tampCapture.step === "ground" && r.brewCapture.step === "tamped" && r.knockCapture.step === "spent",
  "in-flight work checkpoints the preceding actionable step", {
    warmup: r.warmupCapture, grind: r.grindCapture, tamp: r.tampCapture,
    brew: r.brewCapture, knock: r.knockCapture
  });

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
