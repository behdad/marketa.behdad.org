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
    window.__setLang(lang);
    if (window.__showHuntIntro) window.__showHuntIntro();
    await sleep(30);
    click(document.getElementById("click-me-overlay"));
    await sleep(60);
    var area = document.getElementById("hunt-fullscreen-area");
    if (innerHeight <= 400 && innerWidth > innerHeight) {
      area.classList.add("is-fullscreen");
      if (window.__sizeFullscreenFrame) window.__sizeFullscreenFrame();
    }
    area.scrollIntoView({ block: "start" });
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
  var areaRect = area.getBoundingClientRect();
  check("the genuinely modal coach occupies a substantial part of the shell",
    cardRect.width >= areaRect.width * .72 && cardRect.height >= areaRect.height * .35,
    JSON.stringify({ card: cardRect.toJSON(), area: areaRect.toJSON() }));
  check("the modal surface visibly distinguishes its blocked background",
    getComputedStyle(overlay).backgroundColor === "rgba(69, 58, 49, 0.2)",
    getComputedStyle(overlay).backgroundColor);
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
  check("the opening guide and Party exploration overlay own the modal treatment",
    overlay.classList.contains("modal-coach") && getComputedStyle(overlay).pointerEvents === "auto" &&
      document.querySelectorAll(".hunt-coach-overlay.modal-coach").length === 2 &&
      Array.prototype.slice.call(document.querySelectorAll("#party-room-map-coach")).every(function (item) {
        return item.classList.contains("modal-coach") && item.classList.contains("party-onboarding-coach") &&
          getComputedStyle(item).pointerEvents === "none";
      }));

  var dollhouseButton = document.getElementById("hunt-dollhouse-btn");
  var dollhouseRect = dollhouseButton.getBoundingClientRect();
  var dollhouseHit = document.elementFromPoint(dollhouseRect.left + dollhouseRect.width / 2,
    dollhouseRect.top + dollhouseRect.height / 2);
  click(dollhouseHit);
  check("the highlighted navigation row stays live and opens the dollhouse without acknowledging the coach",
    dollhouseHit && dollhouseHit.closest("#hunt-dollhouse-btn") &&
      !document.getElementById("loft-dollhouse").hidden &&
      window.__openingGuideShowing() && window.__openingGuideStep() === "nav",
    JSON.stringify({ hit: dollhouseHit && (dollhouseHit.id || String(dollhouseHit.className)),
      hidden: document.getElementById("loft-dollhouse").hidden, step: window.__openingGuideStep() }));
  click(document.getElementById("loft-dollhouse-close"));
  var gardenDot = document.querySelectorAll("#hunt-dots .hunt-dot")[1];
  var gardenRect = gardenDot.getBoundingClientRect();
  var gardenHit = document.elementFromPoint(gardenRect.left + gardenRect.width / 2,
    gardenRect.top + gardenRect.height / 2);
  if (gardenHit) gardenHit.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
  await sleep(40);
  check("double-clicking a locked room dot unlocks and navigates while the coach remains",
    gardenHit && gardenHit.closest(".hunt-dot") && window.__currentStageName === "garden" &&
      !gardenDot.classList.contains("locked") && window.__openingGuideShowing() &&
      window.__openingGuideStep() === "nav",
    JSON.stringify({ room: window.__currentStageName, locked: gardenDot.classList.contains("locked"),
      showing: window.__openingGuideShowing(), step: window.__openingGuideStep() }));
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

  window.__goToStage("kitchen");
  await showGuide("cs");
  check("Czech nav coach is concise and localized", copy.textContent === "Navigace je tady." && !/pokračuj/i.test(copy.textContent));
  click(x); await sleep(50);
  check("Czech caption coach is concise and localized", copy.textContent === "Nápovědy a pokyny se objevují tady." && !/pokračuj/i.test(copy.textContent));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".hunt-coach-card"));
  var partyCards = Array.prototype.slice.call(document.querySelectorAll("#party-room-map-coach .hunt-coach-card"));
  check("opening and Party onboarding coaches share the approved large-card treatment",
    cards.length === 2 && partyCards.length === 1 &&
      partyCards.every(function (item) {
        return cardSignature(item) === cardSignature(card) &&
          item.querySelectorAll(":scope > .hunt-coach-copy").length === 1 &&
          item.querySelectorAll(":scope > .hunt-coach-x").length === 1;
      }));
  click(x);

  await showGuide("en");
  localStorage.setItem("opening-guide-reset-unrelated", "keep");
  localStorage.setItem("loftCheckpoint:v1", "discarded-by-explicit-reset");
  var confirmations = 0;
  window.confirm = function () { confirmations++; return true; };
  var reset = document.getElementById("hunt-restart-btn"), resetRect = reset.getBoundingClientRect();
  var resetHit = document.elementFromPoint(resetRect.left + resetRect.width / 2, resetRect.top + resetRect.height / 2);
  click(resetHit);
  await sleep(850);
  var watch = document.getElementById("watch-loft-btn"), watchRect = watch.getBoundingClientRect();
  var watchHit = document.elementFromPoint(watchRect.left + watchRect.width / 2, watchRect.top + watchRect.height / 2);
  check("Phase-one coach keeps the explicit whole-loft Reset pointer-accessible",
    resetHit && resetHit.closest("#hunt-restart-btn") && confirmations === 1,
    JSON.stringify({ hit: resetHit && (resetHit.id || String(resetHit.className)), confirmations: confirmations }));
  check("Phase-one Kitchen Reset returns to CLICK ME with Trailer selectable",
    window.__currentStageName === "kitchen" && !window.__secondRound && window.__maxUnlocked() === 0 &&
      !window.__gameStarted() && !!document.getElementById("click-me-overlay") &&
      document.getElementById("hunt-fullscreen-area").classList.contains("intro-active") &&
      !document.getElementById("hunt-fullscreen-area").classList.contains("opening-guide-active") &&
      watchHit && watchHit.closest("#watch-loft-btn"),
    JSON.stringify({ room: window.__currentStageName, phase2: !!window.__secondRound,
      max: window.__maxUnlocked(), started: window.__gameStarted(), watchHit: watchHit && (watchHit.id || String(watchHit.className)) }));
  check("explicit Reset replaces the discarded checkpoint with clean phase-one state and preserves unrelated browser data",
    (function () {
      var saved = localStorage.getItem("loftCheckpoint:v1"), parsed = null;
      try { parsed = saved && JSON.parse(saved); } catch (_error) {}
      return saved !== "discarded-by-explicit-reset" && parsed && parsed.progress &&
        parsed.progress.room === "kitchen" && parsed.progress.phase2 === false &&
        localStorage.getItem("opening-guide-reset-unrelated") === "keep";
    })(),
    JSON.stringify({ checkpoint: localStorage.getItem("loftCheckpoint:v1"),
      unrelated: localStorage.getItem("opening-guide-reset-unrelated") }));
  localStorage.removeItem("opening-guide-reset-unrelated");
  report();
})().catch(function (error) {
  var pre = document.createElement("pre"); pre.id = "__report";
  pre.textContent = JSON.stringify({ checks: [], errors: [String(error && error.stack || error)] });
  document.body.appendChild(pre);
});
</script>`;

function run(label, opts) {
  var result = lib.runPageSync("rsvp.html", harness, 3600, opts);
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
var mobileShort = run("390px-tall mobile landscape", {
  forceCoarsePointer: true, patchRaf: true, chromeFlags: "--window-size=844,390"
});
if (!desktop || !mobile || !mobileShort) process.exit(1);
console.log("opening guide: all focused checks passed");
