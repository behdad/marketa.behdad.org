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
    key("keydown", "ArrowLeft", "ArrowLeft");
    key("keyup", "ArrowLeft", "ArrowLeft");
    report.steered = coach();
    window.__entranceDriveRange("D");
    report.shifted = coach();
    report.shifted.arrowTips = Array.prototype.map.call(
      document.querySelectorAll('[data-coach-step="4"] .entrance-drive-coach-arrowhead'),
      function (arrow) { var box = arrow.getBBox(); return box.y + box.height; });
    window.__entranceDriveControl("throttle", true);
    report.driven = coach();
    window.__entranceDriveControl("throttle", false);

    window.__entranceDriveSetMotion(72, 3);
    key("keydown", "Control", "ControlLeft", { ctrlKey: true });
    key("keyup", "Control", "ControlLeft");
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
      en: T.en.hunt.entrance_drive_coach_auto_pedals_desktop,
      cs: T.cs.hunt.entrance_drive_coach_auto_pedals_desktop
    };
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 180); });
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 2400, { patchRaf: true });
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
check(result && result.steered.show && result.steered.step === 3,
  "steering advances to Drive", result && result.steered);
check(result && result.shifted.show && result.shifted.step === 4,
  "selecting D advances to the pedals and cruise lesson", result && result.shifted);
check(result && result.shifted.arrowTips.length === 2 &&
  result.shifted.arrowTips.every(function (tip) { return tip >= 159; }),
  "the final arrows reach the pedal faces", result && result.shifted.arrowTips);
check(result && !result.driven.show,
  "using a pedal completes the lesson", result && result.driven);
check(result && result.reset.coach.show && result.reset.coach.step === 1 &&
  !result.reset.state.car.engineOn && result.reset.state.drive.transmission.range === "P" &&
  result.reset.state.drive.speed === 0 && !result.reset.state.drive.cruise.active,
  "? turns off and parks the car, clears cruise, and restarts coaching", result && result.reset);
check(result && result.reset && !result.reset.helpFocusable,
  "? adds no focus or role metadata", result && result.reset);
check(result && result.restarted.coach.show && result.restarted.coach.step === 2 &&
  result.restarted.state.car.engineOn,
  "Enter resumes the restarted lesson by starting the engine", result && result.restarted);
check(result && result.copy && /Ctrl/.test(result.copy.en) && /Ctrl/.test(result.copy.cs),
  "the final desktop step teaches cruise in both languages", result && result.copy);

if (failed) process.exit(1);
console.log("Driving-coach assertions passed.");
