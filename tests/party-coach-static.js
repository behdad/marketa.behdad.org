#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], geometryReads: 0, shown: false, alignment: null, inline: null };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        var fullscreenArea = document.getElementById("hunt-fullscreen-area");
        document.documentElement.classList.add("loft-entered");
        fullscreenArea.classList.remove("intro-active", "recovery-active");
        if (window.__removeClickMe) window.__removeClickMe();
        await sleep(40);
        if (window.__setSecondRound) window.__setSecondRound(true, { releaseHeld: false });
        if (window.__setGardenParty) window.__setGardenParty(true, false);
        var viewport = document.querySelector(".hunt-viewport");
        var coach = document.getElementById("party-room-map-coach");
        var card = coach.querySelector(".hunt-coach-card");
        var arrow = coach.querySelector("svg");
        var mapButton = document.getElementById("hunt-dollhouse-btn");
        var dots = document.getElementById("hunt-dots");
        var bottomNav = document.getElementById("hunt-bottom-nav");
        var watched = [viewport, card, arrow, mapButton];
        var originalRect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = function () {
          if (watched.indexOf(this) !== -1) report.geometryReads++;
          return originalRect.apply(this, arguments);
        };
        if (window.__setGardenParty) window.__setGardenParty(false, true);
        await sleep(80);
        Element.prototype.getBoundingClientRect = originalRect;
        report.shown = coach.classList.contains("show") &&
          !!(window.__partyRoomMapCoachActive && window.__partyRoomMapCoachActive());
        var vr = viewport.getBoundingClientRect();
        var br = mapButton.getBoundingClientRect();
        var cr = card.getBoundingClientRect();
        var ar = arrow.getBoundingClientRect();
        report.alignment = {
          card: (cr.left + cr.width / 2) - (vr.left + vr.width / 2),
          arrow: (ar.left + ar.width / 2) - (br.left + br.width / 2),
          inner: [innerWidth, innerHeight],
          viewport: [vr.left, vr.width],
          map: [br.left, br.width],
          arrowRect: [ar.left, ar.width],
          dots: (function () { var r = dots.getBoundingClientRect(); return [r.left, r.width]; })(),
          nav: (function () { var r = bottomNav.getBoundingClientRect(); return [r.left, r.width]; })(),
          area: (function () { var r = fullscreenArea.getBoundingClientRect(); return [r.left, r.width]; })(),
          rootClass: document.documentElement.className
        };
        report.inline = {
          cardLeft: card.style.left,
          cardTop: card.style.top,
          arrowViewBox: arrow.getAttribute("viewBox"),
          arrowPath: arrow.querySelector(".hunt-coach-arrow").getAttribute("d")
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 260);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 1800, {
  forceMotion: true, seedRandom: true, patchRaf: true,
  chromeFlags: "--window-size=1280,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail)));
  }
}

console.log("loft-day.html static room-map coach:");
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(result && result.shown, "Party teardown reveals the room-map coach", result);
check(result && result.geometryReads === 0,
  "revealing the coach performs no geometry reads on its viewport, card, arrow, or map target",
  result && result.geometryReads);
check(result && result.alignment && Math.abs(result.alignment.card) < 0.6,
  "the coach card stays centered in the scene", result && result.alignment);
check(result && result.alignment && Math.abs(result.alignment.arrow) < 0.6,
  "the arrow stays centered on the whole-loft map button", result && result.alignment);
check(result && result.inline && !result.inline.cardLeft && !result.inline.cardTop &&
  result.inline.arrowViewBox === "0 0 58 104" && result.inline.arrowPath === "M16 104H42V39H58L29 3L0 39H16Z",
  "the coach uses its authored static arrow and no JS-authored card coordinates", result && result.inline);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(!/function positionRoomMapCoach\(/.test(source) &&
  !/requestAnimationFrame\(positionRoomMapCoach\)/.test(source) &&
  /--party-map-target-x:calc\(50% - var\(--hunt-room-pill-half-width\) - var\(--hunt-map-gap\) - var\(--hunt-map-half-size\)\)/.test(source),
  "the map coach remains declarative rather than restoring a forced-layout positioner");

console.log("");
if (failures) {
  console.log(failures + " static room-map coach assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Static room-map coach assertions passed.");
