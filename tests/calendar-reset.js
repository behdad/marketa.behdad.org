#!/usr/bin/env node
// Calendar's shared phone/monitor Reset mirrors Clock: it appears only for an
// explicit date override, clears only that override, and localizes on both hosts.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function(){",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  function ymd(d){return [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-');}",
  "  function state(host){var b=host&&host.querySelector('.calx-today');return {exists:!!b,hidden:b&&b.hidden,disabled:b&&b.disabled,title:b&&b.title,aria:b&&b.getAttribute('aria-label')};}",
  "  var report={errors:[],steps:{}}; function S(k,v){report.steps[k]=v;}",
  "  async function run(){",
  "    var live=ymd(new Date());",
  "    history.replaceState(null,'',location.pathname+'?date=2031-02-03&time=05:31&keep=1#play');",
  "    if(window.__calReapplyDateTime)window.__calReapplyDateTime();",
  "    if(window.goToStage)window.goToStage('cuddly');",
  "    window.__openPhoneAppHere('calendar'); await sleep(40);",
  "    var phone=document.querySelector('.calx-phone'), pReset=phone&&phone.querySelector('.calx-today');",
  "    S('phoneShown',{button:state(phone),date:new URL(location.href).searchParams.get('date'),time:new URL(location.href).searchParams.get('time'),room:window.currentStageName});",
  "    if(pReset)pReset.click(); await sleep(40);",
  "    phone=document.querySelector('.calx-phone'); var pu=new URL(location.href);",
  "    S('phoneReset',{button:state(phone),now:ymd(window.__now()),live:live,date:pu.searchParams.get('date'),time:pu.searchParams.get('time'),keep:pu.searchParams.get('keep'),hash:pu.hash,room:window.currentStageName,open:!!phone});",
  "    history.replaceState(null,'',location.pathname+'?date=2032-09-18&time=05:31&keep=1#play');",
  "    if(window.__calReapplyDateTime)window.__calReapplyDateTime();",
  "    if(window.setLang)window.setLang('cs');",
  "    var mon=document.getElementById('office-monitor'),pc=document.getElementById('office-pc-desk-trio');pc.classList.add('on');mon.classList.add('here','screen-on','show-caps');window.__openMonitorApp('calendar');await sleep(40);",
  "    var host=document.getElementById('monitor-cal-body'),mReset=host&&host.querySelector('.calx-today');",
  "    S('monitorShown',{button:state(host),open:mon.classList.contains('show-calendar')});",
  "    if(mReset)mReset.click(); await sleep(40);",
  "    host=document.getElementById('monitor-cal-body'); var mu=new URL(location.href);",
  "    S('monitorReset',{button:state(host),now:ymd(window.__now()),live:live,date:mu.searchParams.get('date'),time:mu.searchParams.get('time'),keep:mu.searchParams.get('keep'),hash:mu.hash,open:mon.classList.contains('show-calendar')});",
  "    report.errors=window.__errs||[];document.getElementById('__report').textContent=JSON.stringify(report);",
  "  }",
  "  window.addEventListener('load',function(){setTimeout(function(){run().catch(function(e){report.errors.push(String(e&&e.stack||e));document.getElementById('__report').textContent=JSON.stringify(report);});},300);});",
  "})();",
  "</script>"
].join("\n");

var r=lib.runPageSync("rsvp.html",HARNESS,2600,{patchRaf:true});
if(!r){console.log("  ✗ harness produced no report");process.exit(1);}
var s=r.steps||{},failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}

console.log("rsvp.html Calendar reset:");
check(s.phoneShown&&s.phoneShown.button.exists&&!s.phoneShown.button.hidden&&!s.phoneShown.button.disabled&&s.phoneShown.button.title==="Reset date to today"&&s.phoneShown.button.aria==="Reset date to today","phone exposes an English Reset for an explicit date override",s.phoneShown);
check(s.phoneReset&&s.phoneReset.now===s.phoneReset.live&&s.phoneReset.date===null&&s.phoneReset.time==="05:31"&&s.phoneReset.keep==="1"&&s.phoneReset.hash==="#play"&&s.phoneReset.room==="cuddly"&&s.phoneReset.open,"phone Reset returns to the real date while preserving time, URL, room, and the open app",s.phoneReset);
check(s.phoneReset&&s.phoneReset.button.hidden&&s.phoneReset.button.disabled,"phone Reset hides and disables after clearing the override",s.phoneReset);
check(s.monitorShown&&s.monitorShown.button.exists&&!s.monitorShown.button.hidden&&!s.monitorShown.button.disabled&&s.monitorShown.button.title==="Vrátit datum na dnešek"&&s.monitorShown.button.aria==="Vrátit datum na dnešek"&&s.monitorShown.open,"monitor exposes the same localized Reset",s.monitorShown);
check(s.monitorReset&&s.monitorReset.now===s.monitorReset.live&&s.monitorReset.date===null&&s.monitorReset.time==="05:31"&&s.monitorReset.keep==="1"&&s.monitorReset.hash==="#play"&&s.monitorReset.open,"monitor Reset clears only the date and leaves the Calendar open",s.monitorReset);
check(s.monitorReset&&s.monitorReset.button.hidden&&s.monitorReset.button.disabled,"monitor Reset hides and disables after clearing the override",s.monitorReset);
check(Array.isArray(r.errors)&&r.errors.length===0,"no uncaught page errors",r.errors);

console.log("");
if(failures){console.log(failures+" check(s) failed.");process.exit(1);}
console.log("All Calendar reset checks passed.");
