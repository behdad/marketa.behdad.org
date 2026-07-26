#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'var nativeFetch=window.fetch;',
  'window.fetch=function(url,opts){',
  ' if(/doom\\/doom\\.js(?:$|[?#])/.test(String(url))){',
  '  var glue=["var setWindowTitle=function(title){document.title = title;};","setWindowTitle(\\"DOOM\\");","Module.pauseMainLoop=function(){};Module.resumeMainLoop=function(){};","Module.callMain=function(){setWindowTitle(\\"FreeDM\\");};","Module.onRuntimeInitialized();"].join("\\n");',
  '  return Promise.resolve({text:function(){return Promise.resolve(glue);}});',
  ' }',
  ' return nativeFetch.call(this,url,opts);',
  '};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");',
  ' window.goToStage("office");if(tower)tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");',
  ' document.title="Wedding host title";window.__openMonitorApp("doom");await sleep(120);',
  ' S("launch",{title:document.title,running:window.__doomRunning(),open:mon.classList.contains("show-doom")});',
  ' window.__closeMonitorDoom();await sleep(30);S("close",{title:document.title,open:mon.classList.contains("show-doom")});',
  ' window.__openMonitorApp("doom");window.__killMonitorDoom();await sleep(2250);S("kill",{title:document.title,running:window.__doomRunning(),open:mon.classList.contains("show-doom")});',
  ' window.__openMonitorApp("doom");await sleep(80);window.__restartMonitorDoom();await sleep(2250);S("restart",{title:document.title,running:window.__doomRunning(),open:mon.classList.contains("show-doom")});',
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
check(s.launch.title === "Wedding host title" && s.launch.running && s.launch.open,
  "launch and SDL main cannot replace the host title", s.launch);
check(s.close.title === "Wedding host title" && !s.close.open,
  "ordinary close leaves the host title intact", s.close);
check(s.kill.title === "Wedding host title" && !s.kill.running && !s.kill.open,
  "Kill leaves the host title intact through teardown", s.kill);
check(s.restart.title === "Wedding host title" && s.restart.running && s.restart.open,
  "Restart leaves the host title intact through a fresh runtime", s.restart);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
