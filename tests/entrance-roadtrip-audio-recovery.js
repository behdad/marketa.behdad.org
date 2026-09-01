#!/usr/bin/env node
// A live Road Trip recovers the shared AudioContext after browser/OS interruption
// without replacing its connected drivetrain bed; focus pauses still require input.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function () {
  var report = { errors: [], steps: {} };
  var focused = true, visibility = "visible";
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function snap(ctx) {
    var state = window.__entranceRoomState();
    return {
      context: ctx && ctx.state,
      beds: window.__activeAudioBedCount(),
      active: state.drive.audioActive,
      gain: state.drive.audioMix.gain,
      speed: state.drive.speed,
      roadtrip: state.drive.roadtrip.active,
      resumePending: state.drive.roadtrip.resumePending
    };
  }
  try {
    Object.defineProperty(document, "hasFocus", {
      configurable: true, value: function () { return focused; }
    });
    Object.defineProperty(document, "hidden", {
      configurable: true, get: function () { return visibility === "hidden"; }
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true, get: function () { return visibility; }
    });
  } catch (_error) {}
  window.addEventListener("load", function () { setTimeout(async function () { try {
    window.__unlockAllRooms();
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("banff", 0);
    window.__entranceDriveSetMotion(120, 4);
    window.__entranceDriveStep(80);
    await sleep(320);

    var ctx = window.__getSfxCtx()._ac;
    var realResume = ctx.resume.bind(ctx), resumeCalls = 0;
    try {
      ctx.resume = function () { resumeCalls++; return realResume(); };
    } catch (_error) {}
    report.steps.driving = snap(ctx);
    await ctx.suspend();
    await sleep(180);
    report.steps.recovered = snap(ctx);
    report.steps.recovered.resumeCalls = resumeCalls;

    focused = false;
    window.dispatchEvent(new Event("blur"));
    await sleep(420);
    report.steps.blurred = snap(ctx);
    focused = true;
    window.dispatchEvent(new Event("focus"));
    await sleep(80);
    report.steps.focused = snap(ctx);
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: " ", code: "Space", bubbles: true, cancelable: true
    }));
    document.dispatchEvent(new KeyboardEvent("keyup", {
      key: " ", code: "Space", bubbles: true, cancelable: true
    }));
    await sleep(320);
    report.steps.input = snap(ctx);
  } catch (error) { report.errors.push(String(error && error.stack || error)); }
  report.errors = (window.__errs || []).concat(report.errors);
  document.getElementById("__report").textContent = JSON.stringify(report);
  }, 260); });
})();</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail)));
  }
}

console.log("loft-day.html Road Trip audio recovery:");
var result = lib.runPageSync("loft-day.html", HARNESS, 5000, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }

var s = result.steps || {};
check(result.errors.length === 0, "the recovery lifecycle has no uncaught errors", result.errors);
// Chrome's virtual-time timers outrun AudioContext.currentTime, so the 220ms mix ramp may
// still be underway here. Its live, monotonic gain is the invariant; other tests own its duration.
check(s.driving && s.driving.context === "running" && s.driving.roadtrip &&
  s.driving.active && s.driving.gain > .1 && s.driving.speed >= 115,
  "a moving Road Trip owns a live drivetrain bed", s.driving);
check(s.recovered && s.recovered.context === "running" && s.recovered.active &&
  s.recovered.gain >= s.driving.gain && s.recovered.beds >= 1 && s.recovered.beds <= s.driving.beds &&
  s.recovered.resumeCalls >= 1 && !s.recovered.resumePending,
  "an external context suspension resumes in place without replacing the bed", s.recovered);
check(s.blurred && s.blurred.roadtrip && s.blurred.resumePending && !s.blurred.active &&
  s.focused && s.focused.resumePending && !s.focused.active,
  "blur still retires the drivetrain and focus alone leaves the Road Trip paused", {
    blurred: s.blurred, focused: s.focused
  });
check(s.input && s.input.context === "running" && s.input.roadtrip &&
  !s.input.resumePending && s.input.active && s.input.gain > .1,
  "fresh driving input resumes both the Road Trip and a clean drivetrain owner", s.input);

var source = fs.readFileSync(path.join(lib.ROOT, "loft-day.html"), "utf8");
check(/addEventListener\("statechange",[\s\S]*__sharedAC\.state\s*!==\s*"running"[\s\S]*resumeSharedAudio\(\)/.test(source) &&
  /if \(ac\.state !== "running"\) resumeSharedAudio\(\)/.test(source),
  "the shared owner handles every non-running browser state, including interruption");

if (failures) process.exit(1);
console.log("Road Trip audio-recovery assertions passed.");
