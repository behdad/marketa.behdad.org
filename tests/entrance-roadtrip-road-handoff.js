#!/usr/bin/env node
// Exit ramps converge on the incoming road geometry before each route mode changes.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function trip() { return window.__entranceRoomState().drive.roadtrip; }
  function numbers(value) {
    return (String(value || "").match(/-?(?:\d+\.?\d*|\.\d+)/g) || []).map(Number);
  }
  function snapshot() {
    var world = document.getElementById("entrance-roadtrip-world");
    var road = document.getElementById("entrance-roadtrip-road");
    return {
      route: trip().route,
      lane: trip().playerLane,
      horizon: Number(world.getAttribute("data-roadtrip-horizon-y")),
      pitch: Number(world.getAttribute("data-roadtrip-camera-pitch-y")),
      paths: Array.prototype.map.call(road.querySelectorAll("path"), function (path) {
        return numbers(path.getAttribute("d"));
      })
    };
  }
  function delta(before, after) {
    var maximum = Math.max(Math.abs(before.horizon - after.horizon),
      Math.abs(before.pitch - after.pitch));
    if (before.paths.length !== after.paths.length) return Infinity;
    before.paths.forEach(function (path, pathIndex) {
      var other = after.paths[pathIndex];
      if (path.length !== other.length) {
        maximum = Infinity;
        return;
      }
      path.forEach(function (value, valueIndex) {
        maximum = Math.max(maximum, Math.abs(value - other[valueIndex]));
      });
    });
    return maximum;
  }
  function boundary(route, destination, required, totalDistance, lane) {
    window.__entranceRoadtripSetDistance(totalDistance);
    window.__entranceRoadtripSetRouteDistance(route, required - .001);
    window.__entranceRoadtripSetLane(lane);
    var before = snapshot();
    window.__entranceRoadtripStepRouteDistance(.002);
    var after = snapshot();
    return { lane: lane, before: before, after: after, delta: delta(before, after),
      destination: destination };
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", {
        value: function () { return true; }, configurable: true
      });
      window.__unlockAllRooms();
      window.__setSecondRound(true, { releaseHeld: false });
      window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
        "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripDevStart();
      var initial = trip();
      var pace = initial.routePaceKmh / 3.6;
      var calgaryBoundary = (initial.calgarySeconds + initial.turnoffSeconds) * pace;
      var abrahamBoundary = (initial.calgarySeconds + initial.turnoffSeconds +
        initial.banffSeconds + initial.lakeTurnoffSeconds) * pace;
      report.calgaryBanff = [-2.5, -1.5, -.5, .5, 1.5, 2.5].map(function (lane) {
        return boundary("turnoff", "banff", initial.turnoffDistanceRequired,
          calgaryBoundary, lane);
      });
      report.banffAbraham = [-1.5, -.5, .5, 1.5].map(function (lane) {
        return boundary("lake-turnoff", "abraham", initial.lakeTurnoffDistanceRequired,
          abrahamBoundary, lane);
      });
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 220); });
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
function verify(name, rows, destination) {
  check(rows.length > 0 && rows.every(function (row) {
    return row.before.route !== destination && row.after.route === destination && row.delta < .05;
  }), name + " keeps the foreground road continuous in every lane", rows.map(function (row) {
    return { lane: row.lane, before: row.before.route, after: row.after.route, delta: row.delta };
  }));
}
function run(label, opts) {
  console.log(label + ":");
  var result = lib.runPageSync("loft-day.html", HARNESS, 5000, opts);
  check(result && result.errors.length === 0, "the boundary sweep has no uncaught errors",
    result && result.errors);
  verify("Calgary → Banff", result && result.calgaryBanff || [], "banff");
  verify("Banff → Abraham Lake", result && result.banffAbraham || [], "abraham");
}

console.log("loft-day.html Road Trip foreground handoffs:");
run("desktop landscape", {
  patchRaf: true, seedRandom: true, forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,700"
});
run("mobile landscape", {
  patchRaf: true, seedRandom: true, forceMotion: true, forceCoarsePointer: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=844,390"
});

if (failures) process.exit(1);
console.log("Road Trip foreground handoff checks passed.");
