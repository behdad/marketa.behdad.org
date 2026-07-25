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
  'function row(id){return document.querySelector(".pm-msg-row[data-message-id="+id+"] .pm-msg-text");}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__secondRound=true;var request=null;',
  ' window.__monitorMessageRewrite=function(value){request=value;return Promise.resolve(JSON.stringify({en:"Hannah gives this dance floor a perfect 10/10 🤸"}));};',
  ' var accepted=window.__deliverAutonomousPhoneMessage("hannah_banter");var duplicate=window.__deliverAutonomousPhoneMessage("hannah_banter");var pending=window.__messageRewritePending();',
  ' await sleep(40);if(window.__hideMessageThumb)window.__hideMessageThumb();window.__openMessagesAt("hannah_banter");await sleep(40);',
  ' var en=row("hannah_banter");var english=en&&en.textContent;document.documentElement.lang="cs";if(window.refreshPhoneText)window.refreshPhoneText();await sleep(30);var cs=row("hannah_banter");',
  ' S("success",{accepted:accepted,duplicate:duplicate,pending:pending,request:request,thread:window.__phoneMessageThread(),en:english,cs:cs&&cs.textContent,remaining:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;',
  ' window.__monitorMessageRewrite=function(){return Promise.reject(new Error("offline"));};',
  ' var fallbackAccepted=window.__deliverAutonomousPhoneMessage("cue_mail");await sleep(40);if(window.__hideMessageThumb)window.__hideMessageThumb();window.__openMessagesAt("cue_mail");await sleep(40);',
  ' var fallback=row("cue_mail");S("fallback",{accepted:fallbackAccepted,thread:window.__phoneMessageThread(),body:fallback&&fallback.textContent,pending:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="en";window.__secondRound=true;',
  ' var oldRandom=Math.random,tabRequest=null;Math.random=function(){return 0;};window.__monitorMessageRewrite=function(value){tabRequest=value;return Promise.resolve(JSON.stringify({en:"AI-rephrased Tab message"}));};',
  ' var tabEnId=window.__deliverRandomContextText();await sleep(40);window.__openMessagesAt(tabEnId);await sleep(30);var tabEnBody=row(tabEnId);S("tabEn",{id:tabEnId,request:tabRequest,body:tabEnBody&&tabEnBody.textContent,pending:window.__messageRewritePending()});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);if(window.__resetPhoneApps)window.__resetPhoneApps();document.documentElement.lang="cs";window.__secondRound=true;var czechRewriteCalls=0;window.__monitorMessageRewrite=function(){czechRewriteCalls++;return Promise.resolve(JSON.stringify({en:"must not be used"}));};',
  ' var tabCsId=window.__deliverRandomContextText();window.__openMessagesAt(tabCsId);await sleep(30);var tabCsBody=row(tabCsId);S("tabCs",{id:tabCsId,rewriteCalls:czechRewriteCalls,body:tabCsBody&&tabCsBody.textContent,pending:window.__messageRewritePending()});Math.random=oldRandom;',
  '}',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", harness, 3500, { patchRaf: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  \u2713 " + message);
  else { failures++; console.log("  \u2717 " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html autonomous message rewrites:");
if (!result) {
  console.log("  \u2717 harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "no uncaught page errors", result.errors);
var success = result.steps.success || {}, fallback = result.steps.fallback || {};
var tabEn = result.steps.tabEn || {}, tabCs = result.steps.tabCs || {};
check(success.accepted && !success.duplicate && success.pending.join(",") === "hannah_banter",
  "one autonomous message owns one in-flight rewrite", success);
check(success.request && success.request.sender === "Hannah" &&
  /official gymnastics score/.test(success.request.en) &&
  !Object.prototype.hasOwnProperty.call(success.request, "cs"),
  "the chatbot receives the sender and English authored copy only", success.request);
check(success.thread.join(",") === "hannah_banter" &&
  success.en === "Hannah gives this dance floor a perfect 10/10 🤸" &&
  success.cs === "oficiální gymnastická známka pro tenhle parket: 10/10 🤸" &&
  success.remaining.length === 0,
  "the English rewrite lands once while Czech stays on its authored translation", success);
check(fallback.accepted && fallback.thread.join(",") === "cue_mail" &&
  fallback.body === "did you check the mail? 💌 there's a letter for you" &&
  fallback.pending.length === 0,
  "a failed chatbot request delivers the original authored copy unchanged", fallback);
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
