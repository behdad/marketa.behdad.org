#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[]};function snap(){var room=document.getElementById("entrance-room"),hud=document.getElementById("entrance-drive-hud"),svg=document.getElementById("entrance-drive-hud-svg"),cockpit=document.getElementById("entrance-drive-cockpit"),world=document.getElementById("entrance-roadtrip-world"),scenery=document.querySelector(".entrance-drive-windshield-day");function transition(node){var style=getComputedStyle(node);return {property:style.transitionProperty,duration:style.transitionDuration,running:node.getAnimations().filter(function(animation){return animation.playState==="running"&&typeof animation.transitionProperty==="string";}).map(function(animation){return animation.transitionProperty;})};}return {active:room.classList.contains("roadtrip-active"),handoff:room.classList.contains("roadtrip-handoff"),hudHeight:getComputedStyle(hud).height,hudTransition:transition(hud),cockpitTransform:getComputedStyle(cockpit).transform,cockpitTransition:transition(cockpit),worldOpacity:getComputedStyle(world).opacity,worldVisibility:getComputedStyle(world).visibility,worldTransition:transition(world),sceneryOpacity:getComputedStyle(scenery).opacity,sceneryVisibility:getComputedStyle(scenery).visibility,sceneryTransition:transition(scenery),viewBox:svg.getAttribute("viewBox")};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  'window.__unlockAllRooms();window.__goToStage("balcony");window.__openEntranceRoom();window.__openEntrancePorscheDriveHud();window.__toggleEntrancePorscheEngine();report.street=snap();report.started=window.__entranceRoadtripDevStart();report.highway=snap();report.exited=window.__exitEntranceRoadtrip();report.returned=snap();',
  '}catch(error){report.errors.push(String(error&&error.stack||error));}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},180);});',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("loft-day.html", HARNESS, 2500, {
  seedRandom: true,
  chromeFlags: "--no-default-browser-check --noerrdialogs --window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}
function ownsNoPresentationTransition(snapshot) {
  return snapshot.hudTransition.duration === "0s" && snapshot.cockpitTransition.duration === "0s" &&
    snapshot.worldTransition.duration === "0s" && snapshot.sceneryTransition.duration === "0s" &&
    snapshot.hudTransition.running.length === 0 && snapshot.cockpitTransition.running.length === 0 &&
    snapshot.worldTransition.running.length === 0 && snapshot.sceneryTransition.running.length === 0;
}

console.log("loft-day.html Road Trip/HUD atomic handoff:");
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(result && result.started && result.highway.active && result.highway.viewBox === "0 -120 680 340" &&
  result.highway.hudHeight !== result.street.hudHeight && result.highway.worldOpacity === "1" &&
  result.highway.worldVisibility === "visible",
  "Road Trip installs one complete highway presentation", result && result.highway);
check(result && result.exited && !result.returned.active && result.returned.viewBox === "0 -31 680 207" &&
  result.returned.hudHeight === result.street.hudHeight && result.returned.cockpitTransform === result.street.cockpitTransform &&
  result.returned.worldOpacity === "0" && result.returned.worldVisibility === "hidden",
  "exit restores the complete street HUD synchronously", result && {street:result.street,returned:result.returned});
check(result && ownsNoPresentationTransition(result.highway) && ownsNoPresentationTransition(result.returned) &&
  result.returned.handoff,
  "neither side can expose an independently resizing or fading intermediate frame", result && {highway:result.highway,returned:result.returned});
if (failures) process.exit(1);
console.log("atomic Road Trip/HUD handoff assertions passed.");
