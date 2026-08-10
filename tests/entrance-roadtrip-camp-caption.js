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
      route: window.__entranceRoomState().drive.roadtrip.route,
      resumePending: window.__entranceRoomState().drive.roadtrip.resumePending,
      entranceOpen: window.__entranceRoomState().open,
      downstairs: window.__floorNavigationState().actual,
      tetrisActive: window.__balconyTetrisState().active,
      captionVisibility: caption && getComputedStyle(caption).visibility,
      pauseDialog: getComputedStyle(document.getElementById("entrance-roadtrip-pause-dialog")).display
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.__setSecondRound(true, { releaseHeld: false });
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);
        setTimeout(function () {
          try {
            report.arrival = snapshot();
            report.arrivalIncidentalAccepted = !!window.__captionOverlay("entrance_roadtrip_heart", {
              owner: "camp-real-probe", scope: "lower:entrance", priority: 20, duration: 1000
            });
            report.arrivalAfterProbe = snapshot();
            setLang("cs");
            report.czech = snapshot();
            setLang("en");
            report.afterLanguageRoundTrip = snapshot();
            window.__entranceRoadtripCampFireStart();
            window.__entranceRoadtripCampFirePlace("tinder");
            window.__entranceRoadtripCampFirePlace("twigs");
            window.__entranceRoadtripCampFirePlace("stack");
            window.__entranceRoadtripCampFireLight();
            setTimeout(function () {
              report.completed = snapshot();
              setTimeout(function () {
                report.steady = snapshot();
                var checkpoint = window.__captureCheckpointSystems().entrance;
                window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
                report.afterContinue = snapshot();
                window.dispatchEvent(new Event("blur"));
                setTimeout(function () {
                  report.afterAttentionPause = snapshot();
                  window.dispatchEvent(new Event("focus"));
                  setTimeout(function () {
                    report.afterRefocus = snapshot();
                    document.dispatchEvent(new KeyboardEvent("keydown", {
                      key: "Enter", code: "Enter", bubbles: true, cancelable: true
                    }));
                    report.afterExit = snapshot();
                    report.errors = (window.__errs || []).concat(report.errors);
                    document.getElementById("__report").textContent = JSON.stringify(report);
                  }, 400);
                }, 400);
              }, 2400);
            }, 2150);
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

console.log("loft-day.html Camping RSVP caption:");
var result = lib.runPageSync("loft-day.html", HARNESS, 7600, {
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the caption lifecycle has no uncaught errors",
  result && result.errors);

var arrival = result && result.arrival || {};
check(arrival.route === "camp" && arrival.key === "entrance_roadtrip_camp_fire_invite" &&
  arrival.text === "What a beautiful campsite! Let’s build a fire." && arrival.blinking,
  "Camping first invites the player to build a fire", arrival);
check(!result.arrivalIncidentalAccepted &&
  result.arrivalAfterProbe.key === "entrance_roadtrip_camp_fire_invite",
  "the real Camping controller rejects lower-priority incidental captions",
  { accepted: result.arrivalIncidentalAccepted, after: result.arrivalAfterProbe });

var czech = result && result.czech || {};
check(czech.key === "entrance_roadtrip_camp_fire_invite" &&
  czech.text === "To je ale krásné tábořiště! Pojďme rozdělat oheň.",
  "the fire invitation follows a Czech language switch", czech);

var afterLanguageRoundTrip = result && result.afterLanguageRoundTrip || {};
check(afterLanguageRoundTrip.route === "camp" &&
  afterLanguageRoundTrip.key === "entrance_roadtrip_camp_fire_invite" &&
  afterLanguageRoundTrip.text === "What a beautiful campsite! Let’s build a fire." &&
  afterLanguageRoundTrip.blinking,
  "the invitation remains keyed after caption re-rendering", afterLanguageRoundTrip);

var completed = result && result.completed || {};
check(completed.key === "entrance_roadtrip_stew_invite" &&
  completed.text === "Let’s make some stew." && completed.blinking,
  "the completed fire briefly invites the player to cook", completed);

var steady = result && result.steady || {};
check(steady.route === "camp" && steady.key === "entrance_roadtrip_stew_invite" &&
  steady.text === "Let’s make some stew." && !steady.blinking,
  "the cooking invitation becomes steady without turning into an opener", steady);

var afterContinue = result && result.afterContinue || {};
check(afterContinue.route === "camp" && !afterContinue.resumePending &&
  afterContinue.key === "entrance_roadtrip_stew_invite" &&
  afterContinue.text === "Let’s make some stew." &&
  afterContinue.captionVisibility === "visible" && afterContinue.pauseDialog === "none",
  "Continue restores Camping directly with its lit-fire cooking invitation", afterContinue);

var afterAttentionPause = result && result.afterAttentionPause || {};
check(afterAttentionPause.route === "camp" && !afterAttentionPause.resumePending &&
  afterAttentionPause.key === "entrance_roadtrip_stew_invite" &&
  afterAttentionPause.captionVisibility === "visible" && afterAttentionPause.pauseDialog === "none",
  "Camping keeps its cooking invitation when an attention pause fires", afterAttentionPause);

var afterRefocus = result && result.afterRefocus || {};
check(afterRefocus.route === "camp" && afterRefocus.entranceOpen && afterRefocus.downstairs &&
  !afterRefocus.resumePending && afterRefocus.key === "entrance_roadtrip_stew_invite" &&
  afterRefocus.captionVisibility === "visible" && afterRefocus.pauseDialog === "none",
  "refocus keeps Entrance ownership and the cooking invitation", afterRefocus);

var afterExit = result && result.afterExit || {};
check(afterExit.key !== "entrance_roadtrip_stew_invite" && !afterExit.blinking &&
  !afterExit.tetrisActive,
  "Enter leaves Camping without starting Balcony Tetris", afterExit);

if (failures) process.exit(1);
console.log("Camping RSVP caption checks passed.");
