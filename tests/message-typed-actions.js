#!/usr/bin/env node
// Authored Messages actions execute through loft.api without changing row-click or Back behavior.
"use strict";

var fs = require("fs");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'var report={errors:[],steps:{}};function S(key,value){report.steps[key]=value;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){',
  ' window.__secondRound=true;window.__maxUnlocked=function(){return 4;};var calls=[],events=[];window.addEventListener("loft:statechange",function(event){events.push(event.detail);});window.goToStage=function(room){window.currentStageName=room;calls.push("room:"+room);};window.currentStageName="garden";if(window.__setGardenParty)window.__setGardenParty(true,false);',
  ' window.__deliverPhoneMessage("pouria");if(window.__hideMessageThumb)window.__hideMessageThumb();window.__openMessagesAt("pouria");await sleep(50);var row=document.querySelector(".pm-msg-row[data-message-id=pouria]"),button=row&&row.querySelector(".pm-msg-act");if(row)row.click();await sleep(20);S("row_click",{room:window.currentStageName,phone:!!document.querySelector(".phone-backdrop.show"),read:!!(row&&!row.classList.contains("unread")),action:!!button,bubbleAction:!!(row&&row.querySelector(".pm-msg-bubble.actionable"))});if(button)button.click();await sleep(60);S("room_action",{room:window.currentStageName,phone:!!document.querySelector(".phone-backdrop.show"),calls:calls.slice(),events:events.slice()});',
  ' window.__deliverPhoneMessage("cue_cocktails");if(window.__hideMessageThumb)window.__hideMessageThumb();window.__openMessagesAt("cue_cocktails");await sleep(50);var cocktailButton=document.querySelector(".pm-msg-row[data-message-id=cue_cocktails] .pm-msg-act");if(cocktailButton)cocktailButton.click();await sleep(50);S("app_action",{cocktails:!!document.querySelector(".phone-backdrop.show .pm-ck-feat")});var back=document.querySelector(".pnav-back");if(back)back.click();await sleep(50);var usedCocktail=document.querySelector(".pm-msg-row[data-message-id=cue_cocktails] .pm-msg-act");S("app_back",{messages:!!document.querySelector(".phone-backdrop.show .pm-messages"),home:!!document.querySelector(".phone-shell.pm-home"),used:!!(usedCocktail&&usedCocktail.classList.contains("used")),background:usedCocktail&&getComputedStyle(usedCocktail).backgroundColor});',
  ' window.__maxUnlocked=function(){return 0;};window.currentStageName="kitchen";window.__deliverPhoneMessage("group");if(window.__hideMessageThumb)window.__hideMessageThumb();window.__openMessagesAt("group");await sleep(50);var groupButton=document.querySelector(".pm-msg-row[data-message-id=group] .pm-msg-act");if(groupButton)groupButton.click();await sleep(60);var failed=document.querySelector(".pm-msg-row[data-message-id=group]"),failedButton=failed&&failed.querySelector(".pm-msg-act");S("failure",{room:window.currentStageName,phone:!!document.querySelector(".phone-backdrop.show"),messages:!!document.querySelector(".pm-messages"),error:failed&&failed.querySelector(".pm-msg-action-error")&&failed.querySelector(".pm-msg-action-error").textContent,retry:!!failedButton,used:!!(failedButton&&failedButton.classList.contains("used"))});',
  ' window.__maxUnlocked=function(){return 4;};window.__firstDanceOn=false;window.__slowDanceOn=false;window.__toastsOn=false;window.__groupPhotoOn=false;window.__sparklersOn=false;window.__cakeOn=false;window.__bouquetOn=false;window.__chairLiftOn=false;window.firstdance=function(){calls.push("first-dance");};window.__deliverPhoneMessage("firstdance");if(window.__hideMessageThumb)window.__hideMessageThumb();window.__openMessagesAt("firstdance");await sleep(50);var momentButton=document.querySelector(".pm-msg-row[data-message-id=firstdance] .pm-msg-act");if(momentButton)momentButton.click();await sleep(60);S("moment",{phone:!!document.querySelector(".phone-backdrop.show"),calls:calls.slice(),events:events.slice()});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html authored typed message actions:");
var source = fs.readFileSync("rsvp.html", "utf8");
var result = lib.runPageSync("rsvp.html", HARNESS, 3600, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.row_click.room === "garden" && s.row_click.phone && s.row_click.read && s.row_click.action && !s.row_click.bubbleAction, "row click only marks an authored action read; its arrow remains explicit", s.row_click);
check(s.room_action.room === "kitchen" && !s.room_action.phone && s.room_action.events.some(function(event){return event.id === "room.go" && event.source === "messages-chat";}), "an authored room link executes through room.go and closes Messages", s.room_action);
check(s.app_action.cocktails && s.app_back.messages && !s.app_back.home, "an authored phone-app link returns to Messages through Back", {action:s.app_action,back:s.app_back});
check(s.app_back.used && s.app_back.background === "rgba(0, 0, 0, 0)", "a successful reusable action returns with its burgundy button fill cleared", s.app_back);
check(s.failure.room === "kitchen" && s.failure.phone && s.failure.messages && /couldn.t do/i.test(s.failure.error || "") && s.failure.retry && !s.failure.used, "an unavailable authored action stays burgundy and retryable", s.failure);
check(!s.moment.phone && s.moment.calls.includes("first-dance") && s.moment.events.some(function(event){return event.id === "garden.moment.start" && event.args.moment === "first-dance" && event.source === "messages-chat";}), "an authored party moment executes through its typed semantic action", s.moment);
check(/LEGACY_TYPED_MSG_ACTIONS[\s\S]*"room:kitchen"[\s\S]*firstdance/.test(source), "the legacy room and party-moment vocabulary remains adapted", null);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
