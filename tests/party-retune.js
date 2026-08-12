#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function(){
function mod(n,d){return((n%d)+d)%d;}
window.addEventListener("load",function(){setTimeout(function(){
  var report={errors:window.__errs,wrappers:0,geometryReads:0,durationSpread:null,phaseSpread:null,cached:false,beatScope:null};
  try{
    var guests=document.getElementById("garden-guests");
    guests.classList.add("guests-in");
    window.__gardenPartyOn=true;
    window.__setPartyDance("techno");
    report.beatScope={
      root:document.documentElement.style.getPropertyValue("--party-window-beat"),
      cinema:document.getElementById("cinema-window").style.getPropertyValue("--party-window-beat"),
      bedroom:document.getElementById("bedroom-stained-glass").style.getPropertyValue("--party-window-beat")
    };
    window.__musicPaused=false;
    var els=[].slice.call(guests.querySelectorAll(".guest-sway,.guest-arm-l,.guest-arm-r"));
    els.forEach(function(el){el.removeAttribute("data-basedelay");el.style.animationDuration="";el.style.animationDelay="";});
    var nativeRect=Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect=function(){if(this===guests||guests.contains(this))report.geometryReads++;return nativeRect.apply(this,arguments);};
    window.__partyBeatEpoch=performance.now()-180;
    window.__retuneDancers("techno");
    Element.prototype.getBoundingClientRect=nativeRect;
    var durations=els.map(function(el){return parseFloat(el.style.animationDuration)||0;});
    var phases=els.map(function(el){var dur=parseFloat(el.style.animationDuration)||1,lead=-(parseFloat(el.style.animationDelay)||0),stagger=parseFloat(el.getAttribute("data-basedelay"))||0;return mod(lead+stagger,dur);});
    report.wrappers=els.length;
    report.durationSpread=Math.max.apply(Math,durations)-Math.min.apply(Math,durations);
    report.phaseSpread=Math.max.apply(Math,phases)-Math.min.apply(Math,phases);
    report.cached=els.every(function(el){return el.hasAttribute("data-basedelay");});
  }catch(e){window.__errs.push("party retune harness: "+String(e&&e.stack||e));}
  report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);
},250);});
})();</script>`;

var r=lib.runPageSync("rsvp.html",HARNESS,1800,{patchRaf:true,forceMotion:true,seedRandom:true});
var failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}
console.log("rsvp.html Party dancer retuning:");
check(r&&r.errors.length===0,"no uncaught page errors",r&&r.errors);
check(r&&r.wrappers===93,"all named-guest sway and arm wrappers are retuned",r);
check(r&&r.geometryReads===0,"tempo retuning performs no synchronous geometry reads",r);
check(r&&r.cached&&r.durationSpread<0.001,"every wrapper caches its authored stagger and shares one duration",r);
check(r&&r.phaseSpread<0.003,"authored staggers resolve onto one shared beat phase",r);
check(r&&r.beatScope&&r.beatScope.root===""&&r.beatScope.cinema==="0.533s"&&r.beatScope.bedroom==="0.533s",
  "dance tempo invalidates only the two lower-room bass windows",r&&r.beatScope);
if(failures){console.log("\n"+failures+" check(s) failed.");process.exit(1);}
console.log("\nAll checks passed.");
