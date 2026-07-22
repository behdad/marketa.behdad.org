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
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }

  // Exercise the player path: the date invite queues during phase one, then the real balcony
  // switch starts the party. No forced occasion setup is allowed to pre-seed BBQ state here.
  window.__gameStarted = function () { return true; };
  try { localStorage.setItem("dateInvite:bbq:4-2", "1"); } catch (e) {} // simulate an earlier May-2 playthrough in this browser
  if (window.__deliverDateInvite) window.__deliverDateInvite();
  check("BBQ message waits during phase one", !(window.__phoneMessageReceived && window.__phoneMessageReceived("bbq")) && !window.__secondRound);
  if (window.goToStage) window.goToStage("balcony");
  var partySwitch = document.getElementById("balcony-partyswitch");
  if (partySwitch) partySwitch.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  setTimeout(function () {
    var garden = document.getElementById("stage-garden"), balcony = document.getElementById("stage-balcony");
    check("May-2 switch drops into the garden", window.currentStageName === "garden", window.currentStageName);
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
    var moments = ["firstdance", "slowdance", "toasts", "groupphoto", "sparklers", "cake", "bouquet", "chairlift"];
    for (var mt = 0; mt < 18; mt++) window.__deliverRandomContextText();
    var deliveredMoments = moments.filter(function (id) { return window.__phoneMessageReceived(id); });
    check("May 2 excludes wedding-moment texts", deliveredMoments.length === 0, deliveredMoments.join(","));
    check("balcony split waits for invitation", !(window.__bbqSplitState && window.__bbqSplitState().on));
    check("grill waits for invitation", !document.getElementById("balcony-smoker").classList.contains("smoking"));
    var bbqHints = [];
    if (window.__nextExploreHint) for (var hi = 0; hi < 20; hi++) bbqHints.push(window.__nextExploreHint("balcony", true));
    check("May 2 suppresses the turn-day-to-night hint", bbqHints.indexOf("hint_sun") === -1, bbqHints.join(","));

    setTimeout(function () {
      window.__runMsgAction("bbq");
      setTimeout(function () {
      var state = window.__bbqSplitState();
      var deck = names("balcony"), selected = state.guests.slice();
      check("invitation pans to balcony", window.currentStageName === "balcony", window.currentStageName);
      check("invitation starts split", state.on && window.__bbqSplitOn);
      check("exactly four adults rotate", selected.length === 4, selected.join(","));
      check("seven hangout figures are on deck", window.__balconyHangoutNow().length === 7, window.__balconyHangoutNow().map(function (p) { return p.name; }).join(","));
      check("balcony has nine people total", deck.length === 9, deck.join(","));
      check("both hosts stay on balcony", deck.indexOf("Behdad") !== -1 && deck.indexOf("Markéta") !== -1, deck.join(","));
      var balconyAspen = document.getElementById("balcony-photographer");
      check("Hamid and Aspen stay on balcony", deck.indexOf("Hamid") !== -1 && deck.indexOf("Aspen") !== -1,
        deck.join(",") + " | Aspen=" + (balconyAspen ? balconyAspen.getAttribute("class") + "/" + getComputedStyle(balconyAspen).opacity : "missing"));
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

      window.roster(true);
      var held = window.__bbqSplitState().guests.slice();
      var heldResult = window.__rotateBBQSplit();
      check("open roster freezes BBQ rotation", heldResult === false && same(held, window.__bbqSplitState().guests));
      window.roster(false);
      var movedResult = window.__rotateBBQSplit();
      var moved = window.__bbqSplitState().guests.slice();
      check("closing roster resumes BBQ rotation", movedResult === true && intersection(held, moved).length === 3, held.join(",") + " -> " + moved.join(","));

      window.goToStage("cuddly");
      setTimeout(function () {
        var kids = ["irene", "robin", "navid", "elisabeth", "felix", "hannah"];
        check("six game kids are in the cuddly room", names("cuddly").filter(function (n) { return ["Irene","Robin","Navid","Elisabeth","Felix","Hannah"].indexOf(n) !== -1; }).length === 6, names("cuddly").join(","));
        check("game kids are off the garden floor", kids.every(function (n) { var el = document.querySelector("#garden-guests .g-" + n); return el && el.classList.contains("off-at-games"); }));
        check("selected adults and hosts are off the garden floor", moved.concat(["behdad", "marketa", "hamid"]).every(function (n) { var el = document.querySelector("#garden-guests .g-" + n); return el && el.classList.contains("off-at-bbq"); }));
        window.__setBalconyBBQCrowd(false);
        check("split teardown clears all room assignments", !window.__bbqSplitOn && kids.concat(moved, ["behdad", "marketa", "hamid"]).every(function (n) {
          var el = document.querySelector("#garden-guests .g-" + n); return el && !el.classList.contains("off-at-bbq") && !el.classList.contains("off-at-games");
        }));
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
