#!/usr/bin/env node
// Highway-only keyboard mapping, two-step exit, and closer input ownership.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return copy(window.__entranceRoomState()); }
  function key(type, value, code, target, options) {
    var event = new KeyboardEvent(type, Object.assign({
      key: value, code: code || value, bubbles: true, cancelable: true
    }, options || {}));
    (target || document).dispatchEvent(event);
    return event;
  }
  function startHighway(speed) {
    window.__openEntrancePorscheDriveHud();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("banff", 0);
    window.__entranceDriveTransmissionMode("auto", true);
    window.__entranceDriveRange("D", true);
    window.__entranceDriveSetMotion(speed || 90, 3);
  }
  window.addEventListener("load", function () { setTimeout(async function () {
    try {
      Object.defineProperty(document, "hasFocus", {
        value: function () { return true; }, configurable: true
      });
      window.__unlockAllRooms();
      window.__setSecondRound(true, { releaseHeld: false });
      window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
        "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      await sleep(40);
      window.__openEntrancePorscheDriveHud();
      window.__toggleEntrancePorscheEngine();
      document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      window.__entranceDriveTransmissionMode("auto", true);
      window.__entranceDriveRange("D", true);
      window.__entranceDriveSetMotion(60, 3);

      var localDown = key("keydown", " ", "Space");
      var localSet = state();
      var localUp = key("keyup", " ", "Space");
      var localReleased = state();
      report.steps.local = {
        downPrevented: localDown.defaultPrevented,
        upPrevented: localUp.defaultPrevented,
        set: localSet,
        released: localReleased
      };

      startHighway(90);
      var spaceOnEvent = key("keydown", " ", "Space");
      var spaceOn = state();
      key("keydown", " ", "Space", document, { repeat: true });
      var spaceRepeat = state();
      window.__entranceDriveSetMotion(105, 3);
      key("keydown", " ", "Space");
      var spaceRetargeted = state();
      window.__entranceDriveSetMotion(5, 1);
      window.__entranceDriveStep(16);
      key("keydown", " ", "Space");
      var spaceUnavailable = state();
      window.__entranceDriveSetMotion(90, 3);
      report.steps.space = {
        prevented: spaceOnEvent.defaultPrevented,
        on: spaceOn,
        repeat: spaceRepeat,
        retargeted: spaceRetargeted,
        unavailable: spaceUnavailable
      };

      var enterPauseEvent = key("keydown", "Enter", "Enter");
      var enterPaused = state();
      key("keydown", "Enter", "Enter", document, { repeat: true });
      var enterRepeat = state();
      key("keydown", "Enter", "Enter");
      report.steps.enter = {
        prevented: enterPauseEvent.defaultPrevented,
        paused: enterPaused,
        repeat: enterRepeat,
        resumed: state()
      };

      key("keydown", "Enter", "Enter");
      var spacePaused = state();
      var spaceResumeEvent = key("keydown", " ", "Space");
      report.steps.spaceResume = {
        prevented: spaceResumeEvent.defaultPrevented,
        paused: spacePaused,
        resumed: state()
      };

      var firstEscape = key("keydown", "Escape", "Escape");
      var escapePaused = state();
      key("keydown", "Escape", "Escape", document, { repeat: true });
      var escapeRepeat = state();
      key("keydown", "Escape", "Escape");
      var escapeExited = state();
      key("keydown", "Escape", "Escape");
      report.steps.escape = {
        prevented: firstEscape.defaultPrevented,
        paused: escapePaused,
        repeat: escapeRepeat,
        exited: escapeExited,
        dismissed: state()
      };

      startHighway(90);
      var firstBackspace = key("keydown", "Backspace", "Backspace");
      var backspacePaused = state();
      key("keydown", "Backspace", "Backspace");
      report.steps.backspace = {
        prevented: firstBackspace.defaultPrevented,
        paused: backspacePaused,
        exited: state()
      };

      startHighway(90);
      var search = document.createElement("input");
      search.type = "search";
      search.value = "route";
      document.body.appendChild(search);
      search.focus();
      var editableBefore = state();
      var editableBackspace = key("keydown", "Backspace", "Backspace", search);
      var editableEnter = key("keydown", "Enter", "Enter", search);
      var editableSpace = key("keydown", " ", "Space", search);
      report.steps.editable = {
        prevented: [editableBackspace.defaultPrevented, editableEnter.defaultPrevented,
          editableSpace.defaultPrevented],
        before: editableBefore,
        after: state(),
        value: search.value,
        focused: document.activeElement === search
      };
      search.remove();

      var originalCovered = window.__foregroundAmbienceCovered;
      window.__foregroundAmbienceCovered = function () { return true; };
      var coveredBefore = state();
      var coveredKeys = [
        key("keydown", " ", "Space"),
        key("keydown", "Enter", "Enter"),
        key("keydown", "Escape", "Escape"),
        key("keydown", "Backspace", "Backspace")
      ];
      report.steps.covered = {
        prevented: coveredKeys.map(function (event) { return event.defaultPrevented; }),
        before: coveredBefore,
        after: state()
      };
      window.__foregroundAmbienceCovered = originalCovered;

      report.steps.copy = {
        en: {
          drive: window.__loftMessages.en.hunt.entrance_roadtrip_drive,
          paused: window.__loftMessages.en.hunt.entrance_roadtrip_pause_line,
          cruise: window.__loftMessages.en.hunt.entrance_drive_cruise_active
        },
        cs: {
          drive: window.__loftMessages.cs.hunt.entrance_roadtrip_drive,
          paused: window.__loftMessages.cs.hunt.entrance_roadtrip_pause_line,
          cruise: window.__loftMessages.cs.hunt.entrance_drive_cruise_active
        }
      };
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 220); });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 4200, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?fresh=entrance-roadtrip-keyboard",
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail)));
  }
}
function sameDrive(left, right) {
  return left && right && left.drive.roadtrip.active === right.drive.roadtrip.active &&
    left.drive.roadtrip.resumePending === right.drive.roadtrip.resumePending &&
    left.drive.cruise.active === right.drive.cruise.active &&
    left.drive.cruise.target === right.drive.cruise.target;
}

console.log("loft-day.html Road Trip keyboard mapping:");
var s = result && result.steps || {};
check(result && result.errors.length === 0,
  "the keyboard mapping harness has no uncaught errors", result && result.errors);
check(s.local && s.local.downPrevented && !s.local.upPrevented &&
  !s.local.set.drive.holds.throttle && s.local.set.drive.cruise.active &&
  s.local.set.drive.cruise.target === 60 && s.local.released.drive.cruise.active &&
  !s.local.released.drive.roadtrip.active,
  "local street Space sets cruise without becoming throttle", s.local);
check(s.space && s.space.prevented && s.space.on.drive.roadtrip.active &&
  !s.space.on.drive.roadtrip.resumePending && s.space.on.drive.cruise.active &&
  s.space.on.drive.cruise.target === 90 && !s.space.on.drive.holds.throttle &&
  s.space.repeat.drive.cruise.active && s.space.repeat.drive.cruise.target === 90 &&
  s.space.retargeted.drive.cruise.active && s.space.retargeted.drive.cruise.target === 105 &&
  !s.space.retargeted.drive.roadtrip.resumePending &&
  !s.space.unavailable.drive.cruise.active && !s.space.unavailable.drive.roadtrip.resumePending,
  "Road Trip Space sets or retargets cruise but never turns it off", s.space);
check(s.enter && s.enter.prevented && s.enter.paused.drive.roadtrip.active &&
  s.enter.paused.drive.roadtrip.resumePending && s.enter.repeat.drive.roadtrip.resumePending &&
  s.enter.resumed.drive.roadtrip.active && !s.enter.resumed.drive.roadtrip.resumePending &&
  s.enter.resumed.car.engineOn,
  "Road Trip Enter toggles pause/resume and ignores key repeat", s.enter);
check(s.spaceResume && s.spaceResume.prevented &&
  s.spaceResume.paused.drive.roadtrip.resumePending &&
  !s.spaceResume.resumed.drive.roadtrip.resumePending &&
  s.spaceResume.resumed.drive.cruise.active && s.spaceResume.resumed.drive.cruise.target === 90,
  "Space resumes a paused Road Trip while setting its cruise speed", s.spaceResume);
check(s.escape && s.escape.prevented && s.escape.paused.drive.roadtrip.active &&
  s.escape.paused.drive.roadtrip.resumePending && sameDrive(s.escape.paused, s.escape.repeat) &&
  !s.escape.exited.drive.roadtrip.active && s.escape.exited.drive.roadtrip.paused &&
  s.escape.exited.drive.hud && !s.escape.dismissed.drive.hud,
  "Escape pauses first, ignores a held repeat, exits second, and only then dismisses the HUD", s.escape);
check(s.backspace && s.backspace.prevented && s.backspace.paused.drive.roadtrip.active &&
  s.backspace.paused.drive.roadtrip.resumePending && !s.backspace.exited.drive.roadtrip.active &&
  s.backspace.exited.drive.roadtrip.paused && s.backspace.exited.drive.hud,
  "Backspace follows the same pause-then-exit ladder", s.backspace);
check(s.editable && s.editable.prevented.every(function (value) { return !value; }) &&
  s.editable.focused && s.editable.value === "route" && sameDrive(s.editable.before, s.editable.after),
  "search/editable targets keep Backspace, Enter, and Space without changing the drive", s.editable);
check(s.covered && sameDrive(s.covered.before, s.covered.after),
  "a foreground device keeps all four keys out of the Entrance controller", s.covered);
check(s.copy && /Space sets cruise/.test(s.copy.en.drive) && /Enter/.test(s.copy.en.drive) &&
  s.copy.en.paused === "Play to resume · Esc to exit." && /Space/.test(s.copy.en.cruise) &&
  /mezerník/.test(s.copy.cs.drive) && /Enter/.test(s.copy.cs.drive) &&
  /Esc/.test(s.copy.cs.paused) && /mezerník/.test(s.copy.cs.cruise),
  "English and Czech highway copy teaches cruise, pause, and exit", s.copy);

if (failures) process.exit(1);
console.log("Road Trip keyboard assertions passed.");
