#!/usr/bin/env node
// A room return must replace the last resumable location even when it creates no
// new solve/visit edge. The untouched opening Kitchen remains deliberately unsaved.
"use strict";

var lib = require("./lib");

var RETURN_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function raw() {
    var value = localStorage.getItem("loftCheckpoint:v1");
    return value ? JSON.parse(value) : null;
  }
  function progress(saved) {
    var row = saved && saved.progress;
    return row ? {
      room: row.room, max: row.maxUnlocked, solved: row.solvedRooms || [], seen: row.seenRooms || []
    } : null;
  }
  function state() {
    return {
      room: window.__currentStageName, max: window.__maxUnlocked(), solved: window.__solvedRooms(),
      seen: window.__seenRooms(), coffee: window.__captureKitchenCoffeeState(), saved: progress(raw())
    };
  }
  function click(node, detail) {
    if (!node) throw new Error("missing click target");
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: detail || 1 }));
  }
  function doubleClick(node) {
    click(node, 1); click(node, 2);
    node.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, detail: 2 }));
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  async function run() {
    var phase = sessionStorage.getItem("checkpoint-room-return-phase") || "fresh";
    if (phase === "fresh") {
      localStorage.removeItem("loftCheckpoint:v1");
      report.steps.fresh = state();
      click(document.getElementById("click-me-overlay"));
      await sleep(80);
      report.steps.started = state();
      var dots = document.querySelectorAll("#hunt-dots .hunt-dot");
      doubleClick(dots[1]);
      await sleep(480);
      report.steps.garden = state();
      click(dots[0]);
      await sleep(480);
      report.steps.returned = state();
      sessionStorage.setItem("checkpoint-room-return-before", JSON.stringify(report.steps));
      sessionStorage.setItem("checkpoint-room-return-phase", "recover-return");
      location.reload();
      return;
    }
    if (phase === "recover-return") {
      report.steps = JSON.parse(sessionStorage.getItem("checkpoint-room-return-before"));
      var gate = document.getElementById("loft-recovery-gate");
      var kitchen = document.getElementById("stage-kitchen");
      report.steps.returnGate = {
        shown: !!gate, raw: progress(raw()), transform: document.getElementById("loft-game-strip").style.transform,
        kitchenParked: kitchen.classList.contains("stage-far"), caption: document.getElementById("hunt-caption").textContent
      };
      if (!gate) throw new Error("missing returned-Kitchen recovery gate");
      click(gate.querySelector(".loft-recovery-btn.primary"));
      await sleep(180);
      report.steps.continued = state();
      click(document.getElementById("kitchen-lamarzocco"));
      await sleep(2250);
      click(document.getElementById("kitchen-grinder"));
      await sleep(2400);
      var coffeeSaved = raw();
      report.steps.coffeeSaved = {
        runtime: state(), raw: progress(coffeeSaved), coffee: coffeeSaved && coffeeSaved.systems && coffeeSaved.systems.coffee
      };
      sessionStorage.setItem("checkpoint-room-return-before", JSON.stringify(report.steps));
      sessionStorage.setItem("checkpoint-room-return-phase", "recover-coffee");
      location.reload();
      return;
    }
    report.steps = JSON.parse(sessionStorage.getItem("checkpoint-room-return-before"));
    var coffeeGate = document.getElementById("loft-recovery-gate");
    report.steps.coffeeGate = {
      shown: !!coffeeGate, raw: progress(raw()), transform: document.getElementById("loft-game-strip").style.transform
    };
    if (!coffeeGate) throw new Error("missing returned-Kitchen coffee recovery gate");
    click(coffeeGate.querySelector(".loft-recovery-btn.primary"));
    await sleep(180);
    report.steps.coffeeContinued = state();
    finish();
  }
  addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) {
        report.errors.push("harness: " + String(error && error.stack || error));
        finish();
      });
    }, 260);
  });
})();
</script>`;

var OTHER_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function click(node, detail) { node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: detail || 1 })); }
  function doubleClick(node) { click(node, 1); click(node, 2); node.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, detail: 2 })); }
  function snap() {
    var saved = JSON.parse(localStorage.getItem("loftCheckpoint:v1"));
    return { runtime: window.__currentStageName, room: saved.progress.room, max: saved.progress.maxUnlocked,
      solved: saved.progress.solvedRooms, seen: saved.progress.seenRooms };
  }
  addEventListener("load", function () { setTimeout(async function () {
    try {
      localStorage.removeItem("loftCheckpoint:v1");
      click(document.getElementById("click-me-overlay"));
      await sleep(80);
      var dots = document.querySelectorAll("#hunt-dots .hunt-dot");
      doubleClick(dots[2]);
      await sleep(480); report.steps.cuddly = snap();
      click(dots[1]);
      await sleep(480); report.steps.garden = snap();
      click(dots[2]);
      await sleep(480); report.steps.cuddlyAgain = snap();
      var beforePreview = localStorage.getItem("loftCheckpoint:v1");
      window.__loftPreviewBegin("checkpoint-return-test");
      click(dots[0]);
      await sleep(480);
      report.steps.preview = {
        runtime: window.__currentStageName, rawSame: localStorage.getItem("loftCheckpoint:v1") === beforePreview
      };
      var ended = await window.__loftPreviewEnd("restore");
      report.steps.restored = {
        room: window.__currentStageName, rawSame: localStorage.getItem("loftCheckpoint:v1") === beforePreview,
        checkpointPreserved: ended.checkpointPreserved
      };
    } catch (error) { report.errors.push("harness: " + String(error && error.stack || error)); }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 260); });
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

console.log("loft-day.html checkpoint room returns:");
var returned = lib.runPageSync("loft-day.html", RETURN_HARNESS, 9800, {
  patchRaf: true, forceMotion: true, urlSuffix: "?date=2026-08-10&time=12:00"
});
check(returned && returned.errors.length === 0, "Kitchen return/reload has no uncaught errors", returned && returned.errors);
var s = returned && returned.steps || {};
check(s.fresh && s.started && s.fresh.room === "kitchen" && s.started.room === "kitchen" &&
  !s.fresh.saved && !s.started.saved && s.started.max === 0 && !s.started.solved.length,
  "untouched initial Kitchen still creates no resumable checkpoint", { fresh: s.fresh, started: s.started });
check(s.garden && s.garden.room === "garden" && s.garden.saved && s.garden.saved.room === "garden" &&
  s.garden.max === 1 && !s.garden.solved.length && s.garden.seen.join(",") === "kitchen,garden",
  "real locked-dot navigation saves unsolved Garden without inventing progress", s.garden);
check(s.returned && s.returned.room === "kitchen" && s.returned.saved && s.returned.saved.room === "kitchen" &&
  s.returned.max === 1 && s.returned.saved.max === 1 && !s.returned.solved.length &&
  s.returned.seen.join(",") === "kitchen,garden",
  "real return navigation replaces the raw resumable room with Kitchen", s.returned);
check(s.returnGate && s.returnGate.shown && s.returnGate.raw && s.returnGate.raw.room === "kitchen" &&
  s.returnGate.transform === "translateX(0%)" && !s.returnGate.kitchenParked && /^Saved kitchen · /.test(s.returnGate.caption),
  "reload paints the Welcome back surface over the latest visible Kitchen", s.returnGate);
check(s.continued && s.continued.room === "kitchen" && s.continued.max === 1 && !s.continued.solved.length &&
  s.continued.seen.join(",") === "kitchen,garden" && s.continued.coffee.step === "off",
  "Continue lands in returned Kitchen without solve or puzzle mutation", s.continued);
check(s.coffeeSaved && s.coffeeSaved.runtime && s.coffeeSaved.runtime.room === "kitchen" &&
  s.coffeeSaved.runtime.coffee.step === "ground" && !s.coffeeSaved.runtime.solved.length &&
  s.coffeeSaved.raw && s.coffeeSaved.raw.room === "kitchen" && s.coffeeSaved.raw.max === 1 &&
  !s.coffeeSaved.raw.solved.length && s.coffeeSaved.coffee && s.coffeeSaved.coffee.step === "ground",
  "settled coffee work in returned Kitchen keeps updating the raw checkpoint", s.coffeeSaved);
check(s.coffeeGate && s.coffeeGate.shown && s.coffeeGate.raw && s.coffeeGate.raw.room === "kitchen" &&
  s.coffeeGate.transform === "translateX(0%)",
  "coffee reload keeps the recovery backdrop on Kitchen", s.coffeeGate);
check(s.coffeeContinued && s.coffeeContinued.room === "kitchen" && s.coffeeContinued.max === 1 &&
  !s.coffeeContinued.solved.length && s.coffeeContinued.coffee.step === "ground" &&
  s.coffeeContinued.saved && s.coffeeContinued.saved.room === "kitchen",
  "Continue restores the returned-Kitchen coffee step without solving the room", s.coffeeContinued);

var other = lib.runPageSync("loft-day.html", OTHER_HARNESS, 4300, {
  patchRaf: true, forceMotion: true, urlSuffix: "?date=2026-08-10&time=12:00"
});
check(other && other.errors.length === 0, "reverse/preview harness has no uncaught errors", other && other.errors);
var o = other && other.steps || {};
check(o.cuddly && o.cuddly.runtime === "cuddly" && o.cuddly.room === "cuddly" && o.cuddly.max === 2 && !o.cuddly.solved.length &&
  o.garden && o.garden.runtime === "garden" && o.garden.room === "garden" && o.garden.max === 2 && !o.garden.solved.length &&
  o.cuddlyAgain && o.cuddlyAgain.runtime === "cuddly" && o.cuddlyAgain.room === "cuddly" && o.cuddlyAgain.max === 2 && !o.cuddlyAgain.solved.length,
  "forward, reverse, and repeat visits keep the latest non-Kitchen room without solve mutations", o);
check(o.preview && o.preview.runtime === "kitchen" && o.preview.rawSame && o.restored &&
  o.restored.room === "cuddly" && o.restored.rawSame && o.restored.checkpointPreserved,
  "preview room pans remain write-free and restore their checkpoint byte-for-byte", { preview: o.preview, restored: o.restored });

if (failures) process.exit(1);
console.log("Checkpoint room-return assertions passed.");
