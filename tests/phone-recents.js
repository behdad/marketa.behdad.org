#!/usr/bin/env node
// The phone's square navigation button opens a real recent-app switcher and
// returns to the app that was showing when the switcher opened.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' window.__openPhoneApp("notes");var shell=document.querySelector(".phone-shell");',
  ' shell.querySelector(".pnav-recents").click();S("first",{screen:shell.classList.contains("pm-recents"),labels:Array.from(shell.querySelectorAll(".pra-label")).map(function(n){return n.textContent;})});',
  ' shell.querySelector(".pnav-back").click();S("back",{screen:shell.classList.contains("pm-app"),notes:!!shell.querySelector(".pmn-pad")});',
  ' window.__openPhoneApp("calculator");shell.querySelector(".pnav-recents").click();S("order",Array.from(shell.querySelectorAll(".pra-label")).map(function(n){return n.textContent;}));',
  ' shell.querySelectorAll(".phone-recent-app")[1].click();S("launch",{screen:shell.classList.contains("pm-app"),notes:!!shell.querySelector(".pmn-pad")});',
  ' shell.querySelector(".pnav-recents").click();shell.querySelector(".pnav-recents").click();S("toggle",{screen:shell.classList.contains("pm-app"),notes:!!shell.querySelector(".pmn-pad")});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},350);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html phone recent-app switcher:");
var r = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.first.screen && s.first.labels[0] === "notes", "Recents opens with the current app first", s.first);
check(s.back.screen && s.back.notes, "Back returns to the app that opened Recents", s.back);
check(s.order[0] === "calculator" && s.order[1] === "notes", "apps are ordered most-recent first without duplicates", s.order);
check(s.launch.screen && s.launch.notes, "a recent-app row reopens that app", s.launch);
check(s.toggle.screen && s.toggle.notes, "pressing Recents again returns to the current app", s.toggle);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
