#!/usr/bin/env node
// Both magic-box trip cues randomize sender and copy independently at delivery.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function randomSeq(values){var i=0;Math.random=function(){return values[Math.min(i++,values.length-1)];};}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){',
  ' window.__secondRound=true;randomSeq([0,0]);window.__deliverPhoneMessage("sina_helpers");if(window.__hideMessageThumb)window.__hideMessageThumb();',
  ' randomSeq([.999,.999]);window.__deliverPhoneMessage("alireza_vitamin");if(window.__hideMessageThumb)window.__hideMessageThumb();',
  ' window.phone.open("messages");await sleep(80);var rows=[].slice.call(document.querySelectorAll(".pm-msg-row"));S("english",rows.map(function(r){return {from:r.querySelector(".pm-msg-from").textContent,body:r.querySelector(".pm-msg-text").textContent};}));',
  ' setLang("cs");await sleep(30);rows=[].slice.call(document.querySelectorAll(".pm-msg-row"));S("czech",rows.map(function(r){return {from:r.querySelector(".pm-msg-from").textContent,body:r.querySelector(".pm-msg-text").textContent};}));',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html randomized trip messages:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3500, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var en = r.steps.english, cs = r.steps.czech;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(en.length === 2 && en[0].from === "Alireza" && en[1].from === "Chinnell", "both trip cues draw independently from the seven-sender pool in chronological order", en);
check(en[0].body === "Vitamin time? 💊" && en[1].body === "take a little trip? 🌈", "both trip cues draw independently from the six-line pool in chronological order", en);
check(cs[0].from === "Alireza" && cs[1].from === "Chinnell" && cs[0].body === "Čas na vitamíny? 💊" && cs[1].body === "dáme si malý výlet? 🌈", "frozen choices retain their chronological identity across Czech translation", cs);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
