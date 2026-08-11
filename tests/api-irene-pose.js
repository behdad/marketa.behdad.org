#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],poses:[],cancel:{}};',
  'function visible(pose){var el=document.getElementById("cuddly-irene");return !!(el&&el.classList.contains("showing")&&el.classList.contains("irene-"+pose));}',
  'function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' await window.loft.room.go("cuddly");',
  ' var poses=["roam","bounce","sit","hug","hugb","catplay","catjump","octiplay","swing"];',
  ' for(var i=0;i<poses.length;i++){var pose=poses[i],started=performance.now(),version=window.loft.api.stateVersion,promise=window.loft.people.irene.pose(pose),earlyVersion=null;if(pose==="catplay"||pose==="catjump"){await wait(50);earlyVersion=window.loft.api.stateVersion;}var result=await promise;report.poses.push({pose:pose,result:result,visible:visible(pose),elapsed:performance.now()-started,versionBefore:version,versionEarly:earlyVersion,versionAfter:window.loft.api.stateVersion});}',
  ' var pending=window.loft.people.irene.pose("catplay");await wait(50);var sent=await window.loft.people.irene.set(false),cancelled=await pending;await wait(1100);report.cancel.setFalse={pending:cancelled,sent:sent,resurrected:visible("catplay")};',
  ' pending=window.loft.people.irene.pose("catjump");await wait(50);var newer=await window.loft.people.irene.pose("sit"),superseded=await pending;await wait(1100);report.cancel.newer={pending:superseded,newer:newer,sit:visible("sit"),resurrected:visible("catjump")};',
  ' pending=window.loft.people.irene.pose("catplay");await wait(50);window.__resetIrene();var reset=await pending;await wait(1100);report.cancel.reset={pending:reset,resurrected:visible("catplay")};',
  ' pending=window.loft.people.irene.pose("catjump");await wait(50);window.__goToStage("office");var left=await pending;await wait(1100);report.cancel.leave={pending:left,room:window.__currentStageName,resurrected:visible("catjump")};',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("loft Irene pose lifecycle:");
var result = lib.runPageSync("loft-day.html", HARNESS, 30000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(result.poses.length === 9 && result.poses.every(function (entry) { return entry.result && entry.result.ok && entry.visible; }), "every pose settles only with its requested pose visible", result.poses);
check(result.poses.filter(function (entry) { return entry.pose === "catplay" || entry.pose === "catjump"; }).every(function (entry) { return entry.elapsed >= 900; }), "cat poses advertise finite work and await their walk-in", result.poses);
check(result.poses.filter(function (entry) { return entry.pose === "catplay" || entry.pose === "catjump"; }).every(function (entry) { return entry.versionEarly === entry.versionBefore && entry.versionAfter === entry.versionBefore + 1; }), "cat poses advance typed state only when the visible pose completes", result.poses);
check(result.cancel.setFalse.pending && !result.cancel.setFalse.pending.ok && result.cancel.setFalse.pending.code === "FAILED" && result.cancel.setFalse.sent.ok && !result.cancel.setFalse.resurrected, "set(false) cancels a pending cat pose without resurrection", result.cancel.setFalse);
check(result.cancel.newer.pending && !result.cancel.newer.pending.ok && result.cancel.newer.pending.code === "FAILED" && result.cancel.newer.newer.ok && result.cancel.newer.sit && !result.cancel.newer.resurrected, "a newer pose supersedes a pending cat pose", result.cancel.newer);
check(result.cancel.reset.pending && !result.cancel.reset.pending.ok && result.cancel.reset.pending.code === "FAILED" && !result.cancel.reset.resurrected, "reset cancels a pending cat pose", result.cancel.reset);
check(result.cancel.leave.pending && !result.cancel.leave.pending.ok && result.cancel.leave.pending.code === "FAILED" && result.cancel.leave.room === "office" && !result.cancel.leave.resurrected, "room teardown cancels a pending cat pose", result.cancel.leave);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All Irene pose lifecycle checks passed.");
