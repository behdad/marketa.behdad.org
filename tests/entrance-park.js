#!/usr/bin/env node
// Automatic Park positively locks the car instead of preserving a sub-interlock roll.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () { setTimeout(function () {
  var report = { errors: window.__errs || [] };
  try {
    Object.defineProperty(document, "hasFocus", {
      value: function () { return true; }, configurable: true
    });
    window.__unlockAllRooms();
    window.goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    window.__toggleEntrancePorscheEngine();
    window.__entranceDriveTransmissionMode("auto", true);
    window.__entranceDriveSetMotion(.49, 0);
    var parked = window.__entranceDriveRange("P");
    var before = window.__entranceRoomState().drive;
    window.__entranceDriveControl("throttle", true);
    window.__entranceDriveStep(1000);
    window.__entranceDriveControl("throttle", false);
    var after = window.__entranceRoomState().drive;
    report.park = {
      accepted: parked,
      beforeSpeed: before.speed,
      afterSpeed: after.speed,
      beforePosition: before.position,
      afterPosition: after.position,
      range: after.transmission.range,
      gear: after.gear
    };
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 180); });
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true });
var failed = false;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || !detail ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}

console.log("rsvp.html automatic Park lock:");
check(result && result.errors.length === 0, "Park harness has no uncaught errors", result && result.errors);
var park = result && result.park;
check(park && park.accepted && park.range === "P" && park.gear === 0 &&
  park.beforeSpeed === 0 && park.afterSpeed === 0 && park.beforePosition === park.afterPosition,
  "Park cancels sub-interlock roll and throttle cannot move the car", park);

if (failed) process.exit(1);
console.log("Park-lock assertions passed.");
