#!/usr/bin/env node
// Road Trip steering weight, loose-surface slip, vibration, and asphalt recovery.
"use strict";

var lib = require("./lib");
var failures = 0;

function check(ok, label, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + label);
  if (!ok) {
    failures++;
    if (detail !== undefined) console.log("    " + JSON.stringify(detail));
  }
}

var harness = String.raw`<pre id="__report">pending</pre>
<script>
(async function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function drive() { return window.__entranceRoomState().drive; }
  function step(count, ms) {
    for (var i = 0; i < count; i++) window.__entranceDriveStep(ms || 80);
  }
  function setup(mode, distance, speed, lane) {
    window.__entranceRoadtripSetRoute("banff", 0);
    window.__entranceRoadtripSetDistance(distance || 0);
    window.__entranceRoadtripSetLane(lane == null ? .5 : lane);
    window.__entranceDriveTransmissionMode(mode);
    window.__entranceDriveSetMotion(speed, speed >= 125 ? 4 : speed >= 70 ? 3 : 2);
  }
  function curveRun(mode, speed) {
    setup(mode, 150, speed, .5);
    var before = copy(drive());
    step(4);
    var after = copy(drive());
    return {
      beforeLane: before.roadtrip.playerLane,
      afterLane: after.roadtrip.playerLane,
      drift: Math.abs(after.roadtrip.playerLane - before.roadtrip.playerLane),
      weight: after.roadtrip.handling.curveWeight,
      authority: after.roadtrip.handling.steeringAuthority
    };
  }
  function rumbleVisual() {
    var svg = document.getElementById("entrance-drive-hud-svg");
    return {
      className: svg.getAttribute("class") || "",
      roughness: Number(svg.getAttribute("data-roadtrip-roughness")),
      x: parseFloat(svg.style.getPropertyValue("--roadtrip-rumble-x")) || 0,
      y: parseFloat(svg.style.getPropertyValue("--roadtrip-rumble-y")) || 0,
      period: parseFloat(svg.style.getPropertyValue("--roadtrip-rumble-period")) || 0
    };
  }
  try {
    var attended = true;
    Object.defineProperty(document, "hasFocus", {
      value: function () { return attended; }, configurable: true
    });
    window.__unlockAllRooms();
    window.goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__entranceRoadtripDevStart();
    await sleep(40);

    report.curves = {
      lowManual: curveRun("manual", 55),
      highManual: curveRun("manual", 145),
      highAuto: curveRun("auto", 145)
    };

    setup("auto", 0, 120, .5);
    window.__entranceDriveControl("steerLeft", true);
    step(5);
    window.__entranceDriveControl("steerLeft", false);
    var release = copy(drive());
    step(1);
    var returning = copy(drive());
    step(14);
    var centred = copy(drive());
    report.returning = {
      release: release,
      returning: returning,
      centred: centred
    };

    setup("auto", 0, 100, 1.8);
    var rumble = { state: copy(drive()), visual: rumbleVisual() };
    window.__entranceRoadtripSetLane(2.14);
    var gravel = { state: copy(drive()), visual: rumbleVisual() };
    window.__entranceDriveControl("steerLeft", true);
    var enteredRoad = false;
    for (var steerStep = 0; steerStep < 32; steerStep++) {
      step(1);
      if (drive().roadtrip.shoulderZone === "road") {
        enteredRoad = true;
        break;
      }
    }
    window.__entranceDriveControl("steerLeft", false);
    var recoveryStart = { state: copy(drive()), visual: rumbleVisual() };
    step(14);
    var recoveryEnd = { state: copy(drive()), visual: rumbleVisual() };
    report.surface = {
      rumble: rumble,
      gravel: gravel,
      enteredRoad: enteredRoad,
      recoveryStart: recoveryStart,
      recoveryEnd: recoveryEnd
    };

    setup("auto", 0, 0, .5);
    window.__entranceDriveControl("steerLeft", true);
    step(5);
    window.__entranceDriveControl("steerLeft", false);
    var parkingBeforeBlur = copy(drive());
    attended = false;
    window.dispatchEvent(new Event("blur"));
    var parkingBlurred = copy(drive());
    attended = true;
    window.dispatchEvent(new Event("focus"));
    await sleep(40);
    var parkingWaiting = copy(drive());
    window.__exitEntranceRoadtrip();
    var parkingExited = copy(drive());
    await sleep(1200);
    var parkingCentred = copy(drive());
    report.focusPausedExit = {
      beforeBlur: parkingBeforeBlur,
      blurred: parkingBlurred,
      waiting: parkingWaiting,
      exited: parkingExited,
      centred: parkingCentred
    };
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  report.errors = (window.__errs || []).concat(report.errors);
  document.getElementById("__report").textContent = JSON.stringify(report);
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 5000, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-09-22&time=14:00#play",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});

console.log("rsvp.html Road Trip handling refinement:");
check(result && result.errors.length === 0, "handling probe has no page errors", result && result.errors);

var curves = result && result.curves;
check(curves && curves.highManual.weight > curves.lowManual.weight + .2 &&
  curves.highManual.drift > curves.lowManual.drift * 2.5,
  "bend load grows progressively with road speed", curves);
check(curves && curves.highAuto.drift < curves.highManual.drift * .55 &&
  curves.highAuto.drift > curves.highManual.drift * .3,
  "AUTO keeps gentle partial curve assistance while MANUAL carries full bend weight", curves);

var returning = result && result.returning;
check(returning && returning.release.steeringAngle < -8 &&
  returning.returning.steeringAngle < 0 &&
  returning.returning.roadtrip.playerLane < returning.release.roadtrip.playerLane &&
  Math.abs(returning.centred.steeringAngle) < .25 &&
  Math.abs(returning.centred.roadtrip.handling.lateralVelocity) < .03,
  "released steering follows the easing wheel, then settles cleanly at centre", returning && {
    release: {
      lane: returning.release.roadtrip.playerLane,
      angle: returning.release.steeringAngle,
      velocity: returning.release.roadtrip.handling.lateralVelocity
    },
    returning: {
      lane: returning.returning.roadtrip.playerLane,
      angle: returning.returning.steeringAngle,
      velocity: returning.returning.roadtrip.handling.lateralVelocity
    },
    centred: {
      lane: returning.centred.roadtrip.playerLane,
      angle: returning.centred.steeringAngle,
      velocity: returning.centred.roadtrip.handling.lateralVelocity
    }
  });

var surface = result && result.surface;
check(surface && surface.rumble.state.roadtrip.shoulderZone === "rumble" &&
  surface.gravel.state.roadtrip.shoulderZone === "gravel" &&
  surface.gravel.state.roadtrip.handling.grip < surface.rumble.state.roadtrip.handling.grip &&
  surface.gravel.visual.x > surface.rumble.visual.x * 2 &&
  surface.gravel.visual.y > surface.rumble.visual.y * 2 &&
  surface.gravel.visual.period < surface.rumble.visual.period,
  "gravel progressively loosens grip and adds a rougher two-axis vibration than the rumble strip",
  surface && { rumble: surface.rumble, gravel: surface.gravel });
check(surface && surface.enteredRoad &&
  surface.recoveryStart.state.roadtrip.shoulderZone === "road" &&
  surface.recoveryStart.state.roadtrip.handling.surfaceRoughness > .05 &&
  /roadtrip-shoulder-rumble/.test(surface.recoveryStart.visual.className) &&
  Math.abs(surface.recoveryStart.state.roadtrip.handling.lateralVelocity) > .02 &&
  surface.recoveryEnd.state.roadtrip.handling.surfaceRoughness < .01 &&
  Math.abs(surface.recoveryEnd.state.roadtrip.handling.lateralVelocity) < .03 &&
  !/roadtrip-shoulder-rumble/.test(surface.recoveryEnd.visual.className),
  "returning to asphalt carries a short audible/visual slip tail, then restores settled grip",
  surface && { start: surface.recoveryStart, end: surface.recoveryEnd });

var focusPausedExit = result && result.focusPausedExit;
check(focusPausedExit && focusPausedExit.beforeBlur.steeringAngle < -8 &&
  focusPausedExit.blurred.roadtrip.resumePending && !focusPausedExit.blurred.frameActive &&
  focusPausedExit.waiting.roadtrip.resumePending && !focusPausedExit.waiting.frameActive &&
  !focusPausedExit.exited.roadtrip.active && focusPausedExit.exited.frameActive &&
  Math.abs(focusPausedExit.centred.steeringAngle) < .25,
  "exiting a focus-paused Road Trip restarts the parked car loop and centres its released wheel",
  focusPausedExit && {
    beforeBlur: { angle: focusPausedExit.beforeBlur.steeringAngle },
    blurred: {
      angle: focusPausedExit.blurred.steeringAngle,
      paused: focusPausedExit.blurred.roadtrip.resumePending,
      frame: focusPausedExit.blurred.frameActive
    },
    exited: {
      angle: focusPausedExit.exited.steeringAngle,
      active: focusPausedExit.exited.roadtrip.active,
      frame: focusPausedExit.exited.frameActive
    },
    centred: { angle: focusPausedExit.centred.steeringAngle }
  });

if (failures) process.exit(1);
console.log("Road Trip handling assertions passed.");
