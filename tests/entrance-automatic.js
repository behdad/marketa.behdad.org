#!/usr/bin/env node
// Focused AUTO transmission defaults, controls, drivetrain and recovery contract.
"use strict";

var lib = require("./lib");

var DEFAULT_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () { setTimeout(function () {
  var drive = window.__entranceRoomState().drive;
  document.getElementById("__report").textContent = JSON.stringify({
    errors: window.__errs || [],
    mode: drive.transmission.mode,
    primaryCoarse: matchMedia("(pointer: coarse)").matches,
    noHover: matchMedia("(hover: none)").matches,
    anyCoarse: matchMedia("(any-pointer: coarse)").matches,
    standalone: matchMedia("(display-mode: standalone)").matches
  });
}, 120); });
</script>`;

var MAIN_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return window.__entranceRoomState(); }
  function drive() { return state().drive; }
  function key(key, code, target, modifiers) {
    var event = new KeyboardEvent("keydown", Object.assign({
      key: key, code: code || key, bubbles: true, cancelable: true
    }, modifiers || {}));
    (target || document).dispatchEvent(event);
    return event;
  }
  async function run() {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.__setSecondRound(true, { releaseHeld: false });
      window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
        "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
      window.goToStage("balcony");
      window.__openEntranceRoom();
      await sleep(40);
      window.__openEntrancePorscheDriveHud();
      var autoButton = document.getElementById("entrance-drive-mode-auto");
      var manualButton = document.getElementById("entrance-drive-mode-manual");
      var modeHitNode = autoButton.querySelector(".entrance-drive-mode-touch-hit");
      var modeHitMatrix = modeHitNode.getScreenCTM();
      report.steps.controls = {
        mode: copy(drive().transmission),
        hitWidth: Math.abs(modeHitMatrix && modeHitMatrix.a || 0) * Number(modeHitNode.getAttribute("width")),
        hitHeight: Math.abs(modeHitMatrix && modeHitMatrix.d || 0) * Number(modeHitNode.getAttribute("height")),
        autoTab: autoButton.getAttribute("tabindex"),
        manualTab: manualButton.getAttribute("tabindex"),
        autoSelected: autoButton.classList.contains("selected"),
        manualSelected: manualButton.classList.contains("selected")
      };
      document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      var ignition = document.getElementById("entrance-drive-ignition");
      var blockedAutoShift = window.__entranceDriveRange("D");
      var blockedAutoPulse = {
        accepted: blockedAutoShift,
        pulsing: ignition.classList.contains("shift-blocked"),
        animation: getComputedStyle(document.getElementById("entrance-drive-key-face")).animationName,
        transmission: copy(drive().transmission)
      };
      window.__entranceDriveTransmissionMode("manual", false);
      var blockedManualShift = window.__entranceDriveShift(1, true);
      report.steps.engineOffShift = {
        auto: blockedAutoPulse,
        manual: {
          accepted: blockedManualShift,
          pulsing: ignition.classList.contains("shift-blocked"),
          gear: drive().gear
        }
      };
      window.__entranceDriveTransmissionMode("auto", false);

      manualButton.focus();
      key("Enter", "Enter", manualButton);
      report.steps.focusedEnter = { engine: state().car.engineOn, mode: drive().transmission.mode };
      autoButton.focus();
      key(" ", "Space", autoButton);
      report.steps.focusedSpace = {
        engine: state().car.engineOn,
        transmission: copy(drive().transmission),
        stored: localStorage.getItem("entranceTransmission:v1"),
        rangeTabs: Array.from(document.querySelectorAll("[data-drive-range]")).map(function (node) {
          return [node.getAttribute("data-drive-range"), node.getAttribute("tabindex"), node.classList.contains("selected")];
        })
      };
      key("m", "KeyM");
      key("a", "KeyA");
      report.steps.shortcuts = copy(drive().transmission);
      var ctrlRight = key("ArrowRight", "ArrowRight", null, { ctrlKey: true });
      var ctrlRightMode = copy(drive().transmission);
      var ctrlLeft = key("ArrowLeft", "ArrowLeft", null, { ctrlKey: true });
      report.steps.ctrlShortcuts = {
        right: ctrlRightMode,
        left: copy(drive().transmission),
        rightPrevented: ctrlRight.defaultPrevented,
        leftPrevented: ctrlLeft.defaultPrevented
      };
      key("ArrowUp", "ArrowUp");
      document.dispatchEvent(new KeyboardEvent("keyup", {
        key: "ArrowUp", code: "ArrowUp", ctrlKey: true, bubbles: true, cancelable: true
      }));
      report.steps.ctrlPedalRelease = copy(drive().holds);
      window.__entranceDriveTransmissionMode("manual", true);
      report.steps.parkToManual = copy(drive());
      window.__entranceDriveTransmissionMode("auto", true);
      window.__toggleEntrancePorscheEngine();
      document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      var rangeSteps = [];
      ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowUp", "ArrowUp", "ArrowUp",
        "ArrowDown", "ArrowDown", "ArrowDown"].forEach(function (arrow) {
        window.__entranceDriveKey(new KeyboardEvent("keydown", {
          key: arrow, code: arrow, shiftKey: true
        }), true);
        rangeSteps.push(copy(drive().transmission));
        window.__entranceDriveKey(new KeyboardEvent("keyup", {
          key: arrow, code: arrow, shiftKey: true
        }), false);
      });
      report.steps.rangeShiftGesture = {
        ranges: rangeSteps.map(function (row) { return row.range; }),
        holds: copy(drive().holds)
      };
      key("d", "KeyD");
      window.__entranceDriveStep(1000);
      report.steps.noCreep = copy(drive());

      window.__entranceDriveSetMotion(9.9, 1);
      var rollingReverseAccepted = window.__entranceDriveRange("R");
      var afterRollingReverse = copy(drive());
      window.__entranceDriveSetMotion(-9.9, -1);
      var rollingDriveAccepted = window.__entranceDriveRange("D");
      var afterRollingDrive = copy(drive());
      window.__entranceDriveSetMotion(10, 1);
      var reverseAtLimitAccepted = window.__entranceDriveRange("R");
      var afterReverseAtLimit = copy(drive());
      var reverseAtLimitCaption = document.getElementById("hunt-caption").textContent;
      setLang("cs");
      window.__entranceDriveSetMotion(-10, -1);
      var driveAtLimitAccepted = window.__entranceDriveRange("D");
      var driveAtLimitCaption = document.getElementById("hunt-caption").textContent;
      setLang("en");
      report.steps.interlocks = {
        rollingReverseAccepted: rollingReverseAccepted,
        afterRollingReverse: afterRollingReverse,
        rollingDriveAccepted: rollingDriveAccepted,
        afterRollingDrive: afterRollingDrive,
        reverseAtLimitAccepted: reverseAtLimitAccepted,
        afterReverseAtLimit: afterReverseAtLimit,
        reverseAtLimitCaption: reverseAtLimitCaption,
        driveAtLimitAccepted: driveAtLimitAccepted,
        afterDriveAtLimit: copy(drive()),
        driveAtLimitCaption: driveAtLimitCaption
      };

      window.__entranceDriveSetMotion(0, 0);
      window.__entranceDriveRange("D");
      window.__entranceDriveControl("throttle", true);
      var elapsed = 0, seen = {};
      while (elapsed < 12000 && Math.abs(drive().speed) < 100) {
        window.__entranceDriveStep(50);
        elapsed += 50;
        seen[drive().gear] = true;
      }
      window.__entranceDriveControl("throttle", false);
      report.steps.zeroToHundred = { elapsed: elapsed, speed: drive().speed, gears: Object.keys(seen), transmission: copy(drive().transmission) };

      window.__entranceDriveSetMotion(80, 5);
      window.__entranceDriveControl("throttle", false);
      window.__entranceDriveStep(20);
      window.__entranceDriveControl("throttle", true);
      window.__entranceDriveStep(500);
      var beforeDwell = copy(drive());
      window.__entranceDriveStep(60);
      var afterKickdown = copy(drive());
      window.__entranceDriveControl("throttle", false);
      report.steps.kickdown = { beforeDwell: beforeDwell, after: afterKickdown };

      window.__entranceDriveSetMotion(116, 2);
      window.__entranceDriveControl("throttle", true);
      window.__entranceDriveStep(560);
      window.__entranceDriveControl("throttle", false);
      report.steps.redlineUpshift = copy(drive());

      window.__entranceDriveSetMotion(90, 3);
      window.__entranceDriveControl("throttle", false);
      window.__entranceDriveStep(1000);
      report.steps.economyUpshift = copy(drive());
      window.__entranceDriveSetMotion(25, 6);
      window.__entranceDriveStep(560);
      report.steps.lowRpmDownshift = copy(drive());

      window.__entranceDriveSetMotion(60, 3);
      window.__entranceDriveTransmissionMode("manual", true);
      var manualMapped = copy(drive());
      window.__entranceDriveControl("clutch", true);
      window.__entranceDriveTransmissionMode("auto", true);
      var clutchMapped = copy(drive());
      window.__entranceDriveControl("clutch", true);
      report.steps.modeMapping = {
        manual: manualMapped,
        clutchToAuto: clutchMapped,
        autoClutchHeld: drive().holds.clutch
      };

      window.__entranceDriveTransmissionMode("manual", true);
      window.__entranceDriveSetMotion(0, 0);
      window.__entranceDriveControl("clutch", true);
      window.__entranceDriveShift(1);
      window.__entranceDriveControl("throttle", true);
      window.__entranceDriveStep(1000);
      window.__entranceDriveControl("clutch", false);
      var launchStart = copy(drive());
      for (var launchStep = 0; launchStep < 6; launchStep++) window.__entranceDriveStep(50);
      var launchMoving = copy(drive());
      window.__entranceDriveControl("throttle", false);
      report.steps.manualLaunch = { start: launchStart, moving: launchMoving };

      window.__entranceDriveSetMotion(5.9, 1);
      window.__entranceDriveControl("clutch", true);
      var lowSpeedManualReverseAccepted = window.__entranceDriveShift(-1);
      var lowSpeedManualReverse = copy(state());
      window.__entranceDriveSetMotion(6.1, 1);
      var unsafeManualReverseAccepted = window.__entranceDriveShift(-1);
      var unsafeManualReverse = copy(state());
      report.steps.manualDirectionSafety = {
        lowSpeedAccepted: lowSpeedManualReverseAccepted,
        lowSpeed: lowSpeedManualReverse,
        unsafeAccepted: unsafeManualReverseAccepted,
        unsafe: unsafeManualReverse
      };
      window.__toggleEntrancePorscheEngine();

      function curveDrift(mode) {
        window.__entranceDriveTransmissionMode(mode, true);
        if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("banff", 0);
        window.__entranceRoadtripSetDistance(158);
        window.__entranceRoadtripSetLane(.5);
        window.__entranceDriveSetMotion(90, 3);
        window.__entranceDriveStep(400);
        var current = copy(drive());
        return {
          mode: current.transmission.mode,
          lane: current.roadtrip.playerLane,
          distance: current.roadtrip.distance,
          driftPerMetre: (.5 - current.roadtrip.playerLane) / (current.roadtrip.distance - 158)
        };
      }
      report.steps.curveAssist = {
        automatic: curveDrift("auto"),
        manual: curveDrift("manual")
      };

      window.__entranceDriveTransmissionMode("auto", true);
      window.__entranceDriveSetMotion(100, 3);
      window.__entranceRoadtripDevStart();
      window.__entranceRoadtripSetRoute("banff", 0);
      window.__entranceRoadtripSetLane(-.5);
      window.__entranceRoadtripSpawn("car", -.5, 10);
      window.__entranceDriveStep(1000);
      report.steps.headOn = copy(state());
      window.__toggleEntrancePorscheEngine();
      report.steps.restart = copy(state());

      window.__entranceDriveRange("D");
      window.__entranceDriveSetMotion(40, 2);
      window.__toggleEntrancePorscheEngine();
      var engineStopped = copy(drive());
      window.__toggleEntrancePorscheEngine();
      var engineRestarted = copy(drive());
      report.steps.engineLifecycle = { stopped: engineStopped, restarted: engineRestarted };
      window.__entranceDriveRange("D");
      window.__entranceDriveSetMotion(40, 2);
      window.__closeEntranceRoom();
      var closed = copy(drive());
      window.__openEntranceRoom();
      await sleep(30);
      var reopened = copy(drive());
      report.steps.roomLifecycle = { closed: closed, reopened: reopened };
      window.__dismissEntrancePorscheDriveHud();
      report.steps.dismissed = copy(drive());
      report.steps.outsideHudShortcut = {
        accepted: window.__entranceDriveKey(new KeyboardEvent("keydown", { key: "m", code: "KeyM" }), true),
        mode: drive().transmission.mode
      };

      window.__openEntrancePorscheDriveHud();
      window.__toggleEntrancePorscheEngine();
      window.__entranceDriveTransmissionMode("auto", true);
      window.__entranceDriveRange("D");
      window.__entranceDriveSetMotion(60, 4);
      var captured = window.__captureCheckpointSystems().entrance;
      report.steps.captured = {
        transmission: captured.drive.transmission,
        pausedTransmission: captured.drive.roadtrip.pausedRun && captured.drive.roadtrip.pausedRun.drive.transmission,
        runtimeKeys: Object.keys(captured.drive.transmission).sort()
      };
      var rollingOpposite = copy(captured);
      rollingOpposite.porsche.engineOn = true;
      rollingOpposite.drive.transmission = { mode: "auto", range: "D" };
      rollingOpposite.drive.gear = 1;
      rollingOpposite.drive.speed = -9.9;
      rollingOpposite.drive.facing = 1;
      delete rollingOpposite.drive.roadtrip.pausedRun;
      window.__restoreCheckpointSystems({ entrance: rollingOpposite }, "afterStage");
      report.steps.rollingOppositeRestore = copy(drive());
      var corrupt = copy(captured);
      corrupt.porsche.engineOn = true;
      corrupt.drive.transmission = { mode: "auto", range: "D" };
      corrupt.drive.gear = -1;
      corrupt.drive.speed = -20;
      corrupt.drive.facing = 1;
      delete corrupt.drive.roadtrip.pausedRun;
      window.__restoreCheckpointSystems({ entrance: corrupt }, "afterStage");
      report.steps.corruptRestore = copy(drive());
      if (captured.drive.roadtrip.pausedRun) {
        var corruptPaused = copy(captured);
        corruptPaused.drive.roadtrip.pausedRun.drive.transmission = { mode: "auto", range: "R" };
        corruptPaused.drive.roadtrip.pausedRun.drive.gear = 4;
        corruptPaused.drive.roadtrip.pausedRun.drive.speed = 60;
        corruptPaused.drive.roadtrip.pausedRun.drive.facing = 1;
        window.__restoreCheckpointSystems({ entrance: corruptPaused }, "afterStage");
        report.steps.corruptPausedRestore = copy(drive());
      }
      window.__restoreCheckpointSystems({ entrance: captured }, "afterStage");
      report.steps.validRestore = copy(drive());

      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceDriveTransmissionMode("auto", true);
      window.__entranceDriveRange("D");
      window.__entranceDriveSetMotion(140, 3);
      window.__entranceRoadtripDevStart();
      window.__entranceRoadtripPolice(150);
      var stationAt = drive().roadtrip.police.stationAt;
      window.__entranceRoadtripSetDistance(stationAt - 6);
      window.__entranceRoadtripPoliceDetect(140);
      window.__entranceRoadtripPoliceStep(0, .1);
      report.steps.policeStop = copy(drive());

      window.__entranceDriveRange("D");
      window.__entranceDriveSetMotion(40, 2);
      window.__entranceRoadtripSetDemerits(15, Date.now() + 90000);
      report.steps.suspensionStop = copy(drive());

      window.__entranceDriveTransmissionMode("manual", true);
      report.steps.beforeReset = { drive: copy(drive()), stored: localStorage.getItem("entranceTransmission:v1") };
      window.__resetCheckpointSystems();
      report.steps.reset = {
        room: copy(state()),
        drive: copy(drive()),
        stored: localStorage.getItem("entranceTransmission:v1")
      };
      window.__entranceDriveTransmissionMode("manual", true);
      report.steps.afterResetModeCaption = window.__captionKey && window.__captionKey();
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () { setTimeout(run, 180); });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

function runDefault(name, opts) {
  var result = lib.runPageSync("rsvp.html", DEFAULT_HARNESS, 3000, opts || {});
  check(result && result.errors.length === 0, name + " default probe has no page errors", result && result.errors);
  return result || {};
}

console.log("rsvp.html automatic transmission:");
var fine = runDefault("fine pointer", {});
var coarse = runDefault("coarse no-hover pointer", { forceCoarsePointer: true });
var hybrid = runDefault("hybrid primary-fine pointer", { forceHybridPointer: true });
var installed = runDefault("standalone fine pointer", { forceStandalone: true });
check(fine.mode === "auto", "a fine primary pointer defaults to AUTO", fine);
check(coarse.mode === "auto" && coarse.primaryCoarse && coarse.noHover,
  "a coarse no-hover primary pointer defaults to AUTO", coarse);
check(hybrid.mode === "auto" && !hybrid.primaryCoarse && hybrid.anyCoarse,
  "a hybrid laptop defaults to AUTO", hybrid);
check(installed.mode === "auto" && installed.standalone,
  "the installed app defaults to AUTO", installed);

var result = lib.runPageSync("rsvp.html", MAIN_HARNESS, 9000, {
  patchRaf: true,
  chromeFlags: "--window-size=390,844 --autoplay-policy=no-user-gesture-required"
});
if (!result) { console.log("  ✗ behavior harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "behavior harness has no uncaught page errors", result.errors);
check(s.controls && s.controls.mode.mode === "auto" && s.controls.hitWidth >= 44 &&
  s.controls.hitHeight >= 44 &&
  s.controls.autoTab === "0" && s.controls.manualTab === "0" &&
  s.controls.autoSelected && !s.controls.manualSelected,
  "mode controls are visibly selected, tabbable and at least 44 CSS px wide on mobile", s.controls);
check(s.engineOffShift && !s.engineOffShift.auto.accepted && s.engineOffShift.auto.pulsing &&
  s.engineOffShift.auto.animation === "entrance-drive-ignition-shift-blocked" &&
  s.engineOffShift.auto.transmission.range === "P" && !s.engineOffShift.manual.accepted &&
  s.engineOffShift.manual.pulsing && s.engineOffShift.manual.gear === 0,
  "AUTO and MANUAL shift attempts with the engine off pulse the ignition key", s.engineOffShift);
check(s.focusedEnter && !s.focusedEnter.engine && s.focusedEnter.mode === "manual" &&
  s.focusedSpace && !s.focusedSpace.engine && s.focusedSpace.transmission.mode === "auto" &&
  s.focusedSpace.stored === "auto" && s.focusedSpace.rangeTabs.every(function (row) {
    return row[1] === "0" && row[2] === (row[0] === "P");
  }), "Enter/Space operate focused transmission controls without falling through to ignition", {
    enter: s.focusedEnter, space: s.focusedSpace
  });
check(s.shortcuts && s.shortcuts.mode === "auto", "A/M mode shortcuts operate while the HUD is open", s.shortcuts);
check(s.ctrlShortcuts && s.ctrlShortcuts.right.mode === "manual" &&
  s.ctrlShortcuts.left.mode === "auto" && s.ctrlShortcuts.rightPrevented &&
  s.ctrlShortcuts.leftPrevented,
  "Ctrl+Right selects MANUAL and Ctrl+Left selects AUTO without steering or browser scroll", s.ctrlShortcuts);
check(s.ctrlPedalRelease && !s.ctrlPedalRelease.throttle,
  "releasing the accelerator while Ctrl is held cannot masquerade as cruise control", s.ctrlPedalRelease);
check(s.parkToManual && s.parkToManual.transmission.mode === "manual" && s.parkToManual.gear === 0,
  "switching from AUTO P enters MANUAL neutral instead of reverse", s.parkToManual);
check(s.rangeShiftGesture && s.rangeShiftGesture.ranges.join("") === "RNDNRPRND" &&
  !s.rangeShiftGesture.holds.throttle && !s.rangeShiftGesture.holds.brake &&
  !s.rangeShiftGesture.holds.clutch,
  "AUTO Shift+Up/Down walks P/R/N/D without leaking pedal or clutch input", s.rangeShiftGesture);
check(s.noCreep && s.noCreep.transmission.range === "D" && s.noCreep.gear === 1 &&
  Math.abs(s.noCreep.speed) < .01, "AUTO D holds D1 at rest without idle creep", s.noCreep);
check(s.interlocks && s.interlocks.rollingReverseAccepted && s.interlocks.rollingDriveAccepted &&
  s.interlocks.afterRollingReverse.transmission.range === "R" &&
  s.interlocks.afterRollingReverse.gear === -1 && s.interlocks.afterRollingReverse.speed === 9.9 &&
  s.interlocks.afterRollingDrive.transmission.range === "D" &&
  s.interlocks.afterRollingDrive.gear === 1 && s.interlocks.afterRollingDrive.speed === -9.9,
  "AUTO accepts R↔D while rolling in the opposite direction below 10 km/h", s.interlocks);
check(s.interlocks && !s.interlocks.reverseAtLimitAccepted && !s.interlocks.driveAtLimitAccepted &&
  s.interlocks.afterReverseAtLimit.transmission.range === "D" &&
  s.interlocks.afterDriveAtLimit.transmission.range === "R" &&
  s.interlocks.reverseAtLimitCaption === "Slow below 10 km/h before selecting reverse." &&
  s.interlocks.driveAtLimitCaption === "Před zařazením D zpomal pod 10 km/h.",
  "AUTO rejects opposite-direction R↔D at the 10 km/h safety boundary", s.interlocks);
check(s.zeroToHundred && s.zeroToHundred.speed >= 100 && s.zeroToHundred.elapsed <= 9000 &&
  s.zeroToHundred.gears.length >= 2,
  "AUTO launches smoothly and reaches 100 km/h through multiple gears", s.zeroToHundred);
check(s.kickdown && s.kickdown.beforeDwell.gear === 5 && s.kickdown.after.gear < 5 &&
  s.kickdown.after.rpm <= 6500,
  "kickdown respects the 550 ms dwell and selects a safe lower gear", s.kickdown);
check(s.redlineUpshift && s.redlineUpshift.gear === 3,
  "full throttle upshifts near redline", s.redlineUpshift);
check(s.economyUpshift && s.economyUpshift.gear > 3,
  "off-throttle economy logic chooses a taller gear", s.economyUpshift);
check(s.lowRpmDownshift && s.lowRpmDownshift.gear < 6 && s.lowRpmDownshift.rpm >= 1300,
  "low-RPM logic downshifts into a usable band", s.lowRpmDownshift);
check(s.modeMapping && s.modeMapping.manual.gear === 3 &&
  s.modeMapping.clutchToAuto.transmission.range === "D" &&
  s.modeMapping.clutchToAuto.gear >= 1 && !s.modeMapping.autoClutchHeld,
  "mid-drive mode changes choose a speed-matched AUTO gear even if the manual clutch was held", s.modeMapping);
check(s.manualLaunch && s.manualLaunch.start.clutchEngagement.remainingMs > 0 &&
  s.manualLaunch.start.rpm >= 2000 && s.manualLaunch.moving.speed > 0,
  "MANUAL retains its bounded high-RPM clutch launch", s.manualLaunch);
check(s.manualDirectionSafety && s.manualDirectionSafety.lowSpeedAccepted &&
  s.manualDirectionSafety.lowSpeed.car.engineOn && !s.manualDirectionSafety.lowSpeed.drive.stalled &&
  s.manualDirectionSafety.lowSpeed.drive.gear === -1 &&
  !s.manualDirectionSafety.unsafeAccepted && !s.manualDirectionSafety.unsafe.car.engineOn &&
  s.manualDirectionSafety.unsafe.drive.stalled && s.manualDirectionSafety.unsafe.drive.gear === 0,
  "MANUAL retains its separate 6 km/h wrong-direction stall boundary", s.manualDirectionSafety);
check(s.curveAssist && s.curveAssist.automatic.mode === "auto" &&
  s.curveAssist.manual.mode === "manual" &&
  s.curveAssist.automatic.driftPerMetre > 0 &&
  s.curveAssist.manual.driftPerMetre > s.curveAssist.automatic.driftPerMetre * 2.2,
  "AUTO keeps gentle curve lane assist while MANUAL receives full unassisted curve drift",
  s.curveAssist);
check(s.headOn && !s.headOn.car.engineOn && s.headOn.drive.stalled &&
  s.headOn.drive.transmission.range === "P" && s.headOn.drive.gear === 0 &&
  s.restart && s.restart.car.engineOn && s.restart.drive.transmission.range === "P",
  "a glass-shattering head-on hit stalls AUTO in P and restarts there", {
    headOn: s.headOn && { car: s.headOn.car, drive: s.headOn.drive }, restart: s.restart
  });
check(s.engineLifecycle && s.engineLifecycle.stopped.transmission.range === "P" &&
  s.engineLifecycle.stopped.gear === 0 && s.engineLifecycle.restarted.transmission.range === "P" &&
  s.engineLifecycle.restarted.gear === 0,
  "engine stop and restart park AUTO in P", s.engineLifecycle);
check(s.roomLifecycle && s.roomLifecycle.closed.transmission.range === "D" &&
  s.roomLifecycle.closed.gear === 2 && s.roomLifecycle.reopened.transmission.range === "D" &&
  s.roomLifecycle.reopened.gear === 2,
  "room navigation clears momentary input without changing AUTO range or gear", s.roomLifecycle);
check(s.dismissed && s.dismissed.transmission.range === "P" && s.dismissed.gear === 0,
  "dashboard dismissal parks AUTO in P", s.dismissed);
check(s.outsideHudShortcut && !s.outsideHudShortcut.accepted && s.outsideHudShortcut.mode === "auto",
  "transmission shortcuts are inactive while the drive HUD is closed", s.outsideHudShortcut);
check(s.captured && s.captured.transmission.mode === "auto" && s.captured.transmission.range === "D" &&
  s.captured.pausedTransmission && s.captured.pausedTransmission.mode === "auto" &&
  s.captured.pausedTransmission.range === "D" &&
  s.captured.runtimeKeys.join(",") === "mode,range",
  "checkpoints persist only AUTO mode/range, never controller cooldowns", s.captured);
check(s.rollingOppositeRestore && s.rollingOppositeRestore.transmission.mode === "auto" &&
  s.rollingOppositeRestore.transmission.range === "D" && s.rollingOppositeRestore.gear === 1 &&
  s.rollingOppositeRestore.speed === -9.9,
  "a valid below-limit opposite roll survives AUTO checkpoint validation", s.rollingOppositeRestore);
check(s.corruptRestore && s.corruptRestore.transmission.mode === "auto" &&
  s.corruptRestore.transmission.range === "N" && s.corruptRestore.gear === 0,
  "corrupt opposite-direction AUTO checkpoints recover atomically to N", s.corruptRestore);
check(s.corruptPausedRestore && s.corruptPausedRestore.transmission.mode === "auto" &&
  s.corruptPausedRestore.transmission.range === "N" && s.corruptPausedRestore.gear === 0,
  "paused Road Trip snapshots use the same atomic AUTO validation", s.corruptPausedRestore);
check(s.validRestore && s.validRestore.transmission.mode === "auto" &&
  ["D", "N"].indexOf(s.validRestore.transmission.range) >= 0 &&
  (s.validRestore.transmission.range === "D" ? s.validRestore.gear >= 1 : s.validRestore.gear === 0),
  "valid checkpoint mode/range/gear restore as one coherent state", s.validRestore);
check(s.policeStop && s.policeStop.roadtrip.police.phase === "stopped" &&
  s.policeStop.transmission.range === "P" && s.policeStop.gear === 0,
  "a police stop forces AUTO to P", s.policeStop);
check(s.suspensionStop && !s.suspensionStop.roadtrip.active &&
  s.suspensionStop.roadtrip.suspended && s.suspensionStop.speed === 0 &&
  s.suspensionStop.gear === 0 && s.suspensionStop.transmission.mode === "auto" &&
  s.suspensionStop.transmission.range === "P",
  "licence suspension stops the car and forces AUTO to P", s.suspensionStop);
check(s.beforeReset && s.beforeReset.drive.transmission.mode === "manual" &&
  s.beforeReset.drive.transmission.explicit && s.beforeReset.stored === "manual" &&
  s.reset && s.reset.drive.transmission.mode === "auto" &&
  s.reset.drive.transmission.range === "P" && s.reset.drive.gear === 0 &&
  !s.reset.drive.transmission.explicit && s.reset.drive.transmission.preference === null &&
  s.reset.drive.transmission.shiftDwellMs === 0 && s.reset.drive.transmission.offThrottleMs === 0 &&
  s.reset.drive.transmission.kickdownArmed && s.reset.drive.transmission.launchEngagement === 0 &&
  s.reset.stored === null,
  "Fresh Game clears the explicit preference and returns the parked controller to AUTO defaults",
  { before: s.beforeReset, after: s.reset });
check(s.reset && s.reset.room && s.reset.room.car.indicatorFlashes === 0 &&
  s.reset.room.car.indicatorSounds === 0 && !Object.keys(s.reset.room.car.activations).length &&
  s.reset.room.intercomResponses === 0 && s.reset.drive.brakeScreeches === 0,
  "Fresh Game clears the car's transient interaction counters", s.reset);
check(s.afterResetModeCaption === "entrance_drive_mode_manual",
  "Fresh Game re-arms the one-shot transmission-mode caption", s.afterResetModeCaption);

console.log("");
if (failures) {
  console.log(failures + " automatic-transmission assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Automatic-transmission assertions passed.");
