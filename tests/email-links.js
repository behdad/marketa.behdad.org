#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("platform-aware email links:");
for (var i = 0; i < ["rsvp.html", "save-the-dates.html"].length; i++) {
  var page = ["rsvp.html", "save-the-dates.html"][i];
  var source = fs.readFileSync(path.join(__dirname, "..", page), "utf8");
  check(!/(?:window\.open|openExternal)\s*\(\s*["'][^"']*mail\.google\.com/.test(source), page + " has no blind Gmail opener");
  check((source.match(/https:\/\/mail\.google\.com/g) || []).length === 1, page + " has one centralized Gmail target");
}

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],targets:{}};function setUA(ua,touch){try{Object.defineProperty(navigator,"userAgent",{configurable:true,value:ua});}catch(e){}try{Object.defineProperty(navigator,"maxTouchPoints",{configurable:true,value:touch||0});}catch(e){}}function probe(name,ua,touch){setUA(ua,touch);var t=window.__mailComposeTarget("subject ✓","body &",{to:"marketa@behdad.org",cc:"copy@example.com"});report.targets[name]={mode:t.mode,url:t.url};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{probe("desktop","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",0);probe("androidTablet","Mozilla/5.0 (Linux; Android 15; Pixel C) AppleWebKit/537.36 Chrome/140 Safari/537.36",5);probe("iphone","Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1",5);probe("ipadDesktopUA","Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.6 Safari/605.1.15",5);probe("windowsTouch","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",5);}catch(e){report.errors.push(String(e&&e.stack||e));}document.getElementById("__report").textContent=JSON.stringify(report);},180);});',
  '})();</script>'
].join("\n");

function run(page) {
  return lib.runPageSync(page, HARNESS, 4500, { patchRaf: page === "rsvp.html" });
}

var rsvp = run("rsvp.html");
var save = run("save-the-dates.html");
check(rsvp && rsvp.errors.length === 0, "rsvp.html helper loads without errors", rsvp && rsvp.errors);
check(save && save.errors.length === 0, "save-the-dates.html helper loads without errors", save && save.errors);
for (var j = 0; j < [{name:"rsvp",data:rsvp},{name:"save-the-dates",data:save}].length; j++) {
  var item = [{name:"rsvp",data:rsvp},{name:"save-the-dates",data:save}][j];
  var t = item.data && item.data.targets;
  check(t && t.desktop && t.desktop.mode === "gmail" && /^https:\/\/mail\.google\.com\//.test(t.desktop.url), item.name + " keeps Gmail on desktop", t && t.desktop);
  check(t && t.androidTablet && t.androidTablet.mode === "mailto" && /^mailto:/.test(t.androidTablet.url), item.name + " uses mailto on Android tablets", t && t.androidTablet);
  check(t && t.iphone && t.iphone.mode === "mailto", item.name + " uses mailto on iPhone", t && t.iphone);
  check(t && t.ipadDesktopUA && t.ipadDesktopUA.mode === "mailto", item.name + " uses mailto on iPadOS desktop-mode UA", t && t.ipadDesktopUA);
  check(t && t.windowsTouch && t.windowsTouch.mode === "gmail", item.name + " does not misclassify a Windows touch laptop", t && t.windowsTouch);
}

if (failures) { console.log("\n" + failures + " email-link assertion(s) failed."); process.exit(1); }
console.log("\nPlatform-aware email-link assertions passed.");
