#!/usr/bin/env node
// The campsite fire consumes incomplete fuel chains and persists a completed build.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function click(node) {
    if (!node) return false;
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  }
  function snap() {
    var state = window.__entranceRoomState().drive.roadtrip.campFire;
    return {
      state: state,
      sceneBuilt: document.getElementById("entrance-roadtrip-camp").classList.contains("fire-built"),
      gameOpen: document.getElementById("entrance-roadtrip-fire-game").classList.contains("open"),
      potBoiling: document.getElementById("entrance-roadtrip-camp-pot").classList.contains("simmering"),
      key: window.__captionKey && window.__captionKey()
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripStart();
        report.coachVisibleAfterStart = document.getElementById("entrance-drive-coach").classList.contains("show");
        window.__entranceRoadtripSetRoute("camp", 0);
        report.initial = snap();
        var caption = document.getElementById("hunt-caption");
        caption.classList.add("intro-guide");
        caption.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
        report.captionClickOpened = snap().gameOpen;
        click(document.getElementById("entrance-roadtrip-fire-close"));
        click(document.getElementById("entrance-roadtrip-camp-empty-pit"));
        report.pitClickOpened = snap().gameOpen;
        window.__entranceRoadtripCampFirePlace("twigs");
        window.__entranceRoadtripCampFirePlace("twigs");
        report.toggle = snap().state;

        window.__entranceRoadtripCampFirePlace("tinder");
        report.tinderOnly = { result: window.__entranceRoadtripCampFireLight(), state: snap().state };

        window.__entranceRoadtripCampFirePlace("tinder");
        window.__entranceRoadtripCampFirePlace("twigs");
        report.noLogs = { result: window.__entranceRoadtripCampFireLight(), state: snap().state };

        window.__entranceRoadtripCampFirePlace("stack");
        report.logsOnly = { result: window.__entranceRoadtripCampFireLight(), state: snap().state };

        window.__entranceRoadtripCampFirePlace("tinder");
        window.__entranceRoadtripCampFirePlace("twigs");
        window.__entranceRoadtripCampFirePlace("teepee");
        report.successStart = { result: window.__entranceRoadtripCampFireLight(), state: snap().state };
        setTimeout(function () {
          try {
            report.complete = snap();
            var checkpoint = window.__captureCheckpointSystems().entrance;
            report.saved = checkpoint.drive.roadtrip.campFireBuilt;
            click(document.getElementById("entrance-roadtrip-camp-fire"));
            report.extinguished = snap();
            var offCheckpoint = window.__captureCheckpointSystems().entrance;
            var finishedPit = document.getElementById("entrance-roadtrip-camp-finished-fire");
            report.coldPitCursor = getComputedStyle(finishedPit).cursor;
            click(document.getElementById("entrance-roadtrip-camp-pot"));
            report.replay = snap();
            window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
            report.restored = snap();
            window.__restoreCheckpointSystems({ entrance: offCheckpoint }, "afterStage");
            report.extinguishedRestored = snap();
          } catch (error) { report.errors.push(String(error && error.stack || error)); }
          report.errors = (window.__errs || []).concat(report.errors);
          document.getElementById("__report").textContent = JSON.stringify(report);
        }, 1750);
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
        document.getElementById("__report").textContent = JSON.stringify(report);
      }
    }, 260);
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

console.log("rsvp.html campsite fire:");
var result = lib.runPageSync("rsvp.html", HARNESS, 4500, {
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the fire sequence has no uncaught errors", result && result.errors);
check(result && result.initial && !result.initial.state.complete && !result.initial.sceneBuilt && !result.initial.potBoiling,
  "the campsite arrives with an empty firepit", result && result.initial);
check(result && result.coachVisibleAfterStart === false,
  "Road Trip retires an unfinished dashboard coach before it can cover Camping",
  result && result.coachVisibleAfterStart);
check(result && result.toggle && !result.toggle.twigs,
  "clicking a selected material again removes it from the pit", result && result.toggle);
check(result && result.captionClickOpened && result.pitClickOpened,
  "the arrival caption and empty firepit both open the builder", result && {
    caption: result.captionClickOpened, pit: result.pitClickOpened
  });
check(result && result.tinderOnly.result === "entrance_roadtrip_camp_fire_no_twigs" &&
  !result.tinderOnly.state.tinder, "tinder alone burns away without twigs", result && result.tinderOnly);
check(result && result.noLogs.result === "entrance_roadtrip_camp_fire_no_logs" &&
  !result.noLogs.state.tinder && !result.noLogs.state.twigs,
  "tinder and twigs burn away without logs", result && result.noLogs);
check(result && result.logsOnly.result === "entrance_roadtrip_camp_fire_no_tinder" &&
  result.logsOnly.state.logs === "stack", "logs alone do not catch and remain in the pit", result && result.logsOnly);
check(result && result.successStart.result === "success" && result.successStart.state.igniting &&
  result.successStart.state.logs === "teepee", "either valid log arrangement can be selected before lighting",
  result && result.successStart);
check(result && result.complete && result.complete.state.complete && result.complete.sceneBuilt && result.complete.potBoiling &&
  !result.complete.gameOpen && result.complete.key === "entrance_roadtrip_camp_arrival",
  "the full fuel chain grows into the warm campsite", result && result.complete);
check(result && result.saved === true && result.restored && result.restored.state.complete && result.restored.sceneBuilt,
  "a completed fire survives checkpoint restore", result && result.restored);
check(result && result.extinguished &&
  result.extinguished.state.complete && !result.extinguished.state.lit && result.extinguished.sceneBuilt &&
  !result.extinguished.potBoiling &&
  !result.extinguished.gameOpen, "clicking the finished flames extinguishes only the fire",
  result && result.extinguished);
check(result && result.extinguishedRestored && result.extinguishedRestored.state.complete &&
  !result.extinguishedRestored.state.lit && result.extinguishedRestored.sceneBuilt,
  "Continue preserves a built but extinguished campsite", result && result.extinguishedRestored);
check(result && result.coldPitCursor === "pointer" && result.replay &&
  result.replay.state.complete && result.replay.gameOpen &&
  !result.replay.state.tinder && !result.replay.state.twigs && !result.replay.state.logs,
  "the whole cold firepit starts a fresh build before a child can steal the click", result && {
    cursor: result.coldPitCursor, replay: result.replay
  });

if (failures) process.exit(1);
console.log("Campsite fire assertions passed.");
