#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[]};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}function rect(el){var r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};}',
  'function snap(){var hud=document.getElementById("entrance-drive-hud"),fob=document.getElementById("entrance-drive-ignition-fob"),face=document.getElementById("entrance-drive-key-face"),off=document.getElementById("entrance-drive-key-face-off"),on=document.getElementById("entrance-drive-key-face-on"),led=document.getElementById("entrance-drive-key-led");return {engine:hud.classList.contains("drive-engine-on"),fobTransform:fob.getAttribute("transform"),fobRect:rect(fob),faceTransform:getComputedStyle(face).transform,faceRect:rect(face),offOpacity:getComputedStyle(off).opacity,onOpacity:getComputedStyle(on).opacity,offShield:off.querySelectorAll(".entrance-drive-key-shield").length,onShield:on.querySelectorAll(".entrance-drive-key-shield").length,offRect:rect(off),onRect:rect(on),ledOpacity:getComputedStyle(led).opacity,ledAnimation:getComputedStyle(led).animationName,ledRect:rect(led)};}function settleFace(){var style=document.createElement("style");style.textContent="#entrance-drive-key-face,#entrance-drive-key-face-off,#entrance-drive-key-face-on{transition:none !important}";document.head.appendChild(style);}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.goToStage("balcony");var room=document.getElementById("entrance-room"),viewport=document.querySelector(".hunt-viewport"),strip=document.getElementById("loft-game-strip");room.style.transition="none";viewport.style.transition="none";strip.style.transition="none";window.__openEntranceRoom();await sleep(80);window.__openEntrancePorscheDriveHud();document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(1000);window.scrollTo(0,0);report.off=snap();settleFace();window.__toggleEntrancePorscheEngine();await sleep(80);window.scrollTo(0,0);report.on=snap();window.__toggleEntrancePorscheEngine();await sleep(80);window.scrollTo(0,0);report.offAgain=snap();}catch(error){report.errors.push(String(error&&error.stack||error));}document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function closeEnough(a, b, epsilon) { return Math.abs(a - b) <= epsilon; }
function sameRect(a, b) {
  return a && b && closeEnough(a.left, b.left, 1) && closeEnough(a.top, b.top, 1) &&
    closeEnough(a.width, b.width, 1) && closeEnough(a.height, b.height, 1);
}
function sameSize(a, b) {
  return a && b && closeEnough(a.width, b.width, 1) && closeEnough(a.height, b.height, 1);
}

console.log("rsvp.html Porsche ignition-key visual:");
var result = lib.runPageSync("rsvp.html", HARNESS, 5000, {
  patchRaf: true,
  chromeFlags: "--window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var off = result.off, on = result.on, offAgain = result.offAgain;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(off && on && offAgain && !off.engine && on.engine && !offAgain.engine, "ignition states settle off → on → off", {off:off,on:on,offAgain:offAgain});
check(off && on && off.offOpacity === "1" && off.onOpacity === "0" &&
  on.offOpacity === "0" && on.onOpacity === "1" &&
  offAgain.offOpacity === "1" && offAgain.onOpacity === "0",
  "only the matching key face is visible in each settled state", {off:off,on:on,offAgain:offAgain});
check(off && on && off.ledAnimation === "entrance-drive-key-led-pulse" && off.ledOpacity !== "0" &&
  on.ledAnimation === "none" && on.ledOpacity === "0" &&
  off.ledRect.left >= off.fobRect.left && off.ledRect.right <= off.fobRect.left + off.fobRect.width + 1 &&
  off.ledRect.top >= off.fobRect.top && off.ledRect.bottom <= off.fobRect.top + off.fobRect.height + 1,
  "the off-state key LED blinks inside the fob and disappears when running", {off:off,on:on});
check(off && on && off.offShield === 0 && off.onShield === 1 &&
  sameRect(off.offRect, off.onRect) && sameRect(on.offRect, on.onRect),
  "the off fob and running crest share one upright footprint", {off:off,on:on});
check(off && on && off.fobTransform === "translate(10 0)" && on.fobTransform === off.fobTransform &&
  sameSize(off.fobRect, on.fobRect) && sameSize(off.faceRect, on.faceRect) &&
  off.faceTransform !== on.faceTransform,
  "the face flips around its center without moving the fob assembly", {off:off,on:on});
check(offAgain && offAgain.fobTransform === off.fobTransform && sameSize(offAgain.fobRect, off.fobRect) &&
  sameSize(offAgain.faceRect, off.faceRect) && offAgain.faceTransform === off.faceTransform,
  "returning to off restores the original key geometry", {off:off,offAgain:offAgain});

if (failures) { console.log("\n" + failures + " Porsche ignition-key assertion(s) failed."); process.exit(1); }
console.log("\nPorsche ignition-key assertions passed.");
