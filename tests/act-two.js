#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'addEventListener("load",function(){setTimeout(async function(){',
  'window.goToStage("balcony");',
  'window.__resetActTwo();window.__armActTwo(true);',
  'report.steps.before={beat:window.__actBeat(),caption:window.__captionKey(),room:window.currentStageName};',
  'document.getElementById("balcony-partyswitch").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
  'report.steps.immediate={beat:window.__actBeat(),caption:window.__captionKey(),room:window.currentStageName,party:!!window.__gardenPartyOn};',
  'await sleep(250);',
  'report.steps.held={beat:window.__actBeat(),caption:window.__captionKey(),room:window.currentStageName};',
  'report.errors=window.__errs||[];',
  'document.getElementById("__report").textContent=JSON.stringify(report);',
  '},300);});',
  '})();</script>'
].join("");

var result = lib.runPageSync("rsvp.html", HARNESS, 1500, { patchRaf: true });
var failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label);
  if (!ok) {
    failures++;
    if (detail) console.log("    " + JSON.stringify(detail));
  }
}

console.log("rsvp.html second-act party reveal:");
check(!!result, "focused harness completed");
if (result) {
  check(result.errors.length === 0, "no uncaught page errors", result.errors);
  check(result.steps.before.beat === "act_b2" && result.steps.before.caption === "act_b2",
    "the balcony switch cue owns the caption before ignition", result.steps.before);
  check(result.steps.immediate.party && result.steps.immediate.room === "garden" &&
    result.steps.immediate.beat === "act_p1" && result.steps.immediate.caption === "act_b3",
    "first balcony ignition lands in the garden with the reveal still visible", result.steps.immediate);
  check(result.steps.held.caption === "act_b3",
    "ordinary party-state repainting does not immediately overwrite the reveal", result.steps.held);
}

if (failures) {
  console.error("\n" + failures + " second-act reveal check(s) failed.");
  process.exit(1);
}
console.log("\nAll second-act reveal checks passed.");
