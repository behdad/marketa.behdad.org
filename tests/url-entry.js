#!/usr/bin/env node
"use strict";

// The direct hash family shares one game-only shell, but only Trailer takes
// ownership after normal entry/recovery initialization has settled.
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'window.turnstile={render:function(){return "url-entry-widget";},remove:function(){},execute:function(){}};',
  'window.addEventListener("load",function(){setTimeout(function(){',
  'var report={hash:location.hash,revealed:document.documentElement.classList.contains("revealed"),cinematic:!!window.__cinematic,started:!!(window.__gameStarted&&window.__gameStarted()),errors:(window.__errs||[]).slice()};',
  'document.getElementById("__report").textContent=JSON.stringify(report);',
  '},1900);});',
  '})();</script>'
].join("\n");

function run(urlSuffix) {
  return lib.runPageSync("rsvp.html", HARNESS, 2600, {
    patchRaf: true,
    forceMotion: true,
    urlSuffix: urlSuffix
  });
}

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
  'window.addEventListener("load",function(){setTimeout(function(){var state=window.__urlKeysState();document.getElementById("__report").textContent=JSON.stringify({gate:!!document.getElementById("loft-recovery-gate"),intro:!!document.getElementById("click-me-overlay"),introChrome:!!document.querySelector(".intro-active"),checkpointBeforePlay:!!localStorage.getItem("loftCheckpoint:v1"),room:window.currentStageName,phase2:!!window.__secondRound,party:!!window.__gardenPartyOn,started:window.__gameStarted(),state:state,seen:seen,errors:(window.__errs||[]).slice()});},2100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else {
    failures++;
    console.log("  ✗ " + msg + (detail ? " [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html direct URL entries:");
var play = run("#play");
var trailer = run("#trailer");
var legacyHash = run("#autoplay");
var legacyQueryPlay = run("?autoplay=1#play");
var recoveryTrailer = runRecovery("#trailer", RECOVERY_TRAILER);
var urlKeys = lib.runPageSync("rsvp.html", URL_KEYS, 2900, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?keys=%5B%5D#play"
});

check(play && !play.revealed && !play.cinematic,
  "#play is game-only and starts no presentation", play);
check(trailer && !trailer.revealed && trailer.cinematic,
  "#trailer is game-only and starts the fixed reel", trailer);
check(legacyHash && legacyHash.revealed && !legacyHash.cinematic && !legacyHash.started,
  "#autoplay no longer claims the game-only shell or starts a presentation", legacyHash);
check(legacyQueryPlay && !legacyQueryPlay.revealed && !legacyQueryPlay.cinematic,
  "?autoplay no longer changes #play entry behavior", legacyQueryPlay);
check(recoveryTrailer && !recoveryTrailer.gate && recoveryTrailer.cinematic && recoveryTrailer.checkpoint,
  "#trailer starts across recovery without discarding the saved checkpoint", recoveryTrailer);
check(urlKeys && !urlKeys.gate && !urlKeys.intro && !urlKeys.introChrome &&
    urlKeys.room === "kitchen" && !urlKeys.phase2 && !urlKeys.party &&
    urlKeys.started && urlKeys.state && urlKeys.state.done &&
    urlKeys.seen.join("|") === "down:[|up:[|down:]|up:]",
  "?keys starts directly in fresh play and dispatches paired keyboard gestures in order", urlKeys);
[play, trailer, legacyHash, legacyQueryPlay].forEach(function (report) {
  check(report && report.errors.length === 0,
    (report && report.hash || "missing entry") + " has no uncaught page errors",
    report && report.errors);
});
check(recoveryTrailer && recoveryTrailer.errors.length === 0,
  "recovery Trailer entry has no uncaught page errors",
  recoveryTrailer && recoveryTrailer.errors);
check(urlKeys && urlKeys.errors.length === 0, "?keys has no uncaught page errors", urlKeys && urlKeys.errors);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
