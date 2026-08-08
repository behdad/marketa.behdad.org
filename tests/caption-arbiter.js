#!/usr/bin/env node
// Shared caption ownership: priority, scope, clocks, i18n, exclusivity, and restore.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] }, focused = true, hidden = false;
  Object.defineProperty(document, "hasFocus", { configurable: true, value: function () { return focused; } });
  Object.defineProperty(document, "hidden", { configurable: true, get: function () { return hidden; } });
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function snap() {
    var node = document.getElementById("hunt-caption"), state = window.__captionState();
    return {
      key: window.__captionKey(), text: node.textContent, html: node.innerHTML, bold: !!node.querySelector("b"),
      state: state, temporary: node.classList.contains("temporary-caption-live")
    };
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        report.intro = { before: snap() };
        report.intro.lowAccepted = !!window.__captionOverlay("trip_caption_molly", {
          owner: "intro-race", scope: "stage:kitchen", priority: 30, duration: 200, clock: "wall"
        });
        report.intro.after = snap();
        window.__endAttract();
        window.__captionBase("kitchen", { owner: "test-base", scope: "stage:kitchen" });

        window.__captionOverlay("room_progress", { owner: "dynamic", scope: "stage:kitchen",
          priority: 40, replacements: { n: 2 } });
        report.replacements = { en: snap() };
        setLang("cs"); report.replacements.cs = snap();
        setLang("en"); window.__cancelCaption("dynamic");

        window.caption("<b>literal & untouched</b>");
        report.literal = { en: snap() };
        setLang("cs"); report.literal.cs = snap();
        setLang("en"); window.setCaption("kitchen", true); report.literal.reclaimed = snap();

        window.__captionOverlay("trip_caption_molly", { owner: "stale", scope: "stage:kitchen",
          priority: 30, duration: 180, clock: "wall" });
        await sleep(60);
        window.__captionOverlay("trip_caption_acid", { owner: "stale", scope: "stage:kitchen",
          priority: 30, duration: 360, clock: "wall" });
        await sleep(150); report.stale = { afterOldExpiry: snap() };
        await sleep(250); report.stale.afterNewExpiry = snap();

        window.__captionOverlay("trip_caption_molly", { owner: "low", scope: "stage:kitchen",
          priority: 30, duration: 500, clock: "wall" });
        window.__captionOverlay("lower_rooms_clue", { owner: "high", scope: "stage:kitchen",
          priority: 60, duration: 140, clock: "wall" });
        report.preemption = { high: snap() };
        await sleep(190); report.preemption.after = snap();

        focused = true;
        window.__captionOverlay("trip_caption_iboga", { owner: "attended", scope: "stage:kitchen",
          priority: 30, duration: 220, clock: "attended" });
        await sleep(80);
        focused = false; window.dispatchEvent(new Event("blur"));
        await sleep(260); report.attended = { paused: snap() };
        focused = true; window.dispatchEvent(new Event("focus"));
        await sleep(180); report.attended.nearEnd = snap();
        await sleep(80); report.attended.expired = snap();

        window.__captionOverlay("trip_caption_acid", { owner: "wall", scope: "stage:kitchen",
          priority: 30, duration: 120, clock: "wall" });
        focused = false; window.dispatchEvent(new Event("blur"));
        await sleep(180); report.wall = snap();
        focused = true; window.dispatchEvent(new Event("focus"));

        var delayedAccepted = null;
        setTimeout(function () {
          delayedAccepted = !!window.__captionOverlay("trip_caption_molly", {
            owner: "late-kitchen", scope: "stage:kitchen", priority: 80, duration: 200, clock: "wall"
          });
        }, 100);
        window.__captionBase("garden", { owner: "test-base", scope: "stage:garden" });
        await sleep(150);
        report.delayedScope = { accepted: delayedAccepted, caption: snap() };

        window.__unlockAllRooms(); window.goToStage("kitchen");
        window.__captionOverlay("trip_caption_molly", { owner: "upstairs", scope: "stage:kitchen",
          priority: 30, duration: 600, clock: "wall" });
        window.__openBathroomRoom(); await sleep(40);
        report.lowerScope = { entered: snap() };
        window.__captionOverlay("cinema_short_gag", { owner: "bathroom-only", scope: "lower:bathroom",
          priority: 30, duration: 600, clock: "wall" });
        window.__closeBathroomRoom(); report.lowerScope.left = snap();

        window.goToStage("garden");
        var ordinarySession = window.loftSessionExport();
        window.__captionOverlay("trip_caption_molly", { owner: "checkpoint-transient", scope: "stage:garden",
          priority: 30, duration: 1000, clock: "wall" });
        report.checkpoint = { before: snap(), imported: window.loftSessionImport(ordinarySession), after: snap() };

        window.goToStage("office"); window.__setSecondRound(true, { releaseHeld: false });
        document.getElementById("office-abstract-butterfly").dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }));
        await sleep(30); report.butterfly = { en: snap() };
        setLang("cs"); report.butterfly.cs = snap(); setLang("en");
        window.goToStage("garden"); report.butterfly.left = snap();

        window.__captionArbiter.exclusive("recovery_title", { owner: "recovery", scope: "global", priority: 120 });
        report.recovery = { exclusive: snap() };
        report.recovery.lowAccepted = !!window.__captionOverlay("trip_caption_molly", {
          owner: "recovery-race", scope: "stage:garden", priority: 80, duration: 100
        });
        report.recovery.after = snap(); window.__cancelCaption("recovery");

        var token = window.__captionOverlay("trip_caption_molly", { owner: "token", scope: "stage:garden",
          priority: 30, duration: 1000, clock: "wall" });
        report.token = { value: token, cancelled: window.__cancelCaption(token), after: snap() };

        window.__startCinematic(); await sleep(40);
        report.cinematic = { active: snap() };
        report.cinematic.lowAccepted = !!window.__captionOverlay("trip_caption_molly", {
          owner: "cine-race", scope: "stage:kitchen", priority: 80, duration: 100
        });
        report.cinematic.after = snap(); window.__stopCinematic();
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
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

console.log("rsvp.html caption arbiter:");
var result = lib.runPageSync("rsvp.html", HARNESS, 6000, {
  patchRaf: true, forceMotion: true, urlSuffix: "?date=2026-07-15&time=12:00#play"
});
check(result && result.errors.length === 0, "the ownership harness has no uncaught errors", result && result.errors);
if (result) {
  check(result.intro.before.state.exclusive && result.intro.before.state.exclusive.owner === "opening" &&
    result.intro.before.key === "intro" && !result.intro.lowAccepted && result.intro.after.key === "intro",
    "the opening is exclusive and rejects incidental copy", result.intro);
  check(result.replacements.en.key === "room_progress" && /2/.test(result.replacements.en.text) &&
    result.replacements.cs.key === "room_progress" && /2/.test(result.replacements.cs.text) &&
    result.replacements.cs.text !== result.replacements.en.text,
    "keyed overlays rerender in EN/CS with raw replacements intact", result.replacements);
  check(result.literal.en.text === "<b>literal & untouched</b>" &&
    !result.literal.en.bold && result.literal.cs.text === result.literal.en.text &&
    result.literal.reclaimed.key === "kitchen",
    "console captions remain verbatim across language changes and yield to semantic base updates", result.literal);
  check(result.stale.afterOldExpiry.key === "trip_caption_acid" &&
    result.stale.afterNewExpiry.key === "kitchen" && !result.stale.afterNewExpiry.state.overlay,
    "a stale same-owner expiry cannot clear its replacement", result.stale);
  check(result.preemption.high.key === "lower_rooms_clue" && result.preemption.after.key === "kitchen" &&
    !result.preemption.after.state.overlay,
    "a higher-priority claim consumes rather than queues the preempted overlay", result.preemption);
  check(result.attended.paused.key === "trip_caption_iboga" &&
    result.attended.paused.state.overlay.remaining > 80 && result.attended.expired.key === "kitchen",
    "attended-time captions pause while unfocused and resume to expiry", result.attended);
  check(result.wall.key === "kitchen" && !result.wall.state.overlay,
    "wall-time captions expire even while the window is unattended", result.wall);
  check(result.delayedScope.accepted === false && result.delayedScope.caption.key === "garden" &&
    !result.delayedScope.caption.state.overlay,
    "a delayed callback cannot publish into a scope the viewport has left", result.delayedScope);
  check(result.lowerScope.entered.key === "lower_bathroom" && !result.lowerScope.entered.state.overlay &&
    result.lowerScope.left.key === "kitchen" && !result.lowerScope.left.state.overlay,
    "lower-room entry and exit synchronously cancel scope-bound overlays", result.lowerScope);
  check(result.checkpoint.before.state.overlay && result.checkpoint.imported &&
    result.checkpoint.after.key === "garden" && !result.checkpoint.after.state.overlay &&
    !result.checkpoint.after.state.exclusive,
    "ordinary checkpoint restore drops transient claims and derives one current base", result.checkpoint);
  check(result.butterfly.en.state.overlay && result.butterfly.en.state.overlay.owner === "butterfly-chase" &&
    /16/.test(result.butterfly.en.text) && result.butterfly.cs.text !== result.butterfly.en.text &&
    !result.butterfly.left.state.overlay,
    "Butterfly's live score repaints through one localized scoped claim", result.butterfly);
  check(result.recovery.exclusive.state.exclusive && result.recovery.exclusive.state.exclusive.owner === "recovery" &&
    !result.recovery.lowAccepted && result.recovery.after.key === "recovery_title",
    "the recovery surface is exclusive and rejects gameplay feedback", result.recovery);
  check(/^caption-/.test(result.token.value) && result.token.cancelled && !result.token.after.state.overlay,
    "callers can cancel an exact claim token without touching the base", result.token);
  check(result.cinematic.active.state.exclusive && result.cinematic.active.state.exclusive.owner === "cinematic" &&
    /^cine_/.test(result.cinematic.active.key) && !result.cinematic.lowAccepted &&
    result.cinematic.after.key === result.cinematic.active.key,
    "the cinematic is exclusive and cannot be interrupted by room feedback", result.cinematic);
}

if (failures) process.exit(1);
console.log("Caption arbiter checks passed.");
