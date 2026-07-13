#!/usr/bin/env node
// Visual regression harness: renders each rsvp.html room (kitchen, garden,
// cuddly, office, balcony) plus save-the-dates.html's two scenes in headless Chrome and
// compares the pixels against committed baselines in tests/baselines/.
// ADVISORY tool — not part of the must-pass-before-commit chain, and it exits 0
// with a SKIP message if google-chrome or ImageMagick (magick) is missing.
//
// Usage:
//   node tests/visual.js               compare current renders vs baselines
//   node tests/visual.js --update      regenerate baselines (after intentional art changes)
//   node tests/visual.js office        only shots whose name contains "office"
//
// Determinism recipe (all injected into a scratch copy, page files untouched):
//   - <style> *{animation:none; transition:none} — freezes every CSS animation/
//     transition (they don't advance under --virtual-time-budget anyway, but
//     frozen-at-frame-0 beats frozen-at-random-frame).
//   - Math.random seeded with the same LCG lib.js uses (ambient spawners and
//     some reaction pickers randomize; a fixed seed makes every load identical).
//   - Date frozen to a constant local time (the office desk clock renders
//     HH:MM and the menu bars render live day-countdowns — unfrozen, baselines
//     rot daily).
//   - localStorage cleared before page scripts (found-egg state leaks between
//     runs otherwise).
//   - For rsvp rooms: window.setTimeout is a no-op DURING the goToStage call so
//     the balcony finale (rain/rainbow/fireworks) never schedules, and rAF is
//     patched synchronous with goToStage in try/catch — the sync patch
//     stack-overflows goToStage's rAF-looping side effects, but the strip
//     position is applied before that point (see CLAUDE.md headless gotchas).
//
// Comparison: ImageMagick difference-composite pixel count (see comparePng),
// with a per-channel THRESHOLD and a per-shot PIXEL_BUDGET to absorb
// font/raster antialiasing drift across Chrome updates. Failures print the
// actual count and keep the offending render (and a red-highlight diff PNG)
// in the OS tmp dir for eyeballing.
"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var child = require("child_process");

var ROOT = path.join(__dirname, "..");
var BASE_DIR = path.join(__dirname, "baselines");
var RSVP_WINDOW = "1100,900"; // desktop game layout
// index scenes: NO scrolling — a scrolled screenshot under --virtual-time-budget
// captures a stale raster (observed: scrollY updated, pixels didn't). Instead the
// whole page renders in one tall mobile-layout window (doc is ~1570px at 600 wide,
// scenes stacked) and each scene is cropped out of it afterward.
var INDEX_WINDOW = "600,1600";
var BUDGET_MS = 6000; // virtual time; the rsvp harness acts at load+500ms
var THRESHOLD = "5%"; // a pixel counts as different only if its worst RGB channel differs by more than this
var PIXEL_BUDGET = 800; // differing pixels allowed per shot — generous on purpose; a false alarm costs more than a missed pixel

// Head injection: must land before the page's own scripts run.
var FREEZE = [
  "<style>*{animation:none !important; transition:none !important} html{scroll-behavior:auto !important}</style>", // smooth scroll animates and never lands under virtual time
  "<script>",
  "(function () {",
  "  try { localStorage.clear(); } catch (e) {}",
  "  var s = 0x2545f491 >>> 0;", // same LCG as lib.js seedRandom
  "  Math.random = function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };",
  "  var RealDate = Date;",
  "  var FIXED = new RealDate(2026, 5, 15, 14, 30, 0).getTime();", // local 14:30 — desk clock + countdowns constant
  "  window.Date = class extends RealDate {",
  "    constructor() { if (arguments.length) { super(...arguments); } else { super(FIXED); } }",
  "  };",
  "  window.Date.now = function () { return FIXED; };",
  "})();",
  "</script>"
].join("\n");

function rsvpHarness(room) {
  return [
    "<script>",
    "window.addEventListener('load', function () {",
    "  setTimeout(function () {",
    "    window.requestAnimationFrame = function (cb) { cb(performance.now()); return 0; };",
    "    window.cancelAnimationFrame = function () {};",
    "    var st = window.setTimeout;",
    "    window.setTimeout = function () { return 0; };", // no finale/re-settle timers from the jump
    "    try { window.goToStage(" + JSON.stringify(room) + "); } catch (e) {}", // sync rAF overflows the stack; position is already applied
    "    window.setTimeout = st;",
    "    window.scrollTo(0, 0);",
    "  }, 500);",
    "});",
    "</script>"
  ].join("\n");
}

var SHOTS = ["kitchen", "garden", "cuddly", "office", "balcony"].map(function (room) {
  return { name: "rsvp-" + room, file: "rsvp.html", window: RSVP_WINDOW, harness: rsvpHarness(room) };
}).concat([
  // crops (WxH+X+Y) framed from probed geometry: loft svg at y151, garden at y852, both 450x609
  { name: "index-loft", file: "save-the-dates.html", window: INDEX_WINDOW, harness: "", crop: "600x700+0+110" },
  { name: "index-garden", file: "save-the-dates.html", window: INDEX_WINDOW, harness: "", crop: "600x700+0+810" }
]);

function toolOk(cmd, args) {
  var r = child.spawnSync(cmd, args, { stdio: "ignore" });
  return !r.error && r.status === 0;
}

function makeScratch(file, harness) {
  var html = fs.readFileSync(path.join(ROOT, file), "utf8");
  var patched = html.replace("<head>", "<head>" + FREEZE).replace("</body>", harness + "\n</body>");
  var scratch = path.join(os.tmpdir(), "wedding-visual-" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".html");
  fs.writeFileSync(scratch, patched);
  return scratch;
}

function capture(shot, outPng) {
  var scratch = makeScratch(shot.file, shot.harness);
  var cmd = "google-chrome --headless=new --disable-gpu --hide-scrollbars " +
    "--force-device-scale-factor=1 --window-size=" + shot.window + " " +
    "--virtual-time-budget=" + BUDGET_MS + " " +
    "--screenshot=" + JSON.stringify(outPng) + " " + JSON.stringify("file://" + scratch);
  return new Promise(function (resolve, reject) {
    child.exec(cmd, { timeout: BUDGET_MS + 30000 }, function (err) {
      try { fs.unlinkSync(scratch); } catch (e) {}
      if (err || !fs.existsSync(outPng)) return reject(new Error("chrome render failed for " + shot.name + (err ? ": " + err.message : "")));
      if (shot.crop) {
        var c = child.spawnSync("magick", [outPng, "-crop", shot.crop, "+repage", outPng]);
        if (c.error || c.status !== 0) return reject(new Error("crop failed for " + shot.name));
      }
      resolve();
    });
  });
}

// Counts pixels whose worst RGB channel differs by more than THRESHOLD.
// Deliberately NOT `compare -metric AE`: this ImageMagick build prints AE as a
// quantum-scaled value that clamps at 65535, which read as a huge false diff.
function comparePng(current, baseline) {
  var dims = [current, baseline].map(function (f) {
    var r = child.spawnSync("magick", ["identify", "-format", "%wx%h", f]);
    return r.status === 0 ? r.stdout.toString() : "?";
  });
  if (dims[0] !== dims[1]) return { error: "size mismatch: " + dims[0] + " vs baseline " + dims[1] };
  var r = child.spawnSync("magick", [current, baseline, "-compose", "difference", "-composite",
    "-channel", "RGB", "-separate", "-evaluate-sequence", "max",
    "-threshold", THRESHOLD, "-format", "%[fx:mean*w*h]", "info:"]);
  if (r.error) return { error: String(r.error) };
  if (r.status !== 0) return { error: (r.stderr || "").toString().trim() || ("magick exit " + r.status) };
  return { count: Math.round(parseFloat(r.stdout.toString().trim())) };
}

function diffPng(current, baseline, outPng) {
  child.spawnSync("magick", ["compare", "-fuzz", THRESHOLD, current, baseline, outPng], { stdio: "ignore" });
}

var args = process.argv.slice(2);
var update = args.indexOf("--update") !== -1;
var filters = args.filter(function (a) { return a !== "--update"; });
var shots = filters.length
  ? SHOTS.filter(function (s) { return filters.some(function (f) { return s.name.indexOf(f) !== -1; }); })
  : SHOTS;
if (!shots.length) {
  console.log("No shots match " + JSON.stringify(filters) + ". Shots: " + SHOTS.map(function (s) { return s.name; }).join(", "));
  process.exit(1);
}

if (!toolOk("google-chrome", ["--version"]) || !toolOk("magick", ["-version"])) {
  console.log("visual: SKIP — needs google-chrome and ImageMagick (magick) on PATH.");
  console.log("Advisory tool; skipping is not a failure.");
  process.exit(0);
}

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) {
  failures++;
  console.log("  ✗ " + msg);
  if (detail) console.log("      " + String(detail).split("\n").join("\n      "));
}

console.log(update ? "Regenerating visual baselines:" : "Visual regression vs tests/baselines/ (channel threshold " + THRESHOLD + ", budget " + PIXEL_BUDGET + "px):");
if (update && !fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });

Promise.all(shots.map(function (shot) {
  var cur = path.join(os.tmpdir(), "wedding-visual-" + shot.name + ".png");
  return capture(shot, cur).then(function () { return { shot: shot, cur: cur }; });
})).then(function (results) {
  results.forEach(function (r) {
    var baseline = path.join(BASE_DIR, r.shot.name + ".png");
    if (update) {
      fs.copyFileSync(r.cur, baseline);
      fs.unlinkSync(r.cur);
      pass(r.shot.name + " -> " + path.relative(ROOT, baseline) + " (" + Math.round(fs.statSync(baseline).size / 1024) + " KB)");
      return;
    }
    if (!fs.existsSync(baseline)) {
      fail(r.shot.name + " has no baseline", "run: node tests/visual.js --update");
      return;
    }
    var c = comparePng(r.cur, baseline);
    if (c.error) {
      fail(r.shot.name + " compare errored (size mismatch? rerun --update)", c.error);
      return;
    }
    if (c.count <= PIXEL_BUDGET) {
      pass(r.shot.name + " (" + c.count + " px diff)");
      fs.unlinkSync(r.cur);
    } else {
      var diff = path.join(os.tmpdir(), "wedding-visual-" + r.shot.name + "-diff.png");
      diffPng(r.cur, baseline, diff);
      fail(r.shot.name + " (" + c.count + " px diff, budget " + PIXEL_BUDGET + ")",
        "render: " + r.cur + "\ndiff:   " + diff + "\nintentional change? rerun: node tests/visual.js --update");
    }
  });
  console.log("");
  if (failures > 0) {
    console.log(failures + " shot(s) drifted. Advisory — eyeball the kept renders before trusting or updating.");
    process.exit(1);
  }
  console.log(update ? "Baselines written." : "All shots match baselines.");
}).catch(function (e) {
  console.log("  ✗ " + (e && e.message || e));
  console.log("");
  console.log("Render infrastructure failed — advisory tool, treating as a failure anyway so drift is not silently missed.");
  process.exit(1);
});
