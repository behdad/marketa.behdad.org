#!/usr/bin/env node
// Real recovery choices must preserve the exact-day greeting across restored/restarted phone state.
"use strict";

var lib = require("./lib");

function harness(mode) {
  var phase2 = mode !== "phase1";
  var party = mode === "phase2";
  return [
    '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
    '<script>(function(){',
    'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
    'function key(key,extra){var init={key:key,bubbles:true,cancelable:true};Object.keys(extra||{}).forEach(function(k){init[k]=extra[k];});document.dispatchEvent(new KeyboardEvent("keydown",init));}',
    'async function waitFor(test,ms){var end=Date.now()+ms;while(Date.now()<end){var value=test();if(value)return value;await sleep(40);}return test();}',
    'var saved={version:1,savedAt:Date.now()-120000,progress:{room:"garden",maxUnlocked:4,solvedRooms:["kitchen","garden","cuddly","office","balcony"],seenRooms:["kitchen","garden"],phase2:' + JSON.stringify(phase2) + ',party:' + JSON.stringify(party) + ',daylight:true,bbq:false},puzzle:{},phone:{rows:[]},album:null,systems:{}};',
    'if(!sessionStorage.getItem("birthday-recovery-' + mode + '")){sessionStorage.setItem("birthday-recovery-' + mode + '","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
    'var report={errors:[]};',
    'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},500);});',
    'async function run(){',
    ' var gate=await waitFor(function(){return document.getElementById("loft-recovery-gate");},1000),buttons=gate&&gate.querySelectorAll(".loft-recovery-btn");',
    ' report.gate={shown:!!gate,message:!!window.__phoneMessageReceived("bd_marketa"),card:!!document.getElementById("sharecard-modal"),cake:!!window.__bdCakeOn};',
    mode === "restart"
      ? ' if(buttons&&buttons[1])buttons[1].click();await waitFor(function(){return !document.getElementById("loft-recovery-gate")&&document.getElementById("click-me-overlay");},3000);var intro=document.getElementById("click-me-overlay");if(intro)intro.click();await sleep(200);key("P",{shiftKey:true,code:"KeyP"});'
      : ' if(buttons&&buttons[0])buttons[0].click();await waitFor(function(){return !document.getElementById("loft-recovery-gate");},3000);' + (mode === "phase1" ? 'report.beforeParty={message:!!window.__phoneMessageReceived("bd_marketa")};key("P",{shiftKey:true,code:"KeyP"});' : ''),
    ' await sleep(1500);report.after={started:window.__gameStarted(),phase2:!!window.__secondRound,party:!!window.__gardenPartyOn,message:!!window.__phoneMessageReceived("bd_marketa"),card:!!document.getElementById("sharecard-modal"),cake:!!window.__bdCakeOn};',
    '}',
    '})();</script>'
  ].join("\n");
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message); if (detail != null) console.log("      " + JSON.stringify(detail)); }
}

function run(mode) {
  return lib.runPageSync("loft-day.html", harness(mode), 8000, {
    patchRaf: true,
    forceMotion: true,
    seedRandom: true,
    urlSuffix: "?date=2031-01-20&birthday-recovery=" + mode
  });
}

console.log("loft-day.html retained birthday greeting:");
var phase2 = run("phase2");
check(phase2 && phase2.gate.shown && !phase2.gate.message && !phase2.gate.card && !phase2.gate.cake,
  "a retained Party remains silent behind Continue", phase2 && phase2.gate);
check(phase2 && phase2.after.started && phase2.after.phase2 && phase2.after.party && phase2.after.message && !phase2.after.card && !phase2.after.cake,
  "Continue immediately adds a missing exact-day greeting without starting the ceremony", phase2 && phase2.after);
check(phase2 && phase2.errors.length === 0, "Party recovery has no uncaught errors", phase2 && phase2.errors);

var phase1 = run("phase1");
check(phase1 && phase1.gate.shown && !phase1.gate.message && phase1.beforeParty && !phase1.beforeParty.message,
  "a retained phase-one visit keeps the greeting held through Continue", phase1 && { gate: phase1.gate, beforeParty: phase1.beforeParty });
check(phase1 && phase1.after.started && phase1.after.phase2 && phase1.after.party && phase1.after.message && !phase1.after.card && !phase1.after.cake,
  "its first real Party transition releases only the greeting", phase1 && phase1.after);
check(phase1 && phase1.errors.length === 0, "phase-one recovery has no uncaught errors", phase1 && phase1.errors);

var restart = run("restart");
check(restart && restart.gate.shown && !restart.gate.message,
  "Start over begins from a retained checkpoint with no pre-entry greeting", restart && restart.gate);
check(restart && restart.after.started && restart.after.phase2 && restart.after.party && restart.after.message && !restart.after.card && !restart.after.cake,
  "Start over re-registers the exact-day greeting for its later Party", restart && restart.after);
check(restart && restart.errors.length === 0, "Start over has no uncaught errors", restart && restart.errors);

console.log("");
if (failures) { console.log(failures + " birthday recovery assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("All checks passed.");
