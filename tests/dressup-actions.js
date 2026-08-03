#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function context(el){var r=el.getBoundingClientRect();var e=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2});return !el.dispatchEvent(e);}',
  'function menu(){return document.querySelector(".dressup-ctx");}',
  'async function run(){',
  ' await window.loft.api.perform("app.open",{app:"dressup"},{source:"test"});await sleep(80);',
  ' var stage=document.querySelector(".pmd-stage"),chip=document.querySelector(".pmd-chip");chip.click();',
  ' var prevented=context(stage),m=menu(),buttons=m?[].slice.call(m.querySelectorAll("button")):[];',
  ' report.steps.menu={prevented:prevented,labels:buttons.map(function(b){return b.textContent.trim();}),saveTitle:buttons[1]&&buttons[1].title};',
  ' window.__phonePB.copy=function(p){report.steps.copyCalled=true;return Promise.resolve(p).then(function(b){report.steps.copyBlob=!!(b&&b.type==="image/png");report.steps.copySize=b&&b.size||0;return true;});};',
  ' buttons[0].click();await sleep(700);',
  ' context(stage);menu().querySelector(".ctx-save").click();await sleep(1400);var saved=(window.__albumList&&window.__albumList()[0])||{};',
  ' report.steps.saved={subject:saved.subjectId,blob:!!(saved.selfieBlob&&saved.selfieBlob.type==="image/png")};',
  ' var dl="";var oldClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){dl=this.download||"";};',
  ' context(stage);menu().querySelector(".ctx-download").click();await sleep(1400);HTMLAnchorElement.prototype.click=oldClick;report.steps.download=dl;',
  '}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, label, detail) {
  if (ok) console.log("  ✓ " + label);
  else { failures++; console.log("  ✗ " + label + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html dress-up result actions:");
var result = lib.runPageSync("rsvp.html", HARNESS, 9000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.menu && s.menu.prevented && s.menu.labels.join(",") === "Copy,Save,Download",
  "right-click offers Copy, Save, and Download", s.menu);
check(s.copyCalled && s.copyBlob && s.copySize > 5000, "Copy receives a non-empty rendered PNG", s.copySize);
check(s.saved && s.saved.subject === "dressup" && s.saved.blob, "Save adds the rendered outfit to Album", s.saved);
check(/^loft-dress-up-.*\.png$/.test(s.download || ""), "Download uses a dress-up PNG filename", s.download);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
