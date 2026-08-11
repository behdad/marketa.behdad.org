#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function snap(){var badge=document.querySelector(".msg-badge"),thumb=document.querySelector(".msg-thumb"),coach=document.querySelector(".msg-badge-coach");return {held:window.__messageNotificationsHeld(),badge:!!badge&&badge.classList.contains("show"),thumb:!!thumb&&thumb.classList.contains("show"),coach:!!coach&&coach.classList.contains("show"),thread:window.__phoneMessageThread()};}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' window.__secondRound=true;if(window.__stopCueDrip)window.__stopCueDrip();window.__goToStage("office");await sleep(80);',
  ' var mon=document.getElementById("office-monitor"),laptop=document.getElementById("office-laptop");mon.classList.add("here","screen-on","show-caps");',
  ' window.__monitorZoomIn();window.__deliverPhoneMessage("cue_mail");await sleep(80);report.steps.monitorHeld=snap();',
  ' window.__monitorZoomOut();await sleep(560);report.steps.monitorReleased=snap();if(window.__hideMessageThumb)window.__hideMessageThumb(true);',
  ' window.__deliverPhoneMessage("cue_calendar");await sleep(60);report.steps.beforeLaptop=snap();',
  ' laptop.classList.add("open");window.__laptopZoomIn();await sleep(60);report.steps.laptopHeld=snap();',
  ' window.__monitorZoomOut();await sleep(560);report.steps.laptopReleased=snap();',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html focused-device message notifications:");
var result = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.monitorHeld && s.monitorHeld.held.device && s.monitorHeld.held.messages.indexOf("cue_mail") !== -1 &&
      !s.monitorHeld.badge && !s.monitorHeld.thumb && !s.monitorHeld.coach && s.monitorHeld.thread.indexOf("cue_mail") !== -1,
  "monitor zoom retains an unread message while hiding its preview, badge, and coach", s.monitorHeld);
check(s.monitorReleased && !s.monitorReleased.held.device && !s.monitorReleased.held.messages.length &&
      s.monitorReleased.badge && s.monitorReleased.thumb,
  "leaving monitor zoom releases the retained preview and unread badge", s.monitorReleased);
check(s.beforeLaptop && s.beforeLaptop.thumb,
  "a notification can already be visible before laptop focus", s.beforeLaptop);
check(s.laptopHeld && s.laptopHeld.held.device && s.laptopHeld.held.messages.indexOf("cue_calendar") !== -1 &&
      !s.laptopHeld.badge && !s.laptopHeld.thumb && !s.laptopHeld.coach && s.laptopHeld.thread.indexOf("cue_calendar") !== -1,
  "laptop zoom clears a visible preview without marking its message read", s.laptopHeld);
check(s.laptopReleased && !s.laptopReleased.held.device && !s.laptopReleased.held.messages.length &&
      s.laptopReleased.badge && s.laptopReleased.thumb,
  "leaving laptop zoom releases the retained preview and unread badge", s.laptopReleased);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
