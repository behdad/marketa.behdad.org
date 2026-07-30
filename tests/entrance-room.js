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
  'function elkey(el,name){el.dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true}));}',
  'function surface(cls){var el=document.createElement("div");el.className=cls;el.style.display="block";el.style.opacity="1";document.querySelector(".hunt-viewport").appendChild(el);return el;}',
  'function state(){return window.__entranceRoomState();}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();',
  ' var room=document.getElementById("entrance-room"),viewport=document.querySelector(".hunt-viewport"),strip=document.getElementById("loft-game-strip"),roster=document.querySelector(".roster-panel"),toggle=document.querySelector(".roster-toggle"),backdrop=document.querySelector(".roster-backdrop");room.style.transition="none";strip.style.transition="none";var probeBadge=surface("msg-badge show entrance-probe"),probeCoach=surface("msg-badge-coach show entrance-probe"),probeThumb=surface("msg-thumb show entrance-probe"),probeCall=surface("call-ring show entrance-probe");',
  ' if(window.__setDayNight)window.__setDayNight(false);window.goToStage("balcony");await sleep(40);',
  ' dblclick(document.getElementById("balcony-wall"));await sleep(30);report.steps.interactive=state();dblclick(document.getElementById("stage-balcony"));await sleep(50);report.steps.stageBackground=state();key("Escape");await sleep(760);',
  ' var bg=document.getElementById("balcony-background"),bb=bg.getBoundingClientRect(),bare=null;for(var gy=1;gy<10&&!bare;gy++)for(var gx=1;gx<20;gx++){var px=bb.left+bb.width*gx/20,py=bb.top+bb.height*gy/10;if(document.elementFromPoint(px,py)===bg){bare={x:px,y:py};break;}}if(bare)bg.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true,clientX:bare.x,clientY:bare.y}));await sleep(50);roster.classList.add("show");backdrop.classList.add("show");var rr=room.getBoundingClientRect(),vr=viewport.getBoundingClientRect(),sr=strip.getBoundingClientRect();',
  ' var closeStyles=["bathroom-room-close","cinema-room-close","prince-basement-close","entrance-room-close"].map(function(id){var style=getComputedStyle(document.getElementById(id));return [parseFloat(style.width),parseFloat(style.height),parseFloat(style.right),parseFloat(style.top)];});',
  ' report.steps.open={state:state(),room:window.currentStageName,bare:bare,covered:window.__roomAmbienceCovered(),viewport:viewport.classList.contains("entrance-room-open"),geometry:{entrance:[rr.left,rr.top,rr.width,rr.height],viewport:[vr.left,vr.top,vr.width,vr.height],strip:[sr.left,sr.top,sr.width,sr.height],transform:getComputedStyle(strip).transform,controls:closeStyles},roster:[getComputedStyle(toggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(backdrop).visibility],messages:[getComputedStyle(probeBadge).visibility,getComputedStyle(probeCoach).visibility,getComputedStyle(probeThumb).visibility,getComputedStyle(probeCall).visibility],label:room.getAttribute("aria-label")};',
  ' var props=Array.from(document.querySelectorAll("#entrance-room .entrance-prop"));props.forEach(function(prop,index){if(index===1)elkey(prop,"Enter");else if(index===2)elkey(prop," ");else click(prop);});await sleep(30);report.steps.props={ids:props.map(function(prop){return prop.id;}),state:state(),caption:window.__captionKey(),roles:props.map(function(prop){return [prop.getAttribute("role"),prop.getAttribute("tabindex"),prop.getAttribute("aria-label"),prop.getAttribute("title")];})};',
  ' document.getElementById("stage-balcony").classList.add("dusk");await sleep(20);report.steps.night=state();document.getElementById("stage-balcony").classList.remove("dusk");await sleep(20);',
  ' setLang("cs");report.steps.cs={label:room.getAttribute("aria-label"),close:document.getElementById("entrance-room-close").getAttribute("aria-label"),props:props.map(function(prop){return [prop.getAttribute("aria-label"),prop.getAttribute("title")];})};setLang("en");',
  ' key("ArrowUp");await sleep(30);report.steps.up=state();key("ArrowDown");await sleep(50);key("Escape");await sleep(30);report.steps.escape=state();key("ArrowDown");await sleep(50);key("Backspace");await sleep(30);report.steps.backspace=state();',
  ' window.goToStage("balcony");touchup(document.getElementById("balcony-background"));await sleep(20);touchup(document.getElementById("balcony-background"));await sleep(50);report.steps.touch=state();',
  ' key("ArrowLeft");await sleep(780);report.steps.left={source:state(),target:window.__bedroomRoomState(),room:window.currentStageName};window.goToStage("balcony");key("ArrowDown");await sleep(50);key("ArrowRight");await sleep(40);report.steps.right={source:state(),room:window.currentStageName};',
  ' var targetDot=document.querySelectorAll(".hunt-dot")[1];targetDot.focus();click(targetDot);await sleep(780);report.steps.dot={source:state(),target:window.__princeState(),room:window.currentStageName,focused:document.activeElement===targetDot};',
  ' window.goToStage("balcony");key("ArrowDown");await sleep(50);click(document.getElementById("hunt-prev"));await sleep(780);report.steps.prev={source:state(),target:window.__bedroomRoomState(),room:window.currentStageName};',
  ' window.goToStage("balcony");key("ArrowDown");await sleep(50);click(document.getElementById("hunt-next"));await sleep(40);report.steps.next={source:state(),room:window.currentStageName};',
  ' window.goToStage("balcony");key("ArrowDown");await sleep(50);key("1");await sleep(780);report.steps.number={source:state(),target:window.__bathroomRoomState(),room:window.currentStageName};',
  ' window.goToStage("balcony");',
  ' window.__secondRound=true;key("ArrowDown");await sleep(50);document.getElementById("entrance-doors").classList.add("reacting");window.__deliverPhoneMessage("cue_mail");await sleep(80);var badge=document.querySelector(".msg-badge:not(.entrance-probe)"),coach=document.querySelector(".msg-badge-coach:not(.entrance-probe)"),thumb=document.querySelector(".msg-thumb:not(.entrance-probe)");report.steps.held={state:state(),hold:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),coach:!!coach&&coach.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),thread:window.__phoneMessageThread()};',
  ' click(document.getElementById("entrance-room-close"));await sleep(1250);thumb=document.querySelector(".msg-thumb:not(.entrance-probe)");report.steps.closed={state:state(),covered:window.__roomAmbienceCovered(),viewport:viewport.classList.contains("entrance-room-open"),roster:[getComputedStyle(toggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(backdrop).visibility],messages:[getComputedStyle(probeBadge).visibility,getComputedStyle(probeCoach).visibility,getComputedStyle(probeThumb).visibility,getComputedStyle(probeCall).visibility],hold:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show")};',
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
var result = lib.runPageSync("rsvp.html", HARNESS, 9000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.interactive && !s.interactive.open && s.stageBackground && s.stageBackground.open &&
  s.open && s.open.bare && s.open.state.open &&
  s.open.room === "balcony" && s.open.viewport && !s.open.state.hidden,
  "any unclaimed Balcony surface opens Entrance without stealing interactive props",
  {interactive:s.interactive,stageBackground:s.stageBackground,open:s.open});
check(s.open && s.open.geometry &&
  s.open.geometry.entrance.every(function(value,index){return Math.abs(value-s.open.geometry.viewport[index])<0.7;}) &&
  s.open.geometry.strip[1] + s.open.geometry.strip[3] <= s.open.geometry.viewport[1] + 1,
  "Entrance fills the viewport while the preserved Balcony pans above it", s.open && s.open.geometry);
check(s.open && s.open.roster.every(function(value){return value==="hidden";}),
  "Who's here controls and panel are hidden below the Balcony", s.open && s.open.roster);
check(s.open && s.open.covered && s.open.messages.every(function(value){return value==="hidden";}),
  "upstairs ambience and transient message/call surfaces yield below the Balcony",
  s.open && {covered:s.open.covered,messages:s.open.messages});
check(s.open && s.open.geometry && s.open.geometry.controls &&
  s.open.geometry.controls.slice(1).every(function(control){
    return control.every(function(value,index){return Math.abs(value-s.open.geometry.controls[0][index])<0.7;});
  }),
  "Bathroom, Cinema, Prince, and Entrance share one close-control geometry",
  s.open && s.open.geometry && s.open.geometry.controls);
check(s.open && s.open.label === "The Lofts entrance" &&
  s.cs && s.cs.label === "Vstup do The Lofts" && s.cs.close === "Zpět na balkon",
  "dialog and return labels switch between English and Czech", {en:s.open&&s.open.label,cs:s.cs});
check(s.props && s.props.ids.length === 10 &&
  s.props.ids.every(function(id){return s.props.state.reactions[id] === 1;}) &&
  s.props.roles.every(function(row){return row[0] === "button" && row[1] === null && row[2] && row[3];}),
  "every distinct facade prop reacts with accessible copy while staying outside the Tab order",
  s.props);
check(s.open && !s.open.state.night && s.open.state.windows.every(function(row){return !row.on;}) &&
  s.props && s.props.state.windows.every(function(row){return row.on;}) &&
  s.props.state.windowsFlipped && s.props.caption === "entrance_windows_all_on",
  "day starts with every window dark and rewards independently switching all five on",
  {open:s.open&&s.open.state,props:s.props});
check(s.night && s.night.night && s.night.windows.every(function(row){return row.on;}) &&
  !s.night.windowsFlipped,
  "nightfall resets every facade window to its lit default", s.night);
check(s.cs && s.cs.props && s.cs.props.length === 10 &&
  s.cs.props.every(function(row){return row[0] && row[1] && row[0] === row[1];}),
  "all Entrance prop labels and tooltips switch to Czech", s.cs && s.cs.props);
check(s.up && !s.up.open && s.escape && !s.escape.open && s.backspace && !s.backspace.open,
  "plain Up, Escape, and Backspace return upstairs", {up:s.up,escape:s.escape,backspace:s.backspace});
check(s.touch && s.touch.open, "a bare-background touch double-tap enters Entrance", s.touch);
check(s.number && !s.number.source.open && s.number.target.open && s.number.room === "kitchen",
  "a number shortcut pans to the corresponding room while remaining downstairs", s.number);
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

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var entrance = (source.match(/<div id="entrance-room"[\s\S]*?<\/div>\s*<div id="prince-basement"/) || [""])[0];
check(/THE LOFTS/.test(entrance) && /id="entrance-brick"/.test(entrance) &&
  /id="entrance-sidewalk"/.test(entrance) && /A dark tree canopy/.test(entrance),
  "the inline scene carries the facade's brick, stone, canopy, and sidewalk identity");
check((entrance.match(/class="entrance-prop"/g) || []).length === 10 &&
  (entrance.match(/role="button" tabindex="0"/g) || []).length === 0,
  "the complete Entrance interaction inventory stays outside the Tab order");
check(/#bathroom-room-close,#cinema-room-close,#prince-basement-close,#bedroom-room-close,#entrance-room-close\{/.test(source),
  "Entrance shares the unified lower-room corner-control geometry");
check(!/<image\b|(?:src|href)="[^"]+\.(?:png|jpe?g|webp)"/i.test(entrance) &&
  !/<text\b[^>]*>\s*[^<]*(?:\d{2,}|\b(?:street|st\.|avenue|ave\.)\b)/i.test(entrance),
  "Entrance publishes neither a reference image nor the private street numbers");

console.log("");
if (failures) { console.log(failures + " Entrance-room assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Entrance-room assertions passed.");
