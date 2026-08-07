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
    var mamaBearGroup = document.getElementById("entrance-roadtrip-camp-mama-bear");
    var mamaBear = mamaBearGroup && mamaBearGroup.querySelector(".entrance-roadtrip-camp-mama");
    var finishedFire = document.getElementById("entrance-roadtrip-camp-finished-fire");
    var corn = document.getElementById("entrance-roadtrip-camp-served-corn");
    var cornCob = corn && corn.querySelector(".entrance-roadtrip-camp-corn-cob");
    var cornKernels = corn && corn.querySelector(".entrance-roadtrip-camp-corn-kernels");
    var fieldStars = Array.prototype.slice.call(document.querySelectorAll(".entrance-roadtrip-camp-finale-field-star"));
    var radii = fieldStars.map(function (star) { return Number(star.getAttribute("r")); });
    var roadtrip = window.__captureCheckpointSystems().entrance.drive.roadtrip;
    return {
      phase: window.__entranceRoadtripCampSleepState().phase,
      sleepComplete: window.__entranceRoadtripCampSleepState().complete,
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
      mamaTransform: getComputedStyle(mamaBear).transform,
      mamaAnimation: getComputedStyle(mamaBear).animationName,
      mamaLayer: mamaBearGroup.parentNode && mamaBearGroup.parentNode.id,
      mamaAboveFireRing: !!(finishedFire.compareDocumentPosition(mamaBearGroup) & Node.DOCUMENT_POSITION_FOLLOWING),
      cornOpacity: Number(getComputedStyle(corn).opacity),
      cornAnimation: getComputedStyle(corn).animationName,
      cornCobFill: getComputedStyle(cornCob).fill,
      cornKernelsOpacity: Number(getComputedStyle(cornKernels).opacity),
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
      classes: ["fire-out", "campers-gone", "tent-lit", "dark", "zzz", "complete", "congrats"].filter(function (name) {
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
            [document.querySelector("#entrance-roadtrip-camp-mama-bear .entrance-roadtrip-camp-mama"),
              document.getElementById("entrance-roadtrip-camp-served-corn")].forEach(function (node) {
              node.getAnimations().forEach(function (animation) { animation.finish(); });
            });
            report.collected = snap();
            window.__entranceRoadtripCampSleepStep();
            report.warning = snap();
            click(document.getElementById("entrance-roadtrip-dismiss"));
            report.warningExit = snap();
            reenterCamp();
            report.warningReturn = snap();
            window.setLang("cs");
            report.czechWarning = snap().captionText;
            window.setLang("en");
            setTimeout(function () {
              try { report.warningHeld = snap(); }
              catch (error) { report.errors.push(String(error && error.stack || error)); }
            }, 2850);
            setTimeout(function () {
              try {
                report.congrats = snap();
                report.completeClickTarget = click(document.getElementById("entrance-roadtrip-camp-finale-darkness"));
                report.completeAfterClick = snap();
                window.setLang("cs");
                report.czechCongrats = snap().captionText;
                window.setLang("en");
                click(document.getElementById("entrance-roadtrip-dismiss"));
                report.completeExit = snap();
                reenterCamp();
                report.fresh = snap();
              } catch (error) { report.errors.push(String(error && error.stack || error)); }
              finish();
            }, 3250);
            return;
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
var result = lib.runPageSync("rsvp.html", HARNESS, 6500, {
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
  result.campersGone.campersOpacity.every(function (opacity) { return opacity === 0; }) &&
  result.campersGone.mamaTransform === "none" && result.campersGone.cornOpacity === 1 &&
  result.campersGone.mamaLayer === "entrance-roadtrip-camp" && !result.campersGone.mamaAboveFireRing &&
  result.campersGone.cornCobFill === "rgb(196, 155, 85)" && result.campersGone.cornKernelsOpacity === .18,
  "the campers fade after the fire goes out and leave two stripped corn cobs behind",
  result && result.campersGone);
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
  result.zzz.zzzs === 3 && result.zzz.classes.indexOf("zzz") >= 0 &&
  result.zzz.mamaAnimation === "entrance-roadtrip-camp-bear-collect" &&
  result.zzz.cornAnimation === "entrance-roadtrip-camp-corn-collected" &&
  result.zzz.mamaLayer === "entrance-roadtrip-camp-mama-collection-layer" && result.zzz.mamaAboveFireRing &&
  result.collected && result.collected.mamaTransform !== "none" && result.collected.cornOpacity === 0 &&
  result.collected.mamaLayer === "entrance-roadtrip-camp-mama-collection-layer" && result.collected.mamaAboveFireRing,
  "the tent light goes out while the foreground mama bear crosses the fire ring and collects the cobs",
  result && result.zzz);
check(result && result.warning && result.warning.phase === "complete" && !result.warning.sleepComplete &&
  result.warning.savedPhase === "complete" && result.warning.caption === "entrance_roadtrip_camp_food_warning" &&
  result.warning.captionText === "Never leave food outside at night." &&
  result.warning.mamaAnimation === "none" && result.warning.cornAnimation === "none" &&
  result.warning.mamaTransform !== "none" && result.warning.cornOpacity === 0 &&
  result.warning.mamaLayer === "entrance-roadtrip-camp-mama-collection-layer" && result.warning.mamaAboveFireRing,
  "the collected food reaches its checkpointed warning beat above the ring", result && result.warning);
check(result && result.warningExit && !result.warningExit.campActive && result.warningExit.phase === "complete" &&
  result.warningReturn && result.warningReturn.campActive && result.warningReturn.phase === "complete" &&
  result.warningReturn.savedPhase === "complete" && result.warningReturn.caption === "entrance_roadtrip_camp_food_warning" &&
  result.warningReturn.mamaLayer === "entrance-roadtrip-camp-mama-collection-layer" && result.warningReturn.mamaAboveFireRing,
  "leaving during the warning preserves its checkpoint and foreground bear layer",
  { exit: result && result.warningExit, back: result && result.warningReturn });
check(result && result.warningHeld && result.warningHeld.phase === "complete" &&
  result.warningHeld.captionText === "Never leave food outside at night.",
  "the food warning remains for the full first 2.85 seconds", result && result.warningHeld);
check(result && result.congrats && result.congrats.phase === "congrats" && result.congrats.sleepComplete &&
  result.congrats.savedPhase === "congrats" && result.congrats.caption === "entrance_roadtrip_camp_arrival" &&
  /^Congrats!.*RSVP!$/.test(result.congrats.captionText) &&
  result.congrats.mamaLayer === "entrance-roadtrip-camp-mama-collection-layer" && result.congrats.mamaAboveFireRing,
  "three seconds later the existing RSVP congratulations becomes the terminal finale", result && result.congrats);
check(result && result.congrats && result.congrats.darknessPointer === "all" && result.completeClickTarget &&
  result.completeAfterClick && result.completeAfterClick.phase === "congrats" &&
  !result.completeAfterClick.fireBuilderOpen,
  "the completed dark campsite absorbs stray clicks without reopening a dead builder",
  { target: result && result.completeClickTarget, after: result && result.completeAfterClick });
check(result && result.czechWarning === "Nikdy nenechávejte přes noc jídlo venku." &&
  /^Gratulujeme!.*RSVP!$/.test(result.czechCongrats || ""),
  "both the warning and restored congratulations switch to Czech",
  { warning: result && result.czechWarning, congrats: result && result.czechCongrats });
check(result && result.completeExit && !result.completeExit.campActive && result.fresh &&
  result.fresh.campActive && result.fresh.phase === "idle" && !result.fresh.fireBuilt &&
  !result.fresh.fireLit && !result.fresh.stew && result.fresh.savedPhase === "idle" &&
  result.fresh.mamaLayer === "entrance-roadtrip-camp" && !result.fresh.mamaAboveFireRing &&
  Object.keys(result.fresh.progress || {}).every(function (name) { return result.fresh.progress[name] === 0; }),
  "leaving after completion makes the next Camping visit fresh", { exit: result && result.completeExit, fresh: result && result.fresh });

if (failures) process.exit(1);
console.log("Campsite sleep-finale assertions passed.");
