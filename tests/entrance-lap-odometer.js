#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function state(){return window.__entranceRoomState();}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__setRoomSolved("kitchen",true);window.goToStage("balcony");window.__openEntranceRoom();await sleep(30);window.__openEntrancePorscheDriveHud();window.__toggleEntrancePorscheEngine();await sleep(30);',
  'var odometer=document.getElementById("entrance-drive-lap-odometer"),started=state(),startedText=odometer&&odometer.textContent;window.__entranceDriveSetMotion(180,4);window.__entranceDriveControl("throttle",true);for(var i=0;i<60;i++)window.__entranceDriveStep(80);window.__entranceDriveControl("throttle",false);await sleep(30);',
  'var wrapped=state(),wrappedText=odometer&&odometer.textContent,wrappedShape={hasWraps:Object.prototype.hasOwnProperty.call(wrapped.drive,"wraps"),hasLapCount:Object.prototype.hasOwnProperty.call(wrapped.drive,"lapCount")};',
  'window.__toggleEntrancePorscheEngine();await sleep(20);var stopped=state();window.__toggleEntrancePorscheEngine();await sleep(30);var restarted=state(),restartedText=odometer&&odometer.textContent;',
  'window.__entranceDriveSetMotion(180,4);window.__entranceDriveControl("throttle",true);for(var j=0;j<60;j++)window.__entranceDriveStep(80);window.__entranceDriveControl("throttle",false);await sleep(20);var beforeSave=state(),saved=window.__saveLoftCheckpoint(),raw=localStorage.getItem("loftCheckpoint:v1"),payload=raw&&JSON.parse(raw);window.__restoreCheckpointSystems(payload&&payload.systems,"afterStage");await sleep(40);report.steps={started:started,startedText:startedText,wrapped:wrapped,wrappedText:wrappedText,wrappedShape:wrappedShape,stopped:stopped,restarted:restarted,restartedText:restartedText,beforeSave:beforeSave,saved:saved,persisted:payload&&payload.systems&&payload.systems.entrance&&payload.systems.entrance.drive,restored:state()};',
  '}catch(error){report.errors.push(String(error&&error.stack||error));}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},180);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Porsche lap-count odometer:");
var result = lib.runPageSync("rsvp.html", HARNESS, 6000, {
  patchRaf: true,
  seedRandom: true,
  chromeFlags: "--window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.started && s.started.drive.lapCount === 0 && /0$/.test(s.startedText || ""),
  "engine start initializes a distinct lap counter in the left instrument", s.started);
check(s.wrapped && s.wrapped.drive.wraps > 0 && s.wrapped.drive.lapCount === s.wrapped.drive.wraps &&
  s.wrappedShape && s.wrappedShape.hasWraps && s.wrappedShape.hasLapCount &&
  s.wrappedText && new RegExp(String(s.wrapped.drive.lapCount) + "$").test(s.wrappedText),
  "completed street wraps increment the separate odometer and its left-instrument readout", s.wrapped);
check(s.stopped && s.stopped.drive.lapCount === s.wrapped.drive.lapCount,
  "stopping the engine does not erase the current engine-run count", {stopped:s.stopped,wrapped:s.wrapped});
check(s.restarted && s.restarted.drive.lapCount === 0 && /0$/.test(s.restartedText || ""),
  "starting the engine again resets only the odometer count", s.restarted);
check(s.beforeSave && s.beforeSave.drive.lapCount > 0 && s.saved &&
  s.persisted && s.persisted.lapCount === s.beforeSave.drive.lapCount &&
  s.restored && s.restored.drive.lapCount === s.beforeSave.drive.lapCount &&
  s.restored.drive.wraps === s.beforeSave.drive.wraps,
  "save-resume persists lapCount alongside, but separately from, the existing wrap state", {
    beforeSave:s.beforeSave, persisted:s.persisted, restored:s.restored
  });
if (failures) process.exit(1);
