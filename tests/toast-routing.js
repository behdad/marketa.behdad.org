#!/usr/bin/env node
"use strict";

// Toast speakers stay in their real room: Ali begins inside, then the camera
// follows Farhang to the balcony when the BBQ split has assigned him there.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  var momentEchoes = [];
  window.__loftControllers.say = function (message) { momentEchoes.push(String(message)); };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }

  try {
  window.__gameStarted = function () { return true; };
  window.__secondRound = true;
  window.__setGardenParty(true, true);
  window.__goToStage("garden");
  window.__summonGuests();
  window.__goToStage("balcony");
  for (var attempt = 0; attempt < 24; attempt++) {
    window.__setBalconyBBQCrowd(false);
    window.__setBalconyBBQCrowd(true);
    if (window.__bbqSplitState().guests.indexOf("farhang") !== -1) break;
  }
  var split = window.__bbqSplitState();
  check("test setup assigns Farhang to the balcony", split.guests.indexOf("farhang") !== -1, split.guests.join(","));
  var plan = window.__toastSpeakerPlan();
  check("toast plan keeps Ali inside and Farhang outside", plan[0].key === "ali" && plan[0].room === "garden" && plan[1].key === "farhang" && plan[1].room === "balcony", JSON.stringify(plan));
  check("room-aware toast sequence starts", window.__startToasts() && window.__toastsOn);
  check("a directly-started moment echoes once",
    momentEchoes.filter(function (line) { return line.indexOf("🥂") !== -1; }).length === 1,
    momentEchoes.join(" | "));

  setTimeout(function () {
    var bubble = document.querySelector(".egg-bubble.party-toast-tour");
    check("the first toast pans to Ali in the garden",
      window.__currentStageName === "garden" && bubble && bubble.getAttribute("data-speaker") === "ali",
      window.__currentStageName + " / " + (bubble && bubble.getAttribute("data-speaker")));
  }, 1100);
  setTimeout(function () {
    var bubble = document.querySelector(".egg-bubble.party-toast-tour");
    check("the second toast pans to Farhang on the balcony",
      window.__currentStageName === "balcony" && bubble && bubble.getAttribute("data-speaker") === "farhang",
      window.__currentStageName + " / " + (bubble && bubble.getAttribute("data-speaker")));
  }, 5700);
  setTimeout(function () {
    check("toast tour ends cleanly", !window.__toastsOn && !document.querySelector(".egg-bubble.party-toast-tour"));
    var floorCount = Array.from(document.querySelectorAll("#garden-guests .guest.arrived:not(.leaving)")).filter(function (el) {
      return !el.classList.contains("off-with-kids") &&
             !el.classList.contains("off-at-games") &&
             !el.classList.contains("off-asleep") &&
             !el.classList.contains("off-at-bbq");
    }).length;
    check("toast tour releases its summoned crowd", floorCount <= 8, String(floorCount));
    window.__setBalconyBBQCrowd(false);
    report();
  }, 9800);
  } catch (error) {
    check("toast routing setup completes", false, String(error && error.stack || error));
    report();
  }
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 11000, {
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2031-05-02&time=18:00"
});

if (!report) { console.error("toast-routing: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("toast-routing: all " + report.checks.length + " checks passed");
