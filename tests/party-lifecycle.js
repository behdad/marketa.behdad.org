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
  check("the unnamed regulars return to the calm night bar after the party", patrons && getComputedStyle(patrons).opacity === "1");

  // Put Act Two on its first reception beat, then stop the party before its delayed
  // Pouria message lands. Party teardown may queue only the quieter piano wind-down.
  if (window.__resetActTwo) window.__resetActTwo();
  if (window.__armActTwo) window.__armActTwo();
  if (window.__setGardenParty) window.__setGardenParty(true, false);
  var beforeEnd = window.__actPendingMessages ? window.__actPendingMessages() : [];
  if (window.__setPartyMode) window.__setPartyMode(false, true);
  var afterEnd = window.__actPendingMessages ? window.__actPendingMessages() : [];
  check("party end retires queued reception nudges", beforeEnd.indexOf("pouria") !== -1 && afterEnd.indexOf("pouria") === -1 && afterEnd.indexOf("group") === -1 && afterEnd.indexOf("album") === -1, beforeEnd.join(",") + " -> " + afterEnd.join(","));
  check("Act Two advances to the wind-down", window.__actBeat && window.__actBeat() === "act_w1" && afterEnd.join(",") === "piano", afterEnd.join(","));

  var offered = window.__offerPartyAgain && window.__offerPartyAgain();
  var inviteId = window.__phoneMessageReceived("party_again_behdad") ? "party_again_behdad" : (window.__phoneMessageReceived("party_again_marketa") ? "party_again_marketa" : null);
  check("rare invitation does not restart the party", offered && !!inviteId && !window.__gardenPartyOn, inviteId || "none");
  if (inviteId && window.__runMsgAction) window.__runMsgAction(inviteId);
  check("accepting the invitation deliberately restarts it", !!window.__gardenPartyOn);

  window.__advancePartyLifecycle(150);
  window.__schedulePartyFinale(5, "lastsong");
  var extended = window.__extendPartyLifecycle && window.__extendPartyLifecycle();
  var extendedState = window.__partyLifecycleState();
  check("requesting more party cancels a pending finale and grants a fresh interval", extended && extendedState.attended === 0 && !extendedState.cue && extendedState.finaleAt === null && extendedState.finaleReason === null && window.__gardenPartyOn, extendedState);

  if (window.goToStage) window.goToStage("garden");
  if (window.__summonGuests) window.__summonGuests();
  if (window.__finishPartyLifecycle) window.__finishPartyLifecycle("test");
  var extendedWalkout = window.__extendPartyLifecycle && window.__extendPartyLifecycle();
  check("requesting more party cancels an in-progress guest walk-out", extendedWalkout && window.__gardenPartyOn && !(window.__partyWindingDown && window.__partyWindingDown()) && window.__partyLifecycleState().attended === 0);
  var cakeStarted = window.__startCakeCutting && window.__startCakeCutting();
  if (window.__completeCakeCutting) window.__completeCakeCutting();
  check("natural cake completion starts the graceful early finale", cakeStarted && window.__partyWindingDown && window.__partyWindingDown());
  if (window.__setPartyMode) window.__setPartyMode(false, true);
  check("cake finale uses the normal party teardown", !window.__gardenPartyOn && !window.__cakeOn);

  document.documentElement.lang = "cs";
  if (window.__setGardenParty) window.__setGardenParty(true, false);
  if (window.goToStage) window.goToStage("kitchen");
  if (window.__setGardenParty) window.__setGardenParty(false, true);
  check("manual party-end copy is localized in Czech", !window.__gardenPartyOn && /hra ne/i.test(document.getElementById("hunt-caption").textContent) && /aplikace/i.test(document.getElementById("hunt-caption").textContent));
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
