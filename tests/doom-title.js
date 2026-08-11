#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");',
  ' window.__goToStage("office");if(tower)tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");',
  ' document.title="Wedding host title";window.__openMonitorApp("doom");await sleep(30);',
  ' var first=document.querySelector("#monitor-shoot-host iframe");',
  ' S("launch",{title:document.title,running:window.__doomRunning(),open:mon.classList.contains("show-doom"),frame:!!first});',
  ' window.__closeMonitorDoom();await sleep(30);S("close",{title:document.title,open:mon.classList.contains("show-doom"),removed:!document.querySelector("#monitor-shoot-host iframe"),running:window.__doomRunning()});',
  ' window.__openMonitorApp("doom");window.__killMonitorDoom();await sleep(2250);S("kill",{title:document.title,running:window.__doomRunning(),open:mon.classList.contains("show-doom"),frame:!!document.querySelector("#monitor-shoot-host iframe")});',
  ' window.__openMonitorApp("doom");await sleep(30);var before=document.querySelector("#monitor-shoot-host iframe");window.__restartMonitorDoom();await sleep(2250);var after=document.querySelector("#monitor-shoot-host iframe");S("restart",{title:document.title,running:window.__doomRunning(),open:mon.classList.contains("show-doom"),fresh:!!after&&after!==before});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html embedded Doom title ownership:");
var r = lib.runPageSync("rsvp.html", HARNESS, 6500, { patchRaf: true, forceMotion: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.launch.title === "Wedding host title" && s.launch.running && s.launch.open && s.launch.frame,
  "launch creates an isolated frame without replacing the host title", s.launch);
check(s.close.title === "Wedding host title" && !s.close.open && s.close.removed && !s.close.running,
  "ordinary close silently tears down the isolated frame", s.close);
check(s.kill.title === "Wedding host title" && !s.kill.running && !s.kill.open && !s.kill.frame,
  "Kill leaves the host title intact through teardown", s.kill);
check(s.restart.title === "Wedding host title" && s.restart.running && s.restart.open && s.restart.fresh,
  "Restart leaves the host title intact through a fresh iframe", s.restart);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
