#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var html = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");

var parties = html.indexOf('<div class="parties">');
var rsvp = html.indexOf('<div class="rsvp-block" id="rsvp-anchor">');
var game = html.indexOf('<div id="hunt-fullscreen-area">');
var footer = html.indexOf("<footer>");
var pass = parties >= 0 && parties < rsvp && rsvp < game && game < footer;

console.log((pass ? "  ✓ " : "  ✗ ") +
  "RSVP details precede the large inline game, which remains before the footer");
if (!pass) {
  console.error(JSON.stringify({ parties: parties, rsvp: rsvp, game: game, footer: footer }));
  process.exit(1);
}
