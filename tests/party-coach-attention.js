#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: (window.__errs || []).slice(), steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function visible(selector) {
    var node = document.querySelector(selector);
    return !!(node && node.classList.contains("show"));
  }
  function snap(name) {
    var overlay = document.getElementById("party-switch-coach");
    report.steps[name] = {
      room: window.__currentStageName,
      party: !!window.__gardenPartyOn,
      coach: !!(window.__partySwitchCoachModalActive && window.__partySwitchCoachModalActive()),
      coachDue: !!(window.__partyLifecycleState && window.__partyLifecycleState().switchCoachSeen),
      messageCoach: visible(".msg-badge-coach"),
      thumb: visible(".msg-thumb"),
      ring: visible(".call-ring"),
      hold: window.__messageNotificationsHeld ? window.__messageNotificationsHeld() : null,
      heldCalls: window.__heldPartyCoachCalls ? window.__heldPartyCoachCalls() : [],
      dungeon: document.querySelector(".hunt-viewport").classList.contains("prince-basement-open"),
      navBlocked: getComputedStyle(document.getElementById("hunt-next")).pointerEvents === "none",
      scrim: getComputedStyle(overlay.querySelector(".party-switch-scrim-top")).display
    };
  }
  async function run() {
    Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
    if (window.__endAttract) window.__endAttract();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setGardenParty(true, false);
    window.__goToStage("garden");

    window.__deliverPhoneMessage("cue_mail");
    await sleep(40);
    window.__showPartySwitchCoach();
    snap("popupBeforeCoach");
    window.__goToStage("kitchen");
    window.__goToStage("garden");
    await sleep(40);
    snap("popupOnReentry");
    window.__hideMessageThumb();
    await sleep(820);
    snap("popupCleared");
    var switchBox = document.getElementById("garden-lightswitch").getBoundingClientRect();
    var switchHit = document.elementFromPoint(switchBox.left + switchBox.width / 2,
      switchBox.top + switchBox.height / 2);
    report.steps.popupCleared.switchHole = !!(switchHit && switchHit.closest &&
      switchHit.closest("#garden-lightswitch"));
    await sleep(720);
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "ArrowRight", code: "ArrowRight", bubbles: true, cancelable: true
    }));
    await sleep(40);
    snap("navigationAway");
    await sleep(720);
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "ArrowLeft", code: "ArrowLeft", bubbles: true, cancelable: true
    }));
    await sleep(40);
    snap("coachDuringReturnPan");
    await sleep(760);
    snap("coachOnReturn");
    window.__openGardenPrince();
    await sleep(80);
    snap("coachInDungeon");
    window.__closeMonitorPrince();
    await sleep(40);
    snap("coachDuringDungeonReturn");
    await sleep(760);
    snap("coachAfterDungeon");
    window.__deliverPhoneMessage("cue_calendar");
    await sleep(30);
    if (window.__repeatMsgBadgeCoach) window.__repeatMsgBadgeCoach();
    snap("messageDuringCoach");
    document.querySelector("#party-switch-coach .hunt-coach-x").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    await sleep(40);
    snap("messageCoachAfterDismiss");
    await sleep(540);
    snap("messageReleased");
    window.__hideMessageThumb();
    await sleep(100);
    snap("messageCoachReleased");
    if (window.__dismissMsgBadgeCoach) window.__dismissMsgBadgeCoach();

    window.__resetPartyExitHint();
    window.__goToStage("garden");
    window.__madlaRingForced();
    await sleep(30);
    window.__showPartySwitchCoach();
    snap("callBeforeCoach");
    window.__hideCallRing();
    window.__hideMessageThumb();
    await sleep(260);
    snap("callCleared");
    window.__madlaRingForced();
    await sleep(30);
    snap("callDuringCoach");
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter", code: "Enter", bubbles: true, cancelable: true
    }));
    await sleep(680);
    snap("enterReleasedCall");

    window.__hideCallRing();
    window.__hideMessageThumb();
    window.__resetPartyExitHint();
    window.__goToStage("garden");
    window.__showPartySwitchCoach();
    await sleep(40);
    document.getElementById("garden-lightswitch").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    await sleep(3400);
    snap("switchEndsParty");
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { report.errors.push(String(error && error.stack || error)); })
        .then(function () {
          report.errors = (window.__errs || []).concat(report.errors || []);
          document.getElementById("__report").textContent = JSON.stringify(report);
        });
    }, 260);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 14500, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?fresh=party-coach-attention"
});
var failed = false;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
function step(name) { return result && result.steps && result.steps[name]; }

console.log("loft-day.html party coach attention ownership:");
check(result && result.errors.length === 0, "attention probe has no page errors", result && result.errors);
var popupBefore = step("popupBeforeCoach"), popupReentry = step("popupOnReentry"), popupCleared = step("popupCleared");
check(popupBefore && popupBefore.thumb && popupBefore.coachDue && !popupBefore.coach,
  "a visible notification keeps the due switch coach off-screen", popupBefore);
check(popupReentry && popupReentry.room === "garden" && popupReentry.thumb && !popupReentry.coach,
  "Garden re-entry cannot repaint the coach over that notification", popupReentry);
check(popupCleared && !popupCleared.thumb && popupCleared.coach && !popupCleared.navBlocked &&
  popupCleared.switchHole && popupCleared.scrim === "none",
  "the quiet channel reveals a non-modal coach while leaving the switch and navigation live", popupCleared);
var navigationAway = step("navigationAway"), coachDuringReturnPan = step("coachDuringReturnPan"),
  coachOnReturn = step("coachOnReturn");
check(navigationAway && navigationAway.room === "cuddly" && !navigationAway.coach && navigationAway.coachDue,
  "keyboard navigation leaves Garden and hides the still-pending switch coach", navigationAway);
check(coachDuringReturnPan && coachDuringReturnPan.room === "garden" && !coachDuringReturnPan.coach &&
  coachDuringReturnPan.coachDue,
  "the pending coach stays hidden while Garden is still panning into view", coachDuringReturnPan);
check(coachOnReturn && coachOnReturn.room === "garden" && coachOnReturn.coach && coachOnReturn.coachDue,
  "the settled Garden repaints the pending switch coach", coachOnReturn);
var coachInDungeon = step("coachInDungeon"), coachDuringDungeonReturn = step("coachDuringDungeonReturn"),
  coachAfterDungeon = step("coachAfterDungeon");
check(coachInDungeon && coachInDungeon.room === "garden" && coachInDungeon.dungeon &&
  !coachInDungeon.coach && coachInDungeon.coachDue,
  "opening Dungeon hides the Garden-owned coach without retiring it", coachInDungeon);
check(coachDuringDungeonReturn && !coachDuringDungeonReturn.dungeon && !coachDuringDungeonReturn.coach,
  "the coach stays hidden while Dungeon slides away", coachDuringDungeonReturn);
check(coachAfterDungeon && !coachAfterDungeon.dungeon && coachAfterDungeon.coach && coachAfterDungeon.coachDue,
  "the settled Garden restores its pending coach after Dungeon", coachAfterDungeon);
var duringMessage = step("messageDuringCoach"), afterCoachDismiss = step("messageCoachAfterDismiss"),
  releasedMessage = step("messageReleased");
check(duringMessage && duringMessage.coach && !duringMessage.thumb && !duringMessage.messageCoach && duringMessage.hold &&
  duringMessage.hold.messages.join(",") === "cue_calendar",
  "a new notification and its unread-message coach queue behind the visible Party-switch coach", duringMessage);
check(afterCoachDismiss && !afterCoachDismiss.coach && !afterCoachDismiss.thumb && afterCoachDismiss.messageCoach,
  "dismissing the Party-switch coach releases the unread-message lesson immediately", afterCoachDismiss);
check(releasedMessage && !releasedMessage.coach && releasedMessage.thumb && releasedMessage.messageCoach && releasedMessage.hold &&
  releasedMessage.hold.messages.length === 0,
  "the queued preview releases exactly once without hiding the durable lesson", releasedMessage);
var releasedBadgeCoach = step("messageCoachReleased");
check(releasedBadgeCoach && !releasedBadgeCoach.coach && !releasedBadgeCoach.thumb && releasedBadgeCoach.messageCoach,
  "the unread-message coach remains until it is explicitly dismissed", releasedBadgeCoach);
var callBefore = step("callBeforeCoach"), callCleared = step("callCleared"), callDuring = step("callDuringCoach");
check(callBefore && callBefore.ring && callBefore.coachDue && !callBefore.coach,
  "an already-ringing call also keeps the due coach off-screen", callBefore);
check(callCleared && !callCleared.ring && callCleared.coach,
  "the coach appears after the call channel clears", callCleared);
check(callDuring && callDuring.coach && !callDuring.ring && callDuring.heldCalls.length === 1,
  "a call arriving during the coach is retained instead of overlapping it", callDuring);
var enterRelease = step("enterReleasedCall");
check(enterRelease && enterRelease.party && !enterRelease.coach && enterRelease.ring &&
  enterRelease.heldCalls.length === 0,
  "global Enter dismisses the coach, keeps the party running, and releases one held call", enterRelease);
check(step("switchEndsParty") && !step("switchEndsParty").party && !step("switchEndsParty").coach,
  "the exposed Garden switch still ends the party through its canonical owner", step("switchEndsParty"));

if (failed) process.exit(1);
console.log("Party coach attention assertions passed.");
