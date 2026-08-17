#!/usr/bin/env node
// Block Party must own the balcony without the arrival butterfly/rainbow painting over it.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'var report={errors:[],steps:{},debug:{}};function S(key,value){report.steps[key]=!!value;}',
  'async function run(){',
  'window.__goToStage("balcony");await sleep(80);',
  'var stage=document.getElementById("stage-balcony"),butterfly=document.getElementById("balcony-butterfly"),rainbow=document.getElementById("balcony-rainbow");',
  'rainbow.classList.add("burst","after-rain");butterfly.classList.add("flying","startled");',
  'S("setup",butterfly.classList.contains("flying")&&rainbow.classList.contains("burst"));',
  'window.__startBalconyTetris();',
  'S("immediate",window.__balconyTetrisState().active&&!butterfly.classList.contains("flying")&&!butterfly.classList.contains("startled")&&!rainbow.classList.contains("burst")&&!rainbow.classList.contains("after-rain"));',
  'S("hidden",getComputedStyle(butterfly).opacity==="0"&&getComputedStyle(rainbow).opacity==="0");',
  'await sleep(4350);',
  'S("stays_clear",window.__balconyTetrisState().active&&!butterfly.classList.contains("flying")&&!rainbow.classList.contains("burst")&&!rainbow.classList.contains("after-rain"));',
  'window.__stopBalconyTetris();butterfly.classList.add("flying");rainbow.classList.add("burst");',
  'S("ordinary_restored",!stage.classList.contains("tetris-on")&&butterfly.classList.contains("flying")&&rainbow.classList.contains("burst"));',
  '}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness:"+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  '})();',
  '</script>'
].join("\n");

var failures = 0;
function check(value, message, detail) {
  if (value) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
    if (detail) console.log("      " + JSON.stringify(detail));
  }
}

console.log("loft-day.html Block Party finale cleanup:");
var result = lib.runPageSync("loft-day.html", HARNESS, 9000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true
});
if (!result) check(false, "harness reported");
else {
  check(result.steps.setup, "the regression begins with both arrival effects live", result);
  check(result.steps.immediate, "starting Block Party immediately clears the butterfly and rainbow", result);
  check(result.steps.hidden, "the live game hard-hides either effect if another source tries to paint it", result);
  check(result.steps.stays_clear, "the queued finale rainbow cannot return over the game", result);
  check(result.steps.ordinary_restored, "ordinary butterfly and rainbow classes work again after the game", result);
  check(result.errors.length === 0, "no uncaught JS errors", result.errors);
}

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
