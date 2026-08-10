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
  function click(node) { node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);
        var room = document.getElementById("entrance-room");
        var sun = document.getElementById("entrance-roadtrip-camp-sun");
        var stars = document.getElementById("entrance-roadtrip-camp-stars");
        var moon = document.getElementById("entrance-roadtrip-camp-moon");
        var moonPhase = document.getElementById("entrance-roadtrip-camp-moon-phase");
        var snow = document.getElementById("entrance-roadtrip-camp-winter-snow");
        var iceBubbles = document.getElementById("entrance-roadtrip-camp-ice-bubbles");
        report.day = {
          entranceDay: room.classList.contains("entrance-day"),
          sunOpacity: getComputedStyle(sun).opacity,
          sunPointer: getComputedStyle(sun).pointerEvents,
          nightOpacity: getComputedStyle(document.getElementById("entrance-roadtrip-camp-night")).opacity
        };
        var caption = document.getElementById("hunt-caption");
        var beforeToggle = { caption: caption.textContent, toasts: document.querySelectorAll(".season-toast").length };
        click(sun);
        await new Promise(function (resolve) { setTimeout(resolve, 80); });
        report.sunToggle = {
          dusk: document.getElementById("stage-balcony").classList.contains("dusk"),
          entranceDay: room.classList.contains("entrance-day"),
          caption: caption.textContent,
          toasts: document.querySelectorAll(".season-toast").length,
          before: beforeToggle
        };
        window.__applyMoonPhases();
        var frac = window.__moonPhase().frac;
        report.night = {
          entranceDay: room.classList.contains("entrance-day"),
          starsOpacity: getComputedStyle(stars).opacity,
          moonPointer: getComputedStyle(moon).pointerEvents,
          starAnimation: getComputedStyle(stars.querySelector(".twinkle")).animationName,
          lineAnimation: getComputedStyle(stars.querySelector(".const-lines")).animationName,
          moonOpacity: getComputedStyle(moon).opacity,
          phase: moonPhase.getAttribute("d"),
          expectedPhase: window.__moonShadowD(590, -86, 15, frac)
        };
        click(moon);
        await new Promise(function (resolve) { setTimeout(resolve, 80); });
        report.moonToggle = {
          dusk: document.getElementById("stage-balcony").classList.contains("dusk"),
          entranceDay: room.classList.contains("entrance-day"),
          caption: caption.textContent,
          toasts: document.querySelectorAll(".season-toast").length
        };
        window.overcast.set(true);
        window.__setDayNight(true);
        await new Promise(function (resolve) { setTimeout(resolve, 80); });
        var cloudStars = stars.querySelectorAll(".entrance-roadtrip-camp-cloud-star");
        var hiddenScatter = stars.querySelector("#entrance-roadtrip-camp-star-scatter circle:not(.entrance-roadtrip-camp-cloud-star)");
        report.clouded = {
          stamped: room.classList.contains("entrance-clouded"),
          starsOpacity: getComputedStyle(stars).opacity,
          subsetOpacity: getComputedStyle(document.getElementById("entrance-roadtrip-camp-star-scatter")).opacity,
          subsetCount: cloudStars.length,
          subsetAnimation: getComputedStyle(cloudStars[0]).animationName,
          hiddenDisplay: getComputedStyle(hiddenScatter).display,
          constellationsOpacity: getComputedStyle(document.getElementById("entrance-roadtrip-camp-const-dipper")).opacity,
          moonOpacity: getComputedStyle(moon).opacity,
          sunOpacity: getComputedStyle(sun).opacity,
          sunPointer: getComputedStyle(sun).pointerEvents,
          moonPointer: getComputedStyle(moon).pointerEvents
        };
        window.overcast.set(false);
        window.__applySeason("winter", true);
        await new Promise(function (resolve) { setTimeout(resolve, 40); });
        report.winter = {
          season: room.getAttribute("data-roadtrip-season"),
          stamped: room.classList.contains("entrance-roadtrip-season-winter"),
          snowOpacity: getComputedStyle(snow).opacity,
          bubbleOpacity: getComputedStyle(iceBubbles).opacity,
          bubblePointer: getComputedStyle(iceBubbles).pointerEvents
        };
        window.__applySeason("summer", true);
        await new Promise(function (resolve) { setTimeout(resolve, 40); });
        report.summer = {
          season: room.getAttribute("data-roadtrip-season"),
          snowOpacity: getComputedStyle(snow).opacity,
          bubbleOpacity: getComputedStyle(iceBubbles).opacity
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

console.log("loft-day.html Abraham Lake campsite sky:");
var source = fs.readFileSync(path.join(lib.ROOT, "loft-day.html"), "utf8");
var campStars = source.match(/<g id="entrance-roadtrip-camp-stars"[\s\S]*?<\/g>\s*<g id="entrance-roadtrip-camp-moon"/);
check(campStars && (campStars[0].match(/<circle/g) || []).length >= 45,
  "the camp has a dense authored star field");
check(campStars && /camp-const-cassiopeia/.test(campStars[0]) && /camp-const-dipper/.test(campStars[0]) && /camp-const-cygnus/.test(campStars[0]),
  "three recognizable northern constellations have linework");
check(/id="entrance-roadtrip-camp-sun" transform="translate\(590 -86\)"/.test(source),
  "the camp sun shares the moon's exact center");
check(/id="entrance-roadtrip-camp-sunset"[\s\S]*?<ellipse cx="590" cy="-86" rx="92" ry="46"[\s\S]*?<circle cx="590" cy="-86" r="14"/.test(source),
  "the campsite sunset stays centered between the sun and moon");
check(/#entrance-roadtrip-camp-day>rect,#entrance-roadtrip-camp-day>path,\s*#entrance-roadtrip-camp-night>rect\{pointer-events:none\}/.test(source),
  "transparent sky paint cannot intercept the visible celestial toggle");
check(/#entrance-room\.roadtrip-route-camp #entrance-roadtrip-highway-moon\{display:none\}/.test(source),
  "the generic highway moon cannot show through the campsite sky crossfade");
check(/\["entrance-roadtrip-camp-moon-phase", 590, -86, 15\]/.test(source),
  "the camp moon participates in the shared phase painter");
check((source.match(/<path d="M(?:27|102|176|266|348|430|522|615)-/g) || []).length === 8,
  "winter adds snow across all eight campsite peaks");
var lakeAt = source.indexOf('id="entrance-roadtrip-camp-lake"');
var bubblesAt = source.indexOf('id="entrance-roadtrip-camp-ice-bubbles"');
var wavesAt = source.indexOf('id="entrance-roadtrip-camp-lake-waves"');
var iceBubbleArt = source.match(/<g id="entrance-roadtrip-camp-ice-bubbles"[\s\S]*?<\/g>\s*<path id="entrance-roadtrip-camp-lake-waves"/);
check(lakeAt >= 0 && bubblesAt > lakeAt && wavesAt > bubblesAt,
  "trapped bubbles paint over the lake fill but beneath its surface waves");
check(iceBubbleArt && (iceBubbleArt[0].match(/<ellipse/g) || []).length >= 30,
  "winter ice carries a field of layered methane-bubble clusters");

var result = lib.runPageSync("loft-day.html", HARNESS, 2600, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-08-05&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "sky state changes raise no page errors", result && result.errors);
check(result && result.day.entranceDay && Number(result.day.sunOpacity) > 0 && result.day.sunPointer === "all" && Number(result.day.nightOpacity) === 0,
  "clear daytime shows the camp sun and hides the night layer", result && result.day);
check(result && result.sunToggle.dusk && !result.sunToggle.entranceDay &&
  result.sunToggle.caption === result.sunToggle.before.caption && result.sunToggle.toasts === result.sunToggle.before.toasts,
  "tapping the camp sun silently changes the shared state to night", result && result.sunToggle);
check(result && !result.night.entranceDay && Number(result.night.starsOpacity) > 0 && Number(result.night.moonOpacity) > 0 &&
  result.night.moonPointer === "all" && result.night.starAnimation === "star-twinkle" && result.night.lineAnimation === "const-lines-pulse",
  "night uses the loft's twinkle and constellation pulse", result && result.night);
check(result && result.night.phase === result.night.expectedPhase,
  "the campsite moon terminator matches the effective date", result && result.night);
check(result && !result.moonToggle.dusk && result.moonToggle.entranceDay &&
  result.moonToggle.caption === result.sunToggle.before.caption && result.moonToggle.toasts === result.sunToggle.before.toasts,
  "tapping the camp moon silently changes the shared state to day", result && result.moonToggle);
check(result && result.clouded.stamped && Number(result.clouded.starsOpacity) > 0 &&
  Number(result.clouded.subsetOpacity) > 0 && Number(result.clouded.subsetOpacity) < .25 &&
  result.clouded.subsetCount === 8 && result.clouded.subsetAnimation === "star-twinkle" &&
  result.clouded.hiddenDisplay === "none" && Number(result.clouded.constellationsOpacity) === 0 &&
  Number(result.clouded.moonOpacity) === 0 && result.clouded.sunPointer === "none" && result.clouded.moonPointer === "none",
  "cloud cover keeps only eight dim animated stars and hides the moon", result && result.clouded);
check(result && result.winter.stamped && result.winter.season === "winter" &&
  Number(result.winter.snowOpacity) > 0 && Number(result.winter.bubbleOpacity) > 0 &&
  result.winter.bubblePointer === "none",
  "winter reveals mountain snow and inert bubbles beneath the frozen lake", result && result.winter);
check(result && result.summer.season === "summer" && Number(result.summer.snowOpacity) === 0 &&
  Number(result.summer.bubbleOpacity) === 0,
  "snow and trapped bubbles retreat outside winter", result && result.summer);

if (failures) process.exit(1);
console.log("Abraham Lake campsite sky checks passed.");
