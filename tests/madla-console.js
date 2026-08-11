#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=(window.__errs||[]).slice();document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' window.__goToStage("office");await wait(30);window.__secondRound=false;window.__gardenPartyOn=false;',
  ' report.steps.autoPhase1=window.__madlaRing();',
  ' var explicitPhase1=window.__loftControllers.madla();await wait(30);report.steps.explicitPhase1={promise:!!(explicitPhase1&&typeof explicitPhase1.then==="function"),ring:!!document.querySelector(".call-ring.show")};',
  ' var answered=window.__answerMadla(true);await wait(80);report.steps.answer={answered:answered,room:window.__currentStageName,phone:!!document.querySelector(".phone-backdrop.show"),call:window.__chatPhoneState&&window.__chatPhoneState().call};',
  ' if(window.__hangupPhoneCall)window.__hangupPhoneCall();if(window.__closePhoneModal)window.__closePhoneModal(true);await wait(300);',
  ' window.__secondRound=true;window.__gardenPartyOn=true;report.steps.autoParty=window.__madlaRing();',
  ' var explicitParty=window.__loftControllers.madla();await wait(30);report.steps.explicitParty={promise:!!(explicitParty&&typeof explicitParty.then==="function"),ring:!!document.querySelector(".call-ring.show")};window.__hideCallRing();await wait(30);',
  ' window.__secondRound=false;window.__gardenPartyOn=true;var forced=window.__madlaRingForced();await wait(30);report.steps.forced={result:forced,ring:!!document.querySelector(".call-ring.show")};window.__hideCallRing();',
  ' var beforeRoom=window.__currentStageName;document.dispatchEvent(new KeyboardEvent("keydown",{key:"a",code:"KeyA",bubbles:true,cancelable:true}));await wait(30);report.steps.aKeyIdle={room:window.__currentStageName,beforeRoom:beforeRoom,ring:!!document.querySelector(".call-ring.show"),phone:!!document.querySelector(".phone-backdrop.show")};',
  '}',
  '})();</script>'
].join("\n");

var report = lib.runPageSync("rsvp.html", HARNESS, 5000, {
  forceMotion: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});

if (!report) {
  console.error("Madla console: no report");
  process.exit(1);
}

var failures = 0;
function check(pass, message, detail) {
  console.log("  " + (pass ? "✓" : "✗") + " " + message + (pass || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!pass) failures++;
}

var s = report.steps || {};
check(report.errors.length === 0, "no uncaught page errors", report.errors);
check(s.autoPhase1 === false && s.autoParty === false,
  "autonomous Madla calls retain the phase-two and party-off gate",
  { phase1: s.autoPhase1, party: s.autoParty });
check(s.explicitPhase1 && s.explicitPhase1.promise && s.explicitPhase1.ring,
  "the private Madla owner rings explicitly during phase 1", s.explicitPhase1);
check(s.answer && s.answer.answered && s.answer.room === "office" && s.answer.phone,
  "an explicit Madla call answers over the current room without panning",
  s.answer);
check(s.explicitParty && s.explicitParty.promise && s.explicitParty.ring,
  "the private Madla owner rings explicitly while the party is on", s.explicitParty);
check(s.forced && !s.forced.result && !s.forced.ring,
  "a third Madla ring attempt is refused until reset", s.forced);
check(s.aKeyIdle && s.aKeyIdle.room === s.aKeyIdle.beforeRoom &&
  !s.aKeyIdle.ring && !s.aKeyIdle.phone,
  "the A key no longer triggers any reserved console/game action", s.aKeyIdle);

if (failures) process.exit(1);
console.log("Madla console: all checks passed");
