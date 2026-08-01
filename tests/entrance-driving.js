#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}function box(rect){return {left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height};}',
  'function key(type,key){document.dispatchEvent(new KeyboardEvent(type,{key:key,bubbles:true,cancelable:true}));}',
  'function step(count){for(var i=0;i<count;i++)window.__entranceDriveStep(80);}',
  'function state(){return window.__entranceRoomState();}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.goToStage("balcony");window.__openEntranceRoom();await sleep(30);',
  'var room=document.getElementById("entrance-room"),hud=document.getElementById("entrance-drive-hud"),car=document.getElementById("entrance-porsche"),controls=Array.from(hud.querySelectorAll(".entrance-drive-control"));key("keydown","Enter");await sleep(460);report.steps.started={state:state(),hidden:hud.getAttribute("aria-hidden"),controls:controls.map(function(el){return [el.getAttribute("data-drive-hold"),el.getAttribute("data-drive-gear"),el.getAttribute("tabindex"),el.getAttribute("aria-label")];}),layout:{room:box(room.getBoundingClientRect()),hud:box(hud.getBoundingClientRect()),car:box(car.getBoundingClientRect()),controlBoxes:controls.map(function(el){return box(el.getBoundingClientRect());})},navClaims:{up:window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp"}),true),down:window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowDown"}),true)}};',
  'key("keydown","1");await sleep(20);report.steps.badShift=state();key("keydown","Enter");await sleep(20);',
  'key("keydown","c");key("keydown","1");key("keyup","c");key("keydown","w");step(12);key("keyup","w");var first=state();key("keydown","c");key("keydown","2");key("keyup","c");key("keydown","w");step(15);key("keyup","w");var second=state();key("keydown","c");key("keydown","3");key("keyup","c");key("keydown","w");step(20);key("keyup","w");report.steps.forward={first:first,second:second,third:state()};',
  'key("keydown","s");step(1);key("keyup","s");report.steps.brake=state();',
  'key("keydown","c");key("keydown","n");key("keyup","c");key("keydown","w");step(34);key("keyup","w");report.steps.redline=state();',
  'if(!state().car.engineOn)key("keydown","Enter");key("keydown","s");step(30);key("keyup","s");key("keydown","c");key("keydown","r");key("keyup","c");key("keydown","w");step(12);key("keyup","w");report.steps.reverse=state();',
  'key("keydown","s");step(20);key("keyup","s");for(var gear=1;gear<=6;gear++){key("keydown","c");key("keydown",String(gear));key("keyup","c");key("keydown","w");step(gear<4?12:18);key("keyup","w");}step(110);report.steps.wrap=state();',
  'var clutch=document.getElementById("entrance-drive-clutch");clutch.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:9,pointerType:"mouse"}));clutch.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:9,pointerType:"mouse"}));report.steps.latchOn=state();clutch.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:10,pointerType:"mouse"}));clutch.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:10,pointerType:"mouse"}));report.steps.latchOff=state();',
  'window.__closeEntranceRoom();await sleep(30);report.steps.closed=state();',
  '}catch(error){report.errors.push(String(error&&error.stack||error));}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Porsche driving HUD:");
var result = lib.runPageSync("rsvp.html", HARNESS, 8500, {
  patchRaf: true,
  chromeFlags: "--window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.started && s.started.state.car.engineOn && s.started.state.drive.hud && s.started.hidden === "false" &&
  s.started.controls.length === 12 && s.started.controls.every(function (row) { return row[2] === null && row[3]; }),
  "starting the engine raises a labelled, pointer-only twelve-control dashboard", s.started);
var layout = s.started && s.started.layout;
check(layout && Math.abs(layout.hud.top - layout.room.top) <= 1 &&
  Math.abs(layout.hud.left - layout.room.left) <= 1 && Math.abs(layout.hud.right - layout.room.right) <= 1 &&
  layout.hud.height >= layout.room.height * .59 && layout.hud.height <= layout.room.height * .63 &&
  layout.car.top >= layout.hud.bottom - 2 && layout.car.bottom <= layout.room.bottom + 2,
  "one full-width dashboard panel runs from the scene top through the window-sill line", layout);
check(layout && layout.controlBoxes.every(function (rect) {
  return rect.left >= layout.hud.left - 2 && rect.right <= layout.hud.right + 2 &&
    rect.top >= layout.hud.top - 2 && rect.bottom <= layout.hud.bottom + 2;
}), "every pointer control remains clipped inside the dashboard frame", layout && layout.controlBoxes);
check(s.started && s.started.navClaims && !s.started.navClaims.up && !s.started.navClaims.down,
  "the drivetrain leaves Entrance Up/Down room navigation unclaimed", s.started && s.started.navClaims);
check(s.badShift && s.badShift.drive.stalled && !s.badShift.car.engineOn && !s.badShift.drive.hud,
  "selecting a drive gear without the clutch stalls and retracts the cockpit", s.badShift);
check(s.forward && s.forward.first.drive.gear === 1 && s.forward.first.drive.speed > 15 &&
  s.forward.second.drive.gear === 2 && s.forward.second.drive.speed > s.forward.first.drive.speed &&
  s.forward.third.drive.gear === 3 && s.forward.third.drive.position < s.forward.first.drive.position,
  "clutched 1–2–3 shifts accelerate the car leftward", s.forward);
check(s.brake && s.brake.drive.tireMarks >= 2 && s.brake.drive.speed < s.forward.third.drive.speed,
  "a hard brake sheds speed and leaves paired fading tire marks", s.brake);
check(s.redline && s.redline.drive.stalled && !s.redline.car.engineOn,
  "holding neutral at redline stalls the engine", s.redline);
check(s.reverse && s.reverse.car.engineOn && s.reverse.drive.gear === -1 && s.reverse.drive.speed < 0,
  "the real reverse gate drives in the opposite direction", s.reverse);
check(s.wrap && s.wrap.car.engineOn && s.wrap.drive.gear === 6 && s.wrap.drive.wraps > 0 &&
  s.wrap.drive.position >= -648 && s.wrap.drive.position <= 349,
  "street travel wraps cleanly while preserving sixth-gear momentum", s.wrap);
check(s.latchOn && s.latchOn.drive.holds.clutch && s.latchOff && !s.latchOff.drive.holds.clutch,
  "a quick pointer tap latches and releases the clutch for one-pointer shifting", {on:s.latchOn,off:s.latchOff});
check(s.closed && !s.closed.open && !s.closed.drive.hud && !s.closed.drive.audioActive &&
  !s.closed.drive.frameActive && s.closed.drive.speed === 0 && s.closed.drive.position === 0,
  "leaving parks transient driving motion and audio", s.closed);

if (failures) { console.log("\n" + failures + " Porsche driving assertion(s) failed."); process.exit(1); }
console.log("\nPorsche driving assertions passed.");
