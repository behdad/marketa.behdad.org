#!/usr/bin/env node
// Wedding cards reveal their month on both calendar surfaces without activating
// the event date. Grid days remain the explicit date-activation control.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function selected(host){var e=host&&host.querySelector(".calx-day.calx-sel .calx-num");return e&&e.textContent.trim();}',
  'function title(host){var e=host&&host.querySelector(".calx-title");return e&&e.textContent.trim();}',
  'function day(host,n){return [].find.call(host.querySelectorAll(".calx-day:not(.calx-out)"),function(e){var x=e.querySelector(".calx-num");return x&&x.textContent.trim()===String(n);});}',
  'function touch(el,type,pts){var e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,"touches",{value:pts});el.dispatchEvent(e);return e.defaultPrevented;}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' function ymd(){var n=window.__now();return [n.getFullYear(),n.getMonth(),n.getDate()].join("-");}',
  ' var before=ymd(),href=location.href;',
  ' window.__openPhoneAppHere("calendar");await sleep(40);',
  ' var ph=document.querySelector(".calx-phone");var prow=ph.querySelectorAll(".calx-card-row")[0];prow.click();await sleep(30);ph=document.querySelector(".calx-phone");',
  ' var pday=day(ph,1);if(pday)pday.dispatchEvent(new MouseEvent("mouseenter",{bubbles:false}));await sleep(240);var tip=document.querySelector(".egg-bubble.phone-tooltip");S("phoneTip",{shown:!!tip,text:tip&&tip.textContent,z:tip&&getComputedStyle(tip).zIndex});if(pday)pday.dispatchEvent(new MouseEvent("mouseleave",{bubbles:false}));',
  ' S("phone",{title:title(ph),sameDate:ymd()===before,sameHref:location.href===href,selected:selected(ph),open:!!ph});',
  ' for(var i=0;i<7;i++){ph.querySelectorAll(".calx-nav")[2].click();ph=document.querySelector(".calx-phone");}var bd=day(ph,27);bd.focus();await sleep(240);tip=document.querySelector(".egg-bubble.phone-tooltip.show");S("phoneKeyTip",{shown:!!tip,text:tip&&tip.textContent,focus:document.activeElement===bd});bd.blur();',
  ' var pt={clientX:bd.getBoundingClientRect().left+2,clientY:bd.getBoundingClientRect().top+2};touch(bd,"touchstart",[pt]);await sleep(390);tip=document.querySelector(".egg-bubble.phone-tooltip.show");var prevented=touch(bd,"touchend",[]);S("phoneTouchTip",{shown:!!tip,text:tip&&tip.textContent,prevented:prevented});bd.dispatchEvent(new MouseEvent("mousedown",{bubbles:true}));',
  ' var mon=document.getElementById("office-monitor"),pc=document.getElementById("office-pc-desk-trio");pc.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__openMonitorApp("calendar");await sleep(40);',
  ' var mh=document.getElementById("monitor-cal-body"),mrows=mh.querySelectorAll(".calx-card-row"),mrow=mrows[mrows.length-1];mrow.click();await sleep(30);',
  ' S("monitor",{title:title(mh),sameDate:ymd()===before,sameHref:location.href===href,selected:selected(mh)});',
  ' var d=day(mh,12);d.click();await sleep(40);S("grid",{date:new URL(location.href).searchParams.get("date"),selected:selected(mh)});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}

console.log("rsvp.html calendar event navigation:");
var r=lib.runPageSync("rsvp.html",HARNESS,2200,{patchRaf:true});
if(!r){console.log("  ✗ harness produced no report");process.exit(1);}
var s=r.steps;
check(r.errors.length===0,"no uncaught page errors",r.errors);
check(s.phone&&/May|květ/i.test(s.phone.title||"")&&s.phone.sameDate&&s.phone.sameHref&&!s.phone.selected&&s.phone.open,"phone event card reveals May without activating its date",s.phone);
check(s.phoneTip&&s.phoneTip.shown&&s.phoneTip.text&&Number(s.phoneTip.z)>65,"phone occasion and birthday tooltips paint above the phone",s.phoneTip);
check(s.phoneKeyTip&&s.phoneKeyTip.shown&&/Ali/.test(s.phoneKeyTip.text||"")&&s.phoneKeyTip.focus,"phone birthday tooltip opens promptly from keyboard focus",s.phoneKeyTip);
check(s.phoneTouchTip&&s.phoneTouchTip.shown&&/Ali/.test(s.phoneTouchTip.text||"")&&s.phoneTouchTip.prevented,"phone birthday tooltip opens on long press without also activating the date",s.phoneTouchTip);
check(s.monitor&&/July|červenec/i.test(s.monitor.title||"")&&s.monitor.sameDate&&s.monitor.sameHref&&!s.monitor.selected,"monitor event card reveals July without activating its date",s.monitor);
check(s.grid&&s.grid.date==="2027-07-12"&&s.grid.selected==="12","calendar grid day still activates its date",s.grid);

console.log("");
if(failures){console.log(failures+" check(s) failed.");process.exit(1);}
console.log("All checks passed.");
