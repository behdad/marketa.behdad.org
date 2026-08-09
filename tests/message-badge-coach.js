#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function finishGuide(){if(window.__endAttract)window.__endAttract();for(var i=0;i<2;i++){if(!(window.__openingGuideShowing&&window.__openingGuideShowing()))break;var x=document.querySelector("#opening-guide-coach .hunt-coach-x");if(x)x.click();}}',
  'function snap(){var coach=document.querySelector(".msg-badge-coach"),copy=coach&&coach.querySelector(".msg-badge-coach-copy"),dismiss=coach&&coach.querySelector(".msg-badge-coach-dismiss"),arrow=coach&&coach.querySelector(".msg-badge-coach-arrow"),badge=document.querySelector(".msg-badge"),view=document.querySelector(".hunt-viewport"),cr=coach&&coach.getBoundingClientRect(),xr=dismiss&&dismiss.getBoundingClientRect(),ar=arrow&&arrow.getBoundingClientRect(),br=badge&&badge.getBoundingClientRect(),vr=view&&view.getBoundingClientRect(),cs=coach&&getComputedStyle(coach),arrowDx=ar&&br&&(ar.left+ar.width/2)-(br.left+br.width/2),arrowDy=ar&&br&&(ar.top+7)-(br.top+br.height/2),arrowInBadge=ar&&br&&(arrowDx*arrowDx/((br.width/2)*(br.width/2))+arrowDy*arrowDy/((br.height/2)*(br.height/2))<=1.15);return {show:!!(coach&&coach.classList.contains("show")),text:copy&&copy.textContent,lang:document.documentElement.lang,pathCount:coach&&coach.querySelectorAll(".msg-badge-coach-arrow path").length,dismiss:!!dismiss,dismissTab:dismiss&&dismiss.tabIndex,dismissTopRight:!!(cr&&xr&&xr.top-cr.top<14&&cr.right-xr.right<14),cardPointer:cs&&cs.pointerEvents,dismissPointer:dismiss&&getComputedStyle(dismiss).pointerEvents,bg:cs&&cs.backgroundColor,color:cs&&cs.color,font:cs&&cs.fontFamily,top:cr&&vr&&cr.top-vr.top,arrowLong:!!(ar&&ar.height>=80),arrowDx:arrowDx,arrowDy:arrowDy,arrowPoints:!!(arrowInBadge&&ar.bottom<=cr.top+2),badge:!!(badge&&badge.classList.contains("show")),coached:!!(badge&&badge.classList.contains("coached")),room:window.currentStageName};}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' finishGuide();window.__secondRound=true;if(window.__stopCueDrip)window.__stopCueDrip();window.__deliverPhoneMessage("cue_mail");if(window.__hideMessageThumb)window.__hideMessageThumb();window.__repeatMsgBadgeCoach();await sleep(80);S("first",snap());',
  ' window.__updateMsgBadge();await sleep(30);S("repaint",snap());',
  ' window.__unlockAllRooms();document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true,cancelable:true}));await sleep(900);S("navigation",snap());',
  ' var live=window.__checkpointPhoneCapture();window.__resetPhoneApps();window.__checkpointPhoneRestore(live);await sleep(80);S("restoreLive",snap());',
  ' window.setLang("cs");await sleep(60);S("czech",snap());',
  ' var dismiss=document.querySelector(".msg-badge-coach-dismiss");if(dismiss)dismiss.click();await sleep(40);var retired=window.__checkpointPhoneCapture();S("dismissed",snap());',
  ' window.__resetPhoneApps();window.__checkpointPhoneRestore(retired);window.__repeatMsgBadgeCoach();await sleep(60);S("restoreDismissed",snap());',
  ' window.__resetPhoneApps();window.__deliverPhoneMessage("cue_mail");if(window.__hideMessageThumb)window.__hideMessageThumb();window.__repeatMsgBadgeCoach();await sleep(60);S("reset",snap());',
  ' window.phone("messages");await sleep(100);S("opened",snap());window.__closePhoneModal(true);await sleep(280);window.__repeatMsgBadgeCoach();S("afterOpened",snap());',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

function exercise(label, chromeFlags, expectedTop) {
  console.log(label + ":");
  var result = lib.runPageSync("rsvp.html", HARNESS, 6500, {
    patchRaf: true,
    forceMotion: true,
    chromeFlags: chromeFlags
  });
  if (!result) { check(false, "harness produced a report"); return; }
  var s = result.steps;
  check(result.errors.length === 0, "no uncaught page errors", result.errors);
  check(s.first.show && s.first.text === "New message. Tap to read." && s.first.badge && s.first.coached,
    "the first unread message shows the coach and its badge", s.first);
  check(s.first.bg.indexOf("255, 253, 248") !== -1 && s.first.color === "rgb(142, 58, 74)" && s.first.font.indexOf("Fraunces") !== -1,
    "the coach uses the shared cream, burgundy and Fraunces treatment", s.first);
  check(Math.abs(s.first.top - expectedTop) < 1 && s.first.arrowLong && s.first.arrowPoints && s.first.pathCount === 1,
    "the lowered card has one long coherent arrow meeting the unread badge", s.first);
  check(s.first.dismiss && s.first.dismissTab === -1 && s.first.dismissTopRight,
    "a non-Tab dismiss button sits in the upper-right corner", s.first);
  check(s.first.cardPointer === "none" && s.first.dismissPointer === "auto",
    "only the dismiss control takes input, leaving room navigation non-modal", s.first);
  check(s.repaint.show, "an ordinary badge repaint preserves the coach", s.repaint);
  check(s.navigation.show && s.navigation.room === "garden", "keyboard navigation works and the coach survives the room change", s.navigation);
  check(s.restoreLive.show && s.restoreLive.text === "New message. Tap to read.", "a checkpoint restores an introduced unacknowledged coach", s.restoreLive);
  check(s.czech.show && s.czech.text === "Nová zpráva. Klepni a přečti si ji.",
    "copy updates live in Czech", s.czech);
  check(!s.dismissed.show && !s.restoreDismissed.show,
    "the × retires the coach through checkpoint restore", { dismissed: s.dismissed, restored: s.restoreDismissed });
  check(s.reset.show && s.reset.lang === "cs", "a game reset re-arms the lesson", s.reset);
  check(!s.opened.show && !s.afterOpened.show, "opening Messages retires the coach without requiring its ×", { opened: s.opened, after: s.afterOpened });
  console.log("");
}

exercise("rsvp.html unread-message coach (desktop)", "--window-size=1100,900", 146);
exercise("rsvp.html unread-message coach (mobile landscape)", "--window-size=740,430", 146);

if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
