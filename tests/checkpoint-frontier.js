#!/usr/bin/env node
// Continue restores the saved room frontier directly. Restoring Balcony-owned
// environment state must not visit Balcony and unlock later rooms as a side effect.
"use strict";

var lib = require("./lib");

function harness(bbqOn) {
  var key = "checkpoint-frontier-" + (bbqOn ? "on" : "off");
  return [
    '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
    '<script>(function(){',
    'var saved={version:1,savedAt:Date.now()-1000,progress:{room:"garden",maxUnlocked:1,solvedRooms:["kitchen"],seenRooms:["kitchen","garden"],phase2:false,party:false,daylight:true,bbq:' + JSON.stringify(bbqOn) + '},puzzle:{},phone:null,album:null,systems:{}};',
    'if(!sessionStorage.getItem(' + JSON.stringify(key) + ')){sessionStorage.setItem(' + JSON.stringify(key) + ',"1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
    'var report={errors:[],roomChanges:[]};',
    'window.addEventListener("loft:statechange",function(event){var d=event.detail;if(d&&d.id==="room.change")report.roomChanges.push(d.args&&d.args.room);});',
    'window.addEventListener("load",function(){setTimeout(function(){try{',
    ' var before=JSON.parse(localStorage.getItem("loftCheckpoint:v1"));var gate=document.getElementById("loft-recovery-gate");',
    ' report.before={gate:!!gate,room:before.progress.room,max:before.progress.maxUnlocked,solved:before.progress.solvedRooms,bbq:before.progress.bbq};',
    ' gate.querySelector(".loft-recovery-btn.primary").click();',
    ' var smoker=document.getElementById("balcony-smoker"),dots=[].slice.call(document.querySelectorAll(".hunt-dot"));',
    ' report.after={room:window.currentStageName,max:window.__maxUnlocked(),solved:window.__solvedRooms(),bbq:!!window.bbq.status(),open:smoker.classList.contains("open"),smoking:smoker.classList.contains("smoking"),locked:dots.map(function(dot){return dot.classList.contains("locked");}),storedMax:JSON.parse(localStorage.getItem("loftCheckpoint:v1")).progress.maxUnlocked};',
    '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
    'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},250);});',
    '})();</script>'
  ].join("\n");
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("loft-day.html checkpoint room frontier:");
[false, true].forEach(function (bbqOn) {
  var label = "BBQ " + (bbqOn ? "on" : "off");
  var result = lib.runPageSync("loft-day.html", harness(bbqOn), 1400, {
    patchRaf: true,
    urlSuffix: "?date=2026-07-15&time=12:00"
  });
  check(result && result.errors.length === 0, label + " recovery has no uncaught errors", result && result.errors);
  check(result && result.before && result.before.gate && result.before.room === "garden" &&
    result.before.max === 1 && result.before.solved.join(",") === "kitchen" && result.before.bbq === bbqOn,
  label + " starts from an intact Garden-frontier checkpoint", result && result.before);
  check(result && result.roomChanges.join(",") === "garden",
    label + " Continue makes one direct room transition without visiting Balcony", result && result.roomChanges);
  check(result && result.after && result.after.room === "garden" && result.after.max === 1 &&
    result.after.storedMax === 1 && result.after.solved.join(",") === "kitchen" &&
    result.after.locked.join(",") === "false,false,true,true,true",
  label + " preserves the saved room frontier in memory, navigation, and the rewritten checkpoint", result && result.after);
  check(result && result.after && result.after.bbq === bbqOn && result.after.open === bbqOn &&
    result.after.smoking === bbqOn,
  label + " still restores the Balcony-owned BBQ state", result && result.after);
});

if (failures) process.exit(1);
console.log("Checkpoint room-frontier assertions passed.");
