#!/usr/bin/env node
// Faster same-direction traffic passes when clear and follows safely when blocked.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function step(ms, count) {
    for (var index = 0; index < (count || 1); index++) window.__entranceDriveStep(ms);
  }
  function sample(node) {
    return {
      lane: Number(node && node.getAttribute("data-roadtrip-lane")),
      homeLane: Number(node && node.getAttribute("data-roadtrip-home-lane")),
      passing: node && node.getAttribute("data-roadtrip-passing"),
      returning: node && node.getAttribute("data-roadtrip-pass-returning"),
      following: node && node.getAttribute("data-roadtrip-following"),
      followTarget: Number(node && node.getAttribute("data-roadtrip-follow-target")),
      followGap: Number(node && node.getAttribute("data-roadtrip-follow-gap")),
      braking: node && node.getAttribute("data-roadtrip-braking"),
      brakeFill: node && getComputedStyle(node).getPropertyValue("--roadtrip-tail-fill").trim(),
      target: Number(node && node.getAttribute("data-roadtrip-pass-target")),
      speed: Number(node && node.getAttribute("data-roadtrip-speed")),
      active: node && node.getAttribute("visibility") !== "hidden"
    };
  }
  function route(name, playerLane) {
    window.__entranceRoadtripSetRoute(name, 0);
    window.__entranceRoadtripSetLane(playerLane);
    window.__entranceDriveSetMotion(70, 4);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
        window.__unlockAllRooms();
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart();

        route("banff", 2.08);
        window.__entranceRoadtripSpawn("rv", 1.5, 40, { speedKmh: 70 });
        var fast = window.__entranceRoadtripSpawn("car", 1.5, 12, { speedKmh: 110 });
        var phases = { pullout: null, passingLane: null, returning: null, returned: null };
        for (var tick = 0; tick < 90 && !phases.returned; tick++) {
          step(100);
          var now = sample(fast);
          if (!phases.pullout && now.passing === "true") phases.pullout = now;
          if (!phases.passingLane && now.passing === "true" && now.returning !== "true" && now.lane <= .51) {
            phases.passingLane = now;
          }
          if (!phases.returning && now.returning === "true") phases.returning = now;
          if (phases.returning && now.passing === "false") phases.returned = now;
        }
        report.steps.banff = phases;

        route("banff", 2.08);
        window.__entranceRoadtripSpawn("car", .5, 40, { speedKmh: 70 });
        var blocked = window.__entranceRoadtripSpawn("pickup", .5, 12, { speedKmh: 110 });
        window.__entranceRoadtripSpawn("car", -.5, 30, { speedKmh: 100 });
        step(100);
        report.steps.blockedBorrow = sample(blocked);
        // Keep this a three-vehicle flow probe: traffic still advances while the
        // stationary Porsche prevents the route-distance spawner joining it.
        window.__entranceDriveSetMotion(0, 0);
        var blockedMinGap = Infinity;
        var blockedPassing = null;
        for (var blockedTick = 0; blockedTick < 45 && !blockedPassing; blockedTick++) {
          step(100);
          var blockedNow = sample(blocked);
          if (blockedNow.following === "true") blockedMinGap = Math.min(blockedMinGap, blockedNow.followGap);
          if (blockedNow.passing === "true") blockedPassing = blockedNow;
        }
        report.steps.clearedBorrow = { minGap: blockedMinGap, passing: blockedPassing };

        route("abraham", 1.2);
        window.__entranceRoadtripSpawn("car", .5, 40, { speedKmh: 70 });
        var singleLane = window.__entranceRoadtripSpawn("pickup", .5, 12, { speedKmh: 110 });
        var abrahamMinGap = Infinity;
        var abrahamBraked = false;
        for (var abrahamTick = 0; abrahamTick < 40; abrahamTick++) {
          step(100);
          var abrahamNow = sample(singleLane);
          if (abrahamNow.following === "true") abrahamMinGap = Math.min(abrahamMinGap, abrahamNow.followGap);
          if (abrahamNow.braking === "true") abrahamBraked = true;
        }
        report.steps.abraham = { state: sample(singleLane), minGap: abrahamMinGap, braked: abrahamBraked };

        route("calgary", 3.2);
        window.__entranceRoadtripSpawn("rv", 2.5, 40, { speedKmh: 70 });
        var divided = window.__entranceRoadtripSpawn("car", 2.5, 12, { speedKmh: 110 });
        step(100);
        report.steps.calgary = sample(divided);
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

console.log("loft-day.html AI traffic overtaking:");
var source = fs.readFileSync(path.join(lib.ROOT, "loft-day.html"), "utf8");
check(/function syncRoadtripTrafficLane\(entity, seconds\)/.test(source) &&
  /function roadtripTrafficLead\(entity, lane\)/.test(source) &&
  /ROADTRIP_TRAFFIC_FOLLOW_MIN_GAP/.test(source) && /entity\.passReturning/.test(source),
  "traffic has explicit pass and bounded following states");

var result = lib.runPageSync("loft-day.html", HARNESS, 1800, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the focused drive has no uncaught errors", result && result.errors);
var steps = result && result.steps || {};
var banff = steps.banff || {};
check(banff.pullout && banff.pullout.homeLane === 1.5 && banff.pullout.lane < 1.5 && banff.pullout.target > 0,
  "faster Banff traffic pulls left around the slower vehicle", banff.pullout);
check(banff.passingLane && banff.passingLane.lane === .5 && banff.passingLane.speed >= 110,
  "the overtaker uses the passing lane with a modest speed advantage", banff.passingLane);
check(banff.returning && banff.returning.returning === "true" && banff.returning.lane > .5,
  "the overtaker waits for rear clearance before moving back", banff.returning);
check(banff.returned && banff.returned.passing === "false" && banff.returned.lane === 1.5 &&
  banff.returned.target === 0,
  "the overtaker settles in its original lane and clears pass state", banff.returned);
check(steps.blockedBorrow && steps.blockedBorrow.passing === "false" && steps.blockedBorrow.lane === .5 &&
  steps.blockedBorrow.following === "true" && steps.blockedBorrow.braking === "true" &&
  steps.blockedBorrow.followTarget > 0 && steps.blockedBorrow.brakeFill === "#ff3447",
  "blocked Banff traffic queues with visible brake feedback", steps.blockedBorrow);
check(steps.clearedBorrow && steps.clearedBorrow.minGap >= 7 && steps.clearedBorrow.passing &&
  steps.clearedBorrow.passing.passing === "true" && steps.clearedBorrow.passing.lane < .5,
  "the queue preserves bumper space, then passes when the opposing lane clears", steps.clearedBorrow);
check(steps.abraham && steps.abraham.state && steps.abraham.state.passing === "false" &&
  steps.abraham.state.lane === .5 && steps.abraham.state.following === "true" &&
  steps.abraham.braked && steps.abraham.minGap >= 7 && steps.abraham.state.speed <= 74,
  "single-lane Abraham Lake traffic settles behind the leader without weaving or overlap", steps.abraham);
check(steps.calgary && steps.calgary.passing === "true" && steps.calgary.homeLane === 2.5 &&
  steps.calgary.lane < 2.5 && steps.calgary.lane > 1.5,
  "Calgary traffic pulls into the adjacent same-direction lane", steps.calgary);

if (failures) process.exit(1);
console.log("AI traffic overtaking checks passed.");
