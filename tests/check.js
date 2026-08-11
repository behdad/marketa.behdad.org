#!/usr/bin/env node
// Zero-dependency sanity checks for egg-hunt.html and loft-day.html.
// Run with: node tests/check.js
"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var crypto = require("crypto");
var execSync = require("child_process").execSync;

var ROOT = path.join(__dirname, "..");
var FILES = ["egg-hunt.html", "loft-day.html"];
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
  // Concatenate EVERY authored <script> block in document order, not a greedy
  // first-open..last-close span. Local src files are included too: Loft Day keeps
  // its language dictionaries reviewable outside the otherwise single-file game.
  // (that swallowed all the HTML in between once a second head entry-selector script
  // was added). Joined so node --check validates the same ordered
  // program the browser loads and dictionary/i18n scans see external messages.
  var re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g, m, parts = [];
  while ((m = re.exec(html))) {
    var src = /\bsrc=["']([^"']+)["']/.exec(m[1]);
    if (src && !/^[a-z]+:/i.test(src[1])) {
      var external = path.join(ROOT, src[1].split(/[?#]/)[0]);
      if (fs.existsSync(external)) parts.push(fs.readFileSync(external, "utf8"));
    } else if (m[2].trim()) {
      parts.push(m[2]);
    }
  }
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
  if (start === -1) return; // not applicable (egg-hunt.html)
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

// Roadtrip weather is shared by every route, but campsite builder dialogs are modal.
// Keep those dialogs in their late-painted host instead of suppressing the weather.
function checkCampBuilderOverlayOrder(file, html) {
  if (file !== "loft-day.html") return;
  function groupRange(id) {
    var start = html.indexOf('<g id="' + id + '"');
    if (start === -1) return null;
    var depth = 0, match, tags = /<g(?:\s|>)|<\/g>/g;
    tags.lastIndex = start;
    while ((match = tags.exec(html))) {
      if (match[0] === "</g>") {
        depth--;
        if (depth === 0) return { start: start, end: tags.lastIndex };
      } else {
        depth++;
      }
    }
    return null;
  }
  var host = groupRange("entrance-roadtrip-camp-builder-overlays");
  var fire = html.indexOf('<g id="entrance-roadtrip-fire-game"');
  var stew = html.indexOf('<g id="entrance-roadtrip-stew-game"');
  var ambient = [
    '<g id="entrance-roadtrip-clouds"',
    '<rect id="entrance-roadtrip-smoke"',
    '<g id="entrance-roadtrip-rain"',
    '<g id="entrance-roadtrip-snow"',
    '<rect id="entrance-roadtrip-windshield-glaze"'
  ].map(function (needle) { return html.indexOf(needle); });
  var complete = host && fire !== -1 && stew !== -1 && ambient.every(function (index) { return index !== -1; });
  var ownsBuilders = complete && fire > host.start && fire < host.end && stew > host.start && stew < host.end;
  var paintsLast = complete && ambient.every(function (index) { return index < host.start; });
  if (ownsBuilders && paintsLast) {
    pass(file + ": campsite builders paint above shared roadtrip weather");
  } else {
    fail(file + ": campsite builders paint above shared roadtrip weather");
  }
}

// Only inspect authored tags. IDs quoted in comments, CSS, or JS strings do not enter
// the static DOM and must not make this check noisy.
function checkStaticDomIds(file, html) {
  var markup = html
    .replace(/<!--[\s\S]*?-->/g, function (s) { return s.replace(/[^\n]/g, " "); })
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, function (s) { return s.replace(/[^\n]/g, " "); });
  var seen = new Map();
  var duplicates = [];
  var tagRe = /<[A-Za-z][^>]*\bid\s*=\s*(["'])([^"']+)\1[^>]*>/g;
  var match;
  while ((match = tagRe.exec(markup))) {
    var id = match[2];
    var line = (markup.slice(0, match.index).match(/\n/g) || []).length + 1;
    if (seen.has(id)) duplicates.push(id + " (lines " + seen.get(id) + " and " + line + ")");
    else seen.set(id, line);
  }
  if (duplicates.length) fail(file + ": duplicate static DOM id(s)", duplicates.join("\n"));
  else pass(file + ": static DOM ids are unique (" + seen.size + ")");
}

// Multi-control monitor corners use one geometry contract: painted pills have a
// one-unit gap and their enlarged transparent hit regions meet at (but never cross)
// the midpoint. This keeps Back/Fullscreen/Dismiss visually consistent without one
// control stealing the edge of its neighbour's touch target.
function checkMonitorControlSpacing(file, html) {
  if (file !== "loft-day.html") return;
  function attr(tag, name) {
    var match = new RegExp("\\b" + name + '="([-\\d.]+)"').exec(tag);
    return match ? Number(match[1]) : null;
  }
  function geometry(id) {
    var start = html.indexOf('<g id="' + id + '"');
    if (start < 0) return null;
    var openEnd = html.indexOf(">", start), end = html.indexOf("</g>", openEnd);
    var open = html.slice(start, openEnd + 1), body = html.slice(openEnd + 1, end);
    var transform = /translate\(([-\d.]+),[-\d.]+\) scale\(([-\d.]+)\)/.exec(open);
    var tags = body.match(/<rect\b[^>]*>/g) || [];
    var hitTag = tags.find(function (tag) { return /class="mini-hit"/.test(tag); });
    var paintTag = tags.find(function (tag) { return !/class="mini-hit"/.test(tag) && /\brx="2\.5"/.test(tag); });
    if (!transform || !hitTag || !paintTag) return null;
    var tx = Number(transform[1]), scale = Number(transform[2]);
    function span(tag) {
      var x = attr(tag, "x"), width = attr(tag, "width");
      return x == null || width == null ? null : { left: tx + x * scale, right: tx + (x + width) * scale };
    }
    return { paint: span(paintTag), hit: span(hitTag) };
  }
  var clusters = [
    ["monitor-console-back", "monitor-console-close"],
    ["monitor-mail-back", "monitor-mail-close"],
    ["monitor-mines-back", "monitor-mines-close"],
    ["monitor-tattoo-back", "monitor-tattoo-close"],
    ["monitor-life-back", "monitor-life-close"],
    ["monitor-py-back", "monitor-py-close"],
    ["monitor-doom-back", "monitor-doom-fullscreen", "monitor-doom-close"],
    ["monitor-prince-fullscreen", "monitor-prince-close"]
  ];
  var errors = [], epsilon = 0.0001;
  clusters.forEach(function (ids) {
    var controls = ids.map(geometry);
    if (controls.some(function (control) { return !control || !control.paint || !control.hit; })) {
      errors.push(ids.join(" → ") + ": missing geometry");
      return;
    }
    controls.forEach(function (control, index) {
      if (control.hit.left > control.paint.left + epsilon || control.hit.right < control.paint.right - epsilon) {
        errors.push(ids[index] + ": hit region does not contain painted control");
      }
      if (!index) return;
      var previous = controls[index - 1];
      var gap = control.paint.left - previous.paint.right;
      if (Math.abs(gap - 1) > epsilon) errors.push(ids[index - 1] + " → " + ids[index] + ": visual gap " + gap);
      if (Math.abs(control.hit.left - previous.hit.right) > epsilon) {
        errors.push(ids[index - 1] + " → " + ids[index] + ": hit regions do not meet cleanly");
      }
    });
  });
  if (errors.length) fail(file + ": monitor corner controls share one spacing/hit-region contract", errors.join("\n"));
  else pass(file + ": monitor corner controls share one spacing/hit-region contract (" + clusters.length + " states)");
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

function sortedDictionary(value) {
  if (Array.isArray(value)) return value.map(sortedDictionary);
  if (!value || typeof value !== "object") return value;
  var out = {};
  Object.keys(value).sort().forEach(function (key) {
    out[key] = sortedDictionary(value[key]);
  });
  return out;
}

function parseLoftDictionary(lang) {
  var name = "loft-day." + lang + ".js";
  var source = fs.readFileSync(path.join(ROOT, name), "utf8");
  var prefix = 'window.__loftMessages["' + lang + '"] = ';
  if (source.slice(0, prefix.length) !== prefix || source.slice(-2) !== ";\n") {
    throw new Error(name + ' must contain only `window.__loftMessages["' + lang + '"] = { ... };`');
  }
  var value = JSON.parse(source.slice(prefix.length, -2));
  var canonical = prefix + JSON.stringify(sortedDictionary(value), null, 2) + ";\n";
  if (source !== canonical) {
    throw new Error(name + " must use canonical JSON formatting with alphabetically sorted object keys (arrays retain authored order)");
  }
  return value;
}

function dictionaryKeyPaths(value, prefix, paths) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  Object.keys(value).forEach(function (key) {
    var pathName = prefix ? prefix + "." + key : key;
    paths.push(pathName);
    dictionaryKeyPaths(value[key], pathName, paths);
  });
}

function loftDictionaryCacheToken(filename) {
  var hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(path.join(ROOT, filename)));
  return "dict-" + hash.digest("hex").slice(0, 12);
}

function checkLoftDictParity(file, html) {
  var init = html.indexOf("<script>window.__loftMessages = {};</script>");
  var enToken = loftDictionaryCacheToken("loft-day.en.js");
  var csToken = loftDictionaryCacheToken("loft-day.cs.js");
  var enTag = '<script src="loft-day.en.js?v=' + enToken + '"></script>';
  var csTag = '<script src="loft-day.cs.js?v=' + csToken + '"></script>';
  var enLoad = html.indexOf(enTag);
  var csLoad = html.indexOf(csTag);
  if (enLoad === -1) fail(file + ": external EN dictionary cache token matches its content",
    "expected token: " + enToken + "\n" + enTag);
  else pass(file + ": external EN dictionary cache token matches its content (" + enToken + ")");
  if (csLoad === -1) fail(file + ": external CS dictionary cache token matches its content",
    "expected token: " + csToken + "\n" + csTag);
  else pass(file + ": external CS dictionary cache token matches its content (" + csToken + ")");
  if (!(init !== -1 && init < enLoad && enLoad < csLoad)) {
    fail(file + ": external dictionaries initialize and load EN before CS");
  } else {
    pass(file + ": external dictionaries initialize and load EN before CS");
  }
  if (/\bwindow\.(?:T|LOFT_CODE_SNIPPETS)\b/.test(html)) {
    fail(file + ": split-script bootstrap exposes only private integration globals");
  } else {
    pass(file + ": split-script bootstrap exposes only private integration globals");
  }
  var en, cs;
  try {
    en = parseLoftDictionary("en");
    cs = parseLoftDictionary("cs");
    pass(file + ": external dictionaries are canonical and alphabetically sorted");
  } catch (error) {
    fail(file + ": external dictionaries are canonical and alphabetically sorted", error.message);
    return;
  }
  var resetLabelsResolve = [en, cs].every(function (dictionary) {
    return typeof dictionary.code_reset_file === "string" && dictionary.code_reset_file.replace("{filename}", "trailer.js").indexOf("{filename}") === -1 &&
      typeof dictionary.code_reset_files === "string" && dictionary.code_reset_files !== "code_reset_files";
  });
  if (resetLabelsResolve) pass(file + ": external dictionaries resolve the per-file and whole-files Code reset labels");
  else fail(file + ": external dictionaries resolve the per-file and whole-files Code reset labels");
  var enPaths = [], csPaths = [];
  dictionaryKeyPaths(en, "", enPaths);
  dictionaryKeyPaths(cs, "", csPaths);
  var enSet = new Set(enPaths), csSet = new Set(csPaths);
  var enOnly = enPaths.filter(function (key) { return !csSet.has(key); });
  var csOnly = csPaths.filter(function (key) { return !enSet.has(key); });
  if (!enOnly.length && !csOnly.length) {
    pass(file + ": EN/CS dictionary keys match recursively (" + enPaths.length + " paths)");
  } else {
    fail(file + ": EN/CS dictionary key mismatch",
      (enOnly.length ? "EN only: " + enOnly.join(", ") + "\n" : "") +
      (csOnly.length ? "CS only: " + csOnly.join(", ") : ""));
  }
}

function checkDictParity(file, script, html) {
  if (file === "loft-day.html") {
    checkLoftDictParity(file, html);
    return;
  }
  var enKeys = extractDictKeys(script, "en");
  var csKeys = extractDictKeys(script, "cs");
  if (!enKeys || !csKeys) {
    fail(file + ": could not locate en:/cs: dictionaries to compare");
    return;
  }
  var enSet = new Set(enKeys);
  var csSet = new Set(csKeys);
  function duplicates(keys) {
    var seen = new Set();
    return Array.from(new Set(keys.filter(function (key) {
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    })));
  }
  var enDupes = duplicates(enKeys);
  var csDupes = duplicates(csKeys);
  if (enDupes.length || csDupes.length) {
    fail(file + ": duplicate dictionary key(s)",
      (enDupes.length ? "EN: " + enDupes.join(", ") + "\n" : "") +
      (csDupes.length ? "CS: " + csDupes.join(", ") : ""));
  } else {
    pass(file + ": EN/CS dictionaries contain no duplicate keys");
  }
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
  if (!totalMatch) return; // not applicable (loft-day.html)
  var declared = parseInt(totalMatch[1], 10);
  var cheatIds = [], cheatMatch, cheatRe = /<li[^>]*data-egg=["']([^"']+)["']/g;
  while ((cheatMatch = cheatRe.exec(html))) cheatIds.push(cheatMatch[1]);
  var foundIds = [], callMatch, callRe = /\bmarkFound\s*\(([^)]*)\)/g;
  while ((callMatch = callRe.exec(script))) {
    var literalMatch, literalRe = /["']([^"']+)["']/g;
    while ((literalMatch = literalRe.exec(callMatch[1]))) foundIds.push(literalMatch[1]);
  }
  var cheatSet = new Set(cheatIds);
  var foundSet = new Set(foundIds);
  var missingCall = cheatIds.filter(function (id) { return !foundSet.has(id); });
  var missingCheat = Array.from(foundSet).filter(function (id) { return !cheatSet.has(id); });
  var duplicateCheats = cheatIds.filter(function (id, i) { return cheatIds.indexOf(id) !== i; });
  if (declared === cheatSet.size && !missingCall.length && !missingCheat.length && !duplicateCheats.length) {
    pass("egg-hunt.html: EGG_TOTAL, cheatsheet, and literal markFound ids match (" + declared + ")");
  } else {
    fail("egg-hunt.html: EGG_TOTAL / cheatsheet / markFound identity mismatch",
      "EGG_TOTAL: " + declared + "; unique cheats: " + cheatSet.size +
      (duplicateCheats.length ? "\nduplicate cheats: " + Array.from(new Set(duplicateCheats)).join(", ") : "") +
      (missingCall.length ? "\ncheats never passed literally to markFound: " + missingCall.join(", ") : "") +
      (missingCheat.length ? "\nmarkFound ids absent from cheatsheet: " + missingCheat.join(", ") : ""));
  }
}

function checkTrackedSymlinks() {
  var tracked = execSync("git ls-files -s -z", { cwd: ROOT }).toString("utf8").split("\0").filter(Boolean);
  var trackedNames = new Set(tracked.map(function (line) { return line.slice(line.indexOf("\t") + 1); }));
  var links = tracked.filter(function (line) { return line.slice(0, 6) === "120000"; });
  var issues = [];
  links.forEach(function (line) {
    var name = line.slice(line.indexOf("\t") + 1);
    var linkPath = path.join(ROOT, name);
    var target = fs.readlinkSync(linkPath);
    var resolved = path.resolve(path.dirname(linkPath), target);
    var rel = path.relative(ROOT, resolved);
    if (rel.indexOf("..") === 0 || path.isAbsolute(rel)) issues.push(name + " escapes the repository: " + target);
    else if (!fs.existsSync(resolved)) issues.push(name + " has a missing target: " + target);
    else if (!trackedNames.has(rel)) issues.push(name + " targets an untracked path: " + target);
  });
  if (issues.length) fail("tracked symlink targets exist and are tracked", issues.join("\n"));
  else pass("tracked symlink targets exist and are tracked (" + links.length + ")");
}

function checkLoftAliases() {
  var canonical = path.join(ROOT, "loft-day.html");
  var issues = [];
  if (!fs.existsSync(canonical) || !fs.lstatSync(canonical).isFile()) {
    issues.push("loft-day.html is not the canonical regular file");
  }
  ["loft-day", "rsvp", "rsvp.html"].forEach(function (name) {
    var alias = path.join(ROOT, name);
    if (!fs.existsSync(alias) || !fs.lstatSync(alias).isSymbolicLink()) {
      issues.push(name + " is not a symlink");
    } else if (fs.readlinkSync(alias) !== "loft-day.html") {
      issues.push(name + " points to " + fs.readlinkSync(alias) + " instead of loft-day.html");
    }
  });
  if (issues.length) fail("Loft Day canonical file and public aliases agree", issues.join("\n"));
  else pass("Loft Day canonical file and public aliases agree");
}

function checkEggHuntAliases() {
  var canonical = path.join(ROOT, "egg-hunt.html");
  var issues = [];
  if (!fs.existsSync(canonical) || !fs.lstatSync(canonical).isFile()) {
    issues.push("egg-hunt.html is not the canonical regular file");
  }
  ["egg-hunt", "save-the-dates", "save-the-dates.html"].forEach(function (name) {
    var alias = path.join(ROOT, name);
    if (!fs.existsSync(alias) || !fs.lstatSync(alias).isSymbolicLink()) {
      issues.push(name + " is not a symlink");
    } else if (fs.readlinkSync(alias) !== "egg-hunt.html") {
      issues.push(name + " points to " + fs.readlinkSync(alias) + " instead of egg-hunt.html");
    }
  });
  if (issues.length) fail("Egg Hunt canonical file and public aliases agree", issues.join("\n"));
  else pass("Egg Hunt canonical file and public aliases agree");
}

function checkLiteralLocalAssets() {
  var roots = "(?:art|docs|doom|duke|q3|pyodide|linux|harfbuzzjs|princejs)";
  var refs = new Map();
  function remember(file, value) {
    var clean = value.split(/[?#]/)[0];
    if (clean) refs.set(clean, file);
  }
  FILES.concat(["chat.js"]).forEach(function (file) {
    var text = fs.readFileSync(path.join(ROOT, file), "utf8");
    var match;
    var attrRe = /\b(?:src|href|poster)\s*=\s*(["'])([^"']+)\1/gi;
    while ((match = attrRe.exec(text))) {
      var value = match[2];
      if (/^[A-Za-z0-9._~+@%/-]+(?:[?#].*)?$/.test(value) &&
          !/^(?:#|[A-Za-z][A-Za-z0-9+.-]*:|\/\/)/.test(value)) remember(file, value);
    }
    var rootRe = new RegExp("([\"'`])((?:\\.\\.?/)?" + roots + "/[A-Za-z0-9_@%+.,()/-]+)\\1", "g");
    while ((match = rootRe.exec(text))) remember(file, match[2]);
  });
  var missing = [];
  // princejs/ is untracked (restored by fetch-princejs.sh): its refs must resolve only
  // while a local copy is present; every other root stays mandatory.
  var princejsPresent = fs.existsSync(path.join(ROOT, "princejs"));
  refs.forEach(function (file, ref) {
    if (!princejsPresent && /^(?:\.\.?\/)*princejs\//.test(ref)) return;
    if (!fs.existsSync(path.resolve(ROOT, ref))) missing.push(file + ": " + ref);
  });
  if (missing.length) fail("literal local asset references resolve", missing.join("\n"));
  else pass("literal local asset references resolve (" + refs.size + ")");
}

// IONOS gives every .py extension component its CGI handler. Keep visitor-facing .js/.py names
// separate from their one physical *-js.txt/*-py.txt transport so every source is served statically.
function checkCodeSnippetDelivery() {
  var dir = path.join(ROOT, "code-snippets");
  var manifest = fs.readFileSync(path.join(dir, "manifest.js"), "utf8");
  var list = /__loftCodeSnippets\s*=\s*Object\.freeze\(\s*(\[[\s\S]*?\])\s*\)/.exec(manifest);
  var entries = [];
  try { entries = list ? JSON.parse(list[1]) : []; } catch (_error) {}
  var issues = [];
  if (/\bwindow\.LOFT_CODE_SNIPPETS\b/.test(manifest)) {
    issues.push("manifest exposes the retired public integration global");
  }
  var token = "transport-" + crypto.createHash("sha256").update(manifest).digest("hex").slice(0, 12);
  var html = fs.readFileSync(path.join(ROOT, "loft-day.html"), "utf8");
  if (html.indexOf('src="code-snippets/manifest.js?v=' + token + '"') === -1) {
    issues.push("loft-day.html manifest cache token must be " + token);
  }
  if (!entries.length) issues.push("manifest has no parseable descriptors");
  var filenames = entries.map(function (entry) { return entry && entry.filename; });
  var transports = entries.map(function (entry) { return entry && entry.path; });
  if (new Set(filenames).size !== filenames.length) issues.push("manifest repeats a canonical filename");
  if (new Set(transports).size !== transports.length) issues.push("manifest repeats a transport path");
  var expectedFiles = new Set(["manifest.js"]);
  entries.forEach(function (entry) {
    var filename = entry && entry.filename, transport = entry && entry.path, version = entry && entry.version;
    if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
        typeof filename !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]*\.(?:js|py)$/.test(filename)) {
      issues.push("invalid canonical descriptor: " + JSON.stringify(entry));
      return;
    }
    var expected = "code-snippets/" + filename.replace(/\.(js|py)$/, "-$1.txt");
    if (transport !== expected) {
      issues.push("source transport for " + filename + " must be " + expected);
      return;
    }
    expectedFiles.add(path.basename(transport));
    var source = path.join(ROOT, transport);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
      issues.push("missing source transport: " + transport);
    } else {
      var sourceToken = "source-" + crypto.createHash("sha256").update(fs.readFileSync(source)).digest("hex").slice(0, 12);
      if (version !== sourceToken) issues.push("source cache token for " + filename + " must be " + sourceToken);
    }
  });
  fs.readdirSync(dir, { withFileTypes: true }).filter(function (entry) { return entry.isFile(); }).forEach(function (entry) {
    if (!expectedFiles.has(entry.name)) issues.push("unmanifested or duplicate source file: code-snippets/" + entry.name);
  });
  expectedFiles.forEach(function (name) {
    if (!fs.existsSync(path.join(dir, name))) issues.push("missing expected source file: code-snippets/" + name);
  });
  if (issues.length) fail("canonical Code files have a public static-delivery contract", issues.join("\n"));
  else pass("canonical Code files have a public static-delivery contract (" + entries.length + " files)");
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

// The phone tap-halo fallback fires an object whose art the tap never touched, so the ONE
// thing keeping it honest is that it stands down whenever the tap reached any .hunt-hit at
// all — drop that guard and a halo starts overriding direct hits on whatever is drawn over
// it. Same reason it must stay on `click`: binding it to pointerdown would swallow the press
// that starts a blanket/bottle/desk drag. Neither is visible to play.js, which runs at
// desktop width where no halo exists.
function checkTapHaloGuards(file, script) {
  if (!/haloTargetAt/.test(script)) return; // page has no halo fallback
  var handler = script.match(/strip\.addEventListener\(\s*"click"[\s\S]{0,400}?haloTargetAt[\s\S]{0,200}?\}\);/);
  if (!handler) {
    fail(file + ": tap-halo fallback is not on a strip click listener (a pointerdown binding would swallow drag presses)");
    return;
  }
  if (!/closest\(["']\.hunt-hit["']\)\s*\)\s*return/.test(handler[0])) {
    fail(file + ": tap-halo click fallback lost its .hunt-hit early-return (halos would override direct hits)");
    return;
  }
  pass(file + ": tap-halo fallback is click-bound and defers to any direct .hunt-hit hit");
}

// A CSS `animation: NAME ...` whose NAME has no matching `@keyframes NAME` silently
// does nothing — a class of bug that bites on renames (rename the rule but not the
// keyframes, or a plain typo). Bit the butterfly groove work (distinct groove keyframe
// names). Extract every referenced animation-name and verify a @keyframes defines it.
// A stray `*/` in the <style> block ends a comment EARLY, dumping the rest of that
// comment's prose into the stylesheet as garbage — the CSS parser then discards
// everything up to the next recovery point, silently killing whatever rules follow.
// Nothing else here sees it: the text-based scans read comments and rules alike, and
// the page still loads. Only state.js's reset diff caught the last one, and only via
// an unrelated stranded class two rooms away. Editing a multi-line comment ABOVE a
// rule (to document it) is exactly when this happens: the old text's closing `*/`
// gets stranded mid-prose. Scanning for an unopened `*/` pins it to the line.
function checkCssCommentBalance(file, style) {
  if (!style) return;
  var issues = [];
  var depth = 0, line = 1;
  for (var i = 0; i < style.length; i++) {
    if (style[i] === "\n") { line++; continue; }
    if (style[i] === "/" && style[i + 1] === "*") {
      if (depth === 0) depth = 1; // CSS comments don't nest; a `/*` inside one is just text
      i++;
    } else if (style[i] === "*" && style[i + 1] === "/") {
      if (depth === 0) issues.push("line " + line + ": `*/` with no open comment — the prose above it is leaking into the stylesheet");
      depth = 0;
      i++;
    }
  }
  if (depth !== 0) issues.push("unterminated comment — a `/*` never closes, so the rest of the stylesheet is dead");
  if (issues.length === 0) pass(file + ": <style> comments all open and close cleanly");
  else fail(file + ": broken CSS comment (rules after it are silently discarded)", issues.join("\n"));
}

// An at-rule block that never closes (`@media (...){` + rules, no final `}`) does not
// break the page loudly: the CSS parser just NESTS everything that follows inside it,
// to the end of the <style>. Every one of those rules then lives or dies by a condition
// it was never meant to have. A missing `}` after a `@media (prefers-reduced-motion:
// reduce)` block swallowed 1271 rules — the whole rest of the sheet — so on any machine
// NOT set to reduced motion the game lost its layout: game-only mode stopped hiding the
// hero/footer, scene layers painted unsized as black bands, and the page ballooned to
// 3345px. Nothing else here sees it (braces balance *within* each rule, the comment scan
// is happy, and every selector still parses), and it renders fine for whoever happens to
// match the stray condition — which is why it shipped. Depth pins it exactly: a healthy
// <style> ends at depth 0, so a non-zero tail names the unclosed `{`.
function checkCssBraceBalance(file, style) {
  if (!style) return;
  var issues = [];
  var stack = [], line = 1;
  for (var i = 0; i < style.length; i++) {
    var c = style[i];
    if (c === "\n") { line++; continue; }
    if (c === "/" && style[i + 1] === "*") { // skip comments (checkCssCommentBalance owns those)
      i += 2;
      for (; i < style.length && !(style[i] === "*" && style[i + 1] === "/"); i++) if (style[i] === "\n") line++;
      i++;
    } else if (c === '"' || c === "'") { // skip strings — a content:"}" must not miscount
      var q = c;
      for (i++; i < style.length && style[i] !== q; i++) {
        if (style[i] === "\\") i++;
        else if (style[i] === "\n") { line++; break; }
      }
    } else if (c === "{") {
      stack.push({ line: line, head: style.slice(style.lastIndexOf("\n", i) + 1, i).trim().slice(-70) });
    } else if (c === "}") {
      if (stack.length === 0) issues.push("line " + line + ": `}` with nothing open — an extra closing brace ends the block early");
      else stack.pop();
    }
  }
  stack.forEach(function (o) {
    issues.push("line " + o.line + ": `" + o.head + " {` never closes — every rule after it is silently nested inside");
  });
  if (issues.length === 0) pass(file + ": <style> braces all open and close cleanly");
  else fail(file + ": unbalanced CSS braces (rules get nested under the wrong condition)", issues.join("\n"));
}

function checkAnimationKeyframes(file, style) {
  if (!style) return;
  // Scan CODE only. Both regexes below are text matches, so an `animation:` written inside
  // a /* comment */ used to be read as a declaration — and the value pattern runs to the
  // next ; or }, swallowing whole sentences of prose as if they were animation names.
  style = style.replace(/\/\*[\s\S]*?\*\//g, " ");
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
//  - FADE_STOP_FNS (the room-gated stops in loft-day.html) are checked strictly:
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
var FADE_STOP_FNS = ["stopFire", "stopKettleHum", "stopRadioStatic", "stopPcFan", "stopACHum", "stopPartyMusic", "stopWorkout", "stopRain"];
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
    var strict = file === "loft-day.html" && FADE_STOP_FNS.indexOf(fn.name) !== -1;
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
  if (file === "loft-day.html") {
    FADE_STOP_FNS.forEach(function (name) {
      if (!strictSeen[name]) {
        issues.push(name + ": no such function found — renamed? update FADE_STOP_FNS so the room-gated stops stay covered");
      }
    });
    var birdStop = fns.find(function (fn) { return fn.name === "stopBirdsong"; });
    if (!birdStop || !/\bctx\.close\s*\(/.test(birdStop.body)) {
      issues.push("stopBirdsong: the discrete-chirp audioBed must be closed when its timer stops, or every garden visit leaks an active bed");
    }
    // floor so parser rot can't silently drop the constants tier to zero coverage.
    // One-shot effects share a single never-closed AudioContext (getSfxCtx), so only
    // the persistent beds' teardowns still pair a close timer with a fade ramp.
    if (constChecked < 1) {
      issues.push("constants tier matched no functions — extraction broken?");
    }
    // the shared-context invariant itself: ONE AudioContext for the whole page. Safari
    // hard-caps concurrent contexts (~4), so the old ~26-context model produced NO Web
    // Audio output at all past the cap. Every bed/dance now routes through audioBed(),
    // one-shot SFX through getSfxCtx(), the song pipeline uses the raw shared context —
    // all of them via getAudioCtx(), the ONLY place that constructs one. A `new Ctx()`
    // anywhere else regresses the consolidation.
    var ctxSites = (script.match(/new Ctx\(\)/g) || []).length;
    if (ctxSites !== 1) {
      issues.push("found " + ctxSites + " `new Ctx()` site(s) (expected exactly 1: getAudioCtx, the shared AudioContext accessor) — every other audio source must route through getAudioCtx()/audioBed()/getSfxCtx()");
    }
  }
  if (issues.length === 0) {
    pass(file + ": every audio ctx-close timer waits out its gain-fade ramp (" +
      strictChecked + " room-gated stop(s) strict, " + constChecked + " const-checked)");
  } else {
    fail(file + ": audio lifecycle regression — a bed can leak or an AudioContext can close before its fade finishes",
      issues.join("\n"));
  }
}

// The song pipeline is trusted in production. Keep its emergency fallback as an
// owner-edited source switch, not a visitor-controllable URL parameter.
function checkSongPipelineKillSwitch(file, script) {
  if (file !== "loft-day.html") return;
  var issues = [];
  if (!/var\s+AUDIO_PIPELINE_ENABLED\s*=\s*(?:true|false)\s*;/.test(script)) {
    issues.push("AUDIO_PIPELINE_ENABLED source kill switch is missing or no longer a boolean literal");
  }
  if (!/var\s+USE_LIVE_ANALYSER\s*=\s*AUDIO_PIPELINE_ENABLED\s*;/.test(script)) {
    issues.push("USE_LIVE_ANALYSER must read only the source-level AUDIO_PIPELINE_ENABLED switch");
  }
  if (/\bpipelineOverride\b/.test(script) || /\.get\(\s*["']pipeline["']\s*\)/.test(script)) {
    issues.push("public pipeline URL override returned");
  }
  if (issues.length) fail(file + ": song pipeline has a source-only kill switch", issues.join("\n"));
  else pass(file + ": song pipeline has a source-only kill switch");
}

// Every data-i / data-*-i / data-note-key attribute names a message-dictionary key; a
// typo'd or missing key renders blank text (setLang writes its authored HTML).
// Verify each referenced key exists in the en dictionary (cs parity is checked above).
function checkI18nKeys(file, script, html) {
  if (!script) return;
  var loftEn = null;
  if (file === "loft-day.html") {
    try { loftEn = parseLoftDictionary("en"); }
    catch (_error) { return; } // the dictionary check reports the parse failure
  }
  var attrRe = /\bdata-(?:i|href-i|aria-i|title-i|note-key)="([^"]+)"/g;
  var m, seen = new Set(), missing = [];
  while ((m = attrRe.exec(html))) {
    var key = m[1];
    if (seen.has(key)) continue;
    seen.add(key);
    if (loftEn) {
      if (!Object.prototype.hasOwnProperty.call(loftEn, key) &&
          !(loftEn.hunt && Object.prototype.hasOwnProperty.call(loftEn.hunt, key))) {
        missing.push(key);
      }
    } else {
      // Save-the-date copy remains inline. A key is defined iff it appears as
      // `key:` in that page's T dictionaries.
      var keyRe = new RegExp("\\b" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:");
      if (!keyRe.test(script)) missing.push(key);
    }
  }
  if (missing.length === 0) {
    pass(file + ": all data-i/data-note-key attributes resolve to a dictionary key");
  } else {
    fail(file + ": data-* i18n keys missing from the dictionary", missing.join(", "));
  }
}

// The monitor consoles' scrollback (.console-out) is a scroll container, so it CLIPS at
// its own padding box — and at 2px type under the desk zoom, painted glyph ink lands
// up to ~1px outside its layout box (tiny-glyph raster snapping under the ~7×
// transform). Two invariants keep the clip off the glyphs (the repeated "cropped
// ascenders / cropped first column" bug):
//   1. .console-out horizontal+vertical padding ≥ 1px of clip slack on every side;
//   2. border-box height − vertical padding = exactly 12 of the 2.8px line boxes
//      (a bottom-pinned scrollback must never straddle a line across the top edge —
//      and the border-box/content-box math is exactly what silently broke once).
// Top-anchored :has() (body/.hunt-viewport/#loft-game-strip/…) charges EVERY DOM mutation a
// document-wide style-invalidation sweep — the dominant Road Trip frame cost before the
// html.mir-* scope mirrors replaced those rules. Two invariants: (1) no broad :has anchors
// creep back in; (2) every mir-* class the CSS keys on is one syncScopeMirrors actually sets
// (and vice versa), so the mirror can't silently drift from the stylesheet.
function checkScopeMirrorHygiene(file, style, script) {
  if (file !== "loft-day.html" || !style || !script) return;
  var broad = [];
  style.split("\n").forEach(function (line, i) {
    if (/(?:^|[\s,{}])(?:body|html|\.hunt-viewport|#hunt-fullscreen-area|#loft-game-strip|#entrance-room|#entrance-drive-hud)[^\s,{]*:has\(/.test(line)) {
      broad.push("style line " + (i + 1) + ": " + line.trim().slice(0, 110));
    }
  });
  if (broad.length) fail(file + ": top-anchored :has() reintroduced — key on an html.mir-* scope mirror instead", broad.join("\n"));
  else pass(file + ": no top-anchored :has() selectors");
  var cssMirs = {}, jsMirs = {};
  (style.match(/\bmir-[a-z-]+/g) || []).forEach(function (m) { cssMirs[m] = true; });
  (script.match(/toggle\("(mir-[a-z-]+)"/g) || []).forEach(function (m) { jsMirs[m.slice(8, -1)] = true; });
  var cssOnly = Object.keys(cssMirs).filter(function (m) { return !jsMirs[m]; });
  var jsOnly = Object.keys(jsMirs).filter(function (m) { return !cssMirs[m]; });
  if (cssOnly.length || jsOnly.length) {
    fail(file + ": mir-* scope mirrors drifted between CSS and syncScopeMirrors",
      (cssOnly.length ? "CSS-only: " + cssOnly.join(", ") : "") +
      (jsOnly.length ? " JS-only: " + jsOnly.join(", ") : ""));
  } else {
    pass(file + ": mir-* scope mirrors agree between CSS and syncScopeMirrors (" + Object.keys(cssMirs).length + ")");
  }
}
function checkConsoleOutClipSlack(file, style) {
  if (file !== "loft-day.html" || !style) return;
  var m = style.match(/\.console-out\{([^}]*)\}/);
  if (!m) { fail(file + ": .console-out rule not found for clip-slack check"); return; }
  var decl = m[1];
  var h = decl.match(/height:\s*([\d.]+)px/);
  var p = decl.match(/padding:\s*([\d.]+)px(?:\s+([\d.]+)px)?(?:\s+([\d.]+)px)?/);
  if (!h || !p) { fail(file + ": .console-out needs explicit height and padding (clip slack)", decl); return; }
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
  if (issues.length === 0) pass(file + ": .console-out clip slack + 12-line scrollback math hold");
  else fail(file + ": .console-out clip-slack invariant broken", issues.join("\n"));
}

// The console is real JavaScript with one app-owned public root. Its bounded language sugar is
// `help loft...`; clear/exit/quit own session lifecycle, and bare ls only redirects visitors.
// Guard against rebuilding the deleted command dialect or reaching private controllers.
function checkConsoleCmdRoster(file, script) {
  if (file !== "loft-day.html" || !script) return;
  var retired = ["CONSOLE_HELP", "CONSOLE_CMDS", "CONSOLE_CMDS_BARE", "CONSOLE_ALIASES"].filter(function (name) {
    return new RegExp("\\b" + name + "\\b").test(script);
  });
  if (retired.length) fail(file + ": legacy console command tables stay deleted", retired.join(", "));
  else pass(file + ": legacy console command tables stay deleted");
  if (/window\.loft\.help\s*=\s*function/.test(script) && /function consoleTabComplete[\s\S]*?\(loft\(\?:\\\./.test(script) && /function loftCommandCatalog\s*\(/.test(script)) {
    pass(file + ": Console and Code autocomplete discover only the live loft.* tree");
  } else fail(file + ": loft-only help/autocomplete contract is missing");
  var run = script.match(/function consoleRun\(cmd, ctx\) \{([\s\S]*?)\n  \}\n  \/\/ iOS auto-zooms/);
  if (!run) fail(file + ": consoleRun body not found for public-API boundary check");
  else if (/controllers\.|window\.__loftControllers|\b(?:birthday|party|season|sharecard)\s*\(/.test(run[1])) {
    fail(file + ": consoleRun contains a private or legacy app-command shortcut");
  } else if (!/helpCommand\s*=\s*c\.match\(\/\^help\\s\+/.test(run[1]) ||
             run[1].indexOf('consolePrint(window.loft.help(helpTarget == null ? helpCommand[1] : helpTarget))') < 0 ||
             run[1].indexOf('if (c === "ls")') < 0 ||
             run[1].indexOf('This is a JavaScript console. Try the Linux app instead.') < 0) {
    fail(file + ": bounded help/ls console behavior is missing");
  } else pass(file + ": consoleRun keeps only bounded help/ls sugar over ordinary JavaScript");
}

// The two shared particle spawners (spawnSteamWisps, spawnMusicNotes) have autonomous
// interval callers (kettle/grill steam, instrument note-flow). Their nodes self-remove
// only via a WAAPI onfinish handler, which stalls in a throttled/occluded tab — so
// without a drop-oldest cap an unattended tab piles up nodes until the machine freezes
// (happened once, overnight). Lock the cap in: each helper must tag its nodes with a
// class and drop the oldest before appending. tests/leak.js proves the cap works at
// runtime; this fails the build fast if a refactor strips it. Add any future shared
// spawner that gets an autonomous interval caller here.
function checkParticleSpawnerCaps(file, script) {
  if (file !== "loft-day.html" || !script) return;
  var GUARDED = [
    { fn: "spawnSteamWisps", cls: "steam-wisp" },
    { fn: "spawnMusicNotes", cls: "music-note" },
    { fn: "spawnHearts", cls: "heart-particle" },
    { fn: "spawnSkyMeteor", cls: "sky-meteor" }
  ];
  GUARDED.forEach(function (g) {
    var start = script.indexOf("function " + g.fn + "(");
    if (start === -1) { fail(file + ": " + g.fn + " not found for particle-cap guard"); return; }
    // body = from this declaration to the next top-level function (both are top-level)
    var next = script.indexOf("\nfunction ", start + 1);
    var body = script.slice(start, next === -1 ? undefined : next);
    var tagged = body.indexOf('"' + g.cls + '"') !== -1;                       // node carries the class
    var caps = body.indexOf('getElementsByClassName("' + g.cls + '")') !== -1; // reads the live count
    var drops = /while\s*\([^)]*\)\s*[^;]*\.remove\(\)/.test(body) || body.indexOf(".remove()") !== -1;
    if (tagged && caps && drops) {
      pass(file + ": " + g.fn + " keeps its drop-oldest ." + g.cls + " cap (occluded-tab leak guard)");
    } else {
      fail(file + ": " + g.fn + " lost its particle cap — an occluded tab will leak nodes",
        "need: tag nodes class=\"" + g.cls + "\", read getElementsByClassName(\"" + g.cls + "\"), drop-oldest before append" +
        "\nfound: tagged=" + tagged + " countRead=" + caps + " dropOldest=" + drops);
    }
  });
}

// The fire festivals' leap rig lives in TWO separate closures — the kid scheduler and the
// couple's — and each carries its own copy of fireFest()/hisFire(), because a closure can't
// reach into the other. Which culture's fire is lit therefore has two answers, and if they
// ever disagree you get a festival where the kids leap and the couple doesn't (or nothing
// does): no error, no visual clue, and it only shows on a date nobody previews. There is no
// other coverage for either festival, so pin the two bodies byte-identical.
function checkFireFestParity(file, script) {
  if (file !== "loft-day.html" || !script) return;
  var re = /function fireFest\(\)\s*\{[\s\S]*?\n  \}/g, found = [], m;
  while ((m = re.exec(script)) !== null) found.push(m[0]);
  if (found.length !== 2) {
    fail(file + ": expected exactly 2 fireFest() definitions (kid scheduler + couple), found " + found.length,
      "both leap closures need their own copy; if you unified them, retire this check deliberately");
    return;
  }
  if (found[0] === found[1]) {
    pass(file + ": the two fireFest() bodies are byte-identical (kid scheduler + couple leap agree)");
  } else {
    fail(file + ": the two fireFest() bodies have DRIFTED — one fire festival will half-fire",
      "a: " + JSON.stringify(found[0]) + "\nb: " + JSON.stringify(found[1]));
  }
}

// SEASON_ALIASES is one flat object literal, so two entries for the same word are legal JS:
// the later one silently wins and the earlier is dead. That is what a merge produces when two
// branches each add a season and pick the same short name for it — "solstice" meant Yalda on
// one side and the June solstice on the other, and which one the console answered with came
// down to source order. Nothing throws, nothing renders wrong until someone types the word.
// Also pin SEAS against SEASON_CYCLE: their comment says "same order the 's' key cycles", and
// they're edited apart, so an insertion into one and not the other desyncs the key from the
// console with no other symptom. Every season must also name itself (SEASON_SAID) and be
// reachable by its own name (an alias self-key), or it exists in the ring and nowhere else.
function checkSeasonRosters(file, script) {
  if (file !== "loft-day.html" || !script) return;
  function list(re) {
    var m = script.match(re);
    return m ? m[1].split(",").map(function (x) { return x.trim().replace(/^"|"$/g, ""); })
      .filter(function (x) { return x && x !== "null"; }) : null;
  }
  var seas = list(/var SEAS = \[([^\]]+)\]/), cycle = list(/var SEASON_CYCLE = \[([^\]]+)\]/);
  var aliasBody = (script.match(/var SEASON_ALIASES = \{([\s\S]*?)\n  \};/) || [])[1];
  var saidBody = (script.match(/var SEASON_SAID = \{([\s\S]*?)\n  \};/) || [])[1];
  if (!seas || !cycle || !aliasBody || !saidBody) {
    fail(file + ": could not read the season rosters (SEAS / SEASON_CYCLE / SEASON_ALIASES / SEASON_SAID)",
      "the check greps literal declarations; if one was renamed or reshaped, update this check");
    return;
  }
  var seen = {}, dupes = [];
  // drop // comments first: a trailing one sits between the previous entry's comma and the next
  // key, which would otherwise hide that key from the scan and fake a "missing alias" failure
  aliasBody.replace(/\/\/[^\n]*/g, "").replace(/(?:^|[{,])\s*(?:"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/g, function (_, q, bare) {
    var k = q || bare;
    if (seen[k]) dupes.push(k); else seen[k] = 1;
    return _;
  });
  if (dupes.length) {
    fail(file + ": SEASON_ALIASES has duplicate key(s) — the later one silently wins",
      "duplicated: " + dupes.join(", ") + "\npick ONE meaning per word and give the loser its own alias");
  } else {
    pass(file + ": SEASON_ALIASES keys are unique (" + Object.keys(seen).length + " aliases, no shadowed word)");
  }
  var seasNoAuto = seas.filter(function (x) { return x !== "auto"; });
  if (seasNoAuto.join(",") === cycle.join(",")) {
    pass(file + ": SEAS and SEASON_CYCLE list the same seasons in the same order (" + cycle.length + ")");
  } else {
    fail(file + ": SEAS and SEASON_CYCLE have desynced — the 's' key and typed season API disagree",
      "SEAS (minus auto): " + seasNoAuto.join(" ") + "\nSEASON_CYCLE:      " + cycle.join(" "));
  }
  var noSaid = seasNoAuto.filter(function (k) { return saidBody.indexOf(k + ":") < 0; });
  var noSelf = seasNoAuto.filter(function (k) { return !seen[k]; });
  if (!noSaid.length && !noSelf.length) {
    pass(file + ": every season names itself (SEASON_SAID) and answers to its own name (SEASON_ALIASES)");
  } else {
    fail(file + ": a season is in the ring but not reachable/nameable",
      (noSaid.length ? "missing a SEASON_SAID line: " + noSaid.join(", ") + "\n" : "") +
      (noSelf.length ? "missing an alias self-key: " + noSelf.join(", ") : ""));
  }
}

// The garden party's dances are synth beds with a KNOWN bpm each (DANCE_BPM, driving the
// tempo-sync retuneDancers + the private tempo controller) and an explicit mood each (DANCE_MOOD,
// driving the per-song amplitude keyframe swap). Both maps MUST cover exactly the set of dance
// ids registered on window.__partyDances (same spirit as the EN/CS + CONSOLE_CMDS parity checks):
// a dance added to the registry without a bpm would fall back to 500ms/no-retune and its guests
// would drift off-tempo; one without a mood would silently lose its amplitude character. A bpm/mood
// key with no registered dance is dead weight that hides a rename. Fails loudly naming the drift.
function checkDanceParity(file, script) {
  if (file !== "loft-day.html" || !script) return;
  function mapKeys(name) {
    var m = script.match(new RegExp("var " + name + " = \\{([^}]*)\\}"));
    if (!m) return null;
    return (m[1].match(/([A-Za-z_$][\w$]*)\s*:/g) || []).map(function (s) { return s.replace(/\s*:$/, ""); });
  }
  var bpm = mapKeys("DANCE_BPM");
  var mood = mapKeys("DANCE_MOOD");
  if (!bpm) { fail(file + ": DANCE_BPM map not found for dance-parity check"); return; }
  if (!mood) { fail(file + ": DANCE_MOOD map not found for dance-parity check"); return; }
  // registered dance ids: every window.__partyDances.push({ id: "<id>", ... })
  var ids = [];
  var pre = /__partyDances[^;]*\.push\(\{\s*id:\s*"([^"]+)"/g, pm;
  while ((pm = pre.exec(script))) ids.push(pm[1]);
  if (!ids.length) { fail(file + ": no __partyDances.push({id:...}) registrations found for dance-parity check"); return; }
  var idSet = new Set(ids);
  function diff(mapName, keys) {
    var keySet = new Set(keys);
    var missing = ids.filter(function (k) { return !keySet.has(k); });   // registered dance with no entry
    var extra = keys.filter(function (k) { return !idSet.has(k); });     // entry for no registered dance
    if (missing.length === 0 && extra.length === 0) {
      pass(file + ": " + mapName + " covers exactly the registered dance ids (" + keys.length + ")");
    } else {
      fail(file + ": " + mapName + " out of sync with the registered dances (window.__partyDances)",
        (missing.length ? "dances missing a " + mapName + " entry: " + missing.join(", ") + "\n" : "") +
        (extra.length ? mapName + " entr(ies) for no registered dance: " + extra.join(", ") : ""));
    }
  }
  diff("DANCE_BPM", bpm);
  diff("DANCE_MOOD", mood);
  // every mood value must map to an amplitude-keyframe variant OR be the base "groovy" fallback
  var moodVals = {};
  var mvm = script.match(/var DANCE_MOOD = \{([^}]*)\}/);
  if (mvm) (mvm[1].match(/:\s*"([^"]+)"/g) || []).forEach(function (s) { moodVals[s.replace(/:\s*"|"/g, "")] = true; });
  var known = { hype: 1, chill: 1, elegant: 1, groovy: 1 };
  var unknownMoods = Object.keys(moodVals).filter(function (v) { return !known[v]; });
  if (unknownMoods.length === 0) pass(file + ": all DANCE_MOOD values are known moods (hype/chill/elegant/groovy)");
  else fail(file + ": DANCE_MOOD has value(s) with no amplitude-keyframe handling", unknownMoods.join(", "));
}

// Aspen's room shots de-dupe on room + light + lineup, and ALBUM_SKY_SIG decides how much
// of the light each room's card is allowed to carry. It lives in the capture closure and
// albumPhotoSvg in another, so this is the only thing holding them together textually:
// every room branch of the renderer must have a projection and vice versa, and a room whose
// branch never reads an axis must not key on it (that direction is sound from source alone,
// and it is the one that filed a duplicate bar card on every forecast flip).
// Whether an axis a branch DOES read changes the picture *materially* cannot be judged from
// text -- the bar reads isNight and only shifts one shade deeper -- so tests/album-axis.mjs
// rasterises the frames and asserts that, both ways round.
function checkAlbumSkySig(file, script) {
  if (file !== "loft-day.html" || !script) return;
  var decl = script.match(/var ALBUM_SKY_SIG = \{([\s\S]*?)\n  \};/);
  if (!decl) { fail(file + ": ALBUM_SKY_SIG not found (the room-shot signature's light projection)"); return; }
  var proj = {}, pm, pre = /(\w+):\s*function\s*\([^)]*\)\s*\{([^}]*)\}/g;
  while ((pm = pre.exec(decl[1])) !== null) proj[pm[1]] = pm[2];
  var body = script.match(/function albumPhotoSvg\(rec\)\s*\{[\s\S]*?\n      \/\/ top motif/);
  if (!body) { fail(file + ": could not locate albumPhotoSvg's room branches"); return; }
  var branch = {}, m, re = /rec\.room === "(\w+)"\)\s*\{([\s\S]*?)(?=\n      \} else)/g;
  while ((m = re.exec(body[0])) !== null) branch[m[1]] = m[2];
  var rooms = Object.keys(branch).sort(), listed = Object.keys(proj).sort();
  if (rooms.join(",") !== listed.join(",")) {
    fail(file + ": ALBUM_SKY_SIG and albumPhotoSvg disagree on which rooms have a backdrop",
      "projected: " + (listed.join(", ") || "(none)") + "\nrendered:  " + (rooms.join(", ") || "(none)"));
    return;
  }
  var bad = [];
  rooms.forEach(function (r) {
    [["wx", /\bwx\b/, /\bs\.wx\b/], ["night", /\bisNight\b/, /\bs\.night\b/]].forEach(function (ax) {
      if (!ax[1].test(branch[r]) && ax[2].test(proj[r]))
        bad.push(r + " keys on " + ax[0] + ", which its backdrop never draws");
    });
  });
  if (bad.length) fail(file + ": ALBUM_SKY_SIG splits room shots on light the card cannot show - duplicate cards", bad.join("\n"));
  else pass(file + ": ALBUM_SKY_SIG keys only on light each room's backdrop actually draws (" + rooms.join(", ") + ")");
}

// Shared booleans are public projections consumed across distant subsystems. Each must have one
// literal assignment site inside its named owner; a second write is almost always a teardown/reset
// path bypassing lifecycle cleanup. Party moments deliberately share one keyed setter.
function checkSharedStateOwners(file, script) {
  if (file !== "loft-day.html" || !script) return;
  var scalarOwners = {
    tripActive: "setTripActiveState",
    secondRound: "setSecondRound",
    monitorShorted: "setMonitorShorted",
    musicPaused: "setMusicPausedState",
    partyDance: "setPartyDanceState",
    bbqDayPartyOn: "setBBQDayPartyState",
    bbqPartySessionOn: "setBBQPartySessionState",
    bbqSplitOn: "setBBQSplit",
    balconyBBQOn: "setBBQSplit",
    phoneCallFamily: "setPhoneCallFamily"
  };
  var bad = [];
  Object.keys(scalarOwners).forEach(function (prop) {
    var writes = script.match(new RegExp("window\\.__" + prop + "\\s*=(?!=)", "g")) || [];
    if (writes.length !== 1) bad.push("__" + prop + " has " + writes.length + " literal writers (owner: " + scalarOwners[prop] + ")");
    if (script.indexOf("function " + scalarOwners[prop] + "(") === -1) bad.push(scalarOwners[prop] + " owner is missing");
  });
  var momentProps = ["firstDanceOn", "slowDanceOn", "toastsOn", "groupPhotoOn", "sparklersOn",
    "cakeOn", "bdCakeOn", "bouquetOn", "photoFreeze"];
  momentProps.forEach(function (prop) {
    var writes = script.match(new RegExp("window\\.__" + prop + "\\s*=(?!=)", "g")) || [];
    if (writes.length) bad.push("__" + prop + " bypasses setPartyMomentState");
  });
  ["rooms", "occupants", "inventory", "locate", "audit"].forEach(function (method) {
    if (script.indexOf(method + ":") === -1) bad.push("__peopleManager." + method + " is missing");
  });
  if (bad.length) fail(file + ": shared state has one named transition owner", bad.join("\n"));
  else pass(file + ": shared state has one named transition owner (10 scalars, 10 party moments, people manager)");
}

// The laptop's unattended update is decorative; while the player is working on the
// zoomed monitor it must not chirp over that session. Keep the two delayed one-shots
// behind the same callback-time gate so a timer armed before zoom cannot leak later.
function checkLaptopUpdateSoundGate(file, script) {
  if (file !== "loft-day.html" || !script) return;
  var start = script.indexOf("function runLaptopUpdate()");
  var end = script.indexOf("// Call the Prague garden:", start);
  var body = start >= 0 && end > start ? script.slice(start, end) : "";
  var gatedClick = /if\s*\(laptopUpdateSoundAllowed\(\)\)\s*playLaptopClickSound\("office-laptop"\)/.test(body);
  var gatedChime = /if\s*\(laptopUpdateSoundAllowed\(\)\)\s*playLaptopBootSound\("office-laptop"\)/.test(body);
  var readsAttention = /function laptopUpdateSoundAllowed\(\)\s*\{[\s\S]*?document\.hidden[\s\S]*?document\.hasFocus\(\)[\s\S]*?__monitorAttention/.test(script);
  if (!gatedClick || !gatedChime || !readsAttention) {
    fail(file + ": automatic laptop update sounds are muted when unattended or during monitor zoom");
  } else {
    pass(file + ": automatic laptop update sounds are muted when unattended or during monitor zoom");
  }
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

// Loft Day deliberately teaches through visible copy and authored coaches instead of
// invisible accessibility metadata. Keep that game-specific boundary from regressing
// when new controls are added; egg-hunt.html follows a different policy.
function checkMetadataFreeGame(file, html) {
  if (file !== "loft-day.html") return;
  var issues = [];
  var aria = html.match(/\baria-[a-z0-9_-]+/gi) || [];
  if (aria.length) issues.push("ARIA tokens: " + Array.from(new Set(aria)).join(", "));
  var markup = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  var roleTags = (markup.match(/<[^>]+>/g) || []).filter(function (tag) {
    return /\srole\s*=/i.test(tag);
  });
  if (roleTags.length) issues.push("explicit role attributes: " + roleTags.length);
  if (/\.setAttribute\(\s*["']role["']/i.test(html)) issues.push("dynamic role assignment");
  var labelledImages = html.match(/<img\b[^>]*\s(?:alt|aria-label|title)\s*=/gi) || [];
  if (labelledImages.length) issues.push("image label/tooltip attributes: " + labelledImages.length);
  if (/\.alt\s*=|\.setAttribute\(\s*["']alt["']/i.test(html)) issues.push("dynamic image alt assignment");
  if (issues.length) fail(file + ": game UI stays free of hidden accessibility metadata", issues.join("\n"));
  else pass(file + ": game UI stays free of hidden accessibility metadata");
}

// #hunt-caption is a shared projection. Producers publish structured claims; only the
// arbiter renderer may write its text/markup. Keep the common aliases pinned so a new
// minigame cannot quietly recreate a private save/restore timer beside the arbiter.
function captionDomWriteHits(script) {
  var aliases = new Set(["caption", "captionEl"]), selectorAliases = new Set();
  var declarationCounts = {}, declarationScan = /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=/g, declarationMatch;
  while ((declarationMatch = declarationScan.exec(script))) {
    declarationCounts[declarationMatch[1]] = (declarationCounts[declarationMatch[1]] || 0) + 1;
  }
  var assignment = /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g, changed = true, match;
  while (changed) {
    changed = false; assignment.lastIndex = 0;
    while ((match = assignment.exec(script))) {
      var name = match[1], rhs = match[2].trim();
      if (declarationCounts[name] === 1 && /^document\.(?:querySelector|getElementById)(?:\.bind\(document\))?$/.test(rhs) && !selectorAliases.has(name)) {
        selectorAliases.add(name); changed = true; continue;
      }
      var direct = /^document\.(?:querySelector|getElementById)\(\s*["'](?:#)?hunt-caption["']\s*\)/.test(rhs);
      var viaSelector = Array.from(selectorAliases).some(function (selector) {
        return new RegExp("^" + selector.replace(/[$]/g, "\\$") + "\\(\\s*[\"'](?:#)?hunt-caption[\"']\\s*\\)").test(rhs);
      });
      if (declarationCounts[name] === 1 && (direct || viaSelector || aliases.has(rhs))) {
        if (!aliases.has(name)) { aliases.add(name); changed = true; }
      }
    }
  }
  var names = Array.from(aliases).map(function (name) { return name.replace(/[$]/g, "\\$"); }).join("|");
  // Keep the alternatives in one regex so bracket notation and method calls follow the same
  // small alias-dataflow pass above.
  var aliasWrite = new RegExp("\\b(?:" + names + ")\\s*(?:\\.\\s*(?:innerHTML|textContent|innerText)\\s*=|\\[\\s*[\"'](?:innerHTML|textContent|innerText)[\"']\\s*\\]\\s*=|\\.\\s*replaceChildren\\s*\\(|\\[\\s*[\"']replaceChildren[\"']\\s*\\]\\s*\\()", "i");
  var directWrite = /document\.(?:querySelector|getElementById)\(\s*["'](?:#)?hunt-caption["']\s*\)\s*(?:\.\s*(?:innerHTML|textContent|innerText)\s*=|\[\s*["'](?:innerHTML|textContent|innerText)["']\s*\]\s*=|\.\s*replaceChildren\s*\(|\[\s*["']replaceChildren["']\s*\]\s*\()/i;
  var hits = [];
  script.split("\n").forEach(function (line, index) {
    if (aliasWrite.test(line) || directWrite.test(line)) hits.push((index + 1) + ": " + line.trim().slice(0, 120));
  });
  return hits;
}

function checkCaptionDomOwnership(file, script) {
  if (file !== "loft-day.html" || !script) return;
  var start = script.indexOf("function createCaptionArbiter(element)");
  var end = script.indexOf("var captionArbiter = createCaptionArbiter(caption);", start);
  if (start < 0 || end <= start) {
    fail(file + ": caption DOM has one renderer", "createCaptionArbiter boundary missing");
    return;
  }
  // Blank the renderer without changing line numbers; diagnostics still point at authored source.
  var outside = script.slice(0, start) + script.slice(start, end).replace(/[^\n]/g, " ") + script.slice(end);
  var hits = captionDomWriteHits(outside);
  if (hits.length) fail(file + ": caption DOM has one renderer", hits.join("\n"));
  else pass(file + ": caption DOM has one renderer (structured claims only)");

  var fixture = [
    'var selected = document.querySelector("#hunt-caption"); selected.textContent = "rogue";',
    'var cap = caption; cap.innerText = "rogue";',
    'caption["innerHTML"] = "rogue";',
    'document.getElementById("hunt-caption").replaceChildren(document.createTextNode("rogue"));',
    'var qs = document.querySelector.bind(document); var indirect = qs("#hunt-caption"); indirect["replaceChildren"]();'
  ].join("\n");
  var fixtureHits = captionDomWriteHits(fixture);
  if (fixtureHits.length === 5) pass(file + ": caption renderer guard rejects alias/bracket/method bypass fixtures");
  else fail(file + ": caption renderer guard rejects alias/bracket/method bypass fixtures", fixtureHits.join("\n"));
}

// Authored source is UTF-8. Keep printable characters visible instead of hiding them
// behind backslash-u escapes; this also keeps Persian/Czech copy and regex endpoints
// reviewable as the characters the browser actually sees.
function checkNoUnicodeEscapes() {
  var names = execSync("git ls-files -z", { cwd: ROOT }).toString("utf8").split("\0").filter(Boolean);
  var re = new RegExp(String.fromCharCode(92, 92) + "u(?:\\{[0-9A-Fa-f]+\\}|[0-9A-Fa-f]{4})", "g");
  var hits = [];
  names.forEach(function (name) {
    var file = path.join(ROOT, name);
    if (!fs.existsSync(file)) return; // a tracked file may be intentionally deleted in the working tree
    var buf = fs.readFileSync(file);
    if (buf.indexOf(0) !== -1) return; // pinned binary payload
    var text = buf.toString("utf8"), match;
    re.lastIndex = 0;
    while ((match = re.exec(text))) {
      hits.push(name + ":" + ((text.slice(0, match.index).match(/\n/g) || []).length + 1));
      if (hits.length >= 12) return;
    }
  });
  if (hits.length) fail("repository source contains no backslash-u escapes", hits.join("\n"));
  else pass("repository source contains no backslash-u escapes");
}

// The landscape-phone chrome overlap: the caption and dots rows each straddle the scene edge
// by half their own height so the freed pixels become room width. Three things make that
// work, and each fails SILENTLY if broken — the scene just quietly shrinks back, or a tap
// stops landing — so they're pinned here.
//   1. setChromeOverlap must derive the offset from a LIVE measurement (offsetHeight). A
//      hardcoded px offset stops being half a row the moment the caption wraps or the
//      language changes.
//   2. sizeFullscreenFrame must call setChromeOverlap BEFORE it measures, or it sizes the
//      frame against the previous room's row heights.
//   3. outerHeight must stay margin-INCLUSIVE. That's the whole mechanism by which areaH
//      subtracts exactly half of each row: the negative margins cancel half of offsetHeight.
//      "Simplify" it to a bare offsetHeight and the space is freed and handed straight back.
// Plus the hit-testing hazard: both overlapping rows must be pointer-transparent, with their
// own controls taking pointer events back, or the half covering the scene eats ordinary room input.

checkNoUnicodeEscapes();
checkTrackedSymlinks();
checkLoftAliases();
checkEggHuntAliases();
checkLiteralLocalAssets();
checkCodeSnippetDelivery();
console.log("");

FILES.forEach(function (file) {
  console.log(file + ":");
  var html = fs.readFileSync(path.join(ROOT, file), "utf8");
  var script = extractScript(html);
  var style = extractStyle(html);
  checkNoConflictMarkers(file, html);
  checkMetadataFreeGame(file, html);
  checkSyntax(file, script);
  if (script) {
    checkDictParity(file, script, html);
    checkEggTotal(html, script);
    checkParticleTransformOrigin(file, script);
    checkAnimationClassCleanup(file, style, script, html);
    checkAudioFadeCloseRace(file, script);
    checkSongPipelineKillSwitch(file, script);
    checkI18nKeys(file, script, html);
    checkConsoleCmdRoster(file, script);
    checkParticleSpawnerCaps(file, script);
    checkDanceParity(file, script);
    checkFireFestParity(file, script);
    checkSeasonRosters(file, script);
    checkTapHaloGuards(file, script);
    checkAlbumSkySig(file, script);
    checkSharedStateOwners(file, script);
    checkLaptopUpdateSoundGate(file, script);
    checkCaptionDomOwnership(file, script);
  }
  checkCssCommentBalance(file, style);
  checkCssBraceBalance(file, style);
  checkAnimationKeyframes(file, style);
  checkTransformClobber(file, style, html);
  checkConsoleOutClipSlack(file, style);
  checkScopeMirrorHygiene(file, style, script);
  checkSvgTagBalance(file, html);
  checkCampBuilderOverlayOrder(file, html);
  checkStaticDomIds(file, html);
  checkMonitorControlSpacing(file, html);
  console.log("");
});

if (failures > 0) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
} else {
  console.log("All checks passed.");
}
