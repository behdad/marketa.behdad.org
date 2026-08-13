#!/usr/bin/env node
"use strict";

var fs = require("fs");
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  function active(id) { return document.getElementById(id).classList.contains("portal-insisting"); }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  async function run() {
    var upper = ["kitchen", "garden", "cuddly", "office", "balcony"];
    var cases = [
      ["kitchen", "bathroom", "kitchen-bathroom-marker", "__openBathroomRoom", "__closeBathroomRoom"],
      ["garden", "dungeon", "garden-dungeon-marker", "__openGardenPrince", "__closeMonitorPrince"],
      ["cuddly", "cinema", "cuddly-cinema-ticket", "__openCinemaRoom", "__closeCinemaRoom"],
      ["office", "bedroom", "office-bedroom-marker", "__openBedroomRoom", "__closeBedroomRoom"],
      ["balcony", "entrance", "balcony-entrance-marker", "__openEntranceRoom", "__closeEntranceRoom"]
    ];
    function activeRows() { return cases.map(function (entry) { return active(entry[2]); }); }
    var intro = document.getElementById("click-me-overlay");
    if (intro) intro.click();
    window.__unlockAllRooms();
    window.__setSeenRooms(upper);
    window.__goToStage("kitchen");
    window.__lowerRoomPortalWobbleTick(true);
    check("portal props stay still before Phase 2", activeRows().every(function (on) { return !on; }),
      JSON.stringify(window.__lowerRoomPortalWobbleState()));

    window.__setGardenParty(true, true);
    var unlockEvent = new MouseEvent("contextmenu", {
      bubbles: true, cancelable: true, clientX: 320, clientY: 240
    });
    document.getElementById(cases[0][2]).dispatchEvent(unlockEvent);
    window.__closeLowerPortalContextMenu();
    check("the real Phase 2 context-menu path unlocks navigation without visiting downstairs",
      window.__secondRound && window.__lowerRoomDiscoveryClueState().discovered &&
      window.__seenRooms().every(function (room) { return upper.indexOf(room) !== -1; }),
      JSON.stringify({ phase2: window.__secondRound,
        discovery: window.__lowerRoomDiscoveryClueState(), seen: window.__seenRooms() }));

    window.__lowerRoomPortalWobbleTick(true);
    var pulsed = cases.map(function (entry) {
      var marker = document.getElementById(entry[2]);
      var animated = entry[0] === "cuddly" ? marker.querySelector(".cinema-ticket-wobble") : marker;
      return { active: active(entry[2]), animation: getComputedStyle(animated).animationName };
    });
    check("all five unseen portal props keep wobbling after lower navigation unlocks", pulsed.every(function (item) {
      return item.active && item.animation === "lower-portal-insist";
    }),
      JSON.stringify(pulsed));

    var visits = [];
    for (var i = 0; i < cases.length; i++) {
      var entry = cases[i];
      window.__goToStage(entry[0]);
      window.__lowerRoomPortalWobbleTick(true);
      var before = activeRows();
      window[entry[3]]();
      await sleep(80);
      window.__lowerRoomPortalWobbleTick(true);
      var after = activeRows();
      visits.push({ room: entry[1], seen: window.__seenRooms().slice(), before: before, after: after });
      window[entry[4]]();
      await sleep(760);
    }
    check("each actual lower-room visit stops only its own portal prop", visits.every(function (visit, index) {
      return visit.seen.indexOf(visit.room) !== -1 &&
        visit.before.every(function (on, markerIndex) { return on === (markerIndex >= index); }) &&
        visit.after.every(function (on, markerIndex) { return on === (markerIndex > index); });
    }), JSON.stringify(visits));

    window.__setSeenRooms(upper);
    window.__goToStage("garden");
    window.__frameHealthFeed(20);
    window.__frameHealthFeed(20);
    window.__lowerRoomPortalWobbleTick(true);
    check("low frame health suppresses the wobble", !active(cases[1][2]),
      JSON.stringify(window.__frameHealthState()));
    window.__frameHealthFeed(60);
    window.__frameHealthFeed(60);
    window.__frameHealthFeed(60);

    var realMatchMedia = window.matchMedia;
    window.matchMedia = function (query) {
      if (query === "(prefers-reduced-motion: reduce)") return { matches: true };
      return realMatchMedia.call(window, query);
    };
    window.__lowerRoomPortalWobbleTick(true);
    check("reduced motion suppresses the wobble", !active(cases[1][2]));
    window.matchMedia = realMatchMedia;

    window.__lowerRoomPortalWobbleTick(true);
    window.__setSecondRound(false, { releaseHeld: false });
    check("leaving Phase 2 clears an in-flight wobble", !active(cases[1][2]));
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try { await run(); } catch (error) { out.errors.push(String(error && error.stack || error)); }
      report();
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 10000, { patchRaf: true, forceMotion: true });
if (!result) { console.error("lower-room wobble: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + item.detail));
  if (!item.pass) failed = true;
});
if (result.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + result.errors.join("\n  "));
}

var source = fs.readFileSync("rsvp.html", "utf8");
if (!/setInterval\(function \(\) \{ lowerRoomPortalWobbleTick\(false\); \}, 2000\)/.test(source)) {
  failed = true;
  console.error("  ✗ the autonomous portal affordance keeps its two-second cadence");
} else {
  console.log("  ✓ the autonomous portal affordance keeps its two-second cadence");
}
if (failed) process.exit(1);
console.log("lower-room wobble: all checks passed");
