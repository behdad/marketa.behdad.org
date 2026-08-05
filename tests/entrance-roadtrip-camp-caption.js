#!/usr/bin/env node
// Camping owns its RSVP reminder until the visitor leaves the scene.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function snapshot() {
    var caption = document.getElementById("hunt-caption");
    return {
      key: window.__captionKey && window.__captionKey(),
      text: caption && caption.textContent,
      blinking: !!(caption && caption.classList.contains("hint-blink")),
      route: window.__entranceRoomState().drive.roadtrip.route
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripStart();
        window.__entranceRoadtripSetRoute("camp", 0);
        setTimeout(function () {
          try {
            report.arrival = snapshot();
            setLang("cs");
            report.czech = snapshot();
            setLang("en");
            report.afterLanguageRoundTrip = snapshot();
            setTimeout(function () {
              report.steady = snapshot();
              document.dispatchEvent(new KeyboardEvent("keydown", {
                key: "Escape", code: "Escape", bubbles: true, cancelable: true
              }));
              report.afterExit = snapshot();
              report.errors = (window.__errs || []).concat(report.errors);
              document.getElementById("__report").textContent = JSON.stringify(report);
            }, 2400);
          } catch (error) {
            report.errors.push(String(error && error.stack || error));
            document.getElementById("__report").textContent = JSON.stringify(report);
          }
        }, 1100);
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
        document.getElementById("__report").textContent = JSON.stringify(report);
      }
    }, 260);
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

console.log("rsvp.html Camping RSVP caption:");
var result = lib.runPageSync("rsvp.html", HARNESS, 5000, {
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the caption lifecycle has no uncaught errors",
  result && result.errors);

var arrival = result && result.arrival || {};
check(arrival.route === "camp" && arrival.key === "entrance_roadtrip_camp_arrival" &&
  arrival.text === "Congrats! You reached the end of the game. Now go do your RSVP!" && arrival.blinking,
  "Camping owns the persistent English RSVP reminder", arrival);

var czech = result && result.czech || {};
check(czech.key === "entrance_roadtrip_camp_arrival" &&
  czech.text === "Gratulujeme! Dojeli jste na konec hry. Teď běžte vyplnit RSVP!",
  "the persistent reminder follows a Czech language switch", czech);

var afterLanguageRoundTrip = result && result.afterLanguageRoundTrip || {};
check(afterLanguageRoundTrip.route === "camp" &&
  afterLanguageRoundTrip.key === "entrance_roadtrip_camp_arrival" &&
  afterLanguageRoundTrip.text === "Congrats! You reached the end of the game. Now go do your RSVP!" &&
  afterLanguageRoundTrip.blinking,
  "the reminder remains keyed after caption re-rendering", afterLanguageRoundTrip);

var steady = result && result.steady || {};
check(steady.route === "camp" && steady.key === "entrance_roadtrip_camp_arrival" &&
  steady.text === "Congrats! You reached the end of the game. Now go do your RSVP!" && !steady.blinking,
  "the same reminder becomes steady without disappearing", steady);

var afterExit = result && result.afterExit || {};
check(afterExit.key !== "entrance_roadtrip_camp_arrival" && !afterExit.blinking,
  "leaving Camping retires its reminder animation", afterExit);

if (failures) process.exit(1);
console.log("Camping RSVP caption checks passed.");
