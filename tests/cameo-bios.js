#!/usr/bin/env node
"use strict";

// Bar and office couples reuse the same artwork, but each visible person owns an individual bio.
// Clicking one member must never collapse back to the enclosing couple-level label.
var lib = require("./lib");

var harness = String.raw`<script>
(async function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function cardName() {
    var card = document.querySelector(".egg-bubble.who-pop");
    var name = card && card.firstElementChild;
    return name ? name.textContent.trim() : "";
  }
  function cardPlacement() {
    var card = document.querySelector(".egg-bubble.who-pop");
    var rect = card && card.getBoundingClientRect();
    var call = document.getElementById("laptop-call-remote");
    return card ? {
      left: card.style.left,
      top: parseFloat(card.style.top),
      bottom: rect.bottom,
      height: card.offsetHeight,
      callTop: call && call.getBoundingClientRect().top,
      anchor: card._anchor && card._anchor.id
    } : null;
  }
  function click(el) { if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  function nextFrame() { return new Promise(function (resolve) { requestAnimationFrame(resolve); }); }
  function expectedCallTop(p) {
    return Math.max(8, Math.min(window.innerHeight - p.height - 8, p.callTop));
  }
  function pointerClick(el) {
    if (!el) return;
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  function finish() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  try {
    window.__setGardenParty(true, false);

    click(document.getElementById("kitchen-bartender-hit"));
    check("clicking Pouria opens his bio", cardName() === "Pouria", cardName());
    check("Pouria's direct bio points at his visible figure",
      !!document.querySelector("#kitchen-bartender > .guest-spot-arrow") &&
      !document.querySelector("#kitchen-bartender-hit .guest-spot-arrow"));

    window.__loftControllers.couples("alireza");
    var bar = document.querySelector("#kitchen-bar-couples .bc-alirezamahzad");
    click(bar && bar.querySelector(".bc-p1"));
    check("clicking the first bar figure opens Alireza's bio", cardName() === "Alireza", cardName());
    check("a direct bar bio points at the individual", !!document.querySelector(".bc-p1 .guest-spot-arrow"));
    click(bar && bar.querySelector(".bc-p2"));
    check("clicking the second bar figure opens Mahzad's bio", cardName() === "Mahzad", cardName());

    window.__goToStage("office");
    window.__loftControllers.officefolks("spencer");
    var office = document.querySelector("#office-hangout .of-spencerjay");
    click(office && office.querySelector(".of-p1"));
    check("clicking the first office figure opens Spencer's bio", cardName() === "Spencer", cardName());
    check("a direct office bio points at the individual", !!document.querySelector(".of-p1 .guest-spot-arrow"));
    click(office && office.querySelector(".of-p2"));
    check("clicking the second office figure opens Jay's bio", cardName() === "Jay", cardName());

    window.__goToStage("cuddly");
    var cuddlyBehdad = document.getElementById("cuddly-behdad");
    click(cuddlyBehdad);
    check("clicking a Cuddly resident opens their individual bio", cardName() === "behdad", cardName());
    check("a direct Cuddly bio points at the person", !!cuddlyBehdad.querySelector(".guest-spot-arrow"));

    window.__ireneShow("irene-sit");
    var cuddlyIrene = document.getElementById("cuddly-irene");
    pointerClick(cuddlyIrene);
    check("one real pointer click opens Irene's cameo bio", cardName() === "Irene", cardName());
    check("Irene can react without swallowing her bio click",
      cuddlyIrene.classList.contains("giggling") && !!cuddlyIrene.querySelector(".guest-spot-arrow"));

    var pragueDaniel = document.getElementById("laptop-garden-daniel");
    var pragueFelix = document.getElementById("laptop-garden-felix");
    click(pragueDaniel);
    await nextFrame();
    var praguePlacement = cardPlacement();
    check("the widened Prague gathering uses the laptop screen's fixed bio position",
      cardName() === "Daniel" && praguePlacement && praguePlacement.anchor === "laptop-garden-daniel",
      JSON.stringify(praguePlacement));
    check("Prague call bios never draw a person arrow",
      !document.querySelector("#laptop-call-scene .guest-spot-arrow"));
    click(pragueFelix);
    await nextFrame();
    var pragueFelixPlacement = cardPlacement();
    check("every Prague gathering member shares one horizontal position and stays viewport-clamped",
      cardName() === "Felix" && pragueFelixPlacement &&
      pragueFelixPlacement.left === praguePlacement.left &&
      Math.abs(praguePlacement.top - expectedCallTop(praguePlacement)) < 0.01 &&
      Math.abs(pragueFelixPlacement.top - expectedCallTop(pragueFelixPlacement)) < 0.01,
      JSON.stringify({ first: praguePlacement, second: pragueFelixPlacement }));

    var luebMadla = document.getElementById("laptop-lueb-sister");
    var luebRobert = document.getElementById("laptop-lueb-husband");
    click(luebMadla);
    await nextFrame();
    var luebPlacement = cardPlacement();
    click(luebRobert);
    await nextFrame();
    var luebRobertPlacement = cardPlacement();
    check("Lübeck family bios share one fixed horizontal position and stay viewport-clamped",
      cardName() === "Robert" && luebPlacement && luebRobertPlacement &&
      luebPlacement.anchor === "laptop-lueb-sister" &&
      luebRobertPlacement.anchor === "laptop-lueb-husband" &&
      luebRobertPlacement.left === luebPlacement.left &&
      Math.abs(luebPlacement.top - expectedCallTop(luebPlacement)) < 0.01 &&
      Math.abs(luebRobertPlacement.top - expectedCallTop(luebRobertPlacement)) < 0.01 &&
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

    window.__goToStage("cuddly");
    window.__cuddlyVisit("ali", true);
    click(document.getElementById("cuddly-vis-ali"));
    setTimeout(function () {
      try {
        var visitorCard = document.querySelector(".egg-bubble.who-pop");
        check("a directly clicked Cuddly visitor bio survives its opening click",
          cardName() === "Ali" && !!visitorCard && visitorCard.classList.contains("show"),
          cardName());
        click(document.getElementById("cuddly-irene"));
        setTimeout(function () {
          try {
            var kidCard = document.querySelector(".egg-bubble.who-pop");
            check("a directly clicked Cuddly child bio survives its opening click",
              cardName() === "Irene" && !!kidCard && kidCard.classList.contains("show"),
              cardName());
          } catch (error) {
            out.errors.push(String(error && error.stack || error));
          }
          finish();
        }, 80);
      } catch (error) {
        out.errors.push(String(error && error.stack || error));
        finish();
      }
    }, 80);
  } catch (error) {
    out.errors.push(String(error && error.stack || error));
    finish();
  }
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 4000, {
  forceMotion: true,
  seedRandom: true,
  patchRaf: true
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
