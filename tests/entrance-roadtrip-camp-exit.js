#!/usr/bin/env node
// Abraham Lake's Camping exit is optional, recurring, and durable.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: {} };
  function roadtrip() { return window.__entranceRoomState().drive.roadtrip; }
  function begin() {
    window.__entranceRoadtripStart();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
  }
  function setAbraham(elapsed, lane, speed) {
    window.__entranceRoadtripSetRoute("abraham", elapsed);
    window.__entranceRoadtripSetLane(lane);
    window.__entranceDriveSetMotion(speed, speed ? 2 : 0);
  }
  function visual() {
    var sign = document.getElementById("entrance-roadtrip-camp-exit");
    var spur = document.getElementById("entrance-roadtrip-camp-spur");
    var road = document.getElementById("entrance-roadtrip-road");
    return {
      sign: sign.getAttribute("visibility"),
      takeable: sign.getAttribute("data-roadtrip-takeable"),
      roadRight: Number(sign.getAttribute("data-roadtrip-road-right")),
      signLeft: Number(sign.getAttribute("data-roadtrip-sign-left")),
      transform: sign.getAttribute("transform"),
      spur: spur.getAttribute("visibility"),
      asphalt: spur.querySelector(".entrance-roadtrip-camp-spur-asphalt").getAttribute("d"),
      innerEdge: spur.querySelector(".entrance-roadtrip-camp-spur-inner-edge").getAttribute("d"),
      junctionX: Number(spur.getAttribute("data-roadtrip-junction-x")),
      junctionY: Number(spur.getAttribute("data-roadtrip-junction-y")),
      mouthTop: Number(spur.getAttribute("data-roadtrip-mouth-top")),
      mouthBottom: Number(spur.getAttribute("data-roadtrip-mouth-bottom")),
      afterRoad: !!(road.compareDocumentPosition(spur) & Node.DOCUMENT_POSITION_FOLLOWING)
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        begin();

        var initial = roadtrip();
        var first = initial.abrahamSeconds;
        var repeat = initial.campExitRepeatSeconds;

        setAbraham(first - 1, .5, 50);
        report.firstExit = { state: roadtrip(), visual: visual() };
        for (var missStep = 0; missStep < 3; missStep++) window.__entranceDriveStep(1000);
        report.missed = { state: roadtrip(), visual: visual() };

        window.__entranceRoadtripSetRoute("calgary", 30);
        report.calgary = visual();
        window.__entranceRoadtripSetRoute("banff", 30);
        report.banff = visual();

        setAbraham(first + repeat - 1, .5, 50);
        report.repeatExit = { state: roadtrip(), visual: visual() };

        setAbraham(first + 13, .5, 42);
        window.__exitEntranceRoadtrip();
        var checkpoint = window.__captureCheckpointSystems().entrance;
        report.saved = checkpoint.drive.roadtrip.pausedRun && checkpoint.drive.roadtrip.pausedRun.state;
        window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
        report.restored = roadtrip();

        begin();
        setAbraham(first - .5, 1, 80);
        window.__entranceDriveStep(100);
        report.slowing = window.__entranceRoomState();
        window.__entranceDriveStep(1000);
        report.arrived = window.__entranceRoomState();
        report.campResume = window.__captureCheckpointSystems().entrance.drive.roadtrip.pausedRun;

        begin();
        setAbraham(first - 1, 1, 0);
        window.__entranceDriveStep(100);
        report.noMomentum = window.__entranceRoomState();
      } catch (error) {
        report.errors.runtime = String(error && error.stack || error);
      }
      report.errors.console = window.__errs || [];
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 300);
  });
})();
</script>`;

function run(coarse) {
  return lib.runPageSync("rsvp.html", HARNESS, 4400, {
    patchRaf: true,
    forceMotion: true,
    seedRandom: true,
    forceCoarsePointer: coarse,
    urlSuffix: "?date=2026-07-15&time=12:00#play",
    chromeFlags: "--window-size=1100,900"
  });
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}
function clean(result) {
  return result && !result.errors.runtime && result.errors.console && result.errors.console.length === 0;
}
function camp(state) {
  return state && state.drive && state.drive.roadtrip.route === "camp" &&
    state.drive.roadtrip.active && !state.car.engineOn && state.drive.speed === 0;
}

console.log("rsvp.html optional recurring Camping exit:");
var desktop = run(false);
var mobile = run(true);
[desktop, mobile].forEach(function (result, index) {
  var device = index ? "touch" : "desktop";
  var expectedRepeat = index ? 45 : 60;
  check(clean(result), device + " scenario has no uncaught errors", result && result.errors);
  var first = result && result.firstExit || {};
  var firstState = first.state || {};
  var firstVisual = first.visual || {};
  check(firstState.route === "abraham" && firstState.campExitRepeatSeconds === expectedRepeat &&
    firstState.campExitVisible && firstState.campExitTakeable && firstState.playerLane === .5,
    device + " reaches a takeable exit without forcing the through lane", firstState);
  check(firstVisual.sign === "visible" && firstVisual.takeable === "true" &&
    firstVisual.spur === "visible" && firstVisual.afterRoad &&
    Number.isFinite(firstVisual.roadRight) && firstVisual.signLeft - firstVisual.roadRight >= 5.9 &&
    Number.isFinite(firstVisual.junctionX) && Number.isFinite(firstVisual.junctionY) &&
    firstVisual.mouthBottom > firstVisual.mouthTop &&
    /^M/.test(firstVisual.asphalt || "") && /^M/.test(firstVisual.innerEdge || ""),
    device + " paints the larger sign beyond a connected right-side spur", firstVisual);

  var missed = result && result.missed || {};
  check(missed.state && missed.state.route === "abraham" && missed.state.active &&
    missed.state.abrahamElapsed > missed.state.abrahamSeconds &&
    missed.state.campExitCountdown >= expectedRepeat - 2.01 &&
    missed.visual && missed.visual.sign === "hidden" && missed.visual.spur === "hidden",
    device + " keeps driving after a missed exit and starts the next interval", missed);
  check(result && result.calgary && result.calgary.sign === "hidden" && result.calgary.spur === "hidden" &&
    result.banff && result.banff.sign === "hidden" && result.banff.spur === "hidden",
    device + " does not add the Camping turnoff to Calgary or Banff", result && {
      calgary: result.calgary, banff: result.banff
    });
  var repeated = result && result.repeatExit || {};
  check(repeated.state && repeated.state.route === "abraham" && repeated.state.campExitCountdown === 1 &&
    repeated.state.campExitVisible && repeated.visual && repeated.visual.sign === "visible" &&
    repeated.visual.spur === "visible",
    device + " repeats the exit after exactly " + expectedRepeat + " seconds", repeated);

  var saved = result && result.saved || {};
  var restored = result && result.restored || {};
  check(saved.route === "abraham" && Math.abs(saved.campExitCountdown - (expectedRepeat - 13)) < .001 &&
    restored.route === "abraham" && restored.paused &&
    Math.abs(restored.campExitCountdown - saved.campExitCountdown) < .001,
    device + " checkpoints and restores the recurring-exit phase", { saved: saved, restored: restored });

  var slowing = result && result.slowing;
  check(slowing && slowing.drive.roadtrip.route === "abraham" && slowing.drive.roadtrip.campExitLatched &&
    slowing.drive.speed > 10 && slowing.drive.speed < 80,
    device + " latches the shoulder exit and slows autonomously", slowing && slowing.drive);
  check(camp(result && result.arrived), device + " enters Camping below 10 km/h", result && result.arrived);
  check(result && result.campResume && result.campResume.state &&
    result.campResume.state.route === "abraham" &&
    result.campResume.state.campExitCountdown === expectedRepeat &&
    result.campResume.state.campExitLatched === false,
    device + " retains the Abraham run while Camping is overlaid", result && result.campResume);
  check(camp(result && result.noMomentum),
    device + " takes a latched exit without borrowing forward momentum", result && result.noMomentum);
});

if (failures) process.exit(1);
console.log("Optional recurring Camping exit assertions passed.");
