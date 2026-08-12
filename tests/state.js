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
//    - fullscreen return: a click-driven tab handoff that forces the game out of
//      fullscreen is restored by the first click after return; an explicit exit
//      remains exited.
//    - phone/fullscreen transition: entering or leaving fullscreen does not let a
//      browser visibility blip dismiss the open pocket phone.
//    - fireworks: a visible-but-unfocused page clears live wedding-day sky
//      particles and does not spawn replacements while another window is fullscreen.
//    - special days: an exact event/holiday date gets a permanent localized viewport
//      label without taking over the scene; the automatic event card waits for phase two.
//    - phase-one messages: ordinary texts stay out of the solve, while one-shot
//      occasion texts are held and released when the first party starts phase two.
//      The first attended unread badge also carries the one-time message coach mark.
//    - garden wall switch: it keeps its day/night role in phase one, then becomes a
//      day/party toggle once phase two has unlocked the party. Its delayed exit cue
//      explains that the loft, phone, and computer remain explorable after the party.
//    - opening guide: its explicit × walks top navigation → caption before the
//      normal kitchen instruction and espresso-machine arrow take over; background
//      clicks stay inert and Enter mirrors the ×.
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
  // The plant light is derived from the effective Edmonton clock (on 11:00–17:00).
  // This suite changes __edmNowMins after taking its load snapshot; reset correctly
  // re-evaluates that new time, so either class direction may differ legitimately.
  // tests/growlight-schedule.js owns the exact boundary and reset assertions.
  "#garden-growlight +off",
  "#garden-growlight -off",
  // Background Dollhouse prewarming is cache state, not game state. It continues across an
  // extinguisher reset and may advance between either snapshot while this long probe runs.
  "#stage-kitchen +dollhouse-source-warm",
  "#stage-kitchen -dollhouse-source-warm",
  "#stage-garden +dollhouse-source-warm",
  "#stage-garden -dollhouse-source-warm",
  "#stage-cuddly +dollhouse-source-warm",
  "#stage-cuddly -dollhouse-source-warm",
  "#stage-office +dollhouse-source-warm",
  "#stage-office -dollhouse-source-warm",
  "#stage-balcony +dollhouse-source-warm",
  "#stage-balcony -dollhouse-source-warm",
  "#hunt-fullscreen-area +dollhouse-warm",
  "#hunt-fullscreen-area -dollhouse-warm",
  "#loft-dollhouse +dollhouse-warm",
  "#loft-dollhouse -dollhouse-warm"
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
  "    __updateAquaSound: ['cuddly'],",
  "    __updateAquaMelody: ['cuddly'],",
  "    __updateCoffeeMusic: ['cuddly'],",
  "    __updateWorkoutSound: ['cuddly'],",
  "    __updateTotoroSound: ['cuddly'],",
  "    __updateTotoroMelody: ['cuddly'],",
  "    __updateStarsSound: ['cuddly'],",
  "    __updateGardenBirdsong: ['garden']", // discrete chirps: room boolean only, no fade arg
  "  };",
  "  var FADED = ['__updatePcFan', '__updateACHum', '__updateRadioSound', '__updateKettleHum', '__updateFireSound', '__updateAquaSound', '__updateAquaMelody', '__updateCoffeeMusic', '__updateWorkoutSound', '__updateTotoroSound', '__updateTotoroMelody', '__updateStarsSound'];",
  "  var PROJECTOR_FADED = ['__updateFireSound', '__updateAquaSound', '__updateAquaMelody', '__updateCoffeeMusic', '__updateWorkoutSound', '__updateTotoroSound', '__updateTotoroMelody', '__updateStarsSound'];",
  "  var ROOM_NAME_GATES = ['__updateACHum'];", // AC gets the room NAME (to pick its per-room pan), the rest a boolean
  "  var GATES = Object.keys(OWNERS);",
  "  async function run() {",
  "    await sleep(900);",
  "    ok('gates: window.__goToStage exists', typeof window.__goToStage === 'function');",
  "    GATES.forEach(function (g) { ok('gates: window.' + g + ' exists', typeof window[g] === 'function'); });",
  "    if (typeof window.__goToStage !== 'function') return;",
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
  "      window.__goToStage(room);",
  "      GATES.forEach(function (g) {",
  "        if (!originals[g]) return;", // existence assert above already covers it
  "        var usesName = ROOM_NAME_GATES.indexOf(g) !== -1;",
  "        var expected = OWNERS[g].indexOf(room) !== -1;",
  "        var wanted = usesName ? room : expected;", // AC gets the room NAME; the rest a boolean
  "        var roomCalls = (calls[g] || []).filter(function (a) { return typeof a[0] === (usesName ? 'string' : 'boolean'); });",
  "        if (!(roomCalls.length > 0 && roomCalls.every(function (a) { return a[0] === wanted; }))) {",
  "          (boolBad[g] = boolBad[g] || []).push(room + ' wanted ' + wanted + ', got ' + (roomCalls.length ? JSON.stringify(roomCalls) : 'no room-arg call'));",
  "        }",
  "        var expectedFade = PROJECTOR_FADED.indexOf(g) !== -1 ? 3 : 5;",
  "        if (FADED.indexOf(g) !== -1 && !(roomCalls.length > 0 && roomCalls.every(function (a) { return a[1] === expectedFade; }))) {",
  "          (fadeBad[g] = fadeBad[g] || []).push(room + ': ' + JSON.stringify(roomCalls));",
  "        }",
  "      });",
  "      await sleep(80);",
  "    }",
  "    GATES.forEach(function (g) {",
  "      if (!originals[g]) return;",
  "      ok('gates: goToStage hands ' + g + ' its correct room arg in every room', !boolBad[g], (boolBad[g] || []).join(' | '));",
  "      if (FADED.indexOf(g) !== -1) {",
  "        var fadeLabel = PROJECTOR_FADED.indexOf(g) !== -1 ? 'three-second projector fade' : 'five-second ambience fade';",
  "        ok('gates: goToStage passes ' + g + ' the ' + fadeLabel + ' on every room change', !fadeBad[g], (fadeBad[g] || []).join(' | '));",
  "      }",
  "      window[g] = originals[g];", // hand the real gates back before the storm
  "    });",
  "",
  "    window.__goToStage('balcony');",
  "    if (window.__setBalconyRain) window.__setBalconyRain(true);",
  "    await sleep(40);",
  "    var dropsBeforeLeave = document.querySelectorAll('.balc-drop').length;",
  "    var rainContained = Array.prototype.every.call(document.querySelectorAll('.balc-drop'), function (drop) { return drop.parentNode && drop.parentNode.id === 'balcony-precipfx' && drop.closest('#stage-balcony'); });",
  "    var weatherFade = {}, originalWind = window.__updateWind, originalRain = window.__updateRainSound;",
  "    window.__updateWind = function (fade) { weatherFade.wind = fade; return originalWind.apply(this, arguments); };",
  "    window.__updateRainSound = function (fade) { weatherFade.rain = fade; return originalRain.apply(this, arguments); };",
  "    window.__goToStage('kitchen');",
  "    ok('gates: balcony precipitation is room-contained, then cleared at the indoor boundary', dropsBeforeLeave > 0 && rainContained && document.querySelectorAll('.balc-drop').length === 0 && !document.getElementById('loft-game-strip').classList.contains('viewing-balcony'), 'before=' + dropsBeforeLeave + ', contained=' + rainContained);",
  "    ok('gates: outdoor wind and rain use a prompt indoor-boundary fade', weatherFade.wind <= 0.3 && weatherFade.rain <= 0.3, JSON.stringify(weatherFade));",
  "    window.__updateWind = originalWind; window.__updateRainSound = originalRain;",
  "    if (window.__setBalconyRain) window.__setBalconyRain(false);",
  "",
  "    // storm phase: every drone device on (fire is on by default), then rapid room",
  "    // cycling so each drone's start overlaps its room-change fade-stop, settle",
  "    // long enough to stress overlapping fades, then device-toggle stops (short default fade)",
  "    click('kitchen-scale');       // radio on",
  "    click('kitchen-kettle');      // kettle steaming",
  "    click('garden-minisplit');    // AC on",
  "    click('office-pc-desk-trio'); // PC (fan) on",
  "    var errsBefore = window.__errs.length;",
  "    var STORM = ['kitchen', 'garden', 'cuddly', 'office', 'balcony', 'kitchen', 'office', 'cuddly', 'garden', 'kitchen'];",
  "    for (var s = 0; s < STORM.length; s++) { window.__goToStage(STORM[s]); await sleep(60); }",
  "    await sleep(1200);",
  "    click('kitchen-scale');",
  "    click('kitchen-kettle');",
  "    click('garden-minisplit');",
  "    click('office-pc-desk-trio');",
  "    await sleep(700);", // > default device-toggle fades (~0.15-0.3s) + close margin
  "    ok('gates: drone start/fade-stop storm across all rooms throws no errors', window.__errs.length === errsBefore, window.__errs.slice(errsBefore).join('; '));",
  "    ok('gates: strip lands where asked after the storm', window.__currentStageIndex === 0, 'currentStageIndex=' + window.__currentStageIndex);",
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
  "  function clickAtElementPoint(id) { var e = el(id); if (!e) return false; var r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, top = document.elementFromPoint(x, y); if (!top) return false; top.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })); return top; }",
  "  function clickOpeningGuideX() { var e = document.querySelector('#opening-guide-coach .hunt-coach-x'); if (!e) return false; e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }",
  "  var STAGES = ['stage-kitchen', 'stage-garden', 'stage-cuddly', 'stage-office', 'stage-balcony'];",
  "  var GROOVERS = ['cuddly-behdad-head', 'cuddly-marketa-head', 'office-skull'];",
  "  function nearestId(n) { while (n && n.nodeType === 1) { if (n.id) return n.id; n = n.parentNode; } return '?'; }",
  "  async function run() {",
  "    var strip = document.getElementById('loft-game-strip');",
  "    window.__monitorMessageRewrite = function () { return Promise.reject(new Error('offline state harness')); };",
  // The auto day/night default follows Edmonton's real clock, so it would flip the loft to
  // night when the suite runs after dark and invert the manual-dusk probes. Pin the clock to
  // noon (deterministic day, same spirit as seedRandom) so dusk stays a manual-only toggle
  // here. Pin real weather clear too: an Edmonton thunderstorm can otherwise add a legitimate
  // ambient flash between the load/reset snapshots. Those live systems have focused tests.
  "    window.__edmNowMins = function () { return 720; };",
  "    window.__realWxActive = function () { return null; };",
  "    if (window.__applyAutoDayNight) window.__applyAutoDayNight();",
  "    if (window.__applyRealWx) window.__applyRealWx();",
  "    await sleep(900);",
  "    ok('entry paint gate: full RSVP settles on the intro without remaining concealed', document.documentElement.classList.contains('loft-entry-ready') && !document.documentElement.classList.contains('loft-entry-pending') && !!el('click-me-overlay'));",
  "    // load-time class snapshot of every element under the strip (element",
  "    // identity, not index — probes spawn/remove particle nodes)",
  "    var snap = new Map();",
  "    snap.set(strip, strip.getAttribute('class') || '');",
  "    strip.querySelectorAll('*').forEach(function (e) { snap.set(e, e.getAttribute('class') || ''); });",
  "",
  "    // The opening coach teaches the top navigation, then the bottom caption, before any object cue.",
  "    // the load snapshot: resetHunt intentionally restores the untouched intro state captured above.",
  "    var introOverlay = el('click-me-overlay'), introMachine = el('kitchen-lamarzocco'), introCabinet = el('kitchen-cabinet-2');",
  "    if (introOverlay) introOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    ok('opening guide: first scene click is consumed before La Maz', !el('click-me-overlay') && introMachine && !introMachine.classList.contains('powered-on'));",
  "    ok('opening guide: first scene click points to the top navigation', !!(window.__openingGuideShowing && window.__openingGuideShowing()) && window.__openingGuideStep() === 'nav' && has('hunt-bottom-nav', 'intro-guide-nav') && !has('hunt-caption', 'intro-guide'));",
  "    ok('opening guide: espresso-machine cue waits', !has('kitchen-lamarzocco', 'invite-pulse'));",
  "    await sleep(30);",
  "    var navBlockedTarget = clickAtElementPoint('kitchen-lamarzocco');",
  "    ok('opening guide: a background prop click neither advances nor operates the room', navBlockedTarget && navBlockedTarget.closest('#opening-guide-coach') && window.__openingGuideShowing() && window.__openingGuideStep() === 'nav' && !introMachine.classList.contains('powered-on') && introCabinet && !introCabinet.classList.contains('open'));",
  "    clickOpeningGuideX();",
  "    ok('opening guide: the visible dismiss control points next to the bottom caption', window.__openingGuideShowing() && window.__openingGuideStep() === 'caption' && !has('hunt-bottom-nav', 'intro-guide-nav') && has('hunt-caption', 'intro-guide'));",
  "    await sleep(30); var captionBlockedTarget = clickAtElementPoint('kitchen-lamarzocco');",
  "    ok('opening guide: caption-step background remains inert', captionBlockedTarget && captionBlockedTarget.closest('#opening-guide-coach') && window.__openingGuideShowing() && window.__openingGuideStep() === 'caption' && !introMachine.classList.contains('powered-on') && introCabinet && !introCabinet.classList.contains('open'));",
  "    clickOpeningGuideX();",
  "    ok('opening guide: the second visible dismiss control finishes without waiting', !window.__openingGuideShowing() && has('kitchen-lamarzocco', 'invite-pulse'));",
  "    if (window.__showHuntIntro) window.__showHuntIntro();",
  "    introOverlay = el('click-me-overlay'); if (introOverlay) introOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));",
  "    ok('opening guide: first Enter advances to the caption without operating Kitchen', window.__openingGuideShowing() && window.__openingGuideStep() === 'caption' && !introMachine.classList.contains('powered-on'));",
  "    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));",
  "    ok('opening guide: second Enter dismisses without operating Kitchen', !window.__openingGuideShowing() && !introMachine.classList.contains('powered-on') && has('kitchen-lamarzocco', 'invite-pulse'));",
  "    if (window.__showHuntIntro) window.__showHuntIntro();",
  "    introOverlay = el('click-me-overlay'); if (introOverlay) introOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    ok('opening guide: ordinary entry has no auto-dismiss timeout', !!(window.__openingGuideShowing && window.__openingGuideShowing()) && window.__openingGuideDuration && window.__openingGuideDuration() === 0);",
  "    await sleep(4200);",
  "    ok('opening guide: nav step remains until acknowledged', window.__openingGuideShowing() && window.__openingGuideStep() === 'nav' && has('hunt-bottom-nav', 'intro-guide-nav'));",
  "    strip.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    ok('opening guide: scene-wide clicks do not acknowledge the nav card', window.__openingGuideShowing() && window.__openingGuideStep() === 'nav');",
  "    clickOpeningGuideX();",
  "    await sleep(30); await sleep(4200);",
  "    ok('opening guide: caption step also remains until acknowledged', window.__openingGuideShowing() && window.__openingGuideStep() === 'caption' && has('hunt-caption', 'intro-guide'));",
  "    strip.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    ok('opening guide: scene-wide clicks do not acknowledge the caption card', window.__openingGuideShowing() && window.__openingGuideStep() === 'caption');",
  "    clickOpeningGuideX();",
  "    ok('opening guide: ordinary entry clears after both acknowledgements', !window.__openingGuideShowing() && !has('hunt-caption', 'intro-guide'));",
  "    if (window.__showHuntIntro) window.__showHuntIntro();",
  "    if (window.__toggleFullscreen) window.__toggleFullscreen();",
  "    introOverlay = el('click-me-overlay'); if (introOverlay) introOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    ok('opening guide: fullscreen entry also has no auto-dismiss timeout', !!(window.__openingGuideShowing && window.__openingGuideShowing()) && window.__openingGuideDuration && window.__openingGuideDuration() === 0);",
  "    await sleep(5200);",
  "    ok('opening guide: nav remains after fullscreen browser chrome clears', window.__openingGuideShowing() && window.__openingGuideStep() === 'nav' && has('hunt-bottom-nav', 'intro-guide-nav'));",
  "    await sleep(3000);",
  "    ok('opening guide: fullscreen nav still waits for acknowledgement', window.__openingGuideShowing() && window.__openingGuideStep() === 'nav');",
  "    clickOpeningGuideX();",
  "    await sleep(30);",
  "    ok('opening guide: fullscreen advances to its bottom caption', window.__openingGuideShowing() && window.__openingGuideStep() === 'caption' && has('hunt-caption', 'intro-guide'));",
  "    clickOpeningGuideX();",
  "    ok('opening guide: fullscreen caption ends on acknowledgement', !window.__openingGuideShowing() && !has('hunt-caption', 'intro-guide'));",
  "    ok('opening guide: normal kitchen instruction returns', window.__captionKey && window.__captionKey() === 'kitchen', 'caption=' + (window.__captionKey && window.__captionKey()));",
  "    ok('opening guide: espresso-machine cue follows the caption tutorial', has('kitchen-lamarzocco', 'invite-pulse'));",
  "    if (el('hunt-fullscreen-area') && el('hunt-fullscreen-area').classList.contains('is-fullscreen') && window.__toggleFullscreen) window.__toggleFullscreen();",
  "",
  "    // instruments + shared four-song catalog -> cross-room grooving",
  "    var guitar = el('garden-guitar'), tumbala = el('tumbala-song-audio'), czechSong = el('marketa-czech-song-audio');",
  "    var uke = el('garden-ukulele'), oritSong = el('ukulele-song-audio'), danSong = el('guitar-song-audio'), song = oritSong;",
  "    var railPlay = el('hunt-playpause-btn');",
  "    if (railPlay) railPlay.style.setProperty('transition', 'none', 'important');", // virtual-time Chrome can strand transitions at their starting value
  "    var quietPlayBg = railPlay && getComputedStyle(railPlay).backgroundColor;",
  "    ok('probe setup: both instruments + all four song elements exist', guitar && uke && tumbala && czechSong && oritSong && danSong);",
  "    ok('music catalog: Tumbalalaika metadata is exposed to the shared players', window.__phoneMusicLabel && window.__phoneMusicLabel('tumbala-song-audio') === 'Tumbalalaika — Markéta Jakešová');",
  "    ok('music catalog: Dan Bern metadata remains exposed', window.__phoneMusicLabel && window.__phoneMusicLabel('guitar-song-audio') === 'I Need You — Dan Bern');",
  "    ok('music catalog: Orit Shimoni metadata remains exposed', window.__phoneMusicLabel && window.__phoneMusicLabel('ukulele-song-audio') === 'Strange & Beautiful Things — Orit Shimoni');",
  "    ok('music catalog: Čí že sú to koně metadata is exposed', window.__phoneMusicLabel && window.__phoneMusicLabel('marketa-czech-song-audio') === 'Čí že sú to koně — Markéta Jakešová');",
  "    if (window.__playSongAt) window.__playSongAt(0);",
  "    await sleep(120);",
  "    if (window.__phoneMusicSkip) window.__phoneMusicSkip(1);",
  "    await sleep(700);",
  "    ok('music catalog: shared phone/monitor transport advances Tumbalalaika to Dan', danSong && !danSong.paused && window.__phoneMusicId && window.__phoneMusicId() === 'guitar-song-audio');",
  "    if (window.__phoneMusicSkip) window.__phoneMusicSkip(1);",
  "    await sleep(700);",
  "    ok('music catalog: shared phone/monitor transport advances Dan to Orit', oritSong && !oritSong.paused && window.__phoneMusicId && window.__phoneMusicId() === 'ukulele-song-audio');",
  "    [tumbala, danSong, oritSong, czechSong].forEach(function (a) { if (a) { a.pause(); a.currentTime = 0; } });",
  "    click('garden-guitar');",
  "    await sleep(450);",
  "    ok('instrument: first guitar tap starts only Tumbalalaika', tumbala && !tumbala.paused && czechSong.paused && danSong.paused && oritSong.paused);",
  "    ok('instrument: guitar gains .playing sway for Tumbalalaika', has('garden-guitar', 'playing') && !has('garden-ukulele', 'playing'));",
  "    ok('music catalog: shared player reports Tumbalalaika while guitar plays', window.__phoneMusicId && window.__phoneMusicId() === 'tumbala-song-audio');",
  "    click('garden-guitar');",
  "    await sleep(350);",
  "    ok('instrument: second guitar tap stops Tumbalalaika', tumbala && tumbala.paused && !has('garden-guitar', 'playing'));",
  "    click('garden-guitar');",
  "    await sleep(450);",
  "    ok('instrument: next guitar start rotates to the second Markéta piece', czechSong && !czechSong.paused && tumbala.paused && danSong.paused && oritSong.paused);",
  "    ok('instrument: second Markéta piece keeps guitar sway', has('garden-guitar', 'playing') && !has('garden-ukulele', 'playing'));",
  "    click('garden-guitar');",
  "    await sleep(350);",
  "    ok('instrument: second tap stops the rotated Markéta track', czechSong && czechSong.paused && !has('garden-guitar', 'playing'));",
  "    click('garden-ukulele');",
  "    await sleep(450);",
  "    ok('instrument: first ukulele start preserves Orit Shimoni', oritSong && !oritSong.paused && danSong.paused && tumbala.paused);",
  "    ok('instrument: ukulele gains .playing sway', has('garden-ukulele', 'playing'));",
  "    ok('music chrome: pause state turns burgundy', railPlay && !railPlay.classList.contains('paused') && getComputedStyle(railPlay).backgroundColor !== quietPlayBg);",
  "    GROOVERS.forEach(function (id) {",
  "      ok('instrument: #' + id + ' grooves while music plays', has(id, 'grooving'));",
  "    });",
  "    click('garden-ukulele');",
  "    await sleep(350);",
  "    ok('instrument: second ukulele tap pauses Orit', oritSong && oritSong.paused);",
  "    if (oritSong) oritSong.currentTime = 1;", // headless media time does not advance; explicitly reproduce a resumable paused selection
  "    ok('music toast: a selected but paused loft song is not now-playing', window.__phoneMusicId && window.__phoneMusicId() === 'ukulele-song-audio' && window.__nowPlayingLabel && window.__nowPlayingLabel() === '');",
  "    ok('instrument: .playing sway stops with the song', !has('garden-ukulele', 'playing'));",
  "    ok('music chrome: play state returns to its quiet style', railPlay && railPlay.classList.contains('paused') && getComputedStyle(railPlay).backgroundColor === quietPlayBg);",
  "    GROOVERS.forEach(function (id) {",
  "      ok('instrument: #' + id + ' stops grooving on pause', !has(id, 'grooving'));",
  "    });",
  "    click('garden-ukulele');",
  "    await sleep(450);",
  "    ok('instrument: next ukulele start rotates to Dan Bern', danSong && !danSong.paused && oritSong.paused && tumbala.paused);",
  "    ok('instrument: Dan Bern still drives ukulele sway, never guitar sway', has('garden-ukulele', 'playing') && !has('garden-guitar', 'playing'));",
  "    ok('music catalog: shared player follows the rotated Dan track', window.__phoneMusicId && window.__phoneMusicId() === 'guitar-song-audio');",
  "    click('garden-ukulele');",
  "    await sleep(350);",
  "    ok('instrument: second tap stops the rotated Dan track', danSong && danSong.paused && !has('garden-ukulele', 'playing'));",
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
  "    // bar bottles share one accumulated four-or-five-click break counter",
  "    var shelfBottles = document.querySelectorAll('#kitchen-bar-bottles > .bar-bottle');",
  "    var bottleState = window.__barBottleBreakState && window.__barBottleBreakState();",
  "    ok('bar bottles: shared break counter exposes a four-or-five-click run', shelfBottles.length > 1 && bottleState && (bottleState.threshold === 4 || bottleState.threshold === 5));",
  "    if (bottleState && shelfBottles.length > 1) {",
  "      for (var bottleTap = 0; bottleTap < bottleState.threshold; bottleTap++) shelfBottles[bottleTap % 2].dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));",
  "      ok('bar bottles: taps on different bottles accumulate into one break', shelfBottles[(bottleState.threshold - 1) % 2].classList.contains('fallen'));",
  "      ok('bar bottles: counter resets after a break', window.__barBottleBreakState().clicks === 0);",
  "      await sleep(760);",
  "      var barStools = document.querySelectorAll('#kitchen-bar-stools > .bar-stool');",
  "      ok('bar bottles: a break wobbles every bar stool', barStools.length > 0 && Array.prototype.every.call(barStools, function (stool) { return stool.classList.contains('tipsy'); }));",
  "    }",
  "",
  "    // three drinks are kindness; the third drink is also overwatering",
  "    var overwaterPlant = el('garden-monstera');",
  "    if (overwaterPlant && window.__waterSpecificPlant) {",
  "      window.__waterSpecificPlant('garden-monstera', function(){return true;});",
  "      window.__waterSpecificPlant('garden-monstera', function(){return true;});",
  "      ok('garden plants: two waterings do not rot the plant', !overwaterPlant.classList.contains('overwatered'));",
  "      window.__waterSpecificPlant('garden-monstera', function(){return true;});",
  "      ok('garden plants: the third watering visibly over-waters the plant', overwaterPlant.classList.contains('overwatered'));",
  "    }",
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
  "    var songs = ['tumbala-song-audio', 'guitar-song-audio', 'ukulele-song-audio', 'marketa-czech-song-audio'].map(el).filter(Boolean);",
  "    ok('reset: all songs paused', songs.every(function (a) { return a.paused; }));",
  "    ok('reset: back on the kitchen stage', window.__currentStageIndex === 0, 'currentStageIndex=' + window.__currentStageIndex);",
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
  "    // The outer-chrome console tab starts hidden. Synthetic input must not reveal it,",
  "    // while the user's backtick route reveals it before opening the drop-down console.",
  "    var consoleTab = el('loft-console-hint'), monitorConsoleIn = el('monitor-console-in');",
  "    ok('console discovery: pull-tab starts hidden', !!consoleTab && getComputedStyle(consoleTab).display === 'none');",
  "    if (window.__openKbdHelp) window.__openKbdHelp();",
  "    ok('console discovery: shortcut card does not advertise backtick', ![].some.call(document.querySelectorAll('.kbd-keys kbd'), function (k) { return k.textContent === '`'; }));",
  "    var manualLink = document.querySelector('.kbd-manual');",
  "    ok('keyboard shortcuts: game manual opens externally', !!manualLink && manualLink.target === '_blank' && /docs\\/game-manual\\.md$/.test(manualLink.href));",
  "    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));",
  "    if (monitorConsoleIn) { monitorConsoleIn.value = 'loft'; monitorConsoleIn.dispatchEvent(new Event('input', { bubbles: true })); }",
  "    ok('console discovery: scripted monitor input does not reveal the pull-tab', !!consoleTab && !has('loft-console-hint', 'discovered') && getComputedStyle(consoleTab).display === 'none');",
  "    if (monitorConsoleIn) { monitorConsoleIn.value = ''; monitorConsoleIn.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true, cancelable: true })); }",
  "    ok('console discovery: bare ? at the monitor prompt opens keyboard shortcuts', !!document.querySelector('.kbd-backdrop'));",
  "    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));",
  "    document.dispatchEvent(new KeyboardEvent('keydown', { key: '`', code: 'Backquote', bubbles: true, cancelable: true }));",
  "    await sleep(40);",
  "    ok('console discovery: backtick reveals the pull-tab', !!consoleTab && has('loft-console-hint', 'discovered') && getComputedStyle(consoleTab).display !== 'none');",
  "    ok('console discovery: the same backtick opens the drop-down console', !!(window.__dropTermOpen && window.__dropTermOpen()));",
  "    var droptermIn = el('dropterm-in'), droptermOut = el('dropterm-out');",
  "    ok('console discovery: console welcome advertises the help loft shorthand', !!droptermOut && droptermOut.textContent.indexOf('loft console — real JavaScript; typed Loft API ready as `loft`. try: `help loft`') >= 0);",
  "    if (droptermIn) { droptermIn.value = ''; droptermIn.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true, cancelable: true })); }",
  "    ok('console discovery: bare ? at the drop-down prompt opens keyboard shortcuts', !!document.querySelector('.kbd-backdrop'));",
  "    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));",
  "    ok('console discovery: closing shortcut help leaves the console open', !!(window.__dropTermOpen && window.__dropTermOpen()));",
  "    document.dispatchEvent(new KeyboardEvent('keydown', { key: '`', code: 'Backquote', bubbles: true, cancelable: true }));",
  "    var mask = el('garden-mask'), partyBeforeMask = !!(window.__loftControllers.party && window.__loftControllers.party.status());",
  "    if (mask) mask.dispatchEvent(new MouseEvent('click', { bubbles: true }));",
  "    ok('garden mask: spawned hearts cannot steal follow-up taps', [].every.call(document.querySelectorAll('.heart-particle'), function (h) { return getComputedStyle(h).pointerEvents === 'none'; }));",
  "    // Chrome's virtual clock can jump while a synthetic click spawns/paints the hearts,",
  "    // even though these dispatches are adjacent. Pin Date.now only for this synchronous",
  "    // gesture so the test actually exercises the app's <=650 ms rapid-click branch.",
  "    var realDateNow = Date.now, rapidMaskNow = realDateNow() + 1000;",
  "    Date.now = function () { return rapidMaskNow; };",
  "    try {",
  "      if (mask) mask.dispatchEvent(new MouseEvent('click', { bubbles: true }));",
  "      if (mask) mask.dispatchEvent(new MouseEvent('click', { bubbles: true }));",
  "      ok('garden mask: two rapid clicks no longer toggle the party', !!mask && !!(window.__loftControllers.party && window.__loftControllers.party.status()) === partyBeforeMask && !(window.__dropTermOpen && window.__dropTermOpen()));",
  "      if (mask) mask.dispatchEvent(new MouseEvent('click', { bubbles: true }));",
  "      ok('garden mask: third rapid click opens the mobile console', !!(window.__dropTermOpen && window.__dropTermOpen()));",
  "    } finally { Date.now = realDateNow; }",
  "    ok('garden mask: triple-click reveals the persistent console pull-tab', !!consoleTab && has('loft-console-hint', 'discovered') && getComputedStyle(consoleTab).display !== 'none');",
  "    if (window.__closeDropTerm) window.__closeDropTerm();",
  "    ok('garden mask: console pull-tab remains after the console closes', !!consoleTab && has('loft-console-hint', 'discovered') && getComputedStyle(consoleTab).display !== 'none' && !(window.__dropTermOpen && window.__dropTermOpen()));",
  "    if (window.__openKbdHelp) window.__openKbdHelp();",
  "    ok('console discovery: shortcut card includes backtick after discovery', [].some.call(document.querySelectorAll('.kbd-keys kbd'), function (k) { return k.textContent === '`'; }));",
  "    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));",
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
  "    if (window.__goToStage) window.__goToStage('kitchen');",
  "    await sleep(200);",
  "    ok('liveness: goToStage(kitchen) lands', window.__currentStageIndex === 0, 'currentStageIndex=' + window.__currentStageIndex);",
  "    var pans = el('kitchen-pans');",
  "    var mutated = false;",
  "    var obs = new MutationObserver(function () { mutated = true; });",
  "    if (pans) obs.observe(pans, { subtree: true, attributes: true, attributeFilter: ['class'] });",
  "    click('kitchen-pans');",
  "    await sleep(300);", // rAF-double re-add is 2 patched-rAF ticks (~32ms); the one-shot may finish AND be removed in here — the mutation is the signal
  "    obs.disconnect();",
  "    ok('liveness: pans still react to a click (class mutation seen)', mutated);",
  "",
  "    // Special days announce themselves in the quiet permanent ribbon without taking over the",
  "    // first-round scene. The richer automatic event card stays held until phase two begins.",
  "    var originalOccUrl = location.href;",
  "    history.replaceState(null, '', '?date=2031-07-11');",
  "    if (window.__applySeasonDate) window.__applySeasonDate();",
  "    if (window.__applyDateOccasion) window.__applyDateOccasion();",
  "    var dayBanner = el('occasion-banner');",
  "    ok('special day: Garden Brunch gets the permanent occasion ribbon', !!dayBanner && dayBanner.classList.contains('show') && /Garden Brunch/i.test(dayBanner.textContent));",
  "    var bannerSummoned=0,realSummon=window.__summonCurrentFestivity;window.__summonCurrentFestivity=function(){bannerSummoned++;return true;};dayBanner.click();window.__summonCurrentFestivity=realSummon;",
  "    ok('special day: clicking the permanent ribbon activates the celebration', bannerSummoned===1, 'summoned='+bannerSummoned);",
  "    var fsArea = el('hunt-fullscreen-area'), guideCaption = el('hunt-caption');",
  "    if (fsArea) fsArea.classList.add('chrome-overlap'); if (guideCaption) guideCaption.classList.add('intro-guide');",
  "    ok('special day: opening-guide arrow layer stays above the permanent ribbon', !!dayBanner && parseInt(getComputedStyle(el('opening-guide-coach')).zIndex, 10) > parseInt(getComputedStyle(dayBanner).zIndex, 10));",
  "    if (guideCaption) guideCaption.classList.remove('intro-guide'); if (fsArea) fsArea.classList.remove('chrome-overlap');",
  "    ok('special day: the permanent ribbon does not activate or navigate the event scene', !window.__gardenPartyOn && window.__currentStageIndex === 0, 'party=' + window.__gardenPartyOn + ' stage=' + window.__currentStageIndex);",
  "    history.replaceState(null, '', '?date=2031-10-31');",
  "    if (window.__applySeasonDate) window.__applySeasonDate();",
  "    if (window.__applyDateOccasion) window.__applyDateOccasion();",
  "    dayBanner = el('occasion-banner');",
  "    ok('special day: a named holiday reuses the permanent occasion ribbon', !!dayBanner && /spooky season/i.test(dayBanner.textContent));",
  "    history.replaceState(null, '', '?date=2031-07-12');",
  "    if (window.__applySeasonDate) window.__applySeasonDate();",
  "    if (window.__applyDateOccasion) window.__applyDateOccasion();",
  "    ok('special day: an ordinary date clears the occasion ribbon', !el('occasion-banner'));",
  "    history.replaceState(null, '', originalOccUrl);",
  "    if (window.__applySeasonDate) window.__applySeasonDate();",
  "    if (window.__applyDateOccasion) window.__applyDateOccasion();",
  "",
  "    // The first round is the solve, with no incoming texts. Recurring messages should be dropped",
  "    // so their own schedulers can retry in context; one-shot occasion messages must be held because",
  "    // their date latch will not call again. Starting the first party flushes only that held mail.",
  "    ok('messages setup: extinguisher reset returned to phase one', !window.__secondRound);",
  "    var gardenWallSwitch = el('garden-lightswitch');",
  "    gardenWallSwitch.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    await sleep(40);",
  "    ok('garden switch: phase one still flips day to night without starting the party', !window.__gardenPartyOn && el('stage-garden').classList.contains('dusk'));",
  "    ok('kitchen: phase one night keeps the espresso kitchen instead of raising the bar', !(window.__barUpNow && window.__barUpNow()) && !strip.classList.contains('second-round') && getComputedStyle(el('kitchen-bar')).opacity === '0');",
  "    gardenWallSwitch.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    await sleep(40);",
  "    ok('garden switch: phase one still flips night back to day', !window.__gardenPartyOn && !el('stage-garden').classList.contains('dusk'));",
  "    if (window.__deliverPhoneMessage) window.__deliverPhoneMessage('cue_mail');",
  "    if (window.__deliverOccasionText) window.__deliverOccasionText('occ_phase_gate_test', 'msg_behdad_from', 'cue_mail_body', 'app:mail');",
  "    ok('messages: recurring text does not arrive during phase one', !(window.__phoneMessageReceived && window.__phoneMessageReceived('cue_mail')));",
  "    ok('messages: one-shot occasion text does not arrive during phase one', !(window.__phoneMessageReceived && window.__phoneMessageReceived('occ_phase_gate_test')));",
  "    var realMessageFocus = document.hasFocus; document.hasFocus = function () { return true; };",
  "    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'P', code: 'KeyP', shiftKey: true, bubbles: true, cancelable: true }));",
  "    await sleep(40);",
  "    ok('messages: Shift+P starts the party and phase two', !!window.__gardenPartyOn && !!window.__secondRound);",
  "    ok('messages: held occasion text arrives when phase two starts', !!(window.__phoneMessageReceived && window.__phoneMessageReceived('occ_phase_gate_test')));",
  "    ok('messages: stale recurring phase-one attempt is not flushed', !(window.__phoneMessageReceived && window.__phoneMessageReceived('cue_mail')));",
  "    if (window.__goToStage) window.__goToStage('garden');",
  "    ok('garden switch cue: deterministic reveal hook exists', typeof window.__showPartyExitHint === 'function' && window.__showPartyExitHint());",
  "    var partyExitFlash = window.__flashCaptionState && window.__flashCaptionState(); if (partyExitFlash && window.__clearFlashCaption) window.__clearFlashCaption(partyExitFlash.owner);",
  "    ok('garden switch cue: caption says the party ends but exploration continues', window.__captionKey && window.__captionKey() === 'party_exit_hint' && /not the game/i.test(el('hunt-caption').textContent) && /apps stay open/i.test(el('hunt-caption').textContent));",
  "    ok('garden switch cue: the wall switch pulses until used', gardenWallSwitch.classList.contains('invite-pulse'));",
  "    gardenWallSwitch.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    await sleep(40);",
  "    ok('garden switch: phase two turns the party off, restores day and retires its cue', !window.__gardenPartyOn && !el('stage-garden').classList.contains('dusk') && !gardenWallSwitch.classList.contains('invite-pulse'));",
  "    ok('garden switch: phase two remains latched after the party ends', !!window.__secondRound);",
  "    if (window.__setPartyMode) window.__setPartyMode(true, true, false);",
  "    ok('checkpoint party restore: Continue resumes the ordinary message cadence without replaying the fast notification chime', window.__cueDripFastOpener && !window.__cueDripFastOpener());",
  "    if (window.__setPartyMode) window.__setPartyMode(false, true, false);",
  "    gardenWallSwitch.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    await sleep(40);",
  "    ok('garden switch: phase two turns the party back on without repeating the cue', !!window.__gardenPartyOn && el('stage-garden').classList.contains('dusk') && !gardenWallSwitch.classList.contains('invite-pulse'));",
  "    ok('party bridge: the post-teardown room coach holds unrelated phone attention', window.__partyRoomMapCoachActive && window.__partyRoomMapCoachActive() && window.__heldPartyCoachCalls && Array.isArray(window.__heldPartyCoachCalls()));",
  "    // Retire the feature coach through its owner. Below 10/10 this releases ordinary phone",
  "    // attention without enqueueing any Road Trip exchange message into the timing probe.",
  "    if (window.__retirePartyRoomMapCoach) window.__retirePartyRoomMapCoach();",
  "    var msgCoach = document.querySelector('.msg-badge-coach'), msgBadge = document.querySelector('.msg-badge');",
  "    ok('messages: coach stays out of the live notification popup', !msgCoach || !msgCoach.classList.contains('show'));",
  "    if (window.__hideMessageThumb) window.__hideMessageThumb();",
  "    await sleep(2800);",
  "    msgCoach = document.querySelector('.msg-badge-coach');",
  "    ok('messages: coach still waits three seconds after the popup leaves', !msgCoach || !msgCoach.classList.contains('show'));",
  "    await sleep(300);",
  "    msgCoach = document.querySelector('.msg-badge-coach');",
  "    if (document.querySelector('.msg-thumb.show')) {",
  "      ok('messages: a newer popup postpones the badge coach', !msgCoach || !msgCoach.classList.contains('show'));",
  "      if (window.__hideMessageThumb) window.__hideMessageThumb();",
  "      await sleep(2800);",
  "      msgCoach = document.querySelector('.msg-badge-coach');",
  "      ok('messages: coach waits three seconds after the newer popup too', !msgCoach || !msgCoach.classList.contains('show'));",
  "      await sleep(600);",
  "      msgCoach = document.querySelector('.msg-badge-coach');",
  "    }",
  "    ok('messages: unread badge teaches the control three seconds after popup dismissal', !!msgCoach && msgCoach.classList.contains('show') && !!msgBadge && msgBadge.classList.contains('coached'), JSON.stringify({coach:!!msgCoach,show:!!msgCoach&&msgCoach.classList.contains('show'),badge:!!msgBadge,coached:!!msgBadge&&msgBadge.classList.contains('coached'),thumb:!!document.querySelector('.msg-thumb.show'),phone:!!document.querySelector('.phone-backdrop.show'),hidden:document.hidden,focus:document.hasFocus(),cinematic:!!window.__cinematic}));",
  "    ok('messages: badge coach uses the shared large Fraunces treatment', !!msgCoach && getComputedStyle(msgCoach).fontSize === '26px' && getComputedStyle(msgCoach).fontFamily.indexOf('Fraunces') !== -1, msgCoach && getComputedStyle(msgCoach).cssText);",
  "    ok('messages: badge coach uses one coherent inline arrow path and a dismiss control', !!msgCoach && msgCoach.querySelectorAll('.msg-badge-coach-arrow path').length === 1 && !!msgCoach.querySelector('.msg-badge-coach-dismiss'));",
  "    if (window.__hideMsgBadgeCoach) window.__hideMsgBadgeCoach();",
  "    if (window.__repeatMsgBadgeCoach) window.__repeatMsgBadgeCoach();",
  "    msgCoach = document.querySelector('.msg-badge-coach');",
  "    ok('messages: a temporary cover repaints the durable lesson before acknowledgement', !!msgCoach && msgCoach.classList.contains('show') && !!msgBadge && msgBadge.classList.contains('coached'));",
  "    if (msgBadge) msgBadge.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    await sleep(40);",
  "    ok('messages: opening the unread bubble dismisses its coach', !!msgCoach && !msgCoach.classList.contains('show') && !!msgBadge && !msgBadge.classList.contains('coached'));",
  "    if (window.__closePhoneModal) window.__closePhoneModal(true);",
  "    await sleep(260);",
  "    if (window.__repeatMsgBadgeCoach) window.__repeatMsgBadgeCoach();",
  "    ok('messages: clicking the notification count permanently retires its coach', !!msgBadge && msgBadge.classList.contains('show') && !!msgCoach && !msgCoach.classList.contains('show'));",
  "",
  "    // Party children: Irene/Robin/Navid gain formal floor figures; the four family kids join",
  "    // the established three runners only after their own parents have arrived. A forced chase",
  "    // exercises the standing-figure/runner handoff and the stable Who's here identity contract.",
  "    var coreKids = ['irene', 'robin', 'navid'];",
  "    var familyKids = ['elisabeth', 'felix', 'patricia-son', 'patricia-daughter', 'hannah'];",
  "    var allRunningKids = coreKids.concat(familyKids);",
  "    var floorModels = coreKids.map(function (name) { return document.querySelector('#garden-guests .g-' + name); });",
  "    ok('party kids: Irene, Robin and Navid have full dance-floor figures', floorModels.every(function (fig) { return !!(fig && fig.querySelector('.guest-arrival .guest-orbit .guest-move .guest-sway .guest-react')); }));",
  "    ok('party kids: hanging arms rotate from their top shoulder corners', floorModels.every(function (fig) { return ['.guest-arm-l', '.guest-arm-r'].every(function (sel) { var arm = fig && fig.querySelector(sel), origin = arm && getComputedStyle(arm).transformOrigin.split(/\\s+/); return origin && parseFloat(origin[1]) === 0; }); }));",
  "    var floorAgeScale = { irene: 1.03, robin: 1, navid: .96, 'patricia-son': .93, elisabeth: .87, felix: .8, 'patricia-daughter': 1 };",
  "    ok('party kids: standing figures carry the authored age scale', Object.keys(floorAgeScale).every(function (name) { var fig = document.querySelector('#garden-guests .g-' + name), m = fig && fig.transform.baseVal.consolidate(); return m && Math.abs(Math.abs(m.matrix.a) - floorAgeScale[name]) < .001; }));",
  "    ok('party kids: chase and formation test hooks exist', typeof window.__gardenChaseEligible === 'function' && typeof window.__startGardenChase === 'function' && typeof window.__clearGardenChase === 'function' && typeof window.__setPartyKidFormation === 'function');",
  "    var oldMousesVisiting = window.__mousesVisiting; window.__mousesVisiting = true;",
  "    if (window.__syncMousesVisitingClass) window.__syncMousesVisitingClass();",
  "    var baharehNook = el('cuddly-vis-bahareh'); if (baharehNook) baharehNook.classList.remove('showing');",
  "    if (window.__syncBaharehParty) window.__syncBaharehParty();",
  "    if (window.__goToStage) window.__goToStage('garden');",
  "    await sleep(40);",
  "    var summonedForChase = window.__summonGuests && window.__summonGuests();",
  "    ok('party kids setup: the whole party can be summoned in the garden', !!summonedForChase);",
  "    // This fixture exercises an awake-kids party. The autonomous first party cue can legally",
  "    // deliver kids_asleep during the earlier notification-coach waits, so establish the fixture",
  "    // state explicitly before asking which children are eligible for its chase.",
  "    if (window.__wakeKids) window.__wakeKids();",
  "    if (window.__retuneDancers) window.__retuneDancers('techno');",
  "    var ireneArmDur = parseFloat(getComputedStyle(document.querySelector('#garden-guests .g-irene .guest-arm-l')).animationDuration) || 0;",
  "    ok('party kids: Robin and Navid retain the same happy dance tempo as Irene', ['robin', 'navid'].every(function (name) { var fig = document.querySelector('#garden-guests .g-' + name); return getComputedStyle(fig.querySelector('.guest-move')).animationName === 'guest-mouse-sway' && Math.abs((parseFloat(getComputedStyle(fig.querySelector('.guest-arm-l')).animationDuration) || 0) - ireneArmDur) < .01; }));",
  "    if (window.__clearGardenChase) window.__clearGardenChase();",
  "    if (window.__setPartyKidFormation) window.__setPartyKidFormation('play');",
  "    var eligible = window.__gardenChaseEligible ? window.__gardenChaseEligible().slice().sort() : [];",
  "    ok('party kids: all eight Cuddly-assigned children are eligible to run', eligible.join('|') === allRunningKids.slice().sort().join('|'), 'eligible=' + eligible.join(','));",
  "    var parents = ['madla', 'robert', 'patricia', 'baharak'].map(function (name) { return document.querySelector('#garden-guests .g-' + name); });",
  "    parents.forEach(function (parent) { if (parent) parent.classList.remove('arrived'); });",
  "    var gated = window.__gardenChaseEligible ? window.__gardenChaseEligible().slice().sort() : [];",
  "    ok('party kids: family runners remain eligible after their parents rotate off the floor', gated.join('|') === allRunningKids.slice().sort().join('|'), 'eligible=' + gated.join(','));",
  "    parents.forEach(function (parent) { if (parent) parent.classList.add('arrived'); });",
  "    window.__mousesVisiting = false; if (window.__syncMousesVisitingClass) window.__syncMousesVisitingClass();",
  "    var withoutMouses = window.__gardenChaseEligible ? window.__gardenChaseEligible() : [];",
  "    ok('party kids: Elisabeth and Felix also respect the visiting-family gate', withoutMouses.indexOf('elisabeth') < 0 && withoutMouses.indexOf('felix') < 0 && withoutMouses.indexOf('patricia-son') >= 0 && withoutMouses.indexOf('patricia-daughter') >= 0);",
  "    window.__mousesVisiting = true; if (window.__syncMousesVisitingClass) window.__syncMousesVisitingClass();",
  "    var offsetRunners = ['elisabeth', 'felix', 'patricia-son', 'patricia-daughter', 'hannah', 'bahareh'];",
  "    ok('party kids: external runners share the garden stage offset', offsetRunners.every(function (name) { var kid = el('garden-kid-' + name); return kid && (kid.getAttribute('transform') || '').replace(/\\s/g, '') === 'translate(680,0)'; }));",
  "    var runnerAgeOrder = ['irene', 'hannah', 'robin', 'navid', 'patricia-son', 'elisabeth', 'felix', 'patricia-daughter'];",
  "    var runnerScales = runnerAgeOrder.map(function (name) { var body = el('garden-kid-' + name + '-body'), m = body && body.transform.baseVal.consolidate(); return m ? Math.abs(m.matrix.a) : 0; });",
  "    ok('party kids: all eight runners carry an authored age scale', runnerScales.every(function (scale) { return scale > 0; }), 'scales=' + runnerScales.join(','));",
  "    var runnerFeet = { irene: 110, hannah: 110, robin: 110, navid: 110, 'patricia-son': 110, elisabeth: 106, felix: 104, 'patricia-daughter': 110 };",
  "    ok('party kids: age scaling leaves every runner planted on the lawn', runnerAgeOrder.every(function (name) { var body = el('garden-kid-' + name + '-body'), m = body && body.transform.baseVal.consolidate(), y = m && m.matrix.f + m.matrix.d * runnerFeet[name]; return y > 329 && y < 337; }));",
  "    var rosterBeforeChase = window.__rosterList ? window.__rosterList('garden').join('|') : '';",
  "    var playEligible = window.__gardenChaseEligible ? window.__gardenChaseEligible() : [];",
  "    var playRoster = window.__rosterList ? window.__rosterList('garden') : [];",
  "    ok('party kids: Cuddly-assigned children leave the dance floor but remain chase-eligible', allRunningKids.every(function (name) { var fig = document.querySelector('#garden-guests .g-' + name); return fig && fig.classList.contains('off-at-games') && playEligible.indexOf(name) >= 0; }) && playRoster.indexOf('Robin') < 0 && playRoster.indexOf('Navid') < 0);",
  "    if (window.__goToStage) window.__goToStage('cuddly'); await sleep(40);",
  "    var gameKeys = window.__kidGamesNow ? window.__kidGamesNow().map(function (kid) { return kid.key; }) : [];",
  "    ok('party kids: all eight assigned children are present in the Cuddly game', allRunningKids.every(function (name) { return gameKeys.indexOf(name) >= 0; }));",
  "    if (window.__goToStage) window.__goToStage('garden'); await sleep(40);",
  "    // This probe deliberately tests an awake-kids chase. The real bedtime message runs on",
  "    // wall-clock timers and can land here on a slower headless pass, so establish that",
  "    // precondition explicitly before inspecting chase and dance-chance behavior.",
  "    if (window.__wakeKids) window.__wakeKids();",
  "    if (window.__summonGuests) window.__summonGuests();",
  "    if (window.__setPartyKidFormation) window.__setPartyKidFormation('play');",
  "    // The second, test-only flag launches the authored forced pack synchronously. Headless",
  "    // virtual time fast-forwards CSS animations, so a timed mid-cross sample is unreliable;",
  "    // player and console paths omit the flag and retain the 420 ms visual stagger.",
  "    if (window.__startGardenChase) window.__startGardenChase(true, true);",
  "    var chasedKids = allRunningKids.filter(function (name) { var kid = el('garden-kid-' + name); return kid && kid.classList.contains('chasing'); });",
  "    ok('party kids: a forced chase can run all eight children', chasedKids.length === 8, 'running=' + chasedKids.join(','));",
  "    ok('party kids: a chase preserves every Cuddly home assignment', allRunningKids.every(function (name) { return document.querySelector('#garden-guests .g-' + name).classList.contains('off-at-games'); }));",
  "    ok('party kids: Bahareh trails the forced chase from the corrected side', has('garden-kid-bahareh', 'chasing') && !has('garden-kid-cat', 'chasing'));",
  "    ok('party kids: no child remains duplicated on the dance floor while running', allRunningKids.every(function (name) { var fig = document.querySelector('#garden-guests .g-' + name); return fig && fig.classList.contains('off-with-kids'); }));",
  "    var rosterDuringChase = window.__rosterList ? window.__rosterList('garden').join('|') : '';",
  "    ok(\"party kids: Who's here temporarily reports every Cuddly runner in the garden\", allRunningKids.every(function (key) { var info = window.__rosterPersonInfo && window.__rosterPersonInfo(key); return info && rosterDuringChase.indexOf(info.name) >= 0; }), 'before=' + rosterBeforeChase + ' during=' + rosterDuringChase);",
  "    if (window.__clearGardenChase) window.__clearGardenChase();",
  "    ok('party kids: clearing a chase restores every standing child', allRunningKids.every(function (name) { var fig = document.querySelector('#garden-guests .g-' + name); return fig && !fig.classList.contains('off-with-kids'); }));",
  "    function kidShift(name) { var fig = document.querySelector('#garden-guests .g-' + name); return fig ? parseFloat(fig.style.getPropertyValue('--balance-x')) : NaN; }",
  "    if (window.__setPartyKidFormation) window.__setPartyKidFormation('godsons');",
  "    ok('party kids: godsons can dance between the hosts', document.getElementById('garden-guests').getAttribute('data-kid-formation') === 'godsons' && kidShift('robin') === 60 && kidShift('navid') === -72);",
  "    var baharehFloor = document.querySelector('#garden-guests .g-bahareh'), baharehX = 0;",
  "    if (baharehFloor) { try { var bm = baharehFloor.transform.baseVal.consolidate(); if (bm) baharehX = bm.matrix.e; } catch (e) {} baharehX += parseFloat(baharehFloor.style.getPropertyValue('--balance-x')) || 0; }",
  "    if (window.__setPartyKidFormation) window.__setPartyKidFormation('family');",
  "    var expectedIreneShift = Math.max(40, Math.min(640, baharehX - 27)) - 552;",
  "    ok('party kids: Irene can dance beside Bahareh', document.getElementById('garden-guests').getAttribute('data-kid-formation') === 'family' && Math.abs(kidShift('irene') - expectedIreneShift) < 0.01);",
  "    if (window.__setPartyKidFormation) window.__setPartyKidFormation('free');",
  "    ok('party kids: represented dancing parents raise the child dance chance', window.__partyKidDanceChance('irene') === .70 && window.__partyKidDanceChance('hannah') === .70);",
  "    ok('party kids: children without a represented dancing parent use the baseline chance', window.__partyKidDanceChance('robin') === .25 && window.__partyKidDanceChance('navid') === .25);",
  "    var kidRandom = Math.random; Math.random = function () { return .99; };",
  "    if (window.__deliverPhoneMessage) window.__deliverPhoneMessage('kids_asleep');",
  "    var lateFloorKids = ['irene','robin','navid','elisabeth','felix','patricia-son','patricia-daughter','hannah'];",
  "    ok('party kids: sleep clears Cuddly and leaves non-dancers individually asleep', !!window.__kidsAsleep && !!window.__kidsLateParty && lateFloorKids.every(function (name) { var fig = document.querySelector('#garden-guests .g-' + name); return fig && fig.classList.contains('off-asleep') && !fig.classList.contains('off-at-games'); }));",
  "    ok('party kids: sleep lowers every child dance chance to eight percent', lateFloorKids.every(function (name) { return window.__partyKidDanceChance(name) === .08; }));",
  "    if (window.__wakeKids) window.__wakeKids();",
  "    Math.random = kidRandom;",
  "    ok('party kids: waking clears individual sleep assignments', !window.__kidsAsleep && lateFloorKids.every(function (name) { return !document.querySelector('#garden-guests .g-' + name).classList.contains('off-asleep'); }));",
  "    window.__mousesVisiting = oldMousesVisiting; if (window.__syncMousesVisitingClass) window.__syncMousesVisitingClass();",
  "    document.hasFocus = realMessageFocus;",
  "    if (window.__setGardenParty) window.__setGardenParty(false, false);",
  "    var strandedKidGames = lateFloorKids.filter(function (name) { return document.querySelector('#garden-guests .g-' + name).classList.contains('off-at-games'); });",
  "    ok('party kids: ending the party clears its late-kid attendance bias', !window.__kidsLateParty && !strandedKidGames.length, 'late=' + window.__kidsLateParty + ' stranded=' + strandedKidGames.join(','));",
  "    window.__secondRound = false; if (window.__resetPhoneApps) window.__resetPhoneApps();",
  "",
  "    // Hold WAAPI effects open so particle counts are deterministic, then reproduce the exact",
  "    // failure mode: the browser remains visibilityState=visible while another fullscreen window",
  "    // owns focus. Blur must cancel/remove the live shells and the pacing timer must stay empty.",
  "    var realHasFocus = document.hasFocus, fakeFocus = true, realSvgAnimate = SVGElement.prototype.animate, realGetAnimations = Element.prototype.getAnimations;",
  "    var cancelledFireworkAnimations = 0;",
  "    document.hasFocus = function () { return fakeFocus; };",
  "    SVGElement.prototype.animate = function () { return { onfinish: null, cancel: function () {} }; };",
  "    Element.prototype.getAnimations = function () { return [{ cancel: function () { cancelledFireworkAnimations++; } }]; };",
  "    var oldWeddingDay = window.__isWeddingDay; window.__isWeddingDay = true;",
  "    if (window.__goToStage) window.__goToStage('balcony');",
  "    if (window.__updateSkyFireworks) window.__updateSkyFireworks('balcony');",
  "    await sleep(40);",
  "    var ambientFireworks = document.querySelectorAll('#balcony-fireworks .fw-particle').length;",
  "    ok('fireworks setup: attended wedding sky launches particles', ambientFireworks > 0, 'particles=' + ambientFireworks);",
  "    fakeFocus = false; window.dispatchEvent(new Event('blur'));",
  "    ok('fireworks: visible-but-unfocused blur clears live particles', document.querySelectorAll('#balcony-fireworks .fw-particle').length === 0);",
  "    ok('fireworks: clearing also cancels paused WAAPI effects', cancelledFireworkAnimations >= ambientFireworks, 'cancelled=' + cancelledFireworkAnimations + ', particles=' + ambientFireworks);",
  "    await sleep(3200);",
  "    ok('fireworks: ambient timer spawns nothing while visible but unfocused', document.querySelectorAll('#balcony-fireworks .fw-particle').length === 0);",
  "    fakeFocus = true; window.__isWeddingDay = oldWeddingDay;",
  "    if (window.__updateSkyFireworks) window.__updateSkyFireworks('kitchen');",
  "    SVGElement.prototype.animate = realSvgAnimate; Element.prototype.getAnimations = realGetAnimations; document.hasFocus = realHasFocus;",
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
  "      await sleep(900);",
  "      ok('phone: unrelated backgrounding still closes the phone', !document.querySelector('.phone-backdrop.show'));",
  "      fakeHidden = false; document.dispatchEvent(new Event('visibilitychange'));",
  "    }",
  "",
  "    // Fullscreen APIs require a trusted gesture in production; the page's class-fill lets",
  "    // this headless probe exercise the return state machine without pretending an untrusted",
  "    // synthetic event received a real browser fullscreen grant.",
  "    var fsArea = document.getElementById('hunt-fullscreen-area');",
  "    ok('fullscreen setup: toggle hook + area exist', !!fsArea && typeof window.__toggleFullscreen === 'function');",
  "    if (fsArea && window.__toggleFullscreen) {",
  "      if (!fsArea.classList.contains('is-fullscreen')) window.__toggleFullscreen();",
  "      ok('fullscreen setup: game enters the fullscreen fill', fsArea.classList.contains('is-fullscreen'));",
  "      document.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "      window.dispatchEvent(new Event('blur'));",
  "      fakeHidden = true; document.dispatchEvent(new Event('visibilitychange'));",
  "      document.dispatchEvent(new Event('fullscreenchange'));", // browser drops its real fullscreen during the handoff
  "      ok('fullscreen: tab handoff releases the stale fullscreen fill', !fsArea.classList.contains('is-fullscreen'));",
  "      fakeHidden = false; document.dispatchEvent(new Event('visibilitychange'));",
  "      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "      ok('fullscreen: first click after return restores fullscreen', fsArea.classList.contains('is-fullscreen'));",
  "      window.__toggleFullscreen();",
  "      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "      ok('fullscreen: explicit exit is not undone by the next click', !fsArea.classList.contains('is-fullscreen'));",
  "      window.__toggleFullscreen();",
  "      var heldResetFill = window.__holdFullscreenFill && window.__holdFullscreenFill();",
  "      document.dispatchEvent(new Event('fullscreenchange'));",
  "      ok('fullscreen: restart confirmation preserves the installed/class fullscreen fill', heldResetFill && fsArea.classList.contains('is-fullscreen'));",
  "      if (window.__releaseFullscreenFill) window.__releaseFullscreenFill();",
  "      window.__toggleFullscreen();",
  "",
  "      window.__openPhoneAppHere('calendar');",
  "      await sleep(80);",
  "      window.__toggleFullscreen();",
  "      fakeHidden = true; document.dispatchEvent(new Event('visibilitychange'));",
  "      fakeHidden = false; document.dispatchEvent(new Event('visibilitychange'));",
  "      await sleep(80);",
  "      var fsPhone = document.querySelector('.phone-backdrop.show');",
  "      ok('fullscreen: entering keeps the phone open in the fullscreen host', !!fsPhone && fsPhone.parentNode === fsArea);",
  "      window.__toggleFullscreen();",
  "      fakeHidden = true; document.dispatchEvent(new Event('visibilitychange'));",
  "      fakeHidden = false; document.dispatchEvent(new Event('visibilitychange'));",
  "      await sleep(80);",
  "      fsPhone = document.querySelector('.phone-backdrop.show');",
  "      ok('fullscreen: leaving keeps the phone open in the page host', !!fsPhone && fsPhone.parentNode === document.body);",
  "      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true, cancelable: true }));",
  "      await sleep(80);",
  "      fsPhone = document.querySelector('.phone-backdrop.show');",
  "      ok('fullscreen: phone-level f hotkey enters without dismissing the phone', !!fsPhone && fsPhone.parentNode === fsArea);",
  "      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true, cancelable: true }));",
  "      await sleep(80);",
  "      fsPhone = document.querySelector('.phone-backdrop.show');",
  "      ok('fullscreen: phone-level f hotkey exits without dismissing the phone', !!fsPhone && fsPhone.parentNode === document.body);",
  "",
  "      // Browser-owned exits (Escape/back) can report hidden BEFORE fullscreenchange, so they",
  "      // do not pass through __toggleFullscreen's explicit transition guard. A quick visible",
  "      // return must cancel that pending teardown; a sustained ordinary hide still closes.",
  "      fakeHidden = true; document.dispatchEvent(new Event('visibilitychange'));",
  "      document.dispatchEvent(new Event('fullscreenchange'));",
  "      await sleep(80);",
  "      fakeHidden = false; document.dispatchEvent(new Event('visibilitychange'));",
  "      await sleep(800);",
  "      ok('fullscreen: browser-owned visibility blip keeps the phone open', !!document.querySelector('.phone-backdrop.show'));",
  "      fakeHidden = true; document.dispatchEvent(new Event('visibilitychange'));",
  "      await sleep(900);",
  "      ok('phone: sustained ordinary backgrounding still closes after the settle window', !document.querySelector('.phone-backdrop.show'));",
  "      fakeHidden = false; document.dispatchEvent(new Event('visibilitychange'));",
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

// ── game-only explicit fullscreen harness ──────────────────────────────────
// Loaded through canonical Loft Day so its non-installed game-only condition is active.
var LOFT_FULLSCREEN_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function () {",
  "  var report = { errors: [], asserts: [] };",
  "  function ok(label, cond) { report.asserts.push({ label: label, ok: !!cond }); }",
  "  function filled() { var a = document.getElementById('hunt-fullscreen-area'); return !!(a && a.classList.contains('is-fullscreen')); }",
  "  window.addEventListener('load', function () { setTimeout(function () {",
  "    var game = document.getElementById('loft-game-strip');",
  "    ok('loft fullscreen setup: game-only mode is active', !document.documentElement.classList.contains('revealed'));",
  "    ok('loft fullscreen setup: game starts outside fullscreen', !filled());",
  "    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    ok('loft fullscreen: an outside click leaves page mode active', !filled());",
  "    if (game) game.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    ok('loft fullscreen: first game click stays in the enlarged page mode', !filled());",
  "    ok('loft fullscreen: first game click clears the outer page chrome', window.__gameOnlyEntered && window.__gameOnlyEntered());",
  "    var button = document.getElementById('hunt-fullscreen-btn');",
  "    if (button) button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));",
  "    ok('loft fullscreen: explicit fullscreen button still enters fullscreen', filled());",
  "    report.errors = window.__errs; document.getElementById('__report').textContent = JSON.stringify(report);",
  "  }, 300); });",
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

// ── special-day automatic card phase gate ───────────────────────────────────
// This runs through the real loft-day alias because that route is the card's production owner;
// the main probe harness stays on rsvp.html so game-only alias behavior cannot affect its tests.
var SHARE_GATE_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function () {",
  "  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "  var report = { errors: [], asserts: [] };",
  "  function finish() { report.errors = window.__errs; document.getElementById('__report').textContent = JSON.stringify(report); }",
  "  function ok(l, c, d) { report.asserts.push({ label: l, ok: !!c, detail: c ? '' : String(d || '') }); }",
  "  async function run() {",
  "    await sleep(300);",
  "    history.replaceState(null, '', '?date=2031-07-11');",
  "    if (window.__applySeasonDate) window.__applySeasonDate();",
  "    if (window.__applyDateOccasion) window.__applyDateOccasion();",
  "    try { localStorage.removeItem('shareAutoShown:occ-wedding:2031-07-11'); } catch (e) {}",
  "    var calls = 0; window.__shareCard = function () { calls++; return Promise.resolve('test'); };",
  "    if (window.__retryShareAutoShow) window.__retryShareAutoShow();",
  "    ok('special day: automatic event card stays closed during phase one', calls === 0, 'calls=' + calls);",
  "    if (window.__setGardenParty) window.__setGardenParty(true, false);",
  "    await sleep(50);",
  "    ok('special day: first party starts phase two for the event card', !!window.__secondRound);",
  "    ok('special day: automatic event card releases at the phase-two boundary', calls === 1, 'calls=' + calls);",
  "    if (window.__retryShareAutoShow) window.__retryShareAutoShow();",
  "    await sleep(1000);",
  "    ok('special day: automatic event card remains once-per-day after release', calls === 1, 'calls=' + calls);",
  "    if (window.__resetShareAutoShow) window.__resetShareAutoShow();",
  "    if (window.__retryShareAutoShow) window.__retryShareAutoShow();",
  "    ok('special day: a game reset re-arms the automatic event card', calls === 2, 'calls=' + calls);",
  "    try { localStorage.removeItem('shareAutoShown:occ-wedding:2031-07-11'); } catch (e) {}",
  "  }",
  "  setTimeout(function () { run().catch(function (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }).then(finish); }, 200);",
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
  if (!ONLY || "probes".indexOf(ONLY) === 0) jobs.probes = lib.runPage("rsvp.html", PROBE_HARNESS, 52000, CHROME_OPTS); // includes the persistent two-step opening guide + latest-popup-aware message-coach delay
  if (!ONLY || "sharegate".indexOf(ONLY) === 0) jobs.sharegate = lib.runPage("loft-day.html", SHARE_GATE_HARNESS, 5000, CHROME_OPTS);
  if (!ONLY || "fullscreen".indexOf(ONLY) === 0) jobs.fullscreen = lib.runPage("loft-day.html", LOFT_FULLSCREEN_HARNESS, 7000, CHROME_OPTS);
  if (!ONLY || "persian".indexOf(ONLY) === 0) jobs.persian = lib.runPage("rsvp.html", PERSIAN_HARNESS, 9000, CHROME_OPTS);
  if (!ONLY || "meals".indexOf(ONLY) === 0) jobs.meals = lib.runPage("rsvp.html", MEALS_HARNESS, 12000, CHROME_OPTS);
  if (!Object.keys(jobs).length) {
    fail("unknown --only value: " + ONLY + " (use cascade|gates|probes|sharegate|fullscreen|persian|meals)");
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

  if (results.sharegate !== undefined) {
    var sg = results.sharegate;
    if (!sg) {
      fail("special-day share gate harness reported (page error before load, or budget too small)");
    } else {
      if (sg.errors.length) fail("special-day share gate: no uncaught JS errors", sg.errors.slice(0, 12).join("\n"));
      else pass("special-day share gate: no uncaught JS errors");
      sg.asserts.forEach(function (a) { if (a.ok) pass(a.label); else fail(a.label, a.detail); });
    }
  }

  if (results.fullscreen !== undefined) {
    var f = results.fullscreen;
    if (!f) {
      fail("loft fullscreen harness reported (page error before load, or budget too small)");
    } else {
      if (f.errors.length) fail("loft fullscreen: no uncaught JS errors", f.errors.slice(0, 12).join("\n"));
      else pass("loft fullscreen: no uncaught JS errors");
      f.asserts.forEach(function (a) { if (a.ok) pass(a.label); else fail(a.label); });
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
