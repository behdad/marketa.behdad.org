#!/usr/bin/env node
// Zero-dependency sanity checks for index.html and rsvp.html.
// Run with: node tests/check.js
"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var execSync = require("child_process").execSync;

var ROOT = path.join(__dirname, "..");
var FILES = ["index.html", "rsvp.html"];
var failures = 0;

function pass(label) {
  console.log("  ✓ " + label);
}
function fail(label, detail) {
  failures++;
  console.log("  ✗ " + label);
  if (detail) console.log("      " + String(detail).split("\n").join("\n      "));
}

function extractScript(html) {
  var m = html.match(/<script>([\s\S]*)<\/script>/);
  return m ? m[1] : null;
}

function extractStyle(html) {
  var m = html.match(/<style>([\s\S]*)<\/style>/);
  return m ? m[1] : null;
}

function checkSyntax(file, script) {
  if (!script) {
    fail(file + ": inline <script> found");
    return;
  }
  pass(file + ": inline <script> found");
  var tmp = path.join(os.tmpdir(), "wedding-check-" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".js");
  fs.writeFileSync(tmp, script);
  try {
    execSync("node --check " + JSON.stringify(tmp), { stdio: "pipe" });
    pass(file + ": node --check passed");
  } catch (e) {
    fail(file + ": node --check failed", e.stderr ? e.stderr.toString() : e.message);
  } finally {
    fs.unlinkSync(tmp);
  }
}

function checkSvgTagBalance(file, html) {
  var start = html.indexOf('<svg id="loft-game-strip"');
  if (start === -1) return; // not applicable (index.html)
  var end = html.indexOf("</svg>", start);
  var svg = html.slice(start, end);
  var opens = (svg.match(/<g[ >]/g) || []).length;
  var closes = (svg.match(/<\/g>/g) || []).length;
  if (opens === closes) {
    pass(file + ": <g> tag balance (" + opens + " open / " + closes + " close)");
  } else {
    fail(file + ": <g> tag balance mismatch", opens + " open vs " + closes + " close");
  }
}

// Extracts the top-level keys of a `en: { ... }` / `cs: { ... }` object literal
// by brace-depth scanning from the line where it starts. Good enough for this
// file's hand-written dictionaries; not a general JS parser.
function extractDictKeys(script, label) {
  var lines = script.split("\n");
  var startIdx = -1;
  var re = new RegExp("^\\s*" + label + "\\s*:\\s*\\{");
  for (var i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) { startIdx = i; break; }
  }
  if (startIdx === -1) return null;
  var keys = [];
  var depth = 0;
  for (var j = startIdx; j < lines.length; j++) {
    var line = lines[j];
    var opens = (line.match(/\{/g) || []).length;
    var closes = (line.match(/\}/g) || []).length;
    depth += opens - closes;
    var m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/);
    if (m && depth >= 1 && j !== startIdx) keys.push(m[1]);
    if (j > startIdx && depth <= 0) break;
  }
  return keys;
}

function checkDictParity(file, script) {
  var enKeys = extractDictKeys(script, "en");
  var csKeys = extractDictKeys(script, "cs");
  if (!enKeys || !csKeys) {
    fail(file + ": could not locate en:/cs: dictionaries to compare");
    return;
  }
  var enSet = new Set(enKeys);
  var csSet = new Set(csKeys);
  var enOnly = enKeys.filter(function (k) { return !csSet.has(k); });
  var csOnly = csKeys.filter(function (k) { return !enSet.has(k); });
  if (enOnly.length === 0 && csOnly.length === 0) {
    pass(file + ": EN/CS dictionary keys match (" + enKeys.length + " keys)");
  } else {
    fail(file + ": EN/CS dictionary key mismatch",
      (enOnly.length ? "EN only: " + enOnly.join(", ") + "\n" : "") +
      (csOnly.length ? "CS only: " + csOnly.join(", ") : ""));
  }
}

function checkEggTotal(html, script) {
  var totalMatch = script.match(/EGG_TOTAL\s*=\s*(\d+)/);
  if (!totalMatch) return; // not applicable (rsvp.html)
  var declared = parseInt(totalMatch[1], 10);
  var liCount = (html.match(/<li[^>]*data-egg="/g) || []).length;
  if (declared === liCount) {
    pass("index.html: EGG_TOTAL matches cheatsheet <li data-egg> count (" + declared + ")");
  } else {
    fail("index.html: EGG_TOTAL (" + declared + ") does not match cheatsheet <li data-egg> count (" + liCount + ")");
  }
}

// Recurring historical bug (fixed 3x: 4886f92, dd525fe, 6650508): an SVG element
// animated via .animate() with a `transform` keyframe, without transformBox set to
// "fill-box" first, pivots around the SVG viewport origin instead of its own center —
// particles drift/swing wildly instead of scaling or rotating in place.
function checkParticleTransformOrigin(file, script) {
  var fnRe = /function\s+\w+\s*\([^)]*\)\s*\{/g;
  var fnMatch;
  var issues = [];
  while ((fnMatch = fnRe.exec(script))) {
    var bodyStart = fnMatch.index + fnMatch[0].length;
    var depth = 1;
    var i = bodyStart;
    while (i < script.length && depth > 0) {
      if (script[i] === "{") depth++;
      else if (script[i] === "}") depth--;
      i++;
    }
    var body = script.slice(bodyStart, i - 1);
    var animateRe = /(\w+)\.animate\(\s*\[/g;
    var aMatch;
    while ((aMatch = animateRe.exec(body))) {
      var varName = aMatch[1];
      var kfStart = aMatch.index + aMatch[0].length - 1;
      var bd = 1, j = kfStart + 1;
      while (j < body.length && bd > 0) {
        if (body[j] === "[") bd++;
        else if (body[j] === "]") bd--;
        j++;
      }
      var keyframes = body.slice(kfStart, j);
      // Pure translate() is unaffected by transform-box/-origin; only scale/rotate/skew
      // pivot around it, so only flag keyframes that use one of those.
      if (!/transform\s*:[^,}]*(scale|rotate|skew)\w*\s*\(/.test(keyframes)) continue;
      var boxRe = new RegExp("\\b" + varName + "\\.style\\.transformBox\\b");
      var priorText = body.slice(0, aMatch.index);
      if (!boxRe.test(priorText)) {
        issues.push(varName + ".animate(...) with a transform keyframe, no " + varName + ".style.transformBox set first");
      }
    }
  }
  if (issues.length === 0) {
    pass(file + ": no particle .animate() calls missing transform-box:fill-box");
  } else {
    fail(file + ": possible missing transform-box:fill-box before .animate()", issues.join("\n"));
  }
}

// Recurring historical bug (gong rattle, cuddly utensils/blanket, Marketa's
// lean+bottom-wiggle): a one-shot CSS `animation:` class gets added via rAF/rAF but is
// never explicitly removed anywhere in JS. If a sibling class targeting the same
// property later comes later in CSS source order, the never-removed class permanently
// wins the cascade and silently blocks the sibling's animation forever after the first
// play. Heuristic: every class driving a non-infinite `animation:` should appear in at
// least one `classList.remove(...)` or `classList.toggle(...)` call somewhere in the JS.
function checkAnimationClassCleanup(file, style, script, html) {
  if (!style) {
    fail(file + ": could not locate <style> block");
    return;
  }
  // Classes that appear in a static class="..." attribute are structural/base classes
  // (always present on the element), not dynamically toggled state — exclude them, or
  // almost everything with a shared base class (e.g. ".head-group.shake") gets flagged.
  var staticClasses = new Set();
  var classAttrRe = /\bclass="([^"]*)"/g;
  var caMatch;
  while ((caMatch = classAttrRe.exec(html))) {
    caMatch[1].split(/\s+/).forEach(function (c) { if (c) staticClasses.add(c); });
  }
  var ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  var ruleMatch;
  var classesSeen = new Set();
  var issues = [];
  while ((ruleMatch = ruleRe.exec(style))) {
    var selector = ruleMatch[1];
    var decl = ruleMatch[2];
    var animMatch = decl.match(/animation\s*:\s*([^;]+)/);
    if (!animMatch) continue;
    if (/\binfinite\b/.test(animMatch[1])) continue; // looping, not one-shot
    var classRe = /\.([A-Za-z][\w-]*)/g;
    var cm;
    while ((cm = classRe.exec(selector))) {
      if (!staticClasses.has(cm[1])) classesSeen.add(cm[1]);
    }
  }
  classesSeen.forEach(function (cls) {
    var removeRe = new RegExp("classList\\.(remove|toggle)\\([^)]*[\"']" + cls + "[\"']");
    if (removeRe.test(script)) return;
    // Elements created via createElementNS + setAttribute("class", ...) and later
    // destroyed outright (element.remove()) don't need their class removed first —
    // the whole node is gone. Only flag classes toggled on persistent elements.
    var transientRe = new RegExp("setAttribute\\(\\s*[\"']class[\"']\\s*,\\s*[\"']" + cls + "[\"']");
    if (transientRe.test(script) && /\.remove\(\)/.test(script)) return;
    issues.push(cls);
  });
  if (issues.length === 0) {
    pass(file + ": all one-shot animation classes are removed somewhere in JS");
  } else {
    fail(file + ": one-shot animation class(es) never explicitly removed (risk of permanently blocking a sibling class)",
      issues.join(", "));
  }
}

FILES.forEach(function (file) {
  console.log(file + ":");
  var html = fs.readFileSync(path.join(ROOT, file), "utf8");
  var script = extractScript(html);
  var style = extractStyle(html);
  checkSyntax(file, script);
  if (script) {
    checkDictParity(file, script);
    checkEggTotal(html, script);
    checkParticleTransformOrigin(file, script);
    checkAnimationClassCleanup(file, style, script, html);
  }
  checkSvgTagBalance(file, html);
  console.log("");
});

if (failures > 0) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
} else {
  console.log("All checks passed.");
}
