#!/usr/bin/env node
// Natural spawns, wildlife, traffic manoeuvres, and police share bounded breathing room.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function trip() { return window.__entranceRoomState().drive.roadtrip; }
  function step(ms, count) {
    for (var index = 0; index < (count || 1); index++) window.__entranceDriveStep(ms);
  }
  function start(route) {
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute(route || "banff", 0);
    window.__entranceRoadtripSetSeed(0x12345678);
    window.__entranceRoadtripSetLane(2.08);
  }
  function trafficState(node) {
    return {
      passing: node && node.getAttribute("data-roadtrip-passing"),
      following: node && node.getAttribute("data-roadtrip-following"),
      lane: Number(node && node.getAttribute("data-roadtrip-lane"))
    };
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", {
        value: function () { return true; }, configurable: true
      });
      window.__unlockAllRooms();
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();

      start();
      window.__entranceDriveSetMotion(263, 0);
      step(1000);
      report.steps.coarse = copy(trip());

      start();
      for (var slot = 0; slot < 16; slot++) {
        window.__entranceRoadtripSpawn("heart", .5, 112);
      }
      window.__entranceDriveSetMotion(263, 0);
      step(1000);
      report.steps.poolFull = copy(trip());
      step(1000, 2);
      report.steps.poolCleared = copy(trip());
      step(250);
      report.steps.poolRecovered = copy(trip());

      start();
      window.__entranceDriveSetMotion(0, 0);
      step(1000);
      report.steps.overtakeOpening = copy(trip());
      step(1000, 5);
      report.steps.overtakeArrived = copy(trip());

      start();
      window.__entranceDriveSetMotion(70, 0);
      window.__entranceRoadtripSpawn("rabbit", .5, 10);
      window.__entranceRoadtripSpawn("rv", 1.5, 40, { speedKmh: 70 });
      var faster = window.__entranceRoadtripSpawn("car", 1.5, 12, { speedKmh: 110 });
      step(100);
      report.steps.wildlifeQueue = {
        pacing: copy(trip().incidentPacing),
        traffic: trafficState(faster)
      };
      step(1000);
      report.steps.wildlifeCleared = {
        pacing: copy(trip().incidentPacing),
        traffic: trafficState(faster)
      };

      start();
      var firstPoliceDistance = trip().policeFirstDistance;
      window.__entranceRoadtripSetDistance(firstPoliceDistance - 1);
      window.__entranceRoadtripSpawn("rabbit", .5, 30);
      window.__entranceDriveSetMotion(30, 0);
      step(1000);
      report.steps.policeHeld = copy(trip());
      var rabbit = trip().entities.find(function (entity) { return entity.type === "rabbit"; });
      window.__entranceRoadtripSetDistance(rabbit.at + 4);
      window.__entranceDriveSetMotion(0, 0);
      step(100);
      report.steps.policeReleased = copy(trip());

      start();
      window.__entranceRoadtripSetDistance(trip().policeFirstDistance +
        trip().incidentPacing.policeMaxDelayDistance + 1);
      window.__entranceRoadtripSpawn("rabbit", .5, 30);
      window.__entranceDriveSetMotion(0, 0);
      step(100);
      report.steps.policeBounded = copy(trip());

      start("abraham");
      window.__entranceRoadtripSetRoute("abraham", 57);
      window.__entranceRoadtripSetDistance(trip().policeFirstDistance + 1);
      window.__entranceDriveSetMotion(0, 0);
      step(100);
      report.steps.campExitProtected = copy(trip());
      window.__entranceRoadtripSetRoute("abraham", 0);
      step(100);
      report.steps.campExitCleared = copy(trip());

      start();
      window.__entranceRoadtripSpawn("rabbit", .5, 30);
      report.steps.directSummon = !!window.__entranceRoadtripSpawnOvertaker();
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 180); });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 4800, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}
function overtakers(state) {
  return (state && state.entities || []).filter(function (entity) { return entity.overtakingPlayer; });
}

console.log("loft-day.html Road Trip incident pacing:");
var steps = result && result.steps || {};
check(result && result.errors.length === 0, "the production pacing probes have no uncaught errors",
  result && result.errors);
check(steps.coarse && steps.coarse.spawnSerial === 1 && steps.coarse.entityCount === 1 &&
  steps.coarse.nextSpawnDistance > steps.coarse.distance,
  "a coarse high-speed step emits one anchored beat instead of a catch-up burst", steps.coarse);
check(steps.poolFull && steps.poolFull.entityCount === steps.poolFull.poolSize &&
  steps.poolFull.spawnSerial === steps.poolFull.poolSize &&
  Math.abs(steps.poolFull.nextSpawnDistance - steps.poolFull.distance -
    steps.poolFull.incidentPacing.spawnRetryDistance) < .01,
  "a full pool preserves the due plan and schedules a short retry", steps.poolFull);
check(steps.poolCleared && steps.poolCleared.entityCount === 0 && steps.poolRecovered &&
  steps.poolRecovered.spawnSerial === steps.poolFull.spawnSerial + 1 &&
  steps.poolRecovered.entityCount === 1,
  "the same plan enters promptly once capacity clears instead of leaving a dead stretch", {
    cleared: steps.poolCleared, recovered: steps.poolRecovered
  });
check(steps.overtakeOpening && overtakers(steps.overtakeOpening).length === 0 &&
  steps.overtakeOpening.overtakeCooldown >= 4.9,
  "the opening beat is clear of an immediate rear overtake", steps.overtakeOpening);
check(steps.overtakeArrived && overtakers(steps.overtakeArrived).length === 1,
  "automatic rear traffic still arrives after the bounded opening breath", steps.overtakeArrived);
check(steps.wildlifeQueue && steps.wildlifeQueue.pacing.wildlifeActive &&
  steps.wildlifeQueue.traffic.passing === "false" &&
  steps.wildlifeQueue.traffic.following === "true",
  "a faster driver queues instead of beginning an overtake through visible wildlife",
  steps.wildlifeQueue);
check(steps.wildlifeCleared && !steps.wildlifeCleared.pacing.wildlifeActive &&
  steps.wildlifeCleared.traffic.passing === "true",
  "the queued driver takes the pass as soon as the wildlife beat clears", steps.wildlifeCleared);
check(steps.policeHeld && steps.policeHeld.distance >= steps.policeHeld.policeFirstDistance &&
  steps.policeHeld.police.phase === "idle" && steps.policeHeld.incidentPacing.wildlifeActive,
  "the production police clock waits for visible wildlife", steps.policeHeld);
check(steps.policeReleased && steps.policeReleased.police.phase === "warning" &&
  !steps.policeReleased.incidentPacing.wildlifeActive,
  "the speed-trap warning begins as soon as the scene clears", steps.policeReleased);
check(steps.policeBounded && steps.policeBounded.police.phase === "warning" &&
  steps.policeBounded.incidentPacing.wildlifeActive,
  "police deferral has a distance cap, so a persistent conflict cannot create dead air",
  steps.policeBounded);
check(steps.campExitProtected && steps.campExitProtected.police.phase === "idle" &&
  steps.campExitProtected.incidentPacing.campExitProtected &&
  steps.campExitProtected.campExitVisible,
  "a due speed trap yields while the Camping turnoff owns the roadside", steps.campExitProtected);
check(steps.campExitCleared && steps.campExitCleared.police.phase === "warning" &&
  !steps.campExitCleared.incidentPacing.campExitProtected,
  "the deferred speed trap releases after the Camping turnoff has cleared", steps.campExitCleared);
check(steps.directSummon === true,
  "an explicit mirror summon bypasses automatic pacing and remains player-owned");

if (failures) process.exit(1);
console.log("Road Trip incident-pacing checks passed.");
