#!/usr/bin/env node
// Entrance checkpoints retain settled facade/car switches without replaying transient effects.
"use strict";

var lib = require("./lib");

var PORSCHE = {
  roofOpen: true,
  doorOpen: true,
  frunkOpen: true,
  trunkOpen: true,
  engineOn: true,
  headlightOn: true,
  taillightOn: true
};
var ROW = { windows: "10101", lamps: { left: true, right: false }, porsche: PORSCHE };
var SAVED = {
  version: 1,
  savedAt: Date.now(),
  progress: {
    room: "balcony",
    lowerRoom: "entrance",
    maxUnlocked: 4,
    phase2: true,
    party: false,
    daylight: true,
    bbq: false
  },
  puzzle: {},
  phone: null,
  album: null,
  systems: { entrance: ROW }
};

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  "var saved=" + JSON.stringify(SAVED) + ";",
  'if(!sessionStorage.getItem("entrance-recovery-seeded")){sessionStorage.setItem("entrance-recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],sfx:0,steps:{}};',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function click(id){var el=document.getElementById(id);if(!el)throw new Error("missing "+id);el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function state(){return window.__entranceRoomState();}',
  'function carBits(car){return [car.roofOpen,car.doorOpen,car.frunkOpen,car.trunkOpen,car.engineOn,car.headlightOn,car.taillightOn];}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return false;},configurable:true});',
  ' window.getSfxCtx=function(){report.sfx++;return null;};',
  ' var realOpen=window.__openEntranceRoom;window.__openEntranceRoom=function(){if(!report.steps.beforeOpen)report.steps.beforeOpen=state();return realOpen();};',
  ' var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn.primary");if(!button)throw new Error("missing recovery Continue");button.click();',
  ' await sleep(520);var restored=state(),car=document.getElementById("entrance-porsche");',
  ' report.steps.restored={state:restored,classes:car.getAttribute("class")||"",carPressed:Array.from(document.querySelectorAll(".entrance-car-control")).map(function(el){return [el.id,el.getAttribute("aria-pressed")];}),lampPressed:[document.getElementById("entrance-entry-lamp-left").getAttribute("aria-pressed"),document.getElementById("entrance-entry-lamp-right").getAttribute("aria-pressed")],persisted:JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems.entrance,sfx:report.sfx};',
  ' window.__closeEntranceRoom();await sleep(760);report.steps.closed=state();window.__openEntranceRoom();await sleep(60);report.steps.reopened=state();',
  ' window.__restoreCheckpointSystems({entrance:{windows:"111111",lamps:{left:1,right:true},porsche:{roofOpen:"yes",doorOpen:true,frunkOpen:1,trunkOpen:false,engineOn:null,headlightOn:true,taillightOn:0}}},"afterStage");report.steps.validated=state();',
  ' window.__resetCheckpointSystems();report.steps.reset=state();',
  ' var saves=0;window.__checkpointChanged=function(){saves++;};',
  ' ["entrance-window-left","entrance-window-mid-left","entrance-window-upper","entrance-window-mid-right","entrance-window-right","entrance-entry-lamp-left","entrance-entry-lamp-right","entrance-porsche-roof","entrance-porsche-door","entrance-porsche-frunk","entrance-porsche-trunk","entrance-porsche-engine","entrance-porsche-headlight","entrance-porsche-taillight"].forEach(click);',
  ' click("entrance-porsche-indicator");var captured=window.__captureCheckpointSystems().entrance;report.steps.mutated={state:state(),row:captured,saves:saves,rowKeys:Object.keys(captured).sort(),carKeys:Object.keys(captured.porsche).sort()};',
  ' window.__resetCheckpointSystems();report.steps.resetAfterMutation=state();',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function allCar(car, value) {
  return car && ["roofOpen", "doorOpen", "frunkOpen", "trunkOpen", "engineOn", "headlightOn", "taillightOn"]
    .every(function (key) { return car[key] === value; });
}

console.log("rsvp.html Entrance checkpoint recovery:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3000, {
  patchRaf: true,
  urlSuffix: "?date=2026-07-31&time=12:00#play"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
var before = s.beforeOpen;
var restored = s.restored && s.restored.state;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(before && !before.open && before.windows.map(function (row) { return row.on ? "1" : "0"; }).join("") === "10101" &&
  before.lamps.left && !before.lamps.right && allCar(before.car, true) && !before.car.idleActive && !before.car.vibrating,
  "Continue settles every Entrance switch before opening the saved lower room", before);
check(restored && restored.open && restored.windows.map(function (row) { return row.on ? "1" : "0"; }).join("") === "10101" &&
  restored.lamps.left && !restored.lamps.right && allCar(restored.car, true) &&
  !restored.car.idleActive && !restored.car.vibrating && restored.car.indicatorFlashes === 0 &&
  Object.keys(restored.car.activations).length === 0 && !restored.reacting.length &&
  /roof-open/.test(s.restored.classes) && /door-open/.test(s.restored.classes) &&
  /frunk-open/.test(s.restored.classes) && /trunk-open/.test(s.restored.classes) &&
  /engine-on/.test(s.restored.classes) && /headlight-on/.test(s.restored.classes) &&
  /taillight-on/.test(s.restored.classes),
  "restored classes are truthful while idle/tremor remain lifecycle-derived", s.restored);
check(s.restored && s.restored.carPressed.length === 8 && s.restored.carPressed.every(function (row) {
    return row[0] === "entrance-porsche-indicator" ? row[1] === null : row[1] === "true";
  }) && s.restored.lampPressed.join(",") === "true,false",
  "Continue restores truthful Porsche and independent wall-lamp pressed states", s.restored);
check(s.restored && JSON.stringify(s.restored.persisted) === JSON.stringify(ROW) && s.restored.sfx === 0,
  "the post-Continue save retains the compact row without replaying startup SFX", s.restored);
check(s.closed && !s.closed.open && allCar(s.closed.car, true) && !s.closed.car.idleActive && !s.closed.car.vibrating &&
  s.reopened && s.reopened.open && allCar(s.reopened.car, true),
  "leaving parks runtime idle while settled Porsche state survives room re-entry", { closed: s.closed, reopened: s.reopened });
check(s.validated && /^00000$/.test(s.validated.windows.map(function (row) { return row.on ? "1" : "0"; }).join("")) &&
  !s.validated.lamps.left && s.validated.lamps.right && !s.validated.car.roofOpen &&
  s.validated.car.doorOpen && !s.validated.car.frunkOpen && !s.validated.car.trunkOpen &&
  !s.validated.car.engineOn && s.validated.car.headlightOn && !s.validated.car.taillightOn,
  "restore accepts only bounded window bits and literal booleans", s.validated);
check(s.reset && /^00000$/.test(s.reset.windows.map(function (row) { return row.on ? "1" : "0"; }).join("")) &&
  !s.reset.lamps.left && !s.reset.lamps.right && allCar(s.reset.car, false) &&
  !s.reset.car.idleActive && !s.reset.car.vibrating,
  "checkpoint reset returns the daytime Entrance to authored defaults", s.reset);
check(s.mutated && s.mutated.saves === 14 && s.mutated.row.windows === "11111" &&
  s.mutated.row.lamps.left && s.mutated.row.lamps.right && allCar(s.mutated.row.porsche, true) &&
  s.mutated.rowKeys.join(",") === "lamps,porsche,windows" &&
  s.mutated.carKeys.join(",") === "doorOpen,engineOn,frunkOpen,headlightOn,roofOpen,taillightOn,trunkOpen" &&
  !("indicatorFlashes" in s.mutated.row.porsche) && !("idleActive" in s.mutated.row.porsche) &&
  !("vibrating" in s.mutated.row.porsche),
  "every durable manual switch checkpoints while indicator/runtime state stays transient", s.mutated);
check(s.resetAfterMutation && allCar(s.resetAfterMutation.car, false) &&
  /^00000$/.test(s.resetAfterMutation.windows.map(function (row) { return row.on ? "1" : "0"; }).join("")) &&
  !s.resetAfterMutation.lamps.left && !s.resetAfterMutation.lamps.right,
  "reset clears a newly retained Entrance row", s.resetAfterMutation);

console.log("");
if (failures) { console.log(failures + " Entrance checkpoint assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Entrance checkpoint assertions passed.");
