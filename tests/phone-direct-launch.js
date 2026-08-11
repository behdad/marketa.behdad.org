#!/usr/bin/env node
// Phone return behavior belongs to the launch transition, not to individual apps.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function phoneOpen(){return !!document.querySelector(".phone-backdrop.show");}',
  'function app(){var s=document.querySelector(".phone-shell");return s&&s.classList.contains("pm-app")&&s.querySelector(".pah-title").textContent;}',
  'function key(name){var s=document.querySelector(".phone-shell");s.focus();s.dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true}));}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' var api=window.loft.api,ids=["messages","album","photobooth","hn","clock","calculator","currency","notes","cards","flashlight","browser","cocktails","dressup","mines","quiz"],direct=[];',
  ' for(var i=0;i<ids.length;i++){if(window.__loftControllers.phone)window.__loftControllers.phone.set(false);await sleep(230);var result=await api.perform("app.open",{app:ids[i]},{source:"test"});await sleep(30);var opened=phoneOpen()&&!!app();key(i%2?"Backspace":"Escape");await sleep(230);direct.push({id:ids[i],ok:result.ok,opened:opened,closed:!phoneOpen()});}',
  ' S("direct",direct);',
  ' if(window.__loftControllers.phone)window.__loftControllers.phone.set(true);await sleep(30);var tile=document.getElementById("phone-app-notes");tile.click();await sleep(30);key("Escape");await sleep(30);var shell=document.querySelector(".phone-shell");S("launcher",{open:phoneOpen(),home:!!(shell&&shell.classList.contains("pm-home"))});',
  ' window.__deliverPhoneMessage("album_full");window.__openMessagesAt("album_full");await sleep(40);window.__runMsgAction("album_full");await sleep(80);var album=app();key("Escape");await sleep(40);var messages=app();var stillOpen=phoneOpen();key("Escape");await sleep(230);S("message",{album:album,messages:messages,stillOpen:stillOpen,closed:!phoneOpen()});',
  ' if(window.__resetPhoneApps)window.__resetPhoneApps();',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html phone direct-launch returns:");
var result = lib.runPageSync("rsvp.html", HARNESS, 9000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {}, bad = (s.direct || []).filter(function (step) { return !step.ok || !step.opened || !step.closed; });
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check((s.direct || []).length === 15 && bad.length === 0, "every API-launched phone app closes on Escape or Backspace", bad);
check(s.launcher && s.launcher.open && s.launcher.home, "a launcher-opened app still returns to phone home", s.launcher);
check(s.message && /album|album/i.test(s.message.album || "") && /messages|zpráv/i.test(s.message.messages || "") && s.message.stillOpen && s.message.closed,
  "a Messages action returns to its thread before the direct Messages launch closes", s.message);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
