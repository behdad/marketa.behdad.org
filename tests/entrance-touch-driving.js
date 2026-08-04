#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: window.__errs || [], steps: {} };
  function pointer(target, type, id, primary, x) {
    target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: id, pointerType: "touch",
      button: 0, isPrimary: primary, clientX: x, clientY: 100
    }));
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      window.__toggleEntrancePorscheEngine();
      window.__entranceDriveTransmissionMode("auto", true);
      window.__entranceDriveRange("D");
      var throttle = document.getElementById("entrance-drive-throttle");
      var horn = document.getElementById("entrance-drive-horn");

      pointer(throttle, "pointerdown", 41, true, 100);
      pointer(horn, "pointerdown", 42, false, 200);
      pointer(horn, "pointermove", 42, false, 270);
      report.steps.throttleFirst = window.__entranceRoomState().drive;
      pointer(horn, "pointerup", 42, false, 270);
      pointer(throttle, "pointerup", 41, true, 100);

      pointer(horn, "pointerdown", 43, true, 200);
      pointer(horn, "pointermove", 43, true, 130);
      pointer(throttle, "pointerdown", 44, false, 100);
      report.steps.steeringFirst = window.__entranceRoomState().drive;
      pointer(throttle, "pointerup", 44, false, 100);
      pointer(horn, "pointerup", 43, true, 130);
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 220); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 2400, {
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

console.log("rsvp.html Entrance two-finger touch driving:");
check(result && result.errors.length === 0, "touch harness has no uncaught page errors", result && result.errors);
var steps = result && result.steps || {};
check(steps.throttleFirst && steps.throttleFirst.holds.throttle && steps.throttleFirst.steeringAngle > 0,
  "a secondary steering finger works while the primary finger holds the accelerator", steps.throttleFirst);
check(steps.steeringFirst && steps.steeringFirst.holds.throttle && steps.steeringFirst.steeringAngle < 0,
  "a secondary accelerator finger works while the primary finger steers", steps.steeringFirst);

if (failures) {
  console.log("\n" + failures + " Entrance touch-driving assertion(s) failed.");
  process.exit(1);
}
console.log("\nEntrance two-finger touch-driving assertions passed.");
