#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],logs:[],outputs:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'async function command(input,out,text){out.replaceChildren();input.focus();input.value=text;input.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));await sleep(50);return out.textContent;}',
  'async function run(){',
  ' var oldLog=console.log;console.log=function(){report.logs.push([].slice.call(arguments).join(" "));};',
  ' try{',
  '  window.__resetDropTerm();window.__openDropTerm();var dropIn=document.getElementById("dropterm-in"),dropOut=document.getElementById("dropterm-out");dropOut.replaceChildren();await window.loft.environment.daylight.set(false);await sleep(20);report.outputs.direct=dropOut.textContent;report.outputs.drop=await command(dropIn,dropOut,"loft.environment.daylight.set(true)");window.__closeDropTerm();',
  '  await window.loft.app.open("console");for(var i=0;i<100&&!document.getElementById("office-monitor").classList.contains("show-console");i++)await sleep(40);var monitorIn=document.getElementById("monitor-console-in"),monitorOut=document.getElementById("monitor-console-out");report.outputs.monitor=await command(monitorIn,monitorOut,"loft.environment.daylight.set(false)");',
  ' }finally{console.log=oldLog;}',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("JavaScript Console game narration:");
var result = lib.runPageSync("loft-day.html", HARNESS, 9000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
check(result.errors.length === 0, "controller narration runs without page errors", result.errors);
check(result.outputs && result.outputs.direct === "", "a scripted game action adds nothing to an open in-game console", result.outputs);
["drop", "monitor"].forEach(function (name) {
  var output = result.outputs && result.outputs[name] || "";
  check(/❯ loft\.environment\.daylight\.set\((?:true|false)\)/.test(output) && /"mode":"(?:on|off|auto)"/.test(output) && !/daylight|dusk settles/.test(output.replace(/loft\.environment\.daylight/g, "")),
    name + " console keeps the entered command and result without narration chatter", output);
});
check(result.logs && result.logs.some(function (line) { return /dusk settles/.test(line); }) && result.logs.some(function (line) { return /daylight/.test(line); }),
  "game narration still reaches the browser developer console", result.logs);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All JavaScript Console narration checks passed.");
