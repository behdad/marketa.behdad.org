#!/usr/bin/env node
// Zero-dependency sanity checks for save-the-dates.html and rsvp.html.
// Run with: node tests/check.js
"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var execSync = require("child_process").execSync;

var ROOT = path.join(__dirname, "..");
var FILES = ["save-the-dates.html", "rsvp.html"];
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
  if (start === -1) return; // not applicable (save-the-dates.html)
  // the strip may contain nested <svg> icons (foreignObject HTML) — find ITS closing
  // tag by depth, not the first </svg>
  var depth = 0, end = -1, re = /<svg[\s>]|<\/svg>/g;
  re.lastIndex = start;
  var m;
  while ((m = re.exec(html))) {
    if (m[0] === "</svg>") { depth--; if (depth === 0) { end = m.index; break; } }
    else depth++;
  }
  if (end === -1) end = html.length;
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
    pass("save-the-dates.html: EGG_TOTAL matches cheatsheet <li data-egg> count (" + declared + ")");
  } else {
    fail("save-the-dates.html: EGG_TOTAL (" + declared + ") does not match cheatsheet <li data-egg> count (" + liCount + ")");
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
    if (/^\s*none\b/.test(animMatch[1])) continue; // `animation:none` is a reset (e.g. a reduced-motion or channel-gate override), not a one-shot class
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
          // class-token boundary must exclude hyphens (a plain \b treats "-" as a
          // boundary, so ".sky-shoot" would wrongly match class="sky-shoot-wrap")
          var tagRe = new RegExp('<[a-zA-Z][^>]*\\bclass="[^"]*(?<![\\w-])' + cm[1] + '(?![\\w-])[^"]*"[^>]*>', "g");
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

// The room-gated ambient drones (PC fan, AC hum, kitchen radio, kettle hum,
// fireplace crackle) all stop the same way: ramp the master gain to ~0 over a
// fade, then a setTimeout stops the source and closes the AudioContext. THE
// invariant: the close delay (ms) must be >= the ramp end (secs * 1000), or
// the source is cut mid-ramp — reintroducing the exact abrupt cut the
// room-change fade exists to remove. Today both sides derive from the same
// fade variable (`ctx.currentTime + f` vs `f * 1000 + 100`) so they can't
// drift, but a future edit can bump one side and not the other.
//
// Two tiers:
//  - FADE_STOP_FNS (the room-gated stops in rsvp.html) are checked strictly:
//    every silence-ramp end and close delay must parse in terms of ONE shared
//    fade variable, the variable must appear on BOTH sides (a stop that
//    ignores its fadeSecs silently breaks goToStage's ROOM_FADE), and the
//    inequality must hold at every sampled fade value 0..5s (any caller).
//    Any shape drift — a rename, a second variable, an unparseable
//    expression — fails loudly instead of silently skipping, so this can't
//    rot into a no-op. New room-gated drones belong in the list.
//  - Every other function that ramps a gain to silence at an anchored
//    `<ctx>.currentTime + <offset>` AND setTimeout-closes a context gets a
//    constants-only lower-bound check: compare only pure-numeric ramp ends
//    against pure-numeric close delays (anything symbolic is skipped, so no
//    false positives). ~50 one-shot SFX closers get this for free.
var FADE_STOP_FNS = ["stopFire", "stopKettleHum", "stopRadioStatic", "stopPcFan", "stopACHum"];
var FADE_CLOSE_ALLOW = [
  // "functionName" entries for vetted false positives of the constants-only tier.
];
var FADE_SAMPLES = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 5];
function checkAudioFadeCloseRace(file, script) {
  function matchParen(s, openIdx) { // s[openIdx] === "(" -> index of matching ")"
    var d = 0;
    for (var i = openIdx; i < s.length; i++) {
      if (s[i] === "(") d++;
      else if (s[i] === ")") { d--; if (d === 0) return i; }
    }
    return -1;
  }
  function splitTopComma(s) {
    var parts = [], d = 0, start = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === "(" || c === "[" || c === "{") d++;
      else if (c === ")" || c === "]" || c === "}") d--;
      else if (c === "," && d === 0) { parts.push(s.slice(start, i)); start = i + 1; }
    }
    parts.push(s.slice(start));
    return parts.map(function (p) { return p.trim(); });
  }
  function evalWith(expr, varName, value) {
    /* jshint evil: true */
    return new Function(varName, '"use strict"; return (' + expr + ");")(value);
  }
  // named functions: declarations and `name = function (...)` expressions
  var fns = [];
  var fre = /(?:function\s+([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*)\s*=\s*function)\s*\([^)]*\)\s*\{/g;
  var fm;
  while ((fm = fre.exec(script))) {
    var bodyStart = fm.index + fm[0].length;
    var depth = 1, bi = bodyStart;
    while (bi < script.length && depth > 0) {
      if (script[bi] === "{") depth++;
      else if (script[bi] === "}") depth--;
      bi++;
    }
    fns.push({ name: fm[1] || fm[2], body: script.slice(bodyStart, bi - 1) });
  }
  var issues = [];
  var strictSeen = {};
  var strictChecked = 0, constChecked = 0;
  fns.forEach(function (fn) {
    var body = fn.body;
    var strict = file === "rsvp.html" && FADE_STOP_FNS.indexOf(fn.name) !== -1;
    if (strict) strictSeen[fn.name] = true;
    // fade-to-silence ramps: RampToValueAtTime(<target ~0>, <time>)
    var rampTimes = [];
    var rre = /\.(?:exponentialRampToValueAtTime|linearRampToValueAtTime)\s*\(/g;
    var m;
    while ((m = rre.exec(body))) {
      var rEnd = matchParen(body, rre.lastIndex - 1);
      if (rEnd === -1) continue;
      var rArgs = splitTopComma(body.slice(rre.lastIndex, rEnd));
      if (rArgs.length !== 2) continue;
      var target = parseFloat(rArgs[0]);
      if (!(isFinite(target) && target <= 0.001)) continue; // only fades to silence
      rampTimes.push(rArgs[1]);
    }
    // close timers: setTimeout whose callback calls .close(...)
    var delays = [];
    var sre = /setTimeout\s*\(/g;
    while ((m = sre.exec(body))) {
      var sEnd = matchParen(body, sre.lastIndex - 1);
      if (sEnd === -1) continue;
      var sArgs = splitTopComma(body.slice(sre.lastIndex, sEnd));
      if (sArgs.length < 2) continue;
      if (!/\.close\s*\(/.test(sArgs.slice(0, -1).join(","))) continue;
      delays.push(sArgs[sArgs.length - 1]);
    }
    if (!rampTimes.length || !delays.length) {
      if (strict) {
        issues.push(fn.name + ": expected a gain ramp to silence + a setTimeout that closes the ctx, found " +
          rampTimes.length + " ramp(s) / " + delays.length + " close timer(s) — the stop's shape changed, update this check");
      }
      return;
    }
    // anchor each ramp end at currentTime -> its offset expression (in seconds);
    // resolves one level of `var t = <ctx>.currentTime;` indirection
    var offsets = rampTimes.map(function (t) {
      t = t.trim();
      var am = t.match(/^[\w$.]+\.currentTime\s*(?:\+\s*([\s\S]+))?$/);
      if (am) return am[1] || "0";
      var vm = t.match(/^([A-Za-z_$][\w$]*)\s*(?:\+\s*([\s\S]+))?$/);
      if (vm && new RegExp("(?:var|let|const)\\s+" + vm[1] + "\\s*=\\s*[\\w$.]+\\.currentTime\\s*[;,)]").test(body)) {
        return vm[2] || "0";
      }
      return null; // not currentTime-anchored (loop-relative note starts etc.)
    });
    if (strict) {
      if (offsets.some(function (o) { return o === null; })) {
        issues.push(fn.name + ": a fade ramp's end isn't `<ctx>.currentTime + <fade>` — the stop's shape changed, update this check");
        return;
      }
      var vars = {};
      offsets.concat(delays).forEach(function (e) {
        (e.match(/[A-Za-z_$][\w$]*/g) || []).forEach(function (id) { vars[id] = true; });
      });
      var varNames = Object.keys(vars);
      if (varNames.length !== 1) {
        issues.push(fn.name + ": expected ONE shared fade variable across the ramp end and the close delay, found [" +
          varNames.join(", ") + "] — update this check if the shape legitimately changed");
        return;
      }
      var v = varNames[0];
      var vRe = new RegExp("\\b" + v + "\\b");
      var inRamp = offsets.some(function (e) { return vRe.test(e); });
      var inDelay = delays.some(function (e) { return vRe.test(e); });
      if (!inRamp || !inDelay) {
        issues.push(fn.name + ": the fade variable `" + v + "` must drive BOTH the ramp end and the close delay (found in " +
          (inRamp ? "the ramp only" : "the close delay only") + ") — the other side was hardcoded and can now cut the fade short");
        return;
      }
      try {
        for (var s = 0; s < FADE_SAMPLES.length; s++) {
          var f = FADE_SAMPLES[s];
          var rampMs = Math.max.apply(null, offsets.map(function (e) { return evalWith(e, v, f) * 1000; }));
          var delayMs = Math.min.apply(null, delays.map(function (e) { return evalWith(e, v, f); }));
          if (!isFinite(rampMs) || !isFinite(delayMs)) throw new Error("non-numeric result");
          if (delayMs + 1e-6 < rampMs) {
            issues.push(fn.name + ": close timer fires at " + delayMs + "ms but the fade ramp ends at " + rampMs +
              "ms (" + v + "=" + f + ") — the source is cut mid-fade");
            return;
          }
        }
      } catch (e) {
        issues.push(fn.name + ": could not evaluate ramp/close expressions (" + e.message + ") — update this check");
        return;
      }
      strictChecked++;
    } else {
      if (FADE_CLOSE_ALLOW.indexOf(fn.name) !== -1) return;
      var constOffsets = [], constDelays = [];
      offsets.forEach(function (e) {
        if (e === null || /[A-Za-z_$]/.test(e)) return;
        try { var n = evalWith(e, "_", 0); if (isFinite(n)) constOffsets.push(n); } catch (err) {}
      });
      delays.forEach(function (e) {
        if (/[A-Za-z_$]/.test(e)) return;
        try { var n2 = evalWith(e, "_", 0); if (isFinite(n2)) constDelays.push(n2); } catch (err) {}
      });
      if (!constOffsets.length || !constDelays.length) return;
      constChecked++;
      var maxRampMs = Math.max.apply(null, constOffsets) * 1000;
      var minDelayMs = Math.min.apply(null, constDelays);
      if (minDelayMs + 1e-6 < maxRampMs) {
        issues.push(fn.name + ": close timer fires at " + minDelayMs + "ms but a fade ramp ends at " + maxRampMs +
          "ms — the sound is cut mid-fade");
      }
    }
  });
  if (file === "rsvp.html") {
    FADE_STOP_FNS.forEach(function (name) {
      if (!strictSeen[name]) {
        issues.push(name + ": no such function found — renamed? update FADE_STOP_FNS so the room-gated stops stay covered");
      }
    });
    // floor so parser rot can't silently drop the constants tier to zero coverage.
    // One-shot effects share a single never-closed AudioContext (getSfxCtx), so only
    // the persistent beds' teardowns still pair a close timer with a fade ramp.
    if (constChecked < 2) {
      issues.push("constants tier only matched " + constChecked + " function(s) (expected >= 2) — extraction broken?");
    }
    // the shared-context invariant itself: `new Ctx()` is reserved for the persistent
    // beds/pipeline (and getSfxCtx). A one-shot spinning up its own context regresses
    // the stream-churn fix — new effects must use getSfxCtx().
    var ctxSites = (script.match(/new Ctx\(\)/g) || []).length;
    if (ctxSites > 14) {
      issues.push("found " + ctxSites + " `new Ctx()` sites (expected <= 14: the beds (incl. the aquarium + workout + totoro projector beds), the song pipeline, and getSfxCtx) — one-shot effects must use getSfxCtx()");
    }
  }
  if (issues.length === 0) {
    pass(file + ": every audio ctx-close timer waits out its gain-fade ramp (" +
      strictChecked + " room-gated stop(s) strict, " + constChecked + " const-checked)");
  } else {
    fail(file + ": audio fade/close race — an AudioContext can be closed before its fade ramp ends (abrupt cut mid-fade)",
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

// The monitor terminals' scrollback (.term-out) is a scroll container, so it CLIPS at
// its own padding box — and at 2px type under the desk zoom, painted glyph ink lands
// up to ~1px outside its layout box (tiny-glyph raster snapping under the ~7×
// transform). Two invariants keep the clip off the glyphs (the repeated "cropped
// ascenders / cropped first column" bug):
//   1. .term-out horizontal+vertical padding ≥ 1px of clip slack on every side;
//   2. border-box height − vertical padding = exactly 12 of the 2.8px line boxes
//      (a bottom-pinned scrollback must never straddle a line across the top edge —
//      and the border-box/content-box math is exactly what silently broke once).
function checkTermOutClipSlack(file, style) {
  if (file !== "rsvp.html" || !style) return;
  var m = style.match(/\.term-out\{([^}]*)\}/);
  if (!m) { fail(file + ": .term-out rule not found for clip-slack check"); return; }
  var decl = m[1];
  var h = decl.match(/height:\s*([\d.]+)px/);
  var p = decl.match(/padding:\s*([\d.]+)px(?:\s+([\d.]+)px)?(?:\s+([\d.]+)px)?/);
  if (!h || !p) { fail(file + ": .term-out needs explicit height and padding (clip slack)", decl); return; }
  var height = parseFloat(h[1]);
  var padTop = parseFloat(p[1]);
  var padH = p[2] ? parseFloat(p[2]) : padTop;
  var padBottom = p[3] ? parseFloat(p[3]) : padTop;
  var issues = [];
  // top slack is deliberately smaller: it must clear the ~0.4px worst-case upward ink
  // shift, but every extra tenth re-reveals more of the 13th line when bottom-pinned
  if (padTop < 0.6) issues.push("top padding " + padTop + "px < 0.6px of scroll-clip slack");
  if (padH < 1 || padBottom < 1) issues.push("side/bottom padding " + padH + "px/" + padBottom + "px — needs ≥1px of scroll-clip slack");
  var content = height - padTop - padBottom;
  if (Math.abs(content - 12 * 2.8) > 0.001) issues.push("content height " + content + "px ≠ 12 × 2.8px line boxes (border-box height minus vertical padding)");
  if (issues.length === 0) pass(file + ": .term-out clip slack + 12-line scrollback math hold");
  else fail(file + ": .term-out clip-slack invariant broken", issues.join("\n"));
}

// A leftover git merge marker in CSS/HTML slips past `node --check` (which only sees
// the inline <script>) and the other structural checks — one reached production once.
// Precise forms only, so decorative "====" comment rules don't false-positive.
function checkNoConflictMarkers(file, html) {
  var lines = html.split("\n"), hits = [];
  for (var i = 0; i < lines.length; i++) {
    var L = lines[i];
    if (/^<{7}[ \t]/.test(L) || /^>{7}[ \t]/.test(L) || /^={7}[ \t]*$/.test(L) || /^\|{7}[ \t]/.test(L)) {
      hits.push((i + 1) + ": " + L.slice(0, 40));
    }
  }
  if (hits.length) fail(file + ": leftover git conflict markers", hits.join("\n"));
  else pass(file + ": no leftover merge conflict markers");
}

FILES.forEach(function (file) {
  console.log(file + ":");
  var html = fs.readFileSync(path.join(ROOT, file), "utf8");
  var script = extractScript(html);
  var style = extractStyle(html);
  checkNoConflictMarkers(file, html);
  checkSyntax(file, script);
  if (script) {
    checkDictParity(file, script);
    checkEggTotal(html, script);
    checkParticleTransformOrigin(file, script);
    checkAnimationClassCleanup(file, style, script, html);
    checkAudioFadeCloseRace(file, script);
    checkI18nKeys(file, script, html);
  }
  checkAnimationKeyframes(file, style);
  checkTransformClobber(file, style, html);
  checkTermOutClipSlack(file, style);
  checkSvgTagBalance(file, html);
  console.log("");
});

if (failures > 0) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
} else {
  console.log("All checks passed.");
}
