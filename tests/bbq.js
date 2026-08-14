#!/usr/bin/env node
"use strict";

// May-2 occasion integration: daylight garden party first; the Behdad text then starts
// a stable 4-adult balcony rotation with both hosts, Hamid, Aspen, and the kids in the nook.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function names(room) { return (window.__whoIsHere ? window.__whoIsHere(room) : []).map(function (p) { return p.name; }); }
  function same(a, b) { return JSON.stringify(a.slice().sort()) === JSON.stringify(b.slice().sort()); }
  function intersection(a, b) { return a.filter(function (v) { return b.indexOf(v) !== -1; }); }
  function unexpectedDuplicates(audit) {
    if (!audit) return null;
    return audit.duplicates.filter(function (d) {
      var rooms = d.rooms || [];
      // Aspen follows the visible room while her canonical garden source remains registered;
      // the rooms never render together, so accept only that garden/current-room overlap.
      return !(d.key === "aspen" && rooms.length === 2 && rooms.indexOf("garden") !== -1 && rooms.indexOf(window.__currentStageName) !== -1);
    });
  }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }

  // Exercise the player path: the date invite queues during phase one, then the real balcony
  // switch starts the party. No forced occasion setup is allowed to pre-seed BBQ state here.
  window.__gameStarted = function () { return true; };
  window.__monitorMessageRewrite = null; // this integration owns BBQ state, not an external Chat request
  try { localStorage.setItem("dateInvite:bbq:4-2", "1"); } catch (e) {} // simulate an earlier May-2 playthrough in this browser
  if (window.__deliverDateInvite) window.__deliverDateInvite();
  check("BBQ message waits during phase one", !(window.__phoneMessageReceived && window.__phoneMessageReceived("bbq")) && !window.__secondRound);
  if (window.__goToStage) window.__goToStage("balcony");
  var partySwitch = document.getElementById("balcony-partyswitch");
  if (partySwitch) partySwitch.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  setTimeout(function () {
    var garden = document.getElementById("stage-garden"), balcony = document.getElementById("stage-balcony");
    check("May-2 switch drops into the garden", window.__currentStageName === "garden", window.__currentStageName);
    check("May-2 switch starts a party", !!window.__gardenPartyOn);
    check("May-2 party stays daylight", !garden.classList.contains("dusk") && !balcony.classList.contains("dusk"));
    check("May-2 party starts without UV", !document.getElementById("loft-game-strip").classList.contains("uv-mode"));
    check("Behdad's BBQ message releases despite a prior-run latch", !!(window.__phoneMessageReceived && window.__phoneMessageReceived("bbq")));
    try { check("delivered BBQ message sets the reload latch", localStorage.getItem("dateInvite:bbq:4-2") === "1"); } catch (e) {}
    var beforeDropIns = window.__cuddlyVisitorDuos().filter(function (id) { return window.__phoneMessageReceived("visit_" + id); }).length;
    var nativeTimeout = window.setTimeout, visitorTick = null;
    window.setTimeout = function (fn, ms) { if (ms >= 40000 && ms <= 90000 && !visitorTick) { visitorTick = fn; return -1; } return nativeTimeout.apply(window, arguments); };
    window.__startCuddlyVisitorDrip();
    window.setTimeout = nativeTimeout;
    if (visitorTick) visitorTick();
    var afterDropIns = window.__cuddlyVisitorDuos().filter(function (id) { return window.__phoneMessageReceived("visit_" + id); }).length;
    check("May 2 suppresses autonomous are-you-home texts", beforeDropIns === afterDropIns, beforeDropIns + " -> " + afterDropIns);
    var moments = ["firstdance", "slowdance", "toasts", "groupphoto", "sparklers", "cake", "bouquet"];
    var eligibleMoments = intersection(window.__partyTextChoices(), moments);
    check("May 2 excludes wedding-moment texts", eligibleMoments.length === 0, eligibleMoments.join(","));
    check("balcony split waits for invitation", !(window.__bbqSplitState && window.__bbqSplitState().on));
    check("grill waits for invitation", !document.getElementById("balcony-smoker").classList.contains("smoking"));
    setTimeout(function () {
      window.__runMsgAction("bbq");
      setTimeout(function () {
      var state = window.__bbqSplitState();
      var deck = names("balcony"), selected = state.guests.slice();
      if (window.__peopleManager && window.__peopleManager.reconcile) window.__peopleManager.reconcile();
      var peopleAudit = window.__peopleManager && window.__peopleManager.audit();
      var unexpectedPeopleDuplicates = unexpectedDuplicates(peopleAudit);
      check("people manager is the occupancy authority", !!(window.__peopleManager && window.__peopleManager.occupants && window.__peopleManager.inventory && window.__peopleManager.locate));
      check("BBQ split has no unexpected cross-room duplicates", !!unexpectedPeopleDuplicates && !unexpectedPeopleDuplicates.length, unexpectedPeopleDuplicates ? JSON.stringify(unexpectedPeopleDuplicates) : "manager missing");
      check("invitation pans to balcony", window.__currentStageName === "balcony", window.__currentStageName);
      check("invitation starts split", state.on && window.__bbqSplitOn);
      check("exactly four adults rotate", selected.length === 4, selected.join(","));
      check("host pair changes the deck from five to seven figures", window.__balconyHangoutNow().length === (state.hostsOnBalcony ? 7 : 5), window.__balconyHangoutNow().map(function (p) { return p.name; }).join(","));
      check("host pair changes total balcony occupancy together", deck.length === (state.hostsOnBalcony ? 9 : 7), deck.join(","));
      check("both hosts share one BBQ location",
        (deck.indexOf("Behdad") !== -1) === state.hostsOnBalcony && (deck.indexOf("Markéta") !== -1) === state.hostsOnBalcony, deck.join(","));
      check("day BBQ weights the hosts 75% toward the balcony", window.__bbqHostBalconyChance() === 0.75);
      var balconyAspen = document.getElementById("balcony-photographer");
      check("Hamid and Aspen stay on balcony", deck.indexOf("Hamid") !== -1 && deck.indexOf("Aspen") !== -1,
        deck.join(",") + " | Aspen=" + (balconyAspen ? balconyAspen.getAttribute("class") + "/" + getComputedStyle(balconyAspen).opacity : "missing"));
      var strip = document.getElementById("loft-game-strip");
      var grillmaster = document.getElementById("balcony-grillmaster");
      var gardenJacket = document.getElementById("garden-jacket-inner");
      var balconyJacket = document.getElementById("balcony-hallway-jacket-inner");
      check("Hamid wears the borrowed green-yellow jacket at the BBQ",
        strip.classList.contains("hamid-wearing-jacket") &&
        getComputedStyle(grillmaster).getPropertyValue("--hamid-top").trim() === "#c5c84c");
      // Virtual-time Chrome can pin a timeout-triggered transition at its start value. Remove the
      // transition for this cascade probe; AGENTS.md documents this exact headless artifact.
      gardenJacket.style.setProperty("transition", "none", "important");
      balconyJacket.style.setProperty("transition", "none", "important");
      check("both hanging jacket views fade away with Hamid",
        parseFloat(getComputedStyle(gardenJacket).opacity) < 1 && parseFloat(getComputedStyle(balconyJacket).opacity) < 1,
        getComputedStyle(gardenJacket).opacity + "/" + getComputedStyle(balconyJacket).opacity);
      var persistentFigures = Array.from(document.querySelectorAll("#balcony-hangout .bh-fig"));
      check("balcony people use ghost fades instead of display removal",
        persistentFigures.every(function (g) {
          var cs = getComputedStyle(g);
          return cs.display !== "none" && cs.transitionProperty.indexOf("opacity") !== -1;
        }));
      try {
        var farhang = document.getElementById("bh-farhang"), farhangWasPresent = farhang.classList.contains("bh-present");
        document.querySelectorAll("#balcony-hangout .bh-smoker.bh-present").forEach(function (el) { el.classList.remove("bh-present"); });
        farhang.classList.add("bh-present");
        var audienceSpeaker = window.__balconyAudienceNoticed(true);
        var audienceBubble = document.querySelector(".egg-bubble.balcony-audience-callout");
        check("a smoker can notice the audience across the street",
          audienceSpeaker === "farhang" && audienceBubble &&
          audienceBubble.getAttribute("data-speaker") === "farhang" &&
          /Smile.*audience/.test(audienceBubble.textContent), audienceSpeaker + " / " + (audienceBubble && audienceBubble.textContent));
        if (audienceBubble) audienceBubble.remove();
        farhang.classList.toggle("bh-present", farhangWasPresent);
      } catch (audienceError) {
        check("a smoker can notice the audience across the street", false, String(audienceError && audienceError.stack || audienceError));
      }
      check("hosts are not published as smokers", (window.__balconySmokerNow() || []).indexOf("behdad") === -1 && (window.__balconySmokerNow() || []).indexOf("marketa") === -1);
      check("grill is lit", document.getElementById("balcony-smoker").classList.contains("smoking"));
      var plateBox = document.getElementById("balcony-grill-plate").getBoundingClientRect();
      var fireboxBox = document.getElementById("balcony-smoker-firebox").getBoundingClientRect();
      check("serving plate sits atop the working smoker firebox", plateBox.left >= fireboxBox.left && plateBox.right <= fireboxBox.right && Math.abs(plateBox.bottom - fireboxBox.top) < 8,
        [plateBox.left, plateBox.right, plateBox.bottom, fireboxBox.left, fireboxBox.right, fireboxBox.top].map(function (n) { return n.toFixed(1); }).join(","));
      var ashtrayBox = document.querySelector("#balcony-ashtray-perch > ellipse").getBoundingClientRect();
      var coveredBox = document.getElementById("balcony-coveredgrill").getBoundingClientRect();
      var ashtrayBehindGuests = !!(document.getElementById("balcony-ashtray-perch").compareDocumentPosition(document.getElementById("balcony-hangout")) & Node.DOCUMENT_POSITION_FOLLOWING);
      var ashCx = (ashtrayBox.left + ashtrayBox.right) / 2, ashCy = (ashtrayBox.top + ashtrayBox.bottom) / 2;
      var plateAshtrayOverlap = !(plateBox.right <= ashtrayBox.left || ashtrayBox.right <= plateBox.left || plateBox.bottom <= ashtrayBox.top || ashtrayBox.bottom <= plateBox.top);
      check("party ashtray moves to the covered grill clear of the plate", ashCx >= coveredBox.left && ashCx <= coveredBox.right && ashCy >= coveredBox.top && ashCy <= coveredBox.bottom && !plateAshtrayOverlap,
        [ashCx, ashCy, coveredBox.left, coveredBox.top, coveredBox.right, coveredBox.bottom, plateAshtrayOverlap].join(","));
      check("party ashtray paints behind BBQ guests", ashtrayBehindGuests);
      check("split remains daylight and non-UV", !balcony.classList.contains("dusk") && !document.getElementById("loft-game-strip").classList.contains("uv-mode"));
      window.__setBBQHostsOnBalcony(false);
      var behdadFloor = document.querySelector("#garden-guests .g-behdad");
      var marketaFloor = document.querySelector("#garden-guests .g-marketa");
      check("inside host assignment returns both hosts to the party floor",
        !behdadFloor.classList.contains("off-at-bbq") && !marketaFloor.classList.contains("off-at-bbq") &&
        names("balcony").indexOf("Behdad") === -1 && names("balcony").indexOf("Markéta") === -1);
      window.__setDayNight(true);
      check("night BBQ weights the hosts 75% toward inside", window.__bbqHostBalconyChance() === 0.25);
      window.__setBBQHostsOnBalcony(true);
      var hostsOutside = names("balcony");
      check("outside host assignment moves both hosts off the party floor", hostsOutside.indexOf("Behdad") !== -1 && hostsOutside.indexOf("Markéta") !== -1 && names("garden").indexOf("Behdad") === -1, hostsOutside.join(","));

      window.__loftControllers.roster.set(true);
      var held = window.__bbqSplitState().guests.slice();
      var heldResult = window.__rotateBBQSplit();
      check("open roster freezes BBQ rotation", heldResult === false && same(held, window.__bbqSplitState().guests));
      window.__loftControllers.roster.set(false);
      var movedResult = window.__rotateBBQSplit();
      var moved = window.__bbqSplitState().guests.slice();
      check("closing roster resumes BBQ rotation", movedResult === true && intersection(held, moved).length === 3, held.join(",") + " -> " + moved.join(","));

      window.__goToStage("cuddly");
      setTimeout(function () {
        var kids = ["irene", "robin", "navid", "elisabeth", "felix", "patricia-son", "patricia-daughter", "hannah"];
        check("all eight game kids are in the cuddly room", names("cuddly").filter(function (n) { return ["Irene","Robin","Navid","Elisabeth","Felix","Patricia’s son","Patricia’s daughter","Hannah"].indexOf(n) !== -1; }).length === 8, names("cuddly").join(","));
        check("game kids are off the garden floor", kids.every(function (n) { var el = document.querySelector("#garden-guests .g-" + n); return el && el.classList.contains("off-at-games"); }));
        var expectedOffFloor = moved.concat(window.__bbqSplitState().hostsOnBalcony ? ["behdad", "marketa", "hamid"] : ["hamid"]);
        check("selected adults and outside hosts are off the garden floor", expectedOffFloor.every(function (n) { var el = document.querySelector("#garden-guests .g-" + n); return el && el.classList.contains("off-at-bbq"); }));
        window.__setBalconyBBQCrowd(false);
        var bbqAssignedAfterTeardown = kids.concat(moved, ["behdad", "marketa", "hamid"]).filter(function (n) {
          var el = document.querySelector("#garden-guests .g-" + n);
          return !el || el.classList.contains("off-at-bbq");
        });
        check("split teardown clears BBQ-owned room assignments", !window.__bbqSplitOn && !bbqAssignedAfterTeardown.length, bbqAssignedAfterTeardown.join(","));
        check("hanging jacket returns when Hamid leaves the BBQ", !document.getElementById("loft-game-strip").classList.contains("hamid-wearing-jacket"));
        var teardownAudit = window.__peopleManager.audit();
        var unexpectedTeardownDuplicates = unexpectedDuplicates(teardownAudit);
        check("teardown inventory has no unexpected cross-room duplicates", !unexpectedTeardownDuplicates.length, JSON.stringify(unexpectedTeardownDuplicates));
        report();
        }, 250);
      }, 2200);
    }, 800);
  }, 250);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 5000, {
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2031-05-02&time=18:00"
});

if (!report) { console.error("bbq: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("bbq: all " + report.checks.length + " checks passed");
