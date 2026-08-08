#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function ids() {
    var wanted = ["downstairs_entrance", "downstairs_roadtrip_where",
      "downstairs_roadtrip_journey", "downstairs_roadtrip_go"];
    return window.__phoneMessageThread().filter(function (id) { return wanted.indexOf(id) !== -1; });
  }
  function actions() {
    return window.__checkpointPhoneCapture().rows.filter(function (row) {
      return ids().indexOf(row.id) !== -1;
    }).map(function (row) { return [row.id, row.message.act]; });
  }
  function snapshot(label) {
    report.steps.push({
      label: label,
      ids: ids(),
      actions: actions(),
      bridge: copy(window.__partyLifecycleState()),
      roadtrip: copy(window.__entranceRoomState().drive.roadtrip)
    });
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  async function continueCheckpoint() {
    var gate = document.getElementById("loft-recovery-gate");
    if (!gate) throw new Error("missing recovery gate");
    gate.querySelector(".loft-recovery-btn.primary").click();
    await sleep(520);
  }
  function saveAndReload(next) {
    if (!window.__saveLoftCheckpoint()) throw new Error("checkpoint save failed at " + next);
    sessionStorage.setItem("room-roadtrip-bridge-step", next);
    sessionStorage.setItem("room-roadtrip-bridge-report", JSON.stringify(report));
    location.reload();
  }
  async function fresh() {
    window.__endAttract();
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "dungeon", "cinema", "bedroom", "entrance"]);
    window.goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    var earlyStart = window.__entranceRoadtripStart();
    var earlyChooser = window.__entranceRoadtripOpenChooser();
    report.steps.push({ label: "nine", earlyStart: earlyStart, earlyChooser: earlyChooser,
      ids: ids(), roadtrip: copy(window.__entranceRoomState().drive.roadtrip) });
    var forged = window.__captureCheckpointSystems();
    forged.entrance.drive.roadtrip.unlocked = true;
    forged.entrance.drive.roadtrip.invitationReady = true;
    forged.entrance.drive.roadtrip.routeChooserOpen = true;
    window.__restoreCheckpointSystems(forged, "beforeStage");
    window.__restoreCheckpointSystems(forged, "afterStage");
    report.steps.push({ label: "forged-nine", roadtrip: copy(window.__entranceRoomState().drive.roadtrip) });
    window.__hideEntrancePorscheDriveHud();
    window.__closeEntranceRoom();

    window.__setPartyMode(true);
    window.__setPartyMode(false, true);
    await sleep(80);
    snapshot("party-off-nine");
    window.__markRoomSeen("bathroom");
    await sleep(80);
    snapshot("ten-first-beat");
    saveAndReload("where");
  }
  async function resumed(step) {
    report = JSON.parse(sessionStorage.getItem("room-roadtrip-bridge-report") || "{}") || report;
    report.steps = report.steps || [];
    report.errors = report.errors || [];
    await continueCheckpoint();
    if (step === "where") {
      snapshot("where-restored-before");
      await sleep(2050);
      snapshot("where-restored-after");
      saveAndReload("journey");
      return;
    }
    if (step === "journey") {
      snapshot("journey-restored-before");
      await sleep(2450);
      snapshot("journey-restored-after");
      saveAndReload("go");
      return;
    }
    snapshot("go-restored-before");
    await sleep(2850);
    snapshot("go-restored-after");
    window.__runMsgAction("downstairs_roadtrip_go");
    await sleep(900);
    var entrance = window.__entranceRoomState();
    report.steps.push({ label: "go-action", room: window.currentStageName,
      entranceOpen: !!window.__entranceRoomOpen, hud: entrance.drive.hudOpen,
      roadtrip: copy(entrance.drive.roadtrip) });
    window.__openEntrancePorscheDriveHud();
    report.steps.push({ label: "hud", roadtrip: copy(window.__entranceRoomState().drive.roadtrip),
      chooserOpened: window.__entranceRoadtripOpenChooser() });
    sessionStorage.removeItem("room-roadtrip-bridge-step");
    sessionStorage.removeItem("room-roadtrip-bridge-report");
    finish();
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      var step = sessionStorage.getItem("room-roadtrip-bridge-step");
      (step ? resumed(step) : fresh()).catch(function (error) {
        report.errors.push(String(error && error.stack || error));
        finish();
      });
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 15000, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?fresh=room-roadtrip-bridge#play",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail))); }
}
function step(label) {
  return result && result.steps && result.steps.find(function (row) { return row.label === label; });
}

console.log("rsvp.html room exploration → Road Trip bridge:");
check(result && result.errors.length === 0, "the multi-reload probe has no page errors", result && result.errors);
var nine = step("nine"), partyOff = step("party-off-nine"), first = step("ten-first-beat");
check(nine && !nine.earlyStart && !nine.earlyChooser && !nine.roadtrip.unlocked &&
  !nine.roadtrip.invitationReady && !nine.roadtrip.routeChooserOpen,
  "nine seen rooms cannot start, offer, or select Road Trip", nine);
var forged = step("forged-nine");
check(forged && !forged.roadtrip.unlocked && !forged.roadtrip.invitationReady &&
  !forged.roadtrip.routeChooserOpen && !forged.roadtrip.invitationVisible,
  "checkpoint restore cannot forge an early Road Trip unlock or chooser", forged);
check(partyOff && partyOff.ids.length === 0 && partyOff.bridge.roomMapCoachActive &&
  !partyOff.bridge.roadtripInviteDelivered,
  "party teardown at 9/10 points back to loft exploration and sends no invitation", partyOff);
check(first && first.ids.join(",") === "downstairs_entrance" && first.roadtrip.explorationComplete &&
  first.roadtrip.unlocked && first.roadtrip.invitationReady && !first.bridge.roadtripInviteDelivered,
  "the tenth room is the sole unlock and starts only the first exchange beat", first);

var whereBefore = step("where-restored-before"), whereAfter = step("where-restored-after");
var journeyBefore = step("journey-restored-before"), journeyAfter = step("journey-restored-after");
var goBefore = step("go-restored-before"), goAfter = step("go-restored-after");
check(whereBefore && whereBefore.ids.length === 1 && whereAfter &&
  whereAfter.ids.join(",") === "downstairs_entrance,downstairs_roadtrip_where",
  "reload after ‘Fancy a road trip?’ resumes with exactly ‘Where to?’", { before: whereBefore, after: whereAfter });
check(journeyBefore && journeyBefore.ids.length === 2 && journeyAfter &&
  journeyAfter.ids.join(",") === "downstairs_entrance,downstairs_roadtrip_where,downstairs_roadtrip_journey",
  "reload after ‘Where to?’ resumes with exactly ‘The journey is the destination.’",
  { before: journeyBefore, after: journeyAfter });
check(goBefore && goBefore.ids.length === 3 && goAfter &&
  goAfter.ids.join(",") === "downstairs_entrance,downstairs_roadtrip_where,downstairs_roadtrip_journey,downstairs_roadtrip_go" &&
  goAfter.bridge.roadtripInviteDelivered,
  "reload after the motto resumes with one final ‘Let’s go!’", { before: goBefore, after: goAfter });
check(goAfter && goAfter.actions.length === 4 && goAfter.actions.slice(0, 3).every(function (row) { return !row[1]; }) &&
  goAfter.actions[3][1] === "lower:entrance",
  "only ‘Let’s go!’ carries an action", goAfter && goAfter.actions);
var action = step("go-action"), hud = step("hud");
check(action && action.room === "balcony" && action.entranceOpen && !action.hud,
  "‘Let’s go!’ opens Entrance without opening or starting the dashboard", action);
check(hud && hud.roadtrip.unlocked && hud.roadtrip.invitationReady && hud.roadtrip.invitationVisible &&
  hud.chooserOpened,
  "opening the road/HUD immediately presents the unlocked route chooser", hud);

if (failures) process.exit(1);
console.log("Room exploration → Road Trip bridge assertions passed.");
