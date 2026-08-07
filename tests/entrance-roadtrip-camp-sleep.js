#!/usr/bin/env node
// The campsite curtain call pauses safely, completes in order, and resets only after exit.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<style>
#entrance-roadtrip-camp *,#entrance-roadtrip-camp-wisdom{transition:none!important}
#entrance-roadtrip-camp.camp-sleep-zzz:not(.camp-sleep-complete) .entrance-roadtrip-camp-finale-zzz{animation:none!important;opacity:.86!important}
</style>
<script>
(function () {
  var report = { errors: [] };
  function click(node) {
    if (!node) return false;
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  }
  function snap() {
    var camp = document.getElementById("entrance-roadtrip-camp");
    var room = document.getElementById("entrance-room");
    var tent = document.getElementById("entrance-roadtrip-camp-tent");
    var liveConstellations = document.getElementById("entrance-roadtrip-camp-finale-constellations");
    var finaleConstellations = document.getElementById("entrance-roadtrip-camp-finale-sleep-constellations");
    var fieldStars = Array.prototype.slice.call(document.querySelectorAll(".entrance-roadtrip-camp-finale-field-star"));
    var radii = fieldStars.map(function (star) { return Number(star.getAttribute("r")); });
    var roadtrip = window.__captureCheckpointSystems().entrance.drive.roadtrip;
    return {
      phase: window.__entranceRoadtripCampSleepState().phase,
      caption: window.__captionKey && window.__captionKey(),
      captionText: document.getElementById("hunt-caption").textContent.replace(/\s+/g, " ").trim(),
      campActive: room.classList.contains("roadtrip-active") && room.classList.contains("roadtrip-route-camp"),
      outerDismiss: getComputedStyle(document.getElementById("entrance-roadtrip-dismiss")).display,
      wisdomShown: document.getElementById("entrance-roadtrip-camp-wisdom").classList.contains("show"),
      wisdomClose: !!document.getElementById("entrance-roadtrip-camp-wisdom-close"),
      fireBuilderOpen: document.getElementById("entrance-roadtrip-fire-game").classList.contains("open"),
      fireBuilt: roadtrip.campFireBuilt,
      fireLit: roadtrip.campFireLit,
      stew: roadtrip.stew,
      savedPhase: roadtrip.stargazing && roadtrip.stargazing.sleepPhase,
      progress: roadtrip.stargazing && roadtrip.stargazing.progress,
      fireOpacity: Number(getComputedStyle(document.querySelector(".entrance-roadtrip-camp-fire-outer")).opacity),
      campersOpacity: ["marketa", "behdad"].map(function (name) {
        return Number(getComputedStyle(document.getElementById("entrance-roadtrip-camp-" + name)).opacity);
      }),
      tentOpen: tent.classList.contains("open"),
      tentLight: Number(getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-tent-light")).opacity),
      darkness: Number(getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-darkness")).opacity),
      darknessFill: document.getElementById("entrance-roadtrip-camp-finale-darkness").getAttribute("fill"),
      darknessPointer: getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-darkness")).pointerEvents,
      windshieldGlaze: getComputedStyle(document.getElementById("entrance-roadtrip-windshield-glaze")).visibility,
      nightSky: Number(getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-night-sky")).opacity),
      nightSkyUses: document.querySelectorAll("#entrance-roadtrip-camp-finale-night-sky use").length,
      liveConstellationOpacity: Number(getComputedStyle(liveConstellations).opacity),
      liveConstellationTransform: getComputedStyle(liveConstellations).transform,
      liveConstellationPointer: getComputedStyle(liveConstellations).pointerEvents,
      finaleConstellationOpacity: Number(getComputedStyle(finaleConstellations).opacity),
      fieldStars: fieldStars.length,
      fieldRadiusMin: Math.min.apply(null, radii),
      fieldRadiusMax: Math.max.apply(null, radii),
      fieldDurations: new Set(fieldStars.map(function (star) {
        return star.style.getPropertyValue("--camp-star-duration");
      })).size,
      fieldDelays: new Set(fieldStars.map(function (star) {
        return star.style.getPropertyValue("--camp-star-delay");
      })).size,
      zzzs: document.querySelectorAll(".entrance-roadtrip-camp-finale-zzz").length,
      classes: ["fire-out", "campers-gone", "tent-lit", "dark", "zzz", "complete"].filter(function (name) {
        return camp.classList.contains("camp-sleep-" + name);
      })
    };
  }
  function reenterCamp() {
    return click(document.querySelector('[data-roadtrip-reentry-choice="camp"]'));
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () {
    window.__unlockAllRooms();
    window.goToStage("balcony");
    setTimeout(function () {
      try {
        window.__openEntranceRoom();
        document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripStart();
        window.__entranceRoadtripSetRoute("camp", 0);
        window.__setDayNight(true);
        var checkpoint = window.__captureCheckpointSystems().entrance;
        checkpoint.drive.roadtrip.campFireBuilt = true;
        checkpoint.drive.roadtrip.campFireLit = true;
        checkpoint.drive.roadtrip.campActive = true;
        checkpoint.drive.roadtrip.stew = {
          protein: "tofu", starch: "barley", status: "served", elapsed: 11600
        };
        checkpoint.drive.roadtrip.stargazing = {
          progress: { cassiopeia: 5, "ursa-major": 7, "ursa-minor": 7 },
          completed: ["cassiopeia", "ursa-major", "ursa-minor"],
          complete: true,
          wisdomDismissed: false,
          wisdomHandoffReady: true,
          sleepPhase: "idle"
        };
        window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
        setTimeout(function () {
          try {
            report.exchange = snap();
            document.getElementById("entrance-roadtrip-camp-tent").classList.add("open");
            click(document.getElementById("entrance-roadtrip-camp-wisdom"));
            report.prompt = snap();
            window.setLang("cs");
            report.czechPrompt = snap().captionText;
            window.setLang("en");

            click(document.getElementById("entrance-roadtrip-dismiss"));
            report.promptExit = snap();
            reenterCamp();
            report.promptReturn = snap();

            click(document.getElementById("entrance-roadtrip-camp-fire"));
            report.fireOut = snap();
            click(document.getElementById("entrance-roadtrip-dismiss"));
            report.runningExit = snap();
            reenterCamp();
            report.runningReturn = snap();

            window.__entranceRoadtripCampSleepStep();
            report.campersGone = snap();
            window.__entranceRoadtripCampSleepStep();
            report.tentLit = snap();
            window.__entranceRoadtripCampSleepStep();
            report.dark = snap();
            window.__entranceRoadtripCampSleepStep();
            report.zzz = snap();
            window.__entranceRoadtripCampSleepStep();
            report.complete = snap();
            report.completeClickTarget = click(document.getElementById("entrance-roadtrip-camp-finale-darkness"));
            report.completeAfterClick = snap();
            window.setLang("cs");
            report.czechComplete = snap().captionText;
            window.setLang("en");

            click(document.getElementById("entrance-roadtrip-dismiss"));
            report.completeExit = snap();
            reenterCamp();
            report.fresh = snap();
          } catch (error) { report.errors.push(String(error && error.stack || error)); }
          finish();
        }, 220);
      } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
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

console.log("rsvp.html campsite sleep finale:");
var result = lib.runPageSync("rsvp.html", HARNESS, 2600, {
  forceReduce: true,
  urlSuffix: "?date=2026-07-15&time=23:00#play",
  chromeFlags: "--window-size=1180,900"
});
check(result && result.errors.length === 0, "the sleep finale has no uncaught errors", result && result.errors);
check(result && result.exchange && result.exchange.wisdomShown && !result.exchange.wisdomClose &&
  result.exchange.outerDismiss === "grid",
  "the exchange has no private close button and keeps the standard campsite exit", result && result.exchange);
check(result && result.prompt && result.prompt.phase === "prompt" && !result.prompt.wisdomShown &&
  result.prompt.caption === "entrance_roadtrip_camp_sleep_prompt" && result.prompt.fireLit &&
  result.prompt.savedPhase === "prompt" && result.prompt.liveConstellationOpacity === 1 &&
  result.prompt.liveConstellationTransform === "none" && result.prompt.liveConstellationPointer === "all" &&
  /put out the fire/i.test(result.prompt.captionText),
  "dismissing the exchange suggests sleep and putting out the fire", result && result.prompt);
check(result && /Uhasme oheň/.test(result.czechPrompt || ""),
  "the sleep suggestion switches to Czech", result && result.czechPrompt);
check(result && result.promptExit && !result.promptExit.campActive && result.promptReturn &&
  result.promptReturn.campActive && result.promptReturn.phase === "prompt" &&
  result.promptReturn.fireBuilt && result.promptReturn.fireLit && result.promptReturn.stew,
  "leaving at the prompt preserves the completed campsite", { exit: result && result.promptExit, back: result && result.promptReturn });
check(result && result.fireOut && result.fireOut.phase === "fire-out" && !result.fireOut.fireLit &&
  result.fireOut.fireOpacity === 0 && result.fireOut.classes.indexOf("fire-out") >= 0 &&
  result.fireOut.liveConstellationOpacity === .24 && result.fireOut.liveConstellationTransform !== "none" &&
  result.fireOut.liveConstellationPointer === "none",
  "clicking the fire extinguishes it and lets the solved constellations retreat", result && result.fireOut);
check(result && result.runningExit && !result.runningExit.campActive && result.runningReturn &&
  result.runningReturn.phase === "fire-out" && result.runningReturn.stew &&
  result.runningReturn.savedPhase === "fire-out",
  "leaving during the curtain call pauses and preserves it", { exit: result && result.runningExit, back: result && result.runningReturn });
check(result && result.campersGone && result.campersGone.phase === "campers-gone" &&
  result.campersGone.campersOpacity.every(function (opacity) { return opacity === 0; }),
  "the campers fade after the fire goes out", result && result.campersGone);
check(result && result.tentLit && result.tentLit.phase === "tent-lit" && !result.tentLit.tentOpen &&
  result.tentLit.tentLight === 1,
  "the tent closes and glows", result && result.tentLit);
check(result && result.dark && result.dark.phase === "dark" && result.dark.darkness === .78 &&
  result.dark.darknessFill === "#061b2c" && result.dark.nightSky === 1 &&
  result.dark.nightSkyUses === 3 && result.dark.finaleConstellationOpacity === .22 &&
  result.dark.fieldStars >= 120 && result.dark.fieldRadiusMin < .4 && result.dark.fieldRadiusMax > 1.3 &&
  result.dark.fieldDurations > 100 && result.dark.fieldDelays > 100 && result.dark.tentLight === 1 &&
  result.dark.windshieldGlaze === "hidden",
  "the campsite settles into deep navy with a varied, desynchronized star field and subdued constellations",
  result && result.dark);
check(result && result.zzz && result.zzz.phase === "zzz" && result.zzz.tentLight === 0 &&
  result.zzz.zzzs === 3 && result.zzz.classes.indexOf("zzz") >= 0,
  "the tent light goes out and three rising Z marks take over", result && result.zzz);
check(result && result.complete && result.complete.phase === "complete" &&
  result.complete.caption === "entrance_roadtrip_camp_arrival" && /Congrats!/.test(result.complete.captionText),
  "the existing permanent RSVP congratulations caption ends the finale", result && result.complete);
check(result && result.complete && result.complete.darknessPointer === "all" && result.completeClickTarget &&
  result.completeAfterClick && result.completeAfterClick.phase === "complete" &&
  !result.completeAfterClick.fireBuilderOpen,
  "the completed dark campsite absorbs stray clicks without reopening a dead builder",
  { target: result && result.completeClickTarget, after: result && result.completeAfterClick });
check(result && /Gratulujeme!/.test(result.czechComplete || ""),
  "the final congratulations remains bilingual", result && result.czechComplete);
check(result && result.completeExit && !result.completeExit.campActive && result.fresh &&
  result.fresh.campActive && result.fresh.phase === "idle" && !result.fresh.fireBuilt &&
  !result.fresh.fireLit && !result.fresh.stew && result.fresh.savedPhase === "idle" &&
  Object.keys(result.fresh.progress || {}).every(function (name) { return result.fresh.progress[name] === 0; }),
  "leaving after completion makes the next Camping visit fresh", { exit: result && result.completeExit, fresh: result && result.fresh });

if (failures) process.exit(1);
console.log("Campsite sleep-finale assertions passed.");
