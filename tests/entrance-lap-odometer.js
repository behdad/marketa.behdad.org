#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function state(){return window.__entranceRoomState();}',
  'function driveAt(speed,gear,seconds){for(var i=0;i<seconds;i++){window.__entranceDriveSetMotion(speed,gear);window.__entranceDriveStep(1000);}}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__setRoomSolved("kitchen",true);window.__goToStage("balcony");window.__openEntranceRoom();await sleep(30);window.__openEntrancePorscheDriveHud();document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));window.__toggleEntrancePorscheEngine();await sleep(30);',
  'var odometer=document.getElementById("entrance-drive-odometer"),started=state(),startedText=odometer&&odometer.textContent;driveAt(90,3,8);var street=state(),streetText=odometer&&odometer.textContent,shape={hasOdometer:Object.prototype.hasOwnProperty.call(street.drive,"odometerKm"),hasLapCount:Object.prototype.hasOwnProperty.call(street.drive,"lapCount")};',
  'window.__toggleEntrancePorscheEngine();await sleep(20);var stopped=state();window.__toggleEntrancePorscheEngine();await sleep(30);var restarted=state(),restartedText=odometer&&odometer.textContent;',
  'var highwayStarted=window.__entranceRoadtripDevStart();driveAt(90,3,4);var highway=state(),highwayText=odometer&&odometer.textContent;driveAt(-36,-1,4);var reversed=state(),reversedText=odometer&&odometer.textContent;',
  'var saved=window.__saveLoftCheckpoint(),raw=localStorage.getItem("loftCheckpoint:v1"),payload=raw&&JSON.parse(raw),persisted=payload&&payload.systems&&payload.systems.entrance&&payload.systems.entrance.drive;window.__restoreCheckpointSystems(payload&&payload.systems,"afterStage");await sleep(40);var restored=state(),restoredText=odometer&&odometer.textContent;',
  'report.steps={started:started,startedText:startedText,street:street,streetText:streetText,shape:shape,stopped:stopped,restarted:restarted,restartedText:restartedText,highwayStarted:highwayStarted,highway:highway,highwayText:highwayText,reversed:reversed,reversedText:reversedText,saved:saved,persisted:persisted,restored:restored,restoredText:restoredText};',
  '}catch(error){report.errors.push(String(error&&error.stack||error));}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},180);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function displayFor(km) {
  var tenths = Math.floor(Math.max(0, km) * 10) / 10;
  return (tenths % 1000).toFixed(1).padStart(5, "0") + " KM";
}

console.log("rsvp.html Porsche total-distance odometer:");
var result = lib.runPageSync("rsvp.html", HARNESS, 6000, {
  patchRaf: true,
  seedRandom: true,
  chromeFlags: "--window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.started && s.started.drive.odometerKm === 0 && s.startedText === "000.0 KM",
  "a fresh game starts a real kilometre odometer at zero", s.started);
check(s.street && s.street.drive.odometerKm > .15 && s.street.drive.odometerKm < .3 &&
  s.shape && s.shape.hasOdometer && !s.shape.hasLapCount && s.streetText === displayFor(s.street.drive.odometerKm),
  "street driving accumulates physical distance and exposes no lap counter", {street:s.street,text:s.streetText,shape:s.shape});
check(s.stopped && s.restarted &&
  Math.abs(s.stopped.drive.odometerKm - s.street.drive.odometerKm) < .0001 &&
  Math.abs(s.restarted.drive.odometerKm - s.street.drive.odometerKm) < .0001 &&
  s.restartedText === displayFor(s.restarted.drive.odometerKm),
  "stopping and restarting the engine never resets the odometer", {street:s.street,stopped:s.stopped,restarted:s.restarted});
check(s.highwayStarted && s.highway && s.highway.drive.roadtrip.active &&
  s.highway.drive.odometerKm > s.restarted.drive.odometerKm + .07 &&
  s.highwayText === displayFor(s.highway.drive.odometerKm),
  "highway kilometres continue the same total", {restarted:s.restarted,highway:s.highway,text:s.highwayText});
check(s.reversed && s.reversed.drive.odometerKm > s.highway.drive.odometerKm + .025 &&
  s.reversedText === displayFor(s.reversed.drive.odometerKm),
  "reverse travel also adds distance instead of subtracting it", {highway:s.highway,reversed:s.reversed,text:s.reversedText});
check(s.saved && s.persisted && s.restored &&
  Math.abs(s.persisted.odometerKm - s.reversed.drive.odometerKm) <= .001 &&
  s.restored.drive.odometerKm >= s.persisted.odometerKm &&
  s.restored.drive.odometerKm < s.persisted.odometerKm + .005 &&
  s.restoredText === displayFor(s.restored.drive.odometerKm),
  "save-resume preserves the accumulating total and its instrument readout", {
    reversed:s.reversed, persisted:s.persisted, restored:s.restored, text:s.restoredText
  });
if (failures) process.exit(1);
