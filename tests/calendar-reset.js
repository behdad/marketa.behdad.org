#!/usr/bin/env node
// Calendar's app-level Today control is permanent on both hosts. Date override
// reset belongs to the room HUD, clears only date, and localizes independently.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function(){",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  function ymd(d){return [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-');}",
  "  function shown(el){return !!el&&!el.hidden&&getComputedStyle(el).display!=='none';}",
  "  function button(el){return {exists:!!el,shown:shown(el),disabled:el&&el.disabled,text:el&&el.textContent.trim()};}",
  "  var report={errors:[],steps:{}}; function S(k,v){report.steps[k]=v;}",
  "  async function run(){",
  "    var live=ymd(new Date());",
  "    history.replaceState(null,'',location.pathname+'?date=2030-04-06&keep=app');",
  "    if(window.__calReapplyDateTime)window.__calReapplyDateTime();",
  "    window.setLang('en');window.__openPhoneAppHere('calendar');await sleep(40);",
  "    var phone=document.querySelector('.calx-phone'),pToday=phone&&phone.querySelector('.calx-today');",
  "    S('phoneTodayBefore',button(pToday));if(pToday)pToday.click();await sleep(40);",
  "    phone=document.querySelector('.calx-phone');var appUrl=new URL(location.href);",
  "    S('phoneTodayAfter',{button:button(phone&&phone.querySelector('.calx-today')),now:ymd(window.__now()),live:live,date:appUrl.searchParams.get('date'),keep:appUrl.searchParams.get('keep'),open:!!phone});",
  "    window.setLang('cs');",
  "    var mon=document.getElementById('office-monitor'),pc=document.getElementById('office-pc-desk-trio');pc.classList.add('on');mon.classList.add('here','screen-on','show-caps');window.__openMonitorApp('calendar');await sleep(40);",
  "    var host=document.getElementById('monitor-cal-body'),mToday=host&&host.querySelector('.calx-today');",
  "    S('monitorToday',{button:button(mToday),open:mon.classList.contains('show-calendar')});",
  "    if(window.phone)window.phone.set(false);await sleep(280);if(window.goToStage)window.goToStage('cuddly');",
  "    window.setLang('en');history.replaceState(null,'',location.pathname+'?date=2031-02-03&keep=1');",
  "    if(window.__calReapplyDateTime)window.__calReapplyDateTime();await sleep(30);",
  "    var dateNav=document.querySelector('.loft-datenav'),reset=document.getElementById('loft-datereset');",
  "    S('dateOnlyShown',{reset:button(reset),nav:shown(dateNav),date:new URL(location.href).searchParams.get('date'),order:[].slice.call(dateNav.children).map(function(el){return el.id;})});",
  "    if(reset)reset.click();await sleep(40);var du=new URL(location.href);",
  "    S('dateOnlyReset',{now:ymd(window.__now()),live:live,date:du.searchParams.get('date'),keep:du.searchParams.get('keep'),hash:du.hash,room:window.currentStageName,nav:shown(dateNav),reset:shown(reset)});",
  "    window.setLang('cs');history.replaceState(null,'',location.pathname+'?date=2032-09-18&time=05:31&keep=1');",
  "    if(window.__calReapplyDateTime)window.__calReapplyDateTime();await sleep(30);",
  "    reset=document.getElementById('loft-datereset');dateNav=document.querySelector('.loft-datenav');",
  "    S('combinedShown',{reset:button(reset),dateNav:shown(dateNav),timeNav:shown(document.getElementById('loft-timenav'))});",
  "    if(reset)reset.click();await sleep(40);var cu=new URL(location.href);",
  "    S('combinedReset',{now:ymd(window.__now()),live:live,date:cu.searchParams.get('date'),time:cu.searchParams.get('time'),keep:cu.searchParams.get('keep'),hash:cu.hash,room:window.currentStageName,dateNav:shown(dateNav),timeNav:shown(document.getElementById('loft-timenav')),reset:shown(reset)});",
  "    report.errors=window.__errs||[];document.getElementById('__report').textContent=JSON.stringify(report);",
  "  }",
  "  window.addEventListener('load',function(){setTimeout(function(){run().catch(function(e){report.errors.push(String(e&&e.stack||e));document.getElementById('__report').textContent=JSON.stringify(report);});},300);});",
  "})();",
  "</script>"
].join("\n");

var r=lib.runPageSync("loft-day.html",HARNESS,3200,{patchRaf:true});
if(!r){console.log("  ✗ harness produced no report");process.exit(1);}
var s=r.steps||{},failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}

console.log("loft-day.html Calendar reset ownership:");
check(s.phoneTodayBefore&&s.phoneTodayBefore.exists&&s.phoneTodayBefore.shown&&!s.phoneTodayBefore.disabled&&s.phoneTodayBefore.text==="↻","phone Calendar exposes its visible Today control while a date is selected",s.phoneTodayBefore);
check(s.phoneTodayAfter&&s.phoneTodayAfter.button.exists&&s.phoneTodayAfter.button.shown&&!s.phoneTodayAfter.button.disabled&&s.phoneTodayAfter.now===s.phoneTodayAfter.live&&s.phoneTodayAfter.date===null&&s.phoneTodayAfter.keep==="app"&&s.phoneTodayAfter.open,"phone Today returns to the real day but remains permanently available",s.phoneTodayAfter);
check(s.monitorToday&&s.monitorToday.button.exists&&s.monitorToday.button.shown&&!s.monitorToday.button.disabled&&s.monitorToday.button.text==="↻"&&s.monitorToday.open,"monitor Calendar permanently retains its visible Today control",s.monitorToday);
check(s.dateOnlyShown&&s.dateOnlyShown.reset.exists&&s.dateOnlyShown.reset.shown&&!s.dateOnlyShown.reset.disabled&&s.dateOnlyShown.reset.text==="↺"&&s.dateOnlyShown.nav&&JSON.stringify(s.dateOnlyShown.order)===JSON.stringify(["loft-dateprev","loft-dateprevday","loft-datepill","loft-datereset","loft-datenextday","loft-datenext"]),"an explicit date reveals the room-HUD Reset immediately left of Next",s.dateOnlyShown);
check(s.dateOnlyReset&&s.dateOnlyReset.now===s.dateOnlyReset.live&&s.dateOnlyReset.date===null&&s.dateOnlyReset.keep==="1"&&s.dateOnlyReset.hash===""&&s.dateOnlyReset.room==="cuddly"&&!s.dateOnlyReset.nav&&!s.dateOnlyReset.reset,"date-only Reset returns to real today and hides the unneeded HUD without disturbing room or URL state",s.dateOnlyReset);
check(s.combinedShown&&s.combinedShown.reset.exists&&s.combinedShown.reset.shown&&!s.combinedShown.reset.disabled&&s.combinedShown.reset.text==="↺"&&s.combinedShown.dateNav&&s.combinedShown.timeNav,"the room-HUD Reset remains visible when the Czech UI has date and time overrides",s.combinedShown);
check(s.combinedReset&&s.combinedReset.now===s.combinedReset.live&&s.combinedReset.date===null&&s.combinedReset.time==="05:31"&&s.combinedReset.keep==="1"&&s.combinedReset.hash===""&&s.combinedReset.room==="cuddly"&&s.combinedReset.dateNav&&s.combinedReset.timeNav&&!s.combinedReset.reset,"date reset preserves time and leaves the HUDs visible for that remaining override",s.combinedReset);
check(Array.isArray(r.errors)&&r.errors.length===0,"no uncaught page errors",r.errors);

console.log("");
if(failures){console.log(failures+" check(s) failed.");process.exit(1);}
console.log("All Calendar reset ownership checks passed.");
