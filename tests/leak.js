#!/usr/bin/env node
// Particle-cap regression test (the "occluded tab freeze" bug class).
//
// spawnSteamWisps and spawnMusicNotes append SVG nodes whose ONLY self-removal
// is a WAAPI onfinish handler. In a throttled/occluded tab that handler stalls,
// so an autonomous interval caller (kettle steam, grill smoke, instrument notes)
// piles up nodes without bound until the machine freezes. The fix is a drop-oldest
// cap inside each helper. This test proves that cap holds INDEPENDENT of onfinish:
// it stubs Element.prototype.animate to a no-op (so nothing self-removes), calls
// each helper 100× (300 nodes attempted), and asserts the live count stays capped.
// Un-capped this reads ~300; capped it must be <= the cap and > 0.
//
// Usage: node tests/leak.js
"use strict";

var lib = require("./lib");

var STEAM_CAP = 40;
var NOTES_CAP = 24;
var HEART_CAP = 30;

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      var report = { steam: -1, notes: -1, hearts: -1, steamCap: " + STEAM_CAP + ", notesCap: " + NOTES_CAP + ", heartCap: " + HEART_CAP + ", errors: [] };",
  "      (async function () {",
  "        try {",
  "          var strip = document.getElementById('loft-game-strip');",
  "          if (!strip) throw new Error('no loft-game-strip');",
  "          if (typeof window.__spawnSteamWisps !== 'function' || typeof window.__spawnMusicNotes !== 'function' || typeof window.__spawnHearts !== 'function') throw new Error('private spawner seams unavailable');",
  // no-op .animate so onfinish never fires -> the cap is the ONLY removal path
  "          Element.prototype.animate = function () { return { onfinish: null, cancel: function () {}, finish: function () {} }; };",
  "          for (var i = 0; i < 100; i++) window.__spawnSteamWisps(strip, 79, 193, 0.55, -1);",
  "          for (var j = 0; j < 100; j++) window.__spawnMusicNotes(strip, 200, 300);",
  "          for (var k = 0; k < 100; k++) window.__spawnHearts(strip, 200, 300);",
  "          await sleep(3000);", // let each helper's staggered internal setTimeouts all fire
  "          report.steam = strip.getElementsByClassName('steam-wisp').length;",
  "          report.notes = strip.getElementsByClassName('music-note').length;",
  "          report.hearts = strip.getElementsByClassName('heart-particle').length;",
  "        } catch (e) { report.errors.push(String(e && e.stack || e)); }",
  "        document.getElementById('__report').textContent = JSON.stringify(report);",
  "      })();",
  "    }, 400);",
  "  });",
  "})();",
  "</script>"
].join("\n");

var report = lib.runPageSync("rsvp.html", HARNESS, 9000, { patchRaf: true });

var fails = [];
function ok(cond, msg) { console.log((cond ? "  ✓ " : "  ✗ ") + msg); if (!cond) fails.push(msg); }

if (!report) {
  console.error("leak.js: no report captured (page did not run harness)");
  process.exit(1);
}
if (report.errors && report.errors.length) {
  report.errors.forEach(function (e) { console.error("  page error: " + e); });
  fails.push("page errors during cap test");
}

ok(report.steam > 0, "spawnSteamWisps actually spawned (" + report.steam + " > 0)");
ok(report.steam <= STEAM_CAP, "steam wisps capped at " + STEAM_CAP + " despite 300 attempted (got " + report.steam + ")");
ok(report.notes > 0, "spawnMusicNotes actually spawned (" + report.notes + " > 0)");
ok(report.notes <= NOTES_CAP, "music notes capped at " + NOTES_CAP + " despite 300 attempted (got " + report.notes + ")");
ok(report.hearts > 0, "spawnHearts actually spawned (" + report.hearts + " > 0)");
ok(report.hearts <= HEART_CAP, "hearts capped at " + HEART_CAP + " despite 600 attempted (got " + report.hearts + ")");

if (fails.length) { console.error("\nleak.js FAILED (" + fails.length + ")"); process.exit(1); }
console.log("\nAll checks passed.");
