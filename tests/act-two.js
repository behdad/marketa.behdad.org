#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};var focused=true,hidden=false;Object.defineProperty(document,"hasFocus",{configurable:true,value:function(){return focused;}});Object.defineProperty(document,"hidden",{configurable:true,get:function(){return hidden;}});',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'addEventListener("load",function(){setTimeout(async function(){',
  'window.__resetActTwo();window.__setDayNight(false);window.goToStage("kitchen");window.__armActTwo(false);',
  'report.steps.fallbackBefore={beat:window.__actBeat(),night:document.getElementById("stage-balcony").classList.contains("dusk")};',
  'for(var fi=0;fi<90;fi++)window.__actTwoTick();',
  'report.steps.fallbackAfter={beat:window.__actBeat(),night:document.getElementById("stage-balcony").classList.contains("dusk")};',
  'window.__resetActTwo();window.__setRoomSolved("balcony",true);',
  'hidden=true;document.dispatchEvent(new Event("visibilitychange"));window.goToStage("balcony");await sleep(4300);report.steps.hiddenArrival={beat:window.__actBeat(),caption:window.__captionKey(),scheduler:window.__attentionScheduleState()};hidden=false;document.dispatchEvent(new Event("visibilitychange"));window.dispatchEvent(new Event("focus"));await sleep(4200);report.steps.hiddenArrivalResumed={beat:window.__actBeat(),caption:window.__captionKey()};window.__resetActTwo();',
  'window.goToStage("balcony");',
  'window.__resetActTwo();window.__armActTwo(true);',
  'var partySwitch=document.getElementById("balcony-partyswitch");',
  'report.steps.before={beat:window.__actBeat(),caption:window.__captionKey(),room:window.currentStageName,pulse:partySwitch.classList.contains("invite-pulse")};',
  'window.__openEntranceRoom();window.__closeEntranceRoom();report.steps.lowerReturn={beat:window.__actBeat(),caption:window.__captionKey(),room:window.currentStageName};',
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
  'focused=false;window.dispatchEvent(new Event("blur"));await sleep(5400);report.steps.revealBlurred={beat:window.__actBeat(),caption:window.__captionKey(),state:window.__captionState()};focused=true;window.dispatchEvent(new Event("focus"));await sleep(5400);report.steps.revealResumed={beat:window.__actBeat(),caption:window.__captionKey(),state:window.__captionState()};',
  'report.errors=window.__errs||[];',
  'document.getElementById("__report").textContent=JSON.stringify(report);',
  '},300);});',
  '})();</script>'
].join("");

var result = lib.runPageSync("rsvp.html", HARNESS, 22000, { patchRaf: true });
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
  check(result.steps.hiddenArrival.beat === null && result.steps.hiddenArrival.scheduler.running === 0 &&
    result.steps.hiddenArrivalResumed.beat === "act_b2" && result.steps.hiddenArrivalResumed.caption === "act_b2",
    "a first hidden Balcony arrival parks Act Two and publishes its hinge on refocus",
    { hidden: result.steps.hiddenArrival, resumed: result.steps.hiddenArrivalResumed });
  check(result.steps.before.beat === "act_b2" && result.steps.before.caption === "act_b2" && result.steps.before.pulse,
    "the balcony switch cue owns the caption before ignition", result.steps.before);
  check(result.steps.lowerReturn.beat === "act_b2" && result.steps.lowerReturn.caption === "act_b2" &&
    result.steps.lowerReturn.room === "balcony",
    "an Entrance round-trip restores the active switch cue instead of Balcony's base caption",
    result.steps.lowerReturn);
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
  check(result.steps.revealBlurred.caption === "act_b3" && result.steps.revealBlurred.state.overlay &&
    result.steps.revealBlurred.state.overlay.owner === "act-reveal" &&
    result.steps.revealResumed.caption === "act_p1" && !result.steps.revealResumed.state.overlay,
    "the reveal and Act-P1 handoff consume attended time and cannot leave stale Act-B3",
    { blurred: result.steps.revealBlurred, resumed: result.steps.revealResumed });
}

if (failures) {
  console.error("\n" + failures + " second-act reveal check(s) failed.");
  process.exit(1);
}
console.log("\nAll second-act reveal checks passed.");
