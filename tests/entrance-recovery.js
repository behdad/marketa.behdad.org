#!/usr/bin/env node
// Entrance checkpoints retain settled facade/car switches without replaying transient effects.
"use strict";

var lib = require("./lib");

var PORSCHE = {
  roofOpen: true,
  doorOpen: true,
  windowOpen: true,
  frunkOpen: true,
  trunkOpen: true,
  engineOn: true,
  headlightOn: true,
  taillightOn: true
};
var ROW = { windows: "10101", lamps: { left: true, right: false }, porsche: PORSCHE };
var DEFAULT_STARGAZING = { progress: { cassiopeia: 0, "ursa-major": 0, "ursa-minor": 0 }, completed: [], complete: false, wisdomDismissed: false, wisdomHandoffReady: false, sleepPhase: "idle", sleepElapsed: 0 };
var DEFAULT_ROADTRIP = { scoringVersion: 2, unlocked: false, accepted: false, everAccepted: false, campVisited: false, routeChoice: "calgary", routeChooserOpen: false, invitationReady: false, invitationDismissed: false, practiceLaps: 0, distance: 0, distancePoints: 0, elapsedSeconds: 0, score: 0, multiplier: 1, collisions: 0, passes: 0, tokens: 0, escapes: 0, wildlifeHits: 0, campFireBuilt: false, campFireLit: false, campPinecones: 0, stew: null, stargazing: DEFAULT_STARGAZING, campActive: false, highwayActive: false };
var DEFAULT_DRIVE = { hud: false, coach: { step: 2, complete: false, dismissed: false }, gloveboxOpen: false, stalled: false, gear: 0, transmission: { mode: "auto", range: "P" }, speed: 0, position: 0, laneOffset: 0, steeringAngle: 0, wheelAngle: 0, wraps: 0, odometerKm: 0, facing: 1, yaw: 0, cruise: { active: false, target: 0 }, spinDirection: 0, spins: 0, roadtrip: DEFAULT_ROADTRIP };
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
  'function carBits(car){return [car.roofOpen,car.doorOpen,car.windowOpen,car.frunkOpen,car.trunkOpen,car.engineOn,car.headlightOn,car.taillightOn];}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return false;},configurable:true});',
  ' window.getSfxCtx=function(){report.sfx++;return null;};',
  ' var realOpen=window.__openEntranceRoom;window.__openEntranceRoom=function(){if(!report.steps.beforeOpen)report.steps.beforeOpen=state();return realOpen();};',
  ' var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn.primary");if(!button)throw new Error("missing recovery Continue");button.click();',
  ' await sleep(520);var restored=state(),car=document.getElementById("entrance-porsche");',
  ' report.steps.restored={state:restored,classes:car.getAttribute("class")||"",controls:Array.from(document.querySelectorAll(".entrance-car-control")).map(function(el){return el.id;}),lamps:[document.getElementById("entrance-entry-lamp-left").classList.contains("on"),document.getElementById("entrance-entry-lamp-right").classList.contains("on")],persisted:JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems.entrance,sfx:report.sfx};',
  ' window.__closeEntranceRoom();await sleep(760);report.steps.closed=state();window.__openEntranceRoom();await sleep(60);report.steps.reopened=state();',
  ' window.__openEntrancePorscheDriveHud();report.steps.resumedHud=state().drive.hud;window.__dismissEntrancePorscheDriveHud();',
  ' window.__restoreCheckpointSystems({entrance:{windows:"111111",lamps:{left:1,right:true},porsche:{roofOpen:"yes",doorOpen:true,windowOpen:false,frunkOpen:1,trunkOpen:false,engineOn:null,headlightOn:true,taillightOn:0}}},"afterStage");report.steps.validated=state();',
  ' window.__resetCheckpointSystems();report.steps.reset=state();',
  ' window.__openEntrancePorscheDriveHud();report.steps.freshHud=state().drive.hud;window.__dismissEntrancePorscheDriveHud();',
  ' var saves=0;window.__checkpointChanged=function(){saves++;};',
  ' ["entrance-window-left","entrance-window-mid-left","entrance-window-upper","entrance-window-mid-right","entrance-window-right","entrance-entry-lamp-left","entrance-entry-lamp-right","entrance-porsche-roof","entrance-porsche-door","entrance-porsche-window","entrance-porsche-frunk","entrance-porsche-trunk","entrance-porsche-headlight","entrance-porsche-taillight"].forEach(click);window.__toggleEntrancePorscheEngine();',
  ' click("entrance-porsche-indicator");var captured=window.__captureCheckpointSystems().entrance;report.steps.mutated={state:state(),row:captured,saves:saves,rowKeys:Object.keys(captured).sort(),carKeys:Object.keys(captured.porsche).sort()};',
  ' window.__resetCheckpointSystems();report.steps.resetAfterMutation=state();',
  ' var balcony=document.getElementById("stage-balcony");balcony.classList.remove("dusk");window.__resetCheckpointSystems();balcony.classList.add("dusk");await sleep(10);report.steps.nightReset=state();',
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
  return car && ["roofOpen", "doorOpen", "windowOpen", "frunkOpen", "trunkOpen", "engineOn", "headlightOn", "taillightOn"]
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
  /windows-open/.test(s.restored.classes) &&
  /frunk-open/.test(s.restored.classes) && /trunk-open/.test(s.restored.classes) &&
  /engine-on/.test(s.restored.classes) && /headlight-on/.test(s.restored.classes) &&
  /taillight-on/.test(s.restored.classes),
  "restored classes are truthful while idle/tremor remain lifecycle-derived", s.restored);
check(s.restored && s.restored.controls.length === 9 &&
  s.restored.controls.every(function (id) { return /^entrance-porsche-/.test(id); }),
  "Continue retains the complete Porsche control inventory", s.restored);
check(s.resumedHud && s.freshHud,
  "the dashboard opens after Continue and after a fresh reset", { resumed: s.resumedHud, fresh: s.freshHud });
check(s.restored && JSON.stringify(s.restored.persisted) === JSON.stringify(Object.assign({}, ROW, { drive: DEFAULT_DRIVE })) && s.restored.sfx === 0,
  "the post-Continue save retains the compact row without replaying startup SFX", s.restored);
check(s.closed && !s.closed.open && allCar(s.closed.car, true) && !s.closed.car.idleActive && !s.closed.car.vibrating &&
  s.reopened && s.reopened.open && allCar(s.reopened.car, true),
  "leaving parks runtime idle while settled Porsche state survives room re-entry", { closed: s.closed, reopened: s.reopened });
check(s.validated && /^00000$/.test(s.validated.windows.map(function (row) { return row.on ? "1" : "0"; }).join("")) &&
  !s.validated.lamps.left && s.validated.lamps.right && !s.validated.car.roofOpen &&
  s.validated.car.doorOpen && !s.validated.car.windowOpen && !s.validated.car.frunkOpen && !s.validated.car.trunkOpen &&
  !s.validated.car.engineOn && s.validated.car.headlightOn && !s.validated.car.taillightOn,
  "restore accepts only bounded window bits and literal booleans", s.validated);
check(s.reset && /^00000$/.test(s.reset.windows.map(function (row) { return row.on ? "1" : "0"; }).join("")) &&
  !s.reset.lamps.left && !s.reset.lamps.right && allCar(s.reset.car, false) &&
  !s.reset.car.idleActive && !s.reset.car.vibrating,
  "checkpoint reset returns the daytime Entrance to authored defaults", s.reset);
check(s.mutated && s.mutated.saves === 15 && s.mutated.row.windows === "11111" &&
  s.mutated.row.lamps.left && s.mutated.row.lamps.right && allCar(s.mutated.row.porsche, true) &&
  s.mutated.rowKeys.join(",") === "drive,lamps,porsche,windows" &&
  s.mutated.carKeys.join(",") === "doorOpen,engineOn,frunkOpen,headlightOn,roofOpen,taillightOn,trunkOpen,windowOpen" &&
  !("indicatorFlashes" in s.mutated.row.porsche) && !("idleActive" in s.mutated.row.porsche) &&
  !("vibrating" in s.mutated.row.porsche),
  "every durable manual switch checkpoints while indicator/runtime state stays transient", s.mutated);
check(s.resetAfterMutation && allCar(s.resetAfterMutation.car, false) &&
  /^00000$/.test(s.resetAfterMutation.windows.map(function (row) { return row.on ? "1" : "0"; }).join("")) &&
  !s.resetAfterMutation.lamps.left && !s.resetAfterMutation.lamps.right,
  "reset clears a newly retained Entrance row", s.resetAfterMutation);
check(s.nightReset && /^11111$/.test(s.nightReset.windows.map(function (row) { return row.on ? "1" : "0"; }).join("")) &&
  s.nightReset.lamps.left && s.nightReset.lamps.right,
  "a fresh reset reapplies authored all-on facade lighting after night settles", s.nightReset);

console.log("");
if (failures) { console.log(failures + " Entrance checkpoint assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Entrance checkpoint assertions passed.");
