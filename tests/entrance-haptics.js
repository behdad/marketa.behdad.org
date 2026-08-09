#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: window.__errs || [], pulses: [] };
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      Object.defineProperty(navigator, "vibrate", {
        value: function (pattern) { report.pulses.push(copy(pattern)); return true; }, configurable: true
      });
      window.__unlockAllRooms();
      window.goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      window.__toggleEntrancePorscheEngine();
      report.afterIgnition = copy(report.pulses);
      document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));

      window.__entranceDriveTransmissionMode("manual", true);
      window.__entranceDriveShift(1, true);
      report.afterManualShift = copy(report.pulses);

      window.__entranceDriveTransmissionMode("auto", true);
      window.__entranceDriveRange("N");
      report.afterAutoRange = copy(report.pulses);

      window.__entranceRoadtripDevStart();
      window.__entranceDriveSetMotion(100, 3);
      window.__entranceRoadtripSetLane(.5);
      window.__entranceRoadtripSpawn("deer", .5, 8);
      window.__entranceDriveStep(100);
      report.afterCollision = copy(report.pulses);
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 220); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 2600, {
  patchRaf: true,
  forceCoarsePointer: true,
  chromeFlags: "--window-size=390,844"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html Entrance driving haptics:");
check(result && result.errors.length === 0, "haptics harness has no uncaught page errors", result && result.errors);
check(result && result.afterIgnition.length === 1 && Array.isArray(result.afterIgnition[0]),
  "starting the ignition produces one short two-stage pulse", result && result.afterIgnition);
check(result && result.afterManualShift.length === 2 && result.afterManualShift[1] === 40,
  "a successful manual shift produces one light pulse", result && result.afterManualShift);
check(result && result.afterAutoRange.length === 3 && result.afterAutoRange[2] === 40,
  "a successful automatic range change produces one light pulse", result && result.afterAutoRange);
check(result && result.afterCollision.length === 4 && Array.isArray(result.afterCollision[3]) &&
  result.afterCollision[3].length === 3,
  "a traffic collision produces a distinct impact pattern", result && result.afterCollision);

if (failures) {
  console.log("\n" + failures + " Entrance haptics assertion(s) failed.");
  process.exit(1);
}
console.log("\nEntrance driving haptics assertions passed.");
