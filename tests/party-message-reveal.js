#!/usr/bin/env node
"use strict";

var lib = require("./lib");

function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label +
    (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failures++;
}

var LIVE_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function snap(){var g=window.__partyMessageRevealGateState(),thumb=document.querySelector(".msg-thumb"),badge=document.querySelector(".msg-badge");return {gate:g,thread:window.__phoneMessageThread(),preview:!!thumb&&thumb.classList.contains("show"),badge:!!badge&&badge.classList.contains("show")};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' document.hasFocus=function(){return true;};localStorage.clear();if(window.__removeClickMe)window.__removeClickMe();if(window.__finishOpeningGuide)window.__finishOpeningGuide();if(window.__endAttract)window.__endAttract();',
  ' window.__setSeenRooms(["kitchen","garden","cuddly"]);window.__setSecondRound(true,{releaseHeld:false});window.__goToStage("garden");window.__resetPhoneApps();window.__setPartyMode(true,true,true);window.__stopCueDrip();window.__retirePartyRoomMapCoach();',
  ' window.__deliverPhoneMessage("cue_calendar",true);window.__deliverBirthdayText("behdad","Behdad");window.__deliverPhoneMessage("cue_mail",true);window.__deliverPhoneMessage("cue_calendar",true);report.steps.start=snap();',
  ' setTimeout(function(){report.steps.before=snap();},3850);',
  ' setTimeout(function(){report.steps.revealElapsed=snap();["firstDance","slowDance","toasts","groupPhoto","sparklers","cake","bdCake","bouquet","photoFreeze"].forEach(function(name){window.__setPartyMomentState(name,false);});},4100);',
  ' setTimeout(function(){window.__showPartyExplorationCoach();window.__retirePartyRoomMapCoach();},4300);',
  ' setTimeout(function(){report.steps.after=snap();window.__setPartyMode(false,true,false);window.__setPartyMode(true,true,false);window.__stopCueDrip();window.__deliverPhoneMessage("cue_cocktails",true);report.steps.toggle=snap();},4650);',
  ' setTimeout(function(){window.__setPartyMode(false,true,false);window.__resetCheckpointSystems();window.__resetPhoneApps();window.__setSecondRound(false,{releaseHeld:false});window.__setSecondRound(true,{releaseHeld:false});window.__setPartyMode(true,true,false);window.__stopCueDrip();window.__showPartyExplorationCoach();window.__retirePartyRoomMapCoach();window.__deliverPhoneMessage("cue_calendar",true);report.steps.reset=snap();report.errors=window.__errs||[];document.getElementById("__report").textContent=JSON.stringify(report);},5000);',
  '}catch(e){report.errors=[String(e&&e.stack||e)];document.getElementById("__report").textContent=JSON.stringify(report);}},350);});',
  '})();</script>'
].join("\n");

var RECOVERY_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"garden",maxUnlocked:2,solvedRooms:["kitchen"],seenRooms:["kitchen","garden","cuddly"],phase2:true,party:true,daylight:false,bbq:false},puzzle:{},phone:null,album:null,systems:{"party-message-reveal":{started:true,complete:false,remaining:2600,queue:[{id:"cue_calendar",autonomous:true},{id:"cue_mail",autonomous:true}]},"party-roadtrip-bridge":{handoffShown:false,roadtripInviteDelivered:false,roomMapCoachAcknowledged:true,roomMapCoachActive:false,roomMapCoachDelay:0,roadtripExchangeDelay:0}}};',
  'if(!sessionStorage.getItem("party-message-recovery-seeded")){sessionStorage.setItem("party-message-recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],steps:{}};function snap(){var g=window.__partyMessageRevealGateState(),thumb=document.querySelector(".msg-thumb"),badge=document.querySelector(".msg-badge");return {gate:g,thread:window.__phoneMessageThread(),preview:!!thumb&&thumb.classList.contains("show"),badge:!!badge&&badge.classList.contains("show")};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{var button=document.querySelector("#loft-recovery-gate .loft-recovery-btn.primary");report.steps.gate=!!button;button.click();window.__stopCueDrip();report.steps.continued=snap();setTimeout(function(){report.steps.before=snap();},2200);setTimeout(function(){report.steps.after=snap();},3000);setTimeout(function(){var raw=JSON.parse(localStorage.getItem("loftCheckpoint:v1")||"{}");report.steps.saved=raw.systems&&raw.systems["party-message-reveal"];report.errors=window.__errs||[];document.getElementById("__report").textContent=JSON.stringify(report);},3650);}catch(e){report.errors=[String(e&&e.stack||e)];document.getElementById("__report").textContent=JSON.stringify(report);}},250);});',
  '})();</script>'
].join("\n");

var failures = 0;
console.log("Party first-reveal message gate:");
var live = lib.runPageSync("loft-day.html", LIVE_HARNESS, 5900, {
  patchRaf: true, urlSuffix: "?date=2026-08-13&party-message-reveal=" + Date.now()
});
check(!!live && live.errors.length === 0, "live timing harness has no page errors", live && live.errors);
if (live) {
  check(live.steps.start.gate.active && live.steps.start.gate.remaining > 3400 &&
    live.steps.start.gate.queued.join(",") === "cue_calendar,bd_behdad,cue_mail" &&
    live.steps.start.thread.length === 0 && !live.steps.start.preview && !live.steps.start.badge,
  "every delivery, including a birthday greeting, queues once without notification chrome", live.steps.start);
  check(live.steps.before.gate.active && live.steps.before.thread.length === 0 &&
    !live.steps.before.preview && !live.steps.before.badge,
  "no message, preview, or unread badge appears during the first 4,000ms", live.steps.before);
  check(live.steps.revealElapsed.gate.active && live.steps.revealElapsed.gate.remaining === 0 &&
    live.steps.revealElapsed.thread.length === 0,
  "elapsed messages stay serialized behind the active authored Party moment", live.steps.revealElapsed);
  check(live.steps.after.gate.complete && !live.steps.after.gate.active &&
    live.steps.after.thread.join(",") === "cue_calendar,bd_behdad,cue_mail" && live.steps.after.preview,
  "the queue releases through Messages in original order after the reveal", live.steps.after);
  check(live.steps.toggle.gate.complete && live.steps.toggle.thread.join(",") ===
    "cue_calendar,bd_behdad,cue_mail,cue_cocktails",
  "later Party toggles do not replay the first-reveal gate", live.steps.toggle);
  check(live.steps.reset.gate.active && live.steps.reset.gate.remaining > 3400 &&
    live.steps.reset.gate.queued.join(",") === "cue_calendar" && live.steps.reset.thread.length === 0,
  "a full subsystem reset rearms the one-time gate", live.steps.reset);
}

var recovery = lib.runPageSync("loft-day.html", RECOVERY_HARNESS, 4800, {
  patchRaf: true, urlSuffix: "?date=2026-08-13&party-message-recovery=" + Date.now()
});
check(!!recovery && recovery.errors.length === 0, "checkpoint timing harness has no page errors", recovery && recovery.errors);
if (recovery) {
  check(recovery.steps.gate && recovery.steps.continued.gate.active &&
    recovery.steps.continued.gate.remaining <= 2600 && recovery.steps.continued.gate.remaining > 1900 &&
    recovery.steps.continued.thread.length === 0 && !recovery.steps.continued.preview,
  "Continue restores the saved queue and remaining first-reveal delay", recovery.steps.continued);
  check(recovery.steps.before.gate.active && recovery.steps.before.thread.length === 0 &&
    !recovery.steps.before.preview && !recovery.steps.before.badge,
  "checkpoint recovery does not release the held messages early", recovery.steps.before);
  check(recovery.steps.after.gate.complete && recovery.steps.after.thread.slice(0,2).join(",") === "cue_calendar,cue_mail" &&
    recovery.steps.after.thread.filter(function(id){return id === "cue_calendar";}).length === 1 &&
    recovery.steps.after.thread.filter(function(id){return id === "cue_mail";}).length === 1 && recovery.steps.after.preview,
  "the restored queue releases exactly once when its remaining delay expires", recovery.steps.after);
  check(recovery.steps.saved && recovery.steps.saved.complete && recovery.steps.saved.queue.length === 0,
  "the completed gate is recaptured durably", recovery.steps.saved);
}

if (failures) process.exit(1);
console.log("Party message reveal assertions passed.");
