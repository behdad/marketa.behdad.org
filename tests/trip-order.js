#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>window.addEventListener("load",function(){setTimeout(function(){',
  'var order=window.__tripOrder?window.__tripOrder():[];',
  'document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,order:order});',
  '},200);});</script>'
].join("\n");

console.log("rsvp.html magic-box trip order:");
var r = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var forbidden = { nitrous: true, shrooms: true, froggies: true, ketamine: true };
var unique = new Set(r.order);
var ok = r.errors.length === 0 && r.order.length === 8 && unique.size === 8 &&
  !forbidden[r.order[0]] && !forbidden[r.order[1]];
if (!ok) {
  console.log("  ✗ first two trips are box-only and every variant appears once   [" + JSON.stringify(r) + "]");
  process.exit(1);
}
console.log("  ✓ first two trips are box-only and every variant appears once");
console.log("\nAll checks passed.");
