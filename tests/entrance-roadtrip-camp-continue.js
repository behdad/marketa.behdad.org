#!/usr/bin/env node
// A Camping revisit is an overlay on a paused highway, including across checkpoint restore.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function click(selector) {
    var node = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!node) throw new Error("missing click target: " + selector);
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  function press(key) {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: key,
      code: key,
      bubbles: true,
      cancelable: true
    }));
  }
  function state() {
    var snapshot = window.__entranceRoomState();
    return {
      active: snapshot.drive.roadtrip.active,
      paused: snapshot.drive.roadtrip.paused,
      route: snapshot.drive.roadtrip.route,
      distance: snapshot.drive.roadtrip.distance,
      speed: snapshot.drive.speed,
      engineOn: snapshot.car.engineOn,
      campVisited: snapshot.drive.roadtrip.campVisited,
      resumePending: document.getElementById("entrance-room").classList.contains("roadtrip-resume-pending")
    };
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
        window.__setSecondRound(true, { releaseHeld: false });
        if (window.__gardenPartyOn) window.__setPartyMode(false, true);
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();

        // Reach Camping once so it becomes a legitimate re-entry action.
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);
        window.__exitEntranceRoadtrip();

        // Start and pause a distinct Banff run with enough state to detect replacement.
        click("#entrance-roadtrip-reenter");
        click('[data-roadtrip-reentry-choice="new"]');
        click('[data-roadtrip-route-choice="banff"]');
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripSetRoute("banff", 17);
        window.__entranceRoadtripSetDistance(321);
        window.__entranceDriveSetMotion(83, 2);
        window.__exitEntranceRoadtrip();
        report.pausedHighway = state();

        // Revisit camp, then checkpoint while that presentation owns the screen.
        click("#entrance-roadtrip-reenter");
        click('[data-roadtrip-reentry-choice="camp"]');
        report.campVisit = state();
        var checkpoint = window.__captureCheckpointSystems().entrance;
        report.saved = checkpoint.drive.roadtrip;
        window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");

        setTimeout(function () {
          try {
            report.restoredCamp = state();
            window.__exitEntranceRoadtrip();
            click("#entrance-roadtrip-reenter");
            var choices = Array.prototype.slice.call(document.querySelectorAll(
              "#entrance-roadtrip-reenter-menu .entrance-roadtrip-reenter-choice.show"));
            report.menu = {
              order: choices.map(function (node) { return node.getAttribute("data-roadtrip-reentry-choice"); }),
              selected: document.querySelector("#entrance-roadtrip-reenter-menu .selected").getAttribute(
                "data-roadtrip-reentry-choice"),
              selectedCount: document.querySelectorAll(
                "#entrance-roadtrip-reenter-menu .selected").length,
              focused: document.activeElement &&
                document.activeElement.getAttribute("data-roadtrip-reentry-choice")
            };
            press("ArrowLeft");
            report.menu.afterLeft = {
              selected: document.querySelector("#entrance-roadtrip-reenter-menu .selected").getAttribute(
                "data-roadtrip-reentry-choice"),
              selectedCount: document.querySelectorAll(
                "#entrance-roadtrip-reenter-menu .selected").length,
              focused: document.activeElement &&
                document.activeElement.getAttribute("data-roadtrip-reentry-choice")
            };
            press("Enter");
            report.continued = state();
          } catch (error) {
            report.errors.push(String(error && error.stack || error));
          }
          finish();
        }, 220);
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
        finish();
      }
    }, 320);
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

console.log("loft-day.html Camping preserves Continue:");
var result = lib.runPageSync("loft-day.html", HARNESS, 4200, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});

check(result && result.errors.length === 0, "the camp/Continue round trip has no uncaught errors", result && result.errors);
check(result && result.pausedHighway && result.pausedHighway.paused && result.pausedHighway.route === "banff" &&
  result.pausedHighway.distance === 321 && result.pausedHighway.speed === 83 && result.pausedHighway.engineOn,
  "the source Banff run is paused with distinctive motion and distance", result && result.pausedHighway);
check(result && result.campVisit && result.campVisit.active && result.campVisit.route === "camp" &&
  result.campVisit.campVisited && !result.campVisit.engineOn,
  "Camping opens without visually resuming the highway", result && result.campVisit);
check(result && result.saved && result.saved.campActive === true && result.saved.pausedRun &&
  result.saved.pausedRun.state.route === "banff" && result.saved.pausedRun.state.distance === 321,
  "checkpoint capture stores camp presentation beside the paused highway", result && result.saved);
check(result && result.restoredCamp && result.restoredCamp.active && result.restoredCamp.route === "camp",
  "checkpoint Continue restores the campsite first", result && result.restoredCamp);
check(result && result.menu && result.menu.order.join(",") === "new,continue,camp" &&
  result.menu.selected === "camp" && result.menu.focused === "camp" && result.menu.selectedCount === 1,
  "Camping is the sole default selection when all three actions are available", result && result.menu);
check(result && result.menu && result.menu.afterLeft && result.menu.afterLeft.selected === "continue" &&
  result.menu.afterLeft.focused === "continue" && result.menu.afterLeft.selectedCount === 1,
  "ArrowLeft moves both focus and the sole visible selection to Continue", result && result.menu);
check(result && result.continued && result.continued.active && !result.continued.paused &&
  result.continued.route === "banff" && result.continued.distance === 321 &&
  result.continued.speed === 83 && result.continued.engineOn && result.continued.resumePending,
  "Enter activates the selected Continue action and restores the exact Banff run", result && result.continued);

if (failures) process.exit(1);
console.log("Camping Continue assertions passed.");
