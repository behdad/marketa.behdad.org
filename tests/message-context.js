#!/usr/bin/env node
// Messages is a chronological group chat with contextual reply + read-state actions.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function menuLabels(){return [].slice.call(document.querySelectorAll(".message-read-ctx button span")).map(function(x){return x.textContent;});}',
  'function menuButtons(){return document.querySelectorAll(".message-read-ctx button");}',
  'function context(row){var r=row.getBoundingClientRect();var e=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:r.left+10,clientY:r.top+10});return !row.dispatchEvent(e);}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){',
  ' window.__secondRound=true;if(window.goToStage)window.goToStage("garden");await sleep(80);window.__deliverPhoneMessage("invaders");await sleep(40);var thumb=document.querySelector(".msg-thumb.show");if(thumb)thumb.click();await sleep(100);var notifBody=document.querySelector(".phone-app-body"),notifRow=document.querySelector(".pm-msg-row[data-message-id=invaders]");var nbr=notifBody&&notifBody.getBoundingClientRect(),nrr=notifRow&&notifRow.getBoundingClientRect();S("notification_open",{app:!!document.querySelector(".phone-shell.pm-app .pm-messages"),room:window.currentStageName,row:!!notifRow,visible:!!(nbr&&nrr&&nrr.bottom>nbr.top&&nrr.top<nbr.bottom),unread:!!(notifRow&&notifRow.classList.contains("unread"))});',
  ' var directInput=document.querySelector(".pm-msg-input");directInput.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));await sleep(260);S("notification_escape",{phone:!!document.querySelector(".phone-backdrop.show")});window.__openMessagesAt("invaders");await sleep(40);directInput=document.querySelector(".pm-msg-input");directInput.dispatchEvent(new KeyboardEvent("keydown",{key:"/",bubbles:true,cancelable:true}));var directSearch=document.activeElement;directSearch.dispatchEvent(new KeyboardEvent("keydown",{key:"Backspace",bubbles:true,cancelable:true}));await sleep(20);S("notification_backspace_one",{phone:!!document.querySelector(".phone-backdrop.show"),active:document.activeElement&&document.activeElement.className});document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"Backspace",bubbles:true,cancelable:true}));await sleep(260);S("notification_backspace_two",{phone:!!document.querySelector(".phone-backdrop.show")});window.__openMessagesAt("invaders");await sleep(60);notifRow=document.querySelector(".pm-msg-row[data-message-id=invaders]");if(notifRow)notifRow.click();await sleep(850);S("notification_action",{room:window.currentStageName,phone:!!document.querySelector(".phone-backdrop.show")});',
  ' window.__secondRound=true;window.__deliverPhoneMessage("cue_mail");if(window.__hideMessageThumb)window.__hideMessageThumb();window.phone("messages");await sleep(100);',
  ' S("keyboard_open",{active:document.activeElement&&document.activeElement.className,app:!!document.querySelector(".phone-shell.pm-app")});',
  ' document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"/",bubbles:true,cancelable:true}));await sleep(10);S("composer_slash_search",{active:document.activeElement&&document.activeElement.className,selected:document.activeElement&&document.activeElement.selectionStart===0});',
  ' var slashComposer=document.querySelector(".pm-msg-input");slashComposer.focus();slashComposer.value="hello";slashComposer.dispatchEvent(new Event("input",{bubbles:true}));var slashEvent=new KeyboardEvent("keydown",{key:"/",bubbles:true,cancelable:true});slashComposer.dispatchEvent(slashEvent);S("composer_slash_literal",{active:document.activeElement&&document.activeElement.className,prevented:slashEvent.defaultPrevented,draft:slashComposer.value});slashComposer.value="";slashComposer.dispatchEvent(new Event("input",{bubbles:true}));',
  ' document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));await sleep(10);S("keyboard_escape",{active:document.activeElement&&document.activeElement.className,app:!!document.querySelector(".phone-shell.pm-app")});',
  ' document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"/",bubbles:true,cancelable:true}));await sleep(10);S("keyboard_search",{active:document.activeElement&&document.activeElement.className,selected:document.activeElement&&document.activeElement.selectionStart===0});',
  ' var row=document.querySelector(".pm-msg-row[data-message-id=cue_mail]");var prevented=context(row);S("unread_menu",{prevented:prevented,labels:menuLabels(),unread:row.classList.contains("unread"),app:document.querySelector(".pah-title").textContent});',
  ' menuButtons()[1].click();await sleep(20);row=document.querySelector(".pm-msg-row[data-message-id=cue_mail]");S("marked_read",{unread:row.classList.contains("unread"),latest:window.__latestUnreadMessage(),app:document.querySelector(".pah-title").textContent});',
  ' context(row);S("read_menu",{labels:menuLabels()});menuButtons()[1].click();await sleep(20);row=document.querySelector(".pm-msg-row[data-message-id=cue_mail]");S("marked_unread",{unread:row.classList.contains("unread"),latest:window.__latestUnreadMessage()});',
  ' var aiResolve=null,asked=null;window.currentStageName="garden";window.__whoIsHere=function(room){return room==="garden"?[{name:"Bahareh"},{name:"Irene"}]:room==="kitchen"?[{name:"Pouria"}]:[];};window.__djB=true;window.__monitorGroupChatAsk=function(display,group,replyDisplay){asked={display:display,group:group,replyDisplay:replyDisplay};return new Promise(function(resolve){aiResolve=resolve;});};',
  ' context(row);menuButtons()[0].click();await sleep(20);var replying=document.querySelector(".pm-msg-replying");var composer=document.querySelector(".pm-msg-input");S("reply_selected",{show:replying.classList.contains("show"),text:replying.textContent,read:!document.querySelector(".pm-msg-row[data-message-id=cue_mail]").classList.contains("unread"),plus:!!document.querySelector(".pm-msg-compose"),unreadInTitle:!!document.querySelector(".pm-msg-title .pm-msg-unread")});',
  ' composer.value="Save me a dance!";composer.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector(".pm-msg-form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));await sleep(30);var ids=[].slice.call(document.querySelectorAll(".pm-msg-row")).map(function(x){return x.getAttribute("data-message-id");});var liveInput=document.querySelector(".pm-msg-input");S("waiting",{ids:ids,pending:!!document.querySelector(".pm-msg-row.pending"),thinking:/Charlie is thinking/i.test(document.querySelector(".pm-messages").textContent),inputEnabled:!!liveInput&&!liveInput.disabled,asked:asked,privateHistory:window.__monitorChatHistory&&window.__monitorChatHistory()});',
  ' aiResolve(JSON.stringify({sender:"Bahareh",text:"Of course. I saved you one!",action:null}));await sleep(40);ids=[].slice.call(document.querySelectorAll(".pm-msg-row")).map(function(x){return x.getAttribute("data-message-id");});var outgoing=document.querySelector(".pm-msg-row.outgoing"),crew=document.querySelector(".pm-msg-row[data-message-id=reply_ai_1]");S("answered",{ids:ids,outgoing:outgoing&&outgoing.querySelector(".pm-msg-text").textContent,quote:outgoing&&outgoing.querySelector(".pm-msg-quote").textContent,sender:crew&&crew.querySelector(".pm-msg-from").textContent,crew:crew&&crew.querySelector(".pm-msg-text").textContent,pending:!!document.querySelector(".pm-msg-row.pending")});',
  ' document.documentElement.lang="cs";if(window.refreshPhoneText)window.refreshPhoneText();await sleep(20);row=document.querySelector(".pm-msg-row[data-message-id=cue_mail]");context(row);S("czech",{labels:menuLabels(),placeholder:document.querySelector(".pm-msg-input").getAttribute("placeholder")});',
  ' if(window.__hideMessageReadMenu)window.__hideMessageReadMenu();window.phone("calendar");await sleep(40);var shell=document.querySelector(".phone-shell");shell.dispatchEvent(new KeyboardEvent("keydown",{key:"/",bubbles:true,cancelable:true}));await sleep(30);S("calendar_search",{active:document.activeElement&&document.activeElement.className,on:!!document.querySelector(".calx-search-btn.is-on")});',
  ' if(window.__closePhoneModal)window.__closePhoneModal(true);await sleep(260);document.body.dispatchEvent(new KeyboardEvent("keydown",{key:"z",bubbles:true,cancelable:true}));await sleep(40);S("z_open",{messages:!!document.querySelector(".phone-backdrop.show .pm-messages")});shell=document.querySelector(".phone-shell");if(shell)shell.focus();shell.dispatchEvent(new KeyboardEvent("keydown",{key:"z",bubbles:true,cancelable:true}));await sleep(260);S("z_close",{phone:!!document.querySelector(".phone-backdrop.show")});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html message read/unread context menu:");
var r = lib.runPageSync("rsvp.html", HARNESS, 4000, { patchRaf: true });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.notification_open.app && s.notification_open.room === "garden" && s.notification_open.row && s.notification_open.visible && s.notification_open.unread, "tapping a notification opens and positions its unread message without running the action", s.notification_open);
check(!s.notification_escape.phone && s.notification_backspace_one.phone && s.notification_backspace_one.active === "pm-msg-input" && !s.notification_backspace_two.phone, "Escape closes directly opened Messages; empty search then takes two Backspaces (composer, close)", {escape:s.notification_escape,one:s.notification_backspace_one,two:s.notification_backspace_two});
check(s.notification_action.room === "office" && !s.notification_action.phone, "the message action runs only after the row inside Messages is tapped", s.notification_action);
check(s.keyboard_open.active === "pm-msg-input" && s.keyboard_open.app, "Messages opens with the composer focused", s.keyboard_open);
check(s.composer_slash_search.active === "pm-ms-input" && s.composer_slash_search.selected, "/ moves an empty composer directly to Messages search", s.composer_slash_search);
check(s.composer_slash_literal.active === "pm-msg-input" && !s.composer_slash_literal.prevented && s.composer_slash_literal.draft === "hello", "/ remains literal when the composer already has a draft", s.composer_slash_literal);
check(/phone-shell/.test(s.keyboard_escape.active) && s.keyboard_escape.app, "first Escape blurs the composer without leaving Messages", s.keyboard_escape);
check(s.keyboard_search.active === "pm-ms-input" && s.keyboard_search.selected, "/ focuses and selects the Messages search field after leaving the composer", s.keyboard_search);
check(s.unread_menu.prevented && s.unread_menu.unread && s.unread_menu.labels.join("|") === "Reply…|Mark as read.", "an unread row offers Reply and Mark as read", s.unread_menu);
check(!s.marked_read.unread && s.marked_read.latest === null && /messages/i.test(s.marked_read.app), "marking read updates state without opening the message", s.marked_read);
check(s.read_menu.labels.join("|") === "Reply…|Mark as unread.", "a read row offers Reply and Mark as unread", s.read_menu);
check(s.marked_unread.unread && s.marked_unread.latest === "cue_mail", "marking unread restores unread state and count", s.marked_unread);
check(s.reply_selected.show && /Bahareh/.test(s.reply_selected.text) && s.reply_selected.read && !s.reply_selected.plus && s.reply_selected.unreadInTitle, "Reply targets the message, marks it read, removes +, and keeps unread-only in the title", s.reply_selected);
check(s.waiting.ids.join(",") === "invaders,cue_mail,reply_user_1" && !s.waiting.pending && !s.waiting.thinking && s.waiting.inputEnabled, "the visitor message appears immediately with no thinking placeholder and the composer remains usable", s.waiting);
check(s.waiting.asked && s.waiting.asked.display === "Save me a dance!" && s.waiting.asked.group.reply_to.sender === "Bahareh" && /did you check the mail/i.test(s.waiting.asked.group.reply_to.text) && s.waiting.asked.group.current_dj === "Danesh" && s.waiting.asked.group.people_here.join("|") === "Bahareh|Irene" && s.waiting.asked.group.locations.kitchen.join("|") === "Pouria", "the group responder receives the reply target, current room, and all-room locations", s.waiting.asked);
check(s.waiting.asked && s.waiting.asked.group.cast.some(function(p){return p.name === "Ali" && p.role === "best man";}) && s.waiting.asked.group.cast.some(function(p){return p.name === "Bahareh" && /herds/.test(p.notes);}) && s.waiting.asked.group.cast.some(function(p){return p.name === "Markéta" && /Behdad/.test(p.relationship);}), "the group responder receives cast roles, relationships, fun facts, and notes", s.waiting.asked && s.waiting.asked.group.cast);
check(Array.isArray(s.waiting.privateHistory) && s.waiting.privateHistory.length === 0, "the wedding-thread exchange stays out of Charlie's private chat history", s.waiting.privateHistory);
check(s.answered.ids.join(",") === "invaders,cue_mail,reply_user_1,reply_ai_1" && s.answered.outgoing === "Save me a dance!" && /Bahareh:/.test(s.answered.quote) && s.answered.sender === "Bahareh" && /saved you one/.test(s.answered.crew) && !s.answered.pending, "the asynchronous crew answer arrives as an ordinary chronological message", s.answered);
check(s.czech.labels.join("|") === "Odpov\u011bd\u011bt…|Ozna\u010dit jako nep\u0159e\u010dten\u00e9." && /svatebn\u00ed part\u011b/.test(s.czech.placeholder), "context actions and composer follow the Czech UI language", s.czech);
check(s.calendar_search.active === "calx-search-input" && s.calendar_search.on, "/ enters and focuses Calendar search even before its field exists", s.calendar_search);
check(s.z_open.messages && !s.z_close.phone, "Z toggles the Messages overlay when no text field owns the key", {open:s.z_open,close:s.z_close});

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
