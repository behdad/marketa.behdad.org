#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<pre id="__report">pending</pre><script>
(function () {
  var report = { errors: window.__errs, steps: {}, debug: {} };
  function S(key, value) { report.steps[key] = !!value; }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function pointer(el, type, x, y) {
    el.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 17, pointerType: "mouse",
      button: 0, buttons: type === "pointerup" ? 0 : 1, clientX: x, clientY: y
    }));
  }
  function click(el, x, y) {
    el.dispatchEvent(new MouseEvent("click", {
      bubbles: true, cancelable: true, clientX: x, clientY: y
    }));
  }
  async function run() {
    window.goToStage("office");
    await sleep(60);
    var chair = document.getElementById("office-chair"), cr = chair.getBoundingClientRect();
    var cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
    pointer(chair, "pointerdown", cx, cy);
    pointer(chair, "pointermove", cx + 30, cy);
    pointer(chair, "pointermove", cx + 52, cy);
    pointer(chair, "pointerup", cx + 52, cy);
    S("chair_one_way", !window.__arcadeState().active && window.__arcadeState().playerX !== 278);

    pointer(chair, "pointerdown", cx, cy);
    pointer(chair, "pointerup", cx, cy);
    S("chair_tap", window.__arcadeState().active);
    window.__arcadeStop();

    window.goToStage("kitchen");
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setPartyMode(false, true);
    window.__setDayNight(true);
    await sleep(80);
    var pouria = document.getElementById("kitchen-bartender-hit"), pr = pouria.getBoundingClientRect();
    var px = pr.left + pr.width / 2, py = pr.top + pr.height / 2;
    pointer(pouria, "pointerdown", px, py);
    pointer(pouria, "pointermove", px + 50, py);
    pointer(pouria, "pointerup", px + 50, py);
    S("pouria_one_way", !window.__flairState().active && window.__flairState().playerX !== 336);

    pointer(pouria, "pointerdown", px, py);
    pointer(pouria, "pointerup", px, py);
    click(pouria, px, py);
    S("pouria_tap", window.__flairState().active);
    window.__flairStop();

    window.goToStage("garden");
    await sleep(50);
    var chaseCalls = 0, realChase = window.__startGardenChase;
    window.__startGardenChase = function () { chaseCalls++; };
    var wall = document.getElementById("garden-wall"), wr = wall.getBoundingClientRect();
    click(wall, wr.left + wr.width / 2, wr.top + wr.height / 2);
    S("garden_single", chaseCalls === 0);
    click(wall, wr.left + wr.width / 2 + 12, wr.top + wr.height / 2 + 4);
    S("garden_nearby_pair", chaseCalls === 1);
    window.__startGardenChase = realChase;

    window.goToStage("balcony");
    await sleep(60);
    var apartment = document.querySelector(".balcony-building-window"), ar = apartment.getBoundingClientRect();
    var ax = ar.left + ar.width / 2, ay = ar.top + ar.height / 2;
    var before = window.__balconyTetrisState().windows.slice();
    click(apartment, ax, ay);
    var tetris = window.__balconyTetrisState();
    S("window_single", tetris.active &&
      tetris.windows.every(function (value, i) { return value === before[i]; }));

    report.debug = {
      chair: window.__arcadeState(),
      flair: window.__flairState(),
      tetris: { active: tetris.active }
    };
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) {
        window.__errs.push(String(error && error.stack || error));
        report.errors = window.__errs;
        document.getElementById("__report").textContent = JSON.stringify(report);
      });
    }, 350);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
    if (detail) console.log("      " + JSON.stringify(detail));
  }
}

console.log("rsvp.html arcade discovery gestures:");
var result = lib.runPageSync("rsvp.html", harness, 4500, {
  patchRaf: true, forceMotion: true, seedRandom: true
});
check(!!result, "browser harness completed", result);
if (result) {
  check(result.steps.chair_one_way, "an ordinary chair drag only repositions it", result.debug);
  check(result.steps.chair_tap, "one chair tap launches Alien Resources", result.debug);
  check(result.steps.pouria_one_way, "an ordinary Pouria drag only repositions him", result.debug);
  check(result.steps.pouria_tap, "one Pouria tap launches Flair Catch", result.debug);
  check(result.steps.garden_single, "one garden-wall click remains inert", result.debug);
  check(result.steps.garden_nearby_pair, "a nearby garden-wall click pair launches the chase", result.debug);
  check(result.steps.window_single, "one building-window click launches Block Party and preserves the lights", result.debug);
  check(!result.errors.length, "no uncaught page errors", result.errors);
}
var reduced = lib.runPageSync("rsvp.html", harness, 4500, {
  patchRaf: true, forceReduce: true, seedRandom: true,
  chromeFlags: "--force-prefers-reduced-motion=reduce"
});
check(!!reduced, "reduced-motion browser harness completed", reduced);
if (reduced) {
  check(reduced.steps.pouria_tap, "reduced motion keeps Flair Catch playable", reduced.debug);
  check(!reduced.errors.length, "reduced-motion launch has no uncaught page errors", reduced.errors);
}
process.exitCode = failures ? 1 : 0;
