#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], shown: false, alignment: null, inline: null };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        var fullscreenArea = document.getElementById("hunt-fullscreen-area");
        document.documentElement.classList.add("loft-entered");
        fullscreenArea.classList.remove("intro-active", "recovery-active");
        if (window.__removeClickMe) window.__removeClickMe();
        if (window.__finishOpeningGuide) window.__finishOpeningGuide();
        if (window.__endAttract) window.__endAttract();
        if (window.__shareCloseModal) window.__shareCloseModal();
        if (window.__resetPartyExitHint) window.__resetPartyExitHint();
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
        if (window.__setGardenParty) window.__setGardenParty(false, true);
        if (window.__shareCloseModal) window.__shareCloseModal();
        if (window.__hideMessageThumb) window.__hideMessageThumb(true);
        if (window.__hideCallRing) window.__hideCallRing();
        if (window.__showPartyExplorationCoach) window.__showPartyExplorationCoach();
        if (window.__refreshPartyBridgeCoaches) window.__refreshPartyBridgeCoaches();
        await sleep(300);
        report.shown = coach.classList.contains("show") &&
          !!(window.__partyRoomMapCoachActive && window.__partyRoomMapCoachActive());
        var vr = viewport.getBoundingClientRect();
        var br = mapButton.getBoundingClientRect();
        var cr = card.getBoundingClientRect();
        var ar = arrow.getBoundingClientRect();
        var areaRect = fullscreenArea.getBoundingClientRect();
        var pathBox = arrow.querySelector(".hunt-coach-arrow").getBBox();
        report.alignment = {
          cardInside: cr.left >= areaRect.left - 1 && cr.right <= areaRect.right + 1 &&
            cr.top >= areaRect.top - 1 && cr.bottom <= areaRect.bottom + 1,
          cardResponsive: cr.width >= areaRect.width * .4 && cr.height >= 24 &&
            cr.width <= areaRect.width && cr.height <= areaRect.height * .5,
          cardRect: cr.toJSON(),
          arrowX: areaRect.left + pathBox.x + pathBox.width / 2 - (br.left + br.width / 2),
          arrowTipY: areaRect.top + pathBox.y - (br.bottom + 3),
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
  chromeFlags: "--window-size=1280,900", urlSuffix: "?date=2026-08-13"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail)));
  }
}

console.log("loft-day.html modal room-map coach:");
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(result && result.shown, "Party teardown reveals the room-map coach", result);
check(result && result.alignment && result.alignment.cardInside && result.alignment.cardResponsive,
  "the responsive modal card stays compact and inside the game shell", result && result.alignment);
check(result && result.alignment && Math.abs(result.alignment.arrowX) < 0.6 &&
  Math.abs(result.alignment.arrowTipY) < 0.6,
  "the arrow stays centered on the whole-loft map button", result && result.alignment);
check(result && result.inline && !!result.inline.cardLeft && !!result.inline.cardTop &&
  /^0 0 [0-9.]+ [0-9.]+$/.test(result.inline.arrowViewBox) && !!result.inline.arrowPath,
  "the modal positioner records responsive card and arrow coordinates", result && result.inline);

console.log("");
if (failures) {
  console.log(failures + " modal room-map coach assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Modal room-map coach assertions passed.");
