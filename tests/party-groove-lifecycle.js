#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function(){
window.addEventListener("load",function(){setTimeout(function(){
  var report={errors:window.__errs,styleReads:0,playing:false,visible:false,inChest:false,falling:false,escaping:false};
  try{
    var audio=document.getElementById("tumbala-song-audio");
    var octopus=document.getElementById("cuddly-octopus");
    var groove=document.getElementById("cuddly-octopus-groove");
    Object.defineProperty(audio,"paused",{configurable:true,get:function(){return false;}});
    Object.defineProperty(audio,"ended",{configurable:true,get:function(){return false;}});
    if(window.__setSongLevel)window.__setSongLevel(audio,.5);
    report.playing=!audio.paused;
    var nativeStyle=window.getComputedStyle,nativeRect=Element.prototype.getBoundingClientRect;
    window.getComputedStyle=function(){report.styleReads++;return nativeStyle.apply(this,arguments);};
    Element.prototype.getBoundingClientRect=function(){return {x:0,y:0,left:0,top:0,right:0,bottom:0,width:0,height:0};};
    function update(){window.__updateCuddlyGrooving();return groove.classList.contains("grooving");}
    octopus.classList.remove("in-chest","falling-in","escape-running");
    report.visible=update();
    octopus.classList.add("in-chest");report.inChest=update();octopus.classList.remove("in-chest");
    octopus.classList.add("falling-in");report.falling=update();octopus.classList.remove("falling-in");
    octopus.classList.add("escape-running");report.escaping=update();octopus.classList.remove("escape-running");
    Element.prototype.getBoundingClientRect=nativeRect;
    window.getComputedStyle=nativeStyle;
  }catch(e){window.__errs.push("party groove harness: "+String(e&&e.stack||e));}
  report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);
},250);});
})();</script>`;

var r=lib.runPageSync("rsvp.html",HARNESS,1800,{patchRaf:true,forceMotion:true,seedRandom:true});
var failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}
console.log("rsvp.html Party groove lifecycle:");
check(r&&r.errors.length===0,"no uncaught page errors",r&&r.errors);
check(r&&r.playing,"the focused probe supplies one active loft song",r);
check(r&&r.styleReads===0,"groove refresh performs no synchronous computed-style reads",r&&r.styleReads);
check(r&&r.visible,"Octi grooves while visibly out of the trunk",r);
check(r&&!r.inChest&&!r.falling&&!r.escaping,"Octi stays still in every fully-hidden state",r);
if(failures){console.log("\n"+failures+" check(s) failed.");process.exit(1);}
console.log("\nAll checks passed.");
