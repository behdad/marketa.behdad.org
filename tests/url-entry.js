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
var recoveryTrailer = runRecovery("#trailer", RECOVERY_TRAILER);

check(play && !play.revealed && !play.cinematic,
  "#play is game-only and starts no presentation", play);
check(trailer && !trailer.revealed && trailer.cinematic,
  "#trailer is game-only and starts the fixed reel", trailer);
check(recoveryTrailer && !recoveryTrailer.gate && recoveryTrailer.cinematic && recoveryTrailer.checkpoint,
  "#trailer starts across recovery without discarding the saved checkpoint", recoveryTrailer);
[play, trailer].forEach(function (report) {
  check(report && report.errors.length === 0,
    (report && report.hash || "missing entry") + " has no uncaught page errors",
    report && report.errors);
});
check(recoveryTrailer && recoveryTrailer.errors.length === 0,
  "recovery Trailer entry has no uncaught page errors",
  recoveryTrailer && recoveryTrailer.errors);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
