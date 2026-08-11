#!/usr/bin/env node
// RSVP message/caption actions stay inside the game until the visitor presses Send.
"use strict";

var lib = require("./lib");
var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){',
  'if(window.__endAttract)window.__endAttract();window.__secondRound=true;window.__deliverPhoneMessage("mb");window.__runMsgAction("mb");',
  'setTimeout(function(){var shell=document.querySelector(".phone-shell"),form=document.querySelector(".pm-mail-form");report.steps.message={room:window.__currentStageName,mail:!!(shell&&shell.classList.contains("pm-app")&&form),to:form&&form.querySelector("#pm-mail-f-to").value,subject:form&&form.querySelector("#pm-mail-f-subject").value,body:form&&form.querySelector("#pm-mail-f-body").value};',
  // lib.js blocks every anchor in capture phase to prevent headless navigation. Let this one
  // in-game action continue past that generic guard so its target listener is exercised.
  'window.__closePhoneModal(true);setTimeout(function(){var composeCalls=0,openCompose=window.__openPhoneRsvpCompose;window.__openPhoneRsvpCompose=function(){composeCalls++;return openCompose();};window.__showRsvpNudge();var link=document.querySelector("#hunt-caption a"),oldStopI=Event.prototype.stopImmediatePropagation;Event.prototype.stopImmediatePropagation=function(){};var allowed=link&&link.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));Event.prototype.stopImmediatePropagation=oldStopI;',
  'setTimeout(function(){var captionForm=document.querySelector(".pm-mail-form");report.steps.caption={link:!!link,href:link&&link.getAttribute("href"),prevented:allowed===false,composeCalls:composeCalls,mail:!!(shell&&shell.classList.contains("pm-app")&&captionForm),to:captionForm&&captionForm.querySelector("#pm-mail-f-to").value,subject:captionForm&&captionForm.querySelector("#pm-mail-f-subject").value,body:captionForm&&captionForm.querySelector("#pm-mail-f-body").value};report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},80);},260);},80);',
  '},350);});})();</script>'
].join("\n");

var r = lib.runPageSync("rsvp.html", HARNESS, 3000, { patchRaf: true });
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
check(r.steps.caption.link && r.steps.caption.href === "#rsvp-anchor" && r.steps.caption.prevented &&
      r.steps.caption.composeCalls === 1 &&
      r.steps.caption.mail && r.steps.caption.to === "marketa@behdad.org" &&
      r.steps.caption.subject === "we're coming 💌" &&
      /which celebration/.test(r.steps.caption.body || ""),
  "the final RSVP caption is bound to the same in-game Mail composer", r.steps.caption);
console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
