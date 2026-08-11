#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}function box(rect){return {left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height};}',
  'function key(type,key){document.dispatchEvent(new KeyboardEvent(type,{key:key,code:key,bubbles:true,cancelable:true}));}',
  'function step(count){for(var i=0;i<count;i++){var trip=state().drive.roadtrip;if(trip&&trip.active&&window.__exitEntranceRoadtrip)window.__exitEntranceRoadtrip();window.__entranceDriveStep(80);}}',
  'function setMotion(speed,gear){window.__entranceDriveControl("throttle",false);window.__entranceDriveControl("brake",false);window.__entranceDriveControl("clutch",false);return window.__entranceDriveSetMotion(speed,gear);}',
  'function benchmark100(){setMotion(0,1);window.__entranceDriveControl("throttle",true);var elapsed=0,shifts=[];while(elapsed<9000&&Math.abs(state().drive.speed)<100){window.__entranceDriveStep(20);elapsed+=20;var drive=state().drive;if(drive.rpm>=7000&&drive.gear<3){shifts.push({at:elapsed,speed:drive.speed,rpm:drive.rpm,from:drive.gear});window.__entranceDriveShift(drive.gear+1,true);}}window.__entranceDriveControl("throttle",false);return {elapsed:elapsed,shifts:shifts,state:state()};}',
  'function state(){return window.__entranceRoomState();}',
  'function shifter(){var shaft=document.getElementById("entrance-drive-shifter-shaft");return {knob:document.getElementById("entrance-drive-shifter-lever").getAttribute("transform"),shaft:shaft.getAttribute("d"),stroke:shaft.getAttribute("stroke"),width:shaft.getAttribute("stroke-width")};}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__goToStage("balcony");window.__openEntranceRoom();window.__entranceDriveTransmissionMode("manual",false);await sleep(30);',
  'var room=document.getElementById("entrance-room"),hud=document.getElementById("entrance-drive-hud"),car=document.getElementById("entrance-porsche"),controls=Array.from(hud.querySelectorAll(".entrance-drive-control:not([data-drive-mode]):not([data-drive-range])"));key("keydown","Enter");await sleep(30);key("keydown","Enter");await sleep(460);report.steps.started={state:state(),hidden:hud.getAttribute("aria-hidden"),controls:controls.map(function(el){return [el.getAttribute("data-drive-hold"),el.getAttribute("data-drive-gear"),el.getAttribute("tabindex"),el.getAttribute("aria-label")];}),layout:{room:box(room.getBoundingClientRect()),hud:box(hud.getBoundingClientRect()),car:box(car.getBoundingClientRect()),controlBoxes:controls.map(function(el){return box(el.getBoundingClientRect());})},navClaims:{up:window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp"}),true),down:window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowDown"}),true)}};key("keyup","ArrowUp");key("keyup","ArrowDown");var signalBefore=state().car;key("keydown","ArrowLeft");key("keyup","ArrowLeft");var signalAfterLeft=state().car;key("keydown","ArrowLeft");key("keyup","ArrowLeft");var signalAfterRepeatLeft=state().car;key("keydown","ArrowRight");key("keyup","ArrowRight");var signalAfterRight=state().car;report.steps.steeringSignal={before:signalBefore,afterLeft:signalAfterLeft,afterRepeatLeft:signalAfterRepeatLeft,afterRight:signalAfterRight};await sleep(440);setMotion(60,2);window.__entranceDriveControl("steerLeft",true);window.__entranceDriveStep(80);var gentleSteer=state().drive;window.__entranceDriveControl("steerLeft",false);window.__entranceDriveControl("steerLeft",true);window.__entranceDriveStep(80);var stackedSteer=state().drive;window.__entranceDriveControl("steerLeft",false);window.__entranceDriveControl("steerRight",true);window.__entranceDriveStep(80);var oppositeSteer=state().drive;window.__entranceDriveControl("steerRight",false);window.__entranceDriveControl("steerLeft",true);window.__entranceDriveStep(80);var heldEarly=state().drive;for(var steerTick=0;steerTick<9;steerTick++)window.__entranceDriveStep(80);var heldBuilt=state().drive;window.__entranceDriveControl("steerLeft",false);window.__entranceDriveStep(240);var releasedSteer=state().drive;var horn=controls.filter(function(el){return el.getAttribute("data-drive-action")==="horn";})[0];horn.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:77,pointerType:"touch",isPrimary:true,clientX:100}));horn.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:77,pointerType:"touch",isPrimary:true,clientX:150}));var touchSteer=state().drive;horn.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:77,pointerType:"touch",isPrimary:true,clientX:150}));report.steps.progressiveSteering={gentle:gentleSteer,stacked:stackedSteer,opposite:oppositeSteer,heldEarly:heldEarly,heldBuilt:heldBuilt,released:releasedSteer,touch:touchSteer};setMotion(60,2);window.__entranceDriveStep(80);await sleep(40);report.steps.musicMoving=state();Object.defineProperty(document,"hasFocus",{value:function(){return false;},configurable:true});window.dispatchEvent(new Event("blur"));await sleep(40);report.steps.musicUnfocused=state();Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.dispatchEvent(new Event("focus"));await sleep(120);report.steps.musicRefocused=state();',
  'setMotion(0,0);report.steps.shifterNeutral=shifter();key("keydown","1");report.steps.shifterAttempt=shifter();await sleep(260);report.steps.shifterRestored=shifter();report.steps.badShift=state();',
  'window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",shiftKey:true}),true);var comboUp=state();report.steps.shifterSelected=shifter();window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",shiftKey:true,repeat:true}),true);var comboHeld=state();window.__entranceDriveKey(new KeyboardEvent("keyup",{key:"ArrowUp",code:"ArrowUp",shiftKey:true}),false);window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowDown",code:"ArrowDown",shiftKey:true}),true);report.steps.shiftArrows={up:comboUp,held:comboHeld,down:state()};',
  'setMotion(32,1);var lowBefore=state();window.__entranceDriveControl("brake",true);step(3);window.__entranceDriveControl("brake",false);report.steps.lowBrake={before:lowBefore,after:state()};report.steps.brakeAudio={low:window.__entranceDriveBrakeAudio(40),hard:window.__entranceDriveBrakeAudio(180)};',
  'window.__loftControllers.temp(24);await sleep(50);report.steps.hotAc=state();Object.defineProperty(document,"hasFocus",{value:function(){return false;},configurable:true});window.dispatchEvent(new Event("blur"));await sleep(320);report.steps.unfocused=state();Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.dispatchEvent(new Event("focus"));await sleep(120);report.steps.refocused=state();window.__loftControllers.temp(23);await sleep(320);report.steps.coolAc=state();window.__loftControllers.temp(false);',
  'var spatialKinds=["engine","music","screech","abs"],spatialClosed={};window.__porscheDrivePanFlush();spatialKinds.forEach(function(kind){spatialClosed[kind]=window.__entranceDriveSpatialAudio(kind);});document.getElementById("entrance-porsche-roof").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(30);var spatialOpen={};spatialKinds.forEach(function(kind){spatialOpen[kind]=window.__entranceDriveSpatialAudio(kind);});document.getElementById("entrance-porsche-roof").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(30);report.steps.spatialAudio={closed:spatialClosed,open:spatialOpen};',
  'key("keydown","1");await sleep(20);report.steps.badShift=state();',
  'window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",shiftKey:true}),true);var comboUp=state();window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",shiftKey:true,repeat:true}),true);var comboHeld=state();window.__entranceDriveKey(new KeyboardEvent("keyup",{key:"ArrowUp",code:"ArrowUp",shiftKey:true}),false);window.__entranceDriveKey(new KeyboardEvent("keydown",{key:"ArrowDown",code:"ArrowDown",shiftKey:true}),true);report.steps.shiftArrows={up:comboUp,held:comboHeld,down:state()};',
  'report.steps.rpmMap={second100:window.__entranceDriveRpmForSpeed(100,2),sixth100:window.__entranceDriveRpmForSpeed(100,6),sixth263:window.__entranceDriveRpmForSpeed(263,6)};report.steps.benchmark100=benchmark100();window.__porscheDrivePanFlush();report.steps.spatialMoved={engine:window.__entranceDriveSpatialAudio("engine"),music:window.__entranceDriveSpatialAudio("music")};',
  'setMotion(139,3);window.__entranceDriveControl("steerLeft",true);window.__entranceDriveControl("brake",true);step(1);window.__entranceDriveControl("brake",false);window.__entranceDriveControl("steerLeft",false);report.steps.brake=state();',
  'setMotion(0,0);window.__entranceDriveControl("throttle",true);step(120);report.steps.redlineGrace=state();step(30);window.__entranceDriveControl("throttle",false);report.steps.redline=state();',
  'setMotion(0,-1);window.__entranceDriveControl("throttle",true);step(12);window.__entranceDriveControl("throttle",false);report.steps.reverse=state();',
  'var gearCaps=[66.3,118.7,172.9,214.7,250.3,263],gearCeilings=[];for(var gear=1;gear<=6;gear++){setMotion(gearCaps[gear-1],gear);gearCeilings.push({gear:gear,speed:state().drive.speed,rpm:state().drive.rpm,cap:gearCaps[gear-1]});}setMotion(200,6);window.__entranceDriveShift(1,true);report.steps.gearCeilings=gearCeilings;report.steps.downshiftToFirst=state().drive;',
  'setMotion(263,6);window.__entranceDriveControl("throttle",true);step(100);window.__entranceDriveControl("throttle",false);report.steps.wrap=state();',
  'setMotion(141,4);window.__entranceDriveControl("steerLeft",true);window.__entranceDriveControl("brake",true);step(1);report.steps.leftSpin={state:state(),spinning:car.classList.contains("spinning"),from:car.style.getPropertyValue("--porsche-spin-from"),to:car.style.getPropertyValue("--porsche-spin-to")};window.__entranceDriveControl("steerLeft",false);window.__entranceDriveControl("brake",false);await sleep(780);report.steps.leftSettled=state();setMotion(-141,4);window.__entranceDriveControl("steerRight",true);window.__entranceDriveControl("brake",true);step(1);report.steps.rightSpin={state:state(),spinning:car.classList.contains("spinning"),from:car.style.getPropertyValue("--porsche-spin-from"),to:car.style.getPropertyValue("--porsche-spin-to")};window.__entranceDriveControl("steerRight",false);window.__entranceDriveControl("brake",false);await sleep(780);report.steps.rightSettled=state();',
  'var clutch=document.getElementById("entrance-drive-clutch");clutch.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:9,pointerType:"mouse"}));clutch.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:9,pointerType:"mouse"}));report.steps.latchOn=state();clutch.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:10,pointerType:"mouse"}));clutch.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:10,pointerType:"mouse"}));report.steps.latchOff=state();window.__toggleDropTerm();await sleep(30);var dropInput=document.getElementById("dropterm-in");dropInput.focus();var consoleKeyPassed=dropInput.dispatchEvent(new KeyboardEvent("keydown",{key:"x",code:"KeyX",bubbles:true,cancelable:true}));report.steps.hudConsole={open:window.__dropTermOpen(),focused:document.activeElement===dropInput,keyPassed:consoleKeyPassed,drive:state().drive};window.__toggleDropTerm();',
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
  s.started.state.car.vibrating && !s.started.state.drive.musicActive &&
  s.started.controls.length === 14 && s.started.controls.every(function (row) { return row[2] === null; }),
  "starting the engine raises the pointer-only dashboard", s.started);
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
var progressive = s.progressiveSteering;
check(progressive && progressive.gentle.keyboardSteering.direction === -1 &&
  progressive.gentle.keyboardSteering.authority > .3 && progressive.gentle.keyboardSteering.authority < .45 &&
  progressive.stacked.keyboardSteering.authority > progressive.gentle.keyboardSteering.authority + .15 &&
  progressive.opposite.keyboardSteering.direction === 1 &&
  progressive.opposite.keyboardSteering.authority < progressive.stacked.keyboardSteering.authority &&
  progressive.heldBuilt.keyboardSteering.authority > .99 &&
  Math.abs(progressive.heldBuilt.steeringAngle) > Math.abs(progressive.heldEarly.steeringAngle) + 5 &&
  progressive.released.keyboardSteering.direction === 0 &&
  progressive.released.keyboardSteering.authority < progressive.heldBuilt.keyboardSteering.authority &&
  Math.abs(progressive.released.steeringAngle) < Math.abs(progressive.heldBuilt.steeringAngle) &&
  Math.abs(progressive.touch.steeringAngle - 9) < .5,
  "keyboard steering starts gentle, stacks rapid taps, builds while held, resets on reversal, and leaves touch drag direct",
  progressive);
check(s.musicMoving && s.musicMoving.drive.musicActive &&
  s.musicUnfocused && !s.musicUnfocused.drive.musicActive &&
  s.musicRefocused && s.musicRefocused.drive.musicActive,
  "the moving driving score tears down while unfocused and returns with the attended HUD",
  {moving:s.musicMoving,unfocused:s.musicUnfocused,refocused:s.musicRefocused});
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
check(s.lowBrake && s.lowBrake.before.drive.speed > 0 && s.lowBrake.before.drive.speed < 65 &&
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
  (spatial.closed.engine.mode === "roadtrip" ?
    spatial.closed.engine.anchor === "roadtrip-cabin" && spatial.closed.engine.pan === 0 &&
      spatial.closed.screech.anchor === "roadtrip-tires" :
    spatial.closed.engine.anchor === "entrance-porsche" && spatial.closed.screech.anchor === "entrance-porsche") &&
  spatial.closed.music.anchor === "entrance-drive-hud" && spatial.closed.abs.anchor === "entrance-drive-brake" &&
  ["engine", "music", "screech", "abs"].every(function (kind) {
    return !spatial.closed[kind].roofOpen && spatial.open[kind].roofOpen &&
      spatial.closed[kind].gain < spatial.open[kind].gain &&
      spatial.closed[kind].cutoff < spatial.open[kind].cutoff;
  }), "driving sources use their mode-specific spatial outputs and open-roof treatment", spatial);
check(s.spatialMoved && spatial &&
  (spatial.closed.engine.mode === "roadtrip" ?
    s.spatialMoved.engine.pan === 0 && spatial.closed.engine.pan === 0 :
    Math.abs(s.spatialMoved.engine.pan - spatial.closed.engine.pan) > .05) &&
  Math.abs(s.spatialMoved.music.pan - spatial.closed.music.pan) < .01,
  "powertrain pan follows exterior travel or remains cabin-centred by driving mode", {
    initial: spatial && spatial.closed, moved: s.spatialMoved
  });
check(s.rpmMap && Math.abs(s.rpmMap.second100 - 6320.2) < 2 &&
  Math.abs(s.rpmMap.sixth100 - 2592.8) < 2 && Math.abs(s.rpmMap.sixth263 - 6818.9) < 2,
  "road speed maps to the published six-speed manual ratios", s.rpmMap);
check(s.benchmark100 && s.benchmark100.elapsed >= 5600 && s.benchmark100.elapsed <= 6300 &&
  s.benchmark100.state.drive.speed >= 100 && s.benchmark100.shifts.length === 1 &&
  s.benchmark100.shifts[0].from === 1 && s.benchmark100.state.drive.gear === 2,
  "a well-shifted launch reaches 100 km/h near the published 5.9 seconds", s.benchmark100);
check(s.brake && s.brake.drive.tireMarks >= 2 && s.brake.drive.speed < 139 &&
  s.brake.drive.brakeScreeches > s.lowBrake.after.drive.brakeScreeches,
  "a hard brake schedules a screech, sheds speed, and leaves paired fading tire marks", s.brake);
check(s.brake && s.brake.drive.spins === 0 && s.brake.drive.facing === 1,
  "ordinary hard braking remains yaw-stable below the spin threshold", s.brake);
check(s.redlineGrace && s.redlineGrace.car.engineOn && !s.redlineGrace.drive.stalled &&
  s.redlineGrace.drive.rpm >= 7490 && s.redline && s.redline.car.engineOn &&
  !s.redline.drive.stalled && s.redline.drive.rpm >= 7490 && s.redline.drive.rpm <= 7500,
  "neutral throttle rests against the 7,500 rpm limiter without an invented stall", {grace:s.redlineGrace,limited:s.redline});
check(s.reverse && s.reverse.car.engineOn && s.reverse.drive.gear === -1 && s.reverse.drive.speed < 0,
  "the real reverse gate drives in the opposite direction", s.reverse);
check(s.gearCeilings && s.gearCeilings.length === 6 &&
  s.gearCeilings.every(function (row, index) { return row.speed <= row.cap + .001 && (index === 0 || row.cap > s.gearCeilings[index - 1].cap); }) &&
  s.gearCeilings.slice(0, 5).every(function (row) { return row.rpm >= 7490 && row.rpm <= 7500; }) &&
  s.gearCeilings[5].speed === 263 && s.gearCeilings[5].rpm > 6800 && s.gearCeilings[5].rpm < 6850 &&
  s.downshiftToFirst && s.downshiftToFirst.gear === 1 && s.downshiftToFirst.speed <= 66.301,
  "each forward gear respects its real ratio ceiling and sixth is power-limited", s.gearCeilings);
check(s.wrap && s.wrap.car.engineOn && s.wrap.drive.gear === 6 && s.wrap.drive.wraps > 0 &&
  s.wrap.drive.speed > 230 && s.wrap.drive.speed <= 263 &&
  s.wrap.drive.position >= -648 && s.wrap.drive.position <= 349,
  "street travel wraps cleanly at the Boxster's sixth-gear top speed", s.wrap);
check(s.leftSpin && s.leftSpin.spinning && s.leftSpin.state.drive.spins === 1 &&
  s.leftSpin.state.drive.spinDirection === -1 && s.leftSpin.state.drive.yaw === -180 &&
  s.leftSpin.state.drive.facing === -1 && s.leftSpin.state.drive.speed < 0 &&
  s.leftSpin.from === "0deg" && s.leftSpin.to === "-180deg",
  "braking with steering just above 140 km/h starts a directional 180-degree yaw", s.leftSpin);
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
check(s.hudConsole && s.hudConsole.open && s.hudConsole.focused && s.hudConsole.keyPassed &&
  !s.hudConsole.drive.holds.throttle && !s.hudConsole.drive.holds.brake,
  "the drop-down console keeps keyboard ownership while the driving HUD is open", s.hudConsole);
check(s.closedHudNav && !s.closedHudNav.hud && JSON.stringify(s.closedHudNav.rooms) === JSON.stringify(["office"]),
  "closed HUD leaves the entrance arrow-key room navigation active", s.closedHudNav);
check(s.closed && !s.closed.open && !s.closed.drive.hud && !s.closed.drive.audioActive && !s.closed.drive.musicActive &&
  !s.closed.drive.frameActive && s.closed.drive.speed > 0 && s.closed.drive.position !== 0,
  "leaving parks audio/runtime while retaining the driving state", s.closed);

if (failures) { console.log("\n" + failures + " Porsche driving assertion(s) failed."); process.exit(1); }
console.log("\nPorsche driving assertions passed.");
