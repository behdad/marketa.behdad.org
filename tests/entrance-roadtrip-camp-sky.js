#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<style>*{transition:none!important}</style>
<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripStart();
        window.__entranceRoadtripSetRoute("camp", 0);
        var room = document.getElementById("entrance-room");
        var sun = document.getElementById("entrance-roadtrip-camp-sun");
        var stars = document.getElementById("entrance-roadtrip-camp-stars");
        var moon = document.getElementById("entrance-roadtrip-camp-moon");
        var moonPhase = document.getElementById("entrance-roadtrip-camp-moon-phase");
        var snow = document.getElementById("entrance-roadtrip-camp-winter-snow");
        report.day = {
          entranceDay: room.classList.contains("entrance-day"),
          sunOpacity: getComputedStyle(sun).opacity,
          nightOpacity: getComputedStyle(document.getElementById("entrance-roadtrip-camp-night")).opacity
        };
        window.night();
        await new Promise(function (resolve) { setTimeout(resolve, 80); });
        window.__applyMoonPhases();
        var frac = window.__moonPhase().frac;
        report.night = {
          entranceDay: room.classList.contains("entrance-day"),
          starsOpacity: getComputedStyle(stars).opacity,
          starAnimation: getComputedStyle(stars.querySelector(".twinkle")).animationName,
          lineAnimation: getComputedStyle(stars.querySelector(".const-lines")).animationName,
          moonOpacity: getComputedStyle(moon).opacity,
          phase: moonPhase.getAttribute("d"),
          expectedPhase: window.__moonShadowD(590, -86, 15, frac)
        };
        window.overcast(true);
        await new Promise(function (resolve) { setTimeout(resolve, 80); });
        report.clouded = {
          stamped: room.classList.contains("entrance-clouded"),
          starsOpacity: getComputedStyle(stars).opacity,
          moonOpacity: getComputedStyle(moon).opacity,
          sunOpacity: getComputedStyle(sun).opacity
        };
        window.overcast(false);
        window.__applySeason("winter", true);
        await new Promise(function (resolve) { setTimeout(resolve, 40); });
        report.winter = {
          season: room.getAttribute("data-roadtrip-season"),
          stamped: room.classList.contains("entrance-roadtrip-season-winter"),
          snowOpacity: getComputedStyle(snow).opacity
        };
        window.__applySeason("summer", true);
        await new Promise(function (resolve) { setTimeout(resolve, 40); });
        report.summer = {
          season: room.getAttribute("data-roadtrip-season"),
          snowOpacity: getComputedStyle(snow).opacity
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 260);
  });
})();
</script>`;

var failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + label + (!ok && detail != null ? "   [" + JSON.stringify(detail) + "]" : ""));
  if (!ok) failures++;
}

console.log("rsvp.html Abraham Lake campsite sky:");
var source = fs.readFileSync(path.join(lib.ROOT, "rsvp.html"), "utf8");
var campStars = source.match(/<g id="entrance-roadtrip-camp-stars"[\s\S]*?<\/g>\s*<g id="entrance-roadtrip-camp-moon"/);
check(campStars && (campStars[0].match(/<circle/g) || []).length >= 45,
  "the camp has a dense authored star field");
check(campStars && /camp-const-cassiopeia/.test(campStars[0]) && /camp-const-dipper/.test(campStars[0]) && /camp-const-cygnus/.test(campStars[0]),
  "three recognizable northern constellations have linework");
check(/\["entrance-roadtrip-camp-moon-phase", 590, -86, 15\]/.test(source),
  "the camp moon participates in the shared phase painter");
check((source.match(/<path d="M(?:27|102|176|266|348|430|522|615)-/g) || []).length === 8,
  "winter adds snow across all eight campsite peaks");

var result = lib.runPageSync("rsvp.html", HARNESS, 2600, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-08-05&time=12:00#play",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "sky state changes raise no page errors", result && result.errors);
check(result && result.day.entranceDay && Number(result.day.sunOpacity) > 0 && Number(result.day.nightOpacity) === 0,
  "clear daytime shows the camp sun and hides the night layer", result && result.day);
check(result && !result.night.entranceDay && Number(result.night.starsOpacity) > 0 && Number(result.night.moonOpacity) > 0 &&
  result.night.starAnimation === "star-twinkle" && result.night.lineAnimation === "const-lines-pulse",
  "night uses the loft's twinkle and constellation pulse", result && result.night);
check(result && result.night.phase === result.night.expectedPhase,
  "the campsite moon terminator matches the effective date", result && result.night);
check(result && result.clouded.stamped && Number(result.clouded.starsOpacity) === 0 && Number(result.clouded.moonOpacity) === 0,
  "cloud cover hides stars and moon", result && result.clouded);
check(result && result.winter.stamped && result.winter.season === "winter" && Number(result.winter.snowOpacity) > 0,
  "winter reveals the expanded mountain snow", result && result.winter);
check(result && result.summer.season === "summer" && Number(result.summer.snowOpacity) === 0,
  "the expanded snow retreats outside winter", result && result.summer);

if (failures) process.exit(1);
console.log("Abraham Lake campsite sky checks passed.");
