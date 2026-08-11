#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' var api=window.loft.api,events=[],off=api.subscribe(function(event){events.push(event);});window.__secondRound=true;var oldMax=window.__maxUnlocked;window.__maxUnlocked=function(){return 4;};',
  ' function begin(){events=[];return api.stateVersion;}function finish(v){return {delta:api.stateVersion-v,events:events.slice(),last:events[events.length-1]||null};}',
  ' var v=begin(),beforeProjector=window.__cuddlyProjector.channel();window.__cuddlyProjector.set(beforeProjector==="stars"?"off":"stars");var projectorDirect=finish(v);',
  ' v=begin();window.__cuddlyProjector.set(window.__cuddlyProjector.channel());var projectorNoop=finish(v);',
  ' window.__goToStage("office");events=[];v=api.stateVersion;var projectorTypedResult=await api.perform("cuddly.projector.set",{mode:"totoro"},{source:"test"});var projectorTyped=finish(v);',
  ' v=begin();var beforeRain=!!window.__wxRain;window.__setBalconyRain(!beforeRain,"test-direct");var weatherDirect=finish(v);',
  ' v=begin();window.__setBalconyRain(!!window.__wxRain,"test-direct");var weatherNoop=finish(v);',
  ' v=begin();var weatherTypedResult=await api.perform("weather.scene.set",{mode:"thunderstorm"},{source:"test"});var weatherTyped=finish(v);',
  ' window.__goToStage("balcony");events=[];v=api.stateVersion;document.getElementById("balcony-smoker-firebox").dispatchEvent(new MouseEvent("click",{bubbles:true}));var bbqDirect=finish(v);',
  ' v=begin();var bbqTypedResult=await api.perform("balcony.bbq.set",{on:false},{source:"test"});var bbqTyped=finish(v);',
  ' v=begin();var bbqNoopResult=await api.perform("balcony.bbq.set",{on:false},{source:"test"});var bbqNoop=finish(v);',
  ' window.__goToStage("office");events=[];v=api.stateVersion;window.__startArcade();var gameStart=finish(v);',
  ' v=begin();var gameStopResult=await api.perform("minigame.stop",{},{source:"test"});var gameStop=finish(v);',
  ' v=begin();var rec=window.__albumAddRoom("garden",true);var albumAdd=finish(v);',
  ' v=begin();var albumRemoveResult=await api.perform("album.remove",{id:rec.id},{source:"test"});var albumRemove=finish(v);',
  ' v=begin();var albumRemoveAgain=await api.perform("album.remove",{id:rec.id},{source:"test"});var albumNoop=finish(v);',
  ' window.__secondRound=false;var madlaPhase1=window.__madlaRing();window.__secondRound=true;window.__gardenPartyOn=true;var madlaParty=window.__madlaRing();window.__gardenPartyOn=false;',
  ' v=begin();var rang=window.__madlaRing();await wait(30);var callRing=finish(v);',
  ' v=begin();window.__hideCallRing();await wait(30);var callDismiss=finish(v);',
  ' v=begin();window.__openPhoneModal(true);await wait(30);var appOpen=finish(v);',
  ' v=begin();window.__openPhoneAppHere("calculator");await wait(30);var appNavigate=finish(v);',
  ' v=begin();var appNoopResult=await api.perform("app.open",{app:"calculator"},{source:"test"});await wait(30);var appNoop=finish(v);',
  ' v=begin();window.__closePhoneModal(true);await wait(280);var appClose=finish(v);',
  ' window.__madlaRing();await wait(30);events=[];v=api.stateVersion;window.__answerMadla();await wait(700);var phoneCallAnswer=finish(v);',
  ' v=begin();window.__hangupPhoneCall();await wait(40);var phoneCallEnd=finish(v);window.__closePhoneModal(true);await wait(280);',
  ' var laptop=document.getElementById("office-laptop");laptop.classList.add("connected");window.__syncLoftCallState("setup","test");await wait(20);events=[];v=api.stateVersion;var delayedHangupResult=await api.perform("call.hangup",{},{source:"test"});var delayedHangupImmediate=finish(v);await wait(1700);var delayedHangupDone=finish(v);',
  ' v=begin();var musicPlayResult=await api.perform("music.track.play",{track:"tumbala"},{source:"test"});await wait(40);var musicPlay=finish(v);',
  ' v=begin();var musicPauseResult=await api.perform("music.pause",{},{source:"test"});await wait(40);var musicPause=finish(v);',
  ' var video=document.getElementById("monitor-video-el"),videoPaused=true;Object.defineProperty(video,"paused",{configurable:true,get:function(){return videoPaused;}});Object.defineProperty(video,"ended",{configurable:true,get:function(){return false;}});video.play=function(){videoPaused=false;video.dispatchEvent(new Event("play"));return Promise.resolve();};video.pause=function(){videoPaused=true;video.dispatchEvent(new Event("pause"));};document.getElementById("monitor-video-wrap").classList.remove("absent");',
  ' v=begin();window.__toggleMonitorVideo();await wait(30);var videoPlay=finish(v);',
  ' v=begin();var videoPauseResult=await api.perform("video.pause",{},{source:"test"});await wait(30);var videoPause=finish(v);',
  ' v=begin();var videoPauseAgain=await api.perform("video.pause",{},{source:"test"});await wait(30);var videoNoop=finish(v);',
  ' Object.keys(window.__TRIP_DURATIONS).forEach(function(key){window.__TRIP_DURATIONS[key]=120;});window.__secondRound=false;var tripPhaseBefore=window.__secondRound,tripRoomBefore=window.__currentStageName;v=begin();var tripNextResult=await api.perform("trip.next",{},{source:"test"});await wait(30);var tripNext=finish(v),tripState=api.query("trip.status"),tripRoomAfter=window.__currentStageName;',
  ' window.__maxUnlocked=oldMax;off();S("state",{projectorDirect:projectorDirect,projectorNoop:projectorNoop,projectorTyped:projectorTyped,projectorTypedResult:projectorTypedResult,weatherDirect:weatherDirect,weatherNoop:weatherNoop,weatherTyped:weatherTyped,weatherTypedResult:weatherTypedResult,bbqDirect:bbqDirect,bbqTyped:bbqTyped,bbqTypedResult:bbqTypedResult,bbqNoop:bbqNoop,bbqNoopResult:bbqNoopResult,gameStart:gameStart,gameStop:gameStop,gameStopResult:gameStopResult,albumAdd:albumAdd,albumRemove:albumRemove,albumRemoveResult:albumRemoveResult,albumNoop:albumNoop,albumRemoveAgain:albumRemoveAgain,madlaPhase1:madlaPhase1,madlaParty:madlaParty,rang:rang,callRing:callRing,callDismiss:callDismiss,appOpen:appOpen,appNavigate:appNavigate,appNoop:appNoop,appNoopResult:appNoopResult,appClose:appClose,phoneCallAnswer:phoneCallAnswer,phoneCallEnd:phoneCallEnd,delayedHangupResult:delayedHangupResult,delayedHangupImmediate:delayedHangupImmediate,delayedHangupDone:delayedHangupDone,musicPlay:musicPlay,musicPlayResult:musicPlayResult,musicPause:musicPause,musicPauseResult:musicPauseResult,videoPlay:videoPlay,videoPause:videoPause,videoPauseResult:videoPauseResult,videoNoop:videoNoop,videoPauseAgain:videoPauseAgain,tripPhaseBefore:tripPhaseBefore,tripNext:tripNext,tripNextResult:tripNextResult,tripState:tripState,tripRoomBefore:tripRoomBefore,tripRoomAfter:tripRoomAfter,media:api.query("media.status"),calls:api.query("calls.status"),games:api.query("minigames.status")});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function one(step, id, source) {
  return step && step.delta === 1 && step.events.length === 1 && step.events[0].id === id && (!source || step.events[0].source === source);
}

console.log("loft-day.html API v4 semantic state events:");
var result = lib.runPageSync("rsvp.html", HARNESS, 8500, { patchRaf: true, forceMotion: true, chromeFlags: "--autoplay-policy=no-user-gesture-required" });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps.state || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(one(s.projectorDirect, "media.projector", "internal"), "direct projector changes publish one owner event", s.projectorDirect);
check(s.projectorNoop.delta === 0 && s.projectorNoop.events.length === 0, "repeating the projector mode is a true no-op", s.projectorNoop);
check(one(s.projectorTyped, "cuddly.projector.set", "test") && s.projectorTypedResult.ok && s.projectorTypedResult.changed, "typed projector navigation and mode changes coalesce", { step: s.projectorTyped, result: s.projectorTypedResult });
check(one(s.weatherDirect, "environment.weather", "test-direct"), "direct weather-layer changes publish one owner event", s.weatherDirect);
check(s.weatherNoop.delta === 0 && s.weatherNoop.events.length === 0, "repeating a weather layer is a true no-op", s.weatherNoop);
check(one(s.weatherTyped, "weather.scene.set", "test") && s.weatherTypedResult.ok && s.weatherTypedResult.changed, "multi-layer typed weather changes coalesce", { step: s.weatherTyped, result: s.weatherTypedResult });
check(one(s.bbqDirect, "bbq.change", "ui") && s.bbqDirect.last.args.on && s.bbqDirect.last.args.open, "the smoker's first physical control publishes one complete BBQ transition", s.bbqDirect);
check(one(s.bbqTyped, "balcony.bbq.set", "test") && s.bbqTypedResult.ok && s.bbqTypedResult.changed, "typed BBQ shutdown coalesces lid and fire changes", { step: s.bbqTyped, result: s.bbqTypedResult });
check(s.bbqNoop.delta === 0 && s.bbqNoop.events.length === 0 && s.bbqNoopResult.ok && !s.bbqNoopResult.changed, "repeating the BBQ state is a true no-op", { step: s.bbqNoop, result: s.bbqNoopResult });
check(one(s.gameStart, "minigame.change", "ui"), "direct minigame start publishes its lifecycle", s.gameStart);
check(one(s.gameStop, "minigame.stop", "test") && s.gameStopResult.ok && s.gameStopResult.changed, "typed minigame stop coalesces its owner event", { step: s.gameStop, result: s.gameStopResult });
check(one(s.albumAdd, "album.changed") && s.albumAdd.last.args.reason === "added", "Album capture publishes a privacy-safe storage event", s.albumAdd);
check(one(s.albumRemove, "album.remove", "test") && s.albumRemoveResult.ok && s.albumRemoveResult.changed, "typed Album removal coalesces its owner event", { step: s.albumRemove, result: s.albumRemoveResult });
check(s.albumNoop.delta === 0 && s.albumNoop.events.length === 0 && s.albumRemoveAgain.ok && !s.albumRemoveAgain.changed, "removing a missing Album record is a true no-op", { step: s.albumNoop, result: s.albumRemoveAgain });
check(!s.madlaPhase1 && !s.madlaParty, "Madla cannot ring during phase 1 or while the party is active", { phase1: s.madlaPhase1, party: s.madlaParty });
check(s.rang && one(s.callRing, "calls.changed", "autonomous") && s.callRing.last.args.incoming, "Madla can ring only in phase 2 with the party off, and publishes her actual ringing lifecycle", s.callRing);
check(one(s.callDismiss, "calls.changed", "autonomous") && !s.callDismiss.last.args.incoming, "dismissing a call publishes the idle lifecycle", s.callDismiss);
check(one(s.appOpen, "apps.changed", "ui") && s.appOpen.last.args.phone_open, "opening the phone publishes one app-navigation event", s.appOpen);
check(one(s.appNavigate, "apps.changed", "ui") && s.appNavigate.last.args.phone === "calculator", "direct phone app navigation publishes one event", s.appNavigate);
check(s.appNoop.delta === 0 && s.appNoop.events.length === 0 && s.appNoopResult.ok && !s.appNoopResult.changed, "reopening the current app is a true no-op", { step: s.appNoop, result: s.appNoopResult });
check(one(s.appClose, "apps.changed", "ui") && !s.appClose.last.args.phone_open, "closing the phone publishes one app-navigation event", s.appClose);
check(s.phoneCallAnswer.events.filter(function(event){return event.id === "calls.changed" && event.args.phone && event.args.phone.incoming;}).length === 1, "answering an incoming phone call publishes its active call state", s.phoneCallAnswer);
check(s.phoneCallEnd.events.filter(function(event){return event.id === "calls.changed" && !event.args.phone;}).length === 1, "ending a phone call publishes its idle call state", s.phoneCallEnd);
check(s.delayedHangupResult.ok && !s.delayedHangupResult.changed && s.delayedHangupResult.value.scheduled && s.delayedHangupImmediate.delta === 0, "a goodbye-delayed hangup reports scheduling without a false state revision", { result: s.delayedHangupResult, step: s.delayedHangupImmediate });
check(s.delayedHangupDone.events.filter(function(event){return event.id === "calls.changed" && event.source === "autonomous" && !event.args.busy;}).length === 1, "a delayed hangup publishes exactly once when the call actually ends", s.delayedHangupDone);
check(s.musicPlayResult.ok && s.musicPlayResult.changed && s.musicPlay.events.filter(function(event){return event.id === "music.track.play" || event.id === "media.music";}).length === 1, "typed music start publishes one playback transition", { step: s.musicPlay, result: s.musicPlayResult });
check(s.musicPauseResult.ok && s.musicPauseResult.changed && s.musicPause.events.filter(function(event){return event.id === "music.pause" || event.id === "media.music";}).length === 1, "typed music pause publishes one playback transition", { step: s.musicPause, result: s.musicPauseResult });
check(s.videoPlay.events.filter(function(event){return event.id === "media.video" && event.source === "ui" && event.args.playing;}).length === 1, "direct video playback publishes one owner event", s.videoPlay);
check(s.videoPause.events.filter(function(event){return event.id === "video.pause" && event.source === "test";}).length === 1 && s.videoPauseResult.ok && s.videoPauseResult.changed && !s.videoPauseResult.value.playing, "typed video pause coalesces its media event", { step: s.videoPause, result: s.videoPauseResult });
check(s.videoNoop.delta === 0 && s.videoNoop.events.length === 0 && !s.videoPauseAgain.ok && s.videoPauseAgain.code === "NOT_AVAILABLE", "video pause is not advertised or executed once playback is already paused", { step: s.videoNoop, result: s.videoPauseAgain });
check(s.media.ok && s.media.value.video && !s.media.value.video.playing, "combined media status exposes bounded video playback state", s.media);
check(s.tripPhaseBefore === false && s.tripNext.events.filter(function(event){return event.id === "trip.next" && event.source === "test";}).length === 1 && s.tripNextResult.ok && s.tripNextResult.changed && s.tripNextResult.value.room === s.tripRoomBefore && s.tripRoomAfter === s.tripRoomBefore && !s.tripNextResult.value.active && s.tripState.ok && !s.tripState.value.active && s.tripState.value.variant === null, "typed next-trip action works in phase 1, keeps the visitor's room, and settles only after the trip ends", { phase: s.tripPhaseBefore, step: s.tripNext, result: s.tripNextResult, state: s.tripState, before: s.tripRoomBefore, after: s.tripRoomAfter });
check(s.calls.ok && s.calls.value.laptop && typeof s.calls.value.laptop.active === "boolean" && s.games.ok && s.games.value.invaders && typeof s.games.value.invaders.score === "number", "call and minigame queries expose bounded lifecycle detail", { calls: s.calls, games: s.games });

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
