#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}function state(){return window.__entranceRoomState().drive;}',
  'function pointer(target,type,id){target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:"touch",button:0,isPrimary:true}));}',
  'function click(target){target.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,button:0}));}',
  'function tap(target,id){pointer(target,"pointerdown",id);pointer(target,"pointerup",id);click(target);}',
  'function labels(){var hud=document.getElementById("entrance-drive-hud");return {hidden:hud.classList.contains("drive-shift-key-held"),brake:getComputedStyle(document.querySelector("#entrance-drive-brake .entrance-drive-key")).opacity,throttle:getComputedStyle(document.querySelector("#entrance-drive-throttle .entrance-drive-key")).opacity};}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__goToStage("balcony");window.__openEntranceRoom();window.__openEntrancePorscheDriveHud();window.__entranceDriveTransmissionMode("manual",false);window.__toggleEntrancePorscheEngine();await sleep(80);',
  'var shifter=document.getElementById("entrance-drive-shifter"),lever=document.getElementById("entrance-drive-shifter-lever"),four=Array.from(shifter.querySelectorAll("[data-drive-gear]")).find(function(el){return el.getAttribute("data-drive-gear")==="4";});window.__entranceDriveShift(2,true);pointer(lever,"pointerdown",20);pointer(shifter,"pointercancel",20);report.steps.cancelBeforeHoldImmediate=state();await sleep(520);report.steps.cancelBeforeHold=state();window.__entranceDriveShift(0,true);click(lever);report.steps.mouseClick=state();window.__entranceDriveShift(0,true);tap(lever,21);report.steps.shortTap=state();',
  'window.__entranceDriveControl("clutch",true);tap(four,22);window.__entranceDriveControl("clutch",false);report.steps.gateTap=state();',
  'window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"Shift",code:"ShiftLeft",shiftKey:true}),true);var labelsHeld=labels();window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",shiftKey:true}),true);var keyUp=state();window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",shiftKey:true,repeat:true}),true);var keyRepeat=state();window.__entranceDriveKey(new KeyboardEvent("keyup",{key:"ArrowUp",code:"ArrowUp",shiftKey:true}),false);var labelsAfterArrow=labels();window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowDown",code:"ArrowDown",shiftKey:true}),true);var keyDown=state();window.__entranceDriveKey(new KeyboardEvent("keyup",{key:"Shift",code:"ShiftLeft",shiftKey:false}),false);report.steps.keyboard={up:keyUp,repeat:keyRepeat,down:keyDown,labelsHeld:labelsHeld,labelsAfterArrow:labelsAfterArrow,labelsRestored:labels()};',
  'window.__entranceDriveShift(6,true);pointer(lever,"pointerdown",23);await sleep(970);var held=state();pointer(lever,"pointerup",23);click(lever);var released=state();await sleep(360);report.steps.longPress={held:held,released:released,settled:state()};',
  'window.__entranceDriveShift(6,true);pointer(lever,"pointerdown",24);await sleep(500);pointer(shifter,"pointercancel",24);var cancelled=state();window.__entranceDriveShift(2,true);await sleep(520);report.steps.cancelAfterHold={cancelled:cancelled,settled:state()};',
  'await sleep(800);window.__entranceDriveShift(3,true);shifter.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2}));report.steps.contextMenu=state();',
  '}catch(error){report.errors.push(String(error&&error.stack||error));}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", HARNESS, 10000, {
  patchRaf: true,
  chromeFlags: process.env.PORSCHE_GEARSHIFT_CHROME_FLAGS
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Porsche gearshift touch controls:");
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
var s = result && result.steps || {};
check(s.mouseClick && s.mouseClick.gear === 1,
  "a click on the shifter upshifts exactly once", s.mouseClick);
check(s.shortTap && s.shortTap.gear === 1,
  "a short shifter tap upshifts exactly once despite its following click", s.shortTap);
check(s.gateTap && s.gateTap.gear === 4,
  "a labelled H-pattern gate remains directly selectable with the clutch held", s.gateTap);
check(s.keyboard && s.keyboard.up.gear === 5 && s.keyboard.repeat.gear === 5 && s.keyboard.down.gear === 4,
  "Shift+Up/Down keyboard shifting keeps its one-step, no-repeat behavior", s.keyboard);
check(s.keyboard && s.keyboard.labelsHeld.hidden && s.keyboard.labelsHeld.brake === "0" &&
  s.keyboard.labelsHeld.throttle === "0" && s.keyboard.labelsAfterArrow.hidden &&
  !s.keyboard.labelsRestored.hidden && s.keyboard.labelsRestored.brake === "1" &&
  s.keyboard.labelsRestored.throttle === "1",
  "holding Shift hides both pedal arrows until Shift release", s.keyboard);
check(s.longPress && s.longPress.held.gear <= 3 && s.longPress.held.gear >= -1 &&
  s.longPress.released.gear === s.longPress.held.gear && s.longPress.settled.gear === s.longPress.held.gear,
  "a long press repeatedly downshifts and release suppresses both repeat and the synthetic click", s.longPress);
check(s.cancelAfterHold && s.cancelAfterHold.cancelled.gear < 6 && s.cancelAfterHold.settled.gear === 2,
  "pointer cancel stops an active downshift repeat", s.cancelAfterHold);
check(s.cancelBeforeHoldImmediate && s.cancelBeforeHoldImmediate.gear === 2 &&
  s.cancelBeforeHold && s.cancelBeforeHold.gear === 2,
  "pointer cancel before the hold threshold does not shift", { immediate: s.cancelBeforeHoldImmediate, settled: s.cancelBeforeHold });
check(s.contextMenu && s.contextMenu.gear === 2,
  "desktop context-menu downshift remains available", s.contextMenu);

if (failures) { console.log("\n" + failures + " Porsche gearshift touch assertion(s) failed."); process.exit(1); }
console.log("\nPorsche gearshift touch assertions passed.");
