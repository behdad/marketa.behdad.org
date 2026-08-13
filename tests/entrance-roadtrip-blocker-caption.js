#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  document.hasFocus = function () { return true; };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function snap() {
    var state = window.__captionState();
    return {
      key: window.__captionKey(),
      text: document.getElementById("hunt-caption").textContent,
      base: state.base && { key: state.base.key, owner: state.base.owner },
      overlay: state.overlay && { key: state.overlay.key, owner: state.overlay.owner },
      exclusive: state.exclusive && { key: state.exclusive.key, owner: state.exclusive.owner },
      engineOn: window.__entranceRoomState().car.engineOn,
      gear: window.__entranceRoomState().drive.gear,
      range: window.__entranceRoomState().drive.transmission.range,
      resumePending: window.__entranceRoomState().drive.roadtrip.resumePending
    };
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.__endAttract(); window.__unlockAllRooms();
        window.__setSecondRound(true, { releaseHeld: false });
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
        window.__goToStage("balcony"); window.__openEntranceRoom(); await sleep(40);
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart(); await sleep(40);
        report.engine = snap();

        var eventToken = window.__captionOverlay("entrance_roadtrip_heart", {
          owner: "roadtrip-score", scope: "lower:entrance", priority: 30,
          duration: 0, replacements: { points: 10, combo: 1 }
        });
        window.__toggleEntrancePorscheEngine();
        report.eventWhileGearBlocked = snap();
        window.__cancelCaption(eventToken);
        report.gear = snap();

        window.__entranceDriveRange("R");
        report.autoReverse = snap();
        window.__entranceDriveRange("D");
        report.ready = snap();
        var modalToken = window.__captionExclusive("entrance_roadtrip_pause_title", {
          owner: "roadtrip-modal", scope: "lower:entrance"
        });
        window.__entranceDriveRange("N");
        report.modalWhileGearBlocked = snap();
        window.__cancelCaption(modalToken);
        report.afterModal = snap();

        window.__entranceDriveTransmissionMode("manual", true);
        window.__cancelCaption("entrance-transmission");
        report.manualNeutral = snap();
        window.__entranceDriveShift(-1, true);
        report.manualReverse = snap();
        window.__entranceDriveShift(1, true);
        report.manualReady = snap();
        window.__entranceDriveTransmissionMode("auto", true);
        window.__cancelCaption("entrance-transmission");
        window.__entranceDriveRange("D");
        window.__toggleEntrancePorscheEngine();
        var checkpoint = window.__captureCheckpointSystems().entrance;
        window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
        await sleep(60);
        report.restoredPaused = snap();
        window.__toggleEntranceRoadtripTransport(); await sleep(20);
        report.restored = snap();
        window.__setLang("cs"); report.czech = snap();
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 300);
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

console.log("loft-day.html Road Trip drivetrain blocker captions:");
var result = lib.runPageSync("loft-day.html", HARNESS, 5000, {
  patchRaf: true, forceMotion: true, urlSuffix: "?fresh=roadtrip-blocker-caption"
});
check(result && result.errors.length === 0, "the blocker-caption harness has no uncaught errors", result && result.errors);
check(result && result.engine.key === "entrance_roadtrip_start_engine" &&
  result.engine.base.key === result.engine.key && !result.engine.engineOn,
  "an active Road Trip with its engine off asks for ignition", result && result.engine);
check(result && result.eventWhileGearBlocked.key === "entrance_roadtrip_heart" &&
  result.eventWhileGearBlocked.base.key === "entrance_roadtrip_select_gear" &&
  result.eventWhileGearBlocked.overlay.owner === "roadtrip-score",
  "event feedback stays visible while the base updates underneath it", result && result.eventWhileGearBlocked);
check(result && result.gear.key === "entrance_roadtrip_select_gear" && result.gear.engineOn &&
  result.gear.range === "P", "the selector clue recovers after event feedback", result && result.gear);
check(result && result.autoReverse.key === "entrance_roadtrip_select_gear" &&
  result.autoReverse.range === "R" && result.autoReverse.gear === -1,
  "automatic reverse remains blocked until the selector reaches D", result && result.autoReverse);
check(result && result.ready.key === "entrance_roadtrip_drive" && result.ready.range === "D",
  "normal Road Trip caption ownership resumes in a driving gear", result && result.ready);
check(result && result.modalWhileGearBlocked.key === "entrance_roadtrip_pause_title" &&
  result.modalWhileGearBlocked.base.key === "entrance_roadtrip_select_gear" &&
  result.modalWhileGearBlocked.exclusive.owner === "roadtrip-modal" &&
  result.afterModal.key === "entrance_roadtrip_select_gear",
  "an exclusive modal wins, then reveals the current blocker", result && {
    modal: result.modalWhileGearBlocked, after: result.afterModal
  });
check(result && result.manualNeutral.key === "entrance_roadtrip_select_gear" &&
  result.manualNeutral.gear === 0 && result.manualReverse.key === "entrance_roadtrip_select_gear" &&
  result.manualReverse.gear === -1 && result.manualReady.key === "entrance_roadtrip_drive" &&
  result.manualReady.gear === 1,
  "manual neutral and reverse stay blocked until a forward numbered gear is selected", result && {
    neutral: result.manualNeutral, reverse: result.manualReverse, ready: result.manualReady
  });
check(result && result.restoredPaused.resumePending &&
  result.restoredPaused.key === "entrance_roadtrip_transport_paused" &&
  result.restored.key === "entrance_roadtrip_start_engine" && !result.restored.resumePending,
  "checkpoint restore keeps pause ownership and derives the saved blocker after resume", result && {
    paused: result.restoredPaused, restored: result.restored
  });
check(result && result.czech.key === "entrance_roadtrip_start_engine" &&
  result.czech.text === "Nastartuj motor." && result.czech.text !== result.restored.text,
  "the restored clue rerenders from the mirrored Czech key", result && result.czech);

if (failures) process.exit(1);
console.log("Road Trip blocker-caption checks passed.");
