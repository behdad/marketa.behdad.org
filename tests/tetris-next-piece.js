#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'var report={errors:[],steps:{},debug:{}};',
  'function S(k,v){report.steps[k]=!!v;}',
  'function previewType(){var cell=document.querySelector(".tetris-next-piece .tetris-preview-cell");return cell&&[].slice.call(cell.classList).find(function(c){return /^tetris-[ijlostz]$/.test(c);});}',
  'window.addEventListener("load",function(){setTimeout(function(){',
  'window.__goToStage("balcony");window.__startBalconyTetris();',
  'var before=window.__balconyTetrisState(),shown=previewType();',
  'S("true_preview",before.active&&before.next&&shown==="tetris-"+before.next&&document.querySelectorAll(".tetris-next-piece .tetris-preview-cell").length===4);',
  'window.__balconyTetrisTest("drop");',
  'var after=window.__balconyTetrisState(),advanced=previewType();',
  'S("queue_advances",after.piece&&after.piece.type===before.next&&after.next&&advanced==="tetris-"+after.next);',
  'report.debug={before:before,after:after,shown:shown,advanced:advanced};',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);',
  '},350);});',
  '})();',
  '</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
    if (detail) console.log("      " + JSON.stringify(detail));
  }
}

console.log("rsvp.html Block Party next-piece preview:");
var result = lib.runPageSync("rsvp.html", harness, 3000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true
});
check(result && result.steps.true_preview,
  "the HUD previews the actual queued tetromino with four colored cells", result && result.debug);
check(result && result.steps.queue_advances,
  "locking a piece promotes the preview and displays the following queued piece", result && result.debug);
check(result && result.errors.length === 0, "no uncaught JS errors", result && result.errors);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
