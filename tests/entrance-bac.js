#!/usr/bin/env node
// Alcohol state is one persistent balcony-owned record shared by the Road Trip HUD and impairment.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var phaseKey = "entrance-bac-phase";
  var recordKey = "balconyDrinkState:v1";
  if (!sessionStorage.getItem(phaseKey)) {
    localStorage.setItem(recordKey, JSON.stringify({ drinkEquivalents: 4, updatedAt: Date.now() }));
    sessionStorage.setItem(phaseKey, "restored");
    location.reload();
    return;
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function hud() {
    return {
      demeritLabel: document.getElementById("entrance-roadtrip-demerit-label").textContent.trim(),
      demeritPoints: document.getElementById("entrance-roadtrip-demerit-points").textContent.trim(),
      bacLabel: document.getElementById("entrance-roadtrip-bac-label").textContent.trim(),
      bacValue: document.getElementById("entrance-roadtrip-bac-value").textContent.trim(),
      statusAbsent: !document.getElementById("entrance-roadtrip-demerit-status"),
      dividerX: document.getElementById("entrance-roadtrip-record-divider").getAttribute("x1")
    };
  }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  window.addEventListener("load", function () { setTimeout(async function () {
    var report = { errors: window.__errs || [] };
    try {
      report.restored = copy(window.__drinkState());
      window.__entranceRoadtripSetDemerits(3, 0);
      report.nonzero = hud();
      window.__setLang("cs");
      window.__refreshEntranceRoadtripHud();
      report.czech = hud();
      window.__setLang("en");

      window.__resetWineSips();
      for (var i = 0; i < 4; i++) window.__registerDrink();
      report.accumulated = copy(window.__drinkState());
      var base = report.accumulated.updatedAt;
      report.beforeMinute = copy(window.__drinkState(base + 59999));
      report.oneMinute = copy(window.__drinkState(base + 60000));
      report.threeMinutes = copy(window.__drinkState(base + 180000));

      window.__registerDrink();
      var beforeCheckpointReset = copy(window.__drinkState());
      window.__resetCheckpointSystems();
      report.checkpointReset = {
        before: beforeCheckpointReset,
        after: copy(window.__drinkState()),
        stored: JSON.parse(localStorage.getItem(recordKey))
      };

      Object.defineProperty(document, "hasFocus", { value: function () { return false; }, configurable: true });
      window.dispatchEvent(new Event("blur"));
      var storedBefore = localStorage.getItem(recordKey);
      await sleep(140);
      report.unfocused = {
        storedBefore: storedBefore,
        storedAfter: localStorage.getItem(recordKey)
      };

      window.__activateExtinguisher();
      await sleep(850);
      report.fullReset = {
        state: copy(window.__drinkState()),
        stored: localStorage.getItem(recordKey)
      };

      window.__secondRound = true;
      window.__currentStageName = "kitchen";
      document.getElementById("stage-kitchen").classList.add("dusk");
      document.getElementById("kitchen-bar-tap-a").dispatchEvent(new MouseEvent("click", { bubbles: true }));
      report.barDraft = copy(window.__drinkState());
      window.__makeCocktailHere("Negroni");
      report.barCocktail = copy(window.__drinkState());
      window.__bartenderRoomAway();
      document.querySelector(".mixer-bottle").dispatchEvent(new MouseEvent("click", { bubbles: true }));
      document.querySelector(".mx-shakerwrap").dispatchEvent(new MouseEvent("click", { bubbles: true }));
      report.barMixer = copy(window.__drinkState());
      document.getElementById("balcony-can").dispatchEvent(new MouseEvent("click", { bubbles: true }));
      report.balconyBeer = copy(window.__drinkState());
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 140); });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 3500, {
  patchRaf: true,
  chromeFlags: "--no-default-browser-check --noerrdialogs --window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("loft-day.html persistent BAC and demerit status:");
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(result && result.restored.drinkEquivalents === 4 && result.restored.bac === .12 &&
  result.restored.impairmentLevel === .5,
  "the balcony alcohol record restores as the one Road Trip impairment state", result && result.restored);
check(result && result.nonzero.demeritLabel === "DEMERITS" && result.nonzero.demeritPoints === "3 / 15" &&
  result.nonzero.bacLabel === "BAC" && result.nonzero.bacValue === "0.12" &&
  result.nonzero.statusAbsent && result.nonzero.dividerX === "579",
  "demerits and BAC occupy separate factual columns with no status vocabulary", result && result.nonzero);
check(result && result.czech.demeritLabel === "TRESTNÉ BODY" &&
  result.czech.demeritPoints === "3 / 15" && result.czech.bacLabel === "BAC" &&
  result.czech.bacValue === "0.12" && result.czech.statusAbsent,
  "the separate columns remain compact and factual in Czech", result && result.czech);
check(result && result.accumulated.drinkEquivalents === 4 && result.accumulated.bac === .12 &&
  result.accumulated.impairmentLevel === .5,
  "wine and beer registrations accumulate persistent drink-equivalents", result && result.accumulated);
check(result && result.beforeMinute.drinkEquivalents === 4 &&
  result.oneMinute.drinkEquivalents === 3 && result.oneMinute.bac === .09 &&
  result.threeMinutes.drinkEquivalents === 1 && result.threeMinutes.bac === .03,
  "decay removes exactly one drink-equivalent per complete real minute", result && {
    before: result.beforeMinute, one: result.oneMinute, three: result.threeMinutes
  });
check(result && result.checkpointReset.before.drinkEquivalents === 2 &&
  result.checkpointReset.after.drinkEquivalents === 2 &&
  result.checkpointReset.stored.drinkEquivalents === 2,
  "checkpoint reset cannot rewind the separate alcohol record", result && result.checkpointReset);
check(result && result.unfocused.storedBefore === result.unfocused.storedAfter,
  "hidden or unfocused time runs no autonomous BAC mutation loop", result && result.unfocused);
check(result && result.fullReset.state.drinkEquivalents === 0 && result.fullReset.state.bac === 0 &&
  result.fullReset.stored === null,
  "a deliberate full-game reset clears alcohol state", result && result.fullReset);
check(result && result.barDraft.drinkEquivalents === 1 && result.barDraft.bac === .03 &&
  result.barCocktail.drinkEquivalents === 2 && result.barCocktail.bac === .06 &&
  result.barMixer.drinkEquivalents === 3 && result.barMixer.bac === .09 &&
  result.balconyBeer.drinkEquivalents === 4 && result.balconyBeer.bac === .12,
  "player draft, cocktail, mixer, and balcony beer actions share the BAC tally", result && {
    draft: result.barDraft, cocktail: result.barCocktail,
    mixer: result.barMixer, balconyBeer: result.balconyBeer
  });

if (failures) process.exit(1);
console.log("persistent BAC and demerit status assertions passed.");
