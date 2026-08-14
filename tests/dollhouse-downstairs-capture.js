#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  async function waitFor(predicate, timeout) {
    var until = Date.now() + (timeout || 14000);
    while (Date.now() < until) {
      if (predicate()) return true;
      await sleep(40);
    }
    return !!predicate();
  }
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  async function opaqueShare(name) {
    var image = document.querySelector('.loft-dollhouse-room[data-dollhouse-room="' + name + '"] image');
    var source = image && image.getAttribute("href");
    if (!source) return 0;
    var decoded = new Image();
    await new Promise(function (resolve, reject) {
      decoded.onload = resolve;
      decoded.onerror = reject;
      decoded.src = source;
    });
    var canvas = document.createElement("canvas");
    canvas.width = 680;
    canvas.height = 340;
    var context = canvas.getContext("2d");
    context.drawImage(decoded, 0, 0, 680, 340);
    var pixels = context.getImageData(0, 0, 680, 340).data;
    var opaque = 0;
    for (var index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 16) opaque++;
    }
    return opaque / (680 * 340);
  }
  async function shares() {
    var names = ["kitchen", "garden", "cuddly", "office", "balcony", "bathroom", "cinema", "bedroom", "entrance"];
    var values = {};
    for (var index = 0; index < names.length; index++) values[names[index]] = await opaqueShare(names[index]);
    return values;
  }
  function allPainted(values) {
    return Object.keys(values).every(function (name) { return values[name] > .95; });
  }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  async function run() {
    if (window.__removeClickMe) window.__removeClickMe();
    if (window.__finishOpeningGuide) window.__finishOpeningGuide();
    if (window.__endAttract) window.__endAttract();
    var warm = await waitFor(function () { return window.__dollhouseState().backgroundWarm.complete; });
    check("the baseline Dollhouse capture set warms", warm, JSON.stringify(window.__dollhouseState().backgroundWarm));

    window.__markLowerRoomDiscovered();
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.__setSecondRound(true, { releaseHeld: false });
    window.__goToStage("kitchen");
    window.__openBathroomRoom();
    await sleep(500);
    var viewport = document.querySelector(".hunt-viewport");
    check("the regression runs with the lower floor owning the viewport",
      !!window.__bathroomRoomOpen && viewport.classList.contains("bathroom-room-open"),
      viewport.getAttribute("class"));

    var lowerStages = ["kitchen", "garden", "cuddly", "office", "balcony"];
    var wantNight = false;
    for (var lowerIndex = 0; lowerIndex < lowerStages.length; lowerIndex++) {
      var stage = lowerStages[lowerIndex];
      if (lowerIndex) {
        window.__navigateLowerRoom(stage, null, { unlockLocked: true });
        await sleep(850);
      }
      var before = window.__dollhouseState().backgroundWarm.previews;
      wantNight = !wantNight;
      window.__setDayNight(wantNight, true);
      var refreshed = await waitFor(function () {
        var state = window.__dollhouseState().backgroundWarm;
        return state.complete && state.previews >= before + 9;
      });
      var downstairs = await shares();
      check("captures refreshed from downstairs " + stage + " retain full-room paint",
        refreshed && allPainted(downstairs), JSON.stringify({ viewport: viewport.getAttribute("class"), shares: downstairs }));
    }
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push(String(error && error.stack || error)); }).then(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", harness, 70000, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true
});
var failed = false;
if (!result) {
  console.error("dollhouse-downstairs-capture: no report");
  process.exit(1);
}
result.checks.forEach(function (row) {
  console.log((row.pass ? "  PASS " : "  FAIL ") + row.name + (row.pass || !row.detail ? "" : " - " + row.detail));
  if (!row.pass) failed = true;
});
if (result.errors && result.errors.length) {
  console.error(result.errors.join("\n"));
  failed = true;
}
if (failed) process.exit(1);
console.log("dollhouse downstairs capture: all checks passed");
