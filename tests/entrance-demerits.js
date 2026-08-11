#!/usr/bin/env node
// Road Trip demerits survive reload/checkpoint resets, clear on a full game reset,
// expire by wall clock, and reinstate at seven points.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var phaseKey = "entrance-demerits-phase";
  var resultKey = "entrance-demerits-result";
  var recordKey = "entranceRoadtripDemerits:v1";
  var phase = Number(sessionStorage.getItem(phaseKey) || 0);
  if (!phase) {
    localStorage.setItem(recordKey, JSON.stringify({ points: 15, suspendedUntil: Date.now() + 60000 }));
    sessionStorage.setItem(phaseKey, "1");
    location.reload();
    return;
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return window.__entranceRoomState().drive.roadtrip; }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  window.addEventListener("load", function () { setTimeout(async function () {
    try {
      if (phase === 1) {
        var restored = copy(state());
        Object.defineProperty(document, "hasFocus", { value: function () { return false; }, configurable: true });
        window.dispatchEvent(new Event("blur"));
        await sleep(120);
        var unfocused = copy(state());
        window.__resetCheckpointSystems();
        var reset = copy(state());
        var persisted = JSON.parse(localStorage.getItem(recordKey));
        window.__activateExtinguisher();
        await sleep(850);
        var fullReset = copy(state());
        sessionStorage.setItem(resultKey, JSON.stringify({
          restored: restored,
          unfocused: unfocused,
          reset: reset,
          persisted: persisted,
          fullReset: fullReset,
          fullResetPersisted: localStorage.getItem(recordKey)
        }));
        localStorage.setItem(recordKey, JSON.stringify({ points: 15, suspendedUntil: Date.now() - 1 }));
        sessionStorage.setItem(phaseKey, "2");
        location.reload();
        return;
      }
      var report = { errors: window.__errs || [], steps: JSON.parse(sessionStorage.getItem(resultKey) || "{}") };
      report.steps.expired = copy(state());
      report.steps.normalized = JSON.parse(localStorage.getItem(recordKey));
      window.__unlockAllRooms();
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      await sleep(40);
      window.__openEntrancePorscheDriveHud();
      report.steps.reinstatedStart = window.__entranceRoadtripDevStart();
      report.steps.reinstated = copy(state());
      report.steps.expiring = window.__entranceRoadtripSetDemerits(3, 0, Date.now() + 80);
      report.steps.expiringState = copy(state());
      report.steps.expiringPersisted = JSON.parse(localStorage.getItem(recordKey));
      await sleep(150);
      report.steps.decayed = copy(state());
      report.steps.decayedPersisted = JSON.parse(localStorage.getItem(recordKey));
      window.__setLang("cs");
      report.steps.czech = {
        suspended: window.__loftMessages.cs.hunt.entrance_roadtrip_suspended,
        warning: window.__loftMessages.cs.hunt.entrance_roadtrip_demerit_warning,
        ticket: window.__loftMessages.cs.hunt.entrance_roadtrip_police_ticket
      };
      document.getElementById("__report").textContent = JSON.stringify(report);
    } catch (error) {
      document.getElementById("__report").textContent = JSON.stringify({
        errors: (window.__errs || []).concat(String(error && error.stack || error)), steps: {}
      });
    }
  }, 120); });
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

console.log("loft-day.html Road Trip demerit persistence:");
var result = lib.runPageSync("loft-day.html", HARNESS, 3500, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.restored && s.restored.demeritPoints === 15 && s.restored.suspended &&
  s.restored.suspensionRemainingSeconds >= 58 && s.restored.suspensionRemainingSeconds <= 60 &&
  s.restored.demeritWarningAt === 8 && s.restored.demeritSuspensionAt === 15 &&
  s.restored.suspensionSeconds === 60 && s.restored.reinstatementPoints === 7,
  "a live 15-point suspension restores with a real-time countdown", s.restored);
check(s.unfocused && s.unfocused.suspended && s.unfocused.demeritPoints === 15 &&
  s.unfocused.suspensionRemainingSeconds <= s.restored.suspensionRemainingSeconds &&
  s.unfocused.suspensionRemainingSeconds >= s.restored.suspensionRemainingSeconds - 1,
  "unfocus pauses driving but does not reset or game-time-advance the wall-clock suspension", s.unfocused);
check(s.reset && s.reset.suspended && s.reset.demeritPoints === 15 && s.persisted &&
  s.persisted.points === 15 && s.persisted.suspendedUntil > Date.now(),
  "checkpoint reset cannot erase or roll back the separate driver record", { reset: s.reset, persisted: s.persisted });
check(s.fullReset && !s.fullReset.suspended && s.fullReset.demeritPoints === 0 &&
  s.fullResetPersisted === null,
  "a deliberate full game reset clears the driver record and suspension", {
    reset: s.fullReset, persisted: s.fullResetPersisted
  });
check(s.expired && !s.expired.suspended && s.expired.demeritPoints === 7 &&
  s.expired.demeritWarning === false && s.normalized && s.normalized.points === 7 &&
  s.normalized.suspendedUntil === 0,
  "an expired suspension is atomically normalized to seven points", { expired: s.expired, normalized: s.normalized });
check(s.reinstatedStart && s.reinstated && s.reinstated.active && !s.reinstated.suspended &&
  s.reinstated.demeritPoints === 7,
  "the reinstated driver can start Road Trip again", s.reinstated);
check(s.expiring && s.expiring.points === 3 &&
  s.expiringState && s.expiringState.demeritExpirySeconds === 180 &&
  s.expiringState.nextDemeritExpirySeconds === 1 && s.expiringPersisted &&
  s.expiringPersisted.entries && s.expiringPersisted.entries.length === 1 &&
  s.expiring.expiresAt === s.expiringPersisted.entries[0].expiresAt,
  "each persisted demerit batch carries a three-minute wall-clock expiry", {
    set: s.expiring, state: s.expiringState, persisted: s.expiringPersisted
  });
check(s.decayed && s.decayed.demeritPoints === 0 && s.decayed.demeritBatches.length === 0 &&
  s.decayedPersisted && s.decayedPersisted.points === 0 && s.decayedPersisted.entries.length === 0,
  "the HUD and stored driver record clear when the batch expires", {
    state: s.decayed, persisted: s.decayedPersisted
  });
check(s.czech && /Řidičák pozastaven/.test(s.czech.suspended) && /varování/.test(s.czech.warning) &&
  /trestné body/.test(s.czech.ticket),
  "suspension, warning, and citation feedback are present in Czech", s.czech);

if (failures) {
  console.log("\n" + failures + " Road Trip demerit assertion(s) failed.");
  process.exit(1);
}
console.log("\nRoad Trip demerit assertions passed.");
