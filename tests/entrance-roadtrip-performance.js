#!/usr/bin/env node
// Adaptive Road Trip painting: low frame health spends fewer DOM mutations without slowing physics.
"use strict";

var lib = require("./lib");
var fs = require("fs");
var failures = 0;

function check(ok, label, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + label);
  if (!ok) {
    failures++;
    if (detail !== undefined) console.log("    " + JSON.stringify(detail));
  }
}

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function drive() { return window.__entranceRoomState().drive; }
  function begin() {
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("banff", 0);
    window.__entranceRoadtripSetDistance(0);
    window.__entranceRoadtripSetSeed(0x12345678);
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveTransmissionMode("auto");
    window.__entranceDriveSetMotion(115, 4);
    window.__entranceRoadtripSpawn("car", 1.5, 80, { speedKmh: 112 });
  }
  var originalSet = Element.prototype.setAttribute;
  var originalRemove = Element.prototype.removeAttribute;
  var originalAppend = Element.prototype.appendChild;
  var coveredAnimation = null;
  var counters = null;
  Element.prototype.setAttribute = function (name, value) {
    if (counters) {
      counters.attributes++;
      if (this === counters.road && name === "d") counters.roadPaints++;
      if (this === counters.streetCar || counters.streetCar.contains(this)) counters.hiddenStreetCarPaints++;
      if (this === counters.arrest || counters.arrest.contains(this)) counters.idleArrestPaints++;
      if ((name === "tabindex" || name === "focusable") &&
          (this.hasAttribute("data-drive-mode") || this.hasAttribute("data-drive-range"))) {
        counters.transmissionFocusPaints++;
      }
    }
    return originalSet.call(this, name, value);
  };
  Element.prototype.removeAttribute = function (name) {
    if (counters) counters.removes++;
    return originalRemove.call(this, name);
  };
  Element.prototype.appendChild = function (node) {
    if (counters) counters.appends++;
    return originalAppend.call(this, node);
  };
  function run(low) {
    begin();
    if (low) {
      window.__frameHealthFeed(40);
      window.__frameHealthFeed(40);
    } else {
      window.__frameHealthFeed(60);
      window.__frameHealthFeed(60);
      window.__frameHealthFeed(60);
    }
    var before = copy(drive());
    var roomRect = document.getElementById("entrance-room").getBoundingClientRect();
    var viewportRect = document.querySelector(".hunt-viewport").getBoundingClientRect();
    var overlayContainment = ["bathroom-room", "prince-basement", "cinema-room", "bedroom-room", "entrance-room"]
      .map(function (id) { return [id, getComputedStyle(document.getElementById(id)).contain]; });
    var coveredVisibility = ["bathroom-room", "prince-basement", "cinema-room", "bedroom-room"]
      .map(function (id) { return [id, getComputedStyle(document.getElementById(id)).contentVisibility]; });
    var stripVisibility = getComputedStyle(document.getElementById("loft-game-strip")).visibility;
    var rumbleScope = null;
    if (!low) {
      var rumbleRoot = document.getElementById("entrance-drive-hud-svg");
      var rumbleChild = document.getElementById("entrance-roadtrip-world");
      rumbleRoot.style.setProperty("--roadtrip-rumble-x", "9px");
      rumbleScope = [
        getComputedStyle(rumbleRoot).getPropertyValue("--roadtrip-rumble-x").trim(),
        getComputedStyle(rumbleChild).getPropertyValue("--roadtrip-rumble-x").trim()
      ];
      rumbleRoot.style.removeProperty("--roadtrip-rumble-x");
    }
    coveredAnimation = document.querySelector("#bathroom-room .bathroom-bubble");
    counters = {
      attributes: 0,
      removes: 0,
      appends: 0,
      roadPaints: 0,
      hiddenStreetCarPaints: 0,
      idleArrestPaints: 0,
      transmissionFocusPaints: 0,
      road: document.querySelector("#entrance-roadtrip-road .entrance-roadtrip-asphalt"),
      streetCar: document.getElementById("entrance-porsche"),
      arrest: document.getElementById("entrance-roadtrip-arrest")
    };
    for (var i = 0; i < 20; i++) window.__entranceDriveStep(16);
    var after = copy(drive());
    var result = {
      counters: {
        attributes: counters.attributes,
        removes: counters.removes,
        appends: counters.appends,
        roadPaints: counters.roadPaints,
        hiddenStreetCarPaints: counters.hiddenStreetCarPaints,
        idleArrestPaints: counters.idleArrestPaints,
        transmissionFocusPaints: counters.transmissionFocusPaints
      },
      elapsed: after.roadtrip.elapsedSeconds - before.roadtrip.elapsedSeconds,
      distance: after.roadtrip.distance - before.roadtrip.distance,
      entityCount: after.roadtrip.entityCount,
      containment: getComputedStyle(document.getElementById("entrance-room")).contain,
      coveredVisibility: coveredVisibility,
      stripVisibility: stripVisibility,
      rumbleScope: rumbleScope,
      coveredAnimationState: coveredAnimation && getComputedStyle(coveredAnimation).animationPlayState,
      overlayContainment: overlayContainment,
      roomSize: [roomRect.width, roomRect.height],
      viewportSize: [viewportRect.width, viewportRect.height],
      health: window.__frameHealthState()
    };
    counters = null;
    return result;
  }
  try {
    Object.defineProperty(document, "hasFocus", {
      value: function () { return true; }, configurable: true
    });
    window.__unlockAllRooms();
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
    report.healthy = run(false);
    report.low = run(true);
    window.__exitEntranceRoadtrip();
    window.__syncScopeMirrors();
    report.restoredVisibility = ["bathroom-room", "prince-basement", "cinema-room", "bedroom-room"]
      .map(function (id) { return [id, getComputedStyle(document.getElementById(id)).contentVisibility]; });
    report.restoredStripVisibility = getComputedStyle(document.getElementById("loft-game-strip")).visibility;
    report.restoredAnimationState = coveredAnimation && getComputedStyle(coveredAnimation).animationPlayState;
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  Element.prototype.setAttribute = originalSet;
  Element.prototype.removeAttribute = originalRemove;
  Element.prototype.appendChild = originalAppend;
  report.errors = (window.__errs || []).concat(report.errors);
  document.getElementById("__report").textContent = JSON.stringify(report);
})();
</script>`;

var PAN_HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  try {
    Object.defineProperty(document, "hasFocus", {
      value: function () { return true; }, configurable: true
    });
    window.__unlockAllRooms();
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__entranceRoadtripDevStart();
    var geometryReads = 0;
    var originalRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      geometryReads++;
      return originalRect.apply(this, arguments);
    };
    var profiles = {};
    ["engine", "music", "tire", "screech", "abs", "crash", "reward", "police"].forEach(function (kind) {
      profiles[kind] = window.__entranceDriveSpatialAudio(kind);
    });
    window.__entranceDriveRange("N");
    window.__entranceDriveRange("D");
    Element.prototype.getBoundingClientRect = originalRect;
    setTimeout(function () {
      try {
        report.geometryReads = geometryReads;
        report.profiles = profiles;
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 320);
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 4500, {
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2026-09-22&time=14:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
var panResult = lib.runPageSync("loft-day.html", PAN_HARNESS, 2500, {
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2026-09-22&time=14:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});

console.log("loft-day.html adaptive Road Trip painting:");
var source = fs.readFileSync("loft-day.html", "utf8");
check(/sample\.roadtripCurveOffset = roadtripCurveOffset\(sample\.remaining\)/.test(source) &&
  /Number\.isFinite\(point\.roadtripCurveOffset\)/.test(source),
  "shared road samples cache the curve integral instead of recomputing it for every SVG path");
check(result && result.errors.length === 0, "focused performance probe has no page errors",
  result && result.errors);
var healthy = result && result.healthy;
var low = result && result.low;
if (healthy && low) console.log("  metrics: " + healthy.counters.attributes +
  " healthy / " + low.counters.attributes + " low-frame SVG attribute writes per 20 physics steps");
check(healthy && low && !healthy.health.slow && low.health.slow,
  "frame-health hysteresis selects the adaptive highway painter", { healthy: healthy, low: low });
check(healthy && healthy.containment === "layout paint" &&
  healthy.roomSize[0] === healthy.viewportSize[0] && healthy.roomSize[1] === healthy.viewportSize[1],
  "the active highway is layout/paint-contained without changing its viewport size", healthy);
check(healthy && healthy.overlayContainment.every(function (row) { return row[1] === "layout paint"; }),
  "all fixed-size overlay rooms establish independent layout/paint scopes", healthy && healthy.overlayContainment);
check(healthy && healthy.coveredVisibility.every(function (row) { return row[1] === "hidden"; }),
  "Road Trip skips rendering every fully covered room surface", healthy && healthy.coveredVisibility);
check(healthy && healthy.stripVisibility === "hidden",
  "Road Trip hides the covered loft strip without applying size containment", healthy);
check(healthy && healthy.coveredAnimationState === "paused",
  "Road Trip pauses covered CSS animations instead of advancing invisible frames", healthy);
check(healthy && healthy.rumbleScope && healthy.rumbleScope[0] === "9px" &&
  healthy.rumbleScope[1] !== "9px",
  "shoulder-rumble tuning stays on the SVG root instead of invalidating its descendants",
  healthy && healthy.rumbleScope);
check(result && result.restoredVisibility.every(function (row) { return row[1] === "visible"; }),
  "exiting Road Trip immediately restores every covered room surface", result && result.restoredVisibility);
check(result && result.restoredStripVisibility === "visible",
  "exiting Road Trip immediately restores the loft strip", result && result.restoredStripVisibility);
check(result && result.restoredAnimationState === "running",
  "exiting Road Trip resumes covered CSS animations", result && result.restoredAnimationState);
check(healthy && low && healthy.counters.roadPaints === 20 &&
  low.counters.roadPaints >= 9 && low.counters.roadPaints <= 11,
  "healthy driving paints every step while low-frame driving caps the world near 30 Hz",
  { healthy: healthy && healthy.counters, low: low && low.counters });
check(healthy && low && low.counters.attributes < healthy.counters.attributes * .66,
  "the low-frame world spends less than 66% of the healthy SVG attribute budget",
  { healthy: healthy && healthy.counters, low: low && low.counters });
check(healthy && low && low.counters.removes === 0 && low.counters.appends === 0,
  "steady traffic and idle police cause no no-op removals or DOM layer reorders", low && low.counters);
check(healthy && low && healthy.counters.hiddenStreetCarPaints === 0 &&
  healthy.counters.idleArrestPaints === 0 && healthy.counters.transmissionFocusPaints === 0 &&
  low.counters.hiddenStreetCarPaints === 0 && low.counters.idleArrestPaints === 0 &&
  low.counters.transmissionFocusPaints === 0,
  "highway frames skip the hidden street car and unchanged control overlays",
  { healthy: healthy && healthy.counters, low: low && low.counters });
check(healthy && low && Math.abs(healthy.elapsed - .32) < .0001 &&
  Math.abs(low.elapsed - healthy.elapsed) < .0001 && Math.abs(low.distance - healthy.distance) < .05,
  "physics and route progress remain full-rate under the lower paint budget",
  { healthy: healthy, low: low });
check(healthy && low && healthy.entityCount === 1 && low.entityCount === 1,
  "traffic simulation ownership is unchanged by paint cadence", { healthy: healthy, low: low });
check(panResult && panResult.errors.length === 0,
  "static spatial-audio cache probe has no page errors", panResult && panResult.errors);
check(panResult && panResult.geometryReads === 0,
  "Road Trip derives every driving/UI audio pan without a DOM geometry read", panResult);
check(panResult && panResult.profiles && panResult.profiles.engine.pan === 0 &&
  panResult.profiles.music.pan === 0 && panResult.profiles.crash.pan === 0 &&
  panResult.profiles.reward.pan === 0 && panResult.profiles.abs.pan < -.45,
  "modeled cabin/UI pans keep centred sources centred and ABS by the brake", panResult && panResult.profiles);

if (failures) {
  console.error(failures + " adaptive Road Trip performance assertion(s) failed.");
  process.exit(1);
}
console.log("Adaptive Road Trip performance assertions passed.");
