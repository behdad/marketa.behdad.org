#!/usr/bin/env node
// The solved Camping sky borrows the Garden aurora engine without keeping it alive off-stage.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

function setupScript(body) {
  return String.raw`<style>*{transition:none!important}</style>
<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function signature() {
    return document.querySelector("#entrance-roadtrip-camp-aurora .ac1").getAttribute("d");
  }
  function snapshot() {
    var aurora = document.getElementById("entrance-roadtrip-camp-aurora");
    var paths = aurora.querySelectorAll(".aurora-curtain");
    var xValues = Array.from(signature().matchAll(/[ML](-?\d+(?:\.\d+)?)\s/g),
      function (match) { return Number(match[1]); });
    return {
      state: window.__campAuroraState(),
      raf: window.__gardenAuroraRaf(),
      opacity: Number(getComputedStyle(aurora).opacity),
      paths: paths.length,
      segments: (signature().match(/ L/g) || []).length,
      stops: Array.prototype.map.call(aurora.querySelectorAll("stop"), function (stop) {
        return Number(stop.getAttribute("stop-opacity"));
      }),
      signature: signature(),
      bounds: { minX: Math.min.apply(Math, xValues), maxX: Math.max.apply(Math, xValues) },
      campActive: document.getElementById("entrance-room").classList.contains("roadtrip-active"),
      clouded: document.getElementById("entrance-room").classList.contains("entrance-clouded"),
      localClear: document.getElementById("entrance-room").classList.contains("camp-stargazing-clear"),
      cloudWash: Number(getComputedStyle(document.querySelector(".entrance-cloud-wash")).opacity),
      sleep: window.__entranceRoadtripCampSleepState().phase
    };
  }
  async function prepare() {
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.goToStage("balcony");
    await wait(140);
    window.__openEntranceRoom();
    document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
    window.__openEntrancePorscheDriveHud();
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("camp", 0);
    window.__setAurora(false);
    window.__setDayNight(true);
    await wait(80);
    report.before = snapshot();
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
      wisdomDismissed: true,
      wisdomHandoffReady: true,
      sleepPhase: "prompt"
    };
    window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
    // Camping deliberately clears its own visible sky without erasing the shared weather
    // override. Reapply the night after overcast(), whose normal console contract selects day.
    window.overcast(true);
    if (window.__applyBalconyWeather) window.__applyBalconyWeather();
    window.__setDayNight(true);
    await wait(120);
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        await prepare();
        ${body}
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 180);
  });
})();
</script>`;
}

var FULL = setupScript(String.raw`
        report.liveA = snapshot();
        await wait(140);
        report.liveB = snapshot();

        window.__campAuroraTestFocus = false;
        window.dispatchEvent(new Event("blur"));
        await wait(60);
        report.blurredA = snapshot();
        await wait(120);
        report.blurredB = snapshot();

        window.__campAuroraTestFocus = true;
        window.dispatchEvent(new Event("focus"));
        await wait(100);
        report.refocused = snapshot();

        window.__campAuroraTestHidden = true;
        document.dispatchEvent(new Event("visibilitychange"));
        await wait(60);
        report.hidden = snapshot();

        window.__campAuroraTestHidden = false;
        document.dispatchEvent(new Event("visibilitychange"));
        await wait(100);
        report.visible = snapshot();

        window.__entranceRoadtripCampSleepStart();
        await wait(80);
        report.sleep = snapshot();
`);

var REDUCED = setupScript(String.raw`
        report.stillA = snapshot();
        await wait(180);
        report.stillB = snapshot();
`);

var failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + label + (!ok && detail != null ? "   [" + JSON.stringify(detail) + "]" : ""));
  if (!ok) failures++;
}

console.log("rsvp.html Camping algorithmic aurora:");
var source = fs.readFileSync(path.join(lib.ROOT, "rsvp.html"), "utf8");
var auroraAt = source.indexOf('id="entrance-roadtrip-camp-aurora"');
var constellationAt = source.indexOf('id="entrance-roadtrip-camp-finale-cassiopeia"');
var block = source.slice(auroraAt, constellationAt);
check(auroraAt >= 0 && constellationAt > auroraAt &&
  (block.match(/class="aurora-curtain ac[123]"/g) || []).length === 3 &&
  (block.match(/id="entrance-roadtrip-camp-aurora-grad-[123]"/g) || []).length === 3 &&
  (block.match(/class="ag-top"/g) || []).length === 3,
  "the solved sky paints three native-SVG gradient curtains before its draggable stars");
check(/var CAMP_CURTAINS = \[[\s\S]*kind: "camp"[\s\S]*minKp: 6\.2/.test(source),
  "the shared Garden engine owns a strong Camping story target");
check(/camp-sleep-fire-out/.test(source.slice(source.indexOf("function targetShown"), source.indexOf("function shouldRun"))) &&
  /campAuroraObserver\.observe\(campTarget\.stage/.test(source),
  "the engine follows campsite lifecycle classes and stops at fire-out");
check(!/<(?:canvas|foreignObject)[^>]*id="entrance-roadtrip-camp-aurora"/.test(source),
  "the aurora avoids replaced/foreignObject rendering paths");

var focusHook = String.raw`<script>
window.__campAuroraTestFocus=true;
window.__campAuroraTestHidden=false;
document.hasFocus=function(){return window.__campAuroraTestFocus;};
try{Object.defineProperty(document,"hidden",{configurable:true,get:function(){return window.__campAuroraTestHidden;}});}catch(e){}
</script>`;
FULL = focusHook + FULL;
var full = lib.runPageSync("rsvp.html", FULL, 2600, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-09-23&time=23:30#play",
  chromeFlags: "--window-size=1180,900"
});
check(full && full.errors.length === 0, "full-motion lifecycle raises no page errors", full && full.errors);
check(full && full.before && !full.before.state.showing && !full.before.raf && full.before.opacity === 0,
  "the aurora stays absent before stargazing is complete", full && full.before);
check(full && full.liveA && full.liveA.state.showing && full.liveA.state.running && full.liveA.raf &&
  full.liveA.paths === 3 && full.liveA.segments >= 60 && full.liveA.opacity >= .85 &&
  full.liveA.bounds.minX <= 0 && full.liveA.bounds.maxX >= 680 &&
  full.liveA.clouded && full.liveA.localClear && full.liveA.cloudWash === 0 &&
  full.liveA.stops.some(function (value) { return value > .5; }),
  "completion reveals a dense strong display without rewriting the locally cleared weather state", full && full.liveA);
check(full && full.liveA.signature !== full.liveB.signature,
  "the solved sky evolves algorithmically frame to frame");
check(full && full.blurredA && !full.blurredA.raf && !full.blurredA.state.running &&
  full.blurredA.signature === full.blurredB.signature,
  "blur cancels the shared loop and freezes its last frame", { a: full && full.blurredA, b: full && full.blurredB });
check(full && full.refocused && full.refocused.raf && full.refocused.state.running &&
  full.refocused.signature !== full.blurredB.signature,
  "focus resumes the Camping curtains from their held phase", full && full.refocused);
check(full && full.hidden && !full.hidden.raf && !full.hidden.state.running &&
  full.visible && full.visible.raf && full.visible.state.running,
  "visibility loss stops the loop and visibility return restarts it", { hidden: full && full.hidden, visible: full && full.visible });
check(full && full.sleep && full.sleep.sleep === "fire-out" && !full.sleep.state.showing &&
  !full.sleep.state.running && !full.sleep.raf,
  "starting the existing sleep finale freezes the aurora as the solved sky recedes", full && full.sleep);

var reduced = lib.runPageSync("rsvp.html", REDUCED, 2100, {
  forceReduce: true,
  urlSuffix: "?date=2026-09-23&time=23:30#play",
  chromeFlags: "--window-size=390,844"
});
check(reduced && reduced.errors.length === 0, "reduced-motion lifecycle raises no page errors", reduced && reduced.errors);
check(reduced && reduced.stillA && reduced.stillA.state.showing && reduced.stillA.state.reducedMotion &&
  !reduced.stillA.raf && reduced.stillA.segments >= 60 && reduced.stillA.signature === reduced.stillB.signature,
  "reduced motion paints one detailed still curtain frame without scheduling rAF",
  { a: reduced && reduced.stillA, b: reduced && reduced.stillB });

if (failures) process.exit(1);
console.log("Camping algorithmic-aurora assertions passed.");
