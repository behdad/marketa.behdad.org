#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__setSecondRound(true,{releaseHeld:false});window.__deliverPhoneMessage("pouria");window.__deliverPhoneMessage("group");',
  ' window.__setGardenParty(true,false);var photo=window.__albumAdd(true);window.__setGardenParty(false,true);',
  ' window.__openPhoneModal(true);await sleep(80);',
  ' var tiles=document.querySelectorAll(".phone-app-tile"),counts=window.__phoneNotificationCounts();',
  ' S("initial",{tiles:tiles.length,badges:document.querySelectorAll(".phone-app-tile .pat-badge").length,messages:counts.messages,mail:counts.mail,album:counts.album,photo:!!photo,zeroHidden:Array.prototype.every.call(tiles,function(tile){var n=+(tile.getAttribute("data-notification-count")||0),b=tile.querySelector(".pat-badge");return n>0?!b.hidden:b.hidden;})});',
  ' window.__deliverPhoneMessage("album");await sleep(40);var live=document.querySelector("#phone-app-messages .pat-badge");S("live",{count:+document.querySelector("#phone-app-messages").getAttribute("data-notification-count"),text:live&&live.textContent});',
  ' window.__openPhoneAppHere("album");await sleep(50);document.querySelector(".pnav-home").click();await sleep(50);S("albumSeen",{count:+document.querySelector("#phone-app-album").getAttribute("data-notification-count"),hidden:document.querySelector("#phone-app-album .pat-badge").hidden});',
  ' document.querySelector("#phone-app-mail").click();await sleep(30);var firstMail=document.querySelector(".pm-mail-row.unread");if(firstMail)firstMail.click();document.querySelector(".pnav-home").click();await sleep(40);S("mailRead",{count:+document.querySelector("#phone-app-mail").getAttribute("data-notification-count")});',
  ' window.__setLang("cs");await sleep(50);',
  ' document.querySelector("#phone-app-messages").click();await sleep(40);var beforeRows=document.querySelectorAll(".pm-msg-row").length,readAll=document.querySelector(".pm-msg-read-all"),titleLabel=document.querySelector(".pm-msg-title-label"),titleTools=document.querySelector(".pm-msg-title-tools"),labelRect=titleLabel&&titleLabel.getBoundingClientRect(),toolsRect=titleTools&&titleTools.getBoundingClientRect();var readAllLabel=readAll&&readAll.textContent;if(readAll)readAll.click();await sleep(30);S("readAll",{label:readAllLabel,labelRect:labelRect&&{left:labelRect.left,right:labelRect.right,height:labelRect.height},toolsRect:toolsRect&&{left:toolsRect.left,right:toolsRect.right,height:toolsRect.height},singleLine:!!(labelRect&&toolsRect&&labelRect.right<toolsRect.left),count:window.__phoneNotificationCounts().messages,rows:document.querySelectorAll(".pm-msg-row").length,beforeRows:beforeRows,unreadRows:document.querySelectorAll(".pm-msg-row.unread").length,disabled:!!(readAll&&readAll.disabled)});',
  ' window.__resetPhoneApps();await sleep(50);var reset=window.__phoneNotificationCounts();S("reset",{messages:reset.messages,mail:reset.mail,album:reset.album});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html phone launcher notification badges:");
var r = lib.runPageSync("loft-day.html", HARNESS, 8000, {
  patchRaf: true,
  // Keep the probe's two explicit messages isolated from the daytime-party BBQ invitation.
  urlSuffix: "?date=2026-07-15&time=23:00"
});
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.initial.tiles > 0 && s.initial.tiles === s.initial.badges, "every installed app tile owns a notification badge slot", s.initial);
check(s.initial.messages === 2 && s.initial.mail === 3 && s.initial.album === 1 && s.initial.photo, "Messages, Mail, and new Album photos project their real unread counts", s.initial);
check(s.initial.zeroHidden, "zero-count badges stay hidden while nonzero badges show", s.initial);
check(s.live.count === 3 && s.live.text === "3", "a message arriving on the launcher updates its badge in place", s.live);
check(s.albumSeen.count === 0 && s.albumSeen.hidden, "opening Album clears only its unseen-photo count", s.albumSeen);
check(s.mailRead.count === 2, "reading one Mail item decrements its launcher count", s.mailRead);
check(s.readAll.label === "✓ vše" && s.readAll.singleLine && s.readAll.count === 0 && s.readAll.rows === s.readAll.beforeRows && s.readAll.unreadRows === 0 && s.readAll.disabled, "the visible Czech mark-all control stays in the title row and clears the badge without deleting the thread", s.readAll);
check(s.reset.messages === 0 && s.reset.mail === 3 && s.reset.album === 0, "full reset restores each app's fresh count", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
