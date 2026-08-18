#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");

const checks = [
  [html.includes("#office-headphones.music-hinting{animation:headphones-music-hint .55s ease-in-out}"), "subtle one-shot hint animation exists"],
  [html.includes("}, 4000);"), "hint cadence is four seconds"],
  [html.includes("window.__currentStageName === \"office\" && !headphoneModeOn"), "hint requires the office and unplugged headphones"],
  [html.includes("!document.hidden && document.hasFocus() && !reduced"), "hint respects focus, visibility, and reduced motion"],
  [html.includes("window.__headphonesHaveMoved = true;"), "first real drag records discovery"],
  [html.includes("if (!anySongPlaying() || window.__headphonesHaveMoved)"), "music stopping or discovery retires the hint timer"],
  [html.includes("headphones.classList.remove(\"music-hinting\");"), "drag and animation completion clear the one-shot class"],
];

let failed = 0;
for (const [ok, label] of checks) {
  if (ok) console.log("✓ " + label);
  else { console.error("✗ " + label); failed++; }
}
if (failed) process.exit(1);
console.log("office headphone music hint checks passed (" + checks.length + ")");
