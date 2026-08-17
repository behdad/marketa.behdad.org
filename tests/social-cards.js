#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var failures = 0;

function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? " [" + detail + "]" : ""));
  }
}

function meta(html, key, value) {
  var re = new RegExp("<meta\\s+" + key + "=[\"']" + value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
    "[\"']\\s+content=[\"']([^\"']*)[\"']", "i");
  var match = html.match(re);
  return match && match[1];
}

function dimensions(file) {
  var png = fs.readFileSync(path.join(root, file));
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

var renderer = fs.readFileSync(path.join(root, "tests/social-card-render.html"), "utf8");
check(/loft-world[^>]+loft-game-strip\.svg/.test(renderer) &&
  /loft-title[^>]*>Loft Day</.test(renderer),
  "Loft Day card uses the real espresso kitchen artwork");
check(/egg-scene loft[^>]+loft-scene\.svg/.test(renderer) &&
  /egg-scene garden[^>]+garden-scene\.svg/.test(renderer),
  "Egg Hunt card pairs the two authored scene illustrations");
check(/hub-caps[^>]+caps\.svg/.test(renderer) &&
  /hub-title[^>]*>markéta/.test(renderer) && /Invitations &amp; updates/.test(renderer),
  "hub card keeps the root preview generic");

[
  {
    file: "index.html",
    title: "markéta &amp; behdad",
    description: "Invitations, updates, and interactive drops.",
    url: "https://marketa.behdad.org/",
    image: "https://marketa.behdad.org/art/og-hub.png",
    asset: "art/og-hub.png"
  },
  {
    file: "egg-hunt.html",
    title: "Egg Hunt",
    description: "Ten hidden things in two illustrated scenes.",
    url: "https://marketa.behdad.org/egg-hunt.html",
    image: "https://marketa.behdad.org/art/og-egg-hunt.png",
    asset: "art/og-egg-hunt.png"
  },
  {
    file: "loft-day.html",
    title: "Loft Day",
    description: "A tiny world of rooms, parties and road trips.",
    url: "https://marketa.behdad.org/loft-day.html",
    image: "https://marketa.behdad.org/art/og-loft-day.png",
    asset: "art/og-loft-day.png"
  }
].forEach(function (card) {
  var html = fs.readFileSync(path.join(root, card.file), "utf8");
  check(meta(html, "property", "og:title") === card.title,
    card.file + " has its game-only Open Graph title");
  check(meta(html, "property", "og:description") === card.description,
    card.file + " has its game-only Open Graph description");
  check(meta(html, "property", "og:url") === card.url,
    card.file + " points its card at the canonical game URL");
  check(meta(html, "property", "og:image") === card.image &&
    meta(html, "name", "twitter:image") === card.image,
    card.file + " shares one game artwork across Open Graph and Twitter");
  check(meta(html, "name", "twitter:title") === card.title &&
    meta(html, "name", "twitter:description") === card.description,
    card.file + " mirrors its game copy into Twitter metadata");
  var size = dimensions(card.asset);
  check(size.width === 1200 && size.height === 630,
    card.asset + " is the authored 1200×630 card", size.width + "×" + size.height);
});

if (failures) process.exit(1);
console.log("Social cards: all checks passed.");
