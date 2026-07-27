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
        window.__unlockAllRooms();
        window.goToStage("garden");
        var lamp = document.getElementById("garden-lamp");
        var genie = document.getElementById("garden-genie");
        click(lamp);
        click(lamp);
        report.beforeThird = {
          shown: lamp.classList.contains("genie-out"),
          hidden: genie.getAttribute("aria-hidden"),
          tabindex: genie.getAttribute("tabindex")
        };
        click(lamp);
        await sleep(60);
        report.summoned = {
          shown: lamp.classList.contains("genie-out"),
          hidden: genie.getAttribute("aria-hidden"),
          tabindex: genie.getAttribute("tabindex"),
          animation: getComputedStyle(genie).animationName,
          scale: getComputedStyle(genie).transform,
          lampLabelEn: lamp.getAttribute("aria-label"),
          labelEn: genie.getAttribute("aria-label")
        };
        setLang("cs");
        report.labelCs = {
          lamp: lamp.getAttribute("aria-label"),
          genie: genie.getAttribute("aria-label")
        };
        setLang("en");
        click(genie);
        await sleep(2200); // a normal trip card would have appeared by now
        report.entered = {
          shown: lamp.classList.contains("genie-out"),
          hidden: genie.getAttribute("aria-hidden"),
          tabindex: genie.getAttribute("tabindex"),
          trip: window.__tripState(),
          card: document.getElementById("mol-card-ketamine").classList.contains("mol-show")
        };
        // The stopped click must not bubble into the lamp and make the next summon early.
        window.__stopTrip(true);
        click(lamp);
        click(lamp);
        await sleep(60);
        report.noBubble = !lamp.classList.contains("genie-out");
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
  check(result.beforeThird && !result.beforeThird.shown &&
    result.beforeThird.hidden === "true" && result.beforeThird.tabindex === "-1",
    "the original three-rub summon threshold is preserved", result.beforeThird);
  check(result.summoned && result.summoned.shown &&
    result.summoned.hidden === "false" && result.summoned.tabindex === "0" &&
    result.summoned.animation === "genie-pop",
    "the visible genie is an accessible control", result.summoned);
  check(result.summoned && result.summoned.lampLabelEn === "Rub the lamp" &&
    result.summoned.labelEn === "Follow the genie into the k-hole" &&
    result.labelCs && result.labelCs.lamp === "Promni lampu" &&
    result.labelCs.genie === "Následuj džina do k-hole",
    "the genie's accessible name follows EN/CS", result);
  check(result.entered && !result.entered.shown &&
    result.entered.hidden === "true" && result.entered.tabindex === "-1" &&
    result.entered.trip && result.entered.trip.active && result.entered.trip.variant === "ketamine" &&
    !result.entered.card,
    "activating the genie starts uncarded ketamine and dismisses the target", result.entered);
  check(result.noBubble, "genie activation does not count as another lamp rub", result.noBubble);
}

process.exitCode = failures ? 1 : 0;
