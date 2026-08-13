#!/usr/bin/env node
"use strict";

// Foreground devices suppress room tone without stealing deliberately persistent media.
var lib = require("./lib");
var fs = require("fs");
var path = require("path");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function click(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' var kettle=document.getElementById("kitchen-kettle"),radio=document.getElementById("kitchen-scale");click(kettle);click(radio);await sleep(80);',
  ' report.steps.kitchenOn=window.__activeAudioBedCount();window.__openPhoneModal(true);await sleep(520);report.steps.phone={covered:window.__roomAmbienceCovered(),beds:window.__activeAudioBedCount()};',
  ' window.__closePhoneModal(true);await sleep(120);report.steps.phoneClosed={covered:window.__roomAmbienceCovered(),beds:window.__activeAudioBedCount()};click(kettle);click(radio);await sleep(420);',
  ' window.__loftControllers.projector("stars");await sleep(980);var scoreBeds=window.__activeAudioBedCount();window.__openPhoneModal(true);await sleep(520);report.steps.media={before:scoreBeds,during:window.__activeAudioBedCount()};window.__closePhoneModal(true);await sleep(260);',
  ' window.__goToStage("office");await sleep(920);var pc=document.getElementById("office-pc-desk-trio"),mon=document.getElementById("office-monitor"),laptop=document.getElementById("office-laptop"),oldPartyApply=window.__applyPartyMusicVolume,lastPartyFade=null;window.__applyPartyMusicVolume=function(fade){lastPartyFade=fade;return oldPartyApply&&oldPartyApply(fade);};click(pc);await sleep(80);var deskBeds=window.__activeAudioBedCount(),songVolume=window.__songVolume();mon.classList.add("screen-on");window.__monitorZoomIn();await sleep(420);report.steps.monitor={covered:window.__roomAmbienceCovered(),before:deskBeds,during:window.__activeAudioBedCount(),duck:window.__partyDuck,songVolume:window.__songVolume(),songBefore:songVolume,fade:lastPartyFade};',
  ' window.__monitorZoomOut();await sleep(100);var monitorReleased=window.__partyDuck,monitorReleaseFade=lastPartyFade;laptop.classList.add("open");window.__laptopZoomIn();await sleep(420);report.steps.laptop={covered:window.__roomAmbienceCovered(),beds:window.__activeAudioBedCount(),duck:window.__partyDuck,songVolume:window.__songVolume(),songBefore:songVolume,fade:lastPartyFade};window.__monitorZoomOut();report.steps.zoomReleased={monitor:monitorReleased,laptop:window.__partyDuck,monitorFade:monitorReleaseFade,laptopFade:lastPartyFade};window.__applyPartyMusicVolume=oldPartyApply;',
  ' window.__goToStage("balcony");await sleep(1250);var balconyBeds=window.__activeAudioBedCount();window.__openPhoneModal(true);await sleep(620);report.steps.balcony={before:balconyBeds,during:window.__activeAudioBedCount(),mediaFloor:scoreBeds};window.__closePhoneModal(true);',
  ' window.__setPartyMode(true,true);var guitarVolume=window.__songVolume();window.__playSongAt(0);await sleep(120);report.steps.guitarDuck={playing:window.__phoneMusicPlaying(),duck:window.__partyDuck,songVolume:window.__songVolume(),songBefore:guitarVolume};window.__phoneMusicToggle();await sleep(120);report.steps.guitarReleased={playing:window.__phoneMusicPlaying(),duck:window.__partyDuck,songVolume:window.__songVolume()};',
  ' var oldRetarget=window.__retargetPartyGain,retargets=[];window.__retargetPartyGain=function(ctx,param,value,tc){retargets.push({value:value,tc:tc});return oldRetarget(ctx,param,value,tc);};window.__goToStage("office");await sleep(920);mon.classList.add("screen-on");window.__monitorZoomIn();window.__playSongAt(0);await sleep(120);window.__phoneMusicToggle();await sleep(120);var overlapBeforeOut=window.__partyDuck;window.__monitorZoomOut();await sleep(120);report.steps.overlapReleased={before:overlapBeforeOut,after:window.__partyDuck,playing:window.__phoneMusicPlaying(),zoomed:window.__monitorZoomed(),retargets:retargets};window.__retargetPartyGain=oldRetarget;',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html foreground-device audio:");
var result = lib.runPageSync("rsvp.html", HARNESS, 9500, {
  patchRaf: true,
  forceMotion: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.kitchenOn >= 2 && s.phone && s.phone.covered && s.phone.beds <= s.kitchenOn - 2,
  "opening the phone releases the kitchen kettle and radio beds", s);
check(s.phoneClosed && !s.phoneClosed.covered && s.phoneClosed.beds >= s.kitchenOn,
  "closing the phone restores eligible room tone", s.phoneClosed);
check(s.media && s.media.before >= 1 && s.media.during === s.media.before,
  "the phone leaves the projector score playing", s.media);
check(s.monitor && s.monitor.covered && s.monitor.before >= s.monitor.during + 1 && s.monitor.during >= 1,
  "monitor zoom releases the PC fan without stopping the projector score", s.monitor);
check(s.monitor && s.monitor.duck === 0.06 && s.monitor.songVolume === s.monitor.songBefore && s.monitor.fade === 1,
  "monitor zoom ducks only the party bed, not the loft/guitar song volume", s.monitor);
check(s.laptop && s.laptop.covered && s.laptop.beds >= 1,
  "laptop zoom keeps media while room ambience remains covered", s.laptop);
check(s.laptop && s.laptop.duck === 0.06 && s.laptop.songVolume === s.laptop.songBefore && s.laptop.fade === 1,
  "laptop zoom ducks only the party bed, not the loft/guitar song volume", s.laptop);
check(s.zoomReleased && s.zoomReleased.monitor === 1 && s.zoomReleased.laptop === 1 &&
      s.zoomReleased.monitorFade === 1 && s.zoomReleased.laptopFade === 1,
  "dismissing either office-screen zoom restores the party bed", s.zoomReleased);
check(s.balcony && s.balcony.before >= s.balcony.during + 1 && s.balcony.during >= s.balcony.mediaFloor,
  "the phone releases balcony city hum while preserving the projector score", s.balcony);
check(s.guitarDuck && s.guitarDuck.playing && s.guitarDuck.duck === 0.06 &&
      s.guitarDuck.songVolume === s.guitarDuck.songBefore,
  "a playing loft/guitar song ducks the party everywhere without lowering itself", s.guitarDuck);
check(s.guitarReleased && !s.guitarReleased.playing && s.guitarReleased.duck === 1 &&
      s.guitarReleased.songVolume === s.guitarDuck.songBefore,
  "pausing the loft/guitar song restores the party bed", s.guitarReleased);
check(s.overlapReleased && s.overlapReleased.before === 0.06 && s.overlapReleased.after === 1 &&
      !s.overlapReleased.playing && !s.overlapReleased.zoomed && s.overlapReleased.retargets.length >= 4 &&
      s.overlapReleased.retargets.some(function (r) {
        return r.value < s.overlapReleased.retargets[s.overlapReleased.retargets.length - 1].value;
      }),
  "stopping guitar under monitor focus then unzooming releases the final duck gate", s.overlapReleased);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var partyRetargets = (source.match(/window\.__retargetPartyGain\([^\n]*_masterGain\.gain/g) || []).length;
var partyBeds = (source.match(/(?:partyCtx|waltzCtx|tangoCtx|discoCtx|swingCtx|salsaCtx|bhangraCtx|baCtx|kCtx|hCtx|bgCtx|duCtx|fuCtx|cuCtx)\s*=\s*audioBed\("party"\)/g) || []).length;
check(/window\.__retargetPartyGain\s*=\s*function/.test(source) &&
      partyRetargets >= 13 && partyRetargets === partyBeds,
  "every party dance bed cancels and holds stale gain automation before retargeting");
check(partyBeds >= 13 && partyBeds === partyRetargets,
  "every registered party dance routes through the graceful-departure output bus");

console.log("");
if (failures) { console.log(failures + " device-audio assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Foreground-device audio assertions passed.");
