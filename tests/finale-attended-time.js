#!/usr/bin/env node
// The finale clock counts only attended gameplay, survives Continue exactly once,
// and freezes permanently when the terminal Camping beat claims it.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var phase = sessionStorage.getItem("finale-attended-phase") || "seed";
  var focused = true;
  var hidden = false;
  Object.defineProperty(document, "hasFocus", { configurable: true, value: function () { return focused; } });
  Object.defineProperty(document, "hidden", { configurable: true, get: function () { return hidden; } });
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function state() { return window.__loftAttendedTimeState(); }
  function report(value) {
    value.errors = window.__errs || [];
    document.getElementById("__report").textContent = JSON.stringify(value);
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        if (phase === "seed") {
          window.__endAttract();
          window.__unlockAllRooms();
          window.goToStage("garden");
          await sleep(120);
          window.__saveLoftCheckpoint();
          var saved = JSON.parse(localStorage.getItem("loftCheckpoint:v1"));
          saved.progress.attendedMs = 47 * 60 * 1000;
          saved.progress.attendedComplete = false;
          var seeded = JSON.stringify(saved);
          localStorage.setItem("loftCheckpoint:v1", seeded);
          window.addEventListener("pagehide", function () {
            localStorage.setItem("loftCheckpoint:v1", seeded);
          }, { once: true });
          sessionStorage.setItem("finale-attended-phase", "continue");
          location.reload();
          return;
        }
        if (phase === "continue") {
          var out = { gateStart: state(), gateSaved: JSON.parse(localStorage.getItem("loftCheckpoint:v1")).progress };
          await sleep(140);
          out.gateHeld = state();
          document.querySelector("#loft-recovery-gate .loft-recovery-btn.primary").click();
          await sleep(850);
          out.continued = state();
          window.__saveLoftCheckpoint();
          out.savedOnce = JSON.parse(localStorage.getItem("loftCheckpoint:v1")).progress.attendedMs;
          await sleep(120);
          window.__saveLoftCheckpoint();
          out.savedTwice = JSON.parse(localStorage.getItem("loftCheckpoint:v1")).progress.attendedMs;

          focused = false;
          window.dispatchEvent(new Event("blur"));
          out.blurred = state();
          await sleep(140);
          out.blurHeld = state();
          focused = true;
          window.dispatchEvent(new Event("focus"));
          await sleep(120);
          out.refocused = state();

          hidden = true;
          document.dispatchEvent(new Event("visibilitychange"));
          out.hidden = state();
          await sleep(140);
          out.hiddenHeld = state();
          hidden = false;
          document.dispatchEvent(new Event("visibilitychange"));
          await sleep(120);
          out.visibleAgain = state();

          window.__unlockAllRooms();
          window.goToStage("balcony");
          window.__openEntranceRoom();
          document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
          window.__openEntrancePorscheDriveHud();
          window.__entranceRoadtripDevStart();
          window.__toggleEntranceRoadtripTransport();
          out.roadPaused = state();
          await sleep(140);
          out.roadHeld = state();
          window.__toggleEntranceRoadtripTransport();
          await sleep(120);
          out.roadResumed = state();

          window.dispatchEvent(new Event("pagehide"));
          out.pageHeld = state();
          await sleep(140);
          out.pageHeldLater = state();
          window.dispatchEvent(new Event("pageshow"));
          await sleep(120);
          out.pageResumed = state();

          out.finished = window.__finishLoftAttendedTime();
          await sleep(140);
          out.finishedHeld = state();
          out.englishDuration = window.__formatLoftAttendedTime(47 * 60 * 1000, "en");
          out.czechDuration = window.__formatLoftAttendedTime(47 * 60 * 1000, "cs");
          out.hourDuration = window.__formatLoftAttendedTime(65 * 60 * 1000, "en");
          out.englishCaption = window.__showLoftAttendedTimeCaption();
          window.setLang("cs");
          out.czechCaption = document.getElementById("hunt-caption").textContent.replace(/\s+/g, " ").trim();
          window.setLang("en");
          window.__saveLoftCheckpoint();
          out.finalSaved = JSON.parse(localStorage.getItem("loftCheckpoint:v1")).progress;
          sessionStorage.setItem("finale-attended-result", JSON.stringify(out));
          sessionStorage.setItem("finale-attended-phase", "finished");
          location.reload();
          return;
        }

        var finalOut = JSON.parse(sessionStorage.getItem("finale-attended-result"));
        finalOut.finishedGateStart = state();
        await sleep(140);
        finalOut.finishedGateHeld = state();
        document.querySelector("#loft-recovery-gate .loft-recovery-btn.primary").click();
        await sleep(850);
        finalOut.finishedContinued = state();
        await sleep(160);
        finalOut.finishedContinuedHeld = state();
        window.__clearLoftCheckpoint();
        finalOut.cleared = state();
        report(finalOut);
      } catch (error) {
        report({ harnessError: String(error && error.stack || error) });
      }
    }, 300);
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

console.log("loft-day.html finale attended time:");
var result = lib.runPageSync("loft-day.html", HARNESS, 8500, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=23:00"
});
check(result && !result.harnessError && result.errors && result.errors.length === 0,
  "the lifecycle harness completes without page errors", result);
if (result && !result.harnessError) {
  check(result.gateStart.ms === 0 && !result.gateStart.complete &&
    result.gateHeld.ms === 0 && !result.gateHeld.complete,
    "the unopened recovery gate does not count as attended play", {
      start: result.gateStart, held: result.gateHeld
    });
  check(result.continued.ms >= 47 * 60 * 1000 && result.continued.ms < 47 * 60 * 1000 + 1500 &&
    !result.continued.complete,
    "Continue restores the saved total once and starts from that exact base", { continued: result.continued, saved: result.gateSaved });
  check(result.savedTwice > result.savedOnce && result.savedTwice - result.savedOnce >= 70 &&
    result.savedTwice - result.savedOnce < 350,
    "successive checkpoints add only their new attended slice", {
      first: result.savedOnce, second: result.savedTwice
    });
  check(Math.abs(result.blurHeld.ms - result.blurred.ms) < 25 &&
    result.refocused.ms - result.blurHeld.ms >= 70,
    "blurred time is held while focused time resumes", {
      blurred: result.blurred, held: result.blurHeld, resumed: result.refocused
    });
  check(Math.abs(result.hiddenHeld.ms - result.hidden.ms) < 25 &&
    result.visibleAgain.ms - result.hiddenHeld.ms >= 70,
    "hidden time is held while visible time resumes", {
      hidden: result.hidden, held: result.hiddenHeld, resumed: result.visibleAgain
    });
  check(Math.abs(result.roadHeld.ms - result.roadPaused.ms) < 25 &&
    result.roadResumed.ms - result.roadHeld.ms >= 70,
    "an explicit Road Trip transport pause holds the shared clock", {
      paused: result.roadPaused, held: result.roadHeld, resumed: result.roadResumed
    });
  check(Math.abs(result.pageHeldLater.ms - result.pageHeld.ms) < 25 &&
    result.pageResumed.ms - result.pageHeldLater.ms >= 70,
    "page lifecycle suspension holds the clock until pageshow", {
      held: result.pageHeld, later: result.pageHeldLater, resumed: result.pageResumed
    });
  check(result.finished.complete && result.finishedHeld.complete &&
    Math.abs(result.finishedHeld.ms - result.finished.ms) < 25,
    "the terminal owner freezes the attended total", {
      finished: result.finished, held: result.finishedHeld
    });
  check(result.englishDuration === "47 minutes" && result.czechDuration === "47 minut" &&
    result.hourDuration === "1 hour 5 minutes",
    "duration formatting is natural in both languages", {
      en: result.englishDuration, cs: result.czechDuration, hour: result.hourDuration
    });
  check(/^Wow, what a lofly day! 47 minutes in loft\. Tell us your time in your RSVP\.$/.test(result.englishCaption) &&
    result.czechCaption === "Páni, to byl ale loftový den! 47 minut v loftu. Napište nám svůj čas do RSVP.",
    "the finale caption preserves the in-loft pun and refreshes in Czech", {
      en: result.englishCaption, cs: result.czechCaption
    });
  check(result.finalSaved.attendedComplete === true &&
    Math.abs(result.finalSaved.attendedMs - result.finished.ms) < 25,
    "the terminal checkpoint persists the frozen total", result.finalSaved);
  check(result.finishedGateStart.ms === 0 && result.finishedGateHeld.ms === 0 &&
    result.finishedContinued.complete && result.finishedContinuedHeld.complete &&
    Math.abs(result.finishedContinued.ms - result.finalSaved.attendedMs) < 25 &&
    Math.abs(result.finishedContinuedHeld.ms - result.finishedContinued.ms) < 25,
    "reload and Continue neither count the gate nor restart a finished clock", {
      gate: result.finishedGateHeld, continued: result.finishedContinued,
      held: result.finishedContinuedHeld
    });
  check(!result.cleared.complete && result.cleared.ms < 40,
    "clearing the checkpoint resets the clock for a fresh game", result.cleared);
}

process.exitCode = failures ? 1 : 0;
