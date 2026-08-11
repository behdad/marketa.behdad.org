#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[]};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' var hb=await window.loft.fonts.harfbuzz(),again=await window.loft.fonts.harfbuzz();',
  ' var blob=hb.createBlob(window.__harfbuzzScriptResourceLoader.font),face=hb.createFace(blob,0),font=hb.createFont(face),buffer=hb.createBuffer();buffer.addText("LoftType");buffer.guessSegmentProperties();hb.shape(font,buffer);',
  ' report.module={same:hb===again,keys:Object.keys(hb).sort(),version:hb.version_string(),bufferMethods:[typeof buffer.addText,typeof buffer.guessSegmentProperties,typeof buffer.json],glyphs:buffer.json().length};',
  ' report.surface={typography:Object.prototype.hasOwnProperty.call(window.loft,"typography"),harfbuzz:typeof window.loft.fonts.harfbuzz,google:typeof window.loft.fonts.google,googleList:typeof window.loft.fonts.google.list,local:typeof window.loft.fonts.local,globalHb:typeof window.hb,globalFactory:typeof window.hbjs,globalLoader:typeof window.createHarfBuzz};',
  ' report.help=window.loft.help(window.loft.fonts.harfbuzz);',
  ' if(buffer.destroy)buffer.destroy();if(font.destroy)font.destroy();if(face.destroy)face.destroy();if(blob.destroy)blob.destroy();',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("JavaScript HarfBuzz API:");
var result = lib.runPageSync("loft-day.html", HARNESS, 12000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var module = result.module || {}, surface = result.surface || {};
check(result.errors.length === 0, "the pinned HarfBuzz.js module loads without page errors", result.errors);
check(module.same && /^\d+\.\d+\.\d+/.test(module.version || ""), "repeated imports return the same initialized module", module);
check(["createBlob", "createBuffer", "createFace", "createFont", "shape"].every(function (name) { return module.keys && module.keys.includes(name); }) &&
      !(module.keys || []).includes("font") && !(module.keys || []).includes("Face") && module.bufferMethods && module.bufferMethods.every(function (type) { return type === "function"; }) && module.glyphs === 8,
  "the import is the raw HarfBuzz.js API without an implicit font or Python-style facade", module);
check(!surface.typography && surface.harfbuzz === "function" && surface.google === "function" && surface.googleList === "function" && surface.local === "function",
  "font acquisition lives only under the compact loft.fonts namespace", surface);
check(surface.globalHb === "undefined" && surface.globalFactory === "undefined" && surface.globalLoader === "undefined",
  "loading HarfBuzz publishes no module or loader globals", surface);
check(/loft\.fonts\.harfbuzz\(\)/.test(result.help || "") && /HarfBuzz\.js module/.test(result.help || ""),
  "help describes the JavaScript module import at its public path", result.help);
var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(!/harfbuzzjs ready|hbBannerShown/.test(source),
  "opening Console neither preloads HarfBuzz.js nor claims that a local hb import already exists");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All JavaScript HarfBuzz API checks passed.");
