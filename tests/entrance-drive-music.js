#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function drive() { return window.__entranceRoomState().drive; }
  async function run() {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      await sleep(40);
      window.__openEntrancePorscheDriveHud();
      if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
      document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(80);
      report.steps.stopped = copy(drive());

      window.__entranceDriveSetMotion(40, 2);
      window.__entranceDriveStep(80);
      await sleep(80);
      report.steps.town = copy(drive());

      window.__entranceDriveSetMotion(120, 4);
      window.__entranceDriveStep(80);
      await sleep(30);
      report.steps.highway = copy(drive());

      window.__entranceDriveSetMotion(0, 0);
      window.__entranceDriveStep(80);
      await sleep(280);
      report.steps.restopped = copy(drive());
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () { setTimeout(run, 180); });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html Porsche driving score:");
var result = lib.runPageSync("rsvp.html", HARNESS, 6500, {
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.stopped && !s.stopped.musicActive && !s.stopped.musicProfile.wanted &&
  s.stopped.musicProfile.gain === 0 && s.stopped.musicProfile.tempo === 86,
  "an idling or stopped Porsche keeps the driving score silent", s.stopped);
check(s.town && s.town.musicActive && s.town.musicProfile.wanted &&
  s.town.musicProfile.gain > 0 && s.town.musicProfile.tempo > 86,
  "the score starts only once the Porsche is moving", s.town);
check(s.highway && s.highway.musicActive &&
  s.highway.musicProfile.gain > s.town.musicProfile.gain &&
  s.highway.musicProfile.tempo > s.town.musicProfile.tempo,
  "driving faster raises both score volume and tempo", { town: s.town, highway: s.highway });
check(s.restopped && !s.restopped.musicActive && !s.restopped.musicProfile.wanted &&
  s.restopped.musicProfile.gain === 0,
  "returning to a stop fades and tears down the score", s.restopped);

if (failures) {
  console.log("\n" + failures + " driving-score assertion(s) failed.");
  process.exit(1);
}
console.log("\nPorsche driving-score assertions passed.");
