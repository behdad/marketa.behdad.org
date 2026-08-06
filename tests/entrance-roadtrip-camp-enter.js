#!/usr/bin/env node
// Document-level Enter walks Camping one bounded action at a time, including all 19 trace stars.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<style>#entrance-roadtrip-stargazing-game *,#entrance-roadtrip-camp-wisdom{transition:none!important}</style>
<script>
(function () {
  var report = { errors: [], starSteps: [], prevented: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function enter(repeat) {
    var event = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true, repeat: !!repeat });
    document.dispatchEvent(event);
    report.prevented.push(event.defaultPrevented);
    return event.defaultPrevented;
  }
  function snap() {
    var room = document.getElementById("entrance-room");
    var roadtrip = window.__captureCheckpointSystems().entrance.drive.roadtrip;
    return {
      active: room.classList.contains("roadtrip-active") && room.classList.contains("roadtrip-route-camp"),
      fireBuilt: roadtrip.campFireBuilt,
      fireLit: roadtrip.campFireLit,
      igniting: document.getElementById("entrance-roadtrip-fire-game").classList.contains("igniting"),
      stew: window.__entranceRoadtripCampStewState(),
      stargazing: window.__entranceRoadtripCampStargazingState(),
      dusk: document.getElementById("stage-balcony").classList.contains("dusk")
    };
  }
  function total(progress) {
    return progress.cassiopeia + progress["ursa-major"] + progress["ursa-minor"];
  }
  async function run() {
    window.__unlockAllRooms();
    window.goToStage("balcony");
    await sleep(220);
    window.__openEntranceRoom();
    document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
    window.__openEntrancePorscheDriveHud();
    window.__entranceRoadtripStart();
    window.__entranceRoadtripSetRoute("camp", 0);
    window.__setDayNight(false);
    await sleep(220);
    report.initial = snap();

    enter(false);
    report.fireStarting = snap();
    enter(true);
    enter(false);
    report.fireGuarded = snap();
    await sleep(1700);
    report.fireReady = snap();

    enter(false);
    report.stewCooking = snap();
    enter(false);
    report.stewDoubleGuarded = snap();
    await sleep(190);
    enter(false);
    report.stewReady = snap();
    enter(false);
    report.serveDoubleGuarded = snap();
    await sleep(190);
    enter(false);
    report.stewServed = snap();
    await sleep(190);
    enter(false);
    report.sunsetting = snap();
    enter(false);
    await sleep(190);
    enter(false);
    report.sunsetGuarded = snap();
    await sleep(1530);
    report.builderOpen = snap();

    for (var i = 0; i < 19; i++) {
      var before = snap();
      var prevented = enter(false);
      var after = snap();
      report.starSteps.push({
        before: total(before.stargazing.progress), after: total(after.stargazing.progress),
        progress: after.stargazing.progress, open: after.stargazing.open,
        active: after.active, prevented: prevented
      });
      await sleep(170);
    }
    report.complete = snap();
    enter(false);
    report.completeInert = snap();
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { report.errors.push(String(error && error.stack || error)); }).then(function () {
        report.errors = (window.__errs || []).concat(report.errors);
        document.getElementById("__report").textContent = JSON.stringify(report);
      });
    }, 320);
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

console.log("rsvp.html campsite Enter solve-walker:");
var result = lib.runPageSync("rsvp.html", HARNESS, 12500, {
  forceReduce: true,
  patchRaf: true,
  seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=14:00#play",
  chromeFlags: "--window-size=1180,900"
});
check(result && result.errors.length === 0, "the Enter-only campsite walk has no uncaught errors", result && result.errors);
check(result && result.initial.active && !result.initial.fireBuilt && !result.initial.fireLit,
  "the walk starts at an active empty campsite", result && result.initial);
check(result && result.fireStarting.active && result.fireStarting.igniting &&
  !result.fireStarting.fireBuilt && !result.fireStarting.fireLit,
  "one Enter assembles a valid fire and begins lighting it", result && result.fireStarting);
check(result && result.fireGuarded.igniting && !result.fireGuarded.fireBuilt && result.fireReady.fireBuilt && result.fireReady.fireLit,
  "repeat and double Enter cannot skip the asynchronous ignition", result && { guarded: result.fireGuarded, ready: result.fireReady });
var cooking = result && result.stewCooking && result.stewCooking.stew;
var extras = cooking && ["onion", "garlic", "ginger", "carrots", "celery", "mushrooms", "tomato", "curry", "salt", "pepper", "chilies", "coriander"]
  .filter(function (name) { return cooking[name]; }).length;
check(cooking && cooking.status === "cooking" && cooking.protein && cooking.starch && extras > 0,
  "the next Enter chooses a random valid recipe and starts cooking", cooking);
check(result && result.stewDoubleGuarded.stew.phase !== "ready" && result.stewReady.stew.phase === "ready" &&
  result.stewReady.stew.elapsed >= 11500 && result.stewReady.stew.elapsed < 18500,
  "one deliberate Enter advances cooking to ready without overcooking; a double press is ignored",
  result && { double: result.stewDoubleGuarded.stew, ready: result.stewReady.stew });
check(result && result.serveDoubleGuarded.stew.status === "cooking" && result.stewServed.stew.status === "served",
  "the following deliberate Enter serves the ready stew", result && result.stewServed);
check(result && result.sunsetting.stargazing.sunsetting && result.sunsetting.dusk &&
  !result.sunsetGuarded.stargazing.open && result.sunsetGuarded.active && result.builderOpen.stargazing.open,
  "the next Enter starts sunset while intervening presses stay inert until the builder opens",
  result && { start: result.sunsetting, guarded: result.sunsetGuarded, open: result.builderOpen });
var expected = [];
for (var i = 1; i <= 19; i++) expected.push({
  cassiopeia: Math.min(5, i),
  "ursa-major": Math.min(7, Math.max(0, i - 5)),
  "ursa-minor": Math.min(7, Math.max(0, i - 12))
});
check(result && result.starSteps.length === 19 && result.starSteps.every(function (step, index) {
  return step.before === index && step.after === index + 1 && step.active && step.prevented &&
    JSON.stringify(step.progress) === JSON.stringify(expected[index]) && step.open === (index < 18);
}), "exactly 19 Enter presses reveal one deterministic trace step apiece and never exit Camping",
  result && result.starSteps);
check(result && result.complete.active && result.complete.stargazing.complete && !result.complete.stargazing.open &&
  result.completeInert.active && result.completeInert.stargazing.complete &&
  JSON.stringify(result.completeInert.stargazing.progress) === JSON.stringify(result.complete.stargazing.progress),
  "completed Camping owns Enter as an inert action and remains open", result && result.completeInert);
check(result && result.prevented.every(Boolean), "every campsite-owned Enter is consumed before global navigation", result && result.prevented);

if (failures) process.exit(1);
console.log("Campsite Enter solve-walker assertions passed.");
