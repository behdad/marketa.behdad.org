#!/usr/bin/env node
// The campsite curtain call pauses safely, completes in order, and resets only after exit.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<style>
#entrance-roadtrip-camp *,#entrance-roadtrip-camp-wisdom{transition:none!important}
</style>
<script>
(function () {
  var report = { errors: [], sounds: [] };
  var focused = true;
  document.hasFocus = function () { return focused; };
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
    var mamaHead = mamaBearGroup && mamaBearGroup.querySelector(".entrance-roadtrip-camp-mama-head");
    var cubRunner = mamaBearGroup && mamaBearGroup.querySelector(".entrance-roadtrip-camp-cub-runner");
    var finishedFire = document.getElementById("entrance-roadtrip-camp-finished-fire");
    var darkness = document.getElementById("entrance-roadtrip-camp-finale-darkness");
    var moonlight = document.getElementById("entrance-roadtrip-camp-finale-moonlight");
    var corn = document.getElementById("entrance-roadtrip-camp-served-corn");
    var cornCob = corn && corn.querySelector(".entrance-roadtrip-camp-corn-cob");
    var cornKernels = corn && corn.querySelector(".entrance-roadtrip-camp-corn-kernels");
    var fieldStars = Array.prototype.slice.call(document.querySelectorAll(".entrance-roadtrip-camp-finale-field-star"));
    var zzzNodes = Array.prototype.slice.call(document.querySelectorAll(".entrance-roadtrip-camp-finale-zzz"));
    var fin = document.getElementById("entrance-roadtrip-camp-finale-fin");
    var finBreath = fin.querySelector(".entrance-roadtrip-camp-finale-fin-breath");
    var cameraStyle = getComputedStyle(camp);
    var cameraMatrix = cameraStyle.transform === "none" ? null : new DOMMatrixReadOnly(cameraStyle.transform);
    var radii = fieldStars.map(function (star) { return Number(star.getAttribute("r")); });
    var roadtrip = window.__captureCheckpointSystems().entrance.drive.roadtrip;
    return {
      phase: window.__entranceRoadtripCampSleepState().phase,
      phaseElapsed: window.__entranceRoadtripCampSleepState().elapsed,
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
      savedElapsed: roadtrip.stargazing && roadtrip.stargazing.sleepElapsed,
      progress: roadtrip.stargazing && roadtrip.stargazing.progress,
      fireOpacity: Number(getComputedStyle(document.querySelector(".entrance-roadtrip-camp-fire-outer")).opacity),
      campersOpacity: ["marketa", "behdad"].map(function (name) {
        return Number(getComputedStyle(document.getElementById("entrance-roadtrip-camp-" + name)).opacity);
      }),
      mamaTransform: getComputedStyle(mamaBear).transform,
      mamaAnimation: getComputedStyle(mamaBear).animationName,
      mamaPlayState: getComputedStyle(mamaBear).animationPlayState,
      mamaDelay: getComputedStyle(mamaBear).animationDelay,
      mamaHeadAnimation: getComputedStyle(mamaHead).animationName,
      mamaHeadDelay: getComputedStyle(mamaHead).animationDelay,
      mamaHeadTransform: getComputedStyle(mamaHead).transform,
      mamaFinLook: mamaBearGroup.classList.contains("camp-fin-look"),
      cubAnimation: getComputedStyle(cubRunner).animationName,
      cubDelay: getComputedStyle(cubRunner).animationDelay,
      cubTransform: getComputedStyle(cubRunner).transform,
      mamaLayer: mamaBearGroup.parentNode && mamaBearGroup.parentNode.id,
      mamaAboveFireRing: !!(finishedFire.compareDocumentPosition(mamaBearGroup) & Node.DOCUMENT_POSITION_FOLLOWING),
      cornOpacity: Number(getComputedStyle(corn).opacity),
      cornAnimation: getComputedStyle(corn).animationName,
      cornPlayState: getComputedStyle(corn).animationPlayState,
      cornDelay: getComputedStyle(corn).animationDelay,
      cornCobFill: getComputedStyle(cornCob).fill,
      cornKernelsOpacity: Number(getComputedStyle(cornKernels).opacity),
      tentOpen: tent.classList.contains("open"),
      tentLight: Number(getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-tent-light")).opacity),
      darkness: Number(getComputedStyle(darkness).opacity),
      darknessFill: darkness.getAttribute("fill"),
      darknessPointer: getComputedStyle(darkness).pointerEvents,
      moonlight: Number(getComputedStyle(moonlight).opacity),
      moonlightCanvas: [moonlight.getAttribute("y"), moonlight.getAttribute("height")],
      lakeLight: Number(getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-lake-light")).opacity),
      fireGlow: Number(getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-fire-glow")).opacity),
      windshieldGlaze: getComputedStyle(document.getElementById("entrance-roadtrip-windshield-glaze")).visibility,
      nightSky: Number(getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-night-sky")).opacity),
      nightSkyUses: document.querySelectorAll("#entrance-roadtrip-camp-finale-night-sky use").length,
      skyStarfieldUses: ["mid", "high"].map(function (name) {
        var use = document.getElementById("entrance-roadtrip-camp-finale-starfield-" + name);
        return { href: use.getAttribute("href"), transform: use.getAttribute("transform") };
      }),
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
      zzzs: zzzNodes.length,
      zzzDelays: zzzNodes.map(function (node) { return getComputedStyle(node).animationDelay; }),
      cameraAnimation: cameraStyle.animationName,
      cameraDuration: cameraStyle.animationDuration,
      cameraDelay: cameraStyle.animationDelay,
      cameraPlayState: cameraStyle.animationPlayState,
      cameraOffset: cameraMatrix ? Math.round(cameraMatrix.m42 * 100) / 100 : 0,
      finOpacity: Number(getComputedStyle(fin).opacity),
      finText: fin.textContent.replace(/\s+/g, " ").trim(),
      finFill: getComputedStyle(fin).fill,
      finFont: getComputedStyle(fin).fontFamily,
      finAnimation: getComputedStyle(finBreath).animationName,
      paused: camp.classList.contains("camp-sleep-paused"),
      fieldPlayState: fieldStars[0] && getComputedStyle(fieldStars[0]).animationPlayState,
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
    window.__playCampBearCodaSound = function (kind) { report.sounds.push(kind); };
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms([
      "kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"
    ]);
    window.__goToStage("balcony");
    setTimeout(function () {
      try {
        window.__openEntranceRoom();
        document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart();
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
            click(document.getElementById("entrance-roadtrip-camp-wisdom-continue"));
            report.prompt = snap();
            window.__setLang("cs");
            report.czechPrompt = snap().captionText;
            window.__setLang("en");

            click(document.getElementById("entrance-roadtrip-dismiss"));
            report.promptExit = snap();
            reenterCamp();
            report.promptReturn = snap();

            click(document.getElementById("entrance-roadtrip-camp-fire"));
            report.fireOut = snap();
            report.fireOutSounds = report.sounds.slice();
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
            report.zzzSounds = report.sounds.slice();
            focused = false;
            window.dispatchEvent(new Event("blur"));
            report.zzzPaused = snap();
            var zzzCheckpoint = window.__captureCheckpointSystems();
            zzzCheckpoint.entrance.drive.roadtrip.stargazing.sleepElapsed = 1400;
            window.__restoreCheckpointSystems(zzzCheckpoint, "afterStage");
            report.zzzRestored = snap();
            focused = true;
            window.dispatchEvent(new Event("focus"));
            report.zzzResumed = snap();
            [document.querySelector("#entrance-roadtrip-camp-mama-bear .entrance-roadtrip-camp-mama"),
              document.getElementById("entrance-roadtrip-camp-served-corn")].forEach(function (node) {
              node.getAnimations().forEach(function (animation) { animation.finish(); });
            });
            report.collected = snap();
            window.__entranceRoadtripCampSleepStep();
            report.warning = snap();
            report.warningSounds = report.sounds.slice();
            click(document.getElementById("entrance-roadtrip-dismiss"));
            report.warningExit = snap();
            reenterCamp();
            report.warningReturn = snap();
            window.__setLang("cs");
            report.czechWarning = snap().captionText;
            window.__setLang("en");
            setTimeout(function () {
              try {
                focused = false;
                window.dispatchEvent(new Event("blur"));
                report.warningBlurred = snap();
                report.pausedCheckpoint = window.__captureCheckpointSystems();
              }
              catch (error) { report.errors.push(String(error && error.stack || error)); }
            }, 650);
            setTimeout(function () {
              try {
                report.warningPaused = snap();
                window.__restoreCheckpointSystems(report.pausedCheckpoint, "afterStage");
                report.warningRestored = snap();
                report.warningRestoredSounds = report.sounds.slice();
                focused = true;
                window.dispatchEvent(new Event("focus"));
                report.warningResumed = snap();
              } catch (error) { report.errors.push(String(error && error.stack || error)); }
            }, 1550);
            setTimeout(function () {
              try { report.warningHeld = snap(); }
              catch (error) { report.errors.push(String(error && error.stack || error)); }
            }, 3600);
            setTimeout(function () {
              try {
                report.congrats = snap();
                report.congratsSounds = report.sounds.slice();
                report.terminalIncidentalAccepted = !!window.__captionOverlay("entrance_roadtrip_heart", {
                  owner: "camp-terminal-real-probe", scope: "lower:entrance", priority: 20,
                  duration: 1000
                });
                report.terminalAfterProbe = snap();
              } catch (error) { report.errors.push(String(error && error.stack || error)); }
            }, 4100);
            setTimeout(function () {
              try {
                report.congratsBearLook = snap();
              } catch (error) { report.errors.push(String(error && error.stack || error)); }
            }, 8700);
            setTimeout(function () {
              try {
                report.attendedCaption = snap();
                window.__setLang("cs");
                report.czechAttendedCaption = snap().captionText;
                window.__setLang("en");
                var finCheckpoint = window.__captureCheckpointSystems();
                window.__restoreCheckpointSystems(finCheckpoint, "afterStage");
                report.congratsReload = snap();
                report.completeClickTarget = click(document.getElementById("entrance-roadtrip-camp-finale-darkness"));
                report.completeAfterClick = snap();
                window.__setLang("cs");
                report.czechCongrats = snap().captionText;
                window.__setLang("en");
                click(document.getElementById("entrance-roadtrip-dismiss"));
                report.completeExit = snap();
                reenterCamp();
                report.fresh = snap();
              } catch (error) { report.errors.push(String(error && error.stack || error)); }
              finish();
            }, 10600);
            return;
          } catch (error) { report.errors.push(String(error && error.stack || error)); }
          finish();
        }, 220);
      } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
    }, 320);
  });
})();
</script>`;

var REDUCED_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<style>#entrance-roadtrip-camp *{transition:none!important}</style>
<script>
(function () {
  function frame() {
    var camp = document.getElementById("entrance-roadtrip-camp");
    var fin = document.getElementById("entrance-roadtrip-camp-finale-fin");
    var breath = fin.querySelector(".entrance-roadtrip-camp-finale-fin-breath");
    var style = getComputedStyle(camp);
    var matrix = style.transform === "none" ? null : new DOMMatrixReadOnly(style.transform);
    return {
      phase: window.__entranceRoadtripCampSleepState().phase,
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      animation: style.animationName,
      offset: matrix ? Math.round(matrix.m42) : 0,
      finOpacity: Number(getComputedStyle(fin).opacity),
      finText: fin.textContent.replace(/\s+/g, " ").trim(),
      finAnimation: getComputedStyle(breath).animationName,
      finTransform: getComputedStyle(breath).transform
    };
  }
  window.addEventListener("load", function () {
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms([
      "kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"
    ]);
    window.__goToStage("balcony");
    setTimeout(function () {
      try {
        window.__openEntranceRoom();
        document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);
        window.__setDayNight(true);
        var checkpoint = window.__captureCheckpointSystems().entrance;
        checkpoint.drive.roadtrip.campFireBuilt = true;
        checkpoint.drive.roadtrip.campFireLit = false;
        checkpoint.drive.roadtrip.campActive = true;
        checkpoint.drive.roadtrip.stew = {
          protein: "tofu", starch: "barley", status: "served", elapsed: 11600
        };
        checkpoint.drive.roadtrip.stargazing = {
          progress: { cassiopeia: 5, "ursa-major": 7, "ursa-minor": 7 },
          completed: ["cassiopeia", "ursa-major", "ursa-minor"],
          complete: true,
          wisdomDismissed: true,
          wisdomHandoffReady: false,
          sleepPhase: "complete",
          sleepElapsed: 1200
        };
        window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
        setTimeout(function () {
          var report = { warning: frame() };
          window.__entranceRoadtripCampSleepStep();
          report.congrats = frame();
          report.errors = window.__errs || [];
          document.getElementById("__report").textContent = JSON.stringify(report);
        }, 220);
      } catch (error) {
        document.getElementById("__report").textContent = JSON.stringify({ errors: [String(error && error.stack || error)] });
      }
    }, 320);
  });
})();
</script>`;

var FIN_MOTION_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () {
  var camp = document.getElementById("entrance-roadtrip-camp");
  var fin = document.getElementById("entrance-roadtrip-camp-finale-fin");
  var breath = document.querySelector(".entrance-roadtrip-camp-finale-fin-breath");
  camp.classList.add("camp-sleep-congrats");
  function frame() {
    var style = getComputedStyle(breath);
    return {
      animation: style.animationName,
      duration: style.animationDuration,
      direction: style.animationDirection,
      iterations: style.animationIterationCount,
      timing: style.animationTimingFunction,
      fontSize: getComputedStyle(fin).fontSize,
      opacity: Number(style.opacity),
      transform: style.transform,
      transformBox: style.transformBox,
      transformOrigin: style.transformOrigin
    };
  }
  var normal = frame();
  document.documentElement.classList.add("frame-rate-low");
  var low = frame();
  document.getElementById("__report").textContent = JSON.stringify({
    normal: normal,
    low: low,
    errors: window.__errs || []
  });
});
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("loft-day.html campsite sleep finale:");
var result = lib.runPageSync("loft-day.html", HARNESS, 12400, {
  forceReduce: true,
  urlSuffix: "?date=2026-07-15&time=23:00",
  chromeFlags: "--window-size=1180,900"
});
check(result && result.errors.length === 0, "the sleep finale has no uncaught errors", result && result.errors);
check(result && result.exchange && result.exchange.wisdomShown && !result.exchange.wisdomClose &&
  result.exchange.outerDismiss === "grid",
  "the exchange has no private close button and keeps the standard campsite exit", result && result.exchange);
check(result && result.prompt && result.prompt.phase === "fire-out" && !result.prompt.wisdomShown &&
  result.prompt.caption === "entrance_roadtrip_camp_sleep_prompt" && !result.prompt.fireLit &&
  result.prompt.savedPhase === "fire-out" && result.prompt.liveConstellationOpacity === .72 &&
  result.prompt.fireGlow === 0 && result.prompt.darkness === .08 && result.prompt.nightSky === .1 &&
  result.prompt.liveConstellationTransform !== "none" && result.prompt.liveConstellationPointer === "none" &&
  /put out the fire/i.test(result.prompt.captionText),
  "Continue dismisses the exchange and immediately starts putting out the fire", result && result.prompt);
check(result && /Uhasme oheň/.test(result.czechPrompt || ""),
  "the sleep suggestion switches to Czech", result && result.czechPrompt);
check(result && result.promptExit && !result.promptExit.campActive && result.promptReturn &&
  result.promptReturn.campActive && result.promptReturn.phase === "fire-out" &&
  result.promptReturn.fireBuilt && !result.promptReturn.fireLit && result.promptReturn.stew,
  "leaving after Continue preserves the running fire-out handoff", { exit: result && result.promptExit, back: result && result.promptReturn });
check(result && result.fireOut && result.fireOut.phase === "fire-out" && !result.fireOut.fireLit &&
  result.fireOut.fireOpacity === 0 && result.fireOut.classes.indexOf("fire-out") >= 0 &&
  result.fireOut.fireGlow === 0 && result.fireOut.darkness === .08 && result.fireOut.nightSky === .1 &&
  result.fireOut.liveConstellationOpacity === .72 && result.fireOut.liveConstellationTransform !== "none" &&
  result.fireOut.liveConstellationPointer === "none",
  "the extinguished fire stays inert while the gradual sky handoff runs", result && result.fireOut);
check(result && result.fireOutSounds && result.fireOutSounds.join("|") === "embers",
  "putting out the fire adds one quiet ember-breath cue", result && result.fireOutSounds);
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
check(result && result.dark && result.dark.phase === "dark" && result.dark.darkness === .42 &&
  result.dark.darknessFill === "#061b2c" && result.dark.nightSky === .62 &&
  result.dark.moonlight === .33 && result.dark.moonlightCanvas.join("|") === "-260|480" &&
  result.dark.lakeLight === .28 &&
  result.dark.liveConstellationOpacity === .28 &&
  result.dark.nightSkyUses === 5 && result.dark.skyStarfieldUses.every(function (use) {
    return use.href === "#entrance-roadtrip-camp-finale-starfield";
  }) && result.dark.skyStarfieldUses.map(function (use) { return use.transform; }).join("|") ===
    "translate(0 -80)|translate(0 -160)" && result.dark.finaleConstellationOpacity === .22 &&
  result.dark.fieldStars >= 120 && result.dark.fieldRadiusMin < .4 && result.dark.fieldRadiusMax > 1.3 &&
  result.dark.fieldDurations > 100 && result.dark.fieldDelays > 100 && result.dark.tentLight === 1 &&
  result.dark.windshieldGlaze === "hidden",
  "the campsite grades through moonlight, lake reflection, dense stars, and subdued constellations",
  result && result.dark);
check(result && [result.fireOut, result.campersGone, result.tentLit, result.dark, result.zzz, result.warning]
  .every(function (frame, index, frames) {
    return !index || frame.darkness > frames[index - 1].darkness && frame.nightSky > frames[index - 1].nightSky &&
      frame.moonlight > frames[index - 1].moonlight && frame.lakeLight > frames[index - 1].lakeLight;
  }), "every bedtime beat advances the same continuous lighting palette",
  result && [result.fireOut, result.campersGone, result.tentLit, result.dark, result.zzz, result.warning]);
check(result && result.zzz && result.zzz.phase === "zzz" && result.zzz.tentLight === 0 &&
  result.zzz.zzzs === 3 && result.zzz.classes.indexOf("zzz") >= 0 &&
  result.zzz.mamaAnimation === "entrance-roadtrip-camp-bear-collect" &&
  result.zzz.cornAnimation === "entrance-roadtrip-camp-corn-collected" &&
  result.zzz.mamaLayer === "entrance-roadtrip-camp-mama-collection-layer" && result.zzz.mamaAboveFireRing &&
  result.collected && result.collected.mamaTransform !== "none" && result.collected.cornOpacity === 0 &&
  result.collected.mamaLayer === "entrance-roadtrip-camp-mama-collection-layer" && result.collected.mamaAboveFireRing,
  "the tent light goes out while the foreground mama bear crosses the fire ring and collects the cobs",
  result && result.zzz);
check(result && result.zzzSounds && result.zzzSounds.join("|") === "embers|approach",
  "the mama bear enters on one restrained approach cue", result && result.zzzSounds);
check(result && result.zzzPaused && result.zzzPaused.phase === "zzz" && result.zzzPaused.paused &&
  result.zzzPaused.mamaPlayState === "paused" && result.zzzPaused.cornPlayState === "paused" &&
  result.zzzResumed && !result.zzzResumed.paused && result.zzzResumed.mamaPlayState === "running" &&
  result.zzzResumed.cornPlayState === "running",
  "blur pauses the mama-bear collection in place and focus resumes it",
  { paused: result && result.zzzPaused, resumed: result && result.zzzResumed });
check(result && result.zzzRestored && result.zzzRestored.phase === "zzz" &&
  result.zzzRestored.phaseElapsed === 1400 && result.zzzRestored.savedElapsed === 1400 &&
  result.zzzRestored.mamaDelay === "-1.4s" && result.zzzRestored.cornDelay === "-1.4s" &&
  result.zzzRestored.zzzDelays.join("|") === "-1.4s|-1.06s|-0.72s" &&
  result.zzzRestored.mamaTransform !== "none",
  "checkpoint restore seeks the bear, cobs, and Zs to the saved point within their beat",
  result && result.zzzRestored);
check(result && result.warning && result.warning.phase === "complete" && !result.warning.sleepComplete &&
  result.warning.savedPhase === "complete" && result.warning.caption === "entrance_roadtrip_camp_food_warning" &&
  result.warning.captionText === "Never leave food outside at night." &&
  result.warning.cameraAnimation === "entrance-roadtrip-camp-finale-pan" &&
  result.warning.cameraDuration === "3s" && result.warning.cameraOffset >= 0 && result.warning.cameraOffset < 2 &&
  result.warning.finOpacity === 0 &&
  result.warning.mamaAnimation === "none" && result.warning.cornAnimation === "none" &&
  result.warning.mamaTransform !== "none" && result.warning.cornOpacity === 0 &&
  result.warning.mamaLayer === "entrance-roadtrip-camp-mama-collection-layer" && result.warning.mamaAboveFireRing,
  "the collected food reaches its checkpointed warning beat above the ring", result && result.warning);
check(result && result.warningSounds && result.warningSounds.join("|") === "embers|approach|collect",
  "collecting the cobs adds one dry pickup cue", result && result.warningSounds);
check(result && result.warningExit && !result.warningExit.campActive && result.warningExit.phase === "complete" &&
  result.warningReturn && result.warningReturn.campActive && result.warningReturn.phase === "complete" &&
  result.warningReturn.savedPhase === "complete" && result.warningReturn.caption === "entrance_roadtrip_camp_food_warning" &&
  result.warningReturn.mamaLayer === "entrance-roadtrip-camp-mama-collection-layer" && result.warningReturn.mamaAboveFireRing,
  "leaving during the warning preserves its checkpoint and foreground bear layer",
  { exit: result && result.warningExit, back: result && result.warningReturn });
check(result && result.warningBlurred && result.warningBlurred.phase === "complete" &&
  result.warningBlurred.phaseElapsed >= 500 && result.warningBlurred.phaseElapsed < 1000 &&
  result.warningBlurred.paused && result.warningBlurred.fieldPlayState === "paused" &&
  result.warningBlurred.cameraPlayState === "paused" &&
  result.warningBlurred.cameraOffset > 0 && result.warningBlurred.cameraOffset < 120 &&
  result.warningPaused && result.warningPaused.phase === "complete" && result.warningPaused.paused &&
  result.warningPaused.cameraPlayState === "paused" &&
  Math.abs(result.warningPaused.cameraOffset - result.warningBlurred.cameraOffset) < 1.5 &&
  Math.abs(result.warningPaused.phaseElapsed - result.warningBlurred.phaseElapsed) <= 15,
  "moving focus away freezes the warning timer and finale animation in place",
  { blurred: result && result.warningBlurred, held: result && result.warningPaused });
check(result && result.warningRestored && result.warningRestored.phase === "complete" &&
  result.warningRestored.paused &&
  result.warningRestored.cameraAnimation === "entrance-roadtrip-camp-finale-pan" &&
  result.warningRestored.cameraPlayState === "paused" && /^-0\./.test(result.warningRestored.cameraDelay) &&
  result.warningRestored.cameraOffset > 0 && result.warningRestored.cameraOffset < 120 &&
  Math.abs(result.warningRestored.phaseElapsed - result.warningBlurred.savedElapsed) <= 15 &&
  Math.abs(result.warningRestored.savedElapsed - result.warningBlurred.savedElapsed) <= 15 &&
  result.warningResumed && !result.warningResumed.paused && result.warningResumed.fieldPlayState === "running" &&
  result.warningResumed.cameraPlayState === "running",
  "checkpoint restore retains the attended time and focus resumes the remaining beat",
  { blurred: result && result.warningBlurred, restored: result && result.warningRestored,
    resumed: result && result.warningResumed });
check(result && result.warningRestoredSounds && result.warningRestoredSounds.join("|") === "embers|approach|collect",
  "checkpoint restore does not replay a timed coda cue", result && result.warningRestoredSounds);
check(result && result.warningHeld && result.warningHeld.phase === "complete" &&
  result.warningHeld.captionText === "Never leave food outside at night.",
  "paused time does not count toward the warning's three attended seconds", result && result.warningHeld);
check(result && result.congrats && result.congrats.phase === "congrats" && result.congrats.sleepComplete &&
  result.congrats.savedPhase === "congrats" && result.congrats.caption === "entrance_roadtrip_camp_attended_time" &&
  /^Wow, what a lofly day! 1 minute in loft\. Tell us your time in your RSVP\.$/.test(result.congrats.captionText) &&
  result.congrats.cameraAnimation === "none" && result.congrats.cameraOffset === 120 &&
  result.congrats.finOpacity === .9 && result.congrats.finText === "~ fin ~" &&
  result.congrats.finFill === "rgb(238, 232, 212)" && /Fraunces/.test(result.congrats.finFont) &&
  result.congrats.finAnimation === "none" &&
  result.congrats.mamaLayer === "entrance-roadtrip-camp-mama-collection-layer" && result.congrats.mamaAboveFireRing,
  "the three-second sky pan lands with a restrained Fraunces fin and the terminal congratulations",
  result && result.congrats);
check(result && result.congratsSounds && result.congratsSounds.join("|") === "embers|approach|collect|finale",
  "the terminal congratulations gets one soft completion cue", result && result.congratsSounds);
check(result && !result.terminalIncidentalAccepted && result.terminalAfterProbe &&
  result.terminalAfterProbe.caption === "entrance_roadtrip_camp_attended_time",
  "the real Camping terminal rejects incidental captions",
  { accepted: result && result.terminalIncidentalAccepted, after: result && result.terminalAfterProbe });
check(result && result.congrats && result.congrats.mamaFinLook &&
  result.congrats.mamaHeadAnimation === "entrance-roadtrip-camp-bear-fin-look" &&
  result.congrats.mamaHeadDelay === "3s" &&
  (result.congrats.mamaHeadTransform === "none" || result.congrats.mamaHeadTransform === "matrix(1, 0, 0, 1, 0, 0)") &&
  result.congratsBearLook && result.congratsBearLook.mamaFinLook,
  "three seconds after the finale cue, the visible mama bear gives a clear head look",
  { before: result && result.congrats, look: result && result.congratsBearLook });
check(result && result.congrats &&
  result.congrats.cubAnimation === "entrance-roadtrip-camp-cub-rejoin" &&
  result.congrats.cubDelay === "4.25s" && result.congratsBearLook && result.congratsBearLook.mamaFinLook,
  "the cub waits for mama's look, then bounds across to rejoin her",
  { before: result && result.congrats, after: result && result.congratsBearLook });
check(result && result.attendedCaption &&
  result.attendedCaption.caption === "entrance_roadtrip_camp_attended_time" &&
  /^Wow, what a lofly day! 1 minute in loft\. Tell us your time in your RSVP\.$/.test(result.attendedCaption.captionText) &&
  result.czechAttendedCaption === "Páni, to byl ale loftový den! 1 minuta v loftu. Napište nám svůj čas do RSVP.",
  "the combined terminal caption stays stable after the bear and cub finish",
  { en: result && result.attendedCaption, cs: result && result.czechAttendedCaption });
check(result && result.congratsReload && result.congratsReload.phase === "congrats" &&
  result.congratsReload.mamaFinLook && result.congratsReload.mamaHeadDelay === "3s" &&
  result.congratsReload.cubAnimation === "entrance-roadtrip-camp-cub-rejoin" &&
  result.congratsReload.cubDelay === "4.25s" &&
  result.congratsSounds.join("|") === "embers|approach|collect|finale",
  "reloading the terminal fin page re-arms the bear look without replaying its audio",
  result && result.congratsReload);
check(result && result.congrats && result.congrats.darknessPointer === "all" && result.completeClickTarget &&
  result.completeAfterClick && result.completeAfterClick.phase === "congrats" &&
  !result.completeAfterClick.fireBuilderOpen,
  "the completed dark campsite absorbs stray clicks without reopening a dead builder",
  { target: result && result.completeClickTarget, after: result && result.completeAfterClick });
check(result && result.czechWarning === "Nikdy nenechávejte přes noc jídlo venku." &&
  /^Páni, to byl ale loftový den!.*RSVP\.$/.test(result.czechCongrats || ""),
  "both the warning and restored congratulations switch to Czech",
  { warning: result && result.czechWarning, congrats: result && result.czechCongrats });
check(result && result.completeExit && !result.completeExit.campActive && result.fresh &&
  result.fresh.campActive && result.fresh.phase === "idle" && !result.fresh.fireBuilt &&
  !result.fresh.fireLit && !result.fresh.stew && result.fresh.savedPhase === "idle" &&
  result.fresh.cameraAnimation === "none" && result.fresh.cameraOffset === 0 && result.fresh.finOpacity === 0 &&
  result.fresh.mamaLayer === "entrance-roadtrip-camp" && !result.fresh.mamaAboveFireRing &&
  Object.keys(result.fresh.progress || {}).every(function (name) { return result.fresh.progress[name] === 0; }),
  "leaving after completion makes the next Camping visit fresh", { exit: result && result.completeExit, fresh: result && result.fresh });

var reduced = lib.runPageSync("loft-day.html", REDUCED_HARNESS, 1800, {
  forceReduce: true,
  urlSuffix: "?date=2026-07-15&time=23:00",
  chromeFlags: "--force-prefers-reduced-motion=reduce --window-size=1180,900"
});
check(reduced && reduced.errors.length === 0 && reduced.warning && reduced.warning.reduced &&
  reduced.warning.phase === "complete" && reduced.warning.animation === "none" &&
  reduced.warning.offset === 120 && reduced.warning.finOpacity === 0 &&
  reduced.congrats && reduced.congrats.phase === "congrats" && reduced.congrats.offset === 120 &&
  reduced.congrats.finOpacity === .9 && reduced.congrats.finText === "~ fin ~" &&
  reduced.congrats.finAnimation === "none" && reduced.congrats.finTransform === "none",
  "reduced motion snaps to the safe sky composition while fin still waits for congratulations",
  reduced);

var finMotion = lib.runPageSync("loft-day.html", FIN_MOTION_HARNESS, 800, {
  urlSuffix: "?date=2026-07-15&time=23:00",
  chromeFlags: "--window-size=1180,900"
});
check(finMotion && finMotion.errors.length === 0 && finMotion.normal &&
  finMotion.normal.animation === "entrance-roadtrip-camp-finale-fin-breath" &&
  finMotion.normal.duration === "10s" && finMotion.normal.direction === "normal" &&
  finMotion.normal.fontSize === "37px" &&
  finMotion.normal.iterations === "1" && finMotion.normal.timing === "ease-in-out" &&
  finMotion.normal.opacity >= .84 && finMotion.normal.opacity <= 1 &&
  finMotion.normal.transform !== "none" && finMotion.normal.transformBox === "fill-box" &&
  finMotion.low && finMotion.low.animation === "none" && finMotion.low.opacity === 1 &&
  finMotion.low.transform === "none",
  "the warm-white fin breathes three times, settles after ten seconds, and rests under the low-frame-rate fallback",
  finMotion);

if (failures) process.exit(1);
console.log("Campsite sleep-finale assertions passed.");
