#!/usr/bin/env node
"use strict";

// Dungeon owns an iframe-backed controller whose close can overlap the next lower-room
// open. The successful entry itself must record Dungeon before that transient handoff.
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {}, entries: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function snap() {
    return {
      room: window.__currentStageName,
      seen: window.__seenRooms(),
      dungeon: window.__princeState(),
      cinema: !!window.__cinemaRoomOpen
    };
  }
  window.addEventListener("loft:lowerroomenter", function (event) {
    report.entries.push(event.detail && event.detail.room);
  });
  async function run() {
    window.__getSfxCtx = function () { return null; };
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony"]);
    window.__goToStage("garden");

    var markEntered = window.__markLowerRoomEntered;
    report.steps.entryArguments = [];
    window.__markLowerRoomEntered = function (room) {
      report.steps.entryArguments.push(room == null ? null : room);
      return markEntered.apply(this, arguments);
    };
    report.steps.opened = window.__openGardenPrince();
    report.steps.atEntry = snap();
    report.steps.left = window.__navigateLowerRoom("cuddly");
    report.steps.afterImmediateLeave = snap();
    await sleep(780);
    report.steps.afterSettle = snap();

    if (window.__cinemaRoomOpen) window.__closeCinemaRoom();
    await sleep(10);
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony"]);
    window.__goToStage("garden");
    window.__cinematic = true;
    report.steps.editorialOpened = window.__openGardenPrince();
    report.steps.editorial = snap();
    window.__cinematic = false;
    if (window.__princeState().basement) window.__closeMonitorPrince();
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) {
        report.errors.push(String(error && error.stack || error));
      }).then(function () {
        report.errors = (window.__errs || []).concat(report.errors);
        document.getElementById("__report").textContent = JSON.stringify(report);
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

console.log("loft-day.html rapid Dungeon visit:");
var result = lib.runPageSync("loft-day.html", HARNESS, 5000, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.opened && s.entryArguments[0] === "dungeon" && s.atEntry.seen.indexOf("dungeon") !== -1 &&
  result.entries[0] === "dungeon",
  "successful Dungeon entry names and records its explicit destination immediately",
  { entry: s.atEntry, events: result.entries });
check(s.left && s.afterImmediateLeave.seen.indexOf("dungeon") !== -1 &&
  s.afterSettle.seen.indexOf("dungeon") !== -1 && s.afterSettle.cinema,
  "leaving for Cinema in the same turn cannot lose the Dungeon visit",
  { immediate: s.afterImmediateLeave, settled: s.afterSettle });
check(s.editorialOpened && s.editorial.seen.indexOf("dungeon") === -1,
  "cinematic Dungeon presentation still does not create a player visit",
  s.editorial);
if (failures) process.exit(1);
console.log("Rapid Dungeon visit assertions passed.");
