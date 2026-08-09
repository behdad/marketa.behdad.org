#!/usr/bin/env node
// The highway HUD presents one compact stats row and a durable three-leg route ribbon.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function roadtrip() { return window.__entranceRoomState().drive.roadtrip; }
  function click(selector) {
    var node = document.querySelector(selector);
    if (!node) throw new Error("missing click target: " + selector);
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  function driveAt(speed, gear, seconds) {
    for (var index = 0; index < seconds; index++) {
      window.__entranceDriveSetMotion(speed, gear);
      window.__entranceDriveStep(1000);
    }
  }
  function hud() {
    var root = document.getElementById("entrance-roadtrip-route-progress");
    var segments = Array.prototype.slice.call(root.querySelectorAll("[data-roadtrip-progress-segment]"));
    return {
      progress: roadtrip().progress,
      opacity: Number(getComputedStyle(root).opacity),
      start: root.getAttribute("data-roadtrip-progress-start"),
      current: root.getAttribute("data-roadtrip-progress-current"),
      states: segments.map(function (node) { return node.getAttribute("data-roadtrip-progress-state"); }),
      fills: segments.map(function (node) {
        return Number(node.querySelector(".entrance-roadtrip-progress-fill").getAttribute("width"));
      }),
      geometry: segments.map(function (node) {
        var track = node.querySelector(".entrance-roadtrip-progress-skip");
        return { x: Number(track.getAttribute("x")), width: Number(track.getAttribute("width")) };
      }),
      hatches: segments.map(function (node) {
        return Number(getComputedStyle(node.querySelector(".entrance-roadtrip-progress-skip")).opacity);
      }),
      labels: Array.prototype.map.call(root.querySelectorAll("[data-roadtrip-progress-label]"),
        function (node) { return node.textContent; }),
      campMarker: (function () {
        var marker = document.getElementById("entrance-roadtrip-progress-camp");
        return marker && { text: marker.textContent, x: Number(marker.getAttribute("x")),
          y: Number(marker.getAttribute("y")) };
      })(),
      stats: document.getElementById("entrance-roadtrip-score-trip").textContent,
      legacyPoints: !!document.getElementById("entrance-roadtrip-score-points")
    };
  }
  function fresh(route) {
    if (roadtrip().active) window.__exitEntranceRoadtrip();
    window.__entranceRoadtripDevStart(route);
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
    return hud();
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
        window.__unlockAllRooms();
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
        window.__setSecondRound(true, { releaseHeld: false });
        if (window.__gardenPartyOn) window.__setPartyMode(false, true);
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();

        report.local = hud();
        report.starts = {
          calgary: fresh("calgary"),
          banff: fresh("banff"),
          abraham: fresh("abraham")
        };

        fresh("banff");
        driveAt(90, 3, 4);
        report.forward = hud();
        driveAt(-36, -1, 4);
        report.reversed = hud();
        window.setLang("cs");
        report.czechStats = hud().stats;
        window.setLang("en");

        window.__exitEntranceRoadtrip();
        var checkpoint = window.__captureCheckpointSystems().entrance;
        report.saved = checkpoint.drive.roadtrip.pausedRun && checkpoint.drive.roadtrip.pausedRun.state;
        window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
        click("#entrance-roadtrip-reenter");
        click('[data-roadtrip-reentry-choice="continue"]');
        report.restored = hud();

        fresh("calgary");
        var requirements = roadtrip();
        window.__entranceRoadtripStepRouteDistance(requirements.calgaryDistance);
        report.transitions = { turnoff: hud() };
        window.__entranceRoadtripStepRouteDistance(requirements.turnoffDistanceRequired);
        report.transitions.banff = hud();
        window.__entranceRoadtripStepRouteDistance(requirements.banffDistanceRequired);
        report.transitions.lakeTurnoff = hud();
        window.__entranceRoadtripStepRouteDistance(requirements.lakeTurnoffDistanceRequired);
        report.transitions.abraham = hud();

        fresh("abraham");
        requirements = roadtrip();
        window.__entranceRoadtripSetRouteDistance("abraham", requirements.abrahamDistanceRequired + 10);
        report.missedFirstExit = hud();
        window.__entranceRoadtripSetRouteDistance("abraham",
          requirements.abrahamDistanceRequired + requirements.campExitRepeatDistance - 1);
        report.repeatExit = hud();

        fresh("abraham");
        requirements = roadtrip();
        window.__entranceRoadtripSetRouteDistance("abraham",
          requirements.abrahamDistanceRequired - requirements.routePaceKmh / 3.6);
        window.__entranceRoadtripSetLane(1);
        window.__entranceDriveSetMotion(80, 3);
        window.__entranceDriveStep(100);
        report.takenExit = hud();
        window.__entranceRoadtripSetRouteDistance("camp", 0);
        report.camping = hud();
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
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
function segment(hud, index) {
  return hud && hud.progress && hud.progress.segments && hud.progress.segments[index] || {};
}

console.log("rsvp.html Road Trip progress HUD:");
var result = lib.runPageSync("rsvp.html", HARNESS, 4500, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--window-size=1100,900"
});

check(result && result.errors.length === 0, "the progress scenario has no uncaught errors",
  result && result.errors);
check(result && result.local && result.local.opacity === 0 && result.local.progress.visible === false,
  "local street driving does not show the highway ribbon", result && result.local);

var starts = result && result.starts || {};
check(starts.calgary && starts.calgary.start === "calgary" &&
  starts.calgary.states.join(",") === "current,upcoming,upcoming" &&
  starts.calgary.hatches.join(",") === "0,0,0",
  "a Calgary start begins on the first of three visible legs", starts.calgary);
check(starts.banff && starts.banff.start === "banff" &&
  starts.banff.states.join(",") === "skipped,current,upcoming" &&
  starts.banff.hatches[0] === 1 && starts.banff.fills[0] === 0,
  "a Banff start hatches Calgary instead of marking it complete", starts.banff);
check(starts.abraham && starts.abraham.start === "abraham" &&
  starts.abraham.states.join(",") === "skipped,skipped,current" &&
  starts.abraham.hatches[0] === 1 && starts.abraham.hatches[1] === 1,
  "an Abraham start hatches both earlier legs", starts.abraham);
check(starts.calgary && starts.calgary.labels.join("|") === "CALGARY|BANFF|ABRAHAM" &&
  starts.calgary.opacity === 1 && starts.calgary.progress.segments.length === 3 &&
  starts.calgary.geometry.every(function (row) { return row.width === 68; }) &&
  starts.calgary.geometry.map(function (row) { return row.x; }).join(",") === "29,97,165" &&
  starts.calgary.campMarker && starts.calgary.campMarker.text === "🏕️" &&
  starts.calgary.campMarker.x > 233 && starts.calgary.campMarker.y === -63.5,
  "the active ribbon names three equal route segments and ends at Camping", starts.calgary);
check(starts.calgary && starts.calgary.stats.split("·").length === 3 &&
  /km · 0 pts$/.test(starts.calgary.stats) && !starts.calgary.legacyPoints &&
  /km · 0 b$/.test(result.czechStats || ""),
  "elapsed, distance, and localized points share the one compact stats row", {
    en: starts.calgary && starts.calgary.stats, cs: result && result.czechStats
  });

var forward = result && result.forward || {};
var reversed = result && result.reversed || {};
check(segment(forward, 1).progress > 0 && segment(reversed, 1).progress > 0 &&
  segment(reversed, 1).progress < segment(forward, 1).progress &&
  reversed.fills[1] < forward.fills[1],
  "signed travel advances and then recedes the current Banff fill", { forward: forward, reversed: reversed });

check(result && result.saved && result.restored &&
  Math.abs(result.saved.progressBanffDistance - segment(result.restored, 1).distance) < .01 &&
  result.restored.start === "banff" && result.restored.states.join(",") === "skipped,current,upcoming",
  "Continue restores the selected start, skipped leg, and signed fill distance", {
    saved: result && result.saved, restored: result && result.restored
  });

var transitions = result && result.transitions || {};
check(transitions.turnoff && transitions.turnoff.fills[0] === 68 &&
  transitions.banff.states.join(",") === "complete,current,upcoming" &&
  transitions.lakeTurnoff.fills[1] === 68 &&
  transitions.abraham.states.join(",") === "complete,complete,current",
  "Calgary and Banff become solid while each route transition activates the next leg", transitions);

check(result && result.missedFirstExit && result.repeatExit &&
  segment(result.missedFirstExit, 2).progress === 1 && segment(result.repeatExit, 2).progress === 1 &&
  result.missedFirstExit.fills[2] === 68 && result.repeatExit.fills[2] === 68,
  "the first Camping exit completes Abraham and later exit repeats stay clamped", {
    first: result && result.missedFirstExit, repeat: result && result.repeatExit
  });
check(result && result.takenExit && segment(result.takenExit, 2).progress === 1,
  "taking the first Camping exit completes the ribbon before the arrival slowdown", result && result.takenExit);
check(result && result.camping && result.camping.opacity === 0 && result.camping.progress.visible === false,
  "Camping hides the driving-only route ribbon", result && result.camping);

if (failures) process.exit(1);
console.log("Road Trip progress HUD assertions passed.");
