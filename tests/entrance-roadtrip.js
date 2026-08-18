#!/usr/bin/env node
// First-person Entrance highway: unlock, scoring/collisions, bounded entities, and teardown.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var REQUIRED_IDS = [
  "entrance-drive-hud-svg",
  "entrance-roadtrip-world",
  "entrance-roadtrip-day-far",
  "entrance-roadtrip-day-mid",
  "entrance-roadtrip-day-near",
  "entrance-roadtrip-night-far",
  "entrance-roadtrip-night-mid",
  "entrance-roadtrip-night-near",
  "entrance-roadtrip-road",
  "entrance-roadtrip-lane-marks",
  "entrance-roadtrip-furniture",
  "entrance-roadtrip-curve-signs",
  "entrance-roadtrip-entities",
  "entrance-roadtrip-speed",
  "entrance-roadtrip-score",
  "entrance-roadtrip-best",
  "entrance-roadtrip-multiplier",
  "entrance-roadtrip-grade",
  "entrance-roadtrip-invite",
  "entrance-roadtrip-invite-accept",
  "entrance-roadtrip-reenter",
  "entrance-roadtrip-pause-dialog",
  "entrance-roadtrip-crack",
  "entrance-roadtrip-shatter",
  "entrance-roadtrip-mirror",
  "entrance-roadtrip-mirror-housing",
  "entrance-roadtrip-mirror-gasket",
  "entrance-roadtrip-mirror-road",
  "entrance-roadtrip-mirror-center",
  "entrance-roadtrip-mirror-lanes",
  "entrance-roadtrip-mirror-edges",
  "entrance-roadtrip-mirror-terrain",
  "entrance-roadtrip-mirror-trees",
  "entrance-roadtrip-mirror-entities",
  "entrance-roadtrip-mirror-clouds",
  "entrance-roadtrip-mirror-smoke",
  "entrance-roadtrip-mirror-rain",
  "entrance-roadtrip-mirror-snow",
  "entrance-roadtrip-mirror-winter",
  "entrance-roadtrip-clouds",
  "entrance-roadtrip-rain",
  "entrance-roadtrip-snow",
  "entrance-roadtrip-winter",
  "entrance-roadtrip-winter-ground",
  "entrance-roadtrip-winter-edges"
];

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var requiredIds = [
    "entrance-drive-hud-svg", "entrance-roadtrip-world", "entrance-roadtrip-road",
    "entrance-roadtrip-lane-marks", "entrance-roadtrip-furniture", "entrance-roadtrip-entities",
    "entrance-roadtrip-curve-signs",
    "entrance-roadtrip-speed", "entrance-roadtrip-score", "entrance-roadtrip-best", "entrance-roadtrip-multiplier", "entrance-roadtrip-grade",
    "entrance-roadtrip-invite", "entrance-roadtrip-invite-accept", "entrance-roadtrip-reenter",
    "entrance-roadtrip-pause-dialog",
    "entrance-roadtrip-crack", "entrance-roadtrip-shatter", "entrance-roadtrip-mirror",
    "entrance-roadtrip-mirror-housing", "entrance-roadtrip-mirror-gasket",
    "entrance-roadtrip-mirror-road", "entrance-roadtrip-mirror-center",
    "entrance-roadtrip-mirror-lanes", "entrance-roadtrip-mirror-edges",
    "entrance-roadtrip-mirror-entities", "entrance-roadtrip-mirror-clouds",
    "entrance-roadtrip-mirror-smoke", "entrance-roadtrip-mirror-rain",
    "entrance-roadtrip-mirror-snow", "entrance-roadtrip-mirror-winter", "entrance-roadtrip-clouds",
    "entrance-roadtrip-rain", "entrance-roadtrip-snow", "entrance-roadtrip-winter",
    "entrance-roadtrip-winter-ground", "entrance-roadtrip-winter-edges"
  ];
  var report = { errors: [], steps: {} };
  var attended = true;
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function metadataCount(node) {
    return Array.from(node.attributes).filter(function (attribute) {
      return attribute.name === "role" || attribute.name.indexOf("aria-") === 0;
    }).length;
  }
  function state() { return window.__entranceRoomState(); }
  function roadtrip() { return state().drive.roadtrip; }
  function pausePresentation() {
    var dialog = document.getElementById("entrance-roadtrip-pause-dialog");
    return {
      display: getComputedStyle(dialog).display,
      panelFill: dialog.querySelector("rect").getAttribute("fill"),
      panelOpacity: dialog.querySelector("rect").getAttribute("fill-opacity"),
      title: dialog.querySelector('[data-i="entrance_roadtrip_pause_title"]').textContent.trim(),
      line: dialog.querySelector('[data-i="entrance_roadtrip_pause_line"]').textContent.trim(),
      captionVisibility: getComputedStyle(document.getElementById("hunt-caption")).visibility
    };
  }
  function ensureEngine() { if (!state().car.engineOn) window.__toggleEntrancePorscheEngine(); }
  function startRoadtripInLane(lane) {
    var started = window.__entranceRoadtripDevStart();
    if (started) {
      window.__entranceRoadtripSetRoute("banff", 0);
      window.__entranceRoadtripSetSeed(0x12345678);
      window.__entranceRoadtripSetLane(lane == null ? .5 : lane);
    }
    return started;
  }
  function step(ms, count) { for (var i = 0; i < (count || 1); i++) window.__entranceDriveStep(ms); }
  function pressKey(key) {
    (document.activeElement || document).dispatchEvent(new KeyboardEvent("keydown", {
      key: key, bubbles: true, cancelable: true
    }));
  }
  function pressDocumentKey(key) {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: key, bubbles: true, cancelable: true
    }));
  }
  function releaseKey(key) {
    (document.activeElement || document).dispatchEvent(new KeyboardEvent("keyup", {
      key: key, bubbles: true, cancelable: true
    }));
  }
  function box(el) {
    var r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  }
  function viewBox() { return document.getElementById("entrance-drive-hud-svg").getAttribute("viewBox"); }
  function aspectRatio() { return document.getElementById("entrance-drive-hud-svg").getAttribute("preserveAspectRatio"); }
  function visiblePath(el, stop) {
    var hidden = null;
    for (var node = el; node && node !== stop.parentNode; node = node.parentElement) {
      var style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") {
        hidden = node.id || node.className.baseVal || node.className || node.localName;
        break;
      }
      if (node === stop) break;
    }
    var own = el && getComputedStyle(el);
    return { connected: !!(el && el.isConnected), hiddenBy: hidden, opacity: own ? parseFloat(own.opacity) : -1 };
  }
  function pooledChildren() {
    return document.getElementById("entrance-roadtrip-entities").querySelectorAll(".entrance-roadtrip-entity");
  }
  function childCount() { return pooledChildren().length; }
  function visibleChildCount() {
    return Array.prototype.filter.call(pooledChildren(), function (node) {
      return node.getAttribute("visibility") !== "hidden";
    }).length;
  }
  function visibleMirrorEntity() {
    return Array.prototype.find.call(document.getElementById("entrance-roadtrip-mirror-entities").children, function (node) {
      return node.getAttribute("visibility") !== "hidden";
    }) || null;
  }
  function spawn(type, lane, ahead) {
    var host = document.getElementById("entrance-roadtrip-entities");
    var prior = Array.prototype.slice.call(host.children);
    var value = window.__entranceRoadtripSpawn(type, lane, ahead);
    var node = value && value.nodeType ? value : Array.prototype.slice.call(host.children).filter(function (el) {
      return prior.indexOf(el) < 0;
    }).pop();
    return { node: node || null, accepted: value !== false };
  }
  function entityVisual(node) {
    var use = node && String(node.localName).toLowerCase() === "use" ? node :
      node && node.querySelector && node.querySelector("use");
    return {
      connected: !!(node && node.isConnected),
      kind: node && node.getAttribute("data-roadtrip-kind"),
      lane: node && node.getAttribute("data-roadtrip-lane"),
      direction: node && node.getAttribute("data-roadtrip-direction"),
      speed: node && Number(node.getAttribute("data-roadtrip-speed")),
      value: node && Number(node.getAttribute("data-roadtrip-value")),
      escaping: node && node.getAttribute("data-roadtrip-escaping"),
      passing: node && node.getAttribute("data-roadtrip-passing"),
      href: use && (use.getAttribute("href") || use.getAttribute("xlink:href")),
      x: translateX(node),
      display: node ? getComputedStyle(node).display : null,
      visibility: node && node.getAttribute("visibility")
    };
  }
  function translateX(node) {
    var match = String(node && node.getAttribute("transform") || "").match(/translate\(([-.\d]+)/);
    return match ? Number(match[1]) : null;
  }
  function translateY(node) {
    var match = String(node && node.getAttribute("transform") || "").match(/translate\([-.\d]+ ([-.\d]+)/);
    return match ? Number(match[1]) : null;
  }
  function transformScale(node) {
    var match = String(node && node.getAttribute("transform") || "").match(/scale\(([-.\d]+)/);
    return match ? Number(match[1]) : null;
  }
  function resolveSpawn(type, lane, counter) {
    startRoadtripInLane();
    ensureEngine();
    window.__entranceDriveSetMotion(type === "deer" || type === "rabbit" ? 36 : 120,
      type === "deer" || type === "rabbit" ? 2 : 3);
    window.__entranceDriveControl("throttle", true);
    var before = copy(roadtrip());
    var beforeSpeed = state().drive.speed;
    var made = spawn(type, lane);
    var visual = entityVisual(made.node);
    var minSpeed = beforeSpeed;
    var traces = [];
    for (var i = 0; i < 8; i++) {
      step(1000);
      var now = state();
      minSpeed = Math.min(minSpeed, now.drive.speed);
      traces.push({ speed: now.drive.speed, roadtrip: copy(now.drive.roadtrip) });
      if (now.drive.roadtrip[counter] > before[counter] &&
          (!made.node || made.node.getAttribute("visibility") === "hidden")) break;
    }
    return {
      before: before,
      beforeSpeed: beforeSpeed,
      after: copy(roadtrip()),
      visual: visual,
      released: !!(made.node && made.node.isConnected && made.node.getAttribute("visibility") === "hidden"),
      minSpeed: minSpeed,
      afterDriveSpeed: state().drive.speed,
      afterDriveGear: state().drive.gear,
      afterDriveRange: state().drive.transmission.range,
      classes: document.getElementById("entrance-room").getAttribute("class"),
      crackOpacity: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-crack")).opacity),
      shatterOpacity: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-shatter")).opacity),
      caption: document.getElementById("hunt-caption").textContent.trim(),
      traces: traces
    };
  }
  function probeTargetWidth(type, hitGap, clearGap) {
    function attempt(gap) {
      startRoadtripInLane();
      ensureEngine();
      window.__entranceDriveSetMotion(type === "deer" || type === "rabbit" ? 36 : 160,
        type === "deer" || type === "rabbit" ? 2 : 4);
      window.__entranceDriveControl("throttle", false);
      var made = spawn(type, .5, 8);
      var center = Number(made.node && made.node.getAttribute("data-roadtrip-lane"));
      window.__entranceRoadtripSetLane(center + gap);
      var before = copy(roadtrip());
      step(320);
      var after = copy(roadtrip());
      return {
        gap: gap,
        center: center,
        collisions: after.collisions - before.collisions,
        passes: after.passes - before.passes,
        wildlifeHits: after.wildlifeHits - before.wildlifeHits,
        released: made.node && made.node.getAttribute("visibility") === "hidden"
      };
    }
    return { hit: attempt(hitGap), clear: attempt(clearGap) };
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }

  async function run() {
    var hooks = ["__entranceRoadtripStart", "__entranceRoadtripSpawn", "__entranceRoadtripSetDistance",
      "__entranceRoadtripSetLane", "__entranceDriveStep", "__entranceDriveSetMotion",
      "__entranceDriveTireAudio", "__entranceDriveSpatialAudio", "__entranceRoadtripTrafficAudio",
      "__entranceRoadtripSpawnPlan", "__entranceRoomState"];
    report.steps.fresh = {
      ids: requiredIds.map(function (id) { return [id, !!document.getElementById(id)]; }),
      hooks: hooks.map(function (name) { return [name, typeof window[name]]; })
    };
    report.steps.naturalTrafficPlan = Array.from({ length: 20 }, function (_, serial) {
      return window.__entranceRoadtripSpawnPlan(false, serial);
    });
    if (report.steps.fresh.ids.some(function (row) { return !row[1]; }) ||
        report.steps.fresh.hooks.some(function (row) { return row[1] !== "function"; })) {
      throw new Error("fresh-page roadtrip contract is incomplete");
    }
    report.steps.tireAudio = {
      urban: window.__entranceDriveTireAudio(35, 0, "road"),
      highway: window.__entranceDriveTireAudio(160, 0, "road"),
      corner: window.__entranceDriveTireAudio(160, 18, "road"),
      rumble: window.__entranceDriveTireAudio(100, 5, "rumble"),
      gravel: window.__entranceDriveTireAudio(100, 5, "gravel")
    };

    Object.defineProperty(document, "hasFocus", { value: function () { return attended; }, configurable: true });
    window.__unlockAllRooms();
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "dungeon", "cinema", "bedroom", "entrance"]);
    window.__setSecondRound(true, { releaseHeld: false });
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    await sleep(40);
    window.__setBalconySnow(false, "test");
    window.__setBalconyStormLayer(false, "test");
    window.__setBalconyOvercast(true, "test");
    window.__setBalconyRain(true, "test");
    window.__openEntrancePorscheDriveHud();
    report.steps.exteriorSpatial = {
      engine: window.__entranceDriveSpatialAudio("engine"),
      tire: window.__entranceDriveSpatialAudio("tire")
    };
    var normalHudEnter = { before: copy(state()) };
    pressDocumentKey("Enter");
    normalHudEnter.started = copy(state());
    pressDocumentKey("Enter");
    normalHudEnter.secondEnter = copy(state());
    report.steps.normalHudEnter = normalHudEnter;
    // The rest of this long-running harness assumes a fresh explicit stop/start
    // baseline before its drivetrain sweeps.
    document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    window.__toggleEntrancePorscheEngine();
    ensureEngine();
    window.__entranceDriveRange("D", true);
    window.__entranceDriveControl("throttle", true);

    var room = document.getElementById("entrance-room");
    var hud = document.getElementById("entrance-drive-hud");
    var svg = document.getElementById("entrance-drive-hud-svg");
    var beforeClasses = Array.prototype.slice.call(room.classList).filter(function (name) {
      return /^entrance-(?:day|clouded|raining|snowing|winter-cover)$/.test(name);
    });
    var practice = [];
    var seenPractice = -1;
    for (var i = 0; i < 1200 && roadtrip().practiceLaps < 1; i++) {
      step(80);
      if (roadtrip().practiceLaps !== seenPractice) {
        seenPractice = roadtrip().practiceLaps;
        practice.push({ practiceLaps: seenPractice, active: roadtrip().active, unlocked: roadtrip().unlocked });
      }
    }
    var beforeExploration = copy(roadtrip());
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    var afterExploration = copy(roadtrip());
    document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    await sleep(520);
    var offerBeforeDrive = copy(roadtrip());
    step(250);
    var offerAfterDrive = copy(roadtrip());
    var invitation = document.getElementById("entrance-roadtrip-invite");
    var offer = {
      before: offerBeforeDrive,
      after: offerAfterDrive,
      visible: invitation.classList.contains("show"),
      metadata: metadataCount(invitation),
      transform: invitation.getAttribute("transform"),
      viewBox: viewBox(),
      panelX: Number(invitation.children[0].getAttribute("x")),
      panelWidth: Number(invitation.children[0].getAttribute("width")),
      panelHeight: Number(invitation.children[0].getAttribute("height")),
      dismissControl: !!document.getElementById("entrance-roadtrip-invite-later"),
      title: invitation.querySelector("[data-i=entrance_roadtrip_invite_title]").textContent.trim()
    };
    window.__setLang("cs");
    offer.czech = {
      title: invitation.querySelector("[data-i=entrance_roadtrip_invite_title]").textContent.trim(),
      accept: invitation.querySelector("[data-i=entrance_roadtrip_invite_accept]").textContent.trim(),
      acceptMetadata: metadataCount(document.getElementById("entrance-roadtrip-invite-accept"))
    };
    window.__setLang("en");
    pressKey("Escape");
    var firstDismissed = {
      state: copy(state()),
      visible: invitation.classList.contains("show"),
      metadata: metadataCount(invitation)
    };
    window.__hideEntrancePorscheDriveHud();
    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    window.__entranceDriveSetMotion(263, 6);
    window.__entranceDriveControl("throttle", true);
    for (var reofferTick = 0; reofferTick < 20 && !roadtrip().invitationReady; reofferTick++) step(80);
    window.__entranceDriveControl("throttle", false);
    var reoffered = {
      state: copy(state()),
      visible: invitation.classList.contains("show"),
      metadata: metadataCount(invitation)
    };
    pressKey("Enter");
    await sleep(80);
    window.__entranceRoadtripSetRoute("banff", 0);
    window.__entranceRoadtripSetLane(-2.32);
    var highwayLeft = {
      engine: window.__entranceDriveSpatialAudio("engine"),
      tire: window.__entranceDriveSpatialAudio("tire")
    };
    window.__entranceRoadtripSetLane(2.32);
    var highwayRight = {
      engine: window.__entranceDriveSpatialAudio("engine"),
      tire: window.__entranceDriveSpatialAudio("tire")
    };
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveSetMotion(100, 4);
    var trafficEntityLeft = { type: "car", direction: "oncoming", lane: -.5, velocity: -25 };
    var trafficEntityRight = { type: "car", direction: "forward", lane: 1.5, velocity: 25 };
    var trafficClosed = {
      leftNear: window.__entranceRoadtripTrafficAudio(trafficEntityLeft, 8),
      leftFar: window.__entranceRoadtripTrafficAudio(trafficEntityLeft, 40),
      rightNear: window.__entranceRoadtripTrafficAudio(trafficEntityRight, 8),
      tire: window.__entranceDriveSpatialAudio("tire")
    };
    document.getElementById("entrance-porsche-window").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    var trafficWindow = {
      leftNear: window.__entranceRoadtripTrafficAudio(trafficEntityLeft, 8),
      tire: window.__entranceDriveSpatialAudio("tire")
    };
    document.getElementById("entrance-porsche-roof").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    var trafficRoof = {
      leftNear: window.__entranceRoadtripTrafficAudio(trafficEntityLeft, 8),
      tire: window.__entranceDriveSpatialAudio("tire")
    };
    document.getElementById("entrance-porsche-roof").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    document.getElementById("entrance-porsche-window").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    report.steps.spatialAudio = {
      left: highwayLeft,
      right: highwayRight,
      closed: trafficClosed,
      window: trafficWindow,
      roof: trafficRoof
    };
    var activeClasses = Array.prototype.slice.call(room.classList);
    report.steps.activation = {
      offer: offer,
      firstDismissed: firstDismissed,
      reoffered: reoffered,
      beforeClasses: beforeClasses,
      practice: practice,
      exploration: { before: beforeExploration, after: afterExploration },
      roadtrip: copy(roadtrip()),
      roomClasses: activeClasses,
      viewBox: viewBox(),
      aspectRatio: aspectRatio(),
      geometry: { room: box(room), hud: box(hud), svg: box(svg) },
      retained: {
        roomArt: { display: getComputedStyle(document.getElementById("entrance-room-art")).display },
        porsche: { display: getComputedStyle(document.getElementById("entrance-porsche")).display },
        spatial: window.__entranceDriveSpatialAudio("engine")
      },
      weather: {
        oldRain: visiblePath(document.querySelector(".entrance-drive-windshield-rain"), hud),
        oldSnow: visiblePath(document.querySelector(".entrance-drive-windshield-snow"), hud),
        clouds: visiblePath(document.getElementById("entrance-roadtrip-clouds"), hud),
        rain: visiblePath(document.getElementById("entrance-roadtrip-rain"), hud),
        snow: visiblePath(document.getElementById("entrance-roadtrip-snow"), hud),
        winter: visiblePath(document.getElementById("entrance-roadtrip-winter"), hud),
        mirrorClouds: visiblePath(document.getElementById("entrance-roadtrip-mirror-clouds"), hud),
        mirrorSmoke: visiblePath(document.getElementById("entrance-roadtrip-mirror-smoke"), hud),
        mirrorRain: visiblePath(document.getElementById("entrance-roadtrip-mirror-rain"), hud),
        mirrorSnow: visiblePath(document.getElementById("entrance-roadtrip-mirror-snow"), hud),
        mirrorWinter: visiblePath(document.getElementById("entrance-roadtrip-mirror-winter"), hud)
      }
    };
    function speedHudAt(value) {
      window.__entranceDriveSetMotion(value, value > 214 ? 5 : 4);
      window.__refreshEntranceRoadtripHud();
      var node = document.getElementById("entrance-roadtrip-speed");
      return { text: node.textContent, band: node.getAttribute("data-roadtrip-speed-band") };
    }
    report.steps.speedHud = [speedHudAt(100), speedHudAt(101), speedHudAt(150),
      speedHudAt(151), speedHudAt(215), speedHudAt(216)];
    window.__entranceDriveControl("throttle", false);
    window.__entranceDriveTransmissionMode("manual", true);
    window.__entranceDriveSetMotion(25, 6);
    step(20);
    report.steps.lowSpeedNeutral = { gear: state().drive.gear, speed: state().drive.speed };
    window.__entranceDriveControl("throttle", true);
    window.__entranceDriveSetMotion(66, 1);
    step(700);
    var shiftUpEarly = state().drive.instruction;
    step(200);
    var shiftUpReady = state().drive.instruction;
    window.__entranceDriveControl("throttle", false);
    window.__entranceDriveSetMotion(55, 4);
    step(20);
    step(700);
    var shiftDownEarly = state().drive.instruction;
    step(150);
    var shiftDownReady = state().drive.instruction;
    window.__entranceDriveSetMotion(120, 3);
    step(20);
    report.steps.shiftCoaching = {
      upEarly: shiftUpEarly,
      upReady: shiftUpReady,
      downEarly: shiftDownEarly,
      downReady: shiftDownReady,
      cleared: state().drive.instruction
    };
    window.__entranceDriveTransmissionMode("auto", true);
    if (window.__cancelCaption) window.__cancelCaption("entrance-transmission");
    startRoadtripInLane();
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveSetMotion(90, 3);
    spawn("heart", .5, 5);
    window.__entranceRoadtripSetDistance(4);
    step(50);
    var centerlineBefore = copy(roadtrip());
    window.__entranceRoadtripSetLane(-.2);
    step(20);
    var centerlineFirst = copy(roadtrip());
    step(20);
    var centerlineHeld = copy(roadtrip());
    window.__entranceRoadtripSetLane(.5);
    step(20);
    window.__entranceRoadtripSetLane(-.2);
    step(20);
    var centerlineSecond = copy(roadtrip());
    report.steps.centerline = {
      before: centerlineBefore,
      first: centerlineFirst,
      held: centerlineHeld,
      second: centerlineSecond
    };
    startRoadtripInLane();
    window.__entranceRoadtripSetLane(1.5);
    window.__entranceDriveSetMotion(72, 3);
    window.__entranceDriveControl("throttle", true);
    var recoveredHeart = spawn("heart", .5, 5);
    step(800);
    var reverseMissed = { state: copy(state()), visible: recoveredHeart.node.getAttribute("visibility") };
    window.__entranceDriveControl("throttle", false);
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveSetMotion(-20, -1);
    step(1000);
    var reverseBackedUp = { state: copy(state()), visible: recoveredHeart.node.getAttribute("visibility") };
    window.__entranceDriveSetMotion(72, 3);
    step(500);
    var reverseCollected = { state: copy(state()), visible: recoveredHeart.node.getAttribute("visibility") };
    report.steps.reverseRecovery = {
      missed: reverseMissed,
      backedUp: reverseBackedUp,
      collected: reverseCollected
    };
    startRoadtripInLane();
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveSetMotion(90, 3);
    window.__entranceDriveControl("throttle", true);
    await sleep(45);
    var transportButton = document.getElementById("hunt-playpause-btn");
    window.dispatchEvent(new Event("blur"));
    var earlyBlurImmediate = copy(state());
    var earlyBlurImmediateButton = transportButton.classList.contains("paused");
    var earlyBlurImmediatePresentation = pausePresentation();
    attended = false;
    step(1000);
    var earlyBlurAfterFocusFlip = copy(state());
    attended = true;
    window.dispatchEvent(new Event("focus"));
    await sleep(40);
    var earlyBlurFocusReturn = copy(state());
    var earlyBlurFocusReturnButton = transportButton.classList.contains("paused");
    pressKey("ArrowRight");
    var earlyBlurResumed = copy(state());
    var earlyBlurResumedButton = transportButton.classList.contains("paused");
    releaseKey("ArrowRight");

    window.__entranceDriveControl("throttle", true);
    await sleep(20);
    attended = false;
    window.dispatchEvent(new Event("blur"));
    var focusPauseStart = copy(state());
    step(1000);
    await sleep(120);
    var focusPauseEnd = copy(state());
    attended = true;
    window.dispatchEvent(new Event("focus"));
    await sleep(90);
    var focusPauseWaiting = copy(state());
    var focusPauseWaitingClass = room.classList.contains("roadtrip-resume-pending");
    var focusPauseWaitingPresentation = pausePresentation();
    step(1000);
    var focusPauseWaitingStep = copy(state());
    (document.activeElement || document).dispatchEvent(new KeyboardEvent("keydown", {
      key: "ArrowLeft", repeat: true, bubbles: true, cancelable: true
    }));
    var focusPauseRepeatedKey = copy(state());
    pressKey("ArrowLeft");
    var focusPauseKeyboardImmediate = copy(state());
    var focusPauseKeyboardPresentation = pausePresentation();
    step(20);
    var focusPauseKeyboardStep = copy(state());
    releaseKey("ArrowLeft");

    attended = false;
    window.dispatchEvent(new Event("blur"));
    var focusPauseTouchStart = copy(state());
    step(1000);
    attended = true;
    window.dispatchEvent(new Event("focus"));
    await sleep(90);
    var focusPauseTouchWaiting = copy(state());
    var brakeControl = document.getElementById("entrance-drive-brake");
    brakeControl.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, cancelable: true, pointerId: 91, pointerType: "touch", isPrimary: true
    }));
    var focusPauseTouchImmediate = copy(state());
    step(20);
    brakeControl.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, cancelable: true, pointerId: 91, pointerType: "touch", isPrimary: true
    }));
    var focusPauseTouchStep = copy(state());

    attended = false;
    window.dispatchEvent(new Event("blur"));
    attended = true;
    window.dispatchEvent(new Event("focus"));
    await sleep(40);
    var focusPauseEscapeWaiting = copy(state());
    pressKey("Escape");
    var focusPauseEscapeAfter = copy(state());
    report.steps.focusPause = {
      earlyBlur: {
        immediate: earlyBlurImmediate,
        immediateButton: earlyBlurImmediateButton,
        immediatePresentation: earlyBlurImmediatePresentation,
        afterFocusFlip: earlyBlurAfterFocusFlip,
        focusReturn: earlyBlurFocusReturn,
        focusReturnButton: earlyBlurFocusReturnButton,
        resumed: earlyBlurResumed,
        resumedButton: earlyBlurResumedButton
      },
      start: focusPauseStart,
      end: focusPauseEnd,
      waiting: focusPauseWaiting,
      waitingClass: focusPauseWaitingClass,
      waitingPresentation: focusPauseWaitingPresentation,
      waitingStep: focusPauseWaitingStep,
      repeatedKey: focusPauseRepeatedKey,
      keyboardImmediate: focusPauseKeyboardImmediate,
      keyboardPresentation: focusPauseKeyboardPresentation,
      keyboardStep: focusPauseKeyboardStep,
      touchStart: focusPauseTouchStart,
      touchWaiting: focusPauseTouchWaiting,
      touchImmediate: focusPauseTouchImmediate,
      touchStep: focusPauseTouchStep,
      escapeWaiting: focusPauseEscapeWaiting,
      escapeAfter: focusPauseEscapeAfter,
      pauseClass: room.classList.contains("roadtrip-resume-pending")
    };
    startRoadtripInLane();
    window.__entranceDriveSetMotion(90, 3);
    window.__setBalconyRain(false, "test");
    window.__setBalconySnow(true, "test");
    await sleep(40);
    report.steps.activation.weather.snowMode = {
      classes: room.getAttribute("class"),
      rain: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-mirror-rain")).opacity),
      snow: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-mirror-snow")).opacity)
    };
    window.__setBalconySnow(false, "test");
    window.__setBalconyRain(true, "test");

    var asphalt = document.querySelector("#entrance-roadtrip-road .entrance-roadtrip-asphalt");
    function mirrorPathGeometry(id, band) {
      var d = document.getElementById(id).getAttribute("d");
      var points = [], match, re = /[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g;
      while ((match = re.exec(d))) points.push({ x: Number(match[1]), y: Number(match[2]) });
      var half = points.length / 2;
      var left = points.slice(0, half);
      var right = points.slice(half);
      if (band) right.reverse();
      var centers = left.map(function (point, index) { return (point.x + right[index].x) / 2; });
      return {
        d: d,
        points: points.length,
        centers: centers,
        farCenter: centers[0],
        nearCenter: centers[centers.length - 1],
        nearLeft: left[left.length - 1].x,
        nearRight: right[right.length - 1].x
      };
    }
    function mirrorGeometry() {
      return {
        road: mirrorPathGeometry("entrance-roadtrip-mirror-road", true),
        center: mirrorPathGeometry("entrance-roadtrip-mirror-center", false),
        lanes: mirrorPathGeometry("entrance-roadtrip-mirror-lanes", false),
        edges: mirrorPathGeometry("entrance-roadtrip-mirror-edges", false)
      };
    }
    function winterGeometry() {
      return {
        ground: document.getElementById("entrance-roadtrip-winter-ground").getAttribute("d"),
        edges: document.getElementById("entrance-roadtrip-winter-edges").getAttribute("d")
      };
    }
    var straightGeometry = asphalt.getAttribute("d");
    var straightMirror = mirrorGeometry();
    var straightWinter = winterGeometry();
    var straightScenery = copy(state().drive.scenery);
    var straightState = copy(roadtrip());
    window.__entranceRoadtripSetDistance(158);
    var headlightGroup = document.getElementById("entrance-roadtrip-headlights");
    var rightCurve = {
      state: copy(roadtrip()), road: asphalt.getAttribute("d"), mirror: mirrorGeometry(), winter: winterGeometry(),
      scenery: copy(state().drive.scenery),
      headlights: {
        span: Number(headlightGroup.getAttribute("data-roadtrip-wash-span")),
        layout: headlightGroup.getAttribute("data-roadtrip-wash-layout"),
        left: document.getElementById("entrance-roadtrip-headlight-left").getAttribute("d"),
        right: document.getElementById("entrance-roadtrip-headlight-right").getAttribute("d")
      }
    };
    window.__entranceRoadtripSetDistance(401);
    var leftCurve = { state: copy(roadtrip()), road: asphalt.getAttribute("d"), mirror: mirrorGeometry(), winter: winterGeometry(), scenery: copy(state().drive.scenery) };
    window.__entranceRoadtripSetDistance(6);
    var mirrorTreesNear = copy(roadtrip().mirrorTrees);
    window.__entranceRoadtripSetDistance(16);
    var mirrorTreesFarther = copy(roadtrip().mirrorTrees);
    report.steps.curves = {
      straight: straightGeometry,
      straightMirror: straightMirror,
      straightWinter: straightWinter,
      straightScenery: straightScenery,
      straightState: straightState,
      roadLines: Array.prototype.map.call(document.querySelectorAll(
        "#entrance-roadtrip-road > .entrance-roadtrip-edge," +
        "#entrance-roadtrip-road > .entrance-roadtrip-centerline"), function (node) {
          return { fill: getComputedStyle(node).fill, stroke: getComputedStyle(node).stroke,
            d: node.getAttribute("d") };
        }),
      right: rightCurve,
      left: leftCurve,
      mirrorTreesNear: mirrorTreesNear,
      mirrorTreesFarther: mirrorTreesFarther
    };
    report.steps.lamps = Array.prototype.map.call(document.querySelectorAll(
      '#entrance-roadtrip-furniture [data-roadtrip-furniture="lamp"]'), function (node) {
        return { side: node.getAttribute("data-roadtrip-side"), transform: node.getAttribute("transform") };
      });
    report.steps.speedSigns = Array.prototype.map.call(document.querySelectorAll(
      '#entrance-roadtrip-furniture [data-roadtrip-furniture="speed-90"]'), function (node) {
        return { side: node.getAttribute("data-roadtrip-side"), transform: node.getAttribute("transform") };
      });

    window.__entranceRoadtripSetDistance(0);
    window.__entranceRoadtripSetLane(2.14);
    window.__entranceDriveControl("throttle", false);
    var shoulderBefore = { state: copy(state()), classes: room.getAttribute("class"), svgClasses: svg.getAttribute("class") };
    step(1000);
    var shoulderAfter = { state: copy(state()), classes: room.getAttribute("class"), svgClasses: svg.getAttribute("class") };
    window.__entranceRoadtripSetLane(.5);
    var shoulderRecovered = { state: copy(state()), classes: room.getAttribute("class"), svgClasses: svg.getAttribute("class") };
    report.steps.shoulder = { before: shoulderBefore, after: shoulderAfter, recovered: shoulderRecovered };

    startRoadtripInLane();
    ensureEngine();
    window.__updatePorscheIdle();
    await sleep(30);
    window.__entranceRoadtripSetLane(.5);
    var mirrorTraffic = spawn("car", 1.5);
    window.__entranceRoadtripSetDistance(11);
    step(20);
    var mirrorPass = copy(roadtrip());
    window.__entranceRoadtripSetDistance(24);
    var mirrorNode = visibleMirrorEntity();
    var mirrorReflectedState = copy(roadtrip());
    var mirrorVisible = mirrorNode && {
      type: mirrorNode.getAttribute("data-roadtrip-mirror-type"),
      direction: mirrorNode.getAttribute("data-roadtrip-mirror-direction"),
      href: mirrorNode.getAttribute("href") || mirrorNode.getAttribute("xlink:href"),
      transform: mirrorNode.getAttribute("transform"),
      visibility: mirrorNode.getAttribute("visibility")
    };
    window.__entranceRoadtripSetDistance(58);
    step(20);
    report.steps.mirror = {
      passed: mirrorPass,
      reflectedState: mirrorReflectedState,
      source: entityVisual(mirrorTraffic.node),
      visible: mirrorVisible,
      cleared: !visibleMirrorEntity(),
      mirrorChildren: document.getElementById("entrance-roadtrip-mirror-entities").querySelectorAll(".entrance-roadtrip-mirror-entity").length
    };

    window.__entranceDriveControl("throttle", false);
    window.__dismissEntrancePorscheDriveHud();
    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    var poolStarted = startRoadtripInLane();
    var spawnTypes = ["car", "pickup", "truck", "rv", "deer", "rabbit", "heart", "kiss", "inf"];
    for (var a = 0; a < 240; a++) window.__entranceRoadtripSpawn(spawnTypes[a % spawnTypes.length], (a % 3) - 1);
    var firstStorm = { state: copy(roadtrip()), dom: childCount() };
    for (var b = 0; b < 240; b++) window.__entranceRoadtripSpawn(spawnTypes[b % spawnTypes.length], 1 - (b % 3));
    report.steps.pool = { started: poolStarted, first: firstStorm, second: { state: copy(roadtrip()), dom: childCount() } };

    window.__dismissEntrancePorscheDriveHud();
    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    var freshStarted = startRoadtripInLane();
    window.__entranceRoadtripSetDistance(99);
    window.__entranceDriveSetMotion(100, 3);
    window.__entranceDriveControl("throttle", true);
    var progressBefore = copy(roadtrip());
    step(250);
    report.steps.progress = { started: freshStarted, before: progressBefore, after: copy(roadtrip()) };
    startRoadtripInLane();
    var forwardTraffic = spawn("car", 1.5);
    var oncomingTraffic = spawn("truck", -.5);
    var pickupTraffic = spawn("pickup", .5);
    var rvTraffic = spawn("rv", -1.5);
    var trafficBefore = {
      forward: entityVisual(forwardTraffic.node),
      oncoming: entityVisual(oncomingTraffic.node),
      pickup: entityVisual(pickupTraffic.node),
      rv: entityVisual(rvTraffic.node),
      forwardScale: transformScale(forwardTraffic.node),
      oncomingScale: transformScale(oncomingTraffic.node)
    };
    step(80);
    report.steps.trafficMotion = {
      before: trafficBefore,
      after: {
        forward: entityVisual(forwardTraffic.node),
        oncoming: entityVisual(oncomingTraffic.node),
        forwardScale: transformScale(forwardTraffic.node),
        oncomingScale: transformScale(oncomingTraffic.node)
      }
    };
    startRoadtripInLane();
    window.__entranceDriveSetMotion(0, 0);
    window.__entranceDriveControl("throttle", false);
    var rightLaneRv = spawn("rv", .5, 80);
    var oppositeRightLaneRv = spawn("rv", -.5, 80);
    var freeSemi = spawn("truck", .5, 80);
    var oppositeFreeSemi = spawn("truck", -.5, 80);
    var heavyHomeLanes = {
      rv: entityVisual(rightLaneRv.node),
      oppositeRv: entityVisual(oppositeRightLaneRv.node),
      freeSemi: entityVisual(freeSemi.node),
      oppositeFreeSemi: entityVisual(oppositeFreeSemi.node)
    };
    var forwardPassTarget = spawn("rv", 1.5, 80);
    var forwardPassingSemi = spawn("truck", .5, 60);
    var oncomingPassTarget = spawn("rv", -1.5, 80);
    var oncomingPassingSemi = spawn("truck", -.5, 100);
    step(1000, 2);
    report.steps.heavyLanePolicy = {
      home: heavyHomeLanes,
      forwardTarget: entityVisual(forwardPassTarget.node),
      forwardPassing: entityVisual(forwardPassingSemi.node),
      oncomingTarget: entityVisual(oncomingPassTarget.node),
      oncomingPassing: entityVisual(oncomingPassingSemi.node)
    };
    startRoadtripInLane();
    var hoppingRabbit = spawn("rabbit", .5);
    var hopBefore = {
      visual: entityVisual(hoppingRabbit.node),
      x: translateX(hoppingRabbit.node),
      y: translateY(hoppingRabbit.node),
      transform: hoppingRabbit.node && hoppingRabbit.node.getAttribute("transform")
    };
    step(40);
    report.steps.wildlifeHop = {
      before: hopBefore,
      after: {
        visual: entityVisual(hoppingRabbit.node),
        x: translateX(hoppingRabbit.node),
        y: translateY(hoppingRabbit.node),
        transform: hoppingRabbit.node && hoppingRabbit.node.getAttribute("transform")
      }
    };
    report.steps.targetWidths = {
      rabbit: probeTargetWidth("rabbit", .15, .20),
      deer: probeTargetWidth("deer", .25, .30),
      car: probeTargetWidth("car", .29, .34),
      pickup: probeTargetWidth("pickup", .35, .40),
      rv: probeTargetWidth("rv", .43, .48),
      truck: probeTargetWidth("truck", .45, .50)
    };
    startRoadtripInLane();
    window.__entranceDriveSetMotion(160, 3);
    window.__entranceDriveControl("steerLeft", true);
    step(1000);
    window.__entranceDriveControl("steerLeft", false);
    var crashSpawn = spawn("car", -1.5);
    document.getElementById("entrance-roadtrip-crack").style.transition = "none";
    document.getElementById("entrance-roadtrip-shatter").style.transition = "none";
    var crashBefore = { state: copy(state()), visual: entityVisual(crashSpawn.node) };
    for (var crashTick = 0; crashTick < 6 && state().car.engineOn; crashTick++) step(80);
    var crashAfter = {
      state: copy(state()),
      classes: room.getAttribute("class"),
      crackOpacity: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-crack")).opacity),
      shatterOpacity: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-shatter")).opacity)
    };
    window.__toggleEntrancePorscheEngine();
    report.steps.oncomingCrash = {
      before: crashBefore,
      after: crashAfter,
      restarted: { state: copy(state()), classes: room.getAttribute("class") }
    };
    report.steps.heart = resolveSpawn("heart", 0, "tokens");
    report.steps.kiss = resolveSpawn("kiss", 0, "tokens");
    report.steps.infinity = resolveSpawn("inf", 0, "tokens");
    report.steps.collision = resolveSpawn("car", 0, "collisions");
    step(1000, 3);
    report.steps.animal = resolveSpawn("deer", 0, "escapes");
    if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__entranceDriveSetMotion(145, 3);
    window.__entranceDriveControl("throttle", true);
    startRoadtripInLane();
    var wildlifeImpactBefore = copy(state());
    var wildlifeImpactSpawn = spawn("deer", .5);
    for (var wildlifeTick = 0; wildlifeTick < 10 && roadtrip().wildlifeHits === wildlifeImpactBefore.drive.roadtrip.wildlifeHits; wildlifeTick++) step(80);
    report.steps.wildlifeImpact = {
      before: wildlifeImpactBefore,
      visual: entityVisual(wildlifeImpactSpawn.node),
      after: copy(state()),
      classes: room.getAttribute("class"),
      shakeX: parseFloat(getComputedStyle(document.getElementById("entrance-drive-hud-svg")).getPropertyValue("--roadtrip-shake-x")),
      crackOpacity: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-crack")).opacity),
      shatterOpacity: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-shatter")).opacity)
    };
    if (state().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__toggleEntrancePorscheEngine();
    startRoadtripInLane();
    window.__entranceDriveSetMotion(145, 3);
    window.__entranceDriveControl("throttle", true);
    var rabbitImpactBefore = copy(state());
    var rabbitImpactSpawn = spawn("rabbit", .5);
    for (var rabbitTick = 0; rabbitTick < 10 && roadtrip().wildlifeHits === rabbitImpactBefore.drive.roadtrip.wildlifeHits; rabbitTick++) step(80);
    report.steps.rabbitImpact = {
      before: rabbitImpactBefore,
      visual: entityVisual(rabbitImpactSpawn.node),
      after: copy(state()),
      classes: room.getAttribute("class"),
      hudClasses: document.getElementById("entrance-drive-hud-svg").getAttribute("class"),
      shakeX: parseFloat(getComputedStyle(document.getElementById("entrance-drive-hud-svg")).getPropertyValue("--roadtrip-shake-x")),
      crackOpacity: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-crack")).opacity),
      shatterOpacity: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-shatter")).opacity)
    };
    report.steps.pass = resolveSpawn("truck", 1, "passes");

    var retainedSpawn = spawn("token", 1);
    var closeBefore = { roadtrip: copy(roadtrip()), node: entityVisual(retainedSpawn.node), viewBox: viewBox() };
    window.__closeEntranceRoom();
    var reentryButton = document.getElementById("entrance-roadtrip-reenter");
    var closed = { roadtrip: copy(roadtrip()), classes: room.getAttribute("class"), viewBox: viewBox(), aspectRatio: aspectRatio(), dom: childCount(), visible: visibleChildCount(), reentryVisible: reentryButton.classList.contains("show") };
    var closedWrapStart = state().drive.wraps;
    for (var closedTick = 0; closedTick < 40 && state().drive.wraps === closedWrapStart; closedTick++) step(1000);
    var ignoredClosedWrap = state().drive.wraps;
    var parked = copy(roadtrip());
    window.__openEntranceRoom();
    await sleep(30);
    var reopened = {
      roadtrip: copy(roadtrip()),
      classes: room.getAttribute("class"),
      viewBox: viewBox(),
      reentryVisible: reentryButton.classList.contains("show"),
      reentryMetadata: metadataCount(reentryButton),
      label: document.getElementById("entrance-roadtrip-reenter-text").textContent.trim(),
      button: box(reentryButton),
      steering: box(document.getElementById("entrance-drive-steering"))
    };
    window.__setLang("cs");
    reopened.czechLabel = document.getElementById("entrance-roadtrip-reenter-text").textContent.trim();
    window.__setLang("en");
    if (state().car.engineOn) window.__toggleEntrancePorscheEngine();
    var reentryBeforeEnter = copy(state());
    pressDocumentKey("Enter");
    var reentryEngineStarted = copy(state());
    pressDocumentKey("Enter");
    var selectedReentryChoice = document.querySelector("#entrance-roadtrip-reenter-menu .selected");
    var reentryMenu = {
      open: document.getElementById("entrance-roadtrip-reenter-menu").classList.contains("show"),
      focused: document.activeElement && document.activeElement.getAttribute("data-roadtrip-reentry-choice"),
      selected: selectedReentryChoice && selectedReentryChoice.getAttribute("data-roadtrip-reentry-choice"),
      order: Array.from(document.querySelectorAll("#entrance-roadtrip-reenter-menu .entrance-roadtrip-reenter-choice.show"))
        .map(function (choice) { return choice.getAttribute("data-roadtrip-reentry-choice"); })
    };
    pressDocumentKey("Enter");
    var reenteredPaused = copy(state());
    pressDocumentKey("Enter");
    var reentered = {
      roadtrip: copy(roadtrip()),
      car: copy(state().car),
      classes: room.getAttribute("class"),
      viewBox: viewBox(),
      reentryVisible: reentryButton.classList.contains("show")
    };
    window.__exitEntranceRoadtrip();
    var returned = {
      state: copy(state()),
      reentryVisible: reentryButton.classList.contains("show"),
      reentryMetadata: metadataCount(reentryButton)
    };
    reentryButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    var clickedMenu = document.getElementById("entrance-roadtrip-reenter-menu").classList.contains("show");
    document.querySelector('[data-roadtrip-reentry-choice="continue"]').dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    var clickedPaused = copy(state());
    window.__entranceDriveControl("throttle", true);
    window.__entranceDriveControl("throttle", false);
    var clickedReentry = copy(state());
    window.__exitEntranceRoadtrip();
    window.__entranceDriveSetMotion(0, 1);
    step(20);
    report.steps.close = { before: closeBefore, closed: closed, parked: parked, reopened: reopened,
      closedWrapStart: closedWrapStart, ignoredClosedWrap: ignoredClosedWrap,
      reentryBeforeEnter: reentryBeforeEnter, reentryEngineStarted: reentryEngineStarted,
      reentryMenu: reentryMenu, reenteredPaused: reenteredPaused, reentered: reentered, returned: returned,
      clickedMenu: clickedMenu, clickedPaused: clickedPaused, clickedReentry: clickedReentry };

    var bestBeforeDismiss = roadtrip().best;
    var runBeforeDismiss = copy(roadtrip());
    window.__dismissEntrancePorscheDriveHud();
    report.steps.dismiss = {
      bestBefore: bestBeforeDismiss,
      before: runBeforeDismiss,
      roadtrip: copy(roadtrip()),
      classes: room.getAttribute("class"),
      viewBox: viewBox(),
      dom: childCount(),
      visible: visibleChildCount()
    };

    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    startRoadtripInLane();
    window.__entranceDriveSetMotion(120, 3);
    var steeringSpawn = spawn("token", -1);
    var steeringRoad = document.querySelector("#entrance-roadtrip-road .entrance-roadtrip-asphalt");
    var steeringBefore = {
      state: copy(state()),
      road: steeringRoad.getAttribute("d"),
      entityX: translateX(steeringSpawn.node)
    };
    window.__entranceDriveControl("steerLeft", true);
    step(80);
    window.__entranceDriveControl("steerLeft", false);
    pressKey("ArrowLeft");
    document.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowLeft", bubbles: true, cancelable: true }));
    report.steps.steering = {
      before: steeringBefore,
      after: {
        state: copy(state()),
        road: steeringRoad.getAttribute("d"),
        entityX: translateX(steeringSpawn.node)
      }
    };
    window.__dismissEntrancePorscheDriveHud();

    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    startRoadtripInLane();
    window.__entranceDriveSetMotion(100, 3);
    document.getElementById("hunt-floor-btn").click();
    var floorControlExit = copy(state());
    await sleep(760);
    window.__openEntranceRoom();
    await sleep(30);
    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    startRoadtripInLane();
    window.__entranceDriveSetMotion(100, 3);
    window.__exitEntranceRoadtrip();
    var closeControlExit = copy(state());
    step(250);
    var closeControlRolling = copy(state());
    window.__entranceDriveControl("throttle", false);
    window.__entranceDriveSetMotion(0, 1);
    step(20);
    window.__entranceDriveControl("throttle", true);
    step(1000);
    window.__entranceDriveControl("throttle", false);
    var streetAfterExit = copy(state());
    startRoadtripInLane();
    pressKey("Escape");
    var firstEscape = copy(state());
    pressKey("Escape");
    var secondEscape = copy(state());
    pressKey("Escape");
    var thirdEscape = copy(state());
    report.steps.exitLadder = {
      floorControl: floorControlExit,
      closeControl: closeControlExit,
      rolling: closeControlRolling,
      streetAfterExit: streetAfterExit,
      first: firstEscape,
      second: secondEscape,
      third: thirdEscape
    };

    window.__openEntranceRoom();
    await sleep(30);
    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    var checkpointPickup = resolveSpawn("heart", 0, "tokens");
    var checkpointTransient = spawn("car", 1);
    var checkpointBefore = copy(state());
    var checkpointRow = window.__captureCheckpointSystems().entrance;
    window.__restoreCheckpointSystems({ entrance: checkpointRow }, "afterStage");
    var checkpointAfter = copy(state());
    var checkpointVisible = visibleChildCount();
    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    var checkpointReady = copy(state());
    document.getElementById("entrance-roadtrip-reenter").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    document.querySelector('[data-roadtrip-reentry-choice="continue"]').dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    var checkpointPaused = copy(state());
    window.__entranceDriveControl("throttle", true);
    window.__entranceDriveControl("throttle", false);
    var checkpointResumed = copy(state());
    report.steps.checkpoint = {
      pickup: checkpointPickup,
      transient: entityVisual(checkpointTransient.node),
      before: checkpointBefore,
      row: checkpointRow,
      after: checkpointAfter,
      ready: checkpointReady,
      paused: checkpointPaused,
      resumed: checkpointResumed,
      visible: checkpointVisible
    };
    startRoadtripInLane();
    window.__entranceDriveSetMotion(90, 3);
    var transportButton = document.getElementById("hunt-playpause-btn");
    var transport = { before: copy(state()) };
    pressDocumentKey(" ");
    transport.spaceCruiseOn = copy(state());
    window.__entranceDriveSetMotion(104, 4);
    pressDocumentKey(" ");
    transport.spaceCruiseRetargeted = copy(state());
    pressDocumentKey("Enter");
    transport.enterPaused = copy(state());
    step(1000);
    transport.enterHeld = copy(state());
    window.__entranceDriveControl("throttle", true);
    transport.pedalResumed = copy(state());
    window.__entranceDriveControl("throttle", false);
    pressDocumentKey("Enter");
    transport.steeringPaused = copy(state());
    window.__entranceDriveControl("steerLeft", true);
    transport.steeringResumed = copy(state());
    window.__entranceDriveControl("steerLeft", false);
    pressDocumentKey("Enter");
    transport.enterPausedAgain = copy(state());
    pressDocumentKey("Enter");
    transport.enterResumed = copy(state());
    transportButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    transport.buttonPaused = copy(state());
    transport.buttonPausedClass = transportButton.classList.contains("paused");
    transportButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    transport.buttonResumed = copy(state());
    report.steps.transport = transport;
    startRoadtripInLane();
    window.__entranceRoadtripSpawn("token", 0);
    var bestBeforeReset = roadtrip().best;
    window.__resetCheckpointSystems();
    report.steps.reset = {
      bestBefore: bestBeforeReset,
      roadtrip: copy(roadtrip()),
      classes: room.getAttribute("class"),
      viewBox: viewBox(),
      dom: childCount(),
      visible: visibleChildCount()
    };
  }

  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) {
        report.errors.push("harness: " + String(error && error.stack || error));
      }).then(finish);
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
function retainedRun(run) {
  var keys = ["playerLane", "distance", "distancePoints", "elapsedSeconds", "score", "multiplier",
    "collisions", "passes", "tokens", "escapes", "wildlifeHits", "impactSounds", "rewardSounds",
    "lastImpactSeverity", "centerlineExcursion", "centerlineCrossings", "centerlineElapsed",
    "centerlineEnforced", "shoulderZone", "shoulderDistance",
    "nextSpawnDistance", "spawnSerial"];
  var value = {};
  keys.forEach(function (key) { value[key] = run && run[key]; });
  value.police = run && run.police && {
    phase: run.police.phase,
    nextDistance: run.police.nextDistance,
    stationAt: run.police.stationAt,
    warningCarAt: run.police.warningCarAt,
    warningElapsed: run.police.warningElapsed,
    warningFlashCount: run.police.warningFlashCount,
    warningLight: run.police.warningLight,
    detectedSpeed: run.police.detectedSpeed,
    offence: run.police.offence,
    overLimit: run.police.overLimit,
    fine: run.police.fine,
    courtRequired: run.police.courtRequired,
    pursuitElapsed: run.police.pursuitElapsed,
    pursuitDistance: run.police.pursuitDistance,
    escapeGap: run.police.escapeGap,
    escapeHoldElapsed: run.police.escapeHoldElapsed,
    runEnded: run.police.runEnded,
    endReason: run.police.endReason
  };
  value.entities = run && run.entities;
  value.damage = run && run.damage;
  return value;
}
function sameRetainedRun(left, right) {
  return JSON.stringify(retainedRun(left)) === JSON.stringify(retainedRun(right));
}

console.log("loft-day.html Entrance highway roadtrip:");
var source = fs.readFileSync(path.join(lib.ROOT, "loft-day.html"), "utf8");
check(REQUIRED_IDS.every(function (id) {
  return (source.match(new RegExp('id=["\\\']' + id + '["\\\']', "g")) || []).length === 1;
}), "fresh source contains one of every roadtrip HUD/world/weather id");
check(/window\.__entranceRoadtripStart\s*=/.test(source) && /window\.__entranceRoadtripSpawn\s*=/.test(source) &&
  /window\.__entranceRoadtripSetDistance\s*=/.test(source) && /window\.__entranceRoadtripSetLane\s*=/.test(source) &&
  /window\.__entranceDriveTireAudio\s*=/.test(source) &&
  /roadtrip\s*:/.test(source), "fresh source exports the focused roadtrip hooks and nested state");
check(/#entrance-roadtrip-mirror-smoke\{opacity:calc\(var\(--smoke,0\) \* \.4\)/.test(source) &&
  /entrance-clouded #entrance-roadtrip-mirror-clouds\{opacity:/.test(source) &&
  /entrance-raining:not\(\.entrance-snowing\) #entrance-roadtrip-mirror-rain\{opacity:/.test(source) &&
  /entrance-snowing #entrance-roadtrip-mirror-snow\{opacity:/.test(source),
  "the mirror atmosphere reads the same smoke and Entrance weather state as the windshield");
check(/id="entrance-drive-day-far"[^>]+data-scenery-layer="far"[\s\S]{0,1800}translate\(-522 -8\)[\s\S]{0,3800}translate\(793 -8\)/.test(source) &&
  /id="entrance-drive-night-far"[^>]+data-scenery-layer="far"[\s\S]{0,1400}translate\(-522 -8\)[\s\S]{0,3000}translate\(793 -8\)/.test(source) &&
  /id="entrance-drive-day-near"[^>]+data-scenery-layer="near"[\s\S]{0,1200}translate\(-72 57\)[\s\S]{0,2800}translate\(742 57\)/.test(source),
  "ordinary HUD mountains and near trees extend beyond both windshield edges");
check(["day-far", "day-mid", "day-near", "night-far", "night-mid", "night-near"].every(function (name) {
  var escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var match = source.match(new RegExp('id="entrance-roadtrip-' + escaped + '"[\\s\\S]{0,1500}</g>'));
  return match && /data-scenery-tile-width="680"/.test(match[0]) && /x="-680"/.test(match[0]) && /x="680"/.test(match[0]);
}), "each highway parallax layer carries matching offscreen tiles on both sides");
check(/entrance-roadtrip-season-winter #entrance-roadtrip-rabbit \.entrance-roadtrip-rabbit-body\{fill:#e3e2d9\}/.test(source) &&
  /class="entrance-roadtrip-rabbit-(?:body|head|ear|feet)"/.test(source) &&
  /id="entrance-roadtrip-rabbit"[^>]+stroke="#443c34"/.test(source),
  "the hare keeps grey-brown summer art and changes to outlined off-white winter fur");
check(/id="entrance-roadtrip-hedgehog"/.test(source) &&
  /id="entrance-roadtrip-mushroom"/.test(source) && /id="entrance-roadtrip-frog"/.test(source),
  "the highway owns vector hedgehog, mushroom, and frog art");
check(/id="entrance-roadtrip-inf"[\s\S]{0,180}<circle cy="-15" r="13"[\s\S]{0,180}M0-15C-3\.2-20-8-20-8-15S-3\.2-10 0-15S8-20 8-15S3\.2-10 0-15/.test(source),
  "the infinity mark is centred and inset inside its circular badge");
check(/entity\.type === "car" \? 1\.08/.test(source) &&
  /roadtripIsTrafficType\(entity\.type\) \? 1\.06 : 1/.test(source) &&
  /roadtripCollectibleValue\(entity\.type\) \? \.82 : 1/.test(source),
  "traffic and pickups receive a modest visual scale lift in the windshield and mirror");
check(/id="entrance-roadtrip-headlight-soft"[^>]+x="-48%"[^>]+width="196%"[\s\S]{0,100}<feGaussianBlur stdDeviation="9"/.test(source) &&
  (source.match(/id="entrance-roadtrip-headlight-(?:left|right)"[^>]+fill-opacity="\.34"/g) || []).length === 2,
  "highway headlights share a softened low-opacity beam treatment");
check(/id="entrance-roadtrip-mirror-housing" d="M282-115H398[^\"]+Q412-75 400-74H280Q268-75[^\"]+" fill="#2d3438"[^>]+stroke="#171c20"/.test(source) &&
  /id="entrance-roadtrip-mirror-gasket"[^>]+stroke="#13191c"/.test(source) &&
  /clipPath id="entrance-roadtrip-mirror-clip">\s*<path/.test(source),
  "the mirror uses a rounded charcoal trapezoidal housing, dark gasket, and matching reflection clip");
check(/id="entrance-roadtrip-curve-sign-right"[\s\S]{0,260}M-7-28C-7-39-3-46 7-50M1-52L7-50L5-44[^>]+stroke="#17191b"[^>]+stroke-linecap="round"[^>]+stroke-linejoin="round"/.test(source) &&
  /id="entrance-roadtrip-curve-sign-left"[\s\S]{0,260}M7-28C7-39 3-46-7-50M-1-52L-7-50L-5-44/.test(source),
  "curve signs use contained, dark, softened single-turn arrows");
check(source.indexOf('id="entrance-roadtrip-winter"') < source.indexOf('id="entrance-roadtrip-road"'),
  "accumulated snow paints beneath the road so shoulder markings remain visible at the horizon");
check(/function roadtripExplorationComplete\(\)[\s\S]{0,140}window\.__secondRound[\s\S]{0,100}window\.__seenRooms\(\)\.length >= 10/.test(source) &&
  /function roadtripAuthorized\(\)\s*\{\s*return roadtripExplorationComplete\(\);\s*\}/.test(source) &&
  /function startRoadtrip\([^)]*developerBypass\)[\s\S]{0,500}!developerBypass && \(!roadtripAuthorized\(\) \|\| !roadtripState\.unlocked\)/.test(source) &&
  /function unlockRoadtrip\(silent\)\s*\{\s*if \(!roadtripAuthorized\(\)\) return false;/.test(source) &&
  /function recordRoadtripPracticeLap\(\)[\s\S]{0,260}roadtripState\.practiceLaps = 1;[\s\S]{0,80}__checkpointChanged/.test(source) &&
  !/function recordRoadtripPracticeLap\(\)[\s\S]{0,300}unlockRoadtrip\(/.test(source) &&
  /roadtripState\.unlocked = roadtripAuthorized\(\);/.test(source) &&
  /invitationReady: roadtripState\.invitationReady,[\s\S]{0,100}invitationDismissed: roadtripState\.invitationDismissed/.test(source),
  "Phase 2 and ten seen rooms own authorization while street laps cannot bypass it");
check(!/roadtripState\.unlocked && roadtripState\.accepted && !roadtripState\.active[\s\S]{0,200}startRoadtrip\(false\)/.test(source) &&
  /function acceptRoadtripInvite\(event\)\s*\{\s*return openRoadtripRouteChooser\(event\);\s*\}/.test(source) &&
  /if \(roadtripInviteVisible\) document\.getElementById\("entrance-roadtrip-invite-accept"\)\.dispatchEvent/.test(source) &&
  /roadtripInviteVisible && window\.__dismissEntranceRoadtripInvite/.test(source),
  "the first highway entry is explicit and its full offer owns Enter and keyboard Escape");
check(/id="entrance-roadtrip-reenter"[^>]+tabindex="0"/.test(source) &&
  /roadtripState\.everAccepted \|\| roadtripState\.invitationDismissed/.test(source) &&
  /data-roadtrip-reentry-choice="continue"/.test(source) &&
  /data-roadtrip-reentry-choice="new"/.test(source) &&
  /data-roadtrip-reentry-choice="camp"/.test(source) &&
  /function continuePausedRoadtrip\(event\)[\s\S]*?startRoadtrip\(false\)/.test(source) &&
  /function beginNewRoadtrip\(event\)[\s\S]*?openRoadtripRouteChooser\(\)/.test(source),
  "accepted drivers get explicit compact Continue, New, and reached-Camping actions");
check(/var roadtripReenterVisible = roadtripReenterNode && roadtripReenterNode\.classList\.contains\("show"\)/.test(source) &&
  /event\.key === "Enter"[\s\S]{0,350}roadtripReenterVisible && document\.getElementById\("entrance-drive-hud"\)\.classList\.contains\("drive-engine-on"\)[\s\S]{0,180}roadtripReenterNode\.dispatchEvent/.test(source),
  "document Enter starts compact Road Trip re-entry only after the engine is running");
check(/var roadtrip = \{[\s\S]{0,220}unlocked: roadtripState\.unlocked,[\s\S]{0,100}accepted: false,[\s\S]{0,100}everAccepted: roadtripState\.everAccepted,/.test(source) &&
  /roadtrip\.pausedRun = captureRoadtripRun\(\)/.test(source) &&
  /roadtripState\.accepted = false;\s*roadtripState\.invitationReady = false;\s*roadtripState\.invitationDistance = 0;\s*roadtripState\.invitationDismissed = false;/.test(source),
  "checkpoint capture preserves prior acceptance and a paused run without authorizing an active session");

if (process.argv.indexOf("--source-only") >= 0) {
  if (failures) process.exit(1);
  console.log("Entrance highway roadtrip source assertions passed.");
  process.exit(0);
}

var result = lib.runPageSync("loft-day.html", HARNESS, 3500, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.fresh && s.fresh.ids.every(function (row) { return row[1]; }) &&
  s.fresh.hooks.every(function (row) { return row[1] === "function"; }),
  "a fresh page owns the complete DOM and scripting contract", s.fresh);
var innerLaneSedans = (s.naturalTrafficPlan || []).filter(function (plan) {
  return plan.type === "car" && plan.direction === "forward" && plan.lane === .5;
});
check(innerLaneSedans.length === 1,
  "the natural cycle occasionally puts one same-direction sedan in the inner left lane",
  s.naturalTrafficPlan);
var tireAudio = s.tireAudio;
check(tireAudio && tireAudio.highway.tireGain > tireAudio.urban.tireGain &&
  tireAudio.highway.windGain > tireAudio.urban.windGain &&
  tireAudio.corner.cornerGain > tireAudio.highway.cornerGain &&
  tireAudio.rumble.tireGain > tireAudio.highway.tireGain * .5 &&
  tireAudio.gravel.tireGain > tireAudio.rumble.tireGain &&
  tireAudio.gravel.roadGain > tireAudio.rumble.roadGain,
  "highway speed raises tire/wind beds, fast steering squeals, and shoulder surfaces grow rougher", tireAudio);
var exteriorSpatial = s.exteriorSpatial;
var spatialAudio = s.spatialAudio;
check(exteriorSpatial && exteriorSpatial.engine.mode === "exterior" &&
  exteriorSpatial.engine.anchor === "entrance-porsche" && exteriorSpatial.tire.mode === "exterior" &&
  exteriorSpatial.tire.anchor === "entrance-porsche",
  "block driving keeps the moving exterior Porsche as its spatial source", exteriorSpatial);
check(spatialAudio && spatialAudio.left.engine.mode === "roadtrip" &&
  spatialAudio.left.engine.anchor === "roadtrip-cabin" && spatialAudio.left.engine.pan === 0 &&
  spatialAudio.right.engine.pan === 0 && spatialAudio.left.engine.smoothing >= .2 &&
  spatialAudio.left.tire.anchor === "roadtrip-tires" && spatialAudio.left.tire.pan <= -.21 &&
  spatialAudio.right.tire.pan >= .21 && spatialAudio.left.tire.smoothing >= .15,
  "highway powertrain stays cabin-centred while tire and road audio follow lanes with gentle bounded pan",
  spatialAudio && { left: spatialAudio.left, right: spatialAudio.right });
check(spatialAudio && spatialAudio.closed.leftNear.audible &&
  spatialAudio.closed.leftNear.pan < 0 && spatialAudio.closed.rightNear.pan > 0 &&
  Math.abs(spatialAudio.closed.leftNear.pan) <= .68 && Math.abs(spatialAudio.closed.rightNear.pan) <= .68 &&
  spatialAudio.closed.leftNear.gain > spatialAudio.closed.leftFar.gain &&
  spatialAudio.closed.leftNear.gain > spatialAudio.closed.rightNear.gain &&
  spatialAudio.closed.leftNear.gain >= .1 &&
  spatialAudio.closed.leftNear.relativeKmh > spatialAudio.closed.rightNear.relativeKmh &&
  spatialAudio.closed.leftNear.smoothing >= .1,
  "each passing vehicle projects a smooth bounded pan and scales its whoosh by distance and relative speed",
  spatialAudio && spatialAudio.closed);
check(spatialAudio && spatialAudio.closed.leftNear.gain < spatialAudio.window.leftNear.gain &&
  spatialAudio.window.leftNear.gain < spatialAudio.roof.leftNear.gain &&
  spatialAudio.closed.tire.gain < spatialAudio.window.tire.gain &&
  spatialAudio.window.tire.gain < spatialAudio.roof.tire.gain,
  "opening a window and then the roof progressively admits road and passing-traffic wind", spatialAudio);

var activation = s.activation;
var normalHudEnter = s.normalHudEnter;
check(normalHudEnter && !normalHudEnter.before.car.engineOn &&
  !normalHudEnter.before.drive.roadtrip.reentryVisible && !normalHudEnter.before.drive.roadtrip.active &&
  normalHudEnter.started.car.engineOn && !normalHudEnter.started.drive.roadtrip.active &&
  !normalHudEnter.started.drive.roadtrip.reentryVisible &&
  normalHudEnter.secondEnter.car.engineOn && !normalHudEnter.secondEnter.drive.roadtrip.active,
  "without the compact mark, document Enter starts but never stops the engine", normalHudEnter);
var transport = s.transport;
check(transport && transport.before.drive.roadtrip.active && !transport.before.drive.roadtrip.resumePending &&
  transport.spaceCruiseOn.drive.roadtrip.active && !transport.spaceCruiseOn.drive.roadtrip.resumePending &&
  transport.spaceCruiseOn.drive.cruise.active && transport.spaceCruiseOn.car.engineOn &&
  transport.spaceCruiseRetargeted.drive.cruise.active &&
  transport.spaceCruiseRetargeted.drive.cruise.target === 104 &&
  !transport.spaceCruiseRetargeted.drive.roadtrip.resumePending &&
  transport.enterPaused.drive.roadtrip.resumePending &&
  transport.enterHeld.drive.roadtrip.elapsedSeconds === transport.enterPaused.drive.roadtrip.elapsedSeconds &&
  !transport.pedalResumed.drive.roadtrip.resumePending && transport.pedalResumed.car.engineOn &&
  transport.steeringPaused.drive.roadtrip.resumePending &&
  !transport.steeringResumed.drive.roadtrip.resumePending && transport.steeringResumed.car.engineOn,
  "Space sets or retargets Road Trip cruise while Enter pauses; pedals and steering still resume", transport);
check(transport && transport.enterPausedAgain.drive.roadtrip.resumePending &&
  !transport.enterResumed.drive.roadtrip.resumePending && transport.enterResumed.car.engineOn,
  "Enter pauses and resumes Road Trip instead of toggling the engine", transport);
check(transport && transport.buttonPaused.drive.roadtrip.resumePending && transport.buttonPausedClass &&
  !transport.buttonResumed.drive.roadtrip.resumePending && transport.buttonResumed.car.engineOn,
  "the chrome play/pause button owns Road Trip transport while the highway is active", transport);
check(activation && activation.practice.some(function (row) {
    return row.practiceLaps === 1 && !row.active && !row.unlocked;
  }) &&
  !activation.practice.some(function (row) { return row.practiceLaps > 1; }) &&
  activation.exploration && activation.exploration.before.practiceLaps === 1 &&
  !activation.exploration.before.unlocked && !activation.exploration.before.explorationComplete &&
  activation.exploration.after.unlocked && activation.exploration.after.explorationComplete,
  "an optional street lap stays locked until all ten rooms have been seen",
  activation && { practice: activation.practice, exploration: activation.exploration });
check(activation && activation.offer.before.practiceLaps === 1 && activation.offer.before.unlocked &&
  activation.offer.before.invitationReady && !activation.offer.before.accepted && !activation.offer.before.active &&
  !activation.offer.after.accepted && !activation.offer.after.active && activation.offer.visible &&
  activation.offer.metadata === 0 && activation.offer.title === "Let’s road trip!" &&
  activation.offer.transform === "translate(396 0)" &&
  activation.offer.panelX === 47 && activation.offer.panelWidth === 160 && activation.offer.panelHeight === 54 &&
  !activation.offer.dismissControl &&
  activation.offer.czech.title === "Jedeme na výlet!" && activation.offer.czech.accept === "Vyjet na dálnici" &&
  activation.offer.czech.acceptMetadata === 0 &&
  activation.offer.viewBox === "0 -31 680 207" && activation.firstDismissed &&
  !activation.firstDismissed.visible && activation.firstDismissed.metadata === 0 &&
  !activation.firstDismissed.state.drive.roadtrip.active && !activation.firstDismissed.state.drive.roadtrip.accepted &&
  activation.reoffered && !activation.reoffered.visible && activation.reoffered.metadata === 0 &&
  activation.reoffered.state.drive.roadtrip.reentryVisible &&
  activation.roadtrip.accepted && activation.roadtrip.everAccepted && activation.roadtrip.active,
  "10/10 shows the first full card; Escape defers it and Enter accepts the compact re-entry",
  activation && { offer: activation.offer, firstDismissed: activation.firstDismissed,
    reoffered: activation.reoffered, roadtrip: activation.roadtrip });
check(activation && activation.roomClasses.indexOf("roadtrip-active") >= 0 &&
  activation.viewBox === "0 -120 680 340" &&
  activation.aspectRatio === "xMidYMax slice" &&
  activation.geometry.hud.height >= activation.geometry.room.height * .95 &&
  Math.abs(activation.geometry.hud.top - activation.geometry.room.top) <= 1,
  "activation expands the dashboard SVG and HUD to the full Entrance view", activation);
check(activation && activation.retained.roomArt.display !== "none" && activation.retained.porsche.display !== "none" &&
  activation.retained.spatial && activation.retained.spatial.anchor === "roadtrip-cabin" &&
  activation.retained.spatial.pan === 0 &&
  isFinite(activation.retained.spatial.pan),
  "roadtrip presentation retains scene/car geometry while powertrain audio stays in the cabin", activation && activation.retained);
check(s.speedHud && s.speedHud.map(function (row) { return row.band; }).join(" ") ===
    "safe warning warning danger danger escape" &&
  s.speedHud.map(function (row) { return row.text; }).join(" ") ===
    "100 km/h 101 km/h 150 km/h 151 km/h 215 km/h 216 km/h",
  "the dominant speed readout changes from green through gold and red to the above-215 escape band", s.speedHud);
check(s.lowSpeedNeutral && s.lowSpeedNeutral.gear === 0 && s.lowSpeedNeutral.speed > 20,
  "the highway selects neutral before a too-slow upper gear can lug below idle", s.lowSpeedNeutral);
check(s.shiftCoaching &&
  s.shiftCoaching.upEarly === "entrance_roadtrip_drive" &&
  s.shiftCoaching.upReady === "entrance_drive_shift_up" &&
  s.shiftCoaching.downEarly === "entrance_roadtrip_drive" &&
  s.shiftCoaching.downReady === "entrance_drive_shift_down" &&
  s.shiftCoaching.cleared === "entrance_roadtrip_drive",
  "sustained highway RPM earns delayed shift coaching without caption flicker", s.shiftCoaching);
var centerline = s.centerline;
check(centerline && centerline.before.score === 5 && centerline.before.multiplier === 2 &&
  centerline.first.score === 3 && centerline.first.multiplier === 2 &&
  centerline.first.centerlineCrossings === 1 && centerline.first.centerlineExcursion &&
  centerline.held.score === centerline.first.score && centerline.held.centerlineCrossings === 1 &&
  centerline.second.score === 1 && centerline.second.multiplier === 2 &&
  centerline.second.centerlineCrossings === 2 && centerline.second.demeritPoints === 0,
  "brief centre-line crossings cost two game points without reaching police enforcement", centerline);
var reverseRecovery = s.reverseRecovery;
check(reverseRecovery &&
  reverseRecovery.missed.state.drive.roadtrip.score === 0 &&
  reverseRecovery.missed.state.drive.roadtrip.tokens === 0 &&
  reverseRecovery.missed.state.drive.roadtrip.entityCount === 1 &&
  reverseRecovery.backedUp.state.drive.roadtrip.distance < reverseRecovery.missed.state.drive.roadtrip.distance &&
  reverseRecovery.backedUp.state.drive.odometerKm > reverseRecovery.missed.state.drive.odometerKm &&
  reverseRecovery.backedUp.state.drive.roadtrip.score === 0 &&
  reverseRecovery.backedUp.state.drive.roadtrip.distancePoints === reverseRecovery.missed.state.drive.roadtrip.distancePoints &&
  reverseRecovery.collected.state.drive.roadtrip.tokens === 1 &&
  reverseRecovery.collected.state.drive.roadtrip.score === 5 &&
  reverseRecovery.collected.visible === "hidden",
  "reverse moves the highway backward and preserves a missed pickup for forward collection without farming distance points",
  reverseRecovery);
var focusPause = s.focusPause;
check(focusPause &&
  focusPause.earlyBlur.immediate.drive.roadtrip.resumePending &&
  focusPause.earlyBlur.immediateButton &&
  focusPause.earlyBlur.immediatePresentation.display === "none" &&
  Object.keys(focusPause.earlyBlur.immediate.drive.holds).every(function (key) { return !focusPause.earlyBlur.immediate.drive.holds[key]; }) &&
  focusPause.earlyBlur.afterFocusFlip.drive.roadtrip.elapsedSeconds === focusPause.earlyBlur.immediate.drive.roadtrip.elapsedSeconds &&
  focusPause.earlyBlur.afterFocusFlip.drive.roadtrip.distance === focusPause.earlyBlur.immediate.drive.roadtrip.distance &&
  focusPause.earlyBlur.focusReturn.drive.roadtrip.resumePending && focusPause.earlyBlur.focusReturnButton &&
  !focusPause.earlyBlur.resumed.drive.roadtrip.resumePending && !focusPause.earlyBlur.resumedButton &&
  focusPause.end.drive.roadtrip.elapsedSeconds === focusPause.start.drive.roadtrip.elapsedSeconds &&
  focusPause.end.drive.roadtrip.distance === focusPause.start.drive.roadtrip.distance &&
  focusPause.end.drive.roadtrip.score === focusPause.start.drive.roadtrip.score &&
  focusPause.end.drive.speed === focusPause.start.drive.speed &&
  Object.keys(focusPause.end.drive.holds).every(function (key) { return !focusPause.end.drive.holds[key]; }) &&
  focusPause.waiting.drive.roadtrip.resumePending && focusPause.waitingClass &&
  focusPause.waiting.drive.instruction === "entrance_roadtrip_resume" &&
  focusPause.waitingPresentation.display !== "none" &&
  focusPause.waitingPresentation.panelFill === "#8e3a4a" &&
  focusPause.waitingPresentation.panelOpacity === ".5" &&
  focusPause.waitingPresentation.title === "PAUSED" &&
  focusPause.waitingPresentation.line === "Play to resume · Esc to exit." &&
  focusPause.waitingPresentation.captionVisibility === "hidden" &&
  focusPause.waitingStep.drive.roadtrip.elapsedSeconds === focusPause.end.drive.roadtrip.elapsedSeconds &&
  focusPause.waitingStep.drive.roadtrip.distance === focusPause.end.drive.roadtrip.distance &&
  focusPause.waitingStep.drive.speed === focusPause.end.drive.speed &&
  focusPause.repeatedKey.drive.roadtrip.resumePending &&
  Object.keys(focusPause.repeatedKey.drive.holds).every(function (key) { return !focusPause.repeatedKey.drive.holds[key]; }) &&
  !focusPause.keyboardImmediate.drive.roadtrip.resumePending &&
  focusPause.keyboardPresentation.display === "none" &&
  focusPause.keyboardPresentation.captionVisibility === "visible" &&
  focusPause.keyboardImmediate.drive.roadtrip.elapsedSeconds === focusPause.waitingStep.drive.roadtrip.elapsedSeconds &&
  focusPause.keyboardImmediate.drive.roadtrip.distance === focusPause.waitingStep.drive.roadtrip.distance &&
  focusPause.keyboardImmediate.drive.speed === focusPause.waitingStep.drive.speed &&
  focusPause.keyboardImmediate.drive.keyboardSteering.authority <= .3 &&
  focusPause.keyboardStep.drive.roadtrip.elapsedSeconds > focusPause.keyboardImmediate.drive.roadtrip.elapsedSeconds &&
  focusPause.keyboardStep.drive.roadtrip.elapsedSeconds - focusPause.keyboardImmediate.drive.roadtrip.elapsedSeconds <= .03 &&
  Math.abs(focusPause.keyboardStep.drive.roadtrip.playerLane - focusPause.keyboardImmediate.drive.roadtrip.playerLane) < .02 &&
  focusPause.touchWaiting.drive.roadtrip.resumePending &&
  focusPause.touchWaiting.drive.roadtrip.elapsedSeconds === focusPause.touchStart.drive.roadtrip.elapsedSeconds &&
  focusPause.touchWaiting.drive.roadtrip.distance === focusPause.touchStart.drive.roadtrip.distance &&
  !focusPause.touchImmediate.drive.roadtrip.resumePending && focusPause.touchImmediate.drive.holds.brake &&
  focusPause.touchImmediate.drive.speed === focusPause.touchWaiting.drive.speed &&
  focusPause.touchStep.drive.speed > focusPause.touchImmediate.drive.speed - 3 &&
  !focusPause.touchStep.drive.holds.brake &&
  focusPause.escapeWaiting.drive.roadtrip.resumePending && focusPause.escapeWaiting.drive.roadtrip.active &&
  !focusPause.escapeAfter.drive.roadtrip.active && !focusPause.escapeAfter.drive.roadtrip.resumePending &&
  focusPause.escapeAfter.drive.hud && !focusPause.pauseClass,
  "blur latches the highway and Play button even before hasFocus flips, then waits for gentle fresh keyboard/touch input while Escape exits",
  focusPause);
check(activation && activation.beforeClasses.indexOf("entrance-clouded") >= 0 &&
  activation.beforeClasses.indexOf("entrance-raining") >= 0 &&
  activation.beforeClasses.every(function (name) { return activation.roomClasses.indexOf(name) >= 0; }) &&
  ["oldRain", "oldSnow", "clouds", "rain", "snow", "winter"].every(function (name) {
    return activation.weather[name].connected && !activation.weather[name].hiddenBy;
  }) && activation.weather.rain.opacity > .5 && activation.weather.snow.opacity === 0 &&
  activation.weather.mirrorRain.opacity > .5 && activation.weather.mirrorSnow.opacity === 0 &&
  activation.weather.snowMode && /entrance-snowing/.test(activation.weather.snowMode.classes) &&
  activation.weather.snowMode.rain === 0 && activation.weather.snowMode.snow > .5,
  "the extended windshield preserves Entrance weather classes and paints the canonical forward and mirror layers", activation && activation.weather);

var curves = s.curves;
function mirrorNearCentered(mirror) {
  return ["road", "center", "lanes", "edges"].every(function (name) {
    var shape = mirror[name];
    return shape && shape.points === 22 && Math.abs(shape.nearCenter - 340) < .01 &&
      Math.abs((shape.nearLeft + shape.nearRight) / 2 - 340) < .01;
  });
}
function mirrorFarAligned(mirror) {
  var centers = ["road", "center", "lanes", "edges"].map(function (name) { return mirror[name].farCenter; });
  return Math.max.apply(Math, centers) - Math.min.apply(Math, centers) < .01;
}
function mirrorBendReturnsToBase(mirror, direction) {
  return ["road", "center", "lanes", "edges"].every(function (name) {
    return mirror[name].centers.every(function (center, index, centers) {
      if (!index) return direction > 0 ? center > 341 : center < 339;
      return direction > 0 ? center <= centers[index - 1] + .01 : center >= centers[index - 1] - .01;
    });
  });
}
check(curves && curves.roadLines.length === 3 && curves.roadLines.every(function (line, index) {
    return line.stroke === "none" && /Z/.test(line.d) && line.fill ===
      (index < 2 ? "rgb(233, 229, 215)" : "rgb(216, 167, 45)");
  }), "white edge and double-yellow markings keep their approved filled perspective-band contract", curves);
check(curves && (curves.straightWinter.ground.match(/Z/g) || []).length === 2 &&
  (curves.straightWinter.edges.match(/Z/g) || []).length === 2 &&
  curves.right.winter.ground !== curves.straightWinter.ground &&
  curves.right.winter.edges !== curves.straightWinter.edges &&
  curves.left.winter.ground !== curves.right.winter.ground &&
  curves.left.winter.edges !== curves.right.winter.edges,
  "accumulated winter ground remains two separate projected verges through both road bends", curves);
check(curves && curves.right.state.curve > 0 && curves.right.road !== curves.straight &&
  curves.right.mirror.road.d !== curves.straightMirror.road.d &&
  curves.right.mirror.center.d !== curves.straightMirror.center.d &&
  curves.right.mirror.lanes.d !== curves.straightMirror.lanes.d &&
  mirrorNearCentered(curves.straightMirror) && mirrorNearCentered(curves.right.mirror) &&
  mirrorFarAligned(curves.right.mirror) && mirrorBendReturnsToBase(curves.right.mirror, 1) &&
  curves.left.state.curve < 0 && curves.left.road !== curves.right.road &&
  curves.left.mirror.road.d !== curves.right.mirror.road.d &&
  curves.left.mirror.edges.d !== curves.right.mirror.edges.d &&
  mirrorNearCentered(curves.left.mirror) && mirrorFarAligned(curves.left.mirror) &&
  mirrorBendReturnsToBase(curves.left.mirror, -1) &&
  curves.right.mirror.road.farCenter > curves.straightMirror.road.farCenter + 1 &&
  curves.left.mirror.road.farCenter < curves.straightMirror.road.farCenter - 1,
  "rear-view bends accumulate toward opposite horizon sides while every near road and marking stays centred", curves);
function firstSceneryOffset(snapshot, layer) {
  return snapshot && snapshot.roadtrip && snapshot.roadtrip[layer] && snapshot.roadtrip[layer][0];
}
function curveOnlySceneryOffset(snapshot, layer, distance) {
  var travelRate = { far: .018, mid: .055, near: .12 }[layer];
  return firstSceneryOffset(snapshot, layer) + distance * travelRate;
}
function scaleFromTransform(transform) {
  var match = String(transform || "").match(/scale\(([-.\d]+)/);
  return match ? Number(match[1]) : NaN;
}
var straightFar = curveOnlySceneryOffset(curves && curves.straightScenery, "far", curves.straightState.distance);
var straightMid = curveOnlySceneryOffset(curves && curves.straightScenery, "mid", curves.straightState.distance);
var straightNear = curveOnlySceneryOffset(curves && curves.straightScenery, "near", curves.straightState.distance);
var rightFar = curveOnlySceneryOffset(curves && curves.right.scenery, "far", curves.right.state.distance);
var rightMid = curveOnlySceneryOffset(curves && curves.right.scenery, "mid", curves.right.state.distance);
var rightNear = curveOnlySceneryOffset(curves && curves.right.scenery, "near", curves.right.state.distance);
var leftFar = curveOnlySceneryOffset(curves && curves.left.scenery, "far", curves.left.state.distance);
var leftMid = curveOnlySceneryOffset(curves && curves.left.scenery, "mid", curves.left.state.distance);
var leftNear = curveOnlySceneryOffset(curves && curves.left.scenery, "near", curves.left.state.distance);
check(curves && rightFar < straightFar && rightMid < straightMid && rightNear < straightNear &&
  Math.abs(rightFar - straightFar) < Math.abs(rightMid - straightMid) &&
  Math.abs(rightMid - straightMid) < Math.abs(rightNear - straightNear) &&
  leftFar > straightFar && leftMid > straightMid && leftNear > straightNear &&
  Math.abs(leftFar - straightFar) < Math.abs(leftMid - straightMid) &&
  Math.abs(leftMid - straightMid) < Math.abs(leftNear - straightNear) &&
  curves.right.state.mirrorTerrainOffset > 0 && curves.left.state.mirrorTerrainOffset < 0,
  "after continuous travel drift, far mountains, foothills, near terrain, and mirror terrain counter-shift through both bends", {
    straight: curves && curves.straightScenery,
    right: curves && curves.right.scenery,
    left: curves && curves.left.scenery,
    mirror: curves && [curves.right.state.mirrorTerrainOffset, curves.left.state.mirrorTerrainOffset]
  });
check(curves && curves.right.headlights && curves.right.headlights.span >= 600 &&
  curves.right.headlights.layout === "continuous" &&
  /^M34\.00 95Q/.test(curves.right.headlights.left || "") &&
  /646\.00 95Z$/.test(curves.right.headlights.left || "") && curves.right.headlights.right === "",
  "one continuous feathered headlight wash covers both shoulders without interior bands",
  curves && curves.right.headlights);
var mirrorTreeNear = curves && curves.mirrorTreesNear && curves.mirrorTreesNear.find(function (tree) { return tree.visible; });
var mirrorTreeFarther = curves && curves.mirrorTreesFarther && curves.mirrorTreesFarther.find(function (tree) { return tree.visible; });
check(mirrorTreeNear && mirrorTreeFarther && mirrorTreeNear.visible && mirrorTreeFarther.visible &&
  mirrorTreeFarther.behind > mirrorTreeNear.behind &&
  scaleFromTransform(mirrorTreeFarther.transform) < scaleFromTransform(mirrorTreeNear.transform) &&
  curves.mirrorTreesNear.filter(function (tree) { return tree.visible; }).length === 1 &&
  curves.mirrorTreesNear.length === 8 && !/entrance-roadtrip-mirror-(?:lamp|post)/.test(source),
  "the one actually passed rear-view tree recedes toward the curve-aware vanishing point without reflected lamp or post furniture", {
    near: mirrorTreeNear, farther: mirrorTreeFarther
  });
check(s.lamps && s.lamps.length >= 2 && s.lamps.every(function (lamp) {
  var scale = String(lamp.transform || "").match(/scale\(([-.\d]+) ([-.\d]+)\)/);
  return scale && (lamp.side === "right" ? Number(scale[1]) < 0 : Number(scale[1]) > 0) && Number(scale[2]) > 0;
}), "roadside lamp heads mirror by side so both point inward toward the carriageway", s.lamps);
check(s.speedSigns && s.speedSigns.length >= 2 && s.speedSigns.every(function (sign) {
  return sign.side === "right";
}), "forward-facing 90 km/h signs appear only on the right side of the road", s.speedSigns);
var shoulder = s.shoulder;
check(shoulder && shoulder.before.state.drive.roadtrip.playerLane > 2 &&
  shoulder.before.state.drive.roadtrip.shoulderZone === "gravel" &&
  shoulder.before.classes.indexOf("roadtrip-on-shoulder") >= 0 &&
  shoulder.before.classes.indexOf("roadtrip-on-gravel") >= 0 &&
  shoulder.before.svgClasses.indexOf("roadtrip-shoulder-rumble") >= 0 &&
  shoulder.after.state.drive.roadtrip.shoulderDistance > shoulder.before.state.drive.roadtrip.shoulderDistance &&
  shoulder.after.state.drive.speed < shoulder.before.state.drive.speed &&
  shoulder.recovered.state.drive.roadtrip.shoulderZone === "road" &&
  shoulder.recovered.classes.indexOf("roadtrip-on-shoulder") < 0 &&
  shoulder.recovered.svgClasses.indexOf("roadtrip-shoulder-rumble") < 0,
  "the Porsche can cross the edge line onto a rumbling gravel shoulder that bleeds speed and restores road grip", shoulder);
var mirror = s.mirror;
check(mirror && mirror.passed.passes === 1 && mirror.passed.trafficAudioVoices >= 1 &&
  mirror.visible && mirror.visible.type === "car" &&
  mirror.visible.direction === "forward" && /car-oncoming/.test(mirror.visible.href || "") &&
  /translate\(/.test(mirror.visible.transform || "") && mirror.visible.visibility !== "hidden" &&
  mirror.source.visibility === "hidden" && mirror.cleared && mirror.mirrorChildren === 6,
  "a passed car gets its own wind voice and reflects with its approaching face before both clear", mirror);

var pool = s.pool;
check(pool && pool.started && pool.first.state.poolSize > 0 &&
  pool.first.state.entityCount === pool.first.dom && pool.second.state.entityCount === pool.second.dom &&
  pool.first.state.entityCount <= pool.first.state.poolSize && pool.second.state.entityCount <= pool.second.state.poolSize &&
  pool.first.state.entityCount < 240 && pool.second.state.entityCount <= pool.first.state.poolSize,
  "spawn storms stabilize at the engine-exposed pool bound without leaking DOM entities", pool);
check(s.progress && s.progress.started && s.progress.after.distance > s.progress.before.distance &&
  s.progress.after.elapsedSeconds > s.progress.before.elapsedSeconds &&
  s.progress.after.score - s.progress.before.score === s.progress.after.distancePoints - s.progress.before.distancePoints &&
  s.progress.after.best >= s.progress.after.score,
  "positive driving advances elapsed time and awards only crossed 100-metre distance points", s.progress);
var trafficMotion = s.trafficMotion;
check(trafficMotion && trafficMotion.before.forward.direction === "forward" &&
  trafficMotion.before.oncoming.direction === "oncoming" &&
  trafficMotion.before.pickup.direction === "forward" && trafficMotion.before.rv.direction === "oncoming" &&
  /entrance-roadtrip-car/.test(trafficMotion.before.forward.href || "") &&
  /entrance-roadtrip-truck-oncoming/.test(trafficMotion.before.oncoming.href || "") &&
  /entrance-roadtrip-pickup/.test(trafficMotion.before.pickup.href || "") &&
  /entrance-roadtrip-rv-oncoming/.test(trafficMotion.before.rv.href || "") &&
  trafficMotion.after.oncomingScale > trafficMotion.after.forwardScale,
  "sedans, pickups, semis, and RVs use distinct art while opposite-lane traffic closes faster",
  trafficMotion);
var heavyLanePolicy = s.heavyLanePolicy;
check(heavyLanePolicy && heavyLanePolicy.home.rv.lane === "1.5" && heavyLanePolicy.home.oppositeRv.lane === "-1.5" &&
  heavyLanePolicy.home.freeSemi.lane === "1.5" && heavyLanePolicy.home.oppositeFreeSemi.lane === "-1.5" &&
  heavyLanePolicy.home.rv.x > heavyLanePolicy.home.freeSemi.x + 1 &&
  Math.abs(heavyLanePolicy.home.oppositeRv.x - heavyLanePolicy.home.oppositeFreeSemi.x) < .1 &&
  heavyLanePolicy.home.rv.speed >= 70 && heavyLanePolicy.home.rv.speed <= 82 &&
  Math.abs(heavyLanePolicy.home.oppositeRv.speed) >= 70 && Math.abs(heavyLanePolicy.home.oppositeRv.speed) <= 82 &&
  heavyLanePolicy.forwardPassing.passing === "true" && Number(heavyLanePolicy.forwardPassing.lane) < 1.5 &&
  Math.abs(heavyLanePolicy.forwardPassing.speed) - Math.abs(heavyLanePolicy.forwardTarget.speed) >= 20 &&
  heavyLanePolicy.oncomingPassing.passing === "true" && Number(heavyLanePolicy.oncomingPassing.lane) > -1.5 &&
  Math.abs(heavyLanePolicy.oncomingPassing.speed) - Math.abs(heavyLanePolicy.oncomingTarget.speed) >= 20,
  "cruising RVs sit right of same-lane semis while heavy traffic keeps its right-lane and passing policy",
  heavyLanePolicy);
var wildlifeHop = s.wildlifeHop;
check(wildlifeHop && wildlifeHop.before.visual.kind === "animal" &&
  wildlifeHop.before.visual.escaping === "false" && wildlifeHop.after.visual.escaping === "true" &&
  wildlifeHop.after.visual.visibility !== "hidden" && wildlifeHop.after.x > wildlifeHop.before.x &&
  wildlifeHop.after.y < wildlifeHop.before.y && /rotate\((?!0(?:\.0+)?\))/.test(wildlifeHop.after.transform || ""),
  "nearby wildlife visibly hops up and outward toward the verge before it clears the road",
  wildlifeHop);
var targetWidths = s.targetWidths;
check(targetWidths && ["rabbit", "deer", "car", "pickup", "rv", "truck"].every(function (type) {
  var probe = targetWidths[type];
  var animal = type === "rabbit" || type === "deer";
  return probe && probe.hit.collisions === 1 && probe.hit.released &&
    (animal ? probe.hit.wildlifeHits === 1 : true) && probe.clear.collisions === 0 &&
    !probe.clear.released && (animal ? probe.clear.wildlifeHits === 0 : probe.clear.passes === 1);
}), "roadtrip targets collide by visible width: rabbit, deer, sedan, pickup, RV, then semi, with close passes just outside each envelope",
  targetWidths);
var oncomingCrash = s.oncomingCrash;
check(oncomingCrash && oncomingCrash.before.visual.direction === "oncoming" &&
  !oncomingCrash.after.state.car.engineOn && oncomingCrash.after.state.drive.stalled &&
  oncomingCrash.after.state.drive.speed === 0 && oncomingCrash.after.state.drive.gear === 0 &&
  oncomingCrash.after.state.drive.transmission.range === "P" &&
  oncomingCrash.after.state.drive.roadtrip.collisions > oncomingCrash.before.state.drive.roadtrip.collisions &&
  oncomingCrash.after.state.drive.roadtrip.score - oncomingCrash.before.state.drive.roadtrip.score === -100 &&
  oncomingCrash.after.state.drive.roadtrip.multiplier === 1 &&
  oncomingCrash.after.state.drive.roadtrip.impactSounds > oncomingCrash.before.state.drive.roadtrip.impactSounds &&
  oncomingCrash.after.state.drive.roadtrip.lastImpactSeverity >= .82 &&
  oncomingCrash.after.classes.indexOf("roadtrip-shattered") >= 0 && oncomingCrash.after.shatterOpacity > .8 &&
  oncomingCrash.after.crackOpacity < .1 &&
  oncomingCrash.restarted.state.car.engineOn && !oncomingCrash.restarted.state.drive.stalled &&
  oncomingCrash.restarted.classes.indexOf("roadtrip-shattered") < 0,
  "same-lane oncoming traffic sounds a severe impact, hard-stops, stalls, and shatters the windshield until restart",
  oncomingCrash);

var collectibles = [s.heart, s.kiss, s.infinity];
var collectibleValues = [5, 10, 25];
var collectibleNames = ["heart", "kiss", "inf"];
check(collectibles.every(function (item, index) {
  return item && item.visual.kind === "collectible" && item.visual.lane === "0.5" &&
    item.visual.value === collectibleValues[index] && item.visual.display !== "none" &&
    item.visual.visibility !== "hidden" &&
    new RegExp("entrance-roadtrip-" + collectibleNames[index]).test(item.visual.href || "") && item.released &&
    item.after.tokens > item.before.tokens &&
    item.after.rewardSounds === item.before.rewardSounds + 1 &&
    item.after.score - item.before.score === collectibleValues[index] * item.before.multiplier &&
    item.caption.indexOf("+" + (item.after.score - item.before.score) + " pts") >= 0 &&
    item.caption.indexOf(item.before.multiplier + "× combo") >= 0 &&
    item.after.multiplier > item.before.multiplier;
}), "heart, kiss, and rare infinity pickups sound, collect, and caption the actual award and combo",
  collectibles);
var collision = s.collision;
check(collision && collision.visual.kind === "traffic" && collision.visual.lane === "0.5" && collision.visual.direction === "forward" && collision.released &&
  collision.after.collisions > collision.before.collisions &&
  collision.after.score < collision.before.score && collision.before.score - collision.after.score >= 10 &&
  collision.before.score - collision.after.score <= 40 &&
  collision.after.impactSounds > collision.before.impactSounds && collision.after.lastImpactSeverity > 0 &&
  collision.afterDriveSpeed < collision.visual.speed && collision.minSpeed < collision.beforeSpeed * .45 &&
  collision.afterDriveGear > 0 && collision.afterDriveRange === "D" &&
  collision.after.multiplier === 1 && collision.classes.indexOf("roadtrip-cracked") >= 0 &&
  collision.crackOpacity > .25 && collision.shatterOpacity < .1,
  "rear-ending traffic deducts 10–40 points, kicks below traffic speed, keeps AUTO in drive, cracks the glass, and resets the combo", collision);
var animal = s.animal;
check(animal && animal.visual.kind === "animal" && animal.visual.lane === "0.5" && animal.visual.display !== "none" &&
  animal.visual.visibility !== "hidden" && /entrance-roadtrip-deer/.test(animal.visual.href || "") && animal.released &&
  animal.after.escapes > animal.before.escapes && animal.after.collisions === animal.before.collisions &&
  animal.after.score - animal.before.score === 3 * animal.before.multiplier &&
  animal.after.multiplier === Math.min(3, animal.before.multiplier + 1) &&
  animal.caption.indexOf("+" + (animal.after.score - animal.before.score) + " pts") >= 0 &&
  animal.caption.indexOf(animal.before.multiplier + "× combo") >= 0,
  "wildlife visibly escapes, awards its safe-clear bonus, and leaves the pool without collision damage", animal);
var wildlifeImpact = s.wildlifeImpact;
check(wildlifeImpact && wildlifeImpact.visual.kind === "animal" &&
  wildlifeImpact.after.drive.roadtrip.wildlifeHits > wildlifeImpact.before.drive.roadtrip.wildlifeHits &&
  wildlifeImpact.after.drive.roadtrip.collisions > wildlifeImpact.before.drive.roadtrip.collisions &&
  wildlifeImpact.after.drive.roadtrip.score < wildlifeImpact.before.drive.roadtrip.score &&
  wildlifeImpact.before.drive.roadtrip.score - wildlifeImpact.after.drive.roadtrip.score >= 20 &&
  wildlifeImpact.before.drive.roadtrip.score - wildlifeImpact.after.drive.roadtrip.score <= 60 &&
  wildlifeImpact.after.drive.roadtrip.multiplier === 1 &&
  wildlifeImpact.after.drive.roadtrip.impactSounds > wildlifeImpact.before.drive.roadtrip.impactSounds &&
  wildlifeImpact.after.drive.speed < wildlifeImpact.before.drive.speed &&
  wildlifeImpact.after.drive.gear > 0 && wildlifeImpact.after.drive.transmission.range === "D" &&
  wildlifeImpact.after.drive.roadtrip.lastImpactSeverity > 0 && wildlifeImpact.after.drive.roadtrip.lastImpactSeverity < .82 &&
  wildlifeImpact.classes.indexOf("roadtrip-cracked") >= 0 && wildlifeImpact.classes.indexOf("roadtrip-shattered") < 0 &&
  wildlifeImpact.crackOpacity > .25 && wildlifeImpact.shatterOpacity < .1,
  "a too-fast deer strike deducts a severity-scaled 20–60 points, keeps AUTO in drive, and produces slowdown, sound, shake, and a localized crack",
  wildlifeImpact);
var rabbitImpact = s.rabbitImpact;
check(rabbitImpact && /entrance-roadtrip-rabbit/.test(rabbitImpact.visual.href || "") &&
  rabbitImpact.after.drive.roadtrip.wildlifeHits > rabbitImpact.before.drive.roadtrip.wildlifeHits &&
  rabbitImpact.after.drive.roadtrip.collisions > rabbitImpact.before.drive.roadtrip.collisions &&
  rabbitImpact.before.drive.roadtrip.score - rabbitImpact.after.drive.roadtrip.score >= 2 &&
  rabbitImpact.before.drive.roadtrip.score - rabbitImpact.after.drive.roadtrip.score <= 8 &&
  rabbitImpact.after.drive.roadtrip.multiplier === 1 &&
  rabbitImpact.after.drive.roadtrip.impactSounds > rabbitImpact.before.drive.roadtrip.impactSounds &&
  rabbitImpact.after.drive.speed < rabbitImpact.before.drive.speed &&
  rabbitImpact.after.drive.speed > rabbitImpact.before.drive.speed * .8 &&
  rabbitImpact.after.drive.gear === rabbitImpact.before.drive.gear && rabbitImpact.after.drive.holds.throttle &&
  rabbitImpact.after.drive.roadtrip.lastImpactSeverity < wildlifeImpact.after.drive.roadtrip.lastImpactSeverity &&
  rabbitImpact.shakeX < wildlifeImpact.shakeX && /roadtrip-impact-bump/.test(rabbitImpact.hudClasses || "") &&
  rabbitImpact.classes.indexOf("roadtrip-cracked") < 0 && rabbitImpact.classes.indexOf("roadtrip-shattered") < 0 &&
  rabbitImpact.crackOpacity < .1 && rabbitImpact.shatterOpacity < .1,
  "a rabbit clip has a 2–8 point light bump and sound but preserves speed, gear, held throttle, and intact glass",
  rabbitImpact);
var pass = s.pass;
check(pass && pass.visual.kind === "traffic" && pass.visual.lane === "1.5" && pass.visual.direction === "forward" && pass.released &&
  pass.after.passes > pass.before.passes && pass.after.collisions === pass.before.collisions &&
  pass.after.score - pass.before.score === 2 * pass.before.multiplier &&
  pass.caption.indexOf("+" + (pass.after.score - pass.before.score) + " pts") >= 0 &&
  pass.caption.indexOf(pass.before.multiplier + "× combo") >= 0,
  "adjacent-lane traffic captions the actual close-pass award and combo", pass);

var close = s.close;
check(close && close.before.roadtrip.active && close.before.roadtrip.everAccepted && close.before.roadtrip.entityCount > 0 &&
  !close.closed.roadtrip.active && close.closed.roadtrip.paused && close.closed.classes.indexOf("roadtrip-active") < 0 &&
  close.closed.viewBox === "0 -31 680 207" && close.closed.aspectRatio === "xMidYMax slice" &&
  !close.closed.reentryVisible &&
  sameRetainedRun(close.before.roadtrip, close.closed.roadtrip) &&
  sameRetainedRun(close.closed.roadtrip, close.parked) &&
  !close.reopened.roadtrip.active && close.reopened.roadtrip.paused &&
  !close.reopened.roadtrip.accepted && close.reopened.roadtrip.everAccepted &&
  !close.reopened.roadtrip.invitationVisible && close.reopened.roadtrip.reentryVisible &&
  close.reopened.reentryVisible && close.reopened.reentryMetadata === 0 &&
  close.reopened.label === "Road Trip" && close.reopened.czechLabel === "Výlet" &&
  (close.reopened.button.right <= close.reopened.steering.left || close.reopened.button.left >= close.reopened.steering.right ||
    close.reopened.button.bottom <= close.reopened.steering.top || close.reopened.button.top >= close.reopened.steering.bottom) &&
  !close.reentryBeforeEnter.car.engineOn && !close.reentryBeforeEnter.drive.roadtrip.active &&
  close.reentryBeforeEnter.drive.roadtrip.paused &&
  close.reentryBeforeEnter.drive.roadtrip.reentryVisible &&
  close.reentryEngineStarted.car.engineOn && !close.reentryEngineStarted.drive.roadtrip.active &&
  close.reentryEngineStarted.drive.roadtrip.paused &&
  close.reentryEngineStarted.drive.roadtrip.reentryVisible &&
  close.reentryMenu.open &&
  close.reentryMenu.selected === "continue" &&
  close.reentryMenu.order.join(",") === "new,continue" &&
  close.reenteredPaused.drive.roadtrip.active && close.reenteredPaused.drive.roadtrip.resumePending &&
  close.reentered.roadtrip.active && !close.reentered.roadtrip.paused &&
  close.reentered.roadtrip.accepted && close.reentered.roadtrip.everAccepted &&
  close.reentered.car.engineOn &&
  sameRetainedRun(close.reopened.roadtrip, close.reentered.roadtrip) &&
  close.reentered.viewBox === "0 -120 680 340" && !close.reentered.reentryVisible &&
  close.returned.state.drive.hud && !close.returned.state.drive.roadtrip.active && close.returned.state.drive.roadtrip.paused &&
  sameRetainedRun(close.reentered.roadtrip, close.returned.state.drive.roadtrip) &&
  close.returned.state.drive.roadtrip.reentryVisible && close.returned.reentryVisible &&
  close.returned.reentryMetadata === 0 &&
  close.clickedMenu &&
  close.clickedPaused.drive.roadtrip.active && close.clickedPaused.drive.roadtrip.resumePending &&
  close.clickedReentry.drive.roadtrip.active && !close.clickedReentry.drive.roadtrip.paused &&
  close.clickedReentry.drive.roadtrip.accepted &&
  sameRetainedRun(close.returned.state.drive.roadtrip, close.clickedReentry.drive.roadtrip),
  "accepted drivers regain a non-overlapping bilingual Road Trip menu; Continue resumes the exact run", close);
var dismiss = s.dismiss && s.dismiss.roadtrip;
check(dismiss && !dismiss.active && dismiss.paused && dismiss.unlocked && dismiss.entityCount > 0 &&
  dismiss.everAccepted && !dismiss.reentryVisible &&
  s.dismiss.dom === dismiss.poolSize && s.dismiss.visible === 0 &&
  sameRetainedRun(s.dismiss.before, dismiss) &&
  dismiss.best >= s.dismiss.bestBefore && s.dismiss.classes.indexOf("roadtrip-active") < 0 &&
  s.dismiss.viewBox === "0 -31 680 207",
  "dashboard dismissal hides but retains the paused run", s.dismiss);
var steering = s.steering;
check(steering && steering.after.state.drive.roadtrip.playerLane < steering.before.state.drive.roadtrip.playerLane &&
  steering.after.road !== steering.before.road && steering.after.entityX > steering.before.entityX &&
  steering.after.state.car.indicatorFlashes === steering.before.state.car.indicatorFlashes &&
  steering.after.state.car.indicatorSounds === steering.before.state.car.indicatorSounds,
  "left steering moves the world right without triggering street indicator flourishes on the highway",
  steering);
var exitLadder = s.exitLadder;
check(exitLadder && !exitLadder.floorControl.open && !exitLadder.floorControl.drive.roadtrip.active &&
  exitLadder.floorControl.drive.roadtrip.paused,
  "the shared Up control returns upstairs while preserving the paused highway run",
  exitLadder && exitLadder.floorControl);
check(exitLadder && exitLadder.closeControl.open && exitLadder.closeControl.drive.hud &&
  exitLadder.closeControl.car.engineOn && !exitLadder.closeControl.drive.roadtrip.active &&
  !exitLadder.closeControl.drive.roadtrip.accepted && !exitLadder.closeControl.drive.roadtrip.invitationVisible &&
  exitLadder.closeControl.drive.roadtrip.reentryVisible &&
  exitLadder.closeControl.drive.roadtrip.exitUntilStop &&
  !exitLadder.rolling.drive.roadtrip.active && exitLadder.rolling.drive.roadtrip.exitUntilStop &&
  exitLadder.rolling.drive.roadtrip.reentryVisible,
  "the highway exit returns to the street HUD with Road Trip available without auto-resuming",
  exitLadder && { closeControl: exitLadder.closeControl, rolling: exitLadder.rolling });
check(exitLadder && exitLadder.streetAfterExit && !exitLadder.streetAfterExit.drive.roadtrip.active &&
  !exitLadder.streetAfterExit.drive.roadtrip.accepted && !exitLadder.streetAfterExit.drive.roadtrip.exitUntilStop &&
  exitLadder.streetAfterExit.drive.roadtrip.reentryVisible && exitLadder.streetAfterExit.drive.speed > 0,
  "block driving remains available after stopping until the highway is deliberately accepted again",
  exitLadder && exitLadder.streetAfterExit);
check(exitLadder && exitLadder.first.open && exitLadder.first.drive.hud && exitLadder.first.car.engineOn &&
  exitLadder.first.drive.roadtrip.active && exitLadder.first.drive.roadtrip.resumePending &&
  !exitLadder.first.drive.roadtrip.exitUntilStop && !exitLadder.first.drive.roadtrip.reentryVisible &&
  exitLadder.second.open && exitLadder.second.drive.hud && exitLadder.second.car.engineOn &&
  !exitLadder.second.drive.roadtrip.active && exitLadder.second.drive.roadtrip.paused &&
  exitLadder.second.drive.roadtrip.exitUntilStop && exitLadder.second.drive.roadtrip.reentryVisible &&
  exitLadder.third.open && !exitLadder.third.drive.hud && !exitLadder.third.car.engineOn &&
  exitLadder.third.drive.roadtrip.paused,
  "successive Escapes pause the highway, exit it, then dismiss the HUD without clearing the run",
  exitLadder);
var checkpoint = s.checkpoint;
var checkpointContract = checkpoint && {
  activeBefore: checkpoint.before.drive.roadtrip.active,
  entityCounts: [checkpoint.before.drive.roadtrip.entityCount, checkpoint.after.drive.roadtrip.entityCount],
  hasPausedRun: !!checkpoint.row.drive.roadtrip.pausedRun,
  hudAfter: checkpoint.after.drive.hud,
  resumePendingAfter: checkpoint.after.drive.roadtrip.resumePending,
  reentryAfter: checkpoint.after.drive.roadtrip.reentryVisible,
  sameBeforeAfter: sameRetainedRun(checkpoint.before.drive.roadtrip, checkpoint.after.drive.roadtrip),
  activeResumed: checkpoint.resumed.drive.roadtrip.active,
  pausedResumed: checkpoint.resumed.drive.roadtrip.paused,
  sameAfterResume: sameRetainedRun(checkpoint.after.drive.roadtrip, checkpoint.resumed.drive.roadtrip),
  visible: checkpoint.visible
};
check(checkpoint && checkpoint.before.drive.roadtrip.active && checkpoint.before.drive.roadtrip.accepted &&
  checkpoint.before.drive.roadtrip.unlocked && checkpoint.before.drive.roadtrip.everAccepted && checkpoint.before.drive.roadtrip.score > 0 &&
  checkpoint.before.drive.roadtrip.entityCount > 0 && checkpoint.row.drive.roadtrip.accepted === false &&
  checkpoint.row.drive.roadtrip.everAccepted === true && checkpoint.row.drive.roadtrip.pausedRun &&
  checkpoint.after.drive.roadtrip.unlocked && checkpoint.after.drive.hud &&
  checkpoint.after.drive.roadtrip.active && !checkpoint.after.drive.roadtrip.paused &&
  checkpoint.after.drive.roadtrip.resumePending && checkpoint.after.drive.roadtrip.accepted && checkpoint.after.drive.roadtrip.everAccepted &&
  !checkpoint.after.drive.roadtrip.invitationReady && !checkpoint.after.drive.roadtrip.invitationVisible &&
  !checkpoint.after.drive.roadtrip.reentryVisible &&
  checkpoint.after.drive.roadtrip.entityCount === checkpoint.before.drive.roadtrip.entityCount &&
  checkpoint.visible === checkpoint.after.drive.roadtrip.entityCount && checkpoint.ready.drive.hud &&
  checkpoint.ready.drive.roadtrip.active && checkpoint.ready.drive.roadtrip.resumePending &&
  sameRetainedRun(checkpoint.before.drive.roadtrip, checkpoint.after.drive.roadtrip) &&
  checkpoint.paused.drive.roadtrip.active && checkpoint.paused.drive.roadtrip.resumePending &&
  checkpoint.resumed.drive.roadtrip.active && !checkpoint.resumed.drive.roadtrip.resumePending &&
  sameRetainedRun(checkpoint.after.drive.roadtrip, checkpoint.resumed.drive.roadtrip),
  "checkpoint restore reopens the highway paused behind Play until fresh driving input resumes it intact",
  checkpointContract);
var reset = s.reset && s.reset.roadtrip;
check(reset && !reset.active && !reset.paused && !reset.unlocked && !reset.accepted && !reset.everAccepted &&
  !reset.invitationVisible && !reset.reentryVisible &&
  reset.practiceLaps === 0 && reset.entityCount === 0 &&
  s.reset.dom === reset.poolSize && s.reset.visible === 0 &&
  reset.distance === 0 && reset.distancePoints === 0 && reset.elapsedSeconds === 0 &&
  reset.score === 0 && reset.multiplier === 1 && reset.best === s.reset.bestBefore &&
  s.reset.classes.indexOf("roadtrip-active") < 0 && s.reset.viewBox === "0 -31 680 207",
  "full reset tears down roadtrip progress while preserving the local best score", s.reset);

console.log("");
if (failures) {
  console.log(failures + " Entrance-roadtrip assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Entrance highway roadtrip assertions passed.");
