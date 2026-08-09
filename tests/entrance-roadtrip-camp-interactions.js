#!/usr/bin/env node
// Abraham Lake camp objects react independently without disturbing the parked composition.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function click(node) {
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        window.__entranceRoadtripDevStart();
        window.__entranceRoadtripSetRoute("camp", 0);

        var lake = document.getElementById("entrance-roadtrip-camp-lake");
        var ripples = document.getElementById("entrance-roadtrip-camp-ripples");
        var fish = document.getElementById("entrance-roadtrip-camp-fish");
        report.randomAngles = [
          window.__entranceRoadtripCampStone(2, false).angle,
          window.__entranceRoadtripCampStone(2, false).angle
        ];
        ripples.replaceChildren();
        report.skips = [
          window.__entranceRoadtripCampStone(2, false, -60),
          window.__entranceRoadtripCampStone(3, false, 0),
          window.__entranceRoadtripCampStone(4, true, 60)
        ];
        report.lake = {
          title: lake.getAttribute("title"),
          lastSkips: ripples.getAttribute("data-last-skips"),
          lastFish: ripples.getAttribute("data-last-fish"),
          rippleCount: ripples.children.length,
          fishCount: fish.children.length,
          stones: document.querySelectorAll(".entrance-roadtrip-camp-stone").length,
          trajectory: Array.prototype.map.call(ripples.children, function (ripple) {
            return [Number(ripple.getAttribute("cx")), Number(ripple.getAttribute("cy")),
              Number(ripple.getAttribute("rx"))];
          }).slice(-4)
        };

        var poplars = document.querySelectorAll("#entrance-roadtrip-camp-aspen>g");
        var poplar = poplars[0];
        click(poplar);
        var poplarEyes = poplar.querySelector(".entrance-roadtrip-camp-poplar-eyes");
        var individualEyes = poplarEyes.querySelectorAll(".entrance-roadtrip-camp-poplar-eye");
        var poplarGeometry = Array.prototype.map.call(poplars, function (cluster) {
          var paths = cluster.querySelectorAll(":scope>path");
          return {
            trunks: paths[0].getAttribute("d"),
            canopy: paths[1].getAttribute("d"),
            eyeCenters: Array.prototype.map.call(
              cluster.querySelectorAll(".entrance-roadtrip-camp-poplar-eye"), function (eye) {
                var box = eye.getBBox();
                return [box.x + box.width / 2, box.y + box.height / 2];
              })
          };
        });
        report.poplar = {
          triggered: poplarEyes.classList.contains("wiggling"),
          wrapperAnimation: getComputedStyle(poplarEyes).animationName,
          eyeAnimations: Array.prototype.map.call(individualEyes, function (eye) {
            return getComputedStyle(eye).animationName;
          }),
          eyeCenters: Array.prototype.map.call(individualEyes, function (eye) {
            var box = eye.getBBox();
            return [box.x + box.width / 2, box.y + box.height / 2];
          }),
          distinctGeometry: poplarGeometry[0].trunks !== poplarGeometry[1].trunks &&
            poplarGeometry[0].canopy !== poplarGeometry[1].canopy &&
            JSON.stringify(poplarGeometry[0].eyeCenters) !== JSON.stringify(poplarGeometry[1].eyeCenters),
          otherClusterIdle: !poplars[1].querySelector(".entrance-roadtrip-camp-poplar-eyes")
            .classList.contains("wiggling")
        };

        var pines = document.querySelectorAll("#entrance-roadtrip-camp-pines>.entrance-roadtrip-camp-pine");
        click(pines[0]);
        var firstCone = pines[0].querySelector(".entrance-roadtrip-camp-pinecone");
        report.pines = {
          count: pines.length,
          noTabTargets: Array.prototype.every.call(pines, function (pine) {
            return !pine.hasAttribute("tabindex") && pine.getAttribute("title") === "Drop a pinecone";
          }),
          clickDrop: !!firstCone,
          keptWithTarget: !!firstCone && firstCone.parentNode === pines[0],
          animation: firstCone && getComputedStyle(firstCone).animationName,
          drop: firstCone && firstCone.style.getPropertyValue("--camp-pinecone-drop")
        };

        var marketa = document.getElementById("entrance-roadtrip-camp-marketa");
        var behdad = document.getElementById("entrance-roadtrip-camp-behdad");
        click(marketa.querySelector(".entrance-roadtrip-camp-character-head"));
        click(behdad.querySelector(".entrance-roadtrip-camp-character-head"));
        report.people = {
          marketa: marketa.querySelector(".entrance-roadtrip-camp-character-head").classList.contains("laughing"),
          behdad: behdad.querySelector(".entrance-roadtrip-camp-character-head").classList.contains("laughing")
        };

        var tent = document.getElementById("entrance-roadtrip-camp-tent");
        var mamaBear = document.getElementById("entrance-roadtrip-camp-mama-bear");
        var mamaBearRect = mamaBear && mamaBear.getBoundingClientRect();
        var campsiteRect = document.getElementById("entrance-roadtrip-camp").getBoundingClientRect();
        var bearHuffs = 0;
        window.__entranceRoadtripCampBearHuff = function () { bearHuffs++; };
        click(mamaBear);
        var mamaHead = mamaBear.querySelector(".entrance-roadtrip-camp-mama-head");
        var bearCub = mamaBear.querySelector(".entrance-roadtrip-camp-bear-cub");
        var bearTriggered = mamaBear.classList.contains("reacting");
        var headAnimation = getComputedStyle(mamaHead).animationName;
        var cubAnimation = getComputedStyle(bearCub).animationName;
        mamaHead.dispatchEvent(new AnimationEvent("animationend", {
          animationName: "entrance-roadtrip-camp-bear-sniff", bubbles: true
        }));
        var bearCleared = !mamaBear.classList.contains("reacting");
        report.mamaBear = {
          present: !!mamaBear,
          noTabTarget: mamaBear && !mamaBear.hasAttribute("tabindex"),
          inFrontOfPines: mamaBear && !!(pines[0].parentNode.compareDocumentPosition(mamaBear) & Node.DOCUMENT_POSITION_FOLLOWING),
          behindCamp: mamaBear && !!(mamaBear.compareDocumentPosition(tent) & Node.DOCUMENT_POSITION_FOLLOWING),
          width: mamaBear && mamaBear.getBBox().width,
          leftShore: mamaBearRect && (mamaBearRect.left - campsiteRect.left) / campsiteRect.width < .3,
          triggered: bearTriggered,
          headAnimation: headAnimation,
          cubAnimation: cubAnimation,
          cleared: bearCleared,
          huffs: bearHuffs
        };
        var campMushroom = document.getElementById("entrance-roadtrip-camp-trip-mushroom");
        click(campMushroom);
        var campMushroomTrip = window.__tripState();
        report.mushroom = {
          present: !!campMushroom,
          aboveCar: !!(document.getElementById("entrance-roadtrip-camp-porsche")
            .compareDocumentPosition(campMushroom) & Node.DOCUMENT_POSITION_FOLLOWING),
          wobbling: campMushroom.classList.contains("wobbling"),
          animation: getComputedStyle(campMushroom.querySelector(".entrance-roadtrip-camp-trip-mushroom-inner")).animationName,
          sceneAnimation: getComputedStyle(document.getElementById("entrance-room")).animationName,
          ridgeAnimation: getComputedStyle(document.getElementById("entrance-roadtrip-camp-ridge")).animationName,
          lakeAnimation: getComputedStyle(document.getElementById("entrance-roadtrip-camp-lake")).animationName,
          waveAnimation: getComputedStyle(document.getElementById("entrance-roadtrip-camp-lake-waves")).animationName,
          starAnimation: getComputedStyle(document.getElementById("entrance-roadtrip-camp-trip-stars")).animationName,
          fireAnimations: Array.prototype.map.call(document.querySelectorAll(".entrance-roadtrip-camp-fire-outer,.entrance-roadtrip-camp-fire-mid,.entrance-roadtrip-camp-fire-core"), function (flame) {
            return getComputedStyle(flame).animationName;
          }),
          birdsong: window.__campTripBirdsongActive(),
          trip: campMushroomTrip,
          chemistryCard: !!document.querySelector("#molecule-layer .mol-card.mol-show"),
          plantBlooms: window.__tripBloomLoopRunning()
        };
        window.__stopTrip(true);
        click(tent);
        report.tentOpen = tent.classList.contains("open");
        tent.focus({ focusVisible: true });
        var tentFocus = getComputedStyle(tent);
        report.tentFocus = { style: tentFocus.outlineStyle, width: tentFocus.outlineWidth };
        tent.blur();

        var pot = document.getElementById("entrance-roadtrip-camp-pot");
        report.potStartsCold = !pot.classList.contains("simmering");

        marketa.querySelector(".entrance-roadtrip-camp-character-head").classList.remove("laughing");
        var fullscreenArea = document.getElementById("hunt-fullscreen-area");
        fullscreenArea.classList.add("is-fullscreen");
        click(document.getElementById("entrance-roadtrip-camp-notebook"));
        var notebookBackdrop = document.querySelector(".entrance-roadtrip-notebook-backdrop");
        report.notebook = {
          open: !!notebookBackdrop,
          hostedInFullscreen: !!notebookBackdrop && notebookBackdrop.parentNode === fullscreenArea,
          didNotAlsoWiggle: !marketa.querySelector(".entrance-roadtrip-camp-character-head").classList.contains("laughing")
        };
        document.querySelector(".entrance-roadtrip-notebook-close").click();
        fullscreenArea.classList.remove("is-fullscreen");

        window.setLang("cs");
        report.czechLakeTitle = lake.getAttribute("title");
        report.czechPineTitle = pines[0].getAttribute("title");
        window.setLang("en");
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
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

console.log("loft-day.html Abraham Lake camp interactions:");
var source = require("fs").readFileSync(require("path").join(lib.ROOT, "loft-day.html"), "utf8");
var eyeFrames = source.match(/@keyframes entrance-roadtrip-camp-eye-wiggle\{[^}]+\}[^}]+\}[^}]+\}/);
check(eyeFrames && /rotate\(/.test(eyeFrames[0]) && /scale\(/.test(eyeFrames[0]) &&
  !/translate/.test(eyeFrames[0]), "the bark eyes visibly flex in place without a lateral translation");
var result = lib.runPageSync("loft-day.html", HARNESS, 4500, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});

check(result && result.errors.length === 0, "interactions run without uncaught errors", result && result.errors);
check(result && result.skips && result.skips.map(function (row) { return row.skips; }).join(",") === "2,3,4",
  "a stone can skip exactly two, three, or four times", result && result.skips);
check(result && result.randomAngles && result.randomAngles.every(function (angle) {
  return angle >= -60 && angle <= 60;
}) && result.randomAngles[0] !== result.randomAngles[1],
  "ordinary throws randomize a continuous heading within ±60 degrees", result && result.randomAngles);
check(result && result.lake && result.lake.lastSkips === "4" && result.lake.lastFish === "true" &&
  result.lake.rippleCount === 9 && result.lake.fishCount === 1 && result.lake.stones === 0,
  "the lake paints only ripples and the occasional jumping fish", result && result.lake);
check(result && result.lake &&
  result.lake.trajectory.every(function (row, index, rows) {
    return row[2] === 9 - index && Math.abs(row[1] - (47 - index * 5)) < .01 &&
      (!index || Math.abs((row[0] - rows[index - 1][0]) - Math.sin(Math.PI / 3) * 10) < .01);
  }), "a forced +60-degree throw recedes from shore on the expected shrinking diagonal",
  result && result.lake.trajectory);
check(result && result.poplar && result.poplar.triggered && result.poplar.wrapperAnimation === "none" &&
  result.poplar.eyeAnimations.length === 3 && result.poplar.eyeAnimations.every(function (name) {
    return name === "entrance-roadtrip-camp-eye-wiggle";
  }) && new Set(result.poplar.eyeCenters.map(String)).size === 3 && result.poplar.distinctGeometry &&
  result.poplar.otherClusterIdle,
  "the distinct poplar groves keep three independent in-place bark-eye wiggles",
  result && result.poplar);
check(result && result.pines && result.pines.count === 4 && result.pines.noTabTargets &&
  result.pines.clickDrop && result.pines.keptWithTarget &&
  result.pines.animation === "entrance-roadtrip-camp-pinecone" && result.pines.drop === "69px",
  "each click-only pine stays out of the tab order and drops its cone in the tree coordinate space",
  result && result.pines);
check(result && result.people && result.people.marketa && result.people.behdad,
  "each camper gets an independent head laugh", result && result.people);
check(result && result.mamaBear && result.mamaBear.present && result.mamaBear.noTabTarget &&
  result.mamaBear.inFrontOfPines && result.mamaBear.behindCamp &&
  result.mamaBear.width > 100 && result.mamaBear.leftShore &&
  result.mamaBear.triggered && result.mamaBear.headAnimation === "entrance-roadtrip-camp-bear-sniff" &&
  result.mamaBear.cubAnimation === "entrance-roadtrip-camp-bear-peek" && result.mamaBear.cleared &&
  result.mamaBear.huffs === 1,
  "the click-only left-shore mama stays out of the tab order while she sniffs and her cub peeks",
  result && result.mamaBear);
check(result && result.mushroom && result.mushroom.present && result.mushroom.aboveCar && result.mushroom.wobbling &&
  result.mushroom.animation === "entrance-roadtrip-camp-mushroom-wobble" &&
  result.mushroom.sceneAnimation === "shrooms-trip" &&
  result.mushroom.ridgeAnimation === "entrance-roadtrip-camp-trip-mountains" &&
  result.mushroom.lakeAnimation === "entrance-roadtrip-camp-trip-lake" &&
  result.mushroom.waveAnimation === "entrance-roadtrip-camp-trip-waves" &&
  result.mushroom.starAnimation === "entrance-roadtrip-camp-trip-stars" &&
  result.mushroom.fireAnimations.join(",") === "entrance-roadtrip-camp-trip-fire-outer,entrance-roadtrip-camp-trip-fire-mid,entrance-roadtrip-camp-trip-fire-core" &&
  result.mushroom.birdsong &&
  result.mushroom.trip && result.mushroom.trip.active && result.mushroom.trip.variant === "shrooms" &&
  !result.mushroom.chemistryCard && !result.mushroom.plantBlooms,
  "the campsite mushroom bends the landscape to birdsong without chemistry or garden-plant fractals",
  result && result.mushroom);
check(result && result.tentOpen, "the tent flap opens", result && result.tentOpen);
check(result && result.tentFocus && (result.tentFocus.style === "none" || result.tentFocus.width === "0px"),
  "the focused tent never gains a visible border", result && result.tentFocus);
check(result && result.potStartsCold,
  "the hidden pot does not boil before the fire is built", result && result.potStartsCold);
check(result && result.notebook && result.notebook.open && result.notebook.hostedInFullscreen &&
  result.notebook.didNotAlsoWiggle,
  "the notebook opens inside fullscreen and remains independent from Markéta’s reaction",
  result && result.notebook);
check(result && result.czechLakeTitle === "Hodit žabku přes jezero Abraham",
  "camp interaction labels follow the active language", result && result.czechLakeTitle);
check(result && result.czechPineTitle === "Shodit šišku",
  "the pine interaction label follows the active language", result && result.czechPineTitle);

if (failures) process.exit(1);
console.log("Abraham Lake camp interaction assertions passed.");
