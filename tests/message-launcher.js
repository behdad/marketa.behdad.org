#!/usr/bin/env node
// The top-left Messages shortcut remains useful after the unread count reaches zero.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){',
  ' var badge=document.querySelector(".msg-badge");S("empty",{exists:!!badge,shown:!!(badge&&badge.classList.contains("show"))});',
  ' window.__secondRound=true;window.__deliverPhoneMessage("cue_mail");if(window.__hideMessageThumb)window.__hideMessageThumb();await sleep(30);badge=document.querySelector(".msg-badge");S("unread",{shown:badge.classList.contains("show"),idle:badge.classList.contains("idle"),text:badge.textContent.trim()});',
  ' window.__runMsgAction("cue_mail");await sleep(30);if(window.__loftControllers.phone)window.__loftControllers.phone.set(false);await sleep(260);var badgeIcon=badge.querySelector("svg[data-phone-vector-icon=chat]");S("read",{shown:badge.classList.contains("show"),idle:badge.classList.contains("idle"),icon:!!badgeIcon&&!badgeIcon.querySelector("use")});',
  ' badge.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(40);var shell=document.querySelector(".phone-shell");S("launch",{phone:!!document.querySelector(".phone-backdrop.show"),app:shell&&shell.classList.contains("pm-app"),title:shell&&shell.querySelector(".pah-title")&&shell.querySelector(".pah-title").textContent});',
  ' if(window.__resetPhoneApps)window.__resetPhoneApps();if(window.__loftControllers.phone)window.__loftControllers.phone.set(false);await sleep(260);S("reset",{shown:badge.classList.contains("show"),idle:badge.classList.contains("idle")});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html persistent Messages launcher:");
var r = lib.runPageSync("rsvp.html", HARNESS, 4000, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(!s.empty.shown, "no launcher appears before the first message", s.empty);
check(s.unread.shown && !s.unread.idle && s.unread.text === "1", "unread messages retain the red numeric alert", s.unread);
check(s.read.shown && s.read.idle && s.read.icon, "a read thread keeps a neutral Messages launcher", s.read);
check(s.launch.phone && s.launch.app && /messages/i.test(s.launch.title || ""), "the neutral launcher opens the Messages app", s.launch);
check(!s.reset.shown && !s.reset.idle, "resetting the empty thread removes the launcher", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
