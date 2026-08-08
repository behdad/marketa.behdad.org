#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(async function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function click(node) { if (node) node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  function cardSignature(card) {
    var s = getComputedStyle(card);
    return [s.backgroundColor, s.borderColor, s.borderWidth, s.borderRadius, s.boxShadow,
      s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft,
      s.fontFamily, s.fontSize, s.fontWeight, s.lineHeight].join("|");
  }
  function inside(inner, outer) {
    return inner.left >= outer.left - 1 && inner.right <= outer.right + 1 &&
      inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
  }
  async function showGuide(lang) {
    setLang(lang);
    if (window.__showHuntIntro) window.__showHuntIntro();
    await sleep(30);
    click(document.getElementById("click-me-overlay"));
    await sleep(60);
    document.getElementById("hunt-fullscreen-area").scrollIntoView({ block: "start" });
    await sleep(30);
    window.dispatchEvent(new Event("resize"));
    await sleep(40);
  }

  await sleep(900);
  await showGuide("en");
  var area = document.getElementById("hunt-fullscreen-area");
  var overlay = document.getElementById("opening-guide-coach");
  var card = overlay.querySelector(".hunt-coach-card");
  var copy = overlay.querySelector(".hunt-coach-copy");
  var x = overlay.querySelector(".hunt-coach-x");
  var arrow = overlay.querySelector(".hunt-coach-arrow");
  var nav = document.getElementById("hunt-bottom-nav");
  check("English nav coach uses the shared readable card and explicit dismiss control",
    overlay.classList.contains("show") && window.__openingGuideStep() === "nav" &&
      copy.textContent === "Navigation lives here." && x.textContent === "×" &&
      card.querySelectorAll(":scope > .hunt-coach-x").length === 1);
  var cardRect = card.getBoundingClientRect(), xRect = x.getBoundingClientRect();
  check("the coach dismiss control stays in the true upper-right corner",
    xRect.top - cardRect.top < 16 && cardRect.right - xRect.right < 16,
    JSON.stringify({ card: cardRect.toJSON(), dismiss: xRect.toJSON() }));
  check("nav coach stays inside the game shell below its target",
    inside(card.getBoundingClientRect(), area.getBoundingClientRect()) &&
      card.getBoundingClientRect().top > nav.getBoundingClientRect().bottom,
    JSON.stringify({ card: card.getBoundingClientRect().toJSON(), area: area.getBoundingClientRect().toJSON() }));
  check("opening coach has one canonical arrow with the requested motion policy",
    overlay.querySelectorAll("svg > path.hunt-coach-arrow").length === 1 &&
      !overlay.querySelector("svg polygon,svg rect") && !!arrow.getAttribute("d") &&
      getComputedStyle(arrow).fill === "rgb(239, 23, 23)" &&
      getComputedStyle(arrow).animationName ===
        (matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : "kitchen-arrow-bounce"),
    getComputedStyle(arrow).animationName);

  var cabinet = document.getElementById("kitchen-cabinet-2");
  var machine = document.getElementById("kitchen-lamarzocco"), cr = machine.getBoundingClientRect();
  var hit = document.elementFromPoint(cr.left + cr.width / 2, cr.top + cr.height / 2);
  if (!hit) {
    for (var py = 8; py < innerHeight && !hit; py += 28) {
      for (var px = 8; px < innerWidth; px += 28) {
        var candidate = document.elementFromPoint(px, py);
        if (candidate && candidate.closest("#opening-guide-coach") && !candidate.closest(".hunt-coach-card")) {
          hit = candidate; break;
        }
      }
    }
  }
  click(hit);
  check("background input is swallowed without advancing or operating Kitchen",
    hit && hit.closest("#opening-guide-coach") && window.__openingGuideStep() === "nav" &&
      !machine.classList.contains("powered-on") && !cabinet.classList.contains("open"),
    JSON.stringify({ hit: hit && (hit.id || hit.className && String(hit.className)), step: window.__openingGuideStep(),
      powered: machine.classList.contains("powered-on"), open: cabinet.classList.contains("open") }));
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  await sleep(50); window.dispatchEvent(new Event("resize")); await sleep(30);
  check("Escape advances to the English caption coach above its target",
    window.__openingGuideStep() === "caption" && copy.textContent === "Clues and instructions appear here." &&
      card.getBoundingClientRect().bottom < document.getElementById("hunt-caption").getBoundingClientRect().top);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true, cancelable: true }));
  check("Backspace mirrors × and finishes the second step", !window.__openingGuideShowing() && !overlay.classList.contains("show"));
  var solveCalls = 0, realKitchenDoNext = window.__kitchenDoNext;
  window.__kitchenDoNext = function () { solveCalls++; return true; };
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true, cancelable: true }));
  window.__kitchenDoNext = realKitchenDoNext;
  check("room-level Escape and Backspace never advance the morning routine", solveCalls === 0 && !machine.classList.contains("powered-on"), String(solveCalls));

  await showGuide("cs");
  check("Czech nav coach is concise and localized", copy.textContent === "Navigace je tady." && !/pokračuj/i.test(copy.textContent));
  click(x); await sleep(50);
  check("Czech caption coach is concise and localized", copy.textContent === "Nápovědy a pokyny se objevují tady." && !/pokračuj/i.test(copy.textContent));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".hunt-coach-card"));
  check("opening and both party coaches share one card and dismiss-control contract",
    cards.length === 3 && cards.every(function (item) {
      return cardSignature(item) === cardSignature(card) &&
        item.querySelectorAll(":scope > .hunt-coach-copy").length === 1 &&
        item.querySelectorAll(":scope > .hunt-coach-x").length === 1;
    }));
  click(x);
  report();
})().catch(function (error) {
  var pre = document.createElement("pre"); pre.id = "__report";
  pre.textContent = JSON.stringify({ checks: [], errors: [String(error && error.stack || error)] });
  document.body.appendChild(pre);
});
</script>`;

function run(label, opts) {
  var result = lib.runPageSync("rsvp.html", harness, 2500, opts);
  if (!result) { console.error("opening guide " + label + ": no report"); return false; }
  var failed = false;
  result.checks.forEach(function (check) {
    console.log("  " + (check.pass ? "PASS" : "FAIL") + " " + label + ": " + check.name +
      (check.pass || !check.detail ? "" : " - " + check.detail));
    if (!check.pass) failed = true;
  });
  if (result.errors.length) { failed = true; console.error("  " + label + " errors: " + result.errors.join("; ")); }
  return !failed;
}

var desktop = run("desktop", { forceMotion: true, patchRaf: true, chromeFlags: "--window-size=1100,900" });
var mobile = run("mobile landscape/reduced motion", {
  forceReduce: true, forceCoarsePointer: true, patchRaf: true,
  chromeFlags: "--window-size=740,480 --force-prefers-reduced-motion"
});
if (!desktop || !mobile) process.exit(1);
console.log("opening guide: all focused checks passed");
