#!/usr/bin/env node
// Document-level Enter walks Camping without presenting its interactive fire/stargazing builders,
// then preserves the ready wisdom handoff.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<style>#entrance-roadtrip-stargazing-game *,#entrance-roadtrip-camp-wisdom{transition:none!important}</style>
<script>
(function () {
  var report = { errors: [], prevented: [] };
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
      fireBuilderOpen: document.getElementById("entrance-roadtrip-fire-game").classList.contains("open"),
      fireBuilderFocused: document.getElementById("entrance-roadtrip-fire-game").contains(document.activeElement),
      stewCrateAvailable: document.getElementById("entrance-roadtrip-camp").classList.contains("stew-crate-available"),
      stew: window.__entranceRoadtripCampStewState(),
      stargazing: window.__entranceRoadtripCampStargazingState(),
      dusk: document.getElementById("stage-balcony").classList.contains("dusk"),
      sunsetAnimating: document.getElementById("entrance-roadtrip-camp").classList.contains("stargazing-sunset"),
      caption: window.__captionKey && window.__captionKey(),
      wisdomShown: document.getElementById("entrance-roadtrip-camp-wisdom").classList.contains("show"),
      tentOpen: document.getElementById("entrance-roadtrip-camp-tent").classList.contains("open")
    };
  }
  async function run() {
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.goToStage("balcony");
    await sleep(220);
    window.__openEntranceRoom();
    document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
    window.__openEntrancePorscheDriveHud();
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("camp", 0);
    window.__setDayNight(false);
    await sleep(220);
    report.initial = snap();

    document.getElementById("entrance-roadtrip-camp-empty-pit").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    report.pointerFireBuilder = snap();
    document.getElementById("entrance-roadtrip-fire-close").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    document.querySelector(".hunt-viewport").focus();

    enter(false);
    report.fireStarting = snap();
    enter(true);
    enter(false);
    report.fireGuarded = snap();
    await sleep(1150);
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
    var stargazingStart = window.__captureCheckpointSystems().entrance;
    await sleep(190);
    enter(false);
    report.stargazingSkipped = snap();
    var completedCheckpoint = window.__captureCheckpointSystems().entrance;
    window.__restoreCheckpointSystems({ entrance: stargazingStart }, "afterStage");
    window.__setDayNight(false);
    document.getElementById("entrance-roadtrip-camp-sky-hit").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    report.pointerSunsetting = snap();
    await sleep(1620);
    report.pointerTraceOpen = snap();
    window.__entranceRoadtripCampStargazingClose();
    window.__restoreCheckpointSystems({ entrance: completedCheckpoint }, "afterStage");
    window.__setDayNight(true);
    await sleep(180);
    report.complete = snap();
    enter(false);
    report.completeInert = snap();
    await sleep(180);

    var checkpoint = window.__captureCheckpointSystems().entrance;
    checkpoint.drive.roadtrip.stargazing.wisdomHandoffReady = true;
    window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
    await sleep(180);
    report.handoffReady = snap();
    enter(false);
    report.handoffAdvanced = snap();
    await sleep(180);
    enter(false);
    report.sleepStarted = snap();
    window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
    await sleep(180);
    document.getElementById("entrance-roadtrip-camp-wisdom-continue").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    report.handoffClickBaseline = snap();
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
check(result && result.pointerFireBuilder.fireBuilderOpen && result.pointerFireBuilder.fireBuilderFocused,
  "clicking the empty pit still opens and focuses the interactive fire builder",
  result && result.pointerFireBuilder);
check(result && result.fireStarting.active && result.fireStarting.igniting &&
  !result.fireStarting.fireBuilt && !result.fireStarting.fireLit &&
  !result.fireStarting.fireBuilderOpen && !result.fireStarting.fireBuilderFocused &&
  result.fireStarting.caption === "entrance_roadtrip_camp_fire_igniting",
  "one Enter immediately acknowledges ignition while keeping the canonical builder closed",
  result && result.fireStarting);
check(result && result.fireGuarded.igniting && !result.fireGuarded.fireBuilt &&
  !result.fireGuarded.stewCrateAvailable && result.fireReady.fireBuilt && result.fireReady.fireLit &&
  result.fireReady.stewCrateAvailable && result.fireReady.caption === "entrance_roadtrip_stew_invite",
  "repeat and double Enter cannot skip the one-second fire beat before the stew invitation",
  result && { guarded: result.fireGuarded, ready: result.fireReady });
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
check(result && result.stargazingSkipped.active && result.stargazingSkipped.dusk &&
  result.stargazingSkipped.stargazing.complete && !result.stargazingSkipped.stargazing.open &&
  !result.stargazingSkipped.sunsetAnimating &&
  Object.keys(result.stargazingSkipped.stargazing.progress).reduce(function (sum, name) {
    return sum + result.stargazingSkipped.stargazing.progress[name];
  }, 0) === 19 && result.stargazingSkipped.wisdomShown &&
  !result.stargazingSkipped.stargazing.wisdomHandoffReady,
  "one Enter finishes the canonical stargazing trace with its interactive overlay closed",
  result && result.stargazingSkipped);
check(result && result.pointerSunsetting.stargazing.sunsetting && result.pointerSunsetting.dusk &&
  result.pointerSunsetting.sunsetAnimating &&
  !result.pointerSunsetting.stargazing.complete && !result.pointerSunsetting.stargazing.open &&
  result.pointerTraceOpen.stargazing.open && !result.pointerTraceOpen.stargazing.complete,
  "clicking the sky still opens the interactive trace after sunset",
  result && { sunset: result.pointerSunsetting, open: result.pointerTraceOpen });
check(result && result.complete.active && result.complete.stargazing.complete && !result.complete.stargazing.open &&
  result.completeInert.active && result.completeInert.stargazing.complete &&
  JSON.stringify(result.completeInert.stargazing.progress) === JSON.stringify(result.complete.stargazing.progress),
  "completed Camping keeps Enter inert until the wisdom handoff is ready", result && result.completeInert);
check(result && result.handoffReady.active && result.handoffReady.wisdomShown &&
  result.handoffReady.stargazing.wisdomHandoffReady &&
  result.handoffReady.caption === "entrance_roadtrip_stargazing_continue" &&
  result.handoffAdvanced.active && !result.handoffAdvanced.wisdomShown &&
  result.handoffAdvanced.stargazing.wisdomDismissed &&
  !result.handoffAdvanced.stargazing.wisdomHandoffReady &&
  result.handoffAdvanced.stargazing.sleepPhase === "prompt" &&
  result.handoffAdvanced.caption === "entrance_roadtrip_camp_sleep_prompt" &&
  result.sleepStarted.active && result.sleepStarted.stargazing.sleepPhase === "fire-out" &&
  !result.sleepStarted.fireLit &&
  !result.handoffAdvanced.tentOpen && result.handoffClickBaseline.active &&
  result.handoffClickBaseline.wisdomShown === result.handoffAdvanced.wisdomShown &&
  result.handoffClickBaseline.caption === result.handoffAdvanced.caption &&
  result.handoffClickBaseline.tentOpen === result.handoffAdvanced.tentOpen &&
  JSON.stringify(result.handoffClickBaseline.stargazing) === JSON.stringify(result.handoffAdvanced.stargazing),
  "ready wisdom Enter exactly matches the click handoff without leaving Camping or activating its tent",
  result && { ready: result.handoffReady, enter: result.handoffAdvanced, click: result.handoffClickBaseline });
check(result && result.sleepStarted.active && result.sleepStarted.stargazing.sleepPhase === "fire-out" &&
  !result.sleepStarted.fireLit && result.sleepStarted.caption === "entrance_roadtrip_camp_sleep_prompt",
  "the next Enter accepts the sleep prompt and puts out the fire", result && result.sleepStarted);
check(result && result.prevented.every(Boolean), "every campsite-owned Enter is consumed before global navigation", result && result.prevented);

if (failures) process.exit(1);
console.log("Campsite Enter solve-walker assertions passed.");
