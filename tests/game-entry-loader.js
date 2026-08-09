#!/usr/bin/env node
"use strict";

// Browser and installed game entries paint CLICK ME or recovery first. Only the
// player's entry choice raises progress while the remaining background load settles.
var lib = require("./lib");

function harness(options) {
  options = options || {};
  return [
    '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
    '<script>(function(){',
    options.czech
      ? 'if(!sessionStorage.getItem("loader-czech-seeded")){sessionStorage.setItem("loader-czech-seeded","1");localStorage.setItem("lang","cs");location.reload();return;}'
      : '',
    options.recovery
      ? 'var saved={version:1,savedAt:Date.now()-120000,progress:{room:"office",maxUnlocked:4,solvedRooms:["kitchen"],phase2:false,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null};if(!sessionStorage.getItem("loader-recovery-seeded")){sessionStorage.setItem("loader-recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}'
      : '',
    'var loader=document.getElementById("installed-load");',
    'var report={sync:{revealed:document.documentElement.classList.contains("revealed"),installed:document.documentElement.classList.contains("installed-app"),used:window.__installedLoaderUsed,complete:window.__installedLoaderComplete,present:!!loader,display:loader?getComputedStyle(loader).display:null},preload:null,splash:null,during:null,after:null,errors:[]};',
    options.early
      ? 'var earlyClick=document.getElementById("click-me-overlay");if(earlyClick){earlyClick.click();loader=document.getElementById("installed-load");report.preload={used:window.__installedLoaderUsed,complete:window.__installedLoaderComplete,present:!!loader,display:loader?getComputedStyle(loader).display:null,loading:document.documentElement.classList.contains("loft-loading-play"),clickMe:!!document.getElementById("click-me-overlay"),title:loader&&loader.querySelector(".installed-load-title").textContent,label:loader&&loader.querySelector(".installed-load-label").textContent};}'
      : '',
    'window.addEventListener("load",function(){setTimeout(function(){try{',
    ' loader=document.getElementById("installed-load");var clickMe=document.getElementById("click-me-overlay"),gate=document.getElementById("loft-recovery-gate");',
    ' report.splash={used:window.__installedLoaderUsed,complete:window.__installedLoaderComplete,present:!!loader,display:loader?getComputedStyle(loader).display:null,loading:document.documentElement.classList.contains("loft-loading-play"),ready:document.documentElement.classList.contains("loft-entry-ready"),pending:document.documentElement.classList.contains("loft-entry-pending"),clickMe:!!clickMe,gate:!!gate,started:!!(window.__gameStarted&&window.__gameStarted())};',
    options.early
      ? ''
      : options.recovery
      ? ' var button=gate&&gate.querySelector(".loft-recovery-btn.primary");if(button)button.click();'
      : ' if(clickMe)clickMe.click();',
    ' setTimeout(function(){loader=document.getElementById("installed-load");report.during={used:window.__installedLoaderUsed,complete:window.__installedLoaderComplete,present:!!loader,display:loader?getComputedStyle(loader).display:null,loading:document.documentElement.classList.contains("loft-loading-play"),title:loader&&loader.querySelector(".installed-load-title").textContent,label:loader&&loader.querySelector(".installed-load-label").textContent,gate:!!document.getElementById("loft-recovery-gate"),clickMe:!!document.getElementById("click-me-overlay"),started:!!(window.__gameStarted&&window.__gameStarted())};},80);',
    ' setTimeout(function(){report.after={used:window.__installedLoaderUsed,complete:window.__installedLoaderComplete,loader:!!document.getElementById("installed-load"),loading:document.documentElement.classList.contains("loft-loading-play"),gate:!!document.getElementById("loft-recovery-gate"),clickMe:!!document.getElementById("click-me-overlay"),started:!!(window.__gameStarted&&window.__gameStarted())};report.errors=(window.__errs||[]).slice();document.getElementById("__report").textContent=JSON.stringify(report);},1200);',
    '}catch(error){report.errors=(window.__errs||[]).concat([String(error&&error.stack||error)]);document.getElementById("__report").textContent=JSON.stringify(report);}},80);});',
    '})();</script>'
  ].join("\n");
}

function run(options) {
  return lib.runPageSync(options.gameOnly ? "loft-day.html" : "rsvp.html", harness(options), 2800, {
    patchRaf: true,
    forceStandalone: !!options.standalone
  });
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? " [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("Loft Day game-entry loader:");
var revealed = run({});
var browser = run({ gameOnly: true });
var czech = run({ gameOnly: true, czech: true, early: true });
var installed = run({ gameOnly: true, standalone: true });
var recovery = run({ gameOnly: true, recovery: true });

check(revealed && revealed.sync.revealed && !revealed.sync.used && revealed.sync.complete &&
  !revealed.sync.present && revealed.splash && !revealed.splash.present && revealed.after &&
  revealed.after.started && !revealed.after.loader,
  "the revealed invitation never mounts a game-entry loader", revealed);

[
  ["canonical browser", browser, false],
  ["canonical installed", installed, true]
].forEach(function (row) {
  var label = row[0], report = row[1], expectsInstalled = row[2];
  check(report && !report.sync.revealed && report.sync.installed === expectsInstalled &&
    !report.sync.used && !report.sync.complete && report.sync.present && report.sync.display === "none" &&
    report.splash && !report.splash.used && !report.splash.complete && report.splash.present &&
    report.splash.display === "none" && !report.splash.loading && report.splash.ready &&
    report.splash.clickMe && !report.splash.gate && !report.splash.started,
    label + " paints CLICK ME while progress remains dormant", report);
  check(report && report.during && !report.during.used && report.during.complete &&
    !report.during.present && !report.during.loading && !report.during.clickMe && report.during.started &&
    report.after && report.after.complete && !report.after.loader && !report.after.loading && report.after.started,
    label + " enters immediately when background loading already finished", report);
});

check(czech && czech.preload && czech.preload.used && !czech.preload.complete &&
  czech.preload.present && czech.preload.display === "flex" && czech.preload.loading &&
  czech.preload.clickMe && czech.preload.title === "Den v podkroví" &&
  czech.preload.label === "Načítá se podkroví…" && czech.after && czech.after.complete &&
  !czech.after.loader && czech.after.started,
  "an early selection shows only the truthful remaining Czech progress", czech);

check(recovery && recovery.splash && recovery.splash.gate && !recovery.splash.clickMe &&
  !recovery.splash.loading && recovery.during && !recovery.during.loading && !recovery.during.gate &&
  recovery.during.started && recovery.after && recovery.after.complete && !recovery.after.loader &&
  !recovery.after.gate && recovery.after.started,
  "Continue paints first and restores immediately once background loading is done", recovery);

[revealed, browser, czech, installed, recovery].forEach(function (report, index) {
  check(report && report.errors.length === 0,
    ["revealed", "browser", "Czech browser", "installed", "recovery"][index] + " entry has no uncaught errors",
    report && report.errors);
});

if (failures) {
  console.log("\n" + failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
