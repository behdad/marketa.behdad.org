#!/usr/bin/env node
// A durable checkpoint replaces the opening invitation with a keyboard-accessible
// Continue / Start over gate, and Continue restores the saved game progression.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-120000,progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null};',
  'if(!sessionStorage.getItem("recovery-seeded")){sessionStorage.setItem("recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var gate=document.getElementById("loft-recovery-gate"),buttons=gate&&gate.querySelectorAll(".loft-recovery-btn"),watch=document.querySelector(".watch-controls"),caption=document.getElementById("hunt-caption"),area=document.getElementById("hunt-fullscreen-area");S("gate",{shown:!!gate,clickMe:!!document.getElementById("click-me-overlay"),primary:buttons&&buttons[0].classList.contains("selected"),summary:caption&&caption.textContent,duplicateMeta:!!(gate&&gate.querySelector(".loft-recovery-meta")),describedBy:gate&&gate.getAttribute("aria-describedby"),recoveryActive:area&&area.classList.contains("recovery-active"),restartVisibility:getComputedStyle(document.getElementById("hunt-restart-btn")).visibility,escapeVisibility:getComputedStyle(document.getElementById("hunt-escape-btn")).visibility,leftVisibility:getComputedStyle(document.getElementById("hunt-left")).visibility,rightVisibility:getComputedStyle(document.getElementById("hunt-right")).visibility,dotsDisplay:getComputedStyle(document.getElementById("hunt-dots")).display,fullscreenVisibility:getComputedStyle(document.getElementById("hunt-fullscreen-btn")).visibility,watchParent:watch&&watch.parentNode&&watch.parentNode.id,watchHidden:watch&&watch.hidden,watchAria:watch&&watch.getAttribute("aria-hidden"),watchDisplay:watch&&getComputedStyle(watch).display});',
  ' function key(k,code,shift){document.dispatchEvent(new KeyboardEvent("keydown",{key:k,code:code||"",shiftKey:!!shift,bubbles:true,cancelable:true}));}',
  ' [ ["5","Digit5"], ["d","KeyD"], ["p","KeyP"], ["t","KeyT"], ["?","Slash",true], ["`","Backquote"], ["r","KeyR"], ["Tab","Tab"] ].forEach(function(x){key(x[0],x[1],x[2]);});',
  ' S("blocked",{gate:!!document.getElementById("loft-recovery-gate"),room:window.currentStageName,started:window.__gameStarted(),party:!!window.__gardenPartyOn,trip:!!window.__tripActive,help:!!document.querySelector(".kbd-backdrop"),console:document.getElementById("dropterm").classList.contains("open"),save:!!localStorage.getItem("loftCheckpoint:v1")});',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));S("right",buttons[1].classList.contains("selected"));',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true}));S("left",buttons[0].classList.contains("selected"));',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));S("continued",{gate:!!document.getElementById("loft-recovery-gate"),room:window.currentStageName,max:window.__maxUnlocked(),phase2:!!window.__secondRound,started:window.__gameStarted(),caption:caption&&caption.textContent,recoveryCaption:caption&&caption.classList.contains("recovery-caption"),recoveryActive:area&&area.classList.contains("recovery-active"),leftVisibility:getComputedStyle(document.getElementById("hunt-left")).visibility,rightVisibility:getComputedStyle(document.getElementById("hunt-right")).visibility,dotsDisplay:getComputedStyle(document.getElementById("hunt-dots")).display,watchParent:watch&&watch.parentNode&&watch.parentNode.tagName,watchHidden:watch.hidden,watchAria:watch.hasAttribute("aria-hidden"),watchDisplay:getComputedStyle(watch).display});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},350);});',
  '})();</script>'
].join("\n");

var START_OVER_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-120000,progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null};',
  'if(!sessionStorage.getItem("recovery-restart-seeded")){sessionStorage.setItem("recovery-restart-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var confirmations=0;window.confirm=function(){confirmations++;return false;};',
  ' var gate=document.getElementById("loft-recovery-gate"),buttons=gate&&gate.querySelectorAll(".loft-recovery-btn");',
  ' if(buttons&&buttons[1])buttons[1].click();',
  ' report.steps.startedOver={confirmations:confirmations,gate:!!document.getElementById("loft-recovery-gate"),save:!!localStorage.getItem("loftCheckpoint:v1"),room:window.currentStageName,phase2:!!window.__secondRound,started:window.__gameStarted(),entered:window.__gameOnlyEntered(),clickMe:!!document.getElementById("click-me-overlay"),caption:document.getElementById("hunt-caption").textContent};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},350);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html checkpoint recovery:");
var r = lib.runPageSync("rsvp.html", HARNESS, 1900, { patchRaf: true });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.gate.shown && !s.gate.clickMe && s.gate.primary, "a valid save replaces CLICK ME with Continue selected", s.gate);
check(!!s.gate.summary && /^Saved Office · /.test(s.gate.summary) && !s.gate.duplicateMeta && s.gate.describedBy === "hunt-caption", "the caption alone carries the concise accessible recovery summary", s.gate);
check(s.gate.recoveryActive && s.gate.restartVisibility === "hidden" && s.gate.escapeVisibility === "hidden" && s.gate.leftVisibility === "hidden" && s.gate.rightVisibility === "hidden" && s.gate.dotsDisplay === "none" && s.gate.fullscreenVisibility === "visible", "recovery hides inactive navigation but keeps fullscreen available", s.gate);
check(s.gate.watchParent === "hunt-fullscreen-area" && s.gate.watchDisplay === "flex", "Trailer and Autoplay occupy the room-dot row during recovery", s.gate);
check(!s.gate.watchHidden && s.gate.watchAria === null && s.gate.watchDisplay === "flex", "Trailer and Autoplay remain available beside the recovery choice", s.gate);
check(s.blocked && s.blocked.gate && s.blocked.room === "kitchen" && !s.blocked.started && !s.blocked.party && !s.blocked.trip && !s.blocked.help && !s.blocked.console && s.blocked.save, "gameplay shortcuts stay inert until a recovery choice is made", s.blocked);
check(s.right && s.left, "arrow keys move between Start over and Continue", { right: s.right, left: s.left });
check(!s.continued.gate && s.continued.room === "office" && s.continued.max === 4 && s.continued.phase2 && s.continued.started, "Enter continues into the restored unlocked game", s.continued);
check(!s.continued.recoveryCaption && s.continued.caption.toLowerCase().indexOf("continue from") === -1, "continuing restores the room caption", s.continued);
check(!s.continued.recoveryActive && s.continued.leftVisibility === "visible" && s.continued.rightVisibility === "visible" && s.continued.dotsDisplay === "flex", "continuing restores navigation", s.continued);
check(s.continued.watchParent === "MAIN", "continuing returns Trailer and Autoplay below the shell", s.continued);
check(!s.continued.watchHidden && !s.continued.watchAria && s.continued.watchDisplay === "flex", "Trailer and Autoplay remain available after the recovery choice", s.continued);

var restart = lib.runPageSync("rsvp.html", START_OVER_HARNESS, 1900, { patchRaf: true, urlSuffix: "#play" });
check(!!restart && restart.errors.length === 0, "Start over harness has no uncaught page errors", restart && restart.errors);
var startedOver = restart && restart.steps.startedOver;
check(startedOver && startedOver.confirmations === 0 && !startedOver.gate && !startedOver.save && startedOver.room === "kitchen" && !startedOver.phase2,
  "Start over is the confirmation: it resets immediately without a browser dialog", startedOver);
check(startedOver && !startedOver.started && startedOver.entered && startedOver.clickMe && !/La Maz/.test(startedOver.caption),
  "recovery Start over enlarges the page but preserves the clean CLICK ME introduction", startedOver);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
