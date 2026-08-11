#!/usr/bin/env node
// Wrong-lane oncoming traffic: seeded one-in-five evasion without removing head-on risk.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function state() { return window.__entranceRoomState().drive.roadtrip; }
  function entity(serial) {
    return state().entities.find(function (row) { return row.serial === serial; }) || null;
  }
  function decisions(seed) {
    window.__entranceRoadtripSetSeed(seed);
    return Array.from({ length: 100 }, function (_, index) {
      return window.__entranceRoadtripOncomingEvasionDecision(index + 1);
    });
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
        window.__unlockAllRooms();
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("banff", 0);

        report.steps.deckA = decisions(0x12345678);
        report.steps.deckARepeat = decisions(0x12345678);
        report.steps.deckB = decisions(0x87654321);

        var evasionSeed = 1;
        while (evasionSeed < 10000) {
          window.__entranceRoadtripSetSeed(evasionSeed);
          if (window.__entranceRoadtripOncomingEvasionDecision(1) &&
              !window.__entranceRoadtripOncomingEvasionDecision(2)) break;
          evasionSeed++;
        }
        report.steps.evasionSeed = evasionSeed;
        window.__entranceRoadtripSetSeed(evasionSeed);
        window.__entranceDriveSetMotion(0, 0);
        window.__entranceRoadtripSetLane(-.5);

        window.__entranceRoadtripSpawn("car", -.5, 34);
        var evadeSerial = state().spawnSerial;
        var beforeEvadeCollisions = state().collisions;
        window.__entranceDriveStep(100);
        report.steps.evadeDecision = entity(evadeSerial);
        window.__entranceDriveStep(200);
        report.steps.evadeMoving = entity(evadeSerial);
        window.__entranceDriveStep(300);
        report.steps.evadeClear = entity(evadeSerial);
        window.__entranceDriveStep(500);
        report.steps.evadePassed = {
          entity: entity(evadeSerial),
          collisions: state().collisions,
          beforeCollisions: beforeEvadeCollisions
        };

        window.__entranceDriveStep(2000);
        window.__entranceRoadtripSetLane(-.5);
        window.__entranceRoadtripSpawn("car", -.5, 34);
        var holdSerial = state().spawnSerial;
        var beforeHoldCollisions = state().collisions;
        window.__entranceDriveStep(100);
        report.steps.holdDecision = entity(holdSerial);
        window.__entranceDriveStep(1000);
        report.steps.holdCollision = {
          entity: entity(holdSerial),
          collisions: state().collisions,
          beforeCollisions: beforeHoldCollisions
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
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
function count(rows) { return (rows || []).filter(Boolean).length; }

console.log("loft-day.html wrong-lane oncoming evasion:");
var result = lib.runPageSync("loft-day.html", HARNESS, 4200, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
check(result && result.errors.length === 0, "the focused drive has no uncaught errors", result && result.errors);
var steps = result && result.steps || {};
check(count(steps.deckA) === 20 && count(steps.deckARepeat) === 20 && count(steps.deckB) === 20 &&
  JSON.stringify(steps.deckA) === JSON.stringify(steps.deckARepeat) &&
  JSON.stringify(steps.deckA) !== JSON.stringify(steps.deckB),
  "each seeded 100-vehicle deck reproducibly selects exactly 20 evasive reactions", {
    a: count(steps.deckA), repeat: count(steps.deckARepeat), b: count(steps.deckB)
  });
check(steps.evadeDecision && steps.evadeDecision.oncomingEvasionDecided &&
  steps.evadeDecision.oncomingEvasionRequested && steps.evadeDecision.oncomingEvading &&
  steps.evadeDecision.oncomingHorned && steps.evadeDecision.lane === -.5 &&
  steps.evadeDecision.oncomingEvasionTarget === -1.5,
  "a selected wrong-lane vehicle latches its long horn and safe negative-lane target", steps.evadeDecision);
check(steps.evadeMoving && steps.evadeMoving.lane < -.5 && steps.evadeMoving.lane > -1.5 &&
  steps.evadeMoving.oncomingEvading,
  "the selected vehicle visibly interpolates between the two oncoming lanes", steps.evadeMoving);
check(steps.evadeClear && steps.evadeClear.lane === -1.5 && steps.evadePassed &&
  steps.evadePassed.entity && steps.evadePassed.entity.passed &&
  steps.evadePassed.collisions === steps.evadePassed.beforeCollisions,
  "a completed safe evasion clears the Porsche without a collision", {
    clear: steps.evadeClear, passed: steps.evadePassed
  });
check(steps.holdDecision && steps.holdDecision.oncomingEvasionDecided &&
  !steps.holdDecision.oncomingEvasionRequested && !steps.holdDecision.oncomingEvading &&
  steps.holdDecision.oncomingHorned && steps.holdDecision.lane === -.5,
  "a non-selected wrong-lane vehicle horns once but holds course", steps.holdDecision);
check(steps.holdCollision && !steps.holdCollision.entity &&
  steps.holdCollision.collisions === steps.holdCollision.beforeCollisions + 1,
  "held-course oncoming traffic preserves the possible head-on collision", steps.holdCollision);

if (failures) process.exit(1);
console.log("Wrong-lane oncoming evasion checks passed.");
