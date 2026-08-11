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
    window.__setSecondRound(false, { releaseHeld: false });
    window.__setSeenRooms([]);
    ["kitchen", "garden", "cuddly", "office", "balcony", "bathroom", "dungeon",
      "cinema", "bedroom", "entrance"].forEach(function (room) {
      window.__openDollhouse();
      document.querySelector('.loft-dollhouse-room[data-dollhouse-room="' + room + '"]').dispatchEvent(
        new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    });
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    report.steps.push({ label: "phase-one-ten",
      start: window.__entranceRoadtripStart(), chooser: window.__entranceRoadtripOpenChooser(),
      roadtrip: copy(window.__entranceRoomState().drive.roadtrip) });
    window.__hideEntrancePorscheDriveHud();
    window.__closeEntranceRoom();
    window.__setSecondRound(true, { releaseHeld: false });
    report.steps.push({ label: "phase-two-latched-ten",
      roadtrip: copy(window.__entranceRoomState().drive.roadtrip) });
    window.__setSecondRound(false, { releaseHeld: false });
    window.__resetPartyExitHint();
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "dungeon", "cinema", "bedroom", "entrance"]);
    window.__setSecondRound(true, { releaseHeld: false });
    window.__goToStage("balcony");
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
    window.__setPartyMode(true);
    window.__markRoomSeen("bathroom");
    await sleep(80);
    snapshot("party-on-ten-first-beat");
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    document.querySelector(".entrance-road-cursor").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
    report.steps.push({ label: "ignored-phone-click",
      entrance: copy(window.__entranceRoomState()), party: !!window.__gardenPartyOn });
    window.__hideEntrancePorscheDriveHud();
    window.__closeEntranceRoom();
    window.__setPartyMode(true);
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter", code: "Enter", bubbles: true, cancelable: true
    }));
    report.steps.push({ label: "ignored-phone-enter",
      entrance: copy(window.__entranceRoomState()), party: !!window.__gardenPartyOn });
    window.__hideEntrancePorscheDriveHud();
    window.__closeEntranceRoom();
    window.__setPartyMode(true);
    window.__consumePartyExitHint();
    report.steps.push({ label: "party-on-ten-auth",
      start: window.__entranceRoadtripStart(), chooser: window.__entranceRoadtripOpenChooser(),
      roadtrip: copy(window.__entranceRoomState().drive.roadtrip), party: !!window.__gardenPartyOn });
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
    await sleep(3900);
    var entrance = window.__entranceRoomState();
    report.steps.push({ label: "go-action", room: window.__currentStageName,
      entranceOpen: !!window.__entranceRoomOpen, hud: entrance.drive.hud,
      party: !!window.__gardenPartyOn,
      act: window.__actTwoState ? copy(window.__actTwoState()) : null,
      roadtrip: copy(entrance.drive.roadtrip) });
    window.__openEntrancePorscheDriveHud();
    report.steps.push({ label: "hud-coach", roadtrip: copy(window.__entranceRoomState().drive.roadtrip),
      coach: copy(window.__captureCheckpointSystems().entrance.drive.coach),
      chooserOpened: window.__entranceRoadtripOpenChooser() });
    document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    report.steps.push({ label: "hud-invite", roadtrip: copy(window.__entranceRoomState().drive.roadtrip),
      coach: copy(window.__captureCheckpointSystems().entrance.drive.coach),
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

var result = lib.runPageSync("loft-day.html", HARNESS, 15000, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?fresh=room-roadtrip-bridge",
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

console.log("loft-day.html room exploration → Road Trip bridge:");
check(result && result.errors.length === 0, "the multi-reload probe has no page errors", result && result.errors);
var nine = step("nine"), partyOff = step("party-off-nine"), first = step("party-on-ten-first-beat");
var phaseOneTen = step("phase-one-ten");
check(phaseOneTen && !phaseOneTen.start && !phaseOneTen.chooser &&
  !phaseOneTen.roadtrip.explorationComplete && !phaseOneTen.roadtrip.unlocked &&
  !phaseOneTen.roadtrip.invitationReady,
  "ten Phase 1 room visits cannot bypass the party into Road Trip", phaseOneTen);
var phaseTwoLatchedTen = step("phase-two-latched-ten");
check(phaseTwoLatchedTen && phaseTwoLatchedTen.roadtrip.explorationComplete &&
  phaseTwoLatchedTen.roadtrip.unlocked && phaseTwoLatchedTen.roadtrip.invitationReady,
  "latching Phase 2 honors ten already-seen rooms without requiring repeat visits",
  phaseTwoLatchedTen);
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
  !first.roadtrip.authorized && !first.roadtrip.unlocked && !first.roadtrip.invitationReady &&
  !first.bridge.roadtripInviteDelivered,
  "the tenth room can start the exchange during the party without authorizing Road Trip", first);
var partyOnAuth = step("party-on-ten-auth");
check(partyOnAuth && partyOnAuth.party && !partyOnAuth.start && !partyOnAuth.chooser &&
  !partyOnAuth.roadtrip.authorized && !partyOnAuth.roadtrip.unlocked,
  "Phase 2 plus 10/10 cannot launch or choose Road Trip while the party is active", partyOnAuth);
var ignoredClick = step("ignored-phone-click"), ignoredEnter = step("ignored-phone-enter");
check(ignoredClick && !ignoredClick.party && ignoredClick.entrance.drive.hud &&
  ignoredClick.entrance.drive.roadtrip.authorized && ignoredClick.entrance.drive.roadtrip.unlocked &&
  !ignoredClick.entrance.drive.roadtrip.invitationVisible,
  "clicking the road at 10/10 canonically ends an ignored party before opening the driving coach",
  ignoredClick);
check(ignoredEnter && !ignoredEnter.party && ignoredEnter.entrance.drive.hud &&
  ignoredEnter.entrance.drive.roadtrip.authorized && ignoredEnter.entrance.drive.roadtrip.unlocked &&
  !ignoredEnter.entrance.drive.roadtrip.invitationVisible,
  "global Enter at the road uses the same party-stop → driving-coach fallback", ignoredEnter);

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
var action = step("go-action"), hudCoach = step("hud-coach"), hudInvite = step("hud-invite");
check(action && action.room === "balcony" && action.entranceOpen && !action.hud &&
  !action.party && action.roadtrip.authorized && action.roadtrip.unlocked &&
  (!action.act || action.act.armed === false),
  "‘Let’s go!’ finishes the party/coda owner, then opens Entrance with the dashboard closed", action);
check(hudCoach && hudCoach.roadtrip.unlocked && hudCoach.roadtrip.invitationReady &&
  !hudCoach.roadtrip.invitationVisible && !hudCoach.chooserOpened &&
  hudCoach.coach && !hudCoach.coach.complete && !hudCoach.coach.dismissed,
  "a fresh HUD gives the driving coach sole attention before the Road Trip invitation", hudCoach);
check(hudInvite && hudInvite.coach && hudInvite.coach.dismissed &&
  hudInvite.roadtrip.invitationVisible && hudInvite.chooserOpened,
  "explicitly dismissing the driving coach hands attention straight to Road Trip", hudInvite);

if (failures) process.exit(1);
console.log("Room exploration → Road Trip bridge assertions passed.");
