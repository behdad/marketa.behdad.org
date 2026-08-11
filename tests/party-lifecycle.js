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
  var firstHandoff = window.__partyLifecycleState ? window.__partyLifecycleState() : {};
  check("an early deliberate teardown durably records the Road Trip handoff behind its coach",
    firstHandoff.handoffShown && !firstHandoff.roadtripInviteDelivered &&
      window.__phoneMessageReceived && !window.__phoneMessageReceived("downstairs_entrance") &&
      !Object.prototype.hasOwnProperty.call(firstHandoff, "roadtripInvitePending"), firstHandoff);
  var roomCoach = document.getElementById("party-room-map-coach");
  window.dispatchEvent(new Event("resize"));
  var roomCoachPopup = roomCoach.querySelector(".hunt-coach-card");
  var roomCoachArrow = roomCoach.querySelector(".hunt-coach-arrow");
  function popupStyleSignature(popup) {
    var s = getComputedStyle(popup);
    return [s.backgroundColor, s.borderColor, s.borderWidth, s.borderRadius, s.boxShadow,
      s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft,
      s.fontFamily, s.fontSize, s.fontWeight, s.lineHeight].join("|");
  }
  function arrowShapeSignature(arrow) {
    return (arrow.getAttribute("d") || "").replace(/-?[0-9]+(?:\.[0-9]+)?/g, "#");
  }
  var roomPopupSignature = popupStyleSignature(roomCoachPopup);
  var roomArrowSignature = arrowShapeSignature(roomCoachArrow);
  check("an incomplete-loft teardown pairs its dynamic popup with the large room-map arrow",
    firstHandoff.roomMapCoachActive && roomCoach.classList.contains("show") &&
      /1 of 10 rooms/i.test(roomCoach.querySelector(".party-bridge-room-copy").textContent) &&
      !/1 of 10 rooms/i.test(document.getElementById("hunt-caption").textContent) &&
      roomCoach.querySelectorAll("svg > .hunt-coach-arrow").length === 1 &&
      !roomCoach.querySelector("svg polygon,svg rect") &&
      getComputedStyle(roomCoachArrow).fill === "rgb(239, 23, 23)" &&
      getComputedStyle(roomCoachArrow).animationName === "kitchen-arrow-bounce",
    roomCoach.querySelector(".party-bridge-room-copy").textContent);
  if (window.__madlaRingForced) window.__madlaRingForced();
  check("the room-map coach queues an incoming call instead of letting it cover the coach",
    !document.querySelector(".call-ring.show") && window.__heldPartyCoachCalls &&
      window.__heldPartyCoachCalls().length === 1, window.__heldPartyCoachCalls && window.__heldPartyCoachCalls());
  roomCoachPopup.querySelector(".hunt-coach-x").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  check("the room-map coach’s explicit dismiss control closes it without opening the map or releasing Road Trip early",
    !window.__partyLifecycleState().roomMapCoachActive &&
      !roomCoach.classList.contains("show") && !window.__partyLifecycleState().roadtripInviteDelivered &&
      !window.__phoneMessageReceived("downstairs_entrance") && document.getElementById("loft-dollhouse").hidden);
  if (window.__hideCallRing) window.__hideCallRing();

  if (window.__setGardenParty) window.__setGardenParty(true, false);
  check("the unnamed regulars leave when the night bar becomes a party", patrons && getComputedStyle(patrons).opacity === "0");
  check("party starts a fresh lifecycle", window.__partyLifecycleState && window.__partyLifecycleState().attended === 0 && window.__partyLifecycleState().running);
  if (window.__goToStage) window.__goToStage("garden");
  if (window.__showPartySwitchCoach) window.__showPartySwitchCoach();
  var switchCoach = document.getElementById("party-switch-coach");
  window.dispatchEvent(new Event("resize"));
  var switchCoachPopup = switchCoach.querySelector(".hunt-coach-card");
  var switchCoachArrow = switchCoach.querySelector(".hunt-coach-arrow");
  var switchPlate = document.querySelector("#garden-lightswitch > rect:first-child");
  var switchArrowBox = switchCoachArrow.getBBox();
  var switchViewport = document.querySelector(".hunt-viewport");
  var expectedSwitchTip = switchViewport.clientHeight * 185 / 340 - 3;
  check("the wall switch and its coach target move up together by fifteen pixels",
    switchPlate && Number(switchPlate.getAttribute("y")) === 185 &&
      Math.abs(switchArrowBox.y + switchArrowBox.height - expectedSwitchTip) < 1,
    JSON.stringify({ switchY: switchPlate && switchPlate.getAttribute("y"),
      arrowTip: switchArrowBox.y + switchArrowBox.height, expectedTip: expectedSwitchTip }));
  check("the first-party coach uses its own readable popup and vivid overlay without taking focus",
      switchCoach.classList.contains("show") &&
      switchCoachPopup.querySelector(".hunt-coach-copy").textContent === "When the time comes, end the party here." &&
      window.__loftMessages.cs.hunt.party_switch_coach === "Až přijde čas, ukonči párty tady." &&
      getComputedStyle(switchCoachArrow).fill === "rgb(239, 23, 23)" &&
      document.activeElement !== document.getElementById("garden-lightswitch") &&
      !/end the party here/i.test(document.getElementById("hunt-caption").textContent),
    JSON.stringify({ shown: switchCoach.classList.contains("show"), copy: switchCoachPopup.querySelector(".hunt-coach-copy").textContent,
      cs: window.__loftMessages.cs.hunt.party_switch_coach, fill: getComputedStyle(switchCoachArrow).fill,
      caption: document.getElementById("hunt-caption").textContent }));
  check("both bridge coaches share one box, dismiss control, and continuous dancing-arrow contract",
    popupStyleSignature(switchCoachPopup) === roomPopupSignature &&
      !switchCoachPopup.style.width && !roomCoachPopup.style.width &&
      switchCoachPopup.querySelectorAll(":scope > .hunt-coach-x").length === 1 &&
      roomCoachPopup.querySelectorAll(":scope > .hunt-coach-x").length === 1 &&
      switchCoachPopup.querySelectorAll(":scope > .hunt-coach-copy").length === 1 &&
      roomCoachPopup.querySelectorAll(":scope > .hunt-coach-copy").length === 1 &&
      switchCoach.querySelectorAll("svg > .hunt-coach-arrow").length === 1 &&
      !switchCoach.querySelector("svg polygon,svg rect") &&
      arrowShapeSignature(switchCoachArrow) === roomArrowSignature &&
      getComputedStyle(switchCoachArrow).animationName === "kitchen-arrow-bounce",
    JSON.stringify({ switchPopup: popupStyleSignature(switchCoachPopup), roomPopup: roomPopupSignature,
      switchArrow: arrowShapeSignature(switchCoachArrow), roomArrow: roomArrowSignature }));
  switchCoachPopup.querySelector(".hunt-coach-x").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  check("the switch coach’s explicit dismiss control closes it without toggling the wall switch",
    !switchCoach.classList.contains("show") && window.__gardenPartyOn && window.__partyLifecycleState().switchCoachRetired);

  focused = false;
  window.__partyLifecycleTick();
  check("unfocused time does not count", window.__partyLifecycleState().attended === 0);
  focused = true;
  window.__partyLifecycleTick();
  check("focused time counts", window.__partyLifecycleState().attended === 1);

  window.__advancePartyLifecycle(149);
  check("attended time offers a gentle close cue without ending the party",
    window.__gardenPartyOn && window.__partyExitHintActive() && window.__partyLifecycleState().attended === 150);
  window.__advancePartyLifecycle(30);
  check("party remains live after 180 attended seconds", !!window.__gardenPartyOn && window.__partyLifecycleState().attended === 180);
  if (window.__goToStage) window.__goToStage("kitchen");
  var finaleId = "lastdance";
  if (window.__deliverPhoneMessage) window.__deliverPhoneMessage(finaleId);
  if (finaleId && window.__runMsgAction) window.__runMsgAction(finaleId);
  var finaleState = window.__partyLifecycleState();
  check("accepting the final cue schedules an attended early ending", finaleState.finaleAt > finaleState.attended && (finaleState.finaleReason === "lastdance" || finaleState.finaleReason === "lastsong"), finaleState);
  window.__advancePartyLifecycle(24);
  check("the accepted final dance or song ends the party", !window.__gardenPartyOn);
  check("a finished party keeps the once-per-reset exploration handoff durable",
    window.__partyLifecycleState().handoffShown && !window.__partyLifecycleState().roadtripInviteDelivered &&
      !window.__phoneMessageReceived("downstairs_entrance"));
  var roadtripOffered = window.__offerPartyRoadtripInvite && window.__offerPartyRoadtripInvite();
  check("the Road Trip exchange stays behind 10/10 and keeps its authored opening line",
    !roadtripOffered && !window.__phoneMessageReceived("downstairs_entrance") &&
    window.__loftMessages.en.msg_downstairs_entrance_body === "Fancy a road trip?" &&
    window.__loftMessages.cs.msg_downstairs_entrance_body === "Nechceš vyrazit na výlet?");
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

  if (window.__pausePartyLifecycle) window.__pausePartyLifecycle();
  if (window.__resumePartyLifecycle) window.__resumePartyLifecycle();
  var marketaAgain = window.__deliverPhoneMessage && window.__deliverPhoneMessage("party_again_marketa", true);
  var behdadAgain = window.__deliverPhoneMessage && window.__deliverPhoneMessage("party_again_behdad", true);
  check("party teardown and lifecycle re-entry cannot manufacture a party-again invitation",
    !marketaAgain && !behdadAgain && !window.__phoneMessageReceived("party_again_marketa") &&
      !window.__phoneMessageReceived("party_again_behdad") &&
      typeof window.__offerPartyAgain === "undefined" &&
      !Object.prototype.hasOwnProperty.call(window.__partyLifecycleState(), "partyAgainPending"),
    window.__partyLifecycleState());
  if (window.__setPartyMode) window.__setPartyMode(true, true);
  check("the ordinary party control can still restart it deliberately", !!window.__gardenPartyOn);

  var realSparklers = window.__loftControllers.sparklers, sparklerCalls = 0;
  window.__loftControllers.sparklers = function () { sparklerCalls++; };
  if (window.__deliverPhoneMessage) window.__deliverPhoneMessage("lastsparklers");
  if (window.__runMsgAction) window.__runMsgAction("lastsparklers");
  var sparklerFinale = window.__partyLifecycleState();
  check("the third closing cue starts a sparkler send-off and schedules its graceful ending",
    sparklerCalls === 1 && sparklerFinale.finaleAt > sparklerFinale.attended && sparklerFinale.finaleReason === "lastsparklers",
    { calls: sparklerCalls, state: sparklerFinale });
  window.__loftControllers.sparklers = realSparklers;
  if (window.__extendPartyLifecycle) window.__extendPartyLifecycle();

  window.__advancePartyLifecycle(150);
  window.__schedulePartyFinale(5, "lastsong");
  var extended = window.__extendPartyLifecycle && window.__extendPartyLifecycle();
  var extendedState = window.__partyLifecycleState();
  check("requesting more party cancels a pending finale and grants a fresh interval", extended && extendedState.attended === 0 && !extendedState.cue && extendedState.finaleAt === null && extendedState.finaleReason === null && window.__gardenPartyOn, extendedState);

  if (window.__goToStage) window.__goToStage("garden");
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

  window.__setLang("cs");
  if (window.__resetPartyExitHint) window.__resetPartyExitHint();
  if (window.__setGardenParty) window.__setGardenParty(true, false);
  if (window.__goToStage) window.__goToStage("kitchen");
  if (window.__clearFlashCaption) window.__clearFlashCaption("room-progress");
  if (window.__setGardenParty) window.__setGardenParty(false, true);
  var partyEndCaption = document.getElementById("hunt-caption").textContent;
  var partyEndPopup = document.querySelector("#party-room-map-coach .party-bridge-room-copy").textContent;
  check("manual party-end progress copy is localized in Czech", !window.__gardenPartyOn &&
    /Prozkoumáno: [0-9]+ z 10 místností/.test(partyEndPopup) && /Pokračuj dál/.test(partyEndPopup) &&
      !/Prozkoumáno: [0-9]+ z 10 místností/.test(partyEndCaption),
    JSON.stringify({ popup: partyEndPopup, caption: partyEndCaption }));
  if (window.__runMsgAction) window.__runMsgAction("downstairs_roadtrip_go");
  check("only the final Road Trip exchange line opens Entrance", window.__currentStageName === "balcony" && window.__entranceRoomOpen);
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
