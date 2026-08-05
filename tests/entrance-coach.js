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
    return { show: !!(root && root.classList.contains("show")), step: active && Number(active.dataset.coachStep) };
  }
  function key(type, key, code, options) {
    document.dispatchEvent(new KeyboardEvent(type, Object.assign({
      key: key, code: code, bubbles: true, cancelable: true
    }, options || {})));
  }
  try {
    Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
    window.__unlockAllRooms();
    window.goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    report.fresh = coach();

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
        '[data-coach-step="4"] .entrance-drive-coach-arrow')).animationName
    };
    key("keydown", "ArrowLeft", "ArrowLeft");
    key("keyup", "ArrowLeft", "ArrowLeft");
    report.steered = coach();
    window.__entranceDriveRange("D");
    report.shifted = coach();
    report.shifted.arrowTips = Array.prototype.map.call(
      document.querySelectorAll('[data-coach-step="4"] .entrance-drive-coach-arrow'),
      function (arrow) { var box = arrow.getBBox(); return box.y + box.height; });
    window.__entranceDriveControl("throttle", true);
    report.driven = coach();
    window.__entranceDriveControl("throttle", false);

    key("keydown", "Control", "ControlLeft", { ctrlKey: true });
    report.cruisePressed = coach();
    key("keyup", "Control", "ControlLeft");
    report.tooSlowForCruise = coach();
    window.__entranceDriveSetMotion(72, 3);
    key("keydown", "Control", "ControlLeft", { ctrlKey: true });
    key("keyup", "Control", "ControlLeft");
    report.cruised = coach();
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
      pedalEn: T.en.hunt.entrance_drive_coach_auto_pedals_desktop,
      pedalCs: T.cs.hunt.entrance_drive_coach_auto_pedals_desktop
    };
    var reentry = document.getElementById("entrance-roadtrip-reenter");
    reentry.classList.add("show");
    var reentryBox = reentry.getBoundingClientRect();
    var helpBox = help.getBoundingClientRect();
    report.reentryGap = helpBox.left - reentryBox.right;
    reentry.classList.remove("show");
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 180); });
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 2400, { patchRaf: true });
var MOBILE_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () { setTimeout(function () {
  var report = { errors: window.__errs || [] };
  function coach() {
    var root = document.getElementById("entrance-drive-coach");
    var active = root && root.querySelector("[data-coach-step].active");
    return { show: !!(root && root.classList.contains("show")), step: active && Number(active.dataset.coachStep) };
  }
  function key(type, key, code) {
    document.dispatchEvent(new KeyboardEvent(type, { key: key, code: code, bubbles: true, cancelable: true }));
  }
  try {
    Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
    window.__unlockAllRooms(); window.goToStage("balcony"); window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud(); report.fresh = coach();
    window.__toggleEntrancePorscheEngine(); report.started = coach();
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
      cs: T.cs.hunt.entrance_drive_coach_auto_pedals_touch
    };
    var reentry = document.getElementById("entrance-roadtrip-reenter");
    reentry.classList.add("show");
    var reentryBox = reentry.getBoundingClientRect();
    var helpBox = document.getElementById("entrance-drive-help").getBoundingClientRect();
    report.reentryGap = helpBox.left - reentryBox.right;
    reentry.classList.remove("show");
    key("keydown", "ArrowLeft", "ArrowLeft"); key("keyup", "ArrowLeft", "ArrowLeft");
    report.usedControl = coach();
  } catch (error) { report.errors.push(String(error && error.stack || error)); }
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 180); });
</script>`;
var mobile = lib.runPageSync("rsvp.html", MOBILE_HARNESS, 2400,
  { patchRaf: true, forceCoarsePointer: true, chromeFlags: "--window-size=844,390" });
var failed = false;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || !detail ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}

console.log("rsvp.html driving coach:");
check(result && result.errors.length === 0, "coach harness has no uncaught errors", result && result.errors);
check(result && result.fresh.show && result.fresh.step === 1,
  "a fresh dashboard starts with ignition", result && result.fresh);
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
check(result && result.steered.show && result.steered.step === 3,
  "steering advances to Drive", result && result.steered);
check(result && result.shifted.show && result.shifted.step === 4,
  "selecting D advances to the pedals and cruise lesson", result && result.shifted);
check(result && result.shifted.arrowTips.length === 2 &&
  result.shifted.arrowTips.every(function (tip) { return tip >= 159; }),
  "the final arrows reach the pedal faces", result && result.shifted.arrowTips);
check(result && result.driven.show && result.driven.step === 5,
  "using a pedal advances to a dedicated cruise lesson", result && result.driven);
check(result && !result.cruisePressed.show && !result.tooSlowForCruise.show,
  "pressing Ctrl dismisses the cruise lesson even below cruise speed",
  result && { pressed: result.cruisePressed, released: result.tooSlowForCruise });
check(result && !result.cruised.show,
  "setting cruise completes the lesson", result && result.cruised);
check(result && result.reset.coach.show && result.reset.coach.step === 1 &&
  !result.reset.state.car.engineOn && result.reset.state.drive.transmission.range === "P" &&
  result.reset.state.drive.speed === 0 && !result.reset.state.drive.cruise.active,
  "? turns off and parks the car, clears cruise, and restarts coaching", result && result.reset);
check(result && result.reset && !result.reset.helpFocusable,
  "? adds no focus or role metadata", result && result.reset);
check(result && result.restarted.coach.show && result.restarted.coach.step === 2 &&
  result.restarted.state.car.engineOn,
  "Enter resumes the restarted lesson by starting the engine", result && result.restarted);
check(result && result.copy && /Ctrl/.test(result.copy.en) && /Ctrl/.test(result.copy.cs) &&
  !/Ctrl/.test(result.copy.pedalEn) && !/Ctrl/.test(result.copy.pedalCs),
  "the dedicated cruise step teaches Ctrl in both languages", result && result.copy);
check(result && result.reentryGap >= 8,
  "desktop Road Trip button clears driving help", result && result.reentryGap);
check(mobile && mobile.errors.length === 0 && mobile.fresh.show && mobile.fresh.step === 1,
  "mobile coach starts with ignition", mobile);
check(mobile && mobile.started.show && mobile.started.step === 3,
  "mobile advances directly from ignition to the shifter", mobile && mobile.started);
check(mobile && mobile.shifted.show && mobile.shifted.step === 4 &&
  mobile.shifted.targets.blue && mobile.shifted.targets.pink,
  "mobile follows the shifter with one coach for both sliders", mobile && mobile.shifted);
check(mobile && mobile.shifted.targets.arrows.length === 2 &&
  mobile.shifted.targets.arrows.every(function (arrow) {
    return arrow.display !== "none" && arrow.paths === 1 &&
      /^entrance-drive-touch-coach-(down|right)$/.test(arrow.animation);
  }), "mobile coach points to both sliders with animated single-path arrows",
  mobile && mobile.shifted.targets.arrows);
check(mobile && /Blue/.test(mobile.copy.en) && /pink/.test(mobile.copy.en) &&
  /Modrý/.test(mobile.copy.cs) && /růžový/.test(mobile.copy.cs),
  "combined slider coaching is bilingual", mobile && mobile.copy);
check(mobile && !mobile.usedControl.show,
  "using either combined control completes the mobile coach", mobile && mobile.usedControl);
check(mobile && mobile.reentryGap >= 8,
  "mobile Road Trip button clears driving help", mobile && mobile.reentryGap);

if (failed) process.exit(1);
console.log("Driving-coach assertions passed.");
