#!/usr/bin/env node
// An open Road Trip route chooser and its selected card survive checkpoint recovery.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () { setTimeout(function () {
  var report = { errors: window.__errs || [] };
  function state() { return window.__entranceRoomState().drive.roadtrip; }
  try {
    Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
    window.__unlockAllRooms();
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "dungeon", "cinema", "bedroom", "entrance"]);
    window.__setSecondRound(true, { releaseHeld: false });
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    var lapRow = window.__captureCheckpointSystems().entrance;
    lapRow.drive.roadtrip.practiceLaps = 1;
    window.__restoreCheckpointSystems({ entrance: lapRow }, "afterStage");
    report.lap = JSON.parse(JSON.stringify(state()));
    window.__markRoomSeen("bathroom");
    report.opened = window.__entranceRoadtripOpenChooser();
    window.__entranceRoadtripMoveRouteChoice(1);
    report.before = JSON.parse(JSON.stringify(state()));
    report.row = window.__captureCheckpointSystems().entrance;
    window.__restoreCheckpointSystems({ entrance: report.row }, "afterStage");
    report.after = JSON.parse(JSON.stringify(state()));
    report.dom = {
      shown: document.getElementById("entrance-roadtrip-route-chooser").classList.contains("show"),
      selected: document.querySelector(".entrance-roadtrip-route-choice.selected").dataset.roadtripRouteChoice,
      svgZ: Number(getComputedStyle(document.getElementById("entrance-drive-hud-svg")).zIndex),
      touchZ: Number(getComputedStyle(document.getElementById("entrance-drive-touch-controls")).zIndex)
    };
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 180); });
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 2400, { patchRaf: true });
var failed = false;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || !detail ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}

console.log("rsvp.html Road Trip chooser recovery:");
check(result && result.errors.length === 0, "chooser harness has no uncaught errors", result && result.errors);
check(result && result.lap.practiceLaps === 1 && !result.lap.explorationComplete &&
  !result.lap.unlocked && !result.lap.invitationReady,
  "a completed street lap does not unlock Road Trip before the tenth room", result && result.lap);
check(result && result.opened && result.before.routeChooserOpen && result.before.routeChoice === "banff",
  "the chooser opens and records the selected Banff card", result && result.before);
check(result && result.row.drive.roadtrip.routeChooserOpen === true &&
  result.row.drive.roadtrip.routeChoice === "banff" && !result.row.drive.roadtrip.pausedRun,
  "checkpoint capture owns the open chooser and selection", result && result.row.drive.roadtrip);
check(result && result.after.routeChooserOpen && result.after.routeChoice === "banff" &&
  !result.after.active && result.dom.shown && result.dom.selected === "banff",
  "recovery restores the chooser instead of launching its selected route", {
    after: result && result.after, dom: result && result.dom
  });
check(result && result.dom.svgZ > result.dom.touchZ,
  "the open chooser stacks above the blue and pink controls", result && result.dom);

if (failed) process.exit(1);
console.log("Road Trip chooser-recovery assertions passed.");
