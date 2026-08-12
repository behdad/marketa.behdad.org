#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function(){
window.addEventListener("load",function(){setTimeout(function(){
  var report={errors:window.__errs,geometryReads:0,started:false,kept:false,timingCleared:false,
    partyStartReads:0,ambientFlash:false,freezeFlash:false,flashTimer:false};
  try{
    var ids=["office-skull","office-wooden-head-groove","kitchen-bartender",
      "garden-rooster-groove","garden-deer-groove","garden-ladybug","garden-mirror-groove",
      "garden-lamp-groove","garden-mask-groove","office-abstract-butterfly"];
    var els=ids.map(function(id){return document.getElementById(id);}).filter(Boolean);
    window.__gardenPartyOn=true;
    window.__anyMusicPlaying=function(){return true;};
    var nativeRect=Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect=function(){report.geometryReads++;return nativeRect.apply(this,arguments);};

    els.forEach(function(el){el.classList.remove("grooving");el.style.animationDuration="";el.style.animationDelay="";});
    window.__updateCuddlyGrooving();
    report.started=els.length===ids.length&&els.every(function(el){return el.classList.contains("grooving");});

    els.forEach(function(el){el.style.animationDuration="2.75s";el.style.animationDelay="-1.25s";});
    window.__updateCuddlyGrooving();
    report.kept=els.every(function(el){return el.classList.contains("grooving");});
    report.timingCleared=els.every(function(el){return !el.style.animationDuration&&!el.style.animationDelay;});

    window.__gardenPartyOn=false;
    els.forEach(function(el){el.classList.remove("grooving");});
    report.geometryReads=0;
    window.__goToStage("garden");
    window.__setGardenParty(true,false);
    report.partyStartReads=report.geometryReads;
    report.flashTimer=!!(window.__partyForegroundRuntimeState&&window.__partyForegroundRuntimeState().flash);
    if(window.__summonGuests)window.__summonGuests();
    window.__syncDanceFreeze();
    report.ambientFlash=document.getElementById("garden-photog-cam").classList.contains("aiming")||
      document.getElementById("garden-flash-bloom").classList.contains("flashing");
    window.__photoFreeze=true;
    window.__syncDanceFreeze();
    report.freezeFlash=document.getElementById("garden-photog-cam").classList.contains("aiming")&&
      document.getElementById("garden-flash-bloom").classList.contains("flashing");
    window.__photoFreeze=false;
    window.__setGardenParty(false,false);
    Element.prototype.getBoundingClientRect=nativeRect;
  }catch(e){window.__errs.push("Party groove layout harness: "+String(e&&e.stack||e));}
  report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);
},250);});
})();</script>`;

var r=lib.runPageSync("rsvp.html",HARNESS,1800,{patchRaf:true,forceMotion:true,seedRandom:true});
var failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}
console.log("rsvp.html Party ambient grooving:");
check(r&&r.errors.length===0,"no uncaught page errors",r&&r.errors);
check(r&&r.started,"a fresh Party starts every ambient groover",r);
check(r&&r.kept&&r.timingCleared,"an existing groove keeps running on its CSS default timing",r);
check(r&&r.partyStartReads===0,"Party ignition performs no synchronous geometry reads",r);
check(r&&r.flashTimer&&!r.ambientFlash,"ordinary Party ignition preserves the authored delayed first flash",r);
check(r&&r.freezeFlash,"an actual photo freeze still accelerates the photographer immediately",r);
if(failures){console.log("\n"+failures+" check(s) failed.");process.exit(1);}
console.log("\nAll checks passed.");
