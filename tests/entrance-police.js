#!/usr/bin/env node
// Highway police: warning, roadside-to-mirror pass, pursuit, pull-over, arrest, and run-ending cases.
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
  function mirrorSample() {
    var police = copy(trip().police);
    var match = /translate\((-?[\d.]+) (-?[\d.]+)\) scale\(([\d.]+)\)/.exec(police.mirrorTransform || "");
    return {
      police: police,
      x: match ? Number(match[1]) : null,
      y: match ? Number(match[2]) : null,
      scale: match ? Number(match[3]) : null
    };
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
    window.__entranceRoadtripSetDemerits(0, 0);
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
        demeritHook: typeof window.__entranceRoadtripDemeritsForSpeed,
        demeritSchedule: [1, 15, 16, 30, 31, 50, 51].map(window.__entranceRoadtripDemeritsForSpeed),
        speedLimit: trip().speedLimit,
        enforcementSpeed: trip().enforcementSpeed,
        firstDistance: trip().policeFirstDistance,
        warningAhead: trip().policeWarningAhead,
        warningHeadroom: trip().policeWarningHeadroom,
        repeatDistance: trip().policeRepeatDistance,
        escapeSpeed: trip().policeEscapeSpeed,
        pursuitSpeed: trip().policePursuitSpeed,
        escapeDistance: trip().policeEscapeDistance,
        escapeHoldSeconds: trip().policeEscapeHoldSeconds,
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

      prepareEncounter();
      var toleratedPass = meetPolice(110);
      var toleratedStation = toleratedPass.police.stationAt;
      window.__entranceRoadtripSetDistance(toleratedStation + 2);
      var toleratedMirrorNear = mirrorSample();
      window.__entranceRoadtripSetDistance(toleratedStation + 24);
      var toleratedMirrorMid = mirrorSample();
      window.__entranceRoadtripSetDistance(toleratedStation + 58);
      var toleratedMirrorFar = mirrorSample();
      window.__entranceRoadtripSetDistance(toleratedStation + 63);
      report.steps.toleratedMirror = {
        detection: toleratedPass,
        near: toleratedMirrorNear,
        mid: toleratedMirrorMid,
        far: toleratedMirrorFar,
        gone: mirrorSample()
      };

      report.steps.fineSchedule = [111, 120, 130, 140, 141].map(function (speed) {
        prepareEncounter();
        return { speed: speed, police: meetPolice(speed).police };
      });

      prepareEncounter();
      var pursuitDetection = meetPolice(130);
      var pursuitStation = pursuitDetection.police.stationAt;
      var pursuitRoadside = mirrorSample();
      window.__entranceRoadtripSetDistance(pursuitStation + 2);
      var pursuitJoinNear = mirrorSample();
      window.__entranceRoadtripSetDistance(pursuitStation + 12);
      var pursuitJoinMid = mirrorSample();
      window.__entranceRoadtripSetDistance(pursuitStation + 30);
      var pursuit = copy(trip());
      report.steps.pursuit = {
        trip: pursuit,
        roadside: pursuitRoadside,
        joinNear: pursuitJoinNear,
        joinMid: pursuitJoinMid,
        following: mirrorSample(),
        mirror: document.querySelector(".entrance-roadtrip-police-mirror").getAttribute("visibility"),
        instruction: document.getElementById("hunt-caption").textContent.trim()
      };
      document.hasFocus = function () { return false; };
      window.dispatchEvent(new Event("blur"));
      await sleep(60);
      report.steps.unfocused = copy(trip().police);
      document.hasFocus = function () { return true; };
      window.dispatchEvent(new Event("focus"));
      window.__entranceDriveControl("steerLeft", true);
      window.__entranceDriveControl("steerLeft", false);
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
      window.__entranceRoadtripSetDemerits(5, 0);
      meetPolice(120);
      window.__entranceRoadtripSetLane(2);
      setMotion(0, 0);
      step(1000);
      report.steps.demeritWarning = {
        trip: copy(trip()),
        caption: document.getElementById("hunt-caption").textContent.trim()
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
      window.__entranceDriveControl("steerLeft", true);
      window.__entranceDriveControl("steerLeft", false);
      window.setLang("en");
      window.__entranceRoadtripPoliceStep(0, 2);
      var courtFade = copy(trip());
      window.__entranceRoadtripPoliceStep(0, .6);
      var courtResolved = copy(trip());
      var courtResolvedCaption = document.getElementById("hunt-caption").textContent.trim();
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
        trip: courtResolved,
        returnOffer: copy(state()),
        hudOpen: state().drive.hud,
        caption: courtResolvedCaption
      };

      prepareEncounter();
      meetPolice(190);
      window.__entranceRoadtripSetLane(2);
      setMotion(0, 0);
      step(1000);
      window.__entranceRoadtripPoliceStep(0, 1.5);
      var exactlyHundredOver = copy(trip());

      prepareEncounter();
      meetPolice(191);
      window.__entranceRoadtripSetLane(2);
      setMotion(0, 0);
      step(1000);
      window.__entranceRoadtripPoliceStep(0, 1.5);
      var overHundredEnglish = copy(trip());
      window.setLang("cs");
      var overHundredCzech = copy(trip());
      document.hasFocus = function () { return false; };
      window.dispatchEvent(new Event("blur"));
      await sleep(60);
      var overHundredBlurred = copy(trip());
      document.hasFocus = function () { return true; };
      window.dispatchEvent(new Event("focus"));
      window.__entranceDriveControl("steerLeft", true);
      window.__entranceDriveControl("steerLeft", false);
      window.setLang("en");
      report.steps.shoutThreshold = {
        exactlyHundred: exactlyHundredOver,
        overHundredEnglish: overHundredEnglish,
        overHundredCzech: overHundredCzech,
        blurred: overHundredBlurred
      };

      prepareEncounter();
      var twoHundredDetection = meetPolice(200);
      window.__entranceRoadtripSetDistance(twoHundredDetection.police.stationAt + 30);
      window.__entranceRoadtripPoliceStep(200, 14);
      var twoHundredSix = copy(trip());
      window.__entranceRoadtripPoliceStep(200, 1);
      var twoHundredSeven = copy(trip());
      window.__entranceRoadtripPoliceStep(200, 10);
      var twoHundredHeld = copy(trip());

      prepareEncounter();
      var oneEightyDetection = meetPolice(180);
      window.__entranceRoadtripSetDistance(oneEightyDetection.police.stationAt + 30);
      window.__entranceRoadtripPoliceStep(180, 19);
      var oneEightyNineteen = copy(trip());
      window.__entranceRoadtripPoliceStep(180, 1);
      var oneEightyTwenty = copy(trip());

      prepareEncounter();
      var fastDetection = meetPolice(180);
      window.__entranceRoadtripSetDistance(fastDetection.police.stationAt + 30);
      var fastPursuit = copy(trip());
      var fastInitialScale = fastPursuit.police.mirrorScale;
      var fastInitialSiren = fastPursuit.police.sirenLevel;
      window.__entranceRoadtripPoliceStep(200, 15);
      var brieflyFast = copy(trip());
      window.__entranceRoadtripPoliceStep(150, 5);
      var recovered = copy(trip());
      window.__flashCaptionKey("entrance_roadtrip_kiss", 10000, "entrance-roadtrip");
      window.__entranceRoadtripPoliceStep(200, 17);
      report.steps.escaped = {
        detected: fastPursuit,
        initialScale: fastInitialScale,
        initialSiren: fastInitialSiren,
        twoHundredSix: twoHundredSix,
        twoHundredSeven: twoHundredSeven,
        twoHundredHeld: twoHundredHeld,
        oneEightyNineteen: oneEightyNineteen,
        oneEightyTwenty: oneEightyTwenty,
        brieflyFast: brieflyFast,
        recovered: recovered,
        cleared: copy(trip()),
        caption: document.getElementById("hunt-caption").textContent.trim(),
        flash: window.__flashCaptionState()
      };

      prepareEncounter();
      var severeDetection = meetPolice(150, "entrance_roadtrip_heart");
      window.__entranceRoadtripSetDistance(severeDetection.police.stationAt + 30);
      var severe = copy(trip());
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
      var refused = meetPolice(130);
      window.__entranceRoadtripSetDistance(refused.police.stationAt + 30);
      window.__exitEntranceRoadtrip();
      var refusedCapture = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 3);
      window.__entranceRoadtripPoliceStep(0, 2);
      report.steps.refused = { capture: refusedCapture, trip: copy(trip()) };

      prepareEncounter();
      window.__entranceRoadtripSetDemerits(10, 0);
      var suspensionDetection = meetPolice(130);
      window.__entranceRoadtripSetDistance(suspensionDetection.police.stationAt + 30);
      window.__exitEntranceRoadtrip();
      window.__entranceRoadtripPoliceStep(0, 3);
      window.__entranceRoadtripPoliceStep(0, 2);
      var suspendedTrip = copy(trip());
      var suspendedCaption = document.getElementById("hunt-caption").textContent.trim();
      var suspendedButton = document.getElementById("entrance-roadtrip-reenter");
      report.steps.suspension = {
        trip: suspendedTrip,
        caption: suspendedCaption,
        buttonText: suspendedButton.textContent.trim(),
        buttonDisabled: suspendedButton.getAttribute("aria-disabled"),
        restart: window.__entranceRoadtripStart()
      };
      window.__entranceRoadtripSetDemerits(0, 0);

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
  s.contract.demeritHook === "function" &&
  JSON.stringify(s.contract.demeritSchedule) === JSON.stringify([2, 2, 3, 3, 4, 4, 6]) &&
  s.contract.speedLimit === 90 &&
  s.contract.enforcementSpeed === 110 &&
  s.contract.firstDistance === 950 && s.contract.warningAhead === 240 &&
  s.contract.warningHeadroom === 3 && s.contract.repeatDistance === 1200 &&
  s.contract.escapeSpeed === 180 && s.contract.pursuitSpeed === 180 &&
  s.contract.escapeDistance === 80 && s.contract.escapeHoldSeconds === 10 &&
  s.contract.stoppedBeat === 1.25 &&
  s.contract.arrestDuration === 5.8 &&
  s.contract.speedSign && s.contract.speedFurniture,
  "the highway posts 90/110 enforcement and models a Sheriff capable of 180 km/h", s.contract);
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
check(s.toleratedMirror && s.toleratedMirror.detection.police.phase === "cooldown" &&
  s.toleratedMirror.near.police.mirrorVisible &&
  s.toleratedMirror.near.police.mirrorMode === "roadside" &&
  s.toleratedMirror.near.x > 340 && s.toleratedMirror.mid.x > 340 &&
  s.toleratedMirror.far.x > 340 &&
  s.toleratedMirror.near.scale > s.toleratedMirror.mid.scale &&
  s.toleratedMirror.mid.scale > s.toleratedMirror.far.scale &&
  s.toleratedMirror.near.y > s.toleratedMirror.mid.y &&
  s.toleratedMirror.mid.y > s.toleratedMirror.far.y &&
  !s.toleratedMirror.gone.police.mirrorVisible &&
  s.toleratedMirror.gone.police.mirrorMode === "",
  "a tolerated roadside patrol recedes on the right shoulder toward the mirror horizon",
  s.toleratedMirror);
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
  s.pursuit.roadside.police.roadsideVisible && !s.pursuit.roadside.police.mirrorVisible &&
  s.pursuit.joinNear.police.mirrorMode === "roadside-pursuit" &&
  s.pursuit.joinMid.police.mirrorMode === "roadside-pursuit" &&
  s.pursuit.joinNear.x > s.pursuit.joinMid.x &&
  s.pursuit.joinNear.scale > s.pursuit.joinMid.scale &&
  s.pursuit.following.police.mirrorMode === "pursuit" &&
  s.pursuit.following.x < s.pursuit.joinMid.x && s.pursuit.mirror === "visible",
  "speeding moves the passed roadside reflection coherently into the pursuing patrol car", s.pursuit);
check(s.unfocused && !s.unfocused.sirenActive && s.refocused && s.refocused.sirenActive,
  "the pursuit siren tears down while unfocused and returns only when attended", {
    unfocused: s.unfocused, refocused: s.refocused
  });
check(s.stopped && s.stopped.trip.active && s.stopped.trip.police.phase === "cooldown" &&
  s.stopped.trip.police.stops === 1 && s.stopped.trip.police.tickets === 1 &&
  s.stopped.trip.police.fines === 560 && s.stopped.trip.police.scorePenalties === 560 &&
  s.stopped.trip.demeritPoints === 4 && !s.stopped.trip.demeritWarning &&
  s.stopped.trip.police.lastDemerits === 4 && s.stopped.trip.police.lastDemeritTotal === 4 &&
  !s.stopped.trip.police.sirenActive &&
  !s.stopped.trip.police.mirrorVisible && !s.stopped.trip.police.arrestVisible &&
  /40 km\/h over · fine \$560 · 4 demerits · 4\/15/.test(s.stopped.caption) &&
  !s.stopped.flash,
  "the roadside outcome uses the recorded overage before the scaled fine", s.stopped);
check(s.demeritWarning && s.demeritWarning.trip.active &&
  s.demeritWarning.trip.demeritPoints === 8 && s.demeritWarning.trip.demeritWarning &&
  !s.demeritWarning.trip.suspended && s.demeritWarning.trip.police.lastDemerits === 3 &&
  /3 demerits · 8\/15 · demerit warning/.test(s.demeritWarning.caption),
  "eight points enters the warning state without suspending the Road Trip", s.demeritWarning);
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
  /\+55 · pokutu určí soud · 6 b\. · 6\/15/.test(s.courtStop.czech.line) &&
  s.courtStop.paused.police.arrestElapsed === s.courtStop.card.police.arrestElapsed &&
  !s.courtStop.paused.police.sirenActive && s.courtStop.paused.police.arrestAudioVoices === 0 &&
  s.courtStop.fade.active && s.courtStop.fade.police.arrestOpacity > 0 &&
  s.courtStop.fade.police.arrestOpacity < 1 && !s.courtStop.trip.active && !s.courtStop.trip.accepted &&
  s.courtStop.hudOpen && !s.courtStop.returnOffer.drive.roadtrip.invitationReady &&
  !s.courtStop.returnOffer.drive.roadtrip.invitationVisible &&
  s.courtStop.returnOffer.drive.roadtrip.reentryVisible &&
  s.courtStop.trip.police.phase === "ended" && s.courtStop.trip.police.runEnded &&
  s.courtStop.trip.police.endReason === "court" && s.courtStop.trip.police.overLimit === 55 &&
  s.courtStop.trip.police.fine === null && s.courtStop.trip.police.courtRequired &&
  s.courtStop.trip.police.summonses === 1 && s.courtStop.trip.police.tickets === 1 &&
  s.courtStop.trip.police.fines === 0 && !s.courtStop.trip.police.sirenActive &&
  s.courtStop.trip.demeritPoints === 6 && s.courtStop.trip.police.lastDemerits === 6 &&
  /55 km\/h over · court-set fine · 6 demerits · 6\/15/.test(s.courtStop.caption),
  "court-only arrest approaches, sounds, translates, pauses unattended, then fades to the block",
  s.courtStop);
check(s.shoutThreshold && s.shoutThreshold.exactlyHundred.police.overLimit === 100 &&
  !s.shoutThreshold.exactlyHundred.police.arrestShoutPlayed &&
  s.shoutThreshold.exactlyHundred.police.arrestShoutOpacity === 0 &&
  s.shoutThreshold.overHundredEnglish.police.overLimit === 101 &&
  s.shoutThreshold.overHundredEnglish.police.arrestShoutPlayed &&
  s.shoutThreshold.overHundredEnglish.police.arrestShoutOpacity > .9 &&
  s.shoutThreshold.overHundredEnglish.police.arrestShoutText === "OUT OF THE CAR!" &&
  s.shoutThreshold.overHundredEnglish.police.arrestAudioVoices > 0 &&
  s.shoutThreshold.overHundredCzech.police.arrestShoutText === "VYSTUPTE Z VOZU!" &&
  s.shoutThreshold.blurred.police.arrestAudioVoices === 0,
  "only a strictly greater-than-100 overage adds the bilingual shout and its audio tears down on blur",
  s.shoutThreshold);
check(s.escaped && s.escaped.detected.active && s.escaped.detected.police.phase === "pursuit" &&
  s.escaped.detected.police.detectedSpeed === 180 &&
  s.escaped.twoHundredSix.police.phase === "pursuit" &&
  s.escaped.twoHundredSix.police.escapeGap > 77 && s.escaped.twoHundredSix.police.escapeGap < 79 &&
  s.escaped.twoHundredSix.police.mirrorScale < s.escaped.initialScale &&
  s.escaped.twoHundredSeven.police.phase === "pursuit" &&
  s.escaped.twoHundredSeven.police.escapeHoldElapsed > .5 &&
  s.escaped.twoHundredSeven.police.escapeHoldElapsed < .7 &&
  s.escaped.twoHundredHeld.police.phase === "cooldown" &&
  s.escaped.oneEightyNineteen.police.phase === "pursuit" &&
  s.escaped.oneEightyNineteen.police.escapeGap === 0 &&
  s.escaped.oneEightyTwenty.police.phase === "pursuit" &&
  s.escaped.brieflyFast.police.phase === "pursuit" &&
  s.escaped.brieflyFast.police.escapeGap > 0 &&
  s.escaped.brieflyFast.police.escapeHoldElapsed > .5 &&
  s.escaped.brieflyFast.police.escapeHoldElapsed < .7 &&
  s.escaped.brieflyFast.police.sirenLevel < s.escaped.initialSiren &&
  s.escaped.recovered.police.phase === "pursuit" &&
  s.escaped.recovered.police.escapeGap < s.escaped.brieflyFast.police.escapeGap &&
  s.escaped.recovered.police.escapeHoldElapsed === 0 &&
  s.escaped.recovered.police.mirrorScale > s.escaped.brieflyFast.police.mirrorScale &&
  s.escaped.recovered.police.sirenLevel > s.escaped.brieflyFast.police.sirenLevel &&
  s.escaped.recovered.police.refusalElapsed === 5 &&
  s.escaped.cleared.active && s.escaped.cleared.police.phase === "cooldown" &&
  s.escaped.cleared.police.escapes === 1 && !s.escaped.cleared.police.sirenActive &&
  s.escaped.cleared.demeritPoints === 0 &&
  !s.escaped.cleared.police.mirrorVisible && s.escaped.cleared.police.tickets === 0 &&
  /Police lost/.test(s.escaped.caption) && !s.escaped.flash,
  "the Sheriff reaches 180 and a ten-second breakaway must survive any slowdown before escape",
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
  s.severe.trip.demeritPoints === 11 && s.severe.trip.police.lastDemerits === 11 &&
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
  s.refused.trip.police.scorePenalties === 1560 && s.refused.trip.demeritPoints === 9 &&
  s.refused.trip.police.lastDemerits === 9 && !s.refused.trip.police.arrestVisible,
  "ordinary refusal captures without the court-only arrest scene", s.refused);
check(s.suspension && !s.suspension.trip.active && s.suspension.trip.suspended &&
  s.suspension.trip.demeritPoints === 15 && s.suspension.trip.police.lastDemerits === 9 &&
  s.suspension.trip.police.lastDemeritTotal === 15 && s.suspension.trip.police.runEnded &&
  s.suspension.buttonDisabled === "true" && /Suspended · 1:00|Suspended · 0:59/.test(s.suspension.buttonText) &&
  /9 demerits · 15\/15 · licence suspended for/.test(s.suspension.caption) && !s.suspension.restart,
  "refusal stacks five points onto the offence, caps at 15, ends the run, and disables re-entry",
  s.suspension);
check(s.czech && /přes 180/.test(s.czech.escape) &&
  /^Překročení o \{over\} km\/h · pokuta \{fine\} · \{points\} trestné body · \{total\}\/15\{status\}\.$/.test(s.czech.fine) &&
  /^Překročení o \{over\} km\/h · \{fine\} · \{points\} trestných bodů · \{total\}\/15\{status\}\.$/.test(s.czech.court),
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
