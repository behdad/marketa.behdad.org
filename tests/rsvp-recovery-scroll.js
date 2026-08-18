#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"garden",maxUnlocked:1,solvedRooms:["kitchen"],seenRooms:["kitchen","garden"],phase2:false,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null,systems:{}};',
  'if(!sessionStorage.getItem("rsvp-scroll-seeded")){sessionStorage.setItem("rsvp-scroll-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'window.addEventListener("load",function(){setTimeout(function(){var gate=document.getElementById("loft-recovery-gate"),active=document.activeElement;document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,gate:!!gate,y:scrollY,active:!!(active&&active.classList.contains("primary")),gameBelow:document.getElementById("hunt-fullscreen-area").getBoundingClientRect().top>innerHeight});},250);});',
  '})();</script>'
].join("\n");

var report = lib.runPageSync("rsvp.html", harness, 1200, { patchRaf: true });
var pass = report && report.errors.length === 0 && report.gate && report.y === 0 &&
  report.active && report.gameBelow;

console.log((pass ? "  ✓ " : "  ✗ ") +
  "a saved Loft Day session takes recovery focus without scrolling past the RSVP");
if (!pass) {
  console.error(JSON.stringify(report));
  process.exit(1);
}
