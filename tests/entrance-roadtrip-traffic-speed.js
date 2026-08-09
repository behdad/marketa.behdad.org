#!/usr/bin/env node
// Natural traffic uses the active route's posted limit in its real seeded spawn plan.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], routes: {} };
  var trafficTypes = ["car", "pickup", "truck", "rv"];
  function state() { return window.__entranceRoomState().drive.roadtrip; }
  function sampleRoute(route, seed) {
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute(route, 0);
    window.__entranceRoadtripSetSeed(seed);
    var limit = state().speedLimit;
    var plans = Array.from({ length: 220 }, function (_, serial) {
      return window.__entranceRoadtripSpawnPlan(false, serial);
    });
    var forward = plans.filter(function (row) {
      return row.direction === "forward" && trafficTypes.indexOf(row.type) >= 0;
    });
    var productionPlan = plans.slice(0, 16);
    productionPlan.forEach(function () { window.__entranceRoadtripNaturalSpawn(); });
    var actual = state().entities.filter(function (row) {
      return trafficTypes.indexOf(row.type) >= 0;
    }).map(function (row) {
      var expected = productionPlan[row.serial - 1];
      return {
        serial: row.serial,
        type: row.type,
        direction: row.direction,
        speedKmh: Math.abs(row.cruiseVelocity) * 3.6,
        plannedKmh: expected && expected.speedKmh
      };
    });
    report.routes[route] = {
      limit: limit,
      forward: forward,
      actual: actual,
      pursuit: Array.from({ length: 44 }, function (_, serial) {
        return window.__entranceRoadtripSpawnPlan(true, serial);
      }).filter(function (row) { return trafficTypes.indexOf(row.type) >= 0; }),
      summoned: Array.from({ length: 20 }, function (_, serial) {
        return window.__entranceRoadtripSummonPlan(false, serial);
      })
    };
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      sampleRoute("calgary", 0x12345678);
      sampleRoute("banff", 0x12345678);
      sampleRoute("abraham", 0x12345678);
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 180); });
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
function median(values) {
  values = values.slice().sort(function (a, b) { return a - b; });
  var middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}
function speedSignature(rows) {
  return rows.map(function (row) { return [row.type, row.speedKmh]; });
}

console.log("loft-day.html route-aware natural traffic speed:");
var result = lib.runPageSync("loft-day.html", HARNESS, 3800, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the production-plan sample has no uncaught errors",
  result && result.errors);
var routes = result && result.routes || {};
["calgary", "banff", "abraham"].forEach(function (route) {
  var sample = routes[route] || {};
  var speeds = (sample.forward || []).map(function (row) { return row.speedKmh; });
  var heavy = (sample.forward || []).filter(function (row) {
    return row.type === "rv" || row.type === "truck";
  }).map(function (row) { return row.speedKmh; });
  var light = (sample.forward || []).filter(function (row) {
    return row.type === "car" || row.type === "pickup";
  }).map(function (row) { return row.speedKmh; });
  var forwardMedian = speeds.length ? median(speeds) : 0;
  check(speeds.length >= 35 && forwardMedian >= sample.limit + 10,
    route + " forward-traffic median is " + forwardMedian + " km/h against " + sample.limit + " posted", {
      count: speeds.length, limit: sample.limit, median: forwardMedian
    });
  check(heavy.some(function (speed) { return speed < sample.limit; }) &&
    new Set(heavy).size >= 4 && new Set(light).size >= 6,
    route + " preserves a seeded slower heavy-vehicle tail and faster-driver diversity", {
      heavy: Array.from(new Set(heavy)).sort(function (a, b) { return a - b; }),
      light: Array.from(new Set(light)).sort(function (a, b) { return a - b; })
    });
  check((sample.actual || []).length >= 6 && sample.actual.every(function (row) {
    return Math.abs(row.speedKmh - row.plannedKmh) < .001;
  }), route + " production spawns consume the sampled plan speeds", sample.actual);
});
check(routes.calgary && routes.banff && routes.abraham &&
  median(routes.calgary.forward.map(function (row) { return row.speedKmh; })) >
    median(routes.banff.forward.map(function (row) { return row.speedKmh; })) &&
  median(routes.abraham.forward.map(function (row) { return row.speedKmh; })) >
    median(routes.banff.forward.map(function (row) { return row.speedKmh; })),
  "natural traffic changes pace with the active route rather than one global distribution");
check(routes.calgary && routes.banff &&
  JSON.stringify(speedSignature(routes.calgary.pursuit)) ===
    JSON.stringify(speedSignature(routes.banff.pursuit)) &&
  JSON.stringify(speedSignature(routes.calgary.summoned)) ===
    JSON.stringify(speedSignature(routes.banff.summoned)),
  "pursuit and summoned traffic retain their explicit seeded speed profiles");

if (failures) process.exit(1);
console.log("Route-aware traffic speed checks passed.");
