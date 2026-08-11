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
var staticAudit = require("./global-static-audit");

var REPORT_ONLY = process.argv.slice(2).includes("--report");
var NAMED_PROBE = "weddingTestNamedWindowProbe";
var AUTHORED_DOM_PROBE = "weddingAuthoredDomProbe";
var INHERITED_PROBE = "weddingPrototypeLeak";
var TRANSIENT_PROBE = "weddingTransientLeak";
var TRANSIENT_SOURCE = fs.readFileSync(path.join(__dirname, "fixtures", "global-audit", "combined-transient.js"), "utf8");
var LEXICAL_SOURCE = fs.readFileSync(path.join(__dirname, "fixtures", "global-audit", "combined-lexical.js"), "utf8");
var LOFT_PROTOTYPE_SOURCE = fs.readFileSync(path.join(__dirname, "fixtures", "global-audit", "combined-loft-prototype.js"), "utf8");
var FIVE_NAME_SOURCE = fs.readFileSync(path.join(__dirname, "fixtures", "global-audit", "combined-five-transient.js"), "utf8");
var FIVE_NAMES = ["weddingSloppyTransient", "weddingBareLoftTransient", "weddingTopTransient", "weddingUncurryTransient", "weddingMethodTransient"];
var NEARBY_SOURCE = fs.readFileSync(path.join(__dirname, "fixtures", "global-audit", "combined-nearby-transient.js"), "utf8");
var NEARBY_NAMES = ["weddingNestedPrivateTransient", "weddingComputedMemberTransient", "weddingEventThisTransient", "weddingReflectUncurryTransient"];

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],baselineCount:0,finalCount:0,allowed:[],privateCount:0,namedCount:0,namedExamples:[],forbidden:[],probe:null,prototypeResolution:null,transientResolution:null,transientOwn:null,combinedResolution:null,fiveNameProof:null,fiveNamesRemaining:[],nearbyProof:null,nearbyNamesRemaining:[],lazyBootstrap:{attempted:false,settled:false,error:"",vendors:{}}};',
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
  'function sameDescriptor(a,b){return !!a&&!!b&&a.configurable===b.configurable&&a.enumerable===b.enumerable&&a.writable===b.writable&&Object.is(a.value,b.value)&&a.get===b.get&&a.set===b.set;}',
  'function browserNamedReason(name,value,reason){',
  ' var authored;try{authored=Object.getOwnPropertyDescriptor(window,name);}catch(error){}if(!authored||!authored.configurable)return "";',
  ' var removed=false;try{removed=delete window[name];}catch(error){}if(!removed)return "";',
  ' var naturalRead=safeValue(name),naturalReason=naturalRead.ok?namedWindowReason(name,naturalRead.value):"",natural;try{natural=Object.getOwnPropertyDescriptor(window,name);}catch(error){}',
  ' var browserProvided=!!naturalReason&&sameDescriptor(authored,natural);',
  ' if(!browserProvided)try{Object.defineProperty(window,name,authored);}catch(error){}',
  ' return browserProvided?reason:"";',
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
  '  var baseline=window.__weddingTestWindowBaseline,baselineDescriptors=new Map(window.__weddingTestWindowBaselineDescriptors||[]);',
  '  report.baselineCount=Array.isArray(baseline)?baseline.length:0;',
  '  var baselineSet=new Set(Array.isArray(baseline)?baseline:[]);',
  '  var probe=document.createElement("div");probe.id=' + JSON.stringify(NAMED_PROBE) + ';probe.hidden=true;document.body.appendChild(probe);',
  '  var prototypeBaseline=window.__weddingTestWindowBaselineDescriptors.prototypeBaseline||[],currentPrototype=Object.getPrototypeOf(window);',
  '  prototypeBaseline.forEach(function(record,index){',
  '   var baselinePrototype=record[0],baselineMap=new Map(record[1]||[]);if(currentPrototype!==baselinePrototype){report.forbidden.push({name:"[[Prototype:"+index+"]]",prototypeReplacement:true});currentPrototype=currentPrototype&&Object.getPrototypeOf(currentPrototype);return;}',
  '   var currentKeys=Reflect.ownKeys(currentPrototype),currentSet=new Set(currentKeys);currentKeys.forEach(function(key){var name=String(key),before=baselineMap.get(key),after=Object.getOwnPropertyDescriptor(currentPrototype,key);if(typeof key==="string"&&key.indexOf("__")===0)return;if(!before)report.forbidden.push({name:name,inheritedAddition:true});else if(!sameDescriptor(before,after))report.forbidden.push({name:name,inheritedReplacement:true});});',
  '   baselineMap.forEach(function(_descriptor,key){if(!currentSet.has(key))report.forbidden.push({name:String(key),inheritedRemoval:true});});',
  '   currentPrototype=Object.getPrototypeOf(currentPrototype);',
  '  });',
  '  if(currentPrototype)report.forbidden.push({name:"[[Prototype:extra]]",prototypeAddition:true});',
  '  report.prototypeResolution=window.__weddingPrototypeResolution||null;',
  '  report.transientResolution=window.__weddingTransientResolution||null;report.transientOwn=Object.prototype.hasOwnProperty.call(window,' + JSON.stringify(TRANSIENT_PROBE) + ');',
  '  report.combinedResolution=window.__weddingCombinedResolution||null;',
  '  report.fiveNameProof=window.__weddingFiveNameProof||null;report.fiveNamesRemaining=' + JSON.stringify(FIVE_NAMES) + '.filter(function(name){return name in window;});',
  '  report.nearbyProof=window.__weddingNearProof||null;report.nearbyNamesRemaining=' + JSON.stringify(NEARBY_NAMES) + '.filter(function(name){return name in window;});',
  '  var names=ownKeys(),namedSeen=Object.create(null);report.finalCount=names.length;',
  '  for(var i=0;i<names.length;i++){',
  '   var key=names[i];if(baselineSet.has(key)){var currentDescriptor=null;try{currentDescriptor=Object.getOwnPropertyDescriptor(window,key);}catch(error){}var baselineDescriptor=baselineDescriptors.get(key);if(!sameDescriptor(baselineDescriptor,currentDescriptor))report.forbidden.push({name:String(key),baselineReplacement:true,shape:descriptorShape(key,safeValue(key).value)});continue;}',
  '   if(typeof key!=="string"){report.forbidden.push({name:String(key),keyType:"symbol",shape:descriptorShape(key,safeValue(key).value)});continue;}',
  '   var name=key;',
  '   var read=safeValue(name),value=read.value;',
  '   if(name==="loft"){report.allowed.push({name:name,shape:descriptorShape(name,value)});continue;}',
  '   if(name.indexOf("__")===0){report.privateCount++;continue;}',
  '   var namedReason=read.ok?namedWindowReason(name,value):"";if(namedReason)namedReason=browserNamedReason(name,value,namedReason);',
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
  ' var pending;try{pending=window.loft.fonts.harfbuzz();}catch(error){pending=Promise.reject(error);}',
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
var staticWrites = [];
staticAudit.authoredSources(lib.ROOT).forEach(function (file) {
  staticWrites = staticWrites.concat(staticAudit.auditSource(file.source, file.name.replace(/#inline-\d+$/, "")));
});
check(staticWrites.length === 0, "authored sources contain no explicit public Window writes outside window.loft", staticWrites.map(function (hit) {
  return hit.file + ":" + hit.line + " " + hit.kind + " " + (hit.name === null ? "<dynamic>" : hit.name) + " — " + hit.message;
}).join("\n"));
var html = files.find(function (file) { return file.name === "loft-day.html"; }).text;
var lazyVendorCaptures = {
  turnstile: 'lazyScriptAttempt("turnstile"',
  loadPyodide: 'lazyScriptAttempt("loadPyodide"',
  V86: 'lazyScriptAttempt("V86"',
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

var hostile = lib.runPageSync("loft-day.html", HARNESS + [
  '<script>', LEXICAL_SOURCE, '</script>',
  '<script>', LOFT_PROTOTYPE_SOURCE, '</script>',
  '<script>', FIVE_NAME_SOURCE, '</script>',
  '<script>', NEARBY_SOURCE, '</script>',
  '<script>',
  TRANSIENT_SOURCE,
  'window.open=function authoredReplacement(){};',
  'var authoredNode=document.createElement("div");authoredNode.id=' + JSON.stringify(AUTHORED_DOM_PROBE) + ';document.body.appendChild(authoredNode);',
  'Object.defineProperty(window,' + JSON.stringify(AUTHORED_DOM_PROBE) + ',{configurable:true,enumerable:false,writable:false,value:authoredNode});',
  'window.__proto__.' + INHERITED_PROBE + '={public:true};',
  'window.__weddingPrototypeResolution={windowValue:window.' + INHERITED_PROBE + '.public===true,bareValue:' + INHERITED_PROBE + '.public===true};',
  '</script>'
].join("\n"), 6500, {
  captureWindowBaseline: true,
  patchRaf: true,
  urlSuffix: "?global-hostile=" + Date.now()
});
check(hostile && hostile.forbidden.some(function (entry) { return entry.name === "open" && entry.baselineReplacement; }), "runtime gate rejects replacement of a baseline native", hostile && hostile.forbidden);
check(hostile && hostile.forbidden.some(function (entry) { return entry.name === AUTHORED_DOM_PROBE; }), "runtime gate rejects an authored DOM-valued Window property", hostile && hostile.forbidden);
check(hostile && hostile.forbidden.some(function (entry) { return entry.name === INHERITED_PROBE && entry.inheritedAddition; }), "runtime gate rejects inherited public application surface", hostile && hostile.forbidden);
check(hostile && hostile.prototypeResolution && hostile.prototypeResolution.windowValue && hostile.prototypeResolution.bareValue, "hostile inherited property resolves through window.name and bare name", hostile && hostile.prototypeResolution);
var transientStatic = staticAudit.auditSource(TRANSIENT_SOURCE, "combined-transient.js");
check(transientStatic.some(function (entry) { return entry.name === TRANSIENT_PROBE; }), "static gate rejects a conditional alias that publishes then deletes a public global", transientStatic);
check(hostile && hostile.transientResolution && hostile.transientResolution.windowValue && hostile.transientResolution.bareValue, "temporary hostile global resolves through window.name and bare name while published", hostile && hostile.transientResolution);
check(hostile && hostile.transientOwn === false, "temporary hostile global is gone before runtime inventory", hostile && { transientOwn: hostile.transientOwn });
var lexicalStatic = staticAudit.auditSource(LEXICAL_SOURCE, "combined-lexical.js");
var loftPrototypeStatic = staticAudit.auditSource(LOFT_PROTOTYPE_SOURCE, "combined-loft-prototype.js");
check(lexicalStatic.some(function (entry) { return entry.name === "weddingLexicalLeak"; }), "static gate rejects persistent Program lexical surface", lexicalStatic);
check(loftPrototypeStatic.some(function (entry) { return entry.name === "weddingLoftPrototypeLeak"; }), "static gate rejects a temporary shared-prototype publication below loft", loftPrototypeStatic);
check(hostile && hostile.combinedResolution && hostile.combinedResolution.lexicalBare && hostile.combinedResolution.lexicalOwn === false && hostile.combinedResolution.prototypeWindow && hostile.combinedResolution.prototypeBare, "two-script browser proof resolves lexical and transient loft-prototype public surface", hostile && hostile.combinedResolution);
var fiveStatic = staticAudit.auditSource(FIVE_NAME_SOURCE, "combined-five-transient.js");
check(FIVE_NAMES.every(function (name) { return fiveStatic.some(function (entry) { return entry.name === name; }); }), "static gate rejects all five ordinary temporary publication paths", fiveStatic);
check(hostile && hostile.fiveNameProof && ["sloppy", "bareLoft", "top", "uncurry", "method"].every(function (key) { var pair = hostile.fiveNameProof[key]; return Array.isArray(pair) && pair.length === 2 && pair[0] === pair[1]; }), "combined browser proof resolves all five temporary names through window.name and bare name", hostile && hostile.fiveNameProof);
check(hostile && hostile.fiveNamesRemaining && hostile.fiveNamesRemaining.length === 0, "combined five-name proof removes every temporary global before runtime inventory", hostile && hostile.fiveNamesRemaining);
var nearbyStatic = staticAudit.auditSource(NEARBY_SOURCE, "combined-nearby-transient.js");
check(NEARBY_NAMES.every(function (name) { return nearbyStatic.some(function (entry) { return entry.name === name; }); }), "static gate rejects all four nearby temporary publication paths", nearbyStatic);
check(hostile && hostile.nearbyProof && ["nested", "computed", "eventThis", "reflectUncurry"].every(function (key) { var pair = hostile.nearbyProof[key]; return Array.isArray(pair) && pair.length === 2 && pair[0] === pair[1]; }), "combined browser proof resolves all four nearby temporary names through window.name and bare name", hostile && hostile.nearbyProof);
check(hostile && hostile.nearbyNamesRemaining && hostile.nearbyNamesRemaining.length === 0, "combined nearby proof removes every temporary global before runtime inventory", hostile && hostile.nearbyNamesRemaining);

var replacedPrototype = lib.runPageSync("loft-day.html", HARNESS + '<script>Object.defineProperty(window.__proto__,"constructor",{configurable:true,writable:true,value:function AuthoredWindowConstructor(){}});</script>', 6500, {
  captureWindowBaseline: true, patchRaf: true, urlSuffix: "?global-prototype-replace=" + Date.now()
});
check(replacedPrototype && replacedPrototype.forbidden.some(function (entry) { return entry.name === "constructor" && entry.inheritedReplacement; }), "runtime gate rejects replacement of an inherited baseline descriptor", replacedPrototype && replacedPrototype.forbidden);

var removedPrototype = lib.runPageSync("loft-day.html", HARNESS + '<script>delete window.__proto__.constructor;</script>', 6500, {
  captureWindowBaseline: true, patchRaf: true, urlSuffix: "?global-prototype-remove=" + Date.now()
});
check(removedPrototype && removedPrototype.forbidden.some(function (entry) { return entry.name === "constructor" && entry.inheritedRemoval; }), "runtime gate rejects removal of an inherited baseline descriptor", removedPrototype && removedPrototype.forbidden);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
if (REPORT_ONLY && result.forbidden.length) console.log("Inventory completed; strict mode will fail until these globals are migrated.");
else console.log("All Window ownership checks passed.");
