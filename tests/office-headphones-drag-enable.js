#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");

const move = html.match(/headphones\.addEventListener\("pointermove", function \(e\) \{([\s\S]*?)\n    \}\);/);
const body = move ? move[1] : "";
const checks = [
  [!!move, "headphone pointermove handler exists"],
  [body.includes("!headphonesDragMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)"), "tiny pointer jitter does not enable headphones"],
  [body.includes("window.__setHeadphoneMode(true);"), "the first real drag enables headphone mode"],
  [body.indexOf("headphonesDragMoved = true;") < body.indexOf("window.__setHeadphoneMode(true);"), "the enable action runs only once per drag"],
];

let failed = 0;
for (const [ok, label] of checks) {
  if (ok) console.log("✓ " + label);
  else { console.error("✗ " + label); failed++; }
}
if (failed) process.exit(1);
console.log("office headphone drag-enable checks passed (" + checks.length + ")");
