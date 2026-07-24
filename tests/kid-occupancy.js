#!/usr/bin/env node
"use strict";

// One eight-child inventory drives the garden floor, chase sprites, sleep, and Cuddly seats.
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
    var kids = ["irene", "robin", "navid", "elisabeth", "felix", "patricia-son", "patricia-daughter", "hannah"];
    window.__setGardenParty(true, false);
    if (window.__summonGuests) window.__summonGuests();
    if (window.__syncMousesVisitingClass) { window.__mousesVisiting = true; window.__syncMousesVisitingClass(); }
    kids.concat(["bahareh", "madla", "robert", "patricia", "baharak", "payman"]).forEach(function (name) {
      var figure = document.querySelector("#garden-guests .g-" + name);
      if (figure) { figure.classList.add("arrived"); figure.classList.remove("leaving", "off-at-bbq"); }
    });
    window.__assignPartyKids(true);
    window.goToStage("cuddly");
    window.__updateKidGames();

    var gameNames = window.__kidGamesNow().map(function (p) { return p.name.toLowerCase(); });
    var moved = kids.filter(function (name) {
      var floor = document.querySelector("#garden-guests .g-" + name);
      return floor && floor.classList.contains("off-at-games");
    });
    var audit = window.__peopleManager.audit();
    check("Cuddly can seat all eight named children", kids.every(function (name) { return gameNames.indexOf(name) !== -1; }), gameNames.join(","));
    check("the same eight children leave the garden floor", moved.length === kids.length, moved.join(","));
    check("no child duplicates across garden and Cuddly", audit.ok && !(audit.duplicates || []).some(function (d) { return kids.indexOf(d.key) !== -1; }), JSON.stringify(audit.duplicates));

    window.goToStage("garden");
    window.__updateKidGames();
    var stillAssigned = kids.filter(function (name) {
      var floor = document.querySelector("#garden-guests .g-" + name);
      return floor && floor.classList.contains("off-at-games");
    });
    check("leaving Cuddly hides the tableau without a display-owned assignment",
      !window.__kidGamesNow().length && kids.every(function (name) {
        return !document.querySelector("#garden-guests .g-" + name).classList.contains("off-in-nook");
      }), stillAssigned.join(","));

    var oldRandom = Math.random;
    Math.random = function () { return 0.99; };
    window.__setKidsAsleep(true);
    window.goToStage("cuddly");
    window.__updateKidGames();
    var asleep = kids.filter(function (name) {
      var floor = document.querySelector("#garden-guests .g-" + name);
      return floor && floor.classList.contains("off-asleep");
    });
    check("sleep clears Cuddly and parks non-dancers asleep", !window.__kidGamesNow().length && asleep.length === kids.length, asleep.join(","));
    Math.random = oldRandom;
    window.__setKidsAsleep(false);
    var visitor = document.querySelector("#cuddly-visitors-layer .cuddly-visitor");
    if (visitor) visitor.classList.add("showing");
    window.__assignPartyKids(true);
    window.__updateKidGames();
    check("an occupied nook sends every child back to the party floor",
      !window.__kidGamesNow().length && kids.every(function (name) {
        return !document.querySelector("#garden-guests .g-" + name).classList.contains("off-at-games");
      }));
    if (visitor) visitor.classList.remove("showing");

    window.goToStage("garden");
    window.__assignPartyKids(true);
    window.goToStage("balcony");
    window.__setSnowman(true);
    var seasonal = window.__balconyBorrowedKidNames();
    var balconyNames = window.__whoIsHere("balcony").map(function (p) { return p.key; });
    check("seasonal balcony play borrows two Cuddly-assigned children",
      seasonal.length === 2 && seasonal.every(function (name) {
        return document.querySelector("#garden-guests .g-" + name).classList.contains("off-at-games");
      }), seasonal.join(","));
    check("borrowed seasonal children publish through the balcony inventory",
      seasonal.every(function (name) { return balconyNames.indexOf(name) !== -1; }), balconyNames.join(","));
    window.__setSnowman(false);
    check("ending seasonal play releases its temporary borrowing", window.__balconyBorrowedKidNames().length === 0);

    window.goToStage("garden");
    window.__assignPartyKids(true);
    window.goToStage("balcony");
    window.__setSmores(true);
    var smores = window.__balconyBorrowedKidNames();
    var smoresNames = window.__whoIsHere("balcony").map(function (p) { return p.key; });
    check("s'mores borrows two eligible named children from Cuddly",
      smores.length === 2 && smores.every(function (name) {
        return ["irene", "robin", "navid"].indexOf(name) !== -1 &&
          document.querySelector("#garden-guests .g-" + name).classList.contains("off-at-games");
      }), smores.join(","));
    check("s'mores children publish through the balcony inventory",
      smores.every(function (name) { return smoresNames.indexOf(name) !== -1; }), smoresNames.join(","));
    window.__setSmores(false);
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
