#!/usr/bin/env node
// Campsite stew assembly, real Cook/pot clicks, attended phases, persistence, and replay.
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
  function choose(item) { click(document.querySelector('[data-stew-item="' + item + '"]')); }
  function fullRequired(protein, starch) { choose(protein); choose(starch); }
  function shown(node) {
    var css = getComputedStyle(node);
    return css.display !== "none" && css.visibility !== "hidden" && Number(css.opacity) > .01;
  }
  function lightFire(done) {
    window.__entranceRoadtripCampFirePlace("tinder");
    window.__entranceRoadtripCampFirePlace("twigs");
    window.__entranceRoadtripCampFirePlace("stack");
    window.__entranceRoadtripCampFireLight();
    setTimeout(done, 2150);
  }
  function syntheticTouchDrag(node, target) {
    var from = node.getBoundingClientRect(), to = target.getBoundingClientRect();
    var common = { bubbles: true, cancelable: true, pointerId: 77, pointerType: "touch", isPrimary: true, button: 0 };
    node.dispatchEvent(new PointerEvent("pointerdown", Object.assign({ clientX: from.left + 5, clientY: from.top + 5 }, common)));
    document.dispatchEvent(new PointerEvent("pointermove", Object.assign({ clientX: to.left + to.width / 2, clientY: to.top + to.height / 2 }, common)));
    document.dispatchEvent(new PointerEvent("pointerup", Object.assign({ clientX: to.left + to.width / 2, clientY: to.top + to.height / 2 }, common)));
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
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
        var camp = document.getElementById("entrance-roadtrip-camp");
        var crate = document.getElementById("entrance-roadtrip-camp-food-crate");
        var pot = document.getElementById("entrance-roadtrip-camp-pot");
        var grill = document.getElementById("entrance-roadtrip-camp-stew-grill");
        var corn = document.getElementById("entrance-roadtrip-camp-served-corn");
        var meal = document.getElementById("entrance-roadtrip-camp-meal");
        var game = document.getElementById("entrance-roadtrip-stew-game");
        var cook = document.getElementById("entrance-roadtrip-stew-cook");
        var close = document.getElementById("entrance-roadtrip-stew-close");
        window.__entranceRoadtripCampFireStart();
        lightFire(function () {
          try {
            report.freshFire = {
              crate: shown(crate), pot: shown(pot), grill: shown(grill), meal: shown(meal),
              available: camp.classList.contains("stew-crate-available")
            };
            click(crate);
            var itemIds = Array.from(game.querySelectorAll("[data-stew-item]"))
              .map(function (node) { return node.getAttribute("data-stew-item"); }).sort();
            report.builder = {
              open: stew().open,
              items: itemIds,
              headings: Array.from(game.querySelectorAll('[data-i="entrance_roadtrip_stew_protein"],[data-i="entrance_roadtrip_stew_starch"]')).map(function (node) { return node.textContent; }),
              chooseText: /choose one/i.test(game.textContent),
              title: /camping stew/i.test(game.textContent),
              cookAboveCards: cook.getBoundingClientRect().bottom < document.querySelector('[data-stew-item="beef"]').getBoundingClientRect().top
            };
            window.setLang("cs");
            report.builder.czech = {
              headings: Array.from(game.querySelectorAll('[data-i="entrance_roadtrip_stew_protein"],[data-i="entrance_roadtrip_stew_starch"]')).map(function (node) { return node.textContent; }),
              onion: document.querySelector('[data-i="entrance_roadtrip_stew_onion"]').textContent,
              garlic: document.querySelector('[data-i="entrance_roadtrip_stew_garlic"]').textContent,
              ginger: document.querySelector('[data-i="entrance_roadtrip_stew_ginger"]').textContent,
              carrots: document.querySelector('[data-i="entrance_roadtrip_stew_carrots"]').textContent,
              celery: document.querySelector('[data-i="entrance_roadtrip_stew_celery"]').textContent,
              mushrooms: document.querySelector('[data-i="entrance_roadtrip_stew_mushrooms"]').textContent,
              coriander: document.querySelector('[data-i="entrance_roadtrip_stew_coriander"]').textContent
            };
            window.setLang("en");
            choose("chicken"); choose("beef");
            var proteinSwap = stew();
            choose("barley"); choose("pasta");
            var starchSwap = stew();
            choose("pasta");
            click(cook);
            report.missing = {
              state: stew(), caption: window.__captionKey(), crate: shown(crate),
              available: camp.classList.contains("stew-crate-available"), overlay: game.classList.contains("open")
            };
            click(close);
            report.closedDraft = { state: stew(), crate: shown(crate), available: camp.classList.contains("stew-crate-available") };
            click(crate);
            report.reopenedDraft = stew();

            var brew = game.querySelector(".entrance-roadtrip-stew-pot-brew");
            var clearFill = getComputedStyle(brew).fill;
            var clearOpacity = getComputedStyle(brew).fillOpacity;
            choose("beef"); choose("pasta");
            var plainFill = getComputedStyle(brew).fill;
            choose("curry");
            var curryFill = getComputedStyle(brew).fill;
            choose("tomato");
            var tomatoCurryFill = getComputedStyle(brew).fill;
            choose("curry");
            var tomatoFill = getComputedStyle(brew).fill;
            choose("curry");
            syntheticTouchDrag(document.querySelector('[data-stew-item="onion"]'), document.getElementById("entrance-roadtrip-stew-pot-drop"));
            ["garlic", "ginger", "carrots", "celery", "mushrooms", "salt", "pepper", "chilies", "coriander"].forEach(choose);
            report.assembly = {
              state: stew(), clearFill: clearFill, clearOpacity: clearOpacity, plainFill: plainFill,
              curryFill: curryFill, tomatoFill: tomatoFill, tomatoCurryFill: tomatoCurryFill,
              beefPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="beef"]')).opacity,
              pastaPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="pasta"]')).opacity,
              onionPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="onion"]')).opacity,
              garlicPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="garlic"]')).opacity,
              gingerPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="ginger"]')).opacity,
              carrotPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="carrots"]')).opacity,
              celeryPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="celery"]')).opacity,
              mushroomPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="mushrooms"]')).opacity,
              corianderPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="coriander"]')).opacity,
              packagedPaste: !!game.querySelector('[data-stew-pot-item="tomato"],[data-stew-pot-item="curry"]')
            };
            click(cook);
            report.cookImmediate = {
              state: stew(), overlay: game.classList.contains("open"), crate: shown(crate),
              available: camp.classList.contains("stew-crate-available"), pot: pot.classList.contains("has-stew"),
              grill: camp.classList.contains("stew-cooking"), corn: shown(corn), meal: shown(meal),
              caption: window.__captionKey(),
              steam: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-open-bubble")).animationName,
              checkpoint: window.__captureCheckpointSystems().entrance.drive.roadtrip.stew
            };
            setTimeout(function () {
              try {
                report.afterRealTime = {
                  state: stew(),
                  steam: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-open-bubble")).animationName,
                  pot: shown(pot), grill: shown(grill)
                };
                report.warmed = window.__entranceRoadtripCampStewStep(Math.max(0, 2900 - stew().elapsed));
                report.warmed.steam = getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-open-bubble")).animationName;
                click(pot);
                report.inspected = stew();
                click(pot);
                report.ready = window.__entranceRoadtripCampStewStep(Math.max(0, 11600 - stew().elapsed));
                report.ready.caption = window.__captionKey();
                report.ready.bubbles = getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-bubble")).animationName;
                var readyCheckpoint = window.__captureCheckpointSystems().entrance;
                var fireOutCheckpoint = JSON.parse(JSON.stringify(readyCheckpoint));
                fireOutCheckpoint.drive.roadtrip.campFireLit = false;
                window.__restoreCheckpointSystems({ entrance: fireOutCheckpoint }, "afterStage");
                var resetBefore = stew();
                report.fireOutRestored = { before: resetBefore, after: window.__entranceRoadtripCampStewStep(4000), pot: shown(pot), grill: shown(grill), crate: shown(crate) };
                window.__restoreCheckpointSystems({ entrance: readyCheckpoint }, "afterStage");
                report.readyRestored = { state: stew(), pot: shown(pot), grill: shown(grill), crate: shown(crate) };
                click(pot);
                report.served = {
                  state: stew(), pot: shown(pot), grill: shown(grill), corn: shown(corn), meal: shown(meal),
                  crate: shown(crate), caption: window.__captionKey()
                };
                var servedCheckpoint = window.__captureCheckpointSystems().entrance;
                window.__restoreCheckpointSystems({ entrance: servedCheckpoint }, "afterStage");
                report.servedRestored = { state: stew(), pot: shown(pot), grill: shown(grill), corn: shown(corn), meal: shown(meal) };

                window.__entranceRoadtripCampFireReplay();
                report.extinguished = { state: stew(), pot: shown(pot), grill: shown(grill), corn: shown(corn), meal: shown(meal), crate: shown(crate) };
                window.__entranceRoadtripCampFireReplay();
                report.rebuild = { state: stew(), pot: shown(pot), grill: shown(grill), corn: shown(corn), meal: shown(meal), crate: shown(crate) };
                lightFire(function () {
                  try {
                    report.relit = { state: stew(), crate: shown(crate), pot: shown(pot), grill: shown(grill), meal: shown(meal) };
                    click(crate);
                    choose("tofu"); choose("barley"); choose("onion");
                    var draftCheckpoint = window.__captureCheckpointSystems().entrance;
                    window.__restoreCheckpointSystems({ entrance: draftCheckpoint }, "afterStage");
                    report.draftRestored = { saved: draftCheckpoint.drive.roadtrip.stew, state: stew(), crate: shown(crate), overlay: game.classList.contains("open") };
                    click(crate);
                    fullRequired("chicken", "barley");
                    click(cook);
                    window.__entranceRoadtripCampStewStep(19000);
                    report.overcooked = {
                      state: stew(), caption: window.__captionKey(), pot: shown(pot), grill: shown(grill), crate: shown(crate),
                      lid: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-lid-piece")).animationName,
                      steam: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-open-bubble")).animationName,
                      saved: window.__captureCheckpointSystems().entrance.drive.roadtrip.stew
                    };
                    click(pot);
                    report.overcookReset = { state: stew(), pot: shown(pot), grill: shown(grill), crate: shown(crate), corn: shown(corn), meal: shown(meal) };
                  } catch (error) { report.errors.push(String(error && error.stack || error)); }
                  finish();
                });
              } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
            }, 3200);
            report.swaps = { protein: proteinSwap, starch: starchSwap };
          } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
        });
      } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
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
var result = lib.runPageSync("rsvp.html", HARNESS, 12000, {
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=20:00#play",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the real stew interaction loop has no uncaught errors", result && result.errors);
check(result && result.freshFire && result.freshFire.crate && result.freshFire.available &&
  !result.freshFire.pot && !result.freshFire.grill && !result.freshFire.meal,
  "a fresh lit fire is bare and exposes only the food crate", result && result.freshFire);
var exactItems = ["barley", "beans", "beef", "carrots", "celery", "chicken", "chilies", "coriander", "curry", "garlic", "ginger", "lamb", "mushrooms", "onion", "pasta", "pepper", "pork", "potatoes", "rice", "salt", "tofu", "tomato"];
check(result && result.builder && result.builder.open && JSON.stringify(result.builder.items) === JSON.stringify(exactItems) &&
  JSON.stringify(result.builder.headings) === JSON.stringify(["PROTEIN", "BASE"]) && !result.builder.chooseText &&
  !result.builder.title && result.builder.cookAboveCards && result.builder.czech &&
  JSON.stringify(result.builder.czech.headings) === JSON.stringify(["BÍLKOVINA", "ZÁKLAD"]) &&
  JSON.stringify([result.builder.czech.onion, result.builder.czech.garlic, result.builder.czech.ginger,
    result.builder.czech.carrots, result.builder.czech.celery, result.builder.czech.mushrooms,
    result.builder.czech.coriander]) ===
    JSON.stringify(["Cibule", "Česnek", "Zázvor", "Mrkev", "Celer", "Houby", "Koriandr"]),
  "the compact builder has the exact 22-card bilingual palette, final headings, and top Cook action", result && result.builder);
check(result && result.swaps && result.swaps.protein.protein === "beef" && result.swaps.starch.starch === "pasta",
  "the five proteins and five bases remain mutually exclusive", result && result.swaps);
check(result && result.missing && result.missing.state.status === "assembling" && !result.missing.state.recipeComplete &&
  result.missing.caption === "entrance_roadtrip_stew_missing" && result.missing.crate && result.missing.available && result.missing.overlay,
  "the real Cook button refuses only a missing required item without hiding the crate", result && result.missing);
check(result && result.closedDraft && !result.closedDraft.state.open && result.closedDraft.state.phase === "cold" &&
  result.closedDraft.crate && result.reopenedDraft && result.reopenedDraft.open && !result.reopenedDraft.recipeComplete,
  "closing and reopening keeps the crate but starts an empty draft", result && { closed: result.closedDraft, reopened: result.reopenedDraft });
check(result && result.assembly && result.assembly.state.recipeComplete && result.assembly.state.tomato && result.assembly.state.curry &&
  result.assembly.state.onion && result.assembly.state.garlic && result.assembly.state.ginger &&
  result.assembly.state.carrots && result.assembly.state.celery && result.assembly.state.mushrooms &&
  result.assembly.state.salt && result.assembly.state.pepper && result.assembly.state.chilies && result.assembly.state.coriander &&
  result.assembly.clearFill === "rgb(191, 228, 234)" && Number(result.assembly.clearOpacity) < .7 &&
  result.assembly.plainFill === "rgb(117, 82, 60)" && result.assembly.curryFill === "rgb(166, 111, 46)" &&
  result.assembly.tomatoFill === "rgb(153, 76, 62)" && result.assembly.tomatoCurryFill === "rgb(166, 80, 56)" &&
  [result.assembly.beefPieces, result.assembly.pastaPieces, result.assembly.onionPieces,
    result.assembly.garlicPieces, result.assembly.gingerPieces, result.assembly.carrotPieces,
    result.assembly.celeryPieces, result.assembly.mushroomPieces, result.assembly.corianderPieces].every(function (opacity) { return opacity === "1"; }) &&
  !result.assembly.packagedPaste,
  "the cutaway begins with translucent blue water, colours the broth, and mixes every solid without paste packaging", result && result.assembly);
check(result && result.cookImmediate && result.cookImmediate.state.status === "cooking" && result.cookImmediate.state.phase === "raw" &&
  !result.cookImmediate.overlay && !result.cookImmediate.crate && !result.cookImmediate.available && result.cookImmediate.pot &&
  result.cookImmediate.grill && !result.cookImmediate.corn && !result.cookImmediate.meal &&
  result.cookImmediate.caption === "entrance_roadtrip_stew_cooking_feedback" && result.cookImmediate.steam === "none" &&
  result.cookImmediate.checkpoint && result.cookImmediate.checkpoint.status === "cooking" &&
  result.cookImmediate.checkpoint.onion && result.cookImmediate.checkpoint.garlic &&
  result.cookImmediate.checkpoint.ginger && result.cookImmediate.checkpoint.carrots &&
  result.cookImmediate.checkpoint.celery && result.cookImmediate.checkpoint.mushrooms &&
  result.cookImmediate.checkpoint.coriander,
  "the visible Cook button commits the assembled batch and its add-ins, closes assembly, and moves the pot onto the grill", result && result.cookImmediate);
check(result && result.afterRealTime && result.afterRealTime.state.status === "cooking" && result.afterRealTime.state.elapsed >= 1000 &&
  result.afterRealTime.pot && result.afterRealTime.grill && result.warmed && result.warmed.phase === "warming" &&
  result.warmed.steam === "entrance-roadtrip-camp-pot-first-wisp",
  "real attended time advances the batch and its warming phase shows one faint wisp", result && { real: result.afterRealTime, warmed: result.warmed });
check(result && result.inspected && result.inspected.lidOpen && result.ready && result.ready.phase === "ready" &&
  result.ready.caption === "entrance_roadtrip_stew_ready_feedback" && result.ready.bubbles === "entrance-roadtrip-camp-bubble",
  "a pre-ready pot click inspects the lid and the ready caption/bubbles arrive on the scene pot", result && { inspected: result.inspected, ready: result.ready });
check(result && result.fireOutRestored && !result.fireOutRestored.before.fireLit &&
  result.fireOutRestored.before.phase === "cold" && result.fireOutRestored.before.status === "assembling" &&
  result.fireOutRestored.after.elapsed === 0 && !result.fireOutRestored.pot && !result.fireOutRestored.grill && !result.fireOutRestored.crate &&
  result.readyRestored && result.readyRestored.state.phase === "ready" && result.readyRestored.pot && result.readyRestored.grill && !result.readyRestored.crate,
  "a fire-out checkpoint hard-resets food while a lit checkpoint restores committed cooking", result && { fireOut: result.fireOutRestored, ready: result.readyRestored });
check(result && result.served && result.served.state.status === "served" && !result.served.pot && result.served.grill &&
  result.served.corn && result.served.meal && !result.served.crate && result.served.caption === "entrance_roadtrip_stew_served_feedback" &&
  result.servedRestored && result.servedRestored.state.status === "served" && !result.servedRestored.pot && result.servedRestored.grill &&
  result.servedRestored.corn && result.servedRestored.meal,
  "the real ready-pot click serves bowls and corn, and the payoff restores durably", result && { served: result.served, restored: result.servedRestored });
check(result && result.extinguished && result.extinguished.state.phase === "cold" && !result.extinguished.pot &&
  !result.extinguished.grill && !result.extinguished.corn && !result.extinguished.meal && !result.extinguished.crate &&
  result.rebuild && result.rebuild.state.phase === "cold" && !result.rebuild.pot && !result.rebuild.grill &&
  !result.rebuild.corn && !result.rebuild.meal && !result.rebuild.crate && result.relit && result.relit.crate &&
  !result.relit.pot && !result.relit.grill && !result.relit.meal,
  "manual extinguish hard-resets dinner before rebuild, and a freshly lit fire restores the empty crate", result && { extinguished: result.extinguished, rebuild: result.rebuild, relit: result.relit });
check(result && result.draftRestored && result.draftRestored.saved === null && !result.draftRestored.state.open &&
  result.draftRestored.state.phase === "cold" && result.draftRestored.crate && !result.draftRestored.overlay,
  "checkpoint restore discards an open partial draft", result && result.draftRestored);
check(result && result.overcooked && result.overcooked.state.status === "overcooked" && result.overcooked.state.clankActive &&
  result.overcooked.caption === "entrance_roadtrip_stew_overcooked_feedback" && result.overcooked.pot && result.overcooked.grill &&
  !result.overcooked.crate && result.overcooked.lid === "entrance-roadtrip-camp-overcooked-lid" &&
  result.overcooked.steam === "entrance-roadtrip-camp-pot-open-steam" && result.overcooked.saved.status === "overcooked" &&
  result.overcookReset && result.overcookReset.state.phase === "cold" && !result.overcookReset.state.clankActive &&
  !result.overcookReset.pot && !result.overcookReset.grill && result.overcookReset.crate && !result.overcookReset.corn && !result.overcookReset.meal,
  "overcooking rattles/clanks densely and a real pot click resets to the empty crate", result && { overcooked: result.overcooked, reset: result.overcookReset });

if (failures) process.exit(1);
console.log("Campsite stew assertions passed.");
