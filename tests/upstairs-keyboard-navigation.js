#!/usr/bin/env node
"use strict";

// Held horizontal keys should visit the main floor one settled room at a time. Explicit
// buttons remain direct, so pointer navigation is not slowed by the keyboard repeat gate.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function key(name, repeat) {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: name, repeat: !!repeat, bubbles: true, cancelable: true
    }));
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  async function run() {
    window.__setSecondRound(true, { releaseHeld: false });
    window.__goToStage("kitchen");
    await sleep(850);

    key("ArrowRight");
    check("first press starts one adjacent slide",
      window.__currentStageName === "garden" && window.__upperRoomKeyboardNavigationState().settling,
      window.__currentStageName);
    await sleep(80);
    key("ArrowRight", true);
    check("repeat during the slide cannot skip the garden", window.__currentStageName === "garden", window.__currentStageName);

    await sleep(680);
    key("ArrowRight", true);
    check("held key advances after the garden settles", window.__currentStageName === "cuddly", window.__currentStageName);
    await sleep(80);
    key("ArrowLeft", true);
    check("opposite key also waits for the current slide", window.__currentStageName === "cuddly", window.__currentStageName);

    await sleep(680);
    key("ArrowLeft");
    check("next settled press moves one room back", window.__currentStageName === "garden", window.__currentStageName);
    document.getElementById("hunt-next").dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    check("pointer arrows remain direct during keyboard settling", window.__currentStageName === "cuddly", window.__currentStageName);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push("harness: " + String(error && error.stack || error)); }).then(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 5000, { forceMotion: true, seedRandom: true });
if (!result) { console.error("upstairs keyboard navigation: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + item.detail));
  if (!item.pass) failed = true;
});
if (result.errors.length) { failed = true; console.error("runtime errors:\n  " + result.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("upstairs keyboard navigation: all " + result.checks.length + " checks passed");
