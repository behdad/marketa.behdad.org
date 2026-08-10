#!/usr/bin/env node
// Touch-constrained app opens never raise a software keyboard; desktop keeps ready-to-type focus.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function active(){var a=document.activeElement;return {id:a&&a.id||"",cls:a&&a.className||"",editable:!!(a&&(/^(INPUT|TEXTAREA)$/.test(a.tagName)||a.isContentEditable))};}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},320);});',
  'async function run(){',
  ' S("mode",{touch:window.__appTouchConstrained()});window.__secondRound=true;',
  ' window.__openPhoneAppHere("messages");await sleep(90);S("messagesOpen",active());',
  ' var composer=document.querySelector(".pm-msg-input");composer.focus();S("messagesTap",active());window.__deliverPhoneMessage("cue_mail");await sleep(70);S("messagesRepaint",active());',
  ' window.__openPhoneAppHere("notes");await sleep(40);S("notesOpen",active());var notes=document.querySelector(".pmn-pad");notes.focus();S("notesTap",active());',
  ' window.__openPhoneAppHere("browser");await sleep(40);S("phoneBrowserOpen",active());var phoneUrl=document.querySelector(".pbrow-url-in");phoneUrl.focus();S("phoneBrowserTap",active());',
  ' window.__openPhoneAppHere("calendar");await sleep(40);var calToggle=document.querySelector(".calx-search-btn");calToggle.click();await sleep(40);S("phoneCalendarSearch",active());var phoneCal=document.querySelector(".calx-search-input");phoneCal.focus();S("phoneCalendarTap",active());',
  ' window.phone.set(false);await sleep(260);window.goToStage("office");await sleep(80);var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(40);',
  ' window.__openMonitorApp("chat");await sleep(110);S("chatOpen",active());var chat=document.getElementById("monitor-chat-input");chat.focus();S("chatTap",active());',
  ' window.__closeTopMonitorApp();mon.classList.add("show-caps");window.__openMonitorApp("console");await sleep(90);S("consoleOpen",active());',
  ' window.__closeTopMonitorApp();mon.classList.add("show-caps");window.__openMonitorApp("code");await sleep(90);S("codeOpen",active());',
  ' window.__closeTopMonitorApp();mon.classList.add("show-caps");window.__openMonitorApp("calendar");await sleep(40);var monitorCalToggle=document.querySelector("#monitor-cal-body .calx-search-btn");monitorCalToggle.click();await sleep(40);S("monitorCalendarSearch",active());',
  ' window.__closeTopMonitorApp();mon.classList.add("show-caps");window.__toggleDropTerm();await sleep(90);S("dropTermOpen",active());window.__toggleDropTerm();',
  ' window.__openMonitorApp("chrome");await sleep(850);var plus=document.querySelector(".browser-tab-plus");if(plus)plus.click();await sleep(40);S("browserNewTab",active());',
  '}',
  '})();</script>'
].join("\n");

function run(opts) {
  return lib.runPageSync("rsvp.html", HARNESS, 6500, Object.assign({ patchRaf: true }, opts));
}

function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function is(step, idOrClass) {
  return step && (step.id === idOrClass || String(step.cls).split(/\s+/).indexOf(idOrClass) !== -1);
}

var failures = 0;
console.log("rsvp.html app text focus ownership:");
var mobile = run({ forceCoarsePointer: true });
var desktop = run({});
if (!mobile || !desktop) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(mobile.errors.length === 0 && desktop.errors.length === 0, "no uncaught page errors", { mobile: mobile.errors, desktop: desktop.errors });
check(mobile.steps.mode.touch && !desktop.steps.mode.touch, "coarse and desktop layouts take opposite focus policies", { mobile: mobile.steps.mode, desktop: desktop.steps.mode });

["messagesOpen", "notesOpen", "phoneBrowserOpen", "phoneCalendarSearch", "chatOpen", "consoleOpen", "codeOpen", "monitorCalendarSearch", "dropTermOpen", "browserNewTab"].forEach(function (key) {
  check(!mobile.steps[key].editable, "mobile " + key + " leaves editors unfocused", mobile.steps[key]);
});
check(is(mobile.steps.messagesTap, "pm-msg-input") && is(mobile.steps.notesTap, "pmn-pad") &&
  is(mobile.steps.phoneBrowserTap, "pbrow-url-in") && is(mobile.steps.phoneCalendarTap, "calx-search-input") &&
  is(mobile.steps.chatTap, "monitor-chat-input"),
  "direct mobile field focus remains available across phone and monitor apps",
  { message: mobile.steps.messagesTap, notes: mobile.steps.notesTap, browser: mobile.steps.phoneBrowserTap, calendar: mobile.steps.phoneCalendarTap, chat: mobile.steps.chatTap });
check(is(mobile.steps.messagesRepaint, "pm-msg-input"), "Messages preserves a deliberately focused composer across a live repaint", mobile.steps.messagesRepaint);

check(is(desktop.steps.messagesOpen, "pm-msg-input") && is(desktop.steps.chatOpen, "monitor-chat-input") &&
  is(desktop.steps.consoleOpen, "monitor-console-in") && is(desktop.steps.codeOpen, "monitor-code-code") &&
  is(desktop.steps.phoneCalendarSearch, "calx-search-input") && is(desktop.steps.monitorCalendarSearch, "calx-search-input") &&
  is(desktop.steps.dropTermOpen, "dropterm-in") && is(desktop.steps.browserNewTab, "monitor-browser-url"),
  "desktop apps retain ready-to-type focus",
  desktop.steps);

var html = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/function appTouchConstrained\(\)/.test(html) && /function appAutoFocusTextControl\(control, preserveExisting\)/.test(html),
  "one shared touch policy owns scripted editor focus");
check(/openPython[\s\S]*?appAutoFocusTextControl\(pyIn\)/.test(html) &&
  /openLinux[\s\S]*?appAutoFocusTextControl\(lxIn\)/.test(html) &&
  /function focusBrowserUrl\(\) \{ return appAutoFocusTextControl\(browserUrlIn\); \}/.test(html),
  "Python, Linux, and Browser app-open paths use the shared guard");
check(!/(?:consoleIn|dtIn|codeName|codeCode|codeAskInput|chatInput|browserUrlIn|pyIn|lxIn|messageInput|searchUI\.input)\.focus\s*\(/.test(html),
  "audited app editor variables have no remaining raw focus calls");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
