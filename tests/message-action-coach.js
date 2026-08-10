#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function coachState(){var coach=document.querySelector(".pm-msg-action-coach"),label=coach&&coach.querySelector(".pm-msg-action-coach-label"),dismiss=coach&&coach.querySelector(".pm-msg-action-coach-x"),shell=document.querySelector(".phone-shell"),body=document.querySelector(".phone-app-body"),acts=[].slice.call(document.querySelectorAll(".pm-msg-act")),cr=coach&&coach.getBoundingClientRect(),xr=dismiss&&dismiss.getBoundingClientRect(),sr=shell&&shell.getBoundingClientRect(),pr=coach&&coach.parentNode.getBoundingClientRect();return {count:document.querySelectorAll(".pm-msg-action-coach").length,text:label&&label.textContent,parent:coach&&coach.parentNode.className,position:coach&&getComputedStyle(coach).position,z:coach&&+getComputedStyle(coach).zIndex,bounds:!!(cr&&sr&&cr.left>=sr.left&&cr.right<=sr.right&&cr.top>=sr.top&&cr.bottom<=sr.bottom),localTop:cr&&pr&&cr.top-pr.top,dismissCount:coach&&coach.querySelectorAll(".pm-msg-action-coach-x").length,dismissTab:dismiss&&dismiss.tabIndex,dismissTopRight:!!(cr&&xr&&xr.top-cr.top<12&&cr.right-xr.right<12),scroll:body&&body.scrollTop,rights:acts.map(function(x){return x.getBoundingClientRect().right;})};}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__secondRound=true;window.__deliverPhoneMessage("cue_mail");if(window.__hideMessageThumb)window.__hideMessageThumb();window.__deliverPhoneMessage("cue_calendar");if(window.__hideMessageThumb)window.__hideMessageThumb();window.phone.open("messages");await sleep(100);S("first",coachState());',
  ' var body=document.querySelector(".phone-app-body"),before=coachState();body.scrollTop=body.scrollHeight;body.dispatchEvent(new Event("scroll"));await sleep(30);var after=coachState();S("scroll",{before:before,after:after});',
  ' window.setLang("cs");await sleep(80);S("czech",coachState());',
  ' window.__closePhoneModal(true);await sleep(260);window.phone.open("messages");await sleep(100);S("reopen",coachState());',
  ' var dismiss=document.querySelector(".pm-msg-action-coach-x");if(dismiss)dismiss.click();await sleep(80);var saved=window.__checkpointPhoneCapture();S("dismissed",coachState());',
  ' window.__closePhoneModal(true);await sleep(260);window.__resetPhoneApps();window.__checkpointPhoneRestore(saved);window.phone.open("messages");await sleep(100);S("dismissedRestore",coachState());',
  ' window.__closePhoneModal(true);await sleep(260);window.__resetPhoneApps();window.__deliverPhoneMessage("cue_mail");if(window.__hideMessageThumb)window.__hideMessageThumb();window.__deliverPhoneMessage("cue_calendar");if(window.__hideMessageThumb)window.__hideMessageThumb();window.phone.open("messages");await sleep(100);S("afterReset",coachState());',
  ' var action=document.querySelector(".pm-msg-act:not(.used)");if(action)action.click();await sleep(100);window.phone.open("messages");await sleep(100);S("used",coachState());',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function aligned(rights) {
  return rights.length >= 2 && Math.max.apply(Math, rights) - Math.min.apply(Math, rights) < 1;
}

console.log("rsvp.html Messages action-arrow coach:");
var result = lib.runPageSync("rsvp.html", HARNESS, 4500, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.first.count === 1 && s.first.text === "Try the arrows" && /phone-app/.test(s.first.parent) && s.first.position === "absolute" && s.first.z >= 10 && s.first.bounds,
  "the first action shows one topmost phone-level coach with plural copy", s.first);
check(s.first.dismissCount === 1 && s.first.dismissTab === -1 && s.first.dismissTopRight,
  "the coach has one non-Tab dismiss button in its upper-right corner", s.first);
check(aligned(s.first.rights), "every message action uses the same right-hand column", s.first.rights);
check(s.scroll.after.count === 1 && Math.abs(s.scroll.after.localTop - s.scroll.before.localTop) < 1,
  "thread scrolling cannot move or retire the phone-level coach", s.scroll);
check(s.czech.count === 1 && s.czech.text === "Zkus šipky" && aligned(s.czech.rights),
  "a live language repaint preserves the coach and aligned arrows in Czech", s.czech);
check(s.reopen.count === 1 && s.reopen.text === "Zkus šipky",
  "closing and reopening Messages preserves the uncompleted lesson", s.reopen);
check(s.dismissed.count === 0 && s.dismissedRestore.count === 0,
  "the dismiss button retires the lesson durably without activating an action", { dismissed: s.dismissed, restored: s.dismissedRestore });
check(s.afterReset.count === 1 && s.afterReset.text === "Zkus šipky",
  "a new game resets the one-time lesson", s.afterReset);
check(s.used.count === 0,
  "activating any message arrow permanently retires the lesson", s.used);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
