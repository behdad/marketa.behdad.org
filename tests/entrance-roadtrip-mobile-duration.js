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
      durations: [roadtrip.calgarySeconds, roadtrip.turnoffSeconds, roadtrip.banffSeconds,
        roadtrip.lakeTurnoffSeconds, roadtrip.abrahamSeconds]
    });
  }, 180);
});
</script>`;

function run(forceCoarsePointer) {
  return lib.runPageSync("rsvp.html", HARNESS, 1200, {
    forceCoarsePointer: forceCoarsePointer,
    urlSuffix: "?date=2026-07-15&time=12:00#play"
  });
}

var desktop = run(false);
var mobile = run(true);
var failures = 0;
function durationsEqual(actual, expected) {
  return actual && actual.length === expected.length && actual.every(function (value, index) {
    return Math.abs(value - expected[index]) < .000001;
  });
}
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + message + (!ok ? "   [" + JSON.stringify(detail) + "]" : ""));
  if (!ok) failures++;
}

console.log("rsvp.html mobile Road Trip duration:");
check(desktop && desktop.errors.length === 0 && desktop.scale === 1 &&
  durationsEqual(desktop.durations, [75, 6, 90, 6, 75]),
  "fine-pointer desktop keeps the authored route durations", desktop);
check(mobile && mobile.errors.length === 0 && mobile.scale === .6 &&
  durationsEqual(mobile.durations, [45, 3.6, 54, 3.6, 45]),
  "touch-first mobile uses 60% of every attended route phase", mobile);

if (failures) process.exit(1);
console.log("Mobile Road Trip duration checks passed.");
