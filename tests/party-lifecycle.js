#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  var focused = true;
  document.hasFocus = function () { return focused; };

  var patrons = document.getElementById("kitchen-bar-patrons");
  if (patrons) patrons.style.setProperty("transition", "none", "important");
  // The calm night bar is a phase-two projection. Phase one deliberately keeps
  // the espresso kitchen at night until the first party has unlocked free play.
  if (window.__setSecondRound) window.__setSecondRound(true, { releaseHeld: false });
  if (window.__setDayNight) window.__setDayNight(false);
  check("the unnamed regulars stay out of the daytime kitchen", patrons && getComputedStyle(patrons).opacity === "0");
  if (window.__setDayNight) window.__setDayNight(true);
  check("the unnamed regulars appear in the calm night bar", patrons && getComputedStyle(patrons).opacity === "1");

  // Exercise the lower-level teardown used by cinematics, reset, and compatibility fallbacks.
  // It must own UV state too; otherwise the breather watchdog restores the magic-box glow.
  if (window.__setGardenParty) window.__setGardenParty(true, false);
  if (window.__setUvParty) window.__setUvParty(true);
  var partySwitch = document.getElementById("balcony-partyswitch");
  if (partySwitch) partySwitch.classList.add("on");
  if (window.__gardenFlashNow) window.__gardenFlashNow();
  if (window.__setGardenParty) window.__setGardenParty(false, true);
  var strip = document.getElementById("loft-game-strip");
  var breather = window.__uvBreatherState ? window.__uvBreatherState() : {};
  var flashBloom = document.getElementById("garden-flash-bloom");
  var flashWash = document.getElementById("garden-flash-wash");
  var discoInline = Array.prototype.some.call(document.querySelectorAll("#garden-disco-pools .disco-pool"), function (pool) {
    return !!(pool.style.transform || pool.style.opacity || pool.style.transition);
  });
  check("direct party teardown clears the blacklight and magic-box glow", !window.__gardenPartyOn && strip && !strip.classList.contains("uv-mode") && !breather.uvPartyIntent && !breather.running && (!partySwitch || !partySwitch.classList.contains("on")));
  check("direct party teardown clears camera flashes and stepped spotlights", (!flashBloom || !flashBloom.classList.contains("flashing")) && (!flashWash || !flashWash.classList.contains("flashing")) && !discoInline);

  if (window.__setGardenParty) window.__setGardenParty(true, false);
  check("the unnamed regulars leave when the night bar becomes a party", patrons && getComputedStyle(patrons).opacity === "0");
  check("party starts a fresh lifecycle", window.__partyLifecycleState && window.__partyLifecycleState().attended === 0 && window.__partyLifecycleState().running);

  focused = false;
  window.__partyLifecycleTick();
  check("unfocused time does not count", window.__partyLifecycleState().attended === 0);
  focused = true;
  window.__partyLifecycleTick();
  check("focused time counts", window.__partyLifecycleState().attended === 1);

  if (window.goToStage) window.goToStage("garden");
  window.__advancePartyLifecycle(149);
  check("elapsed attended time does not manufacture a close cue", window.__gardenPartyOn && !window.__partyExitHintActive() && window.__partyLifecycleState().attended === 150);
  window.__advancePartyLifecycle(30);
  check("party remains live after 180 attended seconds", !!window.__gardenPartyOn && window.__partyLifecycleState().attended === 180);
  if (window.goToStage) window.goToStage("kitchen");
  var finaleId = "lastdance";
  if (window.__deliverPhoneMessage) window.__deliverPhoneMessage(finaleId);
  if (finaleId && window.__runMsgAction) window.__runMsgAction(finaleId);
  var finaleState = window.__partyLifecycleState();
  check("accepting the final cue schedules an attended early ending", finaleState.finaleAt > finaleState.attended && (finaleState.finaleReason === "lastdance" || finaleState.finaleReason === "lastsong"), finaleState);
  window.__advancePartyLifecycle(24);
  check("the accepted final dance or song ends the party", !window.__gardenPartyOn);
  check("a finished party schedules Behdad’s road-trip invitation", window.__partyLifecycleState().roadtripInvitePending);
  var roadtripOffered = window.__offerPartyRoadtripInvite && window.__offerPartyRoadtripInvite();
  check("the post-party invitation uses the authored road-trip message", roadtripOffered && window.__phoneMessageReceived("downstairs_entrance") &&
    T.en.msg_downstairs_entrance_body === "Fancy a road trip? 🚗🏔️🏕️" && T.cs.msg_downstairs_entrance_body === "Nechceš vyrazit na výlet? 🚗🏔️🏕️");
  check("the unnamed regulars return to the calm night bar after the party", patrons && getComputedStyle(patrons).opacity === "1");

  // Put Act Two on its first reception beat, then stop the party before its delayed
  // Pouria message lands. Camping is the sole terminal coda: party teardown queues nothing.
  if (window.__resetActTwo) window.__resetActTwo();
  if (window.__armActTwo) window.__armActTwo();
  if (window.__setGardenParty) window.__setGardenParty(true, false);
  var beforeEnd = window.__actPendingMessages ? window.__actPendingMessages() : [];
  if (window.__setPartyMode) window.__setPartyMode(false, true);
  var afterEnd = window.__actPendingMessages ? window.__actPendingMessages() : [];
  check("party end retires queued reception nudges", beforeEnd.indexOf("pouria") !== -1 && afterEnd.indexOf("pouria") === -1 && afterEnd.indexOf("group") === -1 && afterEnd.indexOf("album") === -1, beforeEnd.join(",") + " -> " + afterEnd.join(","));
  var endedAct = window.__actTwoState ? window.__actTwoState() : {};
  check("party end retires Act Two without an automatic piano, dawn, or direct-RSVP coda",
    endedAct.armed === false && endedAct.beat === null && endedAct.running === false &&
      afterEnd.length === 0 && !window.__phoneMessageReceived("piano") &&
      !window.__phoneMessageReceived("dawn") && !window.__phoneMessageReceived("mb"),
    { state: endedAct, pending: afterEnd });

  var offered = window.__offerPartyAgain && window.__offerPartyAgain();
  var inviteId = window.__phoneMessageReceived("party_again_behdad") ? "party_again_behdad" : (window.__phoneMessageReceived("party_again_marketa") ? "party_again_marketa" : null);
  check("rare invitation does not restart the party", offered && !!inviteId && !window.__gardenPartyOn, inviteId || "none");
  if (inviteId && window.__runMsgAction) window.__runMsgAction(inviteId);
  check("accepting the invitation deliberately restarts it", !!window.__gardenPartyOn);

  var realSparklers = window.sparklers, sparklerCalls = 0;
  window.sparklers = function () { sparklerCalls++; };
  if (window.__deliverPhoneMessage) window.__deliverPhoneMessage("lastsparklers");
  if (window.__runMsgAction) window.__runMsgAction("lastsparklers");
  var sparklerFinale = window.__partyLifecycleState();
  check("the third closing cue starts a sparkler send-off and schedules its graceful ending",
    sparklerCalls === 1 && sparklerFinale.finaleAt > sparklerFinale.attended && sparklerFinale.finaleReason === "lastsparklers",
    { calls: sparklerCalls, state: sparklerFinale });
  window.sparklers = realSparklers;
  if (window.__extendPartyLifecycle) window.__extendPartyLifecycle();

  window.__advancePartyLifecycle(150);
  window.__schedulePartyFinale(5, "lastsong");
  var extended = window.__extendPartyLifecycle && window.__extendPartyLifecycle();
  var extendedState = window.__partyLifecycleState();
  check("requesting more party cancels a pending finale and grants a fresh interval", extended && extendedState.attended === 0 && !extendedState.cue && extendedState.finaleAt === null && extendedState.finaleReason === null && window.__gardenPartyOn, extendedState);

  if (window.goToStage) window.goToStage("garden");
  if (window.__summonGuests) window.__summonGuests();
  if (window.__finishPartyLifecycle) window.__finishPartyLifecycle("test");
  var fadingDeparture = window.__partyDepartureFadeState && window.__partyDepartureFadeState();
  var fadingOutputs = fadingDeparture && fadingDeparture.outputs || [];
  check("the visible guest walk-out keeps the effective party output connected and starts its full-goodbye ramp",
    window.__partyWindingDown && window.__partyWindingDown() && fadingDeparture && fadingDeparture.active && fadingDeparture.gain === 0 &&
      fadingOutputs.length > 0 && fadingOutputs.every(function (row) { return row.connected && row.gain > 0.9 && row.target === 0 && Math.abs((row.endAt - row.startAt) - 3.1) < 0.01; }),
    fadingDeparture);
  var fadeEnd = fadingOutputs[0] && fadingOutputs[0].endAt;
  if (window.__reapplyMusicLevels) window.__reapplyMusicLevels();
  var volumeRetargetOutputs = window.__partyAudioOutputState ? window.__partyAudioOutputState() : [];
  check("ordinary volume changes cannot shorten the effective goodbye ramp",
    volumeRetargetOutputs.length > 0 && volumeRetargetOutputs.every(function (row) { return row.connected && row.target === 0 && row.endAt === fadeEnd; }),
    volumeRetargetOutputs);
  var extendedWalkout = window.__extendPartyLifecycle && window.__extendPartyLifecycle();
  var recoveredDeparture = window.__partyDepartureFadeState && window.__partyDepartureFadeState();
  check("requesting more party cancels the walk-out and restores its music gain",
    extendedWalkout && window.__gardenPartyOn && !(window.__partyWindingDown && window.__partyWindingDown()) && window.__partyLifecycleState().attended === 0 &&
      recoveredDeparture && !recoveredDeparture.active && recoveredDeparture.gain === 1 &&
      recoveredDeparture.outputs.length > 0 && recoveredDeparture.outputs.every(function (row) { return row.connected && row.target === 1 && Math.abs((row.endAt - row.startAt) - 0.35) < 0.01; }),
    recoveredDeparture);
  var cakeStarted = window.__startCakeCutting && window.__startCakeCutting();
  if (window.__completeCakeCutting) window.__completeCakeCutting();
  check("natural cake completion starts the graceful early finale", cakeStarted && window.__partyWindingDown && window.__partyWindingDown());
  if (window.__setPartyMode) window.__setPartyMode(false, true);
  var stoppedDeparture = window.__partyDepartureFadeState && window.__partyDepartureFadeState();
  check("cake finale uses the normal party teardown", !window.__gardenPartyOn && !window.__cakeOn && stoppedDeparture && !stoppedDeparture.active && stoppedDeparture.gain === 1);

  setLang("cs");
  if (window.__setGardenParty) window.__setGardenParty(true, false);
  if (window.goToStage) window.goToStage("kitchen");
  if (window.__clearFlashCaption) window.__clearFlashCaption("room-progress");
  if (window.__setGardenParty) window.__setGardenParty(false, true);
  var partyEndCaption = document.getElementById("hunt-caption").textContent;
  check("manual party-end copy is localized in Czech", !window.__gardenPartyOn && /hra ne/i.test(partyEndCaption) && /aplikace/i.test(partyEndCaption), partyEndCaption);
  if (window.__runMsgAction) window.__runMsgAction("downstairs_entrance");
  check("accepting the road-trip invitation opens Entrance", window.currentStageName === "balcony" && window.__entranceRoomOpen);
  report();
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 2200, { forceMotion: true, seedRandom: true, patchRaf: true });
if (!result) { console.error("party lifecycle: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "PASS" : "FAIL") + " " + c.name + (c.pass || !c.detail ? "" : " - " + c.detail));
  if (!c.pass) failed = true;
});
if (result.errors.length) { failed = true; console.error("runtime errors:\n  " + result.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("party lifecycle: all " + result.checks.length + " checks passed");
