#!/usr/bin/env node
// Shift-clicking or touch-long-pressing a route card shortcuts to the chosen segment's exit.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], normal: {}, shifted: {}, longPressed: {} };
  function roadtrip() { return window.__entranceRoomState().drive.roadtrip; }
  function motion() {
    var state = window.__entranceRoomState();
    return {
      engineOn: state.car.engineOn,
      speed: state.drive.speed,
      gear: state.drive.gear,
      range: state.drive.transmission.range,
      position: state.drive.position,
      distance: state.drive.roadtrip.distance,
      routeDistance: state.drive.roadtrip.routeDistance,
      routeElapsed: state.drive.roadtrip.routeElapsed
    };
  }
  function start() { return { state: roadtrip(), motion: motion() }; }
  function pressEscape() {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape", code: "Escape", bubbles: true, cancelable: true
    }));
  }
  function openChooser() {
    if (roadtrip().active) {
      pressEscape();
      if (roadtrip().active) pressEscape();
    }
    window.__entranceRoadtripOpenChooser();
  }
  function dirtyRun() {
    if (!roadtrip().active) return;
    window.__entranceRoadtripSetLane(-Math.max(.5, roadtrip().maxLane - .2));
    window.__entranceDriveRange("D");
    window.__entranceDriveSetMotion(72, 3);
  }
  function choose(route, shiftKey) {
    dirtyRun();
    openChooser();
    document.getElementById("entrance-roadtrip-route-" + route).dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, shiftKey: shiftKey })
    );
    return start();
  }
  function longPress(route, pointerId, done) {
    dirtyRun();
    openChooser();
    var choice = document.getElementById("entrance-roadtrip-route-" + route);
    choice.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, pointerId: pointerId, pointerType: "touch", button: 0,
      clientX: 340, clientY: 80
    }));
    setTimeout(function () {
      choice.dispatchEvent(new PointerEvent("pointerup", {
        bubbles: true, cancelable: true, pointerId: pointerId, pointerType: "touch", button: 0,
        clientX: 340, clientY: 80
      }));
      report.longPressed[route] = start();
      done();
    }, 680);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", {
          value: function () { return true; }, configurable: true
        });
        window.__unlockAllRooms();
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
        window.__setSecondRound(true, { releaseHeld: false });
        if (window.__gardenPartyOn) window.__setPartyMode(false, true);
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart();

        report.normal.calgary = choose("calgary", false);
        report.normal.banff = choose("banff", false);
        report.normal.abraham = choose("abraham", false);
        report.shifted.calgary = choose("calgary", true);
        report.driveStart = motion();
        window.__entranceDriveControl("throttle", true);
        for (var driveStep = 0; driveStep < 20; driveStep++) window.__entranceDriveStep(50);
        report.validDrive = motion();
        window.__entranceDriveControl("throttle", false);
        window.__entranceDriveStep(300);
        report.validCoast = motion();
        window.__entranceDriveSetMotion(0, 0);
        window.__entranceDriveRange("P");
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
        window.__entranceDriveControl("throttle", false);
        window.__entranceDriveRange("R");
        window.__entranceDriveStep(1000);
        report.stationaryReverse = motion();
        report.shifted.banff = choose("banff", true);
        report.shifted.abraham = choose("abraham", true);
        longPress("calgary", 41, function () {
          longPress("banff", 42, function () {
            longPress("abraham", 43, function () {
              report.errors = (window.__errs || []).concat(report.errors);
              document.getElementById("__report").textContent = JSON.stringify(report);
            });
          });
        });
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
check(/ROADTRIP_SHORTCUT_REMAINING_SECONDS = 5/.test(source) &&
  /ROADTRIP_SHORTCUT_REMAINING_DISTANCE = roadtripDistanceForSeconds\(ROADTRIP_SHORTCUT_REMAINING_SECONDS\)/.test(source),
  "the private shortcut leaves five nominal seconds of travel in the selected segment");

var result = lib.runPageSync("rsvp.html", HARNESS, 5000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the shortcut runs without uncaught errors",
  result && result.errors);

var expectedStartLanes = { calgary: 3.32, banff: 2.32, abraham: 1.32 };
var roadEdgeLanes = { calgary: 3, banff: 2, abraham: 1 };
function stoppedInDriveOnRightShoulder(snapshot, route) {
  var state = snapshot && snapshot.state || {};
  var motion = snapshot && snapshot.motion || {};
  return state.route === route && state.playerLane === expectedStartLanes[route] &&
    state.playerLane - roadEdgeLanes[route] >= .3 &&
    state.shoulderZone === "gravel" && motion.range === "D" && motion.gear === 1 && motion.speed === 0;
}
var normal = result && result.normal || {};
check(Object.keys(expectedStartLanes).every(function (route) {
  return stoppedInDriveOnRightShoulder(normal[route], route);
}), "ordinary route choices discard prior motion, retain Drive, and start on each right shoulder", normal);

var shifted = result && result.shifted || {};
check(Object.keys(expectedStartLanes).every(function (route) {
  return stoppedInDriveOnRightShoulder(shifted[route], route);
}), "Shift-click shortcuts discard prior motion, retain Drive, and start on each right shoulder", shifted);
var shiftedCalgary = shifted.calgary && shifted.calgary.state || {};
check(shiftedCalgary.route === "calgary" &&
  Math.abs(shiftedCalgary.routeDistance -
    (shiftedCalgary.calgaryDistance - 5 * shiftedCalgary.routePaceKmh / 3.6)) < .001,
  "Shift-click Calgary starts one shortcut-distance before its exit", shiftedCalgary);
var driveStart = result && result.driveStart || {};
var parked = result && result.parkedStart || {};
var parkedThrottle = result && result.parkedThrottle || {};
var engineOffThrottle = result && result.engineOffThrottle || {};
var restartedParkThrottle = result && result.restartedParkThrottle || {};
var stationaryReverse = result && result.stationaryReverse || {};
var validDrive = result && result.validDrive || {};
var validCoast = result && result.validCoast || {};
check(driveStart.engineOn && driveStart.range === "D" && driveStart.gear === 1 && driveStart.speed === 0,
  "a fresh near-exit shortcut drops carried momentum without changing Drive", driveStart);
check(parkedThrottle.range === "P" && parkedThrottle.gear === 0 && parkedThrottle.speed === 0 &&
  parkedThrottle.position === parked.position && parkedThrottle.distance === parked.distance &&
  parkedThrottle.routeDistance === parked.routeDistance,
  "accelerating in AUTO Park cannot move or advance the shortcut-started car", {
    before: parked, after: parkedThrottle
  });
check(!engineOffThrottle.engineOn && engineOffThrottle.range === "P" &&
  engineOffThrottle.gear === 0 && engineOffThrottle.speed === 0 &&
  engineOffThrottle.position === parked.position && engineOffThrottle.distance === parked.distance &&
  engineOffThrottle.routeDistance === parked.routeDistance,
  "engine-off acceleration cannot propel the shortcut-started car", engineOffThrottle);
check(restartedParkThrottle.engineOn && restartedParkThrottle.range === "P" &&
  restartedParkThrottle.gear === 0 && restartedParkThrottle.speed === 0 &&
  restartedParkThrottle.position === parked.position && restartedParkThrottle.distance === parked.distance &&
  restartedParkThrottle.routeDistance === parked.routeDistance,
  "restarting in AUTO Park still cannot advance the route without Drive", restartedParkThrottle);
check(stationaryReverse.range === "R" && stationaryReverse.gear === -1 && stationaryReverse.speed === 0 &&
  stationaryReverse.position === parked.position && stationaryReverse.distance === parked.distance &&
  stationaryReverse.routeDistance === parked.routeDistance,
  "selecting Reverse at rest cannot advance the route as forward motion", stationaryReverse);
check(validDrive.engineOn && validDrive.range === "D" && validDrive.gear > 0 &&
  validDrive.speed > 0 && validDrive.distance > driveStart.distance &&
  validDrive.routeDistance > driveStart.routeDistance,
  "fresh acceleration begins immediately when AUTO Drive was already selected", validDrive);
check(validCoast.range === "D" && validCoast.gear > 0 && validCoast.speed > 0 &&
  validCoast.speed < validDrive.speed && validCoast.distance > validDrive.distance,
  "a valid drive gear retains ordinary throttle-release coasting", {
    powered: validDrive, coast: validCoast
  });
var shiftedBanff = shifted.banff && shifted.banff.state || {};
check(shiftedBanff.route === "banff" &&
  Math.abs(shiftedBanff.banffDistance -
    (shiftedBanff.banffDistanceRequired - 5 * shiftedBanff.routePaceKmh / 3.6)) < .001,
  "Shift-click Banff starts one shortcut-distance before its exit", shiftedBanff);
var shiftedAbraham = shifted.abraham && shifted.abraham.state || {};
check(shiftedAbraham.route === "abraham" &&
  Math.abs(shiftedAbraham.abrahamDistance -
    (shiftedAbraham.abrahamDistanceRequired - 5 * shiftedAbraham.routePaceKmh / 3.6)) < .001,
  "Shift-click Abraham Lake starts one shortcut-distance before Camping", shiftedAbraham);

var normalAbraham = normal.abraham && normal.abraham.state || {};
check(normalAbraham.route === "abraham" && normalAbraham.abrahamDistance === 0,
  "an ordinary Abraham Lake click still starts the segment at its beginning", normalAbraham);

var longPressed = result && result.longPressed || {};
check(Object.keys(expectedStartLanes).every(function (route) {
  return stoppedInDriveOnRightShoulder(longPressed[route], route);
}), "mobile long-press shortcuts discard prior motion, retain Drive, and start on each right shoulder", longPressed);
var longCalgary = longPressed.calgary && longPressed.calgary.state || {};
var longBanff = longPressed.banff && longPressed.banff.state || {};
var longAbraham = longPressed.abraham && longPressed.abraham.state || {};
check(longCalgary.route === "calgary" &&
  Math.abs(longCalgary.routeDistance -
    (longCalgary.calgaryDistance - 5 * longCalgary.routePaceKmh / 3.6)) < .2 &&
  longBanff.route === "banff" &&
  Math.abs(longBanff.banffDistance -
    (longBanff.banffDistanceRequired - 5 * longBanff.routePaceKmh / 3.6)) < .2 &&
  longAbraham.route === "abraham" &&
  Math.abs(longAbraham.abrahamDistance -
    (longAbraham.abrahamDistanceRequired - 5 * longAbraham.routePaceKmh / 3.6)) < .2,
  "mobile long-press uses the same near-exit shortcut for every segment", longPressed);

if (failures) process.exit(1);
console.log("Road Trip route shortcut checks passed.");
