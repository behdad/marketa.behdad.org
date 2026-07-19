#!/usr/bin/env node
// Autoplay (attract-mode) test: the self-driving BBQ loop.
//
// Verifies the supervisor's contract, NOT the choreography (the full "Day in the Loft"
// cinematic's beats are already exercised end-to-end by play.js / enter.js). Same one-shot
// headless-Chrome runner as play.js (rAF→setTimeout patch, error collectors).
//
// It runs in phases on one page load:
//   1. REAL launch — autoplay(true) actually starts the cinematic (window.__cinematic true),
//      the badge shows, and autoplay(false) stops it cleanly.
//   2. LOOP — with the cinematic stubbed to run instantly, the loop cycles several times
//      (__autoplayLoops grows) and varies the season each loop (season() gets ≥2 distinct
//      names) — i.e. it advances through beats and returns to the start, forever.
//   3. PAUSE / no-accumulate — while looping, hide the tab: the running show is stopped, the
//      loop count STOPS growing while hidden (nothing ticks), and the DOM node count stays
//      bounded across a long hidden spell (no particle/timer pile-up — the crickets rule).
//      Unhiding resumes the loop. An UNFOCUSED-but-visible tab pauses the same way.
//   4. TAKEOVER — a human gesture (driven via the same code path the trusted listeners use)
//      exits autoplay and hands over the wheel.
// Fails on any uncaught JS error across the whole run.
//
// Usage: node tests/autoplay.js
"use strict";

var lib = require("./lib");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  var report={errors:[],phase1:{},phase2:{},phase3:{},phase4:{}};",
  // headless tabs are unfocused; autoplay gates on document.hasFocus() (the crickets rule),
  // so force it true, exactly like DEBUGGING.md recipe 2 does for focus-gated behaviour.
  "  document.hasFocus=function(){return true;};",
  // a redefinable document.hidden so we can simulate backgrounding
  "  var _hidden=false;",
  "  try { Object.defineProperty(document,'hidden',{configurable:true,get:function(){return _hidden;}});",
  "        Object.defineProperty(document,'visibilityState',{configurable:true,get:function(){return _hidden?'hidden':'visible';}}); } catch(e){}",
  "  function setHidden(h){ _hidden=h; document.dispatchEvent(new Event('visibilitychange')); }",
  "  function nodeCount(){ return document.getElementsByTagName('*').length; }",
  "  async function run(){",
  "    if (!window.autoplay || !window.__autoplayOn) { report.errors.push('autoplay API missing'); return; }",
  // ── Phase 1: the real thing actually starts ──
  "    window.autoplay(true);",
  "    await sleep(1400);",                 // the first loop launches on a ~400ms timer
  "    report.phase1.on = window.__autoplayOn();",
  "    report.phase1.cinematic = !!window.__cinematic;",
  "    var badge=document.getElementById('autoplay-badge');",
  "    report.phase1.badgeShown = !!(badge && badge.classList.contains('show'));",
  "    window.autoplay(false);",
  "    await sleep(200);",
  "    report.phase1.offAfterStop = !window.__autoplayOn();",
  "    report.phase1.cinematicStopped = !window.__cinematic;",
  "    report.phase1.badgeHidden = !!(badge && !badge.classList.contains('show'));",
  // ── Phase 2: stub the show to be instant, then watch the loop cycle + vary the season ──
  "    var seasons=[]; var realSeason=window.season;",
  "    window.season=function(n){ if(typeof n==='string') seasons.push(n); return realSeason ? realSeason.call(window,n) : n; };",
  "    var showTimer=null;",
  "    window.__startCinematic=function(){ window.__cinematic=true; if(showTimer)clearTimeout(showTimer); showTimer=setTimeout(function(){window.__cinematic=false;},300); };",  // a fast fake 'show'
  "    window.__stopCinematic=function(){ window.__cinematic=false; if(showTimer){clearTimeout(showTimer);showTimer=null;} };",
  "    window.autoplay(true);",
  "    await sleep(15000);",                // several gap(3.2s)+show(0.3s) cycles (~3.5s each) — expect ~4 loops, enough to see the season vary past any 'auto' draws
  "    report.phase2.loops = window.__autoplayLoops();",
  "    report.phase2.distinctSeasons = seasons.filter(function(v,i){return seasons.indexOf(v)===i;}).length;",
  "    report.phase2.on = window.__autoplayOn();",
  // ── Phase 3: hide → the loop pauses and does not accumulate; then resume ──
  "    var loopsBeforeHide = window.__autoplayLoops();",
  "    var nodesBeforeHide = nodeCount();",
  "    setHidden(true);",
  "    await sleep(300);",
  "    report.phase3.cinematicStoppedOnHide = !window.__cinematic;",
  "    await sleep(5000);",                 // a long hidden spell — the watchdog keeps idling
  "    report.phase3.loopsWhileHidden = window.__autoplayLoops() - loopsBeforeHide;", // must be 0 (paused)
  "    report.phase3.nodeGrowthWhileHidden = nodeCount() - nodesBeforeHide;",         // must stay tiny (no pile-up)
  "    setHidden(false);",
  "    await sleep(5000);",                 // resumed — loops grow again
  "    report.phase3.loopsAfterResume = window.__autoplayLoops() - loopsBeforeHide;",  // must be > 0
  // unfocused-but-visible pauses the same way (blur path)
  "    var realHasFocus=document.hasFocus; document.hasFocus=function(){return false;};",
  "    window.dispatchEvent(new Event('blur'));",
  "    var loopsBeforeBlur = window.__autoplayLoops();",
  "    await sleep(4000);",
  "    report.phase3.loopsWhileUnfocused = window.__autoplayLoops() - loopsBeforeBlur;", // must be 0
  "    document.hasFocus=realHasFocus; window.dispatchEvent(new Event('focus'));",
  // ── Phase 4: a human takeover exits autoplay ──
  "    if (window.__autoplayTakeover) window.__autoplayTakeover();",
  "    await sleep(200);",
  "    report.phase4.offAfterTakeover = !window.__autoplayOn();",
  "    window.autoplay(false);",            // clean up idle-resume so nothing relaunches
  "    window.season=realSeason;",
  "  }",
  "  window.addEventListener('load',function(){ setTimeout(function(){ run().catch(function(e){window.__errs.push('harness:'+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(report);}); },400); });",
  "})();",
  "</script>"
].join("\n");

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) { failures++; console.log("  ✗ " + msg); if (detail) console.log("      " + String(detail).split("\n").join("\n      ")); }

console.log("rsvp.html autoplay (attract mode):");
var r = lib.runPageSync("rsvp.html", HARNESS, 60000, { patchRaf: true });
if (!r) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  var p1 = r.phase1 || {}, p2 = r.phase2 || {}, p3 = r.phase3 || {}, p4 = r.phase4 || {};
  // Phase 1
  if (p1.on && p1.cinematic) pass("autoplay(true) starts the loop and the cinematic actually runs");
  else fail("autoplay(true) starts the cinematic", JSON.stringify(p1));
  if (p1.badgeShown) pass("the 'auto' badge shows while autoplay runs");
  else fail("the 'auto' badge shows while autoplay runs", JSON.stringify(p1));
  if (p1.offAfterStop && p1.cinematicStopped && p1.badgeHidden) pass("autoplay(false) stops the loop, the show, and hides the badge");
  else fail("autoplay(false) stops cleanly", JSON.stringify(p1));
  // Phase 2
  if (p2.loops >= 4) pass("the loop cycles repeatedly (" + p2.loops + " loops) — it returns to the start, forever");
  else fail("the loop cycles repeatedly (LOOPS)", "only " + p2.loops + " loop(s): " + JSON.stringify(p2));
  if (p2.distinctSeasons >= 2) pass("each loop varies the season (" + p2.distinctSeasons + " distinct seasons seen)");
  else fail("each loop varies the season", JSON.stringify(p2));
  // Phase 3
  if (p3.cinematicStoppedOnHide) pass("hiding the tab stops the running show (pause)");
  else fail("hiding the tab stops the running show", JSON.stringify(p3));
  if (p3.loopsWhileHidden === 0) pass("no loops advance while hidden (paused, not ticking)");
  else fail("loop must pause while hidden", "advanced " + p3.loopsWhileHidden + " loop(s) while hidden");
  if (p3.nodeGrowthWhileHidden <= 20) pass("DOM node count stays bounded across a long hidden spell (+" + p3.nodeGrowthWhileHidden + ", no pile-up)");
  else fail("no accumulation while hidden", "node count grew by " + p3.nodeGrowthWhileHidden + " while hidden");
  if (p3.loopsAfterResume > 0) pass("the loop resumes after the tab is shown again");
  else fail("the loop resumes on show", JSON.stringify(p3));
  if (p3.loopsWhileUnfocused === 0) pass("no loops advance while visible-but-UNFOCUSED (crickets rule)");
  else fail("loop must pause while unfocused", "advanced " + p3.loopsWhileUnfocused + " loop(s) while unfocused");
  // Phase 4
  if (p4.offAfterTakeover) pass("a human takeover exits autoplay");
  else fail("a human takeover exits autoplay", JSON.stringify(p4));
  // Errors
  if (r.errors.length === 0) pass("no uncaught JS errors across the entire run");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }
