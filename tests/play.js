#!/usr/bin/env node
// Interaction smoke tests for both pages: each loads in headless Chrome with
// errors collected, plays through its core flow, then click-storms every
// interactive element. Fails on any uncaught app JS error or broken flow;
// the RSVP external-launch probe narrowly filters Chrome's opaque originless error.
// Slower than check.js (~4s total); run after changes touching game logic
// or interactions.
//
// Usage: node tests/play.js
"use strict";

var lib = require("./lib"); // head hook + scratch-copy page runner (shared with state.js)

var COMMON = [
  "function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "function describeFireTarget(el, type) {",
  "  if (!el) return type + ':missing';",
  "  var token = el.id || el.getAttribute && (el.getAttribute('data-camp-car-action') || el.getAttribute('data-roadtrip-route-choice') || el.getAttribute('href') || el.getAttribute('class')) || el.tagName;",
  "  return type + ':' + String(token).replace(/\\s+/g, '.').slice(0, 180);",
  "}",
  "function fire(el, type) {",
  "  if (!el) return false;",
  "  window.__lastPlayFire = describeFireTarget(el, type);",
  "  if (el.classList && el.classList.contains('rsvp-send')) window.__rsvpExternalProbeFired = true;",
  "  if (type === 'enter') el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));",
  "  else el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));",
  "  return true;",
  "}",
  "function click(id) { return fire(document.getElementById(id), 'click'); }",
  "function isExternalLauncher(el) {",
  "  return !!el && (el.tagName === 'A' || el.classList.contains('party-send') || el.classList.contains('rsvp-send'));",
  "}",
  "function isOpaqueRsvpExternalError(e) {",
  "  return !!window.__rsvpExternalProbeFired && !!e && e.message === 'Script error.' && !e.filename && !e.lineno && !e.colno && !e.error;",
  "}",
  "window.__opaqueFilterBeforeRsvpProbe = isOpaqueRsvpExternalError({ message: 'Script error.', filename: '', lineno: 0, colno: 0, error: null });",
  "window.__weddingTestShouldIgnoreError = isOpaqueRsvpExternalError;",
  "function finish(report) {",
  "  report.errors = window.__errs;",
  "  report.errorTarget = window.__firstPlayErrorTarget || '';",
  "  report.ignoredOpaqueErrors = window.__ignoredWeddingTestErrors || 0;",
  "  report.opaqueFilter = {",
  "    beforeProbe: window.__opaqueFilterBeforeRsvpProbe,",
  "    external: isOpaqueRsvpExternalError({ message: 'Script error.', filename: '', lineno: 0, colno: 0, error: null }),",
  "    sameOrigin: isOpaqueRsvpExternalError({ message: 'Script error.', filename: location.href, lineno: 1, colno: 1, error: new Error('boom') })",
  "  };",
  "  document.getElementById('__report').textContent = JSON.stringify(report);",
  "}",
  "function pointerEls() {",
  "  // cursor:pointer inherits, so match only the topmost pointer element in",
  "  // each subtree (the actual clickable object, not every SVG child).",
  "  return Array.prototype.filter.call(document.querySelectorAll('body *'), function (el) {",
  "    try {",
  "      if (getComputedStyle(el).cursor !== 'pointer') return false;",
  "      var p = el.parentElement;",
  "      while (p && p !== document.body) {",
  "        if (getComputedStyle(p).cursor === 'pointer') return false;",
  "        p = p.parentElement;",
  "      }",
  "      return true;",
  "    } catch (e) { return false; }",
  "  });",
  "}",
  "async function storm(report) {",
  "  var els = pointerEls();",
  "  for (var i = 0; i < els.length; i++) {",
  "    if (isExternalLauncher(els[i])) report.external.clicked.push(els[i].id || els[i].tagName);",
  "    fire(els[i], 'click');",
  "    report.stormClicked++;",
  "    if (i % 15 === 0) await sleep(150);",
  "  }",
  "  await sleep(1500);",
  "  for (var j = 0; j < els.length; j++) {",
  "    // External launchers already receive click coverage. Re-activating them can surface",
  "    // an opaque cross-origin Script error in headless Chrome.",
  "    if (isExternalLauncher(els[j])) report.external.skipped.push(els[j].id || els[j].tagName);",
  "    else { fire(els[j], 'dblclick'); fire(els[j], 'enter'); }",
  "    if (j % 15 === 0) await sleep(150);",
  "  }",
  "}",
  "window.addEventListener('error', function (e) {",
  "  if (isOpaqueRsvpExternalError(e)) return;",
  "  if (!window.__firstPlayErrorTarget) window.__firstPlayErrorTarget = window.__lastPlayFire || 'before-fire';",
  "});"
].join("\n");

var RSVP_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  COMMON,
  "  var report = { errors: [], solve: {}, stormClicked: 0, missing: [], external: { clicked: [], skipped: [] } };",
  "  function expect(id) { if (!document.getElementById(id)) report.missing.push(id); return id; }",
  "  async function solve() {",
  "    if (window.__endAttract) window.__endAttract();",
  "    await sleep(40);",
  "    if (window.__openingGuideShowing && window.__openingGuideShowing()) fire(document.querySelector('#opening-guide-coach .hunt-coach-x'), 'click');",
  "    await sleep(20);",
  "    if (window.__openingGuideShowing && window.__openingGuideShowing()) fire(document.querySelector('#opening-guide-coach .hunt-coach-x'), 'click');",
  "    await sleep(20);",
  "    click(expect('kitchen-portafilter'));",       // the portafilter advances whichever coffee step comes next
  "    await sleep(2800);",                         // the espresso machine must finish warming before the grinder accepts input
  "    click(expect('kitchen-portafilter'));",       // flies to the grinder (FLY_MS), then grinds (GRIND_MS)
  "    await sleep(2100);",
  "    click(expect('kitchen-portafilter'));",       // tamps, then flies back to the grouphead (FLY_MS)
  "    await sleep(2100);",
  "    click(expect('kitchen-portafilter'));",
  "    await sleep(2700);",
  "    click(expect('kitchen-shotcup'));",
  "    await sleep(1500);",
  "    report.solve.afterKitchen = window.__currentStageIndex;",
  "    click(expect('garden-monstera'));",
  "    click(expect('garden-ukulele'));",
  "    click(expect('garden-candle-1'));",
  "    click(expect('garden-candle-2'));",
  "    await sleep(1500);",
  "    report.solve.afterGarden = window.__currentStageIndex;",
  "    click(expect('cuddly-octopus'));",
  "    await sleep(400);",
  "    click(expect('cuddly-balcony-door'));", // middle step: open the balcony door before a blanket counts
  "    await sleep(400);",
  "    fire(document.getElementById(expect('cuddly-blanket')), 'enter');",
  "    await sleep(1200);",
  "    report.solve.afterCuddly = window.__currentStageIndex;",
  "    click(expect('office-laptop'));",      // open Markéta's Mac
  "    await sleep(340);",                     // let the lid-open toggle (240ms) fire
  "    click(expect('laptop-calltile'));",     // Call Prague — the required finale first step
  "    await sleep(3600);",                     // the sequence gate sets on CONNECT (~3.4s after the ring starts)
  "    if (window.__endLaptopCall) window.__endLaptopCall();",
  "    await sleep(1600);",                     // let the goodbye finish and release the laptop modal
  "    click(expect('office-pc-desk-trio'));",  // power the PC — the finale also gates on playing with the computer
  "    await sleep(200);",
  "    if (window.__monitorZoomOut) window.__monitorZoomOut();", // room props are intentionally blocked while the monitor owns focus
  "    click(expect('office-lamp'));",
  "    click(expect('office-pendant'));",
  "    click(expect('office-stainedglass'));",
  "    await sleep(2600);",
  "    report.solve.afterOffice = window.__currentStageIndex;",
  "    report.solve.solvedBeforeParty = window.__solvedRooms ? window.__solvedRooms() : [];",
  "    if (window.__saveLoftCheckpoint) window.__saveLoftCheckpoint();",
  "    try { report.solve.savedSolved = JSON.parse(localStorage.getItem('loftCheckpoint:v1') || '{}').progress.solvedRooms || []; } catch (e) { report.solve.savedSolved = []; }",
  "    await sleep(8000);", // let the finale timers (rain/melody/rainbow/fireworks) run
  "    report.solve.final = window.__currentStageIndex;",
  "  }",
  "  async function revisit() {",
  "    // Post-unlock, pre-Party exploration uses the ordinary solved-room caption and",
  "    // never revives first-run arrows. Phase-two repeat-coffee coverage lives in phase2-progression.js. Runs BEFORE the storm so the",
  "    // kitchen bar is still down (the storm can flip the party switch and raise it,",
  "    // which would legitimately swap in the bar caption and mask this check).",
  "    if (!window.__goToStage) return;",
  "    window.__goToStage('kitchen');",
  "    await sleep(80);",
  "    report.revisit = { barUp: !!(window.__barUpNow && window.__barUpNow()), invites: document.querySelectorAll('#stage-kitchen .invite-pulse').length };",
  "    report.revisit.first = window.__captionKey ? window.__captionKey() : null;",  // first solved-entry → base line
  "    window.__goToStage('garden');",
  "    await sleep(80);",
  "    window.__goToStage('kitchen');",            // second solved-entry → rotation advances
  "    await sleep(80);",
  "    report.revisit.second = window.__captionKey ? window.__captionKey() : null;",
  "    window.__goToStage('office');",
  "    await sleep(80);",
  "    report.revisit.office = window.__captionKey ? window.__captionKey() : null;",
  "  }",
  "  async function stormStages() {",
  "    var stages = ['kitchen', 'garden', 'cuddly', 'office', 'balcony'];",
  "    for (var s = 0; s < stages.length; s++) {",
  "      if (window.__goToStage) window.__goToStage(stages[s]);",
  "      await sleep(120);",
  "    }",
  "    await storm(report);",
  "    await sleep(4000);", // flush scheduled timers (boot sequences, thunder, echoes)
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  // Pin the auto day/night clock to noon (deterministic daytime) so the real-time default
  // doesn't flip the loft to night mid-playthrough after dark — the solve/revisit captions
  // assume the daytime baseline. The clock-driven logic has its own fake-clock verification.
  "      window.__edmNowMins = function () { return 720; }; if (window.__applyAutoDayNight) window.__applyAutoDayNight();",
  "      solve().then(revisit).then(stormStages).catch(function (e) {",
  "        window.__errs.push('harness: ' + String(e && e.stack || e));",
  "      }).then(function () { finish(report); });",
  "    }, 400);",
  "  });",
  "})();",
  "</script>"
].join("\n");

var INDEX_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  COMMON,
  "  var report = { errors: [], found: [], cheatsheetOpen: false, stormClicked: 0, missing: [], external: { clicked: [], skipped: [] } };",
  "  function expect(id) { if (!document.getElementById(id)) report.missing.push(id); return id; }",
  "  async function collectEggs() {",
  "    try { localStorage.clear(); } catch (e) {}",
  "    var eggClicks = [",
  "      ['head', 'loft-behdad-head'],",
  "      ['guitar', 'loft-guitar'],",
  "      ['shoes', 'loft-behdad-shoes'],",
  "      ['plant', 'loft-plant'],",
  "      ['clapper', 'loft-clapper'],",
  "      ['book', 'garden-book'],",
  "      ['fish', 'garden-puffer-wrap'],",
  "      ['roach', 'loft-roach'],",
  "      ['rabbit', 'garden-rabbit'],",
  "      ['trip', 'loft-tofu']",
  "    ];",
  "    for (var i = 0; i < eggClicks.length; i++) {",
  "      click(expect(eggClicks[i][1]));",
  "      await sleep(400);",
  "    }",
  "    await sleep(900);",
  "    try { report.found = JSON.parse(localStorage.getItem('foundEggs') || '[]').sort(); } catch (e) {}",
  "    var sheet = document.getElementById('egg-cheatsheet');",
  "    report.cheatsheetOpen = !!(sheet && sheet.classList.contains('show'));",
  "    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));",
  "    await sleep(200);",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      collectEggs().then(function () { return storm(report); }).then(function () {",
  "        return sleep(4000);",
  "      }).catch(function (e) {",
  "        window.__errs.push('harness: ' + String(e && e.stack || e));",
  "      }).then(function () { finish(report); });",
  "    }, 400);",
  "  });",
  "})();",
  "</script>"
].join("\n");

function runPage(file, harness, budgetMs, patchRaf) {
  return lib.runPageSync(file, harness, budgetMs, { patchRaf: patchRaf });
}

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) {
  failures++;
  console.log("  ✗ " + msg);
  if (detail) console.log("      " + String(detail).split("\n").join("\n      "));
}

console.log("rsvp.html interaction playthrough:");
var r = runPage("rsvp.html", RSVP_HARNESS, 50000, true);
if (!r) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  if (r.missing.length) fail("all solve-path elements exist", "missing: " + r.missing.join(", "));
  else pass("all solve-path elements exist");
  if (r.solve.final === 4) pass("game solves start to finish (reached balcony)");
  else fail("game solves start to finish", "stage progression: " + JSON.stringify(r.solve));
  if (JSON.stringify(r.solve.solvedBeforeParty) === JSON.stringify(["kitchen", "garden", "cuddly", "office"])) pass("each completed Phase 1 room owns solved state before the party");
  else fail("completed Phase 1 rooms own solved state", "solve: " + JSON.stringify(r.solve));
  if (JSON.stringify(r.solve.savedSolved) === JSON.stringify(r.solve.solvedBeforeParty)) pass("checkpoint persists solved rooms independently of unlock state");
  else fail("checkpoint persists solved rooms", "solve: " + JSON.stringify(r.solve));
  var rv = r.revisit || {};
  if (rv.first === "explore_kitchen" && !rv.barUp && rv.invites === 0) pass("solved pre-Party Kitchen revisit uses exploration copy without invite arrows");
  else fail("solved pre-Party Kitchen revisit stays clean", "revisit: " + JSON.stringify(rv));
  if (rv.second === rv.first) pass("later pre-Party Kitchen revisits keep the stable exploration caption");
  else fail("later pre-Party Kitchen revisits keep the stable exploration caption", "revisit: " + JSON.stringify(rv));
  if (rv.office === "explore_office") pass("solved office revisit shows its own exploration caption");
  else fail("solved office revisit shows its own exploration caption", "revisit: " + JSON.stringify(rv));
  if (r.stormClicked >= 60) pass("click-stormed " + r.stormClicked + " interactive elements");
  else fail("interactive element count sanity", "only " + r.stormClicked);
  var ex = r.external || { clicked: [], skipped: [] };
  var rsvpLaunchers = ["rsvp-gmail-btn", "rsvp-mail-btn"];
  if (rsvpLaunchers.every(function (id) { return ex.clicked.indexOf(id) !== -1 && ex.skipped.indexOf(id) !== -1; })) pass("external RSVP launchers receive click coverage without redundant re-activation");
  else fail("external RSVP launcher storm policy", JSON.stringify(ex));
  if (r.opaqueFilter && !r.opaqueFilter.beforeProbe && r.opaqueFilter.external && !r.opaqueFilter.sameOrigin) pass("opaque-error filter is armed only by the RSVP external probe and preserves same-origin errors");
  else fail("opaque RSVP error-filter scope", JSON.stringify(r.opaqueFilter));
  if (r.errors.length === 0) pass("no uncaught JS errors across the entire run" + (r.ignoredOpaqueErrors ? " (ignored " + r.ignoredOpaqueErrors + " opaque external browser error" + (r.ignoredOpaqueErrors === 1 ? "" : "s") + ")" : ""));
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n") +
    (r.errorTarget ? "\nafter " + r.errorTarget : ""));
}

console.log("");
console.log("save-the-dates.html egg hunt + storm:");
var EGGS = ["book", "clapper", "fish", "guitar", "head", "plant", "rabbit", "roach", "shoes", "trip"];
var x = runPage("save-the-dates.html", INDEX_HARNESS, 30000, false);
if (!x) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  if (x.missing.length) fail("all egg-target elements exist", "missing: " + x.missing.join(", "));
  else pass("all egg-target elements exist");
  var missingEggs = EGGS.filter(function (e) { return x.found.indexOf(e) === -1; });
  if (missingEggs.length === 0 && x.found.length === EGGS.length) pass("all 10 eggs collectible (" + x.found.join(", ") + ")");
  else fail("all 10 eggs collectible", "found: [" + x.found.join(", ") + "] missing: [" + missingEggs.join(", ") + "]");
  if (x.cheatsheetOpen) pass("rabbit opened the cheatsheet");
  else fail("rabbit opened the cheatsheet");
  if (x.stormClicked >= 30) pass("click-stormed " + x.stormClicked + " interactive elements");
  else fail("interactive element count sanity", "only " + x.stormClicked);
  if (x.errors.length === 0) pass("no uncaught JS errors across the entire run");
  else fail("no uncaught JS errors", x.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures > 0) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
} else {
  console.log("All checks passed.");
}
