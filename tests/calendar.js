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
  ' var phoneSearchHost=document.querySelector(".calx-phone");phoneSearchHost.querySelector(".calx-search-btn").click();await sleep(30);phoneSearchHost=document.querySelector(".calx-phone");var phoneSearch=phoneSearchHost.querySelector(".calx-search-input");phoneSearch.dispatchEvent(new KeyboardEvent("keydown",{key:"Backspace",bubbles:true,cancelable:true}));await sleep(20);S("phoneSearchBackspace",{open:!!document.querySelector(".phone-backdrop.show"),on:!!phoneSearchHost.querySelector(".calx-search-btn.is-on"),same:phoneSearchHost.querySelector(".calx-search-input")===phoneSearch,active:document.activeElement===phoneSearch});phoneSearchHost.querySelector(".calx-search-btn").click();await sleep(20);',
  ' var ph=document.querySelector(".calx-phone");var prow=ph.querySelectorAll(".calx-card-row")[0];prow.click();await sleep(30);ph=document.querySelector(".calx-phone");',
  ' var pday=day(ph,1);if(pday)pday.dispatchEvent(new MouseEvent("mouseenter",{bubbles:false}));await sleep(240);var tip=document.querySelector(".egg-bubble.phone-tooltip");S("phoneTip",{shown:!!tip,text:tip&&tip.textContent,z:tip&&getComputedStyle(tip).zIndex});if(pday)pday.dispatchEvent(new MouseEvent("mouseleave",{bubbles:false}));',
  ' S("phone",{title:title(ph),sameDate:ymd()===before,sameHref:location.href===href,selected:selected(ph),open:!!ph});',
  ' for(var i=0;i<7;i++){ph.querySelectorAll(".calx-nav")[2].click();ph=document.querySelector(".calx-phone");}var bd=day(ph,7);bd.focus();await sleep(240);tip=document.querySelector(".egg-bubble.phone-tooltip.show");S("phoneKeyTip",{shown:!!tip,text:tip&&tip.textContent,focus:document.activeElement===bd});bd.blur();',
  ' var pt={clientX:bd.getBoundingClientRect().left+2,clientY:bd.getBoundingClientRect().top+2};touch(bd,"touchstart",[pt]);await sleep(390);tip=document.querySelector(".egg-bubble.phone-tooltip.show");var prevented=touch(bd,"touchend",[]);S("phoneTouchTip",{shown:!!tip,text:tip&&tip.textContent,prevented:prevented});bd.dispatchEvent(new MouseEvent("mousedown",{bubbles:true}));',
  ' var mon=document.getElementById("office-monitor"),pc=document.getElementById("office-pc-desk-trio");pc.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__openMonitorApp("calendar");await sleep(40);',
  ' var monitorSearchHost=document.getElementById("monitor-cal-body");monitorSearchHost.querySelector(".calx-search-btn").click();await sleep(30);var monitorSearch=monitorSearchHost.querySelector(".calx-search-input");monitorSearch.dispatchEvent(new KeyboardEvent("keydown",{key:"Backspace",bubbles:true,cancelable:true}));await sleep(20);S("monitorSearchBackspace",{open:mon.classList.contains("show-calendar"),on:!!monitorSearchHost.querySelector(".calx-search-btn.is-on"),same:monitorSearchHost.querySelector(".calx-search-input")===monitorSearch,active:document.activeElement===monitorSearch});monitorSearchHost.querySelector(".calx-search-btn").click();await sleep(20);',
  ' var mh=document.getElementById("monitor-cal-body"),mrows=mh.querySelectorAll(".calx-card-row"),mrow=mrows[mrows.length-1];mrow.click();await sleep(30);',
  ' S("monitor",{title:title(mh),sameDate:ymd()===before,sameHref:location.href===href,selected:selected(mh)});',
  ' var canada=day(mh,1);canada.click();await sleep(160);mh=document.getElementById("monitor-cal-body");S("canada",{date:new URL(location.href).searchParams.get("date"),room:window.currentStageName,party:!!window.__gardenPartyOn,dusk:document.getElementById("stage-balcony").classList.contains("dusk"),smoking:document.getElementById("balcony-smoker").classList.contains("smoking")});',
  ' window.__applySeason("newyear");await sleep(160);S("newyear",{room:window.currentStageName,party:!!window.__gardenPartyOn,dusk:document.getElementById("stage-balcony").classList.contains("dusk"),smoking:document.getElementById("balcony-smoker").classList.contains("smoking"),date:new URL(location.href).searchParams.get("date"),dateNav:getComputedStyle(document.querySelector(".loft-datenav")).display,timeNav:getComputedStyle(document.getElementById("loft-timenav")).display,reset:getComputedStyle(document.getElementById("loft-datereset")).display,dateText:document.getElementById("loft-datepill-txt").textContent});',
  ' var d=day(mh,12);d.click();await sleep(40);var gd=window.__seasonDate();S("grid",{date:new URL(location.href).searchParams.get("date"),selected:selected(mh),preview:window.__seasonPreviewName(),effective:[gd.y,gd.m,gd.d]});',
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
check(s.phoneSearchBackspace&&s.phoneSearchBackspace.open&&s.phoneSearchBackspace.on&&s.phoneSearchBackspace.same&&s.phoneSearchBackspace.active,"Backspace leaves phone Calendar search open and focused",s.phoneSearchBackspace);
check(s.phoneTip&&s.phoneTip.shown&&s.phoneTip.text&&Number(s.phoneTip.z)>65,"phone occasion and birthday tooltips paint above the phone",s.phoneTip);
check(s.phoneKeyTip&&s.phoneKeyTip.shown&&/Irene/.test(s.phoneKeyTip.text||"")&&s.phoneKeyTip.focus,"phone birthday tooltip opens promptly from keyboard focus",s.phoneKeyTip);
check(s.phoneTouchTip&&s.phoneTouchTip.shown&&/Irene/.test(s.phoneTouchTip.text||"")&&s.phoneTouchTip.prevented,"phone birthday tooltip opens on long press without also activating the date",s.phoneTouchTip);
check(s.monitor&&/July|červenec/i.test(s.monitor.title||"")&&s.monitor.sameDate&&s.monitor.sameHref&&!s.monitor.selected,"monitor event card reveals July without activating its date",s.monitor);
check(s.monitorSearchBackspace&&s.monitorSearchBackspace.open&&s.monitorSearchBackspace.on&&s.monitorSearchBackspace.same&&s.monitorSearchBackspace.active,"Backspace leaves monitor Calendar search open and focused",s.monitorSearchBackspace);
check(s.canada&&s.canada.date==="2027-07-01"&&s.canada.room==="balcony"&&s.canada.party&&!s.canada.dusk&&s.canada.smoking,"Canada Day selection opens a daytime balcony BBQ party",s.canada);
check(s.newyear&&s.newyear.room==="balcony"&&s.newyear.party&&s.newyear.dusk&&s.newyear.smoking,"New Year opens a nighttime balcony BBQ party",s.newyear);
check(s.newyear&&s.newyear.date==="2027-12-31"&&s.newyear.dateNav!=="none"&&s.newyear.timeNav!=="none"&&s.newyear.reset!=="none","user-driven season previews write their date to the URL and reveal Reset",s.newyear);
check(s.newyear&&/Dec 31/.test(s.newyear.dateText||""),"season controls show the selected pretend date",s.newyear);
check(s.grid&&s.grid.date==="2027-07-12"&&s.grid.selected==="12"&&s.grid.preview===null&&s.grid.effective.join("-")==="2027-6-12","calendar grid day replaces the season-preview URL and remains the effective date",s.grid);

console.log("");
if(failures){console.log(failures+" check(s) failed.");process.exit(1);}
console.log("All checks passed.");
