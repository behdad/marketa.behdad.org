#!/usr/bin/env node
// Focused lifecycle test for the cuddly-room throwable knives. Pointer capture is
// intentionally unavailable to synthetic events, which exercises the window fallback
// used when capture fails or is revoked by the browser.
"use strict";

var lib = require("./lib");

var harness = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(async function () {",
  "  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }",
  "  function pointer(target, type, id, x, y, pointerType) {",
  "    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id, pointerType: pointerType || 'mouse', isPrimary: true, button: type === 'pointerdown' || type === 'pointerup' ? 0 : -1, buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1, clientX: x, clientY: y }));",
  "  }",
  "  function atRest(el) { return el.style.translate === '0px' || el.style.translate === '0px 0px'; }",
  "  var report = { errors: window.__errs, normal: {}, outside: {}, touch: {}, captureLoss: {}, blur: {}, pointerIdentity: {} };",
  "  var knife = document.getElementById('cuddly-knife-1');",
  "  var r = knife.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;",
  "",
  "  pointer(knife, 'pointerdown', 11, x, y);",
  "  pointer(window, 'pointermove', 11, x + 80, y + 35);",
  "  report.normal.moved = knife.style.translate !== '0px 0px' && knife.style.translate !== '';",
  "  pointer(window, 'pointerup', 11, x + 80, y + 35);",
  "  report.normal.resetValue = knife.style.translate; report.normal.transitionValue = knife.style.transition;",
  "  report.normal.reset = atRest(knife) && knife.style.transition === '';",
  "",
  "  pointer(knife, 'pointerdown', 12, x, y);",
  "  pointer(window, 'pointermove', 12, -60, -40);",
  "  report.outside.moved = knife.style.translate !== '0px 0px';",
  "  pointer(window, 'pointerup', 12, -60, -40);",
  "  report.outside.resetValue = knife.style.translate; report.outside.transitionValue = knife.style.transition;",
  "  report.outside.reset = atRest(knife) && knife.style.transition === '';",
  "",
  "  var touchMove = new Event('touchmove', { bubbles: true, cancelable: true });",
  "  knife.dispatchEvent(touchMove);",
  "  report.touch.pagePanBlocked = touchMove.defaultPrevented;",
  "  pointer(knife, 'pointerdown', 15, x, y, 'touch');",
  "  pointer(window, 'pointermove', 15, x + 55, y + 25, 'touch');",
  "  pointer(window, 'pointercancel', 15, x + 55, y + 25, 'touch');",
  "  report.touch.cancelReset = atRest(knife) && knife.style.transition === '';",
  "",
  "  pointer(knife, 'pointerdown', 13, x, y);",
  "  pointer(window, 'pointermove', 13, x + 45, y + 20);",
  "  pointer(knife, 'lostpointercapture', 13, x + 45, y + 20);",
  "  report.captureLoss.resetValue = knife.style.translate; report.captureLoss.transitionValue = knife.style.transition;",
  "  report.captureLoss.reset = atRest(knife) && knife.style.transition === '';",
  "",
  "  pointer(knife, 'pointerdown', 14, x, y);",
  "  pointer(window, 'pointermove', 99, x + 100, y + 100);",
  "  report.pointerIdentity.moveValue = knife.style.translate; report.pointerIdentity.ignoredMove = atRest(knife);",
  "  pointer(window, 'pointermove', 14, x + 30, y + 10);",
  "  pointer(window, 'pointerup', 99, x + 30, y + 10);",
  "  report.pointerIdentity.ignoredUp = knife.style.translate !== '0px 0px';",
  "  window.dispatchEvent(new Event('blur'));",
  "  report.blur.resetValue = knife.style.translate; report.blur.transitionValue = knife.style.transition;",
  "  report.blur.reset = atRest(knife) && knife.style.transition === '';",
  "",
  "  await sleep(80);",
  "  report.errors = window.__errs;",
  "  document.getElementById('__report').textContent = JSON.stringify(report);",
  "})();",
  "</script>"
].join("\n");

var report = lib.runPageSync("rsvp.html", harness, 3000, { patchRaf: true });
var failures = 0;
function check(value, label) {
  if (value) console.log("  PASS " + label);
  else { failures++; console.error("  FAIL " + label); }
}

if (!report) {
  console.error("knife drag test produced no report");
  process.exit(1);
}
if (process.env.WEDDING_TEST_DEBUG) console.log(JSON.stringify(report, null, 2));
check(report.normal.moved && report.normal.reset, "ordinary drag moves and resets on release");
check(report.outside.moved && report.outside.reset, "drag outside the scene resets on window release");
check(report.touch.pagePanBlocked && report.touch.cancelReset, "touch drag blocks page pan and resets on cancellation");
check(report.captureLoss.reset, "lost pointer capture cannot strand the knife");
check(report.pointerIdentity.ignoredMove && report.pointerIdentity.ignoredUp, "unrelated pointers cannot move or release the active drag");
check(report.blur.reset, "window blur cancels and resets the active drag");
check(Array.isArray(report.errors) && report.errors.length === 0, "drag lifecycle raises no page errors");

if (failures) process.exit(1);
console.log("knife drag lifecycle: PASS");
