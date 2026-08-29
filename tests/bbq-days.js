#!/usr/bin/env node
"use strict";

// Canada Day and Sizdah Bedar share May 2's open daytime-BBQ workflow while retaining their
// own decor/banner. Fireworks must be empty once play leaves the balcony/garden sky rooms.
var lib = require("./lib");

function harness(cfg) {
  return String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: ${JSON.stringify(cfg.name)} + ": " + name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  function fireworkCount() {
    return document.querySelectorAll("#balcony-fireworks .fw-particle,#garden-skyfx .fw-particle,#balcony-fwfinale .bfw-particle,.room-fireworks-burst").length;
  }

  window.__gameStarted = function () { return true; };
  if (window.__deliverDateInvite) window.__deliverDateInvite();
  check("is an open-BBQ occasion day", window.__bbqDateNow());
  check("keeps its own seasonal decor", document.getElementById("loft-game-strip").classList.contains(${JSON.stringify(cfg.decor)}));
  var banner = document.getElementById("occasion-banner");
  check("keeps its own date-preview banner", !!banner && banner.getAttribute("data-i") === ${JSON.stringify(cfg.banner)}, banner && banner.getAttribute("data-i"));
  check("BBQ prompt waits through phase one", !window.__phoneMessageReceived("bbq"));

  window.__setPartyMode(true);
  setTimeout(function () {
    var strip = document.getElementById("loft-game-strip"), balcony = document.getElementById("stage-balcony");
    check("party starts in daylight without UV", window.__gardenPartyOn && !balcony.classList.contains("dusk") && !strip.classList.contains("uv-mode"));
    check("Behdad's BBQ prompt releases in phase two", window.__phoneMessageReceived("bbq"));
    check("prompt waits for a click before splitting", !window.__bbqSplitOn && !document.getElementById("balcony-smoker").classList.contains("smoking"));

    window.__runMsgAction("bbq");
    setTimeout(function () {
      check("prompt starts the smoker and natural split", window.__partyBBQOn() && window.__bbqSplitOn && document.getElementById("balcony-smoker").classList.contains("smoking"));
      window.__goToStage("garden");
      window.__loftControllers.fireworks();
      check("garden may render fireworks", fireworkCount() > 0, String(fireworkCount()));
      window.__goToStage("office");
      check("office clears every firework host", fireworkCount() === 0, String(fireworkCount()));
      window.__loftControllers.fireworks();
      check("office refuses new fireworks", fireworkCount() === 0, String(fireworkCount()));
      report();
    }, 900);
  }, 180);
})();
</script>`;
}

var cases = [
  { name: "Canada Day", url: "?date=2031-07-01&time=18:00", decor: "season-canada", banner: "season_canada" },
  { name: "Sizdah Bedar", url: "?date=2027-04-02&time=18:00", decor: "sizdah", banner: "season_sizdah" }
];

var failed = false;
cases.forEach(function (cfg) {
  var report = lib.runPageSync("rsvp.html", harness(cfg), 3500, { forceMotion: true, seedRandom: true, urlSuffix: cfg.url });
  if (!report) { console.error(cfg.name + ": no report"); failed = true; return; }
  report.checks.forEach(function (c) {
    console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
    if (!c.pass) failed = true;
  });
  if (report.errors.length) { failed = true; console.error(cfg.name + " runtime errors:\n  " + report.errors.join("\n  ")); }
});

if (failed) process.exit(1);
console.log("bbq-days: all checks passed");
