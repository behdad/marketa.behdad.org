#!/usr/bin/env node
"use strict";

// The shared load-progress cover belongs to every game-only entry, whether it is
// opened in a browser or as the installed app. The ordinary revealed invitation
// must never mount it. Recovery and CLICK ME may become ready behind the cover,
// but neither is exercised until the loader has completed and removed itself.
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
    'var report={sync:{revealed:document.documentElement.classList.contains("revealed"),installed:document.documentElement.classList.contains("installed-app"),used:window.__installedLoaderUsed,complete:window.__installedLoaderComplete,present:!!loader,display:loader?getComputedStyle(loader).display:null,title:loader?loader.querySelector(".installed-load-title").textContent:null,label:loader?loader.querySelector(".installed-load-label").textContent:null},later:null,afterAction:null,errors:[]};',
    'window.addEventListener("load",function(){setTimeout(function(){try{',
    ' var clickMe=document.getElementById("click-me-overlay"),gate=document.getElementById("loft-recovery-gate");',
    ' report.later={complete:window.__installedLoaderComplete,present:!!document.getElementById("installed-load"),ready:document.documentElement.classList.contains("loft-entry-ready"),pending:document.documentElement.classList.contains("loft-entry-pending"),clickMe:!!clickMe,gate:!!gate};',
    options.recovery
      ? ' var button=gate&&gate.querySelector(".loft-recovery-btn.primary");if(button)button.click();'
      : ' if(clickMe)clickMe.click();',
    ' setTimeout(function(){report.afterAction={loader:!!document.getElementById("installed-load"),gate:!!document.getElementById("loft-recovery-gate"),clickMe:!!document.getElementById("click-me-overlay"),started:!!(window.__gameStarted&&window.__gameStarted())};report.errors=(window.__errs||[]).slice();document.getElementById("__report").textContent=JSON.stringify(report);},80);',
    '}catch(error){report.errors=(window.__errs||[]).concat([String(error&&error.stack||error)]);document.getElementById("__report").textContent=JSON.stringify(report);}},1250);});',
    '})();</script>'
  ].join("\n");
}

function run(options) {
  return lib.runPageSync("rsvp.html", harness(options), 2200, {
    patchRaf: true,
    forceStandalone: !!options.standalone,
    urlSuffix: options.gameOnly ? "#play" : ""
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

console.log("rsvp.html game-entry loader:");
var revealed = run({});
var browser = run({ gameOnly: true });
var czech = run({ gameOnly: true, czech: true });
var installed = run({ gameOnly: true, standalone: true });
var recovery = run({ gameOnly: true, recovery: true });

check(revealed && revealed.sync.revealed && !revealed.sync.used && revealed.sync.complete &&
  !revealed.sync.present && revealed.later && !revealed.later.present,
  "the ordinary revealed invitation never mounts or flashes the loader", revealed);

check(czech && czech.sync.title === "Den v podkroví" && czech.sync.label === "Načítá se podkroví…",
  "the browser game-entry loader honors the saved Czech language", czech && czech.sync);

[
  ["browser #play", browser, false],
  ["installed #play", installed, true]
].forEach(function (row) {
  var label = row[0], report = row[1], expectsInstalled = row[2];
  check(report && !report.sync.revealed && report.sync.installed === expectsInstalled &&
    report.sync.used && !report.sync.complete && report.sync.present && report.sync.display === "flex",
    label + " shows bilingual progress during parsing", report && report.sync);
  check(report && report.later && report.later.complete && !report.later.present &&
    report.later.ready && !report.later.pending && report.later.clickMe &&
    report.afterAction && !report.afterAction.loader && !report.afterAction.clickMe && report.afterAction.started,
    label + " clears progress before CLICK ME accepts interaction", report);
});

check(recovery && recovery.sync.used && !recovery.sync.complete && recovery.sync.present &&
  recovery.later && recovery.later.complete && !recovery.later.present && recovery.later.ready &&
  recovery.later.gate && recovery.afterAction && !recovery.afterAction.loader &&
  !recovery.afterAction.gate && recovery.afterAction.started,
  "checkpoint recovery is uncovered before Continue can restore the game", recovery);

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
