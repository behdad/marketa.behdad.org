#!/usr/bin/env node
"use strict";

// Hack-Man faces the direction of travel, and only eating a real maze chip starts one
// restrained open-close-open mouth cycle. Reduced-motion players keep the static mouth.
var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function key(value) { document.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true })); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function safeRun(base) {
    var run = clone(base);
    run.status = "ready"; run.paused = false; run.player = { r: 13, c: 9 };
    run.direction = run.desired = "left"; run.fright = 0; run.playerAte = true;
    run.ghosts.forEach(function (ghost, i) {
      ghost.r = 1; ghost.c = 1 + i * 8; ghost.released = false; ghost.releaseAt = 999;
    });
    return run;
  }
  window.addEventListener("load", function () { setTimeout(async function () { try {
    window.__goToStage("garden"); window.__unlockPacman(false); window.__openRoomPacman();
    var player = document.querySelector(".pac-player:not(.pac-wrap-copy)"), base = window.__pacmanCapture();
    var facing = {};
    [["right", "270deg"], ["down", "0deg"], ["left", "90deg"], ["up", "180deg"]].forEach(function (pair) {
      var state = safeRun(base); state.direction = state.desired = pair[0];
      window.__pacmanRestore(state);
      facing[pair[0]] = { expected: pair[1], actual: getComputedStyle(player).getPropertyValue("--mouth").trim(), attr: player.getAttribute("data-dir") };
    });
    report.steps.facing = facing;

    var pellet = safeRun(base), target = 13 * 19 + 8;
    pellet.pellets = pellet.pellets.map(function (_on, i) { return i === target; });
    window.__pacmanRestore(pellet); key("ArrowLeft");
    var sawChomp = false, animation = "", gap = 99;
    for (var i = 0; i < 30 && !sawChomp; i++) {
      await sleep(10); sawChomp = player.classList.contains("pac-chomp");
    }
    if (sawChomp) {
      animation = getComputedStyle(player).animationName;
      await sleep(55);
      gap = parseFloat(getComputedStyle(player).getPropertyValue("--pac-mouth-gap"));
    }
    for (var j = 0; j < 30 && player.classList.contains("pac-chomp"); j++) await sleep(10);
    var afterPellet = window.__pacmanState();
    report.steps.pellet = { sawChomp: sawChomp, animation: animation, middleGap: gap,
      cleaned: !player.classList.contains("pac-chomp"), score: afterPellet.score, remaining: afterPellet.remaining };

    var clear = safeRun(base), distant = 1 * 19 + 1;
    clear.pellets = clear.pellets.map(function (_on, i) { return i === distant; });
    window.__pacmanRestore(clear); key("ArrowLeft"); await sleep(210);
    var afterClear = window.__pacmanState();
    report.steps.clear = { chomp: player.classList.contains("pac-chomp"), score: afterClear.score, remaining: afterClear.remaining };
    window.__closeMonitorPacman();
  } catch (error) { window.__errs.push("harness: " + String(error && error.stack || error)); }
  report.errors = window.__errs; document.getElementById("__report").textContent = JSON.stringify(report);
  }, 300); });
})();</script>`;

var REDUCED = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function key(value) { document.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true })); }
  window.addEventListener("load", function () { setTimeout(async function () { try {
    window.__goToStage("garden"); window.__unlockPacman(false); window.__openRoomPacman();
    var run = window.__pacmanCapture(), target = 13 * 19 + 8;
    run.status = "ready"; run.player = { r: 13, c: 9 }; run.direction = run.desired = "left";
    run.ghosts.forEach(function (ghost, i) { ghost.r = 1; ghost.c = 1 + i * 8; ghost.released = false; ghost.releaseAt = 999; });
    run.pellets = run.pellets.map(function (_on, i) { return i === target; });
    window.__pacmanRestore(run); key("ArrowLeft"); await sleep(210);
    var player = document.querySelector(".pac-player:not(.pac-wrap-copy)");
    report.steps.reduced = { eaten: window.__pacmanState().score === 10,
      chomp: player.classList.contains("pac-chomp"), animation: getComputedStyle(player).animationName };
  } catch (error) { window.__errs.push("harness: " + String(error && error.stack || error)); }
  report.errors = window.__errs; document.getElementById("__report").textContent = JSON.stringify(report);
  }, 300); });
})();</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? " — " + JSON.stringify(detail) : "")); }
}

console.log("rsvp.html Hack-Man mouth:");
var result = lib.runPageSync("rsvp.html", HARNESS, 2400, { patchRaf: true, forceMotion: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {}, facing = s.facing || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(["right", "down", "left", "up"].every(function (dir) {
  return facing[dir] && facing[dir].actual === facing[dir].expected && facing[dir].attr === dir;
}), "all four mouth openings face the direction of travel", facing);
check(s.pellet && s.pellet.sawChomp && s.pellet.animation === "pac-chomp" && s.pellet.middleGap <= 8 &&
  s.pellet.cleaned && s.pellet.score === 10 && s.pellet.remaining === 0,
  "eating a chip closes, reopens, and cleans up the mouth one-shot", s.pellet);
check(s.clear && !s.clear.chomp && s.clear.score === 0 && s.clear.remaining === 1,
  "moving through an empty cell does not chomp", s.clear);

var reduced = lib.runPageSync("rsvp.html", REDUCED, 1300, {
  patchRaf: true, forceReduce: true, chromeFlags: "--force-prefers-reduced-motion=reduce"
});
check(reduced && reduced.errors.length === 0, "reduced-motion load has no uncaught page errors", reduced && reduced.errors);
check(reduced && reduced.steps.reduced && reduced.steps.reduced.eaten && !reduced.steps.reduced.chomp && reduced.steps.reduced.animation === "none",
  "reduced motion keeps the mouth static while chips remain edible", reduced && reduced.steps.reduced);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/if \(pacState\.playerAte\) \{\s*atePellet = true;[\s\S]*?if \(atePellet\) pacChomp\(\);/.test(source),
  "the visual one-shot is wired to the real pellet-consumption branch");

console.log("");
if (failures) { console.log(failures + " Hack-Man mouth assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Hack-Man mouth assertions passed.");
