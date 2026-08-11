#!/usr/bin/env node
// Charlie's one-time phone introduction: never the first text, phase-two only, and
// tapping it opens the shared Chat app on the office computer.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}}; function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' window.__secondRound=true;',
  ' window.__monitorMessageRewrite=null;',
  ' S("before",{delivered:window.__deliverCharlieIntroNow&&window.__deliverCharlieIntroNow(),received:window.__phoneMessageReceived&&window.__phoneMessageReceived("charlie")});',
  ' var ordinary=window.__deliverPhoneMessage&&window.__deliverPhoneMessage("cue_mail"); var intro=window.__deliverCharlieIntroNow&&window.__deliverCharlieIntroNow();',
  ' S("delivery",{ordinary:ordinary,intro:intro,received:window.__phoneMessageReceived&&window.__phoneMessageReceived("charlie")});',
  ' var charlieMessages=window.__chatContext("What messages did Charlie send?").apps.messages;var charlieMessage=charlieMessages&&charlieMessages.find(function(m){return m.id==="charlie";});S("copy",{text:charlieMessage&&charlieMessage.text,messages:charlieMessages});',
  ' var tower=document.getElementById("office-pc-desk-trio"), mon=document.getElementById("office-monitor"); if(tower)tower.classList.add("on"); if(mon)mon.classList.add("here","screen-on","show-caps");',
  ' window.__monitorChatTurnstile=function(){return Promise.resolve("test-token");}; window.__runMsgAction("charlie"); await sleep(120);',
  ' S("action",{room:window.__currentStageName,chat:mon&&mon.classList.contains("show-chat"),opened:window.__monitorChatWasOpened&&window.__monitorChatWasOpened()});',
  ' if(window.__resetPhoneApps)window.__resetPhoneApps(); window.__secondRound=true; window.__deliverPhoneMessage("cue_mail");',
  ' S("once",{redelivered:window.__deliverCharlieIntroNow&&window.__deliverCharlieIntroNow(),received:window.__phoneMessageReceived&&window.__phoneMessageReceived("charlie")});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("Charlie phone introduction:");
var result = lib.runPageSync("rsvp.html", HARNESS, 4500, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.before.delivered === false && !s.before.received, "Charlie cannot be the first text", s.before);
check(s.delivery.ordinary === true && s.delivery.intro === true && s.delivery.received, "Charlie can introduce themself after an ordinary phase-two text", s.delivery);
check(!!s.copy.text && !/Esc escapes|Backspace/.test(s.copy.text), "the varied introduction stays conversational instead of appending keyboard instructions", s.copy);
check(s.action.room === "office" && s.action.chat && s.action.opened, "tapping Charlie's text opens Chat on the office computer", s.action);
check(s.once.redelivered === false && !s.once.received, "the introduction does not repeat after Chat was opened or phone state was reset", s.once);

var html = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/45000 \+ Math\.floor\(Math\.random\(\) \* 45000\)/.test(html), "production delivery waits a randomized 45–90 seconds");
check(!/CUE_POOL\s*=\s*\[[^\]]*charlie/.test(html) && !/DAY_POOL\s*=\s*\[[^\]]*charlie/.test(html), "Charlie is excluded from ordinary random message pools");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
