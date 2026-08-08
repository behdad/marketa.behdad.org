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
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' window.goToStage("cuddly");if(window.__setDayNight)window.__setDayNight(false);window.__cuddlyProjector.set("coffee");document.querySelector(".hunt-viewport").style.transition="none";document.getElementById("cinema-room").style.transition="none";document.getElementById("loft-game-strip").style.transition="none";await sleep(520);',
  ' var roster=document.querySelector(".roster-panel"),rosterToggle=document.querySelector(".roster-toggle"),rosterBackdrop=document.querySelector(".roster-backdrop");roster.classList.add("show");rosterBackdrop.classList.add("show");window.__ireneShow("irene-sit");var cameoBefore=document.getElementById("cuddly-irene").classList.contains("showing");',
  ' var channel=window.__cuddlyProjector.channel(),before=window.__activeAudioBedCount(),ticket=document.getElementById("cuddly-cinema-ticket"),ticketBox=ticket.getBoundingClientRect(),screenBox=document.getElementById("cuddly-screen-bg").getBoundingClientRect();dblclick(ticket);await sleep(1300);',
  ' report.steps.firstProjector={state:window.__cinemaRoomState(),frame:!!document.getElementById("cinema-player"),chooser:document.getElementById("cinema-chooser").hidden,off:!document.getElementById("cinema-screen-off").hidden};',
  ' var cinemaRoom=document.getElementById("cinema-room"),lensGlow=document.getElementById("cinema-projector-lens-glow");key("ArrowUp");await sleep(60);report.steps.onExit={state:window.__cinemaRoomState(),cooling:cinemaRoom.classList.contains("projector-cooling"),poweredClass:cinemaRoom.classList.contains("projector-on"),animation:getComputedStyle(lensGlow).animationName};key("ArrowDown");await sleep(80);',
  ' var projector=document.getElementById("cinema-projector"),offScreen=document.getElementById("cinema-screen-off");click(projector);var manualOff=window.__cinemaRoomState();click(offScreen);await sleep(40);report.steps.screenClickOn=window.__cinemaRoomState();click(projector);click(projector);await sleep(40);var clickOn=window.__cinemaRoomState();document.getElementById("hunt-playpause-btn").focus();key(" ");await sleep(40);var spacePlay=window.__cinemaRoomState();key("Escape");await sleep(40);key("Enter");await sleep(40);var enterPlay=window.__cinemaRoomState();key("Escape");await sleep(40);report.steps.projectorControls={manualOff:manualOff,clickOn:clickOn,spacePlay:spacePlay,enterPlay:enterPlay,restored:window.__cinemaRoomState()};',
  ' var remotePower=document.getElementById("cinema-remote-google"),remoteRing=document.getElementById("cinema-remote-vava-ring"),remoteOk=document.getElementById("cinema-remote-vava-ok"),remotePad=document.getElementById("cinema-remote-pad"),vavaRemote=document.getElementById("cinema-remote-vava");function hitBox(el){var hit=el.querySelector(".cinema-hit");return ["x","y","width","height"].map(function(name){return +(hit.getAttribute(name)||0);});}click(remotePower);var remoteOff=window.__cinemaRoomState();click(remotePower);var remoteOn=window.__cinemaRoomState();click(remoteRing);var ringTactile=vavaRemote.classList.contains("remote-reacting"),remoteNext=window.__cinemaRoomState();click(remoteOk);var okTactile=vavaRemote.classList.contains("remote-reacting");await sleep(30);var remotePlay=window.__cinemaRoomState();click(remoteOk);await sleep(30);report.steps.remotes={off:remoteOff,on:remoteOn,next:remoteNext,play:remotePlay,back:window.__cinemaRoomState(),chooser:document.getElementById("cinema-chooser").hidden,current:Array.from(document.querySelectorAll(".cinema-film")).map(function(el){return el.classList.contains("remote-current");}),controls:[remotePower,remoteRing,remoteOk].map(function(el){return [el.id,getComputedStyle(el).cursor];}),hits:{power:hitBox(remotePower),ring:hitBox(remoteRing),ok:hitBox(remoteOk),projector:hitBox(projector)},tactile:[ringTactile,okTactile],padBefore:!!(remotePad.compareDocumentPosition(remotePower)&Node.DOCUMENT_POSITION_FOLLOWING),vava:!!vavaRemote.querySelector("text")};',
  ' var posters=Array.prototype.map.call(document.querySelectorAll(".cinema-film"),function(el){var r=el.getBoundingClientRect(),img=el.querySelector("img"),ir=img.getBoundingClientRect();return {box:[r.left,r.top,r.width,r.height],image:[ir.left,ir.top,ir.width,ir.height],fit:getComputedStyle(img).objectFit,video:el.dataset.vimeoId,src:img.getAttribute("src"),poster:el.dataset.poster};});',
  ' var cinemaBox=document.getElementById("cinema-room").getBoundingClientRect(),viewportBox=document.querySelector(".hunt-viewport").getBoundingClientRect(),cuddlyBox=document.getElementById("stage-cuddly").getBoundingClientRect(),floorButton=document.getElementById("hunt-floor-btn"),floorBox=floorButton.getBoundingClientRect(),dotsBox=document.getElementById("hunt-dots").getBoundingClientRect();',
  ' report.steps.open={state:window.__cinemaRoomState(),room:window.currentStageName,channel:window.__cuddlyProjector.channel(),covered:window.__roomAmbienceCovered(),beds:window.__activeAudioBedCount(),hum:window.__cinemaProjectorHumState&&window.__cinemaProjectorHumState(),hidden:document.getElementById("cinema-room").hidden,viewport:document.querySelector(".hunt-viewport").classList.contains("cinema-room-open"),before:before,posters:posters,ticket:[ticketBox.left,ticketBox.top,ticketBox.right,ticketBox.bottom],screen:[screenBox.left,screenBox.top,screenBox.right,screenBox.bottom],geometry:{cinema:[cinemaBox.left,cinemaBox.top,cinemaBox.width,cinemaBox.height],viewport:[viewportBox.left,viewportBox.top,viewportBox.width,viewportBox.height],cuddlyBottom:cuddlyBox.bottom,floor:{mark:floorButton.textContent,up:floorButton.classList.contains("floor-up"),aria:floorButton.hasAttribute("aria-label"),title:floorButton.hasAttribute("title"),gap:floorBox.left-dotsBox.right}},roster:[getComputedStyle(rosterToggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(rosterBackdrop).visibility]};',
  ' report.steps.occupants={before:cameoBefore,irene:document.getElementById("cuddly-irene").classList.contains("showing"),robin:document.getElementById("cuddly-robin").classList.contains("showing"),navid:document.getElementById("cuddly-navid").classList.contains("showing"),visitors:window.__cuddlyVisitorsNow().length,kids:document.getElementById("cuddly-kidgames").classList.contains("playing"),forcedVisit:window.__cuddlyVisit("bahareh",true)};',
  ' var cinemaProps=Array.prototype.slice.call(document.querySelectorAll("#cinema-room .cinema-prop")),propIds=cinemaProps.map(function(el){return el.id;}),cameraLeft=document.getElementById("cinema-camera-left"),cameraRight=document.getElementById("cinema-camera-right"),pbSurface=document.getElementById("cinema-photobooth-surface");click(cameraLeft);var cameraLeftOnly=[cameraLeft.classList.contains("reacting"),cameraRight.classList.contains("reacting")];await sleep(60);var leftProjection={state:window.__cinemaRoomState(),parent:document.getElementById("monitor-photobooth").parentElement.id,monitorInCinema:!!document.getElementById("office-monitor").closest("#cinema-room"),frame:!!document.getElementById("cinema-player"),remoteBack:!document.getElementById("cinema-chooser").hidden,tabs:pbSurface.querySelectorAll("[tabindex=\\"0\\"]").length};click(remoteRing);await sleep(40);cameraLeft.classList.remove("reacting");click(cameraRight);var cameraRightOnly=[cameraLeft.classList.contains("reacting"),cameraRight.classList.contains("reacting")];await sleep(60);var rightProjection={state:window.__cinemaRoomState(),parent:document.getElementById("monitor-photobooth").parentElement.id,model:cameraRight.dataset.cameraModel};click(remoteRing);await sleep(40);cameraRight.classList.remove("reacting");propIds.filter(function(id){return id!=="cinema-projector"&&id!=="cinema-sprinkler"&&id!=="cinema-window"&&id!=="cinema-camera-left"&&id!=="cinema-camera-right"&&id.indexOf("cinema-remote-")!==0;}).forEach(function(id){click(document.getElementById(id));});var poufs=document.getElementById("office-nesting-poufs");report.steps.props={ids:propIds,tabs:cinemaProps.map(function(el){return el.getAttribute("tabindex");}),tabStops:document.querySelectorAll("#cinema-room [tabindex=\\"0\\"]").length,poufs:{inCinema:!!poufs.closest("#cinema-furniture-overlay"),inOffice:!!poufs.closest("#stage-office"),tabindex:poufs.getAttribute("tabindex")},reactions:window.__cinemaRoomState().reactions,cameraCluster:!!document.getElementById("cinema-cameras"),cameraCase:!!document.querySelector("#cinema-room-art rect[x=\\"648\\"][y=\\"218\\"]"),cameraFlashes:document.querySelectorAll(".cinema-camera-flash").length,cameraLeftOnly:cameraLeftOnly,cameraRightOnly:cameraRightOnly,leftProjection:leftProjection,rightProjection:rightProjection,restored:document.getElementById("monitor-photobooth").parentElement.id!=="cinema-photobooth-surface",models:[cameraLeft.dataset.cameraModel,cameraRight.dataset.cameraModel],details:{blackmagic:!!document.getElementById("cinema-camera-blackmagic-body"),canon:!!document.getElementById("cinema-camera-canon-body"),vava:!!document.getElementById("cinema-projector-vava"),slot:!!document.getElementById("cinema-projector-lens-slot")}};',
  ' var weights=document.getElementById("cinema-weights"),weightShade=document.getElementById("cinema-weights-shading"),weightHit=weights.querySelector(".cinema-hit");report.steps.props.weights={silhouette:document.getElementById("cinema-weights-silhouette").getAttribute("d"),shadePaths:weightShade.querySelectorAll("path").length,pointer:weightShade.getAttribute("pointer-events"),hit:[weightHit.getAttribute("x"),weightHit.getAttribute("y"),weightHit.getAttribute("width"),weightHit.getAttribute("height")]};',
  ' var neon=document.getElementById("cinema-neon-butterfly"),bike=document.getElementById("cinema-bike"),nr=neon.getBoundingClientRect(),bir=bike.getBoundingClientRect();click(neon);await sleep(80);report.steps.neon={count:document.querySelectorAll("#cinema-neon-butterfly").length,inCinema:!!neon.closest("#cinema-room"),inOffice:!!neon.closest("#stage-office"),relighting:neon.classList.contains("relighting"),box:[nr.left,nr.top,nr.right,nr.bottom],bike:[bir.left,bir.top,bir.right,bir.bottom]};',
  ' var cinemaSky=document.getElementById("cinema-window-sky"),cinemaWindow=document.getElementById("cinema-window");cinemaSky.style.transition="none";report.steps.cinemaDay={night:document.getElementById("cinema-room").classList.contains("cinema-night"),fill:getComputedStyle(cinemaSky).fill};window.__setDayNight(true);await sleep(40);report.steps.cinemaNight={night:document.getElementById("cinema-room").classList.contains("cinema-night"),fill:getComputedStyle(cinemaSky).fill};window.__setDayNight(false);await sleep(40);',
  ' click(cinemaWindow);await sleep(40);var clickedNight=document.getElementById("cinema-room").classList.contains("cinema-night");click(cinemaWindow);await sleep(40);report.steps.cinemaWindowToggle={clickedNight:clickedNight,clickedDay:!document.getElementById("cinema-room").classList.contains("cinema-night")};',
  ' setLang("cs");report.steps.cs={lang:document.documentElement.lang,title:document.getElementById("cinema-room-title").textContent};setLang("en");',
  ' var film=document.querySelector(".cinema-film[data-vimeo-id=\\"1096537359\\"]");click(film);await sleep(80);var frame=document.getElementById("cinema-player");',
  ' var shell=document.getElementById("cinema-screen-shell"),bezel=document.getElementById("cinema-screen-bezel"),wrap=document.getElementById("cinema-player-wrap"),chooser=document.getElementById("cinema-chooser"),sr=shell.getBoundingClientRect(),zr=bezel.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),fr=frame&&frame.getBoundingClientRect(),rr=document.getElementById("cinema-room").getBoundingClientRect();',
  ' report.steps.play={state:window.__cinemaRoomState(),src:frame&&frame.src,allow:frame&&frame.getAttribute("allow"),duck:window.__partyDuck,audioDuck:window.__cinemaAudioDuckState(),ray:parseFloat(getComputedStyle(document.getElementById("cinema-projector-ray")).opacity),chooser:chooser.hidden,chooserDisplay:getComputedStyle(chooser).display,geometry:fr&&{frame:[fr.left,fr.top,fr.width,fr.height],wrap:[wr.left,wr.top,wr.width,wr.height],shell:[sr.left+shell.clientLeft,sr.top+shell.clientTop,shell.clientWidth,shell.clientHeight],shellOuter:[sr.left,sr.top,sr.right,sr.bottom],bezel:[zr.left,zr.top,zr.right,zr.bottom],room:[rr.left,rr.top,rr.right,rr.bottom]}};key("Escape");await sleep(40);report.steps.escapeFilm={state:window.__cinemaRoomState(),frame:!!document.getElementById("cinema-player"),chooser:chooser.hidden};key("Escape");await sleep(40);report.steps.escapeProjector={state:window.__cinemaRoomState(),off:!document.getElementById("cinema-screen-off").hidden};key("Escape");await sleep(40);report.steps.escapeIdle=window.__cinemaRoomState();click(document.getElementById("cinema-screen-off"));click(film);await sleep(80);frame=document.getElementById("cinema-player");',
  ' var vimeoCommands=[];function recordVimeoCommand(event){vimeoCommands.push(event.detail);}window.addEventListener("cinema:vimeo-command",recordVimeoCommand);var vimeoSource=frame.contentWindow;window.dispatchEvent(new MessageEvent("message",{origin:"https://player.vimeo.com",source:vimeoSource,data:{event:"ready",player_id:"cinema-player"}}));await sleep(20);click(document.getElementById("hunt-playpause-btn"));await sleep(30);var sidePause={state:window.__cinemaRoomState(),duck:window.__cinemaAudioDuckState()};click(document.getElementById("hunt-playpause-btn"));await sleep(30);var sidePlay={state:window.__cinemaRoomState(),duck:window.__cinemaAudioDuckState()};var oldVolume=window.volumebutton(),changedVolume=oldVolume===1?.4:1,oldMapped=window.__cinemaVolumeForSiteLevel(oldVolume),changedMapped=window.__cinemaVolumeForSiteLevel(changedVolume);window.volumebutton(changedVolume);await sleep(20);window.volumebutton(oldVolume);await sleep(380);report.steps.vimeoControls={commands:vimeoCommands.slice(),ready:window.__cinemaRoomState().vimeoReady,oldVolume:oldVolume,changedVolume:changedVolume,oldMapped:oldMapped,changedMapped:changedMapped,mapped:[0,.15,.4,1].map(window.__cinemaVolumeForSiteLevel),curve:Array.from({length:101},function(_,i){return window.__cinemaVolumeForSiteLevel(i/100);})};click(document.getElementById("hunt-skip-btn"));await sleep(40);report.steps.sideTransport={pause:sidePause,play:sidePlay,next:window.__cinemaRoomState()};',
  ' frame=document.getElementById("cinema-player");var completionStart=vimeoCommands.length;vimeoSource=frame.contentWindow;window.dispatchEvent(new MessageEvent("message",{origin:"https://player.vimeo.com",source:window,data:{event:"ended",player_id:"cinema-player"}}));await sleep(20);report.steps.vimeoForged={state:window.__cinemaRoomState(),frame:document.getElementById("cinema-player")===frame,chooser:chooser.hidden};window.dispatchEvent(new MessageEvent("message",{origin:"https://player.vimeo.com",source:vimeoSource,data:{event:"ready",player_id:"cinema-player"}}));window.dispatchEvent(new MessageEvent("message",{origin:"https://player.vimeo.com",source:vimeoSource,data:{event:"timeupdate",data:{seconds:299.4,duration:300,percent:.998},player_id:"cinema-player"}}));await sleep(400);var beforeEndedPoll=window.__cinemaRoomState();window.dispatchEvent(new MessageEvent("message",{origin:"https://player.vimeo.com",source:vimeoSource,data:{method:"getEnded",value:true,player_id:"cinema-player"}}));await sleep(40);report.steps.vimeoEnded={state:window.__cinemaRoomState(),before:beforeEndedPoll,commands:vimeoCommands.slice(completionStart),frame:!!document.getElementById("cinema-player"),chooser:!chooser.hidden,duck:window.__cinemaAudioDuckState(),focused:document.activeElement===document.querySelectorAll(".cinema-film")[1],dismiss:document.getElementById("cinema-projector-dismiss").hidden};window.removeEventListener("cinema:vimeo-command",recordVimeoCommand);click(film);await sleep(40);',
  ' var sprinkler=document.getElementById("cinema-sprinkler"),sprinklerHit=sprinkler.querySelector(".cinema-hit");click(sprinklerHit);await sleep(80);var waterOverlay=document.getElementById("cinema-water-overlay"),screenShell=document.getElementById("cinema-screen-shell");report.steps.sprinklerShort={state:window.__cinemaRoomState(),frame:!!document.getElementById("cinema-player"),duck:window.__cinemaAudioDuckState(),spraying:document.getElementById("cinema-room").classList.contains("spraying"),overlay:{z:getComputedStyle(waterOverlay).zIndex,after:!!(screenShell.compareDocumentPosition(waterOverlay)&Node.DOCUMENT_POSITION_FOLLOWING),parent:waterOverlay.parentElement.id,hardware:!!waterOverlay.querySelector(".cinema-sprinkler-hardware"),hit:waterOverlay.contains(sprinklerHit),pointer:getComputedStyle(sprinkler).pointerEvents}};click(remotePower);click(remoteRing);click(remoteOk);report.steps.sprinklerRemoteLock=window.__cinemaRoomState();await sleep(3650);var rebootBefore=window.__cinemaRoomState();click(remoteRing);await sleep(1250);report.steps.sprinklerReboot={before:rebootBefore,state:window.__cinemaRoomState(),chooser:document.getElementById("cinema-chooser").hidden,off:document.getElementById("cinema-screen-off").hidden,caption:document.getElementById("hunt-caption").textContent};click(film);await sleep(40);',
  ' click(remoteRing);await sleep(40);report.steps.back={state:window.__cinemaRoomState(),frame:!!document.getElementById("cinema-player"),chooser:document.getElementById("cinema-chooser").hidden};',
  ' click(film);await sleep(40);window.goToStage("office");await sleep(80);report.steps.navigate={state:window.__cinemaRoomState(),room:window.currentStageName,frame:!!document.getElementById("cinema-player"),channel:window.__cuddlyProjector.channel()};',
  ' window.goToStage("cuddly");window.__cuddlyProjector.set("fire");window.__playSongAt(0);await sleep(100);window.__openCinemaRoom();report.steps.remoteResume={state:window.__cinemaRoomState(),current:document.querySelectorAll(".cinema-film.remote-current").length};click(film);await sleep(40);click(document.getElementById("hunt-floor-btn"));await sleep(900);report.steps.fastClose={open:window.__cinemaRoomState().open,song:window.__phoneMusicPlaying(),hidden:document.getElementById("cinema-room").hidden,viewport:document.querySelector(".hunt-viewport").classList.contains("cinema-room-open"),roster:[getComputedStyle(rosterToggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(rosterBackdrop).visibility]};',
  ' dblclick(document.getElementById("cuddly-wallscreen"));await sleep(40);report.steps.cuddlyInteractive=window.__cinemaRoomState();',
  ' dblclick(document.getElementById("cuddly-wall"));await sleep(80);report.steps.cuddlyMouse=window.__cinemaRoomState();',
  ' touchup(document.getElementById("cuddly-wall"));await sleep(30);touchup(document.getElementById("cuddly-wall"));await sleep(80);report.steps.cuddlyTouch=window.__cinemaRoomState();',
  ' window.goToStage("garden");await sleep(80);dblclick(document.getElementById("garden-window-pane-0"));await sleep(40);report.steps.gardenInteractive=window.__princeState();',
  ' dblclick(document.getElementById("garden-wall"));await sleep(80);report.steps.gardenMouse=window.__princeState();',
  ' touchup(document.getElementById("garden-wall"));await sleep(30);touchup(document.getElementById("garden-wall"));await sleep(80);report.steps.gardenTouch=window.__princeState();report.steps.gardenReturn=window.__princeState();',
  ' window.goToStage("office");var toggles=0,steps=[],oldToggle=window.__toggleDayNight,oldStep=window.__calStepTime;window.__toggleDayNight=function(){toggles++;};window.__calStepTime=function(n){steps.push(n);};key("ArrowDown");key("ArrowUp");key("d");key("ArrowUp",{shiftKey:true});key("ArrowDown",{shiftKey:true});window.__toggleDayNight=oldToggle;window.__calStepTime=oldStep;report.steps.verticalElsewhere={toggles:toggles,steps:steps,cinema:window.__cinemaRoomState(),prince:window.__princeState(),bathroom:window.__bathroomRoomState()};',
  ' window.goToStage("kitchen");key("ArrowDown");await sleep(850);report.steps.kitchenDown=window.__bathroomRoomState();key("ArrowUp");await sleep(760);report.steps.kitchenUp=window.__bathroomRoomState();',
  ' window.goToStage("cuddly");key("ArrowDown");await sleep(850);report.steps.cuddlyDown=window.__cinemaRoomState();key("ArrowUp");await sleep(760);report.steps.cuddlyUp=window.__cinemaRoomState();',
  ' window.goToStage("garden");key("ArrowDown");await sleep(850);report.steps.gardenDown=window.__princeState();key("ArrowUp");await sleep(780);report.steps.gardenUp=window.__princeState();',
  ' window.__secondRound=true;window.goToStage("cuddly");key("ArrowDown");await sleep(850);window.__deliverPhoneMessage("cue_mail");await sleep(80);var badge=document.querySelector(".msg-badge"),coach=document.querySelector(".msg-badge-coach"),thumb=document.querySelector(".msg-thumb");report.steps.cinemaMessageHold={held:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),coach:!!coach&&coach.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),thread:window.__phoneMessageThread()};key("ArrowUp");await sleep(1600);thumb=document.querySelector(".msg-thumb");report.steps.cinemaMessageRelease={held:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),thread:window.__phoneMessageThread()};if(window.__hideMessageThumb)window.__hideMessageThumb(true);',
  ' window.goToStage("garden");key("ArrowDown");await sleep(850);window.__deliverPhoneMessage("cue_calendar");await sleep(80);report.steps.princeMessageHold={held:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),coach:!!coach&&coach.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),thread:window.__phoneMessageThread()};key("ArrowUp");await sleep(1600);thumb=document.querySelector(".msg-thumb");report.steps.princeMessageRelease={held:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),thread:window.__phoneMessageThread()};',
  ' window.goToStage("cuddly");key("ArrowDown");await sleep(100);key("ArrowLeft");await sleep(780);report.steps.cinemaLeft={room:window.currentStageName,source:window.__cinemaRoomState(),target:window.__princeState(),nav:window.__lowerRoomNavigationState(),focus:document.activeElement.classList.contains("hunt-viewport")};',
  ' key("ArrowRight");await sleep(100);key("ArrowRight");await sleep(1500);report.steps.queuedRight={room:window.currentStageName,target:window.__bedroomRoomState(),nav:window.__lowerRoomNavigationState()};',
  ' key("ArrowLeft");await sleep(780);key("ArrowLeft");await sleep(780);',
  ' key("ArrowRight");await sleep(780);key("ArrowRight");await sleep(780);report.steps.cinemaRight={room:window.currentStageName,source:window.__cinemaRoomState(),target:window.__bedroomRoomState(),nav:window.__lowerRoomNavigationState(),focus:document.activeElement.classList.contains("hunt-viewport")};',
  ' key("ArrowLeft");await sleep(780);key("ArrowLeft");await sleep(780);var cinemaDot=document.querySelectorAll(".hunt-dot")[0];cinemaDot.focus();click(cinemaDot);await sleep(780);report.steps.cinemaDot={room:window.currentStageName,source:window.__cinemaRoomState(),target:window.__bathroomRoomState(),nav:window.__lowerRoomNavigationState(),focus:document.activeElement===cinemaDot};',
  ' key("ArrowRight");await sleep(780);key("ArrowLeft");await sleep(780);report.steps.princeLeft={room:window.currentStageName,source:window.__princeState(),target:window.__bathroomRoomState(),focus:document.activeElement.classList.contains("hunt-viewport")};',
  ' key("ArrowRight");await sleep(780);key("ArrowRight");await sleep(780);report.steps.princeRight={room:window.currentStageName,source:window.__princeState(),target:window.__cinemaRoomState(),focus:document.activeElement.classList.contains("hunt-viewport")};',
  ' var princeDot=document.querySelectorAll(".hunt-dot")[4];princeDot.focus();click(princeDot);await sleep(780);report.steps.princeDot={room:window.currentStageName,source:window.__princeState(),target:window.__entranceRoomState(),focus:document.activeElement===princeDot};',
  ' report.steps.channelWas=channel;',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html cinema room:");
var result = lib.runPageSync("rsvp.html", HARNESS, 40000, {
  patchRaf: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.open && s.open.state.open && !s.open.state.playing && s.open.room === "cuddly" &&
  s.open.channel === s.channelWas && s.open.covered && !s.open.hidden && s.open.viewport,
  "the projector ticket opens a covered subroom without changing room or channel state", s.open);
check(s.firstProjector && s.firstProjector.state.open && s.firstProjector.state.powered &&
  !s.firstProjector.state.playing && !s.firstProjector.frame && !s.firstProjector.chooser && !s.firstProjector.off,
  "Cinema's first arrival wakes the projector and reveals its chooser", s.firstProjector);
check(s.onExit && !s.onExit.state.open && s.onExit.state.powered &&
  !s.onExit.cooling && s.onExit.poweredClass && s.onExit.animation !== "cinema-projector-cooldown",
  "leaving Cinema preserves its powered projector without a cooldown flash", s.onExit);
check(s.screenClickOn && s.screenClickOn.powered && !s.screenClickOn.playing,
  "clicking the dark screen wakes the projector without starting a film", s.screenClickOn);
check(s.projectorControls && s.projectorControls.clickOn.powered &&
  !s.projectorControls.manualOff.powered &&
  s.projectorControls.spacePlay.powered && s.projectorControls.spacePlay.playing &&
  s.projectorControls.spacePlay.video === "1096537359" &&
  s.projectorControls.enterPlay.powered && s.projectorControls.enterPlay.playing &&
  s.projectorControls.enterPlay.video === "1096537359" &&
  s.projectorControls.restored.powered && !s.projectorControls.restored.playing,
  "Space and Enter play the selected film once the projector is on", s.projectorControls);
check(s.escapeFilm && s.escapeFilm.state.open && s.escapeFilm.state.powered &&
  !s.escapeFilm.state.playing && !s.escapeFilm.frame && !s.escapeFilm.chooser &&
  s.escapeProjector && s.escapeProjector.state.open && !s.escapeProjector.state.powered &&
  s.escapeProjector.off && s.escapeIdle && s.escapeIdle.open && !s.escapeIdle.powered,
  "Escape returns a film to the chooser, then powers off the projector without leaving Cinema",
  { film: s.escapeFilm, projector: s.escapeProjector, idle: s.escapeIdle });
check(s.remotes && !s.remotes.off.powered && s.remotes.on.powered &&
  s.remotes.next.chooserIndex === 1 && s.remotes.play.video === "927763091" &&
  s.remotes.back.powered && !s.remotes.back.video && !s.remotes.chooser &&
  s.remotes.current.filter(Boolean).length === 1 && s.remotes.current[1] &&
  s.remotes.controls.every(function(row){return /^cinema-remote-/.test(row[0]) && row[1] === "pointer";}) &&
  s.remotes.hits.power[2] >= 32 && s.remotes.hits.power[3] >= 32 &&
  s.remotes.hits.ring[2] >= 32 && s.remotes.hits.ring[3] >= 32 &&
  s.remotes.hits.ok[2] >= 32 && s.remotes.hits.ok[3] >= 32 &&
  s.remotes.hits.projector[0] + s.remotes.hits.projector[2] <= s.remotes.hits.power[0] &&
  s.remotes.tactile.every(Boolean) &&
  s.remotes.padBefore && !s.remotes.vava,
  "the Google-style remote controls power while the padded VAVA ring selects and returns from a film",
  s.remotes);
check(s.open && s.open.before >= 1 && s.open.hum === true,
  "entering the cinema starts its room-local projector hum", s.open);
check(s.open && s.open.geometry &&
  s.open.geometry.cinema.every(function(value,index){return Math.abs(value-s.open.geometry.viewport[index])<0.7;}) &&
  s.open.geometry.cuddlyBottom <= s.open.geometry.viewport[1] + s.open.geometry.viewport[3] * 0.05,
  "cinema entry completes the downward pan while preserving the Cuddly stage above", s.open && s.open.geometry);
check(s.open && s.open.geometry && s.open.geometry.floor &&
  s.open.geometry.floor.mark === "›" && s.open.geometry.floor.up &&
  !s.open.geometry.floor.aria && !s.open.geometry.floor.title &&
  s.open.geometry.floor.gap >= 6,
  "Cinema uses the shared Up control beside the room dots", s.open && s.open.geometry.floor);
check(s.open && s.open.roster.every(function(value){return value==="hidden";}),
  "Who's here controls and panel are hidden while cinema owns the viewport", s.open && s.open.roster);
check(s.occupants && s.occupants.before && !s.occupants.irene && !s.occupants.robin &&
  !s.occupants.navid && !s.occupants.visitors && !s.occupants.kids && !s.occupants.forcedVisit,
  "Cuddly cameos and game groups clear and stay gated while Cinema owns the room", s.occupants);
check(s.cinemaDay && !s.cinemaDay.night && /184, 212, 232/.test(s.cinemaDay.fill) &&
  s.cinemaNight && s.cinemaNight.night && /32, 42, 52/.test(s.cinemaNight.fill),
  "the cinema window follows the loft from daylight blue to night", {day:s.cinemaDay,night:s.cinemaNight});
check(s.cinemaWindowToggle && s.cinemaWindowToggle.clickedNight && s.cinemaWindowToggle.clickedDay,
  "successive window clicks toggle cinema day and night", s.cinemaWindowToggle);
check(s.cs && s.cs.lang === "cs" && s.cs.title === "Na co se podíváme?",
  "the visible cinema chooser switches to Czech", s.cs);
check(s.props && s.props.ids.length === 19 &&
  ["cinema-beam-left","cinema-beam-right","cinema-bike","cinema-bike-marketa","cinema-camera-left","cinema-camera-right",
   "cinema-cushion-wine","cinema-cushion-blue","cinema-table","cinema-weights","cinema-sofa-seat",
   "cinema-sofa-cushion-left","cinema-sofa-cushion-right"].every(function(id){return s.props.reactions[id] === 1;}) &&
  s.props.tabs.every(function(tab){ return tab === null; }) && s.props.tabStops === 0 &&
  s.props.poufs.inCinema && !s.props.poufs.inOffice && s.props.poufs.tabindex === "-1",
  "every Cinema prop reacts while the relocated nesting poufs stay out of the tab order", s.props);
check(s.props && s.props.weights &&
  s.props.weights.silhouette === "M93 268H140M100 260V276M106 257V279M127 257V279M133 260V276" &&
  s.props.weights.shadePaths === 5 && s.props.weights.pointer === "none" &&
  s.props.weights.hit.join("|") === "88|250|57|35",
  "the dumbbell keeps its original silhouette and hit box while its five shading strokes stay inert",
  s.props && s.props.weights);
check(s.props && !s.props.cameraCluster && !s.props.cameraCase && s.props.cameraFlashes === 2 &&
  s.props.cameraLeftOnly[0] && !s.props.cameraLeftOnly[1] &&
  !s.props.cameraRightOnly[0] && s.props.cameraRightOnly[1],
  "each visible Cinema camera owns its own shutter reaction and the stray case is gone", s.props);
check(s.props && s.props.leftProjection.state.photobooth && s.props.leftProjection.state.powered &&
  s.props.leftProjection.parent === "cinema-photobooth-surface" &&
  !s.props.leftProjection.monitorInCinema && !s.props.leftProjection.frame &&
  s.props.leftProjection.remoteBack === false && s.props.leftProjection.tabs === 0 &&
  s.props.rightProjection.state.photobooth &&
  s.props.rightProjection.parent === "cinema-photobooth-surface" &&
  s.props.restored,
  "either camera projects the real Photobooth content without monitor chrome or new tab stops, and the remote restores the chooser", s.props);
check(s.props && s.props.models.join("|") === "blackmagic-pocket|canon-5d-mark-iv" &&
  s.props.details.blackmagic && s.props.details.canon && s.props.details.vava && s.props.details.slot,
  "the props identify the caged Blackmagic, Canon 5D Mark IV, and VAVA lens-slot projector", s.props);
check(s.neon && s.neon.count === 1 && s.neon.inCinema && !s.neon.inOffice && s.neon.relighting &&
  s.neon.box[3] < s.neon.bike[1] &&
  Math.min(s.neon.box[2], s.neon.bike[2]) > Math.max(s.neon.box[0], s.neon.bike[0]),
  "the single rainbow-butterfly neon hangs above the Cinema bicycle and keeps its relight interaction", s.neon);
check(s.open && s.open.ticket[0] > s.open.screen[2] + 20,
  "the quiet cinema ticket sits on the brickwork beside, not on, the projector", s.open);
check(s.open && s.open.posters.length === 3 &&
  s.open.posters.every(function (poster) { var box=poster.box,img=poster.image,first=s.open.posters[0].box;return Math.abs(box[1]-first[1])<0.6 && Math.abs(box[2]-first[2])<0.6 && Math.abs(box[3]-first[3])<0.6 && poster.fit==="cover" && Math.abs(img[0]-box[0]-1)<0.6 && Math.abs(img[1]-box[1]-1)<0.6 && Math.abs(img[2]-box[2]+2)<0.6 && Math.abs(img[3]-box[3]+2)<0.6; }) &&
  Math.abs((s.open.posters[1].box[0]-s.open.posters[0].box[0])-(s.open.posters[2].box[0]-s.open.posters[1].box[0]))<0.6,
  "three equal poster cards form one balanced row", s.open && s.open.posters);
check(s.open && s.open.posters.every(function(p){return p.video && p.src===p.poster && /^art\/cinema-(identity|mania|water)\.png$/.test(p.src);}),
  "the original posters retain exact video and artwork hooks", s.open && s.open.posters);
check(s.play && s.play.state.playing && s.play.state.video === "1096537359" &&
  /player\.vimeo\.com\/video\/1096537359/.test(s.play.src || "") && /dnt=1/.test(s.play.src || "") &&
  /autoplay/.test(s.play.allow || "") && /fullscreen/.test(s.play.allow || "") && s.play.duck === 0.06 &&
  s.play.audioDuck.active && s.play.ray > 0 && s.play.chooser,
  "choosing a film creates the privacy-conscious Vimeo player, projection ray, and whole-loft duck", s.play);
check(s.play && s.play.chooserDisplay === "none" && s.play.geometry &&
   s.play.geometry.frame.every(function (value, index) { return Math.abs(value - s.play.geometry.wrap[index]) < 0.6; }) &&
   Math.abs(s.play.geometry.frame[0] - s.play.geometry.shellOuter[0]) < 0.6 &&
   Math.abs(s.play.geometry.frame[1] - s.play.geometry.shellOuter[1]) < 0.6 &&
   Math.abs(s.play.geometry.frame[0] + s.play.geometry.frame[2] - s.play.geometry.shellOuter[2]) < 0.6 &&
   Math.abs(s.play.geometry.frame[1] + s.play.geometry.frame[3] - s.play.geometry.shellOuter[3]) < 0.6,
   "the Vimeo iframe reaches all four calibrated screen edges without a CSS matte", s.play && s.play.geometry);
check(s.play && s.play.geometry &&
   s.play.geometry.bezel[0] <= s.play.geometry.shellOuter[0] &&
   s.play.geometry.bezel[1] <= s.play.geometry.shellOuter[1] &&
   s.play.geometry.bezel[2] >= s.play.geometry.shellOuter[2] &&
   s.play.geometry.bezel[3] >= s.play.geometry.shellOuter[3] &&
   s.play.geometry.shellOuter[1] - s.play.geometry.bezel[1] < 3 &&
   s.play.geometry.bezel[3] - s.play.geometry.shellOuter[3] < 3 &&
   Math.abs((s.play.geometry.shellOuter[0] - s.play.geometry.bezel[0]) -
     ((s.play.geometry.shellOuter[3] - s.play.geometry.shellOuter[1]) -
      (s.play.geometry.shellOuter[2] - s.play.geometry.shellOuter[0]) * 9 / 16) / 2) < 1 &&
   Math.abs((s.play.geometry.bezel[2] - s.play.geometry.shellOuter[2]) -
     ((s.play.geometry.shellOuter[3] - s.play.geometry.shellOuter[1]) -
      (s.play.geometry.shellOuter[2] - s.play.geometry.shellOuter[0]) * 9 / 16) / 2) < 1,
   "the side bezel matches Vimeo's 16:9 top/bottom band for a uniform visible frame", s.play && s.play.geometry);
check(s.sideTransport && !s.sideTransport.pause.state.playing && !s.sideTransport.pause.duck.active &&
  s.sideTransport.play.state.playing && s.sideTransport.play.duck.active &&
  s.sideTransport.next.playing && s.sideTransport.next.video === "927763091",
  "the shared side Play/Pause and Next controls hand off to the active cinema projector", s.sideTransport);
check(s.vimeoControls && s.vimeoControls.ready &&
  s.vimeoControls.commands.some(function(command){return command.method === "pause";}) &&
  s.vimeoControls.commands.some(function(command){return command.method === "play";}) &&
  s.vimeoControls.commands.some(function(command){return command.method === "setVolume" && command.value === s.vimeoControls.changedMapped;}) &&
  s.vimeoControls.commands.some(function(command){return command.method === "setVolume" && command.value === s.vimeoControls.oldMapped;}) &&
  s.vimeoControls.commands.some(function(command){return command.method === "getEnded";}),
  "the ready player receives real-protocol Play, Pause, volume-sync, and completion-status commands",
  s.vimeoControls);
check(s.vimeoControls && s.vimeoControls.mapped[0] === 0 && s.vimeoControls.mapped[3] === 1 &&
  Math.abs(s.vimeoControls.mapped[1] - .35) < .015 &&
  Math.abs(s.vimeoControls.mapped[2] - .55) < .015 &&
  s.vimeoControls.curve.every(function(value,index,curve){return index === 0 || value > curve[index - 1];}),
  "Cinema's perceptual volume curve preserves mute/unity and smoothly lifts quiet site levels",
  s.vimeoControls && s.vimeoControls.mapped);
check(s.vimeoForged && s.vimeoForged.state.playing && s.vimeoForged.state.video === "927763091" &&
  s.vimeoForged.frame && s.vimeoForged.chooser,
  "a Vimeo-looking completion message from any window cannot tear down the active film",
  s.vimeoForged);
check(s.vimeoEnded && s.vimeoEnded.state.open && s.vimeoEnded.state.powered &&
  s.vimeoEnded.before && s.vimeoEnded.before.video === "927763091" &&
  s.vimeoEnded.commands.some(function(command){return command.method === "getEnded";}) &&
  !s.vimeoEnded.state.playing && !s.vimeoEnded.state.video && !s.vimeoEnded.frame &&
  s.vimeoEnded.chooser && !s.vimeoEnded.duck.active && s.vimeoEnded.focused && s.vimeoEnded.dismiss,
  "a true status reply after seek-near-end tears down Vimeo even without a terminal event",
  s.vimeoEnded);
check(s.sprinklerShort && s.sprinklerShort.state.shorted && !s.sprinklerShort.state.playing &&
  !s.sprinklerShort.frame && !s.sprinklerShort.duck.active && s.sprinklerShort.spraying &&
  s.sprinklerReboot && s.sprinklerReboot.state.powered && !s.sprinklerReboot.state.shorted &&
  !s.sprinklerReboot.state.playing && !s.sprinklerReboot.chooser && s.sprinklerReboot.off,
  "the sprinkler tears down an active film, restores the loft mix, and reboots to the chooser", {short:s.sprinklerShort,reboot:s.sprinklerReboot});
check(s.sprinklerShort && s.sprinklerShort.overlay &&
  s.sprinklerShort.overlay.parent === "cinema-room" &&
  s.sprinklerShort.overlay.after && Number(s.sprinklerShort.overlay.z) > 0 &&
  s.sprinklerShort.overlay.hardware && s.sprinklerShort.overlay.hit &&
  s.sprinklerShort.overlay.pointer !== "none",
  "the sprinkler hardware, hit target, and spray sit in front of the projector screen rim",
  s.sprinklerShort && s.sprinklerShort.overlay);
check(s.sprinklerReboot && s.sprinklerReboot.caption === "The projector survived. The warranty did not.",
  "the sprinkler reboot gets its warranty gag", s.sprinklerReboot);
check(s.sprinklerRemoteLock && s.sprinklerRemoteLock.shorted && !s.sprinklerRemoteLock.powered &&
  !s.sprinklerRemoteLock.video && s.sprinklerReboot && s.sprinklerReboot.before.powered &&
  !s.sprinklerReboot.before.shorted &&
  s.sprinklerReboot.state.chooserIndex === (s.sprinklerReboot.before.chooserIndex + 1) % 3,
  "remote presses cannot bypass a sprinkler short and resume chooser navigation after reboot",
  {locked:s.sprinklerRemoteLock,reboot:s.sprinklerReboot});
check(s.back && s.back.state.open && !s.back.state.playing && !s.back.frame && !s.back.chooser,
  "returning to the chooser removes the cross-origin player", s.back);
check(s.navigate && !s.navigate.state.open && !s.navigate.state.playing && s.navigate.room === "office" &&
  s.navigate.frame && s.navigate.state.powered && s.navigate.state.video === "1096537359" &&
  s.navigate.channel === s.channelWas,
  "ordinary room navigation pauses and preserves the cinema player", s.navigate);
check(s.fastClose && !s.fastClose.open && s.fastClose.song,
  "closing after film teardown preserves the loft song's own playback state", s.fastClose);
check(s.remoteResume && s.remoteResume.state.powered && !s.remoteResume.state.playing &&
  s.remoteResume.state.video === "1096537359" && s.remoteResume.state.chooserIndex === 0 &&
  s.remoteResume.current === 1,
  "reopening Cinema restores the visible paused player", s.remoteResume);
check(s.fastClose && s.fastClose.hidden && !s.fastClose.viewport &&
  s.fastClose.roster.every(function(value){return value==="visible";}),
  "the upward return finishes hidden and restores the open Who's here surface", s.fastClose);
check(s.cuddlyInteractive && !s.cuddlyInteractive.open && s.cuddlyMouse && !s.cuddlyMouse.open &&
  s.cuddlyTouch && !s.cuddlyTouch.open,
  "Cuddly props and bare background no longer open cinema", {interactive:s.cuddlyInteractive,mouse:s.cuddlyMouse,touch:s.cuddlyTouch});
check(s.gardenInteractive && !s.gardenInteractive.basement && s.gardenMouse && !s.gardenMouse.basement &&
  s.gardenTouch && !s.gardenTouch.basement && s.gardenReturn && !s.gardenReturn.open,
  "Garden props and bare background no longer open the dungeon", {interactive:s.gardenInteractive,mouse:s.gardenMouse,touch:s.gardenTouch,returned:s.gardenReturn});
check(s.verticalElsewhere && s.verticalElsewhere.toggles === 1 &&
  s.verticalElsewhere.steps.join(",") === "1,-1" &&
  !s.verticalElsewhere.cinema.open && !s.verticalElsewhere.prince.open && !s.verticalElsewhere.bathroom.open,
  "plain vertical arrows are inert elsewhere, D remains day/night, and Shift+vertical keeps time stepping", s.verticalElsewhere);
check(s.kitchenDown && s.kitchenDown.open && s.kitchenUp && !s.kitchenUp.open &&
  s.cuddlyDown && s.cuddlyDown.open && s.cuddlyUp && !s.cuddlyUp.open &&
  s.gardenDown && s.gardenDown.basement && s.gardenUp && !s.gardenUp.open && s.gardenUp.parked,
  "plain Down enters each available lower room and plain Up returns upstairs", {kitchenDown:s.kitchenDown,kitchenUp:s.kitchenUp,cuddlyDown:s.cuddlyDown,cuddlyUp:s.cuddlyUp,gardenDown:s.gardenDown,gardenUp:s.gardenUp});
check(s.cinemaMessageHold && s.cinemaMessageHold.held.messages.indexOf("cue_mail") !== -1 &&
  !s.cinemaMessageHold.badge && !s.cinemaMessageHold.coach && !s.cinemaMessageHold.thumb &&
  s.cinemaMessageHold.thread.indexOf("cue_mail") !== -1 &&
  s.cinemaMessageRelease && !s.cinemaMessageRelease.held.messages.length &&
  s.cinemaMessageRelease.badge && s.cinemaMessageRelease.thumb,
  "cinema queues an arriving message invisibly and surfaces it after the upward return", {held:s.cinemaMessageHold,released:s.cinemaMessageRelease});
check(s.princeMessageHold && s.princeMessageHold.held.messages.indexOf("cue_calendar") !== -1 &&
  !s.princeMessageHold.badge && !s.princeMessageHold.coach && !s.princeMessageHold.thumb &&
  s.princeMessageHold.thread.indexOf("cue_calendar") !== -1 &&
  s.princeMessageRelease && !s.princeMessageRelease.held.messages.length &&
  s.princeMessageRelease.badge && s.princeMessageRelease.thumb,
  "Prince basement queues an arriving message invisibly and surfaces it upstairs", {held:s.princeMessageHold,released:s.princeMessageRelease});
check(s.cinemaLeft && s.cinemaLeft.room === "garden" && !s.cinemaLeft.source.open &&
  s.cinemaLeft.target.basement && !s.cinemaLeft.nav.active && s.cinemaLeft.focus &&
  s.cinemaRight && s.cinemaRight.room === "office" && !s.cinemaRight.source.open &&
  s.cinemaRight.target.open && !s.cinemaRight.nav.active && s.cinemaRight.focus,
  "cinema Left/Right pan laterally to the adjacent lower rooms", {left:s.cinemaLeft,right:s.cinemaRight});
check(s.queuedRight && s.queuedRight.room === "office" && s.queuedRight.target.open &&
  !s.queuedRight.nav.active,
  "an arrow pressed during a lower-floor pan is queued and reaches the next room", s.queuedRight);
check(s.cinemaDot && s.cinemaDot.room === "kitchen" && !s.cinemaDot.source.open &&
  s.cinemaDot.target.open && !s.cinemaDot.nav.active && s.cinemaDot.focus,
  "a room dot stays downstairs and pans to its selected room", s.cinemaDot);
check(s.princeLeft && s.princeLeft.room === "kitchen" && !s.princeLeft.source.open &&
  s.princeLeft.source.parked && s.princeLeft.target && s.princeLeft.target.open && s.princeLeft.focus &&
  s.princeRight && s.princeRight.room === "cuddly" && !s.princeRight.source.open &&
  s.princeRight.source.parked && s.princeRight.target.open && s.princeRight.focus,
  "the dungeon pans laterally to Bathroom or Cinema without returning upstairs", {left:s.princeLeft,right:s.princeRight});
check(s.princeDot && s.princeDot.room === "balcony" && !s.princeDot.source.open &&
  s.princeDot.source.parked && s.princeDot.target.open && s.princeDot.focus,
  "a room dot pans from the dungeon to its selected lower room", s.princeDot);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
["1096537359", "902708480", "927763091"].forEach(function (id) {
  check(new RegExp('data-vimeo-id="' + id + '"').test(source), "chooser includes Vimeo " + id);
});
check(!/930085724/.test(source), "the retired fourth film is absent");
check((source.match(/data-poster="art\/cinema-(?:identity|mania|water)\.png"/g) || []).length === 3,
  "all three chooser cards expose their original artwork through the poster hook");
check((source.match(/data-vimeo-hash=""/g) || []).length === 3,
  "all three chooser cards expose the unlisted-video hash hook");
check(/\["play", "pause", "ended", "timeupdate"\]\.forEach/.test(source) &&
  /event\.source !== frame\.contentWindow/.test(source) && /tellVimeo\("getEnded"\)/.test(source) &&
  /tellVimeo\("setVolume", currentCinemaVolume\(\)\)/.test(source) &&
  /siteLevel \/ \(\.2 \+ 1\.67 \* siteLevel - \.87 \* siteLevel \* siteLevel\)/.test(source),
  "the Cinema scopes Vimeo events, polls true completion, and follows the shared volume");
check(/id="cinema-brick" width="60" height="32"[\s\S]*?M0 1H60M0 16H60M0 31H60[\s\S]*?M30 0V16M0 16V32M60 16V32/.test(source),
  "cinema brickwork uses the established 60×32 loft running bond");
var chaseRosterMatch = source.match(/var butterflies = (\[[^\n]+\])\s*\n\s*\.map/);
var chaseRoster = chaseRosterMatch ? JSON.parse(chaseRosterMatch[1]) : [];
check(chaseRoster.join("|") === "office-stainedglass|office-mondrian|office-abstract-butterfly",
  "Butterfly Chase has exactly the three remaining Office artworks", chaseRoster);

console.log("");
if (failures) { console.log(failures + " cinema-room assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Cinema-room assertions passed.");
