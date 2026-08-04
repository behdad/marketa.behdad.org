#!/usr/bin/env node
// The rear-view mirror doubles as an intentionally uncapped traffic stress control.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function state() { return window.__entranceRoomState().drive.roadtrip; }
  function summon() {
    document.getElementById("entrance-roadtrip-mirror").dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripStart();

        window.__entranceDriveSetMotion(0, 0);
        summon();
        report.steps.low = state();

        window.__entranceDriveSetMotion(120, 4);
        summon();
        report.steps.high = state();

        for (var index = 0; index < 24; index++) summon();
        report.steps.flood = state();
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 220);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html Road Trip mirror traffic stress control:");
var result = lib.runPageSync("rsvp.html", HARNESS, 4200, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
check(result && result.errors.length === 0, "the focused drive has no uncaught errors", result && result.errors);
var steps = result && result.steps || {};
var lowEntities = steps.low && steps.low.entities || [];
check(lowEntities.length === 1 && lowEntities[0].overtakingPlayer && lowEntities[0].direction === "forward" &&
  lowEntities[0].at < steps.low.distance,
  "a low-speed double-click summons a faster vehicle behind", steps.low);
var highEntities = steps.high && steps.high.entities || [];
var incoming = highEntities[highEntities.length - 1];
check(highEntities.length === 2 && incoming && incoming.type === "car" && incoming.direction === "oncoming" &&
  incoming.lane < 0 && incoming.at > steps.high.distance,
  "a high-speed double-click summons an oncoming sedan ahead", steps.high);
check(steps.flood && steps.flood.entityCount === steps.flood.poolSize && steps.flood.poolSize === 16,
  "repeated double-clicks deliberately flood every traffic-pool slot", steps.flood);

if (failures) process.exit(1);
console.log("Mirror traffic stress checks passed.");
