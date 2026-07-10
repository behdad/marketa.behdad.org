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
  // Concatenate EVERY inline <script> block, not a greedy first-open..last-close span
  // (that swallowed all the HTML in between once a second <script>, e.g. the head
  // #reveal toggle, was added). Joined so node --check validates them all and the
  // dictionary/i18n scans still see the main T-dictionary script.
  var re = /<script\b[^>]*>([\s\S]*?)<\/script>/g, m, parts = [];
  while ((m = re.exec(html))) if (m[1].trim()) parts.push(m[1]);
  return parts.length ? parts.join("\n;\n") : null;
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

// A CSS `animation: NAME ...` whose NAME has no matching `@keyframes NAME` silently
// does nothing — a class of bug that bites on renames (rename the rule but not the
// keyframes, or a plain typo). Bit the butterfly groove work (distinct groove keyframe
// names). Extract every referenced animation-name and verify a @keyframes defines it.
function checkAnimationKeyframes(file, style) {
  if (!style) return;
  var defined = new Set();
  var kfRe = /@(?:-webkit-)?keyframes\s+([A-Za-z_][\w-]*)/g;
  var km;
  while ((km = kfRe.exec(style))) defined.add(km[1]);
  // animation shorthand keywords (everything that ISN'T a custom animation-name);
  // cubic-bezier()/steps() are stripped as function calls before tokenizing.
  var KEYWORDS = new Set([
    "ease", "ease-in", "ease-out", "ease-in-out", "linear", "step-start", "step-end",
    "infinite", "normal", "reverse", "alternate", "alternate-reverse", "none",
    "forwards", "backwards", "both", "running", "paused",
    "initial", "inherit", "unset", "revert", "revert-layer"
  ]);
  var undefinedRefs = new Set();
  var declRe = /animation(?:-name)?\s*:\s*([^;}]+)/g;
  var dm;
  while ((dm = declRe.exec(style))) {
    var value = dm[1].replace(/[a-z-]+\([^)]*\)/gi, " "); // drop cubic-bezier()/steps()
    value.split(",").forEach(function (part) {
      part.trim().split(/\s+/).forEach(function (tok) {
        if (!tok || KEYWORDS.has(tok)) return;
        if (/^-?[\d.]+(m?s)?$/.test(tok)) return;          // duration / delay / count
        if (!/^[A-Za-z_][\w-]*$/.test(tok)) return;         // not an identifier
        if (!defined.has(tok)) undefinedRefs.add(tok);
      });
    });
  }
  if (undefinedRefs.size === 0) {
    pass(file + ": every animation name has a matching @keyframes");
  } else {
    fail(file + ": animation references undefined @keyframes", Array.from(undefinedRefs).join(", "));
  }
}

// Recurring historical bug (the mic, the lounger flip, the dustpan, the garden
// ukulele): a CSS animation whose @keyframes set the `transform` PROPERTY, applied
// to an element that also carries a static `transform="..."` ATTRIBUTE. The CSS
// property overrides the attribute for the animation's whole duration, so the
// element snaps to its unpositioned spot while animating (the uke sat 50px high
// mid-sway). Safe fixes this check will NOT flag: animate the individual
// `rotate:`/`translate:`/`scale:` properties instead, or hang the static transform
// on a wrapper <g> distinct from the animated node (ancestor transforms are fine —
// only the animated node itself carrying the attribute is the bug).
//
// Heuristic resolution of "which element does this animation run on": for each
// selector referencing an offending @keyframes, take the rightmost compound
// selector; if it has an #id, check that element's tag; otherwise check every
// element whose static class attribute contains any of the compound's classes
// (state classes like `.playing` are added dynamically and match nothing static —
// the stable base class or id is what locates the element).
var TRANSFORM_CLOBBER_ALLOW = [
  // "element-id" or ".class-name" entries for vetted false positives.
];
function checkTransformClobber(file, style, html) {
  if (!style) return;
  // 1. @keyframes whose (brace-matched) body sets the `transform:` property.
  var clobberKf = new Set();
  var kfRe = /@(?:-webkit-)?keyframes\s+([A-Za-z_][\w-]*)\s*\{/g;
  var km;
  while ((km = kfRe.exec(style))) {
    var depth = 1, i = kfRe.lastIndex;
    while (i < style.length && depth > 0) {
      if (style[i] === "{") depth++;
      else if (style[i] === "}") depth--;
      i++;
    }
    // `(?:^|[;{\s])` keeps transform-origin/transform-box/text-transform unmatched.
    if (/(?:^|[;{\s])transform\s*:/.test(style.slice(kfRe.lastIndex, i - 1))) clobberKf.add(km[1]);
  }
  // 2. every rule whose animation/animation-name references one of those keyframes.
  var ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  var rm;
  var issues = [];
  var seen = new Set();
  while ((rm = ruleRe.exec(style))) {
    var decl = rm[2];
    var declRe = /animation(?:-name)?\s*:\s*([^;]+)/g, dm;
    var names = [];
    while ((dm = declRe.exec(decl))) {
      dm[1].replace(/[a-z-]+\([^)]*\)/gi, " ").split(/[\s,]+/).forEach(function (tok) {
        if (clobberKf.has(tok)) names.push(tok);
      });
    }
    if (!names.length) continue;
    // 3. rightmost compound of each selector -> static elements -> transform attr?
    rm[1].split(",").forEach(function (sel) {
      sel = sel.trim().replace(/::?[\w-]+(\([^)]*\))?/g, ""); // strip pseudos
      var compounds = sel.split(/[\s>+~]+/).filter(Boolean);
      var last = compounds[compounds.length - 1] || "";
      var idm = last.match(/#([\w-]+)/);
      var tags = []; // [label, openingTag]
      if (idm) {
        if (TRANSFORM_CLOBBER_ALLOW.indexOf(idm[1]) !== -1) return;
        var tm = html.match(new RegExp('<[a-zA-Z][^>]*\\bid="' + idm[1] + '"[^>]*>'));
        if (tm) tags.push(["#" + idm[1], tm[0]]);
      } else {
        var cre = /\.([\w-]+)/g, cm;
        while ((cm = cre.exec(last))) {
          if (TRANSFORM_CLOBBER_ALLOW.indexOf("." + cm[1]) !== -1) continue;
          var tagRe = new RegExp('<[a-zA-Z][^>]*\\bclass="[^"]*\\b' + cm[1] + '\\b[^"]*"[^>]*>', "g");
          var tm2;
          while ((tm2 = tagRe.exec(html))) {
            var idIn = tm2[0].match(/\bid="([\w-]+)"/);
            tags.push([(idIn ? "#" + idIn[1] : "." + cm[1]), tm2[0]]);
          }
        }
      }
      tags.forEach(function (t) {
        if (!/\btransform="/.test(t[1])) return;
        var msg = t[0] + " has a static transform= attribute but animates @keyframes " +
          names.join("/") + " (via " + sel + ") which set the transform property";
        if (!seen.has(msg)) { seen.add(msg); issues.push(msg); }
      });
    });
  }
  if (issues.length === 0) {
    pass(file + ": no transform-property animation on an element with a static transform attribute");
  } else {
    fail(file + ": CSS transform animation clobbers a static transform= attribute (element will jump while animating — use rotate:/translate:/scale: keyframes or a wrapper <g>)",
      issues.join("\n"));
  }
}

// Every data-i / data-*-i / data-note-key attribute names a T dictionary key; a
// typo'd or missing key renders blank text (setLang writes innerHTML from T[key]).
// Verify each referenced key exists in the en dictionary (cs parity is checked above).
function checkI18nKeys(file, script, html) {
  if (!script) return;
  var attrRe = /\bdata-(?:i|href-i|aria-i|title-i|note-key)="([^"]+)"/g;
  var m, seen = new Set(), missing = [];
  while ((m = attrRe.exec(html))) {
    var key = m[1];
    if (seen.has(key)) continue;
    seen.add(key);
    // a key is defined iff it appears as `key:` in the inline script's T dictionaries
    // (matched directly, so keys sharing a line with another key still resolve)
    var keyRe = new RegExp("\\b" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:");
    if (!keyRe.test(script)) missing.push(key);
  }
  if (missing.length === 0) {
    pass(file + ": all data-i/data-note-key attributes resolve to a dictionary key");
  } else {
    fail(file + ": data-* i18n keys missing from the dictionary", missing.join(", "));
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
    checkI18nKeys(file, script, html);
  }
  checkAnimationKeyframes(file, style);
  checkTransformClobber(file, style, html);
  checkSvgTagBalance(file, html);
  console.log("");
});

if (failures > 0) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
} else {
  console.log("All checks passed.");
}
