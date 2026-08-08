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
      room: window.currentStageName,
      party: !!window.__gardenPartyOn,
      coach: !!(window.__partySwitchCoachModalActive && window.__partySwitchCoachModalActive()),
      coachDue: !!(window.__partyLifecycleState && window.__partyLifecycleState().switchCoachSeen),
      thumb: visible(".msg-thumb"),
      ring: visible(".call-ring"),
      hold: window.__messageNotificationsHeld ? window.__messageNotificationsHeld() : null,
      heldCalls: window.__heldPartyCoachCalls ? window.__heldPartyCoachCalls() : [],
      navBlocked: getComputedStyle(document.getElementById("hunt-next")).pointerEvents === "none",
      scrim: getComputedStyle(overlay.querySelector(".party-switch-scrim-top")).display
    };
  }
  async function run() {
    Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
    if (window.__endAttract) window.__endAttract();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setGardenParty(true, false);
    window.goToStage("garden");

    window.__deliverPhoneMessage("cue_mail");
    await sleep(40);
    window.__showPartySwitchCoach();
    snap("popupBeforeCoach");
    window.goToStage("kitchen");
    window.goToStage("garden");
    await sleep(40);
    snap("popupOnReentry");
    window.__hideMessageThumb();
    await sleep(260);
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
    snap("coachOnReturn");
    window.__deliverPhoneMessage("cue_calendar");
    await sleep(30);
    snap("messageDuringCoach");
    document.querySelector("#party-switch-coach .hunt-coach-x").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    await sleep(540);
    snap("messageReleased");

    window.__hideMessageThumb();
    window.__resetPartyExitHint();
    window.goToStage("garden");
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
    window.goToStage("garden");
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

var result = lib.runPageSync("rsvp.html", HARNESS, 10500, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?fresh=party-coach-attention#play"
});
var failed = false;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
function step(name) { return result && result.steps && result.steps[name]; }

console.log("rsvp.html party coach attention ownership:");
check(result && result.errors.length === 0, "attention probe has no page errors", result && result.errors);
var popupBefore = step("popupBeforeCoach"), popupReentry = step("popupOnReentry"), popupCleared = step("popupCleared");
check(popupBefore && popupBefore.thumb && popupBefore.coachDue && !popupBefore.coach,
  "a visible notification keeps the due switch coach off-screen", popupBefore);
check(popupReentry && popupReentry.room === "garden" && popupReentry.thumb && !popupReentry.coach,
  "Garden re-entry cannot repaint the coach over that notification", popupReentry);
check(popupCleared && !popupCleared.thumb && popupCleared.coach && !popupCleared.navBlocked &&
  popupCleared.switchHole && popupCleared.scrim === "none",
  "the quiet channel reveals a non-modal coach while leaving the switch and navigation live", popupCleared);
var navigationAway = step("navigationAway"), coachOnReturn = step("coachOnReturn");
check(navigationAway && navigationAway.room === "cuddly" && !navigationAway.coach && navigationAway.coachDue,
  "keyboard navigation leaves Garden and hides the still-pending switch coach", navigationAway);
check(coachOnReturn && coachOnReturn.room === "garden" && coachOnReturn.coach && coachOnReturn.coachDue,
  "returning to Garden repaints the pending switch coach", coachOnReturn);
var duringMessage = step("messageDuringCoach"), releasedMessage = step("messageReleased");
check(duringMessage && duringMessage.coach && !duringMessage.thumb && duringMessage.hold &&
  duringMessage.hold.messages.join(",") === "cue_calendar",
  "a new notification queues behind the visible coach", duringMessage);
check(releasedMessage && !releasedMessage.coach && releasedMessage.thumb && releasedMessage.hold &&
  releasedMessage.hold.messages.length === 0,
  "the × releases the queued notification exactly once and keeps the party running", releasedMessage);
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
