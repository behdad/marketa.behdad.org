#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],surfaces:{},welcome:{},autocomplete:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'function command(input,out,text){out.replaceChildren();input.focus();input.value=text;input.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));return out.textContent;}',
  'function tab(input,text){input.focus();input.value=text;input.setSelectionRange(text.length,text.length);input.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true,cancelable:true}));return input.value;}',
  'async function run(){',
  ' var monitorIn=document.getElementById("monitor-console-in"),monitorOut=document.getElementById("monitor-console-out"),dropIn=document.getElementById("dropterm-in"),dropOut=document.getElementById("dropterm-out");',
  ' window.__resetDropTerm();window.__setLang("en");window.__openDropTerm();report.welcome.en=dropOut.textContent;window.__resetDropTerm();window.__setLang("cs");window.__openDropTerm();report.welcome.cs=dropOut.textContent;window.__resetDropTerm();',
  ' function exercise(input,out){return {root:command(input,out,"help loft"),weather:command(input,out,"help loft.weather"),rain:command(input,out,"help loft.weather.rain"),missing:command(input,out,"help loft.notReal"),call:command(input,out,"help(loft)"),ls:command(input,out,"ls"),cd:command(input,out,"cd"),man:command(input,out,"man"),pwd:command(input,out,"pwd")};}',
  ' await window.loft.app.open("console");await new Promise(function(resolve){setTimeout(resolve,80);});report.surfaces.monitor=exercise(monitorIn,monitorOut);report.autocomplete.monitorHelp=tab(monitorIn,"help loft.wea");report.autocomplete.monitorJs=tab(monitorIn,"loft.wea");window.__closeMonitorConsole();window.__openDropTerm();report.surfaces.drop=exercise(dropIn,dropOut);report.autocomplete.dropHelp=tab(dropIn,"help loft.wea");report.autocomplete.dropJs=tab(dropIn,"loft.wea");',
  ' report.public={help:typeof window.help,loftHelp:typeof window.loft.help};',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("JavaScript Console help:");
var result = lib.runPageSync("loft-day.html", HARNESS, 8000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var exactWelcome = "loft console — real JavaScript; typed Loft API ready as `loft`. try: `help loft`";
check(result.errors.length === 0, "both console surfaces run without page errors", result.errors);
check(result.welcome && result.welcome.en === exactWelcome && result.welcome.cs === exactWelcome,
  "English and Czech modes show the exact English-only welcome", result.welcome);
["monitor", "drop"].forEach(function (name) {
  var surface = result.surfaces && result.surfaces[name] || {};
  check(/Loft typed API/.test(surface.root || "") && /loft\.weather/.test(surface.root || "") &&
        /loft\.weather\.rain — namespace/.test(surface.weather || "") && /loft\.weather\.rain\.set/.test(surface.rain || ""),
    name + " console resolves rooted help one namespace at a time", surface);
  check(/no help for 'loft\.notReal'/.test(surface.missing || "") && /ReferenceError: help is not defined/.test(surface.call || ""),
    name + " console keeps invalid paths bounded and publishes no callable help global", surface);
  check((surface.ls || "").endsWith("This is a JavaScript console. Try the Linux app instead.") &&
        [surface.cd, surface.man, surface.pwd].every(function (text) { return /ReferenceError:/.test(text || ""); }),
    name + " console gives only bare ls a friendly diagnostic", surface);
});
check(result.autocomplete && result.autocomplete.monitorHelp === "help loft.weather" && result.autocomplete.dropHelp === "help loft.weather" &&
      result.autocomplete.monitorJs === "loft.weather." && result.autocomplete.dropJs === "loft.weather.",
  "both consoles complete help targets and ordinary Loft paths identically", result.autocomplete);
check(result.public && result.public.help === "undefined" && result.public.loftHelp === "function",
  "loft.help remains the only public help function", result.public);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All JavaScript Console help checks passed.");
