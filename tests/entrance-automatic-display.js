#!/usr/bin/env node
// Focused persistent automatic-instrument display contract.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function drive() { return window.__entranceRoomState().drive; }
  function snap() {
    var group = document.getElementById("entrance-drive-auto-instrument");
    var readout = document.getElementById("entrance-drive-auto-readout");
    return {
      text: readout.textContent,
      display: getComputedStyle(group).display,
      mode: drive().transmission.mode,
      range: drive().transmission.range,
      gear: drive().gear,
      roadtrip: drive().roadtrip.active
    };
  }
  window.addEventListener("load", function () { setTimeout(function () {
    var report = { errors: [], steps: {} };
    try {
      Object.defineProperty(document, "hasFocus", {
        value: function () { return true; }, configurable: true
      });
      window.__getSfxCtx = function () { return null; };
      window.__unlockAllRooms();
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      report.steps.park = snap();

      window.__toggleEntrancePorscheEngine();
      document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      ["R", "N", "D"].forEach(function (range) {
        window.__entranceDriveSetMotion(0, 0);
        window.__entranceDriveRange(range);
        report.steps[range] = snap();
      });

      window.__entranceDriveControl("throttle", true);
      var shifts = [snap()];
      var previous = drive().gear;
      for (var elapsed = 0; elapsed < 9000 && drive().gear < 3; elapsed += 50) {
        window.__entranceDriveStep(50);
        if (drive().gear !== previous) {
          previous = drive().gear;
          shifts.push(snap());
        }
      }
      window.__entranceDriveControl("throttle", false);
      report.steps.shifts = shifts;

      window.__entranceRoadtripDevStart();
      report.steps.roadtrip = snap();
      var captured = copy(window.__captureCheckpointSystems().entrance);
      window.__entranceDriveSetMotion(0, 0);
      window.__entranceDriveRange("R");
      report.steps.changed = snap();
      window.__restoreCheckpointSystems({ entrance: captured }, "afterStage");
      report.steps.restored = snap();

      window.__entranceDriveTransmissionMode("auto", true);
      window.__resetCheckpointSystems();
      report.steps.reset = snap();
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      window.__entranceDriveTransmissionMode("manual", true);
      report.steps.manual = snap();
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 180); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 7000, {
  patchRaf: true,
  chromeFlags: "--window-size=390,844 --autoplay-policy=no-user-gesture-required"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}
function visible(row) { return row && row.display !== "none"; }

console.log("rsvp.html persistent automatic display:");
var s = result && result.steps || {};
check(result && result.errors.length === 0, "display harness has no uncaught page errors", result && result.errors);
check(visible(s.park) && s.park.text === "P" && s.park.range === "P",
  "AUTO opens with a persistent P readout", s.park);
check(visible(s.R) && s.R.text === "R" && visible(s.N) && s.N.text === "N" &&
  visible(s.D) && s.D.text === "D1",
  "range selection immediately paints R, N, and D1", { R: s.R, N: s.N, D: s.D });
check(s.shifts && s.shifts.length >= 2 && s.shifts.every(function (row) {
  return visible(row) && row.text === "D" + row.gear;
}), "automatic upshifts keep the Dn readout synchronized", s.shifts);
check(visible(s.roadtrip) && s.roadtrip.roadtrip && s.roadtrip.text === "D" + s.roadtrip.gear,
  "the instrument remains visible and current during Road Trip", s.roadtrip);
check(visible(s.changed) && s.changed.text === "R" && visible(s.restored) &&
  s.restored.text === (s.restored.range === "D" ? "D" + s.restored.gear : s.restored.range),
  "checkpoint restore repaints the saved automatic range and gear", {
    changed: s.changed, restored: s.restored
  });
check(visible(s.reset) && s.reset.mode === "auto" && s.reset.range === "P" && s.reset.text === "P",
  "reset returns the persistent readout to P", s.reset);
check(s.manual && s.manual.mode === "manual" && s.manual.display === "none",
  "the automatic-only instrument clears when manual mode is selected", s.manual);

console.log("");
if (failures) {
  console.log(failures + " automatic-display assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Automatic-display assertions passed.");
