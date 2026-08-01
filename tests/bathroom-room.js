#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function click(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function dblclick(el){el.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true}));}',
  'function touchup(el){el.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerType:"touch"}));}',
  'function key(name,options){var init={key:name,bubbles:true,cancelable:true};Object.assign(init,options||{});document.dispatchEvent(new KeyboardEvent("keydown",init));}',
  'function keyOn(el,name){el.dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true}));}',
  'function surface(cls){var el=document.createElement("div");el.className=cls;el.style.display="block";el.style.opacity="1";document.querySelector(".hunt-viewport").appendChild(el);return el;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__markLowerRoomDiscovered();',
  ' var room=document.getElementById("bathroom-room"),art=document.getElementById("bathroom-room-art"),viewport=document.querySelector(".hunt-viewport"),strip=document.getElementById("loft-game-strip"),lowerTrack=document.getElementById("lower-room-track");room.style.transition="none";strip.style.transition="none";viewport.style.transition="none";',
  ' var roster=document.querySelector(".roster-panel"),rosterToggle=document.querySelector(".roster-toggle"),rosterBackdrop=document.querySelector(".roster-backdrop");roster.classList.add("show");rosterBackdrop.classList.add("show");rosterToggle.classList.add("avail");',
  ' var badge=surface("msg-badge show"),coach=surface("msg-badge-coach show"),thumb=surface("msg-thumb show"),call=surface("call-ring show");',
  ' key("ArrowDown");await sleep(80);',
  ' var roomBox=room.getBoundingClientRect(),viewBox=viewport.getBoundingClientRect(),kitchenBox=document.getElementById("stage-kitchen").getBoundingClientRect(),bathroomCloseStyle=getComputedStyle(document.getElementById("bathroom-room-close")),cinemaCloseStyle=getComputedStyle(document.getElementById("cinema-room-close")),princeCloseStyle=getComputedStyle(document.getElementById("prince-basement-close"));',
  ' report.steps.down={state:window.__bathroomRoomState(),room:window.currentStageName,covered:window.__roomAmbienceCovered(),viewport:viewport.classList.contains("bathroom-room-open"),geometry:{room:[roomBox.left,roomBox.top,roomBox.width,roomBox.height],viewport:[viewBox.left,viewBox.top,viewBox.width,viewBox.height],kitchenBottom:kitchenBox.bottom,controls:{bathroom:[parseFloat(bathroomCloseStyle.width),parseFloat(bathroomCloseStyle.height),parseFloat(bathroomCloseStyle.right),parseFloat(bathroomCloseStyle.top)],cinema:[parseFloat(cinemaCloseStyle.width),parseFloat(cinemaCloseStyle.height),parseFloat(cinemaCloseStyle.right),parseFloat(cinemaCloseStyle.top)],prince:[parseFloat(princeCloseStyle.width),parseFloat(princeCloseStyle.height),parseFloat(princeCloseStyle.right),parseFloat(princeCloseStyle.top)]}},roster:[getComputedStyle(rosterToggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(rosterBackdrop).visibility],messages:[getComputedStyle(badge).visibility,getComputedStyle(coach).visibility,getComputedStyle(thumb).visibility,getComputedStyle(call).visibility],images:room.querySelectorAll("img").length};',
  ' var props=Array.from(room.querySelectorAll("[data-bath-action]"));setLang("cs");report.steps.cs={room:room.getAttribute("aria-label"),close:document.getElementById("bathroom-room-close").getAttribute("aria-label"),props:props.map(function(el){return el.getAttribute("aria-label");})};setLang("en");',
  ' props.forEach(function(el,index){click(el);keyOn(el,index%2?" ":"Enter");});report.steps.props={count:props.length,roles:props.map(function(el){return [el.id,el.getAttribute("role"),el.getAttribute("tabindex"),el.getAttribute("title")];}),state:window.__bathroomInteractionState()};',
  ' var tub=document.getElementById("bathroom-tub"),bubbles=Array.from(room.querySelectorAll("[data-bath-bubble]"));click(tub);var tubFilling=window.__bathroomInteractionState();await sleep(1200);var bubbleStart=window.__bathroomInteractionState();bubbles.forEach(click);var bubbleDone=window.__bathroomInteractionState();click(tub);var tubDraining=window.__bathroomInteractionState();await sleep(800);var bubbleReset=window.__bathroomInteractionState();report.steps.bubbles={count:bubbles.length,roles:bubbles.map(function(el){var hit=el.querySelector(".bathroom-bubble-hit");return [el.getAttribute("role"),el.getAttribute("tabindex"),el.getAttribute("aria-label"),!!hit,hit&&getComputedStyle(hit).r];}),filling:tubFilling,draining:tubDraining,start:bubbleStart.bubbles,done:bubbleDone.bubbles,reset:bubbleReset.bubbles};',
  ' key("Enter");var enterStarting=window.__bathroomInteractionState();await sleep(1200);var enterOnce={filled:room.classList.contains("tub-filled"),state:window.__bathroomInteractionState()};key("Enter");var enterTwice={filled:room.classList.contains("tub-filled"),state:window.__bathroomInteractionState()};click(tub);await sleep(800);report.steps.enterTub={starting:enterStarting,once:enterOnce,twice:enterTwice};',
  ' var scale=document.getElementById("bathroom-scale-action");click(scale);var scaleSpike=document.getElementById("bathroom-scale-reading").textContent;await sleep(380);var scaleOn=window.__bathroomInteractionState();click(scale);var scaleOff=window.__bathroomInteractionState();click(scale);await sleep(380);',
  ' click(scale);click(tub);await sleep(1200);var mirrorFog=window.__bathroomInteractionState(),mirrorAction=document.getElementById("bathroom-mirror-action");click(mirrorAction);var mirrorReveal=window.__bathroomInteractionState();function mirrorClient(x,y){var p=art.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(art.getScreenCTM());}for(var di=0;di<5;di++){var a=mirrorClient(48+di*2,45),b=mirrorClient(63+di*2,58);mirrorAction.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:90+di,pointerType:"touch",button:0,buttons:1,clientX:a.x,clientY:a.y}));art.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:90+di,pointerType:"touch",buttons:1,clientX:a.x,clientY:a.y}));art.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:90+di,pointerType:"touch",buttons:1,clientX:b.x,clientY:b.y}));art.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:90+di,pointerType:"touch",clientX:b.x,clientY:b.y}));}var doodle=document.getElementById("bathroom-mirror-doodle"),mirrorDrawn={state:window.__bathroomInteractionState(),paths:doodle.querySelectorAll("path").length,maxPoints:Math.max.apply(null,Array.from(doodle.querySelectorAll("path")).map(function(path){return (path.getAttribute("d").match(/[ML]/g)||[]).length;})),clip:getComputedStyle(doodle).clipPath,clipRects:document.querySelectorAll("#bathroom-mirror-doodle-clip rect").length};click(scale);var wetSpike={reading:document.getElementById("bathroom-scale-reading").textContent,state:window.__bathroomInteractionState()};setLang("cs");var wetCs=document.getElementById("bathroom-room-status").textContent,drawLabelCs=mirrorAction.getAttribute("aria-label");setLang("en");await sleep(380);var wetSettled=window.__bathroomInteractionState();click(scale);var activeStart=mirrorClient(50,48);mirrorAction.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:120,pointerType:"touch",button:0,buttons:1,clientX:activeStart.x,clientY:activeStart.y}));art.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:120,pointerType:"touch",buttons:1,clientX:activeStart.x,clientY:activeStart.y}));var activeBeforeDrain=window.__bathroomInteractionState();click(tub);var mirrorDraining=window.__bathroomInteractionState();await sleep(800);var mirrorDrained=window.__bathroomInteractionState(),pathsDrained=doodle.querySelectorAll("path").length;click(tub);await sleep(1200);var mirrorRefilled=window.__bathroomInteractionState();click(tub);await sleep(800);click(scale);await sleep(380);report.steps.steam={fog:mirrorFog,reveal:mirrorReveal,drawn:mirrorDrawn,activeBeforeDrain:activeBeforeDrain,draining:mirrorDraining,drained:mirrorDrained,pathsDrained:pathsDrained,refilled:mirrorRefilled,signature:document.getElementById("bathroom-mirror-signature").textContent,wetSpike:wetSpike,wetCs:wetCs,drawLabelCs:drawLabelCs,wetSettled:wetSettled,statusRole:document.getElementById("bathroom-room-status").getAttribute("role"),statusLive:document.getElementById("bathroom-room-status").getAttribute("aria-live")};',
  ' var towel=document.getElementById("bathroom-waffle-towel");click(towel);await sleep(260);click(towel);await sleep(470);var towelRestarted=room.classList.contains("towel-fluff");await sleep(250);report.steps.towelRepeat={restarted:towelRestarted,settled:!room.classList.contains("towel-fluff"),hits:window.__bathroomInteractionState().hits.towel};',
  ' var stool=document.getElementById("bathroom-stool"),stoolPosition=document.getElementById("bathroom-stool-position");',
  ' var stoolHitsBefore=window.__bathroomInteractionState().hits.stool;stool.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:70,pointerType:"touch",button:0,buttons:1,clientX:300}));art.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:70,pointerType:"touch",button:0,clientX:300}));await sleep(10);var stationaryState=window.__bathroomInteractionState();',
  ' stool.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:71,pointerType:"mouse",button:0,buttons:1,clientX:300}));art.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:71,pointerType:"mouse",buttons:1,clientX:900}));art.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:71,pointerType:"mouse",button:0,clientX:900}));await sleep(10);',
  ' var rightState=window.__bathroomInteractionState(),rightTransform=stoolPosition.getAttribute("transform");',
  ' stool.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:72,pointerType:"mouse",button:0,buttons:1,clientX:900}));art.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:72,pointerType:"mouse",buttons:1,clientX:-500}));art.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:72,pointerType:"mouse",button:0,clientX:-500}));await sleep(10);',
  ' var towelStyle=getComputedStyle(document.getElementById("bathroom-waffle-towel")),toiletTarget=document.getElementById("bathroom-toilet-action");report.steps.functional={scaleToggle:{spike:scaleSpike,on:scaleOn,off:scaleOff},stationary:{before:stoolHitsBefore,state:stationaryState},right:{state:rightState,transform:rightTransform},left:{state:window.__bathroomInteractionState(),transform:stoolPosition.getAttribute("transform")},water:document.getElementById("bathroom-sink-water").getAttribute("d"),towelOrigin:towelStyle.transformOrigin,towelBox:towelStyle.transformBox,stoolOrigin:getComputedStyle(stool).transformOrigin,scaleText:document.getElementById("bathroom-scale-reading").textContent,scaleTransform:document.getElementById("bathroom-scale-needle").style.transform,toiletTarget:[toiletTarget.getAttribute("x"),toiletTarget.getAttribute("y"),toiletTarget.getAttribute("width"),toiletTarget.getAttribute("height")]};',
  ' key("ArrowUp");await sleep(760);report.steps.up={state:window.__bathroomRoomState(),props:window.__bathroomInteractionState(),viewport:viewport.classList.contains("bathroom-room-open"),covered:window.__roomAmbienceCovered(),roster:[getComputedStyle(rosterToggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(rosterBackdrop).visibility],messages:[getComputedStyle(badge).visibility,getComputedStyle(coach).visibility,getComputedStyle(thumb).visibility,getComputedStyle(call).visibility]};',
  ' dblclick(document.getElementById("kitchen-pan-1"));await sleep(30);report.steps.interactive=window.__bathroomRoomState();',
  ' dblclick(document.getElementById("kitchen-wall"));await sleep(80);report.steps.mouse=window.__bathroomRoomState();',
  ' touchup(document.getElementById("kitchen-wall"));await sleep(20);touchup(document.getElementById("kitchen-wall"));await sleep(80);report.steps.touch=window.__bathroomRoomState();',
  ' window.__openBathroomRoom();await sleep(60);click(document.getElementById("bathroom-room-close"));await sleep(760);report.steps.dismiss=window.__bathroomRoomState();',
  ' window.__openBathroomRoom();await sleep(60);window.goToStage("office");await sleep(80);report.steps.navigate={state:window.__bathroomRoomState(),room:window.currentStageName};window.goToStage("kitchen");',
  ' var times=[],oldStep=window.__calStepTime;window.__calStepTime=function(n){times.push(n);};key("ArrowDown",{shiftKey:true});window.__calStepTime=oldStep;report.steps.shift={times:times,state:window.__bathroomRoomState()};',
  ' window.__secondRound=true;document.getElementById("stage-kitchen").classList.add("dusk");var mixStarted=window.__makeCocktailHere();var mixBefore=window.__ambientMaking();window.__openBathroomRoom();await sleep(30);report.steps.barLeak={started:mixStarted,before:mixBefore,after:window.__ambientMaking(),userMixing:window.__userMixing(),sfxAllowed:window.__bartenderSfxAllowed("kitchen-bartender")};key("ArrowUp");await sleep(760);',
  ' window.__secondRound=true;window.__openBathroomRoom();await sleep(80);window.__deliverPhoneMessage("cue_mail");await sleep(80);report.steps.messageHold={held:window.__messageNotificationsHeld(),thread:window.__phoneMessageThread()};key("ArrowUp");await sleep(1300);report.steps.messageRelease={held:window.__messageNotificationsHeld(),thread:window.__phoneMessageThread()};',
  ' window.__openBathroomRoom();await sleep(80);key("ArrowRight");await sleep(80);report.steps.slide={nav:window.__lowerRoomNavigationState(),trackAnimations:lowerTrack.getAnimations().length};await sleep(700);report.steps.right={source:window.__bathroomRoomState(),target:window.__princeState(),room:window.currentStageName,focus:document.activeElement.classList.contains("hunt-viewport")};',
  ' window.goToStage("kitchen");window.__openBathroomRoom();await sleep(80);var dot=document.querySelectorAll(".hunt-dot")[4];dot.focus();click(dot);await sleep(780);report.steps.dot={source:window.__bathroomRoomState(),target:window.__entranceRoomState(),room:window.currentStageName,focus:document.activeElement===dot};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html bathroom room:");
var result = lib.runPageSync("rsvp.html", HARNESS, 20000, { patchRaf: true, forceHybridPointer: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.down && s.down.state.open && !s.down.state.hidden && s.down.room === "kitchen" &&
  s.down.covered && s.down.viewport,
  "plain Down opens the bathroom beneath Kitchen / Bar and covers upstairs ambience", s.down);
check(s.down && s.down.geometry &&
  s.down.geometry.room.every(function (value, index) { return Math.abs(value - s.down.geometry.viewport[index]) < 0.7; }) &&
  s.down.geometry.kitchenBottom <= s.down.geometry.viewport[1] + s.down.geometry.viewport[3] * 0.05,
  "entry completes the downward pan while preserving Kitchen / Bar above", s.down && s.down.geometry);
check(s.down && s.down.geometry && s.down.geometry.controls &&
  s.down.geometry.controls.bathroom.every(function (value, index) {
    return Math.abs(value - s.down.geometry.controls.cinema[index]) < 0.7 &&
      Math.abs(value - s.down.geometry.controls.prince[index]) < 0.7;
  }) &&
  s.down.geometry.controls.bathroom[2] <= 8.5 && s.down.geometry.controls.bathroom[3] <= 8.5,
  "all lower rooms share one tightly tucked close-control geometry",
  s.down && s.down.geometry && s.down.geometry.controls);
check(s.down && s.down.roster.every(function (value) { return value === "hidden"; }),
  "Who's here controls and panel hide while the bathroom owns the viewport", s.down && s.down.roster);
check(s.down && s.down.messages.every(function (value) { return value === "hidden"; }),
  "message badges, previews, and call cards hide below the loft", s.down && s.down.messages);
check(s.down && s.down.images === 0,
  "the bathroom is entirely code-native and embeds no photo", s.down);
check(s.cs && s.cs.room === "Koupelna / toalety" && s.cs.close === "Zpět do Kuchyně / baru",
  "room and return labels switch to Czech", s.cs);
var propNames = ["sink", "mirror", "tub", "towel", "stool", "scale", "cabinet", "toilet", "book"];
check(s.props && s.props.count === propNames.length &&
  s.props.roles.every(function (row) { return row[1] === "button" && row[2] === null && !!row[3]; }),
  "every distinct bathroom prop is labelled but stays outside the Tab order", s.props);
check(s.props && propNames.every(function (name) { return s.props.state.hits[name] === 2; }),
  "every bathroom prop responds once to click and once to Enter or Space", s.props && s.props.state);
check(s.bubbles && s.bubbles.count === 8 &&
  s.bubbles.roles.every(function (row) {
    return row[0] === "button" && row[1] === null && row[2] === "Pop bubble" &&
      row[3] && row[4] === "16px";
  }),
  "the finite bubble hunt exposes eight labelled targets outside the Tab order", s.bubbles);
check(s.bubbles && s.bubbles.filling && s.bubbles.filling.tubFilling && !s.bubbles.filling.bubbles.active &&
  s.bubbles.draining && s.bubbles.draining.tubDraining && s.bubbles.draining.bubbles.active &&
  s.bubbles.start.active && s.bubbles.start.popped === 0 &&
  s.bubbles.start.total === 8 && !s.bubbles.start.complete &&
  s.bubbles.done.popped === 8 && s.bubbles.done.complete &&
  !s.bubbles.reset.active && s.bubbles.reset.popped === 0 &&
  !s.bubbles.reset.complete,
  "shower rain precedes the hunt, eight pops complete it, and draining resets it", s.bubbles);
check(s.enterTub && s.enterTub.starting.tubFilling && s.enterTub.once.filled && s.enterTub.once.state.bubbles.active &&
  s.enterTub.twice.filled && s.enterTub.twice.state.bubbles.active &&
  s.enterTub.once.state.hits.tub === s.enterTub.twice.state.hits.tub,
  "bare Enter fills the tub once without draining it on a second press", s.enterTub);
check(s.functional && s.functional.water === "M119 139V171",
  "the faucet stream falls from the midpoint between both faucet uprights", s.functional);
check(s.functional && s.functional.towelOrigin === "44px 0px" &&
  s.functional.towelBox === "fill-box" &&
  s.functional.stoolOrigin === "380px 332px",
  "the towel turns from its rail and the stool wobbles from its feet", s.functional);
check(s.towelRepeat && s.towelRepeat.restarted && s.towelRepeat.settled &&
  s.towelRepeat.hits === 4,
  "repeated towel clicks restart a full reaction without stale cleanup cutting it short",
  s.towelRepeat);
check(s.functional && s.functional.stationary.state.hits.stool ===
  s.functional.stationary.before + 1 &&
  s.functional.stationary.state.active.indexOf("stool-wobble") !== -1,
  "a stationary pointer tap still wobbles the draggable stool", s.functional);
check(s.functional && s.functional.right.state.stoolX === 80 &&
  s.functional.left.state.stoolX === -130 &&
  /translate\(80(?:\.0+)? 0\)/.test(s.functional.right.transform) &&
  /translate\(-130(?:\.0+)? 0\)/.test(s.functional.left.transform),
  "the stool drags horizontally and clamps at both room-safe limits", s.functional);
check(s.functional && s.functional.scaleText === "69.0" &&
  s.functional.left.state.scaleValue === 69 &&
  /rotate\(-?\d/.test(s.functional.scaleTransform),
  "the scale settles on and displays a plausible numeric reading", s.functional);
check(s.functional && s.functional.scaleToggle.spike === "72.4" &&
  s.functional.scaleToggle.on.scaleValue !== null &&
  s.functional.scaleToggle.on.scaleReading === "69.0" &&
  s.functional.scaleToggle.on.active.indexOf("scale-on") !== -1 &&
  s.functional.scaleToggle.off.scaleValue === null &&
  s.functional.scaleToggle.off.scaleReading === "--" &&
  s.functional.scaleToggle.off.active.indexOf("scale-on") === -1,
  "successive activations switch the scale on and off", s.functional);
check(s.steam && s.steam.fog.mirror.fogged && !s.steam.fog.mirror.revealed &&
  s.steam.reveal.mirror.fogged && s.steam.reveal.mirror.revealed &&
  s.steam.drawn.state.mirror.doodles === 3 && !s.steam.drawn.state.mirror.drawing &&
  s.steam.drawn.paths === 3 && s.steam.drawn.maxPoints <= 48 &&
  s.steam.drawn.clip !== "none" && s.steam.drawn.clipRects === 6 &&
  s.steam.activeBeforeDrain.mirror.drawing &&
  s.steam.draining.tubDraining && s.steam.draining.bubbles.active &&
  !s.steam.drained.mirror.fogged && !s.steam.drained.mirror.revealed &&
  s.steam.drained.mirror.doodles === 0 && s.steam.pathsDrained === 0 &&
  s.steam.refilled.mirror.fogged && !s.steam.refilled.mirror.revealed &&
  s.steam.signature === "m∞b",
  "touch doodles stay capped and clipped, while draining cancels an active stroke and resets them",
  s.steam);
check(s.steam && s.steam.wetSpike.reading === "70.0" &&
  s.steam.wetSpike.state.scaleValue === 69 &&
  s.steam.wetSpike.state.feedback === "70.0 kg — still dripping." &&
  s.steam.wetCs === "70,0 kg — ještě z tebe kape." &&
  s.steam.drawLabelCs === "Kreslit do zbylé páry na zrcadle" &&
  s.steam.wetSettled.scaleReading === "69.0" &&
  s.steam.wetSettled.feedback === "69.0 kg — settled." &&
  s.steam.statusRole === "status" && s.steam.statusLive === "polite",
  "a wet weigh-in announces 70 kg in both languages before settling at 69 kg",
  s.steam);
check(s.functional && s.functional.toiletTarget.join(",") === "544,137,110,203",
  "the toilet target spans its full visible footprint to the room floor", s.functional);
check(s.cs && s.cs.props.length === propNames.length &&
  s.cs.props.every(function (label) { return label && !/Run|Polish|Fill|Draw|Fluff|Test|Step|Open|Flush/.test(label); }),
  "all prop labels switch to Czech", s.cs);
check(s.up && !s.up.state.open && s.up.state.hidden && !s.up.viewport && !s.up.covered &&
  s.up.props.active.length === 0 &&
  s.up.props.stoolX === 0 && s.up.props.scaleValue === null && s.up.props.scaleReading === "--" &&
  s.up.roster.every(function (value) { return value === "visible"; }) &&
  s.up.messages.every(function (value) { return value === "visible"; }),
  "plain Up returns upstairs, settles bathroom props, and restores suppressed UI", s.up);
check(s.interactive && !s.interactive.open && s.mouse && !s.mouse.open && s.touch && !s.touch.open,
  "kitchen props and bare background no longer open Bathroom",
  { interactive: s.interactive, mouse: s.mouse, touch: s.touch });
check(s.dismiss && !s.dismiss.open && s.dismiss.hidden,
  "the visible dismiss control closes and settles the room", s.dismiss);
check(s.navigate && !s.navigate.state.open && s.navigate.room === "office",
  "ordinary room navigation closes the bathroom", s.navigate);
check(s.shift && s.shift.times.join(",") === "-1" && !s.shift.state.open,
  "Shift+Down keeps its calendar-step meaning instead of entering", s.shift);
check(s.barLeak && s.barLeak.started && s.barLeak.before && !s.barLeak.after &&
  !s.barLeak.userMixing && !s.barLeak.sfxAllowed,
  "entering the bathroom cancels Pouria's timed cocktail sounds and player mixing", s.barLeak);
check(s.messageHold && s.messageHold.held.messages.indexOf("cue_mail") !== -1 &&
  s.messageHold.thread.indexOf("cue_mail") !== -1 &&
  s.messageRelease && !s.messageRelease.held.messages.length,
  "an arriving message enters its thread but waits to surface until the upward return",
  { held: s.messageHold, released: s.messageRelease });
check(s.slide && s.slide.nav.active && s.slide.nav.from === "kitchen" &&
  s.slide.nav.to === "garden" && s.slide.nav.direction === 1 &&
  s.slide.trackAnimations > 0,
  "the shared lower-room track owns the horizontal pan", s.slide);
check(s.right && !s.right.source.open && s.right.source.hidden && s.right.room === "garden" &&
  s.right.target.basement && s.right.focus,
  "Right pans from Bathroom to the adjacent dungeon and restores viewport focus", s.right);
check(s.dot && !s.dot.source.open && s.dot.source.hidden && s.dot.room === "balcony" &&
  s.dot.target.open && s.dot.focus,
  "a room dot stays downstairs and pans to Entrance while keeping dot focus", s.dot);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/@media \(any-pointer:coarse\)\{\.bathroom-bubble-hit\{r:40px\}\}/.test(source),
  "coarse pointers receive expanded bubble hit circles");
["bathroom-sink", "bathroom-mirror-action", "bathroom-tub", "bathroom-waffle-towel",
 "bathroom-stool", "bathroom-scale", "bathroom-cabinet-action",
 "bathroom-toilet-action", "bathroom-toilet-book", "bathroom-book-action", "bathroom-tub-shower", "bathroom-tub-drain",
 "bathroom-grooming-kit", "bathroom-toothbrush-holder"].forEach(function (id) {
  check(new RegExp('id="' + id + '"').test(source), "illustration includes " + id);
});
["bathroom-mirror-fog", "bathroom-mirror-wipe", "bathroom-mirror-signature",
 "bathroom-mirror-doodle", "bathroom-mirror-doodle-clip"].forEach(function (id) {
  check(new RegExp('id="' + id + '"').test(source), "mirror effect includes " + id);
});
check(!/codex-clipboard|ZAJ6YO|zTrLmq/.test(source),
  "private reference filenames are absent from authored source");

console.log("");
if (failures) {
  console.log(failures + " bathroom-room assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Bathroom-room assertions passed.");
