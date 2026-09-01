#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function state() { return window.__entranceRoomState(); }
  function enter() {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      bubbles: true, cancelable: true, key: "Enter", code: "Enter"
    }));
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      document.getElementById("hunt-fullscreen-area").dispatchEvent(new MouseEvent("click", {
        bubbles: true, cancelable: true
      }));
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      enter();
      report.ordinaryStart = state();
      window.__entranceRoadtripDevStart();
      window.__toggleEntrancePorscheEngine();
      report.highwayOff = state();
      enter();
      report.highwayRestart = state();
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 220); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 2500, { patchRaf: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("rsvp.html Enter ignition priority:");
check(result && result.errors.length === 0, "ignition harness has no uncaught errors", result && result.errors);
check(result && result.ordinaryStart && result.ordinaryStart.car.engineOn,
  "Enter starts an engine-off car in the ordinary driving HUD", result && result.ordinaryStart);
check(result && result.highwayOff && result.highwayOff.drive.roadtrip.active && !result.highwayOff.car.engineOn,
  "test setup leaves Road Trip active with the engine off", result && result.highwayOff);
check(result && result.highwayRestart && result.highwayRestart.car.engineOn &&
  result.highwayRestart.drive.roadtrip.active && !result.highwayRestart.drive.roadtrip.paused,
  "Enter restarts an engine-off car before Road Trip play/pause can claim it", result && result.highwayRestart);

if (failures) process.exit(1);
console.log("\nEnter ignition assertions passed.");
