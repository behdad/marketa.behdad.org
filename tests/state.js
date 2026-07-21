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
//    - extinguisher reset: dirty the state (dusk + music + dimmed lamp + the
//      cuddly cabinet open, which sends its hidden mouse on its one dash), fire
//      window.__activateExtinguisher() -> dusk cleared everywhere, songs paused,
//      back on kitchen, and the strip's class-state returns to its load-time
//      snapshot (catches one-shot/state classes that a reset leaves stranded).
//      Then re-open the cabinet: the mouse must dash AGAIN. That last assert is
//      the one a class diff structurally cannot make — the "already ran" latch is
//      a closure var, so a reset can look spotless in the DOM and still leave a
//      once-per-game toy spent. Re-drive the trigger for any toy like that.
//    - liveness: after all that chaos, goToStage("kitchen") still lands
//      (currentStageIndex === 0) and a known element (the pans) still visibly
//      reacts to a click (class mutation observed).
//    - phone external launch: a GCal click keeps the pocket phone open when its
//      new tab hides this page after a delay, while a later unrelated hide still
//      performs the normal phone teardown.
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
  // REAL-weather state, not game state: the live Edmonton feed drives the loft's default
  // sky — when it's actually raining/storming there every stage wears .storming (not just
  // the garden window). It can arrive between the load snapshot and the reset diff, and a
  // reset must NOT clear the sky, so a ±storming diff on any stage is legitimate.
  "#stage-garden +storming",
  "#stage-garden -storming",
  "#stage-balcony +storming",
  "#stage-balcony -storming",
  "#stage-kitchen +storming",
  "#stage-kitchen -storming",
  "#stage-office +storming",
  "#stage-office -storming",
  // Same real-weather feed, the precip (RAIN) layer: an actually-raining/storming Edmonton adds
  // .raining (pane streaks) TOGETHER WITH .storming in one applyRealWx pass (a dry storm would be
  // .storming alone, but the real feed only ever maps rain/thunderstorm → both). It can land
  // between the load snapshot and the reset diff, so a combined ±storming±raining diff on any
  // stage — as well as .raining on its own — is legitimate on reset.
  "#stage-garden +storming +raining",
  "#stage-garden -storming -raining",
  "#stage-balcony +storming +raining",
  "#stage-balcony -storming -raining",
  "#stage-kitchen +storming +raining",
  "#stage-kitchen -storming -raining",
  "#stage-office +storming +raining",
  "#stage-office -storming -raining",
  "#stage-garden +raining",
  "#stage-garden -raining",
  "#stage-balcony +raining",
  "#stage-balcony -raining",
  "#stage-kitchen +raining",
  "#stage-kitchen -raining",
  "#stage-office +raining",
  "#stage-office -raining",
  // Same real-weather feed, one derived layer further out: the aurora's cloud gate
  // (.aurora-clouded on the two sky stages) is stamped by gardenAurora from __skyCloudy(),
  // so it lands and clears WITH the rain/storm classes above — legitimate on reset for
  // exactly the same reason (a reset must not clear the real sky).
  "#stage-garden +aurora-clouded",
  "#stage-garden -aurora-clouded",
  "#stage-garden +storming +aurora-clouded",
  "#stage-garden -storming -aurora-clouded",
  "#stage-garden +raining +aurora-clouded",
  "#stage-garden -raining -aurora-clouded",
  "#stage-garden +storming +raining +aurora-clouded",
  "#stage-garden -storming -raining -aurora-clouded",
  "#stage-balcony +aurora-clouded",
  "#stage-balcony -aurora-clouded",
  "#stage-balcony +storming +aurora-clouded",
  "#stage-balcony -storming -aurora-clouded",
  "#stage-balcony +raining +aurora-clouded",
  "#stage-balcony -raining -aurora-clouded",
  "#stage-balcony +storming +raining +aurora-clouded",
  "#stage-balcony -storming -raining -aurora-clouded",
  // Same real-weather feed, plain-overcast look: a grey Edmonton day dims the sky via
  // .climate-overcast on the strip (no rain). Same lifecycle as .storming above — it can
  // land between snapshot and diff and a reset must not clear the real sky.
  "#loft-game-strip +climate-overcast",
  "#loft-game-strip -climate-overcast",
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
  // The auto day/night default follows Edmonton's real clock, so it would flip the loft to
  // night when the suite runs after dark and invert the manual-dusk probes. Pin the clock to
  // noon (deterministic day, same spirit as seedRandom) so dusk stays a manual-only toggle
  // here; the real-time logic is exercised in the feature's own fake-clock verification.
  "    window.__edmNowMins = function () { return 720; };",
  "    if (window.__applyAutoDayNight) window.__applyAutoDayNight();",
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
  "    // extinguisher reset: dirty things first (dusk on, music on, lamp dimmed, cabinet open)",
  "    click('balcony-sun');",
  "    click('garden-ukulele');",
  "    click('office-lamp');",
  "    click('cuddly-cabinet-door-1');", // opens the cabinet -> the hidden mouse makes its one dash
  "    await sleep(450);",
  "    ok('reset setup: state is dirty (dusk + music + dimmed)',",
  "      has('stage-office', 'dusk') && song && !song.paused && has('office-lamp', 'dimmed'));",
  "    ok('reset setup: cabinet open + mouse has made its dash',",
  "      has('cuddly-cabinet-door-1', 'open') && has('cuddly-mouse', 'scurrying'),",
  "      'open=' + has('cuddly-cabinet-door-1', 'open') + ' scurrying=' + has('cuddly-mouse', 'scurrying'));",
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
  "    // Re-arm check — the half a class diff can NEVER see. The cabinet mouse's",
  "    // one-dash latch is a closure var (mouseHasRun), so a reset that restored",
  "    // every class still left the box empty on a fresh game: open it again and",
  "    // nothing came out. Any 'fires once per game' toy needs its latch cleared by",
  "    // resetHunt, and only re-driving the trigger after a reset proves it. Runs",
  "    // AFTER the diff settles — it re-dirties the very classes the diff reads.",
  "    click('cuddly-cabinet-door-1');",
  "    await sleep(250);",
  "    ok('reset: the cabinet mouse re-arms (dashes again on a fresh game)', has('cuddly-mouse', 'scurrying'),",
  "      'mouse did not scurry on a post-reset cabinet open — a one-shot latch survived resetHunt');",
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
  "",
  "    // An external phone launch may not hide this tab immediately (app handoff / chooser /",
  "    // slow tab focus). Simulate a hide after the old 400ms grace and verify that the explicit",
  "    // launch survives exactly that hide, while ordinary backgrounding still closes the phone.",
  "    var fakeHidden = false, visibilityOverridden = true;",
  "    try {",
  "      Object.defineProperty(document, 'hidden', { configurable: true, get: function () { return fakeHidden; } });",
  "      Object.defineProperty(document, 'visibilityState', { configurable: true, get: function () { return fakeHidden ? 'hidden' : 'visible'; } });",
  "    } catch (e) { visibilityOverridden = false; }",
  "    ok('phone setup: document visibility can be simulated', visibilityOverridden);",
  "    if (visibilityOverridden && window.__openPhoneAppHere) {",
  "      window.__openPhoneAppHere('calendar');",
  "      await sleep(120);",
  "      var gcal = document.querySelector('.phone-shell .calx-gcal');",
  "      ok('phone setup: calendar opens with a GCal action', !!gcal);",
  "      var openedBefore = window.__opened || 0;",
  "      if (gcal) gcal.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "      await sleep(700);", // deliberately beyond the removed 400ms tap heuristic
  "      fakeHidden = true; document.dispatchEvent(new Event('visibilitychange'));",
  "      await sleep(80);",
  "      ok('phone: GCal launches an external tab', (window.__opened || 0) === openedBefore + 1);",
  "      ok('phone: delayed GCal tab hide keeps the phone open', !!document.querySelector('.phone-backdrop.show'));",
  "      fakeHidden = false; document.dispatchEvent(new Event('visibilitychange'));",
  "      fakeHidden = true; document.dispatchEvent(new Event('visibilitychange'));",
  "      await sleep(300);",
  "      ok('phone: unrelated backgrounding still closes the phone', !document.querySelector('.phone-backdrop.show'));",
  "    }",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      run().catch(function (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }).then(finish);",
  "    }, 200);",
  "  });",
  "})();",
  "</script>"
].join("\n");

// ── Persian occasion dates harness ──────────────────────────────────────────
// Read-only: asks the page for its computed Nowruz / Sizdah Bedar / Chaharshanbe
// Suri / Yalda across a span of years and hands them back as local y-m-d.
var PERSIAN_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function () {",
  "  var report = { errors: [], years: {} };",
  "  function finish() { report.errors = window.__errs; document.getElementById('__report').textContent = JSON.stringify(report); }",
  "  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }",
  "  function run() {",
  "    if (typeof window.__persianOcc !== 'function' || typeof window.__yaldaOf !== 'function') {",
  "      window.__errs.push('harness: __persianOcc/__yaldaOf missing');",
  "      return;",
  "    }",
  "    for (var y = 2024; y <= 2035; y += 1) {",
  "      var p = window.__persianOcc(y);",
  "      report.years[y] = {",
  "        nowruz: iso(p.nowruz), sizdah: iso(p.sizdah), chaharshanbe: iso(p.chaharshanbe),",
  "        chDay: p.chaharshanbe.getDay(), yalda: iso(window.__yaldaOf(y)),",
  "        sadeh: iso(p.sadeh), mehregan: iso(p.mehregan),",
  "        nowruzOf: iso(window.__nowruzOf(y))",
  "      };",
  "    }",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      try { run(); } catch (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }",
  "      finish();",
  "    }, 200);",
  "  });",
  "})();",
  "</script>"
].join("\n");

// The observed Iranian dates, as the true-noon rule at 52.5°E yields them (cross-checked
// against the official Nowruz days for 2020–2030 and against ICU's Persian calendar).
// Yalda is here to PIN it: it hangs off the December solstice and must never move when the
// Nowruz rule changes. Chaharshanbe shifts a whole week only when the last Wednesday before
// Nowruz crosses (2030), which is why it can sit still while Nowruz moves (2025–27).
var PERSIAN_EXPECT = {
  2024: { nowruz: "2024-03-20", sizdah: "2024-04-01", chaharshanbe: "2024-03-12", yalda: "2024-12-20", sadeh: "2024-01-30", mehregan: "2024-10-01" },
  2025: { nowruz: "2025-03-21", sizdah: "2025-04-02", chaharshanbe: "2025-03-18", yalda: "2025-12-20", sadeh: "2025-01-29", mehregan: "2025-10-02" },
  2026: { nowruz: "2026-03-21", sizdah: "2026-04-02", chaharshanbe: "2026-03-17", yalda: "2026-12-21", sadeh: "2026-01-30", mehregan: "2026-10-02" },
  2027: { nowruz: "2027-03-21", sizdah: "2027-04-02", chaharshanbe: "2027-03-16", yalda: "2027-12-21", sadeh: "2027-01-30", mehregan: "2027-10-02" },
  2028: { nowruz: "2028-03-20", sizdah: "2028-04-01", chaharshanbe: "2028-03-14", yalda: "2028-12-20", sadeh: "2028-01-30", mehregan: "2028-10-01" },
  2029: { nowruz: "2029-03-20", sizdah: "2029-04-01", chaharshanbe: "2029-03-13", yalda: "2029-12-20", sadeh: "2029-01-29", mehregan: "2029-10-01" },
  2030: { nowruz: "2030-03-21", sizdah: "2030-04-02", chaharshanbe: "2030-03-19", yalda: "2030-12-20", sadeh: "2030-01-29", mehregan: "2030-10-02" },
  2031: { nowruz: "2031-03-21", sizdah: "2031-04-02", chaharshanbe: "2031-03-18", yalda: "2031-12-21", sadeh: "2031-01-30", mehregan: "2031-10-02" },
  2032: { nowruz: "2032-03-20", sizdah: "2032-04-01", chaharshanbe: "2032-03-16", yalda: "2032-12-20", sadeh: "2032-01-30", mehregan: "2032-10-01" },
  2033: { nowruz: "2033-03-20", sizdah: "2033-04-01", chaharshanbe: "2033-03-15", yalda: "2033-12-20", sadeh: "2033-01-29", mehregan: "2033-10-01" },
  2034: { nowruz: "2034-03-21", sizdah: "2034-04-02", chaharshanbe: "2034-03-14", yalda: "2034-12-20", sadeh: "2034-01-29", mehregan: "2034-10-02" },
  2035: { nowruz: "2035-03-21", sizdah: "2035-04-02", chaharshanbe: "2035-03-13", yalda: "2035-12-21", sadeh: "2035-01-30", mehregan: "2035-10-02" }
};

// ── low-table meal harness ──────────────────────────────────────────────────
// Eating the food is DOM class state on the dish groups, which no other suite touches: the
// setting isn't .hunt-hit (play.js never clicks it) and it leaves no particles (leak.js can't
// see it). The thing that actually breaks is the RESTORE — food staying eaten into the next
// day, or a same-day re-render silently relaying the feast mid-meal — so that's what this pins.
var MEALS_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function () {",
  "  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "  var report = { errors: [], asserts: [], dishes: {} };",
  "  function finish() { report.errors = window.__errs; document.getElementById('__report').textContent = JSON.stringify(report); }",
  "  function ok(l, c, d) { report.asserts.push({ label: l, ok: !!c, detail: c ? '' : String(d || '') }); }",
  "  function eatenCount(meal) { return document.querySelectorAll('#cuddly-meal-' + meal + ' .dish.eaten').length; }",
  "  async function run() {",
  "    await sleep(800);",
  "    var setting = document.getElementById('cuddly-table-setting');",
  "    if (!setting || typeof window.__resetMealPlates !== 'function' || typeof window.__applySeason !== 'function') {",
  "      window.__errs.push('harness: the low-table setting or its reset hook is missing');",
  "      return;",
  "    }",
  "    var MEALS = ['nowruz', 'stedry', 'xmas', 'martin', 'yalda'];",
  "    MEALS.forEach(function (m) {",
  "      var ds = [].slice.call(document.querySelectorAll('#cuddly-meal-' + m + ' .dish'));",
  "      report.dishes[m] = ds.map(function (d) { return d.getAttribute('data-dish'); });",
  "      ok('meals: ' + m + ' has at least one dish, each with a full and a done state',",
  "         ds.length > 0 && ds.every(function (d) { return d.querySelector('.dish-full') && d.querySelector('.dish-done'); }));",
  "    });",
  "    window.__applySeason('yalda');",
  "    await sleep(90);",
  "    var all = [].slice.call(document.querySelectorAll('#cuddly-meal-yalda .dish'));",
  "    all.forEach(function (d) { d.classList.add('eaten'); });",
  "    ok('meals: setup — the yalda table is eaten', eatenCount('yalda') === all.length);",
  "    window.__applySeason('yalda');",
  "    await sleep(90);",
  "    ok('meals: a SAME-day re-render leaves the food eaten', eatenCount('yalda') === all.length, eatenCount('yalda') + ' of ' + all.length + ' still eaten');",
  "    window.__applySeason('martin');",
  "    await sleep(90);",
  "    window.__applySeason('yalda');",
  "    await sleep(90);",
  "    ok('meals: a DAY change lays a fresh feast', eatenCount('yalda') === 0, eatenCount('yalda') + ' dishes still eaten');",
  "    all.forEach(function (d) { d.classList.add('eaten'); });",
  "    window.__resetMealPlates();",
  "    ok('meals: __resetMealPlates clears every eaten dish', eatenCount('yalda') === 0);",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () { run().catch(function (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }).then(finish); }, 200);",
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
  if (!ONLY || "persian".indexOf(ONLY) === 0) jobs.persian = lib.runPage("rsvp.html", PERSIAN_HARNESS, 9000, CHROME_OPTS);
  if (!ONLY || "meals".indexOf(ONLY) === 0) jobs.meals = lib.runPage("rsvp.html", MEALS_HARNESS, 12000, CHROME_OPTS);
  if (!Object.keys(jobs).length) {
    fail("unknown --only value: " + ONLY + " (use cascade|gates|probes|persian|meals)");
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

  if (results.persian !== undefined) {
    var pe = results.persian;
    if (!pe) {
      fail("persian harness reported (page error before load, or budget too small)");
    } else {
      if (pe.errors.length) fail("persian: no uncaught JS errors", pe.errors.slice(0, 12).join("\n"));
      else pass("persian: no uncaught JS errors");
      var dateBad = [], tueBad = [], sizBad = [], yaldaBad = [], sadehBad = [], mehrBad = [], years = Object.keys(PERSIAN_EXPECT);
      years.forEach(function (y) {
        var got = pe.years[y], want = PERSIAN_EXPECT[y];
        if (!got) { dateBad.push(y + ": no result from the page"); return; }
        ["nowruz", "sizdah", "chaharshanbe"].forEach(function (k) {
          if (got[k] !== want[k]) dateBad.push(y + " " + k + ": got " + got[k] + ", want " + want[k]);
        });
        if (got.yalda !== want.yalda) yaldaBad.push(y + ": got " + got.yalda + ", want " + want.yalda);
        if (got.sadeh !== want.sadeh) sadehBad.push(y + ": got " + got.sadeh + ", want " + want.sadeh);
        if (got.mehregan !== want.mehregan) mehrBad.push(y + ": got " + got.mehregan + ", want " + want.mehregan);
        if (got.chDay !== 2) tueBad.push(y + ": " + got.chaharshanbe + " is day " + got.chDay + ", not Tuesday");
        var n = new Date(got.nowruz + "T12:00:00Z"), s = new Date(got.sizdah + "T12:00:00Z");
        if ((s - n) / 864e5 !== 12) sizBad.push(y + ": " + got.nowruz + " → " + got.sizdah);
        if (got.nowruzOf !== got.nowruz) dateBad.push(y + ": __nowruzOf disagrees with __persianOcc.nowruz");
      });
      if (dateBad.length === 0) pass("persian: Nowruz / Sizdah / Chaharshanbe match the true-noon rule at 52.5°E, " + years[0] + "–" + years[years.length - 1]);
      else fail("persian: computed occasion dates drifted", dateBad.slice(0, 12).join("\n"));
      // Yalda hangs off the DECEMBER SOLSTICE, not off Nowruz — a Nowruz-rule change must not move it.
      if (yaldaBad.length === 0) pass("persian: Yalda still tracks the December solstice (unmoved)");
      else fail("persian: Yalda moved — it must stay independent of nowruzOf", yaldaBad.join("\n"));
      // Sadeh (10 Bahman) is the one occasion counted off the PREVIOUS Gregorian year's Nowruz.
      // Give it the same shape as its siblings and it lands a year out — which still reads as a
      // plausible Jan 29/30 in casual testing, so only a pinned expectation catches it.
      if (sadehBad.length === 0) pass("persian: Sadeh is nowruzOf(y−1) + 315, landing Jan 29–30 (not a year out)");
      else fail("persian: Sadeh drifted — check it reads the PREVIOUS year's Nowruz", sadehBad.slice(0, 12).join("\n"));
      // Mehregan genuinely lands on Oct 1 about one year in three (2024/2028/2029/2032/2033),
      // so anything that hardcodes "Oct 2" is silently wrong on those years.
      if (mehrBad.length === 0) pass("persian: Mehregan is nowruzOf(y) + 195, drifting Oct 1–2 (never hardcoded)");
      else fail("persian: Mehregan drifted", mehrBad.slice(0, 12).join("\n"));
      if (tueBad.length === 0) pass("persian: Chaharshanbe Suri always falls on a Tuesday evening");
      else fail("persian: Chaharshanbe Suri left Tuesday", tueBad.join("\n"));
      if (sizBad.length === 0) pass("persian: Sizdah Bedar is always Nowruz + 12");
      else fail("persian: Sizdah Bedar is not Nowruz + 12", sizBad.join("\n"));
    }
  }

  if (results.meals !== undefined) {
    var me = results.meals;
    if (!me) {
      fail("meals harness reported (page error before load, or budget too small)");
    } else {
      if (me.errors.length) fail("meals: no uncaught JS errors", me.errors.slice(0, 12).join("\n"));
      else pass("meals: no uncaught JS errors");
      me.asserts.forEach(function (a) { if (a.ok) pass(a.label); else fail(a.label, a.detail); });
      // The two fish are the same dish in two languages, so their leftovers must not drift apart.
      var nz = (me.dishes.nowruz || []).indexOf("fish") !== -1, st = (me.dishes.stedry || []).indexOf("fish") !== -1;
      if (nz && st) pass("meals: the nowruz fish and the Štědrý večer carp are both a 'fish' dish");
      else fail("meals: the two fish drifted apart", "nowruz=" + (me.dishes.nowruz || []).join(",") + " stedry=" + (me.dishes.stedry || []).join(","));
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
