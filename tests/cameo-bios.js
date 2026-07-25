#!/usr/bin/env node
"use strict";

// Bar and office couples reuse the same artwork, but each visible person owns an individual bio.
// Clicking one member must never collapse back to the enclosing couple-level label.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function cardName() {
    var card = document.querySelector(".egg-bubble.who-pop");
    var name = card && card.firstElementChild;
    return name ? name.textContent.trim() : "";
  }
  function cardPlacement() {
    var card = document.querySelector(".egg-bubble.who-pop");
    return card ? {
      left: card.style.left,
      top: card.style.top,
      anchor: card._anchor && card._anchor.id
    } : null;
  }
  function click(el) { if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  try {
    window.__setGardenParty(true, false);

    window.couples("alireza");
    var bar = document.querySelector("#kitchen-bar-couples .bc-alirezamahzad");
    click(bar && bar.querySelector(".bc-p1"));
    check("clicking the first bar figure opens Alireza's bio", cardName() === "Alireza", cardName());
    check("a direct bar bio points at the individual", !!document.querySelector(".bc-p1 .guest-spot-arrow"));
    click(bar && bar.querySelector(".bc-p2"));
    check("clicking the second bar figure opens Mahzad's bio", cardName() === "Mahzad", cardName());

    window.goToStage("office");
    window.officefolks("spencer");
    var office = document.querySelector("#office-hangout .of-spencerjay");
    click(office && office.querySelector(".of-p1"));
    check("clicking the first office figure opens Spencer's bio", cardName() === "Spencer", cardName());
    check("a direct office bio points at the individual", !!document.querySelector(".of-p1 .guest-spot-arrow"));
    click(office && office.querySelector(".of-p2"));
    check("clicking the second office figure opens Jay's bio", cardName() === "Jay", cardName());

    window.goToStage("cuddly");
    var cuddlyBehdad = document.getElementById("cuddly-behdad");
    click(cuddlyBehdad);
    check("clicking a Cuddly resident opens their individual bio", cardName() === "behdad", cardName());
    check("a direct Cuddly bio points at the person", !!cuddlyBehdad.querySelector(".guest-spot-arrow"));

    var pragueDaniel = document.getElementById("laptop-garden-daniel");
    var pragueFelix = document.getElementById("laptop-garden-felix");
    click(pragueDaniel);
    var praguePlacement = cardPlacement();
    check("the widened Prague gathering uses the laptop screen's fixed bio position",
      cardName() === "Daniel" && praguePlacement && praguePlacement.anchor === "laptop-call-remote",
      JSON.stringify(praguePlacement));
    check("Prague call bios never draw a person arrow",
      !document.querySelector("#laptop-call-scene .guest-spot-arrow"));
    click(pragueFelix);
    var pragueFelixPlacement = cardPlacement();
    check("every Prague gathering member reuses exactly the same card coordinates",
      cardName() === "Felix" && pragueFelixPlacement &&
      pragueFelixPlacement.left === praguePlacement.left && pragueFelixPlacement.top === praguePlacement.top,
      JSON.stringify({ first: praguePlacement, second: pragueFelixPlacement }));

    var luebMadla = document.getElementById("laptop-lueb-sister");
    var luebRobert = document.getElementById("laptop-lueb-husband");
    click(luebMadla);
    var luebPlacement = cardPlacement();
    click(luebRobert);
    var luebRobertPlacement = cardPlacement();
    check("Lübeck family bios share one fixed, arrow-free screen position",
      cardName() === "Robert" && luebPlacement && luebRobertPlacement &&
      luebPlacement.anchor === "laptop-call-remote" &&
      luebRobertPlacement.left === luebPlacement.left && luebRobertPlacement.top === luebPlacement.top &&
      !document.querySelector("#laptop-lueb-scene .guest-spot-arrow"),
      JSON.stringify({ first: luebPlacement, second: luebRobertPlacement }));

    var monitorSelfLeaks = 0, laptopSelfLeaks = 0;
    document.getElementById("office-monitor").addEventListener("click", function () { monitorSelfLeaks++; });
    document.getElementById("office-laptop").addEventListener("click", function () { laptopSelfLeaks++; });
    click(document.getElementById("monitor-family-self"));
    click(document.getElementById("monitor-tehran-scene"));
    click(document.getElementById("laptop-call-self"));
    click(document.getElementById("laptop-call-remote"));
    check("computer call surfaces do not fall through to device chrome",
      monitorSelfLeaks === 0 && laptopSelfLeaks === 0,
      "monitor=" + monitorSelfLeaks + " laptop=" + laptopSelfLeaks);

    var armL = bar && bar.querySelector(".bc-arm-l");
    var armR = bar && bar.querySelector(".bc-arm-r");
    var leftOrigin = armL ? getComputedStyle(armL).transformOrigin : "";
    var rightOrigin = armR ? getComputedStyle(armR).transformOrigin : "";
    check("bar arms pivot from their shoulder-side top corners",
      /0px$/.test(leftOrigin) && /0px$/.test(rightOrigin),
      leftOrigin + "/" + rightOrigin);

    var runners = document.querySelectorAll('[id^="garden-kid-"] > .gk-run');
    var unstable = [];
    runners.forEach(function (run) {
      [run, run.querySelector(".gk-flip"), run.querySelector(".gk-body-bob")].forEach(function (node) {
        var style = node && getComputedStyle(node);
        if (!style || style.transformBox !== "view-box" || !/^0px 0px/.test(style.transformOrigin)) {
          unstable.push((run.parentNode && run.parentNode.id || "runner") + ":" +
            (node && node.getAttribute("class") || "missing"));
        }
      });
    });
    check("every chase runner uses fixed SVG-space movement pivots",
      runners.length === 10 && unstable.length === 0,
      "runners=" + runners.length + " unstable=" + unstable.join(","));
  } catch (error) {
    out.errors.push(String(error && error.stack || error));
  }
  out.errors = out.errors.concat((window.__errs || []).slice());
  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 4000, {
  forceMotion: true,
  seedRandom: true
});

if (!report) { console.error("cameo bios: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("cameo bios: all " + report.checks.length + " checks passed");
