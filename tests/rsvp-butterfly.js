#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = [
  '<style>.invite-butterfly.startled{animation:none!important}</style>',
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var butterfly=document.getElementById("rsvp-butterfly");',
  'var reacted=false,add=DOMTokenList.prototype.add;DOMTokenList.prototype.add=function(){if(this===butterfly.classList&&[].indexOf.call(arguments,"startled")!==-1)reacted=true;return add.apply(this,arguments);};',
  'var raf=window.requestAnimationFrame;window.requestAnimationFrame=function(callback){callback();return 0;};',
  'butterfly.dispatchEvent(new MouseEvent("click",{bubbles:true}));window.requestAnimationFrame=raf;',
  'setTimeout(function(){document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs||[],reacted:reacted,pointer:getComputedStyle(butterfly).pointerEvents,cursor:getComputedStyle(butterfly).cursor});},80);',
  '})();</script>'
].join("\n");

var report = lib.runPageSync("rsvp.html", harness, 3000, { patchRaf: true });
var pass = report && !report.errors.length && report.reacted &&
  report.pointer !== "none" && report.cursor === "pointer";

console.log("  " + (pass ? "✓" : "✗") + " the RSVP butterfly reacts to a click");
if (!pass) {
  console.error(JSON.stringify(report));
  process.exit(1);
}
