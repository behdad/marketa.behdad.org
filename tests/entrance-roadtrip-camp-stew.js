#!/usr/bin/env node
// Campsite stew recipe, attended cooking, fire/lid pauses, payoff, replay, and recovery.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function click(node) {
    if (!node) return false;
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  }
  function stew() { return window.__entranceRoadtripCampStewState(); }
  function choose(items) { items.forEach(function (item) { window.__entranceRoadtripCampStewSelect(item); }); }
  function fullRecipe(protein, base) {
    choose([protein, base, "tomato", "curry", "water", "salt", "pepper", "chilies"]);
  }
  function lightFire(done) {
    window.__entranceRoadtripCampFirePlace("tinder");
    window.__entranceRoadtripCampFirePlace("twigs");
    window.__entranceRoadtripCampFirePlace("stack");
    window.__entranceRoadtripCampFireLight();
    setTimeout(done, 1600);
  }
  function syntheticTouchDrag(node, target) {
    var from = node.getBoundingClientRect(), to = target.getBoundingClientRect();
    var common = { bubbles: true, cancelable: true, pointerId: 77, pointerType: "touch", isPrimary: true, button: 0 };
    node.dispatchEvent(new PointerEvent("pointerdown", Object.assign({ clientX: from.left + 5, clientY: from.top + 5 }, common)));
    document.dispatchEvent(new PointerEvent("pointermove", Object.assign({ clientX: to.left + to.width / 2, clientY: to.top + to.height / 2 }, common)));
    document.dispatchEvent(new PointerEvent("pointerup", Object.assign({ clientX: to.left + to.width / 2, clientY: to.top + to.height / 2 }, common)));
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
        var crate = document.getElementById("entrance-roadtrip-camp-food-crate");
        report.fresh = { stew: stew(), crate: getComputedStyle(crate).pointerEvents };
        window.__entranceRoadtripCampFireStart();
        lightFire(function () {
          try {
            report.ignited = {
              caption: window.__captionKey(),
              text: document.getElementById("hunt-caption").textContent,
              crate: getComputedStyle(crate).pointerEvents
            };
            setTimeout(function () {
              try {
                report.captionRestored = { key: window.__captionKey(), text: document.getElementById("hunt-caption").textContent };
                click(document.getElementById("hunt-caption"));
                report.captionRestored.clickedOpen = stew().open;
                click(crate);
                var itemIds = Array.from(document.querySelectorAll("#entrance-roadtrip-stew-game [data-stew-item]"))
                  .map(function (node) { return node.getAttribute("data-stew-item"); }).sort();
                report.palette = { ids: itemIds, open: stew().open, scenePot: document.getElementById("entrance-roadtrip-camp-pot").classList.contains("has-stew") };

                choose(["beef", "lamb"]);
                report.proteinSwap = stew();
                window.__entranceRoadtripCampStewSelect("lamb");
                report.proteinRemoved = stew();
                choose(["tofu", "rice", "beans"]);
                report.baseSwap = stew();
                report.missing = { result: window.__entranceRoadtripCampStewCook(), state: stew() };

                var water = document.querySelector('[data-stew-item="water"]');
                syntheticTouchDrag(water, document.getElementById("entrance-roadtrip-stew-pot-hit"));
                report.dragged = stew();
                choose(["tomato", "curry", "salt", "pepper"]);
                report.beforeLastFixed = stew();
                choose(["chilies"]);
                report.completeRecipe = {
                  state: stew(),
                  selected: document.querySelectorAll("#entrance-roadtrip-stew-game .entrance-roadtrip-stew-item.selected").length,
                  scenePot: document.getElementById("entrance-roadtrip-camp-pot").classList.contains("has-stew"),
                  status: document.getElementById("entrance-roadtrip-stew-status").textContent,
                  curry: document.querySelector('[data-stew-item="curry"] text').textContent
                };
                setLang("cs");
                report.czech = {
                  title: document.querySelector('#entrance-roadtrip-stew-game [data-i="entrance_roadtrip_stew_title"]').textContent,
                  beans: document.querySelector('[data-stew-item="beans"] text').textContent
                };
                setLang("en");
                report.started = { result: window.__entranceRoadtripCampStewCook(), state: stew() };
                report.rawServe = { result: window.__entranceRoadtripCampStewServe(), state: stew() };
                report.closedLid = window.__entranceRoadtripCampStewStep(3000);

                window.__entranceRoadtripCampStewReset();
                fullRecipe("beef", "rice");
                window.__entranceRoadtripCampStewCook();
                click(document.getElementById("entrance-roadtrip-stew-pot-hit"));
                report.openLid = window.__entranceRoadtripCampStewStep(3000);
                click(document.getElementById("entrance-roadtrip-stew-pot-hit"));
                report.simmer = window.__entranceRoadtripCampStewStep(4700);
                click(document.getElementById("entrance-roadtrip-camp-fire"));
                var pausedBefore = stew();
                report.paused = { before: pausedBefore, after: window.__entranceRoadtripCampStewStep(5000), caption: window.__captionKey() };
                window.__entranceRoadtripCampFireReplay();
                lightFire(function () {
                  try {
                    report.resumed = stew();
                    report.ready = window.__entranceRoadtripCampStewStep(5200);
                    var readyCheckpoint = window.__captureCheckpointSystems().entrance;
                    window.__restoreCheckpointSystems({ entrance: readyCheckpoint }, "afterStage");
                    report.readyRestored = stew();
                    click(crate);
                    report.served = {
                      result: window.__entranceRoadtripCampStewServe(),
                      state: stew(),
                      meal: document.getElementById("entrance-roadtrip-camp").classList.contains("stew-served"),
                      instruction: window.__entranceRoomState().drive.instruction
                    };
                    var servedCheckpoint = window.__captureCheckpointSystems().entrance;
                    click(crate);
                    window.__entranceRoadtripCampStewReset();
                    fullRecipe("lamb", "potatoes");
                    window.__entranceRoadtripCampStewCook();
                    report.overcooked = window.__entranceRoadtripCampStewStep(19000);
                    report.burntServe = window.__entranceRoadtripCampStewServe();
                    report.replayed = { state: window.__entranceRoadtripCampStewReset(), caption: window.__captionKey() };
                    window.__restoreCheckpointSystems({ entrance: servedCheckpoint }, "afterStage");
                    report.servedRestored = stew();
                    window.__entranceRoadtripSetRoute("abraham", 0);
                    window.__entranceRoadtripSetRoute("camp", 0);
                    report.freshArrival = stew();
                  } catch (error) { report.errors.push(String(error && error.stack || error)); }
                  report.errors = (window.__errs || []).concat(report.errors);
                  document.getElementById("__report").textContent = JSON.stringify(report);
                });
              } catch (error) {
                report.errors.push(String(error && error.stack || error));
                document.getElementById("__report").textContent = JSON.stringify(report);
              }
            }, 2400);
          } catch (error) {
            report.errors.push(String(error && error.stack || error));
            document.getElementById("__report").textContent = JSON.stringify(report);
          }
        });
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
        document.getElementById("__report").textContent = JSON.stringify(report);
      }
    }, 900);
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

console.log("rsvp.html campsite stew:");
var result = lib.runPageSync("rsvp.html", HARNESS, 10500, {
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=20:00#play",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the stew loop has no uncaught errors", result && result.errors);
check(result && result.fresh && result.fresh.stew.phase === "cold" &&
  result.fresh.stew.status === "assembling" && result.fresh.crate === "none",
  "fresh Camping starts with an empty silver pot and no food crate", result && result.fresh);
check(result && result.ignited && result.ignited.caption === "entrance_roadtrip_stew_invite" &&
  result.ignited.text === "Let’s cook some stew." && result.ignited.crate === "all",
  "successful ignition briefly invites cooking and reveals the separate crate opener", result && result.ignited);
check(result && result.captionRestored && result.captionRestored.key === "entrance_roadtrip_stew_invite" &&
  result.captionRestored.text === "Let’s cook some stew." && !result.captionRestored.clickedOpen,
  "the non-clickable stew invitation remains while the fire burns",
  result && result.captionRestored);
var exactItems = ["beans", "beef", "chilies", "curry", "lamb", "pepper", "pork", "potatoes", "rice", "salt", "tofu", "tomato", "water"];
check(result && result.palette && JSON.stringify(result.palette.ids) === JSON.stringify(exactItems) &&
  result.palette.open && !result.palette.scenePot, "the palette contains exactly the approved visual ingredients",
  result && result.palette);
check(result && result.proteinSwap && result.proteinSwap.protein === "lamb" &&
  result.proteinRemoved && !result.proteinRemoved.protein && result.baseSwap && result.baseSwap.starch === "beans",
  "protein and base choices replace or remove the prior selection", result && {
    swap: result.proteinSwap, removed: result.proteinRemoved, base: result.baseSwap
  });
check(result && result.missing && result.missing.result === "entrance_roadtrip_stew_missing" &&
  result.missing.state.status === "assembling" && !result.missing.state.recipeComplete,
  "missing required fixed components cannot start cooking", result && result.missing);
check(result && result.dragged && result.dragged.water && result.beforeLastFixed &&
  !result.beforeLastFixed.recipeComplete && result.completeRecipe && result.completeRecipe.state.recipeComplete &&
  result.completeRecipe.selected === 8 && result.completeRecipe.scenePot &&
  result.completeRecipe.status === "Raw · everything’s in" && result.completeRecipe.curry === "Curry paste",
  "touch dragging adds an ingredient, all fixed components complete the recipe, and status/curry copy stays human", result && {
    dragged: result.dragged, before: result.beforeLastFixed, complete: result.completeRecipe
  });
check(result && result.czech && result.czech.title === "Dušené jídlo v kempu" && result.czech.beans === "Fazole",
  "the builder and new bean base follow a Czech language switch", result && result.czech);
check(result && result.started && result.started.result === "cooking" && result.started.state.phase === "raw" &&
  result.rawServe && result.rawServe.result === "raw" && result.rawServe.state.status === "cooking",
  "raw stew gets a comic reaction without ending the cook", result && { started: result.started, raw: result.rawServe });
check(result && result.closedLid && result.closedLid.phase === "warming" &&
  result.openLid && result.openLid.phase === "raw" && result.openLid.elapsed < result.closedLid.elapsed,
  "a closed lid cooks normally while an open inspection lid cooks more slowly", result && {
    closed: result.closedLid, open: result.openLid
  });
check(result && result.simmer && result.simmer.phase === "simmering" && result.paused &&
  result.paused.before.elapsed === result.paused.after.elapsed && !result.paused.after.fireLit &&
  result.paused.caption === "entrance_roadtrip_camp_arrival",
  "simmering is visual; extinguishing pauses progress and restores the RSVP caption", result && {
    simmer: result.simmer, paused: result.paused
  });
check(result && result.resumed && result.resumed.fireLit && result.ready && result.ready.phase === "ready" &&
  result.ready.elapsed >= 11500 && result.ready.elapsed < 18500 && result.readyRestored &&
  result.readyRestored.phase === "ready", "relighting resumes cooking and Continue preserves the generous ready window",
  result && { resumed: result.resumed, ready: result.ready, restored: result.readyRestored });
check(result && result.served && result.served.result === "served" && result.served.state.status === "served" &&
  !result.served.state.open && result.served.meal && result.served.instruction === "entrance_roadtrip_camp_arrival",
  "serving reveals two bowls and restores the permanent RSVP instruction",
  result && result.served);
check(result && result.overcooked && result.overcooked.status === "overcooked" &&
  result.burntServe === "overcooked" && result.replayed && result.replayed.state.status === "assembling" &&
  result.replayed.state.phase === "cold" && result.replayed.caption === "entrance_roadtrip_stew_invite",
  "overcooking is comic; reset restarts the pot and restores the lit-fire invitation", result && {
    overcooked: result.overcooked, served: result.burntServe, replayed: result.replayed
  });
check(result && result.servedRestored && result.servedRestored.status === "served" &&
  result.freshArrival && result.freshArrival.status === "assembling" && result.freshArrival.phase === "cold" &&
  !result.freshArrival.recipeComplete, "Continue restores the durable meal while a fresh arrival resets stew consistently",
  result && { restored: result.servedRestored, fresh: result.freshArrival });

if (failures) process.exit(1);
console.log("Campsite stew assertions passed.");
