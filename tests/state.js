#!/usr/bin/env node
// Invariant checks for rsvp.html's game state, headless. No stored baseline —
// every check asserts a known-good invariant, so intentional feature work
// doesn't churn snapshots. Two small page loads run concurrently (~2s total):
//
// 1. CASCADE (own load, read-only): the recurring "one-shot animation loses the
//    cascade to an id-based state rule" bug (grooving swallowed the knife chop,
//    the instrument sway). For every pair of CSS rules (one-shot animation,
//    infinite state animation) that can target the same element, apply both
//    rules' classes to the element and assert getComputedStyle().animationName
//    still contains the one-shot's keyframe name — i.e. the one-shot must win
//    the cascade while both classes are present. Classes are restored after
//    each pair, nothing paints in between.
//
// 2. GATES (own load, stateful): the room-gated ambient-drone wiring — every
//    window.__updateXxx gate (PC fan, AC hum, radio, kettle, fire, birdsong)
//    exists, and goToStage hands each one its correct room boolean plus a
//    positive fade duration on EVERY room change (asserted via forwarding
//    spies, synchronously per goToStage call so ambient no-arg re-checks
//    can't muddy the record). Then a storm phase: all drone devices on,
//    rapid room cycling so every drone's start overlaps its room-change
//    fade-stop, settle past the close timers, and toggle the devices off —
//    headless has no audible output, so the assertion is wiring + liveness
//    (no uncaught errors, strip lands where asked), not sound.
//
// 3. PROBES (own load, stateful): hardcoded cross-room consequences —
//    - instrument: tap the ukulele -> audio unpaused + .playing sway + .grooving
//      on the cuddly heads and the office skull; tap again -> all of it stops.
//    - dusk: click the balcony sun -> every #stage-* gains .dusk; click again ->
//      none keep it ("night is night everywhere").
//    - extinguisher reset: dirty the state (dusk + music + dimmed lamp), fire
//      window.__activateExtinguisher() -> dusk cleared everywhere, songs paused,
//      back on kitchen, and the strip's class-state returns to its load-time
//      snapshot (catches one-shot/state classes that a reset leaves stranded).
//    - liveness: after all that chaos, goToStage("kitchen") still lands
//      (currentStageIndex === 0) and a known element (the pans) still visibly
//      reacts to a click (class mutation observed).
//
// Honest headless limits: the media clock doesn't advance under
// --virtual-time-budget, so "unpaused" is asserted, not audible progress —
// beat-position-dependent behavior stays untested. Synthetic events are
// untrusted (no native <button> activation, no fullscreen). CSS/WAAPI
// animations fast-forward under virtual time, so probes assert stable states,
// not mid-flight frames; the pans liveness check watches for the class
// MUTATION rather than the class being present (its one-shot may have already
// finished and been removed by assertion time).
//
// Usage:
//   node tests/state.js                # run everything
//   node tests/state.js --only cascade # just the cascade invariant
//   node tests/state.js --only gates   # just the drone room-gate wiring
//   node tests/state.js --only probes  # just the consequence/liveness probes
"use strict";

var lib = require("./lib");

var args = process.argv.slice(2);
var ONLY = (function () {
  var i = args.indexOf("--only");
  return i !== -1 ? String(args[i + 1] || "") : "";
})();

var CHROME_OPTS = {
  patchRaf: true,     // rAF never ticks under virtual time; app one-shots re-add classes via double-rAF
  seedRandom: true,   // deterministic reaction pickers
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
};

// Vetted "el||one-shot selector" pairs where the conflict is real in CSS but
// unreachable in JS today. Keep minimal — a reachable cascade bug belongs in a
// fix, not here.
var CASCADE_ALLOW = [
  // LATENT: .head-group.ouch (0,2,0 — line ~1265, before the .grooving rules)
  // loses to #cuddly-*-head.grooving (1,1,0) while music plays. No JS path adds
  // .ouch to a head today (only to #cuddly-octopus, which has its own id rule),
  // so it can't bite yet — but if head-ouch is ever wired up, the rule must be
  // id-qualified and moved after .grooving, like .chopped already was.
  "#cuddly-behdad-head||.head-group.ouch",
  "#cuddly-marketa-head||.head-group.ouch"
];

// "element ±class" diffs vs the load snapshot that are legitimate after an
// extinguisher reset. Injected into the probe harness too, so its settle-wait
// can stop early when only these remain. Keep minimal.
var RESET_DIFF_ALLOW = [
  // REAL-weather state, not game state: the live Edmonton feed toggles the garden
  // window's storm view whenever it's actually raining there — it can arrive between
  // the load snapshot and the reset diff, and a reset must NOT clear the sky
  "#stage-garden +storming",
  "#stage-garden -storming",
  // Known reset gap: __updateGrowlightForNight() turns the grow light off at
  // dusk, but resetHunt()/resetBalconyDusk() clears dusk without re-running it,
  // so a reset from nighttime leaves the grow light dark in daytime. Self-heals
  // when the ~20-50s grow-cycle timer next fires; harmless, but if resetHunt
  // ever calls __updateGrowlightForNight, drop this entry.
  "#garden-growlight +off"
];

// ── cascade harness ─────────────────────────────────────────────────────────
var CASCADE_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function () {",
  "  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "  var report = { errors: [], pairsChecked: 0, oneShotRules: 0, infiniteRules: 0, skippedSelectors: 0, failures: [] };",
  "  function finish() { report.errors = window.__errs; document.getElementById('__report').textContent = JSON.stringify(report); }",
  "  function collectAnimRules() {",
  "    var out = [];",
  "    function walk(rules) {",
  "      for (var i = 0; i < rules.length; i++) {",
  "        var r = rules[i];",
  "        if (r.type === 1) {",
  "          var an = r.style && r.style.animationName;",
  "          if (!an || an === 'none') continue;",
  "          var names = an.split(',').map(function (s) { return s.trim(); }).filter(function (n) { return n && n !== 'none'; });",
  "          if (!names.length) continue;",
  "          out.push({ sel: r.selectorText, names: names, infinite: /infinite/.test(r.style.animationIterationCount || '') });",
  "        } else if (r.type === 4) {", // @media: only rules that actually apply in this environment
  "          if (window.matchMedia(r.conditionText || r.media.mediaText).matches) walk(r.cssRules);",
  "        } else if (r.cssRules) {",
  "          walk(r.cssRules);",
  "        }",
  "      }",
  "    }",
  "    for (var s = 0; s < document.styleSheets.length; s++) {",
  "      try { walk(document.styleSheets[s].cssRules); } catch (e) {}",
  "    }",
  "    return out;",
  "  }",
  "  function compoundBits(comp) {",
  "    var id = (comp.match(/#([\\w-]+)/) || [])[1] || null;",
  "    var classes = [], re = /\\.([\\w-]+)/g, m;",
  "    while ((m = re.exec(comp))) classes.push(m[1]);",
  "    return { id: id, classes: classes };",
  "  }",
  "  function rightCompound(sel) {",
  "    var parts = sel.trim().split(/[\\s>+~]+/).filter(Boolean);",
  "    return parts[parts.length - 1] || '';",
  "  }",
  "  function idCompounds(sel) {", // every '#id.cls' compound anywhere in the selector (ancestor state classes)
  "    var out = [];",
  "    sel.split(/[\\s>+~]+/).forEach(function (comp) {",
  "      var b = compoundBits(comp);",
  "      if (b.id && b.classes.length) out.push(b);",
  "    });",
  "    return out;",
  "  }",
  "  // Classes the page's JS actually toggles (string literals inside",
  "  // classList.add/remove/toggle calls). Grafting a class onto a candidate is",
  "  // only meaningful if some code path can put it there — without this filter,",
  "  // structural identity classes get grafted across unrelated elements (the",
  "  // static star .twinkle dots were being dressed up as .balcony-bulb).",
  "  // Limitation: classes passed as variables (var cls = ...; classList.add(cls))",
  "  // aren't seen, so their pairs are skipped rather than checked.",
  "  function jsToggledClasses() {",
  "    var out = new Set();",
  "    for (var i = 0; i < document.scripts.length; i++) {",
  "      var src = document.scripts[i].textContent || '';",
  "      var callRe = /classList\\s*\\.\\s*(?:add|remove|toggle)\\s*\\(([^)]*)\\)/g, m;",
  "      while ((m = callRe.exec(src))) {",
  "        var litRe = /[\"']([\\w-]+)[\"']/g, lm;",
  "        while ((lm = litRe.exec(m[1]))) out.add(lm[1]);",
  "      }",
  "    }",
  "    return out;",
  "  }",
  "  function run() {",
  "    var toggleable = jsToggledClasses();",
  "    var rules = collectAnimRules();",
  "    var oneShots = [], infinites = [];",
  "    rules.forEach(function (r) {",
  "      r.sel.split(',').forEach(function (sel) {",
  "        sel = sel.trim();",
  "        if (!sel) return;",
  "        // pseudo-gated rules (:hover, ::after…) aren't co-cascade-testable by class juggling",
  "        if (sel.indexOf(':') !== -1) { report.skippedSelectors++; return; }",
  "        (r.infinite ? infinites : oneShots).push({ sel: sel, names: r.names });",
  "      });",
  "    });",
  "    report.oneShotRules = oneShots.length;",
  "    report.infiniteRules = infinites.length;",
  "    var candCache = new Map();",
  "    function candidates(bits) {",
  "      var key = (bits.id || '') + '|' + bits.classes.join('.');",
  "      if (candCache.has(key)) return candCache.get(key);",
  "      var els = [];",
  "      if (bits.id) {",
  "        var e = document.getElementById(bits.id);",
  "        if (e) els.push(e);",
  "      } else {",
  "        var seen = new Set();",
  "        bits.classes.forEach(function (c) {", // anchor on whichever classes exist in the DOM right now
  "          document.querySelectorAll('.' + c).forEach(function (e) {",
  "            if (!seen.has(e) && seen.size < 40) { seen.add(e); els.push(e); }",
  "          });",
  "        });",
  "      }",
  "      candCache.set(key, els);",
  "      return els;",
  "    }",
  "    var seenFail = new Set();",
  "    oneShots.forEach(function (os) {",
  "      var bits1 = compoundBits(rightCompound(os.sel));",
  "      candidates(bits1).forEach(function (E) {",
  "        infinites.forEach(function (inf) {",
  "          var bits2 = compoundBits(rightCompound(inf.sel));",
  "          if (bits2.id) { if (bits2.id !== E.id) return; }",
  "          else if (!bits2.classes.some(function (c) { return E.classList.contains(c) || bits1.classes.indexOf(c) !== -1; })) return;",
  "          var touched = new Map();",
  "          var graftable = true;",
  "          function apply(el, classes) {",
  "            classes.forEach(function (c) {",
  "              if (el.classList.contains(c)) return;",
  "              if (!toggleable.has(c)) { graftable = false; return; }",
  "              if (!touched.has(el)) touched.set(el, el.getAttribute('class') || '');",
  "              el.classList.add(c);",
  "            });",
  "          }",
  "          apply(E, bits1.classes);",
  "          apply(E, bits2.classes);",
  "          idCompounds(os.sel).concat(idCompounds(inf.sel)).forEach(function (b) {",
  "            var anc = document.getElementById(b.id);",
  "            if (anc) apply(anc, b.classes);",
  "          });",
  "          var ok = false;",
  "          try { ok = graftable && E.matches(os.sel) && E.matches(inf.sel); } catch (e) {}",
  "          if (ok) {",
  "            report.pairsChecked++;",
  "            var winner = getComputedStyle(E).animationName.split(',').map(function (s) { return s.trim(); });",
  "            var missing = os.names.filter(function (n) { return winner.indexOf(n) === -1; });",
  "            if (missing.length) {",
  "              var elDesc = E.id ? '#' + E.id : rightCompound(os.sel);",
  "              var key = elDesc + '||' + os.sel + '||' + inf.sel;",
  "              if (!seenFail.has(key)) {",
  "                seenFail.add(key);",
  "                report.failures.push({ el: elDesc, oneShot: os.sel, oneShotNames: os.names, state: inf.sel, computed: winner.join(',') });",
  "              }",
  "            }",
  "          }",
  "          touched.forEach(function (orig, el) { el.setAttribute('class', orig); });",
  "        });",
  "      });",
  "    });",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      Promise.resolve().then(function () { return sleep(600); }).then(run).catch(function (e) {",
  "        window.__errs.push('harness: ' + String(e && e.stack || e));",
  "      }).then(finish);",
  "    }, 200);",
  "  });",
  "})();",
  "</script>"
].join("\n");

// ── drone room-gate wiring harness ──────────────────────────────────────────
var GATES_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function () {",
  "  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "  var report = { errors: [], asserts: [] };",
  "  function finish() { report.errors = window.__errs; document.getElementById('__report').textContent = JSON.stringify(report); }",
  "  function ok(label, cond, detail) { report.asserts.push({ label: label, ok: !!cond, detail: cond ? '' : String(detail || '') }); }",
  "  function click(id) { var e = document.getElementById(id); if (!e) return false; e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }",
  "  // which rooms each gate's drone is audible in — this mapping IS the invariant",
  "  // (goToStage's gate lines encode the same table; a drone leaking into the",
  "  // wrong room or gone silent in its own shows up here as a boolean mismatch)",
  "  var OWNERS = {",
  "    __updatePcFan: ['office'],",
  "    __updateACHum: ['garden', 'balcony'],",
  "    __updateRadioSound: ['kitchen'],",
  "    __updateKettleHum: ['kitchen'],",
  "    __updateFireSound: ['cuddly'],",
  "    __updateGardenBirdsong: ['garden']", // discrete chirps: room boolean only, no fade arg
  "  };",
  "  var FADED = ['__updatePcFan', '__updateACHum', '__updateRadioSound', '__updateKettleHum', '__updateFireSound'];",
  "  var ROOM_NAME_GATES = ['__updateACHum'];", // AC gets the room NAME (to pick its per-room pan), the rest a boolean
  "  var GATES = Object.keys(OWNERS);",
  "  async function run() {",
  "    await sleep(900);",
  "    ok('gates: window.goToStage exists', typeof window.goToStage === 'function');",
  "    GATES.forEach(function (g) { ok('gates: window.' + g + ' exists', typeof window[g] === 'function'); });",
  "    if (typeof window.goToStage !== 'function') return;",
  "",
  "    // spy phase: wrap each gate (forwarding, so real gate logic still runs) and",
  "    // walk every room; goToStage calls the gates synchronously, so resetting the",
  "    // record right before each call and reading it right after keeps ambient",
  "    // no-arg re-checks (visibilitychange, device toggles) out of the sample —",
  "    // and only calls whose first arg is a boolean count as room-gate calls.",
  "    var originals = {}, calls = {};",
  "    GATES.forEach(function (g) {",
  "      if (typeof window[g] !== 'function') return;",
  "      originals[g] = window[g];",
  "      window[g] = function () {",
  "        (calls[g] = calls[g] || []).push(Array.prototype.slice.call(arguments));",
  "        return originals[g].apply(this, arguments);",
  "      };",
  "    });",
  "    var CYCLE = ['garden', 'cuddly', 'office', 'balcony', 'kitchen'];", // every room once, ending back at the load default
  "    var boolBad = {}, fadeBad = {};",
  "    for (var i = 0; i < CYCLE.length; i++) {",
  "      var room = CYCLE[i];",
  "      calls = {};",
  "      window.goToStage(room);",
  "      GATES.forEach(function (g) {",
  "        if (!originals[g]) return;", // existence assert above already covers it
  "        var usesName = ROOM_NAME_GATES.indexOf(g) !== -1;",
  "        var expected = OWNERS[g].indexOf(room) !== -1;",
  "        var wanted = usesName ? room : expected;", // AC gets the room NAME; the rest a boolean
  "        var roomCalls = (calls[g] || []).filter(function (a) { return typeof a[0] === (usesName ? 'string' : 'boolean'); });",
  "        if (!(roomCalls.length > 0 && roomCalls.every(function (a) { return a[0] === wanted; }))) {",
  "          (boolBad[g] = boolBad[g] || []).push(room + ' wanted ' + wanted + ', got ' + (roomCalls.length ? JSON.stringify(roomCalls) : 'no room-arg call'));",
  "        }",
  "        if (FADED.indexOf(g) !== -1 && !(roomCalls.length > 0 && roomCalls.every(function (a) { return typeof a[1] === 'number' && isFinite(a[1]) && a[1] > 0; }))) {",
  "          (fadeBad[g] = fadeBad[g] || []).push(room + ': ' + JSON.stringify(roomCalls));",
  "        }",
  "      });",
  "      await sleep(80);",
  "    }",
  "    GATES.forEach(function (g) {",
  "      if (!originals[g]) return;",
  "      ok('gates: goToStage hands ' + g + ' its correct room arg in every room', !boolBad[g], (boolBad[g] || []).join(' | '));",
  "      if (FADED.indexOf(g) !== -1) {",
  "        ok('gates: goToStage passes ' + g + ' a positive fade on every room change', !fadeBad[g], (fadeBad[g] || []).join(' | '));",
  "      }",
  "      window[g] = originals[g];", // hand the real gates back before the storm
  "    });",
  "",
  "    // storm phase: every drone device on (fire is on by default), then rapid room",
  "    // cycling so each drone's start overlaps its room-change fade-stop, settle",
  "    // past the ~600ms close timers, then device-toggle stops (short default fade)",
  "    click('kitchen-scale');       // radio on",
  "    click('kitchen-kettle');      // kettle steaming",
  "    click('garden-minisplit');    // AC on",
  "    click('office-pc-desk-trio'); // PC (fan) on",
  "    var errsBefore = window.__errs.length;",
  "    var STORM = ['kitchen', 'garden', 'cuddly', 'office', 'balcony', 'kitchen', 'office', 'cuddly', 'garden', 'kitchen'];",
  "    for (var s = 0; s < STORM.length; s++) { window.goToStage(STORM[s]); await sleep(60); }",
  "    await sleep(1200);", // > ROOM_FADE * 1000 + 100 close timers, with slack
  "    click('kitchen-scale');",
  "    click('kitchen-kettle');",
  "    click('garden-minisplit');",
  "    click('office-pc-desk-trio');",
  "    await sleep(700);", // > default device-toggle fades (~0.15-0.3s) + close margin
  "    ok('gates: drone start/fade-stop storm across all rooms throws no errors', window.__errs.length === errsBefore, window.__errs.slice(errsBefore).join('; '));",
  "    ok('gates: strip lands where asked after the storm', window.currentStageIndex === 0, 'currentStageIndex=' + window.currentStageIndex);",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      run().catch(function (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }).then(finish);",
  "    }, 200);",
  "  });",
  "})();",
  "</script>"
].join("\n");

// ── consequence/liveness probe harness ──────────────────────────────────────
var PROBE_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function () {",
  "  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "  var report = { errors: [], asserts: [], resetDiff: [] };",
  "  function finish() { report.errors = window.__errs; document.getElementById('__report').textContent = JSON.stringify(report); }",
  "  function ok(label, cond, detail) { report.asserts.push({ label: label, ok: !!cond, detail: cond ? '' : String(detail || '') }); }",
  "  function el(id) { return document.getElementById(id); }",
  "  function has(id, cls) { var e = el(id); return !!(e && e.classList.contains(cls)); }",
  "  function click(id) { var e = el(id); if (!e) return false; var r = e.getBoundingClientRect(); e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); return true; }",
  "  var STAGES = ['stage-kitchen', 'stage-garden', 'stage-cuddly', 'stage-office', 'stage-balcony'];",
  "  var GROOVERS = ['cuddly-behdad-head', 'cuddly-marketa-head', 'office-skull'];",
  "  function nearestId(n) { while (n && n.nodeType === 1) { if (n.id) return n.id; n = n.parentNode; } return '?'; }",
  "  async function run() {",
  "    var strip = document.getElementById('loft-game-strip');",
  "    await sleep(900);",
  "    // load-time class snapshot of every element under the strip (element",
  "    // identity, not index — probes spawn/remove particle nodes)",
  "    var snap = new Map();",
  "    snap.set(strip, strip.getAttribute('class') || '');",
  "    strip.querySelectorAll('*').forEach(function (e) { snap.set(e, e.getAttribute('class') || ''); });",
  "",
  "    // instrument -> cross-room grooving",
  "    var uke = el('garden-ukulele'), song = el('ukulele-song-audio');",
  "    ok('probe setup: ukulele + song elements exist', uke && song);",
  "    click('garden-ukulele');",
  "    await sleep(450);",
  "    ok('instrument: song unpaused after ukulele tap', song && !song.paused, 'paused=' + (song && song.paused));",
  "    ok('instrument: ukulele gains .playing sway', has('garden-ukulele', 'playing'));",
  "    GROOVERS.forEach(function (id) {",
  "      ok('instrument: #' + id + ' grooves while music plays', has(id, 'grooving'));",
  "    });",
  "    click('garden-ukulele');",
  "    await sleep(350);",
  "    ok('instrument: second tap pauses the song', song && song.paused);",
  "    ok('instrument: .playing sway stops with the song', !has('garden-ukulele', 'playing'));",
  "    GROOVERS.forEach(function (id) {",
  "      ok('instrument: #' + id + ' stops grooving on pause', !has(id, 'grooving'));",
  "    });",
  "",
  "    // dusk: night is night everywhere",
  "    click('balcony-sun');",
  "    await sleep(300);",
  "    ok('dusk: every stage gains .dusk after sun click', STAGES.every(function (s) { return has(s, 'dusk'); }),",
  "      STAGES.map(function (s) { return s + '=' + has(s, 'dusk'); }).join(' '));",
  "    click('balcony-sun');",
  "    await sleep(300);",
  "    ok('dusk: second sun click clears .dusk everywhere', !STAGES.some(function (s) { return has(s, 'dusk'); }),",
  "      STAGES.map(function (s) { return s + '=' + has(s, 'dusk'); }).join(' '));",
  "",
  "    // extinguisher reset: dirty things first (dusk on, music on, lamp dimmed)",
  "    click('balcony-sun');",
  "    click('garden-ukulele');",
  "    click('office-lamp');",
  "    await sleep(450);",
  "    ok('reset setup: state is dirty (dusk + music + dimmed)',",
  "      has('stage-office', 'dusk') && song && !song.paused && has('office-lamp', 'dimmed'));",
  "    ok('reset hook exists: window.__activateExtinguisher', typeof window.__activateExtinguisher === 'function');",
  "    if (window.__activateExtinguisher) window.__activateExtinguisher();",
  "    await sleep(2200);", // hiss + wipe (700ms) + resetHunt + generous settle for animationend cleanups
  "    ok('reset: dusk cleared on every stage', !STAGES.some(function (s) { return has(s, 'dusk'); }));",
  "    var songs = ['guitar-song-audio', 'ukulele-song-audio'].map(el).filter(Boolean);",
  "    ok('reset: all songs paused', songs.every(function (a) { return a.paused; }));",
  "    ok('reset: back on the kitchen stage', window.currentStageIndex === 0, 'currentStageIndex=' + window.currentStageIndex);",
  "    ok('reset: wipe overlay released', !has('hunt-wipe', 'active'));",
  "    // class-state must match the load snapshot (a leftover one-shot/state",
  "    // class here is exactly the recurring stuck-class bug). One-shot bump",
  "    // classes (.tapped etc.) are dropped by animationend handlers, and under",
  "    // --virtual-time-budget those events can land after any fixed sleep — so",
  "    // poll until the diff settles to nothing (or to known-legit entries)",
  "    // instead of reading it once. The bound keeps the check honest: a class",
  "    // the reset genuinely strands never clears, so it still fails.",
  "    var RESET_ALLOW = " + JSON.stringify(RESET_DIFF_ALLOW) + ";",
  "    function resetDiffNow() {",
  "      var out = [];",
  "      snap.forEach(function (orig, e) {",
  "        if (!e.isConnected) return;", // app may legitimately replace nodes
  "        var now = e.getAttribute('class') || '';",
  "        if (now === orig) return;",
  "        var a = orig.split(/\\s+/).filter(Boolean), b = now.split(/\\s+/).filter(Boolean);",
  "        var gained = b.filter(function (c) { return a.indexOf(c) === -1; });",
  "        var lost = a.filter(function (c) { return b.indexOf(c) === -1; });",
  "        if (gained.length || lost.length) {",
  "          out.push((e.id ? '#' + e.id : 'in #' + nearestId(e.parentNode) + ' <' + e.tagName.toLowerCase() + '>') +",
  "            gained.map(function (c) { return ' +' + c; }).join('') + lost.map(function (c) { return ' -' + c; }).join(''));",
  "        }",
  "      });",
  "      return out;",
  "    }",
  "    var settleDiff = resetDiffNow();",
  "    for (var w = 0; w < 30 && settleDiff.some(function (d) { return RESET_ALLOW.indexOf(d) === -1; }); w++) {",
  "      await sleep(100);",
  "      settleDiff = resetDiffNow();",
  "    }",
  "    report.resetDiff = settleDiff;",
  "",
  "    // liveness: the game still responds after the chaos",
  "    if (window.goToStage) window.goToStage('kitchen');",
  "    await sleep(200);",
  "    ok('liveness: goToStage(kitchen) lands', window.currentStageIndex === 0, 'currentStageIndex=' + window.currentStageIndex);",
  "    var pans = el('kitchen-pans');",
  "    var mutated = false;",
  "    var obs = new MutationObserver(function () { mutated = true; });",
  "    if (pans) obs.observe(pans, { subtree: true, attributes: true, attributeFilter: ['class'] });",
  "    click('kitchen-pans');",
  "    await sleep(300);", // rAF-double re-add is 2 patched-rAF ticks (~32ms); the one-shot may finish AND be removed in here — the mutation is the signal
  "    obs.disconnect();",
  "    ok('liveness: pans still react to a click (class mutation seen)', mutated);",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      run().catch(function (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }).then(finish);",
  "    }, 200);",
  "  });",
  "})();",
  "</script>"
].join("\n");

// ── node-side driver ─────────────────────────────────────────────────────────
var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) {
  failures++;
  console.log("  ✗ " + msg);
  if (detail) console.log("      " + String(detail).split("\n").join("\n      "));
}

(async function main() {
  console.log("rsvp.html state invariants" + (ONLY ? " (--only " + ONLY + ")" : "") + ":");
  var jobs = {};
  if (!ONLY || "cascade".indexOf(ONLY) === 0) jobs.cascade = lib.runPage("rsvp.html", CASCADE_HARNESS, 9000, CHROME_OPTS);
  if (!ONLY || "gates".indexOf(ONLY) === 0) jobs.gates = lib.runPage("rsvp.html", GATES_HARNESS, 12000, CHROME_OPTS);
  if (!ONLY || "probes".indexOf(ONLY) === 0) jobs.probes = lib.runPage("rsvp.html", PROBE_HARNESS, 17000, CHROME_OPTS);
  if (!Object.keys(jobs).length) {
    fail("unknown --only value: " + ONLY + " (use cascade|gates|probes)");
  }
  var names = Object.keys(jobs);
  var results = {};
  (await Promise.all(names.map(function (n) { return jobs[n]; }))).forEach(function (r, i) { results[names[i]] = r; });

  if (results.cascade !== undefined) {
    var c = results.cascade;
    if (!c) {
      fail("cascade harness reported (page error before load, or budget too small)");
    } else {
      if (c.errors.length) fail("cascade: no uncaught JS errors", c.errors.slice(0, 12).join("\n"));
      else pass("cascade: no uncaught JS errors");
      // floor so a CSSOM-parsing regression can't silently pass with 0 work
      if (c.pairsChecked >= 10) pass("cascade: checked " + c.pairsChecked + " one-shot/state rule pairs (" + c.oneShotRules + " one-shot, " + c.infiniteRules + " infinite selectors)");
      else fail("cascade: pair coverage sanity", "only " + c.pairsChecked + " pairs checked — selector parsing broken?");
      var cascadeIssues = c.failures.filter(function (f) {
        return CASCADE_ALLOW.indexOf(f.el + "||" + f.oneShot) === -1;
      });
      if (cascadeIssues.length === 0) {
        pass("cascade: every one-shot animation survives its element's state rules");
      } else {
        fail("cascade: one-shot animation swallowed by an id-based state rule (id-qualify the one-shot AND move it later in source)",
          cascadeIssues.map(function (f) {
            return f.el + ": " + f.oneShot + " (wants " + f.oneShotNames.join(",") + ") loses to " + f.state + " -> computed animationName: " + f.computed;
          }).join("\n"));
      }
    }
  }

  if (results.gates !== undefined) {
    var g = results.gates;
    if (!g) {
      fail("gates harness reported (page error before load, or budget too small)");
    } else {
      if (g.errors.length) fail("gates: no uncaught JS errors", g.errors.slice(0, 12).join("\n"));
      else pass("gates: no uncaught JS errors");
      g.asserts.forEach(function (a) {
        if (a.ok) pass(a.label);
        else fail(a.label, a.detail);
      });
    }
  }

  if (results.probes !== undefined) {
    var p = results.probes;
    if (!p) {
      fail("probe harness reported (page error before load, or budget too small)");
    } else {
      if (p.errors.length) fail("probes: no uncaught JS errors", p.errors.slice(0, 12).join("\n"));
      else pass("probes: no uncaught JS errors");
      p.asserts.forEach(function (a) {
        if (a.ok) pass(a.label);
        else fail(a.label, a.detail);
      });
      var diff = p.resetDiff.filter(function (d) { return RESET_DIFF_ALLOW.indexOf(d) === -1; });
      if (diff.length === 0) pass("reset: strip class-state matches the load snapshot (no stranded classes)");
      else fail("reset: stranded class-state diffs vs load snapshot", diff.slice(0, 25).join("\n") + (diff.length > 25 ? "\n... and " + (diff.length - 25) + " more" : ""));
    }
  }

  console.log("");
  if (failures > 0) {
    console.log(failures + " check(s) failed.");
    process.exit(1);
  } else {
    console.log("All checks passed.");
  }
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
