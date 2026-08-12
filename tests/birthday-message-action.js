#!/usr/bin/env node
// Exact-day birthdays stay opt-in; each repeatable Celebrate runs the cake before its postcard.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'var report={errors:[]};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},500);});',
  'async function run(){',
  ' window.__monitorMessageRewrite=null;',
  ' var automaticCards=0,postcardRenders=0,openedOcc=null;',
  ' window.__shareCard=function(occ){automaticCards++;openedOcc=occ;return Promise.resolve("card");};',
  ' window.__shareCardDataURL=function(){postcardRenders++;return Promise.resolve("data:image/png;base64,test");};',
  ' var intro=document.getElementById("click-me-overlay");if(intro)intro.click();await sleep(100);',
  ' report.phaseOne={phase2:!!window.__secondRound,message:window.__phoneMessageReceived("bd_marketa"),card:automaticCards,cake:!!window.__bdCakeOn};',
  ' window.__setPartyMode(true,true,false);await sleep(350);',
  ' report.partyStart={phase2:!!window.__secondRound,message:window.__phoneMessageReceived("bd_marketa"),card:automaticCards,inlineRenders:postcardRenders,cake:!!window.__bdCakeOn};',
  ' window.__openMessagesAt("bd_marketa");await sleep(80);',
  ' var row=document.querySelector(".pm-msg-row[data-message-id=bd_marketa]"),action=row&&row.querySelector(".pm-msg-act.bd-celebrate");',
  ' report.english={sender:row&&row.querySelector(".pm-msg-from").textContent,body:row&&row.querySelector(".pm-msg-text").textContent,label:action&&action.textContent.trim(),available:!!action};',
  ' window.__setLang("cs");await sleep(60);row=document.querySelector(".pm-msg-row[data-message-id=bd_marketa]");action=row&&row.querySelector(".pm-msg-act.bd-celebrate");',
  ' report.czech={body:row&&row.querySelector(".pm-msg-text").textContent,label:action&&action.textContent.trim()};',
  ' var checkpoint=window.__checkpointPhoneCapture();window.__resetPhoneApps();window.__checkpointPhoneRestore(checkpoint);window.__loftControllers.phone.open("messages");await sleep(80);',
  ' row=document.querySelector(".pm-msg-row[data-message-id=bd_marketa]");action=row&&row.querySelector(".pm-msg-act.bd-celebrate");report.restored={message:window.__phoneMessageReceived("bd_marketa"),available:!!action,state:window.__messageActionState("bd_marketa")};',
  ' window.__setLang("en");if(action)action.click();await sleep(420);',
  ' report.started={card:automaticCards,cake:!!window.__bdCakeOn,party:!!window.__gardenPartyOn,room:window.__currentStageName,state:window.__messageActionState("bd_marketa"),flow:window.__birthdayCelebrationState()};',
  ' checkpoint=window.__checkpointPhoneCapture();window.__resetPhoneApps();window.__endBdCakeCutting();window.__checkpointPhoneRestore(checkpoint);await sleep(900);',
  ' report.resumed={card:automaticCards,cake:!!window.__bdCakeOn,state:window.__messageActionState("bd_marketa"),flow:window.__birthdayCelebrationState()};',
  ' window.__completeBdCakeCutting();await sleep(80);report.completed={card:automaticCards,occ:openedOcc&&openedOcc.id,cake:!!window.__bdCakeOn,state:window.__messageActionState("bd_marketa"),flow:window.__birthdayCelebrationState()};',
  ' window.dispatchEvent(new CustomEvent("loft:sharecardclose"));window.__runMsgAction("bd_marketa");await sleep(420);report.repeatStarted={card:automaticCards,cake:!!window.__bdCakeOn,state:window.__messageActionState("bd_marketa")};',
  ' window.__completeBdCakeCutting();await sleep(80);report.repeatCompleted={card:automaticCards,occ:openedOcc&&openedOcc.id,cake:!!window.__bdCakeOn,state:window.__messageActionState("bd_marketa")};',
  '}',
  '})();',
  '</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message); if (detail != null) console.log("      " + JSON.stringify(detail)); }
}

console.log("loft-day.html birthday message action:");
var r = lib.runPageSync("loft-day.html", HARNESS, 7000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2031-01-20"
});

check(r && !r.phaseOne.phase2 && !r.phaseOne.message && r.phaseOne.card === 0 && !r.phaseOne.cake,
  "phase one holds the birthday greeting and celebration", r && r.phaseOne);
check(r && r.partyStart.phase2 && r.partyStart.message && r.partyStart.card === 0 && r.partyStart.inlineRenders === 0 && !r.partyStart.cake,
  "starting Party releases only the greeting, without a postcard render or cake", r && r.partyStart);
check(r && r.english.available && r.english.sender === "behdad" && /birthday.*Markéta/i.test(r.english.body) && /Celebrate/.test(r.english.label),
  "the other host sends an English birthday greeting with a labeled action", r && r.english);
check(r && /Markéta/.test(r.czech.body) && /Oslavit/.test(r.czech.label),
  "the greeting and action relocalize in Czech", r && r.czech);
check(r && r.restored.message && r.restored.available && r.restored.state === null,
  "an ignored Celebrate action remains available through a checkpoint round trip", r && r.restored);
check(r && r.started.card === 0 && r.started.cake && r.started.party && r.started.room === "garden" && r.started.state === null && r.started.flow.queue[0].phase === "cake",
  "Celebrate starts the cake without opening or consuming the postcard action", r && r.started);
check(r && r.resumed.card === 0 && r.resumed.cake && r.resumed.state === null && r.resumed.flow.queue[0].phase === "cake",
  "an in-flight celebration survives a checkpoint by replaying its transient cake", r && r.resumed);
check(r && r.completed.card === 1 && r.completed.occ === "marketa" && !r.completed.cake && r.completed.state === null && r.completed.flow.queue.length === 0,
  "the matching postcard opens only after natural cake completion", r && r.completed);
check(r && r.repeatStarted.card === 1 && r.repeatStarted.cake && r.repeatStarted.state === null && r.repeatCompleted.card === 2 && r.repeatCompleted.occ === "marketa" && !r.repeatCompleted.cake && r.repeatCompleted.state === null,
  "Celebrate remains available and repeats cake-first before a second postcard", { started: r && r.repeatStarted, completed: r && r.repeatCompleted });
check(r && r.errors.length === 0, "no uncaught JavaScript errors", r && r.errors);

console.log("");
if (failures) { console.log(failures + " birthday message action assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("All checks passed.");
