#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'addEventListener("load",function(){setTimeout(async function(){',
  'window.__resetActTwo();window.__setDayNight(false);window.goToStage("kitchen");window.__armActTwo(false);',
  'report.steps.fallbackBefore={beat:window.__actBeat(),night:document.getElementById("stage-balcony").classList.contains("dusk")};',
  'for(var fi=0;fi<90;fi++)window.__actTwoTick();',
  'report.steps.fallbackAfter={beat:window.__actBeat(),night:document.getElementById("stage-balcony").classList.contains("dusk")};',
  'window.__resetActTwo();window.__setRoomSolved("balcony",true);',
  'window.goToStage("balcony");',
  'window.__resetActTwo();window.__armActTwo(true);',
  'var partySwitch=document.getElementById("balcony-partyswitch");',
  'report.steps.before={beat:window.__actBeat(),caption:window.__captionKey(),room:window.currentStageName,pulse:partySwitch.classList.contains("invite-pulse")};',
  'window.goToStage("kitchen");for(var i=0;i<120;i++)window.__actTwoTick();',
  'report.steps.away={beat:window.__actBeat(),state:window.__actTwoState(),party:!!window.__gardenPartyOn,pulse:partySwitch.classList.contains("invite-pulse")};',
  'window.goToStage("balcony");',
  'report.steps.returned={beat:window.__actBeat(),caption:window.__captionKey(),room:window.currentStageName,pulse:partySwitch.classList.contains("invite-pulse")};',
  'for(var hi=0;hi<120;hi++)window.__actTwoTick();',
  'report.steps.waited={beat:window.__actBeat(),caption:window.__captionKey(),state:window.__actTwoState(),party:!!window.__gardenPartyOn,pulse:partySwitch.classList.contains("invite-pulse")};',
  'partySwitch.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
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
  check(result.steps.fallbackBefore.beat === "act_b0" && !result.steps.fallbackBefore.night &&
    result.steps.fallbackAfter.beat === "act_b2" && result.steps.fallbackAfter.night,
    "ordinary fallbacks keep progressing on attended whole-loft time", { before: result.steps.fallbackBefore, after: result.steps.fallbackAfter });
  check(result.steps.before.beat === "act_b2" && result.steps.before.caption === "act_b2" && result.steps.before.pulse,
    "the balcony switch cue owns the caption before ignition", result.steps.before);
  check(result.steps.away.beat === "act_b2" && result.steps.away.state.elapsed >= 120000 &&
    result.steps.away.state.claimElapsed === 0 && !result.steps.away.party && result.steps.away.pulse,
    "time in another room cannot consume the switch cue or start the party", result.steps.away);
  check(result.steps.returned.beat === "act_b2" && result.steps.returned.caption === "act_b2" &&
    result.steps.returned.room === "balcony" && result.steps.returned.pulse,
    "returning to the balcony restores the unconsumed switch cue", result.steps.returned);
  check(result.steps.waited.beat === "act_b2" && result.steps.waited.caption === "act_b2" &&
    result.steps.waited.state.claimElapsed >= 120000 && !result.steps.waited.party && result.steps.waited.pulse,
    "the hinge cue and switch pulse persist indefinitely without auto-starting the party", result.steps.waited);
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
