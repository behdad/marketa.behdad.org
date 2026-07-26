#!/usr/bin/env node
// The first-open math lock gives way after three failed submissions while retaining
// the deliberate right-click Unlock escape hatch.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' window.__openPhoneModal();var shell=document.querySelector(".phone-shell");var ctx=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:100,clientY:100});var prevented=!shell.dispatchEvent(ctx);S("right_click",{prevented:prevented,locked:shell.classList.contains("booting"),menu:!!document.querySelector(".phone-lock-ctx")});',
  ' document.body.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,clientX:1,clientY:1}));var ok=shell.querySelector(".pb-key.pb-ok");ok.click();S("first",shell.classList.contains("booting"));ok.click();S("second",shell.classList.contains("booting"));ok.click();S("third",{locked:shell.classList.contains("booting"),home:shell.classList.contains("pm-home")});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html phone math lock:");
var r = lib.runPageSync("rsvp.html", HARNESS, 1600, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.right_click.prevented && s.right_click.locked && s.right_click.menu, "right-click still offers Unlock without immediately bypassing the lock", s.right_click);
check(s.first && s.second, "the phone remains locked after the first two failed attempts", { first: s.first, second: s.second });
check(!s.third.locked && s.third.home, "the third failed attempt automatically opens the phone home screen", s.third);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
