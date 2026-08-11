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
  function startBanff() {
    var started = window.__entranceRoadtripDevStart();
    if (started) {
      window.__entranceRoadtripSetRoute("banff", 0);
      window.__entranceRoadtripSetLane(2.08);
    }
    return started;
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
      laneTarget: Number(node && node.getAttribute("data-roadtrip-overtake-lane-target")),
      laneChanged: node && node.getAttribute("data-roadtrip-overtake-lane-changed"),
      horned: node && node.getAttribute("data-roadtrip-horned"),
      visibility: node && node.getAttribute("visibility")
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
        window.__unlockAllRooms();
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        startBanff();
        window.__entranceDriveSetMotion(0, 0);
        report.steps.start = {
          state: state(),
          classes: document.getElementById("entrance-room").getAttribute("class")
        };
        ["throttle", "brake", "clutch", "steerLeft", "steerRight"].forEach(function (name) {
          window.__entranceDriveControl(name, false);
        });

        report.steps.waiting = { state: state(), overtaker: !!overtaker() };
        step(1000, 6);
        var shoulderNode = overtaker();
        report.steps.shoulderBehind = sample(shoulderNode);
        step(600, 2);
        report.steps.shoulderAlongside = sample(shoulderNode);

        window.__dismissEntrancePorscheDriveHud();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        startBanff();
        window.__entranceDriveSetMotion(0, 0);
        window.__entranceRoadtripSetLane(.5);
        ["throttle", "brake", "clutch", "steerLeft", "steerRight"].forEach(function (name) {
          window.__entranceDriveControl(name, false);
        });
        step(1000, 6);
        var node = overtaker();
        var behindSource = sample(node);
        step(60);
        var mirror = mirrorEntity();
        report.steps.behind = {
          source: behindSource,
          mirrorVisible: !!mirror,
          mirrorType: mirror && mirror.getAttribute("data-roadtrip-mirror-type"),
          passes: state().passes,
          audioVoices: state().trafficAudioVoices
        };

        step(600);
        report.steps.shifting = {
          source: sample(node),
          mirrorVisible: !!mirrorEntity()
        };
        step(600);
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
        report.steps.repeat = {
          cooldown: state().overtakeCooldown
        };

        function hornProbe(speed) {
          window.__dismissEntrancePorscheDriveHud();
          window.__openEntrancePorscheDriveHud();
          if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
          startBanff();
          window.__entranceDriveSetMotion(speed, 3);
          window.__entranceRoadtripSetLane(1.5);
          var probe = window.__entranceRoadtripSpawnOvertaker();
          for (var index = 0; index < 16 &&
              probe.getAttribute("data-roadtrip-horned") !== "true"; index++) step(250);
          return sample(probe);
        }
        report.steps.slowHorn = hornProbe(59);
        report.steps.sixtyHorn = hornProbe(60);
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

console.log("loft-day.html slow-traffic overtaking:");
var source = fs.readFileSync(path.join(lib.ROOT, "loft-day.html"), "utf8");
check(/ROADTRIP_OVERTAKE_SPEED_MAX = 70/.test(source) && /ROADTRIP_OVERTAKE_FIRST_SECONDS = 6/.test(source) &&
  /function syncRoadtripPlayerOvertaker\(seconds\)[\s\S]{0,900}forwardSpeed <= ROADTRIP_OVERTAKE_SPEED_MAX/.test(source) &&
  /spawnRoadtripEntity\(plan\.type, lane, plan\.ahead,[\s\S]{0,140}behind: true/.test(source),
  "travel at 70 km/h or less schedules a vehicle after an opening breathing beat");

var result = lib.runPageSync("loft-day.html", HARNESS, 1800, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
check(result && result.errors.length === 0, "the focused drive has no uncaught errors", result && result.errors);
var steps = result && result.steps || {};
check(steps.start && steps.start.state.playerLane === 2.08 &&
  steps.start.state.shoulderZone === "gravel" && /roadtrip-on-gravel/.test(steps.start.classes),
  "a fresh Road Trip opens parked on the right shoulder", steps.start);
check(steps.waiting && !steps.waiting.overtaker && steps.waiting.state.overtakeCooldown === 6,
  "a fresh Road Trip leaves six clear seconds before rear traffic", steps.waiting);
check(steps.shoulderBehind && steps.shoulderBehind.overtaking === "true" &&
  steps.shoulderBehind.lane === 1.5 && steps.shoulderBehind.laneTarget === .5 &&
  steps.shoulderBehind.laneChanged === "false" && !steps.shoulderBehind.horned,
  "traffic behind a shoulder-parked Porsche starts right and moves to the left lane",
  steps.shoulderBehind);
check(steps.shoulderAlongside && steps.shoulderAlongside.lane === .5 &&
  steps.shoulderAlongside.laneChanged === "true" && !steps.shoulderAlongside.horned,
  "the shoulder pass completes in the left lane without honking", steps.shoulderAlongside);
check(steps.behind && steps.behind.source.overtaking === "true" &&
  steps.behind.source.direction === "forward" && steps.behind.source.lane === .5 &&
  steps.behind.source.laneTarget === 1.5 && steps.behind.source.laneChanged === "false" &&
  steps.behind.source.ahead < -20 && steps.behind.source.visibility === "hidden" &&
  steps.behind.mirrorVisible && steps.behind.mirrorType === steps.behind.source.type &&
  steps.behind.audioVoices >= 1,
  "the faster car first appears behind the stopped Porsche in its inner lane", steps.behind);
check(steps.shifting && steps.shifting.source.lane > .5 && steps.shifting.source.lane < 1.5 &&
  steps.shifting.source.laneTarget === 1.5 && steps.shifting.source.laneChanged === "true" &&
  steps.shifting.mirrorVisible,
  "the mirror visibly carries the overtaker across to the open outer lane", steps.shifting);
check(steps.alongside && steps.alongside.source.ahead > -2 &&
  steps.alongside.source.lane === 1.5 &&
  steps.alongside.source.visibility !== "hidden" && !steps.alongside.mirrorVisible &&
  steps.alongside.source.horned === "true",
  "the stopped inner-lane pass always horns after shifting into the outer lane", steps.alongside);
check(steps.ahead && steps.ahead.source.ahead > 8 && steps.ahead.source.overtaking === "false" &&
  !steps.ahead.mirrorVisible && steps.ahead.passes === steps.behind.passes,
  "the passing car continues ahead without awarding a player pass", steps.ahead);
check(steps.repeat && steps.repeat.cooldown > 0 && steps.repeat.cooldown <= 11,
  "a stopped Porsche schedules its next rear vehicle within the denser 7–11 second cadence",
  steps.repeat);
check(steps.slowHorn && steps.slowHorn.horned === "true" &&
  steps.sixtyHorn && steps.sixtyHorn.horned !== "true",
  "a rear vehicle honks only below 60 km/h when the Porsche occupies its lane",
  { slow: steps.slowHorn, sixty: steps.sixtyHorn });

if (failures) process.exit(1);
console.log("Slow-traffic overtaking checks passed.");
