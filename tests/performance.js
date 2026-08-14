#!/usr/bin/env node
// Focused scene-performance contracts: parked SVG state, party animation pausing,
// direct multi-room pans, and device-zoom ownership of the shared strip transform.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function parking(){return window.__stageParkingState?window.__stageParkingState():[];}',
  'function visibleRooms(){return parking().filter(function(x){return !x.parked;}).map(function(x){return x.room;});}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' var garden=document.getElementById("stage-garden");garden.classList.add("perf-state-probe");garden.style.setProperty("--perf-state","kept");',
  ' var initialParking=parking();S("initial",{visible:visibleRooms(),gardenVisibility:getComputedStyle(garden).visibility,state:garden.classList.contains("perf-state-probe")&&garden.style.getPropertyValue("--perf-state")==="kept",paused:initialParking.reduce(function(n,x){return n+x.paused_css_animations;},0),currentPaused:(initialParking.filter(function(x){return x.room==="kitchen";})[0]||{}).paused_css_animations||0});',
  ' window.__secondRound=true;if(window.__refreshStageAnimationParking)window.__refreshStageAnimationParking();await sleep(80);S("phase2",{paused:parking().reduce(function(n,x){return n+x.paused_css_animations;},0)});',
  ' window.__goToStage("balcony");S("crossing",{visible:visibleRooms()});await sleep(920);S("balcony",{visible:visibleRooms(),state:garden.classList.contains("perf-state-probe")&&garden.style.getPropertyValue("--perf-state")==="kept"});',
  ' window.__goToStage("office");await sleep(920);var mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");if(window.__monitorZoomIn)window.__monitorZoomIn();await sleep(40);S("zoomed",{zoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed"),origin:document.getElementById("loft-game-strip").style.transformOrigin});var screenBox=document.getElementById("monitor-zoom-box").getBoundingClientRect(),bezel=document.getElementById("office-monitor-bezel"),bezelBox=bezel.getBoundingClientRect(),bx=(bezelBox.left+bezelBox.right)/2,by=(bezelBox.top+screenBox.top)/2,monitorClickSounds=0,oldMonitorClickSound=window.__playLaptopClickSound;window.__playLaptopClickSound=function(id){if(id==="office-monitor")monitorClickSounds++;else return oldMonitorClickSound.apply(this,arguments);};var bezelPointerPrevented=!bezel.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"mouse",pointerId:31,button:0,clientX:bx,clientY:by}));var bezelClickPrevented=!bezel.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,clientX:bx,clientY:by}));await sleep(340);window.__playLaptopClickSound=oldMonitorClickSound;S("bezel_unzoom",{zoomed:window.__monitorZoomed&&window.__monitorZoomed(),deviceZoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed"),pointerPrevented:bezelPointerPrevented,clickPrevented:bezelClickPrevented,monitorClickSounds:monitorClickSounds});',
  ' window.__goToStage("kitchen");var strip=document.getElementById("loft-game-strip");S("zoom_handoff",{zoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed"),origin:strip.style.transformOrigin,transform:strip.style.transform});await sleep(920);S("settled",{visible:visibleRooms(),monitorSaver:window.__monitorSaverLoopRunning&&window.__monitorSaverLoopRunning(),laptopSaver:window.__laptopSaverLoopRunning&&window.__laptopSaverLoopRunning(),eq:window.__monitorEqLoopRunning&&window.__monitorEqLoopRunning(),headphones:window.__headphoneBeatLoopRunning&&window.__headphoneBeatLoopRunning()});',
  ' window.__goToStage("garden");document.getElementById("garden-guitar").dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(80);S("instrument_garden",window.__instrumentVisualLoopState());',
  ' window.__goToStage("office");await sleep(80);S("instrument_parked",window.__instrumentVisualLoopState());',
  ' window.__goToStage("garden");await sleep(80);S("instrument_return",window.__instrumentVisualLoopState());document.getElementById("guitar-song-audio").pause();',
  ' window.__loftControllers.trip("shrooms");await sleep(80);S("bloom_garden",window.__tripBloomLoopRunning());window.__goToStage("office");await sleep(80);S("bloom_parked",window.__tripBloomLoopRunning());window.__goToStage("garden");await sleep(80);S("bloom_return",window.__tripBloomLoopRunning());',
  '}',
  '})();</script>'
].join("\n");

var AUDIT_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function infiniteCss(a){try{return typeof a.animationName==="string"&&a.effect&&a.effect.getTiming().iterations===Infinity;}catch(e){return false;}}',
  'function targetHidden(a){var n=a&&a.effect&&a.effect.target;while(n&&n.nodeType===1){var c=getComputedStyle(n);if(c.display==="none"||c.visibility==="hidden"||Number(c.opacity)===0)return true;n=n.parentElement;}return false;}',
  'function roomRunning(name){var stage=document.getElementById("stage-"+name);var all=(document.getAnimations?document.getAnimations():stage.getAnimations({subtree:true})).filter(function(a){var t=a&&a.effect&&a.effect.target;return infiniteCss(a)&&a.playState==="running"&&t&&stage.contains(t);});var hidden=all.filter(targetHidden).length;return{running:all.length,hidden:hidden,visible:all.length-hidden};}',
  'function layerRunning(el){if(!el)return{running:0,hidden:0,visible:0};var all=el.getAnimations({subtree:true}).filter(function(a){return infiniteCss(a)&&a.playState==="running";});var hidden=all.filter(targetHidden).length;return{running:all.length,hidden:hidden,visible:all.length-hidden};}',
  'function channelState(id){var root=document.getElementById("cuddly-"+id);var all=root.getAnimations({subtree:true}).filter(infiniteCss);return{running:all.filter(function(a){return a.playState==="running";}).length,paused:all.filter(function(a){return a.playState==="paused";}).length};}',
  'function animationFor(el){return el.getAnimations().filter(infiniteCss)[0]||null;}',
  'function animationsIn(el){return el.getAnimations({subtree:true}).filter(infiniteCss);}',
  'function countState(el,state){return animationsIn(el).filter(function(a){return a.playState===state;}).length;}',
  'function timeOf(a){return a&&typeof a.currentTime==="number"?a.currentTime:null;}',
  'function parkedState(room){return (window.__stageParkingState()||[]).filter(function(x){return x.room===room;})[0]||{};}',
  'function ambientCount(stage){return stage.getAnimations({subtree:true}).filter(infiniteCss).length;}',
  'function inactiveSeasonRunning(stage){return stage.getAnimations({subtree:true}).filter(function(a){var t=a&&a.effect&&a.effect.target;var root=t&&t.closest&&t.closest(".sn-holiday,.sn-spooky,.sn-autumn,.sn-spring,.sn-valentines,.sn-bonfire,.sn-carodejnice,.sn-chaharshanbe,.sn-pride,.sn-nowruz,.sn-canada,.sn-sizdah,.sn-toque,.sn-rehydration,.sn-martin,.sn-svatojanska,.sn-fire-couple,.sn-sadeh,.sn-mehregan");return infiniteCss(a)&&a.playState==="running"&&root&&getComputedStyle(root).display==="none";}).length;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("audit harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' var office=document.getElementById("stage-office");var parkedVisible=[].slice.call(office.querySelectorAll("*")).filter(function(el){return getComputedStyle(el).visibility==="visible";}).length;S("parked_descendants",{visible:parkedVisible,total:office.querySelectorAll("*").length});',
  ' window.__goToStage("cuddly");await sleep(920);var channels={};["aqua","stars","workout","totoro"].forEach(function(id){channels[id]=channelState(id);});S("cuddly_channels",channels);',
  ' window.__goToStage("garden");await sleep(920);window.__applySeason("autumn",true);await sleep(120);var leaf=document.querySelector(".sn-fallen-leaf"),active=animationFor(leaf);if(active)active.currentTime=1234;var activePhase=timeOf(active),activeState=active&&active.playState;window.__applySeason("summer",true);await sleep(120);var paused=animationFor(leaf)||active,pausedPhase=timeOf(paused),pausedState=paused&&paused.playState;await sleep(160);var heldPhase=timeOf(paused);window.__applySeason("autumn",true);await sleep(120);var resumed=animationFor(leaf)||paused;S("season_phase",{activeState:activeState,activePhase:activePhase,pausedState:pausedState,pausedPhase:pausedPhase,heldPhase:heldPhase,resumedState:resumed&&resumed.playState,resumedPhase:timeOf(resumed),samePaused:paused===active,sameResumed:resumed===active});window.__applySeason("summer",true);',
  ' window.__goToStage("office");await sleep(920);S("office_running",roomRunning("office"));S("office_inactive_season_running",inactiveSeasonRunning(office));S("office_unparked",{stage:getComputedStyle(office).visibility,monitor:getComputedStyle(document.getElementById("office-monitor")).visibility});',
  ' window.__goToStage("balcony");await sleep(920);var balcony=document.getElementById("stage-balcony");S("balcony_running",roomRunning("balcony"));S("balcony_inactive_season_running",inactiveSeasonRunning(balcony));',
  ' window.__goToStage("garden");await sleep(920);window.__mousesVisiting=false;if(window.__syncMousesVisitingClass)window.__syncMousesVisitingClass();window.loft.garden.set(true);if(window.__summonGuests)window.__summonGuests();await sleep(500);window.__goToStage("office");await sleep(920);var garden=document.getElementById("stage-garden"),guestLayer=document.getElementById("garden-guests"),ids=(window.__partyDances||[]).map(function(d){return d.id;}).filter(function(id){return id!=="tango";});guestLayer.classList.add("guests-in");for(var warm=0;warm<ids.length;warm++){window.__setPartyDance(ids[warm]);await sleep(40);}await sleep(160);var start=parkedState("garden").paused_css_animations||0,startActive=ambientCount(garden);for(var i=0;i<30;i++){window.__setPartyDance(ids[i%ids.length]);await sleep(60);}await sleep(160);var end=parkedState("garden").paused_css_animations||0,endActive=ambientCount(garden);S("garden_held_growth",{start:start,startActive:startActive,end:end,endActive:endActive,growth:end-start,staleExcess:Math.max(0,end-endActive)});window.__goToStage("garden");await sleep(1400);var stable=roomRunning("garden"),guestStable=layerRunning(guestLayer),parking=window.__hiddenGardenAnimationParkingState(),melt=document.getElementById("trip-melt-dancers");melt.classList.add("crowd-clear");await sleep(80);var meltAnimation=animationFor(melt.querySelector(".md-d1 .md-sway")),meltHeld=timeOf(meltAnimation),meltPaused=meltAnimation&&meltAnimation.playState;await sleep(120);var meltStill=timeOf(meltAnimation);melt.classList.remove("crowd-clear");await sleep(120);var meltNow=animationFor(melt.querySelector(".md-d1 .md-sway")),meltResumed=meltNow&&meltNow.playState,meltAdvanced=timeOf(meltNow);melt.classList.add("crowd-clear");await sleep(80);var mouse=guestLayer.querySelector(".g-elisabeth");["off-with-kids","off-at-games","off-asleep","off-at-bbq"].forEach(function(c){mouse.classList.remove(c);});if(window.__refreshHiddenGardenAnimationParking)window.__refreshHiddenGardenAnimationParking();await sleep(80);S("garden_hidden_parking",{stable:stable,guestStable:guestStable,parking:parking,meltClass:melt.getAttribute("class"),meltPaused:meltPaused,meltHeld:meltHeld,meltStill:meltStill,meltResumed:meltResumed,meltAdvanced:meltAdvanced,meltSame:meltAnimation===meltNow,mouseVisiting:guestLayer.classList.contains("mouses-visiting"),mouseDisplay:getComputedStyle(mouse).display,hiddenMeltPaused:countState(melt,"paused"),hiddenMouseRunning:countState(mouse,"running"),hiddenMousePaused:countState(mouse,"paused")});',
  '}',
  '})();</script>'
].join("\n");

var FRAME_HEALTH_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("frame-health harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){window.__goToStage("office");await sleep(920);var strip=document.getElementById("loft-game-strip"),mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");function transitions(){return strip.getAnimations().filter(function(a){return typeof a.transitionProperty==="string"&&a.transitionProperty==="transform"&&a.playState==="running";}).length;}function infiniteStars(el){return el.getAnimations({subtree:true}).filter(function(a){return a.playState==="running"&&a.effect&&a.effect.getTiming().iterations===Infinity;}).length;}var balcony=document.getElementById("stage-balcony"),stars=document.getElementById("balcony-stars");balcony.classList.add("dusk");var healthyStars=infiniteStars(stars);var first=window.__frameHealthFeed(40),second=window.__frameHealthFeed(40);var slowStars=infiniteStars(stars),slowSky=window.__constellationStepState();window.__monitorZoomIn();var slowTransitions=transitions();var slowState=window.__frameHealthState();window.__monitorZoomOut();window.__frameHealthFeed(60);window.__frameHealthFeed(60);var recovering=window.__frameHealthState();window.__frameHealthFeed(60);var recovered=window.__frameHealthState();var recoveredStars=infiniteStars(stars),recoveredSky=window.__constellationStepState();window.__monitorZoomIn();var healthyTransitions=transitions();window.__monitorZoomOut();window.__goToStage("garden");await sleep(920);window.loft.garden.set(true);await sleep(80);var pool=document.querySelector("#garden-disco-pools .disco-pool");var healthyPoolAnimations=pool.getAnimations().filter(function(a){return a.playState==="running";}).length;window.__frameHealthFeed(40);window.__frameHealthFeed(40);await sleep(20);var slowPool={animations:pool.getAnimations().filter(function(a){return a.playState==="running";}).length,inlineTransform:pool.style.transform};window.__frameHealthFeed(60);window.__frameHealthFeed(60);window.__frameHealthFeed(60);await sleep(20);var partyHeldPool={animations:pool.getAnimations().filter(function(a){return a.playState==="running";}).length,inlineTransform:pool.style.transform,health:window.__frameHealthState()};strip.classList.remove("party-on");window.__frameHealthFeed(60);await sleep(20);var recoveredPool={animations:pool.getAnimations().filter(function(a){return a.playState==="running";}).length,inlineTransform:pool.style.transform};report.steps.health={first:first,second:second,slowState:slowState,slowTransitions:slowTransitions,recovering:recovering,recovered:recovered,healthyTransitions:healthyTransitions,zoomed:window.__monitorZoomed(),healthyStars:healthyStars,slowStars:slowStars,slowSky:slowSky,recoveredStars:recoveredStars,recoveredSky:recoveredSky,healthyPoolAnimations:healthyPoolAnimations,slowPool:slowPool,partyHeldPool:partyHeldPool,recoveredPool:recoveredPool};}',
  '})();</script>'
].join("\n");

var PARTY_HEALTH_RECOVERY_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[]};',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  'window.__goToStage("garden");window.loft.garden.set(true);',
  'var spin=document.getElementById("garden-disco-overlay-spin"),pool=document.querySelector("#garden-disco-pools .disco-pool");',
  'window.__frameHealthFeed(40);window.__frameHealthFeed(40);',
  'report.entered={health:window.__frameHealthState(),spin:getComputedStyle(spin).animationTimingFunction,pools:pool.getAnimations().length};',
  'for(var i=0;i<5;i++)window.__frameHealthFeed(49);',
  'report.held={health:window.__frameHealthState(),spin:getComputedStyle(spin).animationTimingFunction,pools:pool.getAnimations().length};',
  'window.__frameHealthFeed(49);',
  'report.recovered={health:window.__frameHealthState(),spin:getComputedStyle(spin).animationTimingFunction,pools:pool.getAnimations().length};',
  'window.__frameHealthFeed(40);window.__frameHealthFeed(40);',
  'report.reentered={health:window.__frameHealthState(),spin:getComputedStyle(spin).animationTimingFunction,pools:pool.getAnimations().length};',
  '}catch(e){report.errors.push(String(e&&e.stack||e));}',
  'report.errors=report.errors.concat(window.__errs||[]);document.getElementById("__report").textContent=JSON.stringify(report);',
  '},250);});})();</script>'
].join("\n");

var RESUME_HEALTH_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[]};',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  'window.__frameHealthFeed(30);window.__frameHealthFeed(30);report.poisoned=window.__frameHealthState();',
  'window.__frameHealthBeginGameplay();report.continued=window.__frameHealthState();',
  'window.__frameHealthFeed(60);report.firstVisible=window.__frameHealthState();',
  '}catch(e){report.errors.push(String(e&&e.stack||e));}',
  'report.errors=report.errors.concat(window.__errs||[]);document.getElementById("__report").textContent=JSON.stringify(report);',
  '},250);});})();</script>'
].join("\n");

var CANVAS_QUALITY_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("canvas-quality harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'function box(w,h){return{left:0,top:0,right:w,bottom:h,width:w,height:h,x:0,y:0,toJSON:function(){return this;}};}',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'async function saver(mon,kind){if(mon.classList.contains("show-saver"))window.__wakeMonitorSaver();mon.classList.add("show-caps");window.__startMonitorSaver(kind);await sleep(100);return window.__monitorSaverCanvasState(kind);}',
  'async function run(){window.__goToStage("office");var mon=document.getElementById("office-monitor"),julia=document.getElementById("monitor-saver-fractal"),pipes=document.getElementById("monitor-saver-pipes"),flower=document.getElementById("monitor-saver-flower"),credits=document.getElementById("monitor-credits-fire");mon.classList.add("here","screen-on","show-caps");[julia,pipes,flower].forEach(function(img){img.getBoundingClientRect=function(){return box(1240,420);};});credits.getBoundingClientRect=function(){return box(690,450);};report.steps.base={health:window.__frameHealthState(),julia:await saver(mon,"julia"),pipes:await saver(mon,"pipes"),flower:await saver(mon,"flower"),fire:window.__fireCanvasState()};window.__frameHealthFeed(60);window.__frameHealthFeed(60);window.__frameHealthFeed(60);var highHealth=window.__frameHealthState(),realHigh=window.__frameHealthHigh;window.__frameHealthHigh=function(){return true;};window.dispatchEvent(new CustomEvent("framehealthchange",{detail:highHealth}));report.steps.high={health:highHealth,julia:await saver(mon,"julia"),pipes:await saver(mon,"pipes"),flower:await saver(mon,"flower")};window.__openMonitorCredits();report.steps.high.fire=window.__fireCanvasState();window.__frameHealthFeed(45);var dropHealth=window.__frameHealthState();window.__frameHealthHigh=function(){return false;};window.dispatchEvent(new CustomEvent("framehealthchange",{detail:dropHealth}));var fireDrop=window.__fireCanvasState();window.__closeMonitorCredits();report.steps.drop={health:dropHealth,julia:await saver(mon,"julia"),pipes:await saver(mon,"pipes"),flower:await saver(mon,"flower"),fire:fireDrop};window.__frameHealthHigh=realHigh;}',
  '})();</script>'
].join("\n");

var LOW_AMBIENCE_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){window.addEventListener("load",function(){setTimeout(function(){',
  'var strip=document.getElementById("loft-game-strip"),garden=document.getElementById("stage-garden"),uv=document.getElementById("garden-uv-pulse");',
  'strip.classList.add("uv-mode");garden.classList.add("garden-party");garden.setAttribute("data-partydance","techno");',
  'var healthy=getComputedStyle(uv);var before={duration:healthy.animationDuration,timing:healthy.animationTimingFunction};',
  'window.__frameHealthFeed(40);window.__frameHealthFeed(40);var slow=getComputedStyle(uv);',
  'document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,before:before,slow:{duration:slow.animationDuration,timing:slow.animationTimingFunction,running:uv.getAnimations().filter(function(a){return a.playState==="running";}).length}});',
  '},250);});})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html scene performance:");
var r = lib.runPageSync("rsvp.html", HARNESS, 6000, { patchRaf: true, forceMotion: true, chromeFlags: "--autoplay-policy=no-user-gesture-required" });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.initial.visible.join("|") === "kitchen" && s.initial.gardenVisibility === "hidden", "only the current room paints at rest", s.initial);
check(s.initial.state && s.initial.paused > 0 && s.initial.currentPaused === 0, "hidden rooms preserve SVG state and pause their CSS timelines from the opening frame", s.initial);
check(s.phase2.paused > 0, "phase two keeps parked CSS timelines paused", s.phase2);
check(s.crossing.visible.join("|") === "kitchen|garden|cuddly|office|balcony", "a direct kitchen-to-balcony pan keeps every traversed room visible", s.crossing);
check(s.balcony.visible.join("|") === "balcony" && s.balcony.state, "the settled pan reparks other rooms without resetting their state", s.balcony);
check(s.zoomed.zoomed && !!s.zoomed.origin, "monitor zoom owns the strip before room navigation", s.zoomed);
check(!s.bezel_unzoom.zoomed && !s.bezel_unzoom.deviceZoomed && s.bezel_unzoom.pointerPrevented && s.bezel_unzoom.clickPrevented && s.bezel_unzoom.monitorClickSounds === 0, "clicking non-interactive monitor chrome exits zoom without reaching the generic monitor click", s.bezel_unzoom);
check(!s.zoom_handoff.zoomed && !s.zoom_handoff.origin && s.zoom_handoff.transform === "translateX(0%)", "room navigation collapses zoom before taking over the strip transform", s.zoom_handoff);
check(s.settled.visible.join("|") === "kitchen" && !s.settled.monitorSaver && !s.settled.laptopSaver && !s.settled.eq && !s.settled.headphones, "office-only visual loops are stopped off-room", s.settled);
check(s.instrument_garden.notes && s.instrument_garden.strings === 1, "garden instrument visuals run beside their playing instrument", s.instrument_garden);
check(!s.instrument_parked.notes && s.instrument_parked.strings === 0, "garden instrument timers and rAF stop in a parked room", s.instrument_parked);
check(s.instrument_return.notes && s.instrument_return.strings === 1, "garden instrument visuals resume from live audio state on return", s.instrument_return);
check(s.bloom_garden && !s.bloom_parked && s.bloom_return, "garden trip fractals pause off-room and resume without rebuilding", { garden: s.bloom_garden, parked: s.bloom_parked, returned: s.bloom_return });

var audit = lib.runPageSync("rsvp.html", AUDIT_HARNESS, 14000, { patchRaf: true, forceMotion: true, seedRandom: true, chromeFlags: "--autoplay-policy=no-user-gesture-required" });
if (!audit) { console.log("  ✗ audit harness produced no report"); process.exit(1); }
var a = audit.steps;
check(audit.errors.length === 0, "numeric performance probes complete without page errors", audit.errors);
check(a.parked_descendants.visible === 0, "parked room descendants cannot opt back into visibility", a.parked_descendants);
check(Object.keys(a.cuddly_channels).every(function (id) { return a.cuddly_channels[id].running === 0 && a.cuddly_channels[id].paused > 0; }), "every inactive Cuddly channel freezes its CSS timelines", a.cuddly_channels);
check(a.season_phase.activeState === "running" && a.season_phase.pausedState === "paused" && a.season_phase.resumedState === "running" && a.season_phase.samePaused && a.season_phase.sameResumed && a.season_phase.pausedPhase >= a.season_phase.activePhase - 2 && Math.abs(a.season_phase.heldPhase - a.season_phase.pausedPhase) < 2 && Math.abs(a.season_phase.resumedPhase - a.season_phase.pausedPhase) < 2, "seasonal timelines freeze and resume at the held phase", a.season_phase);
check(a.office_inactive_season_running === 0 && a.balcony_inactive_season_running === 0, "inactive seasonal surfaces never run in active rooms", { office: a.office_inactive_season_running, balcony: a.balcony_inactive_season_running });
check(a.office_unparked.stage === "visible" && a.office_unparked.monitor === "visible", "unparking restores normal descendant visibility", a.office_unparked);
check(a.garden_held_growth.end <= a.garden_held_growth.endActive, "parked animation references stay bounded by live garden timelines after 30 dance changes", a.garden_held_growth);
check(a.garden_hidden_parking.stable.running <= 140 && a.garden_hidden_parking.guestStable.running <= 90 && a.garden_hidden_parking.parking.held >= 20, "a stable full party keeps the garden and named-guest animation workload bounded", a.garden_hidden_parking);
check(a.garden_hidden_parking.meltPaused === "paused" && a.garden_hidden_parking.meltStill === a.garden_hidden_parking.meltHeld && a.garden_hidden_parking.meltResumed === "running" && a.garden_hidden_parking.meltSame && a.garden_hidden_parking.meltAdvanced >= a.garden_hidden_parking.meltHeld, "the faded generic crowd holds and resumes its original animation phase", a.garden_hidden_parking);
check(!a.garden_hidden_parking.mouseVisiting && a.garden_hidden_parking.mouseDisplay === "none" && a.garden_hidden_parking.hiddenMouseRunning === 0, "a non-visiting child runs no hidden animation workload", a.garden_hidden_parking);
console.log("  metrics: " + JSON.stringify({ cuddly: a.cuddly_channels, seasonPhase: a.season_phase, gardenHeld: a.garden_held_growth, gardenHidden: a.garden_hidden_parking, officeRunning: a.office_running, balconyRunning: a.balcony_running, parkedVisibleDescendants: a.parked_descendants.visible }));

var health = lib.runPageSync("rsvp.html", FRAME_HEALTH_HARNESS, 2500, { patchRaf: true, forceMotion: true, seedRandom: true });
if (!health) { console.log("  ✗ frame-health harness produced no report"); process.exit(1); }
var h = health.steps.health;
check(health.errors.length === 0 && h.slowTransitions === 0 && h.healthyTransitions === 0, "device zoom never runs the whole-strip transform transition", h);
check(!h.first.slow && h.second.slow && h.slowState.slow && h.recovering.slow && !h.recovered.slow, "frame-health mode enters and recovers with asymmetric hysteresis", h);
check(h.slowStars === 0 && h.slowSky.running && h.recoveredStars > 0 && !h.recoveredSky.running, "constellations step once per second only in low-FPS mode", h);
check(h.healthyPoolAnimations > 0 && h.slowPool.animations === 0 && !!h.slowPool.inlineTransform && h.partyHeldPool.animations === 0 && h.partyHeldPool.health.slow && h.recoveredPool.animations > 0 && !h.recoveredPool.inlineTransform, "party spotlights keep their conservative three-window hold, then recover after Party-off", h);
console.log("  frame-health metric: " + JSON.stringify(h));

var partyRecovery = lib.runPageSync("rsvp.html", PARTY_HEALTH_RECOVERY_HARNESS, 1400, { patchRaf: true, forceMotion: true, seedRandom: true });
check(partyRecovery && partyRecovery.errors.length === 0 && partyRecovery.entered.health.slow &&
  /^steps\(30/.test(partyRecovery.entered.spin) && partyRecovery.entered.pools === 0 &&
  partyRecovery.held.health.slow && partyRecovery.held.health.recoverWindows === 5 &&
  !partyRecovery.recovered.health.slow && !partyRecovery.recovered.health.high &&
  partyRecovery.recovered.spin === "linear" && partyRecovery.recovered.pools > 0 &&
  partyRecovery.reentered.health.slow && /^steps\(30/.test(partyRecovery.reentered.spin) &&
  partyRecovery.reentered.pools === 0,
  "Party retries full effects after six 49-fps windows and quickly falls back again if they overload the device", partyRecovery);

var resumeHealth = lib.runPageSync("rsvp.html", RESUME_HEALTH_HARNESS, 1400, { patchRaf: true, forceMotion: true, seedRandom: true });
check(resumeHealth && resumeHealth.errors.length === 0 && resumeHealth.poisoned.slow &&
  !resumeHealth.continued.slow && resumeHealth.continued.fps === null &&
  resumeHealth.continued.lowWindows === 0 && resumeHealth.continued.recoverWindows === 0 &&
  !resumeHealth.firstVisible.slow && resumeHealth.firstVisible.fps === 60 &&
  resumeHealth.firstVisible.recoverWindows === 1,
  "Continue discards covered restore samples and starts adaptive health from visible gameplay", resumeHealth);

var quality = lib.runPageSync("rsvp.html", CANVAS_QUALITY_HARNESS, 1800, { patchRaf: true, forceMotion: true, seedRandom: true });
var q = quality && quality.steps;
check(quality && quality.errors.length === 0, "adaptive canvas probe completes without page errors", quality && quality.errors);
check(q && !q.base.health.high &&
  ["julia", "pipes", "flower"].every(function (kind) { return q.base[kind].width === 496 && q.base[kind].height === 168; }) &&
  q.base.fire.width === 276 && q.base.fire.height === 180,
  "all monitor savers and Credits fire stay at their existing baselines before sustained health", q && q.base);
check(q && q.high.health.high &&
  ["julia", "pipes", "flower"].every(function (kind) { return q.high[kind].width === 620 && q.high[kind].height === 210; }) &&
  q.high.fire.width === 345 && q.high.fire.height === 225,
  "three healthy FPS windows raise all four canvases to the half-device-pixel cap", q && q.high);
check(q && ["julia", "pipes", "flower"].every(function (kind) {
  return q.high[kind].width <= q.high[kind].consumerWidth * q.high[kind].dpr * 0.5 &&
    q.high[kind].height <= q.high[kind].consumerHeight * q.high[kind].dpr * 0.5;
}) &&
  q.high.fire.width <= q.high.fire.consumerWidth * q.high.fire.dpr * 0.5 &&
  q.high.fire.height <= q.high.fire.consumerHeight * q.high.fire.dpr * 0.5,
  "high tiers never exceed half their rendered containers' physical pixels", q && q.high);
check(q && !q.drop.health.high &&
  ["julia", "pipes", "flower"].every(function (kind) { return q.drop[kind].width === 496 && q.drop[kind].height === 168; }) &&
  q.drop.fire.width === 276 && q.drop.fire.height === 180,
  "one non-healthy sample immediately restores every baseline canvas", q && q.drop);

var lowAmbience = lib.runPageSync("rsvp.html", LOW_AMBIENCE_HARNESS, 1200, { patchRaf: true, forceMotion: true });
check(lowAmbience && lowAmbience.errors.length === 0 && lowAmbience.before.duration === "0.85s" &&
  lowAmbience.slow.duration === "4s" && /^steps\(4/.test(lowAmbience.slow.timing) && lowAmbience.slow.running === 1,
  "low-FPS party wash remains alive as a slow four-step lighting cue", lowAmbience);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
