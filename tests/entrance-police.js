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
      scale: match ? Number(match[3]) : null,
      roadLeft: Number(document.querySelector(".entrance-roadtrip-police-mirror").getAttribute("data-roadtrip-road-left")),
      roadRight: Number(document.querySelector(".entrance-roadtrip-police-mirror").getAttribute("data-roadtrip-road-right")),
      behind: Number(document.querySelector(".entrance-roadtrip-police-mirror").getAttribute("data-roadtrip-behind"))
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
        spawnPlanHook: typeof window.__entranceRoadtripSpawnPlan,
        spawnIntervalHook: typeof window.__entranceRoadtripSpawnInterval,
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
        surrenderSpeed: trip().policeSurrenderSpeed,
        escapeDistance: trip().policeEscapeDistance,
        escapeHoldSeconds: trip().policeEscapeHoldSeconds,
        pursuitTrafficDensity: trip().pursuitTrafficDensity,
        pursuitReactionDistance: trip().pursuitReactionDistance,
        stoppedBeat: trip().policeStoppedBeat,
        arrestDuration: trip().policeArrestDuration,
        centerlineSeconds: trip().centerlineEnforcementSeconds,
        centerlineFine: trip().centerlineFine,
        centerlineDemerits: trip().centerlineDemerits,
        demeritHud: ["entrance-roadtrip-meta-panel", "entrance-roadtrip-demerit-label",
          "entrance-roadtrip-demerit-points", "entrance-roadtrip-demerit-status"].every(function (id) {
          return !!document.getElementById(id);
        }),
        speedSign: !!document.getElementById("entrance-roadtrip-speed-90"),
        speedFurniture: Array.prototype.some.call(document.querySelectorAll("#entrance-roadtrip-furniture use"), function (node) {
          return (node.getAttribute("href") || node.getAttribute("xlink:href")) === "#entrance-roadtrip-speed-90";
        })
      };
      var normalPlans = [];
      var pursuitPlans = [];
      var normalIntervals = [];
      var pursuitIntervals = [];
      for (var planIndex = 0; planIndex < 20; planIndex++) {
        normalPlans.push(window.__entranceRoadtripSpawnPlan(false, planIndex));
        if (planIndex < 16) pursuitPlans.push(window.__entranceRoadtripSpawnPlan(true, planIndex));
        if (planIndex < 5) {
          normalIntervals.push(window.__entranceRoadtripSpawnInterval(false, planIndex));
          pursuitIntervals.push(window.__entranceRoadtripSpawnInterval(true, planIndex));
        }
      }
      report.steps.pursuitTraffic = {
        normal: normalPlans,
        pursuit: pursuitPlans,
        normalIntervals: normalIntervals,
        pursuitIntervals: pursuitIntervals
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
      setMotion(0, 0);
      window.__entranceRoadtripPolice(150);
      step(1000, 5);
      var radarBeforeApproach = copy(trip());
      setMotion(131, 3);
      step(100);
      var radarMeasured = copy(trip());
      window.__entranceRoadtripSetLane(-.5);
      window.__entranceRoadtripSpawn("car", -.5, 10);
      step(100);
      var radarCrashed = copy(state());
      window.__entranceRoadtripSetDistance(radarCrashed.drive.roadtrip.police.stationAt - 6);
      step(100);
      var radarDetected = copy(state());
      window.__entranceRoadtripSetLane(.5);
      step(1000);
      var radarApproach = copy(state());
      window.__entranceRoadtripPoliceStep(0, 3);
      var radarCard = copy(state());
      window.__entranceRoadtripPoliceStep(0, 3);
      report.steps.radarPeak = {
        beforeApproach: radarBeforeApproach,
        measured: radarMeasured,
        crashed: radarCrashed,
        detected: radarDetected,
        approach: radarApproach,
        card: radarCard,
        cited: copy(state())
      };
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();

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
      setMotion(90, 3);
      window.__entranceRoadtripSetLane(-.5);
      step(1000);
      var briefCenterline = copy(trip());
      window.__entranceRoadtripSetLane(.5);
      step(20);
      var briefCenterlineCleared = copy(trip());
      prepareEncounter();
      setMotion(90, 3);
      window.__entranceRoadtripSetLane(-.5);
      step(1000);
      step(900);
      var centerlineGrace = copy(trip());
      step(200);
      var centerlinePursuit = copy(trip());
      var centerlinePursuitCaption = document.getElementById("hunt-caption").textContent.trim();
      window.__entranceRoadtripSetLane(.5);
      setMotion(0, 0);
      window.__entranceRoadtripPoliceStep(0, .1);
      window.__entranceRoadtripPoliceStep(0, 3.1);
      var centerlineCard = copy(trip());
      var centerlineCardTitle = document.getElementById("entrance-roadtrip-arrest-title").textContent.trim();
      var centerlineCardLine = document.getElementById("entrance-roadtrip-arrest-line").textContent.trim();
      window.__entranceRoadtripPoliceStep(0, 3);
      report.steps.centerlinePolice = {
        brief: briefCenterline,
        briefCleared: briefCenterlineCleared,
        grace: centerlineGrace,
        pursuit: centerlinePursuit,
        pursuitCaption: centerlinePursuitCaption,
        card: centerlineCard,
        cardTitle: centerlineCardTitle,
        cardLine: centerlineCardLine,
        cited: copy(trip()),
        caption: document.getElementById("hunt-caption").textContent.trim()
      };

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
      var pursuitRightCurve = mirrorSample();
      window.__entranceRoadtripSetDistance(401);
      var pursuitLeftCurve = mirrorSample();
      report.steps.pursuitCurves = { right: pursuitRightCurve, left: pursuitLeftCurve };
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
      var ordinaryStopped = copy(trip());
      var ordinaryStoppedCaption = document.getElementById("hunt-caption").textContent.trim();
      window.__entranceRoadtripPoliceStep(0, 1);
      var ordinaryApproach = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 2);
      var ordinaryCard = copy(trip());
      var ordinaryCardTitle = document.getElementById("entrance-roadtrip-arrest-title").textContent.trim();
      var ordinaryCardLine = document.getElementById("entrance-roadtrip-arrest-line").textContent.trim();
      window.__entranceRoadtripPoliceStep(0, 3);
      report.steps.stopped = {
        trip: copy(trip()),
        stopped: ordinaryStopped,
        approach: ordinaryApproach,
        card: ordinaryCard,
        cardTitle: ordinaryCardTitle,
        cardLine: ordinaryCardLine,
        stoppedCaption: ordinaryStoppedCaption,
        caption: document.getElementById("hunt-caption").textContent.trim(),
        flash: window.__flashCaptionState()
      };

      prepareEncounter();
      meetPolice(130);
      setMotion(101, 3);
      window.__entranceDriveControl("throttle", true);
      var aboveThresholdBefore = state().drive.speed;
      step(250);
      var aboveThreshold = copy(state());
      setMotion(99, 3);
      step(50);
      var latched = copy(state());
      window.__entranceDriveKey(new KeyboardEvent("keydown", {
        key: "ArrowUp", code: "ArrowUp", bubbles: true, cancelable: true
      }), true);
      var keyboardThrottle = copy(state());
      var throttleControl = document.getElementById("entrance-drive-throttle");
      throttleControl.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true, cancelable: true, pointerId: 818, pointerType: "touch", isPrimary: true
      }));
      var touchThrottle = {
        state: copy(state()),
        pressed: throttleControl.classList.contains("pressed")
      };
      throttleControl.dispatchEvent(new PointerEvent("pointerup", {
        bubbles: true, cancelable: true, pointerId: 818, pointerType: "touch", isPrimary: true
      }));
      step(400);
      var throttleBlocked = copy(state());
      var controlStart = copy(state());
      window.__entranceDriveControl("steerRight", true);
      window.__entranceDriveControl("brake", true);
      step(300);
      var controlsLive = copy(state());
      window.__entranceDriveControl("steerRight", false);
      window.__entranceDriveControl("brake", false);
      setMotion(0, 0);
      window.__entranceDriveControl("clutch", true);
      var reverseSelected = window.__entranceDriveShift(-1);
      window.__entranceDriveControl("clutch", false);
      window.__entranceDriveControl("throttle", true);
      step(400);
      var reverseBlocked = copy(state());
      var latchedCaption = document.getElementById("hunt-caption").textContent.trim();
      var resetStarted = window.__entranceRoadtripStart();
      report.steps.surrenderLatch = {
        aboveBefore: aboveThresholdBefore,
        above: aboveThreshold,
        latched: latched,
        caption: latchedCaption,
        keyboardThrottle: keyboardThrottle,
        touchThrottle: touchThrottle,
        blocked: throttleBlocked,
        controlStart: controlStart,
        controlsLive: controlsLive,
        reverseSelected: reverseSelected,
        reverseBlocked: reverseBlocked,
        resetStarted: resetStarted,
        reset: copy(state())
      };

      prepareEncounter();
      window.__entranceRoadtripSetDemerits(5, 0);
      meetPolice(120);
      window.__entranceRoadtripSetLane(2);
      setMotion(0, 0);
      step(1000);
      window.__entranceRoadtripPoliceStep(0, 6);
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
      var courtReturnOffer = copy(state());
      var courtTerminalCheckpoint = window.__captureCheckpointSystems().entrance.drive.roadtrip;
      document.getElementById("entrance-roadtrip-reenter").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      var courtFreshEntry = copy(trip());
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
        terminalCheckpoint: courtTerminalCheckpoint,
        freshEntry: courtFreshEntry,
        returnOffer: courtReturnOffer,
        hudOpen: state().drive.hud,
        caption: courtResolvedCaption
      };

      prepareEncounter();
      meetPolice(179);
      window.__entranceRoadtripSetLane(2);
      setMotion(0, 0);
      step(1000);
      window.__entranceRoadtripPoliceStep(0, 1.5);
      var eightyNineOver = copy(trip());

      prepareEncounter();
      meetPolice(180);
      window.__entranceRoadtripSetLane(2);
      setMotion(0, 0);
      step(1000);
      window.__entranceRoadtripPoliceStep(0, 1.5);
      var ninetyOverEnglish = copy(trip());
      window.setLang("cs");
      var ninetyOverCzech = copy(trip());
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
        eightyNineOver: eightyNineOver,
        ninetyOverEnglish: ninetyOverEnglish,
        ninetyOverCzech: ninetyOverCzech,
        blurred: overHundredBlurred
      };

      prepareEncounter();
      var twoHundredDetection = meetPolice(200);
      window.__entranceRoadtripSetDistance(twoHundredDetection.police.stationAt + 30);
      window.__entranceRoadtripPoliceStep(200, 5);
      var twoHundred = copy(trip());

      prepareEncounter();
      var exactThresholdDetection = meetPolice(215);
      window.__entranceRoadtripSetDistance(exactThresholdDetection.police.stationAt + 30);
      window.__entranceRoadtripPoliceStep(215, 5);
      var exactThreshold = copy(trip());

      prepareEncounter();
      var fastDetection = meetPolice(216);
      window.__entranceRoadtripSetDistance(fastDetection.police.stationAt + 30);
      var fastPursuit = copy(trip());
      var fastInitialScale = fastPursuit.police.mirrorScale;
      var fastInitialSiren = fastPursuit.police.sirenLevel;
      window.__entranceRoadtripPoliceStep(216, 30);
      var leadFifty = copy(trip());
      window.__entranceRoadtripPoliceStep(216, 30);
      var leadHundred = copy(trip());
      window.__entranceRoadtripPoliceStep(216, 11);
      var heldEleven = copy(trip());
      window.__entranceRoadtripPoliceStep(214, 2);
      var recovered = copy(trip());
      window.__flashCaptionKey("entrance_roadtrip_kiss", 10000, "entrance-roadtrip");
      window.__entranceRoadtripPoliceStep(216, 11);
      var requalified = copy(trip());
      window.__entranceRoadtripPoliceStep(216, 1);
      report.steps.escaped = {
        detected: fastPursuit,
        initialScale: fastInitialScale,
        initialSiren: fastInitialSiren,
        twoHundred: twoHundred,
        exactThreshold: exactThreshold,
        leadFifty: leadFifty,
        leadHundred: leadHundred,
        heldEleven: heldEleven,
        recovered: recovered,
        requalified: requalified,
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
      var refusedPaused = copy(trip());
      document.getElementById("entrance-roadtrip-reenter").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      var refusedResumed = copy(trip());
      window.__entranceRoadtripPoliceStep(130, 20);
      var refusedCapture = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 3);
      var refusedApproach = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 1.5);
      var refusedShout = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 4.5);
      report.steps.refused = {
        paused: refusedPaused,
        resumed: refusedResumed,
        capture: refusedCapture,
        approach: refusedApproach,
        shout: refusedShout,
        trip: copy(trip())
      };

      prepareEncounter();
      window.__entranceRoadtripSetDemerits(10, 0);
      var suspensionDetection = meetPolice(130);
      window.__entranceRoadtripSetDistance(suspensionDetection.police.stationAt + 30);
      window.__exitEntranceRoadtrip();
      document.getElementById("entrance-roadtrip-reenter").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      window.__entranceRoadtripPoliceStep(130, 20);
      window.__entranceRoadtripPoliceStep(0, 3);
      window.__entranceRoadtripPoliceStep(0, 6);
      var suspendedTrip = copy(trip());
      var suspendedCaption = document.getElementById("hunt-caption").textContent.trim();
      var suspendedButton = document.getElementById("entrance-roadtrip-reenter");
      report.steps.suspension = {
        trip: suspendedTrip,
        caption: suspendedCaption,
        buttonText: suspendedButton.textContent.trim(),
        buttonTextY: document.getElementById("entrance-roadtrip-reenter-text").getAttribute("y"),
        hudPoints: document.getElementById("entrance-roadtrip-demerit-points").textContent.trim(),
        hudStatus: document.getElementById("entrance-roadtrip-demerit-status").textContent.trim(),
        hudBand: document.getElementById("entrance-roadtrip-demerit-status").getAttribute("data-roadtrip-demerit-band"),
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
        court: window.T.cs.hunt.entrance_roadtrip_police_summons,
        centerlinePursuit: window.T.cs.hunt.entrance_roadtrip_police_centerline_pursuit,
        centerlineTicket: window.T.cs.hunt.entrance_roadtrip_police_centerline_ticket,
        centerlineTitle: window.T.cs.hunt.entrance_roadtrip_arrest_centerline_title
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
  s.contract.spawnPlanHook === "function" && s.contract.spawnIntervalHook === "function" &&
  s.contract.demeritHook === "function" &&
  JSON.stringify(s.contract.demeritSchedule) === JSON.stringify([2, 2, 3, 3, 4, 4, 6]) &&
  s.contract.speedLimit === 90 &&
  s.contract.enforcementSpeed === 110 &&
  s.contract.firstDistance === 950 && s.contract.warningAhead === 240 &&
  s.contract.warningHeadroom === 3 && s.contract.repeatDistance === 1200 &&
  s.contract.escapeSpeed === 215 && s.contract.pursuitSpeed === 210 &&
  s.contract.surrenderSpeed === 100 &&
  s.contract.escapeDistance === 100 && s.contract.escapeHoldSeconds === 12 &&
  s.contract.pursuitTrafficDensity === 1.4 && s.contract.pursuitReactionDistance === 118 &&
  s.contract.stoppedBeat === 1.25 &&
  s.contract.arrestDuration === 5.8 &&
  s.contract.centerlineSeconds === 2 && s.contract.centerlineFine === 243 &&
  s.contract.centerlineDemerits === 2 &&
  s.contract.demeritHud &&
  s.contract.speedSign && s.contract.speedFurniture,
  "the highway posts 90/110 enforcement and models a Sheriff capable of 210 km/h", s.contract);
var expectedNaturalTypes = ["car", "heart", "rv", "rabbit", "pickup", "kiss", "deer", "car",
  "heart", "truck", "rv", "heart", "rabbit", "kiss", "pickup", "inf", "rv", "car", "deer", "truck"];
var expectedNaturalLanes = [1.5, .5, -.5, .5, .5, 1.5, 1.5, -1.5,
  .5, 1.5, .5, 1.5, .5, .5, 1.5, .5, 1.5, -.5, 1.5, -1.5];
var pursuitVehicles = s.pursuitTraffic && s.pursuitTraffic.pursuit.filter(function (plan) {
  return !!plan.direction;
});
var normalIntervalTotal = s.pursuitTraffic && s.pursuitTraffic.normalIntervals.reduce(function (sum, value) {
  return sum + value;
}, 0);
var pursuitIntervalTotal = s.pursuitTraffic && s.pursuitTraffic.pursuitIntervals.reduce(function (sum, value) {
  return sum + value;
}, 0);
check(s.pursuitTraffic &&
  JSON.stringify(s.pursuitTraffic.normal.map(function (plan) { return plan.type; })) ===
    JSON.stringify(expectedNaturalTypes) &&
  JSON.stringify(s.pursuitTraffic.normal.map(function (plan) { return plan.lane; })) ===
    JSON.stringify(expectedNaturalLanes) &&
  JSON.stringify(s.pursuitTraffic.normalIntervals) === JSON.stringify([31, 35, 39, 43, 47]) &&
  JSON.stringify(s.pursuitTraffic.pursuitIntervals) === JSON.stringify([22, 25, 28, 31, 34]) &&
  normalIntervalTotal / pursuitIntervalTotal > 1.35 &&
  normalIntervalTotal / pursuitIntervalTotal < 1.45 &&
  pursuitVehicles.length === 12 &&
  pursuitVehicles.filter(function (plan) { return plan.direction === "oncoming"; }).length === 7 &&
  pursuitVehicles.filter(function (plan) { return plan.direction === "forward"; }).every(function (plan) {
    return plan.type === "rv" || plan.type === "truck";
  }) &&
  s.pursuitTraffic.pursuit.every(function (plan) { return plan.ahead >= 118; }),
  "pursuit-only traffic is about 40% denser, oncoming-biased, slow-heavy, and always affords 118 m reaction distance",
  s.pursuitTraffic);
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
check(s.radarPeak && s.radarPeak.beforeApproach.police.phase === "warning" &&
  s.radarPeak.beforeApproach.police.radarPeakSpeed === 0 &&
  s.radarPeak.measured.police.phase === "warning" &&
  s.radarPeak.measured.police.radarPeakSpeed === 130 &&
  s.radarPeak.crashed.drive.roadtrip.police.phase === "warning" &&
  s.radarPeak.crashed.drive.roadtrip.police.radarPeakSpeed === 130 &&
  s.radarPeak.crashed.drive.roadtrip.collisions === 1 &&
  s.radarPeak.crashed.drive.speed === 0 && !s.radarPeak.crashed.car.engineOn &&
  s.radarPeak.detected.drive.roadtrip.police.phase === "pursuit" &&
  s.radarPeak.detected.drive.roadtrip.police.detectedSpeed === 130 &&
  s.radarPeak.detected.drive.roadtrip.police.overLimit === 40 &&
  s.radarPeak.detected.drive.roadtrip.police.fine === 560 &&
  s.radarPeak.approach.drive.roadtrip.playerLane === .5 &&
  s.radarPeak.approach.drive.roadtrip.police.phase === "arrest" &&
  s.radarPeak.approach.drive.roadtrip.police.surrenderLatched &&
  s.radarPeak.approach.drive.roadtrip.police.arrestVisible &&
  s.radarPeak.approach.drive.instruction === "entrance_roadtrip_police_arrest" &&
  s.radarPeak.card.drive.roadtrip.police.phase === "arrest" &&
  s.radarPeak.card.drive.roadtrip.police.arrestCardOpacity > .5 &&
  !s.radarPeak.card.drive.roadtrip.police.arrestShoutPlayed &&
  s.radarPeak.cited.drive.roadtrip.police.phase === "cooldown" &&
  s.radarPeak.cited.drive.roadtrip.police.tickets === 1 &&
  s.radarPeak.cited.drive.roadtrip.police.fines === 560 &&
  s.radarPeak.cited.drive.roadtrip.demeritPoints === 4,
  "radar keeps the pre-crash peak and a surrendered car stopped in a travel lane promptly gets the calm officer approach and citation",
  s.radarPeak);
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
check(s.centerlinePolice &&
  s.centerlinePolice.brief.police.phase === "idle" &&
  s.centerlinePolice.brief.centerlineElapsed > 0 &&
  s.centerlinePolice.brief.centerlineElapsed < s.contract.centerlineSeconds &&
  !s.centerlinePolice.brief.centerlineEnforced &&
  s.centerlinePolice.briefCleared.centerlineElapsed === 0 &&
  !s.centerlinePolice.briefCleared.centerlineEnforced &&
  s.centerlinePolice.grace.police.phase === "idle" &&
  s.centerlinePolice.grace.centerlineElapsed < s.contract.centerlineSeconds &&
  s.centerlinePolice.pursuit.centerlineEnforced &&
  s.centerlinePolice.pursuit.police.phase === "pursuit" &&
  s.centerlinePolice.pursuit.police.offence === "solid-line" &&
  s.centerlinePolice.pursuit.police.fine === 243 &&
  s.centerlinePolice.pursuit.police.overLimit === 0 &&
  /double solid line/.test(s.centerlinePolice.pursuitCaption) &&
  s.centerlinePolice.card.police.phase === "arrest" &&
  s.centerlinePolice.cardTitle === "SOLID-LINE TICKET" &&
  /double solid · fine \$243 · 2 pts · 2\/15/.test(s.centerlinePolice.cardLine) &&
  s.centerlinePolice.cited.police.phase === "cooldown" &&
  s.centerlinePolice.cited.police.tickets === 1 &&
  s.centerlinePolice.cited.police.fines === 243 &&
  s.centerlinePolice.cited.police.lastDemerits === 2 &&
  s.centerlinePolice.cited.demeritPoints === 2 &&
  /double solid line · fine \$243 · 2 demerits · 2\/15/.test(s.centerlinePolice.caption),
  "a brief dodge is forgiven, while two seconds across the double solid line starts the shared $243/2-demerit pursuit and stop",
  s.centerlinePolice);
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
check(s.pursuitCurves && s.pursuitCurves.right.police.mirrorMode === "pursuit" &&
  s.pursuitCurves.left.police.mirrorMode === "pursuit" &&
  s.pursuitCurves.right.x > s.pursuitCurves.left.x + 2 &&
  s.pursuitCurves.right.x > s.pursuitCurves.right.roadLeft &&
  s.pursuitCurves.right.x < s.pursuitCurves.right.roadRight &&
  s.pursuitCurves.left.x > s.pursuitCurves.left.roadLeft &&
  s.pursuitCurves.left.x < s.pursuitCurves.left.roadRight &&
  s.pursuitCurves.right.behind === s.pursuitCurves.left.behind &&
  s.pursuitCurves.right.scale === s.pursuitCurves.left.scale,
  "the pursuing Sheriff follows the reflected lane through opposite bends without changing pursuit depth",
  s.pursuitCurves);
check(s.unfocused && !s.unfocused.sirenActive && s.refocused && s.refocused.sirenActive,
  "the pursuit siren tears down while unfocused and returns only when attended", {
    unfocused: s.unfocused, refocused: s.refocused
  });
check(s.stopped && s.stopped.stopped.active && s.stopped.stopped.police.phase === "arrest" &&
  s.stopped.stopped.police.stops === 1 && s.stopped.stopped.police.arrestVisible &&
  !s.stopped.stopped.police.arrestShoutPlayed &&
  /officer approaching/.test(s.stopped.stoppedCaption) &&
  s.stopped.approach.police.phase === "arrest" &&
  s.stopped.approach.police.arrestOfficerTransform !== s.stopped.stopped.police.arrestOfficerTransform &&
  s.stopped.card.police.phase === "arrest" && s.stopped.card.police.arrestCardOpacity > .5 &&
  !s.stopped.card.police.arrestShoutPlayed && s.stopped.cardTitle === "SPEEDING TICKET" &&
  /40 over · fine \$560 · 4 pts · 4\/15/.test(s.stopped.cardLine) &&
  s.stopped.trip.active && s.stopped.trip.police.phase === "cooldown" &&
  s.stopped.trip.police.stops === 1 && s.stopped.trip.police.tickets === 1 &&
  s.stopped.trip.police.fines === 560 && s.stopped.trip.police.scorePenalties === 560 &&
  s.stopped.trip.demeritPoints === 4 && !s.stopped.trip.demeritWarning &&
  s.stopped.trip.police.lastDemerits === 4 && s.stopped.trip.police.lastDemeritTotal === 4 &&
  !s.stopped.trip.police.sirenActive &&
  !s.stopped.trip.police.mirrorVisible && !s.stopped.trip.police.arrestVisible &&
  /40 km\/h over · fine \$560 · 4 demerits · 4\/15/.test(s.stopped.caption) &&
  !s.stopped.flash,
  "an ordinary stop gets a calm officer approach and ticket card before the recorded fine", s.stopped);
check(s.surrenderLatch && s.surrenderLatch.aboveBefore === 101 &&
  s.surrenderLatch.above.drive.speed > s.surrenderLatch.aboveBefore &&
  !s.surrenderLatch.above.drive.roadtrip.police.surrenderLatched &&
  s.surrenderLatch.latched.drive.speed < 100 &&
  s.surrenderLatch.latched.drive.roadtrip.police.surrenderLatched &&
  !s.surrenderLatch.latched.drive.holds.throttle &&
  !s.surrenderLatch.keyboardThrottle.drive.holds.throttle &&
  !s.surrenderLatch.touchThrottle.state.drive.holds.throttle && !s.surrenderLatch.touchThrottle.pressed &&
  s.surrenderLatch.blocked.drive.speed <= s.surrenderLatch.latched.drive.speed &&
  s.surrenderLatch.blocked.drive.roadtrip.police.surrenderLatched &&
  s.surrenderLatch.controlsLive.drive.speed < s.surrenderLatch.controlStart.drive.speed &&
  s.surrenderLatch.controlsLive.drive.roadtrip.playerLane > s.surrenderLatch.controlStart.drive.roadtrip.playerLane &&
  s.surrenderLatch.controlsLive.drive.steeringAngle > 0 &&
  s.surrenderLatch.controlsLive.drive.holds.brake && s.surrenderLatch.controlsLive.drive.holds.steerRight &&
  s.surrenderLatch.controlsLive.drive.roadtrip.police.surrenderLatched &&
  s.surrenderLatch.reverseSelected && s.surrenderLatch.reverseBlocked.drive.gear === 0 &&
  s.surrenderLatch.reverseBlocked.drive.speed === 0 && !s.surrenderLatch.reverseBlocked.drive.holds.throttle &&
  s.surrenderLatch.reverseBlocked.drive.roadtrip.police.surrenderLatched &&
  s.surrenderLatch.reverseBlocked.drive.roadtrip.police.phase === "arrest" &&
  s.surrenderLatch.reverseBlocked.drive.roadtrip.police.arrestVisible &&
  s.surrenderLatch.reverseBlocked.drive.instruction === "entrance_roadtrip_police_arrest" &&
  /officer approaching/.test(s.surrenderLatch.caption) &&
  s.surrenderLatch.resetStarted && s.surrenderLatch.reset.drive.roadtrip.police.phase === "idle" &&
  !s.surrenderLatch.reset.drive.roadtrip.police.surrenderLatched,
  "101 can accelerate, but sub-100 latches surrender across inputs, preserves braking and steering, then begins the approach promptly at zero",
  s.surrenderLatch);
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
  !s.courtStop.card.police.arrestShoutPlayed && s.courtStop.card.police.arrestShoutOpacity === 0 &&
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
  !Object.prototype.hasOwnProperty.call(s.courtStop.terminalCheckpoint, "pausedRun") &&
  s.courtStop.freshEntry.active && !s.courtStop.freshEntry.paused &&
  s.courtStop.freshEntry.distance === 0 && s.courtStop.freshEntry.elapsedSeconds === 0 &&
  s.courtStop.freshEntry.score === 0 && s.courtStop.freshEntry.entityCount === 0 &&
  s.courtStop.freshEntry.damage.kind === "" && s.courtStop.freshEntry.police.phase === "idle" &&
  /55 km\/h over · court-set fine · 6 demerits · 6\/15/.test(s.courtStop.caption),
  "court-only arrest resolves terminally and its next Road Trip starts fresh",
  s.courtStop);
check(s.shoutThreshold && s.shoutThreshold.eightyNineOver.police.overLimit === 89 &&
  !s.shoutThreshold.eightyNineOver.police.arrestShoutPlayed &&
  s.shoutThreshold.eightyNineOver.police.arrestShoutOpacity === 0 &&
  s.shoutThreshold.ninetyOverEnglish.police.overLimit === 90 &&
  s.shoutThreshold.ninetyOverEnglish.police.arrestShoutPlayed &&
  s.shoutThreshold.ninetyOverEnglish.police.arrestShoutOpacity > .9 &&
  s.shoutThreshold.ninetyOverEnglish.police.arrestShoutText ===
    "ENGINE OFF! DROP THE KEYS! HANDS THROUGH THE WHEEL!" &&
  s.shoutThreshold.ninetyOverEnglish.police.arrestAudioVoices > 0 &&
  s.shoutThreshold.ninetyOverCzech.police.arrestShoutText ===
    "VYPNĚTE MOTOR! ZAHOĎTE KLÍČE! RUCE SKRZ VOLANT!" &&
  s.shoutThreshold.blurred.police.arrestAudioVoices === 0,
  "the bilingual command shout begins at 90 over and its audio tears down on blur",
  s.shoutThreshold);
check(s.escaped && s.escaped.detected.active && s.escaped.detected.police.phase === "pursuit" &&
  s.escaped.detected.police.detectedSpeed === 216 &&
  s.escaped.twoHundred.police.phase === "pursuit" &&
  s.escaped.twoHundred.police.escapeGap === 0 && s.escaped.twoHundred.police.escapeHoldElapsed === 0 &&
  s.escaped.exactThreshold.police.phase === "pursuit" &&
  s.escaped.exactThreshold.police.escapeGap === 0 && s.escaped.exactThreshold.police.escapeHoldElapsed === 0 &&
  s.escaped.leadFifty.police.phase === "pursuit" &&
  s.escaped.leadFifty.police.escapeGap > 49 && s.escaped.leadFifty.police.escapeGap < 51 &&
  s.escaped.leadHundred.police.phase === "pursuit" &&
  s.escaped.leadHundred.police.escapeGap > 99 && s.escaped.leadHundred.police.escapeGap < 101 &&
  s.escaped.leadHundred.police.escapeHoldElapsed === 0 &&
  s.escaped.heldEleven.police.phase === "pursuit" &&
  s.escaped.heldEleven.police.escapeHoldElapsed > 10.9 &&
  s.escaped.heldEleven.police.escapeHoldElapsed < 11.1 &&
  s.escaped.heldEleven.police.mirrorScale < s.escaped.initialScale &&
  s.escaped.recovered.police.phase === "pursuit" &&
  s.escaped.recovered.police.escapeGap < s.escaped.heldEleven.police.escapeGap &&
  s.escaped.recovered.police.escapeHoldElapsed === 0 &&
  s.escaped.requalified.police.phase === "pursuit" &&
  s.escaped.requalified.police.escapeGap > 100 &&
  s.escaped.requalified.police.escapeHoldElapsed > 10.9 &&
  s.escaped.requalified.police.escapeHoldElapsed < 11.1 &&
  s.escaped.cleared.active && s.escaped.cleared.police.phase === "cooldown" &&
  s.escaped.cleared.police.escapes === 1 && !s.escaped.cleared.police.sirenActive &&
  s.escaped.cleared.demeritPoints === 0 && !s.escaped.cleared.police.surrenderLatched &&
  !s.escaped.cleared.police.mirrorVisible && s.escaped.cleared.police.tickets === 0 &&
  /Police lost/.test(s.escaped.caption) && !s.escaped.flash,
  "200 cannot escape a 210 Sheriff; escape requires above 215, 100 m of lead, then twelve uninterrupted seconds",
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
  s.severe.trip.police.arrestShoutPlayed &&
  s.severe.trip.police.fines === 0 && s.severe.trip.police.scorePenalties === 1000 &&
  s.severe.trip.demeritPoints === 11 && s.severe.trip.police.lastDemerits === 11 &&
  /highway run over/.test(s.severe.immediateCaption) &&
  s.severe.finalCaption === s.severe.immediateCaption &&
  !s.severe.immediateFlash && !s.severe.finalFlash &&
  !/collected|multiplier/.test(s.severe.finalCaption),
  "court-speed capture progressively stops in-scene before citation, parking, or checkpointing",
  s.severe);
check(s.refused && !s.refused.paused.active && s.refused.paused.paused &&
  s.refused.paused.police.phase === "pursuit" && s.refused.paused.police.detectedSpeed === 130 &&
  s.refused.resumed.active && !s.refused.resumed.paused &&
  s.refused.resumed.police.phase === "pursuit" && s.refused.resumed.police.detectedSpeed === 130 &&
  s.refused.capture.active && s.refused.capture.police.phase === "capture" &&
  s.refused.capture.police.sirenActive && s.refused.capture.police.mirrorVisible &&
  s.refused.approach.police.phase === "arrest" && s.refused.approach.police.arrestVisible &&
  s.refused.approach.police.resolutionReason === "refused" &&
  s.refused.shout.police.phase === "arrest" && s.refused.shout.police.arrestShoutPlayed &&
  s.refused.shout.police.arrestShoutOpacity > .9 &&
  !s.refused.trip.active && s.refused.trip.police.runEnded &&
  s.refused.trip.police.endReason === "refused" && s.refused.trip.police.fines === 560 &&
  s.refused.trip.police.scorePenalties === 1560 && s.refused.trip.demeritPoints === 9 &&
  s.refused.trip.police.lastDemerits === 9 && !s.refused.trip.police.arrestVisible,
  "a paused pursuit resumes intact; refusal at any ticket speed forces capture, shouted approach, and citation",
  s.refused);
check(s.suspension && !s.suspension.trip.active && s.suspension.trip.suspended &&
  s.suspension.trip.demeritPoints === 15 && s.suspension.trip.police.lastDemerits === 9 &&
  s.suspension.trip.police.lastDemeritTotal === 15 && s.suspension.trip.police.runEnded &&
  s.suspension.buttonTextY === "17" &&
  s.suspension.hudPoints === "15 / 15" && s.suspension.hudBand === "suspended" &&
  /^SUSPENDED (?:1:00|0:59)$/.test(s.suspension.hudStatus) &&
  s.suspension.buttonDisabled === "true" && /Suspended · 1:00|Suspended · 0:59/.test(s.suspension.buttonText) &&
  /9 demerits · 15\/15 · licence suspended for/.test(s.suspension.caption) && !s.suspension.restart,
  "refusal stacks five points onto the offence, caps at 15, ends the run, and disables re-entry",
  s.suspension);
check(s.czech && /přes 215/.test(s.czech.escape) &&
  /^Překročení o \{over\} km\/h · pokuta \{fine\} · \{points\} trestné body · \{total\}\/15\{status\}\.$/.test(s.czech.fine) &&
  /^Překročení o \{over\} km\/h · \{fine\} · \{points\} trestných bodů · \{total\}\/15\{status\}\.$/.test(s.czech.court) &&
  /dvojitou plnou čárou/.test(s.czech.centerlinePursuit) &&
  /Přejezd dvojité plné čáry/.test(s.czech.centerlineTicket) &&
  s.czech.centerlineTitle === "POKUTA ZA PLNOU ČÁRU",
  "speed and solid-line outcomes are mirrored in natural Czech order", s.czech);
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
