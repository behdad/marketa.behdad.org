#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function(){
window.addEventListener("load",function(){setTimeout(function(){
  var report={errors:window.__errs,styleReads:0,initial:[],arrived:[],mouses:[],runner:[],photog:[]};
  try{
    var stage=document.getElementById("stage-garden"),guests=document.getElementById("garden-guests");
    window.__gardenPartyOn=true;
    stage.classList.add("garden-party","photog-empty");
    guests.classList.add("guests-in","trickle");
    var nativeStyle=window.getComputedStyle;
    window.getComputedStyle=function(){report.styleReads++;return nativeStyle.apply(this,arguments);};
    function names(){return window.__whoIsHere("garden").map(function(p){return p.key;});}
    report.initial=names();
    guests.querySelector(".g-ali").classList.add("arrived");
    guests.querySelector(".g-elisabeth").classList.add("arrived");
    report.arrived=names();
    guests.classList.add("mouses-visiting");
    report.mouses=names();
    guests.querySelector(".g-elisabeth").classList.add("off-with-kids");
    document.getElementById("garden-kid-elisabeth").classList.add("chasing");
    report.runner=names();
    stage.classList.remove("photog-empty");
    report.photog=names();
    window.getComputedStyle=nativeStyle;
  }catch(e){window.__errs.push("party presence harness: "+String(e&&e.stack||e));}
  report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);
},250);});
})();</script>`;

var r=lib.runPageSync("rsvp.html",HARNESS,1800,{patchRaf:true,forceMotion:true,seedRandom:true});
var failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}
function has(list,key){return list&&list.indexOf(key)!==-1;}
console.log("rsvp.html Party presence reads:");
check(r&&r.errors.length===0,"no uncaught page errors",r&&r.errors);
check(r&&r.styleReads===0,"garden presence performs no computed-style reads",r&&r.styleReads);
check(r&&has(r.initial,"marketa")&&has(r.initial,"behdad")&&has(r.initial,"sina")&&!has(r.initial,"ali")&&!has(r.initial,"aspen"),
  "a fresh trickle reports hosts and DJ, not waiting guests or an empty-room photographer",r&&r.initial);
check(r&&has(r.arrived,"ali")&&!has(r.arrived,"elisabeth"),"arrived guests report while non-visiting mouses stay absent",r&&r.arrived);
check(r&&has(r.mouses,"elisabeth"),"the visiting-family state admits an arrived mouse",r&&r.mouses);
check(r&&has(r.runner,"elisabeth"),"a running child remains present during the standing-figure handoff",r&&r.runner);
check(r&&has(r.photog,"aspen"),"the photographer reports once the room has subjects",r&&r.photog);
if(failures){console.log("\n"+failures+" check(s) failed.");process.exit(1);}
console.log("\nAll checks passed.");
