#!/usr/bin/env node
// Season stepping starts beside the loft's effective day, not at a fixed point in
// the calendar. Exercise the real S/Shift+S keyboard path from a URL-selected day.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function(){",
  "  var report={errors:[],steps:{}}; function S(k,v){report.steps[k]=v;}",
  "  function selectDay(y,m,d){window.__jumpToDate(y,m,d);}",
  "  function press(shift){document.dispatchEvent(new KeyboardEvent('keydown',{key:shift?'S':'s',shiftKey:!!shift,bubbles:true,cancelable:true}));}",
  "  function state(){return {name:window.__seasonPreviewName(),date:window.__seasonDate(),url:new URL(location.href).searchParams.get('date'),reset:getComputedStyle(document.getElementById('loft-datereset')).display};}",
  "  window.addEventListener('load',function(){setTimeout(function(){try{",
  "    selectDay(2027,6,31); press(false); S('forward',state());",
  "    selectDay(2027,6,31); press(true); S('backward',state());",
  "    window.__calResetToday();window.__applySeasonSilent('newyear');S('silent',state());",
  "  }catch(e){window.__errs.push('harness: '+String(e&&e.stack||e));}",
  "  report.errors=window.__errs||[];document.getElementById('__report').textContent=JSON.stringify(report);},300);});",
  "})();",
  "</script>"
].join("\n");

var r=lib.runPageSync("rsvp.html",HARNESS,1800,{patchRaf:true});
if(!r){console.log("  ✗ harness produced no report");process.exit(1);}
var s=r.steps||{},failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}

console.log("rsvp.html season-step anchor:");
check(s.forward&&s.forward.name==="smoky"&&s.forward.date.m===7&&s.forward.date.d===7&&s.forward.url==="2027-08-07"&&s.forward.reset!=="none",
  "S advances from July 31 to August 7, writes the URL and reveals Reset",s.forward);
check(s.backward&&s.backward.name==="summer"&&s.backward.date.m===6&&s.backward.date.d===15&&s.backward.url==="2027-07-15"&&s.backward.reset!=="none",
  "Shift+S rewinds from July 31 to July 15, writes the URL and reveals Reset",s.backward);
check(s.silent&&s.silent.name==="newyear"&&s.silent.url===null&&s.silent.reset==="none",
  "silent season previews remain ephemeral and do not expose Reset",s.silent);
check(Array.isArray(r.errors)&&r.errors.length===0,"no uncaught page errors",r.errors);

console.log("");
if(failures){console.log(failures+" check(s) failed.");process.exit(1);}
console.log("All season-step anchor checks passed.");
