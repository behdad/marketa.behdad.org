#!/usr/bin/env node
// Continue must rearm restored device runtimes even when the saved room is not the
// device's room. CAPS LOCK is separately persisted, but still has to be projected
// onto a monitor shell rebuilt from the checkpoint.
"use strict";

var lib = require("./lib");

function checkpoint() {
  return {
    version: 1,
    savedAt: Date.now(),
    progress: { room: "garden", maxUnlocked: 4, phase2: true, party: false, daylight: true, bbq: false },
    puzzle: {},
    phone: null,
    album: null,
    systems: {
      pc: { powered: true },
      monitor: { surface: "monitor", screenOn: true, zoomed: false },
      laptop: { open: true, zoomed: false },
      "kitchen-kettle": { on: true }
    }
  };
}

function harness(saved, key, lock) {
  return [
    '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
    '<script>(function(){',
    'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
    'var saved=' + JSON.stringify(saved) + ',key=' + JSON.stringify(key) + ',savedLock=' + JSON.stringify(lock || null) + ';',
    'if(!sessionStorage.getItem(key)){sessionStorage.setItem(key,"1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));if(savedLock)localStorage.setItem("loftMonitorCapsLock",JSON.stringify(savedLock));location.reload();return;}',
    'var report={errors:[],steps:{}};',
    'addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},200);});',
    'async function run(){var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn");if(button)button.click();await sleep(100);',
    'var laptop=document.getElementById("office-laptop"),monitor=document.getElementById("office-monitor");report.steps.restored={room:window.currentStageName,laptopOpen:laptop.classList.contains("open"),monitorOn:monitor.classList.contains("screen-on"),kettle:window.__kettleCheckpointState(),lock:window.__monitorLockState(),monitorLocked:monitor.classList.contains("monitor-locked"),monitorSaver:monitor.classList.contains("show-saver")};',
    'if(savedLock){window.goToStage("office");await sleep(80);report.steps.office={lock:window.__monitorLockState(),monitorLocked:monitor.classList.contains("monitor-locked"),monitorSaver:monitor.classList.contains("show-saver"),saver:window.__monitorSaverState()};return;}',
    'window.goToStage("kitchen");await sleep(1500);report.steps.steam={wisps:document.querySelectorAll(".steam-wisp").length,kettle:window.__kettleCheckpointState()};await sleep(6600);report.steps.parked={room:window.currentStageName,laptopShow:laptop.classList.contains("show-saver"),laptop:window.__laptopSaverState(),monitorShow:monitor.classList.contains("show-saver"),monitor:window.__monitorSaverState()};window.goToStage("office");await sleep(100);report.steps.office={laptopActive:laptop.classList.contains("saver-running"),laptop:window.__laptopSaverState(),monitor:window.__monitorSaverState()};}',
    '})();</script>'
  ].join("\n");
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("loft-day.html checkpoint runtime lifecycle:");
var restored = lib.runPageSync("loft-day.html", harness(checkpoint(), "checkpoint-runtime-seeded"), 11200, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true
});
check(!!restored && restored.errors.length === 0, "restored-runtime harness has no uncaught errors", restored && restored.errors);
var rs = restored && restored.steps;
check(rs && rs.restored.room === "garden" && rs.restored.laptopOpen && rs.restored.monitorOn,
  "Continue rebuilds the open laptop and powered monitor outside the Office", rs && rs.restored);
check(rs && rs.restored.kettle.on && rs.restored.kettle.puffs && rs.steam.kettle.puffs && rs.steam.wisps > 0,
  "Continue rearms the restored-on kettle's recurring steam puffs", rs && { restored: rs.restored, steam: rs.steam });
check(rs && rs.parked.room === "kitchen" && rs.parked.laptopShow && rs.parked.laptop.kind &&
  !rs.parked.laptop.running && !rs.parked.laptop.cycling && rs.parked.monitorShow &&
  rs.parked.monitor.kind && !rs.parked.monitor.running,
  "restored device idle timers mature while the Office is parked without running render loops", rs && rs.parked);
check(rs && rs.office.laptopActive && rs.office.laptop.cycling && rs.office.monitor.running,
  "entering the Office resumes both restored screensaver runtimes", rs && rs.office);

var lock = { locked: true, seed: 24680, matched: { pink: true, blue: false } };
var locked = lib.runPageSync("loft-day.html", harness(checkpoint(), "checkpoint-lock-seeded", lock), 3500, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true
});
check(!!locked && locked.errors.length === 0, "persisted-lock harness has no uncaught errors", locked && locked.errors);
var ls = locked && locked.steps;
check(ls && ls.restored.room === "garden" && ls.restored.lock.locked &&
  ls.restored.lock.seed === lock.seed && ls.restored.lock.matched.pink && !ls.restored.lock.matched.blue &&
  ls.restored.monitorLocked && ls.restored.monitorSaver,
  "Continue projects the persisted CAPS lock onto the restored monitor shell off-room", ls && ls.restored);
check(ls && ls.office.lock.locked && ls.office.monitorLocked && ls.office.monitorSaver && ls.office.saver.running,
  "the restored CAPS challenge resumes when the Office is entered", ls && ls.office);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
