#!/usr/bin/env node
"use strict";

var lib = require("./lib");

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
      report.normal = {
        picker: picker.classList.contains("open"),
        bang: head.classList.contains("bang"),
        caption: window.__captionKey()
      };
      window.__clearFlashCaption("dj-context");
      window.setCaption("garden_party", true);
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      report.repeat = {
        picker: picker.classList.contains("open"),
        caption: window.__captionKey()
      };
      var ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 });
      report.contextCancelled = !head.dispatchEvent(ev);
      report.contextOpen = picker.classList.contains("open");
      var second = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 });
      report.openContextCancelled = !head.dispatchEvent(second);
      var sceneMenu = document.querySelector(".scene-ctx");
      var escapeLabel = sceneMenu && sceneMenu.querySelector("button span:last-child");
      report.escapeOffered = !!escapeLabel && escapeLabel.textContent.trim() === "Escape";
      var escape = sceneMenu && sceneMenu.querySelector("button");
      if (escape) escape.click();
      report.contextClosed = !picker.classList.contains("open");
      var originalMatchMedia = window.matchMedia;
      window.matchMedia = function (q) {
        if (/hover:none|pointer:coarse/.test(q)) return { matches: true, addListener: function () {}, removeListener: function () {} };
        return originalMatchMedia.call(window, q);
      };
      trigger.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      report.touchOpen = picker.classList.contains("open");
    } catch (e) {
      window.__errs.push("harness: " + String(e && e.stack || e));
    }
    report.errors = window.__errs;
    document.getElementById("__report").textContent = JSON.stringify(report);
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
  check(result.normal && !result.normal.picker &&
    result.normal.caption === "dj_right_click_hint",
    "an ordinary desktop click reacts and teaches right-click without opening requests", result.normal);
  check(result.repeat && !result.repeat.picker && result.repeat.caption === "garden_party",
    "the right-click coach appears only once", result.repeat);
  check(result.contextCancelled && result.contextOpen,
    "right-click suppresses the native menu and opens requests", result);
  check(result.openContextCancelled && result.escapeOffered,
    "right-clicking open requests offers the shared Escape action", result);
  check(result.contextClosed, "the Escape action closes requests", result);
  check(result.touchOpen, "touch retains a direct tap route", result);
}

process.exitCode = failures ? 1 : 0;
