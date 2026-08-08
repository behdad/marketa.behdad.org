#!/usr/bin/env node
// Real delayed base producers retain the viewport visit that launched them.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function click(id) { document.getElementById(id).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  function snap() { return { room: window.currentStageName, key: window.__captionKey(), state: window.__captionState() }; }
  window.addEventListener("load", function () { setTimeout(async function () { try {
    window.__endAttract(); window.__unlockAllRooms();

    window.goToStage("cuddly"); click("cuddly-outlet"); window.goToStage("office");
    await sleep(150); report.steps.outletLeave = snap();

    window.goToStage("cuddly"); click("cuddly-outlet"); window.goToStage("garden");
    window.goToStage("cuddly"); window.setCaption("cuddly_pull", true);
    await sleep(150); report.steps.outletReentry = snap();

    window.__setOfficeProgress("prague", true); window.__setOfficeProgress("pc", false);
    window.goToStage("office"); window.computer(true); window.goToStage("garden");
    await sleep(3150); report.steps.monitorLeave = snap();

    window.computer(false); window.__setOfficeProgress("pc", false); window.computer(true);
    window.goToStage("kitchen"); window.goToStage("office"); window.setCaption("office_call", true);
    await sleep(3150); report.steps.monitorReentry = snap();
  } catch (error) { report.errors.push(String(error && error.stack || error)); }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 300); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 8000, {
  patchRaf: true, forceMotion: true, seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play"
});
var LAPTOP_HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function snap() { return { room: window.currentStageName, key: window.__captionKey(), state: window.__captionState() }; }
  window.addEventListener("load", function () { setTimeout(async function () { try {
    window.__endAttract(); window.__unlockAllRooms(); window.goToStage("office");
    window.__setOfficeProgress("prague", false); window.__setOfficeProgress("pc", false);
    window.__laptopCall("prague"); window.goToStage("garden");
    await sleep(3100); report.steps.hangupLeave = snap();

    window.__endLaptopCall(true); window.goToStage("office");
    window.__setOfficeProgress("prague", false); window.__setOfficeProgress("pc", false);
    window.__laptopCall("prague"); window.__endLaptopCall();
    window.goToStage("garden"); window.goToStage("office"); window.setCaption("office_call", true);
    await sleep(1600); report.steps.dropReentry = snap();
  } catch (error) { report.errors.push(String(error && error.stack || error)); }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 300); });
})();
</script>`;
var laptopResult = lib.runPageSync("rsvp.html", LAPTOP_HARNESS, 6200, {
  patchRaf: true, forceReduce: true, seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=12:00&captionLaptopFresh=1#play"
});
var failures = 0;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message);
  if (!ok) { failures++; if (detail) console.log("    " + JSON.stringify(detail)); }
}

console.log("rsvp.html delayed caption producers:");
check(!!result, "focused harness completed");
if (result) {
  check(result.errors.length === 0, "no uncaught page errors", result.errors);
  check(result.steps.outletLeave.room === "office" && result.steps.outletLeave.key !== "cuddly_outlet_visit" &&
    result.steps.outletLeave.state.base.scope === "stage:office",
    "Cuddly's real outlet completion cannot publish after a room leave", result.steps.outletLeave);
  check(result.steps.outletReentry.room === "cuddly" && result.steps.outletReentry.key === "cuddly_pull",
    "leaving and re-entering the same room does not revive the prior visit's outlet completion", result.steps.outletReentry);
  check(result.steps.monitorLeave.room === "garden" && !/^office_(?:find|hint)$/.test(result.steps.monitorLeave.key || "") &&
    result.steps.monitorLeave.state.base.scope === "stage:garden",
    "Office monitor's real delayed completion cannot stamp the destination scope", result.steps.monitorLeave);
  check(result.steps.monitorReentry.room === "office" && result.steps.monitorReentry.key === "office_call",
    "Office leave/re-entry invalidates the prior visit's monitor completion", result.steps.monitorReentry);
}
check(!!laptopResult, "real laptop-call harness completed");
if (laptopResult) {
  check(laptopResult.errors.length === 0, "the laptop call paths have no uncaught errors", laptopResult.errors);
  check(laptopResult.steps.hangupLeave.room === "garden" &&
    laptopResult.steps.hangupLeave.key !== "office_hangup" &&
    laptopResult.steps.hangupLeave.state.base.scope === "stage:garden",
    "Office's real delayed hang-up nudge cannot publish after navigation", laptopResult.steps.hangupLeave);
  check(laptopResult.steps.dropReentry.room === "office" &&
    laptopResult.steps.dropReentry.key === "office_call" &&
    laptopResult.steps.dropReentry.state.base.scope === "stage:office",
    "Office's real delayed call drop cannot revive after leave/re-entry", laptopResult.steps.dropReentry);
}
if (failures) process.exit(1);
console.log("Delayed producer checks passed.");
