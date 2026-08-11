#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      var hudClose = document.getElementById("entrance-drive-dismiss-hud");
      var highwayClose = document.getElementById("entrance-roadtrip-dismiss");
      report.steps.dashboard = {
        hudClose: getComputedStyle(hudClose).display,
        highwayClose: getComputedStyle(highwayClose).display
      };
      hudClose.click();
      report.steps.dashboardClosed = window.__entranceRoomState().drive;
      window.__openEntrancePorscheDriveHud();
      window.__entranceRoadtripDevStart();
      report.steps.highway = {
        hudClose: getComputedStyle(hudClose).display,
        highwayClose: getComputedStyle(highwayClose).display,
        drive: window.__entranceRoomState().drive
      };
      highwayClose.click();
      report.steps.highwayClosed = window.__entranceRoomState().drive;
      report.steps.returnedDashboard = {
        hudClose: getComputedStyle(hudClose).display,
        highwayClose: getComputedStyle(highwayClose).display
      };
      hudClose.click();
      report.steps.bothClosed = window.__entranceRoomState().drive;
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 220); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 2200, { patchRaf: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("rsvp.html Entrance driving dismiss controls:");
check(result && result.errors.length === 0, "dismiss harness has no uncaught page errors", result && result.errors);
var steps = result && result.steps || {};
check(steps.dashboard && steps.dashboard.hudClose === "grid" && steps.dashboard.highwayClose === "none",
  "the parked dashboard advertises its own top-right dismiss control", steps.dashboard);
check(steps.dashboardClosed && !steps.dashboardClosed.hud,
  "the dashboard dismiss control closes the HUD", steps.dashboardClosed);
check(steps.highway && steps.highway.hudClose === "none" && steps.highway.highwayClose === "grid" &&
  steps.highway.drive.roadtrip.active,
  "Highway mode advertises its own top-right exit control", steps.highway);
check(steps.highwayClosed && !steps.highwayClosed.roadtrip.active && steps.highwayClosed.hud,
  "the Highway dismiss control returns to the street with the dashboard open", steps.highwayClosed);
check(steps.returnedDashboard && steps.returnedDashboard.hudClose === "grid" &&
  steps.returnedDashboard.highwayClose === "none" && steps.bothClosed && !steps.bothClosed.hud,
  "the restored dashboard control can then close the HUD", { returned: steps.returnedDashboard, closed: steps.bothClosed });

if (failures) process.exit(1);
console.log("\nEntrance driving dismiss-control assertions passed.");
