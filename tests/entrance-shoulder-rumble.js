#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[]};function snap(){var svg=document.getElementById("entrance-drive-hud-svg"),car=document.getElementById("entrance-porsche");return {state:window.__entranceRoomState().drive,active:svg.classList.contains("roadtrip-shoulder-rumble"),amplitude:parseFloat(svg.style.getPropertyValue("--roadtrip-rumble-y")),period:parseFloat(svg.style.getPropertyValue("--roadtrip-rumble-period")),carVibrating:car.classList.contains("engine-idling"),carVibeX:parseFloat(car.style.getPropertyValue("--porsche-vibe-x"))};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  'window.__unlockAllRooms();window.goToStage("balcony");window.__openEntranceRoom();window.__openEntrancePorscheDriveHud();window.__toggleEntrancePorscheEngine();window.__entranceRoadtripDevStart();window.__entranceRoadtripSetRoute("banff",0);window.__entranceRoadtripSetLane(2.14);',
  'window.__entranceDriveSetMotion(0,0);window.__entranceDriveStep(20);report.stopped=snap();',
  'window.__entranceDriveControl("throttle",true);window.__entranceDriveStep(1000);report.highRpm=snap();window.__entranceDriveControl("throttle",false);',
  'window.__entranceDriveSetMotion(15,1);window.__entranceDriveStep(20);report.slow=snap();',
  'window.__entranceDriveSetMotion(110,3);window.__entranceDriveStep(20);report.fast=snap();',
  'window.__entranceDriveSetMotion(0,0);window.__entranceDriveStep(20);report.stoppedAgain=snap();',
  '}catch(error){report.errors.push(String(error&&error.stack||error));}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},140);});',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("loft-day.html", HARNESS, 2200, {
  patchRaf: true,
  seedRandom: true,
  chromeFlags: "--no-default-browser-check --noerrdialogs --window-size=1100,900"
});
var failed = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failed++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}
console.log("loft-day.html shoulder rumble speed:");
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(result && result.stopped.state.roadtrip.shoulderZone !== "road" && !result.stopped.active,
  "a stopped Porsche on the shoulder does not shake the scene", result && result.stopped);
check(result && result.stopped.carVibrating && result.highRpm.carVibrating && !result.highRpm.active &&
  result.highRpm.state.rpm > result.stopped.state.rpm && result.highRpm.carVibeX > result.stopped.carVibeX,
  "stationary highway engine vibration remains local to the car and grows with RPM", result && {
    idle:result.stopped, highRpm:result.highRpm
  });
check(result && result.slow.active && result.slow.amplitude > 0 && result.fast.active &&
  result.fast.amplitude > result.slow.amplitude && result.fast.period < result.slow.period,
  "shoulder shake grows stronger and quicker with wheel speed", result && { slow:result.slow, fast:result.fast });
check(result && !result.stoppedAgain.active,
  "coming to a stop immediately clears shoulder shake", result && result.stoppedAgain);
if (failed) process.exit(1);
console.log("shoulder rumble assertions passed.");
