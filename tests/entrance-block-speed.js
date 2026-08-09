#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[]};',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  'window.__unlockAllRooms();window.goToStage("balcony");window.__openEntranceRoom();window.__openEntrancePorscheDriveHud();window.__toggleEntrancePorscheEngine();document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
  'window.__entranceDriveSetMotion(30,2);var before=window.__entranceRoomState().drive.position;window.__entranceDriveStep(1000);var streetState=window.__entranceRoomState().drive;',
  'var started=window.__entranceRoadtripDevStart();window.__entranceRoadtripSetLane(.5);window.__entranceDriveSetMotion(30,2);var highwayBefore=window.__entranceRoomState().drive.position;window.__entranceDriveStep(1000);var highwayState=window.__entranceRoomState().drive;',
  'report.before=before;report.street=streetState.position;report.streetSpeed=Math.abs(streetState.speed);report.started=started;report.highwayBefore=highwayBefore;report.highway=highwayState.position;report.highwaySpeed=Math.abs(highwayState.speed);',
  '}catch(error){report.errors.push(String(error&&error.stack||error));}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},140);});',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", HARNESS, 2200, {
  patchRaf: true,
  seedRandom: true,
  urlSuffix: "#play",
  chromeFlags: "--window-size=1100,900"
});
var failed = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failed++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}
console.log("rsvp.html block driving travel rate:");
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
var streetTravel = result && Math.abs(result.street - result.before);
var highwayTravel = result && Math.abs(result.highway - result.highwayBefore);
var speedAdjustedRatio = result && streetTravel / highwayTravel * result.highwaySpeed / result.streetSpeed;
check(result && result.started && streetTravel > 0 && highwayTravel > 0 &&
  result.streetSpeed > 0 && result.highwaySpeed > 0 && Math.abs(speedAdjustedRatio - 2) < .03,
  "the block moves at twice the highway world rate after normalizing grade-adjusted speed", {
    streetTravel: streetTravel,
    highwayTravel: highwayTravel,
    streetSpeed: result && result.streetSpeed,
    highwaySpeed: result && result.highwaySpeed,
    speedAdjustedRatio: speedAdjustedRatio
  });
if (failed) process.exit(1);
console.log("block driving travel-rate assertions passed.");
