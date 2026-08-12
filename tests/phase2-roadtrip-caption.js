#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function snap(name) {
    report.steps[name] = {
      text: document.getElementById("hunt-caption").textContent.trim(),
      key: window.__captionKey(),
      caption: window.__captionState(),
      departure: window.__roadtripDepartureCaptionState(),
      seen: window.__seenRooms().slice(),
      phase2: !!window.__secondRound,
      party: !!window.__gardenPartyOn,
      act: window.__actBeat && window.__actBeat()
    };
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.__endAttract();
        if (window.__finishOpeningGuide) window.__finishOpeningGuide();
        if (window.__removeClickMe) window.__removeClickMe();
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom"]);
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        if (window.__armActTwo) window.__armActTwo(true);
        snap("phase-one-complete");
        window.__setPartyMode(true);
        await sleep(100);
        snap("party-reveal");
        await sleep(5400);
        snap("after-reveal");
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 9000, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?fresh=phase2-roadtrip-caption",
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail))); }
}
function step(name) { return result && result.steps && result.steps[name]; }
var exact = "Who wants to go on a Road Trip? Head out to the car.";

console.log("loft-day.html phase-two Road Trip caption handoff:");
check(result && result.errors.length === 0, "the real Party transition has no page errors", result && result.errors);
check(step("phase-one-complete") && !step("phase-one-complete").phase2 &&
  step("phase-one-complete").seen.length === 10 && step("phase-one-complete").text !== exact,
  "ten rooms completed in phase one retain the phase-one clue", step("phase-one-complete"));
check(step("party-reveal") && step("party-reveal").phase2 && step("party-reveal").party &&
  step("party-reveal").departure.pending,
  "Party start arms the already-earned departure caption beneath its authored reveal", step("party-reveal"));
check(step("after-reveal") && step("after-reveal").text === exact &&
  step("after-reveal").key === "roadtrip_departure_caption" &&
  step("after-reveal").caption.base.owner === "roadtrip-departure" &&
  step("after-reveal").departure.pending,
  "the departure invitation owns the caption after the Party reveal yields", step("after-reveal"));

if (failures) process.exit(1);
console.log("Phase-two Road Trip caption assertions passed.");
