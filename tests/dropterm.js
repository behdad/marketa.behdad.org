#!/usr/bin/env node
// Zero-dependency logic harness for the DROP-DOWN TERMINAL (Quake console) in rsvp.html.
// Run with: node tests/dropterm.js
//
// Chrome-driven suites (play.js / enter.js / menu.js) can't run in this environment — the
// headless browser is wedged (they time out with SIGTERM). This harness proves, in pure
// Node against a tiny fake DOM, the three behaviours that don't need a real browser:
//
//   1. Backtick TOGGLES the drop-down open/closed (via window.__toggleDropTerm), on any scene.
//   2. Esc stays inside it while backtick closes it.
//   3. A line typed into the drop-down runs through the SHARED interpreter (consoleRun) and
//      its output lands in the DROP-DOWN's own scrollback (#dropterm-out), not the monitor's —
//      proving the activeConsoleOut re-pointing + ctx wiring actually route the print.
//   4. Dragging the lower edge changes a session-only, bounded height.
//
// It does this by EXTRACTING the real source of consolePrint + the drop-down block (openDropTerm/
// closeDropTerm/toggleDropTerm/dtCtx + the #dropterm-in keydown handler) straight out of
// rsvp.html and eval'ing it against a minimal DOM stub with a stubbed consoleRun that dispatches
// exactly the way the real one does (set activeConsoleOut from ctx.out, print, restore). If the
// real block's wiring drifts, the extraction/eval fails and so does this test.
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(ROOT, "rsvp.html"), "utf8");
var failures = 0;
function ok(label) { console.log("  ✓ " + label); }
function bad(label, detail) { failures++; console.log("  ✗ " + label); if (detail) console.log("      " + String(detail).split("\n").join("\n      ")); }
function assert(cond, label, detail) { if (cond) ok(label); else bad(label, detail); }

// ── 1. Structural wiring: the backtick handler toggles the drop-down (no whisk) ──────────
(function () {
  // the DOCUMENT backtick handler toggles the drop-down; a separate one-liner on the console INPUT
  // closes it on backtick (Quake convention) — skip that and match the branch that reaches __toggleDropTerm.
  var m = /else if \(e\.key === "`"\) \{[\s\S]{0,700}?__toggleDropTerm[\s\S]{0,120}?\n\s*\}/.exec(html);
  if (!m) { bad("backtick handler present", "no `e.key === \"`\"` branch reaches __toggleDropTerm"); return; }
  var body = m[0];
  assert(/__toggleDropTerm/.test(body), "backtick handler calls window.__toggleDropTerm");
  assert(!/__whiskToConsole|goToStage\("office"\)/.test(body), "backtick handler no longer whisks to the office monitor console");
})();

// ── 2. The interpreter is shared: consoleRun takes a ctx and re-points the print target ──
assert(/function consoleRun\(cmd, ctx\)/.test(html), "consoleRun accepts a ctx (surface) argument");
assert(/activeConsoleOut = ctx\.out \|\| consoleOut/.test(html), "consoleRun installs ctx.out as the active print target");
assert(/\} finally \{ activeConsoleOut = prevOut; \}/.test(html), "consoleRun restores the print target on every exit path (finally)");
assert(/consoleRun\(v, dtCtx\)/.test(html), "the drop-down Enter handler runs the line through consoleRun with its own ctx");
assert(/consoleTabComplete\(dtIn\)/.test(html), "the drop-down Tab handler reuses the shared consoleTabComplete on its own input");

// ── 3. The panel HTML + reset hook exist ────────────────────────────────────────────────
assert(/<div id="dropterm"[\s\S]*?id="dropterm-out"[\s\S]*?id="dropterm-in"/.test(html), "drop-down panel HTML (#dropterm / -out / -in) is present in .hunt-viewport");
assert(/class="hunt-left"[\s\S]*?id="loft-console-tools"[\s\S]*?id="dropterm-fps"[^>]*>--<[\s\S]*?id="hunt-prev"/.test(html), "the console tab and FPS readout occupy the top of the left scene rail");
assert(/\.loft-console-hint\{[^}]*color:var\(--wine[^}]*background:transparent[^}]*border:0[^}]*box-shadow:none/.test(html) &&
  /\.loft-console-hint \.ct-mark\{[^}]*transform:rotate\(45deg\)/.test(html) &&
  /\.loft-console-hint\.open \.ct-mark\{transform:rotate\(135deg\)/.test(html),
  "the discovered console button is backgroundless and turns its burgundy chevron right-to-down");
assert(/#dropterm-fps::after\{content:"FPS";[^}]*font-size:7px/.test(html), "the FPS meter stacks a small label below its numeric line");
assert(/id="dropterm-resize"/.test(html), "drop-down panel includes a lower-edge resize handle");
assert(/#dropterm\{[\s\S]*?transform:translateY\(-102%\)/.test(html), "#dropterm slides in from the top (transform:translateY off-screen by default)");
assert(/#dropterm\.open\{transform:translateY\(0\)/.test(html), "#dropterm.open slides down into view");
assert(/max-height:var\(--dropterm-max-height, 48%\)/.test(html), "drop-down height is a session-only CSS value with a 48% default");
assert(/function startDropTermFps\(\)[\s\S]*?elapsed >= 750/.test(html), "FPS readout uses a rolling requestAnimationFrame sample");
assert(/function revealConsoleTab\(\)[\s\S]*?startDropTermFps\(\)/.test(html) && /#dropterm-fps\.discovered\{display:block\}/.test(html), "FPS sampling and visibility begin when the console tab is discovered");
assert(/window\.__resetDropTerm/.test(html) && /if \(window\.__resetDropTerm\) window\.__resetDropTerm\(\);/.test(html), "the game reset wipes the drop-down session (__resetDropTerm wired into reset)");
assert(/loftDropTermScrollback/.test(html) && /localStorage\.getItem\(DT_SCROLL_KEY\)/.test(html), "drop-down scrollback restores from localStorage");
assert(/MutationObserver[\s\S]*?localStorage\.setItem\(DT_SCROLL_KEY, dtOut\.innerHTML\)/.test(html), "drop-down scrollback persists as output changes");
assert(/localStorage\.removeItem\(DT_SCROLL_KEY\)/.test(html), "full reset removes persisted drop-down scrollback");

// ── 4. Functional: extract the REAL drop-down block + consolePrint and drive it ──────────
(function () {
  // Fake DOM: elements with the DOM surface the extracted code touches.
  function El(id) {
    this.id = id || ""; this.value = ""; this.childNodes = []; this._cls = {};
    this.className = ""; this.selectionStart = 0; this.scrollTop = 0; this.scrollHeight = 0;
    this._listeners = {};
    this._style = {};
    this.style = {
      setProperty: function (k, v) { this._owner._style[k] = v; },
      getPropertyValue: function (k) { return this._owner._style[k] || ""; },
      _owner: this
    };
  }
  El.prototype.appendChild = function (n) { this.childNodes.push(n); };
  El.prototype.removeChild = function (n) { var i = this.childNodes.indexOf(n); if (i >= 0) this.childNodes.splice(i, 1); };
  El.prototype.setAttribute = function (k, v) { this["_attr_" + k] = v; };
  El.prototype.getAttribute = function (k) { return this["_attr_" + k]; };
  El.prototype.setSelectionRange = function () {};
  El.prototype.focus = function () {};
  El.prototype.blur = function () {};
  El.prototype.setPointerCapture = function (id) { this._captured = id; };
  El.prototype.releasePointerCapture = function (id) { if (this._captured === id) this._captured = null; };
  El.prototype.addEventListener = function (t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); };
  El.prototype.dispatch = function (t, ev) { (this._listeners[t] || []).forEach(function (fn) { fn(ev); }); };
  Object.defineProperty(El.prototype, "textContent", { set: function (v) { this._text = v; }, get: function () { return this._text; } });
  Object.defineProperty(El.prototype, "innerHTML", { set: function (v) { if (v === "") this.childNodes = []; this._html = v; }, get: function () { return this._html; } });
  El.prototype.classList = null;
  function clsList(el) {
    return { add: function (c) { el._cls[c] = 1; }, remove: function (c) { delete el._cls[c]; }, contains: function (c) { return !!el._cls[c]; } };
  }

  var dropterm = new El("dropterm"); dropterm.classList = clsList(dropterm);
  var dFps = new El("dropterm-fps"); dFps.classList = clsList(dFps);
  var dOut = new El("dropterm-out");
  var dIn = new El("dropterm-in");
  var dResize = new El("dropterm-resize");
  var viewport = new El("viewport");
  viewport.getBoundingClientRect = function () { return { top: 100, height: 1000 }; };
  dropterm.parentElement = viewport;
  var monOut = new El("monitor-console-out"); // the monitor console's scrollback — must NOT receive the drop-down's output

  var byId = { "dropterm": dropterm, "dropterm-fps": dFps, "dropterm-out": dOut, "dropterm-in": dIn, "dropterm-resize": dResize, "monitor-console-out": monOut };
  var timers = [];
  var rafs = {}, nextRaf = 1;
  var sandbox = {
    consoleOut: monOut,          // consolePrint's default target = the monitor console
    consoleHist: [],
    consoleHistIdx: 0,
    document: {
      getElementById: function (id) { return byId[id] || null; },
      addEventListener: function () {},
      createElement: function () { return new El(); }
    },
    window: {
      requestAnimationFrame: function (fn) { var id = nextRaf++; rafs[id] = fn; return id; },
      cancelAnimationFrame: function (id) { delete rafs[id]; }
    },
    setTimeout: function (fn) { timers.push(fn); return 1; },
    getSelection: function () { return { isCollapsed: true }; },
    consoleT: function () { return "welcome to the loft console"; }
  };
  sandbox.window.getSelection = sandbox.getSelection;

  // Pull the exact source of consolePrint (the shared print with activeConsoleOut routing).
  var mPrint = html.match(/var activeConsoleOut = consoleOut;\n  function consolePrint\(txt, cls\) \{[\s\S]*?\n  \}/);
  if (!mPrint) { bad("could extract consolePrint source", "regex miss"); return; }

  // Pull the exact drop-down block: from "var dtPanel" through the end of the dtIn keydown wiring.
  var mBlock = html.match(/var dtPanel = document\.getElementById\("dropterm"\);[\s\S]*?window\.__dropTermOpen = dtOpen;[\s\S]*?\n  \}\n  if \(dtPanel\) \{/);
  if (!mBlock) { bad("could extract drop-down block source", "regex miss"); return; }

  // A faithful stub of the interpreter's dispatch: it does exactly what the real consoleRun
  // prologue does with ctx.out — installs it as activeConsoleOut, prints the echo + a result,
  // pushes history via ctx.setHistIdx, then restores. This is the contract the drop-down relies on.
  var interpreterSrc = [
    "function consoleRun(cmd, ctx){",
    "  ctx = ctx || { out: consoleOut, hist: consoleHist, isMonitor:true, setHistIdx:function(n){consoleHistIdx=n;} };",
    "  var prevOut = activeConsoleOut;",
    "  activeConsoleOut = ctx.out || consoleOut;",
    "  try {",
    "    consolePrint('❯ ' + cmd);",           // the prompt echo
    "    var c = (cmd||'').trim(); if(!c) return;",
    "    var hist = ctx.hist || consoleHist;",
    "    hist.push(cmd); if(ctx.setHistIdx) ctx.setHistIdx(hist.length); else consoleHistIdx = hist.length;",
    "    if (c === 'loft.garden.set(true)') { consolePrint('party started'); return; }", // a representative command
    "    consolePrint('undefined');",
    "  } finally { activeConsoleOut = prevOut; }",
    "}"
  ].join("\n");

  var src = "(function(document, window, setTimeout, consoleOut, consoleHist, consoleHistIdx, consoleT){\n" +
    "  var activeConsoleOut = consoleOut;\n" +
    mPrint[0].replace(/^\s*var activeConsoleOut = consoleOut;\n/, "") + "\n" +
    interpreterSrc + "\n" +
    "  var CONSOLE_WELCOME = consoleT();\n" +
    "  function appAutoFocusTextControl(control){ if(control&&control.focus)control.focus(); return true; }\n" +
    "  function consoleTabComplete(){}\n" +
    mBlock[0].replace(/\n  if \(dtPanel\) \{$/, "") + "\n" +
    "  return { win: window, dropterm: arguments[0].getElementById ? null : null };\n" +
    "})";

  var factory;
  try { factory = eval(src); } catch (e) { bad("drop-down block eval", e && e.stack || String(e)); return; }
  try { factory(sandbox.document, sandbox.window, sandbox.setTimeout, sandbox.consoleOut, sandbox.consoleHist, sandbox.consoleHistIdx, sandbox.consoleT); }
  catch (e) { bad("drop-down block init", e && e.stack || String(e)); return; }

  var win = sandbox.window;
  assert(typeof win.__toggleDropTerm === "function", "window.__toggleDropTerm exported");
  assert(typeof win.__closeDropTerm === "function", "window.__closeDropTerm exported");
  assert(typeof win.__resetDropTerm === "function", "window.__resetDropTerm exported");

  // (1) console discovery starts the persistent FPS meter; backtick still toggles the panel
  win.__revealConsoleTab();
  assert(win.__dropTermFpsRunning() && dFps.classList.contains("discovered"), "console discovery reveals and starts the outer-chrome FPS meter");
  win.__toggleDropTerm();
  assert(dropterm.classList.contains("open"), "backtick (toggle) OPENS the drop-down");
  for (var frame = 1; frame <= 50; frame++) {
    var ids = Object.keys(rafs), id = ids[0], fn = rafs[id]; delete rafs[id];
    fn(frame * 16.67);
  }
  assert(/^(59|60|61)$/.test(dFps._text), "the rolling sampler reports rendered-frame FPS", dFps._text);
  var welcomedInDrop = dOut.childNodes.length === 1 && dOut.childNodes[0]._text === "welcome to the loft console";
  assert(welcomedInDrop, "opening prints the welcome into the DROP-DOWN scrollback (not the monitor)", "monitor lines=" + monOut.childNodes.length);
  var pev = function (id, y) { return { pointerId:id, button:0, clientY:y, preventDefault:function(){}, stopPropagation:function(){} }; };
  dResize.dispatch("pointerdown", pev(7, 800));
  assert(dropterm.style.getPropertyValue("--dropterm-max-height") === "70.00%" && dropterm.classList.contains("resizing"),
    "lower-edge drag sets the open height from the viewport");
  dResize.dispatch("pointermove", pev(7, 2000));
  assert(dropterm.style.getPropertyValue("--dropterm-max-height") === "82.00%", "resize clamps at the lower-edge maximum");
  dResize.dispatch("pointermove", pev(7, 0));
  assert(dropterm.style.getPropertyValue("--dropterm-max-height") === "20.00%", "resize clamps at the lower-edge minimum");
  dResize.dispatch("pointerup", pev(7, 0));
  assert(!dropterm.classList.contains("resizing") && dResize._captured == null, "pointer release ends the resize cleanly");
  win.__toggleDropTerm();
  assert(!dropterm.classList.contains("open"), "backtick (toggle) again CLOSES the drop-down");
  assert(win.__dropTermFpsRunning() && Object.keys(rafs).length === 1, "closing leaves the discovered FPS sampler running");

  // (2) run a command through the shared interpreter via the drop-down input keydown
  win.__toggleDropTerm(); // open again
  var dropBefore = dOut.childNodes.length, monBefore = monOut.childNodes.length;
  dIn.value = "loft.garden.set(true)";
  dIn.dispatch("keydown", { key: "Enter", stopPropagation: function () {}, preventDefault: function () {} });
  var newDropLines = dOut.childNodes.slice(dropBefore).map(function (n) { return n._text; });
  assert(newDropLines.indexOf("❯ loft.garden.set(true)") !== -1, "the typed line is echoed into the drop-down scrollback");
  assert(newDropLines.indexOf("party started") !== -1, "the command's OUTPUT is printed into the drop-down scrollback (shared interpreter)");
  assert(monOut.childNodes.length === monBefore, "NONE of it leaked into the monitor console's scrollback (activeConsoleOut restored)", "monitor gained " + (monOut.childNodes.length - monBefore) + " lines");
  assert(dIn.value === "", "the input is cleared after Enter");

  // history recorded on the drop-down's own stack (via ctx.setHistIdx), not the monitor's
  assert(sandbox.consoleHist.length === 0, "the drop-down does NOT push into the monitor console's history array");

  // (3) Esc stays inside the console; only the Quake toggle closes it
  dIn.dispatch("keydown", { key: "Escape", stopPropagation: function () {}, preventDefault: function () {} });
  assert(dropterm.classList.contains("open"), "Esc leaves the drop-down open");
  dIn.dispatch("keydown", { key: "`", stopPropagation: function () {}, preventDefault: function () {} });
  assert(!dropterm.classList.contains("open"), "backtick still closes the drop-down from its input");

  // (4) reset wipes + closes
  win.__toggleDropTerm();
  win.__resetDropTerm();
  assert(!dropterm.classList.contains("open"), "__resetDropTerm closes the panel");
  assert(dOut.childNodes.length === 0, "__resetDropTerm wipes the scrollback");
})();

if (failures) { console.log("\n" + failures + " check(s) FAILED."); process.exit(1); }
console.log("\nAll drop-down terminal checks passed.");
