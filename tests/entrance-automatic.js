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
  function key(key, code, target) {
    (target || document).dispatchEvent(new KeyboardEvent("keydown", {
      key: key, code: code || key, bubbles: true, cancelable: true
    }));
  }
  async function run() {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
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
        autoLabel: autoButton.getAttribute("aria-label"),
        manualLabel: manualButton.getAttribute("aria-label")
      };

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
          return [node.getAttribute("data-drive-range"), node.getAttribute("tabindex"), node.getAttribute("aria-hidden")];
        })
      };
      report.steps.autoCopyEn = {
        title: document.getElementById("entrance-drive-coach-gear-title").textContent,
        gear: document.getElementById("entrance-drive-coach-gear-desktop").textContent,
        pedals: document.getElementById("entrance-drive-coach-pedals-desktop").textContent
      };
      setLang("cs");
      report.steps.autoCopyCs = {
        autoLabel: autoButton.getAttribute("aria-label"),
        manualLabel: manualButton.getAttribute("aria-label"),
        title: document.getElementById("entrance-drive-coach-gear-title").textContent,
        gear: document.getElementById("entrance-drive-coach-gear-desktop").textContent,
        pedals: document.getElementById("entrance-drive-coach-pedals-desktop").textContent
      };
      setLang("en");

      key("m", "KeyM");
      key("a", "KeyA");
      report.steps.shortcuts = copy(drive().transmission);
      window.__toggleEntrancePorscheEngine();
      key("d", "KeyD");
      window.__entranceDriveStep(1000);
      report.steps.noCreep = copy(drive());

      window.__entranceDriveSetMotion(20, 1);
      var reverseAccepted = window.__entranceDriveRange("R");
      var afterReverseRefusal = copy(drive());
      window.__entranceDriveSetMotion(-10, -1);
      var driveAccepted = window.__entranceDriveRange("D");
      report.steps.interlocks = {
        reverseAccepted: reverseAccepted,
        afterReverseRefusal: afterReverseRefusal,
        driveAccepted: driveAccepted,
        afterDriveRefusal: copy(drive())
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
      window.__entranceDriveStep(560);
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

      window.__entranceDriveTransmissionMode("auto", true);
      window.__entranceDriveSetMotion(100, 3);
      window.__entranceRoadtripStart();
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
      window.__entranceRoadtripStart();
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

      window.__entranceDriveTransmissionMode("auto", true);
      window.__resetCheckpointSystems();
      report.steps.reset = { drive: copy(drive()), stored: localStorage.getItem("entranceTransmission:v1") };
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
check(fine.mode === "manual", "a fine primary pointer defaults to MANUAL", fine);
check(coarse.mode === "auto" && coarse.primaryCoarse && coarse.noHover,
  "only a coarse no-hover primary pointer defaults to AUTO", coarse);
check(hybrid.mode === "manual" && !hybrid.primaryCoarse && hybrid.anyCoarse,
  "a hybrid laptop remains MANUAL", hybrid);
check(installed.mode === "manual" && installed.standalone,
  "installed-app display mode does not alter the pointer default", installed);

var result = lib.runPageSync("rsvp.html", MAIN_HARNESS, 9000, {
  patchRaf: true,
  chromeFlags: "--window-size=390,844 --autoplay-policy=no-user-gesture-required"
});
if (!result) { console.log("  ✗ behavior harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "behavior harness has no uncaught page errors", result.errors);
check(s.controls && s.controls.mode.mode === "manual" && s.controls.hitWidth >= 44 &&
  s.controls.hitHeight >= 44 &&
  s.controls.autoTab === "0" && s.controls.manualTab === "0" &&
  /automatic/i.test(s.controls.autoLabel) && /manual/i.test(s.controls.manualLabel),
  "mode buttons are labelled, tabbable and at least 44 CSS px wide on mobile", s.controls);
check(s.focusedEnter && !s.focusedEnter.engine && s.focusedEnter.mode === "manual" &&
  s.focusedSpace && !s.focusedSpace.engine && s.focusedSpace.transmission.mode === "auto" &&
  s.focusedSpace.stored === "auto" && s.focusedSpace.rangeTabs.every(function (row) {
    return row[1] === "0" && row[2] === "false";
  }), "Enter/Space operate focused transmission controls without falling through to ignition", {
    enter: s.focusedEnter, space: s.focusedSpace
  });
check(s.autoCopyEn && s.autoCopyEn.title === "Select Drive" &&
  s.autoCopyEn.gear === "Press D, or select D on the shifter" &&
  /gears shift automatically/.test(s.autoCopyEn.pedals) &&
  s.autoCopyCs && s.autoCopyCs.title === "Zařaď D" &&
  s.autoCopyCs.gear === "Stiskni D nebo zvol D na řadicí páce" &&
  /rychlosti se řadí automaticky/.test(s.autoCopyCs.pedals) &&
  /automatickou/.test(s.autoCopyCs.autoLabel) && /manuální/.test(s.autoCopyCs.manualLabel),
  "AUTO coaching and ARIA swap cleanly between English and Czech", {
    en: s.autoCopyEn, cs: s.autoCopyCs
  });
check(s.shortcuts && s.shortcuts.mode === "auto", "A/M mode shortcuts operate while the HUD is open", s.shortcuts);
check(s.noCreep && s.noCreep.transmission.range === "D" && s.noCreep.gear === 1 &&
  Math.abs(s.noCreep.speed) < .01, "AUTO D holds D1 at rest without idle creep", s.noCreep);
check(s.interlocks && !s.interlocks.reverseAccepted && !s.interlocks.driveAccepted &&
  s.interlocks.afterReverseRefusal.transmission.range === "D" &&
  s.interlocks.afterDriveRefusal.transmission.range === "R",
  "D↔R interlocks require a stop", s.interlocks);
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
  s.modeMapping.clutchToAuto.transmission.range === "N" &&
  s.modeMapping.clutchToAuto.gear === 0 && !s.modeMapping.autoClutchHeld,
  "mode changes preserve a physical gear except that a held manual clutch maps to AUTO N", s.modeMapping);
check(s.manualLaunch && s.manualLaunch.start.clutchEngagement.remainingMs > 0 &&
  s.manualLaunch.start.rpm >= 2000 && s.manualLaunch.moving.speed > 0,
  "MANUAL retains its bounded high-RPM clutch launch", s.manualLaunch);
check(s.headOn && !s.headOn.car.engineOn && s.headOn.drive.stalled &&
  s.headOn.drive.transmission.range === "N" && s.headOn.drive.gear === 0 &&
  s.restart && s.restart.car.engineOn && s.restart.drive.transmission.range === "N",
  "a glass-shattering head-on hit stalls and restarts AUTO in N", {
    headOn: s.headOn && { car: s.headOn.car, drive: s.headOn.drive }, restart: s.restart
  });
check(s.engineLifecycle && s.engineLifecycle.stopped.transmission.range === "N" &&
  s.engineLifecycle.stopped.gear === 0 && s.engineLifecycle.restarted.transmission.range === "N" &&
  s.engineLifecycle.restarted.gear === 0,
  "engine stop and restart park AUTO in N", s.engineLifecycle);
check(s.roomLifecycle && s.roomLifecycle.closed.transmission.range === "D" &&
  s.roomLifecycle.closed.gear === 2 && s.roomLifecycle.reopened.transmission.range === "D" &&
  s.roomLifecycle.reopened.gear === 2,
  "room navigation clears momentary input without changing AUTO range or gear", s.roomLifecycle);
check(s.dismissed && s.dismissed.transmission.range === "N" && s.dismissed.gear === 0,
  "dashboard dismissal parks AUTO in N", s.dismissed);
check(s.outsideHudShortcut && !s.outsideHudShortcut.accepted && s.outsideHudShortcut.mode === "auto",
  "transmission shortcuts are inactive while the drive HUD is closed", s.outsideHudShortcut);
check(s.captured && s.captured.transmission.mode === "auto" && s.captured.transmission.range === "D" &&
  s.captured.pausedTransmission && s.captured.pausedTransmission.mode === "auto" &&
  s.captured.pausedTransmission.range === "D" &&
  s.captured.runtimeKeys.join(",") === "mode,range",
  "checkpoints persist only AUTO mode/range, never controller cooldowns", s.captured);
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
check(s.policeStop && s.policeStop.roadtrip.police.phase === "arrest" &&
  s.policeStop.transmission.range === "N" && s.policeStop.gear === 0,
  "a police stop forces AUTO to N", s.policeStop);
check(s.suspensionStop && !s.suspensionStop.roadtrip.active &&
  s.suspensionStop.roadtrip.suspended && s.suspensionStop.speed === 0 &&
  s.suspensionStop.gear === 0 && s.suspensionStop.transmission.mode === "auto" &&
  s.suspensionStop.transmission.range === "N",
  "licence suspension stops the car and forces AUTO to N", s.suspensionStop);
check(s.reset && s.reset.drive.transmission.mode === "auto" &&
  s.reset.drive.transmission.range === "N" && s.reset.drive.gear === 0 && s.reset.stored === "auto",
  "full reset clears AUTO runtime state but retains the explicit preference", s.reset);

console.log("");
if (failures) {
  console.log(failures + " automatic-transmission assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Automatic-transmission assertions passed.");
