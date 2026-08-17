#!/usr/bin/env node
// Full dollhouse exploration unlocks and launches Road Trip without requiring Party.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function roadtrip() { return copy(window.__entranceRoomState().drive.roadtrip); }
  function lockedRooms() {
    return Array.prototype.map.call(document.querySelectorAll(".loft-dollhouse-room.locked"), function (room) {
      return room.getAttribute("data-dollhouse-room");
    });
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.__endAttract();
        if (window.__finishOpeningGuide) window.__finishOpeningGuide();
        if (window.__removeClickMe) window.__removeClickMe();
        window.__unlockAllRooms();
        window.__setSecondRound(false, { releaseHeld: false });
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom"]);
        window.__openDollhouse();
        report.nine = {
          phase2: !!window.__secondRound, party: !!window.__gardenPartyOn,
          locked: lockedRooms(), roadtrip: roadtrip(), caption: window.__captionKey(),
          coach: copy(window.__roadtripCompletionCoachState())
        };

        window.__markRoomSeen("entrance");
        window.__closeDollhouse();
        window.__openDollhouse();
        report.ten = {
          phase2: !!window.__secondRound, party: !!window.__gardenPartyOn,
          locked: lockedRooms(), roadtrip: roadtrip(), caption: window.__captionKey(),
          coach: copy(window.__roadtripCompletionCoachState())
        };

        var entrance = document.querySelector('.loft-dollhouse-room[data-dollhouse-room="entrance"]');
        entrance.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await sleep(900);
        window.__openEntrancePorscheDriveHud();
        var started = window.__entranceRoadtripStart();
        report.started = {
          fromDollhouse: !!window.__entranceRoomOpen, started: started,
          phase2: !!window.__secondRound, party: !!window.__gardenPartyOn, roadtrip: roadtrip()
        };
      } catch (error) { report.errors.push(String(error && error.stack || error)); }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 5000, {
  patchRaf: true, seedRandom: true, forceMotion: true,
  urlSuffix: "?fresh=roadtrip-phase-one-unlock",
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail))); }
}

console.log("loft-day.html Phase 1 Road Trip unlock:");
check(result && result.errors.length === 0, "the dollhouse-to-roadtrip path has no page errors", result && result.errors);
check(result && result.nine && !result.nine.phase2 && !result.nine.party &&
  result.nine.locked.length === 1 && result.nine.locked[0] === "entrance" &&
  !result.nine.roadtrip.explorationComplete && !result.nine.roadtrip.authorized &&
  !result.nine.roadtrip.unlocked && !result.nine.coach.pending,
  "nine visited rooms preserve the existing lock and offer no Road Trip", result && result.nine);
check(result && result.ten && !result.ten.phase2 && !result.ten.party && result.ten.locked.length === 0 &&
  result.ten.roadtrip.explorationComplete && result.ten.roadtrip.authorized && result.ten.roadtrip.unlocked &&
  result.ten.roadtrip.invitationReady && result.ten.caption === "roadtrip_departure_caption" &&
  result.ten.coach.pending,
  "the tenth visit unlocks every dollhouse room and advertises Road Trip during Phase 1", result && result.ten);
check(result && result.started && result.started.fromDollhouse && result.started.started &&
  !result.started.phase2 && !result.started.party && result.started.roadtrip.active &&
  result.started.roadtrip.accepted && result.started.roadtrip.everAccepted,
  "the Entrance reached from the dollhouse launches Road Trip without starting Party", result && result.started);

if (failures) process.exit(1);
console.log("Phase 1 Road Trip unlock assertions passed.");
