#!/usr/bin/env node
// The garden magic-box lock uses its date as a Calendar clue and validates
// selected digits only when the single full-width submit control is pressed.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function tap(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' window.goToStage("garden");window.__setDrugsboxMonth(5);window.__drugsboxTap();',
  ' var lock=document.getElementById("garden-boxlock"),date=document.getElementById("garden-boxlock-date-hit"),submit=document.getElementById("garden-boxlock-submit");',
  ' S("shape",{date:date.previousElementSibling.previousElementSibling.textContent,submit:submit.querySelector("text").textContent,wheels:lock.querySelectorAll(".boxlock-hit").length,submits:lock.querySelectorAll(".boxlock-submit").length});',
  ' tap(date);await sleep(40);S("clue",{phone:!!document.querySelector(".calx-phone"),lock:lock.classList.contains("showing")});',
  ' var shell=document.querySelector(".phone-shell");if(shell){shell.focus();shell.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));}await sleep(260);S("clueBack",{phone:!!document.querySelector(".phone-backdrop.show")});window.__drugsboxTap();',
  ' tap(document.getElementById("garden-boxlock-hit-u"));S("selected",{locked:window.__drugsboxLocked(),unit:document.getElementById("garden-boxlock-drum-u").style.transform});',
  ' tap(submit);S("may",{locked:window.__drugsboxLocked(),popped:document.getElementById("garden-boxlock-shackle").classList.contains("popped")});',
  ' window.__resetDrugsbox();window.__setDrugsboxMonth(7);window.__drugsboxTap();tap(submit);S("wrong",{locked:window.__drugsboxLocked(),denied:submit.classList.contains("denied")});',
  ' tap(document.getElementById("garden-boxlock-hit-t"));S("julySelected",window.__drugsboxLocked());tap(submit);S("july",!window.__drugsboxLocked());',
  ' setLang("cs");S("cs",submit.querySelector("text").textContent);',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures=0;
function check(ok,msg,detail){if(ok)console.log("  \u2713 "+msg);else{failures++;console.log("  \u2717 "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}

console.log("rsvp.html garden magic-box lock:");
var r=lib.runPageSync("rsvp.html",HARNESS,2200,{patchRaf:true});
if(!r){console.log("  \u2717 harness produced no report");process.exit(1);}
var s=r.steps;
check(r.errors.length===0,"no uncaught page errors",r.errors);
check(s.shape&&s.shape.date==="2027-05-??"&&s.shape.submit==="UNLOCK"&&s.shape.wheels===2&&s.shape.submits===1,"lock shows a partial date, two wheels, and one submit control",s.shape);
check(s.clue&&s.clue.phone&&!s.clue.lock,"partial date opens the phone Calendar clue",s.clue);
check(s.clueBack&&!s.clueBack.phone,"Escape closes the magic-box Calendar instead of exposing the launcher",s.clueBack);
check(s.selected&&s.selected.locked&&/-40px/.test(s.selected.unit||""),"selecting the correct May digits does not auto-unlock",s.selected);
check(s.may&&!s.may.locked&&s.may.popped,"submit unlocks a correct May 01 answer",s.may);
check(s.wrong&&s.wrong.locked&&s.wrong.denied,"submit rejects an incorrect July answer",s.wrong);
check(s.julySelected&&s.july,"correct July 10 remains locked until submit",{selected:s.julySelected,submitted:s.july});
check(s.cs==="ODEMKNOUT","submit label follows the Czech language",s.cs);

console.log("");
if(failures){console.log(failures+" check(s) failed.");process.exit(1);}
console.log("All checks passed.");
