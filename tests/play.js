#!/usr/bin/env node
// Interaction smoke tests for both pages: each loads in headless Chrome with
// errors collected, plays through its core flow, then click-storms every
// interactive element. Fails on any uncaught JS error or broken flow.
// Slower than check.js (~4s total); run after changes touching game logic
// or interactions.
//
// Usage: node tests/play.js
"use strict";

var lib = require("./lib"); // head hook + scratch-copy page runner (shared with state.js)

var COMMON = [
  "function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "function fire(el, type) {",
  "  if (!el) return false;",
  "  if (type === 'enter') el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));",
  "  else el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));",
  "  return true;",
  "}",
  "function click(id) { return fire(document.getElementById(id), 'click'); }",
  "function finish(report) {",
  "  report.errors = window.__errs;",
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
  "    fire(els[i], 'click');",
  "    report.stormClicked++;",
  "    if (i % 15 === 0) await sleep(150);",
  "  }",
  "  await sleep(1500);",
  "  for (var j = 0; j < els.length; j++) {",
  "    fire(els[j], 'dblclick');",
  "    fire(els[j], 'enter');",
  "    if (j % 15 === 0) await sleep(150);",
  "  }",
  "}"
].join("\n");

var RSVP_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  COMMON,
  "  var report = { errors: [], solve: {}, stormClicked: 0, missing: [] };",
  "  function expect(id) { if (!document.getElementById(id)) report.missing.push(id); return id; }",
  "  async function solve() {",
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
  "    report.solve.afterKitchen = window.currentStageIndex;",
  "    click(expect('garden-monstera'));",
  "    click(expect('garden-ukulele'));",
  "    click(expect('garden-candle-1'));",
  "    click(expect('garden-candle-2'));",
  "    await sleep(1500);",
  "    report.solve.afterGarden = window.currentStageIndex;",
  "    click(expect('cuddly-octopus'));",
  "    await sleep(400);",
  "    click(expect('cuddly-balcony-door'));", // middle step: open the balcony door before a blanket counts
  "    await sleep(400);",
  "    fire(document.getElementById(expect('cuddly-blanket')), 'enter');",
  "    await sleep(1200);",
  "    report.solve.afterCuddly = window.currentStageIndex;",
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
  "    report.solve.afterOffice = window.currentStageIndex;",
  "    await sleep(8000);", // let the finale timers (rain/melody/rainbow/fireworks) run
  "    report.solve.final = window.currentStageIndex;",
  "  }",
  "  async function revisit() {",
  "    // Post-unlock exploration: re-entering a SOLVED room shows a rotating 'enjoy",
  "    // wandering' caption, not its solve instruction. Runs BEFORE the storm so the",
  "    // kitchen bar is still down (the storm can flip the party switch and raise it,",
  "    // which would legitimately swap in the bar caption and mask this check).",
  "    if (!window.goToStage) return;",
  "    window.goToStage('kitchen');",            // idx 0 < maxUnlocked (4) → solved
  "    await sleep(80);",
  "    report.revisit = { barUp: !!(window.__barUpNow && window.__barUpNow()) };",
  "    report.revisit.first = window.__captionKey ? window.__captionKey() : null;",  // first solved-entry → base line
  "    window.goToStage('garden');",
  "    await sleep(80);",
  "    window.goToStage('kitchen');",            // second solved-entry → rotation advances
  "    await sleep(80);",
  "    report.revisit.second = window.__captionKey ? window.__captionKey() : null;",
  "  }",
  "  async function stormStages() {",
  "    var stages = ['kitchen', 'garden', 'cuddly', 'office', 'balcony'];",
  "    for (var s = 0; s < stages.length; s++) {",
  "      if (window.goToStage) window.goToStage(stages[s]);",
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
  "  var report = { errors: [], found: [], cheatsheetOpen: false, stormClicked: 0, missing: [] };",
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
  var rv = r.revisit || {};
  if (rv.first === "explore_kitchen") pass("solved-room revisit shows the exploration base line (explore_kitchen), not a kitchen_* solve key");
  else fail("solved-room revisit shows the exploration base line", "revisit: " + JSON.stringify(rv));
  if (rv.second === rv.first) pass("later solved-room revisits keep the stable exploration caption");
  else fail("later solved-room revisits keep the stable exploration caption", "revisit: " + JSON.stringify(rv));
  if (r.stormClicked >= 60) pass("click-stormed " + r.stormClicked + " interactive elements");
  else fail("interactive element count sanity", "only " + r.stormClicked);
  if (r.errors.length === 0) pass("no uncaught JS errors across the entire run");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
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
