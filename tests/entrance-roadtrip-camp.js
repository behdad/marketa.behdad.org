#!/usr/bin/env node
// Abraham Lake arrival and keyboard boundary: arrows stay put; Escape/Backspace return to Entrance.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], navKeys: [], shortcutKeys: [] };
  function snapshot() {
    var room = document.getElementById("entrance-room");
    var state = window.__entranceRoomState();
    return {
      entranceOpen: !!window.__entranceRoomOpen,
      stage: window.currentStageName,
      roadtripActive: state.drive.roadtrip.active,
      roadtripPaused: state.drive.roadtrip.paused,
      campVisited: state.drive.roadtrip.campVisited,
      route: state.drive.roadtrip.route,
      routeChooserOpen: state.drive.roadtrip.routeChooserOpen,
      reentryMenuOpen: document.getElementById("entrance-roadtrip-reenter-menu").classList.contains("show"),
      hudOpen: state.drive.hud,
      engineOn: state.car.engineOn,
      speed: state.drive.speed,
      day: room.classList.contains("entrance-day"),
      classes: room.getAttribute("class") || ""
    };
  }
  function press(key, code) {
    var event = new KeyboardEvent("keydown", {
      key: key,
      code: code || key,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);
    return { key: key, prevented: event.defaultPrevented, state: snapshot() };
  }
  function reopenCamp() {
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("camp", 0);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.__setSecondRound(true, { releaseHeld: false });
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("abraham", 75);
        window.__entranceRoadtripSetLane(1);
        window.__entranceDriveSetMotion(0, 1);
        window.__entranceDriveStep(100);
        report.noMomentum = snapshot();

        window.__entranceRoadtripSetRoute("abraham", 74.5);
        window.__entranceRoadtripSetLane(1);
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceDriveSetMotion(80, 1);
        var campSign = document.getElementById("entrance-roadtrip-camp-exit");
        report.signApproach = {
          visibility: campSign.getAttribute("visibility"),
          transform: campSign.getAttribute("transform"),
          en: document.querySelector("#entrance-roadtrip-camp-sign text").textContent
        };
        setLang("cs");
        report.signApproach.cs = document.querySelector("#entrance-roadtrip-camp-sign text").textContent;
        setLang("en");
        window.__entranceDriveStep(500);
        report.slowing = snapshot();
        report.signAfterEntrance = campSign.getAttribute("visibility");
        window.__entranceDriveStep(500);

        var room = document.getElementById("entrance-room");
        var dismiss = document.getElementById("entrance-roadtrip-dismiss");
        report.arrival = snapshot();
        report.dismiss = {
          displayed: getComputedStyle(dismiss).display,
          title: dismiss.getAttribute("title"),
          type: dismiss.type
        };

        [["ArrowLeft"], ["ArrowRight"], ["ArrowUp"], ["ArrowDown"]].forEach(function (row) {
          report.navKeys.push(press(row[0], row[1]));
        });
        report.shortcutKeys.push(press("d", "KeyD"));

        room.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.afterBackgroundClick = snapshot();
        var campCar = document.getElementById("entrance-roadtrip-camp-porsche");
        var trunk = campCar.querySelector('[data-camp-car-action="trunk"]');
        trunk.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.trunk = {
          targetCount: campCar.querySelectorAll('[data-camp-car-action="trunk"]').length,
          open: campCar.classList.contains("trunk-open"),
          doorOpen: campCar.classList.contains("door-open"),
          frunkOpen: campCar.classList.contains("frunk-open")
        };

        report.escape = press("Escape", "Escape");
        reopenCamp();
        report.backspace = press("Backspace", "Backspace");
        reopenCamp();
        dismiss.click();
        report.afterDismiss = snapshot();
        document.getElementById("entrance-roadtrip-reenter").dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.afterReenterMenu = snapshot();
        document.querySelector('[data-roadtrip-reentry-choice="new"]').dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.afterNew = snapshot();
        document.getElementById("entrance-roadtrip-route-later").dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }));
        document.getElementById("entrance-roadtrip-reenter").dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }));
        document.querySelector('[data-roadtrip-reentry-choice="camp"]').dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.afterCampReturn = snapshot();
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
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
function campIsOpen(state) {
  return state && state.entranceOpen && state.stage === "balcony" && state.roadtripActive &&
    state.route === "camp" && state.hudOpen && !state.engineOn &&
    /roadtrip-active/.test(state.classes || "") && /roadtrip-route-camp/.test(state.classes || "");
}

console.log("loft-day.html Abraham Lake camp keyboard ownership:");
var result = lib.runPageSync("loft-day.html", HARNESS, 4500, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});

check(result && result.errors.length === 0, "the camp opens without uncaught errors", result && result.errors);
check(result && campIsOpen(result.noMomentum) && result.noMomentum.speed === 0,
  "a car already stopped past the entrance reaches camp without borrowed momentum", result && result.noMomentum);
check(result && result.slowing && result.slowing.route === "abraham" &&
  result.slowing.speed > 10 && result.slowing.speed < 80,
  "passing the entrance starts an autonomous slowdown before the camp handoff", result && result.slowing);
check(result && result.signApproach && result.signApproach.visibility === "visible" &&
  /translate\(/.test(result.signApproach.transform || "") &&
  result.signApproach.en === "CAMPING" && result.signApproach.cs === "KEMP" &&
  result.signAfterEntrance === "visible",
  "a bilingual right-turn camping sign remains through the latched Abraham turn", result && result.signApproach);
check(result && campIsOpen(result.arrival),
  "the camp fades in once the autonomous slowdown drops below 10 km/h", result && result.arrival);
check(result && result.dismiss.displayed === "grid" && result.dismiss.type === "button",
  "the camp exposes its dedicated top-right dismiss button", result && result.dismiss);
check(result && result.navKeys.length === 4 && result.navKeys.every(function (row) {
  return row.prevented && campIsOpen(row.state);
}), "arrow navigation stays inside the camp", result && result.navKeys);
check(result && result.shortcutKeys.length === 1 && result.shortcutKeys.every(function (row) {
  return row.prevented && campIsOpen(row.state);
}),
  "ordinary game shortcuts pass through without leaving camp", result && result.shortcutKeys);
check(result && campIsOpen(result.afterBackgroundClick),
  "clicking the camp itself does not dismiss it", result && result.afterBackgroundClick);
check(result && result.trunk && result.trunk.targetCount === 1 && result.trunk.open &&
  !result.trunk.doorOpen && !result.trunk.frunkOpen,
  "the rear trunk has one independent prop target", result && result.trunk);
check(result && result.escape && result.escape.prevented && !result.escape.state.roadtripActive &&
  result.escape.state.entranceOpen && result.escape.state.hudOpen,
  "Escape dismisses camp back to the Entrance dashboard", result && result.escape);
check(result && result.backspace && result.backspace.prevented && !result.backspace.state.roadtripActive &&
  result.backspace.state.entranceOpen && result.backspace.state.hudOpen,
  "Backspace dismisses camp back to the Entrance dashboard", result && result.backspace);
check(result && result.afterDismiss && result.afterDismiss.entranceOpen &&
  result.afterDismiss.stage === "balcony" && !result.afterDismiss.roadtripActive &&
  !result.afterDismiss.roadtripPaused && result.afterDismiss.campVisited && result.afterDismiss.hudOpen &&
  !/roadtrip-active/.test(result.afterDismiss.classes || ""),
  "the × also returns to the parked Entrance dashboard", result && result.afterDismiss);
check(result && result.afterReenterMenu && !result.afterReenterMenu.roadtripActive &&
  !result.afterReenterMenu.roadtripPaused && result.afterReenterMenu.reentryMenuOpen &&
  !result.afterReenterMenu.routeChooserOpen,
  "Road Trip offers explicit actions after a dismissed campsite", result && result.afterReenterMenu);
check(result && result.afterNew && !result.afterNew.roadtripActive &&
  !result.afterNew.roadtripPaused && result.afterNew.routeChooserOpen,
  "New opens the chooser for a fresh Road Trip", result && result.afterNew);
check(result && campIsOpen(result.afterCampReturn) && result.afterCampReturn.campVisited,
  "Camping returns directly to the reached campsite", result && result.afterCampReturn);

if (failures) process.exit(1);
console.log("Abraham Lake camp keyboard assertions passed.");
