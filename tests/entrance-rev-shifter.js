#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function state() { return window.__entranceRoomState().drive; }
  function pulse(mode) {
    var shifter = document.getElementById("entrance-drive-shifter");
    var knob = document.getElementById(mode === "auto" ?
      "entrance-drive-auto-knob" : "entrance-drive-manual-knob");
    return { active: shifter.classList.contains("rev-coach"), animation: getComputedStyle(knob).animationName };
  }
  function rev() {
    window.__entranceDriveControl("throttle", true);
    window.__entranceDriveStep(1000);
    window.__entranceDriveControl("throttle", false);
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      window.__toggleEntrancePorscheEngine();
      window.__entranceDriveTransmissionMode("auto", true);
      window.__entranceDriveRange("P");
      rev();
      report.auto = { state: state(), pulse: pulse("auto") };
      window.__entranceDriveStep(1000);
      report.autoSettled = { state: state(), pulse: pulse("auto") };
      window.__entranceDriveTransmissionMode("manual", true);
      window.__entranceDriveShift(0, true);
      rev();
      report.manual = { state: state(), pulse: pulse("manual") };
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 220); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 2600, { patchRaf: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("rsvp.html high-rev shifter coach:");
check(result && result.errors.length === 0, "high-rev harness has no uncaught errors", result && result.errors);
check(result && result.auto && result.auto.state.instruction === "entrance_drive_rev_shift_auto" &&
  result.auto.pulse.active && result.auto.pulse.animation === "entrance-drive-shifter-rev-coach",
  "high revs in AUTO Park pulse the shifter and coach Drive", result && result.auto);
check(result && result.autoSettled && result.autoSettled.state.instruction === "entrance_drive_auto_park_hint" &&
  !result.autoSettled.pulse.active,
  "the shifter prompt clears after revs settle", result && result.autoSettled);
check(result && result.manual && result.manual.state.instruction === "entrance_drive_rev_shift_manual" &&
  result.manual.pulse.active && result.manual.pulse.animation === "entrance-drive-shifter-rev-coach",
  "high revs in MANUAL Neutral pulse the shifter and coach first gear", result && result.manual);

if (failures) process.exit(1);
console.log("\nHigh-rev shifter assertions passed.");
