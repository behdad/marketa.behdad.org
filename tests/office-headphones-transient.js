#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");

const checks = [
  [!html.includes('__registerArrangementOwner("headphones"'), "headphone position is not checkpoint-owned"],
  [html.includes("window.__headphoneArrangementState = function"), "live drag state remains inspectable"],
  [!html.match(/headphonesDragMoved[\s\S]{0,220}__checkpointChanged/), "dragging headphones does not write a checkpoint"],
];

let failed = 0;
for (const [ok, label] of checks) {
  if (ok) console.log("✓ " + label);
  else { console.error("✗ " + label); failed++; }
}
if (failed) process.exit(1);
console.log("office headphone transient-state checks passed (" + checks.length + ")");
