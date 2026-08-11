#!/usr/bin/env node
// A one-finger hold on a Messages row opens its existing context menu without turning
// scrolling into a menu gesture or allowing the trailing synthetic click through.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function press(el,id,x,y){el.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:id,pointerType:"touch",isPrimary:true,button:0,buttons:1,clientX:x,clientY:y}));}',
  'function closeMenu(){document.body.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,clientX:1,clientY:1}));}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__secondRound=true;window.__deliverPhoneMessage("cue_mail");window.__deliverPhoneMessage("invaders");window.__loftControllers.phone.open("messages");await sleep(100);',
  ' var row=document.querySelector(".pm-msg-row[data-message-id=cue_mail]"),r=row.getBoundingClientRect(),x=r.left+20,y=r.top+20;',
  ' press(row,21,x,y);await sleep(620);document.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,pointerId:21,pointerType:"touch",isPrimary:true,button:0,clientX:x,clientY:y}));var click=new MouseEvent("click",{bubbles:true,cancelable:true,clientX:x,clientY:y});var clickPrevented=!row.dispatchEvent(click);S("hold",{menu:!!document.querySelector(".message-read-ctx"),clickPrevented:clickPrevented,unread:row.classList.contains("unread")});',
  ' closeMenu();await sleep(20);press(row,22,x,y);document.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:22,pointerType:"touch",isPrimary:true,buttons:1,clientX:x+20,clientY:y}));await sleep(620);var moveClick=new MouseEvent("click",{bubbles:true,cancelable:true,clientX:x+20,clientY:y});row.dispatchEvent(moveClick);S("move_cancel",{menu:!!document.querySelector(".message-read-ctx"),unread:row.classList.contains("unread"),clickPrevented:moveClick.defaultPrevented});',
  ' row=document.querySelector(".pm-msg-row[data-message-id=invaders]");r=row.getBoundingClientRect();x=r.left+20;y=r.top+20;press(row,23,x,y);document.querySelector(".pm-msg-list").dispatchEvent(new Event("scroll"));await sleep(620);S("scroll_cancel",{menu:!!document.querySelector(".message-read-ctx"),unread:row.classList.contains("unread")});',
  ' var ctx=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:x,clientY:y});var ctxPrevented=!row.dispatchEvent(ctx);S("right_click",{prevented:ctxPrevented,menu:!!document.querySelector(".message-read-ctx")});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Messages long-press:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3500, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.hold.menu && s.hold.clickPrevented && s.hold.unread, "a one-finger hold opens the menu and suppresses its trailing click", s.hold);
check(!s.move_cancel.menu && !s.move_cancel.unread && !s.move_cancel.clickPrevented, "movement cancels the hold without swallowing the ordinary click", s.move_cancel);
check(!s.scroll_cancel.menu && s.scroll_cancel.unread, "scrolling cancels the hold without changing message state", s.scroll_cancel);
check(s.right_click.prevented && s.right_click.menu, "right-click still opens the same context menu", s.right_click);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
