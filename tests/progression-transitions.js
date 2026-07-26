#!/usr/bin/env node
// Shared progression mirrors and their DOM projections have named transition owners.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__setMaxUnlocked(2);S("unlock",{max:window.__maxUnlocked(),locked:[].map.call(document.querySelectorAll(".room-dot"),function(x){return x.classList.contains("locked");})});window.__setMaxUnlocked(0);',
  ' window.__setSecondRound(true,{releaseHeld:false});var phaseMax=window.__maxUnlocked();window.__setSecondRound(false,{releaseHeld:false});S("phase",{on:!!window.__secondRound,max:phaseMax,latchedMax:window.__maxUnlocked()});',
  ' window.__setOfficeProgress("prague",true);window.__setOfficeProgress("pc",true);S("officeOn",{prague:!!window.__pragueCalled,pc:!!window.__pcPlayed});window.__setOfficeProgress("prague",false);window.__setOfficeProgress("pc",false);S("officeOff",{prague:!!window.__pragueCalled,pc:!!window.__pcPlayed});',
  ' window.__shortOutMonitor();var monitor=document.getElementById("office-monitor");S("shortOn",{flag:!!window.__monitorShorted,klass:monitor.classList.contains("shorted")});window.__clearMonitorShort();S("shortOff",{flag:!!window.__monitorShorted,klass:monitor.classList.contains("shorted")});',
  ' window.__setSecondRound(true,{releaseHeld:false});window.__setOfficeProgress("prague",true);window.__setOfficeProgress("pc",true);window.__shortOutMonitor();window.__activateExtinguisher();await sleep(1300);S("reset",{phase:!!window.__secondRound,max:window.__maxUnlocked(),prague:!!window.__pragueCalled,pc:!!window.__pcPlayed,shorted:!!window.__monitorShorted,shortClass:monitor.classList.contains("shorted")});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html progression transitions:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3200, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.unlock && s.unlock.max === 2 && s.unlock.locked.slice(0, 3).every(function (x) { return !x; }) && s.unlock.locked.slice(3).every(Boolean),
  "setMaxUnlocked updates the navigation projection", s.unlock);
check(s.phase && !s.phase.on && s.phase.max === 4 && s.phase.latchedMax === 4,
  "setSecondRound unlocks all rooms and phase-off preserves reached-room progress", s.phase);
check(s.officeOn && s.officeOn.prague && s.officeOn.pc && s.officeOff && !s.officeOff.prague && !s.officeOff.pc,
  "setOfficeProgress owns both office solve milestones", { on: s.officeOn, off: s.officeOff });
check(s.shortOn && s.shortOn.flag && s.shortOn.klass && s.shortOff && !s.shortOff.flag && !s.shortOff.klass,
  "setMonitorShorted keeps its flag and rendering class together", { on: s.shortOn, off: s.shortOff });
check(s.reset && !s.reset.phase && s.reset.max === 0 && !s.reset.prague && !s.reset.pc && !s.reset.shorted && !s.reset.shortClass,
  "full reset settles every progression transition through its owner", s.reset);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check((source.match(/window\.__secondRound\s*=/g) || []).length === 1 &&
      (source.match(/window\.__monitorShorted\s*=/g) || []).length === 1 &&
      !(source.match(/window\.__(?:pragueCalled|pcPlayed)\s*=/g) || []).length &&
      /function setOfficeProgress\(kind, on\)[\s\S]*?window\[prop\]\s*=\s*!!on/.test(source),
  "shared progression mirrors have only their named writers");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
