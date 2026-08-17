#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function click(el) { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      var report = { errors: window.__errs };
      try {
        document.hasFocus = function () { return true; };
        window.__secondRound = true;
        window.__unlockAllRooms();
        window.__goToStage("garden");
        var lamp = document.getElementById("garden-lamp");
        var genie = document.getElementById("garden-genie");
        click(lamp);
        await sleep(60);
        report.summoned = {
          shown: lamp.classList.contains("genie-out"),
          tabindex: genie.getAttribute("tabindex"),
          animation: getComputedStyle(genie).animationName,
          pointerEvents: getComputedStyle(genie).pointerEvents,
          scale: getComputedStyle(genie).transform
        };
        click(genie);
        await sleep(80);
        var presentation = window.__pacmanPresentation && window.__pacmanPresentation();
        var wish = document.querySelector(".genie-wish-backdrop");
        report.entered = {
          shown: lamp.classList.contains("genie-out"),
          tabindex: genie.getAttribute("tabindex"),
          presentation: presentation,
          overlay: !document.getElementById("pacman-room-overlay").hidden,
          wish: !!wish,
          title: wish && wish.querySelector(".genie-wish-title").textContent,
          choices: wish && [].slice.call(wish.querySelectorAll(".genie-wish-choice")).map(function (button) { return button.textContent; }),
          focused: wish && document.activeElement === wish.querySelector(".genie-wish-choice")
        };
        if (wish) wish.querySelector(".pb-dlg-x").click();
        click(lamp);
        await sleep(60);
        report.resummoned = lamp.classList.contains("genie-out");
      } catch (e) {
        window.__errs.push("harness: " + String(e && e.stack || e));
      }
      report.errors = window.__errs;
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
    console.log("  ✗ " + message + (detail == null ? "" : " [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html garden lamp genie:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3800, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(result.summoned && result.summoned.shown &&
    result.summoned.tabindex === "-1" &&
    result.summoned.animation === "genie-pop" &&
    result.summoned.pointerEvents === "auto",
    "the first lamp click summons a pointer-active, non-Tab genie", result.summoned);
  check(result.entered && !result.entered.shown &&
    result.entered.tabindex === "-1" && !result.entered.overlay && result.entered.wish &&
    result.entered.presentation && result.entered.presentation.mode === null &&
    result.entered.title === "Make a wish." && result.entered.focused &&
    result.entered.choices.join("|") === "Love|Money|More wishes",
    "activating the genie opens the focused three-wish modal without touching Pac-Man", result.entered);
  check(result.resummoned, "one later lamp click summons the genie again", result.resummoned);
}

process.exitCode = failures ? 1 : 0;
