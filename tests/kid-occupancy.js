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
    window.goToStage("cuddly");
    window.__setDayNight(false);
    window.__ireneShow("irene-sit");
    window.__setDayNight(true);
    check("night immediately clears an ordinary child cameo",
      ["irene", "robin", "navid"].every(function (name) {
        return !document.getElementById("cuddly-" + name).classList.contains("showing");
      }));
    window.__robinAppear("robin-sit");
    window.__navidAppear("navid-sit");
    window.__ireneSummon();
    check("ordinary child cameos cannot appear at night",
      ["irene", "robin", "navid"].every(function (name) {
        return !document.getElementById("cuddly-" + name).classList.contains("showing");
      }));
    window.__cuddlyProjector.set("totoro");
    check("the non-party Totoro cameo audience stays out at night",
      ["irene", "robin", "navid"].every(function (name) {
        return !document.getElementById("cuddly-" + name).classList.contains("showing");
      }));
    window.__setDayNight(false);
    check("daylight restores the non-party Totoro cameo audience",
      ["irene", "robin", "navid"].every(function (name) {
        return document.getElementById("cuddly-" + name).classList.contains("showing");
      }));
    window.__cuddlyProjector.set("fire");
    window.__resetIrene();
    window.__resetRobin();
    window.__resetNavid();

    window.__setGardenParty(true, false);
    if (window.__ireneSummon) window.__ireneSummon();
    if (window.__robinAppear) window.__robinAppear();
    if (window.__navidAppear) window.__navidAppear();
    check("ordinary child cameos stay out while the party inventory is active",
      ["irene", "robin", "navid"].every(function (name) {
        return !document.getElementById("cuddly-" + name).classList.contains("showing");
      }));
    window.goToStage("garden");
    if (window.__syncMousesVisitingClass) { window.__mousesVisiting = true; window.__syncMousesVisitingClass(); }
    if (window.__summonGuests) window.__summonGuests();
    kids.concat(["bahareh", "madla", "robert", "patricia", "baharak", "payman"]).forEach(function (name) {
      var figure = document.querySelector("#garden-guests .g-" + name);
      if (figure) { figure.classList.add("arrived"); figure.classList.remove("leaving", "off-at-bbq"); }
    });
    window.__assignPartyKids(true);
    window.goToStage("cuddly");
    window.__updateKidGames();

    var gameKeys = window.__kidGamesNow().map(function (p) { return p.key; });
    var moved = kids.filter(function (name) {
      var floor = document.querySelector("#garden-guests .g-" + name);
      return floor && floor.classList.contains("off-at-games");
    });
    var audit = window.__peopleManager.audit();
    check("Cuddly can seat all eight children", kids.every(function (name) { return gameKeys.indexOf(name) !== -1; }), gameKeys.join(","));
    check("the same eight children leave the garden floor", moved.length === kids.length, moved.join(","));
    check("no child duplicates across garden and Cuddly", audit.ok && !(audit.duplicates || []).some(function (d) { return kids.indexOf(d.key) !== -1; }), JSON.stringify(audit.duplicates));
    var placement = window.__partyKidPlacement;
    check("every attending child has exactly one persistent home",
      placement.games.length + placement.dancing.length + placement.asleep.length === 8 &&
      kids.every(function (name) {
        return [placement.games, placement.dancing, placement.asleep].filter(function (group) { return group.indexOf(name) !== -1; }).length === 1;
      }), JSON.stringify(placement));

    window.goToStage("cuddly");
    window.__cuddlyProjector.set("totoro");
    window.__setKidsAsleep(true);
    var totoroPlacement = window.__assignPartyKids(false);
    window.__updateKidGames();
    check("party Totoro seats all eight children and overrides dance or sleep",
      window.__kidGamesNow().length === 8 && totoroPlacement.games.length === 8 &&
      !totoroPlacement.dancing.length && !totoroPlacement.asleep.length &&
      ["irene", "robin", "navid"].every(function (name) {
        return !document.getElementById("cuddly-" + name).classList.contains("showing");
      }), JSON.stringify(totoroPlacement));
    window.__setKidsAsleep(false);
    window.__cuddlyProjector.set("fire");

    window.goToStage("garden");
    window.__duoDepart("family");
    window.__assignPartyKids(true);
    check("children remain in the party inventory when their adults rotate off the floor",
      ["patricia-son", "patricia-daughter"].every(function (name) {
        var floor = document.querySelector("#garden-guests .g-" + name);
        return window.__partyGuestAttended(name) && floor.classList.contains("arrived") && floor.classList.contains("off-at-games");
      }));

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
    var smoresPool = window.__cuddlyAssignedKidNames().slice();
    var smoresPlacement = window.__partyKidPlacement || {};
    (smoresPlacement.games || []).concat(smoresPlacement.dancing || []).forEach(function (name) {
      if (smoresPool.length < 2 && smoresPool.indexOf(name) === -1) smoresPool.push(name);
    });
    var smoresEligible = smoresPool.filter(function (name) {
      return ["irene", "robin", "navid"].indexOf(name) !== -1;
    });
    window.__setSmores(true);
    var smores = window.__balconyBorrowedKidNames();
    var smoresNames = window.__whoIsHere("balcony").map(function (p) { return p.key; });
    check("s'mores borrows the available eligible named children from Cuddly",
      smores.length === Math.min(2, smoresEligible.length) && smores.every(function (name, index) {
        return smores.indexOf(name) === index && smoresEligible.indexOf(name) !== -1 &&
          document.querySelector("#garden-guests .g-" + name).classList.contains("off-at-games");
      }), "eligible=" + smoresEligible.join(",") + "; borrowed=" + smores.join(","));
    check("s'mores children publish through the balcony inventory",
      smores.every(function (name) { return smoresNames.indexOf(name) !== -1; }), smoresNames.join(","));
    window.__setSmores(false);

    window.goToStage("cuddly");
    kids.forEach(function (name, index) {
      var floor = document.querySelector("#garden-guests .g-" + name);
      floor.classList.toggle("off-at-games", index < 5);
      floor.classList.remove("off-asleep");
    });
    window.__updateKidGames();
    var seatedX = kids.slice(0, 5).map(function (name) {
      var rock = document.querySelector("#cuddly-kidgames .kg-" + name);
      var match = rock && rock.parentNode.getAttribute("transform").match(/translate\(([-\d.]+)/);
      return match ? +match[1] : -1;
    });
    var leftSeats = seatedX.filter(function (x) { return x < 340; }).length;
    check("five Cuddly children balance across both game groups instead of filling left-to-right",
      leftSeats === 2 || leftSeats === 3, seatedX.join(","));
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
