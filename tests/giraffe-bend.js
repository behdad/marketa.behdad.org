#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'window.addEventListener("load",function(){setTimeout(function(){',
  ' var deer=document.getElementById("garden-deer"),out={errors:(window.__errs||[]).slice()};',
  ' function click(){deer.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  ' out.hasPoses=!!(deer&&deer.querySelector("#garden-deer-neck-rest")&&deer.querySelector("#garden-deer-neck-bent"));',
  ' click();click();out.beforeThird=deer.classList.contains("bending");',
  ' click();out.onThird=deer.classList.contains("bending");',
  ' setTimeout(function(){out.afterHold=deer.classList.contains("bending");out.errors=(window.__errs||[]).slice();document.getElementById("__report").textContent=JSON.stringify(out);},2050);',
  '},250);});',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", harness, 3500, { patchRaf: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html wooden giraffe bend:");
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(result.hasPoses, "resting and deep-bend neck poses both exist");
check(result.beforeThird === false, "the first two taps keep the ordinary neck");
check(result.onThird === true, "the third tap folds the neck");
check(result.afterHold === false, "the giraffe returns to its resting pose");

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
