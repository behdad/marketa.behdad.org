#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  'window.__openPhoneApp("calculator");var shell=document.querySelector(".phone-shell");',
  'function key(t){return Array.from(shell.querySelectorAll(".pc-key")).find(function(b){return b.textContent===t;});}',
  'function snap(){var a=shell.querySelector(".pc-abacus"),rods=a.querySelectorAll(".pc-abacus-rod");return {label:a.getAttribute("aria-label"),rods:rods.length,overflow:!!a.querySelector(".pc-abacus-overflow"),gap:a.style.getPropertyValue("--abacus-gap"),rodWidth:a.style.getPropertyValue("--rod-width"),run:Number(a.dataset.animationRun||0)};}',
  'var a=shell.querySelector(".pc-abacus");',
  'var initialBead=a.querySelector(".pc-bead").getBoundingClientRect();S("initial",{alwaysVisible:getComputedStyle(a).display==="flex",atBottom:a===shell.querySelector(".phone-calc").lastElementChild,label:a.getAttribute("aria-label"),keyHeight:key("7").getBoundingClientRect().height,beadWidth:initialBead.width,beadHeight:initialBead.height});',
  '["1","2","3","⌫"].forEach(function(t){key(t).click();});S("backspace",{display:shell.querySelector(".pc-display").textContent,label:key("⌫").getAttribute("aria-label"),percentGone:!key("%")});',
  'key("AC").click();["1","2","3","4","5","6","7","8","9","0"].forEach(function(t){key(t).click();});S("compressed",snap());',
  'key("AC").click();["7","+","8"].forEach(function(t){key(t).click();});',
  'var seen=[];new MutationObserver(function(){seen.push(a.getAttribute("aria-label"));}).observe(a,{attributes:true,attributeFilter:["aria-label"]});',
  'key("=").click();S("additionStart",snap());',
  'setTimeout(function(){try{S("additionEnd",{snap:snap(),display:shell.querySelector(".pc-display").textContent,seen:seen.slice()});var run=snap().run;key("=").click();S("replay",{before:run,after:snap().run,label:snap().label});',
  'setTimeout(function(){try{key("AC").click();["1","2","×","1","2","="].forEach(function(t){key(t).click();});S("multiplyStart",snap());',
  'setTimeout(function(){try{S("multiplyEnd",{snap:snap(),display:shell.querySelector(".pc-display").textContent});',
  'key("AC").click();["9","9","9","9","9","9","9","9","9","9","9","9","×","9","9","9","9","9","9","9","9","9","9","9","9","="].forEach(function(t){key(t).click();});',
  'setTimeout(function(){try{S("overflow",snap());}catch(e){window.__errs.push("overflow: "+String(e&&e.stack||e));}finish();},2500);',
  '}catch(e){window.__errs.push("multiply: "+String(e&&e.stack||e));finish();}},650);',
  '}catch(e){window.__errs.push("replay: "+String(e&&e.stack||e));finish();}},80);',
  '}catch(e){window.__errs.push("addition: "+String(e&&e.stack||e));finish();}},1900);',
  'function finish(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));finish();}},250);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html phone calculator abacus:");
var r = lib.runPageSync("rsvp.html", HARNESS, 7200, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.initial.alwaysVisible && s.initial.atBottom && s.initial.label === "Abacus result: 0", "abacus is always visible at the bottom and starts at zero", s.initial);
check(s.initial.beadWidth >= 10 && s.initial.beadHeight >= 5, "initial layout gives beads their full horizontal shape", s.initial);
check(s.initial.keyHeight <= 42, "calculator keys are shortened to leave room for the abacus", s.initial.keyHeight);
check(s.backspace.display === "12" && s.backspace.label === "Backspace" && s.backspace.percentGone, "backspace replaces percent and removes one entered digit", s.backspace);
check(s.compressed.rods === 10 && Number(s.compressed.gap.replace("px", "")) <= 2 && Number(s.compressed.rodWidth.replace("px", "")) < 22, "extra columns compress rod width and spacing instead of clipping", s.compressed);
check(s.additionStart.label === "Abacus result: 7", "addition animation begins from the left operand", s.additionStart);
check(s.additionEnd.display === "15" && s.additionEnd.snap.label === "Abacus result: 15", "addition finishes on the exact displayed result", s.additionEnd);
check(s.additionEnd.seen.some(function(x){return x === "Abacus result: 10";}), "addition animates through the units carry into ten", s.additionEnd.seen);
check(s.replay.after === s.replay.before + 1 && s.replay.label === "Abacus result: 7", "pressing = again replays the same operation from its original operand", s.replay);
check(s.multiplyStart.label === "Abacus result: 0", "multiplication starts from a cleared accumulator", s.multiplyStart);
check(s.multiplyEnd.display === "144" && s.multiplyEnd.snap.label === "Abacus result: 144", "multiplication accumulates partial products to the final result", s.multiplyEnd);
check(s.overflow.overflow && s.overflow.rods === 0 && s.overflow.label === "Too many digits for the abacus", "an over-capacity result replaces the rods with an accessible infinity", s.overflow);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
