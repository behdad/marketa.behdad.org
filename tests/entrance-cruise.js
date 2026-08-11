#!/usr/bin/env node
// Space latches or retargets a speed floor; throttle may exceed it and braking cancels it.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () { setTimeout(function () {
  var report = { errors: window.__errs || [] };
  function drive() { return window.__entranceRoomState().drive; }
  function key(type, key, code, options) {
    var event = new KeyboardEvent(type, Object.assign({
      key: key, code: code, bubbles: true, cancelable: true
    }, options || {}));
    document.dispatchEvent(event);
    return event.defaultPrevented;
  }
  function spaceTap() {
    var down = key("keydown", " ", "Space");
    key("keyup", " ", "Space");
    return down;
  }
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
    window.__openEntrancePorscheDriveHud();
    window.__toggleEntrancePorscheEngine();
    document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    window.__entranceDriveTransmissionMode("auto", true);
    window.__entranceDriveSetMotion(100, 4);

    window.__entranceDriveStep(16);
    report.coach = {
      caption: document.getElementById("hunt-caption").textContent,
      en: window.__loftMessages.en.hunt.entrance_drive_auto_desktop,
      cs: window.__loftMessages.cs.hunt.entrance_drive_auto_desktop
    };

    key("keydown", "Control", "ControlLeft", { ctrlKey: true });
    key("keyup", "Control", "ControlLeft");
    report.ctrlNoop = JSON.parse(JSON.stringify(drive()));

    key("keydown", "Control", "ControlLeft", { ctrlKey: true });
    key("keydown", "ArrowRight", "ArrowRight", { ctrlKey: true });
    key("keyup", "ArrowRight", "ArrowRight", { ctrlKey: true });
    key("keyup", "Control", "ControlLeft");
    report.chord = JSON.parse(JSON.stringify(drive()));
    window.__entranceDriveTransmissionMode("auto", true);
    if (window.__cancelCaption) window.__cancelCaption("entrance-transmission");
    window.__entranceDriveSetMotion(100, 4);

    report.claimed = spaceTap();
    report.engaged = JSON.parse(JSON.stringify(drive()));
    report.engaged.caption = document.getElementById("hunt-caption").textContent;
    report.engaged.indicatorOpacity = document.getElementById("entrance-drive-cruise-indicator").getAttribute("opacity");

    key("keydown", "ArrowLeft", "ArrowLeft");
    report.steering = JSON.parse(JSON.stringify(drive()));
    key("keyup", "ArrowLeft", "ArrowLeft");

    key("keydown", "ArrowUp", "ArrowUp");
    for (var accelerating = 0; accelerating < 10; accelerating++) window.__entranceDriveStep(100);
    report.accelerated = JSON.parse(JSON.stringify(drive()));
    key("keyup", "ArrowUp", "ArrowUp");
    for (var settling = 0; settling < 50; settling++) window.__entranceDriveStep(100);
    report.settled = JSON.parse(JSON.stringify(drive()));

    window.__entranceDriveSetMotion(118, 4);
    report.retargetedTap = spaceTap();
    window.__entranceDriveStep(1000);
    report.retargeted = JSON.parse(JSON.stringify(drive()));

    window.__entranceDriveSetMotion(90, 4);
    spaceTap();
    key("keydown", "ArrowDown", "ArrowDown");
    report.braked = JSON.parse(JSON.stringify(drive()));
    key("keyup", "ArrowDown", "ArrowDown");

    window.__entranceRoadtripDevStart();
    window.__entranceDriveSetMotion(88, 4);
    spaceTap();
    window.__toggleEntranceRoadtripTransport();
    var checkpoint = window.__captureCheckpointSystems().entrance;
    report.paused = {
      drive: JSON.parse(JSON.stringify(drive())),
      transport: window.__entranceRoadtripTransportState(),
      indicatorOpacity: document.getElementById("entrance-drive-cruise-indicator").getAttribute("opacity"),
      indicatorSpeed: document.getElementById("entrance-drive-cruise-speed").textContent,
      saved: checkpoint.drive.roadtrip.pausedRun.drive.cruise
    };
    window.__entranceDriveTransmissionMode("manual", true);
    window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
    report.restored = {
      drive: JSON.parse(JSON.stringify(drive())),
      indicatorOpacity: document.getElementById("entrance-drive-cruise-indicator").getAttribute("opacity"),
      indicatorSpeed: document.getElementById("entrance-drive-cruise-speed").textContent,
      saved: window.__captureCheckpointSystems().entrance.drive.roadtrip.pausedRun.drive.cruise
    };
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 180); });
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 2600, { patchRaf: true });
var failed = false;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || !detail ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}

console.log("rsvp.html desktop cruise control:");
check(result && result.errors.length === 0, "cruise harness has no uncaught errors", result && result.errors);
check(result && result.coach && /Space/.test(result.coach.caption) &&
  /Space/.test(result.coach.en) && /mezerník/.test(result.coach.cs),
  "the initial driving instruction teaches cruise in both languages", result && result.coach);
check(result && result.ctrlNoop && !result.ctrlNoop.cruise.active,
  "plain Ctrl no longer changes cruise", result && result.ctrlNoop);
check(result && result.chord && result.chord.transmission.mode === "manual" && !result.chord.cruise.active,
  "Ctrl+Right changes transmission without toggling cruise", result && result.chord);
check(result && result.claimed && result.engaged.cruise.active &&
  Math.abs(result.engaged.cruise.target - 100) < .01 && /100 km\/h/.test(result.engaged.caption) &&
  result.engaged.indicatorOpacity === "1",
  "Space captures speed, captions it, and lights the speedometer telltale", result && result.engaged);
check(result && result.steering && result.steering.cruise.active && result.steering.holds.steerLeft,
  "latched cruise leaves the arrow keys available for steering", result && result.steering);
check(result && result.accelerated && result.accelerated.cruise.active &&
  result.accelerated.cruise.target === 100 && result.accelerated.speed > 100,
  "Up accelerates above the captured speed floor", result && result.accelerated);
check(result && result.settled && result.settled.cruise.active && result.settled.speed >= 100 &&
  result.settled.speed < result.accelerated.speed,
  "releasing Up settles back without dropping below the captured speed", result && result.settled);
check(result && result.retargetedTap && result.retargeted && result.retargeted.cruise.active &&
  result.retargeted.cruise.target === 118 && result.retargeted.speed >= 118,
  "another Space press retargets active cruise instead of cancelling it", result && result.retargeted);
check(result && result.braked && result.braked.holds.brake && !result.braked.cruise.active &&
  result.braked.cruise.target === 0,
  "braking cancels cruise immediately", result && result.braked);
check(result && result.paused && result.paused.transport.paused && result.paused.drive.cruise.active &&
  result.paused.saved.active && result.paused.saved.target === 88 &&
  result.paused.indicatorOpacity === "1" && result.paused.indicatorSpeed === "88",
  "Road Trip pause keeps and checkpoints the cruise telltale and held speed", result && result.paused);
check(result && result.restored && result.restored.drive.cruise.active &&
  result.restored.drive.cruise.target === 88 && result.restored.saved.active &&
  result.restored.indicatorOpacity === "1" && result.restored.indicatorSpeed === "88",
  "Continue restores cruise state, target, and speedometer readout", result && result.restored);

if (failed) process.exit(1);
console.log("Cruise-control assertions passed.");
