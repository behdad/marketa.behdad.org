#!/usr/bin/env node
"use strict";

// The Balcony is initially raster-parked. A keyboard pan must unpark its SVG
// before mutating the strip transform, otherwise Chrome can snapshot the moving
// strip without the dark wall/cross-street facade and repaint them only at settle.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function key(name) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));
  }
  function balconyPaintState() {
    var stage = document.getElementById("stage-balcony");
    var background = document.getElementById("balcony-background");
    var city = document.getElementById("balcony-cityview");
    return {
      parked: stage.classList.contains("stage-far"),
      backgroundVisibility: getComputedStyle(background).visibility,
      cityVisibility: getComputedStyle(city).visibility
    };
  }

  var originalToggle = DOMTokenList.prototype.toggle;
  var capturePan = false, panStart = null;
  DOMTokenList.prototype.toggle = function (token, force) {
    var stage = document.getElementById("stage-balcony");
    var strip = document.getElementById("loft-game-strip");
    if (capturePan && stage && strip && this === stage.classList && token === "stage-far" && force === false) {
      var transformBefore = strip.style.transform;
      var result = originalToggle.apply(this, arguments);
      panStart = balconyPaintState();
      panStart.transformBeforeUnpark = transformBefore;
      return result;
    }
    return originalToggle.apply(this, arguments);
  };

  async function run() {
    window.__unlockAllRooms();
    window.__goToStage("office");
    await sleep(850);
    capturePan = true;
    key("ArrowRight");
    capturePan = false;
    check("keyboard navigation reaches the Balcony", window.__currentStageName === "balcony", window.__currentStageName);
    check("the Balcony is paintable before the strip transform changes",
      panStart && panStart.transformBeforeUnpark === "translateX(-60%)" && !panStart.parked &&
        panStart.backgroundVisibility === "visible" && panStart.cityVisibility === "visible",
      JSON.stringify(panStart));
    await sleep(620);
    var arrival = balconyPaintState();
    check("both building layers remain paintable before keyboard settle completes",
      window.__upperRoomKeyboardNavigationState().settling && !arrival.parked &&
        arrival.backgroundVisibility === "visible" && arrival.cityVisibility === "visible",
      JSON.stringify({ navigation: window.__upperRoomKeyboardNavigationState(), paint: arrival }));
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push("harness: " + String(error && error.stack || error)); }).then(function () {
        out.errors = out.errors.concat((window.__errs || []).slice());
        var pre = document.createElement("pre");
        pre.id = "__report";
        pre.textContent = JSON.stringify(out);
        document.body.appendChild(pre);
      });
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 3200, { forceMotion: true, seedRandom: true });
if (!result) { console.error("balcony arrival paint: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + item.detail));
  if (!item.pass) failed = true;
});
if (result.errors.length) { failed = true; console.error("runtime errors:\n  " + result.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("balcony arrival paint: all " + result.checks.length + " checks passed");
