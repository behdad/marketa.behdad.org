#!/usr/bin/env node
"use strict";

// Aspen follows subjects, not rooms. In particular, the deliberately quiet office spends
// short intervals empty; her clone, camera animation, shutter and album write must all stay
// out until the office hangout controller publishes a couple.
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
    window.__setGardenParty(true, false);
    window.__goToStage("kitchen");
    window.__loftControllers.couples(false);
    var barAspen = document.getElementById("kitchen-photographer");
    check("the bar can settle with no guest couple", window.__barCoupleNow() === null);
    check("Aspen stays away while Pouria works alone", barAspen && !barAspen.classList.contains("showing"));
    window.__loftControllers.couples("alireza");
    check("Aspen joins when bar guests arrive", barAspen.classList.contains("showing"));
    window.__loftControllers.couples(false);
    check("Aspen leaves when the bar returns to Pouria alone", !barAspen.classList.contains("showing"));

    window.__goToStage("office");
    window.__loftControllers.officefolks(false);
    var aspen = document.getElementById("office-photographer");
    var cam = aspen && aspen.querySelector(".photog-cam");
    var before = window.__albumList().length;
    var emptyShot = window.__photogSnap("office", false, true);
    check("empty office has no photo subjects", !window.__roomHasPhotoSubjects("office") && window.__roomOccupants("office").length === 0);
    check("Aspen stays out of an empty office", aspen && !aspen.classList.contains("showing"));
    check("empty office rejects flash, shutter and keepsake", emptyShot === null && window.__albumList().length === before && !(cam && cam.classList.contains("aiming")));

    window.__loftControllers.officefolks("madla");
    var names = window.__roomOccupants("office").map(function (person) { return person.name; });
    check("office couple creates photographable occupancy", window.__roomHasPhotoSubjects("office") && names.indexOf("Madla") !== -1 && names.indexOf("Robert") !== -1, names.join(","));
    check("Aspen follows subjects into the office", aspen.classList.contains("showing"));
    var occupiedShot = window.__photogSnap("office", false, true);
    check("occupied office accepts a keepsake", !!occupiedShot && occupiedShot.room === "office" && window.__albumList().length === before + 1);

    window.__loftControllers.officefolks(false);
    check("Aspen leaves as soon as the office empties", !window.__roomHasPhotoSubjects("office") && !aspen.classList.contains("showing"));

    window.__goToStage("garden");
    if (window.__summonGuests) window.__summonGuests();
    var childKeys = { irene: 1, robin: 1, navid: 1, elisabeth: 1, felix: 1, "patricia-son": 1, "patricia-daughter": 1, hannah: 1 };
    document.querySelectorAll("#garden-guests .guest").forEach(function (el) {
      var cls = Array.prototype.find.call(el.classList, function (name) { return name.indexOf("g-") === 0; });
      if (!childKeys[cls ? cls.slice(2) : ""]) el.classList.add("off-at-games");
    });
    window.__assignPartyKids(true);
    var gardenStage = document.getElementById("stage-garden");
    check("Aspen leaves when every garden subject is assigned elsewhere",
      !window.__roomHasPhotoSubjects("garden") && gardenStage.classList.contains("photog-empty"));

    var visitor = document.querySelector("#cuddly-visitors-layer .cuddly-visitor");
    if (visitor) visitor.classList.add("showing");
    window.__assignPartyKids(true);
    check("Aspen returns when child allocation repopulates the garden",
      window.__roomHasPhotoSubjects("garden") && !gardenStage.classList.contains("photog-empty"));
    if (visitor) visitor.classList.remove("showing");
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

if (!report) { console.error("photographer occupancy: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("photographer occupancy: all " + report.checks.length + " checks passed");
