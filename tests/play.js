#!/usr/bin/env node
// Interaction smoke test for rsvp.html: solves the whole game start to
// finish, then click-storms every interactive element, failing on any
// uncaught JS error. Slower than check.js (spawns headless Chrome); run it
// after changes that touch game logic or interactions.
//
// Usage: node tests/play.js
"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var execSync = require("child_process").execSync;

var ROOT = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(ROOT, "rsvp.html"), "utf8");

// Head hook: error collectors, tab-open stub, and an rAF that runs via
// setTimeout (sync rAF would make the monitor screensaver's loop recurse
// forever; plain rAF never ticks under --virtual-time-budget).
var HOOK = [
  "<script>",
  "window.__errs = [];",
  "window.addEventListener('error', function (e) { window.__errs.push(String(e.message) + ' @' + (e.filename||'') + ':' + e.lineno); });",
  "window.addEventListener('unhandledrejection', function (e) { window.__errs.push('rejection: ' + String(e.reason)); });",
  "window.open = function () { window.__opened = (window.__opened || 0) + 1; return null; };",
  "window.requestAnimationFrame = function (cb) { return setTimeout(function () { cb(performance.now()); }, 16); };",
  "window.cancelAnimationFrame = function (id) { clearTimeout(id); };",
  "</script>"
].join("\n");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "  function fire(el, type) {",
  "    if (!el) return false;",
  "    if (type === 'enter') el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));",
  "    else el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));",
  "    return true;",
  "  }",
  "  function click(id) { return fire(document.getElementById(id), 'click'); }",
  "  var report = { errors: [], solve: {}, stormClicked: 0, missing: [] };",
  "  function expect(id) { if (!document.getElementById(id)) report.missing.push(id); return id; }",
  "  async function solve() {",
  "    // kitchen: power -> grind -> brew -> sip",
  "    click(expect('kitchen-lamarzocco'));",
  "    click(expect('kitchen-grinder'));",
  "    await sleep(1600);",
  "    click(expect('kitchen-portafilter'));",
  "    await sleep(2700);",
  "    click(expect('kitchen-shotcup'));",
  "    await sleep(1500);",
  "    report.solve.afterKitchen = window.currentStageIndex;",
  "    // garden: water + music + candles",
  "    click(expect('garden-monstera'));",
  "    click(expect('garden-ukulele'));",
  "    click(expect('garden-candle-1'));",
  "    click(expect('garden-candle-2'));",
  "    await sleep(1500);",
  "    report.solve.afterGarden = window.currentStageIndex;",
  "    // cuddly: play with Octi, pull a blanket (Enter = keyboard pull)",
  "    click(expect('cuddly-octopus'));",
  "    await sleep(400);",
  "    fire(document.getElementById(expect('cuddly-blanket')), 'enter');",
  "    await sleep(1200);",
  "    report.solve.afterCuddly = window.currentStageIndex;",
  "    // office: lights out, find the butterfly",
  "    click(expect('office-lamp'));",
  "    click(expect('office-pendant'));",
  "    click(expect('office-stainedglass'));",
  "    await sleep(2600);",
  "    report.solve.afterOffice = window.currentStageIndex;",
  "    // balcony finale runs ~9s of timers (rain, melody, rainbow, fireworks)",
  "    await sleep(10000);",
  "    report.solve.final = window.currentStageIndex;",
  "  }",
  "  async function storm() {",
  "    var stages = ['kitchen', 'garden', 'cuddly', 'office', 'balcony'];",
  "    for (var s = 0; s < stages.length; s++) {",
  "      if (window.goToStage) window.goToStage(stages[s]);",
  "      await sleep(120);",
  "    }",
  "    var hits = Array.prototype.slice.call(document.querySelectorAll('.hunt-hit'));",
  "    for (var i = 0; i < hits.length; i++) {",
  "      fire(hits[i], 'click');",
  "      report.stormClicked++;",
  "      if (i % 12 === 0) await sleep(180);",
  "    }",
  "    await sleep(1500);",
  "    for (var j = 0; j < hits.length; j++) {",
  "      fire(hits[j], 'dblclick');",
  "      fire(hits[j], 'enter');",
  "      if (j % 12 === 0) await sleep(180);",
  "    }",
  "    // let scheduled timers (boot sequences, thunder, echoes) flush",
  "    await sleep(9000);",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      solve().then(storm).catch(function (e) {",
  "        window.__errs.push('harness: ' + String(e && e.stack || e));",
  "      }).then(function () {",
  "        report.errors = window.__errs;",
  "        document.getElementById('__report').textContent = JSON.stringify(report);",
  "        document.title = 'PLAY-DONE';",
  "      });",
  "    }, 400);",
  "  });",
  "})();",
  "</script>"
].join("\n");

var scratch = path.join(os.tmpdir(), "wedding-play-" + Date.now() + ".html");
var patched = html.replace("<head>", "<head>" + HOOK);
patched = patched.replace("</body>", HARNESS + "\n</body>");
fs.writeFileSync(scratch, patched);

var dom;
try {
  dom = execSync(
    "google-chrome --headless=new --disable-gpu --window-size=1100,900 " +
    "--virtual-time-budget=120000 --dump-dom " + JSON.stringify("file://" + scratch),
    { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024, timeout: 120000 }
  ).toString();
} finally {
  fs.unlinkSync(scratch);
}

var m = dom.match(/<pre id="__report"[^>]*>([\s\S]*?)<\/pre>/);
if (!m || m[1] === "pending") {
  console.log("✗ play.js: harness never reported (page error before load, or budget too small)");
  process.exit(1);
}
var report = JSON.parse(m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) {
  failures++;
  console.log("  ✗ " + msg);
  if (detail) console.log("      " + String(detail).split("\n").join("\n      "));
}

console.log("rsvp.html interaction playthrough:");
if (report.missing.length) fail("all solve-path elements exist", "missing: " + report.missing.join(", "));
else pass("all solve-path elements exist");
if (report.solve.final === 4) pass("game solves start to finish (reached balcony)");
else fail("game solves start to finish", "stage progression: " + JSON.stringify(report.solve));
if (report.stormClicked >= 60) pass("click-stormed " + report.stormClicked + " interactive elements");
else fail("interactive element count sanity", "only " + report.stormClicked + " .hunt-hit elements found");
if (report.errors.length === 0) pass("no uncaught JS errors across the entire run");
else fail("no uncaught JS errors", report.errors.slice(0, 12).join("\n"));

if (failures > 0) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
} else {
  console.log("All checks passed.");
}
