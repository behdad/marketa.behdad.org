#!/usr/bin/env node
"use strict";

// A real cooked batch, rather than merely lighting the smoker, prompts Hamid's
// one-shot group-chat announcement.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }

  window.__gameStarted = function () { return true; };
  window.__secondRound = true;
  window.__monitorMessageRewrite = null;
  var cheerCalls = 0, originalCheer = window.__balconyFoodReadyReaction;
  window.__balconyFoodReadyReaction = function () {
    cheerCalls++;
    return originalCheer ? originalCheer() : false;
  };
  window.__setGardenParty(true, true);
  if (window.__resetPhoneApps) window.__resetPhoneApps();
  window.__goToStage("balcony");
  window.__setBalconyBBQCrowd(true);
  document.getElementById("balcony-smoker-firebox").dispatchEvent(new MouseEvent("click", { bubbles: true }));

  setTimeout(function () {
    check("lighting alone does not announce food", !window.__phoneMessageReceived("hamid_food"));
  }, 1500);
  setTimeout(function () {
    var cooked = document.querySelectorAll("#balcony-smoker .smoker-burger.done").length;
    var ids = window.__phoneMessageThread();
    check("the food actually finishes cooking", cooked > 0, String(cooked));
    check("Hamid announces the first cooked batch", window.__phoneMessageReceived("hamid_food"), ids.join(","));
    check("the simultaneous patties produce one announcement", ids.filter(function (id) { return id === "hamid_food"; }).length === 1, ids.join(","));
    check("the first-ready announcement prompts one balcony reaction", cheerCalls === 1, String(cheerCalls));
    document.getElementById("bh-jay").classList.add("bh-present");
    var burgerHandoff = window.__balconyGuestTakePlate("burger");
    check("vegetarian Jay is never handed a burger", !burgerHandoff || burgerHandoff.recipient !== "jay", JSON.stringify(burgerHandoff));
    var tofuHandoff = window.__balconyGuestTakePlate("tofu");
    check("tofu preferentially goes to vegetarian Jay when he is outside", tofuHandoff && tofuHandoff.recipient === "jay", JSON.stringify(tofuHandoff));
    check("Jay stays quiet after his first tofu plate", !window.__phoneMessageReceived("jay_bbq_satisfied"));
    var secondTofuHandoff = window.__balconyGuestTakePlate("tofu");
    check("Jay receives a second tofu plate while still hungry", secondTofuHandoff && secondTofuHandoff.recipient === "jay", JSON.stringify(secondTofuHandoff));
    check("the officiant officially declares his hunger satisfied", window.__phoneMessageReceived("jay_bbq_satisfied"), window.__phoneMessageThread().join(","));
    var postSatisfactionHandoff = window.__balconyGuestTakePlate("tofu");
    check("satisfied Jay stops monopolizing the tofu", postSatisfactionHandoff && postSatisfactionHandoff.recipient !== "jay", JSON.stringify(postSatisfactionHandoff));
    document.querySelectorAll("#balcony-hangout .bh-served-plate").forEach(function (plate) { plate.remove(); });
    document.getElementById("balcony-smoker-lid").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    check("the smoker can be closed over cooked food", !document.getElementById("balcony-smoker").classList.contains("open"));
    var firstKind = window.__balconyServeReadyBurger();
    check("serving always raises the smoker lid", document.getElementById("balcony-smoker").classList.contains("open"));
    var handoff = window.__balconyLastFoodHandoff();
    var heldPlate = document.querySelector("#balcony-hangout .bh-fig.bh-present .bh-served-plate");
    check("a real serving places the matching food with a present balcony guest",
      !!firstKind && !!handoff && handoff.kind === firstKind && !!heldPlate &&
      heldPlate.getAttribute("data-kind") === firstKind && heldPlate.getAttribute("data-recipient") === handoff.recipient,
      JSON.stringify({ kind: firstKind, handoff: handoff, hangout: document.getElementById("balcony-hangout").getAttribute("class"), present: document.querySelectorAll("#balcony-hangout .bh-fig.bh-present").length }));
    window.__goToStage("cuddly"); // keep Hamid's ambient serve loop from racing this inventory probe
    check("leaving the balcony preserves the party assignment and its brief held plate",
      !!document.querySelector("#balcony-hangout .bh-served-plate"));
    for (var first = 1; first < 3; first++) window.__balconyServeReadyBurger();
  }, 7600);
  setTimeout(function () {
    var refill = window.__bbqFoodState();
    check("the first three plates replenish once", refill.served === 3 && refill.depleted === 0 && !refill.empty, JSON.stringify(refill));
  }, 8500);
  setTimeout(function () {
    var ids = window.__phoneMessageThread();
    var rows = window.__checkpointPhoneCapture().rows;
    var replies = rows.filter(function (row) { return row.id === "bbq_cheer_madla" || row.id === "bbq_cheer_pouria"; });
    var hamid = rows.filter(function (row) { return row.id === "hamid_food"; })[0];
    check("Madla and Pouria answer Hamid's food-ready call", ids.indexOf("bbq_cheer_madla") !== -1 && ids.indexOf("bbq_cheer_pouria") !== -1, ids.join(","));
    check("both cheerful answers quote Hamid's message", replies.length === 2 && replies.every(function (row) { return row.message.replyTo === "hamid_food"; }), JSON.stringify(replies));
    check("the wedding crowd emoji-reacts to Hamid's call", hamid && ["🔥", "🎉", "❤️"].every(function (emoji) { return hamid.reactions.indexOf(emoji) !== -1; }), hamid && JSON.stringify(hamid.reactions));
  }, 13200);
  setTimeout(function () {
    for (var last = 0; last < 3; last++) window.__balconyServeReadyBurger();
  }, 14200);
  setTimeout(function () {
    var midpoint = window.__bbqFoodState();
    check("six servings leave half the cookout still to serve", midpoint.served === 6 && midpoint.capacity === 12 && midpoint.depleted === 0 && !midpoint.empty, JSON.stringify(midpoint));
    check("Hamid does not sign off at the old six-serving limit", !window.__phoneMessageReceived("hamid_bbq_done"));
  }, 15000);
  setTimeout(function () {
    for (var third = 0; third < 3; third++) window.__balconyServeReadyBurger();
  }, 20800);
  setTimeout(function () {
    for (var fourth = 0; fourth < 3; fourth++) window.__balconyServeReadyBurger();
  }, 27400);
  setTimeout(function () {
    var final = window.__bbqFoodState(), ids = window.__phoneMessageThread();
    var smoker = document.getElementById("balcony-smoker");
    check("after the twelfth serving Hamid turns the grill off and closes its lid",
      !final.on && !smoker.classList.contains("smoking") && !smoker.classList.contains("open"),
      JSON.stringify({ food: final, classes: smoker.getAttribute("class") }));
    check("Hamid's shutdown replenishes all three grate positions for the next cookout",
      final.served === 0 && final.capacity === 12 && final.depleted === 0 && !final.empty,
      JSON.stringify(final));
    check("Hamid signs off when the smoker is empty", window.__phoneMessageReceived("hamid_bbq_done"), ids.join(","));
    check("the closing message is also one-shot", ids.filter(function (id) { return id === "hamid_bbq_done"; }).length === 1, ids.join(","));
    document.getElementById("balcony-smoker-firebox").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    var on = window.__bbqFoodState();
    check("relighting begins with the fresh inventory intact", on.served === 0 && on.depleted === 0 && !on.empty, JSON.stringify(on));
    document.getElementById("balcony-smoker-firebox").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    var off = window.__bbqFoodState();
    check("turning the grill off keeps its inventory replenished", off.served === 0 && off.depleted === 0 && !off.empty, JSON.stringify(off));
    window.__resetSmoker();
    report();
  }, 28300);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 30000, {
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2031-05-02&time=18:00"
});

if (!report) { console.error("bbq-message: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("bbq-message: all " + report.checks.length + " checks passed");
