#!/usr/bin/env node
// Trailer (▷ Trailer) cinematic tests: drives window.__startCinematic in headless
// Chrome and verifies (1) the FULL reel runs to a clean end in ~55-68s, (2) it leaves
// NO stranded state — cursor, party/UV, roster, aurora, held couple, previewed season —
// after it finishes on its own, and (3) a mid-reel take-over (__stopCinematic) also tears
// everything down. A separate reduced-motion run confirms the shorter still path completes
// and cleans up too.
//
// Timing method: under --virtual-time-budget timers fast-forward, but performance.now()
// tracks virtual time — so (end - start) of performance.now() around the run equals the
// SUMMED beat timeline (waitFor gates resolve immediately when their state is already
// satisfied, or hit their timeout; both are part of the real timeline). rAF is patched to
// setTimeout (lib patchRaf) so the monitor boot + WAAPI-adjacent state actually advances.
//
// Usage: node tests/cine.js
"use strict";

var lib = require("./lib");

var COMMON = [
  "function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "function finish(report) { report.errors = window.__errs; document.getElementById('__report').textContent = JSON.stringify(report); }",
  // a compact snapshot of every bit of state the reel touches — read after the show ends
  "function snapshot() {",
  "  var strip = document.getElementById('loft-game-strip');",
  "  var bc = document.getElementById('balcony-couple');",
  "  var sg = document.getElementById('stage-garden');",
  "  var sb = document.getElementById('stage-balcony');",
  "  var panel = document.getElementById('roster-panel');",
  "  return {",
  "    cinematic: !!window.__cinematic,",
  "    cursor: !!document.getElementById('cine-cursor'),",
  "    ripples: document.querySelectorAll('.cine-ripple').length,",
  "    partyOn: !!window.__gardenPartyOn,",
  "    uvMode: !!(strip && strip.classList.contains('uv-mode')),",
  "    rosterOpen: !!(window.__rosterOpen && window.__rosterOpen()),",
  "    rosterPanelShown: !!(panel && panel.classList.contains('show')),",
  "    coupleShowing: !!(bc && bc.classList.contains('showing')),",
  "    auroraForceGarden: !!(sg && sg.classList.contains('aurora-force')),",
  "    auroraForceBalcony: !!(sb && sb.classList.contains('aurora-force')),",
  "    seasonClass: strip ? ((strip.getAttribute('class') || '').match(/season-[a-z]+/) || [null])[0] : null,",
  "    stage: window.currentStageName || null,",
  "    captionKey: window.__captionKey ? window.__captionKey() : null",
  "  };",
  "}"
].join("\n");

// Run the FULL reel to completion, timing it, then snapshot the clean end.
var FULL_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  COMMON,
  "  var report = { errors: [], reducedMotion: null, durationMs: null, ended: false, snap: null, sawCursorDuringRun: false, sawPartyDuringRun: false, peakStage: null };",
  "  async function run() {",
  "    report.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);",
  "    if (!window.__startCinematic) { window.__errs.push('no __startCinematic hook'); return; }",
  "    var t0 = performance.now();",
  "    window.__startCinematic();",
  "    // poll the whole run: sample that the ghost cursor + party actually appear mid-reel,",
  "    // and detect the end (the reel flips __cinematic false via its own stopCinematic()).",
  "    var guard = 0;",
  "    while (window.__cinematic && guard < 2000) {",
  "      if (document.getElementById('cine-cursor')) report.sawCursorDuringRun = true;",
  "      if (window.__gardenPartyOn) { report.sawPartyDuringRun = true; if (window.currentStageName === 'garden') report.peakStage = 'garden'; }",
  "      await sleep(120);",
  "      guard++;",
  "    }",
  "    report.durationMs = Math.round(performance.now() - t0);",
  "    report.ended = !window.__cinematic;",
  "    await sleep(600);", // let the final stopCinematic teardown + caption restore settle
  "    report.snap = snapshot();",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      run().catch(function (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }).then(function () { finish(report); });",
  "    }, 400);",
  "  });",
  "})();",
  "</script>"
].join("\n");

// Start the reel, then TAKE OVER partway through (__stopCinematic) and snapshot the teardown.
var TAKEOVER_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  COMMON,
  "  var report = { errors: [], stoppedMidRun: false, snap: null };",
  "  async function run() {",
  "    if (!window.__startCinematic) { window.__errs.push('no __startCinematic hook'); return; }",
  "    window.__startCinematic();",
  "    await sleep(20000);", // ~20s in — deep in the garden party (party lit, guests, roster/season)
  "    report.stoppedMidRun = !!window.__cinematic;",
  "    if (window.__stopCinematic) window.__stopCinematic();",
  "    await sleep(800);",
  "    report.snap = snapshot();",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      run().catch(function (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }).then(function () { finish(report); });",
  "    }, 400);",
  "  });",
  "})();",
  "</script>"
].join("\n");

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) { failures++; console.log("  ✗ " + msg); if (detail) console.log("      " + String(detail).split("\n").join("\n      ")); }

// Assert every reel-touched bit of state is clean in a post-run snapshot.
function assertClean(label, s) {
  if (!s) { fail(label + ": snapshot captured"); return; }
  if (!s.cinematic) pass(label + ": __cinematic cleared"); else fail(label + ": __cinematic cleared");
  if (!s.cursor) pass(label + ": ghost cursor removed"); else fail(label + ": ghost cursor removed");
  if (s.ripples === 0) pass(label + ": no stranded ripples"); else fail(label + ": no stranded ripples", s.ripples + " left");
  if (!s.partyOn && !s.uvMode) pass(label + ": garden party + UV torn down"); else fail(label + ": garden party + UV torn down", JSON.stringify({ partyOn: s.partyOn, uvMode: s.uvMode }));
  if (!s.rosterOpen && !s.rosterPanelShown) pass(label + ": who's-who panel closed"); else fail(label + ": who's-who panel closed", JSON.stringify({ open: s.rosterOpen, shown: s.rosterPanelShown }));
  if (!s.coupleShowing) pass(label + ": balcony couple released"); else fail(label + ": balcony couple released");
  if (!s.auroraForceGarden && !s.auroraForceBalcony) pass(label + ": aurora override cleared"); else fail(label + ": aurora override cleared", JSON.stringify({ g: s.auroraForceGarden, b: s.auroraForceBalcony }));
  if (!s.seasonClass) pass(label + ": no previewed season stranded"); else fail(label + ": no previewed season stranded", s.seasonClass);
}

console.log("Trailer cinematic — FULL reel (forced full-motion, focused):");
var r = lib.runPageSync("rsvp.html", FULL_HARNESS, 90000, { patchRaf: true, forceMotion: true });
if (!r) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  if (r.reducedMotion === false) pass("full-motion path selected (prefers-reduced-motion overridden)");
  else fail("full-motion path selected", "reduceMotion=" + r.reducedMotion);
  if (r.ended) pass("reel ran to a clean end on its own (stopCinematic fired)");
  else fail("reel ran to a clean end on its own", "still running after the guard window");
  if (r.durationMs != null && r.durationMs >= 55000 && r.durationMs <= 68000) pass("full reel duration ~1 minute (" + (r.durationMs / 1000).toFixed(1) + "s, target 55-65s)");
  else fail("full reel duration in the 55-68s band", "measured " + (r.durationMs == null ? "null" : (r.durationMs / 1000).toFixed(1) + "s"));
  if (r.sawCursorDuringRun) pass("ghost cursor visible during the run");
  else fail("ghost cursor visible during the run");
  if (r.sawPartyDuringRun && r.peakStage === "garden") pass("garden party is the showpiece (party lit in the garden mid-reel)");
  else fail("garden party lit in the garden mid-reel", JSON.stringify({ party: r.sawPartyDuringRun, peak: r.peakStage }));
  if (r.snap && r.snap.stage === "balcony") pass("reel closes on the balcony");
  else fail("reel closes on the balcony", r.snap ? r.snap.stage : "no snapshot");
  assertClean("full-end", r.snap);
  if (r.errors.length === 0) pass("no uncaught JS errors across the full reel");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

console.log("");
console.log("Trailer cinematic — mid-reel TAKE OVER teardown:");
var t = lib.runPageSync("rsvp.html", TAKEOVER_HARNESS, 40000, { patchRaf: true, forceMotion: true });
if (!t) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  if (t.stoppedMidRun) pass("reel was still running at the take-over point");
  else fail("reel was still running at the take-over point (raise the wait, or it's too short)");
  assertClean("take-over", t.snap);
  if (t.errors.length === 0) pass("no uncaught JS errors through the take-over");
  else fail("no uncaught JS errors", t.errors.slice(0, 12).join("\n"));
}

console.log("");
console.log("Trailer cinematic — reduced-motion path (default headless):");
var rm = lib.runPageSync("rsvp.html", FULL_HARNESS, 45000, { patchRaf: true, forceReduce: true });
if (!rm) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  if (rm.reducedMotion === true) pass("reduced-motion path selected");
  else fail("reduced-motion path selected", "reduceMotion=" + rm.reducedMotion);
  if (rm.ended) pass("reduced reel ran to a clean end");
  else fail("reduced reel ran to a clean end");
  if (rm.durationMs != null && rm.durationMs <= 40000) pass("reduced reel is shorter (" + (rm.durationMs / 1000).toFixed(1) + "s)");
  else fail("reduced reel is shorter than the full one (<=40s)", rm.durationMs == null ? "null" : (rm.durationMs / 1000).toFixed(1) + "s");
  assertClean("reduced-end", rm.snap);
  if (rm.errors.length === 0) pass("no uncaught JS errors across the reduced reel");
  else fail("no uncaught JS errors", rm.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }
