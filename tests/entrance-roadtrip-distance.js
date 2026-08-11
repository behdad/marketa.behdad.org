#!/usr/bin/env node
// Route legs advance on forward travel, never on elapsed or paused wall-clock time.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function roadtrip() { return window.__entranceRoomState().drive.roadtrip; }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart();

        window.__entranceDriveRange("P");
        window.__entranceDriveSetMotion(0, 0);
        report.stationaryBefore = roadtrip();
        for (var stoppedSecond = 0; stoppedSecond < 90; stoppedSecond++) {
          window.__entranceDriveStep(1000);
        }
        report.stationaryAfter = roadtrip();

        window.__toggleEntranceRoadtripTransport();
        report.pausedBefore = roadtrip();
        for (var pausedSecond = 0; pausedSecond < 30; pausedSecond++) {
          window.__entranceDriveStep(1000);
        }
        report.pausedAfter = roadtrip();
        window.__toggleEntranceRoadtripTransport();

        window.__entranceRoadtripSetRouteDistance("calgary", 0);
        var required = roadtrip().calgaryDistance;
        window.__entranceRoadtripStepRouteDistance(required - 1);
        report.nearExit = roadtrip();
        for (var idleStep = 0; idleStep < 100; idleStep++) {
          window.__entranceRoadtripStepRouteDistance(0);
        }
        report.zeroDistance = roadtrip();
        window.__entranceRoadtripStepRouteDistance(1.1);
        report.crossedExit = roadtrip();
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 260);
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

console.log("loft-day.html Road Trip distance progression:");
var result = lib.runPageSync("loft-day.html", HARNESS, 2500, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the distance scenario has no uncaught errors",
  result && result.errors);

var stationaryBefore = result && result.stationaryBefore || {};
var stationaryAfter = result && result.stationaryAfter || {};
check(stationaryAfter.elapsedSeconds >= stationaryBefore.elapsedSeconds + 89 &&
  stationaryAfter.route === "calgary" &&
  stationaryAfter.routeDistance === stationaryBefore.routeDistance,
  "ninety stationary seconds do not consume the Calgary leg", {
    before: stationaryBefore, after: stationaryAfter
  });

var pausedBefore = result && result.pausedBefore || {};
var pausedAfter = result && result.pausedAfter || {};
check(pausedBefore.resumePending && pausedAfter.resumePending &&
  pausedAfter.routeDistance === pausedBefore.routeDistance &&
  pausedAfter.elapsedSeconds === pausedBefore.elapsedSeconds,
  "paused wall-clock time advances neither route distance nor trip time", {
    before: pausedBefore, after: pausedAfter
  });

var nearExit = result && result.nearExit || {};
var zeroDistance = result && result.zeroDistance || {};
check(nearExit.route === "calgary" && zeroDistance.route === "calgary" &&
  zeroDistance.routeDistance === nearExit.routeDistance &&
  Math.abs(zeroDistance.routeDistance - (zeroDistance.calgaryDistance - 1)) < .001,
  "repeated zero-distance route steps cannot cross an exit", {
    before: nearExit, after: zeroDistance
  });

var crossedExit = result && result.crossedExit || {};
check(crossedExit.route === "turnoff" &&
  Math.abs(crossedExit.routeDistance - crossedExit.calgaryDistance) < .001,
  "the accumulated final metre advances to the turnoff", crossedExit);

if (failures) process.exit(1);
console.log("Road Trip distance progression assertions passed.");
