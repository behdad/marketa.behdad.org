#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],turnstile:{},python:{},linux:{}},own=Object.prototype.hasOwnProperty;',
  'var originalAppend=document.head.appendChild,attempts={turnstile:[],python:[],linux:[]};',
  'function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function caught(promise){return Promise.resolve(promise).then(function(value){return {ok:true,value:value};},function(error){return {ok:false,error:String(error&&error.message||error)};});}',
  'function type(node){var src=String(node&&node.src||"");return /turnstile/.test(src)?"turnstile":/pyodide\\.js/.test(src)?"python":/libv86\\.js/.test(src)?"linux":"";}',
  'document.head.appendChild=function(node){var kind=type(node);if(kind){attempts[kind].push(node);return node;}return originalAppend.call(document.head,node);};',
  'function desktop(){if(window.__goToStage)window.__goToStage("office");var tower=document.getElementById("office-pc-desk-trio"),monitor=document.getElementById("office-monitor");if(window.__loftControllers.computer&&window.__loftControllers.computer.set)window.__loftControllers.computer.set(true);if(tower)tower.classList.add("on");if(monitor){if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();monitor.classList.add("here","screen-on","show-caps");monitor.classList.remove("show-fedora");}}',
  'function turnstileApi(token){return {render:function(_host,options){setTimeout(function(){options.callback(token);},0);return token;},execute:function(){},remove:function(){}};}',
  'function linuxFailed(){return !!document.querySelector("#monitor-linux-out .console-err");}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){document.head.appendChild=originalAppend;report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' var request=window.__monitorChatTurnstile;',
  ' var p=caught(request()),s1=attempts.turnstile.shift();s1.dispatchEvent(new Event("error"));report.turnstile.error={result:await p,own:own.call(window,"turnstile"),attached:!!s1.parentNode};',
  ' p=caught(request());var s2=attempts.turnstile.shift();window.turnstile=turnstileApi("one");s2.dispatchEvent(new Event("load"));report.turnstile.success1={result:await p,own:own.call(window,"turnstile")};window.__resetMonitorChat();',
  ' p=caught(request());var timed=attempts.turnstile.shift();await wait(20200);report.turnstile.watchdog={result:await p,own:own.call(window,"turnstile"),attached:!!timed.parentNode};',
  ' p=caught(request());var hung=attempts.turnstile.shift();window.__resetMonitorChat();report.turnstile.cancel={result:await p,own:own.call(window,"turnstile"),attached:!!hung.parentNode};',
  ' var retrySettled=false,retry=request().then(function(value){retrySettled=true;return value;},function(error){retrySettled=true;throw error;}),current=attempts.turnstile.shift();window.turnstile=turnstileApi("stale");hung.dispatchEvent(new Event("load"));await wait(50);var staleSettled=retrySettled;window.turnstile=turnstileApi("two");current.dispatchEvent(new Event("load"));report.turnstile.retry={result:await caught(retry),staleSettled:staleSettled,own:own.call(window,"turnstile")};window.__resetMonitorChat();',
  ' p=caught(request());var s3=attempts.turnstile.shift();window.turnstile=turnstileApi("three");s3.dispatchEvent(new Event("load"));report.turnstile.success2={result:await p,own:own.call(window,"turnstile"),attempts:4};window.__resetMonitorChat();',
  ' desktop();await window.loft.app.open("python");await wait(50);var py1=attempts.python.shift();py1.dispatchEvent(new Event("error"));await wait(50);report.python.error={state:window.__pyRuntimeState(),own:own.call(window,"loadPyodide"),attached:!!py1.parentNode};',
  ' window.__closeMonitorPython();desktop();await window.loft.app.open("python");await wait(50);var pyHung=attempts.python.shift();window.__loftControllers.computer.set(false);await wait(50);report.python.cancel={state:window.__pyRuntimeState(),own:own.call(window,"loadPyodide"),attached:!!pyHung.parentNode};',
  ' desktop();await window.loft.app.open("python");await wait(50);var pyWatch=attempts.python.shift();await wait(45200);report.python.watchdog={state:window.__pyRuntimeState(),own:own.call(window,"loadPyodide"),attached:!!pyWatch.parentNode};',
  ' window.__closeMonitorPython();desktop();await window.loft.app.open("python");await wait(50);var pyCurrent=attempts.python.shift();window.loadPyodide=function(){throw new Error("stale pyodide");};pyWatch.dispatchEvent(new Event("load"));await wait(50);var pyStaleState=window.__pyRuntimeState();window.loadPyodide=function(){throw new Error("current pyodide stop");};pyCurrent.dispatchEvent(new Event("load"));await wait(100);report.python.retry={staleState:pyStaleState,state:window.__pyRuntimeState(),own:own.call(window,"loadPyodide")};',
  ' window.__closeMonitorPython();desktop();await window.loft.app.open("linux");await wait(50);var lx1=attempts.linux.shift();lx1.dispatchEvent(new Event("error"));await wait(50);report.linux.error={failed:linuxFailed(),own:own.call(window,"V86"),attached:!!lx1.parentNode};',
  ' window.__loftControllers.computer.set(false);desktop();await window.loft.app.open("linux");await wait(50);var lxCancel=attempts.linux.shift();window.__loftControllers.computer.set(false);await wait(50);report.linux.cancel={running:window.__lxRunning(),own:own.call(window,"V86"),attached:!!lxCancel.parentNode};',
  ' desktop();await window.loft.app.open("linux");await wait(50);var lxHung=attempts.linux.shift();await wait(45200);report.linux.watchdog={failed:linuxFailed(),own:own.call(window,"V86"),attached:!!lxHung.parentNode};',
  ' window.__closeMonitorLinux();desktop();await window.loft.app.open("linux");await wait(50);var lxCurrent=attempts.linux.shift(),errorsBefore=document.querySelectorAll("#monitor-linux-out .console-err").length;window.V86=function(){throw new Error("stale v86");};lxHung.dispatchEvent(new Event("load"));await wait(50);var errorsAfterStale=document.querySelectorAll("#monitor-linux-out .console-err").length;window.V86=function(){throw new Error("current v86 stop");};lxCurrent.dispatchEvent(new Event("load"));await wait(100);report.linux.retry={staleAdded:errorsAfterStale-errorsBefore,failed:linuxFailed(),own:own.call(window,"V86")};',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("lazy vendor lifecycle:");
var result = lib.runPageSync("loft-day.html", HARNESS, 135000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(result.turnstile.error && !result.turnstile.error.result.ok && !result.turnstile.error.own && !result.turnstile.error.attached, "Turnstile error settles and removes its capture and script", result.turnstile.error);
check(result.turnstile.success1 && result.turnstile.success1.result.ok && result.turnstile.success1.result.value === "one" && !result.turnstile.success1.own, "Turnstile success settles without a terminal vendor property", result.turnstile.success1);
check(result.turnstile.watchdog && !result.turnstile.watchdog.result.ok && /timed out/.test(result.turnstile.watchdog.result.error) && !result.turnstile.watchdog.own && !result.turnstile.watchdog.attached, "Turnstile watchdog settles a hung generation", result.turnstile.watchdog);
check(result.turnstile.cancel && !result.turnstile.cancel.result.ok && !result.turnstile.cancel.own && !result.turnstile.cancel.attached, "Turnstile reset settles a hung generation", result.turnstile.cancel);
check(result.turnstile.retry && result.turnstile.retry.result.ok && result.turnstile.retry.result.value === "two" && !result.turnstile.retry.staleSettled && !result.turnstile.retry.own, "a stale Turnstile load cannot settle the retry", result.turnstile.retry);
check(result.turnstile.success2 && result.turnstile.success2.result.ok && result.turnstile.success2.result.value === "three" && !result.turnstile.success2.own, "a second successful Turnstile load also cleans up", result.turnstile.success2);
check(result.python.error && result.python.error.state === "failed" && !result.python.error.own && !result.python.error.attached, "Pyodide error settles and cleans up", result.python.error);
check(result.python.cancel && result.python.cancel.state === "stopped" && !result.python.cancel.own && !result.python.cancel.attached, "Python reset settles a hung Pyodide generation", result.python.cancel);
check(result.python.watchdog && result.python.watchdog.state === "failed" && !result.python.watchdog.own && !result.python.watchdog.attached, "Pyodide watchdog settles a hung generation", result.python.watchdog);
check(result.python.retry && result.python.retry.staleState === "loading" && result.python.retry.state === "failed" && !result.python.retry.own, "a stale Pyodide load cannot settle or populate the retry", result.python.retry);
check(result.linux.error && result.linux.error.failed && !result.linux.error.own && !result.linux.error.attached, "v86 error settles and cleans up", result.linux.error);
check(result.linux.watchdog && result.linux.watchdog.failed && !result.linux.watchdog.own && !result.linux.watchdog.attached, "v86 watchdog settles a hung generation", result.linux.watchdog);
check(result.linux.retry && result.linux.retry.staleAdded === 0 && result.linux.retry.failed && !result.linux.retry.own, "a stale v86 load cannot settle or populate the retry", result.linux.retry);
check(result.linux.cancel && !result.linux.cancel.running && !result.linux.cancel.own && !result.linux.cancel.attached, "Linux reset settles a hung v86 generation", result.linux.cancel);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All lazy-vendor lifecycle checks passed.");
