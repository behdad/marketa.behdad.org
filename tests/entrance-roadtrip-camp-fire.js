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
  function clickAtCampPoint(x, y) {
    var svg = document.getElementById("entrance-drive-hud-svg");
    if (!svg) return null;
    var roomRect = document.getElementById("entrance-room").getBoundingClientRect();
    var scale = Math.max(roomRect.width / 680, roomRect.height / 340);
    var point = {
      x: roomRect.left + (roomRect.width - 680 * scale) / 2 + x * scale,
      y: roomRect.top + roomRect.height - 340 * scale + (y + 120) * scale
    };
    var target = document.elementFromPoint(point.x, point.y);
    click(target);
    return {
      id: target && target.id,
      tag: target && target.tagName,
      parent: target && target.parentElement && target.parentElement.id,
      point: [point.x, point.y]
    };
  }
  function fireRingLayers(node) {
    var children = Array.prototype.slice.call(node.children);
    var back = children.findIndex(function (child) {
      return child.getAttribute && child.getAttribute("href") === "#entrance-roadtrip-camp-fire-ring-back";
    });
    var front = children.findIndex(function (child) {
      return child.getAttribute && child.getAttribute("href") === "#entrance-roadtrip-camp-fire-ring-front";
    });
    return { back: back, front: front, contentBetween: front - back > 1, childCount: children.length };
  }
  function snap() {
    var state = window.__entranceRoomState().drive.roadtrip.campFire;
    var pot = document.getElementById("entrance-roadtrip-camp-pot");
    var crate = document.getElementById("entrance-roadtrip-camp-food-crate");
    var logs = document.querySelector(".entrance-roadtrip-camp-built-logs");
    var openBubble = document.querySelector(".entrance-roadtrip-camp-pot-open-bubble");
    var potStyle = getComputedStyle(pot), crateStyle = getComputedStyle(crate);
    return {
      state: state,
      sceneBuilt: document.getElementById("entrance-roadtrip-camp").classList.contains("fire-built"),
      logsVisible: getComputedStyle(logs).opacity !== "0",
      gameOpen: document.getElementById("entrance-roadtrip-fire-game").classList.contains("open"),
      potBoiling: pot.classList.contains("simmering"),
      potOpen: pot.classList.contains("open"),
      potVisible: potStyle.visibility !== "hidden" && Number(potStyle.opacity) > .01,
      crateVisible: crateStyle.visibility !== "hidden" && Number(crateStyle.opacity) > .01,
      sceneFood: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-food")).opacity,
      openSteamActive: getComputedStyle(openBubble).animationName === "entrance-roadtrip-camp-pot-open-steam",
      openBubbles: document.querySelectorAll(".entrance-roadtrip-camp-pot-open-bubble").length,
      key: window.__captionKey && window.__captionKey()
    };
  }
  window.addEventListener("load", function () {
    window.__unlockAllRooms();
    window.goToStage("balcony");
    setTimeout(function () {
      try {
        window.__openEntranceRoom();
        document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
        document.getElementById("entrance-room").scrollIntoView({ block: "center" });
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripStart();
        report.coachVisibleAfterStart = document.getElementById("entrance-drive-coach").classList.contains("show");
        window.__entranceRoadtripSetRoute("camp", 0);
        report.fireRing = {
          backStones: document.querySelectorAll("#entrance-roadtrip-camp-fire-ring-back .entrance-roadtrip-camp-fire-ring-stones > path").length,
          frontStones: document.querySelectorAll("#entrance-roadtrip-camp-fire-ring-front .entrance-roadtrip-camp-fire-ring-stones > path").length,
          empty: fireRingLayers(document.getElementById("entrance-roadtrip-camp-empty-pit")),
          built: fireRingLayers(document.getElementById("entrance-roadtrip-camp-finished-fire")),
          builder: fireRingLayers(document.getElementById("entrance-roadtrip-fire-build-preview"))
        };
        report.initial = snap();
        var caption = document.getElementById("hunt-caption");
        click(caption);
        report.captionClickOpened = snap().gameOpen;
        report.pitTarget = clickAtCampPoint(340, 121);
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
            click(document.getElementById("entrance-roadtrip-camp-pot"));
            report.potOpenLit = snap();
            click(document.getElementById("entrance-roadtrip-camp-pot"));
            report.potClosedLit = snap();
            click(document.getElementById("entrance-roadtrip-camp-fire"));
            report.extinguished = snap();
            var offCheckpoint = window.__captureCheckpointSystems().entrance;
            var finishedPit = document.getElementById("entrance-roadtrip-camp-finished-fire");
            report.coldPitCursor = getComputedStyle(finishedPit).cursor;
            click(document.getElementById("entrance-roadtrip-camp-pot"));
            report.potOpenCold = snap();
            click(document.getElementById("entrance-roadtrip-camp-pot"));
            report.potClosedCold = snap();
            click(document.getElementById("entrance-roadtrip-camp-cold-fire-hit"));
            report.replay = snap();
            window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
            report.restored = snap();
            window.__entranceRoadtripSetRoute("abraham", 0);
            window.__entranceRoadtripSetRoute("camp", 0);
            report.freshArrival = snap();
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
    }, 1000);
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
check(result && result.initial && !result.initial.state.complete && !result.initial.sceneBuilt &&
  !result.initial.logsVisible && !result.initial.potBoiling,
  "the campsite arrives with an empty firepit", result && result.initial);
check(result && result.fireRing && result.fireRing.backStones === 7 && result.fireRing.frontStones === 7 &&
  result.fireRing.empty.back >= 0 && result.fireRing.empty.front > result.fireRing.empty.back &&
  result.fireRing.built.back >= 0 && result.fireRing.built.front > result.fireRing.built.back &&
  result.fireRing.built.contentBetween && result.fireRing.builder.back >= 0 &&
  result.fireRing.builder.front > result.fireRing.builder.back && result.fireRing.builder.contentBetween,
  "the complete stone ring layers its front arc over fire content in both campsite views",
  result && result.fireRing);
check(result && result.coachVisibleAfterStart === false,
  "Road Trip retires an unfinished dashboard coach before it can cover Camping",
  result && result.coachVisibleAfterStart);
check(result && result.toggle && !result.toggle.twigs,
  "clicking a selected material again removes it from the pit", result && result.toggle);
check(result && !result.captionClickOpened && result.pitClickOpened &&
  result.pitTarget && result.pitTarget.parent === "entrance-roadtrip-camp-empty-pit",
  "only the empty firepit opens the builder", result && {
    caption: result.captionClickOpened, pit: result.pitClickOpened, target: result.pitTarget
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
check(result && result.complete && result.complete.state.complete && result.complete.sceneBuilt &&
  result.complete.logsVisible && !result.complete.potBoiling &&
  !result.complete.potVisible && result.complete.crateVisible && result.complete.sceneFood === "0" &&
  !result.complete.gameOpen && result.complete.key === "entrance_roadtrip_stew_invite",
  "the full fuel chain grows into the warm campsite with only the food crate available", result && result.complete);
check(result && result.potOpenLit && !result.potOpenLit.potBoiling && !result.potOpenLit.potOpen &&
  !result.potOpenLit.potVisible && result.potOpenLit.crateVisible && result.potOpenLit.sceneFood === "0" &&
  !result.potOpenLit.openSteamActive && result.potOpenLit.openBubbles >= 5 && !result.potOpenLit.gameOpen &&
  result.potOpenLit.state.lit && result.potClosedLit && !result.potClosedLit.potBoiling &&
  !result.potClosedLit.potOpen && !result.potClosedLit.potVisible && result.potClosedLit.state.lit &&
  result.potOpenCold && !result.potOpenCold.potBoiling && !result.potOpenCold.potOpen &&
  !result.potOpenCold.potVisible && !result.potOpenCold.crateVisible && result.potOpenCold.sceneFood === "0" &&
  !result.potOpenCold.openSteamActive && !result.potOpenCold.state.lit && !result.potOpenCold.gameOpen &&
  result.potClosedCold && !result.potClosedCold.potOpen && !result.potClosedCold.potVisible && !result.potClosedCold.state.lit,
  "the empty scene pot stays offstage and inert until a recipe is committed", result && {
    litOpen: result.potOpenLit, litClosed: result.potClosedLit,
    coldOpen: result.potOpenCold, coldClosed: result.potClosedCold
  });
check(result && result.saved === true && result.restored && result.restored.state.complete && result.restored.sceneBuilt,
  "a completed fire survives checkpoint restore", result && result.restored);
check(result && result.freshArrival && result.freshArrival.state.complete &&
  !result.freshArrival.state.lit && result.freshArrival.sceneBuilt && !result.freshArrival.logsVisible &&
  !result.freshArrival.potBoiling,
  "reaching Camping anew extinguishes a previously built fire", result && result.freshArrival);
check(result && result.extinguished &&
  result.extinguished.state.complete && !result.extinguished.state.lit && result.extinguished.sceneBuilt &&
  !result.extinguished.logsVisible && !result.extinguished.potBoiling &&
  !result.extinguished.gameOpen, "clicking the finished flames extinguishes only the fire",
  result && result.extinguished);
check(result && result.extinguishedRestored && result.extinguishedRestored.state.complete &&
  !result.extinguishedRestored.state.lit && result.extinguishedRestored.sceneBuilt &&
  !result.extinguishedRestored.logsVisible,
  "Continue preserves a built but extinguished campsite", result && result.extinguishedRestored);
check(result && result.coldPitCursor === "pointer" && result.replay &&
  result.replay.state.complete && result.replay.gameOpen &&
  !result.replay.state.tinder && !result.replay.state.twigs && !result.replay.state.logs,
  "the whole cold firepit starts a fresh build before a child can steal the click", result && {
    cursor: result.coldPitCursor, replay: result.replay
  });

if (failures) process.exit(1);
console.log("Campsite fire assertions passed.");
