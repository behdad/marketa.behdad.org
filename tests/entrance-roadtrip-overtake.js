#!/usr/bin/env node
// Slow Road Trip traffic: a faster car approaches in the mirror and passes the player.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function state() { return window.__entranceRoomState().drive.roadtrip; }
  function step(ms, count) {
    for (var index = 0; index < (count || 1); index++) window.__entranceDriveStep(ms);
  }
  function overtaker() {
    return document.querySelector('#entrance-roadtrip-entities [data-roadtrip-overtaking-player="true"]');
  }
  function mirrorEntity() {
    return Array.prototype.find.call(document.querySelectorAll(
      "#entrance-roadtrip-mirror-entities .entrance-roadtrip-mirror-entity"), function (node) {
        return node.getAttribute("visibility") !== "hidden";
      }) || null;
  }
  function sample(node) {
    return {
      type: node && node.getAttribute("data-roadtrip-type"),
      direction: node && node.getAttribute("data-roadtrip-direction"),
      lane: Number(node && node.getAttribute("data-roadtrip-lane")),
      ahead: Number(node && node.getAttribute("data-roadtrip-ahead")),
      overtaking: node && node.getAttribute("data-roadtrip-overtaking-player"),
      horned: node && node.getAttribute("data-roadtrip-horned"),
      visibility: node && node.getAttribute("visibility")
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripStart();
        window.__entranceDriveSetMotion(0, 0);
        window.__entranceRoadtripSetLane(.5);
        ["throttle", "brake", "clutch", "steerLeft", "steerRight"].forEach(function (name) {
          window.__entranceDriveControl(name, false);
        });

        step(1000, 11);
        report.steps.waiting = { state: state(), overtaker: !!overtaker() };
        step(1000);
        var node = overtaker();
        var mirror = mirrorEntity();
        report.steps.behind = {
          source: sample(node),
          mirrorVisible: !!mirror,
          mirrorType: mirror && mirror.getAttribute("data-roadtrip-mirror-type"),
          passes: state().passes,
          audioVoices: state().trafficAudioVoices
        };

        step(600, 2);
        report.steps.alongside = {
          source: sample(node),
          mirrorVisible: !!mirrorEntity(),
          passes: state().passes
        };
        step(600);
        report.steps.ahead = {
          source: sample(node),
          mirrorVisible: !!mirrorEntity(),
          passes: state().passes,
          audioVoices: state().trafficAudioVoices
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 220);
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

console.log("rsvp.html slow-traffic overtaking:");
var source = fs.readFileSync(path.join(lib.ROOT, "rsvp.html"), "utf8");
check(/ROADTRIP_OVERTAKE_SPEED_MAX = 70/.test(source) && /ROADTRIP_OVERTAKE_FIRST_SECONDS = 12/.test(source) &&
  /function syncRoadtripPlayerOvertaker\(seconds\)[\s\S]{0,900}forwardSpeed <= ROADTRIP_OVERTAKE_SPEED_MAX/.test(source) &&
  /spawnRoadtripEntity\(type, lane, ROADTRIP_OVERTAKE_REAR_DISTANCE,[\s\S]{0,100}behind: true/.test(source),
  "only sustained travel at 70 km/h or less schedules a vehicle from behind");

var result = lib.runPageSync("rsvp.html", HARNESS, 5000, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
check(result && result.errors.length === 0, "the focused drive has no uncaught errors", result && result.errors);
var steps = result && result.steps || {};
check(steps.waiting && !steps.waiting.overtaker && steps.waiting.state.overtakeCooldown > 0,
  "the first passing car stays infrequent", steps.waiting);
check(steps.behind && steps.behind.source.overtaking === "true" &&
  steps.behind.source.direction === "forward" && steps.behind.source.lane === 1.5 &&
  steps.behind.source.ahead < -20 && steps.behind.source.visibility === "hidden" &&
  steps.behind.mirrorVisible && steps.behind.mirrorType === steps.behind.source.type &&
  steps.behind.audioVoices >= 1,
  "the faster car and its whoosh first have a visible source in the mirror", steps.behind);
check(steps.alongside && steps.alongside.source.ahead > -2 &&
  steps.alongside.source.visibility !== "hidden" && !steps.alongside.mirrorVisible &&
  steps.alongside.source.horned === "true",
  "the car transfers atomically from mirror to windshield and occasionally horns while passing a stopped player", steps.alongside);
check(steps.ahead && steps.ahead.source.ahead > 8 && steps.ahead.source.overtaking === "false" &&
  !steps.ahead.mirrorVisible && steps.ahead.passes === steps.behind.passes,
  "the passing car continues ahead without awarding a player pass", steps.ahead);

if (failures) process.exit(1);
console.log("Slow-traffic overtaking checks passed.");
