#!/usr/bin/env node
// Autonomous authored Messages rewrite English when Chat succeeds, always keep the
// authored Czech translation, preserve Irene/Hannah's authored voices, and fall back
// to English dictionary copy on failure.
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'var aiLogs=[];console.info=function(){aiLogs.push({level:"info",args:[].slice.call(arguments)});};console.warn=function(){aiLogs.push({level:"warn",args:[].slice.call(arguments)});};',
  'function row(id){return document.querySelector(".pm-msg-row[data-message-id="+id+"] .pm-msg-text");}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__secondRound=true;var request=null,oldRandom=Math.random;Math.random=function(){return .5;};',
  ' window.__monitorMessageRewrite=function(value){request=value;return Promise.resolve(JSON.stringify({en:"Bahareh says there is a letter waiting for you 💌"}));};',
  ' var accepted=window.__deliverAutonomousPhoneMessage("cue_mail");var duplicate=window.__deliverAutonomousPhoneMessage("cue_mail");var pending=window.__messageRewritePending();',
  ' await sleep(40);if(window.__hideMessageThumb)window.__hideMessageThumb();window.__openMessagesAt("cue_mail");await sleep(40);',
  ' var en=row("cue_mail");var english=en&&en.textContent;document.documentElement.lang="cs";if(window.__refreshPhoneText)window.__refreshPhoneText();await sleep(30);var cs=row("cue_mail");',
  ' S("success",{accepted:accepted,duplicate:duplicate,pending:pending,request:request,logs:aiLogs.splice(0),thread:window.__phoneMessageThread(),en:english,cs:cs&&cs.textContent,remaining:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);await sleep(280);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;',
  ' window.__monitorMessageRewrite=function(){return Promise.reject(new Error("offline"));};',
  ' var fallbackAccepted=window.__deliverAutonomousPhoneMessage("cue_mail");await sleep(40);if(window.__hideMessageThumb)window.__hideMessageThumb();window.__openMessagesAt("cue_mail");await sleep(40);',
  ' var fallback=row("cue_mail");S("fallback",{accepted:fallbackAccepted,logs:aiLogs.splice(0),thread:window.__phoneMessageThread(),body:fallback&&fallback.textContent,pending:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;',
  ' var voiceCalls=0;Math.random=function(){return .5;};window.__monitorMessageRewrite=function(){voiceCalls++;return Promise.resolve(JSON.stringify({en:"must not be used"}));};var hannahAccepted=window.__deliverAutonomousPhoneMessage("hannah_banter"),ireneAccepted=window.__deliverAutonomousPhoneMessage("irene_banter");window.__openMessagesAt("hannah_banter");await sleep(30);S("authoredVoices",{accepted:[hannahAccepted,ireneAccepted],rewriteCalls:voiceCalls,hannah:row("hannah_banter")&&row("hannah_banter").textContent,irene:row("irene_banter")&&row("irene_banter").textContent,pending:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;',
  ' var blockCalls=0;Math.random=function(){return .5;};window.__monitorMessageRewrite=function(){blockCalls++;return Promise.resolve(JSON.stringify({en:"must not be used"}));};var blockA=window.__deliverAutonomousPhoneMessage("pouria_farhang"),blockB=window.__deliverAutonomousPhoneMessage("hamid_verse"),blockC=window.__deliverAutonomousPhoneMessage("hamid_verse2");window.__openMessagesAt("hamid_verse2");await sleep(30);S("blocklist",{accepted:[blockA,blockB,blockC],rewriteCalls:blockCalls,pouria:row("pouria_farhang")&&row("pouria_farhang").textContent,hamid1:row("hamid_verse")&&row("hamid_verse").textContent,hamid2:row("hamid_verse2")&&row("hamid_verse2").textContent,pending:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;var originalCalls=0;Math.random=function(){return 0;};window.__monitorMessageRewrite=function(){originalCalls++;return Promise.resolve(JSON.stringify({en:"must not be used"}));};var originalAccepted=window.__deliverAutonomousPhoneMessage("athena_banter"),originalMessage=window.__chatMessagesKnowledge().filter(function(message){return message.id==="athena_banter";})[0];S("originalRoll",{accepted:originalAccepted,rewriteCalls:originalCalls,body:originalMessage&&originalMessage.text,pending:window.__messageRewritePending()});Math.random=oldRandom;',
  '}',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", harness, 3500, { patchRaf: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html autonomous message rewrites:");
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "no uncaught page errors", result.errors);
var success = result.steps.success || {}, fallback = result.steps.fallback || {};
var authoredVoices = result.steps.authoredVoices || {}, originalRoll = result.steps.originalRoll || {};
var blocklist = result.steps.blocklist || {};
check(success.accepted && !success.duplicate && success.pending.join(",") === "cue_mail",
  "one autonomous message owns one in-flight rewrite", success);
check(success.request && success.request.sender === "Bahareh" &&
  /did you check the mail/.test(success.request.en) &&
  success.request.sender_bio && success.request.sender_bio.name === "Bahareh" &&
  success.request.sender_bio.role === "Behdad's sister" &&
  success.request.sender_bio.notes === "Usually herds the children." &&
  !Object.prototype.hasOwnProperty.call(success.request, "cs"),
  "the chatbot receives the sender's bounded bio and English authored copy only", success.request);
check(success.logs && success.logs.length === 2 &&
  success.logs[0].level === "info" && success.logs[0].args[0] === "[Messages AI rewrite] sent" &&
  success.logs[0].args[1].id === "cue_mail" &&
  success.logs[0].args[1].sender === "Bahareh" &&
  success.logs[0].args[1].sender_bio.notes === "Usually herds the children." &&
  /did you check the mail/.test(success.logs[0].args[1].original) &&
  success.logs[1].level === "info" && success.logs[1].args[0] === "[Messages AI rewrite] received" &&
  success.logs[1].args[1].id === "cue_mail" &&
  /letter waiting/.test(success.logs[1].args[1].response),
  "the console records each outgoing rewrite request and returned response", success.logs);
check(success.thread.join(",") === "cue_mail" &&
  success.en === "Bahareh says there is a letter waiting for you 💌" &&
  success.cs === "koukl(a) jsi do pošty? 💌 máš tam dopis" &&
  success.remaining.length === 0,
  "the English rewrite lands once while Czech stays on its authored translation", success);
check(fallback.accepted && fallback.thread.join(",") === "cue_mail" &&
  fallback.body === "did you check the mail? 💌 there's a letter for you" &&
  fallback.pending.length === 0,
  "a failed chatbot request delivers the original authored copy unchanged", fallback);
check(fallback.logs && fallback.logs.length === 2 &&
  fallback.logs[0].level === "info" && fallback.logs[0].args[0] === "[Messages AI rewrite] sent" &&
  fallback.logs[0].args[1].id === "cue_mail" &&
  fallback.logs[1].level === "warn" &&
  fallback.logs[1].args[0] === "[Messages AI rewrite] no usable response; using original" &&
  fallback.logs[1].args[1].id === "cue_mail" &&
  fallback.logs[1].args[1].error === "offline",
  "the console records a missing AI response and the authored-copy fallback", fallback.logs);
check(authoredVoices.accepted && authoredVoices.accepted.every(Boolean) &&
  authoredVoices.rewriteCalls === 0 &&
  authoredVoices.hannah === "official gymnastics score for this dance floor: 10/10 🤸" &&
  authoredVoices.irene === "I checked: the party is not valid Python, but it still runs 🐍" &&
  authoredVoices.pending.length === 0,
  "Hannah and Irene bypass Chat and retain their authored English voices", authoredVoices);
check(originalRoll.accepted && originalRoll.rewriteCalls === 0 &&
  originalRoll.body === "schedule update: we’re exactly on time if nobody checks the schedule. ✨" &&
  originalRoll.pending.length === 0,
  "the keep-original roll bypasses Chat and delivers authored English", originalRoll);
check(blocklist.accepted && blocklist.accepted.every(Boolean) && blocklist.rewriteCalls === 0 &&
  blocklist.pouria === "Farhang, chetori chaghal?" &&
  blocklist.hamid1 === "من پسرِ باادبِ میرزامشیرم" &&
  blocklist.hamid2 === "رفتم تو آب، آب اومده تا سرِ زانوم." &&
  blocklist.pending.length === 0,
  "Pouria's Farhang line and both Hamid verses bypass Chat verbatim", blocklist);
console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
