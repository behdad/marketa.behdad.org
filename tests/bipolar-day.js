#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function day(host,n){return [].find.call(host.querySelectorAll(".calx-day:not(.calx-out)"),function(e){var x=e.querySelector(".calx-num");return x&&x.textContent.trim()===String(n);});}',
  'function fill(sel){var e=document.querySelector(sel);return e&&getComputedStyle(e).fill;}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' document.hasFocus=function(){return true;};window.__gameStarted=function(){return true;};',
  ' window.__jumpToDate(2027,2,1);window.__openPhoneAppHere("calendar");await sleep(40);',
  ' var ph=document.querySelector(".calx-phone"),d30=day(ph,30);',
  ' S("english",{label:d30&&d30.getAttribute("aria-label"),icon:d30&&d30.querySelector(".calx-mk")&&d30.querySelector(".calx-mk").textContent});',
  ' setLang("cs");await sleep(30);ph=document.querySelector(".calx-phone");d30=day(ph,30);',
  ' S("czech",{label:d30&&d30.getAttribute("aria-label")});',
  ' d30.click();await sleep(40);',
  ' S("active",{date:new URL(location.href).searchParams.get("date"),classOn:document.getElementById("loft-game-strip").classList.contains("bipolar-day"),phoneOpen:!!document.querySelector(".phone-backdrop.show"),his:fill(\'#cuddly-behdad [fill="#e9bfc4"]\'),hers:fill(\'#cuddly-marketa [fill="#bcd1e7"]\')});',
  ' window.__jumpToDate(2027,2,31);',
  ' S("reset",{classOn:document.getElementById("loft-game-strip").classList.contains("bipolar-day"),his:fill(\'#cuddly-behdad [fill="#e9bfc4"]\'),hers:fill(\'#cuddly-marketa [fill="#bcd1e7"]\')});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html World Bipolar Day:");
var r = lib.runPageSync("rsvp.html", HARNESS, 2200, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.english && /World Bipolar Day/.test(s.english.label || "") && /🧲/.test(s.english.icon || ""),
  "March 30 is labelled with its magnet in English", s.english);
check(s.czech && /Světový den bipolární poruchy/.test(s.czech.label || ""),
  "the occasion label is localized in Czech", s.czech);
check(s.active && s.active.date === "2027-03-30" && s.active.classOn && !s.active.phoneOpen &&
  s.active.his === "rgb(188, 209, 231)" && s.active.hers === "rgb(233, 191, 196)",
  "selecting the occasion dismisses Calendar and swaps the hosts' suit palettes", s.active);
check(s.reset && !s.reset.classOn && s.reset.his === "rgb(233, 191, 196)" &&
  s.reset.hers === "rgb(188, 209, 231)",
  "leaving March 30 restores the normal palettes", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
