#!/usr/bin/env node
// First-person Entrance highway: unlock, scoring/collisions, bounded entities, and teardown.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var REQUIRED_IDS = [
  "entrance-drive-hud-svg",
  "entrance-roadtrip-world",
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
  "entrance-roadtrip-invite-later",
  "entrance-roadtrip-crack",
  "entrance-roadtrip-shatter",
  "entrance-roadtrip-mirror",
  "entrance-roadtrip-mirror-housing",
  "entrance-roadtrip-mirror-gasket",
  "entrance-roadtrip-mirror-road",
  "entrance-roadtrip-mirror-center",
  "entrance-roadtrip-mirror-lanes",
  "entrance-roadtrip-mirror-edges",
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
    "entrance-roadtrip-invite", "entrance-roadtrip-invite-accept", "entrance-roadtrip-invite-later",
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
  function state() { return window.__entranceRoomState(); }
  function roadtrip() { return state().drive.roadtrip; }
  function ensureEngine() { if (!state().car.engineOn) window.__toggleEntrancePorscheEngine(); }
  function step(ms, count) { for (var i = 0; i < (count || 1); i++) window.__entranceDriveStep(ms); }
  function pressKey(key) {
    (document.activeElement || document).dispatchEvent(new KeyboardEvent("keydown", {
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
  function visibleCurveSign() {
    return Array.prototype.find.call(document.getElementById("entrance-roadtrip-curve-signs").children, function (node) {
      return node.getAttribute("visibility") !== "hidden";
    }) || null;
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
    window.__entranceRoadtripStart();
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
      classes: document.getElementById("entrance-room").getAttribute("class"),
      crackOpacity: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-crack")).opacity),
      shatterOpacity: parseFloat(getComputedStyle(document.getElementById("entrance-roadtrip-shatter")).opacity),
      traces: traces
    };
  }
  function probeTargetWidth(type, hitGap, clearGap) {
    function attempt(gap) {
      window.__entranceRoadtripStart();
      ensureEngine();
      window.__entranceDriveSetMotion(type === "deer" || type === "rabbit" ? 36 : 120,
        type === "deer" || type === "rabbit" ? 2 : 3);
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
      "__entranceDriveTireAudio", "__entranceRoomState"];
    report.steps.fresh = {
      ids: requiredIds.map(function (id) { return [id, !!document.getElementById(id)]; }),
      hooks: hooks.map(function (name) { return [name, typeof window[name]]; })
    };
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
    window.goToStage("balcony");
    window.__openEntranceRoom();
    await sleep(40);
    window.__setBalconySnow(false, "test");
    window.__setBalconyStormLayer(false, "test");
    window.__setBalconyOvercast(true, "test");
    window.__setBalconyRain(true, "test");
    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    window.__entranceDriveShift(6, true);
    window.__entranceDriveControl("throttle", true);

    var room = document.getElementById("entrance-room");
    var hud = document.getElementById("entrance-drive-hud");
    var svg = document.getElementById("entrance-drive-hud-svg");
    var beforeClasses = Array.prototype.slice.call(room.classList).filter(function (name) {
      return /^entrance-(?:day|clouded|raining|snowing|winter-cover)$/.test(name);
    });
    var practice = [];
    var seenPractice = -1;
    for (var i = 0; i < 1200 && !roadtrip().unlocked; i++) {
      step(80);
      if (roadtrip().practiceLaps !== seenPractice) {
        seenPractice = roadtrip().practiceLaps;
        practice.push({ practiceLaps: seenPractice, active: roadtrip().active, unlocked: roadtrip().unlocked });
      }
    }
    await sleep(520);
    var offerBeforeDrive = copy(roadtrip());
    step(250);
    var offerAfterDrive = copy(roadtrip());
    var invitation = document.getElementById("entrance-roadtrip-invite");
    var offer = {
      before: offerBeforeDrive,
      after: offerAfterDrive,
      visible: invitation.classList.contains("show"),
      ariaHidden: invitation.getAttribute("aria-hidden"),
      transform: invitation.getAttribute("transform"),
      viewBox: viewBox(),
      title: invitation.querySelector("[data-i=entrance_roadtrip_invite_title]").textContent.trim()
    };
    window.setLang("cs");
    offer.czech = {
      title: invitation.querySelector("[data-i=entrance_roadtrip_invite_title]").textContent.trim(),
      accept: invitation.querySelector("[data-i=entrance_roadtrip_invite_accept]").textContent.trim(),
      later: invitation.querySelector("[data-i=entrance_roadtrip_invite_later]").textContent.trim(),
      acceptAria: document.getElementById("entrance-roadtrip-invite-accept").getAttribute("aria-label"),
      laterAria: document.getElementById("entrance-roadtrip-invite-later").getAttribute("aria-label")
    };
    window.setLang("en");
    pressKey("Enter");
    await sleep(80);
    var activeClasses = Array.prototype.slice.call(room.classList);
    report.steps.activation = {
      offer: offer,
      beforeClasses: beforeClasses,
      practice: practice,
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
      window.__entranceDriveSetMotion(value, 4);
      window.__refreshEntranceRoadtripHud();
      var node = document.getElementById("entrance-roadtrip-speed");
      return { text: node.textContent, band: node.getAttribute("data-roadtrip-speed-band") };
    }
    report.steps.speedHud = [speedHudAt(100), speedHudAt(101), speedHudAt(150),
      speedHudAt(151), speedHudAt(179), speedHudAt(180)];
    window.__entranceDriveControl("throttle", false);
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
    window.__entranceRoadtripStart();
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
    window.__entranceRoadtripStart();
    window.__entranceRoadtripSetLane(1.5);
    window.__entranceDriveSetMotion(36, 2);
    var recoveredHeart = spawn("heart", .5, 5);
    step(800);
    var reverseMissed = { state: copy(state()), visible: recoveredHeart.node.getAttribute("visibility") };
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveSetMotion(-20, -1);
    step(1000);
    var reverseBackedUp = { state: copy(state()), visible: recoveredHeart.node.getAttribute("visibility") };
    window.__entranceDriveSetMotion(36, 2);
    step(500);
    var reverseCollected = { state: copy(state()), visible: recoveredHeart.node.getAttribute("visibility") };
    report.steps.reverseRecovery = {
      missed: reverseMissed,
      backedUp: reverseBackedUp,
      collected: reverseCollected
    };
    window.__entranceRoadtripStart();
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveSetMotion(90, 3);
    window.__entranceDriveControl("throttle", true);
    await sleep(45);
    attended = false;
    window.dispatchEvent(new Event("blur"));
    var focusPauseStart = copy(state());
    step(1000);
    await sleep(120);
    var focusPauseEnd = copy(state());
    attended = true;
    window.dispatchEvent(new Event("focus"));
    await sleep(90);
    var focusPauseResumed = copy(state());
    report.steps.focusPause = {
      start: focusPauseStart,
      end: focusPauseEnd,
      resumed: focusPauseResumed
    };
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
    var rightWarningNode = visibleCurveSign();
    var rightWarning = rightWarningNode && {
      direction: rightWarningNode.getAttribute("data-roadtrip-curve"),
      ahead: Number(rightWarningNode.getAttribute("data-roadtrip-ahead")),
      href: rightWarningNode.getAttribute("href") || rightWarningNode.getAttribute("xlink:href")
    };
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
    window.__entranceRoadtripSetDistance(158);
    var rightCurve = { state: copy(roadtrip()), road: asphalt.getAttribute("d"), mirror: mirrorGeometry(), winter: winterGeometry() };
    window.__entranceRoadtripSetDistance(260);
    var leftWarningNode = visibleCurveSign();
    var leftWarning = leftWarningNode && {
      direction: leftWarningNode.getAttribute("data-roadtrip-curve"),
      ahead: Number(leftWarningNode.getAttribute("data-roadtrip-ahead")),
      href: leftWarningNode.getAttribute("href") || leftWarningNode.getAttribute("xlink:href")
    };
    window.__entranceRoadtripSetDistance(401);
    var leftCurve = { state: copy(roadtrip()), road: asphalt.getAttribute("d"), mirror: mirrorGeometry(), winter: winterGeometry() };
    report.steps.curves = {
      straight: straightGeometry,
      straightMirror: straightMirror,
      straightWinter: straightWinter,
      roadLines: Array.prototype.map.call(document.querySelectorAll(
        ".entrance-roadtrip-edge,.entrance-roadtrip-centerline"), function (node) {
          return { fill: getComputedStyle(node).fill, stroke: getComputedStyle(node).stroke,
            d: node.getAttribute("d") };
        }),
      rightWarning: rightWarning,
      right: rightCurve,
      leftWarning: leftWarning,
      left: leftCurve
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

    window.__entranceRoadtripStart();
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
    var poolStarted = window.__entranceRoadtripStart();
    var spawnTypes = ["car", "pickup", "truck", "rv", "deer", "rabbit", "heart", "kiss", "inf"];
    for (var a = 0; a < 240; a++) window.__entranceRoadtripSpawn(spawnTypes[a % spawnTypes.length], (a % 3) - 1);
    var firstStorm = { state: copy(roadtrip()), dom: childCount() };
    for (var b = 0; b < 240; b++) window.__entranceRoadtripSpawn(spawnTypes[b % spawnTypes.length], 1 - (b % 3));
    report.steps.pool = { started: poolStarted, first: firstStorm, second: { state: copy(roadtrip()), dom: childCount() } };

    window.__dismissEntrancePorscheDriveHud();
    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    var freshStarted = window.__entranceRoadtripStart();
    window.__entranceDriveShift(6, true);
    window.__entranceDriveControl("throttle", true);
    var progressBefore = copy(roadtrip());
    step(250);
    report.steps.progress = { started: freshStarted, before: progressBefore, after: copy(roadtrip()) };
    window.__entranceRoadtripStart();
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
    window.__entranceRoadtripStart();
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
    var oncomingPassingSemi = spawn("truck", -.5, 110);
    step(1000, 2);
    report.steps.heavyLanePolicy = {
      home: heavyHomeLanes,
      forwardTarget: entityVisual(forwardPassTarget.node),
      forwardPassing: entityVisual(forwardPassingSemi.node),
      oncomingTarget: entityVisual(oncomingPassTarget.node),
      oncomingPassing: entityVisual(oncomingPassingSemi.node)
    };
    window.__entranceRoadtripStart();
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
    window.__entranceRoadtripStart();
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
    window.__entranceRoadtripStart();
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
    window.__entranceRoadtripStart();
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
    var closed = { roadtrip: copy(roadtrip()), classes: room.getAttribute("class"), viewBox: viewBox(), aspectRatio: aspectRatio(), dom: childCount(), visible: visibleChildCount() };
    var closedWrapStart = state().drive.wraps;
    for (var closedTick = 0; closedTick < 40 && state().drive.wraps === closedWrapStart; closedTick++) step(1000);
    var ignoredClosedWrap = state().drive.wraps;
    for (var nearBoundaryTick = 0; nearBoundaryTick < 3000 &&
        state().drive.wraps === ignoredClosedWrap && state().drive.position > -647; nearBoundaryTick++) {
      window.__entranceDriveSetMotion(60, 2);
      step(1);
    }
    var closedWrapEnd = state().drive.wraps;
    var closedPosition = state().drive.position;
    var parked = copy(roadtrip());
    window.__openEntranceRoom();
    await sleep(30);
    var reopened = { roadtrip: copy(roadtrip()), classes: room.getAttribute("class"), viewBox: viewBox() };
    var reopenedSettleWrap = state().drive.wraps;
    step(80);
    var street = { roadtrip: copy(roadtrip()), classes: room.getAttribute("class"), viewBox: viewBox() };
    var reopenedLap = state().drive.wraps;
    window.__entranceDriveSetMotion(120, 3);
    window.__entranceDriveControl("throttle", true);
    var lastBeforeOffer = copy(state());
    for (var reopenTick = 0; reopenTick < 5000 && !roadtrip().invitationReady; reopenTick++) {
      step(20);
      if (!roadtrip().invitationReady) lastBeforeOffer = copy(state());
    }
    window.__entranceDriveControl("throttle", false);
    var offeredAfterLap = copy(state());
    pressKey("Escape");
    var dismissedOffer = copy(state());
    var dismissedLap = state().drive.wraps;
    window.__entranceDriveSetMotion(120, 3);
    window.__entranceDriveControl("throttle", true);
    for (var dismissedTick = 0; dismissedTick < 40 && state().drive.wraps === dismissedLap; dismissedTick++) step(1000);
    window.__entranceDriveControl("throttle", false);
    var stillDismissed = copy(state());
    report.steps.close = { before: closeBefore, closed: closed, parked: parked, reopened: reopened,
      closedWrapStart: closedWrapStart, ignoredClosedWrap: ignoredClosedWrap,
      closedWrapEnd: closedWrapEnd, closedPosition: closedPosition,
      reopenedSettleWrap: reopenedSettleWrap, reopenedWrap: reopenedLap,
      street: street, lastBeforeOffer: lastBeforeOffer, offeredAfterLap: offeredAfterLap,
      dismissedOffer: dismissedOffer, stillDismissed: stillDismissed };

    var bestBeforeDismiss = roadtrip().best;
    window.__dismissEntrancePorscheDriveHud();
    report.steps.dismiss = {
      bestBefore: bestBeforeDismiss,
      roadtrip: copy(roadtrip()),
      classes: room.getAttribute("class"),
      viewBox: viewBox(),
      dom: childCount(),
      visible: visibleChildCount()
    };

    window.__openEntrancePorscheDriveHud();
    ensureEngine();
    window.__entranceRoadtripStart();
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
    window.__entranceRoadtripStart();
    document.getElementById("entrance-room-close").click();
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
    window.__entranceRoadtripStart();
    pressKey("Escape");
    var firstEscape = copy(state());
    pressKey("Escape");
    var secondEscape = copy(state());
    pressKey("Escape");
    var thirdEscape = copy(state());
    report.steps.exitLadder = {
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
    report.steps.checkpoint = {
      pickup: checkpointPickup,
      transient: entityVisual(checkpointTransient.node),
      before: checkpointBefore,
      row: checkpointRow,
      after: checkpointAfter,
      visible: visibleChildCount()
    };
    window.__entranceRoadtripStart();
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

console.log("rsvp.html Entrance highway roadtrip:");
var source = fs.readFileSync(path.join(lib.ROOT, "rsvp.html"), "utf8");
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
check(/id="entrance-roadtrip-mirror-housing" d="M282-115H398[^\"]+Q412-75 400-74H280Q268-75[^\"]+" fill="#2d3438"[^>]+stroke="#171c20"/.test(source) &&
  /id="entrance-roadtrip-mirror-gasket"[^>]+stroke="#13191c"/.test(source) &&
  /clipPath id="entrance-roadtrip-mirror-clip">\s*<path/.test(source),
  "the mirror uses a rounded charcoal trapezoidal housing, dark gasket, and matching reflection clip");
check(/id="entrance-roadtrip-curve-sign-right"[\s\S]{0,260}M-7-28V-37Q-7-47 3-47H7M3-51L7-47L3-43[^>]+stroke="#17191b"[^>]+stroke-linecap="square"[^>]+stroke-linejoin="miter"/.test(source) &&
  /id="entrance-roadtrip-curve-sign-left"[\s\S]{0,260}M7-28V-37Q7-47-3-47H-7M-3-51L-7-47L-3-43/.test(source),
  "curve signs use contained, dark, sharp-cornered single-turn arrows");
check(source.indexOf('id="entrance-roadtrip-winter"') < source.indexOf('id="entrance-roadtrip-road"'),
  "accumulated snow paints beneath the road so shoulder markings remain visible at the horizon");
check(/function paintRoadtripInvite\(\)[\s\S]{0,500}roadtripState\.invitationReady/.test(source) &&
  /function recordRoadtripPracticeLap\(\)\s*\{\s*if \(!window\.__entranceRoomOpen \|\| !driveState\.hudOpen\) return;\s*if \(roadtripState\.unlocked\) return;\s*roadtripState\.practiceLaps\+\+/.test(source) &&
  /function recordRoadtripInvitationTravel\(distance\)[\s\S]{0,800}roadtripState\.invitationDistance \+= [^;]+;[\s\S]{0,300}roadtripState\.invitationDistance < PORSCHE_WRAP_SPAN[\s\S]{0,300}roadtripState\.invitationReady = true;/.test(source) &&
  /function resetRoadtripInvitationSession\(\)[\s\S]{0,300}roadtripState\.accepted = false;[\s\S]{0,200}roadtripState\.invitationReady = false;/.test(source),
  "the source owns a three-lap initial unlock and full-distance per-session invitation gate");
check(!/roadtripState\.unlocked && roadtripState\.accepted && !roadtripState\.active[\s\S]{0,200}startRoadtrip\(false\)/.test(source) &&
  /var roadtripInviteVisible[\s\S]{0,700}event\.key === "Enter"[\s\S]{0,300}entrance-roadtrip-invite-accept/.test(source) &&
  /event\.key === "Escape"[\s\S]{0,400}roadtripInviteVisible[\s\S]{0,300}entrance-roadtrip-invite-later/.test(source),
  "highway entry is explicit and the visible offer owns Enter and Escape");
check(/roadtrip:\s*\{[\s\S]{0,180}unlocked: roadtripState\.unlocked,[\s\S]{0,80}accepted: false,/.test(source) &&
  /roadtripState\.accepted = false;\s*roadtripState\.invitationReady = false;\s*roadtripState\.invitationDistance = 0;\s*roadtripState\.invitationDismissed = false;/.test(source),
  "checkpoint capture and restore cannot authorize or activate a highway session");

if (process.argv.indexOf("--source-only") >= 0) {
  if (failures) process.exit(1);
  console.log("Entrance highway roadtrip source assertions passed.");
  process.exit(0);
}

var result = lib.runPageSync("rsvp.html", HARNESS, 7500, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
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
var tireAudio = s.tireAudio;
check(tireAudio && tireAudio.highway.tireGain > tireAudio.urban.tireGain &&
  tireAudio.highway.windGain > tireAudio.urban.windGain &&
  tireAudio.corner.cornerGain > tireAudio.highway.cornerGain &&
  tireAudio.rumble.tireGain > tireAudio.highway.tireGain * .5 &&
  tireAudio.gravel.tireGain > tireAudio.rumble.tireGain &&
  tireAudio.gravel.roadGain > tireAudio.rumble.roadGain,
  "highway speed raises tire/wind beds, fast steering squeals, and shoulder surfaces grow rougher", tireAudio);

var activation = s.activation;
check(activation && activation.practice.some(function (row) { return row.practiceLaps === 1 && !row.active; }) &&
  activation.practice.some(function (row) { return row.practiceLaps === 2 && !row.active; }) &&
  activation.offer.before.practiceLaps === 3 && activation.offer.before.unlocked &&
  activation.offer.before.invitationReady && !activation.offer.before.accepted && !activation.offer.before.active &&
  !activation.offer.after.accepted && !activation.offer.after.active && activation.offer.visible &&
  activation.offer.ariaHidden === "false" && activation.offer.title === "Let’s road trip!" &&
  activation.offer.transform === "translate(426 0)" &&
  activation.offer.czech.title === "Jedeme na výlet!" && activation.offer.czech.accept === "Vyjet na dálnici" &&
  activation.offer.czech.later === "Později" && activation.offer.czech.acceptAria === "Vyjet na dálnici" &&
  activation.offer.czech.laterAria === "Později" &&
  activation.offer.viewBox === "0 -31 680 207" && activation.roadtrip.accepted && activation.roadtrip.active,
  "the third practice lap offers a right-side roadtrip card without auto-starting, and acceptance enters the highway",
  activation && { practice: activation.practice, offer: activation.offer, roadtrip: activation.roadtrip });
check(activation && activation.roomClasses.indexOf("roadtrip-active") >= 0 &&
  activation.viewBox === "0 -120 680 340" &&
  activation.aspectRatio === "xMidYMax slice" &&
  activation.geometry.hud.height >= activation.geometry.room.height * .95 &&
  Math.abs(activation.geometry.hud.top - activation.geometry.room.top) <= 1,
  "activation expands the dashboard SVG and HUD to the full Entrance view", activation);
check(activation && activation.retained.roomArt.display !== "none" && activation.retained.porsche.display !== "none" &&
  activation.retained.spatial && activation.retained.spatial.anchor === "entrance-porsche" &&
  isFinite(activation.retained.spatial.pan),
  "roadtrip presentation retains scene/car geometry for localized Porsche audio", activation && activation.retained);
check(s.speedHud && s.speedHud.map(function (row) { return row.band; }).join(" ") ===
    "safe warning warning danger danger escape" &&
  s.speedHud.map(function (row) { return row.text; }).join(" ") ===
    "100 km/h 101 km/h 150 km/h 151 km/h 179 km/h 180 km/h",
  "the dominant speed readout changes from green through gold and red to the 180+ escape band", s.speedHud);
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
  centerline.second.centerlineCrossings === 2,
  "crossing the centre line costs two points once per excursion without resetting the combo", centerline);
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
  focusPause.end.drive.roadtrip.elapsedSeconds === focusPause.start.drive.roadtrip.elapsedSeconds &&
  focusPause.end.drive.roadtrip.distance === focusPause.start.drive.roadtrip.distance &&
  focusPause.end.drive.roadtrip.score === focusPause.start.drive.roadtrip.score &&
  focusPause.end.drive.speed === focusPause.start.drive.speed &&
  Object.keys(focusPause.end.drive.holds).every(function (key) { return !focusPause.end.drive.holds[key]; }) &&
  focusPause.resumed.drive.roadtrip.elapsedSeconds > focusPause.end.drive.roadtrip.elapsedSeconds &&
  focusPause.resumed.drive.roadtrip.elapsedSeconds - focusPause.end.drive.roadtrip.elapsedSeconds < .3 &&
  focusPause.resumed.drive.roadtrip.distance > focusPause.end.drive.roadtrip.distance,
  "blur freezes the complete highway simulation, releases controls, and resumes without catch-up", focusPause);
check(activation && activation.beforeClasses.indexOf("entrance-clouded") >= 0 &&
  activation.beforeClasses.indexOf("entrance-raining") >= 0 &&
  activation.beforeClasses.every(function (name) { return activation.roomClasses.indexOf(name) >= 0; }) &&
  ["oldRain", "oldSnow", "clouds", "rain", "snow", "winter"].every(function (name) {
    return activation.weather[name].connected && !activation.weather[name].hiddenBy;
  }) && activation.weather.oldRain.opacity > .5 && activation.weather.rain.opacity > .5 &&
  activation.weather.clouds.opacity > 0 && activation.weather.mirrorClouds.opacity > 0 &&
  activation.weather.mirrorRain.opacity > .5 && activation.weather.mirrorSnow.opacity === 0 &&
  activation.weather.snowMode && /entrance-snowing/.test(activation.weather.snowMode.classes) &&
  activation.weather.snowMode.rain === 0 && activation.weather.snowMode.snow > .5,
  "the extended windshield preserves active Entrance weather classes and both old/new overlays", activation && activation.weather);

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
check(curves && curves.rightWarning && curves.rightWarning.direction === "right" &&
  /curve-sign-right/.test(curves.rightWarning.href || "") && curves.rightWarning.ahead > 0 &&
  curves.right.state.curve > 0 && curves.right.road !== curves.straight &&
  curves.right.mirror.road.d !== curves.straightMirror.road.d &&
  curves.right.mirror.center.d !== curves.straightMirror.center.d &&
  curves.right.mirror.lanes.d !== curves.straightMirror.lanes.d &&
  mirrorNearCentered(curves.straightMirror) && mirrorNearCentered(curves.right.mirror) &&
  mirrorFarAligned(curves.right.mirror) && mirrorBendReturnsToBase(curves.right.mirror, 1) &&
  curves.leftWarning && curves.leftWarning.direction === "left" &&
  /curve-sign-left/.test(curves.leftWarning.href || "") && curves.leftWarning.ahead > 0 &&
  curves.left.state.curve < 0 && curves.left.road !== curves.right.road &&
  curves.left.mirror.road.d !== curves.right.mirror.road.d &&
  curves.left.mirror.edges.d !== curves.right.mirror.edges.d &&
  mirrorNearCentered(curves.left.mirror) && mirrorFarAligned(curves.left.mirror) &&
  mirrorBendReturnsToBase(curves.left.mirror, -1) &&
  curves.right.mirror.road.farCenter > curves.straightMirror.road.farCenter + 1 &&
  curves.left.mirror.road.farCenter < curves.straightMirror.road.farCenter - 1,
  "rear-view bends accumulate toward opposite horizon sides while every near road and marking stays centred", curves);
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
check(mirror && mirror.passed.passes === 1 && mirror.visible && mirror.visible.type === "car" &&
  mirror.visible.direction === "forward" && /car-oncoming/.test(mirror.visible.href || "") &&
  /translate\(/.test(mirror.visible.transform || "") && mirror.visible.visibility !== "hidden" &&
  mirror.source.visibility === "hidden" && mirror.cleared && mirror.mirrorChildren === 6,
  "the rear-view mirror reflects passed traffic with its approaching face, then clears it at mirror range", mirror);

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
  heavyLanePolicy.home.rv.speed >= 70 && heavyLanePolicy.home.rv.speed <= 82 &&
  Math.abs(heavyLanePolicy.home.oppositeRv.speed) >= 70 && Math.abs(heavyLanePolicy.home.oppositeRv.speed) <= 82 &&
  heavyLanePolicy.forwardPassing.passing === "true" && Number(heavyLanePolicy.forwardPassing.lane) < 1.5 &&
  Math.abs(heavyLanePolicy.forwardPassing.speed) - Math.abs(heavyLanePolicy.forwardTarget.speed) >= 20 &&
  heavyLanePolicy.oncomingPassing.passing === "true" && Number(heavyLanePolicy.oncomingPassing.lane) > -1.5 &&
  Math.abs(heavyLanePolicy.oncomingPassing.speed) - Math.abs(heavyLanePolicy.oncomingTarget.speed) >= 20,
  "RVs and cruising semis stay right in both directions while passing semis move left at a 20–30 km/h advantage",
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
    item.after.multiplier > item.before.multiplier;
}), "heart, kiss, and rare infinity pickups sound and visibly collect for 5, 10, and 25 times the combo",
  collectibles);
var collision = s.collision;
check(collision && collision.visual.kind === "traffic" && collision.visual.lane === "0.5" && collision.visual.direction === "forward" && collision.released &&
  collision.after.collisions > collision.before.collisions &&
  collision.after.score < collision.before.score && collision.before.score - collision.after.score >= 10 &&
  collision.before.score - collision.after.score <= 40 &&
  collision.after.impactSounds > collision.before.impactSounds && collision.after.lastImpactSeverity > 0 &&
  collision.afterDriveSpeed < collision.visual.speed && collision.minSpeed < collision.beforeSpeed * .45 &&
  collision.afterDriveGear === 0 &&
  collision.after.multiplier === 1 && collision.classes.indexOf("roadtrip-cracked") >= 0 &&
  collision.crackOpacity > .25 && collision.shatterOpacity < .1,
  "rear-ending traffic deducts 10–40 points, kicks below traffic speed, neutralizes the gearbox, cracks the glass, and resets the combo", collision);
var animal = s.animal;
check(animal && animal.visual.kind === "animal" && animal.visual.lane === "0.5" && animal.visual.display !== "none" &&
  animal.visual.visibility !== "hidden" && /entrance-roadtrip-deer/.test(animal.visual.href || "") && animal.released &&
  animal.after.escapes > animal.before.escapes && animal.after.collisions === animal.before.collisions &&
  animal.after.score - animal.before.score === 3 * animal.before.multiplier &&
  animal.after.multiplier === Math.min(3, animal.before.multiplier + 1),
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
  wildlifeImpact.after.drive.speed < wildlifeImpact.before.drive.speed && wildlifeImpact.after.drive.gear === 0 &&
  wildlifeImpact.after.drive.roadtrip.lastImpactSeverity > 0 && wildlifeImpact.after.drive.roadtrip.lastImpactSeverity < .82 &&
  wildlifeImpact.classes.indexOf("roadtrip-cracked") >= 0 && wildlifeImpact.classes.indexOf("roadtrip-shattered") < 0 &&
  wildlifeImpact.crackOpacity > .25 && wildlifeImpact.shatterOpacity < .1,
  "a too-fast deer strike deducts a severity-scaled 20–60 points, neutralizes the gearbox, and produces slowdown, sound, shake, and a localized crack",
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
  pass.after.score - pass.before.score === 2 * pass.before.multiplier,
  "adjacent-lane traffic becomes a clean close pass worth two points before the combo", pass);

var close = s.close;
check(close && close.before.roadtrip.active && close.before.roadtrip.entityCount > 0 &&
  !close.closed.roadtrip.active && close.closed.classes.indexOf("roadtrip-active") < 0 &&
  close.closed.viewBox === "0 -31 680 207" && close.closed.aspectRatio === "xMidYMax meet" &&
  close.parked.distance === close.closed.roadtrip.distance && close.parked.entityCount === close.closed.roadtrip.entityCount &&
  close.ignoredClosedWrap > close.closedWrapStart && close.closedWrapEnd === close.ignoredClosedWrap &&
  close.closedPosition <= -647 && close.closedPosition > -648 && !close.parked.invitationReady &&
  !close.reopened.roadtrip.active && !close.reopened.roadtrip.accepted && !close.reopened.roadtrip.invitationVisible &&
  close.reopenedSettleWrap > close.closedWrapEnd && !close.reopened.roadtrip.invitationReady &&
  close.reopened.roadtrip.invitationDistance < close.reopened.roadtrip.invitationDistanceRequired &&
  !close.street.roadtrip.active && close.street.viewBox === "0 -31 680 207" &&
  !close.street.roadtrip.invitationReady &&
  close.lastBeforeOffer.drive.roadtrip.invitationDistance <
    close.lastBeforeOffer.drive.roadtrip.invitationDistanceRequired &&
  close.offeredAfterLap.drive.roadtrip.invitationDistance ===
    close.offeredAfterLap.drive.roadtrip.invitationDistanceRequired &&
  close.offeredAfterLap.drive.roadtrip.invitationReady && close.offeredAfterLap.drive.roadtrip.invitationVisible &&
  close.dismissedOffer.open && close.dismissedOffer.drive.hud && close.dismissedOffer.car.engineOn &&
  !close.dismissedOffer.drive.roadtrip.invitationVisible && !close.stillDismissed.drive.roadtrip.invitationVisible,
  "a near-boundary rolling reopen needs one full live block lap before offering, and Escape dismisses it for that HUD session", close);
var dismiss = s.dismiss && s.dismiss.roadtrip;
check(dismiss && !dismiss.active && dismiss.unlocked && dismiss.entityCount === 0 &&
  s.dismiss.dom === dismiss.poolSize && s.dismiss.visible === 0 &&
  dismiss.distance === 0 && dismiss.distancePoints === 0 && dismiss.elapsedSeconds === 0 &&
  dismiss.score === 0 && dismiss.multiplier === 1 &&
  dismiss.collisions === 0 && dismiss.passes === 0 && dismiss.tokens === 0 && dismiss.escapes === 0 &&
  dismiss.best >= s.dismiss.bestBefore && s.dismiss.classes.indexOf("roadtrip-active") < 0 &&
  s.dismiss.viewBox === "0 -31 680 207",
  "dashboard dismissal ends and clears the run while retaining unlock and best", s.dismiss);
var steering = s.steering;
check(steering && steering.after.state.drive.roadtrip.playerLane < steering.before.state.drive.roadtrip.playerLane &&
  steering.after.road !== steering.before.road && steering.after.entityX > steering.before.entityX &&
  steering.after.state.car.indicatorFlashes === steering.before.state.car.indicatorFlashes &&
  steering.after.state.car.indicatorSounds === steering.before.state.car.indicatorSounds,
  "left steering moves the world right without triggering street indicator flourishes on the highway",
  steering);
var exitLadder = s.exitLadder;
check(exitLadder && exitLadder.closeControl.open && exitLadder.closeControl.drive.hud &&
  exitLadder.closeControl.car.engineOn && !exitLadder.closeControl.drive.roadtrip.active &&
  !exitLadder.closeControl.drive.roadtrip.accepted && !exitLadder.closeControl.drive.roadtrip.invitationVisible &&
  exitLadder.closeControl.drive.roadtrip.exitUntilStop &&
  !exitLadder.rolling.drive.roadtrip.active && exitLadder.rolling.drive.roadtrip.exitUntilStop,
  "the highway close control returns to the street HUD and cannot immediately auto-resume while rolling",
  exitLadder && { closeControl: exitLadder.closeControl, rolling: exitLadder.rolling });
check(exitLadder && exitLadder.streetAfterExit && !exitLadder.streetAfterExit.drive.roadtrip.active &&
  !exitLadder.streetAfterExit.drive.roadtrip.accepted && !exitLadder.streetAfterExit.drive.roadtrip.exitUntilStop &&
  exitLadder.streetAfterExit.drive.speed > 0,
  "block driving remains available after stopping until the highway is deliberately accepted again",
  exitLadder && exitLadder.streetAfterExit);
check(exitLadder && exitLadder.first.open && exitLadder.first.drive.hud && exitLadder.first.car.engineOn &&
  !exitLadder.first.drive.roadtrip.active && exitLadder.first.drive.roadtrip.exitUntilStop &&
  exitLadder.second.open && !exitLadder.second.drive.hud && !exitLadder.second.car.engineOn &&
  !exitLadder.second.drive.roadtrip.exitUntilStop && !exitLadder.third.open,
  "successive Escapes leave highway, dismiss the HUD, then dismiss Entrance",
  exitLadder);
var checkpoint = s.checkpoint;
check(checkpoint && checkpoint.before.drive.roadtrip.active && checkpoint.before.drive.roadtrip.accepted &&
  checkpoint.before.drive.roadtrip.unlocked && checkpoint.before.drive.roadtrip.score > 0 &&
  checkpoint.before.drive.roadtrip.entityCount > 0 && checkpoint.row.drive.roadtrip.accepted === false &&
  checkpoint.after.drive.roadtrip.unlocked && !checkpoint.after.drive.roadtrip.active &&
  !checkpoint.after.drive.roadtrip.accepted && !checkpoint.after.drive.roadtrip.invitationReady &&
  !checkpoint.after.drive.roadtrip.invitationVisible && checkpoint.after.drive.roadtrip.entityCount === 0 &&
  checkpoint.visible === 0 && Math.abs(checkpoint.after.drive.roadtrip.distance -
    checkpoint.before.drive.roadtrip.distance) <= .01 &&
  checkpoint.after.drive.roadtrip.score === checkpoint.before.drive.roadtrip.score &&
  checkpoint.after.drive.roadtrip.multiplier === checkpoint.before.drive.roadtrip.multiplier,
  "checkpoint restore keeps durable highway progress but returns parked, unaccepted, and entity-free",
  checkpoint);
var reset = s.reset && s.reset.roadtrip;
check(reset && !reset.active && !reset.unlocked && !reset.accepted && !reset.invitationVisible &&
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
