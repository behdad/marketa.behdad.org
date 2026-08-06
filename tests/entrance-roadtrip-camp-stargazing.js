#!/usr/bin/env node
// Served stew unlocks a clear-night, checkpointed three-constellation finale.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");
var source = fs.readFileSync(path.join(lib.ROOT, "rsvp.html"), "utf8");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<style>
#entrance-roadtrip-stargazing-game *,#entrance-roadtrip-camp-finale-constellations,#entrance-roadtrip-camp-wisdom{transition:none!important}
#entrance-roadtrip-camp-wisdom.show .entrance-roadtrip-camp-wisdom-bubble{animation:none!important;opacity:1!important}
</style>
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
    var live = document.getElementById("entrance-roadtrip-camp-finale-constellations");
    var wisdom = document.getElementById("entrance-roadtrip-camp-wisdom");
    var sky = document.getElementById("entrance-roadtrip-camp-sky-hit");
    var outer = document.getElementById("entrance-roadtrip-dismiss");
    var moon = document.getElementById("entrance-roadtrip-camp-moon");
    var room = document.getElementById("entrance-room");
    var roadtrip = window.__captureCheckpointSystems().entrance.drive.roadtrip;
    return {
      state: window.__entranceRoadtripCampStargazingState(),
      openClass: game.classList.contains("open"),
      completeClass: game.classList.contains("complete"),
      sunsetClass: document.getElementById("entrance-roadtrip-camp").classList.contains("stargazing-sunset"),
      clearClass: document.getElementById("entrance-room").classList.contains("camp-stargazing-clear"),
      dusk: document.getElementById("stage-balcony").classList.contains("dusk"),
      skyPointer: getComputedStyle(sky).pointerEvents,
      skyCursor: getComputedStyle(sky).cursor,
      outerDismiss: getComputedStyle(outer).display,
      campActive: room.classList.contains("roadtrip-active") && room.classList.contains("roadtrip-route-camp"),
      caption: window.__captionKey && window.__captionKey(),
      constellations: game.querySelectorAll("[data-stargazing-constellation]").length,
      stars: game.querySelectorAll("[data-stargazing-star]").length,
      minHit: Math.min.apply(null, Array.prototype.map.call(game.querySelectorAll(".entrance-roadtrip-stargazing-star-hit"), function (node) {
        return Number(node.getAttribute("r"));
      })),
      liveOpacity: Number(getComputedStyle(live).opacity),
      liveConstellations: live.querySelectorAll("[data-live-stargazing-constellation]").length,
      moonAfterConstellations: !!(live.compareDocumentPosition(moon) & Node.DOCUMENT_POSITION_FOLLOWING),
      wisdomShown: wisdom.classList.contains("show"),
      wisdomBubbles: wisdom.querySelectorAll(".entrance-roadtrip-camp-wisdom-bubble").length,
      wisdomSpeakers: wisdom.querySelectorAll(".entrance-roadtrip-camp-wisdom-speaker").length,
      wisdomClose: !!document.getElementById("entrance-roadtrip-camp-wisdom-close"),
      wisdomShapes: Array.prototype.map.call(wisdom.querySelectorAll(".entrance-roadtrip-camp-wisdom-bubble"), function (bubble) {
        var path = bubble.querySelector("path.entrance-roadtrip-camp-wisdom-shape");
        var box = path && path.getBBox();
        return {
          paths: bubble.querySelectorAll("path.entrance-roadtrip-camp-wisdom-shape").length,
          rects: bubble.querySelectorAll("rect.entrance-roadtrip-camp-wisdom-shape").length,
          stroke: path && getComputedStyle(path).stroke,
          x: box && Math.round(box.x),
          width: box && Math.round(box.width)
        };
      }),
      wisdomText: wisdom.textContent.replace(/\s+/g, " ").trim(),
      fireBuilt: roadtrip.campFireBuilt,
      fireLit: roadtrip.campFireLit,
      pinecones: roadtrip.campPinecones,
      stew: roadtrip.stew
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
        var dinnerCheckpoint = window.__captureCheckpointSystems().entrance;
        dinnerCheckpoint.drive.roadtrip.campFireBuilt = true;
        dinnerCheckpoint.drive.roadtrip.campFireLit = true;
        dinnerCheckpoint.drive.roadtrip.campActive = true;
        dinnerCheckpoint.drive.roadtrip.stew = {
          protein: "beef", starch: "barley", status: "served", elapsed: 11600
        };
        window.__restoreCheckpointSystems({ entrance: dinnerCheckpoint }, "afterStage");
        setTimeout(function () {
          try {
            report.ready = snap();
            window.__setDayNight(false);
            setTimeout(function () {
              try {
                window.overcast(true);
                if (window.__applyBalconyWeather) window.__applyBalconyWeather();
                click(document.getElementById("entrance-roadtrip-camp-sky-hit"));
                report.dayOpen = snap().state.sunsetting ? "sunset" : false;
                report.sunset = snap();
                setTimeout(function () {
                  try {
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
                          builderNames: Array.prototype.map.call(document.querySelectorAll('#entrance-roadtrip-stargazing-game [data-i^="entrance_roadtrip_stargazing_ursa"],#entrance-roadtrip-stargazing-game [data-i="entrance_roadtrip_stargazing_cassiopeia"]'), function (node) { return node.textContent; }),
                          liveNames: document.querySelectorAll('#entrance-roadtrip-camp-finale-constellations text').length,
                          wisdom: document.getElementById("entrance-roadtrip-camp-wisdom").textContent.replace(/\s+/g, " ").trim()
                        };
                        window.setLang("en");
                        click(document.getElementById("entrance-roadtrip-camp-wisdom"));
                        report.dismissed = snap();
                        window.__restoreCheckpointSystems({ entrance: completeCheckpoint }, "afterStage");
                        setTimeout(function () {
                          try {
                            report.completeRestored = snap();
                            click(document.getElementById("entrance-roadtrip-dismiss"));
                            report.exited = snap();
                            click(document.querySelector('[data-roadtrip-reentry-choice="camp"]'));
                            report.preservedArrival = snap();
                            window.overcast(false); clearNight();
                          } catch (error) { report.errors.push(String(error && error.stack || error)); }
                          finish();
                        }, 180);
                      } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
                    }, 180);
                  } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
                }, 1750);
              } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
            }, 60);
          } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
        }, 180);
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

console.log("rsvp.html campsite stargazing:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3600, {
  forceReduce: true,
  urlSuffix: "?date=2026-07-15&time=23:00#play",
  chromeFlags: "--window-size=1180,900"
});
check(result && result.errors.length === 0, "the finale has no uncaught errors", result && result.errors);
check(result && result.beforeStew && !result.beforeStew.state.eligible && result.beforeStew.skyPointer === "none",
  "the sky remains scenery before dinner is served", result && result.beforeStew);
check(result && result.ready && result.ready.state.eligible && result.ready.skyPointer === "all" &&
  result.ready.skyCursor === "pointer",
  "served stew unlocks the sky with the standard pointing-hand cursor", result && result.ready);
check(result && result.dayOpen === "sunset" && result.sunset && result.sunset.state.sunsetting &&
  result.sunset.sunsetClass && result.sunset.clearClass && result.sunset.dusk &&
  result.sunset.caption === "entrance_roadtrip_stargazing_invite",
  "clicking the live sky starts sunset, clears camp weather, and summons night", result && result.sunset);
check(result && result.open && result.open.openClass && result.open.outerDismiss === "none" &&
  !result.open.state.sunsetting && result.open.clearClass && result.open.dusk &&
  result.open.constellations === 3 && result.open.stars === 19 && result.open.minHit >= 14,
  "sunset resolves into the clear overlay with three forgiving traces and no outer dismiss",
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
check(result && result.complete && result.complete.state.complete && !result.complete.state.open &&
  !result.complete.openClass && result.complete.liveOpacity === 1 &&
  result.complete.skyPointer === "none" &&
  result.complete.liveConstellations === 3 && result.complete.moonAfterConstellations && result.complete.wisdomShown &&
  result.complete.wisdomBubbles === 4 && result.complete.wisdomSpeakers === 0 &&
  !result.complete.wisdomClose &&
  result.complete.wisdomShapes.every(function (shape) {
    return shape.paths === 1 && shape.rects === 0 && shape.width <= 215;
  }) &&
  result.complete.wisdomShapes.map(function (shape) { return shape.stroke; }).join("|") ===
    "rgb(217, 166, 166)|rgb(127, 158, 192)|rgb(217, 166, 166)|rgb(127, 158, 192)" &&
  result.complete.wisdomShapes[0].x >= 460 && result.complete.wisdomShapes[1].x <= 20 &&
  result.complete.wisdomShapes[2].x >= 485 && result.complete.wisdomShapes[3].x <= 15 &&
  result.complete.wisdomText.indexOf("Until that ends as well.") >= 0 &&
  result.complete.wisdomText.indexOf("When something is over,") >= 0 &&
  result.complete.wisdomText.indexOf("something else begins") >= 0 &&
  result.complete.wisdomText.indexOf("—ad infinitum.") >= 0,
  "finishing returns to the live sky with four edge-set, speaker-colored path bubbles",
  result && result.complete);
check(/camp-wisdom-bubble:nth-child\(2\)\{animation-delay:1s\}/.test(source) &&
  /camp-wisdom-bubble:nth-child\(3\)\{animation-delay:2s\}/.test(source) &&
  /camp-wisdom-bubble:nth-child\(4\)\{animation-delay:3s\}/.test(source),
  "the four exchange bubbles reveal one second apart");
check(result && result.czech && result.czech.title === "Pozorování hvězd" &&
  result.czech.builderNames.join("|") === "Kasiopeja|Velká medvědice|Malá medvědice" &&
  result.czech.liveNames === 0 &&
  result.czech.wisdom.indexOf("Když něco skončí,") >= 0 &&
  result.czech.wisdom.indexOf("něco jiného začne") >= 0,
  "builder labels switch to Czech while the permanent sky stays unlabeled", result && result.czech);
check(result && result.dismissed && result.dismissed.state.wisdomDismissed && !result.dismissed.wisdomShown &&
  result.dismissed.state.sleepPhase === "prompt" &&
  result.dismissed.caption === "entrance_roadtrip_camp_sleep_prompt" && result.dismissed.outerDismiss === "grid",
  "clicking the conversation dismisses it and suggests putting out the fire", result && result.dismissed);
check(result && result.completeRestored && result.completeRestored.state.complete &&
  !result.completeRestored.state.wisdomDismissed && result.completeRestored.wisdomShown &&
  result.completeRestored.state.sleepPhase === "idle" &&
  result.completeRestored.caption === "entrance_roadtrip_stargazing_title",
  "checkpoint restore returns the undismissed live-sky conversation without a stale invitation",
  result && result.completeRestored);
check(result && result.exited && !result.exited.campActive,
  "the standard campsite exit returns to the Road Trip controls", result && result.exited);
check(result && result.preservedArrival && result.preservedArrival.state.complete &&
  result.preservedArrival.wisdomShown && result.preservedArrival.fireBuilt && result.preservedArrival.fireLit &&
  result.preservedArrival.stew && result.preservedArrival.stew.status === "served",
  "leaving before the curtain call preserves the finished stargazing campsite", result && result.preservedArrival);

if (failures) process.exit(1);
console.log("Campsite stargazing assertions passed.");
