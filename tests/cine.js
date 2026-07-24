#!/usr/bin/env node
// Trailer (▷ Trailer) cinematic tests: drives window.__startCinematic in headless
// Chrome and verifies (1) the FULL reel runs to a clean end in ~55-68s and visits all five
// rooms, (2) the entire run obeys the "texture, not solutions" edit — no roster, spotlight,
// formal moment, album capture, season preview, projector channel, computer/phone workflow,
// forced aurora, or held balcony couple — and (3) full end, Take over, and hidden-tab abort
// leave no cinematic presentation/state behind. A reduced-motion run checks the same edit,
// and a real post-reel balcony entry proves the normal first-arrival finale remains available.
//
// Timing method: under --virtual-time-budget timers fast-forward, but performance.now()
// tracks virtual time — so (end - start) of performance.now() around the run equals the
// SUMMED beat timeline (waitFor gates resolve immediately when their state is already
// satisfied, or hit their timeout; both are part of the real timeline). rAF is patched to
// setTimeout (lib patchRaf) so double-rAF toy reactions actually advance.
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
  "    frameRunning: !!document.querySelector('#hunt-fullscreen-area.cinematic-running'),",
  "    cineCaption: !!document.querySelector('#hunt-caption.cine-caption'),",
  "    candleLit: !!document.querySelector('#kitchen-candle.lit, #stage-kitchen.k-candle-lit'),",
  "    balconyUnlocked: !!(window.__balconyUnlocked && window.__balconyUnlocked()),",
  "    stage: window.currentStageName || null,",
  "    captionKey: window.__captionKey ? window.__captionKey() : null",
  "  };",
  "}",
  // Sample editorial invariants throughout the run. A clean end cannot prove a payoff was
  // never shown, so these flags latch on the first offending frame and survive teardown.
  "function sample(report) {",
  "  var stage = window.currentStageName || null; if (stage) report.seenStages[stage] = true;",
  "  var key = window.__captionKey ? window.__captionKey() : null; if (key) report.seenCaptions[key] = true;",
  "  var strip = document.getElementById('loft-game-strip');",
  "  var guests = document.getElementById('garden-guests');",
  "  var monitor = document.getElementById('office-monitor');",
  "  var panel = document.getElementById('roster-panel');",
  "  var rosterToggle = document.querySelector('.roster-toggle');",
  "  var picker = document.getElementById('garden-djpicker');",
  "  var phone = document.querySelector('.phone-backdrop.show');",
  "  var projector = window.__cuddlyProjector && window.__cuddlyProjector.channel ? window.__cuddlyProjector.channel() : 'off';",
  "  var albumNow = window.__albumList ? window.__albumList().length : report.albumStart;",
  "  if ((window.__rosterOpen && window.__rosterOpen()) || (panel && panel.classList.contains('show'))) report.spoilers.roster = true;",
  "  if ((picker && picker.classList.contains('open')) || (window.__cinematic && rosterToggle && getComputedStyle(rosterToggle).visibility !== 'hidden' && rosterToggle.classList.contains('avail'))) report.spoilers.partyUi = true;",
  "  if (guests && (guests.classList.contains('solo-spot') || guests.querySelector('.spotlighted'))) report.spoilers.spotlight = true;",
  "  if (window.__firstDanceOn || window.__slowDanceOn || window.__toastsOn || window.__groupPhotoOn || window.__sparklersOn || window.__cakeOn || window.__bouquetOn || window.__chairliftOn) report.spoilers.formalMoment = true;",
  "  if (strip && /(?:^|\\s)season-[a-z]+/.test(strip.getAttribute('class') || '')) report.spoilers.season = true;",
  "  if (projector !== 'off' && projector !== 'fire') report.spoilers.projector = true;",
  "  if ((monitor && /(?:^|\\s)show-/.test(monitor.getAttribute('class') || '')) || phone) report.spoilers.appWorkflow = true;",
  "  if (document.querySelector('#balcony-couple.showing')) report.spoilers.couple = true;",
  "  if (document.querySelector('#stage-garden.aurora-force, #stage-balcony.aurora-force')) report.spoilers.aurora = true;",
  "  if (window.__balconyUnlocked && window.__balconyUnlocked()) report.spoilers.finale = true;",
  "  if (albumNow > report.albumStart) report.spoilers.album = true;",
  "  var frame = document.getElementById('hunt-fullscreen-area');",
  "  if (window.__cinematic && frame && frame.classList.contains('cinematic-running') && document.querySelector('#hunt-caption.cine-caption')) report.sawPresentation = true;",
  "}"
].join("\n");

// Run the FULL reel to completion, timing it, then snapshot the clean end.
var FULL_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  COMMON,
  "  var report = { errors: [], reducedMotion: null, durationMs: null, ended: false, snap: null, realEntryArmed: false, sawCursorDuringRun: false, sawPartyDuringRun: false, peakStage: null, seenStages: {}, seenCaptions: {}, sawPresentation: false, albumStart: 0, spoilers: { roster:false, partyUi:false, spotlight:false, formalMoment:false, season:false, projector:false, appWorkflow:false, couple:false, aurora:false, finale:false, album:false } };",
  "  async function run() {",
  "    report.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);",
  "    if (!window.__startCinematic) { window.__errs.push('no __startCinematic hook'); return; }",
  "    var t0 = performance.now();",
  "    window.__startCinematic();",
  "    report.albumStart = window.__albumList ? window.__albumList().length : 0;",
  "    // poll the whole run: sample that the ghost cursor + party actually appear mid-reel,",
  "    // and detect the end (the reel flips __cinematic false via its own stopCinematic()).",
  "    var guard = 0;",
  "    while (window.__cinematic && guard < 2000) {",
  "      sample(report);",
  "      if (document.getElementById('cine-cursor')) report.sawCursorDuringRun = true;",
  "      if (window.__gardenPartyOn) { report.sawPartyDuringRun = true; if (window.currentStageName === 'garden') report.peakStage = 'garden'; }",
  "      await sleep(120);",
  "      guard++;",
  "    }",
  "    report.durationMs = Math.round(performance.now() - t0);",
  "    report.ended = !window.__cinematic;",
  "    await sleep(600);", // let the final stopCinematic teardown + caption restore settle
  "    report.snap = snapshot();",
  "    if (window.goToStage) { window.goToStage('office'); window.goToStage('balcony'); }",
  "    report.realEntryArmed = !!(window.__balconyUnlocked && window.__balconyUnlocked());",
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
  "  var report = { errors: [], stoppedMidRun: false, snap: null, seenStages: {}, seenCaptions: {}, sawPresentation: false, albumStart: 0, spoilers: { roster:false, partyUi:false, spotlight:false, formalMoment:false, season:false, projector:false, appWorkflow:false, couple:false, aurora:false, finale:false, album:false } };",
  "  async function run() {",
  "    if (!window.__startCinematic) { window.__errs.push('no __startCinematic hook'); return; }",
  "    window.__startCinematic();",
  "    report.albumStart = window.__albumList ? window.__albumList().length : 0;",
  "    for (var i=0; i<167 && window.__cinematic; i++) { sample(report); await sleep(120); }",
  // ~20s in: the party is lit and populated, but no identity/payload UI has been exposed.
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

// A hidden tab must abort rather than letting wall-clock timers outrun paused scene motion.
var HIDDEN_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  COMMON,
  "  var forcedHidden = false;",
  "  var report = { errors: [], started: false, snap: null };",
  "  async function run() {",
  "    if (!window.__startCinematic) { window.__errs.push('no __startCinematic hook'); return; }",
  "    Object.defineProperty(document, 'hidden', { configurable:true, get:function(){ return forcedHidden; } });",
  "    window.__startCinematic();",
  "    await sleep(2500);",
  "    report.started = !!window.__cinematic;",
  "    forcedHidden = true; document.dispatchEvent(new Event('visibilitychange'));",
  "    await sleep(700);",
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
  if (!s.frameRunning && !s.cineCaption) pass(label + ": cinematic presentation classes cleared"); else fail(label + ": cinematic presentation classes cleared", JSON.stringify({ frame: s.frameRunning, caption: s.cineCaption }));
  if (!s.candleLit) pass(label + ": trailer-owned candle cleared"); else fail(label + ": trailer-owned candle cleared");
  if (!s.balconyUnlocked) pass(label + ": first-arrival finale remains unspent"); else fail(label + ": first-arrival finale remains unspent");
}

function assertSpoilerFree(label, s) {
  if (!s) { fail(label + ": run report captured"); return; }
  var shown = Object.keys(s.spoilers || {}).filter(function (k) { return s.spoilers[k]; });
  if (shown.length === 0) pass(label + ": no solution/payoff systems shown");
  else fail(label + ": no solution/payoff systems shown", shown.join(", "));
}

function assertCoverage(label, seen) {
  var rooms = ["kitchen", "garden", "cuddly", "office", "balcony"];
  var missing = rooms.filter(function (room) { return !seen || !seen[room]; });
  if (!missing.length) pass(label + ": all five rooms appear");
  else fail(label + ": all five rooms appear", "missing " + missing.join(", "));
}

function assertCaptions(label, seen, expected) {
  var missing = expected.filter(function (key) { return !seen || !seen[key]; });
  if (!missing.length) pass(label + ": authored captions complete");
  else fail(label + ": authored captions complete", "missing " + missing.join(", "));
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
  if (r.sawPresentation) pass("authored film presentation active during the run");
  else fail("authored film presentation active during the run");
  assertCoverage("full reel", r.seenStages);
  assertCaptions("full reel", r.seenCaptions, ["cine_open", "cine_details", "cine_garden_texture", "cine_room_rhythm", "cine_arrivals", "cine_quiet_corner", "cine_desk_play", "cine_evening", "cine_invite", "cine_signoff"]);
  assertSpoilerFree("full reel", r);
  if (r.sawPartyDuringRun && r.peakStage === "garden") pass("garden party is the showpiece (party lit in the garden mid-reel)");
  else fail("garden party lit in the garden mid-reel", JSON.stringify({ party: r.sawPartyDuringRun, peak: r.peakStage }));
  if (r.snap && r.snap.stage === "balcony") pass("reel closes on the balcony");
  else fail("reel closes on the balcony", r.snap ? r.snap.stage : "no snapshot");
  assertClean("full-end", r.snap);
  if (r.realEntryArmed) pass("a later real balcony entry still arms the finale");
  else fail("a later real balcony entry still arms the finale");
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
  assertSpoilerFree("take-over run", t);
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
  assertCoverage("reduced reel", rm.seenStages);
  assertCaptions("reduced reel", rm.seenCaptions, ["cine_open", "cine_room_rhythm", "cine_arrivals", "cine_quiet_corner", "cine_desk_play", "cine_evening", "cine_invite", "cine_signoff"]);
  assertSpoilerFree("reduced reel", rm);
  assertClean("reduced-end", rm.snap);
  if (rm.errors.length === 0) pass("no uncaught JS errors across the reduced reel");
  else fail("no uncaught JS errors", rm.errors.slice(0, 12).join("\n"));
}

console.log("");
console.log("Trailer cinematic — hidden-tab abort:");
var h = lib.runPageSync("rsvp.html", HIDDEN_HARNESS, 15000, { patchRaf: true, forceMotion: true });
if (!h) {
  fail("hidden-tab harness reported");
} else {
  if (h.started) pass("reel was active before visibility loss"); else fail("reel was active before visibility loss");
  assertClean("hidden-tab", h.snap);
  if (h.errors.length === 0) pass("no uncaught JS errors through hidden-tab abort");
  else fail("no uncaught JS errors through hidden-tab abort", h.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }
