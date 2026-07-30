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
  ' window.goToStage("cuddly");if(window.__setDayNight)window.__setDayNight(false);window.__cuddlyProjector.set("coffee");document.getElementById("cinema-room").style.transition="none";document.getElementById("loft-game-strip").style.transition="none";await sleep(520);',
  ' var roster=document.querySelector(".roster-panel"),rosterToggle=document.querySelector(".roster-toggle"),rosterBackdrop=document.querySelector(".roster-backdrop");roster.classList.add("show");rosterBackdrop.classList.add("show");',
  ' var channel=window.__cuddlyProjector.channel(),before=window.__activeAudioBedCount(),ticket=document.getElementById("cuddly-cinema-ticket"),ticketBox=ticket.getBoundingClientRect(),screenBox=document.getElementById("cuddly-screen-bg").getBoundingClientRect();click(ticket);await sleep(850);',
  ' var posters=Array.prototype.map.call(document.querySelectorAll(".cinema-film"),function(el){var r=el.getBoundingClientRect(),img=el.querySelector("img"),ir=img.getBoundingClientRect();return {box:[r.left,r.top,r.width,r.height],image:[ir.left,ir.top,ir.width,ir.height],fit:getComputedStyle(img).objectFit,label:el.getAttribute("aria-label"),src:img.getAttribute("src"),poster:el.dataset.poster};});',
  ' var cinemaBox=document.getElementById("cinema-room").getBoundingClientRect(),viewportBox=document.querySelector(".hunt-viewport").getBoundingClientRect(),cuddlyBox=document.getElementById("stage-cuddly").getBoundingClientRect(),cinemaCloseStyle=getComputedStyle(document.getElementById("cinema-room-close")),princeCloseStyle=getComputedStyle(document.getElementById("prince-basement-close"));',
  ' report.steps.open={state:window.__cinemaRoomState(),room:window.currentStageName,channel:window.__cuddlyProjector.channel(),covered:window.__roomAmbienceCovered(),beds:window.__activeAudioBedCount(),hidden:document.getElementById("cinema-room").hidden,viewport:document.querySelector(".hunt-viewport").classList.contains("cinema-room-open"),before:before,posters:posters,ticket:[ticketBox.left,ticketBox.top,ticketBox.right,ticketBox.bottom],screen:[screenBox.left,screenBox.top,screenBox.right,screenBox.bottom],geometry:{cinema:[cinemaBox.left,cinemaBox.top,cinemaBox.width,cinemaBox.height],viewport:[viewportBox.left,viewportBox.top,viewportBox.width,viewportBox.height],cuddlyBottom:cuddlyBox.bottom,controls:{cinema:[parseFloat(cinemaCloseStyle.width),parseFloat(cinemaCloseStyle.height),parseFloat(cinemaCloseStyle.right),parseFloat(cinemaCloseStyle.top)],prince:[parseFloat(princeCloseStyle.width),parseFloat(princeCloseStyle.height),parseFloat(princeCloseStyle.right),parseFloat(princeCloseStyle.top)]}},roster:[getComputedStyle(rosterToggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(rosterBackdrop).visibility]};',
  ' var cinemaSky=document.getElementById("cinema-window-sky"),cinemaWindow=document.getElementById("cinema-window");cinemaSky.style.transition="none";report.steps.cinemaDay={night:document.getElementById("cinema-room").classList.contains("cinema-night"),fill:getComputedStyle(cinemaSky).fill};window.__setDayNight(true);await sleep(40);report.steps.cinemaNight={night:document.getElementById("cinema-room").classList.contains("cinema-night"),fill:getComputedStyle(cinemaSky).fill};window.__setDayNight(false);await sleep(40);',
  ' click(cinemaWindow);await sleep(40);var clickedNight=document.getElementById("cinema-room").classList.contains("cinema-night");cinemaWindow.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));await sleep(40);report.steps.cinemaWindowToggle={clickedNight:clickedNight,keyedDay:!document.getElementById("cinema-room").classList.contains("cinema-night")};',
  ' setLang("cs");report.steps.cs={title:document.getElementById("cinema-room-title").textContent,close:document.getElementById("cinema-room-close").getAttribute("aria-label"),window:cinemaWindow.getAttribute("aria-label")};setLang("en");',
  ' var film=document.querySelector(".cinema-film[data-vimeo-id=\\"1096537359\\"]");click(film);await sleep(80);var frame=document.getElementById("cinema-player");',
  ' var shell=document.getElementById("cinema-screen-shell"),wrap=document.getElementById("cinema-player-wrap"),chooser=document.getElementById("cinema-chooser"),backButton=document.getElementById("cinema-chooser-back"),sr=shell.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),fr=frame&&frame.getBoundingClientRect(),br=backButton.getBoundingClientRect(),rr=document.getElementById("cinema-room").getBoundingClientRect();',
  ' report.steps.play={state:window.__cinemaRoomState(),src:frame&&frame.src,allow:frame&&frame.getAttribute("allow"),duck:window.__partyDuck,chooser:chooser.hidden,chooserDisplay:getComputedStyle(chooser).display,geometry:fr&&{frame:[fr.left,fr.top,fr.width,fr.height],wrap:[wr.left,wr.top,wr.width,wr.height],shell:[sr.left+shell.clientLeft,sr.top+shell.clientTop,shell.clientWidth,shell.clientHeight],shellOuter:[sr.left,sr.top,sr.right,sr.bottom],back:[br.left,br.top,br.right,br.bottom],room:[rr.left,rr.top,rr.right,rr.bottom]}};',
  ' click(document.getElementById("cinema-chooser-back"));await sleep(40);report.steps.back={state:window.__cinemaRoomState(),frame:!!document.getElementById("cinema-player"),chooser:document.getElementById("cinema-chooser").hidden};',
  ' click(film);await sleep(40);window.goToStage("office");await sleep(80);report.steps.navigate={state:window.__cinemaRoomState(),room:window.currentStageName,frame:!!document.getElementById("cinema-player"),channel:window.__cuddlyProjector.channel()};',
  ' window.goToStage("cuddly");window.__cuddlyProjector.set("fire");window.__playSongAt(0);await sleep(100);window.__openCinemaRoom();click(film);await sleep(40);click(document.getElementById("cinema-room-close"));await sleep(900);report.steps.fastClose={open:window.__cinemaRoomState().open,song:window.__phoneMusicPlaying(),hidden:document.getElementById("cinema-room").hidden,viewport:document.querySelector(".hunt-viewport").classList.contains("cinema-room-open"),roster:[getComputedStyle(rosterToggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(rosterBackdrop).visibility]};',
  ' dblclick(document.getElementById("cuddly-wallscreen"));await sleep(40);report.steps.cuddlyInteractive=window.__cinemaRoomState();',
  ' dblclick(document.getElementById("cuddly-wall"));await sleep(850);report.steps.cuddlyMouse=window.__cinemaRoomState();key("Escape");await sleep(760);',
  ' touchup(document.getElementById("cuddly-wall"));await sleep(30);touchup(document.getElementById("cuddly-wall"));await sleep(850);report.steps.cuddlyTouch=window.__cinemaRoomState();key("Backspace");await sleep(760);',
  ' window.goToStage("garden");await sleep(80);dblclick(document.getElementById("garden-window-pane-0"));await sleep(40);report.steps.gardenInteractive=window.__princeState();',
  ' dblclick(document.getElementById("garden-wall"));await sleep(850);report.steps.gardenMouse=window.__princeState();key("Escape");await sleep(780);',
  ' touchup(document.getElementById("garden-wall"));await sleep(30);touchup(document.getElementById("garden-wall"));await sleep(850);report.steps.gardenTouch=window.__princeState();key("Backspace");await sleep(780);report.steps.gardenReturn=window.__princeState();',
  ' window.goToStage("kitchen");var toggles=0,steps=[],oldToggle=window.__toggleDayNight,oldStep=window.__calStepTime;window.__toggleDayNight=function(){toggles++;};window.__calStepTime=function(n){steps.push(n);};key("ArrowDown");key("ArrowUp");key("d");key("ArrowUp",{shiftKey:true});key("ArrowDown",{shiftKey:true});window.__toggleDayNight=oldToggle;window.__calStepTime=oldStep;report.steps.verticalElsewhere={toggles:toggles,steps:steps,cinema:window.__cinemaRoomState(),prince:window.__princeState()};',
  ' window.goToStage("cuddly");key("ArrowDown");await sleep(850);report.steps.cuddlyDown=window.__cinemaRoomState();key("ArrowUp");await sleep(760);report.steps.cuddlyUp=window.__cinemaRoomState();',
  ' window.goToStage("garden");key("ArrowDown");await sleep(850);report.steps.gardenDown=window.__princeState();key("ArrowUp");await sleep(780);report.steps.gardenUp=window.__princeState();',
  ' window.__secondRound=true;window.goToStage("cuddly");key("ArrowDown");await sleep(850);window.__deliverPhoneMessage("cue_mail");await sleep(80);var badge=document.querySelector(".msg-badge"),coach=document.querySelector(".msg-badge-coach"),thumb=document.querySelector(".msg-thumb");report.steps.cinemaMessageHold={held:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),coach:!!coach&&coach.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),thread:window.__phoneMessageThread()};key("ArrowUp");await sleep(1600);thumb=document.querySelector(".msg-thumb");report.steps.cinemaMessageRelease={held:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),thread:window.__phoneMessageThread()};if(window.__hideMessageThumb)window.__hideMessageThumb(true);',
  ' window.goToStage("garden");key("ArrowDown");await sleep(850);window.__deliverPhoneMessage("cue_calendar");await sleep(80);report.steps.princeMessageHold={held:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),coach:!!coach&&coach.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),thread:window.__phoneMessageThread()};key("ArrowUp");await sleep(1600);thumb=document.querySelector(".msg-thumb");report.steps.princeMessageRelease={held:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),thread:window.__phoneMessageThread()};',
  ' window.goToStage("cuddly");key("ArrowDown");await sleep(100);key("ArrowLeft");await sleep(780);report.steps.cinemaLeft={room:window.currentStageName,state:window.__cinemaRoomState(),hidden:document.getElementById("cinema-room").hidden,focus:document.activeElement.classList.contains("hunt-viewport")};',
  ' window.goToStage("cuddly");key("ArrowDown");await sleep(100);key("ArrowRight");await sleep(780);report.steps.cinemaRight={room:window.currentStageName,state:window.__cinemaRoomState(),hidden:document.getElementById("cinema-room").hidden,focus:document.activeElement.classList.contains("hunt-viewport")};',
  ' window.goToStage("cuddly");key("ArrowDown");await sleep(100);var cinemaDot=document.querySelectorAll(".hunt-dot")[0];cinemaDot.focus();click(cinemaDot);await sleep(780);report.steps.cinemaDot={room:window.currentStageName,state:window.__cinemaRoomState(),hidden:document.getElementById("cinema-room").hidden,focus:document.activeElement===cinemaDot};',
  ' window.goToStage("garden");key("ArrowDown");await sleep(100);key("ArrowLeft");await sleep(780);report.steps.princeLeft={room:window.currentStageName,state:window.__princeState(),focus:document.activeElement.classList.contains("hunt-viewport")};',
  ' window.goToStage("garden");key("ArrowDown");await sleep(100);key("ArrowRight");await sleep(780);report.steps.princeRight={room:window.currentStageName,state:window.__princeState(),focus:document.activeElement.classList.contains("hunt-viewport")};',
  ' window.goToStage("garden");key("ArrowDown");await sleep(100);var princeDot=document.querySelectorAll(".hunt-dot")[4];princeDot.focus();click(princeDot);await sleep(780);report.steps.princeDot={room:window.currentStageName,state:window.__princeState(),focus:document.activeElement===princeDot};',
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
var result = lib.runPageSync("rsvp.html", HARNESS, 30000, {
  patchRaf: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.open && s.open.state.open && !s.open.state.playing && s.open.room === "cuddly" &&
  s.open.channel === s.channelWas && s.open.covered && !s.open.hidden && s.open.viewport,
  "the projector ticket opens a covered subroom without changing room or channel state", s.open);
check(s.open && s.open.before >= 1 && s.open.beds === 0,
  "entering the cinema releases the active Cuddly projector score", s.open);
check(s.open && s.open.geometry &&
  s.open.geometry.cinema.every(function(value,index){return Math.abs(value-s.open.geometry.viewport[index])<0.7;}) &&
  s.open.geometry.cuddlyBottom <= s.open.geometry.viewport[1] + s.open.geometry.viewport[3] * 0.05,
  "cinema entry completes the downward pan while preserving the Cuddly stage above", s.open && s.open.geometry);
check(s.open && s.open.geometry && s.open.geometry.controls &&
  s.open.geometry.controls.cinema.every(function(value,index){return Math.abs(value-s.open.geometry.controls.prince[index])<0.7;}) &&
  s.open.geometry.controls.cinema[2] <= 8.5 && s.open.geometry.controls.cinema[3] <= 8.5,
  "Cinema and Prince share one tightly tucked lower-room close geometry", s.open && s.open.geometry.controls);
check(s.open && s.open.roster.every(function(value){return value==="hidden";}),
  "Who's here controls and panel are hidden while cinema owns the viewport", s.open && s.open.roster);
check(s.cinemaDay && !s.cinemaDay.night && /184, 212, 232/.test(s.cinemaDay.fill) &&
  s.cinemaNight && s.cinemaNight.night && /32, 42, 52/.test(s.cinemaNight.fill),
  "the cinema window follows the loft from daylight blue to night", {day:s.cinemaDay,night:s.cinemaNight});
check(s.cinemaWindowToggle && s.cinemaWindowToggle.clickedNight && s.cinemaWindowToggle.keyedDay,
  "click and keyboard activation on the cinema window toggle day and night", s.cinemaWindowToggle);
check(s.open && s.open.ticket[0] > s.open.screen[2] + 20,
  "the quiet cinema ticket sits on the brickwork beside, not on, the projector", s.open);
check(s.open && s.open.posters.length === 3 &&
  s.open.posters.every(function (poster) { var box=poster.box,img=poster.image,first=s.open.posters[0].box;return Math.abs(box[1]-first[1])<0.6 && Math.abs(box[2]-first[2])<0.6 && Math.abs(box[3]-first[3])<0.6 && poster.fit==="cover" && Math.abs(img[0]-box[0]-1)<0.6 && Math.abs(img[1]-box[1]-1)<0.6 && Math.abs(img[2]-box[2]+2)<0.6 && Math.abs(img[3]-box[3]+2)<0.6; }) &&
  Math.abs((s.open.posters[1].box[0]-s.open.posters[0].box[0])-(s.open.posters[2].box[0]-s.open.posters[1].box[0]))<0.6,
  "three equal poster cards form one balanced row", s.open && s.open.posters);
check(s.open && s.open.posters.map(function(p){return p.label;}).join("|")==="Identity|MANIA|Water" &&
  s.open.posters.every(function(p){return p.src===p.poster && /^art\/cinema-(identity|mania|water)\.png$/.test(p.src);}),
  "the original posters carry exact accessible film titles and poster hooks", s.open && s.open.posters);
check(s.cs && s.cs.title === "Na co se podíváme?" && s.cs.close === "Zpět do Cuddly-puddly" &&
  s.cs.window === "Přepnout den a noc",
  "chooser and exit copy switch to Czech", s.cs);
check(s.play && s.play.state.playing && s.play.state.video === "1096537359" &&
  /player\.vimeo\.com\/video\/1096537359/.test(s.play.src || "") && /dnt=1/.test(s.play.src || "") &&
  /autoplay/.test(s.play.allow || "") && /fullscreen/.test(s.play.allow || "") && s.play.duck === 0.06 && s.play.chooser,
  "choosing a film creates the privacy-conscious Vimeo player and ducks the party", s.play);
check(s.play && s.play.chooserDisplay === "none" && s.play.geometry &&
   s.play.geometry.frame.every(function (value, index) { return Math.abs(value - s.play.geometry.wrap[index]) < 0.6; }) &&
   Math.abs(s.play.geometry.frame[2] - s.play.geometry.shell[2]) < 0.6 &&
   Math.abs(s.play.geometry.frame[3] - s.play.geometry.shell[3]) < 0.6,
   "the Vimeo iframe fills the screen content box exactly", s.play && s.play.geometry);
check(s.play && s.play.geometry &&
   Math.abs(s.play.geometry.back[0] - s.play.geometry.shellOuter[0]) < 1 &&
   Math.abs((s.play.geometry.back[1] + s.play.geometry.back[3]) / 2 - s.play.geometry.shellOuter[3]) < 1,
   "Choose another is attached to the projector screen's bottom-left bezel", s.play && s.play.geometry);
check(s.back && s.back.state.open && !s.back.state.playing && !s.back.frame && !s.back.chooser,
  "returning to the chooser removes the cross-origin player", s.back);
check(s.navigate && !s.navigate.state.open && !s.navigate.state.playing && s.navigate.room === "office" &&
  !s.navigate.frame && s.navigate.channel === s.channelWas,
  "ordinary room navigation tears down the cinema and preserves projector state", s.navigate);
check(s.fastClose && !s.fastClose.open && s.fastClose.song,
  "closing during the song fade still restores the borrowed loft song", s.fastClose);
check(s.fastClose && s.fastClose.hidden && !s.fastClose.viewport &&
  s.fastClose.roster.every(function(value){return value==="visible";}),
  "the upward return finishes hidden and restores the open Who's here surface", s.fastClose);
check(s.cuddlyInteractive && !s.cuddlyInteractive.open && s.cuddlyMouse && s.cuddlyMouse.open &&
  s.cuddlyTouch && s.cuddlyTouch.open,
  "only bare Cuddly background double-clicks and double-taps enter cinema", {interactive:s.cuddlyInteractive,mouse:s.cuddlyMouse,touch:s.cuddlyTouch});
check(s.gardenInteractive && !s.gardenInteractive.basement && s.gardenMouse && s.gardenMouse.basement &&
  s.gardenTouch && s.gardenTouch.basement && s.gardenReturn && !s.gardenReturn.open && s.gardenReturn.parked,
  "only bare Garden background double-clicks/double-taps descend, and Escape/Backspace return", {interactive:s.gardenInteractive,mouse:s.gardenMouse,touch:s.gardenTouch,returned:s.gardenReturn});
check(s.verticalElsewhere && s.verticalElsewhere.toggles === 1 &&
  s.verticalElsewhere.steps.join(",") === "1,-1" &&
  !s.verticalElsewhere.cinema.open && !s.verticalElsewhere.prince.open,
  "plain vertical arrows are inert elsewhere, D remains day/night, and Shift+vertical keeps time stepping", s.verticalElsewhere);
check(s.cuddlyDown && s.cuddlyDown.open && s.cuddlyUp && !s.cuddlyUp.open &&
  s.gardenDown && s.gardenDown.basement && s.gardenUp && !s.gardenUp.open && s.gardenUp.parked,
  "plain Down enters each available lower room and plain Up returns upstairs", {cuddlyDown:s.cuddlyDown,cuddlyUp:s.cuddlyUp,gardenDown:s.gardenDown,gardenUp:s.gardenUp});
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
check(s.cinemaLeft && s.cinemaLeft.room === "garden" && !s.cinemaLeft.state.open && s.cinemaLeft.hidden && s.cinemaLeft.focus &&
  s.cinemaRight && s.cinemaRight.room === "office" && !s.cinemaRight.state.open && s.cinemaRight.hidden && s.cinemaRight.focus,
  "cinema Left/Right exit to adjacent main-floor rooms with viewport focus", {left:s.cinemaLeft,right:s.cinemaRight});
check(s.cinemaDot && s.cinemaDot.room === "kitchen" && !s.cinemaDot.state.open && s.cinemaDot.hidden && s.cinemaDot.focus,
  "a room dot exits cinema directly to its selected main-floor room and retains dot focus", s.cinemaDot);
check(s.princeLeft && s.princeLeft.room === "kitchen" && !s.princeLeft.state.open && s.princeLeft.state.parked && s.princeLeft.focus &&
  s.princeRight && s.princeRight.room === "cuddly" && !s.princeRight.state.open && s.princeRight.state.parked && s.princeRight.focus,
  "Prince Left/Right exit to adjacent main-floor rooms with viewport focus", {left:s.princeLeft,right:s.princeRight});
check(s.princeDot && s.princeDot.room === "balcony" && !s.princeDot.state.open && s.princeDot.state.parked && s.princeDot.focus,
  "a room dot exits Prince directly to its selected main-floor room and retains dot focus", s.princeDot);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
["1096537359", "902708480", "927763091"].forEach(function (id) {
  check(new RegExp('data-vimeo-id="' + id + '"').test(source), "chooser includes Vimeo " + id);
});
check(!/930085724/.test(source), "the retired fourth film is absent");
check((source.match(/data-poster="art\/cinema-(?:identity|mania|water)\.png"/g) || []).length === 3,
  "all three chooser cards expose their original artwork through the poster hook");
check((source.match(/data-vimeo-hash=""/g) || []).length === 3,
  "all three chooser cards expose the unlisted-video hash hook");
check(/id="cinema-brick" width="60" height="32"[\s\S]*?M0 1H60M0 16H60M0 31H60[\s\S]*?M30 0V16M0 16V32M60 16V32/.test(source),
  "cinema brickwork uses the established 60×32 loft running bond");

console.log("");
if (failures) { console.log(failures + " cinema-room assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Cinema-room assertions passed.");
