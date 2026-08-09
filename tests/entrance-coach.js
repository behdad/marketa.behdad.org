#!/usr/bin/env node
// The dashboard teaches a fresh driver in order; ? parks the car and starts over.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () { setTimeout(function () {
  var report = { errors: window.__errs || [] };
  function coach() {
    var root = document.getElementById("entrance-drive-coach");
    var active = root && root.querySelector("[data-coach-step].active");
    return {
      show: !!(root && root.classList.contains("show")),
      step: active && Number(active.dataset.coachStep),
      help: getComputedStyle(document.getElementById("entrance-drive-help")).display
    };
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function key(type, key, code, options, target) {
    var event = new KeyboardEvent(type, Object.assign({
      key: key, code: code, bubbles: true, cancelable: true
    }, options || {}));
    (target || document).dispatchEvent(event);
    return event;
  }
  try {
    Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
    window.__unlockAllRooms();
    window.goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    report.fresh = coach();
    var freshEntrance = window.__captureCheckpointSystems().entrance;
    report.savedFreshCoach = freshEntrance.drive.coach;
    delete freshEntrance.drive.coach;
    window.__restoreCheckpointSystems({ entrance: freshEntrance }, "afterStage");
    report.missingCoachRestore = coach();
    var coachClick = new MouseEvent("click", { bubbles: true, cancelable: true });
    document.getElementById("entrance-drive-coach").dispatchEvent(coachClick);
    report.clickedCoach = { coach: coach(), prevented: coachClick.defaultPrevented };
    document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    window.__toggleEntrancePorscheEngine();
    report.dismissedStable = { coach: coach(), state: copy(window.__entranceRoomState()) };
    document.getElementById("entrance-drive-help").dispatchEvent(new MouseEvent("click", {
      bubbles: true, cancelable: true
    }));

    var step1Range = window.__entranceDriveRange("D");
    var step1Motion = window.__entranceDriveSetMotion(70, 3);
    var step1Pedal = window.__entranceDriveControl("throttle", true);
    key("keydown", "ArrowLeft", "ArrowLeft");
    key("keyup", "ArrowLeft", "ArrowLeft");
    report.step1Ownership = {
      accepted: { range: step1Range, motion: step1Motion, pedal: step1Pedal },
      coach: coach(), state: copy(window.__entranceRoomState())
    };

    window.__toggleEntrancePorscheEngine();
    report.started = coach();
    var steerArrowBox = document.querySelector(
      '[data-coach-step="2"] .entrance-drive-coach-arrow').getBBox();
    report.started.steerArrow = {
      width: steerArrowBox.width,
      height: steerArrowBox.height,
      y: steerArrowBox.y,
      pieces: document.querySelectorAll('[data-coach-step="2"] .entrance-drive-coach-arrow').length,
      animation: getComputedStyle(document.querySelector(
        '[data-coach-step="2"] .entrance-drive-coach-arrow')).animationName,
      targetAnimation: getComputedStyle(document.querySelector(
        '[data-coach-step="5"] .entrance-drive-coach-arrow')).animationName
    };
    var step2Range = window.__entranceDriveRange("D");
    var step2Pedal = window.__entranceDriveControl("throttle", true);
    var step2Motion = window.__entranceDriveSetMotion(70, 3);
    var step2Engine = window.__toggleEntrancePorscheEngine();
    document.querySelector('[data-drive-range="D"]').dispatchEvent(new MouseEvent("click", {
      bubbles: true, cancelable: true
    }));
    window.__entranceDriveStep(1000);
    report.step2Ownership = {
      accepted: { range: step2Range, pedal: step2Pedal, motion: step2Motion, engine: step2Engine },
      coach: coach(), state: copy(window.__entranceRoomState())
    };
    key("keydown", "ArrowLeft", "ArrowLeft");
    key("keyup", "ArrowLeft", "ArrowLeft");
    report.steered = coach();
    var steeredEntrance = window.__captureCheckpointSystems().entrance;
    document.getElementById("entrance-drive-help").dispatchEvent(new MouseEvent("click", {
      bubbles: true, cancelable: true
    }));
    window.__restoreCheckpointSystems({ entrance: steeredEntrance }, "afterStage");
    report.exactCoachRestore = coach();
    var strandedEntrance = copy(steeredEntrance);
    strandedEntrance.drive.coach.step = 4;
    strandedEntrance.drive.transmission.range = "R";
    strandedEntrance.drive.gear = -1;
    strandedEntrance.drive.speed = -40;
    strandedEntrance.drive.cruise = { active: true, target: 40 };
    window.__restoreCheckpointSystems({ entrance: strandedEntrance }, "afterStage");
    report.cruiseRestore = { coach: coach(), state: copy(window.__entranceRoomState()) };
    window.__restoreCheckpointSystems({ entrance: steeredEntrance }, "afterStage");
    var step3Pedal = window.__entranceDriveControl("throttle", true);
    var step3Reverse = window.__entranceDriveRange("R");
    var step3Neutral = window.__entranceDriveRange("N");
    var rangeD = document.querySelector('[data-drive-range="D"]');
    rangeD.focus();
    var rangeDEnter = key("keydown", "Enter", "Enter", {}, rangeD);
    report.shifted = coach();
    report.shifted.ownership = {
      pedal: step3Pedal, reverse: step3Reverse, neutral: step3Neutral,
      enterPrevented: rangeDEnter.defaultPrevented,
      state: copy(window.__entranceRoomState())
    };
    var step4Range = window.__entranceDriveRange("N");
    var step4Pedal = window.__entranceDriveControl("throttle", true);
    var step4Motion = window.__entranceDriveSetMotion(90, 4);
    key("keydown", "ArrowLeft", "ArrowLeft");
    key("keyup", "ArrowLeft", "ArrowLeft");
    window.__entranceDriveStep(1000);
    report.step4Ownership = {
      accepted: { range: step4Range, pedal: step4Pedal, motion: step4Motion },
      coach: coach(), state: copy(window.__entranceRoomState())
    };
    key("keydown", " ", "Space");
    report.cruisePressed = coach();
    report.cruisePressed.arrowTips = Array.prototype.map.call(
      document.querySelectorAll('[data-coach-step="5"] .entrance-drive-coach-arrow'),
      function (arrow) { var box = arrow.getBBox(); return box.y + box.height; });
    key("keyup", " ", "Space");
    report.tooSlowForCruise = coach();
    var step5Range = window.__entranceDriveRange("N");
    var step5Steer = window.__entranceDriveControl("steerLeft", true);
    var throttleControl = document.getElementById("entrance-drive-throttle");
    throttleControl.dispatchEvent(new PointerEvent("pointerdown", {
      pointerId: 71, pointerType: "mouse", button: 0, isPrimary: true,
      bubbles: true, cancelable: true
    }));
    report.driven = Object.assign(coach(), {
      range: step5Range, steer: step5Steer,
      state: copy(window.__entranceRoomState())
    });
    throttleControl.dispatchEvent(new PointerEvent("pointerup", {
      pointerId: 71, pointerType: "mouse", button: 0, isPrimary: true,
      bubbles: true, cancelable: true
    }));
    window.__entranceDriveRange("N");
    report.freeDriving = copy(window.__entranceRoomState());
    document.getElementById("entrance-drive-help").dispatchEvent(new MouseEvent("click", {
      bubbles: true, cancelable: true
    }));
    var help = document.getElementById("entrance-drive-help");
    report.reset = {
      coach: coach(),
      state: window.__entranceRoomState(),
      caption: document.getElementById("hunt-caption").textContent,
      helpFocusable: help.hasAttribute("tabindex") || help.hasAttribute("focusable") || help.hasAttribute("role")
    };
    key("keydown", "Enter", "Enter");
    key("keyup", "Enter", "Enter");
    report.restarted = { coach: coach(), state: window.__entranceRoomState() };
    report.copy = {
      en: T.en.hunt.entrance_drive_coach_cruise_text,
      cs: T.cs.hunt.entrance_drive_coach_cruise_text,
      gearEn: T.en.hunt.entrance_drive_coach_auto_gear_desktop,
      gearCs: T.cs.hunt.entrance_drive_coach_auto_gear_desktop,
      pedalEn: T.en.hunt.entrance_drive_coach_auto_pedals_desktop,
      pedalCs: T.cs.hunt.entrance_drive_coach_auto_pedals_desktop
    };
    var reentry = document.getElementById("entrance-roadtrip-reenter");
    reentry.classList.add("show");
    var reentryBox = reentry.getBoundingClientRect();
    var helpBox = help.getBoundingClientRect();
    report.reentryGap = helpBox.left - reentryBox.right;
    report.reentryHelpDisplay = getComputedStyle(help).display;
    report.coachAboveReentry = !!(reentry.compareDocumentPosition(
      document.getElementById("entrance-drive-coach")) & Node.DOCUMENT_POSITION_FOLLOWING);
    reentry.classList.remove("show");
    window.__entranceDriveTransmissionMode("manual", true);
    window.__entranceDriveShift(1, true);
    window.__entranceDriveControl("throttle", true);
    window.__entranceDriveStep(1000);
    window.__entranceDriveControl("throttle", false);
    report.manualUnchanged = { coach: coach(), state: copy(window.__entranceRoomState()) };
    help.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    key("keydown", "Enter", "Enter"); key("keyup", "Enter", "Enter");
    key("keydown", "ArrowLeft", "ArrowLeft");
    key("keyup", "ArrowLeft", "ArrowLeft");
    window.__entranceDriveShift(1, true);
    report.manualCruiseBefore = { coach: coach(), state: copy(window.__entranceRoomState()) };
    key("keydown", " ", "Space"); key("keyup", " ", "Space");
    report.manualCruiseAfter = { coach: coach(), state: copy(window.__entranceRoomState()) };
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 180); });
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 2400, { patchRaf: true });
var RECOVERY_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var marker = "entrance-coach-recovery-v1";
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      if (!sessionStorage.getItem(marker)) {
        if (window.__endAttract) window.__endAttract();
        window.__finishSolveAdvance("kitchen", "garden");
        window.__saveLoftCheckpoint();
        sessionStorage.setItem(marker, "1");
        location.reload();
        return;
      }
      var saved = JSON.parse(localStorage.getItem("loftCheckpoint:v1"));
      var gate = document.getElementById("loft-recovery-gate");
      gate.querySelector(".loft-recovery-btn.primary").click();
      window.__unlockAllRooms(); window.goToStage("balcony"); window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      var root = document.getElementById("entrance-drive-coach");
      var active = root.querySelector("[data-coach-step].active");
      document.getElementById("__report").textContent = JSON.stringify({
        errors: window.__errs || [], gate: !!gate, savedRoom: saved.progress.room,
        savedCoach: saved.systems.entrance.drive.coach,
        coach: { show: root.classList.contains("show"), step: active && Number(active.dataset.coachStep) }
      });
    } catch (error) {
      document.getElementById("__report").textContent = JSON.stringify({ errors: [String(error && error.stack || error)] });
    }
  }, 180); });
})();
</script>`;
var recovery = lib.runPageSync("loft-day.html", RECOVERY_HARNESS, 2200,
  { patchRaf: true, urlSuffix: "?coach-recovery=1" });
var MOBILE_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () { setTimeout(function () {
  var report = { errors: window.__errs || [] };
  function coach() {
    var root = document.getElementById("entrance-drive-coach");
    var active = root && root.querySelector("[data-coach-step].active");
    return { show: !!(root && root.classList.contains("show")), step: active && Number(active.dataset.coachStep) };
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function key(type, key, code) {
    document.dispatchEvent(new KeyboardEvent(type, { key: key, code: code, bubbles: true, cancelable: true }));
  }
  function touch(target, type, pointerId, x, y) {
    target.dispatchEvent(new PointerEvent(type, {
      pointerId: pointerId, pointerType: "touch", button: 0, isPrimary: true,
      clientX: x, clientY: y, bubbles: true, cancelable: true
    }));
  }
  try {
    Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
    window.__unlockAllRooms(); window.goToStage("balcony"); window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud(); report.fresh = coach();
    var touchPedals = document.getElementById("entrance-drive-touch-pedals");
    var pedalBox = touchPedals.getBoundingClientRect();
    touch(touchPedals, "pointerdown", 81, pedalBox.left + pedalBox.width / 2, pedalBox.top + 2);
    report.freshBlocked = { coach: coach(), state: copy(window.__entranceRoomState()) };
    window.__toggleEntrancePorscheEngine(); report.started = coach();
    touch(touchPedals, "pointerdown", 82, pedalBox.left + pedalBox.width / 2, pedalBox.top + 2);
    report.gearStepBlocked = { coach: coach(), state: copy(window.__entranceRoomState()) };
    window.__entranceDriveRange("D");
    report.shifted = coach();
    report.shifted.targets = {
      blue: document.getElementById("entrance-drive-touch-steer").classList.contains("coach-target"),
      pink: document.getElementById("entrance-drive-touch-pedals").classList.contains("coach-target"),
      arrows: Array.prototype.map.call(document.querySelectorAll(
        ".entrance-drive-touch-coach-arrow"), function (arrow) {
          return {
            display: getComputedStyle(arrow).display,
            paths: arrow.querySelectorAll("path").length,
            animation: getComputedStyle(arrow).animationName
          };
        })
    };
    report.copy = {
      en: T.en.hunt.entrance_drive_coach_auto_pedals_touch,
      cs: T.cs.hunt.entrance_drive_coach_auto_pedals_touch,
      liveWidth: document.getElementById("entrance-drive-coach-pedals-touch").getComputedTextLength()
    };
    window.setLang("cs");
    report.copy.csLiveWidth = document.getElementById(
      "entrance-drive-coach-pedals-touch").getComputedTextLength();
    window.setLang("en");
    var reentry = document.getElementById("entrance-roadtrip-reenter");
    reentry.classList.add("show");
    var reentryBox = reentry.getBoundingClientRect();
    var helpBox = document.getElementById("entrance-drive-help").getBoundingClientRect();
    report.reentryGap = helpBox.left - reentryBox.right;
    report.reentryHelpDisplay = getComputedStyle(document.getElementById("entrance-drive-help")).display;
    reentry.classList.remove("show");
    var blockedRange = window.__entranceDriveRange("N");
    var touchSteer = document.getElementById("entrance-drive-touch-steer");
    var steerBox = touchSteer.getBoundingClientRect();
    touch(touchSteer, "pointerdown", 83, steerBox.left + 2, steerBox.top + steerBox.height / 2);
    touch(touchSteer, "pointerup", 83, steerBox.left + 2, steerBox.top + steerBox.height / 2);
    report.usedControl = coach();
    report.usedControl.range = blockedRange;
    report.usedControl.state = copy(window.__entranceRoomState());
  } catch (error) { report.errors.push(String(error && error.stack || error)); }
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 180); });
</script>`;
var mobile = lib.runPageSync("loft-day.html", MOBILE_HARNESS, 2400,
  { patchRaf: true, forceCoarsePointer: true, chromeFlags: "--window-size=844,390" });
var failed = false;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || !detail ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}

console.log("loft-day.html driving coach:");
check(result && result.errors.length === 0, "coach harness has no uncaught errors", result && result.errors);
check(result && result.fresh.show && result.fresh.step === 1,
  "a fresh dashboard starts with ignition", result && result.fresh);
check(result && result.fresh.help === "none" && result.driven.help !== "none",
  "the help button stays hidden while the coach is already visible",
  { fresh: result && result.fresh, driven: result && result.driven });
check(result && result.savedFreshCoach && result.savedFreshCoach.step === 1 &&
  !result.savedFreshCoach.complete && !result.savedFreshCoach.dismissed &&
  result.missingCoachRestore && result.missingCoachRestore.show && result.missingCoachRestore.step === 1,
  "Continue treats a checkpoint without explicit coach state as fresh onboarding",
  result && { saved: result.savedFreshCoach, restored: result.missingCoachRestore });
check(recovery && recovery.errors.length === 0 && recovery.gate && recovery.savedRoom === "garden" &&
  recovery.savedCoach && recovery.savedCoach.step === 1 && !recovery.savedCoach.complete &&
  recovery.coach && recovery.coach.show && recovery.coach.step === 1,
  "fresh Kitchen→Garden progress survives reload/Continue and still teaches the HUD",
  recovery);
check(result && result.clickedCoach && result.clickedCoach.prevented &&
  result.clickedCoach.coach.show && result.clickedCoach.coach.step === 1,
  "clicking the coach itself neither dismisses nor advances it", result && result.clickedCoach);
check(result && result.dismissedStable && !result.dismissedStable.coach.show &&
  result.dismissedStable.state.car.engineOn,
  "the explicit dismiss remains dismissed when later driving actions arrive",
  result && result.dismissedStable);
check(result && result.step1Ownership && !result.step1Ownership.accepted.range &&
  !result.step1Ownership.accepted.motion && !result.step1Ownership.accepted.pedal &&
  result.step1Ownership.coach.step === 1 && !result.step1Ownership.state.car.engineOn &&
  result.step1Ownership.state.drive.transmission.range === "P" &&
  result.step1Ownership.state.drive.speed === 0 &&
  !Object.keys(result.step1Ownership.state.drive.holds).some(function (key) {
    return result.step1Ownership.state.drive.holds[key];
  }), "ignition step blocks ranges, direct motion, pedals, and steering", result && result.step1Ownership);
check(result && result.started.show && result.started.step === 2,
  "starting advances to steering", result && result.started);
check(result && result.started.steerArrow &&
  result.started.steerArrow.width > 100 && result.started.steerArrow.height > 20 &&
  result.started.steerArrow.y <= 41 && result.started.steerArrow.pieces === 1,
  "steering uses one outlined double-headed path over the wheel", result && result.started.steerArrow);
check(result && result.started.steerArrow &&
  result.started.steerArrow.animation === "entrance-drive-coach-arrow-steer" &&
  result.started.steerArrow.targetAnimation === "entrance-drive-coach-arrow-down",
  "coach arrows animate along their target directions", result && result.started.steerArrow);
check(result && result.step2Ownership && !result.step2Ownership.accepted.range &&
  !result.step2Ownership.accepted.pedal && !result.step2Ownership.accepted.motion &&
  !result.step2Ownership.accepted.engine && result.step2Ownership.coach.step === 2 &&
  result.step2Ownership.state.car.engineOn &&
  result.step2Ownership.state.drive.transmission.range === "P" &&
  result.step2Ownership.state.drive.speed === 0,
  "steering step rejects keyboard/API and direct-SVG mutations from other controls",
  result && result.step2Ownership);
check(result && result.steered.show && result.steered.step === 3,
  "steering advances to Drive", result && result.steered);
check(result && result.exactCoachRestore && result.exactCoachRestore.show && result.exactCoachRestore.step === 3,
  "Continue restores an explicitly saved coach step exactly", result && result.exactCoachRestore);
check(result && result.cruiseRestore && result.cruiseRestore.coach.show &&
  result.cruiseRestore.coach.step === 4 && result.cruiseRestore.state.car.engineOn &&
  result.cruiseRestore.state.drive.transmission.range === "D" &&
  result.cruiseRestore.state.drive.gear === 1 && result.cruiseRestore.state.drive.speed === 0 &&
  !result.cruiseRestore.state.drive.cruise.active,
  "Continue repairs an old moving/wrong-range cruise-step snapshot to stopped Drive",
  result && result.cruiseRestore);
check(result && result.shifted.show && result.shifted.step === 4,
  "selecting D advances to the dedicated cruise lesson", result && result.shifted);
check(result && result.shifted.ownership && !result.shifted.ownership.pedal &&
  result.shifted.ownership.reverse && result.shifted.ownership.neutral &&
  result.shifted.ownership.enterPrevented &&
  result.shifted.ownership.state.drive.transmission.range === "D" &&
  result.shifted.ownership.state.drive.speed === 0,
  "range step permits selector travel and keyboard activation of visible D, but no pedal",
  result && result.shifted.ownership);
check(result && result.step4Ownership && !result.step4Ownership.accepted.range &&
  !result.step4Ownership.accepted.pedal && !result.step4Ownership.accepted.motion &&
  result.step4Ownership.coach.step === 4 &&
  result.step4Ownership.state.drive.transmission.range === "D" &&
  result.step4Ownership.state.drive.speed === 0 &&
  !Object.keys(result.step4Ownership.state.drive.holds).some(function (key) {
    return result.step4Ownership.state.drive.holds[key];
  }), "cruise step keeps the stopped car in D until its semantic action arrives",
  result && result.step4Ownership);
check(result && result.cruisePressed.show && result.cruisePressed.step === 5 &&
  result.tooSlowForCruise.show && result.tooSlowForCruise.step === 5,
  "pressing Space advances to pedals even below cruise speed",
  result && { pressed: result.cruisePressed, released: result.tooSlowForCruise });
check(result && result.cruisePressed.arrowTips.length === 2 &&
  result.cruisePressed.arrowTips.every(function (tip) { return tip >= 159; }),
  "the final arrows reach the pedal faces", result && result.cruisePressed.arrowTips);
check(result && !result.driven.show && !result.driven.range && !result.driven.steer &&
  result.driven.state.drive.transmission.range === "D" && result.driven.state.drive.holds.throttle,
  "the pedal step blocks selector/desktop steering and accepts the direct SVG pedal",
  result && result.driven);
check(result && result.freeDriving && result.freeDriving.drive.transmission.range === "N",
  "the same selector is free immediately after coach completion", result && result.freeDriving);
check(result && result.reset.coach.show && result.reset.coach.step === 1 &&
  !result.reset.state.car.engineOn && result.reset.state.drive.transmission.range === "P" &&
  result.reset.state.drive.speed === 0 && !result.reset.state.drive.cruise.active,
  "? turns off and parks the car, clears cruise, and restarts coaching", result && result.reset);
check(result && result.reset && !result.reset.helpFocusable,
  "? adds no focus or role metadata", result && result.reset);
check(result && result.restarted.coach.show && result.restarted.coach.step === 2 &&
  result.restarted.state.car.engineOn,
  "Enter resumes the restarted lesson by starting the engine", result && result.restarted);
check(result && result.copy && result.copy.en === "Press Space to hold speed." &&
  /mezerník/.test(result.copy.cs) && !/Space/.test(result.copy.pedalEn) &&
  !/mezerník/.test(result.copy.pedalCs),
  "the dedicated cruise step teaches Space in both languages", result && result.copy);
check(result && /into D$/.test(result.copy.gearEn) && /do D$/.test(result.copy.gearCs),
  "the desktop AUTO shifter instruction still names Drive as its destination", result && result.copy);
check(result && result.reentryHelpDisplay === "none",
  "desktop hides driving help while its coach is active", result && result.reentryHelpDisplay);
check(result && result.coachAboveReentry,
  "driving coach paints above the Road Trip button", result && result.coachAboveReentry);
check(result && result.manualUnchanged && result.manualUnchanged.coach.show &&
  result.manualUnchanged.coach.step === 2 &&
  result.manualUnchanged.state.drive.transmission.mode === "manual" &&
  result.manualUnchanged.state.drive.gear === 1 && result.manualUnchanged.state.drive.speed > 0,
  "manual transmission retains its existing free input behavior during coaching",
  result && result.manualUnchanged);
check(result && result.manualCruiseBefore && result.manualCruiseAfter &&
  result.manualCruiseBefore.coach.step === 4 && result.manualCruiseBefore.state.drive.speed === 0 &&
  result.manualCruiseAfter.coach.step === 5 && !result.manualCruiseAfter.state.drive.cruise.active,
  "Space completes MANUAL's stopped cruise lesson without manufacturing active cruise",
  result && { before: result.manualCruiseBefore, after: result.manualCruiseAfter });
check(mobile && mobile.errors.length === 0 && mobile.fresh.show && mobile.fresh.step === 1,
  "mobile coach starts with ignition", mobile);
check(mobile && mobile.freshBlocked && mobile.freshBlocked.coach.step === 1 &&
  mobile.freshBlocked.state.drive.speed === 0 && !mobile.freshBlocked.state.drive.holds.throttle,
  "mobile ignition step rejects the touch pedal", mobile && mobile.freshBlocked);
check(mobile && mobile.started.show && mobile.started.step === 3,
  "mobile advances directly from ignition to the shifter", mobile && mobile.started);
check(mobile && mobile.gearStepBlocked && mobile.gearStepBlocked.coach.step === 3 &&
  mobile.gearStepBlocked.state.drive.transmission.range === "P" &&
  !mobile.gearStepBlocked.state.drive.holds.throttle,
  "mobile shifter step rejects touch movement controls", mobile && mobile.gearStepBlocked);
check(mobile && mobile.shifted.show && mobile.shifted.step === 5 &&
  mobile.shifted.targets.blue && mobile.shifted.targets.pink,
  "mobile follows the shifter with one coach for both sliders", mobile && mobile.shifted);
check(mobile && mobile.shifted.targets.arrows.length === 2 &&
  mobile.shifted.targets.arrows.every(function (arrow) {
    return arrow.display !== "none" && arrow.paths === 1 &&
      /^entrance-drive-touch-coach-(down|right)$/.test(arrow.animation);
  }), "mobile coach points to both sliders with animated single-path arrows",
  mobile && mobile.shifted.targets.arrows);
check(mobile && /Blue/.test(mobile.copy.en) && /pink/.test(mobile.copy.en) && /centre/.test(mobile.copy.en) &&
  /Modrý/.test(mobile.copy.cs) && /růžový/.test(mobile.copy.cs) && /střed/.test(mobile.copy.cs) &&
  mobile.copy.liveWidth < 440 && mobile.copy.csLiveWidth < 440,
  "combined slider coaching explains the hold zone bilingually without overflowing", mobile && mobile.copy);
check(mobile && !mobile.usedControl.show && !mobile.usedControl.range &&
  mobile.usedControl.state.drive.transmission.range === "D",
  "combined mobile step blocks range changes and accepts its touch steering control",
  mobile && mobile.usedControl);
check(mobile && mobile.reentryHelpDisplay === "none",
  "mobile hides driving help while its coach is active", mobile && mobile.reentryHelpDisplay);

if (failed) process.exit(1);
console.log("Driving-coach assertions passed.");
