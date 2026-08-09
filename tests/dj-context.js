#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var fs = require("fs");
var path = require("path");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
addEventListener("load", function () {
  setTimeout(function () {
    var report = { errors: window.__errs };
    try {
      document.hasFocus = function () { return true; };
      window.__unlockAllRooms();
      window.party(true);
      window.goToStage("garden");
      var head = document.getElementById("garden-dj-headbang");
      var trigger = document.getElementById("garden-dj-request");
      var picker = document.getElementById("garden-djpicker");
      head.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }));
      head.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      setTimeout(function () {
        report.normal = {
          picker: picker.classList.contains("open"),
          bang: head.classList.contains("bang"),
          scratch: document.getElementById("garden-dj-scratch").classList.contains("scratching")
        };
        var danceBeforeDismiss = window.__partyDance;
        var mouseDismiss = picker.querySelector(".dj-pick-dismiss");
        var mouseCircle = mouseDismiss && mouseDismiss.querySelector("circle");
        var firstCell = picker.querySelector(".dj-pick-row .dj-pick-cell");
        report.dismissLayout = mouseDismiss && mouseCircle && firstCell ? {
          radius: Number(mouseCircle.getAttribute("r")),
          right: Number(mouseCircle.getAttribute("cx")) + Number(mouseCircle.getAttribute("r")),
          bottom: Number(mouseCircle.getAttribute("cy")) + Number(mouseCircle.getAttribute("r")),
          firstRowTop: Number(firstCell.getAttribute("y")),
          noAria: !mouseDismiss.hasAttribute("aria-label") && !mouseDismiss.hasAttribute("role")
        } : null;
        mouseDismiss.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }));
        mouseDismiss.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.mouseDismiss = {
          closed: !picker.classList.contains("open"),
          danceUnchanged: window.__partyDance === danceBeforeDismiss,
          partyOn: !!window.__gardenPartyOn,
          stage: window.currentStageName
        };
        head.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 }));
        report.contextOpen = picker.classList.contains("open");
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.triggerOpen = picker.classList.contains("open");
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        report.escapeClosed = !picker.classList.contains("open");
        trigger.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
        trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.touchOpen = picker.classList.contains("open");
        var touchDance = window.__partyDance;
        var touchDismiss = picker.querySelector(".dj-pick-dismiss");
        touchDismiss.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
        touchDismiss.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.touchDismiss = {
          closed: !picker.classList.contains("open"),
          danceUnchanged: window.__partyDance === touchDance,
          partyOn: !!window.__gardenPartyOn,
          stage: window.currentStageName
        };
        report.errors = window.__errs;
        document.getElementById("__report").textContent = JSON.stringify(report);
      }, 80);
    } catch (e) {
      window.__errs.push("harness: " + String(e && e.stack || e));
      report.errors = window.__errs;
      document.getElementById("__report").textContent = JSON.stringify(report);
    }
  }, 350);
});
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : " [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html DJ request discovery:");
var result = lib.runPageSync("rsvp.html", HARNESS, 2400, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(result.normal && result.normal.picker && result.normal.bang && result.normal.scratch,
    "an ordinary desktop click reacts and opens song requests", result.normal);
  check(result.dismissLayout && result.dismissLayout.radius >= 9 && result.dismissLayout.right <= 552 &&
    result.dismissLayout.bottom < result.dismissLayout.firstRowTop && result.dismissLayout.noAria,
    "the visible dismiss target stays in the top-right header without ARIA attributes or row overlap", result.dismissLayout);
  check(result.mouseDismiss && result.mouseDismiss.closed && result.mouseDismiss.danceUnchanged &&
    result.mouseDismiss.partyOn && result.mouseDismiss.stage === "garden",
    "the mouse dismiss closes only the picker and does not select a song", result.mouseDismiss);
  check(!result.contextOpen, "right-click does not open song requests", result);
  check(result.triggerOpen, "the booth hit surface uses the same direct click route", result);
  check(result.escapeClosed, "Escape closes song requests", result);
  check(result.touchOpen, "touch uses the same direct tap route", result);
  check(result.touchDismiss && result.touchDismiss.closed && result.touchDismiss.danceUnchanged &&
    result.touchDismiss.partyOn && result.touchDismiss.stage === "garden",
    "the touch dismiss closes only the picker and does not select a song", result.touchDismiss);
}

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(!/__coachDjContext|dj_right_click_hint|contextRequest/.test(source),
  "the obsolete DJ-specific right-click coach and handler are absent");

process.exitCode = failures ? 1 : 0;
