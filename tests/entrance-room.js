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
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__markLowerRoomDiscovered();',
  ' var room=document.getElementById("entrance-room"),art=document.getElementById("entrance-room-art"),viewport=document.querySelector(".hunt-viewport"),strip=document.getElementById("loft-game-strip"),roster=document.querySelector(".roster-panel"),toggle=document.querySelector(".roster-toggle"),backdrop=document.querySelector(".roster-backdrop");room.style.transition="none";viewport.style.transition="none";strip.style.transition="none";var probeBadge=surface("msg-badge show entrance-probe"),probeCoach=surface("msg-badge-coach show entrance-probe"),probeThumb=surface("msg-thumb show entrance-probe"),probeCall=surface("call-ring show entrance-probe");',
  ' if(window.__setDayNight)window.__setDayNight(false);if(window.__setWildfireSmoke)window.__setWildfireSmoke(1);window.goToStage("balcony");await sleep(40);',
  ' dblclick(document.getElementById("balcony-wall"));await sleep(30);report.steps.interactive=state();dblclick(document.getElementById("stage-balcony"));await sleep(50);report.steps.stageBackground=state();',
  ' var bg=document.getElementById("balcony-background"),bb=bg.getBoundingClientRect(),bare=null;for(var gy=1;gy<10&&!bare;gy++)for(var gx=1;gx<20;gx++){var px=bb.left+bb.width*gx/20,py=bb.top+bb.height*gy/10;if(document.elementFromPoint(px,py)===bg){bare={x:px,y:py};break;}}if(bare)bg.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true,clientX:bare.x,clientY:bare.y}));await sleep(50);report.steps.background=state();key("ArrowDown");await sleep(780);roster.classList.add("show");backdrop.classList.add("show");var rr=room.getBoundingClientRect(),vr=viewport.getBoundingClientRect(),sr=strip.getBoundingClientRect(),smoke=document.querySelector("#entrance-room .entrance-smoke-tint");smoke.style.transition="none";',
  ' var closeStyles=["bathroom-room-close","cinema-room-close","prince-basement-close","entrance-room-close"].map(function(id){var style=getComputedStyle(document.getElementById(id));return [parseFloat(style.width),parseFloat(style.height),parseFloat(style.right),parseFloat(style.top)];});var homeUv=document.getElementById("entrance-home-uv");homeUv.style.transition="none";report.steps.uv={off:parseFloat(getComputedStyle(homeUv).opacity),window:homeUv.parentNode.id};window.__setUvMode(true);report.steps.uv.on=parseFloat(getComputedStyle(homeUv).opacity);window.__setUvMode(false);report.steps.uv.after=parseFloat(getComputedStyle(homeUv).opacity);',
  ' report.steps.open={state:state(),room:window.currentStageName,bare:bare,covered:window.__roomAmbienceCovered(),viewport:viewport.classList.contains("entrance-room-open"),smoke:[room.style.getPropertyValue("--smoke"),parseFloat(getComputedStyle(smoke).opacity)],geometry:{entrance:[rr.left,rr.top,rr.width,rr.height],viewport:[vr.left,vr.top,vr.width,vr.height],strip:[sr.left,sr.top,sr.width,sr.height],transform:getComputedStyle(strip).transform,controls:closeStyles},roster:[getComputedStyle(toggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(backdrop).visibility],messages:[getComputedStyle(probeBadge).visibility,getComputedStyle(probeCoach).visibility,getComputedStyle(probeThumb).visibility,getComputedStyle(probeCall).visibility],label:room.getAttribute("aria-label")};',
  ' var snowFlakes=document.querySelector("#entrance-room .entrance-snow-flakes");snowFlakes.style.transition="none";function seasonArt(){return ["entrance-tree-summer","entrance-tree-autumn","entrance-tree-spring","entrance-tree-winter-snow","entrance-autumn-foreground","entrance-tree-natural-branches","entrance-tree-branches","entrance-snowbank","entrance-architectural-snow"].map(function(id){return getComputedStyle(document.getElementById(id)).display;});}report.steps.seasons={};for(var seasonName of ["summer","autumn","winter","stedry","spring"]){window.__applySeasonSilent(seasonName);await sleep(25);report.steps.seasons[seasonName]={art:seasonArt(),classes:strip.getAttribute("class")||"",room:room.getAttribute("class")||""};}report.steps.cutoff={};window.date("2027-03-31");await sleep(25);report.steps.cutoff.mar31={art:seasonArt(),room:room.getAttribute("class")||""};window.date("2027-04-01");await sleep(25);report.steps.cutoff.apr1={art:seasonArt(),room:room.getAttribute("class")||""};window.__setBalconySnow(true,"ui");await sleep(25);report.steps.cutoff.apr1snow={art:seasonArt(),room:room.getAttribute("class")||"",flakes:parseFloat(getComputedStyle(snowFlakes).opacity)};window.__setBalconySnow(false,"ui");window.__calResetToday();await sleep(25);',
  ' var windowsBefore=state().windows.map(function(row){return row.on;});key("Enter");await sleep(30);var cueDuring=state();await sleep(850);report.steps.enterCue={during:cueDuring,after:state(),before:windowsBefore};',
  ' var props=Array.from(document.querySelectorAll("#entrance-room .entrance-prop")),intercom=document.getElementById("entrance-intercom");click(intercom);await sleep(30);var intercomReply={state:state(),caption:window.__captionKey()};props.filter(function(prop){return prop!==intercom;}).forEach(function(prop,index){if(index===1)elkey(prop,"Enter");else if(index===2)elkey(prop," ");else click(prop);});await sleep(30);report.steps.props={ids:props.map(function(prop){return prop.id;}),state:state(),caption:window.__captionKey(),intercomReply:intercomReply,roles:props.map(function(prop){return [prop.getAttribute("role"),prop.getAttribute("tabindex"),prop.getAttribute("aria-label"),prop.getAttribute("title")];})};',
  ' var car=document.getElementById("entrance-porsche"),carControls=Array.from(document.querySelectorAll("#entrance-room .entrance-car-control"));car.querySelectorAll("*").forEach(function(el){el.style.transition="none";});var glint=document.getElementById("entrance-porsche-glint"),running=document.querySelector(".entrance-porsche-running-light"),headOn=document.querySelector(".entrance-porsche-headlight-on"),tailOn=document.querySelector(".entrance-porsche-taillight-on");var carBubbles=0;function carBubble(){carBubbles++;}art.addEventListener("click",carBubble);report.steps.carInitial={state:state().car,glint:parseFloat(getComputedStyle(glint).opacity),roles:carControls.map(function(control){return [control.id,control.getAttribute("role"),control.getAttribute("tabindex"),control.getAttribute("aria-pressed"),control.getAttribute("aria-disabled"),control.getAttribute("aria-label"),control.getAttribute("title")];})};click(document.getElementById("entrance-porsche-headlight"));click(document.getElementById("entrance-porsche-taillight"));report.steps.carDayLamps=state().car;["roof","door","frunk","trunk","engine"].forEach(function(action){click(document.getElementById("entrance-porsche-"+action));});await sleep(30);report.steps.carOpen={state:state().car,classes:car.getAttribute("class")||"",running:parseFloat(getComputedStyle(running).opacity)};click(document.getElementById("entrance-porsche-engine"));await sleep(30);report.steps.carStopped={state:state().car,running:parseFloat(getComputedStyle(running).opacity)};',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return false;},configurable:true});var repliesBefore=state().intercomResponses;click(intercom);await sleep(30);report.steps.intercomGate={before:repliesBefore,after:state().intercomResponses};Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' document.getElementById("stage-balcony").classList.add("dusk");await sleep(20);var nightBefore=state();click(document.getElementById("entrance-porsche-headlight"));click(document.getElementById("entrance-porsche-taillight"));await sleep(30);report.steps.night={state:state(),before:nightBefore,smoke:parseFloat(getComputedStyle(smoke).opacity),lamps:[parseFloat(getComputedStyle(headOn).opacity),parseFloat(getComputedStyle(tailOn).opacity)]};["roof","door","frunk","trunk"].forEach(function(action){click(document.getElementById("entrance-porsche-"+action));});art.removeEventListener("click",carBubble);report.steps.carClosed={state:state().car,bubbles:carBubbles};document.getElementById("stage-balcony").classList.remove("dusk");await sleep(20);',
  ' setLang("cs");report.steps.cs={label:room.getAttribute("aria-label"),close:document.getElementById("entrance-room-close").getAttribute("aria-label"),props:props.map(function(prop){return [prop.getAttribute("aria-label"),prop.getAttribute("title")];}),car:carControls.map(function(control){return [control.getAttribute("aria-label"),control.getAttribute("title")];})};setLang("en");',
  ' key("ArrowUp");await sleep(30);report.steps.up=state();key("ArrowDown");await sleep(50);key("Escape");await sleep(30);report.steps.escape=state();key("ArrowDown");await sleep(50);key("Backspace");await sleep(30);report.steps.backspace=state();',
  ' window.goToStage("balcony");touchup(document.getElementById("balcony-background"));await sleep(20);touchup(document.getElementById("balcony-background"));await sleep(50);report.steps.touch=state();key("ArrowDown");await sleep(50);',
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
check(s.open && s.open.geometry && s.open.geometry.controls &&
  s.open.geometry.controls.slice(1).every(function(control){
    return control.every(function(value,index){return Math.abs(value-s.open.geometry.controls[0][index])<0.7;});
  }),
  "Bathroom, Cinema, Prince, and Entrance share one close-control geometry",
  s.open && s.open.geometry && s.open.geometry.controls);
check(s.open && s.open.label === "The Lofts entrance" &&
  s.cs && s.cs.label === "Vstup do The Lofts" && s.cs.close === "Zpět na balkon",
  "dialog and return labels switch between English and Czech", {en:s.open&&s.open.label,cs:s.cs});
check(s.props && s.props.ids.length === 11 &&
  s.props.ids.every(function(id){return s.props.state.reactions[id] === 1;}) &&
  s.props.roles.every(function(row){return row[0] === "button" && row[1] === null && row[2] && row[3];}),
  "every distinct facade prop reacts with accessible copy while staying outside the Tab order",
  s.props);
check(s.carInitial && !s.carInitial.state.roofOpen && !s.carInitial.state.doorOpen &&
  !s.carInitial.state.frunkOpen && !s.carInitial.state.trunkOpen && !s.carInitial.state.engineOn &&
  !s.carInitial.state.headlightOn && !s.carInitial.state.taillightOn && s.carInitial.glint > .5 &&
  s.carInitial.roles.length === 7 && s.carInitial.roles.every(function(row){
    return row[1] === "button" && row[2] === "-1" && row[3] === "false" && row[5] && row[6];
  }),
  "the daytime Boxster starts roof-up, closed and off with a restrained glint and seven untabbable buttons",
  s.carInitial);
check(s.carDayLamps && !s.carDayLamps.headlightOn && !s.carDayLamps.taillightOn &&
  !s.carDayLamps.activations.headlight && !s.carDayLamps.activations.taillight,
  "daytime lamp selections stay inert", s.carDayLamps);
check(s.carOpen && s.carOpen.state.roofOpen && s.carOpen.state.doorOpen &&
  s.carOpen.state.frunkOpen && s.carOpen.state.trunkOpen && s.carOpen.state.engineOn &&
  /roof-open/.test(s.carOpen.classes) && /door-open/.test(s.carOpen.classes) &&
  /frunk-open/.test(s.carOpen.classes) && /trunk-open/.test(s.carOpen.classes) &&
  /engine-on/.test(s.carOpen.classes) && s.carOpen.running > .9,
  "roof, driver door, frunk, trunk, and engine toggle independently and engine-on lights the runners",
  s.carOpen);
check(s.carStopped && !s.carStopped.state.engineOn && s.carStopped.running === 0 &&
  s.carStopped.state.activations.engine === 2 && s.carStopped.state.roofOpen &&
  s.carStopped.state.doorOpen && s.carStopped.state.frunkOpen && s.carStopped.state.trunkOpen,
  "stopping the engine clears only its persistent state and running lights", s.carStopped);
check(s.props && s.props.intercomReply && s.props.intercomReply.state.intercomResponses === 1 &&
  s.props.intercomReply.caption === "entrance_intercom_reply" &&
  s.intercomGate && s.intercomGate.before === 1 && s.intercomGate.after === 1,
  "the intercom answers an attended buzz but stays silent after focus leaves the room",
  {reply:s.props&&s.props.intercomReply,gate:s.intercomGate});
check(s.open && !s.open.state.night && s.open.state.windows.every(function(row){return !row.on;}) &&
  s.props && s.props.state.windows.every(function(row){return row.on;}) &&
  s.props.state.windowsFlipped && s.props.caption === "entrance_windows_all_on",
  "day starts with every window dark and rewards independently switching all five on",
  {open:s.open&&s.open.state,props:s.props});
check(s.enterCue && s.enterCue.during.windowCue && !s.enterCue.after.windowCue &&
  s.enterCue.before.every(function(on,index){return on===s.enterCue.after.windows[index].on;}),
  "bare Enter flickers every facade window without changing the light puzzle", s.enterCue);
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
  s.night.state.car.activations.headlight === 1 && s.night.state.car.activations.taillight === 1 &&
  s.night.lamps.every(function(value){return value === 1;}),
  "nightfall resets every facade window and enables independent Porsche head and tail lamps", s.night);
check(s.carClosed && !s.carClosed.state.roofOpen && !s.carClosed.state.doorOpen &&
  !s.carClosed.state.frunkOpen && !s.carClosed.state.trunkOpen && !s.carClosed.state.engineOn &&
  s.carClosed.state.headlightOn && s.carClosed.state.taillightOn && s.carClosed.bubbles === 0,
  "each car control stops propagation and closing panels leaves the independently toggled night lamps alone",
  s.carClosed);
check(s.cs && s.cs.props && s.cs.props.length === 11 &&
  s.cs.props.every(function(row){return row[0] && row[1] && row[0] === row[1];}) &&
  s.cs.car && s.cs.car.length === 7 &&
  s.cs.car.every(function(row){return row[0] && row[1] && row[0] === row[1];}),
  "all Entrance facade and car labels and tooltips switch to Czech", s.cs);
check(s.up && !s.up.open && s.escape && !s.escape.open && s.backspace && !s.backspace.open,
  "plain Up, Escape, and Backspace return upstairs", {up:s.up,escape:s.escape,backspace:s.backspace});
check(s.touch && !s.touch.open, "a bare-background touch double-tap stays upstairs", s.touch);
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
check(s.closed && s.closed.state && !s.closed.state.car.roofOpen && !s.closed.state.car.doorOpen &&
  !s.closed.state.car.frunkOpen && !s.closed.state.car.trunkOpen && !s.closed.state.car.engineOn &&
  !s.closed.state.car.headlightOn && !s.closed.state.car.taillightOn,
  "leaving Entrance returns the Boxster to its safe initial state", s.closed && s.closed.state.car);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var entrance = (source.match(/<div id="entrance-room"[\s\S]*?<\/div>\s*<div id="prince-basement"/) || [""])[0];
check(/THE LOFTS/.test(entrance) && /id="entrance-brick"/.test(entrance) &&
  /id="entrance-sidewalk"/.test(entrance) && /id="entrance-tree-branches"/.test(entrance),
  "the inline scene carries the facade's brick, stone, tree, and sidewalk identity");
check(["summer", "autumn", "spring", "winter-snow"].every(function (name) {
  return entrance.indexOf('id="entrance-tree-' + name + '"') !== -1;
}) && /id="entrance-autumn-foreground"/.test(entrance),
  "the inline tree keeps four explicit seasonal layers and an autumn foreground scatter");
var springTree = (entrance.match(/<g id="entrance-tree-spring"[\s\S]*?<g id="entrance-tree-winter-snow"/) || [""])[0];
check((springTree.match(/<ellipse /g) || []).length >= 30 && /id="entrance-tree-natural-branches"/.test(entrance),
  "spring grows clustered small leaves around the shared natural branch hierarchy");
check(entrance.indexOf('id="entrance-snowbank"') < entrance.indexOf('id="entrance-porsche"') &&
  /id="entrance-snow-cap-name" d="M266 151[^\"]+L417 154H263Z"/.test(entrance),
  "the low snowbank paints behind the Porsche and the name-stone cap stays anchored at canopy y151–154");
check((entrance.match(/class="entrance-prop"/g) || []).length === 11 &&
  (entrance.match(/role="button" tabindex="0"/g) || []).length === 0,
  "the complete Entrance interaction inventory stays outside the Tab order");
check((entrance.match(/class="entrance-car-control" role="button" tabindex="-1"/g) || []).length === 7 &&
  /id="entrance-porsche"/.test(entrance) && /id="entrance-porsche-roof-closed"/.test(entrance) &&
  /id="entrance-porsche-door-panel"/.test(entrance) && /id="entrance-porsche-frunk-panel"/.test(entrance) &&
  /id="entrance-porsche-trunk-panel"/.test(entrance) && /id="entrance-porsche-mirror"/.test(entrance),
  "the inline Boxster keeps seven partitioned controls and separate roof, door, compartment, and mirror art");
check(/function playPorscheEngineSound\(starting\)[\s\S]*?getSfxCtx\(\)[\s\S]*?createOscillator\(\)/.test(source) &&
  /function answerPorscheControl\(control, event\)[\s\S]*?event\.stopPropagation\(\)/.test(source),
  "the engine voice stays on the shared SFX path and car hits stop at their own handlers");
check(/#bathroom-room-close,#cinema-room-close,#prince-basement-close,#bedroom-room-close,#entrance-room-close\{/.test(source),
  "Entrance shares the unified lower-room corner-control geometry");
check(!/<image\b|(?:src|href)="[^"]+\.(?:png|jpe?g|webp)"/i.test(entrance) &&
  !/<text\b[^>]*>\s*[^<]*(?:\d{2,}|\b(?:street|st\.|avenue|ave\.)\b)/i.test(entrance),
  "Entrance publishes neither a reference image nor the private street numbers");

console.log("");
if (failures) { console.log(failures + " Entrance-room assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Entrance-room assertions passed.");
