#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () {
  setTimeout(function () {
    var roadtrip = window.__entranceRoomState().drive.roadtrip;
    document.getElementById("__report").textContent = JSON.stringify({
      errors: window.__errs || [],
      scale: roadtrip.durationScale,
      pace: roadtrip.routePaceKmh,
      distances: [roadtrip.calgaryDistance, roadtrip.turnoffDistanceRequired,
        roadtrip.banffDistanceRequired, roadtrip.lakeTurnoffDistanceRequired,
        roadtrip.abrahamDistanceRequired]
    });
  }, 180);
});
</script>`;

function run(forceCoarsePointer) {
  return lib.runPageSync("loft-day.html", HARNESS, 1200, {
    forceCoarsePointer: forceCoarsePointer,
    urlSuffix: "?date=2026-07-15&time=12:00"
  });
}

var desktop = run(false);
var mobile = run(true);
var failures = 0;
function distancesEqual(actual, expectedSeconds, pace) {
  var expected = expectedSeconds.map(function (seconds) { return seconds * pace / 3.6; });
  return actual && actual.length === expected.length && actual.every(function (value, index) {
    return Math.abs(value - expected[index]) < .000001;
  });
}
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + message + (!ok ? "   [" + JSON.stringify(detail) + "]" : ""));
  if (!ok) failures++;
}

console.log("loft-day.html mobile Road Trip distance:");
check(desktop && desktop.errors.length === 0 && desktop.scale === 1 &&
  distancesEqual(desktop.distances, [75, 6, 75, 6, 75], desktop.pace),
  "fine-pointer desktop keeps the authored route lengths", desktop);
check(mobile && mobile.errors.length === 0 && mobile.scale === .6 &&
  distancesEqual(mobile.distances, [45, 3.6, 45, 3.6, 45], mobile.pace),
  "touch-first mobile uses 60% of every route length", mobile);

if (failures) process.exit(1);
console.log("Mobile Road Trip distance checks passed.");
