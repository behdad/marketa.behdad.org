#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function(){
window.addEventListener("load",function(){setTimeout(async function(){
  var report={errors:window.__errs,built:false,hidden:false,reused:false,replaceCalls:0,count:0};
  try{
    var stage=document.getElementById("stage-garden");
    var reflection=document.getElementById("bedroom-party-window-reflection");
    window.__gardenPartyOn=true;
    stage.classList.add("garden-party");
    window.__loftControllers.officefolks("madla");
    await new Promise(function(resolve){setTimeout(resolve,40);});
    var first=reflection.firstElementChild;
    report.built=!!first&&reflection.getAttribute("visibility")!=="hidden";
    report.count=reflection.childElementCount;
    var nativeReplace=reflection.replaceChildren;
    reflection.replaceChildren=function(){report.replaceCalls++;return nativeReplace.apply(this,arguments);};
    stage.classList.remove("garden-party");
    await new Promise(function(resolve){setTimeout(resolve,20);});
    report.hidden=reflection.getAttribute("visibility")==="hidden"&&reflection.firstElementChild===first;
    stage.classList.add("garden-party");
    await new Promise(function(resolve){setTimeout(resolve,20);});
    report.reused=reflection.getAttribute("visibility")!=="hidden"&&reflection.firstElementChild===first;
  }catch(e){window.__errs.push("party window reflection harness: "+String(e&&e.stack||e));}
  report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);
},250);});
})();</script>`;

var r=lib.runPageSync("rsvp.html",HARNESS,1800,{patchRaf:true,forceMotion:true,seedRandom:true});
var failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}
console.log("rsvp.html Bedroom Party reflection:");
check(r&&r.errors.length===0,"no uncaught page errors",r&&r.errors);
check(r&&r.built&&r.count===1,"the current office couple is reflected while Party is lit",r);
check(r&&r.hidden,"Party-off hides but retains the reflection tree",r);
check(r&&r.reused&&r.replaceCalls===0,"Party re-entry reuses the unchanged reflection tree",r);
if(failures){console.log("\n"+failures+" check(s) failed.");process.exit(1);}
console.log("\nAll checks passed.");
