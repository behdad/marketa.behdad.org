#!/usr/bin/env node
"use strict";

// The direct hash family shares one game-only shell, but only Trailer and Autoplay
// take ownership after normal entry/recovery initialization has settled.
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'window.turnstile={render:function(){return "url-entry-widget";},remove:function(){},execute:function(){}};',
  'window.addEventListener("load",function(){setTimeout(function(){',
  'var report={hash:location.hash,revealed:document.documentElement.classList.contains("revealed"),cinematic:!!window.__cinematic,autoplay:!!(window.__autoplayOn&&window.__autoplayOn()),started:!!(window.__gameStarted&&window.__gameStarted()),errors:(window.__errs||[]).slice()};',
  'document.getElementById("__report").textContent=JSON.stringify(report);',
  '},1900);});',
  '})();</script>'
].join("\n");

function run(hash) {
  return lib.runPageSync("rsvp.html", HARNESS, 2600, {
    patchRaf: true,
    forceMotion: true,
    urlSuffix: hash
  });
}

var RECOVERY_AUTOPLAY = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-120000,progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null};',
  'if(!sessionStorage.getItem("url-entry-autoplay-seeded")){sessionStorage.setItem("url-entry-autoplay-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'window.addEventListener("load",function(){setTimeout(function(){',
  'var gate=document.getElementById("loft-recovery-gate");var waiting=!!gate&&!window.__autoplayOn();',
  'gate.querySelector(".loft-recovery-btn.primary").click();',
  'setTimeout(function(){document.getElementById("__report").textContent=JSON.stringify({waiting:waiting,gate:!!document.getElementById("loft-recovery-gate"),autoplay:window.__autoplayOn(),room:window.currentStageName,errors:(window.__errs||[]).slice()});},100);',
  '},1750);});',
  '})();</script>'
].join("\n");

var RECOVERY_TRAILER = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-120000,progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null};',
  'if(!sessionStorage.getItem("url-entry-trailer-seeded")){sessionStorage.setItem("url-entry-trailer-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'window.addEventListener("load",function(){setTimeout(function(){',
  'document.getElementById("__report").textContent=JSON.stringify({gate:!!document.getElementById("loft-recovery-gate"),cinematic:!!window.__cinematic,checkpoint:!!localStorage.getItem("loftCheckpoint:v1"),errors:(window.__errs||[]).slice()});',
  '},1750);});',
  '})();</script>'
].join("\n");

function runRecovery(hash, harness) {
  return lib.runPageSync("rsvp.html", harness, 2700, {
    patchRaf: true,
    forceMotion: true,
    urlSuffix: hash
  });
}

var URL_KEYS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var seen=[];document.addEventListener("keydown",function(e){if(e.key==="["||e.key==="]")seen.push("down:"+e.key);});document.addEventListener("keyup",function(e){if(e.key==="["||e.key==="]")seen.push("up:"+e.key);});',
  'localStorage.setItem("loftCheckpoint:v1",JSON.stringify({version:1,savedAt:Date.now(),progress:{room:"office",maxUnlocked:4,phase2:true,party:true,daylight:false,bbq:false},puzzle:{},phone:null,album:null}));',
  'window.addEventListener("load",function(){setTimeout(function(){var state=window.__urlKeysState();document.getElementById("__report").textContent=JSON.stringify({gate:!!document.getElementById("loft-recovery-gate"),checkpointBeforePlay:!!localStorage.getItem("loftCheckpoint:v1"),room:window.currentStageName,phase2:!!window.__secondRound,party:!!window.__gardenPartyOn,started:window.__gameStarted(),state:state,seen:seen,errors:(window.__errs||[]).slice()});},2100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else {
    failures++;
    console.log("  \u2717 " + msg + (detail ? " [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html direct URL entries:");
var play = run("#play");
var trailer = run("#trailer");
var autoplay = run("#autoplay");
var recoveryAutoplay = runRecovery("#autoplay", RECOVERY_AUTOPLAY);
var recoveryTrailer = runRecovery("#trailer", RECOVERY_TRAILER);
var urlKeys = lib.runPageSync("rsvp.html", URL_KEYS, 2900, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?keys=%5B%5D#play"
});

check(play && !play.revealed && !play.cinematic && !play.autoplay,
  "#play is game-only and starts no presentation", play);
check(trailer && !trailer.revealed && trailer.cinematic && !trailer.autoplay,
  "#trailer is game-only and starts the fixed reel", trailer);
check(autoplay && !autoplay.revealed && !autoplay.cinematic && autoplay.autoplay && autoplay.started,
  "#autoplay is game-only and starts the persistent director", autoplay);
check(recoveryAutoplay && recoveryAutoplay.waiting && !recoveryAutoplay.gate &&
    recoveryAutoplay.autoplay && recoveryAutoplay.room === "office",
  "#autoplay waits behind recovery, then continues from the restored room", recoveryAutoplay);
check(recoveryTrailer && !recoveryTrailer.gate && recoveryTrailer.cinematic && recoveryTrailer.checkpoint,
  "#trailer starts across recovery without discarding the saved checkpoint", recoveryTrailer);
check(urlKeys && !urlKeys.gate && urlKeys.room === "kitchen" && !urlKeys.phase2 && !urlKeys.party &&
    urlKeys.started && urlKeys.state && urlKeys.state.done &&
    urlKeys.seen.join("|") === "down:[|up:[|down:]|up:]",
  "?keys starts fresh without recovery and dispatches paired keyboard gestures in order", urlKeys);
[play, trailer, autoplay].forEach(function (report) {
  check(report && report.errors.length === 0,
    (report && report.hash || "missing entry") + " has no uncaught page errors",
    report && report.errors);
});
check(recoveryAutoplay && recoveryAutoplay.errors.length === 0 &&
    recoveryTrailer && recoveryTrailer.errors.length === 0,
  "recovery URL entries have no uncaught page errors",
  { autoplay: recoveryAutoplay && recoveryAutoplay.errors, trailer: recoveryTrailer && recoveryTrailer.errors });
check(urlKeys && urlKeys.errors.length === 0, "?keys has no uncaught page errors", urlKeys && urlKeys.errors);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
