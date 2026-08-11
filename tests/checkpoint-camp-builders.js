#!/usr/bin/env node
// Stable Camping builder choices survive Continue; transient dialogs/timers do not.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function fire() { return window.__entranceRoomState().drive.roadtrip.campFire; }
  function stew() { return window.__entranceRoadtripCampStewState(); }
  window.addEventListener("load", function () {
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.__goToStage("balcony");
    setTimeout(function () {
      try {
        window.__openEntranceRoom();
        document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);

        window.__entranceRoadtripCampFireStart(true);
        window.__entranceRoadtripCampFirePlace("tinder");
        window.__entranceRoadtripCampFirePlace("stack");
        var fireRow = window.__captureCheckpointSystems().entrance;
        report.fireSaved = {
          draft: fireRow.drive.roadtrip.campFireDraft,
          state: fire()
        };
        window.__restoreCheckpointSystems({ entrance: fireRow }, "afterStage");
        report.fireRestored = {
          state: fire(),
          builderOpen: document.getElementById("entrance-roadtrip-fire-game").classList.contains("open")
        };

        var litRow = window.__captureCheckpointSystems().entrance;
        litRow.drive.roadtrip.campFireBuilt = true;
        litRow.drive.roadtrip.campFireLit = true;
        delete litRow.drive.roadtrip.campFireDraft;
        window.__restoreCheckpointSystems({ entrance: litRow }, "afterStage");
        window.__entranceRoadtripCampStewOpen();
        window.__entranceRoadtripCampStewSelect("tofu");
        window.__entranceRoadtripCampStewSelect("onion");
        window.__entranceRoadtripCampStewSelect("barley");
        var stewRow = window.__captureCheckpointSystems().entrance;
        report.stewSaved = {
          row: stewRow.drive.roadtrip.stew,
          state: stew()
        };
        window.__restoreCheckpointSystems({ entrance: stewRow }, "afterStage");
        report.stewRestored = {
          state: stew(),
          builderOpen: document.getElementById("entrance-roadtrip-stew-game").classList.contains("open")
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 360);
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

console.log("loft-day.html Camping builder checkpoints:");
var result = lib.runPageSync("loft-day.html", HARNESS, 2200, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=20:00"
});
check(result && result.errors.length === 0, "builder restore has no uncaught errors", result && result.errors);
check(result && result.fireSaved && result.fireSaved.draft &&
  result.fireSaved.draft.tinder === true && result.fireSaved.draft.twigs === false &&
  result.fireSaved.draft.logs === "stack",
  "checkpoint capture retains the exact unfinished fire arrangement", result && result.fireSaved);
check(result && result.fireRestored && !result.fireRestored.builderOpen &&
  !result.fireRestored.state.complete && !result.fireRestored.state.open &&
  result.fireRestored.state.tinder && !result.fireRestored.state.twigs &&
  result.fireRestored.state.logs === "stack" && !result.fireRestored.state.igniting,
  "Continue restores actionable fire choices with the transient builder closed", result && result.fireRestored);
check(result && result.stewSaved && result.stewSaved.row && result.stewSaved.row.status === "assembling" &&
  result.stewSaved.row.protein === "tofu" && result.stewSaved.row.onion === true &&
  result.stewSaved.row.starch === "barley",
  "checkpoint capture retains a partial stew recipe", result && result.stewSaved);
check(result && result.stewRestored && !result.stewRestored.builderOpen &&
  !result.stewRestored.state.open && result.stewRestored.state.status === "assembling" &&
  result.stewRestored.state.protein === "tofu" && result.stewRestored.state.onion === true &&
  result.stewRestored.state.starch === "barley",
  "Continue restores exact stew selections with the transient builder closed", result && result.stewRestored);

if (failures) process.exit(1);
console.log("Camping builder checkpoint assertions passed.");
