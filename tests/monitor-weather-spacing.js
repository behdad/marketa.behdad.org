#!/usr/bin/env node
"use strict";

const fs = require("fs");
const html = fs.readFileSync("loft-day.html", "utf8");

const app = html.match(/<g id="monitor-weather">([\s\S]*?)<g id="monitor-wx-close"/);
if (!app) throw new Error("monitor Weather app markup not found");

const body = app[1];
for (const city of ["e", "p"]) {
  const pattern = new RegExp(`<g id="monitor-wx-card-${city}" transform="translate\\(5 0\\)">`);
  if (!pattern.test(body)) throw new Error(`monitor Weather ${city} card is not centered with the shared inset`);
}

console.log("✓ monitor Weather cards share equal horizontal outer spacing");
