#!/usr/bin/env node
"use strict";

// Centre-line enforcement counts moving violation time. A crash may strand the car
// across the line, but its stationary time must neither advance nor erase that clock.
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return window.__entranceRoomState(); }
  function trip() { return state().drive.roadtrip; }
  function step(ms, count) {
    for (var i = 0; i < (count || 1); i++) window.__entranceDriveStep(ms);
  }
  function setMotion(speed, gear) {
    window.__entranceDriveControl("throttle", false);
    window.__entranceDriveControl("brake", false);
    window.__entranceDriveSetMotion(speed, gear);
  }
  function stepMoving(ms, count) {
    for (var i = 0; i < (count || 1); i++) {
      setMotion(10, 1);
      step(ms);
    }
  }
  function startFresh() {
    window.__entranceRoadtripDevStart("banff", 0);
    window.__entranceRoadtripSetLane(.5);
    setMotion(0, 0);
    if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
  }
  function checkpointRun() {
    var row = window.__captureCheckpointSystems().entrance;
    return row.drive.roadtrip.pausedRun;
  }
  async function run() {
    window.__getSfxCtx = function () { return null; };
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    await sleep(40);
    window.__openEntrancePorscheDriveHud();

    startFresh();
    window.__entranceRoadtripSetLane(-.5);
    stepMoving(100, 99);
    report.steps.movingGrace = copy(trip());
    stepMoving(100, 2);
    report.steps.movingEnforced = copy(trip());

    startFresh();
    setMotion(90, 3);
    window.__entranceDriveControl("throttle", true);
    window.__entranceRoadtripSetLane(-.5);
    step(1000, 2);
    window.__entranceRoadtripSpawn("car", -.5, 10, { speedKmh: 90 });
    step(100);
    window.__entranceDriveControl("throttle", false);
    report.steps.crash = { trip: copy(trip()), drive: copy(state().drive), car: copy(state().car) };
    step(1000, 12);
    report.steps.stationary = copy(trip());
    report.steps.checkpoint = copy(checkpointRun());

    if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
    setMotion(90, 3);
    window.__entranceDriveControl("throttle", true);
    step(1000, Math.max(1, Math.floor(trip().centerlineEnforcementSeconds -
      trip().centerlineElapsed)));
    report.steps.resumedGrace = copy(trip());
    step(1000);
    window.__entranceDriveControl("throttle", false);
    report.steps.resumedEnforced = copy(trip());
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) {
        report.errors.push(String(error && error.stack || error));
      }).then(function () {
        report.errors = (window.__errs || []).concat(report.errors);
        document.getElementById("__report").textContent = JSON.stringify(report);
      });
    }, 220);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("loft-day.html Road Trip centre-line moving clock:");
var result = lib.runPageSync("loft-day.html", HARNESS, 5000, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.movingGrace && s.movingGrace.centerlineElapsed >= 9.8 &&
  s.movingGrace.centerlineElapsed < s.movingGrace.centerlineEnforcementSeconds &&
  !s.movingGrace.centerlineEnforced && s.movingGrace.police.phase === "idle" &&
  s.movingEnforced.centerlineEnforced && s.movingEnforced.police.phase === "pursuit" &&
  s.movingEnforced.police.offence === "solid-line",
  "ten actual moving seconds across the double solid line still trigger enforcement",
  { grace: s.movingGrace, enforced: s.movingEnforced });
check(s.crash && s.crash.trip.collisions === 1 && s.crash.drive.speed === 0 &&
  !s.crash.car.engineOn && s.crash.trip.centerlineElapsed > 0 &&
  !s.crash.trip.centerlineEnforced && s.crash.trip.police.phase === "idle" &&
  s.stationary.centerlineElapsed === s.crash.trip.centerlineElapsed &&
  !s.stationary.centerlineEnforced && s.stationary.police.phase === "idle",
  "twelve stationary seconds after a centre-line crash add no violation time",
  { crash: s.crash, stationary: s.stationary });
check(s.checkpoint && s.checkpoint.state &&
  s.checkpoint.state.centerlineExcursion === s.stationary.centerlineExcursion &&
  s.checkpoint.state.centerlineElapsed === s.stationary.centerlineElapsed &&
  s.checkpoint.state.centerlineEnforced === s.stationary.centerlineEnforced,
  "the paused-run checkpoint retains the frozen centre-line clock exactly",
  { checkpoint: s.checkpoint && s.checkpoint.state, stationary: s.stationary });
check(s.resumedGrace && s.resumedGrace.centerlineElapsed < s.resumedGrace.centerlineEnforcementSeconds &&
  !s.resumedGrace.centerlineEnforced && s.resumedEnforced.centerlineEnforced &&
  s.resumedEnforced.police.offence === "solid-line",
  "restarting movement resumes the retained clock and eventually enforces the violation",
  { grace: s.resumedGrace, enforced: s.resumedEnforced });
if (failures) process.exit(1);
console.log("Road Trip centre-line moving-clock assertions passed.");
