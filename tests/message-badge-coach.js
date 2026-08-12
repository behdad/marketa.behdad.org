#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function finishGuide(){if(window.__endAttract)window.__endAttract();for(var i=0;i<2;i++){if(!(window.__openingGuideShowing&&window.__openingGuideShowing()))break;var x=document.querySelector("#opening-guide-coach .hunt-coach-x");if(x)x.click();}}',
  'function snap(){var coach=document.querySelector(".msg-badge-coach"),card=coach&&coach.querySelector(".hunt-coach-card"),copy=coach&&coach.querySelector(".msg-badge-coach-copy"),dismiss=coach&&coach.querySelector(".msg-badge-coach-dismiss"),arrow=coach&&coach.querySelector(".hunt-coach-arrow"),badge=document.querySelector(".msg-badge"),area=document.getElementById("hunt-fullscreen-area"),cr=card&&card.getBoundingClientRect(),xr=dismiss&&dismiss.getBoundingClientRect(),br=badge&&badge.getBoundingClientRect(),rr=area&&area.getBoundingClientRect(),cs=card&&getComputedStyle(card),p=br&&[br.left+br.width/2,br.top+br.height/2],hit=p&&document.elementFromPoint(p[0],p[1]),box=arrow&&arrow.getBBox(),arrowDx=box&&br&&(rr.left+box.x+box.width/2)-(br.left+br.width/2),arrowDy=box&&br&&(rr.top+box.y)-(br.bottom+3),scrims=coach&&[].slice.call(coach.querySelectorAll(".modal-coach-scrim"));return {show:!!(coach&&coach.classList.contains("show")),text:copy&&copy.textContent,lang:document.documentElement.lang,pathCount:arrow?1:0,dismiss:!!dismiss,dismissTab:dismiss&&dismiss.tabIndex,dismissTopRight:!!(cr&&xr&&xr.top-cr.top<18&&cr.right-xr.right<18),cardPointer:cs&&cs.pointerEvents,overlayPointer:coach&&getComputedStyle(coach).pointerEvents,bg:cs&&cs.backgroundColor,color:cs&&cs.color,font:cs&&cs.fontFamily,cardLarge:!!(cr&&rr&&cr.width>=rr.width*.72&&cr.height>=rr.height*.35),cardInside:!!(cr&&rr&&cr.left>=rr.left-1&&cr.right<=rr.right+1&&cr.top>=rr.top-1&&cr.bottom<=rr.bottom+1),scrims:scrims&&scrims.length,scrimReady:!!(scrims&&scrims.every(function(el){return getComputedStyle(el).pointerEvents==="auto"&&getComputedStyle(el).backgroundColor==="rgba(0, 0, 0, 0)";})),targetHit:!!(hit&&hit.closest&&hit.closest(".msg-badge")),targetLayer:badge&&getComputedStyle(badge).zIndex,arrowDx:arrowDx,arrowDy:arrowDy,arrowPoints:!!(box&&Math.abs(arrowDx)<1&&Math.abs(arrowDy)<1),badge:!!(badge&&badge.classList.contains("show")),coached:!!(badge&&badge.classList.contains("coached")),modal:!!(window.__msgBadgeCoachModalActive&&window.__msgBadgeCoachModalActive()),music:!!(window.__anySongPlaying&&window.__anySongPlaying()),room:window.__currentStageName};}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' finishGuide();window.__secondRound=true;if(window.__stopCueDrip)window.__stopCueDrip();window.__deliverPhoneMessage("cue_mail");if(window.__hideMessageThumb)window.__hideMessageThumb();window.__repeatMsgBadgeCoach();await sleep(80);S("first",snap());',
  ' window.__updateMsgBadge();await sleep(30);S("repaint",snap());',
  ' window.__unlockAllRooms();document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true,cancelable:true}));await sleep(900);S("navigation",snap());',
  ' var live=window.__checkpointPhoneCapture();window.__resetPhoneApps();window.__checkpointPhoneRestore(live);await sleep(80);S("restoreLive",snap());',
  ' window.__setLang("cs");await sleep(60);S("czech",snap());',
  ' var space=new KeyboardEvent("keydown",{key:" ",code:"Space",bubbles:true,cancelable:true});document.dispatchEvent(space);await sleep(40);var retired=window.__checkpointPhoneCapture();var dismissed=snap();dismissed.spacePrevented=space.defaultPrevented;S("dismissed",dismissed);',
  ' window.__resetPhoneApps();window.__checkpointPhoneRestore(retired);window.__repeatMsgBadgeCoach();await sleep(60);S("restoreDismissed",snap());',
  ' window.__resetPhoneApps();window.__deliverPhoneMessage("cue_mail");if(window.__hideMessageThumb)window.__hideMessageThumb();window.__repeatMsgBadgeCoach();await sleep(60);S("reset",snap());',
  ' window.__loftControllers.phone.open("messages");await sleep(100);S("opened",snap());window.__closePhoneModal(true);await sleep(280);window.__repeatMsgBadgeCoach();S("afterOpened",snap());',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

function exercise(label, chromeFlags) {
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
  check(s.first.bg.indexOf("255, 253, 248") !== -1 && s.first.color === "rgb(142, 58, 74)" && s.first.font.indexOf("Fraunces") !== -1 && s.first.cardLarge && s.first.cardInside,
    "the coach uses the shared large cream, burgundy and Fraunces card", s.first);
  check(s.first.arrowPoints && s.first.pathCount === 1,
    "one coherent arrow meets the unread badge", s.first);
  check(s.first.dismiss && s.first.dismissTab === -1 && s.first.dismissTopRight,
    "a non-Tab dismiss button sits in the upper-right corner", s.first);
  check(s.first.cardPointer === "auto" && s.first.overlayPointer === "none" && s.first.modal &&
    s.first.scrims === 4 && s.first.scrimReady && s.first.targetLayer === "65",
    "four scrims block the shell while the unread badge stays live", s.first);
  check(s.repaint.show, "an ordinary badge repaint preserves the coach", s.repaint);
  check(s.navigation.show && s.navigation.room === "kitchen", "keyboard room navigation is blocked while the coach owns attention", s.navigation);
  check(s.restoreLive.show && s.restoreLive.text === "New message. Tap to read.", "a checkpoint restores an introduced unacknowledged coach", s.restoreLive);
  check(s.czech.show && s.czech.text === "Nová zpráva. Klikni pro přečtení.",
    "copy updates live in Czech", s.czech);
  check(s.dismissed.spacePrevented && s.dismissed.music === s.czech.music && !s.dismissed.show && !s.restoreDismissed.show,
    "Space consumes and retires the coach through checkpoint restore", { dismissed: s.dismissed, restored: s.restoreDismissed });
  check(s.reset.show && s.reset.lang === "cs", "a game reset re-arms the lesson", s.reset);
  check(!s.opened.show && !s.afterOpened.show, "opening Messages retires the coach without requiring its ×", { opened: s.opened, after: s.afterOpened });
  console.log("");
}

exercise("rsvp.html unread-message coach (desktop)", "--window-size=1100,900");
exercise("rsvp.html unread-message coach (mobile landscape)", "--window-size=740,430");

if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
