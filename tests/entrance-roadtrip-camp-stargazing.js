#!/usr/bin/env node
// Served stew unlocks a clear-night, checkpointed three-constellation finale.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<style>#entrance-roadtrip-stargazing-game *{transition:none!important}</style>
<script>
(function () {
  var report = { errors: [] };
  function click(node) {
    if (!node) return false;
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  }
  function clearNight() {
    window.storm(false); window.rain(false); window.snow(false); window.overcast(false);
    if (window.__applyBalconyWeather) window.__applyBalconyWeather();
    window.__setDayNight(true);
  }
  function trace(name, from) {
    var figure = document.querySelector('[data-stargazing-constellation="' + name + '"]');
    Array.prototype.slice.call(figure.querySelectorAll("[data-stargazing-star]"), from || 0)
      .forEach(click);
  }
  function snap() {
    var game = document.getElementById("entrance-roadtrip-stargazing-game");
    var sky = document.getElementById("entrance-roadtrip-camp-sky-hit");
    var outer = document.getElementById("entrance-roadtrip-dismiss");
    return {
      state: window.__entranceRoadtripCampStargazingState(),
      openClass: game.classList.contains("open"),
      completeClass: game.classList.contains("complete"),
      skyPointer: getComputedStyle(sky).pointerEvents,
      outerDismiss: getComputedStyle(outer).display,
      caption: window.__captionKey && window.__captionKey(),
      constellations: game.querySelectorAll("[data-stargazing-constellation]").length,
      stars: game.querySelectorAll("[data-stargazing-star]").length,
      minHit: Math.min.apply(null, Array.prototype.map.call(game.querySelectorAll(".entrance-roadtrip-stargazing-star-hit"), function (node) {
        return Number(node.getAttribute("r"));
      })),
      auroraOpacity: Number(getComputedStyle(game.querySelector(".entrance-roadtrip-stargazing-aurora")).opacity),
      finale: game.querySelector('[data-i="entrance_roadtrip_stargazing_finale"]').textContent
    };
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
        clearNight();
        report.beforeStew = snap();
        window.__entranceRoadtripCampFireStart();
        window.__entranceRoadtripCampFirePlace("tinder");
        window.__entranceRoadtripCampFirePlace("twigs");
        window.__entranceRoadtripCampFirePlace("teepee");
        window.__entranceRoadtripCampFireLight();
        setTimeout(function () {
          try {
            window.__entranceRoadtripCampStewOpen();
            window.__entranceRoadtripCampStewSelect("beef");
            window.__entranceRoadtripCampStewSelect("barley");
            window.__entranceRoadtripCampStewCook();
            window.__entranceRoadtripCampStewStep(11600);
            window.__entranceRoadtripCampStewServe();
            clearNight();
            report.ready = snap();

            window.__setDayNight(false);
            report.dayOpen = window.__entranceRoadtripCampStargazingOpen();
            clearNight();
            window.overcast(true); window.__setDayNight(true);
            report.cloudOpen = window.__entranceRoadtripCampStargazingOpen();
            window.overcast(false); clearNight();

            click(document.getElementById("entrance-roadtrip-camp-sky-hit"));
            report.open = snap();
            click(document.querySelector('[data-stargazing-constellation="cassiopeia"] [data-stargazing-star="2"]'));
            report.wrongOrder = snap().state.progress.cassiopeia;
            trace("cassiopeia");
            trace("ursa-major", 0);
            report.partial = snap();
            var partialCheckpoint = window.__captureCheckpointSystems().entrance;
            report.partialSaved = partialCheckpoint.drive.roadtrip.stargazing;
            window.__restoreCheckpointSystems({ entrance: partialCheckpoint }, "afterStage");
            setTimeout(function () {
              try {
                report.partialRestored = snap();
                window.__entranceRoadtripCampStargazingOpen();
                trace("ursa-minor");
                report.complete = snap();
                var completeCheckpoint = window.__captureCheckpointSystems().entrance;
                window.setLang("cs");
                report.czech = {
                  title: document.querySelector('[data-i="entrance_roadtrip_stargazing_title"]').textContent,
                  names: Array.prototype.map.call(document.querySelectorAll('[data-i^="entrance_roadtrip_stargazing_ursa"],[data-i="entrance_roadtrip_stargazing_cassiopeia"]'), function (node) { return node.textContent; }),
                  finale: document.querySelector('[data-i="entrance_roadtrip_stargazing_finale"]').textContent
                };
                window.setLang("en");
                click(document.getElementById("entrance-roadtrip-stargazing-close"));
                report.closed = snap();
                window.__restoreCheckpointSystems({ entrance: completeCheckpoint }, "afterStage");
                setTimeout(function () {
                  try {
                    report.completeRestored = snap();
                    window.__entranceRoadtripSetRoute("abraham", 0);
                    window.__entranceRoadtripSetRoute("camp", 0);
                    report.freshArrival = snap();
                  } catch (error) { report.errors.push(String(error && error.stack || error)); }
                  finish();
                }, 180);
              } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
            }, 180);
          } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
        }, 1750);
      } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
    }, 1000);
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

console.log("rsvp.html campsite stargazing:");
var result = lib.runPageSync("rsvp.html", HARNESS, 5600, {
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=23:00#play",
  chromeFlags: "--window-size=1180,900"
});
check(result && result.errors.length === 0, "the finale has no uncaught errors", result && result.errors);
check(result && result.beforeStew && !result.beforeStew.state.eligible && result.beforeStew.skyPointer === "none",
  "the sky remains scenery before dinner is served", result && result.beforeStew);
check(result && result.ready && result.ready.state.eligible && result.ready.skyPointer === "all",
  "served stew under a clear night unlocks the sky", result && result.ready);
check(result && result.dayOpen === false && result.cloudOpen === false,
  "daylight and cloud both gate stargazing", result && { day: result.dayOpen, cloud: result.cloudOpen });
check(result && result.open && result.open.openClass && result.open.outerDismiss === "none" &&
  result.open.constellations === 3 && result.open.stars === 19 && result.open.minHit >= 14,
  "the clean overlay has exactly three forgiving constellation traces and hides the outer dismiss",
  result && result.open);
check(result && result.wrongOrder === 0, "out-of-order stars do not skip the guided trace", result && result.wrongOrder);
check(result && result.partial && result.partial.state.completed.indexOf("cassiopeia") >= 0 &&
  result.partial.state.completed.indexOf("ursa-major") >= 0 && !result.partial.state.complete,
  "Cassiopeia and Ursa Major can be completed independently", result && result.partial);
check(result && result.partialSaved && result.partialSaved.progress.cassiopeia === 5 &&
  result.partialSaved.progress["ursa-major"] === 7 && result.partialSaved.progress["ursa-minor"] === 0,
  "checkpoint capture records exact trace progress", result && result.partialSaved);
check(result && result.partialRestored && !result.partialRestored.state.open &&
  result.partialRestored.state.progress.cassiopeia === 5 && result.partialRestored.state.progress["ursa-major"] === 7,
  "Continue restores progress with the popup closed", result && result.partialRestored);
check(result && result.complete && result.complete.state.complete && result.complete.completeClass &&
  result.complete.auroraOpacity > .5 &&
  result.complete.finale === "They say all good things end—but this is just the beginning…",
  "all three constellations reveal the aurora and Behdad’s exact finale", result && result.complete);
check(result && result.czech && result.czech.title === "Pozorování hvězd" &&
  result.czech.names.join("|") === "Kasiopeja|Velká medvědice|Malá medvědice" &&
  result.czech.finale.indexOf("tohle je teprve začátek") >= 0,
  "the stargazing view and finale switch to Czech", result && result.czech);
check(result && result.closed && !result.closed.state.open && result.closed.caption === "entrance_roadtrip_camp_arrival" &&
  result.closed.outerDismiss === "grid",
  "closing restores the permanent RSVP caption and camp dismiss", result && result.closed);
check(result && result.completeRestored && result.completeRestored.state.complete && !result.completeRestored.state.open,
  "a completed finale persists while its popup remains transient", result && result.completeRestored);
check(result && result.freshArrival && !result.freshArrival.state.complete &&
  Object.keys(result.freshArrival.state.progress).every(function (name) { return result.freshArrival.state.progress[name] === 0; }),
  "a genuinely fresh Camping arrival resets stargazing", result && result.freshArrival);

if (failures) process.exit(1);
console.log("Campsite stargazing assertions passed.");
