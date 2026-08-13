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
  var camperPointerId = 200;
  function point(node) {
    var matrix = node.getScreenCTM();
    return { x: matrix.e, y: matrix.f };
  }
  function dragCamper(id, dx, dy) {
    var person = document.getElementById(id);
    var hit = person.querySelector(".entrance-roadtrip-camp-character-drag-hit");
    var rect = hit.getBoundingClientRect();
    var pointerId = ++camperPointerId;
    var common = { bubbles: true, cancelable: true, pointerId: pointerId, pointerType: "mouse", isPrimary: true, button: 0 };
    var x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    hit.dispatchEvent(new PointerEvent("pointerdown", Object.assign({ clientX: x, clientY: y }, common)));
    person.dispatchEvent(new PointerEvent("pointermove", Object.assign({ clientX: x + dx, clientY: y + dy }, common)));
    person.dispatchEvent(new PointerEvent("pointerup", Object.assign({ clientX: x + dx, clientY: y + dy }, common)));
  }
  function trackedCamperDrag(personId, bowlId, dx, dy) {
    var person = document.getElementById(personId);
    var mover = person.querySelector(".entrance-roadtrip-camp-character-drag");
    var bowl = document.getElementById(bowlId);
    var beforeMover = point(mover), beforeBowl = point(bowl);
    dragCamper(personId, dx, dy);
    var afterMover = point(mover), afterBowl = point(bowl);
    return {
      moverDx: afterMover.x - beforeMover.x, moverDy: afterMover.y - beforeMover.y,
      bowlDx: afterBowl.x - beforeBowl.x, bowlDy: afterBowl.y - beforeBowl.y
    };
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () {
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.__goToStage("balcony");
    setTimeout(function () {
      try {
        window.__openEntranceRoom();
        document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);
        var camp = document.getElementById("entrance-roadtrip-camp");
        var crate = document.getElementById("entrance-roadtrip-camp-food-crate");
        var pot = document.getElementById("entrance-roadtrip-camp-pot");
        var sceneFood = pot.querySelector(".entrance-roadtrip-camp-pot-food");
        var sceneBrew = pot.querySelector(".entrance-roadtrip-camp-pot-brew");
        var surfaceBubble = pot.querySelector(".entrance-roadtrip-camp-pot-surface-bubble");
        function sceneItemOpacity(item) {
          return getComputedStyle(pot.querySelector('[data-stew-scene-item="' + item + '"]')).opacity;
        }
        var grill = document.getElementById("entrance-roadtrip-camp-stew-grill");
        var corn = document.getElementById("entrance-roadtrip-camp-served-corn");
        var meals = Array.from(document.querySelectorAll(".entrance-roadtrip-camp-meal"));
        function mealShown() { return meals.length === 2 && meals.every(shown); }
        var game = document.getElementById("entrance-roadtrip-stew-game");
        var cook = document.getElementById("entrance-roadtrip-stew-cook");
        var close = document.getElementById("entrance-roadtrip-stew-close");
        window.__entranceRoadtripCampFireStart();
        lightFire(function () {
          try {
            report.freshFire = {
              crate: shown(crate), pot: shown(pot), grill: shown(grill), meal: mealShown(),
              available: camp.classList.contains("stew-crate-available"),
              hiddenContinueHit: getComputedStyle(document.querySelector(".entrance-roadtrip-camp-wisdom-continue-hit")).pointerEvents === "none"
            };
            var crateRect = crate.getBoundingClientRect();
            function clickCratePoint(xRatio, yRatio) {
              var target = document.elementFromPoint(crateRect.left + crateRect.width * xRatio,
                crateRect.top + crateRect.height * yRatio);
              click(target);
            }
            clickCratePoint(.62, .62);
            report.cratePoints = { sign: { open: stew().open } };
            click(close);
            clickCratePoint(.62, .84);
            report.cratePoints.front = { open: stew().open };
            click(close);
            var freshFireCheckpoint = window.__captureCheckpointSystems().entrance;
            click(crate);
            var itemIds = Array.from(game.querySelectorAll("[data-stew-item]"))
              .map(function (node) { return node.getAttribute("data-stew-item"); }).sort();
            report.builder = {
              open: stew().open,
              items: itemIds,
              headings: Array.from(game.querySelectorAll('[data-i="entrance_roadtrip_stew_protein"],[data-i="entrance_roadtrip_stew_starch"]')).map(function (node) { return node.textContent; }),
              chooseText: /choose one/i.test(game.textContent),
              title: /camping stew/i.test(game.textContent),
              cookAboveCards: cook.getBoundingClientRect().bottom < document.querySelector('[data-stew-item="beef"]').getBoundingClientRect().top,
              lambPieces: game.querySelectorAll('[data-stew-pot-item="lamb"] .entrance-roadtrip-stew-lamb-piece').length,
              sceneLambPieces: pot.querySelectorAll('[data-stew-scene-item="lamb"] .entrance-roadtrip-stew-lamb-piece').length
            };
            window.__setLang("cs");
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
            window.__setLang("en");
            choose("chicken"); choose("beef");
            var proteinMulti = stew();
            choose("barley"); choose("pasta");
            var baseMulti = stew();
            choose("chicken"); choose("beef");
            click(cook);
            report.missing = {
              state: stew(), crate: shown(crate),
              available: camp.classList.contains("stew-crate-available"), overlay: game.classList.contains("open")
            };
            click(close);
            report.closedDraft = { state: stew(), crate: shown(crate), available: camp.classList.contains("stew-crate-available") };
            click(crate);
            report.reopenedDraft = stew();

            var brew = game.querySelector(".entrance-roadtrip-stew-pot-brew");
            var clearFill = getComputedStyle(brew).fill;
            var clearOpacity = getComputedStyle(brew).fillOpacity;
            choose("beef"); choose("pasta"); choose("chicken"); choose("barley");
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
              chickenPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="chicken"]')).opacity,
              pastaPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="pasta"]')).opacity,
              barleyPieces: getComputedStyle(game.querySelector('[data-stew-pot-item="barley"]')).opacity,
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
              grill: camp.classList.contains("stew-cooking"), corn: shown(corn), meal: mealShown(),
              caption: window.__captionKey(),
              steam: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-open-bubble")).animationName,
              sceneFood: getComputedStyle(sceneFood).opacity,
              surfaceBubble: getComputedStyle(surfaceBubble).animationName,
              checkpoint: window.__captureCheckpointSystems().entrance.drive.roadtrip.stew
            };
            click(pot);
            setTimeout(function () {
              try {
                report.rawOpen = {
                  state: stew(), food: getComputedStyle(sceneFood).opacity, brew: getComputedStyle(sceneBrew).fill,
                  brewTarget: getComputedStyle(pot).getPropertyValue("--stew-raw").trim(),
                  bubble: getComputedStyle(surfaceBubble).animationName,
                  pieces: ["beef", "chicken", "pasta", "barley", "onion", "garlic", "ginger", "carrots", "celery", "mushrooms", "salt", "pepper", "chilies", "coriander"].map(sceneItemOpacity)
                };
                click(pot);
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
                report.inspectedVisual = {
                  food: getComputedStyle(sceneFood).opacity,
                  brew: getComputedStyle(sceneBrew).fill,
                  brewOpacity: getComputedStyle(sceneBrew).opacity,
                  brewTarget: getComputedStyle(pot).getPropertyValue("--stew-warming").trim(),
                  brewTransition: getComputedStyle(sceneBrew).transitionDuration,
                  bubble: getComputedStyle(surfaceBubble).animationName,
                  pieces: ["beef", "chicken", "pasta", "barley", "onion", "garlic", "ginger", "carrots", "celery", "mushrooms", "salt", "pepper", "chilies", "coriander"].map(sceneItemOpacity),
                  pastePackages: !!pot.querySelector('[data-stew-scene-item="tomato"],[data-stew-scene-item="curry"]')
                };
                report.simmeringOpen = window.__entranceRoadtripCampStewStep(Math.max(0, 6400 - stew().elapsed));
                report.simmeringOpen.bubble = getComputedStyle(surfaceBubble).animationName;
                click(pot);
                report.closedInspection = { food: getComputedStyle(sceneFood).opacity, brew: getComputedStyle(sceneBrew).opacity };
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
                report.readyRestored = {
                  state: stew(), pot: shown(pot), grill: shown(grill), crate: shown(crate),
                  pieces: ["beef", "chicken", "pasta", "barley"].map(sceneItemOpacity)
                };
                click(pot);
                report.served = {
                  state: stew(), pot: shown(pot), grill: shown(grill), corn: shown(corn), meal: mealShown(),
                  crate: shown(crate)
                };
                report.bowlOwnership = meals.map(function (bowl) {
                  return bowl.parentElement.classList.contains("entrance-roadtrip-camp-character-drag") &&
                    !!bowl.closest(".entrance-roadtrip-camp-character");
                });
                report.bowlDrags = [
                  trackedCamperDrag("entrance-roadtrip-camp-marketa", "entrance-roadtrip-camp-marketa-meal", 90, -18),
                  trackedCamperDrag("entrance-roadtrip-camp-marketa", "entrance-roadtrip-camp-marketa-meal", -34, 22),
                  trackedCamperDrag("entrance-roadtrip-camp-behdad", "entrance-roadtrip-camp-behdad-meal", -90, -16),
                  trackedCamperDrag("entrance-roadtrip-camp-behdad", "entrance-roadtrip-camp-behdad-meal", 31, 20)
                ];
                var bowlsAfterDrag = meals.map(point);
                window.__setDayNight(true);
                report.bowlsAfterDayNight = meals.map(point);
                var servedCheckpoint = window.__captureCheckpointSystems().entrance;
                window.__restoreCheckpointSystems({ entrance: servedCheckpoint }, "afterStage");
                report.servedRestored = {
                  state: stew(), pot: shown(pot), grill: shown(grill), corn: shown(corn), meal: mealShown(),
                  bowlsBefore: bowlsAfterDrag, bowlsAfter: meals.map(point)
                };

                window.__entranceRoadtripCampFireReplay();
                report.earlyFireClick = { state: stew(), pot: shown(pot), grill: shown(grill), corn: shown(corn), meal: mealShown(), crate: shown(crate) };
                window.__restoreCheckpointSystems({ entrance: freshFireCheckpoint }, "afterStage");
                report.freshFireRestored = { state: stew(), crate: shown(crate), pot: shown(pot), grill: shown(grill), meal: mealShown() };
                click(crate);
                choose("tofu"); choose("barley");
                var draftCheckpoint = window.__captureCheckpointSystems().entrance;
                window.__restoreCheckpointSystems({ entrance: draftCheckpoint }, "afterStage");
                report.draftRestored = { saved: draftCheckpoint.drive.roadtrip.stew, state: stew(), crate: shown(crate), overlay: game.classList.contains("open") };
                click(crate);
                fullRequired("chicken", "barley");
                ["carrots", "mushrooms", "chilies", "coriander"].forEach(choose);
                click(cook);
                window.__entranceRoadtripCampStewStep(Math.max(0, 12000 - stew().elapsed));
                var beforeNotebook = stew();
                click(document.getElementById("entrance-roadtrip-camp-notebook"));
                report.notebookPause = {
                  before: beforeNotebook,
                  open: !!document.querySelector(".entrance-roadtrip-notebook-backdrop"),
                  whileOpen: window.__entranceRoadtripCampStewStep(33000)
                };
                click(document.querySelector(".entrance-roadtrip-notebook-close"));
                report.notebookPause.closed = !document.querySelector(".entrance-roadtrip-notebook-backdrop");
                window.__entranceRoadtripCampStewStep(Math.max(0, 44999 - stew().elapsed));
                report.beforeOvercooked = stew();
                window.__entranceRoadtripCampStewStep(1);
                var overcookedCheckpoint = window.__captureCheckpointSystems().entrance;
                    setTimeout(function () {
                      try {
                        report.overcooked = {
                          state: stew(), caption: window.__captionKey(), pot: shown(pot), grill: shown(grill), crate: shown(crate),
                          lid: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-lid-piece")).animationName,
                          steam: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-open-bubble")).animationName,
                          surfaceBubble: getComputedStyle(surfaceBubble).animationName,
                          food: getComputedStyle(sceneFood).opacity, brew: getComputedStyle(sceneBrew).fill,
                          brewTransition: getComputedStyle(sceneBrew).transitionDuration,
                          glaze: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-burn-glaze")).opacity,
                          glazeTransition: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-burn-glaze")).transitionDuration,
                          scorch: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-scorch")).opacity,
                          scorchTransition: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-scorch")).transitionDuration,
                          pieces: ["chicken", "barley", "carrots", "mushrooms", "chilies", "coriander"].map(sceneItemOpacity),
                          saved: overcookedCheckpoint.drive.roadtrip.stew
                        };
                        window.__restoreCheckpointSystems({ entrance: overcookedCheckpoint }, "afterStage");
                        report.overcookedRestored = {
                          state: stew(), food: getComputedStyle(sceneFood).opacity, brew: getComputedStyle(sceneBrew).fill,
                          glaze: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-burn-glaze")).opacity,
                          scorch: getComputedStyle(pot.querySelector(".entrance-roadtrip-camp-pot-scorch")).opacity,
                          pieces: ["chicken", "barley", "carrots", "mushrooms", "chilies", "coriander"].map(sceneItemOpacity)
                        };
                        click(pot);
                        report.overcookReset = {
                          state: stew(), pot: shown(pot), grill: shown(grill), crate: shown(crate), corn: shown(corn), meal: mealShown(),
                          food: getComputedStyle(sceneFood).opacity,
                          recipeClasses: pot.classList.contains("has-protein-chicken") || pot.classList.contains("has-starch-barley") || pot.classList.contains("has-carrots")
                        };
                      } catch (error) { report.errors.push(String(error && error.stack || error)); }
                      finish();
                    }, 700);
                  } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
                }, 3200);
              } catch (error) { report.errors.push(String(error && error.stack || error)); finish(); }
            }, 600);
            report.multi = { proteins: proteinMulti, bases: baseMulti };
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
function samePoint(a, b) {
  return !!(a && b && Math.abs(a.x - b.x) < .5 && Math.abs(a.y - b.y) < .5);
}

console.log("loft-day.html campsite stew:");
var result = lib.runPageSync("loft-day.html", HARNESS, 12000, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=20:00",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the real stew interaction loop has no uncaught errors", result && result.errors);
check(result && result.freshFire && result.freshFire.crate && result.freshFire.available && result.freshFire.hiddenContinueHit &&
  !result.freshFire.pot && !result.freshFire.grill && !result.freshFire.meal,
  "a fresh lit fire is bare and exposes only the food crate", result && result.freshFire);
check(result && result.cratePoints && result.cratePoints.sign.open && result.cratePoints.front.open,
  "the STEW sign and the crate front both open Cook through real hit-testing", result && result.cratePoints);
var exactItems = ["barley", "beans", "beef", "carrots", "celery", "chicken", "chilies", "coriander", "curry", "garlic", "ginger", "lamb", "mushrooms", "onion", "pasta", "pepper", "pork", "potatoes", "rice", "salt", "tofu", "tomato"];
check(result && result.builder && result.builder.open && JSON.stringify(result.builder.items) === JSON.stringify(exactItems) &&
  JSON.stringify(result.builder.headings) === JSON.stringify(["PROTEIN", "BASE"]) && !result.builder.chooseText &&
  !result.builder.title && result.builder.cookAboveCards && result.builder.czech &&
  result.builder.lambPieces === 2 && result.builder.sceneLambPieces === 2 &&
  JSON.stringify(result.builder.czech.headings) === JSON.stringify(["PROTEIN", "ZÁKLAD"]) &&
  JSON.stringify([result.builder.czech.onion, result.builder.czech.garlic, result.builder.czech.ginger,
    result.builder.czech.carrots, result.builder.czech.celery, result.builder.czech.mushrooms,
    result.builder.czech.coriander]) ===
    JSON.stringify(["Cibule", "Česnek", "Zázvor", "Mrkev", "Celer", "Houby", "Koriandr"]),
  "the compact builder has the exact 22-card bilingual palette, final headings, and top Cook action", result && result.builder);
check(result && result.multi &&
  JSON.stringify(result.multi.proteins.proteins) === JSON.stringify(["chicken", "beef"]) &&
  JSON.stringify(result.multi.bases.bases) === JSON.stringify(["barley", "pasta"]),
  "proteins and bases toggle independently without replacing earlier selections", result && result.multi);
check(result && result.missing && result.missing.state.status === "assembling" && !result.missing.state.recipeComplete &&
  result.missing.crate && result.missing.available && result.missing.overlay,
  "the real Cook button refuses only a missing required item without hiding the crate", result && result.missing);
check(result && result.closedDraft && !result.closedDraft.state.open && result.closedDraft.state.phase === "cold" &&
  result.closedDraft.crate && result.reopenedDraft && result.reopenedDraft.open && !result.reopenedDraft.recipeComplete,
  "closing and reopening keeps the crate but starts an empty draft", result && { closed: result.closedDraft, reopened: result.reopenedDraft });
check(result && result.assembly && result.assembly.state.recipeComplete && result.assembly.state.tomato && result.assembly.state.curry &&
  JSON.stringify(result.assembly.state.proteins) === JSON.stringify(["beef", "chicken"]) &&
  JSON.stringify(result.assembly.state.bases) === JSON.stringify(["pasta", "barley"]) &&
  result.assembly.state.onion && result.assembly.state.garlic && result.assembly.state.ginger &&
  result.assembly.state.carrots && result.assembly.state.celery && result.assembly.state.mushrooms &&
  result.assembly.state.salt && result.assembly.state.pepper && result.assembly.state.chilies && result.assembly.state.coriander &&
  result.assembly.clearFill === "rgb(191, 228, 234)" && Number(result.assembly.clearOpacity) < .7 &&
  result.assembly.plainFill === "rgb(117, 82, 60)" && result.assembly.curryFill === "rgb(166, 111, 46)" &&
  result.assembly.tomatoFill === "rgb(153, 76, 62)" && result.assembly.tomatoCurryFill === "rgb(166, 80, 56)" &&
  [result.assembly.beefPieces, result.assembly.chickenPieces, result.assembly.pastaPieces,
    result.assembly.barleyPieces, result.assembly.onionPieces,
    result.assembly.garlicPieces, result.assembly.gingerPieces, result.assembly.carrotPieces,
    result.assembly.celeryPieces, result.assembly.mushroomPieces, result.assembly.corianderPieces].every(function (opacity) { return opacity === "1"; }) &&
  !result.assembly.packagedPaste,
  "the cutaway begins with translucent blue water, colours the broth, and mixes every solid without paste packaging", result && result.assembly);
check(result && result.cookImmediate && result.cookImmediate.state.status === "cooking" && result.cookImmediate.state.phase === "raw" &&
  !result.cookImmediate.overlay && !result.cookImmediate.crate && !result.cookImmediate.available && result.cookImmediate.pot &&
  result.cookImmediate.grill && !result.cookImmediate.corn && !result.cookImmediate.meal &&
  result.cookImmediate.caption === "entrance_roadtrip_stew_cooking_feedback" && result.cookImmediate.steam === "none" &&
  result.cookImmediate.sceneFood === "0" && result.cookImmediate.surfaceBubble === "none" &&
  result.cookImmediate.checkpoint && result.cookImmediate.checkpoint.status === "cooking" &&
  result.cookImmediate.checkpoint.onion && result.cookImmediate.checkpoint.garlic &&
  result.cookImmediate.checkpoint.ginger && result.cookImmediate.checkpoint.carrots &&
  result.cookImmediate.checkpoint.celery && result.cookImmediate.checkpoint.mushrooms &&
  result.cookImmediate.checkpoint.coriander &&
  JSON.stringify(result.cookImmediate.checkpoint.proteins) === JSON.stringify(["beef", "chicken"]) &&
  JSON.stringify(result.cookImmediate.checkpoint.bases) === JSON.stringify(["pasta", "barley"]),
  "the visible Cook button commits every selected protein, base, and add-in, closes assembly, and moves the pot onto the grill", result && result.cookImmediate);
check(result && result.rawOpen && result.rawOpen.state.phase === "raw" && result.rawOpen.state.lidOpen &&
  result.rawOpen.food === "1" && result.rawOpen.brewTarget === "#a65038" && result.rawOpen.bubble === "none" &&
  result.rawOpen.pieces.every(function (opacity) { return opacity === "1"; }),
  "a newly placed raw pot reveals the full recipe but no boiling when its lid is lifted", result && result.rawOpen);
check(result && result.afterRealTime && result.afterRealTime.state.status === "cooking" && result.afterRealTime.state.elapsed >= 1000 &&
  result.afterRealTime.pot && result.afterRealTime.grill && result.warmed && result.warmed.phase === "warming" &&
  result.warmed.steam === "entrance-roadtrip-camp-pot-first-wisp",
  "real attended time advances the batch and its warming phase shows one faint wisp", result && { real: result.afterRealTime, warmed: result.warmed });
check(result && result.inspected && result.inspected.lidOpen && result.ready && result.ready.phase === "ready" &&
  result.ready.lidOpen &&
  result.ready.caption === "entrance_roadtrip_stew_ready_feedback" && result.ready.bubbles === "entrance-roadtrip-camp-bubble",
  "a pre-ready pot click inspects the lid and the ready moment opens it with its caption/bubbles", result && { inspected: result.inspected, ready: result.ready });
check(result && result.inspectedVisual && result.inspectedVisual.food === "1" && result.inspectedVisual.brewOpacity === "1" &&
  result.inspectedVisual.brewTarget === "#b05a35" && result.inspectedVisual.brewTransition === "0.5s" &&
  result.inspectedVisual.bubble === "entrance-roadtrip-camp-pot-gentle-bubble" &&
  result.inspectedVisual.pieces.every(function (opacity) { return opacity === "1"; }) && !result.inspectedVisual.pastePackages &&
  result.simmeringOpen && result.simmeringOpen.phase === "simmering" &&
  result.simmeringOpen.bubble === "entrance-roadtrip-camp-pot-boil-bubble" &&
  result.closedInspection && result.closedInspection.food === "0" && result.closedInspection.brew === "0",
  "lifting the scene lid reveals the committed recipe and phase bubbles; closing it hides the interior",
  result && { warming: result.inspectedVisual, simmering: result.simmeringOpen, closed: result.closedInspection });
check(result && result.fireOutRestored && !result.fireOutRestored.before.fireLit &&
  result.fireOutRestored.before.phase === "cold" && result.fireOutRestored.before.status === "assembling" &&
  result.fireOutRestored.after.elapsed === 0 && !result.fireOutRestored.pot && !result.fireOutRestored.grill && !result.fireOutRestored.crate &&
  result.readyRestored && result.readyRestored.state.phase === "ready" && result.readyRestored.state.lidOpen &&
  JSON.stringify(result.readyRestored.state.proteins) === JSON.stringify(["beef", "chicken"]) &&
  JSON.stringify(result.readyRestored.state.bases) === JSON.stringify(["pasta", "barley"]) &&
  result.readyRestored.pieces.every(function (opacity) { return opacity === "1"; }) &&
  result.readyRestored.pot && result.readyRestored.grill && !result.readyRestored.crate,
  "a fire-out checkpoint hard-resets food while a lit checkpoint restores committed cooking", result && { fireOut: result.fireOutRestored, ready: result.readyRestored });
check(result && result.served && result.served.state.status === "served" && !result.served.pot && result.served.grill &&
  result.served.corn && result.served.meal && !result.served.crate &&
  result.servedRestored && result.servedRestored.state.status === "served" && !result.servedRestored.pot && result.servedRestored.grill &&
  result.servedRestored.corn && result.servedRestored.meal,
  "the real ready-pot click serves bowls and corn, and the payoff restores durably", result && { served: result.served, restored: result.servedRestored });
check(result && result.bowlOwnership && result.bowlOwnership.every(Boolean) && result.bowlDrags &&
  result.bowlDrags.every(function (move) {
    return Math.abs(move.moverDx) + Math.abs(move.moverDy) > 1 &&
      Math.abs(move.moverDx - move.bowlDx) < .5 && Math.abs(move.moverDy - move.bowlDy) < .5;
  }) && result.bowlsAfterDayNight && result.servedRestored &&
  result.servedRestored.bowlsBefore.every(function (before, index) {
    return samePoint(before, result.bowlsAfterDayNight[index]) && samePoint(before, result.servedRestored.bowlsAfter[index]);
  }),
  "each served bowl inherits its camper's repeated drags and remains aligned through day/night and checkpoint restore",
  result && { ownership: result.bowlOwnership, drags: result.bowlDrags, dayNight: result.bowlsAfterDayNight, restored: result.servedRestored });
check(result && result.earlyFireClick && result.earlyFireClick.state.status === "served" &&
  result.earlyFireClick.state.fireLit && result.earlyFireClick.grill && result.earlyFireClick.corn &&
  result.earlyFireClick.meal && !result.earlyFireClick.crate && result.freshFireRestored &&
  result.freshFireRestored.state.phase === "cold" && result.freshFireRestored.state.fireLit &&
  result.freshFireRestored.crate && !result.freshFireRestored.pot && !result.freshFireRestored.grill &&
  !result.freshFireRestored.meal,
  "an early fire click preserves dinner, while a fresh-lit checkpoint restores the empty crate",
  result && { clicked: result.earlyFireClick, restored: result.freshFireRestored });
check(result && result.draftRestored && result.draftRestored.saved &&
  result.draftRestored.saved.protein === "tofu" && result.draftRestored.saved.starch === "barley" &&
  JSON.stringify(result.draftRestored.saved.proteins) === JSON.stringify(["tofu"]) &&
  JSON.stringify(result.draftRestored.saved.bases) === JSON.stringify(["barley"]) &&
  !result.draftRestored.state.open &&
  result.draftRestored.state.phase === "raw" && result.draftRestored.state.recipeComplete &&
  result.draftRestored.crate && !result.draftRestored.overlay,
  "checkpoint restore preserves a partial draft while leaving its overlay closed", result && result.draftRestored);
check(result && result.notebookPause && result.notebookPause.open && result.notebookPause.closed &&
  result.notebookPause.before.status === "cooking" && result.notebookPause.before.phase === "ready" &&
  result.notebookPause.whileOpen.status === "cooking" &&
  result.notebookPause.whileOpen.elapsed === result.notebookPause.before.elapsed,
  "Markéta’s open notebook pauses the stew’s burn clock and closing it resumes the same batch",
  result && result.notebookPause);
check(result && result.beforeOvercooked && result.beforeOvercooked.status === "cooking" &&
  result.beforeOvercooked.phase === "ready" && result.beforeOvercooked.elapsed === 44999,
  "stew remains unburned through 44.999 seconds of counted cooking time", result && result.beforeOvercooked);

check(result && result.overcooked && result.overcooked.state.status === "overcooked" && result.overcooked.state.clankActive &&
  result.overcooked.state.lidOpen &&
  result.overcooked.caption === "entrance_roadtrip_stew_overcooked_feedback" && result.overcooked.pot && result.overcooked.grill &&
  !result.overcooked.crate && result.overcooked.lid === "entrance-roadtrip-camp-overcooked-lid" &&
  result.overcooked.steam === "entrance-roadtrip-camp-pot-open-steam" &&
  result.overcooked.surfaceBubble === "entrance-roadtrip-camp-pot-frantic-bubble" && result.overcooked.food === "1" &&
  result.overcooked.brewTransition === "0.5s" && result.overcooked.glazeTransition === "0.62s" &&
  result.overcooked.scorchTransition === "0.42s" &&
  result.overcooked.pieces.every(function (opacity) { return opacity === "1"; }) && result.overcooked.saved.status === "overcooked" &&
  result.overcooked.saved.carrots && result.overcooked.saved.mushrooms && result.overcooked.saved.chilies && result.overcooked.saved.coriander &&
  result.overcookedRestored && result.overcookedRestored.state.status === "overcooked" && result.overcookedRestored.state.lidOpen &&
  result.overcookedRestored.food === "1" && result.overcookedRestored.brew === "rgb(53, 42, 36)" &&
  result.overcookedRestored.glaze === "0.54" && result.overcookedRestored.scorch === "1" &&
  result.overcookedRestored.pieces.every(function (opacity) { return opacity === "1"; }) &&
  result.overcookReset && result.overcookReset.state.phase === "cold" && !result.overcookReset.state.clankActive &&
  !result.overcookReset.pot && !result.overcookReset.grill && result.overcookReset.crate && !result.overcookReset.corn &&
  !result.overcookReset.meal && result.overcookReset.food === "0" && !result.overcookReset.recipeClasses,
  "overcooking restores as a burned, frantic open pot and a real click clears every recipe cue",
  result && { overcooked: result.overcooked, restored: result.overcookedRestored, reset: result.overcookReset });

if (failures) process.exit(1);
console.log("Campsite stew assertions passed.");
