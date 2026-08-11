#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var report = { steps: {}, errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function step(name, value) { report.steps[name] = value; }
  function latestUnread() {
    var rows = document.querySelectorAll(".pm-msg-row.unread");
    return rows.length ? rows[rows.length - 1].getAttribute("data-message-id") : null;
  }
  function finish() {
    report.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(report); document.body.appendChild(pre);
  }
  window.addEventListener("load", function () {
    setTimeout(function () { run().catch(function (error) { window.__errs.push("harness: " + String(error && error.stack || error)); }).then(finish); }, 300);
  });
  async function run() {
    window.__secondRound = true;
    window.__gameStarted = function () { return true; };
    if (window.__goToStage) window.__goToStage("office");
    var monitor = document.getElementById("office-monitor");
    monitor.classList.add("here", "screen-on", "show-caps");
    window.__monitorChatTurnstile = function () { return Promise.resolve("test-token"); };
    var chatAttempts = 0;
    window.__monitorChatTransport = function () {
      chatAttempts++;
      return chatAttempts === 1 ? Promise.reject(new Error("offline")) : Promise.resolve(JSON.stringify({ text: "Recovered.", action: null }));
    };
    window.__openMonitorApp("chat");
    await sleep(30);
    var failedChat = window.__monitorChatAsk("Can you hear me?"); failedChat.catch(function () {});
    await sleep(80);
    var chatLog = document.getElementById("monitor-chat-log");
    step("chat_failed", {
      attempts: chatAttempts,
      users: chatLog.querySelectorAll(".chat-msg.user").length,
      thinking: !!chatLog.querySelector(".chat-state:not(.error)"),
      error: !!chatLog.querySelector(".chat-state.error"),
      retry: !!chatLog.querySelector(".chat-retry")
    });
    chatLog.querySelector(".chat-retry").click();
    await sleep(80);
    step("chat_retried", {
      attempts: chatAttempts,
      users: chatLog.querySelectorAll(".chat-msg.user").length,
      recovered: /Recovered\./.test(chatLog.textContent),
      retry: !!chatLog.querySelector(".chat-retry")
    });

    if (window.__resetPhoneApps) window.__resetPhoneApps();
    var groupAttempts = 0;
    window.__monitorGroupChatAsk = function () {
      groupAttempts++;
      return groupAttempts === 1 ? Promise.reject(new Error("offline")) : Promise.resolve(JSON.stringify({ sender: "Bahareh", text: "I hear you now.", reply_to_id: null, action: null }));
    };
    window.__openMessagesAt(null);
    window.__loftControllers.message("Save me a dance!");
    await sleep(80);
    var outgoing = document.querySelector(".pm-msg-row.outgoing");
    step("messages_failed", {
      attempts: groupAttempts,
      outgoing: outgoing && outgoing.querySelector(".pm-msg-text").textContent,
      rows: document.querySelectorAll(".pm-msg-row").length,
      thinking: !!document.querySelector(".pm-msg-row.pending,.chat-state"),
      error: !!(outgoing && outgoing.querySelector(".pm-msg-request-error")),
      retry: !!(outgoing && outgoing.querySelector(".pm-msg-retry"))
    });
    outgoing.querySelector(".pm-msg-retry").click();
    await sleep(80);
    step("messages_retried", {
      attempts: groupAttempts,
      outgoing: document.querySelectorAll(".pm-msg-row.outgoing").length,
      answer: document.querySelector(".pm-msg-row[data-message-id=reply_ai_1] .pm-msg-text") && document.querySelector(".pm-msg-row[data-message-id=reply_ai_1] .pm-msg-text").textContent,
      error: !!document.querySelector(".pm-msg-request-error")
    });

    if (window.__closePhoneModal) window.__closePhoneModal(true);
    var flags = ["__firstDanceOn", "__slowDanceOn", "__toastsOn", "__groupPhotoOn", "__sparklersOn", "__cakeOn", "__bouquetOn"];
    var gates = [];
    flags.forEach(function (flag) {
      if (window.__resetPhoneApps) window.__resetPhoneApps();
      window.__secondRound = true; window[flag] = true;
      var accepted = window.__deliverAutonomousPhoneMessage("cue_mail");
      gates.push({ flag: flag, accepted: accepted, held: window.__deferredPhoneMessages().indexOf("cue_mail") !== -1, delivered: window.__phoneMessageReceived("cue_mail") });
      window[flag] = false;
      window.__flushDeferredPhoneMessages();
      gates[gates.length - 1].flushed = window.__phoneMessageReceived("cue_mail");
    });
    if (window.__resetPhoneApps) window.__resetPhoneApps();
    window.__secondRound = true; window.__firstDanceOn = true;
    var direct = window.__deliverPhoneMessage("cue_calendar");
    step("moment_delivery", { gates: gates, direct: direct, directReceived: window.__phoneMessageReceived("cue_calendar"), directDeferred: window.__deferredPhoneMessages().indexOf("cue_calendar") !== -1 });
    window.__firstDanceOn = false;

    if (window.__resetPhoneApps) window.__resetPhoneApps();
    if (window.__closePhoneModal) window.__closePhoneModal(true);
    await sleep(250);
    window.__gardenPartyOn = true;
    window.__loftControllers.roster.set(true);
    var rosterAutonomous = window.__deliverAutonomousPhoneMessage("cue_mail");
    var rosterDirect = window.__deliverPhoneMessage("cue_calendar");
    step("roster_hold", {
      accepted: rosterAutonomous,
      held: window.__deferredPhoneMessages().indexOf("cue_mail") !== -1,
      autonomousDelivered: window.__phoneMessageReceived("cue_mail"),
      direct: rosterDirect && window.__phoneMessageReceived("cue_calendar"),
      thumb: !!document.querySelector(".msg-thumb.show"),
      badge: !!document.querySelector(".msg-badge.show"),
      balconyBadge: document.getElementById("balcony-phone-badge").style.display
    });
    window.__loftControllers.roster.set(false);
    window.__flushDeferredPhoneMessages();
    step("roster_release", {
      autonomousDelivered: window.__phoneMessageReceived("cue_mail"),
      badge: !!document.querySelector(".msg-badge.show")
    });
    window.__gardenPartyOn = false;

    if (window.__resetPhoneApps) window.__resetPhoneApps();
    if (window.__closePhoneModal) window.__closePhoneModal(true);
    window.__secondRound = true;
    window.__deliverPhoneMessage("cue_mail");
    window.__loftStateChanged("minigame.change", { game: "invaders", active: true }, "ui");
    window.__deliverPhoneMessage("cue_calendar");
    window.__loftStateChanged("minigame.change", { game: "window-tetris", active: true }, "ui");
    var heldDuring = window.__messageNotificationsHeld();
    step("action_game_hold", {
      received: window.__phoneMessageReceived("cue_mail") && window.__phoneMessageReceived("cue_calendar"),
      games: heldDuring.active.slice().sort(),
      messages: heldDuring.messages.slice().sort(),
      thumb: !!document.querySelector(".msg-thumb.show"),
      badge: !!document.querySelector(".msg-badge.show"),
      balconyBadge: document.getElementById("balcony-phone-badge").style.display
    });
    window.__loftStateChanged("minigame.change", { game: "invaders", active: false }, "ui");
    await sleep(520);
    step("action_game_overlap", {
      held: window.__messageNotificationsHeld(),
      thumb: !!document.querySelector(".msg-thumb.show"),
      badge: !!document.querySelector(".msg-badge.show")
    });
    window.__loftStateChanged("minigame.change", { game: "window-tetris", active: false }, "ui");
    await sleep(520);
    step("action_game_release", {
      held: window.__messageNotificationsHeld(),
      thumb: !!document.querySelector(".msg-thumb.show"),
      badge: !!document.querySelector(".msg-badge.show"),
      body: document.querySelector(".msg-thumb-body") && document.querySelector(".msg-thumb-body").textContent
    });

    if (window.__resetPhoneApps) window.__resetPhoneApps();
    window.__secondRound = true; window.__gardenPartyOn = true;
    var attended = 0, realPartyLifecycleState = window.__partyLifecycleState;
    window.__partyLifecycleState = function () { return { attended: attended }; };
    var formalAccepted = window.__deliverAutonomousPhoneMessage("bouquet");
    step("formal_early", {
      accepted: formalAccepted,
      ready: window.__formalMomentMessagesReady(),
      held: window.__deferredPhoneMessages().indexOf("bouquet") !== -1,
      delivered: window.__phoneMessageReceived("bouquet")
    });
    attended = 45;
    window.__flushDeferredPhoneMessages();
    step("formal_mature", {
      ready: window.__formalMomentMessagesReady(),
      delivered: window.__phoneMessageReceived("bouquet")
    });
    window.__partyLifecycleState = realPartyLifecycleState;

    window.__gardenPartyOn = false;
    if (window.__resetPhoneApps) window.__resetPhoneApps();
    window.__secondRound = true;
    window.__gardenPartyOn = true;
    window.__deliverPhoneMessage("firstdance");
    window.__deliverPhoneMessage("cue_calendar");
    if (window.__hideMessageThumb) window.__hideMessageThumb();
    window.__openMessagesAt(null);
    await sleep(40);
    var staleBefore = window.__chatMessagesSummary();
    var momentBefore = !!document.querySelector(".pm-msg-row[data-message-id=firstdance] .pm-msg-act");
    window.__gardenPartyOn = false;
    window.__expireStaleMessageActions();
    await sleep(40);
    var staleAfter = window.__chatMessagesSummary();
    step("action_expiry", {
      beforeUnread: staleBefore.unread,
      afterUnread: staleAfter.unread,
      state: window.__messageActionState("firstdance"),
      retained: window.__phoneMessageThread().indexOf("firstdance") !== -1,
      momentBefore: momentBefore,
      momentAfter: !!document.querySelector(".pm-msg-row[data-message-id=firstdance] .pm-msg-act"),
      calendarAfter: !!document.querySelector(".pm-msg-row[data-message-id=cue_calendar] .pm-msg-act"),
      latest: latestUnread()
    });

    if (window.__resetPhoneApps) window.__resetPhoneApps();
    window.__secondRound = true;
    window.__monitorGroupChatAsk = function (text) { return Promise.resolve(JSON.stringify({ sender: "Charlie", text: "Reply to " + text, reply_to_id: null, action: null })); };
    for (var i = 1; i <= 23; i++) window.__loftControllers.message("Question " + i);
    await sleep(180);
    var beforeAuthored = window.__phoneMessageThread();
    for (var n = 0; n < 12; n++) window.__nextPhoneNudge();
    var retained = window.__phoneMessageThread();
    var pairs = {}, paired = true;
    retained.forEach(function (id) {
      var match = /^reply_(user|ai)_(\d+)$/.exec(id);
      if (match) { pairs[match[2]] = pairs[match[2]] || {}; pairs[match[2]][match[1]] = true; }
    });
    Object.keys(pairs).forEach(function (id) { if (!pairs[id].user || !pairs[id].ai) paired = false; });
    step("retention", {
      before: beforeAuthored.length,
      after: retained.length,
      allConversation: retained.every(function (id) { return /^reply_(?:user|ai)_/.test(id); }),
      paired: paired,
      newestUser: retained.indexOf("reply_user_23") !== -1,
      newestAi: retained.indexOf("reply_ai_23") !== -1
    });
  }
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html message resilience:");
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.chat_failed.attempts === 1 && s.chat_failed.users === 1 && !s.chat_failed.thinking && s.chat_failed.error && s.chat_failed.retry, "Chat keeps the failed turn and exposes Retry instead of leaving a thinking state", s.chat_failed);
check(s.chat_retried.attempts === 2 && s.chat_retried.users === 1 && s.chat_retried.recovered && !s.chat_retried.retry, "Chat Retry reuses the failed turn without duplicating the visitor message", s.chat_retried);
check(s.messages_failed.attempts === 1 && s.messages_failed.outgoing === "Save me a dance!" && s.messages_failed.rows === 1 && !s.messages_failed.thinking && s.messages_failed.error && s.messages_failed.retry, "Messages keeps the sent row and paints an ordinary failed/retry affordance", s.messages_failed);
check(s.messages_retried.attempts === 2 && s.messages_retried.outgoing === 1 && s.messages_retried.answer === "I hear you now." && !s.messages_retried.error, "Messages Retry resolves the same exchange without duplicating the sent row", s.messages_retried);
check(s.moment_delivery.gates.every(function (gate) { return gate.accepted && gate.held && !gate.delivered && gate.flushed; }), "all authored major moments defer and later release autonomous texts", s.moment_delivery.gates);
check(s.moment_delivery.direct && s.moment_delivery.directReceived && !s.moment_delivery.directDeferred, "explicit message delivery stays immediate during a major moment", s.moment_delivery);
check(s.roster_hold.accepted && s.roster_hold.held && !s.roster_hold.autonomousDelivered && s.roster_hold.direct && !s.roster_hold.thumb && !s.roster_hold.badge && s.roster_hold.balconyBadge === "none",
  "Who's here holds autonomous arrivals and suppresses every message notification surface", s.roster_hold);
check(s.roster_release.autonomousDelivered && s.roster_release.badge, "closing Who's here resumes the held queue and restores the unread badge", s.roster_release);
check(s.action_game_hold.received && s.action_game_hold.games.join(",") === "invaders,window-tetris" &&
  s.action_game_hold.messages.join(",") === "cue_calendar,cue_mail" && !s.action_game_hold.thumb &&
  !s.action_game_hold.badge && s.action_game_hold.balconyBadge === "none",
  "overlapping action games keep arrivals unread while suppressing notification previews and badges", s.action_game_hold);
check(s.action_game_overlap.held.active.length === 1 && s.action_game_overlap.held.active[0] === "window-tetris" &&
  !s.action_game_overlap.thumb && !s.action_game_overlap.badge,
  "ending one action game does not release notifications while another remains active", s.action_game_overlap);
check(!s.action_game_release.held.active.length && !s.action_game_release.held.messages.length &&
  s.action_game_release.thumb && s.action_game_release.badge && /calendar/i.test(s.action_game_release.body || ""),
  "ending the final action game restores the unread badge and previews the latest held message", s.action_game_release);
check(s.formal_early.accepted && !s.formal_early.ready && s.formal_early.held && !s.formal_early.delivered,
  "formal-moment texts wait through the party's opening stretch", s.formal_early);
check(s.formal_mature.ready && s.formal_mature.delivered, "formal-moment texts release after 45 attended party seconds", s.formal_mature);
check(s.action_expiry.beforeUnread === 2 && s.action_expiry.afterUnread === 2 && s.action_expiry.state === "expired" &&
  s.action_expiry.retained && s.action_expiry.momentBefore && !s.action_expiry.momentAfter &&
  s.action_expiry.calendarAfter && s.action_expiry.latest === "cue_calendar",
  "party-bound actions expire without marking unread messages read, while still-applicable messages keep their action", s.action_expiry);
check(s.retention.before === 40 && s.retention.after === 40 && s.retention.allConversation && s.retention.paired && s.retention.newestUser && s.retention.newestAi, "the bounded thread evicts authored chatter before complete visitor/AI turns", s.retention);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");
