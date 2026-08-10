// Shared headless-Chrome plumbing for play.js and state.js: the injected head
// hook, the scratch-copy page runner, and the <pre id="__report"> report parser.
// Zero dependencies — everything rides on google-chrome --headless --dump-dom.
"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var child = require("child_process");

// An alternate checkout lets focused probes compare the same harness against a baseline.
var ROOT = process.env.WEDDING_TEST_ROOT ? path.resolve(process.env.WEDDING_TEST_ROOT) : path.join(__dirname, "..");

// Head hook: error collectors, tab-open stub, link-navigation blocker. The rAF
// patch is spliced in only for pages that need it (rsvp): native rAF never ticks
// under --virtual-time-budget, so patching it to setTimeout lets rsvp's monitor
// screensaver advance — but that same patch keeps a per-frame loop alive so the
// page never goes idle, which stalls index's virtual-time fast-forward. So index
// keeps native (frozen) rAF and fast-forwards past its setTimeout timers.
//
// opts.seedRandom replaces Math.random with a tiny LCG so every page load
// consumes an identical random sequence (state.js asserts exact outcomes;
// unseeded randomness in reaction pickers / ambient timers would flake them).
function hook(opts) {
  opts = opts || {};
  return [
    "<script>",
    "window.__errs = [];",
    "window.addEventListener('error', function (e) {",
    "  if (window.__weddingTestShouldIgnoreError && window.__weddingTestShouldIgnoreError(e)) {",
    "    window.__ignoredWeddingTestErrors = (window.__ignoredWeddingTestErrors || 0) + 1;",
    "    return;",
    "  }",
    "  window.__errs.push(String(e.message) + ' @' + (e.filename||'') + ':' + e.lineno);",
    "});",
    "window.addEventListener('unhandledrejection', function (e) { window.__errs.push('rejection: ' + String(e.reason)); });",
    "window.open = function () { window.__opened = (window.__opened || 0) + 1; return null; };",
    // A real confirm/alert/prompt blocks the main thread and suspends virtual
    // time (the egg-reset button confirms), so stub them non-blocking.
    "window.confirm = function () { return true; };",
    "window.alert = function () {};",
    "window.prompt = function () { return null; };",
    opts.seedRandom ? "(function () { var s = 0x2545f491 >>> 0; Math.random = function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();" : "",
    // Headless Chrome reports prefers-reduced-motion:reduce by default (DEBUGGING.md), and a
    // headless tab is unfocused. cine.js needs the FULL-motion, focused path: override BOTH before
    // the body's inline script captures its reduceMotion var + before any focus-gated bed runs.
    opts.forceMotion ? "(function () { var mm = window.matchMedia; window.matchMedia = function (q) { var r = mm ? mm.call(window, q) : { matches: false, media: q, addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {} }; if (/prefers-reduced-motion/.test(q)) { try { Object.defineProperty(r, 'matches', { get: function () { return /no-preference/.test(q); } }); } catch (e) {} } return r; }; })();" : "",
    opts.forceMotion ? "document.hasFocus = function () { return true; };" : "",
    // The mirror image: force prefers-reduced-motion:reduce so cine.js can exercise the
    // reduced cinematic path deterministically (headless-Chrome's default here is no-preference,
    // NOT reduce, despite the older note — so it must be forced either way to be reliable).
    opts.forceReduce ? "(function () { var mm = window.matchMedia; window.matchMedia = function (q) { var r = mm ? mm.call(window, q) : { matches: false, media: q, addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {} }; if (/prefers-reduced-motion/.test(q)) { try { Object.defineProperty(r, 'matches', { get: function () { return /reduce/.test(q); } }); } catch (e) {} } return r; }; })();" : "",
    opts.forceReduce ? "document.hasFocus = function () { return true; };" : "",
    // Model a hybrid laptop whose primary pointer is fine but whose touchscreen is coarse.
    opts.forceHybridPointer ? "(function () { var mm = window.matchMedia; window.matchMedia = function (q) { var r = mm ? mm.call(window, q) : { matches: false, media: q, addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {} }; var forced = q === '(any-pointer: coarse)' ? true : (q === '(pointer: coarse)' ? false : null); if (forced !== null) { try { Object.defineProperty(r, 'matches', { configurable: true, get: function () { return forced; } }); } catch (e) {} } return r; }; })();" : "",
    // Model a touch-first phone/tablet: primary pointer coarse and no hover.
    opts.forceCoarsePointer ? "(function () { var mm = window.matchMedia; window.matchMedia = function (q) { var r = mm ? mm.call(window, q) : { matches: false, media: q, addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {} }; var forced = q === '(pointer: coarse)' || q === '(hover: none)' ? true : null; if (forced !== null) { try { Object.defineProperty(r, 'matches', { configurable: true, get: function () { return forced; } }); } catch (e) {} } return r; }; })();" : "",
    opts.forceStandalone ? "(function () { var mm = window.matchMedia; window.matchMedia = function (q) { var r = mm ? mm.call(window, q) : { matches: false, media: q, addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {} }; if (q === '(display-mode: standalone)') { try { Object.defineProperty(r, 'matches', { configurable: true, get: function () { return true; } }); } catch (e) {} } return r; }; })();" : "",
    opts.patchRaf ? "window.requestAnimationFrame = function (cb) { return setTimeout(function () { cb(performance.now()); }, 16); };" : "",
    opts.patchRaf ? "window.cancelAnimationFrame = function (id) { clearTimeout(id); };" : "",
    "document.addEventListener('click', function (e) {",
    "  var t = e.target && e.target.closest && e.target.closest('a, .party-send');",
    "  if (t) { e.preventDefault(); e.stopImmediatePropagation(); }",
    "}, true);",
    "</script>"
  ].join("\n");
}

// `fetch()` cannot read sibling files from a file:// page. Production uses ordinary same-origin
// fetches; headless scratch pages receive the exact canonical snippet bytes through this test-only
// resource hook, generated from the repository at run time rather than keeping a second source copy.
function codeSnippetResourceHook(html) {
  if (html.indexOf('src="code-snippets/manifest.js"') === -1) return "";
  var root = path.join(ROOT, "code-snippets"), resources = {};
  fs.readdirSync(root, { withFileTypes: true }).forEach(function (entry) {
    if (!entry.isFile()) return;
    resources["code-snippets/" + entry.name] = fs.readFileSync(path.join(root, entry.name), "utf8");
  });
  var serialized = JSON.stringify(resources).replace(/<\/script/gi, "<\\/script");
  return "<script>window.__codeSnippetResourceLoader=function(path){var resources=" + serialized + ";return Object.prototype.hasOwnProperty.call(resources,path)?resources[path]:Promise.reject(new Error('missing test resource: '+path));};</script>";
}

function chromeCmd(scratch, budgetMs, extraFlags, urlSuffix, profile) {
  // --mute-audio: the playthrough click-storms every interactive element and state.js
  // starts beds/dances/songs, so the game's Web Audio actually SOUNDS. --headless=new
  // routes audio to the default output device (and state.js forces
  // --autoplay-policy=no-user-gesture-required), so without this a test run blasts the
  // dev's speakers with a glitchy pile-up of overlapping sounds. The tests only inspect
  // the DOM/report — they never assert on audible output — so muting is free.
  return (process.env.CHROME_BIN || "google-chrome") + " --headless=new --disable-gpu --mute-audio --window-size=1100,900 " +
    "--user-data-dir=" + JSON.stringify(profile) + " --no-first-run --no-default-browser-check " +
    (extraFlags ? extraFlags + " " : "") +
    "--virtual-time-budget=" + budgetMs + " --dump-dom " + JSON.stringify("file://" + scratch + (urlSuffix || ""));
}

function makeScratch(file, harness, hookHtml) {
  var html = fs.readFileSync(path.join(ROOT, file), "utf8");
  var patched = html.replace("<head>", "<head>" + hookHtml + codeSnippetResourceHook(html)).replace("</body>", harness + "\n</body>");
  // Each page gets a private directory so relative authored assets remain relative.
  // Preserve the exact HTML basename: Loft Day's outer RSVP scaffolding is selected
  // positively by an rsvp/rsvp.html pathname, while every other name is game-only.
  var scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "wedding-page-"));
  var scratch = path.join(scratchDir, path.basename(file));
  ["loft-day.en.js", "loft-day.cs.js"].forEach(function (name) {
    if (html.indexOf('src="' + name + '"') !== -1) {
      fs.copyFileSync(path.join(ROOT, name), path.join(scratchDir, name));
    }
  });
  if (html.indexOf('src="code-snippets/') !== -1) fs.cpSync(path.join(ROOT, "code-snippets"), path.join(scratchDir, "code-snippets"), { recursive: true });
  fs.writeFileSync(scratch, patched);
  return scratch;
}

function removeScratch(scratch) {
  fs.rmSync(path.dirname(scratch), { recursive: true, force: true });
}

function parseReport(dom) {
  var m = dom.match(/<pre id="__report"[^>]*>([\s\S]*?)<\/pre>/);
  if (!m || m[1] === "pending") return null;
  return JSON.parse(m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
}

// Synchronous runner (play.js): pages run one after another.
// The pages' many infinite CSS animations keep virtual time from fast-forwarding
// at unlimited speed, so keep each budget just above what its harness needs
// (the report is set well before the budget runs out).
function runPageSync(file, harness, budgetMs, opts) {
  opts = opts || {};
  var lastError = null;
  for (var attempt = 0; attempt < 2; attempt++) {
    var scratch = makeScratch(file, harness, hook(opts));
    var profile = fs.mkdtempSync(path.join(os.tmpdir(), "wedding-chrome-"));
    var dom = "";
    try {
      dom = child.execSync(chromeCmd(scratch, budgetMs, opts.chromeFlags, opts.urlSuffix, profile), {
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 64 * 1024 * 1024,
        timeout: budgetMs + 30000
      }).toString();
      var report = parseReport(dom);
      if (report) return report;
    } catch (error) {
      lastError = error;
    } finally {
      removeScratch(scratch);
      fs.rmSync(profile, { recursive: true, force: true });
    }
  }
  if (lastError && !dom) throw lastError;
  return null;
}

// Async runner (state.js): lets independent captures run concurrently.
function runPage(file, harness, budgetMs, opts) {
  opts = opts || {};
  function attempt(remaining) {
    var scratch = makeScratch(file, harness, hook(opts));
    var profile = fs.mkdtempSync(path.join(os.tmpdir(), "wedding-chrome-"));
    return new Promise(function (resolve, reject) {
      child.exec(chromeCmd(scratch, budgetMs, opts.chromeFlags, opts.urlSuffix, profile), {
        maxBuffer: 64 * 1024 * 1024,
        timeout: budgetMs + 30000
      }, function (err, stdout) {
        try { removeScratch(scratch); } catch (e) {}
        try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
        var report = null;
        var parseError = null;
        try { report = stdout && parseReport(stdout.toString()); } catch (error) { parseError = error; }
        if (report) return resolve(report);
        if (remaining > 0) return resolve(attempt(remaining - 1));
        if (err && !stdout) return reject(err);
        if (parseError) return reject(parseError);
        resolve(null);
      });
    });
  }
  // A busy all-tests sweep can starve one fresh Chrome profile or its virtual-time
  // budget. Retry only a missing/malformed transport report; real assertion data is
  // returned untouched and still fails in the caller.
  return attempt(1);
}

module.exports = {
  ROOT: ROOT,
  hook: hook,
  runPage: runPage,
  runPageSync: runPageSync
};
