#!/usr/bin/env node
// RSVP message/caption actions stay inside the game until the visitor presses Send.
"use strict";

var fs = require("fs");
var lib = require("./lib");
var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){',
  'window.__secondRound=true;window.__deliverPhoneMessage("mb");window.__runMsgAction("mb");',
  'setTimeout(function(){var shell=document.querySelector(".phone-shell"),form=document.querySelector(".pm-mail-form");report.steps.message={room:window.currentStageName,mail:!!(shell&&shell.classList.contains("pm-app")&&form),to:form&&form.querySelector("#pm-mail-f-to").value,subject:form&&form.querySelector("#pm-mail-f-subject").value,body:form&&form.querySelector("#pm-mail-f-body").value};',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},80);',
  '},350);});})();</script>'
].join("\n");

var r = lib.runPageSync("rsvp.html", HARNESS, 3000, { patchRaf: true });
var html = fs.readFileSync("rsvp.html", "utf8");
if (!r) { console.error("RSVP compose harness produced no report"); process.exit(1); }
var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? " [" + JSON.stringify(detail) + "]" : "")); }
}
console.log("rsvp.html RSVP phone compose:");
check(!r.errors.length, "no uncaught page errors", r.errors);
check(r.steps.message.mail && r.steps.message.room === "balcony" &&
      r.steps.message.to === "marketa@behdad.org" &&
      r.steps.message.subject === "we're coming 💌" &&
      /which celebration/.test(r.steps.message.body || ""),
  "the RSVP message opens a localized, addressed phone Mail draft", r.steps.message);
check(/rsvpA\.addEventListener\("click"[\s\S]*?__openPhoneRsvpCompose/.test(html),
  "the final RSVP caption is bound to the same in-game Mail composer");
console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
