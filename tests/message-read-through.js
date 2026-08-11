#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function state(){var out={};window.__chatMessagesKnowledge().forEach(function(m){out[m.id]=m.read;});return {read:out,unread:window.__phoneNotificationCounts().messages};}',
  'function context(id){var row=document.querySelector(".pm-msg-row[data-message-id="+id+"]"),r=row.getBoundingClientRect();row.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2,clientX:r.left+10,clientY:r.top+10}));}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__secondRound=true;["pouria","cue_mail","invaders","cue_calendar"].forEach(function(id){window.__deliverPhoneMessage(id);if(window.__hideMessageThumb)window.__hideMessageThumb();});',
  ' window.__loftControllers.phone.open("messages");await sleep(80);',
  ' document.querySelector(".pm-msg-row[data-message-id=cue_mail]").click();await sleep(30);S("row",state());',
  ' context("invaders");document.querySelector(".ctx-reaction").click();await sleep(30);S("reaction",state());',
  ' context("cue_mail");document.querySelector(".message-read-ctx .ctx-open").click();await sleep(30);S("hole",state());',
  ' window.__runMsgAction("invaders");await sleep(40);S("action",state());',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Messages read-through:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.row.read.pouria && s.row.read.cue_mail && !s.row.read.invaders &&
  !s.row.read.cue_calendar && s.row.unread === 2,
  "reading a row marks it and every earlier row, but no newer row", s.row);
check(s.reaction.read.pouria && s.reaction.read.cue_mail && s.reaction.read.invaders &&
  !s.reaction.read.cue_calendar && s.reaction.unread === 1,
  "reacting counts as reading through that message", s.reaction);
check(!s.hole.read.cue_mail && s.hole.read.invaders && s.hole.unread === 2,
  "explicit Mark as unread remains a one-message exception", s.hole);
check(s.action.read.pouria && s.action.read.cue_mail && s.action.read.invaders &&
  !s.action.read.cue_calendar && s.action.unread === 1,
  "following an action closes an older unread hole through that message", s.action);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
