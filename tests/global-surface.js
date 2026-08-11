#!/usr/bin/env node
// Runtime ownership check for loft-day.html's Window surface.
//
// The head hook snapshots the browser's own Window properties before any authored
// page script runs. After load, this test permits only:
//   - window.loft, the public API root;
//   - window.__*, private coordination and test hooks; and
//   - browser-created named-element properties whose live value really resolves to
//     the corresponding id/name target.
//
// Everything else is an accidental or legacy public global. Failures include the
// runtime value shape and likely source lines so the owner can close one subsystem
// without maintaining a Chrome-version-specific native-global allowlist.
//
// Usage:
//   node tests/global-surface.js          # enforce the final contract
//   node tests/global-surface.js --report # inventory without failing on violations
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var REPORT_ONLY = process.argv.slice(2).includes("--report");
var NAMED_PROBE = "weddingTestNamedWindowProbe";

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],baselineCount:0,finalCount:0,allowed:[],privateCount:0,namedCount:0,namedExamples:[],forbidden:[],probe:null,lazyBootstrap:{attempted:false,settled:false,error:"",vendors:{}}};',
  'function ownKeys(){return Reflect.ownKeys(window);}',
  'function safeValue(name){try{return {ok:true,value:window[name]};}catch(error){return {ok:false,error:String(error&&error.message||error)};}}',
  'function includesNode(collection,node){try{for(var i=0;i<collection.length;i++)if(collection[i]===node)return true;}catch(error){}return false;}',
  'function namedWindowReason(name,value){',
  ' var byId=document.getElementById(name),byName=[];try{byName=Array.prototype.slice.call(document.getElementsByName(name));}catch(error){}',
  ' var candidates=byName.slice();if(byId&&candidates.indexOf(byId)<0)candidates.unshift(byId);',
  ' for(var i=0;i<candidates.length;i++){var node=candidates[i];if(value===node)return (node.id===name?"id":"name")+":"+String(node.tagName||"node").toLowerCase();if(node&&node.contentWindow&&value===node.contentWindow)return "frame:"+String(node.tagName||"node").toLowerCase();}',
  ' if(value&&typeof value.length==="number"&&candidates.length&&candidates.every(function(node){return includesNode(value,node);})){return "collection:"+candidates.length;}',
  ' return "";',
  '}',
  'function descriptorShape(name,value){',
  ' var descriptor=null;try{descriptor=Object.getOwnPropertyDescriptor(window,name);}catch(error){}',
  ' var tag="";try{tag=Object.prototype.toString.call(value);}catch(error){tag="[uninspectable]";}',
  ' var type="";try{type=typeof value;}catch(error){type="uninspectable";}',
  ' return {type:type,tag:tag,enumerable:descriptor?!!descriptor.enumerable:null,configurable:descriptor?!!descriptor.configurable:null,writable:descriptor&&Object.prototype.hasOwnProperty.call(descriptor,"writable")?!!descriptor.writable:null,accessor:!!(descriptor&&(descriptor.get||descriptor.set))};',
  '}',
  'function finish(){report.errors=window.__errs||[];document.getElementById("__report").textContent=JSON.stringify(report);}',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function monitorDesktop(){',
  ' if(window.__goToStage)window.__goToStage("office");',
  ' var tower=document.getElementById("office-pc-desk-trio"),monitor=document.getElementById("office-monitor");',
  ' if(tower)tower.classList.add("on");',
  ' if(monitor){if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();monitor.classList.add("here","screen-on","show-caps");monitor.classList.remove("show-fedora");}',
  '}',
  'async function exerciseLazyVendors(){',
  ' var own=Object.prototype.hasOwnProperty,originalAppend=document.head.appendChild;',
  ' window.turnstile={render:function(_host,options){setTimeout(function(){options.callback("test-token");},0);return "test-widget";},execute:function(){},remove:function(){}};',
  ' monitorDesktop();await window.loft.app.open("chat");await sleep(50);',
  ' report.lazyBootstrap.vendors.turnstile=!own.call(window,"turnstile");',
  ' document.head.appendChild=function(node){',
  '  var src=String(node&&node.src||"");',
  '  if(/pyodide\\.js(?:[?#]|$)/.test(src)){setTimeout(function(){window.loadPyodide=function(){throw new Error("test loader stop");};node.dispatchEvent(new Event("load"));},0);return node;}',
  '  if(/libv86\\.js(?:[?#]|$)/.test(src)){setTimeout(function(){window.V86=function(){throw new Error("test loader stop");};node.dispatchEvent(new Event("load"));},0);return node;}',
  '  return originalAppend.call(document.head,node);',
  ' };',
  ' monitorDesktop();await window.loft.app.open("python");await sleep(50);',
  ' report.lazyBootstrap.vendors.loadPyodide=!own.call(window,"loadPyodide");',
  ' monitorDesktop();await window.loft.app.open("linux");await sleep(50);',
  ' report.lazyBootstrap.vendors.V86=!own.call(window,"V86");',
  ' document.head.appendChild=originalAppend;',
  '}',
  'function inventory(){',
  ' try{',
  '  var baseline=window.__weddingTestWindowBaseline;',
  '  report.baselineCount=Array.isArray(baseline)?baseline.length:0;',
  '  var baselineSet=new Set(Array.isArray(baseline)?baseline:[]);',
  '  var probe=document.createElement("div");probe.id=' + JSON.stringify(NAMED_PROBE) + ';probe.hidden=true;document.body.appendChild(probe);',
  '  var names=ownKeys(),namedSeen=Object.create(null);report.finalCount=names.length;',
  '  for(var i=0;i<names.length;i++){',
  '   var key=names[i];if(baselineSet.has(key))continue;',
  '   if(typeof key!=="string"){report.forbidden.push({name:String(key),keyType:"symbol",shape:descriptorShape(key,safeValue(key).value)});continue;}',
  '   var name=key;',
  '   var read=safeValue(name),value=read.value;',
  '   if(name==="loft"){report.allowed.push({name:name,shape:descriptorShape(name,value)});continue;}',
  '   if(name.indexOf("__")===0){report.privateCount++;continue;}',
  '   var namedReason=read.ok?namedWindowReason(name,value):"";',
  '   if(namedReason){namedSeen[name]=true;report.namedCount++;if(report.namedExamples.length<20)report.namedExamples.push({name:name,reason:namedReason});continue;}',
  '   var shape=descriptorShape(name,value);if(!read.ok)shape.readError=read.error;report.forbidden.push({name:name,shape:shape});',
  '  }',
  '  var domNames=Object.create(null);document.querySelectorAll("[id],[name]").forEach(function(node){var id=node.getAttribute("id"),named=node.getAttribute("name");if(id)domNames[id]=true;if(named)domNames[named]=true;});',
  '  Object.keys(domNames).forEach(function(name){if(namedSeen[name])return;var read=safeValue(name),reason=read.ok?namedWindowReason(name,read.value):"";if(!reason)return;namedSeen[name]=true;report.namedCount++;if(report.namedExamples.length<20)report.namedExamples.push({name:name,reason:reason});});',
  '  var probeRead=safeValue(' + JSON.stringify(NAMED_PROBE) + '),probeReason=probeRead.ok?namedWindowReason(' + JSON.stringify(NAMED_PROBE) + ',probeRead.value):"";',
  '  report.probe={baseline:Array.isArray(baseline)&&baseline.indexOf(' + JSON.stringify(NAMED_PROBE) + ')>=0,own:names.indexOf(' + JSON.stringify(NAMED_PROBE) + ')>=0,resolves:probeRead.ok&&probeRead.value===probe,classified:!!probeReason,reason:probeReason,baselineHadLoft:Array.isArray(baseline)&&baseline.indexOf("loft")>=0,finalHasLoft:names.indexOf("loft")>=0};',
  ' }catch(error){window.__errs.push(String(error&&error.stack||error));}',
  ' finish();',
  '}',
  'window.addEventListener("load",function(){setTimeout(function(){',
  ' report.lazyBootstrap.attempted=true;',
  ' var pending;try{pending=window.loft.typography.harfbuzz();}catch(error){pending=Promise.reject(error);}',
  ' Promise.resolve(pending).then(function(){},function(error){report.lazyBootstrap.error=String(error&&error.message||error);}).then(exerciseLazyVendors).then(function(){report.lazyBootstrap.settled=true;setTimeout(inventory,100);},function(error){report.lazyBootstrap.error=String(error&&error.message||error);report.lazyBootstrap.settled=true;setTimeout(inventory,100);});',
  '},100);});',
  '})();</script>'
].join("\n");

function sourceFiles() {
  var htmlPath = path.join(lib.ROOT, "loft-day.html");
  var html = fs.readFileSync(htmlPath, "utf8");
  var files = [{ name: "loft-day.html", text: html }];
  var srcRe = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/g;
  var match;
  while ((match = srcRe.exec(html))) {
    var relative = match[1].split(/[?#]/)[0];
    if (/^[a-z]+:/i.test(relative)) continue;
    var file = path.join(lib.ROOT, relative);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) files.push({ name: relative, text: fs.readFileSync(file, "utf8") });
  }
  return files;
}

function reEscape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function likelySources(name, files) {
  var escaped = reEscape(name);
  var identifier = /^[A-Za-z_$][\w$]*$/.test(name);
  var patterns = [
    { rank: 0, label: "explicit Window export", re: new RegExp("\\b(?:window|globalThis|self)\\s*(?:\\.\\s*" + (identifier ? escaped + "\\b" : "(?!)") + "|\\[\\s*['\\\"]" + escaped + "['\\\"]\\s*\\])") },
    { rank: 1, label: "classic-script declaration", re: identifier ? new RegExp("\\b(?:var|function|class)\\s+" + escaped + "\\b") : /(?!) / },
    { rank: 2, label: "possible implicit assignment", re: identifier ? new RegExp("(^|[^.\\w$])" + escaped + "\\s*=") : /(?!) / }
  ];
  var hits = [];
  files.forEach(function (file) {
    file.text.split("\n").forEach(function (line, index) {
      patterns.forEach(function (pattern) {
        if (pattern.re.test(line)) hits.push({ rank: pattern.rank, file: file.name, line: index + 1, label: pattern.label, text: line.trim().slice(0, 180) });
      });
    });
  });
  hits.sort(function (a, b) { return a.rank - b.rank || a.file.localeCompare(b.file) || a.line - b.line; });
  var seen = new Set();
  return hits.filter(function (hit) {
    var key = hit.file + ":" + hit.line;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

function staticPublicWindowWrites(files) {
  var writes = [];
  var patterns = [
    { label: "property assignment", re: /\b(?:window|globalThis)\s*\.\s*([A-Za-z_$][\w$]*)\s*(?:=(?!=|>)|\+\+|--|\+=|-=|\*=|\/=|\?\?=|&&=|\|\|=)/g },
    { label: "literal property assignment", re: /\b(?:window|globalThis)\s*\[\s*["']([^"']+)["']\s*\]\s*(?:=(?!=|>)|\+\+|--|\+=|-=|\*=|\/=|\?\?=|&&=|\|\|=)/g },
    { label: "defineProperty export", re: /\bObject\.defineProperty\s*\(\s*(?:window|globalThis)\s*,\s*["']([^"']+)["']/g },
    { label: "Reflect.defineProperty export", re: /\bReflect\.defineProperty\s*\(\s*(?:window|globalThis)\s*,\s*["']([^"']+)["']/g },
    { label: "Reflect.set export", re: /\bReflect\.set\s*\(\s*(?:window|globalThis)\s*,\s*["']([^"']+)["']/g }
  ];
  files.forEach(function (file) {
    file.text.split("\n").forEach(function (line, index) {
      patterns.forEach(function (pattern) {
        pattern.re.lastIndex = 0;
        var match;
        while ((match = pattern.re.exec(line))) {
          var name = match[1];
          if (name === "loft" || name.indexOf("__") === 0) continue;
          writes.push({ name: name, file: file.name, line: index + 1, label: pattern.label, text: line.trim().slice(0, 180) });
        }
      });
    });
  });
  return writes;
}

function shapeText(shape) {
  if (!shape) return "unknown";
  var flags = [];
  if (shape.enumerable !== null) flags.push(shape.enumerable ? "enumerable" : "non-enumerable");
  if (shape.configurable !== null) flags.push(shape.configurable ? "configurable" : "non-configurable");
  if (shape.writable !== null) flags.push(shape.writable ? "writable" : "read-only");
  if (shape.accessor) flags.push("accessor");
  return shape.type + " " + shape.tag + (flags.length ? " (" + flags.join(", ") + ")" : "");
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
    if (detail) console.log("      " + String(detail).split("\n").join("\n      "));
  }
}

console.log("loft-day.html Window ownership:");
var result = lib.runPageSync("loft-day.html", HARNESS, 6500, {
  captureWindowBaseline: true,
  patchRaf: true,
  urlSuffix: "?global-surface=" + Date.now()
});
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}

check(result.errors.length === 0, "page and inventory harness raise no uncaught errors", result.errors.join("\n"));
check(result.baselineCount > 100, "browser Window baseline was captured in the head before app scripts", "captured " + result.baselineCount + " properties");
check(result.probe && !result.probe.baselineHadLoft && result.probe.finalHasLoft, "baseline precedes creation of the public loft API root", JSON.stringify(result.probe));
check(result.probe && !result.probe.baseline && result.probe.resolves && result.probe.classified, "a real browser named-element global is recognized and excluded", JSON.stringify(result.probe));
check(result.allowed.length === 1 && result.allowed[0].name === "loft" && result.allowed[0].shape.type === "object", "window.loft is the one app-authored public root", JSON.stringify(result.allowed));
check(result.lazyBootstrap && result.lazyBootstrap.attempted && result.lazyBootstrap.settled, "a real lazy vendor bootstrap settles before the Window inventory", JSON.stringify(result.lazyBootstrap));
check(result.lazyBootstrap && result.lazyBootstrap.vendors && ["turnstile", "loadPyodide", "V86"].every(function (name) { return result.lazyBootstrap.vendors[name] === true; }), "lazy classic-script vendor globals are captured and removed at runtime", JSON.stringify(result.lazyBootstrap));

var files = sourceFiles();
var staticWrites = staticPublicWindowWrites(files);
check(staticWrites.length === 0, "authored sources contain no explicit public Window writes outside window.loft", staticWrites.map(function (hit) {
  return hit.file + ":" + hit.line + " " + hit.label + " " + hit.name + " — " + hit.text;
}).join("\n"));
var html = files.find(function (file) { return file.name === "loft-day.html"; }).text;
var lazyVendorCaptures = {
  turnstile: 'captureLazyScriptGlobal("turnstile")',
  loadPyodide: 'captureLazyScriptGlobal("loadPyodide")',
  V86: 'captureLazyScriptGlobal("V86")',
  createHarfBuzz: 'hbLoadScript("harfbuzzjs/hb.js", "createHarfBuzz")',
  hbjs: 'hbLoadScript("harfbuzzjs/hbjs.js", "hbjs")'
};
var lazyVendorGlobals = Object.keys(lazyVendorCaptures);
check(lazyVendorGlobals.every(function (name) {
  return html.indexOf(lazyVendorCaptures[name]) >= 0 && !new RegExp("\\bwindow\\s*\\.\\s*" + reEscape(name) + "\\b").test(html);
}), "every lazy vendor bootstrap symbol is captured privately instead of becoming a public API",
  lazyVendorGlobals.filter(function (name) { return html.indexOf(lazyVendorCaptures[name]) < 0 || new RegExp("\\bwindow\\s*\\.\\s*" + reEscape(name) + "\\b").test(html); }).join(", "));
if (result.forbidden.length) {
  console.log("\n  Forbidden app-authored globals (" + result.forbidden.length + "):");
  result.forbidden.forEach(function (entry) {
    console.log("    - " + entry.name + ": " + shapeText(entry.shape));
    var hints = likelySources(entry.name, files);
    if (!hints.length) console.log("      source: no direct export/declaration found; search dynamic property creation");
    hints.forEach(function (hint) {
      console.log("      " + hint.label + ": " + hint.file + ":" + hint.line + "  " + hint.text);
    });
  });
}

if (REPORT_ONLY) {
  console.log("\n  ℹ report-only: " + result.forbidden.length + " forbidden, " + result.privateCount + " private __*, " + result.namedCount + " named-element globals");
} else {
  check(result.forbidden.length === 0, "no app-authored public Window state exists outside window.loft", result.forbidden.length + " forbidden globals");
}

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
if (REPORT_ONLY && result.forbidden.length) console.log("Inventory completed; strict mode will fail until these globals are migrated.");
else console.log("All Window ownership checks passed.");
