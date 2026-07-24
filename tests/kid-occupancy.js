#!/usr/bin/env node
"use strict";

// The Cuddly game tableau and garden dance floor share six named children. Entering the
// nook must transfer those identities, not paint a second copy in another room.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  try {
    var kids = ["irene", "robin", "navid", "elisabeth", "felix", "hannah"];
    window.__setGardenParty(true, false);
    if (window.__fillGardenGuestCap) window.__fillGardenGuestCap();
    if (window.__setPartyKidFormation) window.__setPartyKidFormation("free");
    window.goToStage("cuddly");
    window.__updateKidGames();

    var gameNames = window.__kidGamesNow().map(function (p) { return p.name.toLowerCase(); });
    var moved = kids.filter(function (name) {
      var floor = document.querySelector("#garden-guests .g-" + name);
      return floor && floor.classList.contains("off-in-nook");
    });
    var audit = window.__peopleManager.audit();
    check("Cuddly games seat all six named children", kids.every(function (name) { return gameNames.indexOf(name) !== -1; }), gameNames.join(","));
    check("the same six children leave the garden floor atomically", moved.length === kids.length, moved.join(","));
    check("Hannah is not duplicated across garden and Cuddly", audit.ok && !(audit.duplicates || []).some(function (d) { return d.key === "hannah"; }), JSON.stringify(audit.duplicates));

    window.goToStage("garden");
    window.__updateKidGames();
    var stranded = kids.filter(function (name) {
      var floor = document.querySelector("#garden-guests .g-" + name);
      return floor && floor.classList.contains("off-in-nook");
    });
    check("leaving Cuddly returns only the nook-owned attendance", !window.__kidGamesNow().length && !stranded.length, stranded.join(","));
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
  }
  report();
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 4000, {
  forceMotion: true,
  seedRandom: true
});

if (!report) { console.error("kid occupancy: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("kid occupancy: all " + report.checks.length + " checks passed");
