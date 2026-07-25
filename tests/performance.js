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
  ' window.goToStage("balcony");S("crossing",{visible:visibleRooms()});await sleep(920);S("balcony",{visible:visibleRooms(),state:garden.classList.contains("perf-state-probe")&&garden.style.getPropertyValue("--perf-state")==="kept"});',
  ' window.goToStage("office");await sleep(920);var mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");if(window.__monitorZoomIn)window.__monitorZoomIn();await sleep(40);S("zoomed",{zoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed"),origin:document.getElementById("loft-game-strip").style.transformOrigin});var app=document.querySelector(".dock-app"),ar=app.getBoundingClientRect(),ax=(ar.left+ar.right)/2,ay=(ar.top+ar.bottom)/2;app.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"mouse",pointerId:30,button:0,clientX:ax,clientY:ay}));S("app_keeps_zoom",{zoomed:window.__monitorZoomed&&window.__monitorZoomed(),deviceZoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed")});var screenBox=document.getElementById("office-monitor-bg").getBoundingClientRect(),bezel=document.getElementById("office-monitor-bezel"),bezelBox=bezel.getBoundingClientRect(),bx=(bezelBox.left+bezelBox.right)/2,by=(bezelBox.top+screenBox.top)/2,monitorClickSounds=0,oldMonitorClickSound=window.playLaptopClickSound;window.playLaptopClickSound=function(id){if(id==="office-monitor")monitorClickSounds++;else return oldMonitorClickSound.apply(this,arguments);};var bezelPointerPrevented=!bezel.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"mouse",pointerId:31,button:0,clientX:bx,clientY:by}));var bezelClickPrevented=!bezel.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,clientX:bx,clientY:by}));await sleep(340);window.playLaptopClickSound=oldMonitorClickSound;S("bezel_unzoom",{zoomed:window.__monitorZoomed&&window.__monitorZoomed(),deviceZoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed"),pointerPrevented:bezelPointerPrevented,clickPrevented:bezelClickPrevented,monitorClickSounds:monitorClickSounds});',
  ' window.goToStage("kitchen");var strip=document.getElementById("loft-game-strip");S("zoom_handoff",{zoomed:document.querySelector(".hunt-viewport").classList.contains("device-zoomed"),origin:strip.style.transformOrigin,transform:strip.style.transform});await sleep(920);S("settled",{visible:visibleRooms(),monitorSaver:window.__monitorSaverLoopRunning&&window.__monitorSaverLoopRunning(),laptopSaver:window.__laptopSaverLoopRunning&&window.__laptopSaverLoopRunning(),eq:window.__monitorEqLoopRunning&&window.__monitorEqLoopRunning(),headphones:window.__headphoneBeatLoopRunning&&window.__headphoneBeatLoopRunning()});',
  ' window.goToStage("garden");document.getElementById("garden-guitar").dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(80);S("instrument_garden",window.__instrumentVisualLoopState());',
  ' window.goToStage("office");await sleep(80);S("instrument_parked",window.__instrumentVisualLoopState());',
  ' window.goToStage("garden");await sleep(80);S("instrument_return",window.__instrumentVisualLoopState());document.getElementById("guitar-song-audio").pause();',
  ' window.trip("shrooms");await sleep(80);S("bloom_garden",window.__tripBloomLoopRunning());window.goToStage("office");await sleep(80);S("bloom_parked",window.__tripBloomLoopRunning());window.goToStage("garden");await sleep(80);S("bloom_return",window.__tripBloomLoopRunning());',
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
  ' window.goToStage("cuddly");await sleep(920);var channels={};["aqua","stars","workout","totoro"].forEach(function(id){channels[id]=channelState(id);});S("cuddly_channels",channels);',
  ' window.goToStage("garden");await sleep(920);window.__applySeasonSilent("autumn");await sleep(120);var leaf=document.querySelector(".sn-fallen-leaf"),active=animationFor(leaf);if(active)active.currentTime=1234;var activePhase=timeOf(active),activeState=active&&active.playState;window.__applySeasonSilent("summer");await sleep(120);var paused=animationFor(leaf)||active,pausedPhase=timeOf(paused),pausedState=paused&&paused.playState;await sleep(160);var heldPhase=timeOf(paused);window.__applySeasonSilent("autumn");await sleep(120);var resumed=animationFor(leaf)||paused;S("season_phase",{activeState:activeState,activePhase:activePhase,pausedState:pausedState,pausedPhase:pausedPhase,heldPhase:heldPhase,resumedState:resumed&&resumed.playState,resumedPhase:timeOf(resumed),samePaused:paused===active,sameResumed:resumed===active});window.__applySeasonSilent("summer");',
  ' window.goToStage("office");await sleep(920);S("office_running",roomRunning("office"));S("office_inactive_season_running",inactiveSeasonRunning(office));S("office_unparked",{stage:getComputedStyle(office).visibility,monitor:getComputedStyle(document.getElementById("office-monitor")).visibility});',
  ' window.goToStage("balcony");await sleep(920);var balcony=document.getElementById("stage-balcony");S("balcony_running",roomRunning("balcony"));S("balcony_inactive_season_running",inactiveSeasonRunning(balcony));',
  ' window.goToStage("garden");await sleep(920);window.party(true);if(window.__summonGuests)window.__summonGuests();await sleep(500);window.goToStage("office");await sleep(920);var garden=document.getElementById("stage-garden"),guestLayer=document.getElementById("garden-guests"),ids=(window.__partyDances||[]).map(function(d){return d.id;}).filter(function(id){return id!=="tango";});guestLayer.classList.add("guests-in");for(var warm=0;warm<ids.length;warm++){window.__setPartyDance(ids[warm]);await sleep(40);}await sleep(160);var start=parkedState("garden").paused_css_animations||0,startActive=ambientCount(garden);for(var i=0;i<30;i++){window.__setPartyDance(ids[i%ids.length]);await sleep(60);}await sleep(160);var end=parkedState("garden").paused_css_animations||0,endActive=ambientCount(garden);S("garden_held_growth",{start:start,startActive:startActive,end:end,endActive:endActive,growth:end-start,staleExcess:Math.max(0,end-endActive)});window.goToStage("garden");await sleep(1400);var stable=roomRunning("garden"),guestStable=layerRunning(guestLayer),parking=window.__hiddenGardenAnimationParkingState(),melt=document.getElementById("trip-melt-dancers");melt.classList.add("crowd-clear");await sleep(80);var meltAnimation=animationFor(melt.querySelector(".md-d1 .md-sway")),meltHeld=timeOf(meltAnimation),meltPaused=meltAnimation&&meltAnimation.playState;await sleep(120);var meltStill=timeOf(meltAnimation);melt.classList.remove("crowd-clear");await sleep(120);var meltNow=animationFor(melt.querySelector(".md-d1 .md-sway")),meltResumed=meltNow&&meltNow.playState,meltAdvanced=timeOf(meltNow);melt.classList.add("crowd-clear");await sleep(80);var mouse=guestLayer.querySelector(".g-elisabeth"),mouseAnimation=animationFor(mouse.querySelector(".guest-sway")),mousePaused=mouseAnimation&&mouseAnimation.playState,mouseHeld=timeOf(mouseAnimation);guestLayer.classList.add("mouses-visiting");await sleep(120);var mouseNow=animationFor(mouse.querySelector(".guest-sway")),mouseResumed=mouseNow&&mouseNow.playState,mouseAdvanced=timeOf(mouseNow);guestLayer.classList.remove("mouses-visiting");S("garden_hidden_parking",{stable:stable,guestStable:guestStable,parking:parking,meltClass:melt.getAttribute("class"),meltPaused:meltPaused,meltHeld:meltHeld,meltStill:meltStill,meltResumed:meltResumed,meltAdvanced:meltAdvanced,meltSame:meltAnimation===meltNow,mousePaused:mousePaused,mouseHeld:mouseHeld,mouseResumed:mouseResumed,mouseAdvanced:mouseAdvanced,mouseSame:mouseAnimation===mouseNow,hiddenMeltPaused:countState(melt,"paused"),hiddenMousePaused:countState(mouse,"paused")});',
  '}',
  '})();</script>'
].join("\n");

var FRAME_HEALTH_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("frame-health harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){window.goToStage("office");await sleep(920);var strip=document.getElementById("loft-game-strip"),mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");function transitions(){return strip.getAnimations().filter(function(a){return typeof a.transitionProperty==="string"&&a.transitionProperty==="transform"&&a.playState==="running";}).length;}var first=window.__frameHealthFeed(6),second=window.__frameHealthFeed(6);window.__monitorZoomIn();var slowTransitions=transitions();var slowState=window.__frameHealthState();window.__monitorZoomOut();window.__frameHealthFeed(60);window.__frameHealthFeed(60);var recovering=window.__frameHealthState();window.__frameHealthFeed(60);var recovered=window.__frameHealthState();window.__monitorZoomIn();var healthyTransitions=transitions();window.__monitorZoomOut();window.goToStage("garden");await sleep(920);window.party(true);await sleep(80);var pool=document.querySelector("#garden-disco-pools .disco-pool");var healthyPoolAnimations=pool.getAnimations().filter(function(a){return a.playState==="running";}).length;window.__frameHealthFeed(6);window.__frameHealthFeed(6);await sleep(20);var slowPool={animations:pool.getAnimations().filter(function(a){return a.playState==="running";}).length,inlineTransform:pool.style.transform};window.__frameHealthFeed(60);window.__frameHealthFeed(60);window.__frameHealthFeed(60);await sleep(20);var recoveredPool={animations:pool.getAnimations().filter(function(a){return a.playState==="running";}).length,inlineTransform:pool.style.transform};report.steps.health={first:first,second:second,slowState:slowState,slowTransitions:slowTransitions,recovering:recovering,recovered:recovered,healthyTransitions:healthyTransitions,zoomed:window.__monitorZoomed(),healthyPoolAnimations:healthyPoolAnimations,slowPool:slowPool,recoveredPool:recoveredPool};}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html scene performance:");
var r = lib.runPageSync("rsvp.html", HARNESS, 6000, { patchRaf: true, forceMotion: true, chromeFlags: "--autoplay-policy=no-user-gesture-required" });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.initial.visible.join("|") === "kitchen" && s.initial.gardenVisibility === "hidden", "only the current room paints at rest", s.initial);
check(s.initial.state && s.initial.paused > 0 && s.initial.currentPaused === 0, "hidden rooms preserve SVG state and pause their CSS timelines from the opening frame", s.initial);
check(s.phase2.paused > 0, "phase two keeps parked CSS timelines paused", s.phase2);
check(s.crossing.visible.join("|") === "kitchen|garden|cuddly|office|balcony", "a direct kitchen-to-balcony pan keeps every traversed room visible", s.crossing);
check(s.balcony.visible.join("|") === "balcony" && s.balcony.state, "the settled pan reparks other rooms without resetting their state", s.balcony);
check(s.zoomed.zoomed && !!s.zoomed.origin, "monitor zoom owns the strip before room navigation", s.zoomed);
check(s.app_keeps_zoom.zoomed && s.app_keeps_zoom.deviceZoomed, "clicking a monitor app stays inside the device zoom", s.app_keeps_zoom);
check(!s.bezel_unzoom.zoomed && !s.bezel_unzoom.deviceZoomed && s.bezel_unzoom.pointerPrevented && s.bezel_unzoom.clickPrevented && s.bezel_unzoom.monitorClickSounds === 0, "clicking non-interactive monitor chrome exits zoom without reaching the generic monitor click", s.bezel_unzoom);
check(!s.zoom_handoff.zoomed && !s.zoom_handoff.origin && s.zoom_handoff.transform === "translateX(0%)", "room navigation collapses zoom before taking over the strip transform", s.zoom_handoff);
check(s.settled.visible.join("|") === "kitchen" && !s.settled.monitorSaver && !s.settled.laptopSaver && !s.settled.eq && !s.settled.headphones, "office-only visual loops are stopped off-room", s.settled);
check(s.instrument_garden.notes && s.instrument_garden.strings === 1, "garden instrument visuals run beside their playing instrument", s.instrument_garden);
check(!s.instrument_parked.notes && s.instrument_parked.strings === 0, "garden instrument timers and rAF stop in a parked room", s.instrument_parked);
check(s.instrument_return.notes && s.instrument_return.strings === 1, "garden instrument visuals resume from live audio state on return", s.instrument_return);
check(s.bloom_garden && !s.bloom_parked && s.bloom_return, "garden trip fractals pause off-room and resume without rebuilding", { garden: s.bloom_garden, parked: s.bloom_parked, returned: s.bloom_return });

var audit = lib.runPageSync("rsvp.html", AUDIT_HARNESS, 14000, { patchRaf: true, forceMotion: true, seedRandom: true, chromeFlags: "--autoplay-policy=no-user-gesture-required" });
if (!audit) { console.log("  \u2717 audit harness produced no report"); process.exit(1); }
var a = audit.steps;
check(audit.errors.length === 0, "numeric performance probes complete without page errors", audit.errors);
check(a.parked_descendants.visible === 0, "parked room descendants cannot opt back into visibility", a.parked_descendants);
check(Object.keys(a.cuddly_channels).every(function (id) { return a.cuddly_channels[id].running === 0 && a.cuddly_channels[id].paused > 0; }), "every inactive Cuddly channel freezes its CSS timelines", a.cuddly_channels);
check(a.season_phase.activeState === "running" && a.season_phase.pausedState === "paused" && a.season_phase.resumedState === "running" && a.season_phase.samePaused && a.season_phase.sameResumed && Math.abs(a.season_phase.pausedPhase - a.season_phase.activePhase) < 2 && Math.abs(a.season_phase.heldPhase - a.season_phase.activePhase) < 2 && Math.abs(a.season_phase.resumedPhase - a.season_phase.activePhase) < 2, "seasonal timelines freeze and resume at the held phase", a.season_phase);
check(a.office_inactive_season_running === 0 && a.balcony_inactive_season_running === 0, "inactive seasonal surfaces never run in active rooms", { office: a.office_inactive_season_running, balcony: a.balcony_inactive_season_running });
check(a.office_unparked.stage === "visible" && a.office_unparked.monitor === "visible", "unparking restores normal descendant visibility", a.office_unparked);
check(a.garden_held_growth.end <= a.garden_held_growth.endActive, "parked animation references stay bounded by live garden timelines after 30 dance changes", a.garden_held_growth);
check(a.garden_hidden_parking.stable.running <= 140 && a.garden_hidden_parking.guestStable.running <= 90 && a.garden_hidden_parking.stable.hidden <= 2 && a.garden_hidden_parking.parking.held >= 20, "a stable full party keeps the garden and named-guest animation workload bounded", a.garden_hidden_parking);
check(a.garden_hidden_parking.meltPaused === "paused" && a.garden_hidden_parking.meltStill === a.garden_hidden_parking.meltHeld && a.garden_hidden_parking.meltResumed === "running" && a.garden_hidden_parking.meltSame && a.garden_hidden_parking.meltAdvanced >= a.garden_hidden_parking.meltHeld, "the faded generic crowd holds and resumes its original animation phase", a.garden_hidden_parking);
check(a.garden_hidden_parking.mousePaused === "paused" && a.garden_hidden_parking.mouseResumed === "running" && a.garden_hidden_parking.mouseSame && a.garden_hidden_parking.mouseAdvanced >= a.garden_hidden_parking.mouseHeld, "a non-visiting child holds and resumes its original animation phase", a.garden_hidden_parking);
console.log("  metrics: " + JSON.stringify({ cuddly: a.cuddly_channels, seasonPhase: a.season_phase, gardenHeld: a.garden_held_growth, gardenHidden: a.garden_hidden_parking, officeRunning: a.office_running, balconyRunning: a.balcony_running, parkedVisibleDescendants: a.parked_descendants.visible }));

var health = lib.runPageSync("rsvp.html", FRAME_HEALTH_HARNESS, 2500, { patchRaf: true, forceMotion: true, seedRandom: true });
if (!health) { console.log("  \u2717 frame-health harness produced no report"); process.exit(1); }
var h = health.steps.health;
check(health.errors.length === 0 && h.slowTransitions === 0 && h.healthyTransitions === 0, "device zoom never runs the whole-strip transform transition", h);
check(!h.first.slow && h.second.slow && h.slowState.slow && h.recovering.slow && !h.recovered.slow, "frame-health mode enters and recovers with asymmetric hysteresis", h);
check(h.healthyPoolAnimations > 0 && h.slowPool.animations === 0 && !!h.slowPool.inlineTransform && h.recoveredPool.animations > 0 && !h.recoveredPool.inlineTransform, "party spotlights switch between continuous sweep and low-FPS steps", h);
console.log("  frame-health metric: " + JSON.stringify(h));

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
