#!/usr/bin/env node
// Highway speed-limit and police event: warning, tolerance, pursuit, pull-over, and run-ending cases.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return window.__entranceRoomState(); }
  function trip() { return state().drive.roadtrip; }
  function step(ms, count) {
    for (var i = 0; i < (count || 1); i++) window.__entranceDriveStep(ms);
  }
  function setMotion(speed, gear) {
    window.__entranceDriveControl("throttle", false);
    window.__entranceDriveControl("brake", false);
    return window.__entranceDriveSetMotion(speed, gear);
  }
  function meetPolice(speed, pendingFeedback) {
    setMotion(speed, speed >= 180 ? 4 : 3);
    window.__entranceRoadtripPolice(150);
    var stationAt = trip().police.stationAt;
    window.__entranceRoadtripSetDistance(stationAt - 6);
    if (pendingFeedback) window.__flashCaptionKey(pendingFeedback, 10000, "entrance-roadtrip");
    window.__entranceRoadtripPoliceDetect(speed);
    return copy(trip());
  }
  function prepareEncounter() {
    window.__entranceRoadtripStart();
    window.__entranceRoadtripSetLane(.5);
    setMotion(0, 0);
  }
  async function run() {
    try {
      window.__unlockAllRooms();
      window.goToStage("balcony");
      window.__openEntranceRoom();
      await sleep(40);
      window.__openEntrancePorscheDriveHud();
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripStart();
      report.steps.contract = {
        hook: typeof window.__entranceRoadtripPolice,
        detectHook: typeof window.__entranceRoadtripPoliceDetect,
        pursuitStepHook: typeof window.__entranceRoadtripPoliceStep,
        speedLimit: trip().speedLimit,
        enforcementSpeed: trip().enforcementSpeed,
        firstDistance: trip().policeFirstDistance,
        warningAhead: trip().policeWarningAhead,
        warningHeadroom: trip().policeWarningHeadroom,
        repeatDistance: trip().policeRepeatDistance,
        escapeSpeed: trip().policeEscapeSpeed,
        pursuitSpeed: trip().policePursuitSpeed,
        escapeDistance: trip().policeEscapeDistance,
        stoppedBeat: trip().policeStoppedBeat,
        arrestDuration: trip().policeArrestDuration,
        speedSign: !!document.getElementById("entrance-roadtrip-speed-90"),
        speedFurniture: Array.prototype.some.call(document.querySelectorAll("#entrance-roadtrip-furniture use"), function (node) {
          return (node.getAttribute("href") || node.getAttribute("xlink:href")) === "#entrance-roadtrip-speed-90";
        })
      };

      setMotion(110, 3);
      window.__entranceRoadtripPolice();
      var warningLead = trip().police.stationAt - trip().distance;
      step(200, 7);
      report.steps.warning = {
        police: copy(trip().police),
        lead: warningLead,
        warningVisible: document.querySelector(".entrance-roadtrip-police-warning").getAttribute("visibility"),
        roadsideVisible: trip().police.roadsideVisible
      };
      window.__entranceRoadtripSetDistance(trip().police.stationAt - 6);
      step(1000, 2);
      report.steps.warningHeadroom = copy(trip().police);
      step(1000, 2);
      report.steps.tolerated = copy(trip());

      report.steps.fineSchedule = [111, 120, 130, 140, 141].map(function (speed) {
        prepareEncounter();
        return { speed: speed, police: meetPolice(speed).police };
      });

      prepareEncounter();
      var pursuit = meetPolice(130);
      report.steps.pursuit = {
        trip: pursuit,
        mirror: document.querySelector(".entrance-roadtrip-police-mirror").getAttribute("visibility"),
        instruction: document.getElementById("hunt-caption").textContent.trim()
      };
      document.hasFocus = function () { return false; };
      window.dispatchEvent(new Event("blur"));
      await sleep(60);
      report.steps.unfocused = copy(trip().police);
      document.hasFocus = function () { return true; };
      window.dispatchEvent(new Event("focus"));
      await sleep(80);
      report.steps.refocused = copy(trip().police);
      window.__entranceRoadtripSetLane(2);
      window.__flashCaptionKey("entrance_roadtrip_heart", 10000, "entrance-roadtrip");
      setMotion(0, 0);
      step(1000);
      report.steps.stopped = {
        trip: copy(trip()),
        caption: document.getElementById("hunt-caption").textContent.trim(),
        flash: window.__flashCaptionState()
      };

      prepareEncounter();
      meetPolice(145);
      window.__entranceRoadtripSetLane(2);
      setMotion(0, 0);
      step(1000);
      var courtStopped = copy(trip());
      var courtStoppedCaption = document.getElementById("hunt-caption").textContent.trim();
      var arrestEscapeIgnored = window.__exitEntranceRoadtrip();
      window.__entranceRoadtripPoliceStep(0, 1);
      var courtApproach = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 1.5);
      var courtKnock = copy(trip());
      window.__entranceRoadtripPoliceStep(0, .8);
      var courtCard = copy(trip());
      window.setLang("cs");
      var courtCzech = {
        kicker: document.getElementById("entrance-roadtrip-arrest-kicker").textContent.trim(),
        title: document.getElementById("entrance-roadtrip-arrest-title").textContent.trim(),
        line: document.getElementById("entrance-roadtrip-arrest-line").textContent.trim()
      };
      document.hasFocus = function () { return false; };
      window.dispatchEvent(new Event("blur"));
      window.__entranceRoadtripPoliceStep(0, 1);
      var courtPaused = copy(trip());
      document.hasFocus = function () { return true; };
      window.dispatchEvent(new Event("focus"));
      window.setLang("en");
      window.__entranceRoadtripPoliceStep(0, 2);
      var courtFade = copy(trip());
      window.__entranceRoadtripPoliceStep(0, .6);
      report.steps.courtStop = {
        stopped: courtStopped,
        stoppedCaption: courtStoppedCaption,
        escapeIgnored: arrestEscapeIgnored,
        approach: courtApproach,
        knock: courtKnock,
        card: courtCard,
        czech: courtCzech,
        paused: courtPaused,
        fade: courtFade,
        trip: copy(trip()),
        hudOpen: state().drive.hud,
        caption: document.getElementById("hunt-caption").textContent.trim()
      };

      prepareEncounter();
      meetPolice(200);
      window.__entranceRoadtripPoliceStep(200, 6);
      var twoHundredSix = copy(trip());
      window.__entranceRoadtripPoliceStep(200, 1);
      var twoHundredSeven = copy(trip());

      prepareEncounter();
      meetPolice(180);
      window.__entranceRoadtripPoliceStep(180, 19);
      var oneEightyNineteen = copy(trip());
      window.__entranceRoadtripPoliceStep(180, 1);
      var oneEightyTwenty = copy(trip());

      prepareEncounter();
      var fastPursuit = meetPolice(180);
      var fastInitialScale = fastPursuit.police.mirrorScale;
      var fastInitialSiren = fastPursuit.police.sirenLevel;
      window.__entranceRoadtripPoliceStep(180, 5);
      var brieflyFast = copy(trip());
      window.__entranceRoadtripPoliceStep(179, 1);
      var recovered = copy(trip());
      window.__flashCaptionKey("entrance_roadtrip_kiss", 10000, "entrance-roadtrip");
      window.__entranceRoadtripPoliceStep(180, 20);
      report.steps.escaped = {
        detected: fastPursuit,
        initialScale: fastInitialScale,
        initialSiren: fastInitialSiren,
        twoHundredSix: twoHundredSix,
        twoHundredSeven: twoHundredSeven,
        oneEightyNineteen: oneEightyNineteen,
        oneEightyTwenty: oneEightyTwenty,
        brieflyFast: brieflyFast,
        recovered: recovered,
        cleared: copy(trip()),
        caption: document.getElementById("hunt-caption").textContent.trim(),
        flash: window.__flashCaptionState()
      };

      prepareEncounter();
      var severe = meetPolice(150, "entrance_roadtrip_heart");
      window.__entranceRoadtripPoliceStep(140, 20);
      var captureStart = { trip: copy(trip()), speed: state().drive.speed };
      var captureCheckpoint = window.__captureCheckpointSystems().entrance.drive.roadtrip;
      window.__entranceRoadtripPoliceStep(0, 1);
      var captureOne = { trip: copy(trip()), speed: state().drive.speed };
      window.__entranceRoadtripPoliceStep(0, 1);
      var captureTwo = { trip: copy(trip()), speed: state().drive.speed };
      window.__entranceRoadtripPoliceStep(0, 1);
      var capturedStop = { trip: copy(trip()), speed: state().drive.speed };
      window.__entranceRoadtripPoliceStep(0, 1);
      var arrestBeat = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 5);
      report.steps.severe = {
        detected: severe,
        captureStart: captureStart,
        captureOne: captureOne,
        captureTwo: captureTwo,
        capturedStop: capturedStop,
        arrestBeat: arrestBeat,
        checkpoint: captureCheckpoint,
        trip: copy(trip()),
        immediateCaption: document.getElementById("hunt-caption").textContent.trim(),
        immediateFlash: window.__flashCaptionState()
      };
      await sleep(5400);
      report.steps.severe.finalCaption = document.getElementById("hunt-caption").textContent.trim();
      report.steps.severe.finalFlash = window.__flashCaptionState();

      prepareEncounter();
      meetPolice(130);
      window.__exitEntranceRoadtrip();
      var refusedCapture = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 3);
      window.__entranceRoadtripPoliceStep(0, 2);
      report.steps.refused = { capture: refusedCapture, trip: copy(trip()) };

      window.setLang("cs");
      prepareEncounter();
      meetPolice(180);
      window.__entranceRoadtripPoliceStep(180, 1);
      report.steps.czech = window.T && window.T.cs && window.T.cs.hunt ? {
        escape: window.T.cs.hunt.entrance_roadtrip_police_escape,
        fine: window.T.cs.hunt.entrance_roadtrip_police_ticket,
        court: window.T.cs.hunt.entrance_roadtrip_police_summons
      } : null;

      prepareEncounter();
      meetPolice(145);
      window.__entranceRoadtripSetLane(2);
      setMotion(0, 0);
      step(1000);
      window.__entranceRoadtripPoliceStep(0, 3.2);
      var teardownBefore = copy(trip());
      window.__closeEntranceRoom();
      var teardownClosed = copy(state());
      window.__resetCheckpointSystems();
      report.steps.teardown = {
        before: teardownBefore,
        closed: teardownClosed,
        reset: copy(state())
      };
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () { setTimeout(run, 180); });
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

console.log("rsvp.html highway police:");
var result = lib.runPageSync("rsvp.html", HARNESS, 10000, {
  forceMotion: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.contract && s.contract.hook === "function" && s.contract.detectHook === "function" &&
  s.contract.pursuitStepHook === "function" &&
  s.contract.speedLimit === 90 &&
  s.contract.enforcementSpeed === 110 &&
  s.contract.firstDistance === 950 && s.contract.warningAhead === 240 &&
  s.contract.warningHeadroom === 3 && s.contract.repeatDistance === 1200 &&
  s.contract.escapeSpeed === 180 && s.contract.pursuitSpeed === 170 &&
  s.contract.escapeDistance === 55 && s.contract.stoppedBeat === 1.25 &&
  s.contract.arrestDuration === 5.8 &&
  s.contract.speedSign && s.contract.speedFurniture,
  "the highway posts 90/110 enforcement and models the 180/170 escape pace", s.contract);
check(s.warning && s.warning.police.warningFlashCount === 3 &&
  s.warning.warningVisible === "visible" && !s.warning.roadsideVisible && s.warning.lead === 240 &&
  s.warning.lead / (s.contract.enforcementSpeed / 3.6) - 1.4 >= s.contract.warningHeadroom,
  "one oncoming vehicle gives exactly three high-beam flashes with a longer braking runway", s.warning);
check(s.warningHeadroom && s.warningHeadroom.phase === "warning" &&
  s.warningHeadroom.warningElapsed < 4.4,
  "the trap cannot measure speed until three seconds after the final flash", s.warningHeadroom);
check(s.tolerated && s.tolerated.active && s.tolerated.police.phase === "cooldown" &&
  s.tolerated.police.detectedSpeed <= 110 && s.tolerated.police.pursuits === 0 &&
  s.tolerated.police.tickets === 0 && s.tolerated.police.fines === 0,
  "110 km/h is tolerated without a pursuit or ticket", s.tolerated);
check(s.fineSchedule && JSON.stringify(s.fineSchedule.map(function (entry) {
  return [entry.police.overLimit, entry.police.fine, entry.police.courtRequired];
})) === JSON.stringify([
  [21, 238, false], [30, 324, false], [40, 560, false], [50, 744, false], [51, null, true]
]) && s.fineSchedule.every(function (entry) { return entry.police.phase === "pursuit"; }),
  "Alberta's exact fines remain and every enforced speed, including 51-over, starts pursuit",
  s.fineSchedule);
check(s.pursuit && s.pursuit.trip.police.phase === "pursuit" &&
  s.pursuit.trip.police.detectedSpeed === 130 && s.pursuit.trip.police.fine === 560 &&
  s.pursuit.trip.police.sirenActive && s.pursuit.trip.police.mirrorVisible &&
  s.pursuit.mirror === "visible",
  "speed above tolerance starts a scaled-fine pursuit with siren and a rearview police car", s.pursuit);
check(s.unfocused && !s.unfocused.sirenActive && s.refocused && s.refocused.sirenActive,
  "the pursuit siren tears down while unfocused and returns only when attended", {
    unfocused: s.unfocused, refocused: s.refocused
  });
check(s.stopped && s.stopped.trip.active && s.stopped.trip.police.phase === "cooldown" &&
  s.stopped.trip.police.stops === 1 && s.stopped.trip.police.tickets === 1 &&
  s.stopped.trip.police.fines === 560 && s.stopped.trip.police.scorePenalties === 560 &&
  !s.stopped.trip.police.sirenActive &&
  !s.stopped.trip.police.mirrorVisible && !s.stopped.trip.police.arrestVisible &&
  /40 km\/h over · \$560 fine/.test(s.stopped.caption) &&
  !s.stopped.flash,
  "the roadside outcome uses the recorded overage before the scaled fine", s.stopped);
check(s.courtStop && s.courtStop.stopped.active &&
  s.courtStop.stopped.police.phase === "arrest" && s.courtStop.stopped.police.tickets === 0 &&
  s.courtStop.stopped.police.summonses === 0 && s.courtStop.stopped.police.sirenActive &&
  s.courtStop.stopped.police.mirrorVisible && s.courtStop.stopped.police.arrestVisible &&
  s.courtStop.stopped.police.arrestCardOpacity === 0 &&
  /officer approaching/.test(s.courtStop.stoppedCaption) && s.courtStop.escapeIgnored &&
  s.courtStop.approach.active && s.courtStop.approach.police.phase === "arrest" &&
  s.courtStop.approach.police.arrestOfficerTransform !== s.courtStop.stopped.police.arrestOfficerTransform &&
  s.courtStop.knock.police.arrestKnockPlayed && !s.courtStop.knock.police.arrestRadioPlayed &&
  s.courtStop.card.police.arrestKnockPlayed && s.courtStop.card.police.arrestRadioPlayed &&
  s.courtStop.card.police.arrestCardOpacity > .9 &&
  s.courtStop.czech.kicker === "SILNIČNÍ KONTROLA" &&
  s.courtStop.czech.title === "PŘEDVOLÁNÍ K SOUDU" &&
  /Překročení o 55 km\/h · povinná účast/.test(s.courtStop.czech.line) &&
  s.courtStop.paused.police.arrestElapsed === s.courtStop.card.police.arrestElapsed &&
  !s.courtStop.paused.police.sirenActive && s.courtStop.paused.police.arrestAudioVoices === 0 &&
  s.courtStop.fade.active && s.courtStop.fade.police.arrestOpacity > 0 &&
  s.courtStop.fade.police.arrestOpacity < 1 && !s.courtStop.trip.active && s.courtStop.hudOpen &&
  s.courtStop.trip.police.phase === "ended" && s.courtStop.trip.police.runEnded &&
  s.courtStop.trip.police.endReason === "court" && s.courtStop.trip.police.overLimit === 55 &&
  s.courtStop.trip.police.fine === null && s.courtStop.trip.police.courtRequired &&
  s.courtStop.trip.police.summonses === 1 && s.courtStop.trip.police.tickets === 1 &&
  s.courtStop.trip.police.fines === 0 && !s.courtStop.trip.police.sirenActive &&
  /55 km\/h over · court summons/.test(s.courtStop.caption),
  "court-only arrest approaches, sounds, translates, pauses unattended, then fades to the block",
  s.courtStop);
check(s.escaped && s.escaped.detected.active && s.escaped.detected.police.phase === "pursuit" &&
  s.escaped.detected.police.detectedSpeed === 180 &&
  s.escaped.twoHundredSix.police.phase === "pursuit" &&
  s.escaped.twoHundredSix.police.escapeGap > 49 && s.escaped.twoHundredSix.police.escapeGap < 51 &&
  s.escaped.twoHundredSix.police.mirrorScale < s.escaped.initialScale &&
  s.escaped.twoHundredSeven.police.phase === "cooldown" &&
  s.escaped.oneEightyNineteen.police.phase === "pursuit" &&
  s.escaped.oneEightyNineteen.police.escapeGap > 52 && s.escaped.oneEightyNineteen.police.escapeGap < 54 &&
  s.escaped.oneEightyTwenty.police.phase === "cooldown" &&
  s.escaped.brieflyFast.police.phase === "pursuit" &&
  s.escaped.brieflyFast.police.escapeGap > 0 &&
  s.escaped.brieflyFast.police.sirenLevel < s.escaped.initialSiren &&
  s.escaped.recovered.police.phase === "pursuit" &&
  s.escaped.recovered.police.escapeGap < s.escaped.brieflyFast.police.escapeGap &&
  s.escaped.recovered.police.mirrorScale > s.escaped.brieflyFast.police.mirrorScale &&
  s.escaped.recovered.police.sirenLevel > s.escaped.brieflyFast.police.sirenLevel &&
  s.escaped.recovered.police.refusalElapsed === 1 &&
  s.escaped.cleared.active && s.escaped.cleared.police.phase === "cooldown" &&
  s.escaped.cleared.police.escapes === 1 && !s.escaped.cleared.police.sirenActive &&
  !s.escaped.cleared.police.mirrorVisible && s.escaped.cleared.police.tickets === 0 &&
  /Police lost/.test(s.escaped.caption) && !s.escaped.flash,
  "the 55 m gap takes about 20 seconds at 180 and 7 at 200, while 179 lets pursuit recover",
  s.escaped);
check(s.severe && s.severe.detected.active && s.severe.detected.police.phase === "pursuit" &&
  s.severe.detected.police.detectedSpeed === 150 && s.severe.detected.police.courtRequired &&
  s.severe.detected.police.sirenActive && s.severe.detected.police.mirrorVisible &&
  s.severe.captureStart.trip.active && s.severe.captureStart.trip.police.phase === "capture" &&
  s.severe.captureStart.trip.police.captureStartSpeed === 140 &&
  s.severe.captureOne.speed > 0 && s.severe.captureOne.speed < 140 &&
  s.severe.captureTwo.speed >= 0 && s.severe.captureTwo.speed < s.severe.captureOne.speed &&
  s.severe.captureOne.trip.police.sirenActive && s.severe.captureOne.trip.police.mirrorVisible &&
  s.severe.capturedStop.trip.active && s.severe.capturedStop.speed === 0 &&
  s.severe.capturedStop.trip.police.phase === "arrest" && s.severe.capturedStop.trip.police.tickets === 0 &&
  s.severe.capturedStop.trip.police.sirenActive && s.severe.capturedStop.trip.police.mirrorVisible &&
  s.severe.capturedStop.trip.police.arrestVisible &&
  s.severe.arrestBeat.active && s.severe.arrestBeat.police.phase === "arrest" &&
  s.severe.arrestBeat.police.arrestElapsed === 1 &&
  s.severe.checkpoint && !Object.prototype.hasOwnProperty.call(s.severe.checkpoint, "police") &&
  s.severe.checkpoint.accepted === false && !s.severe.trip.active && s.severe.trip.police.runEnded &&
  s.severe.trip.police.endReason === "refused" &&
  s.severe.trip.police.tickets === 1 && s.severe.trip.police.fine === null &&
  s.severe.trip.police.courtRequired && s.severe.trip.police.summonses === 1 &&
  s.severe.trip.police.fines === 0 && s.severe.trip.police.scorePenalties === 1000 &&
  /highway run over/.test(s.severe.immediateCaption) &&
  s.severe.finalCaption === s.severe.immediateCaption &&
  !s.severe.immediateFlash && !s.severe.finalFlash &&
  !/collected|multiplier/.test(s.severe.finalCaption),
  "court-speed capture progressively stops in-scene before citation, parking, or checkpointing",
  s.severe);
check(s.refused && s.refused.capture.active && s.refused.capture.police.phase === "capture" &&
  s.refused.capture.police.sirenActive && s.refused.capture.police.mirrorVisible &&
  !s.refused.trip.active && s.refused.trip.police.runEnded &&
  s.refused.trip.police.endReason === "refused" && s.refused.trip.police.fines === 560 &&
  s.refused.trip.police.scorePenalties === 1560 && !s.refused.trip.police.arrestVisible,
  "ordinary refusal captures without the court-only arrest scene", s.refused);
check(s.czech && /180\+/.test(s.czech.escape) &&
  /^Překročení o \{over\} km\/h · pokuta \$\{fine\}\.$/.test(s.czech.fine) &&
  /^Překročení o \{over\} km\/h · předvolání k soudu\.$/.test(s.czech.court),
  "escape and recorded-overage outcomes are mirrored in natural Czech order", s.czech);
check(s.teardown && s.teardown.before.active && s.teardown.before.police.phase === "arrest" &&
  s.teardown.before.police.arrestVisible && s.teardown.before.police.arrestAudioVoices > 0 &&
  !s.teardown.closed.open && !s.teardown.closed.drive.roadtrip.active &&
  s.teardown.closed.drive.roadtrip.police.phase === "idle" &&
  !s.teardown.closed.drive.roadtrip.police.arrestVisible &&
  s.teardown.closed.drive.roadtrip.police.arrestAudioVoices === 0 &&
  !s.teardown.reset.drive.roadtrip.active && !s.teardown.reset.drive.roadtrip.police.arrestVisible &&
  s.teardown.reset.drive.roadtrip.police.arrestAudioVoices === 0,
  "room close and full reset tear down arrest state, visuals, siren, and one-shots", s.teardown);

if (failures) {
  console.log("\n" + failures + " highway-police assertion(s) failed.");
  process.exit(1);
}
console.log("\nHighway-police assertions passed.");
