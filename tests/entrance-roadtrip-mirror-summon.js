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
        window.__entranceRoadtripStart();
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

        window.__entranceDriveSetMotion(40, 3);
        for (var movingIndex = 0; movingIndex < 2; movingIndex++) summon();
        report.steps.moving = state();

        window.__entranceDriveSetMotion(120, 4);
        for (var highIndex = 0; highIndex < 2; highIndex++) summon();
        report.steps.high = state();

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

console.log("rsvp.html Road Trip mirror traffic stress control:");
var result = lib.runPageSync("rsvp.html", HARNESS, 4200, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
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
var plannedTrafficKinds = new Set((steps.planA || []).map(function (row) { return row.traffic.type; }));
var plannedTrafficLanes = new Set((steps.planA || []).map(function (row) { return row.traffic.lane; }));
check(plannedOvertakerLanes.has(.5) && plannedOvertakerLanes.has(1.5) &&
  plannedTrafficKinds.size > 1 && plannedTrafficLanes.size > 2,
  "the seeded summon deck varies overtaker lanes plus ordinary traffic type and lane", steps.planA);
var lowEntities = steps.low && steps.low.entities || [];
check(lowEntities.length === 1 && lowEntities[0].overtakingPlayer && lowEntities[0].direction === "forward" &&
  lowEntities[0].lane === .5 && lowEntities[0].overtakeLaneTarget === 1.5 &&
  lowEntities[0].overtakeHornPending && lowEntities[0].at < steps.low.distance,
  "a stopped inner-lane double-click queues a horn and an outer-lane pass from behind", steps.low);
var movingEntities = steps.moving && steps.moving.entities || [];
var movingLanes = new Set(movingEntities.map(function (row) { return row.lane; }));
check(movingEntities.length === 3 && movingEntities.every(function (row) {
  return row.overtakingPlayer && row.direction === "forward" && (row.lane === .5 || row.lane === 1.5);
}) && movingLanes.has(.5) && movingLanes.has(1.5),
  "moving low-speed summons can originate in either same-direction lane", steps.moving);
var highEntities = steps.high && steps.high.entities || [];
var ordinary = highEntities.filter(function (row) { return !row.overtakingPlayer; });
check(highEntities.length === 5 && ordinary.length === 2 &&
  new Set(ordinary.map(function (row) { return row.type; })).size > 1 &&
  new Set(ordinary.map(function (row) { return row.lane; })).size > 1 &&
  ordinary.every(function (row) { return row.at > steps.high.distance; }),
  "high-speed double-clicks summon varied traffic ahead", steps.high);
check(steps.flood && steps.flood.entityCount === steps.flood.poolSize && steps.flood.poolSize === 16,
  "repeated double-clicks deliberately flood every traffic-pool slot", steps.flood);

if (failures) process.exit(1);
console.log("Mirror traffic stress checks passed.");
