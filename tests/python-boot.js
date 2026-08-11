#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'window.addEventListener("load",function(){setTimeout(async function(){',
  ' var report={errors:window.__errs,state:"",text:""};',
  ' try {',
  '  window.__goToStage("office");var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");',
  '  await window.loft.app.open("python");',
  '  for(var i=0;i<500&&window.__pyRuntimeState()==="loading";i++)await sleep(100);',
  '  report.state=window.__pyRuntimeState();report.text=document.getElementById("monitor-py-out").textContent;',
  ' } catch(error){window.__errs.push("harness: "+String(error&&error.stack||error));}',
  ' report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);',
  '},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html Python boot transcript:");
var result = lib.runPageSync("rsvp.html", HARNESS, 60000, {
  patchRaf: true,
  chromeFlags: "--allow-file-access-from-files"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
check(result.errors.length === 0, "the pinned Python runtime boots without page errors", result.errors);
check(result.state === "ready", "the runtime reaches ready", result.state);
check(/loft python/.test(result.text) && /Loading micropip/.test(result.text) && /Loaded micropip/.test(result.text) &&
      /Python 3\.14\.2 ready\./.test(result.text) && />>> import loft/.test(result.text),
  "boot loads micropip and initializes loft", result.text);
check(!/(?:Loading|Loaded) (?:brotli|fonttools|uharfbuzz)|fontTools|uharfbuzz/.test(result.text),
  "boot does not load or advertise font packages", result.text);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
