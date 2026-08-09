#!/usr/bin/env node
// The rear-view mirror doubles as an intentionally uncapped traffic stress control.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function state() { return window.__entranceRoomState().drive.roadtrip; }
  function summon() {
    document.getElementById("entrance-roadtrip-mirror").dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("banff", 0);
        window.__entranceRoadtripSetSeed(0x12345678);

        report.steps.planA = Array.from({ length: 10 }, function (_, serial) {
          return {
            overtaker: window.__entranceRoadtripSummonPlan(true, serial),
            traffic: window.__entranceRoadtripSummonPlan(false, serial)
          };
        });
        window.__entranceRoadtripSetSeed(0x12345678);
        report.steps.planARepeat = Array.from({ length: 10 }, function (_, serial) {
          return {
            overtaker: window.__entranceRoadtripSummonPlan(true, serial),
            traffic: window.__entranceRoadtripSummonPlan(false, serial)
          };
        });
        window.__entranceRoadtripSetSeed(0x87654321);
        report.steps.planB = Array.from({ length: 10 }, function (_, serial) {
          return {
            overtaker: window.__entranceRoadtripSummonPlan(true, serial),
            traffic: window.__entranceRoadtripSummonPlan(false, serial)
          };
        });
        window.__entranceRoadtripSetSeed(0x12345678);

        window.__entranceDriveSetMotion(0, 0);
        window.__entranceRoadtripSetLane(.5);
        summon();
        report.steps.low = state();

        window.__entranceRoadtripSetLane(2.2);
        summon();
        report.steps.shoulder = state();

        report.steps.hornProfiles = {
          passing: window.__entranceRoadtripHornProfile(
            { type: "car", lane: 1.5, velocity: 27 }, 0, "passing"),
          oncomingNear: window.__entranceRoadtripHornProfile(
            { type: "car", lane: -.5, velocity: -27 }, 18, "oncoming"),
          oncomingFar: window.__entranceRoadtripHornProfile(
            { type: "car", lane: -.5, velocity: -27 }, 36, "oncoming")
        };

        window.__entranceRoadtripSetLane(.5);
        window.__entranceDriveSetMotion(40, 3);
        for (var movingIndex = 0; movingIndex < 2; movingIndex++) summon();
        report.steps.moving = state();

        window.__entranceDriveSetMotion(120, 4);
        for (var highIndex = 0; highIndex < 2; highIndex++) summon();
        report.steps.high = state();

        window.__entranceDriveSetMotion(0, 0);
        window.__entranceRoadtripSpawn("car", -.5, 30);
        window.__entranceRoadtripSetLane(.5);
        window.__entranceDriveStep(100);
        report.steps.oncomingOwnLane = state();
        window.__entranceRoadtripSetLane(-.5);
        window.__entranceDriveStep(100);
        report.steps.oncomingWrongLane = state();
        window.__entranceDriveStep(100);
        report.steps.oncomingLatched = state();

        for (var index = 0; index < 24; index++) summon();
        report.steps.flood = state();
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      document.getElementById("__report").textContent = JSON.stringify(report);
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

console.log("loft-day.html Road Trip mirror traffic stress control:");
var result = lib.runPageSync("loft-day.html", HARNESS, 4200, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
check(result && result.errors.length === 0, "the focused drive has no uncaught errors", result && result.errors);
var steps = result && result.steps || {};
check(JSON.stringify(steps.planA) === JSON.stringify(steps.planARepeat) &&
  JSON.stringify(steps.planA) !== JSON.stringify(steps.planB),
  "summoned traffic plans reproduce under one run seed and vary under another", {
    a: steps.planA, repeat: steps.planARepeat, b: steps.planB
  });
var plannedOvertakerLanes = new Set((steps.planA || []).map(function (row) { return row.overtaker.lane; }));
var plannedTrafficLanes = new Set((steps.planA || []).map(function (row) { return row.traffic.lane; }));
var vehicleTypes = ["car", "pickup", "truck", "rv"];
var plannedOvertakerTypes = new Set((steps.planA || []).map(function (row) { return row.overtaker.type; }));
var plannedTrafficTypes = new Set((steps.planA || []).map(function (row) { return row.traffic.type; }));
check(plannedOvertakerLanes.has(.5) && plannedOvertakerLanes.has(1.5) &&
  plannedTrafficLanes.size > 2 && vehicleTypes.every(function (type) {
    return plannedOvertakerTypes.has(type) && plannedTrafficTypes.has(type);
  }),
  "repeated seeded summons include sedans, pickups, semis, and RVs across varied lanes", steps.planA);
var lowEntities = steps.low && steps.low.entities || [];
check(lowEntities.length === 1 && lowEntities[0].overtakingPlayer && lowEntities[0].direction === "forward" &&
  lowEntities[0].lane === .5 && lowEntities[0].overtakeLaneTarget === 1.5 &&
  lowEntities[0].overtakeHornPending && lowEntities[0].at < steps.low.distance,
  "a stopped inner-lane double-click queues a horn and an outer-lane pass from behind", steps.low);
var shoulderEntities = steps.shoulder && steps.shoulder.entities || [];
var shoulderOvertaker = shoulderEntities[shoulderEntities.length - 1];
check(shoulderOvertaker && vehicleTypes.indexOf(shoulderOvertaker.type) >= 0 && shoulderOvertaker.overtakingPlayer &&
  !shoulderOvertaker.overtakeHornPending,
  "a stopped Porsche on the shoulder never arms a passing horn", steps.shoulder);
var horns = steps.hornProfiles || {};
check(horns.passing && horns.passing.kind === "passing" && horns.passing.duration >= .6 &&
  horns.passing.duration <= .7 && horns.oncomingNear &&
  horns.oncomingNear.kind === "oncoming-warning" && horns.oncomingNear.duration >= 1.2 &&
  horns.oncomingNear.duration <= 1.5 && horns.oncomingNear.duration > horns.passing.duration &&
  horns.oncomingNear.frequency !== horns.passing.frequency && horns.oncomingNear.pan < 0 &&
  horns.oncomingNear.gain > horns.oncomingFar.gain,
  "passing and wrong-lane horns have distinct spatial, distance-aware 0.66 s / 1.35 s profiles", horns);
var movingEntities = steps.moving && steps.moving.entities || [];
var movingLanes = new Set(movingEntities.map(function (row) { return row.lane; }));
check(movingEntities.length === 4 && movingEntities.every(function (row) {
  return vehicleTypes.indexOf(row.type) >= 0 && row.overtakingPlayer && row.direction === "forward" &&
    (row.lane === .5 || row.lane === 1.5);
}) && movingLanes.has(.5) && movingLanes.has(1.5) &&
  vehicleTypes.every(function (type) {
    return movingEntities.some(function (row) { return row.type === type; });
  }),
  "four low-speed summons expose the full vehicle mix in both same-direction lanes", steps.moving);
var highEntities = steps.high && steps.high.entities || [];
var ordinary = highEntities.filter(function (row) { return !row.overtakingPlayer; });
check(highEntities.length === 6 && ordinary.length === 2 &&
  ordinary.every(function (row) { return vehicleTypes.indexOf(row.type) >= 0; }) &&
  new Set(ordinary.map(function (row) { return row.lane; })).size > 1 &&
  ordinary.every(function (row) { return row.at > steps.high.distance; }),
  "high-speed double-clicks continue the varied vehicle deck in safe lanes ahead", steps.high);
function newestOncoming(step) {
  return (step && step.entities || []).filter(function (row) {
    return row.direction === "oncoming";
  }).sort(function (left, right) { return right.serial - left.serial; })[0];
}
var ownLaneOncoming = newestOncoming(steps.oncomingOwnLane);
var wrongLaneOncoming = newestOncoming(steps.oncomingWrongLane);
var latchedOncoming = newestOncoming(steps.oncomingLatched);
check(ownLaneOncoming && !ownLaneOncoming.oncomingHorned && wrongLaneOncoming &&
  wrongLaneOncoming.oncomingHorned && latchedOncoming && latchedOncoming.oncomingHorned,
  "an oncoming sedan horns once only after the Porsche enters its negative lane", {
    own: ownLaneOncoming, wrong: wrongLaneOncoming, latched: latchedOncoming
  });
check(steps.flood && steps.flood.entityCount === steps.flood.poolSize && steps.flood.poolSize === 16,
  "repeated double-clicks deliberately flood every traffic-pool slot", steps.flood);
check(steps.flood && vehicleTypes.every(function (type) {
  return steps.flood.entities.some(function (row) { return row.type === type; });
}), "the flooded live pool visibly contains every summoned vehicle type", steps.flood);

if (failures) process.exit(1);
console.log("Mirror traffic stress checks passed.");
