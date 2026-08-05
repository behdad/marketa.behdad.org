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
        window.__entranceRoadtripStart();
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
          otherClusterIdle: !poplars[1].querySelector(".entrance-roadtrip-camp-poplar-eyes")
            .classList.contains("wiggling")
        };

        var marketa = document.getElementById("entrance-roadtrip-camp-marketa");
        var behdad = document.getElementById("entrance-roadtrip-camp-behdad");
        click(marketa);
        click(behdad);
        report.people = {
          marketa: marketa.querySelector(".entrance-roadtrip-camp-character-head").classList.contains("laughing"),
          behdad: behdad.querySelector(".entrance-roadtrip-camp-character-head").classList.contains("laughing")
        };

        var tent = document.getElementById("entrance-roadtrip-camp-tent");
        click(tent);
        report.tentOpen = tent.classList.contains("open");

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

console.log("rsvp.html Abraham Lake camp interactions:");
var source = require("fs").readFileSync(require("path").join(lib.ROOT, "rsvp.html"), "utf8");
var eyeFrames = source.match(/@keyframes entrance-roadtrip-camp-eye-wiggle\{[^}]+\}[^}]+\}[^}]+\}/);
check(eyeFrames && /rotate\(/.test(eyeFrames[0]) && /scale\(/.test(eyeFrames[0]) &&
  !/translate/.test(eyeFrames[0]), "the bark eyes visibly flex in place without a lateral translation");
var result = lib.runPageSync("rsvp.html", HARNESS, 4500, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
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
  }) && new Set(result.poplar.eyeCenters.map(String)).size === 3 && result.poplar.otherClusterIdle,
  "one poplar click wiggles all three bark eyes around distinct centres", result && result.poplar);
check(result && result.people && result.people.marketa && result.people.behdad,
  "each camper gets an independent head laugh", result && result.people);
check(result && result.tentOpen, "the tent flap opens", result && result.tentOpen);
check(result && result.potStartsCold,
  "the hidden pot does not boil before the fire is built", result && result.potStartsCold);
check(result && result.notebook && result.notebook.open && result.notebook.hostedInFullscreen &&
  result.notebook.didNotAlsoWiggle,
  "the notebook opens inside fullscreen and remains independent from Markéta’s reaction",
  result && result.notebook);
check(result && result.czechLakeTitle === "Hodit žabku přes jezero Abraham",
  "camp interaction labels follow the active language", result && result.czechLakeTitle);

if (failures) process.exit(1);
console.log("Abraham Lake camp interaction assertions passed.");
