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
  'function key(name){document.dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true}));}',
  'function activeKey(name){(document.activeElement||document).dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true}));}',
  'function elkey(el,name){el.dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true}));}',
  'function surface(cls){var el=document.createElement("div");el.className=cls;el.style.display="block";el.style.opacity="1";document.querySelector(".hunt-viewport").appendChild(el);return el;}',
  'function state(){return window.__entranceRoomState();}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__markLowerRoomDiscovered();',
  ' var room=document.getElementById("entrance-room"),art=document.getElementById("entrance-room-art"),viewport=document.querySelector(".hunt-viewport"),strip=document.getElementById("loft-game-strip"),roster=document.querySelector(".roster-panel"),toggle=document.querySelector(".roster-toggle"),backdrop=document.querySelector(".roster-backdrop");room.style.transition="none";viewport.style.transition="none";strip.style.transition="none";var probeBadge=surface("msg-badge show entrance-probe"),probeCoach=surface("msg-badge-coach show entrance-probe"),probeThumb=surface("msg-thumb show entrance-probe"),probeCall=surface("call-ring show entrance-probe");',
  ' if(window.__setDayNight)window.__setDayNight(false);if(window.__setWildfireSmoke)window.__setWildfireSmoke(1);window.goToStage("balcony");await sleep(40);',
  ' dblclick(document.getElementById("balcony-wall"));await sleep(30);report.steps.interactive=state();dblclick(document.getElementById("stage-balcony"));await sleep(50);report.steps.stageBackground=state();',
  ' var bg=document.getElementById("balcony-background"),bb=bg.getBoundingClientRect(),bare=null;for(var gy=1;gy<10&&!bare;gy++)for(var gx=1;gx<20;gx++){var px=bb.left+bb.width*gx/20,py=bb.top+bb.height*gy/10;if(document.elementFromPoint(px,py)===bg){bare={x:px,y:py};break;}}if(bare)bg.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true,clientX:bare.x,clientY:bare.y}));await sleep(50);report.steps.background=state();key("ArrowDown");await sleep(920);viewport.scrollIntoView({block:"center"});await sleep(30);roster.classList.add("show");backdrop.classList.add("show");var rr=room.getBoundingClientRect(),vr=viewport.getBoundingClientRect(),sr=strip.getBoundingClientRect(),smoke=document.querySelector("#entrance-room .entrance-smoke-tint");smoke.style.transition="none";',
  ' var floorButton=document.getElementById("hunt-floor-btn"),floorBox=floorButton.getBoundingClientRect(),dotsBox=document.getElementById("hunt-dots").getBoundingClientRect();var homeUv=document.getElementById("entrance-home-uv");homeUv.style.transition="none";report.steps.uv={off:parseFloat(getComputedStyle(homeUv).opacity),window:homeUv.parentNode.id};window.__setUvMode(true);report.steps.uv.on=parseFloat(getComputedStyle(homeUv).opacity);window.__setUvMode(false);report.steps.uv.after=parseFloat(getComputedStyle(homeUv).opacity);',
  ' report.steps.open={state:state(),room:window.currentStageName,bare:bare,covered:window.__roomAmbienceCovered(),viewport:viewport.classList.contains("entrance-room-open"),smoke:[room.style.getPropertyValue("--smoke"),parseFloat(getComputedStyle(smoke).opacity)],geometry:{entrance:[rr.left,rr.top,rr.width,rr.height],viewport:[vr.left,vr.top,vr.width,vr.height],strip:[sr.left,sr.top,sr.width,sr.height],transform:getComputedStyle(strip).transform,floor:{mark:floorButton.textContent,up:floorButton.classList.contains("floor-up"),aria:floorButton.hasAttribute("aria-label"),title:floorButton.hasAttribute("title"),gap:floorBox.left-dotsBox.right}},roster:[getComputedStyle(toggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(backdrop).visibility],messages:[getComputedStyle(probeBadge).visibility,getComputedStyle(probeCoach).visibility,getComputedStyle(probeThumb).visibility,getComputedStyle(probeCall).visibility],label:room.getAttribute("aria-label")};',
  ' var facadeSky=document.getElementById("entrance-sky-bg"),skyBefore=state();click(facadeSky);await sleep(60);var skyNight=state();click(facadeSky);await sleep(60);report.steps.skyToggle={before:skyBefore,night:skyNight,restored:state(),cursor:getComputedStyle(facadeSky).cursor,tabindex:facadeSky.getAttribute("tabindex")};',
  ' var viewportFocused=document.activeElement===viewport,partyBefore=window.party&&window.party();activeKey("Enter");await sleep(30);report.steps.viewportEnter={viewportFocused:viewportFocused,partyBefore:partyBefore,partyAfter:window.party&&window.party(),state:state()};window.__dismissEntrancePorscheDriveHud();var focusProbe=document.createElement("button"),focusProbeKeys=0;focusProbe.addEventListener("keydown",function(){focusProbeKeys++;});room.appendChild(focusProbe);focusProbe.focus();activeKey("Enter");await sleep(30);report.steps.focusedControlEnter={keys:focusProbeKeys,party:window.party&&window.party(),state:state()};focusProbe.remove();var roadHit=document.querySelector("#entrance-room .entrance-road-drive-hit"),roadRect=roadHit.getBoundingClientRect(),artRect=art.getBoundingClientRect();function roadPoint(fx,fy){var x=roadRect.left+roadRect.width*fx,y=roadRect.top+roadRect.height*fy,target=document.elementFromPoint(x,y);if(target)click(target);return {x:x,y:y,target:target&&target.getAttribute("class"),hud:state().drive.hud};}var pavementPoint=roadPoint(.05,.12);window.__dismissEntrancePorscheDriveHud();var asphaltPoint=roadPoint(.95,.82);report.steps.roadHit={rect:[roadRect.left,roadRect.top,roadRect.width,roadRect.height],art:[artRect.left,artRect.top,artRect.width,artRect.height],pavement:pavementPoint,asphalt:asphaltPoint};window.__dismissEntrancePorscheDriveHud();',
  ' var snowFlakes=document.querySelector("#entrance-room .entrance-snow-flakes");snowFlakes.style.transition="none";function seasonArt(){return ["entrance-tree-summer","entrance-tree-autumn","entrance-tree-spring","entrance-tree-winter-snow","entrance-autumn-foreground","entrance-tree-natural-branches","entrance-tree-branches","entrance-snowbank","entrance-architectural-snow"].map(function(id){return getComputedStyle(document.getElementById(id)).display;});}report.steps.seasons={};for(var seasonName of ["summer","autumn","winter","stedry","spring"]){window.__applySeason(seasonName,true);await sleep(25);report.steps.seasons[seasonName]={art:seasonArt(),classes:strip.getAttribute("class")||"",room:room.getAttribute("class")||""};}report.steps.cutoff={};window.date("2027-03-31");await sleep(25);report.steps.cutoff.mar31={art:seasonArt(),room:room.getAttribute("class")||""};window.date("2027-04-01");await sleep(25);report.steps.cutoff.apr1={art:seasonArt(),room:room.getAttribute("class")||""};window.__setBalconySnow(true,"ui");await sleep(25);report.steps.cutoff.apr1snow={art:seasonArt(),room:room.getAttribute("class")||"",flakes:parseFloat(getComputedStyle(snowFlakes).opacity)};window.__setBalconySnow(false,"ui");window.__calResetToday();await sleep(25);',
  ' var windowsBefore=state().windows.map(function(row){return row.on;});window.__toggleEntrancePorscheEngine();await sleep(30);var enterOn=state();window.__toggleEntrancePorscheEngine();await sleep(30);report.steps.enterEngine={on:enterOn,off:state(),before:windowsBefore};window.__dismissEntrancePorscheDriveHud();',
  ' var props=Array.from(document.querySelectorAll("#entrance-room .entrance-prop")),intercom=document.getElementById("entrance-intercom"),lampLeft=document.getElementById("entrance-entry-lamp-left"),lampRight=document.getElementById("entrance-entry-lamp-right");click(intercom);await sleep(30);var intercomReply={state:state(),caption:window.__captionKey()};click(lampLeft);var lampLeftOnly={state:state(),pressed:[lampLeft.getAttribute("aria-pressed"),lampRight.getAttribute("aria-pressed")]};click(lampRight);var lampBoth={state:state(),pressed:[lampLeft.getAttribute("aria-pressed"),lampRight.getAttribute("aria-pressed")]};props.filter(function(prop){return prop!==intercom&&prop!==lampLeft&&prop!==lampRight;}).forEach(click);await sleep(30);report.steps.props={ids:props.map(function(prop){return prop.id;}),state:state(),caption:window.__captionKey(),intercomReply:intercomReply,lamps:{leftOnly:lampLeftOnly,both:lampBoth},roles:props.map(function(prop){return [prop.getAttribute("role"),prop.getAttribute("tabindex"),prop.getAttribute("aria-label"),prop.getAttribute("title")];})};',
  ' var car=document.getElementById("entrance-porsche"),carControls=Array.from(document.querySelectorAll("#entrance-room .entrance-car-control"));car.querySelectorAll("*").forEach(function(el){el.style.transition="none";});carControls.forEach(function(control){control.querySelectorAll("*").forEach(function(el){el.style.transition="none";});});var glint=document.getElementById("entrance-porsche-glint"),running=document.querySelector(".entrance-porsche-running-light"),headOn=document.querySelector(".entrance-porsche-headlight-on"),tailOn=document.querySelector(".entrance-porsche-taillight-on"),indicatorLit=document.querySelector(".entrance-porsche-indicator-lit"),frunkHit=document.querySelector("#entrance-porsche-frunk .entrance-car-hit"),trunkHit=document.querySelector("#entrance-porsche-trunk .entrance-car-hit"),engineHit=document.querySelector("#entrance-porsche-engine .entrance-car-hit");function hitPoint(hit){var r=hit.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height*.56,rect:[r.left,r.top,r.width,r.height]};}function hitTarget(hit){var p=hitPoint(hit);return document.elementFromPoint(p.x,p.y);}function hitOwner(hit){var el=hitTarget(hit);return el&&el.closest&&el.closest(".entrance-car-control")&&el.closest(".entrance-car-control").id;}var carBubbles=0;function carBubble(){carBubbles++;}art.addEventListener("click",carBubble);report.steps.carInitial={state:state().car,glint:parseFloat(getComputedStyle(glint).opacity),roles:carControls.map(function(control){return [control.id,control.getAttribute("role"),control.getAttribute("tabindex"),control.getAttribute("aria-pressed"),control.getAttribute("aria-disabled"),control.getAttribute("aria-label"),control.getAttribute("title")];})};var enginePoint=hitPoint(engineHit),engineTarget=hitTarget(engineHit);report.steps.carEngineProbe={point:enginePoint,viewport:[innerWidth,innerHeight],stack:document.elementsFromPoint(enginePoint.x,enginePoint.y).slice(0,8).map(function(el){return el.id||el.className&&el.className.baseVal||el.className||el.tagName;})};if(engineTarget)click(engineTarget);await sleep(30);report.steps.carEngineCoordinateOn={owner:engineTarget&&engineTarget.closest(".entrance-car-control")&&engineTarget.closest(".entrance-car-control").id,state:state().car,running:parseFloat(getComputedStyle(running).opacity)};engineTarget=hitTarget(engineHit);if(engineTarget)click(engineTarget);await sleep(30);report.steps.carEngineCoordinateOff={state:state().car,running:parseFloat(getComputedStyle(running).opacity)};click(document.getElementById("entrance-porsche-headlight"));click(document.getElementById("entrance-porsche-taillight"));await sleep(30);report.steps.carDayLamps={state:state().car,lamps:[parseFloat(getComputedStyle(headOn).opacity),parseFloat(getComputedStyle(tailOn).opacity)]};click(document.getElementById("entrance-porsche-headlight"));click(document.getElementById("entrance-porsche-taillight"));await sleep(30);report.steps.carDayLampsOff={state:state().car,lamps:[parseFloat(getComputedStyle(headOn).opacity),parseFloat(getComputedStyle(tailOn).opacity)]};click(document.getElementById("entrance-porsche-indicator"));await sleep(20);var indicatorFirst=parseFloat(getComputedStyle(indicatorLit).opacity);await sleep(600);report.steps.carIndicator={first:indicatorFirst,after:parseFloat(getComputedStyle(indicatorLit).opacity),classOn:car.classList.contains("indicator-on"),state:state().car};["roof","door","frunk","trunk","engine"].forEach(function(action){click(document.getElementById("entrance-porsche-"+action));});await sleep(30);report.steps.carOpen={state:state().car,classes:car.getAttribute("class")||"",running:parseFloat(getComputedStyle(running).opacity),lidHits:[getComputedStyle(frunkHit).transform,getComputedStyle(trunkHit).transform],lidOwners:[hitOwner(frunkHit),hitOwner(trunkHit)]};click(document.getElementById("entrance-porsche-engine"));await sleep(30);report.steps.carStopped={state:state().car,running:parseFloat(getComputedStyle(running).opacity)};',
  ' function dragPorscheFrom(target,point,dx,id){var before=state().drive.position;target.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:id,pointerType:"mouse",button:0,buttons:1,clientX:point.x,clientY:point.y}));car.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:id,pointerType:"mouse",button:0,buttons:1,clientX:point.x+dx,clientY:point.y}));car.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:id,pointerType:"mouse",button:0,clientX:point.x+dx,clientY:point.y}));return state().drive.position-before;}var dragHit=car.querySelector(".entrance-porsche-drag-hit"),beam=car.querySelector(".entrance-porsche-headlight-beam"),beamRect=beam.getBoundingClientRect(),dragRect=dragHit.getBoundingClientRect(),outsidePoint={x:Math.min(beamRect.left+1,dragRect.left-2),y:beamRect.top+beamRect.height/2},outsideTarget=document.elementFromPoint(outsidePoint.x,outsidePoint.y),outsideCursor=outsideTarget&&getComputedStyle(outsideTarget).cursor;var cursorLeaks=[],carRect=car.getBoundingClientRect();for(var cy=0;cy<=18;cy++)for(var cx=0;cx<=48;cx++){var scanX=carRect.left+carRect.width*cx/48,scanY=carRect.top+carRect.height*cy/18,scanTarget=document.elementFromPoint(scanX,scanY),scanCursor=scanTarget&&getComputedStyle(scanTarget).cursor;if((scanCursor==="grab"||scanCursor==="grabbing")&&(scanX<dragRect.left||scanX>dragRect.right||scanY<dragRect.top||scanY>dragRect.bottom))cursorLeaks.push([scanX,scanY,scanTarget&&(scanTarget.id||scanTarget.getAttribute("class"))]);}var outsideDelta=dragPorscheFrom(beam,outsidePoint,36,81);dragRect=dragHit.getBoundingClientRect();var insidePoint={x:dragRect.left+dragRect.width/2,y:dragRect.top+dragRect.height/2},insideDelta=dragPorscheFrom(dragHit,insidePoint,36,82);dragRect=dragHit.getBoundingClientRect();insidePoint={x:dragRect.left+dragRect.width/2,y:dragRect.top+dragRect.height/2};var restoreDelta=dragPorscheFrom(dragHit,insidePoint,-36,83);report.steps.carDragBounds={outsideDelta:outsideDelta,outsideTarget:outsideTarget&&(outsideTarget.id||outsideTarget.getAttribute("class")),outsideCursor:outsideCursor,cursorLeaks:cursorLeaks,insideDelta:insideDelta,restored:state().drive.position,restoreDelta:restoreDelta,beam:[beamRect.left,beamRect.right],hit:[dragRect.left,dragRect.right]};await sleep(10);',
  ' var runningLights=Array.from(document.querySelectorAll(".entrance-porsche-running-light")),sideGlass=document.getElementById("entrance-porsche-side-glass"),doorGlass=document.getElementById("entrance-porsche-door-glass"),engineBody=document.querySelector(".entrance-car-engine-body"),engineRocker=document.querySelector(".entrance-car-engine-rocker");function glassState(){return {side:[getComputedStyle(sideGlass).visibility,parseFloat(getComputedStyle(sideGlass).opacity)],door:[getComputedStyle(doorGlass).visibility,parseFloat(getComputedStyle(doorGlass).opacity)],state:state().car};}var roofOpenDoorOpen=glassState();click(document.getElementById("entrance-porsche-window"));var loweredRoofOpen=glassState();click(document.getElementById("entrance-porsche-roof"));click(document.getElementById("entrance-porsche-door"));var loweredRoofClosed=glassState();click(document.getElementById("entrance-porsche-window"));var raisedRoofClosed=glassState();click(document.getElementById("entrance-porsche-door"));click(document.getElementById("entrance-porsche-roof"));report.steps.carWindows={roofOpenDoorOpen:roofOpenDoorOpen,loweredRoofOpen:loweredRoofOpen,loweredRoofClosed:loweredRoofClosed,raisedRoofClosed:raisedRoofClosed,restored:state().car};function pointClick(point){var target=document.elementFromPoint(point.x,point.y);if(!target)return null;target.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"mouse",clientX:point.x,clientY:point.y}));target.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,cancelable:true,clientX:point.x,clientY:point.y}));target.dispatchEvent(new MouseEvent("mouseup",{bubbles:true,cancelable:true,clientX:point.x,clientY:point.y}));target.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,clientX:point.x,clientY:point.y}));return target;}function findEngineBodyPoint(){var r=engineBody.getBoundingClientRect(),rock=engineRocker.getBoundingClientRect();for(var gy=1;gy<8;gy++)for(var gx=1;gx<18;gx++){var point={x:r.left+r.width*gx/18,y:r.top+r.height*gy/8};if(point.y>=rock.top-1)continue;var target=document.elementFromPoint(point.x,point.y),owner=target&&target.closest&&target.closest(".entrance-car-control");if(owner&&owner.id==="entrance-porsche-engine")return point;}return null;}var bodyPoint=findEngineBodyPoint(),bodyBefore=state().car.activations.engine||0,bodyTarget=bodyPoint&&pointClick(bodyPoint);await sleep(30);var bodyOn=state().car;var bodyLightsOn=runningLights.map(function(light){return parseFloat(getComputedStyle(light).opacity);});if(bodyPoint)pointClick(bodyPoint);await sleep(30);report.steps.carBodyToggle={point:bodyPoint,owner:bodyTarget&&bodyTarget.closest(".entrance-car-control").id,before:bodyBefore,on:bodyOn,lightsOn:bodyLightsOn,off:state().car};var indicatorControl=document.getElementById("entrance-porsche-indicator"),indicatorPoint=hitPoint(indicatorControl.querySelector(".entrance-car-hit"));viewport.focus();pointClick(indicatorPoint);await sleep(610);var indicatorAfterClick=state().car.activations.indicator,activeAfterClick=document.activeElement&&document.activeElement.id;activeKey("Enter");await sleep(30);var focusEngineOn=state().car;activeKey("Enter");await sleep(30);report.steps.carFocusEnter={active:activeAfterClick,indicatorAfterClick:indicatorAfterClick,on:focusEngineOn,off:state().car};function closeDoorFrame(){click(document.getElementById("entrance-porsche-door"));return {closing:car.classList.contains("door-closing"),openVisibility:getComputedStyle(document.getElementById("entrance-porsche-door-open")).visibility,openOpacity:parseFloat(getComputedStyle(document.getElementById("entrance-porsche-door-open")).opacity),closedOpacity:parseFloat(getComputedStyle(document.getElementById("entrance-porsche-door-closed")).opacity),wellOpacity:parseFloat(getComputedStyle(document.getElementById("entrance-porsche-door-well")).opacity)};}var closeRoofDown=closeDoorFrame();click(document.getElementById("entrance-porsche-door"));click(document.getElementById("entrance-porsche-roof"));var roofUpGlass={visibility:getComputedStyle(doorGlass).visibility,opacity:parseFloat(getComputedStyle(doorGlass).opacity)};var closeRoofUp=closeDoorFrame();click(document.getElementById("entrance-porsche-door"));click(document.getElementById("entrance-porsche-roof"));report.steps.carDoorHandoff={roofDown:closeRoofDown,roofUp:closeRoofUp,roofUpGlass:roofUpGlass,state:state().car};',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return false;},configurable:true});var repliesBefore=state().intercomResponses;click(intercom);await sleep(30);report.steps.intercomGate={before:repliesBefore,after:state().intercomResponses};Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' document.getElementById("stage-balcony").classList.add("dusk");await sleep(20);var nightBefore=state();click(document.getElementById("entrance-porsche-headlight"));click(document.getElementById("entrance-porsche-taillight"));await sleep(30);report.steps.night={state:state(),before:nightBefore,smoke:parseFloat(getComputedStyle(smoke).opacity),lamps:[parseFloat(getComputedStyle(headOn).opacity),parseFloat(getComputedStyle(tailOn).opacity)]};["roof","door","frunk","trunk"].forEach(function(action){click(document.getElementById("entrance-porsche-"+action));});art.removeEventListener("click",carBubble);report.steps.carClosed={state:state().car,bubbles:carBubbles};document.getElementById("stage-balcony").classList.remove("dusk");await sleep(20);',
  ' setLang("cs");report.steps.cs={label:room.getAttribute("aria-label"),floor:document.getElementById("hunt-floor-btn").getAttribute("aria-label"),props:props.map(function(prop){return [prop.getAttribute("aria-label"),prop.getAttribute("title")];}),car:carControls.map(function(control){return [control.getAttribute("aria-label"),control.getAttribute("title")];})};setLang("en");',
  ' click(document.getElementById("entrance-drive-coach-dismiss"));key("ArrowUp");await sleep(30);report.steps.up=state();key("ArrowDown");await sleep(50);key("Escape");await sleep(30);report.steps.escape=state();key("ArrowDown");await sleep(50);key("Backspace");await sleep(30);report.steps.backspace=state();',
  ' window.goToStage("balcony");touchup(document.getElementById("balcony-background"));await sleep(20);touchup(document.getElementById("balcony-background"));await sleep(50);report.steps.touch=state();key("ArrowDown");await sleep(50);',
  ' key("ArrowLeft");await sleep(780);report.steps.left={source:state(),target:window.__bedroomRoomState(),room:window.currentStageName};window.goToStage("balcony");key("ArrowDown");await sleep(50);key("ArrowRight");await sleep(40);report.steps.right={source:state(),room:window.currentStageName};',
  ' var targetDot=document.querySelectorAll(".hunt-dot")[1];targetDot.focus();click(targetDot);await sleep(780);report.steps.dot={source:state(),target:window.__princeState(),room:window.currentStageName,focused:document.activeElement===targetDot};',
  ' window.goToStage("balcony");key("ArrowDown");await sleep(50);click(document.getElementById("hunt-prev"));await sleep(780);report.steps.prev={source:state(),target:window.__bedroomRoomState(),room:window.currentStageName};',
  ' window.goToStage("balcony");key("ArrowDown");await sleep(50);click(document.getElementById("hunt-next"));await sleep(40);report.steps.next={source:state(),room:window.currentStageName};',
  ' window.goToStage("balcony");key("ArrowDown");await sleep(50);key("6");await sleep(780);report.steps.number={source:state(),target:window.__bathroomRoomState(),room:window.currentStageName};',
  ' window.goToStage("balcony");',
  ' window.__secondRound=true;key("ArrowDown");await sleep(50);document.getElementById("entrance-name-stone").classList.add("reacting");window.__deliverPhoneMessage("cue_mail");await sleep(80);var badge=document.querySelector(".msg-badge:not(.entrance-probe)"),coach=document.querySelector(".msg-badge-coach:not(.entrance-probe)"),thumb=document.querySelector(".msg-thumb:not(.entrance-probe)");report.steps.held={state:state(),hold:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),coach:!!coach&&coach.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),thread:window.__phoneMessageThread()};',
  ' click(document.getElementById("hunt-floor-btn"));await sleep(1250);thumb=document.querySelector(".msg-thumb:not(.entrance-probe)");report.steps.closed={state:state(),covered:window.__roomAmbienceCovered(),viewport:viewport.classList.contains("entrance-room-open"),roster:[getComputedStyle(toggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(backdrop).visibility],messages:[getComputedStyle(probeBadge).visibility,getComputedStyle(probeCoach).visibility,getComputedStyle(probeThumb).visibility,getComputedStyle(probeCall).visibility],hold:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show")};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},240);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Entrance lower room:");
var result = lib.runPageSync("rsvp.html", HARNESS, 9000, {
  patchRaf: true,
  chromeFlags: "--window-size=1100,1100"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.interactive && !s.interactive.open && s.stageBackground && !s.stageBackground.open &&
  s.background && !s.background.open &&
  s.open && s.open.bare && s.open.state.open &&
  s.open.room === "balcony" && s.open.viewport && !s.open.state.hidden,
  "Balcony props and bare backgrounds stay upstairs while Down opens Entrance",
  {interactive:s.interactive,stageBackground:s.stageBackground,background:s.background,open:s.open});
check(s.open && s.open.geometry &&
  s.open.geometry.entrance.every(function(value,index){return Math.abs(value-s.open.geometry.viewport[index])<0.7;}) &&
  s.open.geometry.strip[1] + s.open.geometry.strip[3] <= s.open.geometry.viewport[1] + 1,
  "Entrance fills the viewport while the preserved Balcony pans above it", s.open && s.open.geometry);
check(s.open && s.open.roster.every(function(value){return value==="hidden";}),
  "Who's here controls and panel are hidden below the Balcony", s.open && s.open.roster);
check(s.open && s.open.covered && s.open.messages.every(function(value){return value==="hidden";}),
  "upstairs ambience and transient message/call surfaces yield below the Balcony",
  s.open && {covered:s.open.covered,messages:s.open.messages});
check(s.viewportEnter && s.viewportEnter.viewportFocused && !s.viewportEnter.partyBefore &&
  !s.viewportEnter.partyAfter && s.viewportEnter.state.open && s.viewportEnter.state.drive.hud,
  "Enter on the Entrance viewport opens the driving HUD without triggering the Balcony party",
  s.viewportEnter);
check(s.focusedControlEnter && s.focusedControlEnter.keys === 1 && !s.focusedControlEnter.party &&
  s.focusedControlEnter.state.open && !s.focusedControlEnter.state.drive.hud,
  "a genuine focused button keeps its own Enter key",
  s.focusedControlEnter);
check(s.roadHit && s.roadHit.rect[2] >= s.roadHit.art[2] - 1 &&
  s.roadHit.rect[3] >= s.roadHit.art[3] * .2 &&
  /entrance-road-drive-hit/.test(s.roadHit.pavement.target || "") && s.roadHit.pavement.hud &&
  /entrance-road-drive-hit/.test(s.roadHit.asphalt.target || "") && s.roadHit.asphalt.hud,
  "the full-width pavement and asphalt both open the driving HUD",
  s.roadHit);
check(s.open && s.open.geometry && s.open.geometry.floor &&
  s.open.geometry.floor.mark === "›" && s.open.geometry.floor.up &&
  !s.open.geometry.floor.aria && !s.open.geometry.floor.title &&
  s.open.geometry.floor.gap >= 6,
  "Entrance uses the shared Up control beside the room dots",
  s.open && s.open.geometry && s.open.geometry.floor);
check(s.cs && s.cs.props && s.cs.props.length === 10 && s.cs.car && s.cs.car.length === 9,
  "the complete Entrance remains intact while the game switches to Czech", s.cs);
check(s.props && s.props.ids.length === 10 &&
  s.props.ids.every(function(id){return s.props.state.reactions[id] === 1;}) &&
  s.props.roles.every(function(row){return row[1] === null;}),
  "every distinct facade prop reacts while staying outside the Tab order",
  s.props);
check(s.carInitial && !s.carInitial.state.roofOpen && !s.carInitial.state.doorOpen &&
  !s.carInitial.state.windowOpen && !s.carInitial.state.frunkOpen && !s.carInitial.state.trunkOpen && !s.carInitial.state.engineOn &&
  !s.carInitial.state.headlightOn && !s.carInitial.state.taillightOn && s.carInitial.glint > .5 &&
  s.carInitial.roles.length === 9 && s.carInitial.roles.every(function(row){return row[2] === null;}),
  "the daytime Boxster starts roof-up, closed and off with a restrained glint and nine pointer-only controls",
  s.carInitial);
check(s.carEngineCoordinateOn && s.carEngineCoordinateOn.owner === "entrance-porsche-engine" &&
  !s.carEngineCoordinateOn.state.engineOn && s.carEngineCoordinateOn.running === 0 &&
  s.carEngineCoordinateOff && !s.carEngineCoordinateOff.state.engineOn &&
  s.carEngineCoordinateOff.running === 0 && s.carEngineCoordinateOff.state.activations.engine === 2,
  "the retired body-wide engine rocker stays inert while retaining its geometry",
  {probe:s.carEngineProbe,on:s.carEngineCoordinateOn,off:s.carEngineCoordinateOff});
check(s.carDayLamps && s.carDayLamps.state.headlightOn && s.carDayLamps.state.taillightOn &&
  s.carDayLamps.state.activations.headlight === 1 && s.carDayLamps.state.activations.taillight === 1 &&
  s.carDayLamps.lamps.every(function(value){return value === 1;}) &&
  s.carDayLampsOff && !s.carDayLampsOff.state.headlightOn && !s.carDayLampsOff.state.taillightOn &&
  s.carDayLampsOff.state.activations.headlight === 2 && s.carDayLampsOff.state.activations.taillight === 2 &&
  s.carDayLampsOff.lamps.every(function(value){return value === 0;}),
  "daytime head and tail lamps independently toggle visibly on and off",
  {on:s.carDayLamps,off:s.carDayLampsOff});
check(s.carIndicator && s.carIndicator.first === 1 && s.carIndicator.after === 0 &&
  !s.carIndicator.classOn && s.carIndicator.state.indicatorFlashes === 3 &&
  s.carIndicator.state.activations.indicator === 1,
  "the momentary front indicator runs exactly three amber flashes and returns idle",
  s.carIndicator);
check(s.carOpen && s.carOpen.state.roofOpen && s.carOpen.state.doorOpen &&
  !s.carOpen.state.windowOpen && s.carOpen.state.frunkOpen && s.carOpen.state.trunkOpen && !s.carOpen.state.engineOn &&
  /roof-open/.test(s.carOpen.classes) && /door-open/.test(s.carOpen.classes) &&
  /frunk-open/.test(s.carOpen.classes) && /trunk-open/.test(s.carOpen.classes) &&
  !/engine-on/.test(s.carOpen.classes) && s.carOpen.running === 0 &&
  s.carOpen.lidHits.every(function(value){return value && value !== "none";}) &&
  s.carOpen.lidOwners[0] === "entrance-porsche-frunk" && s.carOpen.lidOwners[1] === "entrance-porsche-trunk",
  "roof, driver door, frunk, and trunk toggle independently while raised lids keep aligned hit regions",
  s.carOpen);
check(s.carStopped && !s.carStopped.state.engineOn && s.carStopped.running === 0 &&
  s.carStopped.state.activations.engine === 2 && s.carStopped.state.roofOpen &&
  s.carStopped.state.doorOpen && !s.carStopped.state.windowOpen &&
  s.carStopped.state.frunkOpen && s.carStopped.state.trunkOpen,
  "the retired body rocker leaves the stopped state and open panels untouched", s.carStopped);
check(s.carDragBounds && Math.abs(s.carDragBounds.outsideDelta) < .01 &&
  s.carDragBounds.insideDelta > 10 && Math.abs(s.carDragBounds.restored) < .5 &&
  s.carDragBounds.beam[0] < s.carDragBounds.hit[0] &&
  !/entrance-porsche-headlight-beam/.test(s.carDragBounds.outsideTarget || "") &&
  s.carDragBounds.outsideCursor !== "grab" && s.carDragBounds.outsideCursor !== "grabbing" &&
  s.carDragBounds.cursorLeaks && s.carDragBounds.cursorLeaks.length === 0,
  "Porsche dragging and its grab cursor stop at the car instead of its outlying light beam",
  s.carDragBounds);
check(s.carWindows && !s.carWindows.roofOpenDoorOpen.state.windowOpen &&
  s.carWindows.roofOpenDoorOpen.door[0] === "visible" && s.carWindows.roofOpenDoorOpen.door[1] > .5 &&
  s.carWindows.loweredRoofOpen.state.windowOpen &&
  s.carWindows.loweredRoofOpen.side[0] === "hidden" && s.carWindows.loweredRoofOpen.door[0] === "hidden" &&
  s.carWindows.loweredRoofClosed.state.windowOpen && !s.carWindows.loweredRoofClosed.state.roofOpen &&
  s.carWindows.loweredRoofClosed.side[0] === "hidden" && s.carWindows.loweredRoofClosed.door[0] === "hidden" &&
  !s.carWindows.raisedRoofClosed.state.windowOpen && s.carWindows.raisedRoofClosed.side[0] === "visible" &&
  s.carWindows.raisedRoofClosed.side[1] > .4 && s.carWindows.restored.roofOpen &&
  s.carWindows.restored.doorOpen && !s.carWindows.restored.windowOpen,
  "one switch raises and lowers both side-window renderings independently of roof and door state",
  s.carWindows);
check(s.carBodyToggle && s.carBodyToggle.point && s.carBodyToggle.owner === "entrance-porsche-engine" &&
  !s.carBodyToggle.on.engineOn && !s.carBodyToggle.on.idleActive && !s.carBodyToggle.on.vibrating &&
  s.carBodyToggle.lightsOn.length === 2 && s.carBodyToggle.lightsOn.every(function(value){return value === 0;}) &&
  !s.carBodyToggle.off.engineOn && !s.carBodyToggle.off.idleActive && !s.carBodyToggle.off.vibrating &&
  s.carBodyToggle.off.activations.engine === s.carBodyToggle.before,
  "otherwise-unused body metal cannot bypass the dashboard ignition",
  s.carBodyToggle);
check(s.carFocusEnter && !/^entrance-porsche-/.test(s.carFocusEnter.active || "") &&
  !s.carFocusEnter.on.engineOn && s.carFocusEnter.off.engineOn &&
  s.carFocusEnter.off.activations.indicator === s.carFocusEnter.indicatorAfterClick,
  "a pointer-used Porsche control releases focus while the dashboard ignition owns the first Enter",
  s.carFocusEnter);
check(s.carDoorHandoff && [s.carDoorHandoff.roofDown,s.carDoorHandoff.roofUp].every(function(frame){
    return frame.closing && frame.openVisibility === "hidden" && frame.openOpacity === 0 &&
      frame.closedOpacity === 1 && frame.wellOpacity === 0;
  }) && s.carDoorHandoff.roofUpGlass.visibility === "visible" && s.carDoorHandoff.roofUpGlass.opacity > .5 &&
  s.carDoorHandoff.state.roofOpen && s.carDoorHandoff.state.doorOpen && !s.carDoorHandoff.state.windowOpen,
  "door-close swaps open and closed layers atomically in both roof states while roof-up glass follows the door",
  s.carDoorHandoff);
check(s.props && s.props.intercomReply && s.props.intercomReply.state.reactions["entrance-intercom"] === 1 &&
  s.intercomGate && s.intercomGate.before === 1 && s.intercomGate.after === 1,
  "the intercom answers an attended buzz but stays silent after focus leaves the room",
  {reply:s.props&&s.props.intercomReply,gate:s.intercomGate});
check(s.props && s.props.lamps && s.props.lamps.leftOnly.state.lamps.left &&
  !s.props.lamps.leftOnly.state.lamps.right &&
  s.props.lamps.both.state.lamps.left && s.props.lamps.both.state.lamps.right,
  "the two physical entrance lamps toggle independently",
  s.props&&s.props.lamps);
check(s.open && !s.open.state.night && s.open.state.windows.every(function(row){return !row.on;}) &&
  s.props && s.props.state.windows.every(function(row){return row.on;}) &&
  s.props.state.windowsFlipped && s.props.caption === "entrance_windows_all_on",
  "day starts with every window dark and rewards independently switching all five on",
  {open:s.open&&s.open.state,props:s.props});
check(s.skyToggle && !s.skyToggle.before.night && s.skyToggle.night.night &&
  !s.skyToggle.restored.night && s.skyToggle.cursor === "pointer" && s.skyToggle.tabindex === null,
  "the exposed façade sky round-trips day and night without entering the Tab order",
  s.skyToggle);
check(s.enterEngine && s.enterEngine.on.car.engineOn && !s.enterEngine.off.car.engineOn &&
  s.enterEngine.off.car.activations.engine === 2 &&
  s.enterEngine.before.every(function(on,index){return on===s.enterEngine.off.windows[index].on;}),
  "the ignition action starts and stops the Porsche without changing the window puzzle", s.enterEngine);
check(s.open && parseFloat(s.open.smoke[0]) === 0.5 && s.open.smoke[1] > 0 &&
  s.night && s.night.smoke === 0,
  "Entrance shares the Balcony wildfire intensity by day and clears the wash at night",
  {day:s.open&&s.open.smoke,night:s.night});
check(s.seasons &&
  s.seasons.summer.art.join(",") === "inline,none,none,none,none,none,inline,none,none" &&
  s.seasons.autumn.art.join(",") === "none,inline,none,none,inline,none,inline,none,none" &&
  s.seasons.winter.art.join(",") === "none,none,none,inline,none,inline,none,inline,inline" &&
  s.seasons.stedry.art.join(",") === "none,none,none,inline,none,inline,none,inline,inline" &&
  s.seasons.spring.art.join(",") === "none,none,inline,none,none,inline,none,none,none" &&
  /season-autumn/.test(s.seasons.autumn.classes) && /climate-winter/.test(s.seasons.winter.classes) &&
  /season-holiday/.test(s.seasons.stedry.classes) && /season-spring/.test(s.seasons.spring.classes),
  "Entrance selects mature summer, fallen-leaf autumn, bare snowy winter, and airy fresh spring art through the live season path",
  s.seasons);
check(s.cutoff && /entrance-winter-cover/.test(s.cutoff.mar31.room) &&
  !/entrance-spring-growth/.test(s.cutoff.mar31.room) &&
  s.cutoff.mar31.art.join(",") === "none,none,none,inline,none,inline,none,inline,inline" &&
  /entrance-spring-growth/.test(s.cutoff.apr1.room) &&
  !/entrance-winter-cover/.test(s.cutoff.apr1.room) &&
  s.cutoff.apr1.art.join(",") === "none,none,inline,none,none,inline,none,none,none",
  "Entrance accumulated snow stays through March 31 and clears for April 1 spring growth",
  s.cutoff);
check(s.cutoff && /entrance-snowing/.test(s.cutoff.apr1snow.room) && s.cutoff.apr1snow.flakes > .8 &&
  s.cutoff.apr1snow.art.join(",") === "none,none,inline,none,none,inline,none,none,none",
  "active April 1 snowfall keeps flakes but cannot restore the winter tree, bank, or architectural caps",
  s.cutoff && s.cutoff.apr1snow);
check(s.uv && s.uv.window === "entrance-window-view-mid-left" &&
  s.uv.off === 0 && s.uv.on > 0.7 && s.uv.after === 0,
  "the party UV glow appears only in the loft's second facade window from the left",
  s.uv);
check(s.night && s.night.before.night && s.night.before.windows.every(function(row){return row.on;}) &&
  !s.night.before.windowsFlipped && s.night.state.car.headlightOn && s.night.state.car.taillightOn &&
  s.night.state.car.activations.headlight === 3 && s.night.state.car.activations.taillight === 3 &&
  s.night.lamps.every(function(value){return value === 1;}),
  "nightfall resets every facade window while Porsche head and tail lamps remain independently available", s.night);
check(s.carClosed && !s.carClosed.state.roofOpen && !s.carClosed.state.doorOpen &&
  !s.carClosed.state.windowOpen && !s.carClosed.state.frunkOpen && !s.carClosed.state.trunkOpen &&
  s.carClosed.state.headlightOn && s.carClosed.state.taillightOn && s.carClosed.bubbles === 0,
  "each car control stops propagation and closing panels leaves the independently toggled night lamps alone",
  s.carClosed);
check(s.up && s.up.open && s.up.drive.holds.throttle && s.escape && s.escape.open && !s.escape.drive.hud &&
  s.backspace && s.backspace.open,
  "Up remains throttle while the HUD is open, Escape closes the HUD, and idle Backspace stays downstairs",
  {up:s.up,escape:s.escape,backspace:s.backspace});
check(s.touch && !s.touch.open, "a bare-background touch double-tap stays upstairs", s.touch);
check(s.number && !s.number.source.open && s.number.target.open && s.number.room === "kitchen",
  "a 6–0 shortcut pans directly to its downstairs room", s.number);
check(s.left && !s.left.source.open && s.left.target.open && s.left.room === "office" &&
  s.right && s.right.source.open && s.right.room === "balcony",
  "Left pans to Bedroom while Right stays at the lower floor's edge", {left:s.left,right:s.right});
check(s.dot && !s.dot.source.open && s.dot.target.basement && s.dot.room === "garden" && s.dot.focused,
  "a room dot stays downstairs, pans to the dungeon, and retains focus", s.dot);
check(s.prev && !s.prev.source.open && s.prev.target.open && s.prev.room === "office" &&
  s.next && s.next.source.open && s.next.room === "balcony",
  "the side arrows pan left and stay put at the lower floor's right edge", {prev:s.prev,next:s.next});
check(s.held && s.held.hold.messages.indexOf("cue_mail") !== -1 &&
  !s.held.badge && !s.held.coach && !s.held.thumb && s.held.thread.indexOf("cue_mail") !== -1 &&
  s.closed && !s.closed.state.open && s.closed.state.hidden && !s.closed.viewport &&
  !s.closed.hold.messages.length && s.closed.badge && s.closed.thumb,
  "Entrance queues transient message UI and releases it only after the return pan", {held:s.held,closed:s.closed});
check(s.closed && s.closed.roster.every(function(value){return value==="visible";}),
  "the completed return restores the open Who's here surface", s.closed && s.closed.roster);
check(s.closed && !s.closed.covered && s.closed.messages.every(function(value){return value==="visible";}),
  "the completed return restores upstairs ambience and transient surfaces",
  s.closed && {covered:s.closed.covered,messages:s.closed.messages});
check(s.closed && s.closed.state && !s.closed.state.reacting.length,
  "leaving Entrance clears every in-flight prop reaction", s.closed && s.closed.state);
check(s.closed && s.closed.state && s.held && s.held.state &&
  ["roofOpen","doorOpen","windowOpen","frunkOpen","trunkOpen","engineOn","headlightOn","taillightOn"].every(function(key){
    return s.closed.state.car[key] === s.held.state.car[key];
  }) && !s.closed.state.car.idleActive && !s.closed.state.car.vibrating,
  "leaving Entrance preserves settled Boxster switches while parking idle and tremor",
  {before:s.held&&s.held.state&&s.held.state.car,after:s.closed&&s.closed.state&&s.closed.state.car});

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var entrance = (source.match(/<div id="entrance-room"[\s\S]*?<\/div>\s*<div id="prince-basement"/) || [""])[0];
check(/THE LOFTS/.test(entrance) && /id="entrance-brick"/.test(source) &&
  /fill="url\(#entrance-brick\)"/.test(entrance) &&
  /id="entrance-sidewalk"/.test(entrance) && /id="entrance-tree-summer"/.test(entrance),
  "the inline scene carries the facade's brick, stone, canopy, and sidewalk identity");
check((entrance.match(/class="entrance-prop"/g) || []).length === 10 &&
  (entrance.match(/class="entrance-prop"[^>]*tabindex=/g) || []).length === 0,
  "the complete Entrance interaction inventory stays outside the Tab order");
check((entrance.match(/class="entrance-car-control"/g) || []).length === 9 &&
  !/class="entrance-car-control"[^>]*tabindex=/.test(entrance) &&
  /id="entrance-porsche"/.test(entrance) && /id="entrance-porsche-roof-closed"/.test(entrance) &&
  /id="entrance-porsche-door-panel"/.test(entrance) && /id="entrance-porsche-frunk-panel"/.test(entrance) &&
  /id="entrance-porsche-trunk-panel"/.test(entrance) && /id="entrance-porsche-mirror"/.test(entrance),
  "the inline Boxster keeps nine partitioned controls and separate roof, door, window, compartment, and indicator art");
check(/id="entrance-porsche" transform="translate\(328 -9\)"/.test(entrance) &&
  (entrance.match(/class="entrance-car-control"[^>]*transform="translate\(328 -9\)"/g) || []).length === 9,
  "the complete Porsche visual and all nine controls share the right-side placement and approved nine-unit lift");
check((entrance.match(/class="entrance-porsche-scale" transform="translate\(8 345\) scale\(\.85\) translate\(-8 -345\)"/g) || []).length === 10,
  "the complete Porsche visual and all nine controls share the grounded fifteen-percent scale");
check(/#entrance-porsche-door-closed\{transition:none\}/.test(source) &&
  /#entrance-porsche-door-open\{[\s\S]*?transition:none/.test(source) &&
  /#entrance-porsche-door-well\{opacity:0;transition:none\}/.test(source),
  "the open and closed door shells use inverse atomic handoffs without a staged slam");
check(!/\.entrance-car-control:(?:hover|focus-visible)/.test(source) &&
  !/id="entrance-(?:doors|walk)"|entrance_(?:door|sidewalk):/.test(source),
  "car hit regions stay visually transparent and removed building hits leave no stale interaction");
check(/function playPorscheEngineSound\(starting\)[\s\S]*?getSfxCtx\(\)[\s\S]*?createOscillator\(\)/.test(source) &&
  /function answerPorscheControl\(control, event\)[\s\S]*?event\.stopPropagation\(\)/.test(source),
  "the engine voice stays on the shared SFX path and car hits stop at their own handlers");
check(/id="entrance-porsche-full-seats">[\s\S]*?id="entrance-porsche-passenger-seat-base"[\s\S]*?id="entrance-porsche-center-console"[\s\S]*?id="entrance-porsche-driver-seat-base"/.test(entrance) &&
  !/entrance-porsche-(?:open-door-seats|closed-seatbacks)/.test(source) &&
  entrance.indexOf('id="entrance-porsche-full-seats"') < entrance.indexOf('id="entrance-porsche-door-panel"'),
  "one permanent full-height seat stack layers passenger, tunnel, then driver behind the physical door");
check(/id="entrance-porsche-front-running-lamp"/.test(entrance) &&
  /id="entrance-porsche-rear-running-lamp"/.test(entrance) &&
  /var porscheIdleNodes = null/.test(source) && !/porscheIdleCtx|porscheIdleNodes\._|idle\.bed\.close/.test(source),
  "running lamps use separate dimensional housings and idle owns nodes rather than the shared context");
check(/id="entrance-intercom"[^>]*>[\s\S]{0,180}?class="entrance-hit" x="400\.2" y="240\.7" width="8\.6" height="7\.6"/.test(entrance) &&
  /reacting\[data-entrance-action="intercom"\] \.entrance-intercom-lens/.test(source) &&
  !/reacting\[data-entrance-action="intercom"\] \.entrance-hit/.test(source) &&
  /playPhoneVoiceSound\("entrance-intercom"\)/.test(source),
  "the intercom hit matches its physical button while only the lens pulses and Haló uses the phone voice",
  null);
check(/id="hunt-floor-btn"/.test(source) &&
  !/(?:bathroom|cinema|prince-basement|bedroom|entrance)-room-close/.test(source),
  "Entrance shares the unified bottom-chrome floor control");
check(!/<image\b|(?:src|href)="[^"]+\.(?:png|jpe?g|webp)"/i.test(entrance) &&
  !/<text\b[^>]*>\s*[^<]*(?:\d{2,}\s+(?:street|st\.|avenue|ave\.)|\b(?:street|avenue)\b)/i.test(entrance),
  "Entrance publishes neither a reference image nor the private street numbers");

console.log("");
if (failures) { console.log(failures + " Entrance-room assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Entrance-room assertions passed.");
