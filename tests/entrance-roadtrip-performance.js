#!/usr/bin/env node
// Adaptive Road Trip painting: low frame health spends fewer DOM mutations without slowing physics.
"use strict";

var lib = require("./lib");
var failures = 0;

function check(ok, label, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + label);
  if (!ok) {
    failures++;
    if (detail !== undefined) console.log("    " + JSON.stringify(detail));
  }
}

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function drive() { return window.__entranceRoomState().drive; }
  function begin() {
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("banff", 0);
    window.__entranceRoadtripSetDistance(0);
    window.__entranceRoadtripSetSeed(0x12345678);
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveTransmissionMode("auto");
    window.__entranceDriveSetMotion(115, 4);
    window.__entranceRoadtripSpawn("car", 1.5, 80, { speedKmh: 112 });
  }
  var originalSet = Element.prototype.setAttribute;
  var originalRemove = Element.prototype.removeAttribute;
  var originalAppend = Element.prototype.appendChild;
  var counters = null;
  Element.prototype.setAttribute = function (name, value) {
    if (counters) {
      counters.attributes++;
      if (this === counters.road && name === "d") counters.roadPaints++;
    }
    return originalSet.call(this, name, value);
  };
  Element.prototype.removeAttribute = function (name) {
    if (counters) counters.removes++;
    return originalRemove.call(this, name);
  };
  Element.prototype.appendChild = function (node) {
    if (counters) counters.appends++;
    return originalAppend.call(this, node);
  };
  function run(low) {
    begin();
    if (low) {
      window.__frameHealthFeed(40);
      window.__frameHealthFeed(40);
    } else {
      window.__frameHealthFeed(60);
      window.__frameHealthFeed(60);
      window.__frameHealthFeed(60);
    }
    var before = copy(drive());
    counters = {
      attributes: 0,
      removes: 0,
      appends: 0,
      roadPaints: 0,
      road: document.querySelector("#entrance-roadtrip-road .entrance-roadtrip-asphalt")
    };
    for (var i = 0; i < 20; i++) window.__entranceDriveStep(16);
    var after = copy(drive());
    var result = {
      counters: {
        attributes: counters.attributes,
        removes: counters.removes,
        appends: counters.appends,
        roadPaints: counters.roadPaints
      },
      elapsed: after.roadtrip.elapsedSeconds - before.roadtrip.elapsedSeconds,
      distance: after.roadtrip.distance - before.roadtrip.distance,
      entityCount: after.roadtrip.entityCount,
      health: window.__frameHealthState()
    };
    counters = null;
    return result;
  }
  try {
    Object.defineProperty(document, "hasFocus", {
      value: function () { return true; }, configurable: true
    });
    window.__unlockAllRooms();
    window.goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
    report.healthy = run(false);
    report.low = run(true);
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  Element.prototype.setAttribute = originalSet;
  Element.prototype.removeAttribute = originalRemove;
  Element.prototype.appendChild = originalAppend;
  report.errors = (window.__errs || []).concat(report.errors);
  document.getElementById("__report").textContent = JSON.stringify(report);
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 4500, {
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2026-09-22&time=14:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});

console.log("loft-day.html adaptive Road Trip painting:");
check(result && result.errors.length === 0, "focused performance probe has no page errors",
  result && result.errors);
var healthy = result && result.healthy;
var low = result && result.low;
check(healthy && low && !healthy.health.slow && low.health.slow,
  "frame-health hysteresis selects the adaptive highway painter", { healthy: healthy, low: low });
check(healthy && low && healthy.counters.roadPaints === 20 &&
  low.counters.roadPaints >= 9 && low.counters.roadPaints <= 11,
  "healthy driving paints every step while low-frame driving caps the world near 30 Hz",
  { healthy: healthy && healthy.counters, low: low && low.counters });
check(healthy && low && low.counters.attributes < healthy.counters.attributes * .66,
  "the low-frame world spends less than 66% of the healthy SVG attribute budget",
  { healthy: healthy && healthy.counters, low: low && low.counters });
check(healthy && low && low.counters.removes === 0 && low.counters.appends === 0,
  "steady traffic and idle police cause no no-op removals or DOM layer reorders", low && low.counters);
check(healthy && low && Math.abs(healthy.elapsed - .32) < .0001 &&
  Math.abs(low.elapsed - healthy.elapsed) < .0001 && Math.abs(low.distance - healthy.distance) < .05,
  "physics and route progress remain full-rate under the lower paint budget",
  { healthy: healthy, low: low });
check(healthy && low && healthy.entityCount === 1 && low.entityCount === 1,
  "traffic simulation ownership is unchanged by paint cadence", { healthy: healthy, low: low });

if (failures) {
  console.error(failures + " adaptive Road Trip performance assertion(s) failed.");
  process.exit(1);
}
console.log("Adaptive Road Trip performance assertions passed.");
