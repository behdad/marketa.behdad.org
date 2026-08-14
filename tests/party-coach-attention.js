#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: (window.__errs || []).slice(), steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function visible(selector) { var node = document.querySelector(selector); return !!(node && node.classList.contains("show")); }
  function snap(name) {
    var overlay = document.getElementById("party-room-map-coach"), area = document.getElementById("hunt-fullscreen-area");
    var card = overlay.querySelector(".hunt-coach-card"), scrims = [].slice.call(overlay.querySelectorAll(".modal-coach-scrim"));
    var cardBox = card.getBoundingClientRect(), areaBox = area.getBoundingClientRect(), state = window.__partyLifecycleState();
    report.steps[name] = {
      room: window.__currentStageName, party: !!window.__gardenPartyOn,
      coach: !!(window.__partyRoomMapCoachModalActive && window.__partyRoomMapCoachModalActive()),
      coachDue: !!state.roomMapCoachActive, acknowledged: !!state.roomMapCoachAcknowledged,
      messageCoach: visible(".msg-badge-coach"), thumb: visible(".msg-thumb"), ring: visible(".call-ring"),
      hold: window.__messageNotificationsHeld ? window.__messageNotificationsHeld() : null,
      heldCalls: window.__heldPartyCoachCalls ? window.__heldPartyCoachCalls() : [],
      modal: overlay.classList.contains("modal-coach") && overlay.classList.contains("target-modal-coach") &&
        getComputedStyle(overlay).pointerEvents === "none" && scrims.length === 4 &&
        scrims.every(function (el) { return getComputedStyle(el).pointerEvents === "auto"; }) &&
        window.__partyCoachModalActive && window.__partyCoachModalActive(),
      cardLarge: cardBox.width >= areaBox.width * .72 && cardBox.height >= areaBox.height * .35,
      scrim: scrims[0] && getComputedStyle(scrims[0]).backgroundColor
    };
  }
  async function run() {
    Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
    if (window.__endAttract) window.__endAttract();
    if (window.__removeClickMe) window.__removeClickMe();
    if (window.__finishOpeningGuide) window.__finishOpeningGuide();
    window.__dollhouseCapturesReady = function () { return true; };
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setGardenParty(true, false);window.__goToStage("garden");
    window.__deliverPhoneMessage("cue_mail");await sleep(40);
    window.__showPartyExplorationCoach();snap("popupBeforeCoach");
    window.__hideMessageThumb(true);await sleep(260);snap("popupCleared");

    window.__setPartyMomentState("cake", true);await sleep(80);snap("duringMoment");
    window.__setPartyMomentState("cake", false);await sleep(260);snap("afterMoment");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight", bubbles: true, cancelable: true }));
    await sleep(40);snap("keyboardBlocked");

    window.__deliverPhoneMessage("cue_calendar");await sleep(30);
    if (window.__repeatMsgBadgeCoach) window.__repeatMsgBadgeCoach();
    window.__madlaRingForced();await sleep(30);snap("attentionDuringCoach");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
    await sleep(720);snap("enterReleasedAttention");

    window.__hideCallRing();window.__hideMessageThumb(true);if (window.__dismissMsgBadgeCoach) window.__dismissMsgBadgeCoach();
    window.__setPartyMode(false, true, false);window.__resetPartyExitHint();window.__setPartyMode(true, true, false);
    window.__setPartyMomentState("bdCake", true);window.__showPartyExplorationCoach();await sleep(60);
    window.__setPartyMode(false, true, false);await sleep(60);snap("earlyStopDuringMoment");
    window.__setPartyMomentState("bdCake", false);await sleep(260);snap("earlyStopFallback");
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { report.errors.push(String(error && error.stack || error)); })
        .then(function () { report.errors = (window.__errs || []).concat(report.errors || []);document.getElementById("__report").textContent = JSON.stringify(report); });
    }, 260);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 5000, {
  patchRaf: true, seedRandom: true, forceMotion: true,
  urlSuffix: "?fresh=party-coach-attention&date=2026-08-13"
});
var failed = false;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message + (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
function step(name) { return result && result.steps && result.steps[name]; }

console.log("loft-day.html Party exploration attention ownership:");
check(result && result.errors.length === 0, "attention probe has no page errors", result && result.errors);
var popupBefore = step("popupBeforeCoach"), popupCleared = step("popupCleared");
check(popupBefore && !popupBefore.thumb && popupBefore.coachDue && popupBefore.coach,
  "the exploration coach immediately claims attention from a notification", popupBefore);
check(popupCleared && !popupCleared.thumb && popupCleared.coach && popupCleared.modal &&
  popupCleared.scrim === "rgba(0, 0, 0, 0)",
  "the quiet channel reveals the Dollhouse modal while Party stays live", popupCleared);
check(step("duringMoment") && !step("duringMoment").coach && step("duringMoment").coachDue,
  "an authored Party moment hides exploration without retiring it", step("duringMoment"));
check(step("afterMoment") && step("afterMoment").coach && step("afterMoment").party,
  "exploration returns after the authored moment settles", step("afterMoment"));
check(step("keyboardBlocked") && step("keyboardBlocked").room === "garden" && step("keyboardBlocked").coach,
  "the exploration modal swallows unrelated room navigation", step("keyboardBlocked"));
var during = step("attentionDuringCoach"), released = step("enterReleasedAttention");
check(during && during.coach && !during.thumb && !during.ring && during.heldCalls.length === 1 && during.hold,
  "Messages and an incoming call serialize behind exploration", during);
check(released && released.party && !released.coach && released.acknowledged && released.heldCalls.length === 0 &&
  (released.ring || released.thumb || released.messageCoach),
  "Enter acknowledges exploration and releases queued attention without stopping Party", released);
check(step("earlyStopDuringMoment") && !step("earlyStopDuringMoment").party && step("earlyStopDuringMoment").coach && step("earlyStopDuringMoment").coachDue,
  "an early manual stop retires its Party moment and immediately surfaces the fallback", step("earlyStopDuringMoment"));
check(step("earlyStopFallback") && !step("earlyStopFallback").party && step("earlyStopFallback").coach,
  "the same Dollhouse modal appears as the early post-Party fallback", step("earlyStopFallback"));

if (failed) process.exit(1);
console.log("Party exploration attention assertions passed.");
