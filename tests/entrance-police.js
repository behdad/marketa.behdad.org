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
  function startBanff() {
    var started = window.__entranceRoadtripDevStart();
    if (started) window.__entranceRoadtripSetRoute("banff", 0);
    return started;
  }
  function setMotion(speed, gear) {
    window.__entranceDriveControl("throttle", false);
    window.__entranceDriveControl("brake", false);
    return window.__entranceDriveSetMotion(speed, gear);
  }
  function flashSample() {
    var group = document.getElementById("entrance-roadtrip-police-mirror-flashes");
    var blue = document.getElementById("entrance-roadtrip-police-mirror-flash-blue");
    var red = document.getElementById("entrance-roadtrip-police-mirror-flash-red");
    var blueStyle = getComputedStyle(blue);
    var redStyle = getComputedStyle(red);
    return {
      visible: group.getAttribute("visibility"),
      active: group.classList.contains("is-pursuing"),
      transform: group.getAttribute("transform") || "",
      blueAnimation: blueStyle.animationName,
      redAnimation: redStyle.animationName,
      blueDuration: blueStyle.animationDuration,
      redDuration: redStyle.animationDuration,
      blueIterations: blueStyle.animationIterationCount,
      redIterations: redStyle.animationIterationCount,
      blueOpacity: Number(blueStyle.opacity),
      redOpacity: Number(redStyle.opacity),
      ariaLabels: group.querySelectorAll("[aria-label]").length + (group.hasAttribute("aria-label") ? 1 : 0)
    };
  }
  function frontFlashSample() {
    var group = document.getElementById("entrance-roadtrip-police-front-flashes");
    var blue = document.getElementById("entrance-roadtrip-police-front-flash-blue");
    var red = document.getElementById("entrance-roadtrip-police-front-flash-red");
    var blueStyle = getComputedStyle(blue);
    var redStyle = getComputedStyle(red);
    return {
      visible: group.getAttribute("visibility"),
      active: group.classList.contains("is-pursuing"),
      phase: group.getAttribute("data-roadtrip-flash-phase") || "",
      transform: group.getAttribute("transform") || "",
      blueAnimation: blueStyle.animationName,
      redAnimation: redStyle.animationName,
      blueDuration: blueStyle.animationDuration,
      redDuration: redStyle.animationDuration,
      blueIterations: blueStyle.animationIterationCount,
      redIterations: redStyle.animationIterationCount,
      blueOpacity: Number(blueStyle.opacity),
      redOpacity: Number(redStyle.opacity)
    };
  }
  function mirrorSample() {
    var police = copy(trip().police);
    var transform = police.mirrorTransform || "";
    var translate = /translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(transform);
    var rotate = /rotate\((-?[\d.]+)\)/.exec(transform);
    var scale = /scale\(([\d.]+)\)/.exec(transform);
    return {
      police: police,
      x: translate ? Number(translate[1]) : null,
      y: translate ? Number(translate[2]) : null,
      rotation: rotate ? Number(rotate[1]) : 0,
      scale: scale ? Number(scale[1]) : null,
      roadLeft: Number(document.querySelector(".entrance-roadtrip-police-mirror").getAttribute("data-roadtrip-road-left")),
      roadRight: Number(document.querySelector(".entrance-roadtrip-police-mirror").getAttribute("data-roadtrip-road-right")),
      behind: Number(document.querySelector(".entrance-roadtrip-police-mirror").getAttribute("data-roadtrip-behind")),
      flashes: flashSample()
    };
  }
  function meetPolice(speed, pendingFeedback) {
    setMotion(speed, speed >= 180 ? 4 : 3);
    window.__entranceRoadtripPolice(150);
    var stationAt = trip().police.stationAt;
    window.__entranceRoadtripSetDistance(stationAt - 6);
    if (pendingFeedback) window.__captionOverlay(pendingFeedback, { owner: "entrance-roadtrip",
      scope: "lower:entrance", priority: 30, duration: 10000, clock: "wall" });
    window.__entranceRoadtripPoliceDetect(speed);
    return copy(trip());
  }
  function prepareEncounter() {
    window.__entranceRoadtripSetDemerits(0, 0);
    startBanff();
    window.__entranceRoadtripSetLane(.5);
    setMotion(0, 0);
  }
  async function run() {
    try {
      window.__unlockAllRooms();
      window.__setSecondRound(true, { releaseHeld: false });
      window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
        "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      await sleep(40);
      window.__openEntrancePorscheDriveHud();
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripDevStart();
      window.__entranceRoadtripSetRoute("banff", 0);
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
        rearRadarSeconds: trip().policeRearRadarSeconds,
        rearRadarDistance: trip().policeRearRadarDistance,
        repeatDistance: trip().policeRepeatDistance,
        escapeSpeed: trip().policeEscapeSpeed,
        pursuitSpeed: trip().policePursuitSpeed,
        surrenderSpeed: trip().policeSurrenderSpeed,
        escapeDistance: trip().policeEscapeDistance,
        escapeHoldSeconds: trip().policeEscapeHoldSeconds,
        pursuitTrafficDensity: trip().pursuitTrafficDensity,
        pursuitReactionDistance: trip().pursuitReactionDistance,
        stoppedBeat: trip().policeStoppedBeat,
        frontStoppedBeat: trip().policeFrontStoppedBeat,
        parkedBehind: trip().policeParkedBehind,
        rearStopScale: trip().policeRearStopScale,
        rearStopYOffset: trip().policeRearStopYOffset,
        frontParkedAhead: trip().policeFrontParkedAhead,
        frontParkedScale: trip().policeFrontParkedScale,
        arrestDuration: trip().policeArrestDuration,
        centerlineSeconds: trip().centerlineEnforcementSeconds,
        centerlineFine: trip().centerlineFine,
        centerlineDemerits: trip().centerlineDemerits,
        demeritHud: ["entrance-roadtrip-meta-panel", "entrance-roadtrip-demerit-label",
          "entrance-roadtrip-demerit-points", "entrance-roadtrip-record-divider",
          "entrance-roadtrip-bac-label", "entrance-roadtrip-bac-value"].every(function (id) {
          return !!document.getElementById(id);
        }),
        speedSign: !!document.getElementById("entrance-roadtrip-speed-90"),
        policeMirrorClipped: !!document.querySelector(".entrance-roadtrip-police-mirror").closest(
          '[clip-path="url(#entrance-roadtrip-mirror-clip)"]'),
        speedFurniture: Array.prototype.some.call(document.querySelectorAll("#entrance-roadtrip-furniture use"), function (node) {
          return (node.getAttribute("href") || node.getAttribute("xlink:href")) === "#entrance-roadtrip-speed-90";
        })
      };
      var normalPlans = [];
      var pursuitPlans = [];
      var normalIntervals = [];
      var pursuitIntervals = [];
      var trafficSeed = 0x12345678;
      window.__entranceRoadtripSetSeed(trafficSeed);
      for (var planIndex = 0; planIndex < 22; planIndex++) {
        normalPlans.push(window.__entranceRoadtripSpawnPlan(false, planIndex));
        if (planIndex < 18) pursuitPlans.push(window.__entranceRoadtripSpawnPlan(true, planIndex));
        if (planIndex < 5) {
          normalIntervals.push(window.__entranceRoadtripSpawnInterval(false, planIndex));
          pursuitIntervals.push(window.__entranceRoadtripSpawnInterval(true, planIndex));
        }
      }
      report.steps.pursuitTraffic = {
        seed: trafficSeed,
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
        roadsideVisible: trip().police.roadsideVisible,
        flashes: flashSample()
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
      window.__entranceRoadtripSetDistance(radarCrashed.drive.roadtrip.police.stationAt + 2);
      step(100, 8);
      var radarDetected = copy(state());
      window.__entranceRoadtripSetLane(.5);
      step(1000);
      var radarArrival = copy(state());
      window.__entranceRoadtripPoliceStep(0, 1.25);
      var radarApproach = copy(state());
      window.__entranceRoadtripPoliceStep(0, 3);
      var radarCard = copy(state());
      window.__entranceRoadtripPoliceStep(0, 3);
      report.steps.radarPeak = {
        beforeApproach: radarBeforeApproach,
        measured: radarMeasured,
        crashed: radarCrashed,
        detected: radarDetected,
        arrival: radarArrival,
        approach: radarApproach,
        card: radarCard,
        cited: copy(state())
      };
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();

      prepareEncounter();
      setMotion(90, 3);
      window.__entranceRoadtripPolice(150);
      step(1000, 5);
      var rearRadarStation = trip().police.stationAt;
      window.__entranceRoadtripSetDistance(rearRadarStation + 2);
      setMotion(130, 3);
      step(100);
      var rearRadarAccelerated = copy(state());
      setMotion(90, 3);
      step(100, 6);
      var rearRadarHolding = copy(state());
      step(100, 2);
      var rearRadarEnforced = copy(state());
      step(100);
      report.steps.rearRadar = {
        accelerated: rearRadarAccelerated,
        holding: rearRadarHolding,
        enforced: rearRadarEnforced,
        repeated: copy(state())
      };

      prepareEncounter();
      setMotion(0, 0);
      window.__entranceRoadtripPolice(150);
      step(1000, 5);
      var crashRadarStation = trip().police.stationAt;
      window.__entranceRoadtripSetDistance(crashRadarStation - 2);
      window.__entranceRoadtripSetLane(-.5);
      window.__entranceRoadtripSpawn("car", -.5, 10);
      setMotion(140, 3);
      step(100);
      var rearRadarCrashed = copy(state());
      step(700);
      report.steps.rearRadarCrash = {
        crashed: rearRadarCrashed,
        enforced: copy(state())
      };
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();

      prepareEncounter();
      setMotion(0, 0);
      window.__entranceRoadtripPolice(150);
      var stationImpactAt = trip().police.stationAt;
      window.__entranceRoadtripSetDistance(stationImpactAt - 2);
      window.__entranceRoadtripSetLane(-.5);
      window.__entranceRoadtripSpawn("car", -.5, 8);
      setMotion(200, 4);
      step(100);
      var stationImpactCrash = copy(state());
      step(1000, 5);
      report.steps.stationImpactRadar = {
        stationAt: stationImpactAt,
        crashed: stationImpactCrash,
        enforced: copy(state())
      };
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();

      prepareEncounter();
      setMotion(0, 0);
      window.__entranceRoadtripPolice(150);
      step(1000, 5);
      var distanceRadarStation = trip().police.stationAt;
      window.__entranceRoadtripSetDistance(distanceRadarStation + 39);
      setMotion(130, 3);
      step(10);
      var rearRadarBeforeDistance = copy(state());
      step(20);
      report.steps.rearRadarDistance = {
        before: rearRadarBeforeDistance,
        enforced: copy(state())
      };

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
      step(1000, 9);
      step(900);
      var centerlineGrace = copy(trip());
      step(200);
      var centerlinePursuit = copy(trip());
      var centerlinePursuitCaption = document.getElementById("hunt-caption").textContent.trim();
      window.__entranceRoadtripSetLane(.5);
      setMotion(0, 0);
      window.__entranceRoadtripPoliceStep(0, .1);
      window.__entranceRoadtripPoliceStep(0, 1.25);
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
      window.__entranceRoadtripSetLane(.5);
      window.__captionOverlay("entrance_roadtrip_heart", { owner: "entrance-roadtrip",
        scope: "lower:entrance", priority: 30, duration: 10000, clock: "wall" });
      setMotion(0, 0);
      step(1000);
      var ordinaryStopped = copy(trip());
      var ordinaryStoppedFlashes = flashSample();
      var ordinaryStoppedCaption = document.getElementById("hunt-caption").textContent.trim();
      window.__entranceRoadtripPoliceStep(0, .625);
      var ordinaryArrival = copy(trip());
      window.__entranceRoadtripPoliceStep(0, .624);
      var ordinarySettled = copy(trip());
      var ordinarySettledPose = mirrorSample();
      window.__entranceRoadtripPoliceStep(0, .0011);
      var ordinaryArrestStart = copy(trip());
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
        arrival: ordinaryArrival,
        settled: ordinarySettled,
        settledPose: ordinarySettledPose,
        arrestStart: ordinaryArrestStart,
        approach: ordinaryApproach,
        card: ordinaryCard,
        cardTitle: ordinaryCardTitle,
        cardLine: ordinaryCardLine,
        stoppedFlashes: ordinaryStoppedFlashes,
        resolvedFlashes: flashSample(),
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
      var resetStarted = startBanff();
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
      window.__entranceRoadtripPoliceStep(0, 1.25);
      window.__entranceRoadtripPoliceStep(0, 6);
      report.steps.demeritWarning = {
        trip: copy(trip()),
        caption: document.getElementById("hunt-caption").textContent.trim()
      };

      prepareEncounter();
      meetPolice(145);
      window.__entranceRoadtripSetLane(1.5);
      setMotion(0, 0);
      step(1000);
      var courtStopped = copy(trip());
      var courtStoppedFlashes = frontFlashSample();
      var courtStoppedCaption = document.getElementById("hunt-caption").textContent.trim();
      var courtBlockedThrottle = window.__entranceDriveControl("throttle", true);
      var courtBlockedRange = window.__entranceDriveRange("D");
      var courtBlockedMotion = window.__entranceDriveSetMotion(80, 3);
      var courtDriveBlocked = copy(state().drive);
      var arrestEscapeIgnored = window.__exitEntranceRoadtrip();
      window.__entranceRoadtripPoliceStep(0, .9);
      var courtFrontMid = copy(trip());
      window.__entranceRoadtripPoliceStep(0, .899);
      var courtFrontSettled = copy(trip());
      var courtBeforeTransitionFlashes = frontFlashSample();
      window.__entranceRoadtripPoliceStep(0, .0011);
      var courtArrestStart = copy(trip());
      var courtAtTransitionFlashes = frontFlashSample();
      window.__entranceRoadtripPoliceStep(0, .0009);
      var courtAfterTransition = copy(trip());
      var courtAfterTransitionFlashes = frontFlashSample();
      window.__entranceRoadtripPoliceStep(0, .32);
      var courtNextPhaseFlashes = frontFlashSample();
      window.__entranceRoadtripPoliceStep(0, .68);
      var courtApproach = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 1.5);
      var courtKnock = copy(trip());
      window.__entranceRoadtripPoliceStep(0, .8);
      var courtCard = copy(trip());
      window.__setLang("cs");
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
      window.__setLang("en");
      window.__entranceRoadtripPoliceStep(0, 2);
      var courtFade = copy(trip());
      window.__entranceRoadtripPoliceStep(0, .6);
      var courtResolved = copy(trip());
      var courtResolvedCaption = document.getElementById("hunt-caption").textContent.trim();
      var courtReturnOffer = copy(state());
      var courtTerminalCheckpoint = window.__captureCheckpointSystems().entrance.drive.roadtrip;
      document.getElementById("entrance-roadtrip-reenter").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      var courtRouteChooser = copy(trip());
      var courtFreshEntryStarted = window.__entranceRoadtripLaunchRouteChoice();
      var courtFreshEntry = copy(trip());
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceDriveRange("D");
      report.steps.courtStop = {
        stopped: courtStopped,
        stoppedCaption: courtStoppedCaption,
        stoppedFlashes: courtStoppedFlashes,
        blockedThrottle: courtBlockedThrottle,
        blockedRange: courtBlockedRange,
        blockedMotion: courtBlockedMotion,
        driveBlocked: courtDriveBlocked,
        escapeIgnored: arrestEscapeIgnored,
        frontMid: courtFrontMid,
        frontSettled: courtFrontSettled,
        beforeTransitionFlashes: courtBeforeTransitionFlashes,
        arrestStart: courtArrestStart,
        atTransitionFlashes: courtAtTransitionFlashes,
        afterTransition: courtAfterTransition,
        afterTransitionFlashes: courtAfterTransitionFlashes,
        nextPhaseFlashes: courtNextPhaseFlashes,
        approach: courtApproach,
        knock: courtKnock,
        card: courtCard,
        czech: courtCzech,
        paused: courtPaused,
        fade: courtFade,
        trip: courtResolved,
        terminalCheckpoint: courtTerminalCheckpoint,
        routeChooser: courtRouteChooser,
        freshEntryStarted: courtFreshEntryStarted,
        freshEntry: courtFreshEntry,
        returnOffer: courtReturnOffer,
        hudOpen: state().drive.hud,
        caption: courtResolvedCaption
      };

      prepareEncounter();
      meetPolice(179);
      window.__entranceRoadtripSetLane(.5);
      setMotion(0, 0);
      step(1000);
      var eightyNineStopped = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 1.8);
      window.__entranceRoadtripPoliceStep(0, 1.5);
      var eightyNineOver = copy(trip());

      prepareEncounter();
      meetPolice(180);
      window.__entranceRoadtripSetLane(1.5);
      setMotion(0, 0);
      step(1000);
      var ninetyOverStopped = copy(trip());
      window.__entranceRoadtripPoliceStep(0, 1.8);
      window.__entranceRoadtripPoliceStep(0, 1.5);
      var ninetyOverEnglish = copy(trip());
      window.__setLang("cs");
      var ninetyOverCzech = copy(trip());
      document.hasFocus = function () { return false; };
      window.dispatchEvent(new Event("blur"));
      await sleep(60);
      var overHundredBlurred = copy(trip());
      document.hasFocus = function () { return true; };
      window.dispatchEvent(new Event("focus"));
      window.__entranceDriveControl("steerLeft", true);
      window.__entranceDriveControl("steerLeft", false);
      window.__setLang("en");
      report.steps.shoutThreshold = {
        eightyNineStopped: eightyNineStopped,
        eightyNineOver: eightyNineOver,
        ninetyOverStopped: ninetyOverStopped,
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
      window.__captionOverlay("entrance_roadtrip_kiss", { owner: "entrance-roadtrip",
        scope: "lower:entrance", priority: 30, duration: 10000, clock: "wall" });
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
      var captureStart = { trip: copy(trip()), speed: state().drive.speed, flashes: flashSample() };
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
      document.querySelector('[data-roadtrip-reentry-choice="continue"]').dispatchEvent(
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
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
      setMotion(96, 3);
      window.__entranceDriveControl("throttle", true);
      window.__entranceDriveControl("brake", true);
      window.__entranceDriveControl("clutch", true);
      window.__entranceDriveControl("steerRight", true);
      step(120);
      var suspensionMoving = copy(state());
      window.__entranceRoadtripSetDemerits(15, Date.now() + 60000);
      var suspensionImmediate = copy(state());
      var suspensionInputAttempts = [];
      for (var blockedInputIndex = 0; blockedInputIndex < 3; blockedInputIndex++) {
        suspensionInputAttempts.push({
          throttle: window.__entranceDriveControl("throttle", true),
          brake: window.__entranceDriveControl("brake", true),
          clutch: window.__entranceDriveControl("clutch", true),
          steerLeft: window.__entranceDriveControl("steerLeft", true),
          steerRight: window.__entranceDriveControl("steerRight", true),
          gear: window.__entranceDriveShift(4),
          motion: window.__entranceDriveSetMotion(88, 3),
          keyboard: window.__entranceDriveKey(
            new KeyboardEvent("keydown", { key: "ArrowUp", code: "ArrowUp", bubbles: true }), true)
        });
        step(1000);
      }
      var suspensionInputsBlocked = copy(state());
      window.__entranceRoadtripSetDemerits(15, Date.now() - 1);
      var suspensionExpiredParked = copy(state());
      var suspensionExpiredStarted = window.__toggleEntrancePorscheEngine();
      var suspensionExpiredRunning = copy(state());
      if (state().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripSetDemerits(0, 0);
      report.steps.suspensionStop = {
        moving: suspensionMoving,
        immediate: suspensionImmediate,
        attempts: suspensionInputAttempts,
        blocked: suspensionInputsBlocked,
        expiredParked: suspensionExpiredParked,
        expiredStarted: suspensionExpiredStarted,
        expiredRunning: suspensionExpiredRunning
      };

      prepareEncounter();
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripSetDemerits(10, 0);
      var suspensionDetection = meetPolice(130);
      window.__entranceRoadtripSetDistance(suspensionDetection.police.stationAt + 30);
      window.__exitEntranceRoadtrip();
      document.getElementById("entrance-roadtrip-reenter").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      document.querySelector('[data-roadtrip-reentry-choice="continue"]').dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      window.__entranceRoadtripPoliceStep(130, 20);
      window.__entranceRoadtripPoliceStep(0, 3);
      window.__entranceRoadtripPoliceStep(0, 6);
      var suspendedTrip = copy(trip());
      var suspendedState = copy(state());
      var suspendedCaption = document.getElementById("hunt-caption").textContent.trim();
      var suspendedButton = document.getElementById("entrance-roadtrip-reenter");
      window.__hideEntrancePorscheDriveHud();
      var blockedBaseline = copy(state());
      var roomAttemptOne = window.__toggleEntrancePorscheEngine();
      var roomAttemptTwo = window.__toggleEntrancePorscheEngine();
      var blockedRoom = copy(state());
      window.__openEntrancePorscheDriveHud();
      document.getElementById("entrance-drive-ignition").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      document.getElementById("entrance-drive-ignition").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      var blockedHud = copy(state());
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
      var blockedKeyboard = copy(state());
      report.steps.suspension = {
        trip: suspendedTrip,
        state: suspendedState,
        caption: suspendedCaption,
        buttonText: suspendedButton.textContent.trim(),
        buttonTextY: document.getElementById("entrance-roadtrip-reenter-text").getAttribute("y"),
        hudPoints: document.getElementById("entrance-roadtrip-demerit-points").textContent.trim(),
        hudBac: document.getElementById("entrance-roadtrip-bac-value").textContent.trim(),
        hudStatusAbsent: !document.getElementById("entrance-roadtrip-demerit-status"),
        buttonSuspended: suspendedButton.classList.contains("suspended"),
        restart: startBanff(),
        ignition: {
          baseline: blockedBaseline,
          roomReturns: [roomAttemptOne, roomAttemptTwo],
          room: blockedRoom,
          hud: blockedHud,
          keyboard: blockedKeyboard,
          caption: document.getElementById("hunt-caption").textContent.trim(),
          captionBlink: document.getElementById("hunt-caption").classList.contains("hint-blink"),
          keyDisplay: getComputedStyle(document.getElementById("entrance-drive-ignition-fob")).display,
          reenterPulse: suspendedButton.classList.contains("suspension-ignition-blocked"),
          buttonAnimation: getComputedStyle(suspendedButton).animationName
        }
      };
      window.__entranceRoadtripSetDemerits(15, Date.now() - 1);
      var expiredStart = window.__toggleEntrancePorscheEngine();
      report.steps.suspension.expiry = {
        started: expiredStart,
        state: copy(state()),
        keyDisplay: getComputedStyle(document.getElementById("entrance-drive-ignition-fob")).display
      };
      if (state().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripSetDemerits(0, 0);

      window.__setLang("cs");
      prepareEncounter();
      meetPolice(180);
      window.__entranceRoadtripPoliceStep(180, 1);
      report.steps.czech = window.__loftMessages && window.__loftMessages.cs && window.__loftMessages.cs.hunt ? {
        escape: window.__loftMessages.cs.hunt.entrance_roadtrip_police_escape,
        fine: window.__loftMessages.cs.hunt.entrance_roadtrip_police_ticket,
        court: window.__loftMessages.cs.hunt.entrance_roadtrip_police_summons,
        centerlinePursuit: window.__loftMessages.cs.hunt.entrance_roadtrip_police_centerline_pursuit,
        centerlineTicket: window.__loftMessages.cs.hunt.entrance_roadtrip_police_centerline_ticket,
        centerlineTitle: window.__loftMessages.cs.hunt.entrance_roadtrip_arrest_centerline_title
      } : null;

      prepareEncounter();
      meetPolice(145);
      window.__entranceRoadtripSetLane(2);
      setMotion(0, 0);
      step(1000);
      window.__entranceRoadtripPoliceStep(0, 1.8);
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

var REDUCED_MOTION_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  function state() { return window.__entranceRoomState(); }
  async function run() {
    var report = { errors: [], steps: {} };
    try {
      window.__unlockAllRooms();
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      await new Promise(function (resolve) { setTimeout(resolve, 40); });
      window.__openEntrancePorscheDriveHud();
      window.__entranceRoadtripSetDemerits(15, Date.now() + 60000);
      window.__toggleEntrancePorscheEngine();
      window.__toggleEntrancePorscheEngine();
      var button = document.getElementById("entrance-roadtrip-reenter");
      var buttonStyle = getComputedStyle(button);
      report.steps.blocked = {
        state: state(),
        buttonPulse: button.classList.contains("suspension-ignition-blocked"),
        buttonAnimation: buttonStyle.animationName,
        statusAbsent: !document.getElementById("entrance-roadtrip-demerit-status"),
        captionBlink: document.getElementById("hunt-caption").classList.contains("hint-blink")
      };
      window.__entranceRoadtripSetDemerits(0, 0);
      window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripDevStart();
      window.__entranceRoadtripSetRoute("banff", 0);
      window.__entranceDriveSetMotion(130, 3);
      window.__entranceRoadtripPolice(150);
      var stationAt = state().drive.roadtrip.police.stationAt;
      window.__entranceRoadtripSetDistance(stationAt - 6);
      window.__entranceRoadtripPoliceDetect(130);
      window.__entranceRoadtripSetDistance(stationAt + 30);
      var flashGroup = document.getElementById("entrance-roadtrip-police-mirror-flashes");
      var flashBlue = document.getElementById("entrance-roadtrip-police-mirror-flash-blue");
      var flashRed = document.getElementById("entrance-roadtrip-police-mirror-flash-red");
      report.steps.flashes = {
        phase: state().drive.roadtrip.police.phase,
        visible: flashGroup.getAttribute("visibility"),
        active: flashGroup.classList.contains("is-pursuing"),
        blueAnimation: getComputedStyle(flashBlue).animationName,
        redAnimation: getComputedStyle(flashRed).animationName,
        blueOpacity: Number(getComputedStyle(flashBlue).opacity),
        redOpacity: Number(getComputedStyle(flashRed).opacity)
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
  s.contract.firstDistance === 1800 && s.contract.warningAhead === 240 &&
  s.contract.warningHeadroom === 3 && s.contract.rearRadarSeconds === .8 &&
  s.contract.rearRadarDistance === 40 && s.contract.repeatDistance === 2400 &&
  s.contract.escapeSpeed === 215 && s.contract.pursuitSpeed === 210 &&
  s.contract.surrenderSpeed === 100 &&
  s.contract.escapeDistance === 100 && s.contract.escapeHoldSeconds === 12 &&
  s.contract.pursuitTrafficDensity === 1.4 && s.contract.pursuitReactionDistance === 118 &&
  s.contract.stoppedBeat === 1.25 &&
  s.contract.frontStoppedBeat === 1.8 &&
  s.contract.parkedBehind === 4 && s.contract.rearStopScale === 3.75 &&
  s.contract.rearStopYOffset === 6.5 &&
  s.contract.frontParkedAhead === 4 && s.contract.frontParkedScale === 2.15 &&
  s.contract.arrestDuration === 5.8 &&
  s.contract.centerlineSeconds === 10 && s.contract.centerlineFine === 243 &&
  s.contract.centerlineDemerits === 2 &&
  s.contract.demeritHud && s.contract.policeMirrorClipped &&
  s.contract.speedSign && s.contract.speedFurniture,
  "the highway posts 90/110 enforcement and models a Sheriff capable of 210 km/h", s.contract);
var expectedNaturalTypes = ["rv", "inf", "rv", "car", "hedgehog", "car", "rabbit", "pickup",
  "truck", "kiss", "heart", "pickup", "mushroom", "rabbit", "heart", "car", "deer", "pickup",
  "truck", "car", "frog", "kiss"];
var expectedNaturalLanes = [1.5, 1.5, -.5, .5, 1.5, -1.5, 1.5, -1.5,
  -.5, 1.5, 1.5, .5, .5, .5, 1.5, -.5, 1.5, 1.5, -.5, -1.5, 1.5, .5];
var expectedPursuitTypes = ["truck", "rv", "truck", "rv", "inf", "heart", "car", "mushroom", "frog",
  "rabbit", "truck", "pickup", "pickup", "car", "kiss", "rv", "car", "car"];
var expectedPursuitLanes = [-1.5, .5, 1.5, .5, .5, 1.5, .5, 1.5, .5,
  1.5, .5, -1.5, -.5, .5, .5, .5, .5, -.5];
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
  s.pursuitTraffic.seed === 0x12345678 &&
  JSON.stringify(s.pursuitTraffic.normal.map(function (plan) { return plan.type; })) ===
    JSON.stringify(expectedNaturalTypes) &&
  JSON.stringify(s.pursuitTraffic.normal.map(function (plan) { return plan.lane; })) ===
    JSON.stringify(expectedNaturalLanes) &&
  JSON.stringify(s.pursuitTraffic.pursuit.map(function (plan) { return plan.type; })) ===
    JSON.stringify(expectedPursuitTypes) &&
  JSON.stringify(s.pursuitTraffic.pursuit.map(function (plan) { return plan.lane; })) ===
    JSON.stringify(expectedPursuitLanes) &&
  JSON.stringify(s.pursuitTraffic.normalIntervals) === JSON.stringify([36, 32, 43, 31, 30]) &&
  JSON.stringify(s.pursuitTraffic.pursuitIntervals) === JSON.stringify([26, 23, 31, 22, 21]) &&
  s.pursuitTraffic.normalIntervals.every(function (interval, index) {
    return s.pursuitTraffic.pursuitIntervals[index] === Math.round(interval / s.contract.pursuitTrafficDensity);
  }) &&
  normalIntervalTotal / pursuitIntervalTotal > 1.35 &&
  normalIntervalTotal / pursuitIntervalTotal < 1.45 &&
  pursuitVehicles.length === 12 &&
  pursuitVehicles.filter(function (plan) { return plan.direction === "oncoming"; }).length === 4 &&
  pursuitVehicles.every(function (plan) {
    return plan.direction === (plan.lane < 0 ? "oncoming" : "forward");
  }) &&
  s.pursuitTraffic.pursuit.every(function (plan) { return plan.ahead >= 118 && plan.ahead <= 128; }),
  "seeded pursuit traffic is about 40% denser, mixes both directions, and affords 118–128 m reaction distance",
  s.pursuitTraffic);
check(s.warning && s.warning.police.warningFlashCount === 3 &&
  s.warning.warningVisible === "visible" && !s.warning.roadsideVisible && s.warning.lead === 240 &&
  s.warning.flashes.visible === "hidden" && !s.warning.flashes.active &&
  s.warning.flashes.blueAnimation === "none" && s.warning.flashes.redAnimation === "none" &&
  s.warning.flashes.ariaLabels === 0 &&
  s.warning.lead / (s.contract.enforcementSpeed / 3.6) - 1.4 >= s.contract.warningHeadroom,
  "one oncoming vehicle gives exactly three high-beam flashes without activating the pursuit lightbar",
  s.warning);
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
  s.radarPeak.detected.drive.roadtrip.policeClockActive &&
  s.radarPeak.arrival.drive.roadtrip.playerLane === .5 &&
  s.radarPeak.arrival.drive.roadtrip.police.phase === "stopped" &&
  !s.radarPeak.arrival.drive.roadtrip.police.arrestVisible &&
  s.radarPeak.arrival.drive.instruction === "entrance_roadtrip_police_stopped" &&
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
check(s.rearRadar &&
  s.rearRadar.accelerated.drive.roadtrip.police.phase === "warning" &&
  s.rearRadar.accelerated.drive.roadtrip.police.radarRearTracking &&
  s.rearRadar.accelerated.drive.roadtrip.police.radarPeakSpeed >= 129 &&
  s.rearRadar.accelerated.drive.roadtrip.police.radarRearElapsed > 0 &&
  s.rearRadar.holding.drive.roadtrip.police.phase === "warning" &&
  s.rearRadar.holding.drive.roadtrip.police.radarRearElapsed < s.contract.rearRadarSeconds &&
  s.rearRadar.enforced.drive.roadtrip.police.phase === "pursuit" &&
  s.rearRadar.enforced.drive.roadtrip.police.detectedSpeed ===
    s.rearRadar.accelerated.drive.roadtrip.police.radarPeakSpeed &&
  s.rearRadar.enforced.drive.roadtrip.police.pursuits === 1 &&
  s.rearRadar.repeated.drive.roadtrip.police.pursuits === 1,
  "rear-facing radar retains acceleration after the parked unit and opens only one pursuit when its timed window closes",
  s.rearRadar);
check(s.rearRadarCrash &&
  s.rearRadarCrash.crashed.drive.roadtrip.police.phase === "warning" &&
  s.rearRadarCrash.crashed.drive.roadtrip.police.radarRearTracking &&
  s.rearRadarCrash.crashed.drive.roadtrip.police.radarPeakSpeed >= 139 &&
  s.rearRadarCrash.crashed.drive.roadtrip.collisions === 1 &&
  s.rearRadarCrash.crashed.drive.speed === 0 && !s.rearRadarCrash.crashed.car.engineOn &&
  s.rearRadarCrash.enforced.drive.roadtrip.police.phase === "pursuit" &&
  s.rearRadarCrash.enforced.drive.roadtrip.police.detectedSpeed ===
    s.rearRadarCrash.crashed.drive.roadtrip.police.radarPeakSpeed &&
  s.rearRadarCrash.enforced.drive.roadtrip.police.pursuits === 1,
  "the radar samples before a same-step boundary crash can erase the measured speed",
  s.rearRadarCrash);
check(s.stationImpactRadar &&
  s.stationImpactRadar.crashed.drive.roadtrip.police.phase === "warning" &&
  s.stationImpactRadar.crashed.drive.roadtrip.police.warningElapsed < 1 &&
  s.stationImpactRadar.crashed.drive.roadtrip.police.radarRearTracking &&
  s.stationImpactRadar.crashed.drive.roadtrip.police.radarPeakSpeed >= 199 &&
  s.stationImpactRadar.crashed.drive.roadtrip.distance >= s.stationImpactRadar.stationAt &&
  s.stationImpactRadar.crashed.drive.roadtrip.collisions === 1 &&
  s.stationImpactRadar.crashed.drive.speed === 0 && !s.stationImpactRadar.crashed.car.engineOn &&
  s.stationImpactRadar.enforced.drive.roadtrip.police.phase === "pursuit" &&
  s.stationImpactRadar.enforced.drive.roadtrip.police.detectedSpeed ===
    s.stationImpactRadar.crashed.drive.roadtrip.police.radarPeakSpeed &&
  s.stationImpactRadar.enforced.drive.roadtrip.police.courtRequired &&
  s.stationImpactRadar.enforced.drive.roadtrip.police.pursuits === 1,
  "a high-speed crash at the patrol preserves the pre-impact reading until rear radar can enforce it",
  s.stationImpactRadar);
check(s.rearRadarDistance &&
  s.rearRadarDistance.before.drive.roadtrip.police.phase === "warning" &&
  s.rearRadarDistance.before.drive.roadtrip.police.radarRearDistance < s.contract.rearRadarDistance &&
  s.rearRadarDistance.before.drive.roadtrip.police.radarRearElapsed < s.contract.rearRadarSeconds &&
  s.rearRadarDistance.enforced.drive.roadtrip.police.phase === "pursuit" &&
  s.rearRadarDistance.enforced.drive.roadtrip.police.radarRearDistance >= s.contract.rearRadarDistance &&
  s.rearRadarDistance.enforced.drive.roadtrip.police.radarRearElapsed < s.contract.rearRadarSeconds &&
  s.rearRadarDistance.enforced.drive.roadtrip.police.detectedSpeed === 130 &&
  s.rearRadarDistance.enforced.drive.roadtrip.police.pursuits === 1,
  "the explicit rearward distance cap closes the radar window before its time cap at high speed",
  s.rearRadarDistance);
check(s.toleratedMirror && s.toleratedMirror.detection.police.phase === "cooldown" &&
  s.toleratedMirror.near.police.mirrorVisible &&
  s.toleratedMirror.near.police.mirrorMode === "roadside" &&
  s.toleratedMirror.near.x > 340 && s.toleratedMirror.mid.x > 340 &&
  s.toleratedMirror.far.x > 340 &&
  s.toleratedMirror.near.scale > s.toleratedMirror.mid.scale &&
  s.toleratedMirror.mid.scale > s.toleratedMirror.far.scale &&
  s.toleratedMirror.near.y > s.toleratedMirror.mid.y &&
  s.toleratedMirror.mid.y > s.toleratedMirror.far.y &&
  s.toleratedMirror.near.flashes.visible === "hidden" && !s.toleratedMirror.near.flashes.active &&
  s.toleratedMirror.mid.flashes.visible === "hidden" && !s.toleratedMirror.mid.flashes.active &&
  s.toleratedMirror.far.flashes.visible === "hidden" && !s.toleratedMirror.far.flashes.active &&
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
  s.centerlinePolice.grace.centerlineElapsed >= 9.8 &&
  s.centerlinePolice.grace.centerlineElapsed < s.contract.centerlineSeconds &&
  s.centerlinePolice.pursuit.centerlineEnforced &&
  s.centerlinePolice.pursuit.police.phase === "stopped" &&
  s.centerlinePolice.pursuit.police.offence === "solid-line" &&
  s.centerlinePolice.pursuit.police.fine === 243 &&
  s.centerlinePolice.pursuit.police.overLimit === 0 &&
  /police pulling in behind/.test(s.centerlinePolice.pursuitCaption) &&
  s.centerlinePolice.card.police.phase === "arrest" &&
  s.centerlinePolice.cardTitle === "SOLID-LINE TICKET" &&
  /double solid · fine \$243 · 2 pts · 2\/15/.test(s.centerlinePolice.cardLine) &&
  s.centerlinePolice.cited.police.phase === "cooldown" &&
  s.centerlinePolice.cited.police.tickets === 1 &&
  s.centerlinePolice.cited.police.fines === 243 &&
  s.centerlinePolice.cited.police.lastDemerits === 2 &&
  s.centerlinePolice.cited.demeritPoints === 2 &&
  /double solid line · fine \$243 · 2 demerits · 2\/15/.test(s.centerlinePolice.caption),
  "a brief dodge is forgiven, while ten seconds across the double solid line starts the shared $243/2-demerit stop",
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
  s.pursuit.following.x < s.pursuit.joinMid.x && s.pursuit.mirror === "visible" &&
  s.pursuit.roadside.flashes.visible === "hidden" && !s.pursuit.roadside.flashes.active &&
  s.pursuit.joinNear.flashes.visible === "visible" && s.pursuit.joinNear.flashes.active &&
  s.pursuit.following.flashes.visible === "visible" && s.pursuit.following.flashes.active &&
  s.pursuit.following.flashes.transform === s.pursuit.following.police.mirrorTransform &&
  s.pursuit.following.flashes.blueAnimation === "entrance-roadtrip-police-mirror-flash-blue" &&
  s.pursuit.following.flashes.redAnimation === "entrance-roadtrip-police-mirror-flash-red" &&
  s.pursuit.following.flashes.blueDuration === "0.64s" &&
  s.pursuit.following.flashes.redDuration === "0.64s" &&
  s.pursuit.following.flashes.blueIterations === "infinite" &&
  s.pursuit.following.flashes.redIterations === "infinite" &&
  Math.abs(s.pursuit.following.flashes.blueOpacity - s.pursuit.following.flashes.redOpacity) > .7 &&
  s.pursuit.following.flashes.ariaLabels === 0,
  "speeding moves the roadside reflection into a transform-matched, alternating red/blue pursuit lightbar",
  s.pursuit);
check(s.pursuitCurves && s.pursuitCurves.right.police.mirrorMode === "pursuit" &&
  s.pursuitCurves.left.police.mirrorMode === "pursuit" &&
  s.pursuitCurves.right.x > s.pursuitCurves.left.x + 2 &&
  s.pursuitCurves.right.x > s.pursuitCurves.right.roadLeft &&
  s.pursuitCurves.right.x < s.pursuitCurves.right.roadRight &&
  s.pursuitCurves.left.x > s.pursuitCurves.left.roadLeft &&
  s.pursuitCurves.left.x < s.pursuitCurves.left.roadRight &&
  s.pursuitCurves.right.rotation > 0 && s.pursuitCurves.left.rotation < 0 &&
  s.pursuitCurves.right.behind === s.pursuitCurves.left.behind &&
  s.pursuitCurves.right.scale === s.pursuitCurves.left.scale,
  "the pursuing Sheriff follows the reflected lane through opposite bends without changing pursuit depth",
  s.pursuitCurves);
check(s.unfocused && !s.unfocused.sirenActive && s.refocused && s.refocused.sirenActive,
  "the pursuit siren tears down while unfocused and returns only when attended", {
    unfocused: s.unfocused, refocused: s.refocused
  });
check(s.stopped && s.stopped.stopped.active && s.stopped.stopped.police.phase === "stopped" &&
  s.stopped.stopped.playerLane === .5 && !s.stopped.stopped.police.sirenActive &&
  s.stopped.stopped.police.stops === 1 && !s.stopped.stopped.police.arrestVisible &&
  s.stopped.stopped.police.mirrorMode === "shoulder-arrival" &&
  s.stopped.stopped.police.mirrorBehind === s.stopped.stopped.police.stopMirrorBehind &&
  /pulling in behind/.test(s.stopped.stoppedCaption) &&
  s.stopped.arrival.police.phase === "stopped" &&
  s.stopped.arrival.police.mirrorMode === "shoulder-arrival" &&
  s.stopped.arrival.police.mirrorBehind < s.stopped.stopped.police.mirrorBehind &&
  s.stopped.arrival.police.mirrorBehind > s.contract.parkedBehind &&
  s.stopped.arrival.police.mirrorScale > s.stopped.stopped.police.mirrorScale &&
  !s.stopped.arrival.police.sirenActive &&
  s.stopped.settled.police.phase === "stopped" &&
  s.stopped.settled.police.mirrorBehind < s.stopped.arrival.police.mirrorBehind &&
  s.stopped.settled.police.mirrorBehind >= s.contract.parkedBehind &&
  s.stopped.settled.police.mirrorScale > s.stopped.arrival.police.mirrorScale &&
  s.stopped.settled.police.mirrorScale > .8 &&
  s.stopped.settled.police.mirrorRoadFraction === 0 &&
  Math.abs(s.stopped.settled.police.mirrorProjectX - s.stopped.settled.police.mirrorPathX) < .01 &&
  s.stopped.settledPose.y - 44 * s.stopped.settledPose.scale >= -111 &&
  s.stopped.settledPose.y > -76 && s.stopped.settledPose.y < -72 &&
  !s.stopped.settled.police.sirenActive &&
  s.stopped.arrestStart.police.phase === "arrest" &&
  s.stopped.arrestStart.police.mirrorMode === "shoulder-arrest" &&
  s.stopped.arrestStart.police.mirrorBehind === s.contract.parkedBehind &&
  s.stopped.arrestStart.police.mirrorScale > .8 &&
  s.stopped.arrestStart.police.mirrorRoadFraction === 0 &&
  Math.abs(s.stopped.arrestStart.police.mirrorProjectX - s.stopped.arrestStart.police.mirrorPathX) < .01 &&
  !s.stopped.arrestStart.police.sirenActive && s.stopped.arrestStart.police.arrestVisible &&
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
  s.stopped.stoppedFlashes.visible === "visible" && s.stopped.stoppedFlashes.active &&
  s.stopped.resolvedFlashes.visible === "hidden" && !s.stopped.resolvedFlashes.active &&
  s.stopped.resolvedFlashes.transform === "" &&
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
  !s.surrenderLatch.reverseSelected && s.surrenderLatch.reverseBlocked.drive.gear === 0 &&
  s.surrenderLatch.reverseBlocked.drive.speed === 0 && !s.surrenderLatch.reverseBlocked.drive.holds.throttle &&
  s.surrenderLatch.reverseBlocked.drive.roadtrip.police.surrenderLatched &&
  s.surrenderLatch.reverseBlocked.drive.roadtrip.police.phase === "stopped" &&
  !s.surrenderLatch.reverseBlocked.drive.roadtrip.police.arrestVisible &&
  s.surrenderLatch.reverseBlocked.drive.roadtrip.police.mirrorMode === "shoulder-arrival" &&
  s.surrenderLatch.reverseBlocked.drive.instruction === "entrance_roadtrip_police_stopped" &&
  /pulling in behind/.test(s.surrenderLatch.caption) &&
  s.surrenderLatch.resetStarted && s.surrenderLatch.reset.drive.roadtrip.police.phase === "idle" &&
  !s.surrenderLatch.reset.drive.roadtrip.police.surrenderLatched,
  "101 can accelerate, but sub-100 latches surrender across inputs, preserves braking and steering, then begins the patrol arrival promptly at zero",
  s.surrenderLatch);
check(s.demeritWarning && s.demeritWarning.trip.active &&
  s.demeritWarning.trip.demeritPoints === 8 && s.demeritWarning.trip.demeritWarning &&
  !s.demeritWarning.trip.suspended && s.demeritWarning.trip.police.lastDemerits === 3 &&
  /3 demerits · 8\/15 · demerit warning/.test(s.demeritWarning.caption),
  "eight points enters the warning state without suspending the Road Trip", s.demeritWarning);
check(s.courtStop && s.courtStop.stopped.active &&
  s.courtStop.stopped.police.phase === "stopped" && s.courtStop.stopped.police.tickets === 0 &&
  s.courtStop.stopped.playerLane === 1.5 &&
  s.courtStop.stopped.police.summonses === 0 && !s.courtStop.stopped.police.sirenActive &&
  !s.courtStop.stopped.police.mirrorVisible && !s.courtStop.stopped.police.arrestVisible &&
  s.courtStop.stopped.police.stopInFront && s.courtStop.stopped.police.frontVisible &&
  s.courtStop.stopped.police.frontMode === "front-arrival" &&
  s.courtStop.stopped.police.frontAhead === 1.5 &&
  s.courtStop.stopped.police.stopFrontApproachRoadFraction === .25 &&
  s.courtStop.stopped.police.stopFrontRoadFraction === .75 &&
  s.courtStop.stopped.police.frontRoadFraction === .25 &&
  s.courtStop.stopped.police.frontScale > 2 &&
  s.courtStop.stopped.police.frontBlocksDrive &&
  s.courtStop.stopped.police.frontFlashesVisible && s.courtStop.stopped.police.frontFlashesActive &&
  s.courtStop.stopped.police.frontFlashesTransform === s.courtStop.stopped.police.frontTransform &&
  s.courtStop.stoppedFlashes.visible === "visible" && s.courtStop.stoppedFlashes.active &&
  s.courtStop.stoppedFlashes.transform === s.courtStop.stopped.police.frontTransform &&
  s.courtStop.stoppedFlashes.blueAnimation === "none" &&
  s.courtStop.stoppedFlashes.redAnimation === "none" &&
  /^(blue|red)$/.test(s.courtStop.stoppedFlashes.phase) &&
  Math.abs(s.courtStop.stoppedFlashes.blueOpacity - s.courtStop.stoppedFlashes.redOpacity) > .7 &&
  s.courtStop.blockedThrottle && !s.courtStop.blockedRange && !s.courtStop.blockedMotion &&
  s.courtStop.driveBlocked.speed === 0 && s.courtStop.driveBlocked.gear === 0 &&
  s.courtStop.driveBlocked.transmission.range === "P" && !s.courtStop.driveBlocked.holds.throttle &&
  /pulling in ahead/.test(s.courtStop.stoppedCaption) && s.courtStop.escapeIgnored &&
  s.courtStop.frontMid.police.phase === "stopped" &&
  s.courtStop.frontMid.police.frontMode === "front-arrival" &&
  s.courtStop.frontMid.police.frontAhead > s.courtStop.stopped.police.frontAhead &&
  s.courtStop.frontMid.police.frontAhead < s.contract.frontParkedAhead &&
  s.courtStop.frontSettled.police.phase === "stopped" &&
  s.courtStop.frontSettled.police.frontAhead > s.courtStop.frontMid.police.frontAhead &&
  s.courtStop.frontSettled.police.frontAhead <= s.contract.frontParkedAhead &&
  s.courtStop.frontSettled.police.frontRoadFraction ===
    s.courtStop.frontSettled.police.stopFrontRoadFraction &&
  Math.abs(s.courtStop.frontSettled.police.frontProjectX -
    s.courtStop.frontSettled.police.frontPathX) < .01 &&
  s.courtStop.frontSettled.police.frontScale > 1.9 &&
  !s.courtStop.frontSettled.police.sirenActive &&
  s.courtStop.frontSettled.police.frontFlashesActive &&
  s.courtStop.frontSettled.police.frontBlocksDrive &&
  s.courtStop.arrestStart.police.phase === "arrest" &&
  s.courtStop.arrestStart.police.frontMode === "front-arrest" &&
  s.courtStop.arrestStart.police.frontAhead === s.contract.frontParkedAhead &&
  s.courtStop.arrestStart.police.frontRoadFraction ===
    s.courtStop.arrestStart.police.stopFrontRoadFraction &&
  Math.abs(s.courtStop.arrestStart.police.frontProjectX -
    s.courtStop.arrestStart.police.frontPathX) < .01 &&
  s.courtStop.arrestStart.police.frontScale > 1.9 &&
  !s.courtStop.arrestStart.police.sirenActive && s.courtStop.arrestStart.police.frontFlashesActive &&
  s.courtStop.arrestStart.police.frontBlocksDrive && s.courtStop.arrestStart.police.arrestVisible &&
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
  s.courtStop.routeChooser.routeChooserOpen && !s.courtStop.routeChooser.active &&
  s.courtStop.freshEntryStarted &&
  s.courtStop.freshEntry.active && !s.courtStop.freshEntry.paused &&
  s.courtStop.freshEntry.distance === 0 && s.courtStop.freshEntry.elapsedSeconds === 0 &&
  s.courtStop.freshEntry.score === 0 && s.courtStop.freshEntry.entityCount === 0 &&
  s.courtStop.freshEntry.damage.kind === "" && s.courtStop.freshEntry.police.phase === "idle" &&
  /55 km\/h over · court-set fine · 6 demerits · 6\/15/.test(s.courtStop.caption),
  "a court-level stop puts the patrol ahead before the summons and its next Road Trip starts fresh",
  s.courtStop);
check(s.courtStop &&
  s.courtStop.arrestStart.police.frontFlashElapsed >=
    s.courtStop.frontSettled.police.frontFlashElapsed &&
  s.courtStop.afterTransition.police.frontFlashElapsed >=
    s.courtStop.arrestStart.police.frontFlashElapsed &&
  s.courtStop.beforeTransitionFlashes.visible === "visible" &&
  s.courtStop.atTransitionFlashes.visible === "visible" &&
  s.courtStop.afterTransitionFlashes.visible === "visible" &&
  s.courtStop.beforeTransitionFlashes.active && s.courtStop.atTransitionFlashes.active &&
  s.courtStop.afterTransitionFlashes.active &&
  s.courtStop.afterTransitionFlashes.blueAnimation === "none" &&
  s.courtStop.afterTransitionFlashes.redAnimation === "none" &&
  s.courtStop.nextPhaseFlashes.phase !== s.courtStop.afterTransitionFlashes.phase &&
  s.courtStop.nextPhaseFlashes.blueOpacity === s.courtStop.afterTransitionFlashes.redOpacity &&
  s.courtStop.nextPhaseFlashes.redOpacity === s.courtStop.afterTransitionFlashes.blueOpacity &&
  s.courtStop.afterTransition.police.phase === "arrest" &&
  s.courtStop.afterTransition.police.frontFlashesTransform ===
    s.courtStop.afterTransition.police.frontTransform,
  "the front lightbar repaints from one simulation-time red/blue phase across stopped-to-arrest",
  {
    before: s.courtStop && s.courtStop.beforeTransitionFlashes,
    at: s.courtStop && s.courtStop.atTransitionFlashes,
    after: s.courtStop && s.courtStop.afterTransitionFlashes,
    afterState: s.courtStop && s.courtStop.afterTransition && s.courtStop.afterTransition.police
  });
check(s.shoutThreshold && s.shoutThreshold.eightyNineOver.police.overLimit === 89 &&
  s.shoutThreshold.eightyNineStopped.playerLane === .5 &&
  s.shoutThreshold.eightyNineStopped.police.stopFrontApproachRoadFraction === .75 &&
  s.shoutThreshold.eightyNineStopped.police.stopFrontRoadFraction === .25 &&
  s.shoutThreshold.eightyNineStopped.police.frontRoadFraction === .75 &&
  !s.shoutThreshold.eightyNineStopped.police.sirenActive &&
  s.shoutThreshold.eightyNineStopped.police.frontFlashesActive &&
  !s.shoutThreshold.eightyNineOver.police.arrestShoutPlayed &&
  Math.abs(s.shoutThreshold.eightyNineOver.police.frontProjectX -
    s.shoutThreshold.eightyNineOver.police.frontPathX) < .01 &&
  !s.shoutThreshold.eightyNineOver.police.sirenActive &&
  s.shoutThreshold.eightyNineOver.police.arrestShoutOpacity === 0 &&
  s.shoutThreshold.eightyNineOver.police.arrestHandcuffsOpacity === 0 &&
  s.shoutThreshold.ninetyOverEnglish.police.overLimit === 90 &&
  s.shoutThreshold.ninetyOverStopped.playerLane === 1.5 &&
  s.shoutThreshold.ninetyOverStopped.police.stopFrontApproachRoadFraction === .25 &&
  s.shoutThreshold.ninetyOverStopped.police.stopFrontRoadFraction === .75 &&
  s.shoutThreshold.ninetyOverStopped.police.frontRoadFraction === .25 &&
  s.shoutThreshold.ninetyOverStopped.police.sirenActive &&
  s.shoutThreshold.ninetyOverStopped.police.frontFlashesActive &&
  s.shoutThreshold.ninetyOverEnglish.police.arrestShoutPlayed &&
  Math.abs(s.shoutThreshold.ninetyOverEnglish.police.frontProjectX -
    s.shoutThreshold.ninetyOverEnglish.police.frontPathX) < .01 &&
  s.shoutThreshold.ninetyOverEnglish.police.sirenActive &&
  s.shoutThreshold.ninetyOverEnglish.police.arrestShoutOpacity > .9 &&
  s.shoutThreshold.ninetyOverEnglish.police.arrestHandcuffsOpacity === 1 &&
  s.shoutThreshold.ninetyOverEnglish.police.arrestShoutText ===
    "ENGINE OFF! DROP THE KEYS! HANDS THROUGH THE WHEEL!" &&
  s.shoutThreshold.ninetyOverEnglish.police.arrestAudioVoices > 0 &&
  s.shoutThreshold.ninetyOverCzech.police.arrestShoutText ===
    "VYPNĚTE MOTOR! ZAHOĎTE KLÍČE! RUCE SKRZ VOLANT!" &&
  s.shoutThreshold.blurred.police.arrestAudioVoices === 0,
  "the bilingual command shout and handcuffs begin at 90 over, and its audio tears down on blur",
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
  s.severe.captureStart.flashes.visible === "visible" && s.severe.captureStart.flashes.active &&
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
  s.refused.capture.police.mirrorVisible &&
  s.refused.approach.police.phase === "arrest" && s.refused.approach.police.arrestVisible &&
  s.refused.approach.police.resolutionReason === "refused" &&
  s.refused.shout.police.phase === "arrest" && s.refused.shout.police.arrestShoutPlayed &&
  s.refused.shout.police.arrestShoutOpacity > .9 &&
  !s.refused.trip.active && s.refused.trip.police.runEnded &&
  s.refused.trip.police.endReason === "refused" && s.refused.trip.police.fines === 560 &&
  s.refused.trip.police.scorePenalties === 1560 && s.refused.trip.demeritPoints === 9 &&
  s.refused.trip.police.lastDemerits === 9 && !s.refused.trip.police.arrestVisible,
  "a paused pursuit resumes intact; refusal at any ticket speed forces capture, shouted approach, and citation",
  s.refused && {
    paused: { active: s.refused.paused.active, paused: s.refused.paused.paused,
      phase: s.refused.paused.police.phase, speed: s.refused.paused.police.detectedSpeed },
    resumed: { active: s.refused.resumed.active, paused: s.refused.resumed.paused,
      phase: s.refused.resumed.police.phase, speed: s.refused.resumed.police.detectedSpeed },
    capture: { phase: s.refused.capture.police.phase,
      mirror: s.refused.capture.police.mirrorVisible },
    approach: { phase: s.refused.approach.police.phase,
      visible: s.refused.approach.police.arrestVisible,
      reason: s.refused.approach.police.resolutionReason },
    shout: { phase: s.refused.shout.police.phase,
      played: s.refused.shout.police.arrestShoutPlayed,
      opacity: s.refused.shout.police.arrestShoutOpacity },
    terminal: { active: s.refused.trip.active, phase: s.refused.trip.police.phase,
      ended: s.refused.trip.police.runEnded, reason: s.refused.trip.police.endReason,
      fines: s.refused.trip.police.fines, penalty: s.refused.trip.police.scorePenalties,
      lastDemerits: s.refused.trip.police.lastDemerits,
      arrestVisible: s.refused.trip.police.arrestVisible },
    demerits: s.refused.trip.demeritPoints
  });
var suspensionStop = s.suspensionStop;
var suspensionImmediateHolds = suspensionStop && Object.keys(suspensionStop.immediate.drive.holds).every(function (key) {
  return suspensionStop.immediate.drive.holds[key] === false;
});
var suspensionBlockedHolds = suspensionStop && Object.keys(suspensionStop.blocked.drive.holds).every(function (key) {
  return suspensionStop.blocked.drive.holds[key] === false;
});
check(suspensionStop && suspensionStop.moving.car.engineOn && suspensionStop.moving.drive.roadtrip.active &&
  suspensionStop.moving.drive.speed > 0 && suspensionStop.moving.drive.gear === 3 &&
  suspensionStop.moving.drive.rpm > 0 && suspensionStop.moving.drive.holds.throttle &&
  suspensionStop.moving.drive.holds.brake &&
  suspensionStop.moving.drive.holds.steerRight && suspensionStop.moving.drive.frameActive &&
  suspensionStop.immediate.car.engineOn === false && suspensionStop.immediate.drive.speed === 0 &&
  suspensionStop.immediate.drive.rpm === 0 && suspensionStop.immediate.drive.gear === 0 &&
  suspensionImmediateHolds && suspensionStop.immediate.drive.clutchEngagement.remainingMs === 0 &&
  suspensionStop.immediate.drive.clutchEngagement.durationMs === 0 &&
  suspensionStop.immediate.drive.clutchEngagement.releaseRpm === 0 &&
  suspensionStop.immediate.drive.clutchEngagement.strength === 0 &&
  suspensionStop.immediate.drive.steeringAngle === 0 &&
  suspensionStop.immediate.drive.keyboardSteering.direction === 0 &&
  suspensionStop.immediate.drive.keyboardSteering.authority === 0 &&
  !suspensionStop.immediate.drive.frameActive && !suspensionStop.immediate.drive.audioActive &&
  !suspensionStop.immediate.drive.musicActive && !suspensionStop.immediate.drive.acAudioActive &&
  !suspensionStop.immediate.car.idleActive && !suspensionStop.immediate.drive.roadtrip.active &&
  !suspensionStop.immediate.drive.roadtrip.paused &&
  suspensionStop.immediate.drive.roadtrip.police.runEnded &&
  suspensionStop.immediate.drive.roadtrip.police.endReason === "suspended" &&
  suspensionStop.attempts.length === 3 && suspensionStop.attempts.every(function (attempt) {
    return attempt.throttle && attempt.brake && attempt.clutch && attempt.steerLeft &&
      attempt.steerRight && attempt.keyboard && !attempt.gear && !attempt.motion;
  }) &&
  suspensionStop.blocked.car.engineOn === false && suspensionStop.blocked.drive.speed === 0 &&
  suspensionStop.blocked.drive.rpm === 0 && suspensionStop.blocked.drive.gear === 0 &&
  suspensionBlockedHolds && !suspensionStop.blocked.drive.frameActive &&
  !suspensionStop.blocked.drive.audioActive && !suspensionStop.blocked.drive.musicActive &&
  suspensionStop.blocked.drive.position === suspensionStop.immediate.drive.position &&
  suspensionStop.blocked.drive.odometerKm === suspensionStop.immediate.drive.odometerKm &&
  suspensionStop.blocked.drive.roadtrip.distance === suspensionStop.immediate.drive.roadtrip.distance &&
  suspensionStop.blocked.drive.roadtrip.elapsedSeconds === suspensionStop.immediate.drive.roadtrip.elapsedSeconds &&
  !suspensionStop.expiredParked.car.engineOn && suspensionStop.expiredParked.drive.speed === 0 &&
  suspensionStop.expiredParked.drive.rpm === 0 && suspensionStop.expiredParked.drive.gear === 0 &&
  suspensionStop.expiredParked.drive.roadtrip.demeritPoints === 7 &&
  !suspensionStop.expiredParked.drive.roadtrip.suspended && suspensionStop.expiredStarted &&
  suspensionStop.expiredRunning.car.engineOn && suspensionStop.expiredRunning.drive.speed === 0 &&
  suspensionStop.expiredRunning.drive.rpm === 750 && suspensionStop.expiredRunning.drive.gear === 0,
  "suspension atomically stops a moving running car, defeats repeated drivetrain inputs, and never restores motion on expiry",
  suspensionStop);
check(s.suspension && !s.suspension.trip.active && s.suspension.trip.suspended &&
  s.suspension.trip.demeritPoints === 15 && s.suspension.trip.police.lastDemerits === 9 &&
  s.suspension.trip.police.lastDemeritTotal === 15 && s.suspension.trip.police.runEnded &&
  s.suspension.buttonTextY === "15" &&
  s.suspension.hudPoints === "15 / 15" && s.suspension.hudBac === "0.00" &&
  s.suspension.hudStatusAbsent &&
  !s.suspension.state.car.engineOn && s.suspension.state.drive.speed === 0 &&
  s.suspension.state.drive.rpm === 0 && s.suspension.state.drive.gear === 0 &&
  !s.suspension.state.drive.audioActive && !s.suspension.state.drive.musicActive &&
  s.suspension.buttonSuspended && /Suspended · 1:00|Suspended · 0:59/.test(s.suspension.buttonText) &&
  /No pull-over · fine \$560 · 9 pts · 15\/15 · licence suspended for/.test(s.suspension.caption) &&
  /· −1,000 score\.$/.test(s.suspension.caption) && !s.suspension.restart,
  "refusal stacks five points onto the offence, caps at 15, ends the run, and disables re-entry",
  s.suspension);
var blockedIgnition = s.suspension && s.suspension.ignition;
var blockedBaselineCount = blockedIgnition && (blockedIgnition.baseline.car.activations.engine || 0);
check(blockedIgnition && blockedIgnition.baseline.drive.hud === false &&
  JSON.stringify(blockedIgnition.roomReturns) === JSON.stringify([true, true]) &&
  blockedIgnition.room.car.engineOn === false && blockedIgnition.room.drive.rpm === 0 &&
  blockedIgnition.room.drive.gear === 0 && !blockedIgnition.room.car.idleActive &&
  !blockedIgnition.room.drive.audioActive &&
  blockedIgnition.room.car.activations.engine === blockedBaselineCount + 2 &&
  blockedIgnition.hud.car.engineOn === false && blockedIgnition.hud.drive.rpm === 0 &&
  blockedIgnition.hud.drive.gear === 0 && !blockedIgnition.hud.car.idleActive &&
  !blockedIgnition.hud.drive.audioActive &&
  blockedIgnition.hud.car.activations.engine === blockedBaselineCount + 4 &&
  blockedIgnition.keyboard.car.engineOn === false && blockedIgnition.keyboard.drive.rpm === 0 &&
  blockedIgnition.keyboard.drive.gear === 0 && !blockedIgnition.keyboard.car.idleActive &&
  !blockedIgnition.keyboard.drive.audioActive &&
  blockedIgnition.keyboard.car.activations.engine === blockedBaselineCount + 6 &&
  blockedIgnition.caption === "Licence suspended · Road Trip temporarily unavailable." &&
  blockedIgnition.captionBlink && blockedIgnition.keyDisplay === "none" && blockedIgnition.reenterPulse &&
  blockedIgnition.buttonAnimation === "entrance-roadtrip-suspension-blocked" &&
  s.suspension.expiry.started && s.suspension.expiry.state.car.engineOn &&
  s.suspension.expiry.state.drive.rpm === 750 &&
  s.suspension.expiry.keyDisplay !== "none" &&
  s.suspension.expiry.state.drive.roadtrip.demeritPoints === 7 &&
  !s.suspension.expiry.state.drive.roadtrip.suspended,
  "suspension blocks repeated room, HUD, and Enter ignition attempts without engine/audio leakage, then expires normally",
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
  s.teardown.before.police.frontVisible && s.teardown.before.police.frontMode === "front-arrest" &&
  !s.teardown.closed.open && !s.teardown.closed.drive.roadtrip.active &&
  s.teardown.closed.drive.roadtrip.police.phase === "idle" &&
  !s.teardown.closed.drive.roadtrip.police.frontVisible &&
  !s.teardown.closed.drive.roadtrip.police.arrestVisible &&
  s.teardown.closed.drive.roadtrip.police.arrestAudioVoices === 0 &&
  !s.teardown.reset.drive.roadtrip.active && !s.teardown.reset.drive.roadtrip.police.frontVisible &&
  !s.teardown.reset.drive.roadtrip.police.arrestVisible &&
  s.teardown.reset.drive.roadtrip.police.arrestAudioVoices === 0,
  "room close and full reset tear down arrest state, visuals, siren, and one-shots", s.teardown);

var reducedResult = lib.runPageSync("rsvp.html", REDUCED_MOTION_HARNESS, 2500, {
  forceReduce: true,
  chromeFlags: "--force-prefers-reduced-motion=reduce --autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
var reduced = reducedResult && reducedResult.steps && reducedResult.steps.blocked;
var reducedFlashes = reducedResult && reducedResult.steps && reducedResult.steps.flashes;
check(reducedResult && reducedResult.errors.length === 0, "no uncaught errors in reduced-motion suspension probe",
  reducedResult && reducedResult.errors);
check(reduced && reduced.state.car.engineOn === false && reduced.state.drive.rpm === 0 &&
  !reduced.state.car.idleActive && !reduced.state.drive.audioActive &&
  reduced.state.car.activations.engine === 2 && reduced.state.drive.roadtrip.suspended &&
  reduced.statusAbsent && reduced.buttonPulse && reduced.captionBlink &&
  reduced.buttonAnimation === "none",
  "reduced motion keeps suspension feedback on the re-entry control and caption",
  reduced);
check(reducedFlashes && reducedFlashes.phase === "pursuit" &&
  reducedFlashes.visible === "visible" && reducedFlashes.active &&
  reducedFlashes.blueAnimation === "none" && reducedFlashes.redAnimation === "none" &&
  reducedFlashes.blueOpacity === .72 && reducedFlashes.redOpacity === .72,
  "reduced motion keeps steady paired pursuit lights instead of alternating them",
  reducedFlashes);

if (failures) {
  console.log("\n" + failures + " highway-police assertion(s) failed.");
  process.exit(1);
}
console.log("\nHighway-police assertions passed.");
