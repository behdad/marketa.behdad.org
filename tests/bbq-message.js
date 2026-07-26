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
  window.goToStage("balcony");
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
    window.goToStage("cuddly"); // keep Hamid's ambient serve loop from racing this inventory probe
    for (var first = 0; first < 3; first++) window.__balconyServeReadyBurger();
  }, 7600);
  setTimeout(function () {
    var refill = window.__bbqFoodState();
    check("the first three plates replenish once", refill.served === 3 && refill.depleted === 0 && !refill.empty, JSON.stringify(refill));
  }, 8500);
  setTimeout(function () {
    for (var last = 0; last < 3; last++) window.__balconyServeReadyBurger();
  }, 14200);
  setTimeout(function () {
    var final = window.__bbqFoodState(), ids = window.__phoneMessageThread();
    check("six servings visibly exhaust all three grate positions", final.served === 6 && final.depleted === 3 && final.empty, JSON.stringify(final));
    check("Hamid signs off when the smoker is empty", window.__phoneMessageReceived("hamid_bbq_done"), ids.join(","));
    check("the closing message is also one-shot", ids.filter(function (id) { return id === "hamid_bbq_done"; }).length === 1, ids.join(","));
    window.resetSmoker();
    var reset = window.__bbqFoodState();
    check("the normal smoker reset restores a full fresh inventory", reset.served === 0 && reset.depleted === 0 && !reset.empty, JSON.stringify(reset));
    report();
  }, 15000);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 16500, {
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
