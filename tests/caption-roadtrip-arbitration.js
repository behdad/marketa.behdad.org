#!/usr/bin/env node
// Actual Road Trip and Camping producers exercising the shared caption priority contract.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  document.hasFocus = function () { return true; };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function state() { return window.__entranceRoomState(); }
  function trip() { return state().drive.roadtrip; }
  function snap() {
    var node = document.getElementById("hunt-caption");
    return { key: window.__captionKey(), text: node.textContent, arbiter: window.__captionState(),
      tokens: trip().tokens, collisions: trip().collisions, score: trip().score,
      police: trip().police.phase };
  }
  function setMotion(speed, gear) {
    if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__entranceDriveSetMotion(speed, gear);
    window.__entranceDriveControl("throttle", true);
  }
  function resolve(type, counter) {
    setMotion(120, 3);
    var before = trip()[counter];
    window.__entranceRoadtripSpawn(type, .5, 5);
    for (var i = 0; i < 8 && trip()[counter] === before; i++) window.__entranceDriveStep(1000);
    return snap();
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.__endAttract(); window.__unlockAllRooms();
        window.__setSecondRound(true, { releaseHeld: false });
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
        window.__goToStage("balcony"); window.__openEntranceRoom(); await sleep(40);
        window.__openEntrancePorscheDriveHud();
        if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart(); window.__entranceRoadtripSetLane(.5);

        window.__entranceRoadtripSetRouteDistance("turnoff", 1000000000);
        window.__entranceRoadtripStepRouteDistance(1);
        report.storyRace = { story: snap() };
        report.storyRace.pickup = resolve("heart", "tokens");
        report.storyRace.collision = resolve("car", "collisions");

        window.__cancelCaption("roadtrip-story");
        window.__entranceRoadtripSetRoute("banff", 0); window.__entranceRoadtripSetLane(.5);
        report.chatter = { first: resolve("heart", "tokens") };
        report.chatter.second = resolve("kiss", "tokens");
        window.__setLang("cs"); report.chatter.cs = snap(); window.__setLang("en");

        ["roadtrip-score", "roadtrip-story", "roadtrip-police"].forEach(window.__cancelCaption);
        window.__entranceRoadtripSetRoute("banff", 0); window.__entranceRoadtripSetLane(.5);
        setMotion(130, 3);
        window.__entranceRoadtripPolice(150);
        var stationAt = trip().police.stationAt;
        window.__entranceRoadtripSetDistance(stationAt - 6);
        window.__entranceRoadtripPoliceDetect(130);
        report.police = { pursuit: snap() };
        report.police.incidentalAccepted = !!window.__captionOverlay("entrance_roadtrip_heart", {
          owner: "roadtrip-score", scope: "lower:entrance", priority: 30,
          duration: 1000, clock: "attended", replacements: { points: 10, combo: 1 }
        });
        report.police.afterIncidental = snap();
        window.__entranceDriveSetMotion(0, 0);
        window.__entranceDriveControl("throttle", false);
        for (var p = 0; p < 8 && ["stopped", "arrest", "ended"].indexOf(trip().police.phase) < 0; p++) {
          window.__entranceRoadtripPoliceStep(0, 1);
        }
        report.police.terminal = snap();
        report.police.terminalIncidentalAccepted = !!window.__captionOverlay("entrance_roadtrip_collision", {
          owner: "roadtrip-score", scope: "lower:entrance", priority: 30,
          duration: 1000, clock: "attended"
        });
        report.police.afterTerminalIncidental = snap();

        window.__cancelCaption("roadtrip-police");
        report.camp = {};
        [
          "entrance_roadtrip_camp_fire_invite",
          "entrance_roadtrip_stew_invite",
          "entrance_roadtrip_stargazing_invite",
          "entrance_roadtrip_stargazing_continue",
          "entrance_roadtrip_camp_sleep_prompt",
          "entrance_roadtrip_camp_food_warning"
        ].forEach(function (key) {
          window.__setLowerRoomCaption(key);
          var low = window.__captionOverlay("entrance_roadtrip_heart", {
            owner: "roadtrip-score", scope: "lower:entrance", priority: 30,
            duration: 500, clock: "attended", replacements: { points: 10, combo: 1 }
          });
          report.camp[key] = { accepted: !!low, caption: snap() };
        });
        window.__finishLoftAttendedTime();
        window.__showLoftAttendedTimeCaption();
        report.camp.terminal = { en: snap() };
        report.camp.terminal.incidentalAccepted = !!window.__captionOverlay("entrance_roadtrip_stew_cooking_feedback", {
          owner: "camp-progress", scope: "lower:entrance", priority: 80,
          duration: 500, clock: "attended"
        });
        window.__setLang("cs"); report.camp.terminal.cs = snap(); window.__setLang("en");
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 300);
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

console.log("loft-day.html Road Trip caption arbitration:");
var result = lib.runPageSync("loft-day.html", HARNESS, 5500, {
  patchRaf: true, forceMotion: true, urlSuffix: "?date=2026-07-15&time=12:00"
});
check(result && result.errors.length === 0, "the Road Trip ownership harness has no uncaught errors", result && result.errors);
if (result) {
  var story = result.storyRace;
  check(story.story.key === "entrance_roadtrip_banff_arrival" &&
    story.story.arbiter.overlay.owner === "roadtrip-story" && story.story.arbiter.overlay.priority === 60 &&
    story.pickup.tokens > story.story.tokens && story.pickup.key === story.story.key &&
    story.collision.collisions > story.pickup.collisions && story.collision.key === story.story.key,
    "actual Banff narration survives both a pickup and a collision without resurrection", story);
  var chatter = result.chatter;
  check(chatter.first.arbiter.overlay && chatter.second.arbiter.overlay &&
    chatter.first.arbiter.overlay.owner === "roadtrip-score" &&
    chatter.second.arbiter.overlay.owner === "roadtrip-score" &&
    chatter.first.arbiter.overlay.token !== chatter.second.arbiter.overlay.token &&
    chatter.second.tokens > chatter.first.tokens && chatter.cs.key === chatter.second.key &&
    chatter.cs.text !== chatter.second.text,
    "score chatter coalesces by owner and keeps keyed EN/CS replacements", chatter);
  var police = result.police;
  check(police.pursuit.arbiter.overlay && police.pursuit.arbiter.overlay.owner === "roadtrip-police" &&
    police.pursuit.arbiter.overlay.priority === 80 && !police.incidentalAccepted &&
    police.afterIncidental.key === police.pursuit.key,
    "mandatory police pursuit copy rejects score chatter", police);
  check(["stopped", "arrest", "ended"].indexOf(police.terminal.police) >= 0 &&
    police.terminal.arbiter.base && police.terminal.arbiter.base.owner === "roadtrip-police" &&
    police.terminal.arbiter.base.priority === 100 && !police.terminal.arbiter.overlay &&
    !police.terminalIncidentalAccepted &&
    police.afterTerminalIncidental.key === police.terminal.key,
    "a terminal police outcome cannot be replaced by collision feedback", police);
  var camp = result.camp;
  var progressionKeys = [
    "entrance_roadtrip_camp_fire_invite", "entrance_roadtrip_stew_invite",
    "entrance_roadtrip_stargazing_invite", "entrance_roadtrip_stargazing_continue",
    "entrance_roadtrip_camp_sleep_prompt", "entrance_roadtrip_camp_food_warning"
  ];
  check(progressionKeys.every(function (key) {
    var row = camp[key];
    return row && !row.accepted && row.caption.key === key &&
      row.caption.arbiter.base.priority === 80 && !row.caption.arbiter.overlay;
  }), "Camping fire, stew, stargazing, wisdom, sleep, and warning bases reject incidental feedback", camp);
  check(camp.terminal.en.key === "entrance_roadtrip_camp_attended_time" &&
    camp.terminal.en.arbiter.base.priority === 100 && !camp.terminal.incidentalAccepted &&
    camp.terminal.cs.key === camp.terminal.en.key && camp.terminal.cs.text !== camp.terminal.en.text,
    "the terminal Camping RSVP caption rejects progression copy and rerenders its time in Czech", camp.terminal);
}

if (failures) process.exit(1);
console.log("Road Trip caption arbitration checks passed.");
