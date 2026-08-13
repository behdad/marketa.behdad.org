#!/usr/bin/env node
"use strict";

// Phase two retires the linear room trail. Delayed phase-one completions may still
// resolve, but they must not unlock or pan; direct room navigation remains available.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  async function run() {
    window.__setSecondRound(true, { releaseHeld: false });
    check("phase two unlocks the complete manual room map", window.__secondRound && window.__maxUnlocked() === 4);
    window.__goToStage("garden");
    var staleResult = window.__finishSolveAdvance("garden", "cuddly");
    await sleep(850);
    check("a stale phase-one completion cannot pan in phase two",
      staleResult === false && window.__currentStageName === "garden", window.__currentStageName);
    if (window.__loftControllers.party && window.__loftControllers.party.status()) window.loft.garden.set(false);
    if (window.__setDayNight) window.__setDayNight(false);
    if (window.__setKitchenCoffeeState) window.__setKitchenCoffeeState({ step: "spent", rounds: 1 });
    if (window.__setSeenRooms) window.__setSeenRooms(["kitchen"]); // isolate the room caption from the first-visit progress flash
    window.__goToStage("kitchen");
    await sleep(120);
    check("a solved daytime Kitchen revisit has a quiet repeat invitation",
      window.__captionKey() === "kitchen_again" &&
      document.querySelectorAll("#stage-kitchen .invite-pulse").length === 0,
      JSON.stringify({ caption: window.__captionKey(), invites: document.querySelectorAll("#stage-kitchen .invite-pulse").length }));

    var knockbox = document.getElementById("kitchen-knockbox");
    var knockboxClicks = 0;
    knockbox.addEventListener("click", function () { knockboxClicks++; });
    knockbox.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await sleep(1900);
    check("a direct coffee-object click resumes the canonical repeat sequence",
      knockboxClicks === 1 && window.__captionKey() === "kitchen_grind" &&
      document.querySelectorAll("#stage-kitchen .invite-pulse").length === 0,
      JSON.stringify({ clicks: knockboxClicks, caption: window.__captionKey(), invites: document.querySelectorAll("#stage-kitchen .invite-pulse").length }));

    var grinder = document.getElementById("kitchen-grinder"), grinderClicks = 0;
    grinder.addEventListener("click", function () { grinderClicks++; });
    var kitchenWalker = window.__kitchenDoNext();
    await sleep(1900);
    var retiredWalkers = [window.__gardenDoNext(), window.__cuddlyDoNext(), window.__officeDoNext()];
    check("Enter's coffee walker advances the same sequence while linear room walkers retire",
      kitchenWalker === "kitchen-grinder" && grinderClicks === 1 &&
      window.__captionKey() === "kitchen_need_tamp" &&
      retiredWalkers.every(function (value) { return value === null || value === false; }),
      JSON.stringify({ kitchen: kitchenWalker, clicks: grinderClicks, caption: window.__captionKey(), retired: retiredWalkers }));

    window.__goToStage("garden");
    var partyBefore = !!(window.__loftControllers.party && window.__loftControllers.party.status());
    var activated = window.__activateCurrentRoom();
    check("the room activation key toggles the Garden's main Party activity",
      activated === true && !partyBefore && !!(window.__loftControllers.party && window.__loftControllers.party.status()), String(activated));
    if (window.__loftControllers.party && window.__loftControllers.party.status()) window.loft.garden.set(false);
    check("phase-one clue targets and nudges are retired",
      window.__gardenClueTarget() === null && window.__cuddlyDoorNeeded() === false &&
      !document.getElementById("office-pc-desk-trio").classList.contains("inviting") &&
      !document.getElementById("office-monitor").classList.contains("await-turn"));

    window.__goToStage("cuddly");
    document.getElementById("cuddly-octopus").classList.add("played");
    document.getElementById("cuddly-balcony-door").classList.add("open");
    window.__pullMainBlanket();
    await sleep(850);
    check("a phase-two blanket completion stays in the cuddly room",
      window.__currentStageName === "cuddly" && !document.getElementById("cuddly-blanket").classList.contains("done"),
      window.__currentStageName);

    window.__goToStage("office");
    window.__pragueCalled = true; window.__pcPlayed = true;
    document.getElementById("office-lamp").classList.add("dimmed");
    document.getElementById("office-pendant").classList.add("dimmed");
    document.getElementById("office-stainedglass").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await sleep(2150);
    check("a phase-two butterfly completion stays in the office",
      window.__currentStageName === "office" && !document.getElementById("office-stainedglass").classList.contains("done"),
      window.__currentStageName);

    window.__goToStage("garden");
    if (window.__retirePartyRoomMapCoach) window.__retirePartyRoomMapCoach();
    document.getElementById("hunt-next").dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    check("the next-room arrow remains functional", window.__currentStageName === "cuddly", window.__currentStageName);
    await sleep(700);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    check("room arrow keys remain functional", window.__currentStageName === "office", window.__currentStageName);
    await sleep(700);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true, cancelable: true }));
    check("room number keys remain functional", window.__currentStageName === "kitchen", window.__currentStageName);
    document.querySelectorAll(".hunt-dot")[4].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    check("room dots remain functional", window.__currentStageName === "balcony", window.__currentStageName);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push("harness: " + String(error && error.stack || error)); }).then(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 11000, { patchRaf: true, seedRandom: true });
if (!result) { console.error("phase-two progression: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + item.detail));
  if (!item.pass) failed = true;
});
if (result.errors.length) { failed = true; console.error("runtime errors:\n  " + result.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("phase-two progression: all " + result.checks.length + " checks passed");
