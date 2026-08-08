#!/usr/bin/env node
// Pine tree drops collect as bounded kindling without impersonating the durable camp fire.
"use strict";

var lib = require("./lib");

var HARNESS = `
<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  window.__errs = [];
  window.addEventListener("error", function (event) {
    window.__errs.push(String(event.error && event.error.stack || event.message));
  });
  function click(node) {
    if (!node) throw new Error("missing click target");
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  function visibleSlots(root) {
    return Array.prototype.filter.call(root.querySelectorAll(".entrance-roadtrip-camp-collected-cone"), function (cone) {
      return cone.style.opacity === "1";
    }).length;
  }
  function ordered(parent, selectors) {
    var nodes = selectors.map(function (selector) { return parent.querySelector(selector); });
    return nodes.every(function (node, index) {
      return !!node && (!index || !!(nodes[index - 1].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
  }
  function snap() {
    var entrance = window.__entranceRoomState();
    var state = entrance.drive.roadtrip.campFire;
    var scene = document.getElementById("entrance-roadtrip-camp");
    var empty = document.getElementById("entrance-roadtrip-camp-empty-pit");
    var built = document.getElementById("entrance-roadtrip-camp-finished-fire");
    var builder = document.getElementById("entrance-roadtrip-fire-build-preview");
    return {
      state: state,
      emptySlots: visibleSlots(empty),
      builtSlots: visibleSlots(built),
      builderSlots: visibleSlots(builder),
      burning: scene.classList.contains("pinecone-burning"),
      flare: scene.classList.contains("pinecone-flare"),
      fireOut: scene.classList.contains("fire-out"),
      fallingCones: document.querySelectorAll(".entrance-roadtrip-camp-pinecone").length,
      flameNodes: document.querySelectorAll(".entrance-roadtrip-camp-pinecone-flame").length,
      stew: window.__entranceRoadtripCampStewState(),
      layers: {
        empty: ordered(empty, [":scope>use:first-child", ":scope>.entrance-roadtrip-camp-pinecone-collection", ":scope>.entrance-roadtrip-camp-pinecone-flame", ":scope>use:nth-of-type(2)"]),
        built: ordered(built, [":scope>use:first-child", ":scope>.entrance-roadtrip-camp-pinecone-collection", ":scope>.entrance-roadtrip-camp-pinecone-flame", ":scope>.entrance-roadtrip-camp-built-logs", ":scope>#entrance-roadtrip-camp-fire"]),
        builder: ordered(builder, [":scope>use:first-child", ":scope>.entrance-roadtrip-camp-pinecone-collection", ":scope>.fire-game-placed-tinder", ":scope>.fire-game-placed-twigs", ":scope>.fire-game-placed-teepee"])
      }
    };
  }
  function finish() {
    report.errors = window.__errs.concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () {
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.goToStage("balcony");
    setTimeout(function () {
      try {
        window.__openEntranceRoom();
        document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);
        report.initial = snap();
        report.initialCheckpoint = window.__captureCheckpointSystems().entrance;
        var pine = document.querySelector("#entrance-roadtrip-camp-pines>.entrance-roadtrip-camp-pine");
        for (var index = 0; index < 5; index++) click(pine);
        report.coldCap = snap();
        report.coldCheckpoint = window.__captureCheckpointSystems().entrance;
        setTimeout(function () {
          try {
            report.coldExpired = snap();
            window.__entranceRoadtripCampFireStart();
            report.builderMirror = snap();
            window.__entranceRoadtripCampFirePlace("tinder");
            window.__entranceRoadtripCampFirePlace("stack");
            report.coneSuccessResult = window.__entranceRoadtripCampFireLight();
            report.coneSuccessStart = snap();
            setTimeout(function () {
              try {
                report.coneSuccess = snap();
                var checkpointChanged = window.__checkpointChanged;
                var litFlareSaves = 0;
                window.__checkpointChanged = function () { litFlareSaves++; };
                click(document.querySelectorAll("#entrance-roadtrip-camp-pines>.entrance-roadtrip-camp-pine")[1]);
                window.__checkpointChanged = checkpointChanged;
                report.litFlare = snap();
                report.litFlareSaves = litFlareSaves;
                report.litFlareCheckpoint = window.__captureCheckpointSystems().entrance;
                setTimeout(function () {
                  try {
                    report.litFlareExpired = snap();
                    click(document.getElementById("entrance-roadtrip-camp-fire"));
                    report.earlyFireClick = snap();
                    click(pine);
                    report.earlyFireCone = snap();
                    window.__restoreCheckpointSystems({ entrance: report.coldCheckpoint }, "afterStage");
                    report.restored = snap();
                    window.__entranceRoadtripCampFireStart();
                    window.__entranceRoadtripCampFirePlace("tinder");
                    report.coneFailureResult = window.__entranceRoadtripCampFireLight();
                    report.coneFailure = snap();
                    window.__restoreCheckpointSystems({ entrance: report.initialCheckpoint }, "afterStage");
                    window.__entranceRoadtripCampFireStart();
                    window.__entranceRoadtripCampFirePlace("tinder");
                    window.__entranceRoadtripCampFirePlace("twigs");
                    window.__entranceRoadtripCampFirePlace("stack");
                    report.twigsSuccessResult = window.__entranceRoadtripCampFireLight();
                    report.twigsSuccessStart = snap();
                    setTimeout(function () {
                      try {
                        report.twigsSuccess = snap();
                        window.__entranceRoadtripSetRoute("abraham", 0);
                        window.__entranceRoadtripSetRoute("camp", 0);
                        report.freshArrival = snap();
                      } catch (error) { report.errors.push(String(error && error.stack || error)); }
                      finish();
                    }, 1700);
                  } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
                }, 2700);
              } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
            }, 1700);
          } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
        }, 2700);
      } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
    }, 950);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 12500, {
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=21:00#play",
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html campsite pinecone kindling:");
check(result && result.errors.length === 0, "the pinecone sequence has no uncaught errors", result && result.errors);
check(result && result.initial && result.initial.state.pinecones === 0 && !result.initial.state.complete &&
  !result.initial.state.lit && !result.initial.burning && result.initial.emptySlots === 0,
  "a fresh campsite starts with no collected cones or false fire state", result && result.initial);
check(result && result.coldCap && result.coldCap.state.pinecones === 4 && result.coldCap.emptySlots === 4 &&
  result.coldCap.builderSlots === 4 && result.coldCap.burning && !result.coldCap.flare &&
  result.coldCap.fallingCones <= 2 && result.coldCap.flameNodes === 2 &&
  !result.coldCap.state.complete && !result.coldCap.state.lit &&
  result.coldCap.stew.status === "assembling" && result.coldCap.layers.empty &&
  result.coldCap.layers.built && result.coldCap.layers.builder,
  "five rapid tree drops cap at four cold-pit cones and one fixed transient flame", result && result.coldCap);
check(result && result.coldCheckpoint && result.coldCheckpoint.drive.roadtrip.campPinecones === 4 &&
  !("pineconeBurning" in result.coldCheckpoint.drive.roadtrip),
  "the collection is checkpointed without transient flame state", result && result.coldCheckpoint);
check(result && result.coldExpired && result.coldExpired.state.pinecones === 4 &&
  !result.coldExpired.burning && !result.coldExpired.flare && !result.coldExpired.state.complete &&
  !result.coldExpired.state.lit,
  "the cold cone flame dies without creating a durable fire", result && result.coldExpired);
check(result && result.builderMirror && result.builderMirror.builderSlots === 4 &&
  result.builderMirror.state.open && !result.builderMirror.state.twigs,
  "the fire builder mirrors collected cones beneath the ordinary fuel", result && result.builderMirror);
check(result && result.coneSuccessResult === "success" && result.coneSuccessStart &&
  result.coneSuccessStart.state.igniting && result.coneSuccessStart.state.pinecones === 0 &&
  !result.coneSuccessStart.state.twigs && result.coneSuccess && result.coneSuccess.state.complete &&
  result.coneSuccess.state.lit,
  "tinder, a collected cone, and logs light successfully and consume the collection", {
    result: result && result.coneSuccessResult,
    start: result && result.coneSuccessStart,
    complete: result && result.coneSuccess
  });
check(result && result.litFlare && result.litFlare.state.complete && result.litFlare.state.lit &&
  result.litFlare.state.pinecones === 0 && result.litFlare.burning && result.litFlare.flare &&
  result.litFlare.flameNodes === 2 && result.litFlareExpired &&
  result.litFlareExpired.state.complete && result.litFlareExpired.state.lit &&
  result.litFlareExpired.state.pinecones === 0 && !result.litFlareExpired.burning &&
  !result.litFlareExpired.flare && result.litFlareSaves === 0 &&
  result.litFlareCheckpoint && result.litFlareCheckpoint.drive.roadtrip.campPinecones === 0,
  "a cone dropped onto a lit proper fire flares, burns away, and does not checkpoint", {
    active: result && result.litFlare,
    expired: result && result.litFlareExpired,
    saves: result && result.litFlareSaves,
    checkpoint: result && result.litFlareCheckpoint
  });
check(result && result.earlyFireClick && result.earlyFireClick.state.complete && result.earlyFireClick.state.lit &&
  !result.earlyFireClick.fireOut && result.earlyFireCone && result.earlyFireCone.state.complete &&
  result.earlyFireCone.state.lit && result.earlyFireCone.state.pinecones === 0 &&
  result.earlyFireCone.burning && result.earlyFireCone.flare,
  "the built fire cannot be extinguished early and later cones still burn on contact", {
    clicked: result && result.earlyFireClick,
    cone: result && result.earlyFireCone
  });
check(result && result.coneFailureResult === "entrance_roadtrip_camp_fire_no_logs" &&
  result.coneFailure && !result.coneFailure.state.complete && !result.coneFailure.state.lit &&
  !result.coneFailure.state.tinder && !result.coneFailure.state.twigs &&
  result.coneFailure.state.pinecones === 3,
  "a failed no-log attempt consumes one cone when it supplied the kindling", {
    result: result && result.coneFailureResult,
    state: result && result.coneFailure
  });
check(result && result.twigsSuccessResult === "success" && result.twigsSuccessStart &&
  result.twigsSuccessStart.state.igniting && result.twigsSuccessStart.state.twigs &&
  result.twigsSuccessStart.state.pinecones === 0 && result.twigsSuccess &&
  result.twigsSuccess.state.complete && result.twigsSuccess.state.lit,
  "the original tinder, twigs, and logs path still lights normally", {
    result: result && result.twigsSuccessResult,
    start: result && result.twigsSuccessStart,
    complete: result && result.twigsSuccess
  });
check(result && result.restored && result.restored.state.pinecones === 4 &&
  result.restored.emptySlots === 4 && !result.restored.burning && !result.restored.flare,
  "checkpoint restore repaints the collection but not an old flame", result && result.restored);
check(result && result.freshArrival && result.freshArrival.state.pinecones === 0 &&
  result.freshArrival.emptySlots === 0 && result.freshArrival.builtSlots === 0 &&
  result.freshArrival.builderSlots === 0 && !result.freshArrival.burning,
  "a genuinely fresh Camping arrival clears gathered cones and transient effects", result && result.freshArrival);

if (failures) process.exit(1);
console.log("Campsite pinecone kindling assertions passed.");
