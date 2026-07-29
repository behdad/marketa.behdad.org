#!/usr/bin/env node
"use strict";

// Foreground devices suppress room tone without stealing deliberately persistent media.
var lib = require("./lib");

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
  ' window.projector("stars");await sleep(980);var scoreBeds=window.__activeAudioBedCount();window.__openPhoneModal(true);await sleep(520);report.steps.media={before:scoreBeds,during:window.__activeAudioBedCount()};window.__closePhoneModal(true);await sleep(260);',
  ' window.goToStage("office");await sleep(920);var pc=document.getElementById("office-pc-desk-trio"),mon=document.getElementById("office-monitor"),laptop=document.getElementById("office-laptop");click(pc);await sleep(80);var deskBeds=window.__activeAudioBedCount();mon.classList.add("screen-on");window.__monitorZoomIn();await sleep(420);report.steps.monitor={covered:window.__roomAmbienceCovered(),before:deskBeds,during:window.__activeAudioBedCount()};',
  ' window.__monitorZoomOut();await sleep(100);laptop.classList.add("open");window.__laptopZoomIn();await sleep(420);report.steps.laptop={covered:window.__roomAmbienceCovered(),beds:window.__activeAudioBedCount()};window.__monitorZoomOut();',
  ' window.goToStage("balcony");await sleep(1250);var balconyBeds=window.__activeAudioBedCount();window.__openPhoneModal(true);await sleep(620);report.steps.balcony={before:balconyBeds,during:window.__activeAudioBedCount(),mediaFloor:scoreBeds};window.__closePhoneModal(true);',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html foreground-device audio:");
var result = lib.runPageSync("rsvp.html", HARNESS, 7000, {
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
check(s.laptop && s.laptop.covered && s.laptop.beds >= 1,
  "laptop zoom keeps media while room ambience remains covered", s.laptop);
check(s.balcony && s.balcony.before >= s.balcony.during + 1 && s.balcony.during >= s.balcony.mediaFloor,
  "the phone releases balcony city hum while preserving the projector score", s.balcony);

console.log("");
if (failures) { console.log(failures + " device-audio assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Foreground-device audio assertions passed.");
