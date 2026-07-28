#!/usr/bin/env node
// Autonomous authored Messages rewrite English when Chat succeeds, always keep the
// authored Czech translation, and fall back to English dictionary copy on failure.
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
  ' window.__monitorMessageRewrite=function(value){request=value;return Promise.resolve(JSON.stringify({en:"Hannah gives this dance floor a perfect 10/10 🤸"}));};',
  ' var accepted=window.__deliverAutonomousPhoneMessage("hannah_banter");var duplicate=window.__deliverAutonomousPhoneMessage("hannah_banter");var pending=window.__messageRewritePending();',
  ' await sleep(40);if(window.__hideMessageThumb)window.__hideMessageThumb();window.__openMessagesAt("hannah_banter");await sleep(40);',
  ' var en=row("hannah_banter");var english=en&&en.textContent;document.documentElement.lang="cs";if(window.refreshPhoneText)window.refreshPhoneText();await sleep(30);var cs=row("hannah_banter");',
  ' S("success",{accepted:accepted,duplicate:duplicate,pending:pending,request:request,logs:aiLogs.splice(0),thread:window.__phoneMessageThread(),en:english,cs:cs&&cs.textContent,remaining:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;',
  ' window.__monitorMessageRewrite=function(){return Promise.reject(new Error("offline"));};',
  ' var fallbackAccepted=window.__deliverAutonomousPhoneMessage("cue_mail");await sleep(40);if(window.__hideMessageThumb)window.__hideMessageThumb();window.__openMessagesAt("cue_mail");await sleep(40);',
  ' var fallback=row("cue_mail");S("fallback",{accepted:fallbackAccepted,logs:aiLogs.splice(0),thread:window.__phoneMessageThread(),body:fallback&&fallback.textContent,pending:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;',
  ' var originalCalls=0;Math.random=function(){return 0;};window.__monitorMessageRewrite=function(){originalCalls++;return Promise.resolve(JSON.stringify({en:"must not be used"}));};var originalAccepted=window.__deliverAutonomousPhoneMessage("hannah_banter");window.__openMessagesAt("hannah_banter");await sleep(30);var originalBody=row("hannah_banter");S("originalRoll",{accepted:originalAccepted,rewriteCalls:originalCalls,body:originalBody&&originalBody.textContent,pending:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;',
  ' var blockCalls=0;Math.random=function(){return .5;};window.__monitorMessageRewrite=function(){blockCalls++;return Promise.resolve(JSON.stringify({en:"must not be used"}));};var blockA=window.__deliverAutonomousPhoneMessage("pouria_farhang"),blockB=window.__deliverAutonomousPhoneMessage("hamid_verse"),blockC=window.__deliverAutonomousPhoneMessage("hamid_verse2");window.__openMessagesAt("hamid_verse2");await sleep(30);S("blocklist",{accepted:[blockA,blockB,blockC],rewriteCalls:blockCalls,pouria:row("pouria_farhang")&&row("pouria_farhang").textContent,hamid1:row("hamid_verse")&&row("hamid_verse").textContent,hamid2:row("hamid_verse2")&&row("hamid_verse2").textContent,pending:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;',
  ' var tabRequest=null,tabRolls=[0,.5];Math.random=function(){return tabRolls.length?tabRolls.shift():.5;};window.__monitorMessageRewrite=function(value){tabRequest=value;return Promise.resolve(JSON.stringify({en:"AI-rephrased Tab message"}));};',
  ' var tabEnId=window.__deliverRandomContextText();await sleep(40);window.__openMessagesAt(tabEnId);await sleep(30);var tabEnBody=row(tabEnId);S("tabEn",{id:tabEnId,request:tabRequest,body:tabEnBody&&tabEnBody.textContent,pending:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);await sleep(50);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="cs";window.__secondRound=true;var czechRewriteCalls=0;Math.random=function(){return 0;};window.__monitorMessageRewrite=function(){czechRewriteCalls++;return Promise.resolve(JSON.stringify({en:"must not be used"}));};',
  ' var tabCsId=window.__deliverRandomContextText();window.__openMessagesAt(tabCsId);await sleep(30);var tabCsBody=row(tabCsId);S("tabCs",{id:tabCsId,rewriteCalls:czechRewriteCalls,body:tabCsBody&&tabCsBody.textContent,pending:window.__messageRewritePending()});Math.random=oldRandom;',
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
var originalRoll = result.steps.originalRoll || {}, blocklist = result.steps.blocklist || {};
var tabEn = result.steps.tabEn || {}, tabCs = result.steps.tabCs || {};
check(success.accepted && !success.duplicate && success.pending.join(",") === "hannah_banter",
  "one autonomous message owns one in-flight rewrite", success);
check(success.request && success.request.sender === "Hannah" &&
  /official gymnastics score/.test(success.request.en) &&
  success.request.sender_bio && success.request.sender_bio.name === "Hannah" &&
  success.request.sender_bio.role === "Behdad's niece" &&
  success.request.sender_bio.relationship === "Baharak & Payman's daughter" &&
  success.request.sender_bio.fun_fact === "gymnast. learning piano." &&
  !Object.prototype.hasOwnProperty.call(success.request, "cs"),
  "the chatbot receives the sender's bounded bio and English authored copy only", success.request);
check(success.logs && success.logs.length === 2 &&
  success.logs[0].level === "info" && success.logs[0].args[0] === "[Messages AI rewrite] sent" &&
  success.logs[0].args[1].id === "hannah_banter" &&
  success.logs[0].args[1].sender === "Hannah" &&
  success.logs[0].args[1].sender_bio.fun_fact === "gymnast. learning piano." &&
  /official gymnastics score/.test(success.logs[0].args[1].original) &&
  success.logs[1].level === "info" && success.logs[1].args[0] === "[Messages AI rewrite] received" &&
  success.logs[1].args[1].id === "hannah_banter" &&
  /perfect 10\/10/.test(success.logs[1].args[1].response),
  "the console records each outgoing rewrite request and returned response", success.logs);
check(success.thread.join(",") === "hannah_banter" &&
  success.en === "Hannah gives this dance floor a perfect 10/10 🤸" &&
  success.cs === "oficiální gymnastická známka pro tenhle parket: 10/10 🤸" &&
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
check(originalRoll.accepted && originalRoll.rewriteCalls === 0 &&
  originalRoll.body === "official gymnastics score for this dance floor: 10/10 🤸" &&
  originalRoll.pending.length === 0,
  "the keep-original roll bypasses Chat and delivers authored English", originalRoll);
check(blocklist.accepted && blocklist.accepted.every(Boolean) && blocklist.rewriteCalls === 0 &&
  blocklist.pouria === "Farhang, chetori chaghal?" &&
  blocklist.hamid1 === "من پسرِ باادبِ میرزامشیرم" &&
  blocklist.hamid2 === "رفتم تو آب، آب اومده تا سرِ زانوم." &&
  blocklist.pending.length === 0,
  "Pouria's Farhang line and both Hamid verses bypass Chat verbatim", blocklist);
check(tabEn.id === "cue_mail" && tabEn.request &&
  tabEn.request.en === "did you check the mail? 💌 there's a letter for you" &&
  tabEn.body === "AI-rephrased Tab message" && tabEn.pending.length === 0,
  "the English Tab shortcut takes the message-rewrite trip", tabEn);
check(tabCs.id === "cue_mail" && tabCs.rewriteCalls === 0 &&
  tabCs.body === "koukl(a) jsi do pošty? 💌 máš tam dopis" &&
  tabCs.pending.length === 0,
  "the Czech Tab shortcut immediately uses its authored translation", tabCs);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
