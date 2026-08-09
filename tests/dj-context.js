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
        window.__closeDjPicker();
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
  check(!result.contextOpen, "right-click does not open song requests", result);
  check(result.triggerOpen, "the booth hit surface uses the same direct click route", result);
  check(result.escapeClosed, "Escape closes song requests", result);
  check(result.touchOpen, "touch uses the same direct tap route", result);
}

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(!/__coachDjContext|dj_right_click_hint|contextRequest/.test(source),
  "the obsolete DJ-specific right-click coach and handler are absent");

process.exitCode = failures ? 1 : 0;
