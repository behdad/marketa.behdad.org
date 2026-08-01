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
  'function shifter(){var shaft=document.getElementById("entrance-drive-shifter-shaft");return {knob:document.getElementById("entrance-drive-shifter-lever").getAttribute("transform"),shaft:shaft.getAttribute("d"),stroke:shaft.getAttribute("stroke"),width:shaft.getAttribute("stroke-width")};}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.goToStage("balcony");window.__openEntranceRoom();await sleep(30);',
  'var room=document.getElementById("entrance-room"),hud=document.getElementById("entrance-drive-hud"),car=document.getElementById("entrance-porsche"),controls=Array.from(hud.querySelectorAll(".entrance-drive-control"));key("keydown","Enter");await sleep(30);key("keydown","Enter");await sleep(460);report.steps.started={state:state(),hidden:hud.getAttribute("aria-hidden"),controls:controls.map(function(el){return [el.getAttribute("data-drive-hold"),el.getAttribute("data-drive-gear"),el.getAttribute("tabindex"),el.getAttribute("aria-label")];}),layout:{room:box(room.getBoundingClientRect()),hud:box(hud.getBoundingClientRect()),car:box(car.getBoundingClientRect()),controlBoxes:controls.map(function(el){return box(el.getBoundingClientRect());})},navClaims:{up:window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp"}),true),down:window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowDown"}),true)}};key("keyup","ArrowUp");key("keyup","ArrowDown");var signalBefore=state().car;key("keydown","ArrowLeft");key("keyup","ArrowLeft");var signalAfterLeft=state().car;key("keydown","ArrowLeft");key("keyup","ArrowLeft");var signalAfterRepeatLeft=state().car;key("keydown","ArrowRight");key("keyup","ArrowRight");var signalAfterRight=state().car;report.steps.steeringSignal={before:signalBefore,afterLeft:signalAfterLeft,afterRepeatLeft:signalAfterRepeatLeft,afterRight:signalAfterRight};Object.defineProperty(document,"hasFocus",{value:function(){return false;},configurable:true});window.dispatchEvent(new Event("blur"));await sleep(40);report.steps.unfocused=state();Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.dispatchEvent(new Event("focus"));await sleep(120);report.steps.refocused=state();',
  'report.steps.shifterNeutral=shifter();key("keydown","1");report.steps.shifterAttempt=shifter();await sleep(260);report.steps.shifterRestored=shifter();report.steps.badShift=state();',
  'window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",shiftKey:true}),true);var comboUp=state();report.steps.shifterSelected=shifter();window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",shiftKey:true,repeat:true}),true);var comboHeld=state();window.__entranceDriveKey(new KeyboardEvent("keyup",{key:"ArrowUp",code:"ArrowUp",shiftKey:true}),false);window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowDown",code:"ArrowDown",shiftKey:true}),true);report.steps.shiftArrows={up:comboUp,held:comboHeld,down:state()};',
  'key("keydown","Shift");key("keydown","1");key("keyup","Shift");key("keydown","ArrowUp");step(3);key("keyup","ArrowUp");var lowBefore=state();key("keydown","ArrowDown");step(3);key("keyup","ArrowDown");report.steps.lowBrake={before:lowBefore,after:state()};report.steps.brakeAudio={low:window.__entranceDriveBrakeAudio(40),hard:window.__entranceDriveBrakeAudio(180)};',
  'var room=document.getElementById("entrance-room"),hud=document.getElementById("entrance-drive-hud"),car=document.getElementById("entrance-porsche"),controls=Array.from(hud.querySelectorAll(".entrance-drive-control"));key("keydown","Enter");await sleep(30);key("keydown","Enter");await sleep(460);report.steps.started={state:state(),hidden:hud.getAttribute("aria-hidden"),controls:controls.map(function(el){return [el.getAttribute("data-drive-hold"),el.getAttribute("data-drive-gear"),el.getAttribute("tabindex"),el.getAttribute("aria-label")];}),layout:{room:box(room.getBoundingClientRect()),hud:box(hud.getBoundingClientRect()),car:box(car.getBoundingClientRect()),controlBoxes:controls.map(function(el){return box(el.getBoundingClientRect());})},navClaims:{up:window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp"}),true),down:window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowDown"}),true)}};key("keyup","ArrowUp");key("keyup","ArrowDown");window.temp(24);await sleep(50);report.steps.hotAc=state();Object.defineProperty(document,"hasFocus",{value:function(){return false;},configurable:true});window.dispatchEvent(new Event("blur"));await sleep(320);report.steps.unfocused=state();Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.dispatchEvent(new Event("focus"));await sleep(120);report.steps.refocused=state();window.temp(23);await sleep(320);report.steps.coolAc=state();window.temp(false);',
  'var spatialKinds=["engine","music","screech","abs"],spatialClosed={};spatialKinds.forEach(function(kind){spatialClosed[kind]=window.__entranceDriveSpatialAudio(kind);});document.getElementById("entrance-porsche-roof").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(30);var spatialOpen={};spatialKinds.forEach(function(kind){spatialOpen[kind]=window.__entranceDriveSpatialAudio(kind);});document.getElementById("entrance-porsche-roof").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(30);report.steps.spatialAudio={closed:spatialClosed,open:spatialOpen};',
  'key("keydown","1");await sleep(20);report.steps.badShift=state();',
  'window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",shiftKey:true}),true);var comboUp=state();window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",shiftKey:true,repeat:true}),true);var comboHeld=state();window.__entranceDriveKey(new KeyboardEvent("keyup",{key:"ArrowUp",code:"ArrowUp",shiftKey:true}),false);window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowDown",code:"ArrowDown",shiftKey:true}),true);report.steps.shiftArrows={up:comboUp,held:comboHeld,down:state()};',
  'key("keydown","Shift");key("keydown","1");key("keyup","Shift");key("keydown","ArrowUp");step(12);key("keyup","ArrowUp");var first=state();key("keydown","Shift");key("keydown","2");key("keyup","Shift");key("keydown","ArrowUp");step(15);key("keyup","ArrowUp");var second=state();key("keydown","Shift");key("keydown","3");key("keyup","Shift");key("keydown","ArrowUp");step(20);key("keyup","ArrowUp");report.steps.forward={first:first,second:second,third:state()};report.steps.spatialMoved={engine:window.__entranceDriveSpatialAudio("engine"),music:window.__entranceDriveSpatialAudio("music")};',
  'key("keydown","ArrowDown");step(1);key("keyup","ArrowDown");report.steps.brake=state();',
  'key("keydown","Shift");key("keydown","n");key("keyup","Shift");key("keydown","ArrowUp");step(120);report.steps.redlineGrace=state();step(30);key("keyup","ArrowUp");report.steps.redline=state();',
  'if(!state().car.engineOn)key("keydown","Enter");key("keydown","ArrowDown");step(30);key("keyup","ArrowDown");key("keydown","Shift");key("keydown","r");key("keyup","Shift");key("keydown","ArrowUp");step(12);key("keyup","ArrowUp");report.steps.reverse=state();',
  'var gearCaps=[60,100,150,200,250,300],gearCeilings=[];key("keydown","ArrowDown");step(20);key("keyup","ArrowDown");for(var gear=1;gear<=6;gear++){window.__entranceDriveShift(gear,true);window.__entranceDriveControl("throttle",true);for(var ticks=0;ticks<150;ticks++)window.__entranceDriveStep(80);window.__entranceDriveControl("throttle",false);gearCeilings.push({gear:gear,speed:state().drive.speed,cap:gearCaps[gear-1]});}window.__entranceDriveShift(1,true);report.steps.gearCeilings=gearCeilings;report.steps.downshiftToFirst=state().drive;',
  'key("keydown","ArrowDown");step(20);key("keyup","ArrowDown");for(var gear=1;gear<=6;gear++){key("keydown","Shift");key("keydown",String(gear));key("keyup","Shift");key("keydown","ArrowUp");step(gear<4?12:18);key("keyup","ArrowUp");}key("keydown","ArrowUp");step(100);key("keyup","ArrowUp");report.steps.wrap=state();',
  'window.__entranceDriveControl("steerLeft",true);window.__entranceDriveControl("brake",true);step(1);report.steps.leftSpin={state:state(),spinning:car.classList.contains("spinning"),from:car.style.getPropertyValue("--porsche-spin-from"),to:car.style.getPropertyValue("--porsche-spin-to")};window.__entranceDriveControl("steerLeft",false);window.__entranceDriveControl("brake",false);await sleep(780);report.steps.leftSettled=state();window.__entranceDriveControl("steerRight",true);window.__entranceDriveControl("brake",true);step(1);report.steps.rightSpin={state:state(),spinning:car.classList.contains("spinning"),from:car.style.getPropertyValue("--porsche-spin-from"),to:car.style.getPropertyValue("--porsche-spin-to")};window.__entranceDriveControl("steerRight",false);window.__entranceDriveControl("brake",false);await sleep(780);report.steps.rightSettled=state();',
  'var clutch=document.getElementById("entrance-drive-clutch");clutch.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:9,pointerType:"mouse"}));clutch.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:9,pointerType:"mouse"}));report.steps.latchOn=state();clutch.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:10,pointerType:"mouse"}));clutch.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:10,pointerType:"mouse"}));report.steps.latchOff=state();',
  'window.__dismissEntrancePorscheDriveHud();await sleep(30);var nav=[];var oldNav=window.__navigateLowerRoom;window.__navigateLowerRoom=function(room){nav.push(room);};key("keydown","ArrowLeft");report.steps.closedHudNav={hud:state().drive.hud,rooms:nav.slice()};window.__navigateLowerRoom=oldNav;window.__openEntrancePorscheDriveHud();',
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
check(s.started && s.started.state.car.engineOn && s.started.state.drive.hud &&
  s.started.state.car.vibrating && s.started.state.drive.musicActive && s.started.hidden === "false" &&
  s.started.controls.length === 13 && s.started.controls.every(function (row) { return row[2] === null && row[3]; }),
  "starting the engine raises a labelled, pointer-only dashboard", s.started);
var layout = s.started && s.started.layout;
check(layout && Math.abs(layout.hud.top - layout.room.top) <= 1 &&
  Math.abs(layout.hud.left - layout.room.left) <= 1 && Math.abs(layout.hud.right - layout.room.right) <= 1 &&
  layout.hud.height >= layout.room.height * .59 && layout.hud.height <= layout.room.height * .63 &&
  layout.car.top >= layout.hud.bottom - 2 && layout.car.bottom <= layout.room.bottom + 8,
  "one full-width dashboard panel runs from the scene top through the window-sill line", layout);
check(layout && layout.controlBoxes.every(function (rect) {
  return rect.left >= layout.hud.left - 2 && rect.right <= layout.hud.right + 2 &&
    rect.top >= layout.hud.top - 2 && rect.bottom <= layout.hud.bottom + 2;
}), "every pointer control remains clipped inside the dashboard frame", layout && layout.controlBoxes);
check(s.started && s.started.navClaims && s.started.navClaims.up && s.started.navClaims.down,
  "the open dashboard claims Up/Down for throttle and brake", s.started && s.started.navClaims);
check(s.steeringSignal &&
  s.steeringSignal.afterLeft.indicatorFlashes > s.steeringSignal.before.indicatorFlashes &&
  s.steeringSignal.afterRepeatLeft.indicatorFlashes === s.steeringSignal.afterLeft.indicatorFlashes &&
  s.steeringSignal.afterRight.indicatorSounds > s.steeringSignal.afterRepeatLeft.indicatorSounds,
  "steering signals immediately, throttles only the same side, and preserves the opposite-side sound", s.steeringSignal);
check(s.unfocused && !s.unfocused.drive.musicActive && s.refocused && s.refocused.drive.musicActive,
  "the driving score tears down while unfocused and returns with the attended HUD", {unfocused:s.unfocused,refocused:s.refocused});
check(s.shifterNeutral && s.shifterNeutral.knob === "translate(-1 15)" && s.shifterNeutral.shaft === "M475 155L475 123" &&
  s.shifterNeutral.stroke === "url(#entrance-drive-shaft-metal)" && s.shifterNeutral.width === "9" &&
  s.shifterAttempt && s.shifterAttempt.knob === "translate(-9 8)" && s.shifterAttempt.shaft === "M475 155L467 116" &&
  s.shifterSelected && s.shifterSelected.knob === s.shifterAttempt.knob && s.shifterSelected.shaft === s.shifterAttempt.shaft &&
  s.shifterRestored && s.shifterRestored.knob === s.shifterNeutral.knob && s.shifterRestored.shaft === s.shifterNeutral.shaft,
  "the shifter knob visits selected and attempted gates while the shaft pivots from its fixed base", {neutral:s.shifterNeutral,attempt:s.shifterAttempt,selected:s.shifterSelected,restored:s.shifterRestored});
check(s.hotAc && s.hotAc.drive.outsideTemperature === 24 && s.hotAc.drive.acBlasting && s.hotAc.drive.acAudioActive &&
  s.unfocused && s.unfocused.drive.acBlasting && !s.unfocused.drive.acAudioActive &&
  s.refocused && s.refocused.drive.acAudioActive &&
  s.coolAc && s.coolAc.drive.outsideTemperature === 23 && !s.coolAc.drive.acBlasting && !s.coolAc.drive.acAudioActive,
 "hot effective weather runs attended HUD AC, with focus and threshold teardown", {hot:s.hotAc,unfocused:s.unfocused,refocused:s.refocused,cool:s.coolAc});
check(s.badShift && !s.badShift.drive.stalled && s.badShift.car.engineOn && s.badShift.drive.hud && s.badShift.drive.gear === 0,
  "selecting a keyboard gear without the clutch grinds back to neutral", s.badShift);
check(s.shiftArrows && s.shiftArrows.up.drive.gear === 1 && s.shiftArrows.held.drive.gear === 1 &&
  s.shiftArrows.down.drive.gear === 0,
  "fresh Shift+Up/Down steps one gear without key-repeat cycling", s.shiftArrows);
check(s.lowBrake && s.lowBrake.before.drive.speed > 10 && s.lowBrake.before.drive.speed < 65 &&
  s.lowBrake.after.drive.tireMarks === 0 &&
  s.lowBrake.after.drive.brakeScreeches === s.lowBrake.before.drive.brakeScreeches &&
  s.lowBrake.after.drive.speed < s.lowBrake.before.drive.speed,
  "ordinary low-speed braking stays below the tire-screech threshold", s.lowBrake);
check(s.brakeAudio && !s.brakeAudio.low.active && s.brakeAudio.low.screechGain === 0 &&
  s.brakeAudio.low.screechToneGain === 0 && s.brakeAudio.low.absGain === 0 &&
  s.brakeAudio.hard.active && s.brakeAudio.hard.screechGain >= s.brakeAudio.hard.absGain * 25 &&
  s.brakeAudio.hard.screechToneGain > s.brakeAudio.hard.absGain &&
  s.brakeAudio.hard.screechFrequency > s.brakeAudio.low.screechFrequency,
  "brake audio stays silent below threshold and foregrounds tire screech over quiet ABS at speed", s.brakeAudio);
var spatial = s.spatialAudio;
check(spatial && spatial.closed && spatial.open &&
  spatial.closed.engine.anchor === "entrance-porsche" && spatial.closed.screech.anchor === "entrance-porsche" &&
  spatial.closed.music.anchor === "entrance-drive-hud" && spatial.closed.abs.anchor === "entrance-drive-brake" &&
  ["engine", "music", "screech", "abs"].every(function (kind) {
    return !spatial.closed[kind].roofOpen && spatial.open[kind].roofOpen &&
      spatial.closed[kind].gain < spatial.open[kind].gain &&
      spatial.closed[kind].cutoff < spatial.open[kind].cutoff;
  }), "engine, music, screech, and ABS use localized outputs softened by the closed roof", spatial);
check(s.spatialMoved && spatial &&
  Math.abs(s.spatialMoved.engine.pan - spatial.closed.engine.pan) > .05 &&
  Math.abs(s.spatialMoved.music.pan - spatial.closed.music.pan) < .01,
  "car-borne audio follows road travel while the cabin score stays anchored to the HUD", {
    initial: spatial && spatial.closed, moved: s.spatialMoved
  });
check(s.forward && s.forward.first.drive.gear === 1 && s.forward.first.drive.speed > 45 &&
  !s.forward.first.car.vibrating &&
  s.forward.second.drive.gear === 2 && s.forward.second.drive.speed > 85 &&
  s.forward.third.drive.gear === 3 && s.forward.third.drive.speed > 125 &&
  s.forward.third.drive.position < s.forward.first.drive.position,
  "clutched 1–2–3 shifts deliver substantially quicker acceleration", s.forward);
check(s.brake && s.brake.drive.tireMarks >= 2 && s.brake.drive.speed < s.forward.third.drive.speed &&
  s.brake.drive.brakeScreeches > s.lowBrake.after.drive.brakeScreeches,
  "a hard brake schedules a screech, sheds speed, and leaves paired fading tire marks", s.brake);
check(s.brake && s.brake.drive.spins === 0 && s.brake.drive.facing === 1,
  "ordinary hard braking remains yaw-stable below the spin threshold", s.brake);
check(s.redlineGrace && s.redlineGrace.car.engineOn && !s.redlineGrace.drive.stalled &&
  s.redline && s.redline.drive.stalled && !s.redline.car.engineOn,
  "neutral redline allows ten seconds before stalling the engine", {grace:s.redlineGrace,stalled:s.redline});
check(s.reverse && s.reverse.car.engineOn && s.reverse.drive.gear === -1 && s.reverse.drive.speed < 0,
  "the real reverse gate drives in the opposite direction", s.reverse);
check(s.gearCeilings && s.gearCeilings.length === 6 &&
  s.gearCeilings.every(function (row, index) { return row.speed <= row.cap + .001 && (index === 0 || row.cap > s.gearCeilings[index - 1].cap); }) &&
  s.gearCeilings[0].speed < 150 && s.gearCeilings[0].speed > 48 &&
  s.gearCeilings[5].speed > 285 && s.downshiftToFirst && s.downshiftToFirst.gear === 1 &&
  s.downshiftToFirst.speed <= 60.001,
  "each forward gear respects its ascending speed ceiling", s.gearCeilings);
check(s.wrap && s.wrap.car.engineOn && s.wrap.drive.gear === 6 && s.wrap.drive.wraps > 0 &&
  s.wrap.drive.speed >= 285 && s.wrap.drive.speed <= 300 &&
  s.wrap.drive.position >= -648 && s.wrap.drive.position <= 349,
  "street travel wraps cleanly at the new sixth-gear top speed", s.wrap);
check(s.leftSpin && s.leftSpin.spinning && s.leftSpin.state.drive.spins === 1 &&
  s.leftSpin.state.drive.spinDirection === -1 && s.leftSpin.state.drive.yaw === -180 &&
  s.leftSpin.state.drive.facing === -1 && s.leftSpin.state.drive.speed < 0 &&
  s.leftSpin.from === "0deg" && s.leftSpin.to === "-180deg",
  "high-speed left braking starts a directional 180-degree yaw", s.leftSpin);
check(s.leftSettled && !s.leftSettled.spinning && s.leftSettled.drive.facing === -1 &&
  s.rightSpin && s.rightSpin.spinning && s.rightSpin.state.drive.spins === 2 &&
  s.rightSpin.state.drive.spinDirection === 1 && s.rightSpin.state.drive.yaw === 0 &&
  s.rightSpin.state.drive.facing === 1 && s.rightSpin.from === "-180deg" &&
  s.rightSpin.to === "0deg" && s.rightSettled && !s.rightSettled.spinning,
  "high-speed right braking reverses the yaw direction and settles facing forward", {
    leftSettled: s.leftSettled, rightSpin: s.rightSpin, rightSettled: s.rightSettled
  });
check(s.latchOn && s.latchOn.drive.holds.clutch && s.latchOff && !s.latchOff.drive.holds.clutch,
  "a quick pointer tap latches and releases the clutch for one-pointer shifting", {on:s.latchOn,off:s.latchOff});
check(s.closedHudNav && !s.closedHudNav.hud && JSON.stringify(s.closedHudNav.rooms) === JSON.stringify(["office"]),
  "closed HUD leaves the entrance arrow-key room navigation active", s.closedHudNav);
check(s.closed && !s.closed.open && s.closed.drive.hud && !s.closed.drive.audioActive && !s.closed.drive.musicActive &&
  !s.closed.drive.frameActive && s.closed.drive.speed > 0 && s.closed.drive.position !== 0,
  "leaving parks audio/runtime while retaining the driving state", s.closed);

if (failures) { console.log("\n" + failures + " Porsche driving assertion(s) failed."); process.exit(1); }
console.log("\nPorsche driving assertions passed.");
