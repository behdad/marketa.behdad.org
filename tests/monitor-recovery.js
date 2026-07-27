#!/usr/bin/env node
// Monitor checkpoints keep only safe shell identities. Every restored foreground app
// must dismiss to the lit desktop without changing PC power.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};',
  'var classes={chrome:"show-browser",music:"show-nowplaying",photobooth:"photobooth",video:"show-video",call:"show-family",chat:"show-chat",mail:"show-mail",calendar:"show-calendar",clock:"show-clock",tattoo:"show-tattoo",mines:"show-mines",pacman:"show-pacman",life:"show-life",code:"show-code",console:"show-console",weather:"show-weather",about:"show-about",credits:"show-credits"};',
  'var safe=Object.keys(classes),unsafe=["doom","python","linux"],monitor,tower;',
  'function shell(){return {tower:tower.classList.contains("on"),here:monitor.classList.contains("here"),screen:monitor.classList.contains("screen-on"),desktop:monitor.classList.contains("show-caps")};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' monitor=document.getElementById("office-monitor");tower=document.getElementById("office-pc-desk-trio");window.goToStage("office");',
  ' var restored=[];safe.forEach(function(id){var foreground=id==="call"?"family":id;window.__restoreCheckpointSystems({pc:{powered:true},monitor:{surface:"monitor",screenOn:true,foreground:foreground,running:[foreground,"doom","python","linux"],zoomed:false}},"beforeStage");var before=shell(),captured=window.__captureCheckpointSystems().monitor,consumed=window.__closeTopMonitorApp(false),after=shell();restored.push({id:id,before:before,captured:captured,consumed:consumed,closed:!monitor.classList.contains(classes[id]),after:after});});report.steps.restored=restored;',
  ' var rejected=[];unsafe.forEach(function(id){window.__restoreCheckpointSystems({pc:{powered:true},monitor:{surface:"monitor",screenOn:true,foreground:id,running:["mail",id],zoomed:false}},"beforeStage");var row=window.__captureCheckpointSystems().monitor;rejected.push({id:id,shell:shell(),foreground:row.foreground,running:row.running.slice().sort(),classOpen:monitor.classList.contains("show-"+id)});});report.steps.rejected=rejected;',
  ' var capturedUnsafe=[];unsafe.forEach(function(id){window.__restoreCheckpointSystems({pc:{powered:true},monitor:{surface:"monitor",screenOn:true,foreground:"desktop",running:[],zoomed:false}},"beforeStage");monitor.classList.remove("show-caps");monitor.classList.add("show-"+id);window.__markMonitorAppRunning(id);capturedUnsafe.push({id:id,row:window.__captureCheckpointSystems().monitor});});report.steps.captureUnsafe=capturedUnsafe;',
  ' window.__restoreCheckpointSystems({pc:{powered:true},monitor:{surface:"monitor",screenOn:true,foreground:"desktop",running:[],zoomed:false}},"beforeStage");unsafe.forEach(function(id){monitor.classList.add("show-"+id);window.__markMonitorAppRunning(id);});monitor.classList.add("show-mail");window.__markMonitorAppRunning("mail");report.steps.captureSafe=window.__captureCheckpointSystems().monitor;',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},250);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html monitor checkpoint safety:");
var r = lib.runPageSync("rsvp.html", HARNESS, 1700, { patchRaf: true, urlSuffix: "#play" });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.restored && s.restored.length === 18 && s.restored.every(function (x) {
  return x.before.tower && x.before.here && x.before.screen && x.before.desktop &&
    x.captured.foreground === x.id && x.captured.running.indexOf(x.id) >= 0 &&
    ["doom", "python", "linux"].every(function (id) { return x.captured.running.indexOf(id) < 0; }) &&
    x.consumed && x.closed && x.after.tower && x.after.here && x.after.screen && x.after.desktop;
}), "every checkpoint-safe foreground dismisses to the lit desktop without powering off", s.restored);
check(s.rejected && s.rejected.length === 3 && s.rejected.every(function (x) {
  return x.shell.tower && x.shell.here && x.shell.screen && x.shell.desktop &&
    x.foreground === "desktop" && x.running.join(",") === "mail" && !x.classOpen;
}), "legacy runtime rows restore as a safe desktop and omit their running identities", s.rejected);
check(s.captureUnsafe && s.captureUnsafe.every(function (x) {
  return x.row.foreground === "desktop" && x.row.running.length === 0;
}), "new captures replace each runtime foreground with the desktop and omit its running identity", s.captureUnsafe);
check(s.captureSafe && s.captureSafe.foreground === "mail" && s.captureSafe.running.join(",") === "mail",
  "new captures retain safe foreground and running identities beside filtered hosts", s.captureSafe);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
