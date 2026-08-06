#!/usr/bin/env node
// Shift-clicking or touch-long-pressing a route card shortcuts to the chosen segment's exit.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], shifted: {} };
  function roadtrip() { return window.__entranceRoomState().drive.roadtrip; }
  function motion() {
    var state = window.__entranceRoomState();
    return {
      engineOn: state.car.engineOn,
      speed: state.drive.speed,
      gear: state.drive.gear,
      range: state.drive.transmission.range,
      position: state.drive.position,
      distance: state.drive.roadtrip.distance
    };
  }
  function pressEscape() {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape", code: "Escape", bubbles: true, cancelable: true
    }));
  }
  function openChooser() {
    if (roadtrip().active) pressEscape();
    document.getElementById("entrance-roadtrip-reenter").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );
  }
  function choose(route, shiftKey) {
    openChooser();
    document.getElementById("entrance-roadtrip-route-" + route).dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, shiftKey: shiftKey })
    );
    return roadtrip();
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", {
          value: function () { return true; }, configurable: true
        });
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripStart();

        window.__entranceDriveRange("D");
        window.__entranceDriveSetMotion(72, 3);
        report.shifted.calgary = choose("calgary", true);
        report.parkedStart = motion();
        window.__entranceDriveControl("throttle", true);
        window.__entranceDriveStep(1000);
        report.parkedThrottle = motion();
        window.__toggleEntrancePorscheEngine();
        window.__entranceDriveControl("throttle", true);
        window.__entranceDriveStep(1000);
        report.engineOffThrottle = motion();
        window.__toggleEntrancePorscheEngine();
        window.__entranceDriveControl("throttle", true);
        window.__entranceDriveStep(1000);
        report.restartedParkThrottle = motion();
        window.__entranceDriveRange("D");
        window.__entranceDriveControl("throttle", true);
        for (var driveStep = 0; driveStep < 20; driveStep++) window.__entranceDriveStep(50);
        report.validDrive = motion();
        window.__entranceDriveControl("throttle", false);
        window.__entranceDriveStep(300);
        report.validCoast = motion();
        report.shifted.banff = choose("banff", true);
        report.shifted.abraham = choose("abraham", true);
        report.normalAbraham = choose("abraham", false);
        window.__entranceDriveRange("D");
        window.__entranceDriveSetMotion(64, 3);
        openChooser();
        var touchChoice = document.getElementById("entrance-roadtrip-route-banff");
        touchChoice.dispatchEvent(new PointerEvent("pointerdown", {
          bubbles: true, cancelable: true, pointerId: 41, pointerType: "touch", button: 0,
          clientX: 340, clientY: 80
        }));
        setTimeout(function () {
          touchChoice.dispatchEvent(new PointerEvent("pointerup", {
            bubbles: true, cancelable: true, pointerId: 41, pointerType: "touch", button: 0,
            clientX: 340, clientY: 80
          }));
          report.longPressedBanff = roadtrip();
          report.longPressMotion = motion();
          report.errors = (window.__errs || []).concat(report.errors);
          document.getElementById("__report").textContent = JSON.stringify(report);
        }, 680);
        return;
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

console.log("rsvp.html Road Trip route shortcuts:");
var source = fs.readFileSync(path.join(lib.ROOT, "rsvp.html"), "utf8");
check(/ROADTRIP_SHORTCUT_REMAINING_SECONDS = 3/.test(source),
  "the private shortcut leaves three attended seconds in the selected segment");

var result = lib.runPageSync("rsvp.html", HARNESS, 5000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the shortcut runs without uncaught errors",
  result && result.errors);

var shifted = result && result.shifted || {};
check(shifted.calgary && shifted.calgary.route === "calgary" &&
  shifted.calgary.routeElapsed === shifted.calgary.calgarySeconds - 3,
  "Shift-click Calgary starts three seconds before its exit", shifted.calgary);
var parked = result && result.parkedStart || {};
var parkedThrottle = result && result.parkedThrottle || {};
var engineOffThrottle = result && result.engineOffThrottle || {};
var restartedParkThrottle = result && result.restartedParkThrottle || {};
var validDrive = result && result.validDrive || {};
var validCoast = result && result.validCoast || {};
check(parked.engineOn && parked.range === "P" && parked.gear === 0 && parked.speed === 0,
  "a fresh near-exit shortcut drops carried momentum and starts parked", parked);
check(parkedThrottle.range === "P" && parkedThrottle.gear === 0 && parkedThrottle.speed === 0 &&
  parkedThrottle.position === parked.position && parkedThrottle.distance === parked.distance,
  "accelerating in AUTO Park cannot move the shortcut-started car", {
    before: parked, after: parkedThrottle
  });
check(!engineOffThrottle.engineOn && engineOffThrottle.range === "P" &&
  engineOffThrottle.gear === 0 && engineOffThrottle.speed === 0 &&
  engineOffThrottle.position === parked.position && engineOffThrottle.distance === parked.distance,
  "engine-off acceleration cannot propel the shortcut-started car", engineOffThrottle);
check(restartedParkThrottle.engineOn && restartedParkThrottle.range === "P" &&
  restartedParkThrottle.gear === 0 && restartedParkThrottle.speed === 0 &&
  restartedParkThrottle.position === parked.position && restartedParkThrottle.distance === parked.distance,
  "restarting in AUTO Park still requires selecting a drive range", restartedParkThrottle);
check(validDrive.engineOn && validDrive.range === "D" && validDrive.gear > 0 &&
  validDrive.speed > 0 && validDrive.distance > parked.distance,
  "fresh acceleration begins after AUTO Drive is selected", validDrive);
check(validCoast.range === "D" && validCoast.gear > 0 && validCoast.speed > 0 &&
  validCoast.speed < validDrive.speed && validCoast.distance > validDrive.distance,
  "a valid drive gear retains ordinary throttle-release coasting", {
    powered: validDrive, coast: validCoast
  });
check(shifted.banff && shifted.banff.route === "banff" &&
  shifted.banff.banffElapsed === shifted.banff.banffSeconds - 3,
  "Shift-click Banff starts three seconds before its exit", shifted.banff);
check(shifted.abraham && shifted.abraham.route === "abraham" &&
  shifted.abraham.abrahamElapsed === shifted.abraham.abrahamSeconds - 3,
  "Shift-click Abraham Lake starts three seconds before Camping", shifted.abraham);

var normal = result && result.normalAbraham || {};
check(normal.route === "abraham" && normal.abrahamElapsed === 0,
  "an ordinary Abraham Lake click still starts the segment at its beginning", normal);

var longPressed = result && result.longPressedBanff || {};
check(longPressed.route === "banff" &&
  Math.abs(longPressed.banffElapsed - (longPressed.banffSeconds - 3)) < .2,
  "a mobile long-press uses the same near-exit shortcut", longPressed);
var longPressMotion = result && result.longPressMotion || {};
check(longPressMotion.range === "P" && longPressMotion.gear === 0 && longPressMotion.speed === 0,
  "a mobile near-exit shortcut also drops carried momentum", longPressMotion);

if (failures) process.exit(1);
console.log("Road Trip route shortcut checks passed.");
