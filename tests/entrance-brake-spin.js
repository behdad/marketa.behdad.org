#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<pre id="__report">pending</pre>
<script>
window.addEventListener("load", function () {
  setTimeout(function () {
    var report = { errors: window.__errs || [] };
    try {
      window.__unlockAllRooms();
      window.goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      window.__toggleEntrancePorscheEngine();
      document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      var room = document.getElementById("entrance-room");
      function state() { return window.__entranceRoomState().drive; }
      function weather(name) {
        room.classList.remove("entrance-raining", "entrance-snowing");
        if (name === "rain") room.classList.add("entrance-raining");
        if (name === "snow") room.classList.add("entrance-raining", "entrance-snowing");
      }
      function probe(speed, name) {
        weather(name);
        window.__entranceDriveControl("brake", false);
        window.__entranceDriveControl("steerLeft", false);
        var before = state();
        window.__entranceDriveSetMotion(speed * before.facing, 7);
        before = state();
        window.__entranceDriveControl("steerLeft", true);
        window.__entranceDriveControl("brake", true);
        window.__entranceDriveStep(20);
        var after = state();
        window.__entranceDriveControl("brake", false);
        window.__entranceDriveControl("steerLeft", false);
        return {
          before: before,
          after: after,
          worldSpinning: document.getElementById("entrance-roadtrip-world").classList.contains("roadtrip-spinning")
        };
      }
      report.street = {
        dryBelow: probe(139, "dry"), dryAt: probe(140, "dry"),
        rainBelow: probe(119, "rain"), rainAt: probe(120, "rain"),
        snowBelow: probe(99, "snow"), snowAt: probe(100, "snow")
      };
      var guard = 0;
      while (state().position >= -600 && guard++ < 300) window.__entranceDriveStep(20);
      report.recoveryBefore = state();
      window.__entranceDriveSetMotion(0, 0);
      window.__entranceDriveStep(20);
      report.recoveryAfter = state();
      weather("dry");
      window.__entranceRoadtripDevStart();
      report.highway = {
        dryBelow: probe(199, "dry"), dryAt: probe(200, "dry"),
        rainBelow: probe(179, "rain"), rainAt: probe(180, "rain"),
        snowBelow: probe(159, "snow"), snowAt: probe(160, "snow")
      };
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 180);
});
</script>`;

var result = lib.runPageSync("loft-day.html", harness, 1800, {
  patchRaf: true, seedRandom: true
});
if (!result) { console.error("brake spin: no report"); process.exit(1); }
var failures = 0;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failures++;
}
function noSpin(probe) {
  return probe.after.spins === probe.before.spins && probe.after.yaw === probe.before.yaw;
}
function streetSpin(probe) {
  return probe.after.spins === probe.before.spins + 1 &&
    Math.abs(probe.after.yaw - probe.before.yaw) === 180 &&
    probe.after.facing === -probe.before.facing &&
    Math.sign(probe.after.speed) === -Math.sign(probe.before.speed);
}
function highwaySpin(probe) {
  return probe.after.spins === probe.before.spins + 1 &&
    Math.abs(probe.after.yaw - probe.before.yaw) === 360 &&
    probe.after.facing === probe.before.facing &&
    Math.sign(probe.after.speed) === Math.sign(probe.before.speed) && probe.worldSpinning &&
    Math.abs(probe.after.speed) < Math.abs(probe.before.speed);
}
check(!result.errors.length, "no uncaught page errors", result.errors);
check(noSpin(result.street.dryBelow) && streetSpin(result.street.dryAt),
  "dry block turns through 180° from 140 km/h", result.street);
check(noSpin(result.street.rainBelow) && streetSpin(result.street.rainAt),
  "rain lowers the block threshold to 120 km/h", result.street);
check(noSpin(result.street.snowBelow) && streetSpin(result.street.snowAt),
  "snow lowers the block threshold to 100 km/h", result.street);
check(result.recoveryBefore.facing < 0 && result.recoveryBefore.position < -600 &&
  result.recoveryAfter.position === -260,
  "a stopped reversed car returns to the usable left edge", {
    before: result.recoveryBefore, after: result.recoveryAfter
  });
check(noSpin(result.highway.dryBelow) && highwaySpin(result.highway.dryAt),
  "dry Road Trip spins through 360° from 200 km/h while braking slows the car", result.highway);
check(noSpin(result.highway.rainBelow) && highwaySpin(result.highway.rainAt),
  "rain lowers the Road Trip threshold to 180 km/h", result.highway);
check(noSpin(result.highway.snowBelow) && highwaySpin(result.highway.snowAt),
  "snow lowers the Road Trip threshold to 160 km/h", result.highway);

if (failures) process.exit(1);
console.log("brake spin: all checks passed");
