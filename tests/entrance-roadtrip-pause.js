#!/usr/bin/env node
// Road Trip pause ownership: an active run survives Continue/reload and resumes explicitly.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  var attended = true;
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return window.__entranceRoomState(); }
  function pausedRun() {
    var row = window.__captureCheckpointSystems().entrance;
    return row.drive.roadtrip.pausedRun || null;
  }
  function durableRun(run) {
    return run && { state: run.state, police: run.police, entities: run.entities, damage: run.damage };
  }
  function documentEnter() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  }
  function documentSpace() {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: " ", code: "Space", bubbles: true, cancelable: true
    }));
    document.dispatchEvent(new KeyboardEvent("keyup", {
      key: " ", code: "Space", bubbles: true, cancelable: true
    }));
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  async function seedRun() {
    Object.defineProperty(document, "hasFocus", {
      value: function () { return attended; }, configurable: true
    });
    window.getSfxCtx = function () { return null; };
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.goToStage("balcony");
    window.__openEntranceRoom();
    await sleep(40);
    window.__openEntrancePorscheDriveHud();
    if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveSetMotion(120, 3);
    window.__entranceRoadtripSpawn("deer", .5, 8);
    window.__entranceDriveStep(100);
    window.__entranceRoadtripSetDistance(246.375);
    window.__entranceRoadtripSetLane(.73);
    window.__entranceDriveSetMotion(97, 3);
    window.__entranceRoadtripSpawn("pickup", 1.5, 37);
    window.__entranceRoadtripSpawn("kiss", .5, 51);
    window.__entranceRoadtripPolice(180);
    attended = false;
    window.dispatchEvent(new Event("blur"));
    await sleep(30);
    var entrance = window.__captureCheckpointSystems().entrance;
    var run = entrance.drive.roadtrip.pausedRun;
    if (!entrance.drive.roadtrip.highwayActive || !run || run.damage.kind !== "cracked" ||
        run.police.phase !== "warning" || run.entities.length < 2) {
      throw new Error("seeded Road Trip snapshot is incomplete");
    }
    sessionStorage.setItem("entrance-roadtrip-pause-expected", JSON.stringify(run));
    sessionStorage.setItem("entrance-roadtrip-pause-seeded", "1");
    localStorage.setItem("loftCheckpoint:v1", JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      progress: {
        room: "balcony", lowerRoom: "entrance", maxUnlocked: 4,
        seenRooms: window.__seenRooms(),
        phase2: true, party: false, daylight: true, bbq: false
      },
      puzzle: {}, phone: null, album: null,
      systems: { entrance: entrance }
    }));
    location.reload();
  }
  async function verifyReload() {
    Object.defineProperty(document, "hasFocus", {
      value: function () { return attended; }, configurable: true
    });
    window.getSfxCtx = function () { return null; };
    var expected = JSON.parse(sessionStorage.getItem("entrance-roadtrip-pause-expected"));
    var gate = document.getElementById("loft-recovery-gate");
    var button = gate && gate.querySelector(".loft-recovery-btn.primary");
    if (!button) throw new Error("missing recovery Continue");
    button.click();
    await sleep(520);
    var restored = copy(state());
    var restoredRun = pausedRun();
    var frozenBefore = copy(state().drive.roadtrip);
    await sleep(260);
    var frozenAfter = copy(state().drive.roadtrip);
    var reentry = document.getElementById("entrance-roadtrip-reenter");
    var transport = document.getElementById("hunt-playpause-btn");
    report.steps.restored = {
      state: restored,
      expected: durableRun(expected),
      run: durableRun(restoredRun),
      frozenBefore: frozenBefore,
      frozenAfter: frozenAfter,
      buttonVisible: reentry.classList.contains("show"),
      buttonLabel: reentry.textContent.trim(),
      transportVisible: transport.classList.contains("shown"),
      transportPaused: transport.classList.contains("paused"),
      crackPrimary: document.getElementById("entrance-roadtrip-crack-primary").getAttribute("d")
    };
    var resumedPaused = copy(state());
    documentSpace();
    var resumed = copy(state());
    var resumedRun = pausedRun();
    report.steps.resumed = {
      state: resumed,
      paused: resumedPaused,
      run: durableRun(resumedRun)
    };
    window.__exitEntranceRoadtrip();
    window.__dismissEntrancePorscheDriveHud();
    window.__openEntrancePorscheDriveHud();
    var engineOff = copy(state());
    documentEnter();
    var engineStarted = copy(state());
    documentEnter();
    var reentryChoice = {
      state: copy(state()),
      menuOpen: document.getElementById("entrance-roadtrip-reenter-menu").classList.contains("show"),
      selected: document.querySelector('[data-roadtrip-reentry-choice="continue"]').classList.contains("selected")
    };
    documentEnter();
    var keyboardPaused = copy(state());
    documentEnter();
    var keyboardResumed = copy(state());
    report.steps.engineCycle = {
      off: engineOff,
      started: engineStarted,
      choice: reentryChoice,
      paused: keyboardPaused,
      resumed: keyboardResumed,
      run: durableRun(pausedRun())
    };
    window.__exitEntranceRoadtrip();
    report.steps.beforeNew = durableRun(pausedRun());
    reentry.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    document.querySelector('[data-roadtrip-reentry-choice="new"]').dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    report.steps.newRun = {
      state: copy(state()),
      menuOpen: document.getElementById("entrance-roadtrip-reenter-menu").classList.contains("show"),
      run: durableRun(pausedRun())
    };
    document.getElementById("entrance-roadtrip-route-later").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    reentry.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    report.steps.newDismissed = {
      state: copy(state()),
      menuOpen: document.getElementById("entrance-roadtrip-reenter-menu").classList.contains("show"),
      continueVisible: document.querySelector('[data-roadtrip-reentry-choice="continue"]').classList.contains("show"),
      run: durableRun(pausedRun())
    };
    document.querySelector('[data-roadtrip-reentry-choice="new"]').dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    document.querySelector('[data-roadtrip-route-choice="banff"]').dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    report.steps.newStarted = { state: copy(state()), run: durableRun(pausedRun()) };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      var recovering = !!sessionStorage.getItem("entrance-roadtrip-pause-seeded");
      var action = recovering ? verifyReload() : seedRun();
      action.catch(function (error) {
        report.errors.push("harness: " + String(error && error.stack || error));
      }).then(function () {
        if (recovering) finish();
      });
    }, 220);
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
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }

console.log("rsvp.html Road Trip paused-run recovery:");
var result = lib.runPageSync("rsvp.html", HARNESS, 8500, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var restored = result.steps && result.steps.restored;
var resumed = result.steps && result.steps.resumed;
var engine = result.steps && result.steps.engineCycle;
var beforeNew = result.steps && result.steps.beforeNew;
var fresh = result.steps && result.steps.newRun;
var freshDismissed = result.steps && result.steps.newDismissed;
var freshStarted = result.steps && result.steps.newStarted;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(restored && restored.state.open && restored.state.drive.hud &&
  restored.state.drive.roadtrip.active && !restored.state.drive.roadtrip.paused &&
  restored.state.drive.roadtrip.resumePending &&
  !restored.state.drive.roadtrip.reentryVisible && !restored.buttonVisible &&
  restored.transportVisible && restored.transportPaused,
  "Continue reopens the saved highway view paused in place", restored && restored.state);
check(restored && same(restored.expected, restored.run) && restored.run.state.runSeed > 0 &&
  restored.run.damage.kind === "cracked" &&
  restored.run.damage.geometry.primary === restored.crackPrimary && restored.run.police.phase === "warning" &&
  restored.run.entities.length >= 2,
  "reload preserves the run seed, score/time/distance, traffic positions, crack geometry, and police state exactly",
  restored && { expected: restored.expected, run: restored.run });
check(restored && restored.frozenAfter.distance === restored.frozenBefore.distance &&
  restored.frozenAfter.elapsedSeconds === restored.frozenBefore.elapsedSeconds &&
  restored.frozenAfter.score === restored.frozenBefore.score &&
  same(restored.frozenAfter.entities, restored.frozenBefore.entities) &&
  same(restored.frozenAfter.police, restored.frozenBefore.police),
  "the reopened highway stays frozen while its pause is untouched", restored && {
    before: restored.frozenBefore, after: restored.frozenAfter
  });
check(resumed && resumed.paused.drive.hud && resumed.paused.drive.roadtrip.active &&
  resumed.paused.drive.roadtrip.resumePending &&
  resumed.state.drive.roadtrip.active && !resumed.state.drive.roadtrip.resumePending &&
  same(restored.expected, resumed.run),
  "Space resumes the exact restored run without a Road Trip re-entry step", resumed && resumed.state.drive.roadtrip);
check(engine && !engine.off.car.engineOn && engine.off.drive.roadtrip.paused &&
  engine.off.drive.roadtrip.damage.kind === "cracked" && engine.started.car.engineOn &&
  engine.started.drive.roadtrip.paused && engine.started.drive.roadtrip.damage.kind === "cracked" &&
  engine.choice.menuOpen && engine.choice.selected && engine.choice.state.drive.roadtrip.paused &&
  engine.paused.drive.roadtrip.active && engine.paused.drive.roadtrip.resumePending &&
  engine.resumed.drive.roadtrip.active && !engine.resumed.drive.roadtrip.paused &&
  engine.resumed.drive.roadtrip.damage.kind === "cracked" && same(restored.expected, engine.run),
  "engine-off Enter preserves damage, then the explicit Continue choice resumes the same run", engine);
check(fresh && !fresh.menuOpen && !fresh.state.drive.roadtrip.active &&
  fresh.state.drive.roadtrip.paused && fresh.state.drive.roadtrip.routeChooserOpen &&
  same(beforeNew, fresh.run),
  "New opens the starting-segment chooser without replacing the paused run", fresh && fresh.state.drive.roadtrip);
check(freshDismissed && !freshDismissed.state.drive.roadtrip.active &&
  freshDismissed.state.drive.roadtrip.paused && !freshDismissed.state.drive.roadtrip.routeChooserOpen &&
  freshDismissed.menuOpen && freshDismissed.continueVisible && same(beforeNew, freshDismissed.run),
  "dismissing the chooser preserves the old run and offers Continue again", freshDismissed);
check(freshStarted && freshStarted.state.drive.roadtrip.active &&
  !freshStarted.state.drive.roadtrip.paused && !freshStarted.state.drive.roadtrip.routeChooserOpen &&
  freshStarted.state.drive.roadtrip.route === "banff" && freshStarted.run.state.runSeed !== beforeNew.state.runSeed &&
  freshStarted.run.entities.length === 0 && freshStarted.run.damage.kind === "",
  "choosing a segment finally replaces the paused run", freshStarted && freshStarted.state.drive.roadtrip);

console.log("");
if (failures) {
  console.log(failures + " paused-run assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Road Trip paused-run recovery assertions passed.");
